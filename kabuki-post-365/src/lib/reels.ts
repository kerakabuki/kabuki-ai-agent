import type { Env } from '../types';
import { creditedCaption, requiredImageCredits, isPhotoOnlyDate } from './publication-policy';

export interface ReelPhoto { id: number; key: string; caption: string }
export interface ReelManifest {
  version: 2 | 3 | 4; postId: number; date: string; photos: ReelPhoto[];
  bgmKey: string; title: string; caption: string; duration: number;
}
export interface ReelJob {
  id: number; post_id: number; source_hash: string; manifest_json: string;
  status: string; lease_token: string | null; lease_until: string | null;
  attempts: number; video_key: string | null; cover_key: string | null;
}
interface SourceRow {
  id: number; post_date: string; image_id: number | null; r2_key: string | null;
  verified: number; privacy_excluded: number; play_name: string | null;
  scene_type: string | null; instagram_text: string | null;
  instagram_hashtags: string | null; instagram_posted: number;
  auto_publish: number; content_type: string; publish_state: string;
}

export function jstDate() { return new Date(Date.now() + 32400000).toISOString().slice(0, 10); }
export function shiftDate(date: string, days: number) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}
export async function settings(env: Env): Promise<Record<string, string>> {
  const { results } = await env.DB.prepare('SELECT key,value FROM settings').all<{key:string;value:string}>();
  return Object.fromEntries(results.map(x => [x.key, x.value]));
}
export function publicBase(s: Record<string, string>) {
  return s.worker_base_url || 'https://kabuki-post-365.kerakabuki.workers.dev';
}
export function assetUrl(base: string, key: string) {
  return `${base}/media/${key.split('/').map(encodeURIComponent).join('/')}`;
}
export function captionFor(text: string | null, tags: string | null, credits: string[] = []) {
  return creditedCaption(text, tags, credits);
}
export async function sourceHash(value: unknown) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(value)));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

export async function makeManifest(env: Env, postId: number): Promise<ReelManifest | null> {
  const s = await settings(env);
  if (!s.reel_bgm_key) return null;
  const p = await env.DB.prepare(`SELECT p.*,i.r2_key,i.verified,i.privacy_excluded,i.play_name,i.scene_type
    FROM posts p LEFT JOIN images i ON i.id=p.image_id WHERE p.id=?`).bind(postId).first<SourceRow>();
  if (!p || !p.image_id || !p.r2_key || !p.verified || p.privacy_excluded || !p.instagram_text) return null;
  const photos: ReelPhoto[] = [{id:p.image_id,key:p.r2_key,caption:p.play_name || '気良歌舞伎'}];
  // Supporting photos must belong to the same verified play. Never mix unrelated scenes.
  if (p.play_name) {
    const related = await env.DB.prepare(`SELECT id,r2_key,play_name FROM images
      WHERE verified=1 AND privacy_excluded=0 AND play_name=? AND id<>?
        AND scene_type=COALESCE(?,scene_type) AND scene_type NOT LIKE '%AI生成%'
      ORDER BY usage_count,id LIMIT 2`).bind(p.play_name,p.image_id,p.scene_type).all<{id:number;r2_key:string;play_name:string}>();
    for (const i of related.results) photos.push({id:i.id,key:i.r2_key,caption:i.play_name});
  }
  // Keep already-published v2 manifests stable; the emoji-safe layout begins with tomorrow's posts.
  return { version:p.post_date >= '2026-09-16' ? 4 : 2, postId, date:p.post_date, photos, bgmKey:s.reel_bgm_key,
    title:p.play_name || '気良歌舞伎', caption:captionFor(p.instagram_text,p.instagram_hashtags,requiredImageCredits(s,photos.map(photo=>photo.id))),
    duration:photos.length === 1 ? 12 : photos.length === 2 ? 16 : 20 };
}

export async function prepareReels(env: Env) {
  const s = await settings(env);
  if (s.reels_enabled !== '1' || !s.reel_bgm_key) return {queued:0};
  const today=jstDate(), through=shiftDate(today,7);
  const {results} = await env.DB.prepare(`SELECT id,post_date FROM posts WHERE post_date BETWEEN ? AND ?
    AND post_date>=? AND auto_publish=1 AND instagram_posted=0
    AND status IN ('draft','approved') AND publish_state IN ('idle','failed')
    ORDER BY post_date,id`).bind(today,through,s.reels_start_date || today).all<{id:number;post_date:string}>();
  let queued=0;
  for (const p of results) {
    if (isPhotoOnlyDate(s,p.post_date)) continue;
    const manifest=await makeManifest(env,p.id);
    if (!manifest) continue;
    const hash=await sourceHash(manifest);
    const r=await env.DB.prepare(`INSERT OR IGNORE INTO reel_jobs(post_id,source_hash,manifest_json)
      VALUES(?,?,?)`).bind(p.id,hash,JSON.stringify(manifest)).run();
    await env.DB.prepare(`UPDATE posts SET content_type='reel' WHERE id=? AND instagram_posted=0`).bind(p.id).run();
    queued += r.meta.changes;
  }
  return {queued};
}

export async function currentJob(env: Env, postId: number): Promise<ReelJob | null> {
  const manifest=await makeManifest(env,postId);
  if (!manifest) return null;
  return env.DB.prepare('SELECT * FROM reel_jobs WHERE post_id=? AND source_hash=?')
    .bind(postId,await sourceHash(manifest)).first<ReelJob>();
}

export async function claimReel(env: Env) {
  await prepareReels(env);
  const s=await settings(env);
  if(s.reels_enabled!=='1') return null;
  const candidates=await env.DB.prepare(`SELECT r.* FROM reel_jobs r JOIN posts p ON p.id=r.post_id
    WHERE p.instagram_posted=0 AND p.auto_publish=1 AND p.post_date>=?
      AND p.status IN ('draft','approved') AND r.attempts<3
      AND (r.status IN ('queued','failed') OR (r.status='rendering' AND r.lease_until<datetime('now')))
    ORDER BY p.post_date,r.id DESC LIMIT 20`).bind(jstDate()).all<ReelJob>();
  for (const job of candidates.results) {
    const m=await makeManifest(env,job.post_id);
    if (!m || isPhotoOnlyDate(s,m.date) || await sourceHash(m)!==job.source_hash) continue;
    const token=crypto.randomUUID();
    const row=await env.DB.prepare(`UPDATE reel_jobs SET status='rendering',lease_token=?,
      lease_until=datetime('now','+15 minutes'),attempts=attempts+1,updated_at=datetime('now'),error=NULL
      WHERE id=? AND attempts<3 AND (status IN ('queued','failed') OR (status='rendering' AND lease_until<datetime('now')))
      RETURNING *`).bind(token,job.id).first<ReelJob>();
    if (!row) continue;
    return {...row,manifest:m,base_url:publicBase(s)};
  }
  return null;
}

export async function ensureCrossposts(env: Env, postId: number) {
  await env.DB.batch(['facebook','x'].map(platform=>env.DB.prepare(`INSERT OR IGNORE INTO crossposts(post_id,platform)
    SELECT id,? FROM posts WHERE id=? AND instagram_posted=1 AND ig_media_id IS NOT NULL
      AND post_date>=COALESCE((SELECT value FROM settings WHERE key='crosspost_start_date'),'9999-01-01')`).bind(platform,postId)));
}
