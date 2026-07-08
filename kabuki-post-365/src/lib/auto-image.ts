import type { Env } from '../types';
import { generateImage } from './image-gen';

export interface ImageAssignResult {
  assigned: number;   // ライブラリから割当した件数
  generated: number;  // AI生成した件数
  errors: string[];
}

/** 月 → 画像の season_tag（日本語） */
function seasonTagForMonth(month: number): string {
  if (month >= 4 && month <= 5) return '春';
  if (month >= 6 && month <= 8) return '夏';
  if (month >= 9 && month <= 11) return '秋';
  return '冬';
}

interface TargetPost {
  id: number;
  theme: string;
  special_day: string | null;
}

interface ImageRow {
  id: number;
  character_id: number | null;
  verified: number; // 検品済みなら1。未検品(0)のキャラは投稿に伝播させない
}

/**
 * 当日分の投稿のうち画像未割当のものに画像を自動で割り当てる。
 * 優先順: 既存ライブラリ（季節一致→通年、直近60日で未使用、使用回数少ない順）→ AI生成
 */
export async function ensureImages(env: Env, date: string): Promise<ImageAssignResult> {
  const result: ImageAssignResult = { assigned: 0, generated: 0, errors: [] };

  const { results: posts } = await env.DB.prepare(
    `SELECT id, theme, special_day FROM posts
     WHERE post_date = ? AND status IN ('draft', 'approved') AND image_id IS NULL`,
  ).bind(date).all<TargetPost>();

  if (!posts.length) return result;

  const month = Number(date.slice(5, 7));
  const season = seasonTagForMonth(month);

  for (const post of posts) {
    try {
      let image = await pickLibraryImage(env, season, date);
      if (!image) {
        // ライブラリが枯渇していたらAI生成
        image = await generateAndRegisterImage(env, post, date);
        if (image) result.generated++;
      } else {
        result.assigned++;
      }

      if (!image) {
        result.errors.push(`post ${post.id}: 画像を確保できませんでした`);
        continue;
      }

      // 検品済み画像のキャラだけを投稿に伝播させる（未検品はGemini Visionの誤判定の可能性があるため無視）
      const propagatedCharacterId = image.verified ? image.character_id : null;
      await env.DB.batch([
        // 画像に人物が紐づいていれば投稿のキャラクターも画像側に合わせる（本文生成は画像のキャラクターを使うため、管理画面の表示も揃える）
        env.DB.prepare(
          `UPDATE posts SET image_id = ?, character_id = COALESCE(?, character_id), updated_at = datetime('now') WHERE id = ?`,
        ).bind(image.id, propagatedCharacterId, post.id),
        env.DB.prepare(
          `UPDATE images SET usage_count = usage_count + 1, updated_at = datetime('now') WHERE id = ?`,
        ).bind(image.id),
      ]);
    } catch (e) {
      result.errors.push(`post ${post.id}: ${(e as Error).message}`);
      console.error(`[auto-image] Failed for post ${post.id}:`, e);
    }
  }

  return result;
}

/** 直近60日で使っていない画像を、季節一致→通年→なんでも の順で1枚選ぶ */
async function pickLibraryImage(env: Env, season: string, date: string): Promise<ImageRow | null> {
  const recentlyUsed = `
    SELECT image_id FROM posts
    WHERE image_id IS NOT NULL AND post_date >= date(?, '-60 days') AND post_date <= ?`;

  // 1. 季節一致 or 通年、直近未使用
  let row = await env.DB.prepare(
    `SELECT id, character_id, verified FROM images
     WHERE id NOT IN (${recentlyUsed}) AND season_tag IN (?, '通年')
     ORDER BY usage_count ASC, RANDOM() LIMIT 1`,
  ).bind(date, date, season).first<ImageRow>();
  if (row) return row;

  // 2. 直近未使用ならなんでも
  row = await env.DB.prepare(
    `SELECT id, character_id, verified FROM images
     WHERE id NOT IN (${recentlyUsed})
     ORDER BY usage_count ASC, RANDOM() LIMIT 1`,
  ).bind(date, date).first<ImageRow>();
  if (row) return row;

  // 3. 全部使用済みなら使用回数最少をローテーション再利用
  row = await env.DB.prepare(
    `SELECT id, character_id, verified FROM images
     ORDER BY usage_count ASC, RANDOM() LIMIT 1`,
  ).first<ImageRow>();
  return row || null;
}

/** Gemini画像生成 → R2保存（originals + SNSバリアント）→ imagesレコード作成 */
async function generateAndRegisterImage(
  env: Env,
  post: TargetPost,
  date: string,
): Promise<ImageRow | null> {
  const prompt = buildImagePrompt(post.theme, date);
  const gen = await generateImage(env, prompt);
  if (!gen.success || !gen.imageBase64) {
    console.error(`[auto-image] AI generation failed: ${gen.error}`);
    return null;
  }

  const ext = gen.mimeType === 'image/png' ? 'png' : 'jpg';
  const filename = `auto_${date.replace(/-/g, '')}_${post.id}.${ext}`;
  const r2Key = `originals/${filename}`;

  const binaryStr = atob(gen.imageBase64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

  await env.R2.put(r2Key, bytes.buffer, {
    httpMetadata: { contentType: gen.mimeType || 'image/png' },
  });
  for (const dir of ['sns/instagram', 'sns/x', 'sns/facebook']) {
    await env.R2.put(`${dir}/${filename}`, bytes.buffer, {
      httpMetadata: { contentType: gen.mimeType || 'image/png' },
    });
  }

  const dbResult = await env.DB.prepare(
    `INSERT INTO images (filename, r2_key, scene_type, visual_features, season_tag)
     VALUES (?, ?, 'AI生成', ?, '通年')`,
  ).bind(filename, r2Key, `AI生成画像（テーマ: ${post.theme}）`).run();

  return { id: dbResult.meta.last_row_id as number, character_id: null, verified: 0 };
}

function buildImagePrompt(theme: string, date: string): string {
  const themeHints: Record<string, string> = {
    '演目': '歌舞伎の舞台の一場面。役者が見得を切る劇的な瞬間',
    '役者': '歌舞伎役者の隈取メイクのクローズアップ。力強い表情',
    '豆知識': '歌舞伎の小道具や衣装のディテール。扇子、着物の柄など',
    '名場面': '歌舞伎の名場面。花道での演技、桜吹雪の舞台',
    'クイズ': '歌舞伎にまつわる意匠を散りばめた楽しい雰囲気のイラスト',
    '舞台裏': '歌舞伎の楽屋や舞台裏。衣装や鬘、化粧道具のある風景',
    '歴史': '江戸時代の芝居小屋の雰囲気。浮世絵風の歌舞伎の情景',
  };
  const hint = themeHints[theme] || '歌舞伎をテーマにした美しい和風のイメージ';
  return `SNS投稿用の正方形画像を生成してください。
テーマ: ${hint}
スタイル: 和の色彩（紅、金、藍）を基調にした上品で目を引くビジュアル。文字は入れない。
実在の人物の顔は描かない。日本の伝統芸能・歌舞伎の世界観を大切に。`;
}
