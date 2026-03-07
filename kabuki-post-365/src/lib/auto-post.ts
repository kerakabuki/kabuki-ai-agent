import type { Env } from '../types';
import { postToInstagram, postToFacebook, type MetaConfig } from './sns/meta-api';
import { postToX, type XConfig } from './sns/x-api';
import { postToBluesky, type BlueskyConfig } from './sns/bluesky-api';

interface PostRow {
  id: number;
  post_date: string;
  instagram_text: string | null;
  instagram_hashtags: string | null;
  instagram_posted: number;
  x_text: string | null;
  x_hashtags: string | null;
  x_posted: number;
  facebook_text: string | null;
  facebook_hashtags: string | null;
  facebook_posted: number;
  bluesky_text: string | null;
  bluesky_posted: number;
  cta_type: string | null;
  theme: string | null;
  quiz_answer_comment: string | null;
  r2_key: string | null;
  navi_image_url: string | null;
  status: string;
}

interface PlatformResult {
  platform: string;
  success: boolean;
  platformPostId?: string;
  error?: string;
  skipped?: boolean;
}

export interface AutoPostReport {
  date: string;
  postsProcessed: number;
  results: Array<{
    postId: number;
    platforms: PlatformResult[];
  }>;
}

export async function executeAutoPost(
  env: Env,
  targetDate?: string,
): Promise<AutoPostReport> {
  // JST date calculation
  const date = targetDate || getJSTDate();
  console.log(`[auto-post] Starting for date: ${date}`);

  // Fetch posts for the target date (draft, approved, or partially posted)
  // Also join characters to get navi_image_url as image fallback
  const posts = await env.DB.prepare(`
    SELECT p.id, p.post_date, p.status,
           p.instagram_text, p.instagram_hashtags, p.instagram_posted,
           p.x_text, p.x_hashtags, p.x_posted,
           p.facebook_text, p.facebook_hashtags, p.facebook_posted,
           p.bluesky_text, p.bluesky_posted,
           p.cta_type, p.theme, p.quiz_answer_comment,
           i.r2_key,
           c.navi_image_url
    FROM posts p
    LEFT JOIN images i ON p.image_id = i.id
    LEFT JOIN characters c ON p.character_id = c.id
    WHERE p.post_date = ?
      AND p.status IN ('draft', 'approved', 'posted')
  `).bind(date).all<PostRow>();

  if (!posts.results.length) {
    console.log(`[auto-post] No approved posts for ${date}`);
    return { date, postsProcessed: 0, results: [] };
  }

  // Get worker base URL for constructing public image URLs
  const baseUrlRow = await env.DB.prepare(
    `SELECT value FROM settings WHERE key = 'worker_base_url'`,
  ).first<{ value: string }>();
  const baseUrl = baseUrlRow?.value || 'https://kabuki-post-365.kerakabuki.workers.dev';

  // Build platform configs (null if secrets not configured)
  const metaConfig = buildMetaConfig(env);
  const xConfig = buildXConfig(env);
  const bskyConfig = buildBlueskyConfig(env);

  const report: AutoPostReport = { date, postsProcessed: posts.results.length, results: [] };

  for (const post of posts.results) {
    const platforms: PlatformResult[] = [];

    // Image resolution: R2 image > character navi_image_url
    const r2ImageUrl = post.r2_key
      ? `${baseUrl}/images/r2/${post.r2_key.split('/').map(s => encodeURIComponent(s)).join('/')}`
      : null;
    const imageUrl = r2ImageUrl || post.navi_image_url || null;

    // Read raw image for platforms that upload directly (X, Bluesky)
    let imageData: Uint8Array | null = null;
    if (post.r2_key) {
      const obj = await env.R2.get(post.r2_key);
      if (obj) {
        imageData = new Uint8Array(await obj.arrayBuffer());
      }
    } else if (post.navi_image_url) {
      // Fetch character guide image from external URL
      try {
        const res = await fetch(post.navi_image_url);
        if (res.ok) {
          imageData = new Uint8Array(await res.arrayBuffer());
        }
      } catch (e) {
        console.error(`[auto-post] Failed to fetch navi image: ${post.navi_image_url}`, e);
      }
    }

    // ── Instagram ──
    platforms.push(
      await processInstagram(env, metaConfig, post, imageUrl),
    );

    // ── Facebook ──
    platforms.push(
      await processFacebook(env, metaConfig, post, imageUrl),
    );

    // ── X (Twitter) ──
    platforms.push(
      await processX(env, xConfig, post, imageData),
    );

    // ── Bluesky ──
    platforms.push(
      await processBluesky(env, bskyConfig, post, imageData),
    );

    // Check if all platforms are now posted
    await updatePostStatus(env, post.id);

    // Write audit logs
    for (const p of platforms) {
      if (!p.skipped) {
        await env.DB.prepare(`
          INSERT INTO post_log (post_id, platform, success, platform_post_id, error_message)
          VALUES (?, ?, ?, ?, ?)
        `).bind(post.id, p.platform, p.success ? 1 : 0, p.platformPostId || null, p.error || null).run();
      }
    }

    report.results.push({ postId: post.id, platforms });
  }

  console.log(`[auto-post] Completed: ${report.postsProcessed} posts processed`);
  return report;
}

// ── Platform processors ──

async function processInstagram(
  env: Env,
  config: MetaConfig | null,
  post: PostRow,
  imageUrl: string | null,
): Promise<PlatformResult> {
  if (post.instagram_posted) return { platform: 'instagram', success: true, skipped: true };
  if (!config || !post.instagram_text || !imageUrl) {
    return { platform: 'instagram', success: false, skipped: true };
  }

  const caption = post.instagram_hashtags
    ? `${post.instagram_text}\n\n${post.instagram_hashtags}`
    : post.instagram_text;

  const result = await postToInstagram(config, imageUrl, caption);

  if (result.success) {
    await env.DB.prepare(`UPDATE posts SET instagram_posted = 1 WHERE id = ?`).bind(post.id).run();
  }

  return { platform: 'instagram', ...result };
}

async function processFacebook(
  env: Env,
  config: MetaConfig | null,
  post: PostRow,
  imageUrl: string | null,
): Promise<PlatformResult> {
  if (post.facebook_posted) return { platform: 'facebook', success: true, skipped: true };
  if (!config || !post.facebook_text || !imageUrl) {
    return { platform: 'facebook', success: false, skipped: true };
  }

  const message = post.facebook_hashtags
    ? `${post.facebook_text}\n\n${post.facebook_hashtags}`
    : post.facebook_text;

  const result = await postToFacebook(config, imageUrl, message);

  if (result.success) {
    await env.DB.prepare(`UPDATE posts SET facebook_posted = 1 WHERE id = ?`).bind(post.id).run();
  }

  return { platform: 'facebook', ...result };
}

async function processX(
  env: Env,
  config: XConfig | null,
  post: PostRow,
  imageData: Uint8Array | null,
): Promise<PlatformResult> {
  if (post.x_posted) return { platform: 'x', success: true, skipped: true };
  if (!config || !post.x_text || !imageData) {
    return { platform: 'x', success: false, skipped: true };
  }

  const xComment = getCommentForPlatform(post.quiz_answer_comment, 'x');
  let text = post.x_hashtags
    ? `${post.x_text}\n${post.x_hashtags}`
    : post.x_text;
  if (xComment) text += `\n\n${xComment}`;

  const result = await postToX(config, imageData, text);

  if (result.success) {
    await env.DB.prepare(`UPDATE posts SET x_posted = 1 WHERE id = ?`).bind(post.id).run();
  }

  return { platform: 'x', ...result };
}

async function processBluesky(
  env: Env,
  config: BlueskyConfig | null,
  post: PostRow,
  imageData: Uint8Array | null,
): Promise<PlatformResult> {
  if (post.bluesky_posted) return { platform: 'bluesky', success: true, skipped: true };
  if (!config || !imageData) {
    return { platform: 'bluesky', success: false, skipped: true };
  }

  // Bluesky text: use dedicated bluesky_text, fall back to x_text
  const bskyComment = getCommentForPlatform(post.quiz_answer_comment, 'bluesky');
  let text = post.bluesky_text || post.x_text;
  if (!text) {
    return { platform: 'bluesky', success: false, skipped: true };
  }

  if (bskyComment) text += `\n\n${bskyComment}`;

  const result = await postToBluesky(config, imageData, text);

  if (result.success) {
    await env.DB.prepare(`UPDATE posts SET bluesky_posted = 1 WHERE id = ?`).bind(post.id).run();
  }

  return { platform: 'bluesky', ...result };
}

// ── Comment text helper ──

function getCommentForPlatform(raw: string | null, platform: string): string {
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed[platform] || '';
    }
  } catch { /* plain string fallback */ }
  return raw;
}

// ── Status update ──

async function updatePostStatus(env: Env, postId: number): Promise<void> {
  const row = await env.DB.prepare(`
    SELECT instagram_posted, facebook_posted, x_posted, bluesky_posted,
           instagram_text, facebook_text, x_text, bluesky_text
    FROM posts WHERE id = ?
  `).bind(postId).first<Record<string, unknown>>();

  if (!row) return;

  // A platform counts as "done" if it's posted or has no text (nothing to post)
  const igDone = row.instagram_posted || !row.instagram_text;
  const fbDone = row.facebook_posted || !row.facebook_text;
  const xDone = row.x_posted || !row.x_text;
  const bskyDone = row.bluesky_posted || !row.bluesky_text;

  if (igDone && fbDone && xDone && bskyDone) {
    await env.DB.prepare(
      `UPDATE posts SET status = 'posted', updated_at = datetime('now') WHERE id = ? AND status IN ('draft', 'approved')`,
    ).bind(postId).run();
  }
}

// ── Config builders ──

function buildMetaConfig(env: Env): MetaConfig | null {
  if (!env.META_ACCESS_TOKEN) return null;
  return {
    accessToken: env.META_ACCESS_TOKEN,
    igUserId: env.INSTAGRAM_USER_ID,
    fbPageId: env.FACEBOOK_PAGE_ID,
  };
}

function buildXConfig(env: Env): XConfig | null {
  if (!env.X_API_KEY || !env.X_API_SECRET || !env.X_ACCESS_TOKEN || !env.X_ACCESS_SECRET) return null;
  return {
    apiKey: env.X_API_KEY,
    apiSecret: env.X_API_SECRET,
    accessToken: env.X_ACCESS_TOKEN,
    accessSecret: env.X_ACCESS_SECRET,
  };
}

function buildBlueskyConfig(env: Env): BlueskyConfig | null {
  if (!env.BLUESKY_HANDLE || !env.BLUESKY_APP_PASSWORD) return null;
  return {
    handle: env.BLUESKY_HANDLE,
    appPassword: env.BLUESKY_APP_PASSWORD,
  };
}

function getJSTDate(): string {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}
