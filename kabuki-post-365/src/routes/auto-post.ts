import { Hono } from 'hono';
import type { Env } from '../types';
import { executeAutoPost, postSinglePlatform } from '../lib/auto-post';
import { runDailyPipeline, pickSlotForDate, getJSTNow } from '../lib/daily-run';

export const autoPostRoutes = new Hono<{ Bindings: Env }>();

// POST /api/v1/auto-post/daily-run — 日次パイプライン（生成→投稿→LINE通知）を手動実行
autoPostRoutes.post('/daily-run', async (c) => {
  const body = await c.req.json().catch(() => ({})) as { date?: string };
  const report = await runDailyPipeline(c.env, body.date);
  return c.json(report);
});

// GET /api/v1/auto-post/schedule — 今日・明日の投稿予定時刻（JST）を確認
autoPostRoutes.get('/schedule', (c) => {
  const today = getJSTNow().date;
  const tomorrow = new Date(new Date(today).getTime() + 86400000).toISOString().slice(0, 10);
  const fmt = (d: string) => {
    const s = pickSlotForDate(d);
    return `${s.hour}:${String(s.minute).padStart(2, '0')}`;
  };
  return c.json({ today: { date: today, time_jst: fmt(today) }, tomorrow: { date: tomorrow, time_jst: fmt(tomorrow) } });
});

// POST /api/v1/auto-post/trigger — trigger auto-post for today (JST)
autoPostRoutes.post('/trigger', async (c) => {
  const report = await executeAutoPost(c.env);
  return c.json(report);
});

// POST /api/v1/auto-post/post/:postId/:platform — post single platform
autoPostRoutes.post('/post/:postId/:platform', async (c) => {
  const postId = parseInt(c.req.param('postId'));
  const platform = c.req.param('platform');
  const validPlatforms = ['x', 'bluesky', 'facebook', 'instagram'];
  if (!validPlatforms.includes(platform)) {
    return c.json({ error: `Invalid platform: ${platform}` }, 400);
  }
  if (isNaN(postId)) {
    return c.json({ error: 'Invalid post ID' }, 400);
  }

  // Accept optional compressed image via multipart form data
  let compressedImage: Uint8Array | undefined;
  const contentType = c.req.header('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const formData = await c.req.formData();
    const imageFile = formData.get('image') as File | null;
    if (imageFile) {
      compressedImage = new Uint8Array(await imageFile.arrayBuffer());
    }
  }

  const result = await postSinglePlatform(c.env, postId, platform, compressedImage);
  return c.json(result);
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
