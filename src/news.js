// src/news.js
// =========================================================
// Google News RSS → KV キャッシュ
// =========================================================

const GOOGLE_NEWS_RSS = "https://news.google.com/rss/search";

/** 取得するフィード定義 */
const NEWS_FEEDS = [
  { key: "kabuki",    query: '"歌舞伎" -歌舞伎町 -新宿',  label: "歌舞伎" },
  { key: "jikabuki",  query: "地歌舞伎 OR 地芝居",        label: "地歌舞伎" },
];

/** タイトルにこれらを含む記事は除外（ゴシップ/犯罪報道フィルタ） */
const BLOCK_WORDS = [
  "歌舞伎町", "逮捕", "不倫", "事件", "容疑", "書類送検",
  "暴行", "詐欺", "薬物", "覚醒剤", "大麻", "スキャンダル",
  "不祥事", "熱愛", "離婚", "死亡事故", "殺人", "傷害",
];

/** KVキー */
const NEWS_KV_KEY = "news:latest";

// ─── 地歌舞伎団体名バッチクエリでニュース取得 ───
async function fetchJikabukiGroupNews(env) {
  if (!env?.CONTENT_BUCKET) return [];
  try {
    const obj = await env.CONTENT_BUCKET.get("jikabuki_groups.json");
    if (!obj) {
      console.log("jikabuki_groups.json not found in R2 — skipping group news");
      return [];
    }
    const data = await obj.json();
    const allKeywords = data.groups.flatMap(g => g.keywords);
    console.log(`Jikabuki groups: ${data.groups.length} groups, ${allKeywords.length} keywords`);

    const BATCH_SIZE = 12;
    const batches = [];
    for (let i = 0; i < allKeywords.length; i += BATCH_SIZE) {
      batches.push(allKeywords.slice(i, i + BATCH_SIZE));
    }

    const articles = [];
    for (let bi = 0; bi < batches.length; bi++) {
      const batch = batches[bi];
      const query = batch.map(k => `"${k}"`).join(" OR ");
      try {
        const url = `${GOOGLE_NEWS_RSS}?q=${encodeURIComponent(query)}&hl=ja&gl=JP&ceid=JP:ja`;
        const res = await fetch(url, {
          headers: { "User-Agent": "KeraKabukiBot/1.0" },
        });
        if (!res.ok) {
          console.error(`Jikabuki batch ${bi + 1}/${batches.length} failed: ${res.status}`);
          continue;
        }
        const xml = await res.text();
        const items = parseRSSItems(xml);
        items.forEach(item => {
          item.category = "地歌舞伎";
          item.feedKey = "jikabuki";
        });
        articles.push(...items);
        console.log(`Jikabuki batch ${bi + 1}/${batches.length}: ${items.length} articles`);
      } catch (e) {
        console.error(`Jikabuki batch ${bi + 1} error:`, String(e?.stack || e));
      }
      if (bi < batches.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // タイトルに団体名キーワードが含まれるか事後フィルタ（Google Newsの誤マッチ除外）
    const JIKABUKI_GENERIC = ["地歌舞伎", "地芝居", "歌舞伎", "農村歌舞伎"];
    const filtered = articles.filter(a => {
      const t = a.title;
      return allKeywords.some(k => t.includes(k)) ||
             JIKABUKI_GENERIC.some(w => t.includes(w));
    });
    console.log(`Jikabuki group news: ${articles.length} raw → ${filtered.length} after title filter`);
    return filtered;
  } catch (e) {
    console.error("fetchJikabukiGroupNews error:", String(e?.stack || e));
    return [];
  }
}

// ─── Cron から呼ぶ：RSS取得 → パース → KV保存 ───
async function fetchAndCacheNews(env) {
  const allArticles = [];

  for (const feed of NEWS_FEEDS) {
    try {
      const url = `${GOOGLE_NEWS_RSS}?q=${encodeURIComponent(feed.query)}&hl=ja&gl=JP&ceid=JP:ja`;
      const res = await fetch(url, {
        headers: { "User-Agent": "KeraKabukiBot/1.0" },
      });
      if (!res.ok) {
        console.error(`News RSS fetch failed (${feed.key}): ${res.status}`);
        continue;
      }
      const xml = await res.text();
      const items = parseRSSItems(xml);
      items.forEach(item => {
        item.category = feed.label;
        item.feedKey = feed.key;
      });
      allArticles.push(...items);
    } catch (e) {
      console.error(`News fetch error (${feed.key}):`, String(e?.stack || e));
    }
  }

  // 地歌舞伎団体名バッチクエリの結果をマージ
  const groupArticles = await fetchJikabukiGroupNews(env);
  allArticles.push(...groupArticles);

  // kabukiフィードから地歌舞伎記事を再分類（jikabukiフィード側で拾う）
  // 団体名キーワードも使って判定
  const JIKABUKI_WORDS = ["地歌舞伎", "地芝居"];
  let groupKeywords = [];
  try {
    if (env?.CONTENT_BUCKET) {
      const obj = await env.CONTENT_BUCKET.get("jikabuki_groups.json");
      if (obj) {
        const gd = await obj.json();
        groupKeywords = gd.groups.flatMap(g => g.keywords);
      }
    }
  } catch (_) { /* ignore */ }
  for (const a of allArticles) {
    if (a.feedKey === "kabuki") {
      const isJikabuki = JIKABUKI_WORDS.some(w => a.title.includes(w)) ||
                          groupKeywords.some(k => a.title.includes(k));
      if (isJikabuki) {
        a.feedKey = "jikabuki";
        a.category = "地歌舞伎";
      }
    }
  }

  // 重複排除（タイトル先頭30文字で判定）
  const seen = new Set();
  const unique = allArticles.filter(a => {
    const k = a.title.replace(/\s+/g, "").slice(0, 30);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // NGワードフィルタ（ゴシップ/犯罪報道を除外）
  const clean = unique.filter(a =>
    !BLOCK_WORDS.some(w => a.title.includes(w))
  );

  // 日付降順ソート → 最新20件
  clean.sort((a, b) => (b.pubTs || 0) - (a.pubTs || 0));
  const top = clean.slice(0, 20);

  // 0件のときは既存キャッシュを保持（RSSが一時的に取得できなかった場合の保護）
  if (top.length === 0) {
    console.log("News fetch returned 0 articles — keeping existing cache");
    return [];
  }

  // KV保存（TTL 24時間）
  const payload = {
    articles: top,
    updatedAt: new Date().toISOString(),
  };
  await env.CHAT_HISTORY.put(NEWS_KV_KEY, JSON.stringify(payload), {
    expirationTtl: 86400,
  });

  console.log(`News cached: ${top.length} articles`);
  return top;
}

// ─── KVからキャッシュ読み出し ───
async function getCachedNews(env) {
  try {
    const raw = await env.CHAT_HISTORY.get(NEWS_KV_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─── RSS XML パーサ（軽量・依存なし）───
function parseRSSItems(xml) {
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;

  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];

    const title  = extractTag(block, "title");
    const link   = extractLink(block);
    const pubStr = extractTag(block, "pubDate");
    const source = extractTag(block, "source");

    if (!title || !link) continue;

    // Google News のタイトルは「記事タイトル - メディア名」形式
    // source タグがあればそちらを使い、タイトルからメディア名を除去
    let cleanTitle = title;
    if (source) {
      const suffix = ` - ${source}`;
      if (cleanTitle.endsWith(suffix)) {
        cleanTitle = cleanTitle.slice(0, -suffix.length);
      }
    }

    items.push({
      title: cleanTitle || title,
      source: source || "",
      link,
      pubTs:  pubStr ? new Date(pubStr).getTime() : 0,
      pubStr: pubStr || "",
    });
  }

  return items;
}

function extractTag(xml, tag) {
  // CDATA 対応
  const cdRe = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`);
  const cd = cdRe.exec(xml);
  if (cd) return cd[1].trim();

  const re = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`);
  const m = re.exec(xml);
  return m ? decodeXML(m[1].trim()) : "";
}

function extractLink(block) {
  // <link>URL</link> or <link/>URL (RSS quirk)
  const m = /<link[^>]*>([^<]+)<\/link>/.exec(block);
  if (m) return m[1].trim();
  // 一部フィードで <link/> の直後にURLがある
  const m2 = /<link\s*\/>\s*(https?:\/\/[^\s<]+)/.exec(block);
  return m2 ? m2[1].trim() : "";
}

function decodeXML(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

// ─── 日付フォーマット ───
function formatNewsDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const mo = d.getMonth() + 1;
  const dy = d.getDate();
  return `${mo}/${dy}`;
}

// ─── 半年分バックフィル（テスト用・手動実行） ───
async function backfillNews(env) {
  const allArticles = [];
  // 半年分を月単位で取得（2025-08 〜 2026-02）
  const ranges = [
    { after: "2025-08-15", before: "2025-09-15" },
    { after: "2025-09-15", before: "2025-10-15" },
    { after: "2025-10-15", before: "2025-11-15" },
    { after: "2025-11-15", before: "2025-12-15" },
    { after: "2025-12-15", before: "2026-01-15" },
    { after: "2026-01-15", before: "2026-02-16" },
  ];

  for (const range of ranges) {
    for (const feed of NEWS_FEEDS) {
      try {
        const q = `${feed.query} after:${range.after} before:${range.before}`;
        const url = `${GOOGLE_NEWS_RSS}?q=${encodeURIComponent(q)}&hl=ja&gl=JP&ceid=JP:ja&num=100`;
        const res = await fetch(url, {
          headers: { "User-Agent": "KeraKabukiBot/1.0" },
        });
        if (!res.ok) {
          console.error(`Backfill fetch failed (${feed.key} ${range.after}): ${res.status}`);
          continue;
        }
        const xml = await res.text();
        const items = parseRSSItems(xml);
        items.forEach(item => {
          item.category = feed.label;
          item.feedKey = feed.key;
        });
        allArticles.push(...items);
        console.log(`Backfill: ${feed.key} ${range.after}~${range.before} → ${items.length} articles`);
      } catch (e) {
        console.error(`Backfill error (${feed.key} ${range.after}):`, String(e?.stack || e));
      }
    }
  }

  // 地歌舞伎団体名バッチクエリの結果もマージ
  const groupArticles = await fetchJikabukiGroupNews(env);
  allArticles.push(...groupArticles);
  console.log(`Backfill: added ${groupArticles.length} articles from group name queries`);

  // 地歌舞伎の再分類
  const JIKABUKI_WORDS = ["地歌舞伎", "地芝居"];
  for (const a of allArticles) {
    if (a.feedKey === "kabuki" && JIKABUKI_WORDS.some(w => a.title.includes(w))) {
      a.feedKey = "jikabuki";
      a.category = "地歌舞伎";
    }
  }

  // 重複排除
  const seen = new Set();
  const unique = allArticles.filter(a => {
    const k = a.title.replace(/\s+/g, "").slice(0, 30);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // NGワードフィルタ
  const clean = unique.filter(a =>
    !BLOCK_WORDS.some(w => a.title.includes(w))
  );

  // 日付降順ソート → 最大200件
  clean.sort((a, b) => (b.pubTs || 0) - (a.pubTs || 0));
  const top = clean.slice(0, 200);

  if (top.length === 0) {
    return { count: 0, message: "No articles found" };
  }

  // KV保存（TTL 7日 = テスト期間中長めに保持）
  const payload = {
    articles: top,
    updatedAt: new Date().toISOString(),
    backfilled: true,
  };
  await env.CHAT_HISTORY.put(NEWS_KV_KEY, JSON.stringify(payload), {
    expirationTtl: 604800,
  });

  console.log(`Backfill cached: ${top.length} articles (from ${allArticles.length} raw)`);
  return { count: top.length, raw: allArticles.length };
}

// ─── 俳優名で過去ニュースをリアルタイム検索 ───
async function searchActorNews(actorName, months = 6) {
  const allArticles = [];
  const now = new Date();
  const afterDate = new Date(now);
  afterDate.setMonth(afterDate.getMonth() - months);
  const afterStr = afterDate.toISOString().slice(0, 10);
  const beforeStr = now.toISOString().slice(0, 10);

  const query = `"${actorName}" 歌舞伎 after:${afterStr} before:${beforeStr}`;
  try {
    const url = `${GOOGLE_NEWS_RSS}?q=${encodeURIComponent(query)}&hl=ja&gl=JP&ceid=JP:ja&num=100`;
    const res = await fetch(url, {
      headers: { "User-Agent": "KeraKabukiBot/1.0" },
    });
    if (!res.ok) {
      console.error(`Actor news search failed (${actorName}): ${res.status}`);
      return [];
    }
    const xml = await res.text();
    const items = parseRSSItems(xml);
    items.forEach(item => { item.searchActor = actorName; });
    allArticles.push(...items);
  } catch (e) {
    console.error(`Actor news search error (${actorName}):`, String(e?.stack || e));
  }

  // 重複排除
  const seen = new Set();
  const unique = allArticles.filter(a => {
    const k = a.title.replace(/\s+/g, "").slice(0, 30);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // NGワードフィルタ
  const clean = unique.filter(a =>
    !BLOCK_WORDS.some(w => a.title.includes(w))
  );

  // 日付降順ソート → 最大50件
  clean.sort((a, b) => (b.pubTs || 0) - (a.pubTs || 0));
  return clean.slice(0, 50);
}

export {
  fetchAndCacheNews,
  getCachedNews,
  backfillNews,
  searchActorNews,
  fetchJikabukiGroupNews,
  formatNewsDate,
  NEWS_FEEDS,
  NEWS_KV_KEY,
};
