// src/featured_enmoku.js
// =========================================================
// 注目演目（Featured Enmoku）モジュール
// LIVE トップに表示する「今月/来月の注目」選定ロジック
// =========================================================
import { loadEnmokuCatalog } from "./flex_enmoku.js";

/* =========================================================
   有名演目ホワイトリスト
========================================================= */
const FAMOUS_TITLES = [
  "仮名手本忠臣蔵",
  "義経千本桜",
  "菅原伝授手習鑑",
  "勧進帳",
  "暫",
  "助六由縁江戸桜",
  "白浪五人男",
  "夏祭浪花鑑",
  "伽羅先代萩",
];

/* =========================================================
   normalizeTitle — 表記ゆれ正規化
   スケジュール上の演目名 ↔ NAVI カタログの演目名を照合するために使う
========================================================= */
const STRIP_SUFFIX_RE = new RegExp(
  "(" +
  [
    "[一二三四五六七八九十]+段目",
    "[一二三四五六七八九十]+幕目?",
    "[一二三四五六七八九十]*場",
    "の場",
    "序幕", "大序", "二幕目?", "三幕目?", "大詰",
    "口上", "立廻り", "所作事",
  ].join("|") +
  ")$"
);

const GENERAL_WORDS_RE = /(?:見取|通し狂言|新歌舞伎十八番の内|歌舞伎十八番の内|新版|新古演劇十種の内|[一二三]、)/g;

export function normalizeTitle(raw) {
  if (!raw) return "";
  let s = raw;

  // 全角/半角スペース除去
  s = s.replace(/[\s\u3000]+/g, "");

  // 記号除去
  s = s.replace(/[・、，．〜～—―\-()（）【】『』「」〈〉《》"'＝=□■◆◇○●▲△▼▽☆★♪♬♩※＊→←↓↑]/g, "");

  // 数字の正規化（全角→半角）
  s = s.replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFFF0));

  // 一般語を削除
  s = s.replace(GENERAL_WORDS_RE, "");

  // 末尾の段名・幕名・場名を削除（1回だけ）
  s = s.replace(STRIP_SUFFIX_RE, "");

  return s;
}

/* =========================================================
   countdown — 残り日数計算
========================================================= */
export function countdown(targetDateStr, now = new Date()) {
  if (!targetDateStr) return null;
  const target = new Date(targetDateStr + "T23:59:59+09:00");
  const nowJST = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const diffMs = target - nowJST;
  if (diffMs < 0) return null;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/* =========================================================
   shouldShowNextMonth — 来月ブロック表示判定
   ルール:
     - 当月15日以降 → 表示
     - 来月初日まで14日以内 → 表示
========================================================= */
export function shouldShowNextMonth(now = new Date()) {
  const jst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const day = jst.getDate();
  if (day >= 15) return true;

  const nextFirst = new Date(jst.getFullYear(), jst.getMonth() + 1, 1);
  const daysUntil = Math.ceil((nextFirst - jst) / (1000 * 60 * 60 * 24));
  return daysUntil <= 14;
}

/* =========================================================
   extractPlaysFromPerformances — 公演データから演目リストを抽出
   月ごとに { title, count, theaters[], startDate, endDate } を返す
========================================================= */
function extractPlaysFromPerformances(performances, monthKey) {
  const plays = new Map();

  for (const perf of performances) {
    const mk = perf.month_key;
    if (mk !== monthKey) continue;

    const programs = perf.programs || [];
    for (const prog of programs) {
      for (const play of (prog.plays || [])) {
        const title = play.title;
        if (!title) continue;
        const norm = normalizeTitle(title);
        if (!norm) continue;

        const existing = plays.get(norm);
        if (existing) {
          existing.count++;
          existing.rawTitles.add(title);
          if (perf.theater && !existing.theaters.includes(perf.theater)) {
            existing.theaters.push(perf.theater);
          }
        } else {
          plays.set(norm, {
            normalizedTitle: norm,
            rawTitles: new Set([title]),
            count: 1,
            theaters: perf.theater ? [perf.theater] : [],
            startDate: perf.start_date || null,
            endDate: perf.end_date || null,
          });
        }

        // start_date / end_date を最広範囲に更新
        if (existing) {
          if (perf.start_date && (!existing.startDate || perf.start_date < existing.startDate)) {
            existing.startDate = perf.start_date;
          }
          if (perf.end_date && (!existing.endDate || perf.end_date > existing.endDate)) {
            existing.endDate = perf.end_date;
          }
        }
      }
    }
  }

  return [...plays.values()];
}

/* =========================================================
   scorePlays — 演目にスコアを付与
   score = NAVI存在 +1000 / 有名演目 +100 / 登場回数×10
========================================================= */
function scorePlays(plays, naviMap, famousNorms) {
  return plays.map(p => {
    let score = 0;
    let naviId = null;

    // NAVI 存在チェック（正規化名で照合）
    if (naviMap.has(p.normalizedTitle)) {
      score += 1000;
      naviId = naviMap.get(p.normalizedTitle);
    } else {
      // 部分一致: NAVI側のキーが演目名に含まれるか
      for (const [naviNorm, id] of naviMap) {
        if (naviNorm.length >= 3 && p.normalizedTitle.includes(naviNorm)) {
          score += 1000;
          naviId = id;
          break;
        }
      }
    }

    // 有名演目チェック
    for (const fn of famousNorms) {
      if (p.normalizedTitle.includes(fn) || fn.includes(p.normalizedTitle)) {
        score += 100;
        break;
      }
    }

    // 登場回数
    score += p.count * 10;

    return { ...p, score, naviId };
  }).sort((a, b) => b.score - a.score);
}

/* =========================================================
   buildNaviMap — NAVI カタログから正規化名→IDマップを構築
========================================================= */
function buildNaviMap(catalog) {
  const map = new Map();
  for (const entry of catalog) {
    if (entry.short) map.set(normalizeTitle(entry.short), entry.id);
    if (entry.full && entry.full !== entry.short) {
      map.set(normalizeTitle(entry.full), entry.id);
    }
  }
  return map;
}

/* =========================================================
   pickFeatured — 注目演目を選定（メイン関数）

   performances: /api/performances で返される items 配列
   env: Workers env（R2 catalog 読み込み用）
   now: 現在日時（テスト用にオーバーライド可能）

   戻り値: {
     thisMonth: { title, score, naviId, countdown, startDate, endDate, theaters } | null,
     nextMonth: { ... } | null,
     showNextMonth: boolean,
     missed: [{ normalizedTitle, rawTitles, count, theaters }]  // LABO用
   }
========================================================= */
export async function pickFeatured(performances, env, now = new Date()) {
  const catalog = await loadEnmokuCatalog(env);
  const naviMap = buildNaviMap(catalog);
  const famousNorms = FAMOUS_TITLES.map(normalizeTitle);

  const jst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const thisMonthKey = jst.getFullYear() * 100 + (jst.getMonth() + 1);
  const nextMonthKey = jst.getMonth() === 11
    ? (jst.getFullYear() + 1) * 100 + 1
    : jst.getFullYear() * 100 + (jst.getMonth() + 2);

  // 今月の演目を抽出・スコア付け
  const thisPlays = extractPlaysFromPerformances(performances, thisMonthKey);
  const thisSorted = scorePlays(thisPlays, naviMap, famousNorms);

  // 来月の演目を抽出・スコア付け
  const nextPlays = extractPlaysFromPerformances(performances, nextMonthKey);
  const nextSorted = scorePlays(nextPlays, naviMap, famousNorms);

  const showNext = shouldShowNextMonth(now);

  // 注目を選ぶ（最高スコアの1件）
  const thisTop = thisSorted[0] || null;
  const nextTop = nextSorted[0] || null;

  function formatFeatured(play, isThisMonth) {
    if (!play) return null;
    const displayTitle = [...play.rawTitles][0];
    const days = isThisMonth
      ? countdown(play.endDate, now)
      : countdown(play.startDate, now);
    return {
      title: displayTitle,
      normalizedTitle: play.normalizedTitle,
      score: play.score,
      naviId: play.naviId,
      countdown: days,
      countdownLabel: isThisMonth ? "千穐楽まで" : "初日まで",
      startDate: play.startDate,
      endDate: play.endDate,
      theaters: play.theaters,
    };
  }

  // LABO用: NAVI未整備の候補リスト（今月＋来月、重複排除、スコア順）
  const allNoNavi = [...thisSorted, ...nextSorted].filter(p => !p.naviId);
  const seen = new Set();
  const missed = [];
  for (const p of allNoNavi) {
    if (seen.has(p.normalizedTitle)) continue;
    seen.add(p.normalizedTitle);
    missed.push({
      normalizedTitle: p.normalizedTitle,
      rawTitles: [...p.rawTitles],
      count: p.count,
      theaters: p.theaters,
      score: p.score,
    });
    if (missed.length >= 20) break;
  }

  return {
    thisMonth: formatFeatured(thisTop, true),
    nextMonth: formatFeatured(nextTop, false),
    showNextMonth: showNext,
    missed,
  };
}

/* =========================================================
   buildMissedList — LABO用の未整備候補リスト生成
   pickFeatured の結果から missed を取得して KV に保存する
========================================================= */
export async function saveMissedToKV(env, missed, monthKey) {
  if (!env.CHAT_HISTORY || !missed.length) return;
  const key = `missed:${monthKey}`;
  await env.CHAT_HISTORY.put(key, JSON.stringify(missed), {
    expirationTtl: 60 * 60 * 24 * 90, // 90日保持
  });
}

export async function loadMissedFromKV(env, monthKey) {
  if (!env.CHAT_HISTORY) return [];
  try {
    const val = await env.CHAT_HISTORY.get(`missed:${monthKey}`);
    return val ? JSON.parse(val) : [];
  } catch { return []; }
}
