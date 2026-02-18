// src/kabuki_bito.js
// =========================================================
// 歌舞伎美人（kabuki-bito.jp）公演情報スクレイピング
// 劇場ページHTML → 公演情報オブジェクト配列
// =========================================================

// ─── 劇場ソース定義 ───
export const THEATER_SOURCES = [
  { key: "kabukiza",   theater: "歌舞伎座",     url: "https://www.kabuki-bito.jp/theaters/kabukiza" },
  { key: "shinbashi",  theater: "新橋演舞場",   url: "https://www.kabuki-bito.jp/theaters/shinbashi" },
  { key: "osaka",      theater: "大阪松竹座",   url: "https://www.kabuki-bito.jp/theaters/osaka" },
  { key: "kyoto",      theater: "南座",         url: "https://www.kabuki-bito.jp/theaters/kyoto" },
  { key: "nagoya",     theater: "御園座",       url: "https://www.kabuki-bito.jp/theaters/nagoya" },
  { key: "hakataza",   theater: "博多座",       url: "https://www.kabuki-bito.jp/theaters/hakataza" },
];

// ─── 単一劇場ページのHTML → 公演情報配列 ───
export function parseKabukiBitoTheaterPage(html, src) {
  // ----------------------------------------------------------
  // A) まず「公演詳細（/play/数字）」リンクをHTMLから順番に抜く
  //    ※同ページ内の順序＝公演カードの順序、という前提でひも付け
  // ----------------------------------------------------------
  const playUrls = [];
  {
    const re = /href="([^"]*\/theaters\/[^"]+\/play\/\d+[^"]*)"/g;
    const seen = new Set();

    let m;
    while ((m = re.exec(html)) !== null) {
      let href = m[1];

      // 相対→絶対
      if (href.startsWith("//")) href = "https:" + href;
      else if (href.startsWith("/")) href = "https://www.kabuki-bito.jp" + href;

      // 余計なクエリ/アンカーは落とす
      href = href.split("#")[0];

      if (!href.includes("/play/")) continue;
      if (seen.has(href)) continue;
      seen.add(href);
      playUrls.push(href);
    }
  }

  // ----------------------------------------------------------
  // B) HTML → テキスト（雑にタグ除去）して、行スキャンで公演情報を抜く
  // ----------------------------------------------------------
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    // 見出しタグ → Markdown風マーカーに変換してからタグ除去
    .replace(/<h2[^>]*>/gi, "\n## ")
    .replace(/<h3[^>]*>/gi, "\n### ")
    .replace(/<h4[^>]*>/gi, "\n#### ")
    .replace(/<\/(p|div|li|h1|h2|h3|h4|br|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  const lines = text
    .split("\n")
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  // 「◯◯ 公演情報」以降だけ見る
  const startKey = `${src.theater} 公演情報`;
  const startIdx = lines.findIndex((l) => l.includes(startKey));
  if (startIdx < 0) return [];

  // セクション終端の目安
  const endIdx =
    lines.findIndex(
      (l, i) =>
        i > startIdx &&
        (l.includes("アクセス") ||
          l.includes("客席表") ||
          l.includes("について") ||
          l.includes("※公演日"))
    ) || lines.length;

  const section = lines.slice(startIdx, endIdx);

  // ----------------------------------------------------------
  // C) 公演ブロック抽出：見出し(##)ごとにまとめる
  //    その都度、playUrls から順番にURLを1個割り当てる
  // ----------------------------------------------------------
  let urlIdx = 0;
  const items = [];

  for (let i = 0; i < section.length; i++) {
    const l = section[i];

    // 劇場ページのテキスト化では見出しが「##」や「## タイトル」になることが多い
    if (l === "##" || l.startsWith("## ")) {
      let title = l.startsWith("## ") ? l.slice(3).trim() : (section[i + 1] || "").trim();
      if (!title || title.includes("公演情報")) continue;

      let j = i + 1;

      let subtitle = null;
      let status = null;
      let period_text = null;
      const times = [];
      const notes = [];

      for (; j < section.length; j++) {
        const x = section[j];
        if (x === "##" || x.startsWith("## ")) break;

        if (!subtitle && x.startsWith("#### ")) subtitle = x.slice(5).trim();

        if (!status && (x.includes("チケット") || x.includes("好評販売中") || x.includes("発売予定"))) {
          status = x;
          continue;
        }

        if (!period_text && /20\d{2}年/.test(x) && x.includes("～")) {
          period_text = x;
          continue;
        }

        if (/(午前|午後|夜|昼).*(時|分|～)/.test(x)) {
          times.push(x);
          continue;
        }

        if (x.includes("休演") || x.includes("貸切") || x.includes("終演予定") || x.includes("学校団体")) {
          notes.push(x);
          continue;
        }
      }

      // 各公演に「公演詳細URL」を付ける
      const detailUrl = playUrls[urlIdx] || src.url;
      if (playUrls[urlIdx]) urlIdx++;

      items.push({
        theater: src.theater,
        title,
        subtitle,
        status,
        period_text,
        times,
        notes,
        url: detailUrl,
        source: "kabuki-bito",
      });

      i = j - 1;
    }
  }

  // 重複除去（同劇場・同タイトル・同期間）
  const uniq = new Map();
  for (const it of items) {
    const key = `${it.theater}__${it.title}__${it.period_text || ""}`;
    if (!uniq.has(key)) uniq.set(key, it);
  }
  return [...uniq.values()];
}

// ─── 公演詳細ページから演目リスト（昼の部/夜の部）を抽出 ───
// kabuki-bito の公演詳細ページ構造（実測済み）:
//   <h3>演目と配役</h3>
//     <h4 class="type-centerline">昼の部</h4>     ← 部立て
//     <h4 class="enmoku_modal_tsuno">○○ 作</h4>  ← クレジット
//     <h5 class="enmoku_modal_main">一、演目名</h5>← ★本当の演目名
//     <h4 class="enmoku_f_small">場名</h4>         ← 場の名前
//   <h3>みどころ</h3>                              ← 終端
export function parsePerformanceDetailPage(html) {
  // ─── 「演目と配役」セクションを切り出す ───
  // id="cast" アンカーを基点にして、ナビゲーション内の同名テキストを回避
  let castStart = html.indexOf('id="cast"');
  if (castStart < 0) {
    // フォールバック: h3 タグ内の「演目と配役」を探す
    const h3Re = /<h3[^>]*>[\s\S]*?演目と配役[\s\S]*?<\/h3>/i;
    const h3m = h3Re.exec(html);
    if (!h3m) return [];
    castStart = h3m.index;
  }
  const castEnd = html.indexOf("みどころ", castStart + 10);
  const section = castEnd > 0 ? html.slice(castStart, castEnd) : html.slice(castStart);

  // ─── テキスト抽出ヘルパー ───
  function stripTags(s) {
    return s
      .replace(/<span[^>]*class="enmoku_f75"[^>]*>[\s\S]*?<\/span>/gi, "") // 読み仮名除去
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&hellip;/g, "…")
      .replace(/\s+/g, " ")
      .trim();
  }

  // ─── 配役テーブルのパース ───
  function parseCastTable(tableHtml) {
    const cast = [];
    // haiyaku_name 列（役名）を探す（haiyaku_name_maku を除外）
    const roleColRe = /<td[^>]*class="[^"]*\bhaiyaku_name\b(?!_)[^"]*"[^>]*>([\s\S]*?)<\/td>/i;
    const roleMatch = roleColRe.exec(tableHtml);
    if (!roleMatch) return cast;

    // 役名列の後の次の td を取得（役者名列）
    const afterRoleCol = tableHtml.slice(roleMatch.index + roleMatch[0].length);
    const actorColRe = /<td[^>]*>([\s\S]*?)<\/td>/i;
    const actorMatch = actorColRe.exec(afterRoleCol);
    if (!actorMatch) return cast;

    // <br> で分割してペアリング
    const roles = roleMatch[1].split(/<br\s*\/?>/i).map(s => stripTags(s)).filter(Boolean);
    const actors = actorMatch[1].split(/<br\s*\/?>/i).map(s => {
      // <span class="enmoku_f75/enmoku_light"> 等の装飾除去
      let cleaned = s.replace(/<span[^>]*class="[^"]*enmoku_[^"]*"[^>]*>[\s\S]*?<\/span>/gi, "");
      // <span class="blank1"> の除去（スペース調整用）
      cleaned = cleaned.replace(/<span[^>]*class="blank1"[^>]*>([\s\S]*?)<\/span>/gi, "$1");
      // <div> 内のテキストも取得
      cleaned = cleaned.replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, "$1");
      return stripTags(cleaned);
    }).filter(Boolean);

    // 1対1でペアリング
    const len = Math.min(roles.length, actors.length);
    for (let i = 0; i < len; i++) {
      if (roles[i] && actors[i]) {
        cast.push({ role: roles[i], actor: actors[i] });
      }
    }
    return cast;
  }

  // ─── セクション内の要素を順序走査 ───
  // h4(部立て), h5(演目名), table(配役) を順番に検出
  const elementRe = /<(h4|h5|table)([^>]*)>([\s\S]*?)<\/\1>/gi;
  const PART_RE = /^(昼の部|夜の部|第[一二三四五]部|[一二三]部|[Ａ-Ｚ]プロ)/;

  const programs = [];
  let currentProgram = null;
  let lastPlay = null; // 直前に見つけた演目（配役テーブルを紐づけるため）
  let lastPlayHasCast = false; // 配役テーブル取得済みフラグ

  let em;
  while ((em = elementRe.exec(section)) !== null) {
    const tag = em[1].toLowerCase();
    const attrs = em[2] || "";
    const inner = em[3];

    if (tag === "h4") {
      const text = stripTags(inner);
      if (PART_RE.test(text)) {
        currentProgram = { program: text, plays: [] };
        programs.push(currentProgram);
        lastPlay = null;
        lastPlayHasCast = false;
      } else if (lastPlay && text && !lastPlayHasCast) {
        // h5（演目名）と table（配役）の間にある h4 は場面名
        // 例: 陣門 組打、猿若座芝居前 等
        // 配役テーブルの後の h4 は次の演目の作者名等なので除外
        lastPlay.scenes = text;
      }
    }

    if (tag === "h5") {
      const clsMatch = attrs.match(/class="([^"]*)"/);
      const cls = clsMatch ? clsMatch[1] : "";
      if (cls.includes("enmoku_modal_main")) {
        const title = stripTags(inner).replace(/^[一二三四五六七八九十]+、\s*/, "").trim();
        if (title) {
          const playObj = { title, cast: [] };
          if (currentProgram) {
            currentProgram.plays.push(playObj);
          } else {
            currentProgram = { program: "", plays: [playObj] };
            programs.push(currentProgram);
          }
          lastPlay = playObj;
          lastPlayHasCast = false;
        }
      }
    }

    if (tag === "table") {
      const clsMatch = attrs.match(/class="([^"]*)"/);
      const cls = clsMatch ? clsMatch[1] : "";
      if (cls.includes("haiyaku") && lastPlay) {
        lastPlay.cast = parseCastTable(em[0]);
        lastPlayHasCast = true;
      }
    }
  }

  return programs;
}

// ─── 公演詳細ページのfetch＋パース（8秒タイムアウト付き） ───
async function fetchPerformanceDetail(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "KABUKI+ Bot/1.0 (+https://kerakabuki.kerakabuki.workers.dev)",
        Accept: "text/html",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return [];
    const html = await res.text();
    return parsePerformanceDetailPage(html);
  } catch {
    return [];
  }
}

// ─── 単一劇場のfetch＋パース ───
export async function fetchTheaterPerformances(src) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(src.url, {
      headers: {
        "User-Agent": "KABUKI+ Bot/1.0 (+https://kerakabuki.kerakabuki.workers.dev)",
        Accept: "text/html",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      console.warn(`[kabuki-bito] ${src.theater} HTTP ${res.status}`);
      return [];
    }
    const html = await res.text();
    return parseKabukiBitoTheaterPage(html, src);
  } catch (err) {
    console.error(`[kabuki-bito] ${src.theater} fetch error:`, err.message);
    return [];
  }
}

// ─── 全劇場の公演情報を一括取得（演目リスト付き） ───
export async function fetchAllTheaterPerformances() {
  // 1. 各劇場の公演一覧を取得
  const results = await Promise.allSettled(
    THEATER_SOURCES.map((src) => fetchTheaterPerformances(src))
  );
  const all = [];
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
  }

  // 2. 各公演の詳細ページから演目リストを取得（3件ずつバッチ処理）
  const toFetch = all.filter(p => p.url && p.url !== p.source);
  const BATCH = 3;
  for (let i = 0; i < toFetch.length; i += BATCH) {
    const batch = toFetch.slice(i, i + BATCH);
    await Promise.allSettled(
      batch.map(async (perf) => {
        const programs = await fetchPerformanceDetail(perf.url);
        if (programs.length > 0) {
          perf.programs = programs;
        }
      })
    );
  }

  console.log(`[kabuki-bito] Fetched details: ${all.filter(p => p.programs).length}/${all.length} with programs`);
  return all;
}

// ─── KVキャッシュ付き取得 ───
// env.CHAT_HISTORY に "kabuki-bito:performances" キーで保存
// TTL: 6時間（cron で更新する前提）
const KV_KEY = "kabuki-bito:performances";
const KV_TTL_SEC = 13 * 60 * 60; // 13h（Cron 12h間隔より長く保持し空白を防ぐ）

export async function getPerformancesCached(env) {
  const cached = await env.CHAT_HISTORY.get(KV_KEY, "json");
  if (cached && Array.isArray(cached.items)) {
    return cached;
  }
  // キャッシュなし → 空を即時返却（ライブフェッチはしない）
  // Cronが12h間隔で実行し、TTL 13hで常にキャッシュが存在する前提
  // 空の場合はクライアントの「今すぐ取得を試す」ボタンで /api/performances-fetch を呼ぶ
  return { items: [], count: 0, fetched_at: null };
}

export async function refreshPerformancesCache(env) {
  // Cloudflare Worker の30秒壁時計制限に収めるため25秒タイムアウト
  const items = await Promise.race([
    fetchAllTheaterPerformances(),
    new Promise(resolve => setTimeout(() => resolve([]), 25000)),
  ]);
  if (!items.length) {
    console.log("[kabuki-bito] refreshPerformancesCache: no items fetched (timeout or all failed)");
    return { items: [], count: 0, fetched_at: new Date().toISOString() };
  }
  const payload = {
    items,
    fetched_at: new Date().toISOString(),
    count: items.length,
  };
  await env.CHAT_HISTORY.put(KV_KEY, JSON.stringify(payload), {
    expirationTtl: KV_TTL_SEC,
  });
  console.log(`[kabuki-bito] Cached ${items.length} performances`);
  return payload;
}
