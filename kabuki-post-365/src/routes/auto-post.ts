import { Hono } from 'hono';
import type { Env } from '../types';
import { executeAutoPost } from '../lib/auto-post';

export const autoPostRoutes = new Hono<{ Bindings: Env }>();

// POST /api/v1/auto-post/trigger — trigger auto-post for today (JST)
autoPostRoutes.post('/trigger', async (c) => {
  const report = await executeAutoPost(c.env);
  return c.json(report);
});

// POST /api/v1/auto-post/trigger/:date — trigger auto-post for a specific date
autoPostRoutes.post('/trigger/:date', async (c) => {
  const date = c.req.param('date');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, 400);
  }
  const report = await executeAutoPost(c.env, date);
  return c.json(report);
});

// GET /api/v1/auto-post/logs — view audit logs
autoPostRoutes.get('/logs', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 200);
  const postId = c.req.query('post_id');
  const platform = c.req.query('platform');

  let query = `
    SELECT pl.*, p.post_date
    FROM post_log pl
    JOIN posts p ON pl.post_id = p.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (postId) {
    query += ' AND pl.post_id = ?';
    params.push(parseInt(postId));
  }
  if (platform) {
    query += ' AND pl.platform = ?';
    params.push(platform);
  }

  query += ' ORDER BY pl.executed_at DESC LIMIT ?';
  params.push(limit);

  const stmt = env_bind(c.env.DB.prepare(query), params);
  const logs = await stmt.all();

  return c.json({ logs: logs.results, total: logs.results.length });
});

// Helper: bind variable number of params to a D1 prepared statement
function env_bind(stmt: D1PreparedStatement, params: unknown[]): D1PreparedStatement {
  if (params.length === 0) return stmt;
  return stmt.bind(...params);
}
