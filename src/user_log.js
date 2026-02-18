// src/user_log.js
// =========================================================
// 歌舞伎ログ v1: 閲覧履歴（recent）・クリップ（clips）・復習連動
// KVキー: log:{sourceKey}
// =========================================================
import { KABUKI } from "./flex_menu.js";

const LOG_KV_PREFIX = "log:";
const MAX_RECENT = 30;
const MAX_CLIPS_PER_CAT = 200;
const RECENT_PER_PAGE = 8;

/* =========================================================
   デフォルト構造（v1）
========================================================= */
function defaultLog() {
  return {
    v: 1,
    updated_at: 0,
    recent: [],       // [{ type, id, title, parent?, ts }] 新しい順, max 30
    clips: {
      enmoku: [],     // [id, ...]
      person: [],     // [{ id, parent, title? }]
      term: []        // [id, ...]
    },
    practice: {
      serifu: { last_ts: 0, progress: 0 }
    }
  };
}

/* =========================================================
   KV 読み書き + マイグレーション
========================================================= */
export async function loadLog(env, sourceKey) {
  try {
    const raw = await env.CHAT_HISTORY.get(LOG_KV_PREFIX + sourceKey);
    if (!raw) return defaultLog();
    const log = JSON.parse(raw);
    // 後方互換
    if (!Array.isArray(log.recent)) log.recent = [];
    if (!log.clips) log.clips = {};
    if (!Array.isArray(log.clips.enmoku)) log.clips.enmoku = [];
    if (!Array.isArray(log.clips.person)) log.clips.person = [];
    if (!Array.isArray(log.clips.term)) log.clips.term = [];
    if (!log.practice) log.practice = { serifu: { last_ts: 0, progress: 0 } };
    if (typeof log.v !== "number") log.v = 1;
    if (typeof log.updated_at !== "number") log.updated_at = 0;
    return log;
  } catch {
    return defaultLog();
  }
}

export async function saveLog(env, sourceKey, log) {
  log.updated_at = Math.floor(Date.now() / 1000);
  await env.CHAT_HISTORY.put(LOG_KV_PREFIX + sourceKey, JSON.stringify(log));
}

/* =========================================================
   recent: 閲覧履歴を追加（重複は最新に更新）
========================================================= */
export async function appendRecent(env, sourceKey, { type, id, title, parent }) {
  const log = await loadLog(env, sourceKey);
  log.recent = log.recent.filter(r => !(r.type === type && r.id === id));
  log.recent.unshift({ type, id, title, parent: parent || undefined, ts: Math.floor(Date.now() / 1000) });
  if (log.recent.length > MAX_RECENT) log.recent = log.recent.slice(0, MAX_RECENT);
  await saveLog(env, sourceKey, log);
  return log;
}

/* =========================================================
   recent: 履歴クリア
========================================================= */
export async function clearRecent(env, sourceKey) {
  const log = await loadLog(env, sourceKey);
  log.recent = [];
  await saveLog(env, sourceKey, log);
  return log;
}

/* =========================================================
   clips: ブックマークのトグル（ON/OFF） + max 200
========================================================= */
export async function toggleClip(env, sourceKey, type, id, meta) {
  const log = await loadLog(env, sourceKey);

  if (type === "enmoku") {
    const idx = log.clips.enmoku.indexOf(id);
    if (idx >= 0) { log.clips.enmoku.splice(idx, 1); await saveLog(env, sourceKey, log); return { clipped: false, log }; }
    log.clips.enmoku.push(id);
    if (log.clips.enmoku.length > MAX_CLIPS_PER_CAT) log.clips.enmoku = log.clips.enmoku.slice(-MAX_CLIPS_PER_CAT);
    await saveLog(env, sourceKey, log); return { clipped: true, log };
  }
  if (type === "person") {
    const idx = log.clips.person.findIndex(p => p.id === id);
    if (idx >= 0) { log.clips.person.splice(idx, 1); await saveLog(env, sourceKey, log); return { clipped: false, log }; }
    log.clips.person.push({ id, parent: meta?.parent || "", title: meta?.title || "" });
    if (log.clips.person.length > MAX_CLIPS_PER_CAT) log.clips.person = log.clips.person.slice(-MAX_CLIPS_PER_CAT);
    await saveLog(env, sourceKey, log); return { clipped: true, log };
  }
  if (type === "term") {
    const idx = log.clips.term.indexOf(id);
    if (idx >= 0) { log.clips.term.splice(idx, 1); await saveLog(env, sourceKey, log); return { clipped: false, log }; }
    log.clips.term.push(id);
    if (log.clips.term.length > MAX_CLIPS_PER_CAT) log.clips.term = log.clips.term.slice(-MAX_CLIPS_PER_CAT);
    await saveLog(env, sourceKey, log); return { clipped: true, log };
  }
  return { clipped: false, log };
}

/* =========================================================
   Helpers
========================================================= */
function typeIcon(type) {
  return type === "enmoku" ? "📜" : type === "person" ? "🎭" : "📖";
}

function recentAction(r) {
  if (r.type === "enmoku") return `step=enmoku&enmoku=${encodeURIComponent(r.id)}`;
  if (r.type === "person" && r.parent) return `step=cast&person=${encodeURIComponent(r.id)}`;
  if (r.type === "term") return `step=glossary_term&id=${encodeURIComponent(r.id)}`;
  return "step=navi_home";
}

function recentActionWeb(r) {
  return "postback:" + recentAction(r);
}

function relativeTime(ts) {
  if (!ts) return "";
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return "たった今";
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}日前`;
  return `${Math.floor(diff / 604800)}週前`;
}

function logFooterFlex() {
  return {
    type: "box", layout: "horizontal", spacing: "sm",
    contents: [
      { type: "button", style: "secondary", flex: 1, action: { type: "postback", label: "📋 マイページ", data: "step=mypage" } },
      { type: "button", style: "secondary", flex: 1, action: { type: "postback", label: "🧭 ナビ", data: "step=navi_home" } }
    ]
  };
}

/* =========================================================
   ① マイページ（サマリーハブ） — LINE Flex
========================================================= */
export function myPageFlex(log, quizState) {
  const recentCount = (log.recent || []).length;
  const clips = log.clips || {};
  const ec = (clips.enmoku || []).length;
  const pc = (clips.person || []).length;
  const tc = (clips.term || []).length;
  const wrongCount = (quizState?.wrong_ids || []).length;

  // サマリーテキスト
  const summaryParts = [];
  if (recentCount > 0) summaryParts.push(`🕐 最近見た ${recentCount}件`);
  summaryParts.push(`⭐ クリップ 演目${ec} / 人物${pc} / 用語${tc}`);
  if (wrongCount > 0) summaryParts.push(`🧩 復習 ${wrongCount}問`);

  // 最近見た Top3（タップで直接遷移）
  const top3 = (log.recent || []).slice(0, 3);
  const recentRows = top3.map(r => ({
    type: "box", layout: "horizontal", paddingAll: "8px",
    backgroundColor: KABUKI.card, cornerRadius: "8px",
    action: { type: "postback", label: (r.title || "").slice(0, 20), data: recentAction(r) },
    contents: [
      { type: "text", text: typeIcon(r.type), size: "sm", flex: 0 },
      { type: "text", text: r.title || "(不明)", size: "sm", color: KABUKI.text, wrap: true, flex: 4, paddingStart: "8px" },
      { type: "text", text: relativeTime(r.ts), size: "xxs", color: KABUKI.dimmer, flex: 0, gravity: "center" }
    ]
  }));

  if (recentRows.length === 0) {
    recentRows.push({ type: "text", text: "まだ履歴がないよ🙂\n演目や用語を見てみてね！", size: "xs", color: KABUKI.dim, wrap: true });
  }

  // アクションボタン
  const actions = [];
  actions.push({ type: "button", style: "secondary", height: "sm", action: { type: "postback", label: `🕐 最近見た（${recentCount}件）`, data: "step=log_recent_list&page=1" } });
  actions.push({ type: "button", style: "secondary", height: "sm", action: { type: "postback", label: `⭐ クリップ（${ec + pc + tc}件）`, data: "step=log_clips_menu" } });
  if (wrongCount > 0) {
    actions.push({ type: "button", style: "primary", color: KABUKI.red, height: "sm", action: { type: "postback", label: `🧩 復習（${wrongCount}問）`, data: "step=log_quiz_review" } });
  } else {
    actions.push({ type: "button", style: "secondary", height: "sm", action: { type: "postback", label: "🧩 クイズ復習", data: "step=log_quiz_review" } });
  }

  return {
    type: "flex", altText: "KABUKI LOG",
    contents: {
      type: "bubble",
      body: {
        type: "box", layout: "vertical", spacing: "sm",
        backgroundColor: KABUKI.bg, paddingAll: "16px",
        contents: [
          { type: "text", text: "📋 KABUKI LOG", weight: "bold", size: "lg", color: KABUKI.gold },
          { type: "text", text: summaryParts.join("\n"), size: "xxs", color: KABUKI.dim, wrap: true },
          { type: "separator", margin: "sm" },
          ...recentRows,
          { type: "separator", margin: "sm" },
          ...actions
        ]
      },
      footer: { type: "box", layout: "horizontal", spacing: "sm", contents: [
        { type: "button", style: "secondary", flex: 1, action: { type: "postback", label: "🧭 ナビ", data: "step=navi_home" } }
      ]}
    }
  };
}

/* =========================================================
   ① マイページ（サマリーハブ） — Web UI
========================================================= */
export function myPageWeb(log, quizState) {
  const recentCount = (log.recent || []).length;
  const clips = log.clips || {};
  const ec = (clips.enmoku || []).length;
  const pc = (clips.person || []).length;
  const tc = (clips.term || []).length;
  const wrongCount = (quizState?.wrong_ids || []).length;
  const totalClips = ec + pc + tc;

  const items = [];
  items.push({ label: `🕐 最近見た（${recentCount}件）`, action: "postback:step=log_recent_list&page=1" });
  items.push({ label: `⭐ クリップ（${totalClips}件）`, action: "postback:step=log_clips_menu" });
  if (wrongCount > 0) {
    items.push({ label: `🧩 復習（${wrongCount}問）`, action: "postback:step=log_quiz_review" });
  } else {
    items.push({ label: "🧩 クイズ復習", action: "postback:step=log_quiz_review" });
  }

  const subtitle = `⭐ 演目${ec} / 人物${pc} / 用語${tc}` + (wrongCount > 0 ? ` ┃ 🧩 復習${wrongCount}問` : "");

  return {
    reply: "",
    ui: {
      type: "card",
      title: "📋 KABUKI LOG",
      subtitle,
      body: recentCount > 0
        ? `🕐 最近見た ${recentCount}件`
        : "まだ履歴がないよ🙂 演目や用語を見てみてね！",
      items,
      footer: [{ label: "🧭 ナビ", action: "postback:step=navi_home" }]
    }
  };
}

/* =========================================================
   ② 最近見た一覧 — LINE Flex
========================================================= */
export function recentListFlex(log, page = 1) {
  const all = log.recent || [];
  const total = all.length;
  const maxPage = Math.max(1, Math.ceil(total / RECENT_PER_PAGE));
  const cur = Math.min(Math.max(1, page), maxPage);
  const slice = all.slice((cur - 1) * RECENT_PER_PAGE, cur * RECENT_PER_PAGE);

  const rows = slice.map(r => ({
    type: "box", layout: "horizontal", paddingAll: "8px",
    backgroundColor: KABUKI.card, cornerRadius: "8px",
    action: { type: "postback", label: (r.title || "").slice(0, 20), data: recentAction(r) },
    contents: [
      { type: "text", text: typeIcon(r.type), size: "sm", flex: 0 },
      { type: "text", text: r.title || "(不明)", size: "sm", color: KABUKI.text, wrap: true, flex: 4, paddingStart: "8px" },
      { type: "text", text: relativeTime(r.ts), size: "xxs", color: KABUKI.dimmer, flex: 0, gravity: "center" }
    ]
  }));

  if (rows.length === 0) {
    rows.push({ type: "text", text: "まだ履歴がないよ🙂", size: "xs", color: KABUKI.dim, wrap: true });
  }

  // ページング
  const navBtns = [];
  if (cur > 1) navBtns.push({ type: "button", style: "secondary", flex: 1, height: "sm", action: { type: "postback", label: "前へ", data: `step=log_recent_list&page=${cur - 1}` } });
  if (cur < maxPage) navBtns.push({ type: "button", style: "secondary", flex: 1, height: "sm", action: { type: "postback", label: "次へ", data: `step=log_recent_list&page=${cur + 1}` } });
  if (total > 0) navBtns.push({ type: "button", style: "secondary", flex: 1, height: "sm", action: { type: "postback", label: "🗑 履歴クリア", data: "step=log_recent_clear" } });

  return {
    type: "flex", altText: `最近見た（${cur}/${maxPage}）`,
    contents: {
      type: "bubble",
      body: {
        type: "box", layout: "vertical", spacing: "sm",
        backgroundColor: KABUKI.bg, paddingAll: "16px",
        contents: [
          { type: "text", text: maxPage > 1 ? `🕐 最近見た（${cur}/${maxPage}）` : "🕐 最近見た", weight: "bold", size: "lg", color: KABUKI.gold },
          { type: "text", text: `全${total}件`, size: "xs", color: KABUKI.dim },
          ...rows,
          ...(navBtns.length > 0 ? [{ type: "box", layout: "horizontal", spacing: "sm", margin: "md", contents: navBtns }] : [])
        ]
      },
      footer: logFooterFlex()
    }
  };
}

/* =========================================================
   ② 最近見た一覧 — Web UI
========================================================= */
export function recentListWeb(log, page = 1) {
  const all = log.recent || [];
  const total = all.length;
  const maxPage = Math.max(1, Math.ceil(total / RECENT_PER_PAGE));
  const cur = Math.min(Math.max(1, page), maxPage);
  const slice = all.slice((cur - 1) * RECENT_PER_PAGE, cur * RECENT_PER_PAGE);

  const items = slice.map(r => ({
    label: `${typeIcon(r.type)} ${r.title || "(不明)"}  ${relativeTime(r.ts)}`,
    action: recentActionWeb(r)
  }));

  const footer = [];
  if (cur > 1) footer.push({ label: "前へ", action: `postback:step=log_recent_list&page=${cur - 1}` });
  if (cur < maxPage) footer.push({ label: "次へ", action: `postback:step=log_recent_list&page=${cur + 1}` });
  if (total > 0) footer.push({ label: "🗑 履歴クリア", action: "postback:step=log_recent_clear" });
  footer.push({ label: "📋 マイページ", action: "postback:step=mypage" });
  footer.push({ label: "🧭 ナビ", action: "postback:step=navi_home" });

  return {
    reply: maxPage > 1 ? `🕐 最近見た（${cur}/${maxPage}）全${total}件` : `🕐 最近見た（全${total}件）`,
    ui: { type: "buttons", items, footer }
  };
}

/* =========================================================
   ③ クリップメニュー — LINE Flex
========================================================= */
export function clipsMenuFlex(log) {
  const clips = log.clips || {};
  const ec = (clips.enmoku || []).length;
  const pc = (clips.person || []).length;
  const tc = (clips.term || []).length;
  const total = ec + pc + tc;

  const btns = [
    { type: "button", style: "secondary", height: "sm", action: { type: "postback", label: `📜 演目（${ec}件）`, data: "step=log_clips_list&type=enmoku" } },
    { type: "button", style: "secondary", height: "sm", action: { type: "postback", label: `🎭 人物（${pc}件）`, data: "step=log_clips_list&type=person" } },
    { type: "button", style: "secondary", height: "sm", action: { type: "postback", label: `📖 用語（${tc}件）`, data: "step=log_clips_list&type=term" } },
  ];

  return {
    type: "flex", altText: "クリップ",
    contents: {
      type: "bubble",
      body: {
        type: "box", layout: "vertical", spacing: "sm",
        backgroundColor: KABUKI.bg, paddingAll: "16px",
        contents: [
          { type: "text", text: "⭐ クリップ", weight: "bold", size: "lg", color: KABUKI.gold },
          { type: "text", text: total > 0 ? `${total}件のクリップがあるよ🙂` : "まだクリップがないよ🙂\n気になる演目や用語で⭐保存してみてね！", size: "xs", color: KABUKI.dim, wrap: true },
          { type: "separator", margin: "sm" },
          ...btns
        ]
      },
      footer: logFooterFlex()
    }
  };
}

/* =========================================================
   ③ クリップメニュー — Web UI
========================================================= */
export function clipsMenuWeb(log) {
  const clips = log.clips || {};
  const ec = (clips.enmoku || []).length;
  const pc = (clips.person || []).length;
  const tc = (clips.term || []).length;
  const total = ec + pc + tc;

  return {
    reply: total > 0 ? `⭐ クリップ（${total}件）\nカテゴリをえらんでね🙂` : "⭐ クリップ\nまだクリップがないよ🙂\n気になる演目や用語で⭐保存してみてね！",
    ui: {
      type: "buttons",
      items: [
        { label: `📜 演目（${ec}件）`, action: "postback:step=log_clips_list&type=enmoku" },
        { label: `🎭 人物（${pc}件）`, action: "postback:step=log_clips_list&type=person" },
        { label: `📖 用語（${tc}件）`, action: "postback:step=log_clips_list&type=term" },
      ],
      footer: [
        { label: "📋 マイページ", action: "postback:step=mypage" },
        { label: "🧭 ナビ", action: "postback:step=navi_home" }
      ]
    }
  };
}

/* =========================================================
   ④ クリップ一覧 — LINE Flex
   items: 解決済みの [{ id, title, action_data }] 配列
========================================================= */
export function clipsListFlex(items, typeName, typeIcon_) {
  const rows = items.map(it => ({
    type: "box", layout: "horizontal", paddingAll: "8px",
    backgroundColor: KABUKI.card, cornerRadius: "8px",
    action: { type: "postback", label: (it.title || "").slice(0, 20), data: it.action_data },
    contents: [
      { type: "text", text: it.title || "(不明)", size: "sm", color: KABUKI.text, wrap: true, flex: 4 }
    ]
  }));

  if (rows.length === 0) {
    rows.push({ type: "text", text: `${typeName}のクリップはまだないよ🙂`, size: "xs", color: KABUKI.dim, wrap: true });
  }

  return {
    type: "flex", altText: `クリップ（${typeName}）`,
    contents: {
      type: "bubble",
      body: {
        type: "box", layout: "vertical", spacing: "sm",
        backgroundColor: KABUKI.bg, paddingAll: "16px",
        contents: [
          { type: "text", text: `${typeIcon_} クリップ（${typeName}）`, weight: "bold", size: "lg", color: KABUKI.gold },
          { type: "text", text: `${items.length}件`, size: "xs", color: KABUKI.dim },
          ...rows
        ]
      },
      footer: {
        type: "box", layout: "horizontal", spacing: "sm",
        contents: [
          { type: "button", style: "secondary", flex: 1, action: { type: "postback", label: "⭐ クリップ", data: "step=log_clips_menu" } },
          { type: "button", style: "secondary", flex: 1, action: { type: "postback", label: "🧭 ナビ", data: "step=navi_home" } }
        ]
      }
    }
  };
}

/* =========================================================
   ④ クリップ一覧 — Web UI
========================================================= */
export function clipsListWeb(items, typeName, typeIcon_) {
  const buttons = items.map(it => ({
    label: `${typeIcon_} ${it.title || "(不明)"}`,
    action: "postback:" + it.action_data
  }));

  return {
    reply: items.length > 0 ? `${typeIcon_} クリップ（${typeName} ${items.length}件）` : `${typeIcon_} クリップ（${typeName}）\nまだクリップがないよ🙂`,
    ui: {
      type: "buttons",
      items: buttons,
      footer: [
        { label: "⭐ クリップ", action: "postback:step=log_clips_menu" },
        { label: "📋 マイページ", action: "postback:step=mypage" },
        { label: "🧭 ナビ", action: "postback:step=navi_home" }
      ]
    }
  };
}

/* =========================================================
   ⑤ 復習メニュー — LINE Flex
========================================================= */
export function quizReviewFlex(quizState) {
  const wrongCount = (quizState?.wrong_ids || []).length;
  const answered = quizState?.answered_total || 0;
  const correct = quizState?.correct_total || 0;

  const btns = [];
  if (wrongCount > 0) {
    btns.push({ type: "button", style: "primary", color: KABUKI.red, height: "sm", action: { type: "postback", label: `復習を始める（${wrongCount}問）`, data: "mode=quiz" } });
  }
  if (answered > 0) {
    btns.push({ type: "button", style: "secondary", height: "sm", action: { type: "postback", label: `📊 成績：${correct}/${answered}問正解`, data: "mode=quiz" } });
  }

  const body = wrongCount > 0
    ? `間違えた問題が${wrongCount}問あるよ🙂\n復習で正解を目指そう！`
    : answered > 0
      ? "✅ 間違いはないよ！\n新しい問題に挑戦してみよう🙂"
      : "まだクイズに挑戦していないよ🙂\nクイズで歌舞伎の知識を試そう！";

  btns.push({ type: "button", style: "secondary", height: "sm", action: { type: "postback", label: "🧩 クイズに挑戦", data: "mode=quiz" } });

  return {
    type: "flex", altText: "クイズ復習",
    contents: {
      type: "bubble",
      body: {
        type: "box", layout: "vertical", spacing: "sm",
        backgroundColor: KABUKI.bg, paddingAll: "16px",
        contents: [
          { type: "text", text: "🧩 クイズ復習", weight: "bold", size: "lg", color: KABUKI.gold },
          { type: "text", text: body, size: "sm", color: KABUKI.text, wrap: true },
          { type: "separator", margin: "sm" },
          ...btns
        ]
      },
      footer: logFooterFlex()
    }
  };
}

/* =========================================================
   ⑤ 復習メニュー — Web UI
========================================================= */
export function quizReviewWeb(quizState) {
  const wrongCount = (quizState?.wrong_ids || []).length;
  const answered = quizState?.answered_total || 0;
  const correct = quizState?.correct_total || 0;

  const items = [];
  if (wrongCount > 0) items.push({ label: `復習を始める（${wrongCount}問）`, action: "5" });
  items.push({ label: "🧩 クイズに挑戦", action: "5" });

  const body = wrongCount > 0
    ? `間違えた問題が${wrongCount}問あるよ🙂 復習で正解を目指そう！`
    : answered > 0
      ? `✅ 間違いはないよ！ ${correct}/${answered}問正解 🎉`
      : "まだクイズに挑戦していないよ🙂";

  return {
    reply: "",
    ui: {
      type: "card",
      title: "🧩 クイズ復習",
      subtitle: answered > 0 ? `成績：${correct}/${answered}問正解` : "未挑戦",
      body,
      items,
      footer: [
        { label: "📋 マイページ", action: "postback:step=mypage" },
        { label: "🧭 ナビ", action: "postback:step=navi_home" }
      ]
    }
  };
}
