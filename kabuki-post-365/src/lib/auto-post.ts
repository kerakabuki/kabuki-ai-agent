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
  cta_url: string | null;
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
           p.cta_type, p.cta_url, p.theme, p.quiz_answer_comment,
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

  // 設定で無効化されたプラットフォームはスキップ（例: Xのクレジット切れ中は 'x' を指定）
  const disabled = await getDisabledPlatforms(env);

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
      try {
        const res = await fetch(post.navi_image_url);
        if (res.ok) {
          imageData = new Uint8Array(await res.arrayBuffer());
        }
      } catch (e) {
        console.error(`[auto-post] Failed to fetch navi image: ${post.navi_image_url}`, e);
      }
    }

    // For Bluesky: if image > 950KB, try smaller SNS variants
    let blueskyImageData = imageData;
    if (blueskyImageData && blueskyImageData.byteLength > 950_000 && post.r2_key) {
      for (const variant of ['sns/x', 'sns/facebook', 'sns/instagram']) {
        const varKey = post.r2_key.replace(/^originals\//, `${variant}/`);
        const varObj = await env.R2.get(varKey);
        if (varObj) {
          const varData = new Uint8Array(await varObj.arrayBuffer());
          if (varData.byteLength <= 950_000) {
            blueskyImageData = varData;
            break;
          }
        }
      }
    }
    // Blueskyのblob上限は2MB（2026-07の実エラー "maximum 2000000" で確認）。
    // 変種が無く超過したままなら本文のみで投稿する（投稿自体を落とさない）。
    // 画像取得の一時失敗など他のnull経路は従来通りスキップさせるため、明示フラグで区別する。
    let blueskyTextOnly = false;
    if (blueskyImageData && blueskyImageData.byteLength > 1_900_000) {
      console.warn(`[auto-post] Bluesky image too large (${blueskyImageData.byteLength} bytes, no small variant for ${post.r2_key}); posting text-only`);
      blueskyImageData = null;
      blueskyTextOnly = true;
    }

    // ── Instagram ──
    platforms.push(disabled.has('instagram')
      ? { platform: 'instagram', success: false, skipped: true }
      : await processInstagram(env, metaConfig, post, imageUrl));

    // ── Facebook ──
    platforms.push(disabled.has('facebook')
      ? { platform: 'facebook', success: false, skipped: true }
      : await processFacebook(env, metaConfig, post, imageUrl));

    // ── X (Twitter) ──
    platforms.push(disabled.has('x')
      ? { platform: 'x', success: false, skipped: true }
      : await processX(env, xConfig, post, imageData));

    // ── Bluesky ──
    platforms.push(disabled.has('bluesky')
      ? { platform: 'bluesky', success: false, skipped: true }
      : await processBluesky(env, bskyConfig, post, blueskyImageData, blueskyTextOnly));

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
    const comment = getCommentForPlatform(post.quiz_answer_comment, 'instagram');
    if (comment && result.platformPostId) {
      const { commentOnInstagram } = await import('./sns/meta-api');
      await commentOnInstagram(config, result.platformPostId, comment);
    }
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
    const comment = getCommentForPlatform(post.quiz_answer_comment, 'facebook');
    if (comment && result.platformPostId) {
      const { commentOnFacebook } = await import('./sns/meta-api');
      await commentOnFacebook(config, result.platformPostId, comment);
    }
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

  const text = post.x_hashtags
    ? `${post.x_text}\n${post.x_hashtags}`
    : post.x_text;

  const result = await postToX(config, imageData, text);

  if (result.success) {
    await env.DB.prepare(`UPDATE posts SET x_posted = 1 WHERE id = ?`).bind(post.id).run();
    // クイズの答え・CTA URLはリプライで投稿する（Xはリンク付き本文のリーチを下げるため）
    const xComment = getCommentForPlatform(post.quiz_answer_comment, 'x');
    const replyText = [xComment, post.cta_url].filter(Boolean).join('\n');
    if (replyText && result.platformPostId) {
      const { replyToX } = await import('./sns/x-api');
      await replyToX(config, result.platformPostId, replyText);
    }
  }

  return { platform: 'x', ...result };
}

async function processBluesky(
  env: Env,
  config: BlueskyConfig | null,
  post: PostRow,
  imageData: Uint8Array | null,
  allowTextOnly = false,
): Promise<PlatformResult> {
  if (post.bluesky_posted) return { platform: 'bluesky', success: true, skipped: true };
  // allowTextOnly はサイズ超過フォールバック専用。画像取得失敗・未割当は従来通りスキップ
  if (!config || (!imageData && !allowTextOnly)) {
    return { platform: 'bluesky', success: false, skipped: true };
  }

  const text = post.bluesky_text || post.x_text;
  if (!text) {
    return { platform: 'bluesky', success: false, skipped: true };
  }

  const result = await postToBluesky(config, imageData, text);

  if (result.success) {
    await env.DB.prepare(`UPDATE posts SET bluesky_posted = 1 WHERE id = ?`).bind(post.id).run();
    const bskyComment = getCommentForPlatform(post.quiz_answer_comment, 'bluesky');
    if (bskyComment && result.platformPostId) {
      const { replyToBluesky } = await import('./sns/bluesky-api');
      await replyToBluesky(config, result.platformPostId, bskyComment);
    }
  }

  return { platform: 'bluesky', ...result };
}

// ── Disabled platforms (settings: disabled_platforms = "x,facebook" 形式) ──

async function getDisabledPlatforms(env: Env): Promise<Set<string>> {
  const row = await env.DB.prepare(
    `SELECT value FROM settings WHERE key = 'disabled_platforms'`,
  ).first<{ value: string }>();
  return new Set(
    (row?.value || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
  );
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

  // 最低1件は実際に投稿されていることを条件にする
  // （全プラットフォーム本文なし＝全て「完了」扱いで posted に化けるバグの防止）
  const anyPosted = row.instagram_posted || row.facebook_posted || row.x_posted || row.bluesky_posted;

  if (anyPosted && igDone && fbDone && xDone && bskyDone) {
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

// ── Single platform posting (from UI button) ──

export async function postSinglePlatform(
  env: Env,
  postId: number,
  platform: string,
  compressedImage?: Uint8Array,
): Promise<{ success: boolean; platformPostId?: string; error?: string }> {
  const post = await env.DB.prepare(`
    SELECT p.id, p.post_date, p.status,
           p.instagram_text, p.instagram_hashtags, p.instagram_posted,
           p.x_text, p.x_hashtags, p.x_posted,
           p.facebook_text, p.facebook_hashtags, p.facebook_posted,
           p.bluesky_text, p.bluesky_posted,
           p.cta_type, p.cta_url, p.theme, p.quiz_answer_comment,
           i.r2_key,
           c.navi_image_url
    FROM posts p
    LEFT JOIN images i ON p.image_id = i.id
    LEFT JOIN characters c ON p.character_id = c.id
    WHERE p.id = ?
  `).bind(postId).first<PostRow>();

  if (!post) {
    return { success: false, error: 'Post not found' };
  }

  // Check if already posted
  const postedKey = `${platform}_posted` as keyof PostRow;
  if (post[postedKey]) {
    return { success: false, error: `Already posted to ${platform}` };
  }

  // Check text exists
  const textKey = `${platform}_text` as keyof PostRow;
  if (!post[textKey]) {
    return { success: false, error: `No text for ${platform}` };
  }

  // Get base URL
  const baseUrlRow = await env.DB.prepare(
    `SELECT value FROM settings WHERE key = 'worker_base_url'`,
  ).first<{ value: string }>();
  const baseUrl = baseUrlRow?.value || 'https://kabuki-post-365.kerakabuki.workers.dev';

  // Image resolution
  const r2ImageUrl = post.r2_key
    ? `${baseUrl}/images/r2/${post.r2_key.split('/').map(s => encodeURIComponent(s)).join('/')}`
    : null;
  const imageUrl = r2ImageUrl || post.navi_image_url || null;

  let imageData: Uint8Array | null = null;
  if (post.r2_key) {
    // For Bluesky (blob hard limit 2MB; keep ≤950KB variants preferred), try SNS variant first
    if (platform === 'bluesky') {
      const snsKey = post.r2_key.replace(/^originals\//, 'sns/x/');
      if (snsKey !== post.r2_key) {
        const snsObj = await env.R2.get(snsKey);
        if (snsObj) imageData = new Uint8Array(await snsObj.arrayBuffer());
      }
    }
    if (!imageData) {
      const obj = await env.R2.get(post.r2_key);
      if (obj) imageData = new Uint8Array(await obj.arrayBuffer());
    }
    // If still too large for Bluesky, try other SNS variants
    if (platform === 'bluesky' && imageData && imageData.byteLength > 950_000) {
      for (const variant of ['sns/facebook', 'sns/instagram']) {
        const varKey = post.r2_key.replace(/^originals\//, `${variant}/`);
        const varObj = await env.R2.get(varKey);
        if (varObj) {
          const varData = new Uint8Array(await varObj.arrayBuffer());
          if (varData.byteLength < imageData.byteLength) {
            imageData = varData;
            if (imageData.byteLength <= 950_000) break;
          }
        }
      }
    }
  } else if (post.navi_image_url) {
    try {
      const res = await fetch(post.navi_image_url);
      if (res.ok) imageData = new Uint8Array(await res.arrayBuffer());
    } catch (e) {
      console.error(`[post-single] Failed to fetch image`, e);
    }
  }

  // For Bluesky: use compressed image from frontend if provided
  if (platform === 'bluesky' && compressedImage) {
    imageData = compressedImage;
  }

  // Final size check for Bluesky
  if (platform === 'bluesky' && imageData && imageData.byteLength > 950_000) {
    return { success: false, error: `画像が大きすぎます（${(imageData.byteLength / 1024 / 1024).toFixed(1)}MB）。1MB以下のSNS用バリアントをアップロードしてください。` };
  }

  let result: { success: boolean; platformPostId?: string; error?: string };

  switch (platform) {
    case 'x': {
      const config = buildXConfig(env);
      if (!config) return { success: false, error: 'X API not configured' };
      if (!imageData) return { success: false, error: 'No image available' };
      const text = post.x_hashtags ? `${post.x_text}\n${post.x_hashtags}` : post.x_text!;
      const { postToX, replyToX } = await import('./sns/x-api');
      result = await postToX(config, imageData, text);
      if (result.success) {
        await env.DB.prepare(`UPDATE posts SET x_posted = 1 WHERE id = ?`).bind(postId).run();
        // クイズの答え・CTA URLはリプライで投稿
        const comment = getCommentForPlatform(post.quiz_answer_comment, 'x');
        const replyText = [comment, post.cta_url].filter(Boolean).join('\n');
        if (replyText && result.platformPostId) {
          const replyResult = await replyToX(config, result.platformPostId, replyText);
          if (!replyResult.success) console.error(`[post-single] X reply failed:`, replyResult.error);
        }
      }
      break;
    }
    case 'bluesky': {
      const config = buildBlueskyConfig(env);
      if (!config) return { success: false, error: 'Bluesky not configured' };
      if (!imageData) return { success: false, error: 'No image available' };
      const text = post.bluesky_text || post.x_text!;
      const { postToBluesky, replyToBluesky } = await import('./sns/bluesky-api');
      result = await postToBluesky(config, imageData, text);
      if (result.success) {
        await env.DB.prepare(`UPDATE posts SET bluesky_posted = 1 WHERE id = ?`).bind(postId).run();
        // Reply with comment if exists
        const comment = getCommentForPlatform(post.quiz_answer_comment, 'bluesky');
        if (comment && result.platformPostId) {
          const replyResult = await replyToBluesky(config, result.platformPostId, comment);
          if (!replyResult.success) console.error(`[post-single] Bluesky reply failed:`, replyResult.error);
        }
      }
      break;
    }
    case 'facebook': {
      const config = buildMetaConfig(env);
      if (!config) return { success: false, error: 'Facebook not configured' };
      if (!imageUrl) return { success: false, error: 'No image available' };
      const message = post.facebook_hashtags
        ? `${post.facebook_text}\n\n${post.facebook_hashtags}`
        : post.facebook_text!;
      const { postToFacebook, commentOnFacebook } = await import('./sns/meta-api');
      result = await postToFacebook(config, imageUrl, message);
      if (result.success) {
        await env.DB.prepare(`UPDATE posts SET facebook_posted = 1 WHERE id = ?`).bind(postId).run();
        // Comment if exists
        const comment = getCommentForPlatform(post.quiz_answer_comment, 'facebook');
        if (comment && result.platformPostId) {
          const commentResult = await commentOnFacebook(config, result.platformPostId, comment);
          if (!commentResult.success) console.error(`[post-single] FB comment failed:`, commentResult.error);
        }
      }
      break;
    }
    case 'instagram': {
      const config = buildMetaConfig(env);
      if (!config) return { success: false, error: 'Instagram not configured' };
      if (!imageUrl) return { success: false, error: 'No image available' };
      const caption = post.instagram_hashtags
        ? `${post.instagram_text}\n\n${post.instagram_hashtags}`
        : post.instagram_text!;
      const { postToInstagram, commentOnInstagram } = await import('./sns/meta-api');
      result = await postToInstagram(config, imageUrl, caption);
      if (result.success) {
        await env.DB.prepare(`UPDATE posts SET instagram_posted = 1 WHERE id = ?`).bind(postId).run();
        // Comment if exists
        const comment = getCommentForPlatform(post.quiz_answer_comment, 'instagram');
        if (comment && result.platformPostId) {
          const commentResult = await commentOnInstagram(config, result.platformPostId, comment);
          if (!commentResult.success) console.error(`[post-single] IG comment failed:`, commentResult.error);
        }
      }
      break;
    }
    default:
      return { success: false, error: `Unsupported platform: ${platform}` };
  }

  // Write audit log
  await env.DB.prepare(`
    INSERT INTO post_log (post_id, platform, success, platform_post_id, error_message)
    VALUES (?, ?, ?, ?, ?)
  `).bind(postId, platform, result.success ? 1 : 0, result.platformPostId || null, result.error || null).run();

  // Update overall post status
  await updatePostStatus(env, postId);

  return result;
}

function getJSTDate(): string {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}
