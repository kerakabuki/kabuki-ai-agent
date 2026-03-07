import { Hono } from 'hono';
import type { Env, Character } from '../types';
import { analyzeImageWithVision } from '../lib/vision';

export const imagesRoutes = new Hono<{ Bindings: Env }>();

// Analyze image with Gemini Vision
imagesRoutes.post('/analyze', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('image') as File | null;
  if (!file) {
    return c.json({ error: 'No image file provided' }, 400);
  }

  // Convert to base64
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );
  const mimeType = file.type || 'image/jpeg';

  // Fetch characters for matching
  const { results: characters } = await c.env.DB.prepare(
    'SELECT * FROM characters ORDER BY name'
  ).all<Character>();

  const result = await analyzeImageWithVision(c.env, base64, mimeType, characters || []);
  return c.json(result);
});

// List images with optional filters
imagesRoutes.get('/', async (c) => {
  const characterId = c.req.query('character_id');
  const seasonTag = c.req.query('season_tag');

  let query = 'SELECT * FROM images WHERE 1=1';
  const params: (string | number)[] = [];

  if (characterId) {
    query += ' AND character_id = ?';
    params.push(Number(characterId));
  }
  if (seasonTag) {
    query += ' AND season_tag = ?';
    params.push(seasonTag);
  }

  query += ' ORDER BY created_at DESC';
  const stmt = c.env.DB.prepare(query);
  const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
  return c.json(results);
});

// Get single image
imagesRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const row = await c.env.DB.prepare('SELECT * FROM images WHERE id = ?').bind(id).first();
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json(row);
});

// Upload image (multipart)
imagesRoutes.post('/upload', async (c) => {
  const formData = await c.req.formData();
  const characterId = formData.get('character_id') as string | null;
  const playName = formData.get('play_name') as string | null;
  const sceneType = formData.get('scene_type') as string | null;
  const visualFeatures = formData.get('visual_features') as string | null;
  const seasonTag = formData.get('season_tag') as string || '通年';
  const naviCaption = formData.get('navi_caption') as string | null;

  // Collect all uploaded files
  const uploads: { key: string; file: File }[] = [];
  const prefixes = ['original', 'sns_instagram', 'sns_x', 'sns_facebook', 'navi_card', 'navi_detail', 'navi_thumb'];
  const r2Paths: Record<string, string> = {
    original: 'originals',
    sns_instagram: 'sns/instagram',
    sns_x: 'sns/x',
    sns_facebook: 'sns/facebook',
    navi_card: 'navi/card',
    navi_detail: 'navi/detail',
    navi_thumb: 'navi/thumb',
  };

  let filename = '';
  for (const prefix of prefixes) {
    const file = formData.get(prefix) as File | null;
    if (file) {
      if (!filename) filename = file.name;
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const ext = file.name.split('.').pop() || 'jpg';
      const r2Key = `${r2Paths[prefix]}/${baseName}.${ext}`;
      uploads.push({ key: r2Key, file });
    }
  }

  if (uploads.length === 0) {
    return c.json({ error: 'No files uploaded' }, 400);
  }

  // Upload all to R2
  for (const { key, file } of uploads) {
    await c.env.R2.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type || 'image/jpeg' },
    });
  }

  // Create DB record
  const r2Key = uploads[0].key;
  const result = await c.env.DB.prepare(
    `INSERT INTO images (filename, r2_key, character_id, play_name, scene_type, visual_features, season_tag, navi_caption)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(filename, r2Key, characterId ? Number(characterId) : null, playName, sceneType, visualFeatures, seasonTag, naviCaption).run();

  return c.json({ id: result.meta.last_row_id, filename, r2_key: r2Key }, 201);
});

// Update image metadata
imagesRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { character_id, play_name, scene_type, visual_features, season_tag, navi_caption, navi_display_order, navi_visible } = body;
  await c.env.DB.prepare(
    `UPDATE images SET character_id=?, play_name=?, scene_type=?, visual_features=?, season_tag=?, navi_caption=?, navi_display_order=?, navi_visible=?, updated_at=datetime('now')
     WHERE id=?`
  ).bind(character_id, play_name, scene_type, visual_features, season_tag, navi_caption, navi_display_order, navi_visible ?? 1, id).run();
  return c.json({ success: true });
});

// Upload variants for existing image (R2 only, no DB change)
imagesRoutes.post('/:id/variants', async (c) => {
  const id = c.req.param('id');
  const image = await c.env.DB.prepare('SELECT filename FROM images WHERE id = ?').bind(id).first<{ filename: string }>();
  if (!image) return c.json({ error: 'Not found' }, 404);

  const formData = await c.req.formData();
  const r2Paths: Record<string, string> = {
    sns_instagram: 'sns/instagram',
    sns_x: 'sns/x',
    sns_facebook: 'sns/facebook',
    navi_card: 'navi/card',
    navi_detail: 'navi/detail',
    navi_thumb: 'navi/thumb',
  };

  let uploaded = 0;
  for (const [key, r2Dir] of Object.entries(r2Paths)) {
    const file = formData.get(key) as File | null;
    if (file) {
      const baseName = image.filename.replace(/\.[^.]+$/, '');
      const ext = file.name.split('.').pop() || 'jpg';
      const r2Key = `${r2Dir}/${baseName}.${ext}`;
      await c.env.R2.put(r2Key, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type || 'image/jpeg' },
      });
      uploaded++;
    }
  }

  return c.json({ success: true, uploaded });
});

// Set primary image for character
imagesRoutes.put('/:id/primary', async (c) => {
  const id = c.req.param('id');
  const image = await c.env.DB.prepare('SELECT character_id FROM images WHERE id = ?').bind(id).first<{ character_id: number }>();
  if (!image || !image.character_id) return c.json({ error: 'Image not found or no character assigned' }, 400);

  // Unset all primary for this character, then set this one
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE images SET is_primary = 0 WHERE character_id = ?').bind(image.character_id),
    c.env.DB.prepare('UPDATE images SET is_primary = 1, updated_at = datetime(\'now\') WHERE id = ?').bind(id),
  ]);
  return c.json({ success: true });
});

// Delete image
imagesRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const image = await c.env.DB.prepare('SELECT r2_key, filename FROM images WHERE id = ?').bind(id).first<{ r2_key: string; filename: string }>();
  if (!image) return c.json({ error: 'Not found' }, 404);

  // Delete all R2 variants
  const baseName = image.filename.replace(/\.[^.]+$/, '');
  const ext = image.filename.split('.').pop() || 'jpg';
  const paths = [
    `originals/${baseName}.${ext}`,
    `sns/instagram/${baseName}.${ext}`,
    `sns/x/${baseName}.${ext}`,
    `sns/facebook/${baseName}.${ext}`,
    `navi/card/${baseName}.${ext}`,
    `navi/detail/${baseName}.${ext}`,
    `navi/thumb/${baseName}.${ext}`,
  ];
  for (const path of paths) {
    await c.env.R2.delete(path);
  }

  await c.env.DB.prepare('DELETE FROM images WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});
