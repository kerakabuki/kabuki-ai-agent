import type { Env } from '../types';
import { generatePostText } from './claude';
import { executeAutoPost, type AutoPostReport } from './instagram-auto-post';
import { prepareReels } from './reels';
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

// 日付文字列（YYYY-MM-DD）に日数を足した日付文字列を返す。UTC固定で計算する。
function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

// Daily feed at 09:00 JST, with processing retries until 11:45.
export const SLOT_START_HOUR_JST=9;
export const SLOT_COUNT=12;
export function pickSlotForDate(_date:string){return {hour:9,minute:0};}

/** 現在のcron発火がその日の実行スロットか判定。最終スロットはフォールバック（未実行なら実行） */
export async function shouldRunNow(env: Env): Promise<{ run: boolean; reason: string }> {
  const now = getJSTNow();
  const target = pickSlotForDate(now.date);

  const doneKey = `autopost_done:${now.date}`;
  const alreadyDone = await env.KV.get(doneKey);
  if (alreadyDone) return { run: false, reason: 'already done today' };

  if (now.hour >= 9 && now.hour < 12) {
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
     LEFT JOIN images i ON p.image_id = i.id
     -- キャラクター情報は添付画像に紐づくもの、かつ人間が検品済み（verified=1）のものだけ使う
     -- （画像と無関係なキャラ名／Gemini Visionの誤判定で本文が生成されるのを防ぐ）
     LEFT JOIN characters c ON c.id = i.character_id AND i.verified = 1
     LEFT JOIN quiz_posts qp ON qp.post_id = p.id
     WHERE p.post_date = ? AND p.auto_publish=1 AND p.publish_state IN ('idle','failed') AND p.status IN ('draft', 'approved')
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
      const texts = await generatePostText(env, post, settings, 'instagram');
      await env.DB.prepare(
        `UPDATE posts SET
          instagram_text=?, instagram_hashtags=?,
          updated_at=datetime('now')
        WHERE id=?`,
      ).bind(
        texts.instagram_text, texts.instagram_hashtags,
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

// ── 先読み準備: N日先まで画像・本文を揃えておく ──
// Facebookは2026-07-18からAPI自動投稿を停止し、Meta Business Suiteの予約投稿で
// 手動運用する（本文・画像は自動生成のまま）。週1回まとめて予約を組めるよう、
// 常に prepare_days_ahead 日先まで素材が揃っている状態を作る。

interface PrepareResult {
  generated: number;   // 先読みで新規生成した本文の件数
  errors: string[];    // 先読み中に発生したエラー
}

/** 明日以降 N 日先までの画像割当・本文生成を前倒しで行う（冪等・未処理分のみ） */
async function prepareAhead(env: Env, baseDate: string, daysAhead: number): Promise<PrepareResult> {
  const result: PrepareResult = { generated: 0, errors: [] };
  if (daysAhead <= 0) return result;

  for (let d = 1; d <= daysAhead; d++) {
    const targetDate = addDays(baseDate, d);
    // 途中の失敗（Geminiエラー等）は握りつぶさず収集しつつ、残りの日付は必ず続行する
    try {
      // 画像 → 本文の順（先に画像を決めることで人物情報が本文生成に反映される）
      await ensureImages(env, targetDate);
      const gen = await generateMissingTexts(env, targetDate);
      result.generated += gen.generated;
      for (const e of gen.errors) result.errors.push(`${targetDate}: ${e}`);
    } catch (err) {
      result.errors.push(`${targetDate}: ${(err as Error).message}`);
      console.error(`[daily-run] Prepare-ahead failed for ${targetDate}:`, err);
    }
  }

  return result;
}

/**
 * settings から prepare_days_ahead を安全に読む。
 * - 未設定・空・NaN はデフォルト 7
 * - 正常値は 0〜30 にクランプ（30超は30、負値は0）
 * - D1 の読取り失敗時は console.error してデフォルト 7 を返す
 *   （この関数は SNS投稿完了後に呼ばれるため、ここで throw すると
 *    後続の LINE通知・markDone が飛んでしまう）
 */
async function getPrepareDaysAhead(env: Env): Promise<number> {
  try {
    const row = await env.DB.prepare(
      `SELECT value FROM settings WHERE key = 'prepare_days_ahead'`,
    ).first<{ value: string }>();
    if (row?.value == null || row.value.trim() === '') return 7;
    const parsed = parseInt(row.value, 10);
    if (Number.isNaN(parsed)) return 7;
    // 上限クランプ: 0〜30
    if (parsed > 30) return 30;
    if (parsed < 0) return 0;
    return parsed;
  } catch (e) {
    console.error('[daily-run] getPrepareDaysAhead failed, fallback to 7:', e);
    return 7;
  }
}

// ── 日次パイプライン: 生成 → 投稿 → 先読み準備 → LINE通知 ──

export async function runDailyPipeline(env: Env, targetDate?: string): Promise<AutoPostReport> {
  const date = targetDate || getJSTNow().date;
  console.log(`[daily-run] Pipeline start for ${date}`);

  // 1. 画像の自動割当（未割当分のみ。先に画像を決めることで人物情報が本文生成に反映される）
  const img = await ensureImages(env, date);

  // 2. 本文の自動生成（未生成分のみ）
  const gen = await generateMissingTexts(env, date);

  // 3. 自動投稿
  const report = await executeAutoPost(env, date);

  // 4. 先読み準備（明日以降N日先まで素材を揃える。失敗しても後続のLINE通知は続行）
  const daysAhead = await getPrepareDaysAhead(env);
  const prepare = await prepareAhead(env, date, daysAhead);
  await prepareReels(env);

  // 5. LINE通知
  await notifyAdmin(env, buildNotificationText(date, img, gen, report, prepare));

  return report;
}

function buildNotificationText(
  date: string,
  img: ImageAssignResult,
  gen: GenerationResult,
  report: AutoPostReport,
  prepare: PrepareResult,
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
    // Facebookのpermalinkが1件でもあれば、末尾に個人アカウントでのシェアを促す一文を出す
    let hasFacebookPermalink = false;
    for (const r of report.results) {
      const parts: string[] = [];
      const permalinks: string[] = [];   // 投稿への直リンク（生URL行として出す）
      for (const p of r.platforms) {
        if (p.skipped && p.success) continue;           // 投稿済みスキップは表示しない
        if (p.skipped) parts.push(`${p.platform}: スキップ`);
        else if (p.success) parts.push(`${p.platform}: OK`);
        else parts.push(`${p.platform}: 失敗 (${(p.error || '').slice(0, 80)})`);
        // 成功した投稿のpermalinkを集める（LINEアプリがURLを自動リンク化する）
        if (p.success && !p.skipped && p.permalink) {
          permalinks.push(p.permalink);
          if (p.platform === 'facebook') {
            hasFacebookPermalink = true;
            // Facebook公式のシェアダイアログへ直行するリンクも添える。
            // 管理者はこれを開いて「投稿する」を押すだけで個人アカウント／グループへシェアできる。
            permalinks.push(`▼シェア画面を開く: https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(p.permalink)}`);
          }
        }
      }
      if (parts.length > 0) {
        lines.push('');
        lines.push(`投稿 #${r.postId}`);
        lines.push(...parts.map(s => `・${s}`));
        // ステータス行群の直後に生URLだけの行として並べる（・プレフィックスは付けない）
        lines.push(...permalinks);
      }
    }
    const okCount = report.results.flatMap(r => r.platforms).filter(p => p.success && !p.skipped).length;
    if (okCount > 0) {
      lines.push('');
      lines.push('Facebook・Xへの転記はCodexが20時に確認します。');
      if (hasFacebookPermalink) {
        lines.push('Facebookはページ投稿だけだとほぼ届きません。シェア画面リンクを開いて「投稿する」を押すだけ。グループへのシェアもその画面から選べます。');
      }
    }
  }

  // 先読み準備の結果は、変化があったとき（新規生成あり）だけ1行足す。
  // 毎日変化がないときはノイズになるので出さない。
  if (prepare.generated > 0) {
    lines.push('');
    lines.push(`先読み準備: 明日以降の本文を${prepare.generated}件生成`);
  }

  const allErrors = [
    ...img.errors.map(e => `画像エラー: ${e.slice(0, 100)}`),
    ...gen.errors.map(e => `生成エラー: ${e.slice(0, 100)}`),
    ...prepare.errors.map(e => `先読みエラー: ${e.slice(0, 100)}`),
  ];
  if (allErrors.length > 0) {
    lines.push('');
    lines.push(...allErrors.slice(0, 5));
  }

  return lines.join('\n');
}
