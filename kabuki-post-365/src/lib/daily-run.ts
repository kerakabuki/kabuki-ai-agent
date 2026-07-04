import type { Env } from '../types';
import { generatePostText } from './claude';
import { executeAutoPost, type AutoPostReport } from './auto-post';
import { notifyAdmin } from './line-notify';
import { ensureImages, type ImageAssignResult } from './auto-image';

// ── JST時刻ユーティリティ ──

export function getJSTNow(): { date: string; hour: number; minute: number } {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return {
    date: jst.toISOString().slice(0, 10),
    hour: jst.getUTCHours(),
    minute: jst.getUTCMinutes(),
  };
}

// ── 投稿時刻の日替わりランダム化 ──
// cronは15分刻みでJST 6:00〜11:45の24スロットで発火する。
// 日付文字列のハッシュから「今日のスロット」を決定論的に選ぶことで、
// 投稿時刻が毎日変わる（同じ日は何度計算しても同じスロットになる）。

export const SLOT_START_HOUR_JST = 6;   // 最初のスロット 6:00
export const SLOT_COUNT = 24;           // 15分刻み × 6時間 = 6:00〜11:45

function hashDate(date: string): number {
  // FNV-1a 32bit
  let h = 0x811c9dc5;
  for (let i = 0; i < date.length; i++) {
    h ^= date.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function pickSlotForDate(date: string): { hour: number; minute: number } {
  const slot = hashDate(date) % SLOT_COUNT;
  const hour = SLOT_START_HOUR_JST + Math.floor(slot / 4);
  const minute = (slot % 4) * 15;
  return { hour, minute };
}

/** 現在のcron発火がその日の実行スロットか判定。最終スロットはフォールバック（未実行なら実行） */
export async function shouldRunNow(env: Env): Promise<{ run: boolean; reason: string }> {
  const now = getJSTNow();
  const target = pickSlotForDate(now.date);

  const doneKey = `autopost_done:${now.date}`;
  const alreadyDone = await env.KV.get(doneKey);
  if (alreadyDone) return { run: false, reason: 'already done today' };

  if (now.hour === target.hour && now.minute >= target.minute && now.minute < target.minute + 15) {
    return { run: true, reason: `scheduled slot ${target.hour}:${String(target.minute).padStart(2, '0')} JST` };
  }

  // フォールバック: 最終スロット（11:45〜）でまだ未実行なら必ず実行する
  const lastHour = SLOT_START_HOUR_JST + Math.floor((SLOT_COUNT - 1) / 4);
  const lastMinute = ((SLOT_COUNT - 1) % 4) * 15;
  if (now.hour === lastHour && now.minute >= lastMinute) {
    return { run: true, reason: 'fallback (last slot, not yet done)' };
  }

  return { run: false, reason: `waiting for slot ${target.hour}:${String(target.minute).padStart(2, '0')} JST` };
}

export async function markDone(env: Env, date: string): Promise<void> {
  // 2日で自動失効（翌日以降のキーを汚さない）
  await env.KV.put(`autopost_done:${date}`, new Date().toISOString(), { expirationTtl: 60 * 60 * 48 });
}

// ── 本文の自動生成 ──

interface GenerationResult {
  generated: number;
  failed: number;
  errors: string[];
}

/** 当日分の投稿のうち本文未生成のものをGeminiで生成してDBに保存する */
export async function generateMissingTexts(env: Env, date: string): Promise<GenerationResult> {
  const { results: posts } = await env.DB.prepare(
    `SELECT p.*, c.name as character_name, c.description as character_description,
     c.personality_tags, i.visual_features, i.scene_type,
     qp.question as quiz_question, qp.options as quiz_options,
     qp.correct_answer as quiz_correct_answer, qp.explanation as quiz_explanation
     FROM posts p
     LEFT JOIN characters c ON p.character_id = c.id
     LEFT JOIN images i ON p.image_id = i.id
     LEFT JOIN quiz_posts qp ON qp.post_id = p.id
     WHERE p.post_date = ? AND p.status IN ('draft', 'approved')
       AND p.instagram_text IS NULL`,
  ).bind(date).all();

  const result: GenerationResult = { generated: 0, failed: 0, errors: [] };
  if (!posts.length) return result;

  const { results: settingsRows } = await env.DB.prepare('SELECT key, value FROM settings').all();
  const settings: Record<string, string> = {};
  for (const s of settingsRows as Array<{ key: string; value: string }>) {
    settings[s.key] = s.value;
  }

  for (const post of posts as Array<Record<string, unknown>>) {
    try {
      const texts = await generatePostText(env, post, settings);
      await env.DB.prepare(
        `UPDATE posts SET
          instagram_text=?, instagram_hashtags=?,
          x_text=?, x_hashtags=?,
          facebook_text=?, facebook_hashtags=?,
          bluesky_text=?,
          quiz_answer_comment=?,
          updated_at=datetime('now')
        WHERE id=?`,
      ).bind(
        texts.instagram_text, texts.instagram_hashtags,
        texts.x_text, texts.x_hashtags,
        texts.facebook_text, texts.facebook_hashtags,
        texts.bluesky_text,
        texts.quiz_answer_comment || null,
        post.id,
      ).run();
      result.generated++;
    } catch (err) {
      result.failed++;
      result.errors.push(`post ${post.id}: ${(err as Error).message}`);
      console.error(`[daily-run] Text generation failed for post ${post.id}:`, err);
    }
  }

  return result;
}

// ── 日次パイプライン: 生成 → 投稿 → LINE通知 ──

export async function runDailyPipeline(env: Env, targetDate?: string): Promise<AutoPostReport> {
  const date = targetDate || getJSTNow().date;
  console.log(`[daily-run] Pipeline start for ${date}`);

  // 1. 画像の自動割当（未割当分のみ。先に画像を決めることで人物情報が本文生成に反映される）
  const img = await ensureImages(env, date);

  // 2. 本文の自動生成（未生成分のみ）
  const gen = await generateMissingTexts(env, date);

  // 3. 自動投稿
  const report = await executeAutoPost(env, date);

  // 4. LINE通知
  await notifyAdmin(env, buildNotificationText(date, img, gen, report));

  return report;
}

function buildNotificationText(
  date: string,
  img: ImageAssignResult,
  gen: GenerationResult,
  report: AutoPostReport,
): string {
  const lines: string[] = [`【kabuki-post-365】${date} の投稿結果`];

  if (img.assigned > 0) lines.push(`画像割当: ライブラリから${img.assigned}件`);
  if (img.generated > 0) lines.push(`画像割当: AI生成${img.generated}件`);
  if (gen.generated > 0) lines.push(`本文生成: ${gen.generated}件`);
  if (gen.failed > 0) lines.push(`本文生成の失敗: ${gen.failed}件`);

  if (report.postsProcessed === 0) {
    lines.push('');
    lines.push('投稿対象がありませんでした。');
    if (gen.failed > 0) {
      lines.push('本文生成に失敗した可能性があります。管理画面を確認してください。');
    } else {
      lines.push('カレンダーに当日分の投稿枠・画像があるか確認してください。');
    }
  } else {
    for (const r of report.results) {
      const parts: string[] = [];
      for (const p of r.platforms) {
        if (p.skipped && p.success) continue;           // 投稿済みスキップは表示しない
        if (p.skipped) parts.push(`${p.platform}: スキップ`);
        else if (p.success) parts.push(`${p.platform}: OK`);
        else parts.push(`${p.platform}: 失敗 (${(p.error || '').slice(0, 80)})`);
      }
      if (parts.length > 0) {
        lines.push('');
        lines.push(`投稿 #${r.postId}`);
        lines.push(...parts.map(s => `・${s}`));
      }
    }
    const okCount = report.results.flatMap(r => r.platforms).filter(p => p.success && !p.skipped).length;
    if (okCount > 0) {
      lines.push('');
      lines.push('30分以内にアプリを開いてコメント返信・いいね周りをすると初速が伸びます。');
    }
  }

  const allErrors = [
    ...img.errors.map(e => `画像エラー: ${e.slice(0, 100)}`),
    ...gen.errors.map(e => `生成エラー: ${e.slice(0, 100)}`),
  ];
  if (allErrors.length > 0) {
    lines.push('');
    lines.push(...allErrors.slice(0, 5));
  }

  return lines.join('\n');
}
