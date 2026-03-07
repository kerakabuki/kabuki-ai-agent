import { Hono } from 'hono';
import type { Env } from '../types';

export const settingsRoutes = new Hono<{ Bindings: Env }>();

// Get all settings
settingsRoutes.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM settings ORDER BY key').all();
  const settings: Record<string, string> = {};
  for (const row of results as Array<{ key: string; value: string }>) {
    settings[row.key] = row.value;
  }
  return c.json(settings);
});

// Update setting
settingsRoutes.put('/:key', async (c) => {
  const key = c.req.param('key');
  const { value } = await c.req.json();
  await c.env.DB.prepare(
    "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))"
  ).bind(key, value).run();
  return c.json({ success: true });
});
