import type { Env } from '../types';
import type { FeedSlot } from './feed-slots';
import { creditedCaption, requiredImageCredits } from './publication-policy';

// Settings are opt-in. A malformed enabled manifest fails closed, never falls back.
export const THREE_PLAY_MODE = 'three_plays_v1';
export const PLAY_IDS = ['moritunajinya', 'yamashinakankyo', 'kirareyosa'] as const;
export type PlayId = typeof PLAY_IDS[number];
const PLAY_NAMES: Record<PlayId, string[]> = {
  moritunajinya: ['盛綱陣屋'], yamashinakankyo: ['山科閑居', '九段目・山科閑居', '九段目 山科閑居'], kirareyosa: ['切られ与三'],
};
export interface Evidence { reference: string; sha256: string; excerpt: string }
export interface ReviewedPhoto {
  id: string; playId: PlayId; playName: string; kind: 'portrait' | 'stage';
  imageId: number; r2Key: string; imageSha256: string;
  characterId: number | null; characterName: string | null; naviCastId: string | null;
  copy: string; text: string; hashtags: string; credits: string[];
  source: Evidence; photoReview: Evidence; rights: { instagram: true; reference: string };
  reviewedBy: string; reviewedAt: string; validThrough: string;
}
export interface ThreePlayManifest {
  schemaVersion: 1; revision: string; startDate: string; reuseAfterDays: number; photos: ReviewedPhoto[];
}
type Mode = { state: 'off' | 'waiting' } | { state: 'invalid'; error: string } | { state: 'active'; manifest: ThreePlayManifest };
const record = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const nonempty = (x: unknown): x is string => typeof x === 'string' && !!x.trim();
const hash = (x: unknown): x is string => typeof x === 'string' && /^[a-f0-9]{64}$/.test(x);
export function validDate(x: unknown): x is string {
  return typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x + 'T00:00:00Z')) && new Date(x + 'T00:00:00Z').toISOString().slice(0, 10) === x;
}
function evidence(x: unknown): x is Evidence {
  return record(x) && nonempty(x.reference) && hash(x.sha256) && nonempty(x.excerpt);
}
export function reviewedText(p: Pick<ReviewedPhoto, 'kind' | 'playName' | 'characterName' | 'copy'>): string {
  return p.kind === 'portrait' ? `『${p.playName}』の登場人物、${p.characterName}。\n${p.copy}` : `『${p.playName}』の舞台から。\n${p.copy}`;
}
export function parseThreePlayManifest(raw: string | undefined): ThreePlayManifest {
  if (!raw || raw.length > 200000) throw new Error('3演目の検証済み素材マニフェストが必要です');
  const m: unknown = JSON.parse(raw);
  if (!record(m) || m.schemaVersion !== 1 || !nonempty(m.revision) || !/^[a-zA-Z0-9_-]{1,64}$/.test(m.revision) || !validDate(m.startDate)
    || !Number.isInteger(m.reuseAfterDays) || Number(m.reuseAfterDays) < 1 || Number(m.reuseAfterDays) > 365 || !Array.isArray(m.photos) || m.photos.length > 150) throw new Error('Invalid three-play manifest');
  const photos: ReviewedPhoto[] = [], ids = new Set<string>();
  for (const x of m.photos) {
    if (!record(x) || !nonempty(x.id) || !/^[a-zA-Z0-9_-]{1,64}$/.test(x.id) || ids.has(x.id) || !PLAY_IDS.some(p => p === x.playId)
      || !nonempty(x.playName) || !['portrait', 'stage'].includes(String(x.kind)) || !Number.isInteger(x.imageId) || Number(x.imageId) < 1
      || !nonempty(x.r2Key) || !x.r2Key.startsWith('originals/') || x.r2Key.includes('..') || !hash(x.imageSha256)
      || !nonempty(x.copy) || !nonempty(x.text) || typeof x.hashtags !== 'string' || !Array.isArray(x.credits) || !x.credits.every(nonempty)
      || !evidence(x.source) || !evidence(x.photoReview) || !record(x.rights) || x.rights.instagram !== true || !nonempty(x.rights.reference)
      || !nonempty(x.reviewedBy) || !nonempty(x.reviewedAt) || Number.isNaN(Date.parse(x.reviewedAt)) || !validDate(x.validThrough)) throw new Error('Unreviewed or invalid three-play photo');
    const playId = x.playId as PlayId;
    if (!PLAY_NAMES[playId].includes(x.playName) || !x.source.excerpt.includes(x.copy) || !x.photoReview.excerpt.includes(x.playName)
      || /https?:\/\/|ignore.*instructions|指示.*無視/i.test(x.text) || /AI生成/i.test(x.photoReview.excerpt)) throw new Error('Copy or photo provenance does not match');
    if (x.kind === 'portrait' && (!Number.isInteger(x.characterId) || Number(x.characterId) < 1 || !nonempty(x.characterName) || !nonempty(x.naviCastId)
      || !x.source.excerpt.includes(x.characterName) || !x.photoReview.excerpt.includes(x.characterName))) throw new Error('Verified portrait-character provenance required');
    if (x.kind === 'stage' && (x.characterId !== null || x.characterName !== null || x.naviCastId !== null)) throw new Error('Stage identity inference is not allowed');
    const p: ReviewedPhoto = { id:x.id,playId,playName:x.playName,kind:x.kind as 'portrait'|'stage',imageId:Number(x.imageId),
      r2Key:x.r2Key,imageSha256:x.imageSha256,characterId:x.characterId as number|null,characterName:x.characterName as string|null,
      naviCastId:x.naviCastId as string|null,copy:x.copy,text:x.text,hashtags:x.hashtags,credits:x.credits as string[],
      source:x.source,photoReview:x.photoReview,rights:{instagram:true,reference:x.rights.reference},reviewedBy:x.reviewedBy,
      reviewedAt:x.reviewedAt,validThrough:x.validThrough };
    if (x.text !== reviewedText(p)) throw new Error('Copy must be the exact reviewed source template');
    ids.add(x.id); photos.push(p);
  }
  return { schemaVersion: 1, revision: m.revision, startDate: m.startDate, reuseAfterDays: Number(m.reuseAfterDays), photos };
}
export function threePlayMode(s: Record<string, string>, date: string): Mode {
  if (!s.ig_editorial_mode) return { state: 'off' };
  if (s.ig_editorial_mode !== THREE_PLAY_MODE) return { state: 'invalid', error: 'Unknown Instagram editorial mode' };
  try {
    const manifest = parseThreePlayManifest(s.ig_three_plays_manifest_v1);
    return date < manifest.startDate ? { state: 'waiting' } : { state: 'active', manifest };
  } catch (e) { return { state: 'invalid', error: (e as Error).message }; }
}
export function threePlayOwnsDate(s: Record<string, string>, date: string): boolean {
  const mode = threePlayMode(s, date); return mode.state === 'active' || mode.state === 'invalid';
}
export async function readThreePlaySettings(env: Env): Promise<Record<string, string>> {
  const { results } = await env.DB.prepare("SELECT key,value FROM settings WHERE key IN ('ig_editorial_mode','ig_three_plays_manifest_v1')").all<{ key: string; value: string }>();
  return Object.fromEntries(results.map(x => [x.key, x.value]));
}
export function playForDate(m: ThreePlayManifest, date: string): PlayId | null {
  if (!validDate(date) || date < m.startDate) return null;
  return PLAY_IDS[Math.floor((Date.parse(date + 'T00:00:00Z') - Date.parse(m.startDate + 'T00:00:00Z')) / 86400000) % 3];
}
export function photoTheme(m: ThreePlayManifest, date: string, slot: FeedSlot, p: ReviewedPhoto): string { return `ig3:${m.revision}:${date}:${slot}:${p.id}`; }
export interface ThreePlayPost {
  id: number; theme: string; post_date: string; publish_slot: FeedSlot; image_id: number; character_id: number | null;
  instagram_text: string | null; instagram_hashtags: string | null; content_type: string; auto_publish: number;
  status: string;
  published_caption: string | null; published_media_key: string | null; publish_container_id: string | null;
}
interface ImageSource {
  id: number; r2_key: string; verified: number; privacy_excluded: number; play_name: string | null; scene_type: string | null;
  character_id: number | null; character_name: string | null; navi_enmoku_id: string | null; navi_cast_id: string | null;
}
async function checkedPhoto(env: Env, p: ReviewedPhoto): Promise<string | null> {
  const image = await env.DB.prepare(`SELECT i.*,c.name character_name,c.navi_enmoku_id,c.navi_cast_id FROM images i
    LEFT JOIN characters c ON c.id=i.character_id WHERE i.id=?`).bind(p.imageId).first<ImageSource>();
  if (!image || image.verified !== 1 || image.privacy_excluded !== 0 || image.r2_key !== p.r2Key || image.play_name !== p.playName || /AI生成/i.test(image.scene_type || '')) return '写真の検品・演目・元画像対応が一致しません';
  if (p.kind === 'portrait' && (image.character_id !== p.characterId || image.character_name !== p.characterName
    || image.navi_enmoku_id !== p.playId || image.navi_cast_id !== p.naviCastId || !/ポートレート|portrait|ブロマイド/i.test(image.scene_type || ''))) return '写真と人物紹介の対応が一致しません';
  if (p.kind === 'stage' && (!/舞台|stage/i.test(image.scene_type || '') || /ポートレート|portrait|ブロマイド/i.test(image.scene_type || ''))) return '検証済みの舞台写真が必要です';
  const object = await env.R2.get(p.r2Key);
  if (!object || object.size < 1 || object.size > 20000000) { await object?.body.cancel(); return '使用可能な元写真がありません'; }
  const digest = await crypto.subtle.digest('SHA-256', await object.arrayBuffer());
  const actual = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  return actual === p.imageSha256 ? null : '元写真が検証後に変更されています';
}
export function photoCaption(s: Record<string, string>, p: ReviewedPhoto): string {
  return creditedCaption(p.text, p.hashtags, [...p.credits, ...requiredImageCredits(s, [p.imageId])]);
}
export async function guardThreePlayPublication(env: Env, s: Record<string, string>, p: ThreePlayPost, now: { date: string; slot: FeedSlot | null }): Promise<{ managed: boolean; error?: string; caption?: string; photo?: ReviewedPhoto }> {
  // Enabling the new mode also blocks manual publication of stale/future legacy rows.
  if (!threePlayOwnsDate(s, now.date) && !threePlayOwnsDate(s, p.post_date) && !p.theme.startsWith('ig3:')) return { managed: false };
  const mode = threePlayMode(s, now.date);
  if (mode.state !== 'active') return { managed: true, error: mode.state === 'invalid' ? mode.error : '3演目モードの開始日まで公開しません' };
  if (!now.slot || p.post_date !== now.date || p.publish_slot !== now.slot || p.auto_publish !== 1 || p.content_type !== 'photo' || p.status !== 'approved') return { managed: true, error: '3演目の当日09時・19時の承認済み写真枠だけ公開できます' };
  const m = mode.manifest, play = playForDate(m, now.date), kind = now.slot === 'morning' ? 'portrait' : 'stage';
  const photo = m.photos.find(x => x.playId === play && x.kind === kind && photoTheme(m, now.date, now.slot!, x) === p.theme);
  if (!photo || now.date > photo.validThrough || p.image_id !== photo.imageId || p.character_id !== photo.characterId
    || p.instagram_text !== photo.text || (p.instagram_hashtags || '') !== photo.hashtags) return { managed: true, error: '演目・画像・本文・承認版が一致しません。旧候補は公開しません' };
  const caption = photoCaption(s, photo);
  if (p.publish_container_id && (p.published_media_key !== photo.r2Key || p.published_caption !== caption)) return { managed: true, error: '作成済みコンテナの画像・本文が承認版と一致しません' };
  const error = await checkedPhoto(env, photo);
  return { managed: true, ...(error ? { error } : { caption,photo }) };
}
export async function prepareThreePlaySlot(env: Env, s: Record<string, string>, date: string, slot: FeedSlot): Promise<{ postId?: number; reason: string }> {
  const mode = threePlayMode(s, date);
  if (mode.state !== 'active') return { reason: mode.state === 'invalid' ? mode.error : '3演目モード対象外' };
  const m = mode.manifest;
  const occupied = await env.DB.prepare(`SELECT id,theme,post_date,publish_slot FROM posts WHERE (post_date=? AND publish_slot=? AND
    (instagram_posted=1 OR publish_state IN ('creating','processing','publishing','uncertain'))) OR
    (instagram_posted=0 AND publish_state IN ('publishing','uncertain')) ORDER BY instagram_posted ASC,id LIMIT 1`).bind(date, slot)
    .first<{ id: number; theme: string; post_date: string; publish_slot: FeedSlot }>();
  if (occupied) {
    // Resume the same approved container (or reconcile uncertainty) inside this slot.
    // No other row may take its place; an older unresolved publication holds the slot.
    const sameApprovedSlot = occupied.post_date === date && occupied.publish_slot === slot && m.photos.some(photo =>
      photo.playId === playForDate(m,date) && photo.kind === (slot==='morning'?'portrait':'stage') && photoTheme(m,date,slot,photo) === occupied.theme);
    return { ...(sameApprovedSlot ? {postId:occupied.id} : {}), reason:'公開済み・処理中・結果不明の枠を保持します' };
  }
  const candidates = m.photos.filter(x => x.playId === playForDate(m, date) && x.kind === (slot === 'morning' ? 'portrait' : 'stage') && date <= x.validThrough);
  const index = Math.floor((Date.parse(date + 'T00:00:00Z') - Date.parse(m.startDate + 'T00:00:00Z')) / (3 * 86400000));
  for (let offset = 0; offset < candidates.length; offset++) {
    const photo = candidates[(index + offset) % candidates.length], theme = photoTheme(m, date, slot, photo);
    const existing = await env.DB.prepare('SELECT id FROM posts WHERE theme=? ORDER BY id LIMIT 1').bind(theme).first<{ id: number }>();
    if (existing) return { postId: existing.id, reason: '準備済みの承認素材' };
    const used = await env.DB.prepare("SELECT id FROM posts WHERE image_id=? AND instagram_posted=1 AND post_date BETWEEN date(?,'-'||?||' days') AND ? LIMIT 1")
      .bind(photo.imageId, date, m.reuseAfterDays - 1, date).first();
    if (used || await checkedPhoto(env, photo)) continue;
    // One atomic statement, no edits to legacy rows. Existing schema permits multiple rows.
    await env.DB.prepare(`INSERT INTO posts(post_date,day_of_week,theme,image_id,character_id,instagram_text,instagram_hashtags,status,auto_publish,content_type,publish_slot)
      SELECT ?,?,?,?,?,?,?,'approved',1,'photo',? WHERE NOT EXISTS(SELECT 1 FROM posts WHERE theme=?)
      AND NOT EXISTS(SELECT 1 FROM posts WHERE post_date=? AND publish_slot=? AND (instagram_posted=1 OR publish_state IN ('creating','processing','publishing','uncertain')))
      AND NOT EXISTS(SELECT 1 FROM posts WHERE instagram_posted=0 AND publish_state IN ('publishing','uncertain'))`)
      .bind(date, new Date(date + 'T00:00:00Z').getUTCDay(), theme, photo.imageId, photo.characterId, photo.text, photo.hashtags, slot, theme, date, slot).run();
    const saved = await env.DB.prepare('SELECT id FROM posts WHERE theme=? ORDER BY id LIMIT 1').bind(theme).first<{ id: number }>();
    return { ...(saved ? { postId: saved.id } : {}), reason: saved ? '検証済み素材を準備' : '枠を他の処理が取得しました' };
  }
  return { reason: '同演目の検証済み素材がありません。この枠はスキップします' };
}
