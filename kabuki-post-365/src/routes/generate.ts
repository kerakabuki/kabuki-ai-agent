import { Hono } from 'hono';
import type { Env } from '../types';
import { generatePostText } from '../lib/claude';
import { buildCtaText } from '../lib/cta';

export const generateRoutes = new Hono<{ Bindings: Env }>();

// Batch generate text for multiple posts
generateRoutes.post('/batch', async (c) => {
  const body = await c.req.json();
  const { from, to, limit } = body;

  let query = `SELECT p.*, c.name as character_name, c.description as character_description,
               c.personality_tags, i.visual_features, i.scene_type,
               qp.question as quiz_question, qp.options as quiz_options,
               qp.correct_answer as quiz_correct_answer, qp.explanation as quiz_explanation
               FROM posts p
               LEFT JOIN characters c ON p.character_id = c.id
               LEFT JOIN images i ON p.image_id = i.id
               LEFT JOIN quiz_posts qp ON qp.post_id = p.id
               WHERE p.status = 'draft' AND p.instagram_text IS NULL`;
  const params: string[] = [];

  if (from) { query += ' AND p.post_date >= ?'; params.push(from); }
  if (to) { query += ' AND p.post_date <= ?'; params.push(to); }
  query += ' ORDER BY p.post_date ASC LIMIT ?';
  params.push(String(limit || 10));

  const stmt = c.env.DB.prepare(query);
  const { results: posts } = await stmt.bind(...params).all();

  // Load settings for CTA
  const { results: settingsRows } = await c.env.DB.prepare('SELECT key, value FROM settings').all();
  const settings: Record<string, string> = {};
  for (const s of settingsRows as Array<{ key: string; value: string }>) {
    settings[s.key] = s.value;
  }

  let generated = 0;
  for (const post of posts as Array<Record<string, unknown>>) {
    try {
      const texts = await generatePostText(c.env, post, settings);

      await c.env.DB.prepare(
        `UPDATE posts SET
          instagram_text=?, instagram_hashtags=?,
          x_text=?, x_hashtags=?,
          facebook_text=?, facebook_hashtags=?,
          bluesky_text=?,
          quiz_answer_comment=?,
          updated_at=datetime('now')
        WHERE id=?`
      ).bind(
        texts.instagram_text, texts.instagram_hashtags,
        texts.x_text, texts.x_hashtags,
        texts.facebook_text, texts.facebook_hashtags,
        texts.bluesky_text,
        texts.quiz_answer_comment || null,
        post.id
      ).run();
      generated++;

      // 1s delay between API calls
      if (generated < (posts as unknown[]).length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (err) {
      console.error(`Failed to generate post ${post.id}:`, err);
    }
  }

  return c.json({ generated, total: (posts as unknown[]).length });
});

// Generate for single post
generateRoutes.post('/single/:postId', async (c) => {
  const postId = c.req.param('postId');
  const post = await c.env.DB.prepare(
    `SELECT p.*, c.name as character_name, c.description as character_description,
     c.personality_tags, i.visual_features, i.scene_type,
     qp.question as quiz_question, qp.options as quiz_options,
     qp.correct_answer as quiz_correct_answer, qp.explanation as quiz_explanation
     FROM posts p LEFT JOIN characters c ON p.character_id = c.id LEFT JOIN images i ON p.image_id = i.id
     LEFT JOIN quiz_posts qp ON qp.post_id = p.id
     WHERE p.id = ?`
  ).bind(postId).first();

  if (!post) return c.json({ error: 'Post not found' }, 404);

  const { results: settingsRows } = await c.env.DB.prepare('SELECT key, value FROM settings').all();
  const settings: Record<string, string> = {};
  for (const s of settingsRows as Array<{ key: string; value: string }>) {
    settings[s.key] = s.value;
  }

  const texts = await generatePostText(c.env, post as Record<string, unknown>, settings);

  await c.env.DB.prepare(
    `UPDATE posts SET
      instagram_text=?, instagram_hashtags=?,
      x_text=?, x_hashtags=?,
      facebook_text=?, facebook_hashtags=?,
      quiz_answer_comment=?,
      updated_at=datetime('now')
    WHERE id=?`
  ).bind(
    texts.instagram_text, texts.instagram_hashtags,
    texts.x_text, texts.x_hashtags,
    texts.facebook_text, texts.facebook_hashtags,
    texts.quiz_answer_comment || null,
    postId
  ).run();

  return c.json({ success: true, texts });
});

// Generate for single platform
generateRoutes.post('/single/:postId/:platform', async (c) => {
  const postId = c.req.param('postId');
  const platform = c.req.param('platform');

  if (!['instagram', 'x', 'facebook', 'bluesky'].includes(platform)) {
    return c.json({ error: 'Invalid platform' }, 400);
  }

  const post = await c.env.DB.prepare(
    `SELECT p.*, c.name as character_name, c.description as character_description,
     c.personality_tags, i.visual_features, i.scene_type,
     qp.question as quiz_question, qp.options as quiz_options,
     qp.correct_answer as quiz_correct_answer, qp.explanation as quiz_explanation
     FROM posts p LEFT JOIN characters c ON p.character_id = c.id LEFT JOIN images i ON p.image_id = i.id
     LEFT JOIN quiz_posts qp ON qp.post_id = p.id
     WHERE p.id = ?`
  ).bind(postId).first();

  if (!post) return c.json({ error: 'Post not found' }, 404);

  const { results: settingsRows } = await c.env.DB.prepare('SELECT key, value FROM settings').all();
  const settings: Record<string, string> = {};
  for (const s of settingsRows as Array<{ key: string; value: string }>) {
    settings[s.key] = s.value;
  }

  const texts = await generatePostText(c.env, post as Record<string, unknown>, settings, platform);

  const updates: Record<string, string | null> = {};
  updates[`${platform}_text`] = texts[`${platform}_text` as keyof typeof texts] || null;

  if (platform === 'bluesky') {
    // Bluesky has no separate hashtags field
    await c.env.DB.prepare(
      `UPDATE posts SET bluesky_text=?, updated_at=datetime('now') WHERE id=?`
    ).bind(updates.bluesky_text, postId).run();
  } else {
    updates[`${platform}_hashtags`] = texts[`${platform}_hashtags` as keyof typeof texts] || null;
    await c.env.DB.prepare(
      `UPDATE posts SET ${platform}_text=?, ${platform}_hashtags=?, updated_at=datetime('now') WHERE id=?`
    ).bind(updates[`${platform}_text`], updates[`${platform}_hashtags`], postId).run();
  }

  return c.json({ success: true, texts: updates });
});
