import { Hono } from 'hono';
import type { Env } from '../types';

export const postsRoutes = new Hono<{ Bindings: Env }>();

async function isPrivacyExcluded(env: Env, imageId: number): Promise<boolean> {
  const image = await env.DB.prepare(
    'SELECT privacy_excluded FROM images WHERE id = ?',
  ).bind(imageId).first<{ privacy_excluded: number }>();
  return image?.privacy_excluded === 1;
}

// List posts with optional filters
postsRoutes.get('/', async (c) => {
  const from = c.req.query('from');
  const to = c.req.query('to');
  const status = c.req.query('status');

  let query = 'SELECT p.*, c.name as character_name, i.filename as image_filename, i.r2_key as image_r2_key FROM posts p LEFT JOIN characters c ON p.character_id = c.id LEFT JOIN images i ON p.image_id = i.id WHERE 1=1';
  const params: string[] = [];

  if (from) {
    query += ' AND p.post_date >= ?';
    params.push(from);
  }
  if (to) {
    query += ' AND p.post_date <= ?';
    params.push(to);
  }
  if (status) {
    query += ' AND p.status = ?';
    params.push(status);
  }

  query += ' ORDER BY p.post_date ASC';
  const stmt = c.env.DB.prepare(query);
  const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
  return c.json(results);
});

// Get single post
postsRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const row = await c.env.DB.prepare(
    `SELECT p.*, c.name as character_name, i.filename as image_filename, i.r2_key as image_r2_key,
            COALESCE(i.privacy_excluded, 0) as image_privacy_excluded,
            qp.question as quiz_question, qp.options as quiz_options,
            qp.correct_answer as quiz_correct_answer, qp.explanation as quiz_explanation
     FROM posts p
     LEFT JOIN characters c ON p.character_id = c.id
     LEFT JOIN images i ON p.image_id = i.id
     LEFT JOIN quiz_posts qp ON qp.post_id = p.id
     WHERE p.id = ?`
  ).bind(id).first();
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json(row);
});

// Create post
postsRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const imageId = body.image_id ? Number(body.image_id) : null;
  if (imageId && await isPrivacyExcluded(c.env, imageId)) {
    return c.json({ error: 'この写真は個人情報保護のため投稿対象外です' }, 400);
  }
  const result = await c.env.DB.prepare(
    `INSERT INTO posts (post_date, day_of_week, theme, image_id, character_id, special_day, instagram_text, instagram_hashtags, x_text, x_hashtags, facebook_text, facebook_hashtags, cta_type, cta_url, status, auto_publish)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    body.post_date, body.day_of_week, body.theme,
    imageId, body.character_id || null, body.special_day || null,
    body.instagram_text || null, body.instagram_hashtags || null,
    body.x_text || null, body.x_hashtags || null,
    body.facebook_text || null, body.facebook_hashtags || null,
    body.cta_type || null, body.cta_url || null,
    body.status || 'draft', body.auto_publish===1?1:0
  ).run();
  return c.json({ id: result.meta.last_row_id }, 201);
});

// Partial updates retain publication evidence and legacy SNS history.
postsRoutes.put('/:id',async c=>{
 const id=c.req.param('id');const b=await c.req.json<Record<string,unknown>>();
 const old=await c.env.DB.prepare('SELECT * FROM posts WHERE id=?').bind(id).first<Record<string,unknown>>();
 if(!old)return c.json({error:'Not found'},404);
 if(old.instagram_posted||!['idle','failed'].includes(String(old.publish_state)))return c.json({error:'公開済み・処理中の投稿は変更できません'},409);
 const allowed=['theme','image_id','character_id','special_day','instagram_text','instagram_hashtags','cta_type','cta_url','quiz_answer_comment','auto_publish','content_type'];
 const updates:Record<string,unknown>={};for(const k of allowed)if(k in b)updates[k]=b[k];
 if('image_id' in updates && updates.image_id && await isPrivacyExcluded(c.env,Number(updates.image_id)))return c.json({error:'投稿除外の写真です'},400);
 if('auto_publish' in updates)updates.auto_publish=updates.auto_publish===1?1:0;
 if('content_type' in updates&&!['photo','reel'].includes(String(updates.content_type)))return c.json({error:'Invalid content type'},400);
 if('image_id' in updates&&updates.image_id!==old.image_id&&(!('instagram_text' in updates)||updates.instagram_text===old.instagram_text)){
   updates.instagram_text=null;updates.instagram_hashtags=null;
 }
 const keys=Object.keys(updates);if(!keys.length)return c.json({success:true});
 const sql=keys.map(k=>k+'=?').join(',');
 await c.env.DB.prepare(`UPDATE posts SET ${sql},publish_container_id=NULL,publish_state='idle',updated_at=datetime('now') WHERE id=? AND instagram_posted=0 AND publish_state IN ('idle','failed')`)
 .bind(...keys.map(k=>updates[k]??null),id).run();
 return c.json({success:true});
});

// Update post status
postsRoutes.post('/:id/schedule',async c=>{
  const id=Number(c.req.param('id'));const {date}=await c.req.json<{date:string}>();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date<new Date(Date.now()+32400000).toISOString().slice(0,10))return c.json({error:'今日以降の日付を指定してください'},400);
  const p=await c.env.DB.prepare(`SELECT p.*,i.verified,i.privacy_excluded FROM posts p LEFT JOIN images i ON i.id=p.image_id WHERE p.id=?`).bind(id).first<Record<string,unknown>>();
  if(!p||p.instagram_posted||!p.verified||p.privacy_excluded||!['idle','failed'].includes(String(p.publish_state)))return c.json({error:'未公開で写真チェック済みの投稿を指定してください'},409);
  const active=await c.env.DB.prepare(`SELECT id FROM posts WHERE post_date=? AND (instagram_posted=1 OR publish_state IN ('creating','processing','publishing','uncertain'))`).bind(date).first();
  if(active)return c.json({error:'この日の投稿は処理中または公開済みです'},409);
  await c.env.DB.batch([
    c.env.DB.prepare(`UPDATE posts SET auto_publish=0 WHERE post_date=? AND instagram_posted=0 AND publish_state IN ('idle','failed')`).bind(date),
    c.env.DB.prepare(`UPDATE posts SET post_date=?,day_of_week=?,auto_publish=1,status='approved',content_type='reel',publish_state='idle',publish_container_id=NULL,updated_at=datetime('now') WHERE id=? AND instagram_posted=0 AND publish_state IN ('idle','failed')`).bind(date,new Date(`${date}T00:00:00Z`).getUTCDay(),id),
  ]);
  return c.json({success:true});
});

// Update post status
postsRoutes.put('/:id/status', async (c) => {
  const id = c.req.param('id');
  const { status } = await c.req.json();
  if (!['draft', 'approved'].includes(status)) {
    return c.json({ error: 'Invalid status' }, 400);
  }
  await c.env.DB.prepare(
    "UPDATE posts SET status=?,auto_publish=?, updated_at=datetime('now') WHERE id=? AND instagram_posted=0 AND publish_state IN ('idle','failed')"
  ).bind(status,status==='approved'?1:0,id).run();
  return c.json({ success: true });
});

// Delete post
postsRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare("DELETE FROM posts WHERE id=? AND instagram_posted=0 AND publish_state IN ('idle','failed') AND NOT EXISTS(SELECT 1 FROM reel_jobs WHERE post_id=posts.id)").bind(id).run();
  return c.json({ success: true });
});
