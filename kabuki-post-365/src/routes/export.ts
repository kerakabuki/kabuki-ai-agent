import { Hono } from 'hono';
import type { Env } from '../types';
import { generateCsv } from '../lib/csv';

export const exportRoutes = new Hono<{ Bindings: Env }>();

// Export CSV
exportRoutes.get('/csv', async (c) => {
  const from = c.req.query('from');
  const to = c.req.query('to');
  const platform = c.req.query('platform'); // instagram, x, facebook, or all

  let query = `SELECT p.*, c.name as character_name, i.filename as image_filename
               FROM posts p
               LEFT JOIN characters c ON p.character_id = c.id
               LEFT JOIN images i ON p.image_id = i.id
               WHERE 1=1`;
  const params: string[] = [];

  if (from) { query += ' AND p.post_date >= ?'; params.push(from); }
  if (to) { query += ' AND p.post_date <= ?'; params.push(to); }
  query += ' ORDER BY p.post_date ASC';

  const stmt = c.env.DB.prepare(query);
  const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

  const csv = generateCsv(results as Array<Record<string, unknown>>, platform || 'all');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="kabuki-post-365_${from || 'all'}_${to || 'all'}.csv"`,
    },
  });
});
