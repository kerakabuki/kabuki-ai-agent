import { Hono } from 'hono';
import type { Env } from '../types';

export const naviRoutes = new Hono<{ Bindings: Env }>();

// Get character images for NAVI
naviRoutes.get('/characters/:id/images', async (c) => {
  const id = c.req.param('id');
  const { results } = await c.env.DB.prepare(
    `SELECT id, filename, r2_key, navi_caption, navi_display_order, is_primary
     FROM images
     WHERE character_id = ? AND navi_visible = 1
     ORDER BY navi_display_order ASC, is_primary DESC, created_at ASC`
  ).bind(id).all();

  // Build public URLs
  const baseUrl = (await c.env.DB.prepare("SELECT value FROM settings WHERE key = 'kabuki_navi_base_url'").first<{ value: string }>())?.value || '';
  const images = (results as Array<Record<string, unknown>>).map((img) => ({
    id: img.id,
    caption: img.navi_caption,
    is_primary: img.is_primary,
    urls: {
      card: `${baseUrl}/images/navi/card/${img.id}.jpg`,
      detail: `${baseUrl}/images/navi/detail/${img.id}.jpg`,
      thumb: `${baseUrl}/images/navi/thumb/${img.id}.jpg`,
    },
  }));

  return c.json(images);
});

// Get primary image for character
naviRoutes.get('/characters/:id/primary-image', async (c) => {
  const id = c.req.param('id');
  const image = await c.env.DB.prepare(
    `SELECT id, filename, r2_key, navi_caption
     FROM images
     WHERE character_id = ? AND is_primary = 1 AND navi_visible = 1
     LIMIT 1`
  ).bind(id).first();

  if (!image) {
    // Fallback to first visible image
    const fallback = await c.env.DB.prepare(
      `SELECT id, filename, r2_key, navi_caption
       FROM images
       WHERE character_id = ? AND navi_visible = 1
       ORDER BY navi_display_order ASC, created_at ASC
       LIMIT 1`
    ).bind(id).first();
    if (!fallback) return c.json({ error: 'No image found' }, 404);
    return c.json(fallback);
  }

  return c.json(image);
});
