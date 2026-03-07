import { Hono } from 'hono';
import type { Env } from '../types';

export const postsRoutes = new Hono<{ Bindings: Env }>();

// List posts with optional filters
postsRoutes.get('/', async (c) => {
  const from = c.req.query('from');
  const to = c.req.query('to');
  const status = c.req.query('status');

  let query = 'SELECT p.*, c.name as character_name, i.filename as image_filename FROM posts p LEFT JOIN characters c ON p.character_id = c.id LEFT JOIN images i ON p.image_id = i.id WHERE 1=1';
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
  const result = await c.env.DB.prepare(
    `INSERT INTO posts (post_date, day_of_week, theme, image_id, character_id, special_day, instagram_text, instagram_hashtags, x_text, x_hashtags, facebook_text, facebook_hashtags, cta_type, cta_url, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    body.post_date, body.day_of_week, body.theme,
    body.image_id || null, body.character_id || null, body.special_day || null,
    body.instagram_text || null, body.instagram_hashtags || null,
    body.x_text || null, body.x_hashtags || null,
    body.facebook_text || null, body.facebook_hashtags || null,
    body.cta_type || null, body.cta_url || null,
    body.status || 'draft'
  ).run();
  return c.json({ id: result.meta.last_row_id }, 201);
});

// Update post
postsRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  await c.env.DB.prepare(
    `UPDATE posts SET
       theme=?, image_id=?, character_id=?, special_day=?,
       instagram_text=?, instagram_hashtags=?,
       x_text=?, x_hashtags=?,
       facebook_text=?, facebook_hashtags=?,
       cta_type=?, cta_url=?, quiz_answer_comment=?, status=?,
       updated_at=datetime('now')
     WHERE id=?`
  ).bind(
    body.theme || null,
    body.image_id || null, body.character_id || null, body.special_day || null,
    body.instagram_text || null, body.instagram_hashtags || null,
    body.x_text || null, body.x_hashtags || null,
    body.facebook_text || null, body.facebook_hashtags || null,
    body.cta_type || null, body.cta_url || null, body.quiz_answer_comment || null,
    body.status || 'draft', id
  ).run();
  return c.json({ success: true });
});

// Update post status
postsRoutes.put('/:id/status', async (c) => {
  const id = c.req.param('id');
  const { status } = await c.req.json();
  if (!['draft', 'approved', 'posted'].includes(status)) {
    return c.json({ error: 'Invalid status' }, 400);
  }
  await c.env.DB.prepare(
    "UPDATE posts SET status=?, updated_at=datetime('now') WHERE id=?"
  ).bind(status, id).run();
  return c.json({ success: true });
});

// Delete post
postsRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});
