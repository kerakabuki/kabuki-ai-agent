import { Hono } from 'hono';
import type { Env } from '../types';
import { assetUrl,claimReel,currentJob,makeManifest,prepareReels,publicBase,settings,sourceHash,type ReelJob } from '../lib/reels';
export const reelsRoutes=new Hono<{Bindings:Env}>();
function isFile(value:unknown):value is File { return value instanceof File; }

reelsRoutes.get('/status',async c=>{
  const s=await settings(c.env);
  const jobs=await c.env.DB.prepare(`SELECT r.id,r.post_id,r.status,r.video_key,r.cover_key,r.error,r.updated_at,
    p.post_date,p.instagram_posted,p.ig_permalink,p.content_type,p.publish_state
    FROM reel_jobs r JOIN posts p ON p.id=r.post_id
    WHERE r.id=(SELECT MAX(id) FROM reel_jobs WHERE post_id=r.post_id)
    ORDER BY p.post_date DESC LIMIT 40`).all();
  return c.json({enabled:s.reels_enabled==='1',bgm_key:s.reel_bgm_key||'',jobs:jobs.results});
});
reelsRoutes.post('/prepare',async c=>c.json(await prepareReels(c.env)));
reelsRoutes.get('/post/:id',async c=>{
  const job=await currentJob(c.env,Number(c.req.param('id')));
  const s=await settings(c.env);
  return c.json(job?{...job,video_url:job.video_key?assetUrl(publicBase(s),job.video_key):null}:null);
});
reelsRoutes.post('/jobs/claim',async c=>{
  await c.env.DB.prepare(`INSERT INTO settings(key,value) VALUES('renderer_last_seen',datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value=excluded.value`).run();
  return c.json({job:await claimReel(c.env)});
});
reelsRoutes.get('/jobs/:id/assets/:index',async c=>{
  const job=await c.env.DB.prepare(`SELECT * FROM reel_jobs WHERE id=? AND lease_token=? AND status='rendering' AND lease_until>datetime('now')`)
    .bind(c.req.param('id'),c.req.header('x-render-lease')||'').first<ReelJob>();
  if(!job) return c.json({error:'Invalid lease'},409);
  const m=await makeManifest(c.env,job.post_id);
  if(!m||await sourceHash(m)!==job.source_hash) return c.json({error:'素材が変更されました'},409);
  const index=c.req.param('index');
  const key=index==='bgm'?m.bgmKey:m.photos[Number(index)]?.key;
  if(!key) return c.json({error:'Not found'},404);
  const object=await c.env.R2.get(key);
  if(!object) return c.json({error:'素材がありません'},404);
  const h=new Headers();object.writeHttpMetadata(h);h.set('Cache-Control','no-store');
  return new Response(object.body,{headers:h});
});
reelsRoutes.post('/jobs/:id/complete',async c=>{
  if(Number(c.req.header('content-length')||0)>45000000) return c.json({error:'動画が大きすぎます'},413);
  const form=await c.req.formData();
  const token=String(form.get('lease_token')||'');
  const job=await c.env.DB.prepare(`SELECT * FROM reel_jobs WHERE id=? AND lease_token=? AND status='rendering' AND lease_until>datetime('now')`)
    .bind(c.req.param('id'),token).first<ReelJob>();
  if(!job) return c.json({error:'Invalid lease'},409);
  const m=await makeManifest(c.env,job.post_id);
  if(!m||await sourceHash(m)!==job.source_hash) return c.json({error:'素材が変更されました'},409);
  const video=form.get('video'),cover=form.get('cover');
  if(!isFile(video)||video.type!=='video/mp4'||video.size>40000000||video.size<1000
    ||!isFile(cover)||cover.type!=='image/jpeg'||cover.size===0||cover.size>3000000) return c.json({error:'MP4と表紙が必要です'},400);
  const key=`reels/video/${job.post_id}-${job.source_hash}.mp4`,coverKey=`reels/covers/${job.post_id}-${job.source_hash}.jpg`;
  await c.env.R2.put(key,video.stream(),{httpMetadata:{contentType:'video/mp4'}});
  await c.env.R2.put(coverKey,cover.stream(),{httpMetadata:{contentType:'image/jpeg'}});
  const r=await c.env.DB.prepare(`UPDATE reel_jobs SET status='ready',video_key=?,cover_key=?,lease_token=NULL,
    lease_until=NULL,error=NULL,updated_at=datetime('now') WHERE id=? AND lease_token=? AND status='rendering' RETURNING id`)
    .bind(key,coverKey,job.id,token).first();
  if(!r) return c.json({error:'Lease changed'},409);
  return c.json({success:true,video_key:key});
});
reelsRoutes.post('/jobs/:id/fail',async c=>{
  const b=await c.req.json<{lease_token:string;error:string}>();
  const r=await c.env.DB.prepare(`UPDATE reel_jobs SET status='failed',error=?,lease_token=NULL,lease_until=NULL,
    updated_at=datetime('now') WHERE id=? AND lease_token=? AND status='rendering' RETURNING id`)
    .bind(String(b.error||'Render failed').slice(0,500),c.req.param('id'),b.lease_token).first();
  return c.json({success:!!r});
});
