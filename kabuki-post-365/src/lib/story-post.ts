import type { Env } from '../types';
import { getJSTNow } from './daily-run';
import { getDisabledPlatforms, getWorkerBaseUrl, buildR2ImageUrl } from './auto-post';
import { postInstagramStory, type MetaConfig } from './sns/meta-api';
import { notifyAdmin } from './line-notify';

// ── 夕方の舞台裏ストーリーズ自動投稿 ──
// 朝のフィード投稿（キャラ写真）とは別に、夕方19時台に舞台裏系の写真を1枚
// Instagramストーリーズへ自動投稿する。cronは15分刻みで発火し、
// 日替わりで選ばれた1スロット（19:00/19:15/19:30/19:45）だけ実投稿する。

const STORY_SLOT_START_HOUR_JST = 19;   // 最初のスロット 19:00
const STORY_SLOT_COUNT = 4;             // 15分刻み × 1時間 = 19:00〜19:45

// FNV-1a 32bit。daily-run.ts の hashDate と同じ実装で、
// 日付+用途文字列から決定論的にスロットを選ぶ（同じ日は何度計算しても同じ）。
function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function pickStorySlotForDate(date: string): { hour: number; minute: number } {
  // フィード（朝）とスロットの選び方を分けるため 'story' を混ぜてハッシュする
  const slot = hashString(`${date}story`) % STORY_SLOT_COUNT;
  const hour = STORY_SLOT_START_HOUR_JST + Math.floor(slot / 4);
  const minute = (slot % 4) * 15;
  return { hour, minute };
}

/** 現在のcron発火がその日のストーリーズ実行スロットか判定。19:45は未実行時のキャッチアップ */
export async function shouldRunStoryNow(env: Env): Promise<{ run: boolean; reason: string }> {
  const now = getJSTNow();
  const target = pickStorySlotForDate(now.date);

  const doneKey = `story_done:${now.date}`;
  const alreadyDone = await env.KV.get(doneKey);
  if (alreadyDone) return { run: false, reason: 'story already done today' };

  if (now.hour === target.hour && now.minute >= target.minute && now.minute < target.minute + 15) {
    return { run: true, reason: `scheduled story slot ${target.hour}:${String(target.minute).padStart(2, '0')} JST` };
  }

  // キャッチアップ: 最終スロット（19:45〜）でまだ未実行なら必ず実行する
  const lastHour = STORY_SLOT_START_HOUR_JST + Math.floor((STORY_SLOT_COUNT - 1) / 4);
  const lastMinute = ((STORY_SLOT_COUNT - 1) % 4) * 15;
  if (now.hour === lastHour && now.minute >= lastMinute) {
    return { run: true, reason: 'story fallback (last slot, not yet done)' };
  }

  return { run: false, reason: `waiting for story slot ${target.hour}:${String(target.minute).padStart(2, '0')} JST` };
}

async function markStoryDone(env: Env, date: string): Promise<void> {
  // 2日で自動失効（翌日以降のキーを汚さない）
  await env.KV.put(`story_done:${date}`, new Date().toISOString(), { expirationTtl: 60 * 60 * 48 });
}

// 現在の発火がキャッチアップ（最終19:45スロット）かどうか
function isLastStorySlot(): boolean {
  const now = getJSTNow();
  const lastHour = STORY_SLOT_START_HOUR_JST + Math.floor((STORY_SLOT_COUNT - 1) / 4);
  const lastMinute = ((STORY_SLOT_COUNT - 1) % 4) * 15;
  return now.hour === lastHour && now.minute >= lastMinute;
}

interface StoryImageRow {
  id: number;
  r2_key: string;
  scene_type: string | null;
}

// 舞台裏ストーリーズの対象プール条件（WHERE句）。
// 画像選定（runEveningStory）と管理画面の履歴API（story-history）で
// 同じ条件を使うため、ここに一元化する（条件式が2箇所に散らばらないように）。
// verified=1（写真チェック済み）かつ r2_key あり、scene_type が舞台裏系のいずれかに部分一致。
// 実データの scene_type は「楽屋, 化粧, 衣裳」「楽屋/化粧」等の自由記述混在のため LIKE で拾う。
export const STORY_POOL_WHERE = `verified = 1
  AND privacy_excluded = 0
  AND r2_key IS NOT NULL
  AND (
    scene_type LIKE '%楽屋%'
    OR scene_type LIKE '%化粧%'
    OR scene_type LIKE '%稽古%'
    OR scene_type LIKE '%舞台裏%'
    OR scene_type LIKE '%衣裳%'
    OR scene_type LIKE '%衣装%'
    OR scene_type LIKE '%準備%'
    OR scene_type LIKE '%休憩%'
    OR scene_type LIKE '%小道具%'
    OR scene_type LIKE '%運営%'
    OR LOWER(scene_type) LIKE '%backstage%'
  )`;

/**
 * 夕方の舞台裏ストーリーズを1枚投稿する。
 * 成功時はLINE通知を送らない（毎夕の通知はノイズになる。朝のダイジェストと違い、
 * ストーリーズは失敗時のみ管理者に通知する方針）。
 */
export async function runEveningStory(env: Env): Promise<void> {
  const now = getJSTNow();
  console.log(`[story-post] Evening story start for ${now.date}`);

  // 全体を try/catch で包む。ここは waitUntil 内から呼ばれるため、D1/KV/ネットワークの
  // 想定外throw（例: migration 0008 未適用による 'no such column: story_posted_at'）を
  // 握り潰すとログにしか残らないサイレント失敗になる。「失敗時のみ管理者へ通知」方針を
  // 例外経路でも守るため、catch で notifyAdmin する。
  try {
    // a. 無効化プラットフォームの確認。'instagram'（IG全停止）または
    //    'instagram_story'（ストーリーズだけ単独停止）が含まれていればスキップ。
    const disabled = await getDisabledPlatforms(env);
    if (disabled.has('instagram') || disabled.has('instagram_story')) {
      console.log('[story-post] Instagram(_story) is disabled; skip evening story');
      return;
    }

    // b. 画像選定: verified=1 かつ scene_type が舞台裏系にマッチするもの。
    //    実データの scene_type は「楽屋, 化粧, 衣裳」「楽屋/化粧」等の自由記述混在のため
    //    LIKE の部分一致で拾う。story_posted_at が NULL のもの優先 → 古い順 → 同率はRANDOM()。
    const image = await env.DB.prepare(`
      SELECT id, r2_key, scene_type
      FROM images
      WHERE ${STORY_POOL_WHERE}
      ORDER BY (story_posted_at IS NULL) DESC, story_posted_at ASC, RANDOM()
      LIMIT 1
    `).first<StoryImageRow>();

    if (!image) {
      // 該当0件なら何もせずログのみ（通知はしない）
      console.log('[story-post] No backstage image (verified & scene_type match) available; nothing to post');
      return;
    }

    // c. 画像URL: フィードと同じ構成（settings.worker_base_url + R2キーのセグメント毎エンコード）
    const baseUrl = await getWorkerBaseUrl(env);
    const imageUrl = buildR2ImageUrl(baseUrl, image.r2_key);

    // Metaの認証情報（未設定ならスキップ）。フィードの buildMetaConfig と同じ構成。
    if (!env.META_ACCESS_TOKEN) {
      console.log('[story-post] META_ACCESS_TOKEN 未設定のためストーリーズ投稿スキップ');
      return;
    }
    const config: MetaConfig = {
      accessToken: env.META_ACCESS_TOKEN,
      igUserId: env.INSTAGRAM_USER_ID,
      fbPageId: env.FACEBOOK_PAGE_ID,
    };

    // d. ストーリーズ投稿を実行
    const result = await postInstagramStory(config, imageUrl);

    if (result.success) {
      // 二重実行防止フラグを「先に」立てる。投稿は既に成功しているので、後続の
      // UPDATE images が万一throwしても 19:45 キャッチアップが 2枚目を投稿しないようにする。
      await markStoryDone(env, now.date);
      // 使用履歴を更新（フィードの usage_count には触れない）。ここでの失敗は
      // 投稿自体には影響しないため、通知はせずログのみ（misleadingな「投稿失敗」通知を避ける）。
      try {
        await env.DB.prepare(
          `UPDATE images SET story_posted_at = datetime('now') WHERE id = ?`,
        ).bind(image.id).run();
      } catch (e) {
        console.error(`[story-post] story_posted_at UPDATE failed (post itself succeeded): ${e}`);
      }
      console.log(`[story-post] Story posted OK (image #${image.id}, scene_type="${image.scene_type ?? ''}")`);
      // 成功時のLINE通知は送らない（毎夕の通知はノイズになるため）
      return;
    }

    // 失敗: 失敗時のみLINE通知する。
    const errMsg = (result.error || '').slice(0, 80);
    await notifyAdmin(env, `【kabuki-post-365】ストーリーズ投稿失敗: ${errMsg}`);
    console.error(`[story-post] Story post failed: ${result.error}`);

    // 失敗時は原則フラグを立てず、キャッチアップスロット（19:45）で再試行させる。
    // ただし最終19:45スロットでの失敗はもう当日の再試行スロットが無い
    // （cronは翌日まで来ない）ため、整理としてフラグを立てて当日を打ち切る。
    if (isLastStorySlot()) {
      await markStoryDone(env, now.date);
    }
  } catch (err) {
    // 想定外の例外（D1/KV/ネットワーク等）。ここに来る＝投稿できていないので
    // 失敗として管理者へ通知する。通知自体の失敗でさらにthrowしないよう握る。
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[story-post] Unexpected error: ${msg}`);
    await notifyAdmin(env, `【kabuki-post-365】ストーリーズ投稿失敗(例外): ${msg.slice(0, 80)}`).catch(() => {});
    // 例外時はフラグを立てず 19:45 キャッチアップで再試行させる。
    // ただし最終スロットでの例外は当日打ち切り（再試行スロットが無い）。
    if (isLastStorySlot()) {
      await markStoryDone(env, now.date).catch(() => {});
    }
  }
}
