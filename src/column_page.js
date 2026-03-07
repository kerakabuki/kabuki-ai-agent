// src/column_page.js
// =========================================================
// コラムページ — /kabuki/navi/column, /kabuki/navi/column/:id
// note記事をリライトした独自コンテンツ読み物ページ
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";

const CATEGORY_LABELS = {
  serifu: "台詞解説・超訳",
  guide: "初心者向け演目ガイド",
  report: "活動報告・お知らせ",
};

const CATEGORY_ICONS = {
  serifu: "🎤",
  guide: "📘",
  report: "📣",
};

// シリーズ表示名
const SERIES_LABELS = {
  serifu: "台詞解説・超訳",
  research: "研究紀行",
  guide: "初心者ガイド",
};

const SERIES_BADGE_COLORS = {
  serifu: "var(--kin, #A8873A)",
  research: "#6B7FA3",
  guide: "#5B8C5A",
};

// 演目表示名マッピング
const ENMOKU_DISPLAY = {
  shiranami: { name: "白浪五人男", sub: "青砥稿花紅彩画" },
  kotobukisoga: { name: "寿曽我対面", sub: "" },
  fuuinkiri: { name: "封印切", sub: "恋飛脚大和往来" },
  yowanasake: { name: "切られ与三", sub: "与話情浮名横櫛" },
  sonezakisinju: { name: "曽根崎心中", sub: "" },
  sanninkichisa: { name: "三人吉三", sub: "三人吉三巴白浪" },
};

// =========================================================
// コラム一覧ページ
// =========================================================
export function columnListPageHTML({ columns = [], googleClientId = "" } = {}) {
  const e = escHTML;

  // 演目別にグループ化（guide も serifu も統合）
  const enmokuGroups = {};
  for (const col of columns) {
    const eid = col.enmoku_id || "_other";
    if (!enmokuGroups[eid]) enmokuGroups[eid] = [];
    enmokuGroups[eid].push(col);
  }
  // グループを記事数の多い順にソート
  const enmokuOrder = Object.keys(enmokuGroups)
    .sort((a, b) => enmokuGroups[b].length - enmokuGroups[a].length);

  let cardsHTML = "";

  for (const eid of enmokuOrder) {
    const items = enmokuGroups[eid];
    const enmoku = ENMOKU_DISPLAY[eid] || { name: eid, sub: "" };
    const totalCount = items.length;

    cardsHTML += `<section class="col-enmoku-group fade-up">
      <h2 class="col-enmoku-title">
        ${e(enmoku.name)}
        <span class="col-count">${totalCount}本</span>
      </h2>`;
    if (enmoku.sub) {
      cardsHTML += `<p class="col-enmoku-sub">${e(enmoku.sub)}</p>`;
    }
    if (eid !== "_other") {
      cardsHTML += `<p class="col-enmoku-link"><a href="/kabuki/navi/enmoku/${encodeURIComponent(eid)}">この演目のガイドを見る →</a></p>`;
    }

    // シリーズ別にグループ化（series フィールド）
    const seriesGroups = {};
    for (const col of items) {
      const s = col.series || col.category || "_none";
      if (!seriesGroups[s]) seriesGroups[s] = [];
      seriesGroups[s].push(col);
    }
    // 各シリーズ内で日付順（古い順＝連載順）
    for (const g of Object.values(seriesGroups)) {
      g.sort((a, b) => (a.created || "").localeCompare(b.created || ""));
    }
    // シリーズ表示順: serifu → research → guide → その他
    const seriesOrder = ["serifu", "research", "guide", "_none"];
    const sortedSeries = Object.keys(seriesGroups).sort((a, b) => {
      const ai = seriesOrder.indexOf(a); const bi = seriesOrder.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    const hasMultipleSeries = sortedSeries.length > 1;

    for (const sid of sortedSeries) {
      const seriesItems = seriesGroups[sid];
      const seriesLabel = SERIES_LABELS[sid] || "";
      if (hasMultipleSeries && seriesLabel) {
        cardsHTML += `<div class="col-series-heading">${e(seriesLabel)}<span class="col-series-count">${seriesItems.length}本</span></div>`;
      }
      for (const col of seriesItems) {
        cardsHTML += buildCard(e, col);
      }
    }

    cardsHTML += `</section>`;
  }

  if (!columns.length) {
    cardsHTML = `<div class="empty-state">コラム記事はまだありません。</div>`;
  }

  // 総記事数
  const totalCount = columns.length;

  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span><a href="/kabuki/navi">KABUKI NAVI</a><span>›</span><span>コラム</span>
    </div>

    <section class="col-intro fade-up">
      <p class="col-lead">
        歌舞伎の名台詞や演目の魅力を、初心者にもわかりやすく解説。<br>
        観劇前の予習にも、観劇後の復習にもどうぞ。
      </p>
      <div class="col-stats">${totalCount}本の記事</div>
    </section>

    ${cardsHTML}

    <div class="col-footer fade-up">
      <a href="/kabuki/navi" class="btn btn-secondary">← KABUKI NAVI に戻る</a>
    </div>
  `;

  return pageShell({
    title: "コラム",
    subtitle: "歌舞伎よみもの",
    bodyHTML,
    activeNav: "navi",
    googleClientId,
    ogDesc: "白浪五人男・寿曽我対面・封印切など、歌舞伎の名台詞を現代語訳で徹底解説。初心者向け演目ガイドも。",
    ogUrl: "https://kabukiplus.com/kabuki/navi/column",
    canonicalUrl: "https://kabukiplus.com/kabuki/navi/column",
    headExtra: `<style>
      .col-intro {
        text-align: center;
        padding: 20px 16px 28px;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 24px;
      }
      .col-lead {
        font-size: 14.5px;
        line-height: 1.9;
        color: var(--text-secondary);
        letter-spacing: 0.06em;
      }
      .col-stats {
        margin-top: 10px;
        font-size: 0.8rem;
        color: var(--text-tertiary);
      }
      .col-enmoku-group {
        margin-bottom: 2.5rem;
      }
      .col-enmoku-title {
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--text-primary);
        font-family: 'Noto Serif JP', serif;
        margin: 0 0 0.3rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid var(--kin, #A8873A);
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }
      .col-count {
        font-size: 0.72rem;
        font-weight: 600;
        color: var(--gold-dark, #8B7355);
        background: var(--gold-soft, #FFF8E7);
        border: 1px solid var(--gold-light, #D4C5A0);
        border-radius: 999px;
        padding: 1px 8px;
        margin-left: auto;
      }
      .col-enmoku-sub {
        font-size: 0.78rem;
        color: var(--text-tertiary);
        margin: 0 0 0.2rem;
        font-style: italic;
      }
      .col-enmoku-link {
        margin: 0 0 0.5rem;
        font-size: 0.8rem;
      }
      .col-enmoku-link a {
        color: var(--kin, #A8873A);
        text-decoration: none;
        font-weight: 600;
      }
      .col-enmoku-link a:hover { text-decoration: underline; }
      .col-enmoku-desc {
        font-size: 0.82rem;
        color: var(--text-secondary);
        margin: 0 0 0.6rem;
        line-height: 1.6;
      }
      .col-card {
        display: block;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-light, #e5e5e5);
        text-decoration: none;
        color: inherit;
        transition: background 0.15s;
      }
      .col-card:hover {
        background: var(--bg-subtle, #f9f9f9);
      }
      .col-card-top {
        display: flex;
        align-items: baseline;
        gap: 8px;
      }
      .col-card-title {
        font-size: 0.93rem;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1.5;
        flex: 1;
      }
      .col-series-heading {
        font-size: 0.82rem;
        font-weight: 700;
        color: var(--text-secondary);
        margin: 1rem 0 0.3rem;
        padding: 4px 0 4px 10px;
        border-left: 3px solid var(--kin, #A8873A);
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .col-series-count {
        font-size: 0.7rem;
        font-weight: 500;
        color: var(--text-tertiary);
      }
      .col-card-badge {
        font-size: 0.65rem;
        font-weight: 600;
        color: #fff;
        background: var(--kin, #A8873A);
        border-radius: 3px;
        padding: 1px 6px;
        white-space: nowrap;
        flex-shrink: 0;
        letter-spacing: 0.03em;
      }
      .col-card-sub {
        font-size: 0.8rem;
        color: var(--text-secondary);
        margin-top: 2px;
        line-height: 1.5;
      }
      .col-card-meta {
        font-size: 0.72rem;
        color: var(--text-tertiary);
        margin-top: 3px;
      }
      .col-footer {
        text-align: center;
        margin-top: 2rem;
        padding: 24px 16px;
      }
    </style>`,
  });
}

function buildCard(e, col) {
  const series = col.series || col.category || "";
  const badgeLabel = SERIES_LABELS[series] || "";
  const badgeColor = SERIES_BADGE_COLORS[series] || "var(--kin, #A8873A)";

  return `<a href="/kabuki/navi/column/${encodeURIComponent(col.id)}" class="col-card">
    <div class="col-card-top">
      ${badgeLabel ? `<span class="col-card-badge" style="background:${badgeColor}">${e(badgeLabel)}</span>` : ""}
      <div class="col-card-title">${e(col.title)}</div>
    </div>
    ${col.subtitle ? `<div class="col-card-sub">${e(col.subtitle)}</div>` : ""}
    <div class="col-card-meta">${e(col.created || "")}</div>
  </a>`;
}

// =========================================================
// コラム個別SSRページ
// =========================================================
export function columnDetailSSR({ article, relatedEnmoku = null }) {
  const e = escHTML;
  const title = article.title || "";
  const subtitle = article.subtitle || "";
  const body = article.body || "";
  const pageUrl = `https://kabukiplus.com/kabuki/navi/column/${encodeURIComponent(article.id)}`;

  const descText = body.replace(/[#*\n]/g, " ").slice(0, 150).trim();
  const ogDesc = subtitle ? `${subtitle} — ${descText}…` : `${descText}…`;

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `${title}｜KABUKI PLUS+ コラム`,
    "description": ogDesc,
    "url": pageUrl,
    "datePublished": article.created || "",
    "dateModified": article.updated || article.created || "",
    "publisher": {
      "@type": "Organization",
      "name": "KABUKI PLUS+",
      "url": "https://kabukiplus.com",
    },
    "mainEntityOfPage": pageUrl,
  };

  // マークダウン→HTML変換（簡易）
  const bodyHtml = markdownToHTML(body);

  // 関連演目リンク
  let relatedHTML = "";
  if (article.enmoku_id && relatedEnmoku) {
    const enmokuTitle = relatedEnmoku.short || relatedEnmoku.full || article.enmoku_id;
    relatedHTML = `
      <div class="col-related">
        <h3>関連演目</h3>
        <a href="/kabuki/navi/enmoku/${encodeURIComponent(article.enmoku_id)}" class="col-related-link">
          🎭 ${e(enmokuTitle)} — あらすじ・見どころ・登場人物
        </a>
      </div>`;
  } else if (article.enmoku_id) {
    relatedHTML = `
      <div class="col-related">
        <h3>関連演目</h3>
        <a href="/kabuki/navi/enmoku/${encodeURIComponent(article.enmoku_id)}" class="col-related-link">
          🎭 演目ガイドを見る
        </a>
      </div>`;
  }

  // タグ
  let tagsHTML = "";
  if (Array.isArray(article.tags) && article.tags.length) {
    tagsHTML = `<div class="col-tags">${article.tags.map(t => `<span class="col-tag">${e(t)}</span>`).join("")}</div>`;
  }

  // 元記事リンク
  let sourceHTML = "";
  if (article.source_url) {
    sourceHTML = `<div class="col-source">
      <a href="${e(article.source_url)}" target="_blank" rel="noopener">📝 noteで元記事を読む</a>
    </div>`;
  }

  const seriesKey = article.series || article.category || "";
  const seriesLabel = SERIES_LABELS[seriesKey] || CATEGORY_LABELS[article.category] || "";
  const seriesBadgeColor = SERIES_BADGE_COLORS[seriesKey] || "var(--kin, #A8873A)";
  const enmokuInfo = ENMOKU_DISPLAY[article.enmoku_id];
  const enmokuName = enmokuInfo ? enmokuInfo.name : "";

  const bodyContent = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span><a href="/kabuki/navi">KABUKI NAVI</a><span>›</span><a href="/kabuki/navi/column">コラム</a><span>›</span><span>${e(title.length > 20 ? title.slice(0, 20) + "…" : title)}</span>
    </div>

    <article class="col-article" itemscope itemtype="https://schema.org/Article">
      <div class="col-header fade-up">
        <div class="col-header-badges">
          ${enmokuName ? `<span class="col-enmoku-badge">${e(enmokuName)}</span>` : ""}
          ${seriesLabel ? `<span class="col-cat-badge" style="background:${seriesBadgeColor};color:#fff;border:none;">${e(seriesLabel)}</span>` : ""}
        </div>
        <h1 class="col-title" itemprop="headline">${e(title)}</h1>
        ${subtitle ? `<p class="col-subtitle">${e(subtitle)}</p>` : ""}
        <div class="col-meta">
          ${article.created ? `<time datetime="${e(article.created)}">${e(article.created)}</time>` : ""}
          ${article.updated && article.updated !== article.created ? ` <span class="col-updated">（更新: ${e(article.updated)}）</span>` : ""}
        </div>
      </div>

      <div class="col-body" itemprop="articleBody">
        ${bodyHtml}
      </div>

      ${tagsHTML}
      ${relatedHTML}
      ${sourceHTML}

      <div style="margin-top:2rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
        <a href="/kabuki/navi/column" class="btn btn-secondary">← コラム一覧に戻る</a>
      </div>
    </article>
  `;

  return pageShell({
    title: `${title}`,
    subtitle: "コラム",
    bodyHTML: bodyContent,
    activeNav: "navi",
    ogDesc,
    ogUrl: pageUrl,
    canonicalUrl: pageUrl,
    headExtra: `
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>
  .col-article { max-width: 800px; margin: 0 auto; }
  .col-header { margin-bottom: 1.5rem; }
  .col-header-badges {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }
  .col-enmoku-badge {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-primary);
    background: var(--gold-soft, #FFF8E7);
    border: 1px solid var(--gold-light, #D4C5A0);
    border-radius: 4px;
    padding: 2px 8px;
    font-family: 'Noto Serif JP', serif;
  }
  .col-cat-badge {
    display: inline-block;
    font-size: 0.72rem;
    font-weight: 600;
    border-radius: 4px;
    padding: 2px 8px;
  }
  .col-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    font-family: 'Noto Serif JP', serif;
    line-height: 1.5;
  }
  .col-subtitle {
    font-size: 0.95rem;
    color: var(--text-secondary);
    margin: 0.4rem 0 0;
  }
  .col-meta {
    font-size: 0.8rem;
    color: var(--text-tertiary);
    margin-top: 0.5rem;
  }
  .col-updated { color: var(--text-tertiary); }
  .col-body {
    font-size: 0.95rem;
    line-height: 1.9;
    color: var(--text-primary);
  }
  .col-body h2 {
    font-size: 1.2rem;
    font-weight: 700;
    margin: 2rem 0 0.8rem;
    padding-bottom: 0.3rem;
    border-bottom: 2px solid var(--kin, #A8873A);
  }
  .col-body h3 {
    font-size: 1.05rem;
    font-weight: 700;
    margin: 1.5rem 0 0.6rem;
  }
  .col-body p { margin: 0 0 1em; }
  .col-body blockquote {
    margin: 1em 0;
    padding: 0.8em 1.2em;
    border-left: 4px solid var(--kin, #A8873A);
    background: var(--bg-subtle, #f9f9f9);
    font-style: italic;
    color: var(--text-secondary);
  }
  .col-body ul, .col-body ol {
    margin: 0 0 1em;
    padding-left: 1.5em;
  }
  .col-body li { margin-bottom: 0.3em; }
  .col-fig {
    margin: 1.5em 0;
    text-align: center;
  }
  .col-fig img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
  }
  .col-fig figcaption {
    font-size: 0.8rem;
    color: var(--text-tertiary);
    margin-top: 0.4em;
  }
  .col-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 1.5rem;
  }
  .col-tag {
    font-size: 0.78rem;
    color: var(--text-secondary);
    background: var(--bg-subtle, #f5f5f5);
    border: 1px solid var(--border-light, #e5e5e5);
    border-radius: 999px;
    padding: 3px 10px;
  }
  .col-related {
    margin-top: 1.5rem;
    padding: 1rem;
    background: var(--bg-subtle, #f9f9f9);
    border-radius: 8px;
    border: 1px solid var(--border-light, #e5e5e5);
  }
  .col-related h3 {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-secondary);
    margin: 0 0 0.5rem;
  }
  .col-related-link {
    font-size: 0.9rem;
    color: var(--kin, #A8873A);
    text-decoration: none;
    font-weight: 600;
  }
  .col-related-link:hover { text-decoration: underline; }
  .col-source {
    margin-top: 1rem;
    font-size: 0.82rem;
  }
  .col-source a {
    color: var(--text-tertiary);
    text-decoration: none;
  }
  .col-source a:hover { text-decoration: underline; }
</style>`,
  });
}

// =========================================================
// 簡易マークダウン→HTML変換
// =========================================================
function markdownToHTML(md) {
  const e = escHTML;
  const lines = md.split("\n");
  let html = "";
  let inList = false;
  let listType = "";
  let inBlockquote = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // 見出し
    const h3Match = line.match(/^### (.+)$/);
    if (h3Match) {
      html += closeList() + closeBlockquote();
      html += `<h3>${inlineFormat(h3Match[1])}</h3>\n`;
      continue;
    }
    const h2Match = line.match(/^## (.+)$/);
    if (h2Match) {
      html += closeList() + closeBlockquote();
      html += `<h2>${inlineFormat(h2Match[1])}</h2>\n`;
      continue;
    }

    // 引用
    if (line.startsWith("> ")) {
      html += closeList();
      if (!inBlockquote) {
        html += "<blockquote>";
        inBlockquote = true;
      }
      html += `<p>${inlineFormat(line.slice(2))}</p>\n`;
      continue;
    } else if (inBlockquote) {
      html += closeBlockquote();
    }

    // リスト
    const ulMatch = line.match(/^[-*] (.+)$/);
    if (ulMatch) {
      if (!inList || listType !== "ul") {
        html += closeList();
        html += "<ul>\n";
        inList = true;
        listType = "ul";
      }
      html += `<li>${inlineFormat(ulMatch[1])}</li>\n`;
      continue;
    }
    const olMatch = line.match(/^\d+\. (.+)$/);
    if (olMatch) {
      if (!inList || listType !== "ol") {
        html += closeList();
        html += "<ol>\n";
        inList = true;
        listType = "ol";
      }
      html += `<li>${inlineFormat(olMatch[1])}</li>\n`;
      continue;
    }
    html += closeList();

    // 画像（単独行）
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      html += closeList() + closeBlockquote();
      const alt = e(imgMatch[1]);
      const src = e(imgMatch[2]);
      html += `<figure class="col-fig"><img src="${src}" alt="${alt}" loading="lazy">${alt ? `<figcaption>${alt}</figcaption>` : ""}</figure>\n`;
      continue;
    }

    // 空行
    if (line.trim() === "") {
      continue;
    }

    // 段落
    html += `<p>${inlineFormat(line)}</p>\n`;
  }
  html += closeList() + closeBlockquote();
  return html;

  function closeList() {
    if (!inList) return "";
    inList = false;
    const tag = listType === "ol" ? "</ol>\n" : "</ul>\n";
    listType = "";
    return tag;
  }
  function closeBlockquote() {
    if (!inBlockquote) return "";
    inBlockquote = false;
    return "</blockquote>\n";
  }
  function inlineFormat(text) {
    // ruby タグを一時退避
    const rubys = [];
    let s = text.replace(/<ruby>.*?<\/ruby>/g, m => {
      rubys.push(m);
      return `\x00RUBY${rubys.length - 1}\x00`;
    });
    // HTMLエスケープ → 太字 → リンク
    s = e(s);
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    // ruby タグを復元
    s = s.replace(/\x00RUBY(\d+)\x00/g, (_, i) => rubys[Number(i)]);
    return s;
  }
}
