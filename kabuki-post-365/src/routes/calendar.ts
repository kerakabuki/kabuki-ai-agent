import { Hono } from 'hono';
import type { Env } from '../types';
import { generateCalendar } from '../lib/calendar-engine';

export const calendarRoutes = new Hono<{ Bindings: Env }>();

// Get month view
calendarRoutes.get('/:year/:month', async (c) => {
  const year = Number(c.req.param('year'));
  const month = Number(c.req.param('month'));
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { results } = await c.env.DB.prepare(
    `SELECT p.*, c.name as character_name, i.filename as image_filename, i.r2_key as image_r2_key
     FROM posts p
     LEFT JOIN characters c ON p.character_id = c.id
     LEFT JOIN images i ON p.image_id = i.id
     WHERE p.post_date >= ? AND p.post_date <= ?
     ORDER BY p.post_date ASC`
  ).bind(from, to).all();

  return c.json({
    year,
    month,
    posts: results,
  });
});

// Generate 365-day calendar
calendarRoutes.post('/generate', async (c) => {
  const body = await c.req.json();
  const startDate = body.start_date || (await c.env.DB.prepare("SELECT value FROM settings WHERE key = 'start_date'").first<{ value: string }>())?.value || '2026-04-01';

  const count = await generateCalendar(c.env.DB, startDate);
  return c.json({ generated: count, start_date: startDate });
});

// Swap two posts' dates
calendarRoutes.post('/swap', async (c) => {
  const { post_id_a, post_id_b } = await c.req.json();

  const postA = await c.env.DB.prepare('SELECT id, post_date FROM posts WHERE id = ?').bind(post_id_a).first<{ id: number; post_date: string }>();
  const postB = await c.env.DB.prepare('SELECT id, post_date FROM posts WHERE id = ?').bind(post_id_b).first<{ id: number; post_date: string }>();

  if (!postA || !postB) return c.json({ error: 'Post not found' }, 404);

  // Use temp date to avoid unique constraint
  const tempDate = '__swap_temp__';
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE posts SET post_date = ? WHERE id = ?').bind(tempDate, postA.id),
    c.env.DB.prepare('UPDATE posts SET post_date = ? WHERE id = ?').bind(postA.post_date, postB.id),
    c.env.DB.prepare('UPDATE posts SET post_date = ? WHERE id = ?').bind(postB.post_date, postA.id),
  ]);

  return c.json({ success: true });
});
