import { Hono } from 'hono';
import type { Env } from '../types';

export const charactersRoutes = new Hono<{ Bindings: Env }>();

// List all characters
charactersRoutes.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM characters ORDER BY related_play, name'
  ).all();
  return c.json(results);
});

// Get single character
charactersRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const row = await c.env.DB.prepare('SELECT * FROM characters WHERE id = ?').bind(id).first();
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json(row);
});

// Create character
charactersRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const { name, name_reading, aliases, related_play, description, personality_tags, season_tags, related_characters, kabuki_navi_url, navi_image_url, navi_enmoku_id, navi_cast_id } = body;
  const result = await c.env.DB.prepare(
    `INSERT INTO characters (name, name_reading, aliases, related_play, description, personality_tags, season_tags, related_characters, kabuki_navi_url, navi_image_url, navi_enmoku_id, navi_cast_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(name, name_reading || '', aliases, related_play || '', description, personality_tags, season_tags, related_characters, kabuki_navi_url, navi_image_url || null, navi_enmoku_id || null, navi_cast_id || null).run();
  return c.json({ id: result.meta.last_row_id }, 201);
});

// Update character
charactersRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { name, name_reading, aliases, related_play, description, personality_tags, season_tags, related_characters, kabuki_navi_url, navi_image_url, navi_enmoku_id, navi_cast_id } = body;
  await c.env.DB.prepare(
    `UPDATE characters SET name=?, name_reading=?, aliases=?, related_play=?, description=?, personality_tags=?, season_tags=?, related_characters=?, kabuki_navi_url=?, navi_image_url=?, navi_enmoku_id=?, navi_cast_id=?, updated_at=datetime('now')
     WHERE id=?`
  ).bind(name, name_reading, aliases, related_play, description, personality_tags, season_tags, related_characters, kabuki_navi_url, navi_image_url || null, navi_enmoku_id || null, navi_cast_id || null, id).run();
  return c.json({ success: true });
});

// Delete character
charactersRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM characters WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

// Bulk import characters
charactersRoutes.post('/import', async (c) => {
  const characters = await c.req.json() as Array<Record<string, string>>;
  const batchSize = 50;
  let imported = 0;

  for (let i = 0; i < characters.length; i += batchSize) {
    const batch = characters.slice(i, i + batchSize);
    const stmts = batch.map((ch) =>
      c.env.DB.prepare(
        `INSERT OR IGNORE INTO characters (name, name_reading, aliases, related_play, description, personality_tags, season_tags, related_characters, kabuki_navi_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        ch.name, ch.name_reading || '', ch.aliases || null, ch.related_play || '',
        ch.description || null, ch.personality_tags || null, ch.season_tags || null,
        ch.related_characters || null, ch.kabuki_navi_url || null
      )
    );
    await c.env.DB.batch(stmts);
    imported += batch.length;
  }

  return c.json({ imported });
});
