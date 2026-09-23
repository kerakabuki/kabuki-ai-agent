import { Hono } from 'hono';
import type { Env } from '../types';
import { assetUrl,jstDate,publicBase,settings } from '../lib/reels';
export const crosspostRoutes=new Hono<{Bindings:Env}>();
// The start UPDATE repeats these constraints atomically; queue output is advisory.
const sourceReady=`p.instagram_posted=1 AND p.ig_media_id IS NOT NULL
  AND p.ig_permalink IS NOT NULL AND p.published_media_key IS NOT NULL`;
const usedToday=`status='published' AND (date(started_at,'+9 hours')=date('now','+9 hours')
  OR date(updated_at,'+9 hours')=date('now','+9 hours'))`;
interface TransferRow {
  post_id:number; platform:string; status:string; post_date:string;
  published_media_key:string|null; [key:string]:unknown;
}
function decorate(r:TransferRow,s:Record<string,string>) {
  return {...r,media_url:r.published_media_key?assetUrl(publicBase(s),r.published_media_key):null,
    account:r.platform==='x'?'https://x.com/KeraKabuki':'https://www.facebook.com/kerakabuki'};
}
crosspostRoutes.get('/queue',async c=>{
  const today=jstDate(),s=await settings(c.env),since=s.crosspost_start_date||today;
  const platforms=await Promise.all(['facebook','x'].map(async platform=>{
    const [pending,review,used]=await c.env.DB.batch([
      c.env.DB.prepare(`SELECT x.*,p.post_date,p.ig_media_id,p.ig_permalink,p.published_caption,p.published_media_key
        FROM crossposts x JOIN posts p ON p.id=x.post_id WHERE x.platform=? AND x.status IN ('pending','failed')
        AND ${sourceReady} AND p.post_date BETWEEN ? AND ? ORDER BY p.post_date,p.id`).bind(platform,since,today),
      c.env.DB.prepare(`SELECT post_id,platform,status,caption,started_at,error FROM crossposts
        WHERE platform=? AND status IN ('publishing','uncertain') ORDER BY started_at,post_id`).bind(platform),
      c.env.DB.prepare(`SELECT post_id,permalink FROM crossposts WHERE platform=? AND (${usedToday})`).bind(platform)
    ]);
    const blocked=review.results.length?'needs_review':used.results.length?'daily_limit':null;
    return {platform,blocked_reason:blocked,backlog_count:pending.results.length,
      next:!blocked&&pending.results.length?decorate(pending.results[0] as TransferRow,s):null,
      needs_review:review.results,published_today:used.results};
  }));
  const source=await c.env.DB.prepare(`SELECT count(*) AS n FROM posts p WHERE p.post_date=? AND ${sourceReady}`).bind(today).first<{n:number}>();
  return c.json({date:today,source_today_published:!!source?.n,platforms});
});
crosspostRoutes.get('/',async c=>{
  const date=c.req.query('date')||jstDate();
  const postId=c.req.query('post_id');
  if(postId&&!/^\d+$/.test(postId)) return c.json({error:'Invalid post id'},400);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) return c.json({error:'Invalid date'},400);
  const s=await settings(c.env);
  const {results}=await c.env.DB.prepare(`SELECT x.*,p.post_date,p.ig_media_id,p.ig_permalink,p.published_caption,
    p.published_media_key FROM crossposts x JOIN posts p ON p.id=x.post_id
    WHERE ${postId?'p.id=? AND p.post_date<=?':'p.post_date=?'} AND p.instagram_posted=1 AND p.ig_media_id IS NOT NULL ORDER BY p.id,x.platform`)
    .bind(...(postId?[Number(postId),jstDate()]:[date])).all<Record<string,unknown>>();
  return c.json(results.map(r=>({...r,media_url:r.published_media_key?assetUrl(publicBase(s),String(r.published_media_key)):null,
    account:r.platform==='x'?'https://x.com/KeraKabuki':'https://www.facebook.com/kerakabuki'})));
});
crosspostRoutes.post('/:id/:platform/start',async c=>{
  const platform=c.req.param('platform');
  if(!['facebook','x'].includes(platform)) return c.json({error:'Invalid platform'},400);
  const b=await c.req.json<{caption:string}>();
  const caption=String(b.caption||'').trim();
  if(!caption) return c.json({error:'本文がありません'},400);
  const s=await settings(c.env),today=jstDate();
  const r=await c.env.DB.prepare(`UPDATE crossposts SET status='publishing',caption=?,started_at=datetime('now'),updated_at=datetime('now'),error=NULL
    WHERE post_id=? AND platform=? AND status IN ('pending','failed')
    AND post_id=(SELECT x.post_id FROM crossposts x JOIN posts p ON p.id=x.post_id
      WHERE x.platform=? AND x.status IN ('pending','failed') AND ${sourceReady}
      AND p.post_date BETWEEN ? AND ? ORDER BY p.post_date,p.id LIMIT 1)
    AND NOT EXISTS(SELECT 1 FROM crossposts WHERE platform=? AND
      (status IN ('publishing','uncertain') OR (${usedToday}))) RETURNING *`)
    .bind(caption.slice(0,5000),c.req.param('id'),platform,platform,s.crosspost_start_date||today,today,platform).first();
  if(!r) return c.json({error:'本日の上限、結果確認待ち、または次の転記対象ではありません。queueを再確認してください'},409);
  return c.json(r);
});
crosspostRoutes.post('/:id/:platform/result',async c=>{
  const platform=c.req.param('platform');
  if(!['facebook','x'].includes(platform)) return c.json({error:'Invalid platform'},400);
  const b=await c.req.json<{status:string;permalink?:string;error?:string}>();
  if(!['published','failed','uncertain'].includes(b.status)) return c.json({error:'Invalid status'},400);
  if(b.status==='published') {
    try{
      const u=new URL(b.permalink||'');
      if(u.protocol!=='https:'||(platform==='x'?!['x.com','www.x.com'].includes(u.hostname)||!/^\/KeraKabuki\/status\/\d+$/i.test(u.pathname)
        :!['www.facebook.com','facebook.com'].includes(u.hostname))) throw Error();
    }catch{return c.json({error:'公開先URLを確認してください'},400);}
  }
  const r=await c.env.DB.prepare(`UPDATE crossposts SET status=?,permalink=?,error=?,updated_at=datetime('now')
    WHERE post_id=? AND platform=? AND status IN ('publishing','uncertain') RETURNING *`)
    .bind(b.status,b.permalink||null,String(b.error||'').slice(0,500)||null,c.req.param('id'),platform).first();
  if(!r) return c.json({error:'状態は変更されていません'},409);
  return c.json(r);
});
