// src/enmoku_page.js
// =========================================================
// 演目ガイドページ — /enmoku, /enmoku/:id
// クライアントサイドルーティング（SPA風）
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";
import { t, langPrefix } from "./i18n.js";

// =========================================================
// SSR版 演目詳細ページ（SEO対応）
// =========================================================
export function enmokuDetailSSR({ id, data, catalogEntry, relatedColumns = [], glossaryTerms = [], catalog = [], lang = "ja" }) {
  const e = escHTML;
  const title = data.title || data.title_short || id;
  const titleShort = data.title_short || title;
  const synopsis = data.synopsis || "";
  const highlights = data.highlights || "";
  const info = data.info || {};
  const cast = Array.isArray(data.cast) ? data.cast : [];
  const authors = Array.isArray(data.authors) ? data.authors : [];

  const lp = langPrefix(lang);

  // あらすじの先頭120文字をdescriptionに
  const descText = synopsis.replace(/\n/g, " ").slice(0, 150).trim();
  const ogDesc = `${t("enmoku.og_desc", lang).replace("${title}", title)}${descText}…`;
  const pageUrl = `https://kabukiplus.com${lp}/kabuki/navi/enmoku/${encodeURIComponent(id)}`;

  // JSON-LD 構造化データ
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `${title} — ${t("enmoku.jsonld_suffix", lang)}`,
    "description": ogDesc,
    "url": pageUrl,
    "publisher": {
      "@type": "Organization",
      "name": "KABUKI PLUS+",
      "url": "https://kabukiplus.com"
    },
    "mainEntityOfPage": pageUrl,
    "datePublished": data.created || "2025-01-01",
    "dateModified": data.updated || data.created || new Date().toISOString().split("T")[0],
    "keywords": [lang === "en" ? "kabuki" : "歌舞伎", title, lang === "en" ? "synopsis" : "あらすじ", lang === "en" ? "highlights" : "見どころ"].filter(Boolean),
    "inLanguage": lang === "en" ? "en" : "ja",
    "author": info["作者"]
      ? { "@type": "Person", "name": info["作者"] }
      : { "@type": "Organization", "name": "KABUKI PLUS+" },
  };

  // 作品情報テーブル
  const infoKeyMap = [
    { key: "作者", labelKey: "enmoku.info_author" },
    { key: "初演", labelKey: "enmoku.info_premiere" },
    { key: "種別", labelKey: "enmoku.info_genre" },
    { key: "上演時間", labelKey: "enmoku.info_duration" },
    { key: "別名・通称", labelKey: "enmoku.info_alias" },
    { key: "原作", labelKey: "enmoku.info_original" },
  ];
  let infoHTML = "";
  for (const { key, labelKey } of infoKeyMap) {
    if (info[key]) {
      infoHTML += `<tr><th>${e(t(labelKey, lang))}</th><td>${e(String(info[key]))}</td></tr>`;
    }
  }

  // 登場人物
  let castHTML = "";
  for (const c of cast) {
    const nm = (c.name || "").replace(/[（(].*[）)]$/, "").trim();
    const kana = ((c.name || "").match(/[（(](.*)[）)]/) || [])[1] || "";
    const hasImg = !!c.image;
    castHTML += `<div class="cast-card${hasImg ? ' cast-card-has-img' : ''}">
      ${hasImg ? `<img class="cast-img" src="${e(c.image)}" alt="${e(nm)}" loading="lazy">` : ''}
      <div class="cast-body">
        <div class="cast-name">${e(nm)}</div>
        ${kana ? `<div class="cast-kana">${e(kana)}</div>` : ""}
        ${c.desc ? `<div class="cast-desc">${formatSSR(c.desc)}</div>` : ""}
      </div>
    </div>`;
  }

  // 執筆者
  let authorsHTML = "";
  if (authors.length) {
    authorsHTML = `<div class="enmoku-authors">
      <span class="enmoku-authors-label">${t("enmoku.written_by", lang)}</span> ${authors.map(a => e(a.displayName || t("enmoku.anonymous", lang))).join("、")}
    </div>`;
  }

  // 関連コンテンツ（用語・類似演目）
  let relatedHTML = "";
  {
    const contentText = (synopsis + " " + highlights).toLowerCase();
    // 関連用語: 本文中に登場する用語を検出（最大5件）
    const matchedTerms = glossaryTerms
      .filter(tm => tm.term && contentText.includes(tm.term.toLowerCase()))
      .slice(0, 5);
    // 類似演目: 同じ種別（ジャンル）の他の演目（最大5件）
    const genre = info["種別"] || "";
    const similarPlays = genre
      ? catalog.filter(c => c.id !== id && c.group && c.group === genre).slice(0, 5)
      : [];

    if (matchedTerms.length || similarPlays.length) {
      relatedHTML = `<aside class="enmoku-related">
        <h2 class="enmoku-section-title">${lang === "en" ? "Related Content" : "関連するコンテンツ"}</h2>
        ${matchedTerms.length ? `<div class="related-group">
          <h3 class="related-group-title">${lang === "en" ? "Glossary Terms" : "関連する用語"}</h3>
          <div class="related-links">${matchedTerms.map(tm =>
            `<a href="${lp}/kabuki/navi/glossary/term/${encodeURIComponent(tm.term)}" class="related-chip">${e(tm.term)}</a>`
          ).join("")}</div>
        </div>` : ""}
        ${similarPlays.length ? `<div class="related-group">
          <h3 class="related-group-title">${lang === "en" ? "Similar Plays" : "類似テーマの演目"}</h3>
          <div class="related-links">${similarPlays.map(c =>
            `<a href="${lp}/kabuki/navi/enmoku/${encodeURIComponent(c.id)}" class="related-chip">${e(c.short || c.full || c.id)}</a>`
          ).join("")}</div>
        </div>` : ""}
      </aside>`;
    }
  }

  const bodyHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="${lp}/">${t("common.breadcrumb_top", lang)}</a><span>›</span><a href="${lp}/kabuki/navi">KABUKI NAVI</a><span>›</span><a href="${lp}/kabuki/navi/enmoku">${t("enmoku.play_guide", lang)}</a><span>›</span><span>${e(titleShort)}</span>
    </nav>

    <article class="enmoku-detail" itemscope itemtype="https://schema.org/Article">
      <div class="detail-header fade-up">
        <h1 class="detail-title" itemprop="headline">${e(title)}</h1>
        ${title !== titleShort ? `<p class="detail-sub">${e(title)}</p>` : ""}
      </div>

      <nav class="enmoku-toc" aria-label="${t("enmoku.section_nav", lang)}">
        ${infoHTML ? `<a href="#sec-info">${t("enmoku.section_info", lang)}</a>` : ''}
        <a href="#sec-synopsis">${t("enmoku.section_synopsis", lang)}</a>
        ${highlights ? `<a href="#sec-highlights">${t("enmoku.section_highlights", lang)}</a>` : ''}
        ${cast.length ? `<a href="#sec-cast">${t("enmoku.section_cast", lang)}</a>` : ''}
      </nav>

      ${infoHTML ? `
      <section class="enmoku-section" id="sec-info">
        <h2 class="enmoku-section-title">${t("enmoku.section_info", lang)}</h2>
        <table class="enmoku-info-table">${infoHTML}</table>
      </section>` : ""}

      <section class="enmoku-section" id="sec-synopsis" itemprop="articleBody">
        <h2 class="enmoku-section-title">${t("enmoku.section_synopsis", lang)}</h2>
        <div class="detail-text">${formatSSR(synopsis || t("enmoku.no_data", lang))}</div>
      </section>

      ${highlights ? `
      <section class="enmoku-section" id="sec-highlights">
        <h2 class="enmoku-section-title">${t("enmoku.section_highlights", lang)}</h2>
        <div class="detail-text">${formatSSR(highlights)}</div>
      </section>` : ""}

      ${cast.length ? `
      <section class="enmoku-section" id="sec-cast">
        <h2 class="enmoku-section-title">${t("enmoku.section_cast", lang)}</h2>
        ${castHTML}
      </section>` : ""}

      ${authorsHTML}

      ${relatedHTML}

      <section class="content-meta">
        <div class="meta-credit">
          <strong>${lang === "en" ? "Supervised by" : "監修"}</strong>：${lang === "en" ? "Kera Kabuki Preservation Society (Gujo, Gifu)" : "気良歌舞伎保存会（岐阜県郡上市）"}
          <p>${lang === "en"
            ? "A group dedicated to preserving jikabuki (regional kabuki) traditions since the Edo period. Content accuracy is reviewed based on their knowledge and experience."
            : "江戸時代から続く地歌舞伎を保存・継承する団体。地域の伝統芸能としての歌舞伎の知識と経験に基づき、コンテンツの正確性を監修しています。"}</p>
        </div>
        <div class="meta-dates">
          ${data.created ? `<span>${lang === "en" ? "Published" : "公開日"}：${data.created}</span>` : ""}
          ${data.updated ? `<span>${lang === "en" ? "Updated" : "最終更新"}：${data.updated}</span>` : ""}
        </div>
      </section>

      ${relatedColumns.length ? `
      <section class="enmoku-section" style="margin-top:2rem;">
        <h2 class="enmoku-section-title">${t("enmoku.section_columns", lang)}</h2>
        ${relatedColumns.map(col => `<a href="/kabuki/navi/column/${encodeURIComponent(col.id)}" style="display:block;padding:10px 0;border-bottom:1px solid var(--border,#e5e5e5);text-decoration:none;color:inherit;">
          <div style="font-weight:700;font-size:0.95rem;">${e(col.title)}</div>
          ${col.subtitle ? `<div style="font-size:0.82rem;color:var(--text-secondary);margin-top:2px;">${e(col.subtitle)}</div>` : ""}
        </a>`).join("")}
      </section>` : ""}

      <div style="margin-top:1.5rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
        <a href="${lp}/kabuki/navi/enmoku" class="btn btn-secondary">${t("enmoku.back_to_list", lang)}</a>
      </div>
    </article>
  `;

  return pageShell({
    title: `${title} ${t("enmoku.title_suffix", lang)}`,
    subtitle: t("enmoku.play_guide", lang),
    bodyHTML,
    activeNav: "navi",
    currentPath: "/kabuki/navi/enmoku",
    i18nReady: true,
    lang,
    ogDesc,
    ogUrl: pageUrl,
    canonicalUrl: pageUrl,
    headExtra: `
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>
  .enmoku-detail { max-width: 800px; margin: 0 auto; }
  .enmoku-toc { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem; position: sticky; top: 0; z-index: 10; background: var(--bg-primary, #fff); padding: 0.6rem 0; border-bottom: 1px solid var(--border, #e5e5e5); }
  .enmoku-toc a { display: inline-block; padding: 0.35rem 0.7rem; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); background: var(--bg-subtle, #f5f5f5); border-radius: 999px; text-decoration: none; white-space: nowrap; }
  .enmoku-toc a:active { background: var(--kin, #A8873A); color: #fff; }
  .enmoku-section { scroll-margin-top: 3.5rem; }
  .enmoku-section { margin-bottom: 2rem; }
  .enmoku-section-title { font-size: 1.15rem; font-weight: 700; margin: 0 0 0.75rem; padding-bottom: 0.4rem; border-bottom: 2px solid var(--kin, #A8873A); }
  .enmoku-info-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; margin-bottom: 0.5rem; }
  .enmoku-info-table th { text-align: left; padding: 0.4rem 0.8rem 0.4rem 0; color: var(--text-secondary); white-space: nowrap; width: 7em; vertical-align: top; }
  .enmoku-info-table td { padding: 0.4rem 0; }
  .enmoku-info-table tr + tr { border-top: 1px solid var(--border, #e5e5e5); }
  .detail-header { margin-bottom: 1.5rem; }
  .detail-title { font-size: 1.6rem; font-weight: 700; margin: 0; font-family: 'Noto Serif JP', serif; }
  .detail-sub { font-size: 0.9rem; color: var(--text-secondary); margin: 0.3rem 0 0; }
  .detail-text { font-size: 0.95rem; line-height: 1.85; color: var(--text-primary); }
  .detail-text p { margin: 0 0 1em; }
  .cast-card { padding: 0.75rem 0; border-bottom: 1px solid var(--border, #e5e5e5); }
  .cast-card-has-img { display: flex; gap: 0.8rem; align-items: flex-start; }
  .cast-img { width: 72px; height: 72px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
  .cast-card:last-child { border-bottom: none; }
  .cast-name { font-weight: 700; font-size: 1rem; }
  .cast-kana { font-size: 0.8rem; color: var(--text-tertiary); margin-top: 0.15rem; }
  .cast-desc { font-size: 0.9rem; line-height: 1.7; color: var(--text-secondary); margin-top: 0.4rem; }
  .enmoku-authors { margin-top: 1.5rem; padding: 0.6rem 0.8rem; font-size: 13px; color: var(--text-secondary); background: var(--bg-subtle); border-radius: var(--radius-sm); }
  .enmoku-authors-label { font-weight: 600; color: var(--text-tertiary); }
  .enmoku-related { margin-top: 2rem; padding: 1.2rem; background: var(--bg-subtle, #f8f6f2); border-radius: var(--radius-sm, 8px); }
  .related-group { margin-bottom: 0.8rem; }
  .related-group:last-child { margin-bottom: 0; }
  .related-group-title { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin: 0 0 0.5rem; }
  .related-links { display: flex; flex-wrap: wrap; gap: 0.4rem; }
  .related-chip { display: inline-block; padding: 0.3rem 0.7rem; font-size: 0.82rem; background: var(--bg-card, #fff); border: 1px solid var(--border-light, #e5e0d5); border-radius: 999px; color: var(--text-primary); text-decoration: none; transition: border-color 0.15s, background 0.15s; }
  .related-chip:hover { border-color: var(--kin, #A8873A); background: var(--gold-light, #faf3e0); }
  .content-meta { margin-top: 2rem; padding: 1rem 1.2rem; background: var(--bg-subtle, #f8f6f2); border: 1px solid var(--border-light, #e5e0d5); border-radius: var(--radius-sm, 8px); font-size: 0.85rem; line-height: 1.7; color: var(--text-secondary); }
  .content-meta .meta-credit strong { color: var(--text-primary); }
  .content-meta .meta-credit p { margin: 0.3rem 0 0; }
  .content-meta .meta-dates { margin-top: 0.6rem; display: flex; gap: 1.2rem; flex-wrap: wrap; font-size: 0.8rem; color: var(--text-tertiary); }
</style>`,
  });
}

function formatSSR(text) {
  return escHTML(text).replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>");
}

export function enmokuPageHTML({ googleClientId = "", lang = "ja" } = {}) {
  const lp = langPrefix(lang);
  const bodyHTML = `
    <div class="breadcrumb" id="breadcrumb">
      <a href="${lp}/">${t("common.breadcrumb_top", lang)}</a><span>›</span><a href="${lp}/kabuki/navi">KABUKI NAVI</a><span>›</span><span id="bc-tail">${t("enmoku.play_guide", lang)}</span>
    </div>
    <div id="app">
      <div class="loading">${t("enmoku.loading", lang)}</div>
    </div>

    <script>
    (function(){
      var app = document.getElementById("app");

      // ── 演目一覧表示 ──
      app.innerHTML = '<div class="loading">${t("enmoku.loading", lang)}</div>';
      fetch("/api/enmoku/catalog${lang === "en" ? "?lang=en" : ""}")
        .then(function(r){ return r.json(); })
        .then(function(data){
          if (!Array.isArray(data) || data.length === 0) {
            app.innerHTML = '<div class="empty-state">${t("enmoku.empty", lang)}</div>';
            return;
          }
          var groups = [];
          var gmap = {};
          data.forEach(function(e) {
            if (e.group) {
              if (!(e.group in gmap)) {
                gmap[e.group] = groups.length;
                groups.push({ label: e.group, items: [] });
              }
              groups[gmap[e.group]].items.push(e);
            } else {
              groups.push({ label: null, items: [e] });
            }
          });

          var html = '<h2 class="section-title">${t("enmoku.play_guide", lang)} <span style="font-size:0.8rem;color:var(--text-tertiary);">${t("enmoku.all_count", lang).replace("${n}", "' + data.length + '")}</span></h2>'
            + '<p style="font-size:0.85rem;color:var(--text-secondary);margin:0 0 1rem;">${t("enmoku.current_count", lang).replace("${n}", "' + data.length + '")}</p>';
          groups.forEach(function(g) {
            if (g.label) {
              html += '<div class="enmoku-group fade-up">';
              html += '<h3 class="enmoku-group-title">📁 ' + esc(g.label) + ' <span class="enmoku-group-count">${t("enmoku.group_count", lang).replace("${n}", "\' + g.items.length + \'")}</span></h3>';
              g.items.forEach(function(e){ html += enmokuCard(e); });
              html += '</div>';
            } else {
              g.items.forEach(function(e){ html += enmokuCard(e); });
            }
          });
          app.innerHTML = html;
        })
        .catch(function(){ app.innerHTML = '<div class="empty-state">${t("enmoku.load_error", lang)}</div>'; });

      function enmokuCard(e) {
        return '<a href="${langPrefix(lang)}/kabuki/navi/enmoku/' + encodeURIComponent(e.id) + '" class="list-item">'
          + '<div class="list-item-title">' + esc(e.short) + '</div>'
          + (e.full && e.full !== e.short ? '<div class="list-item-sub">' + esc(e.full) + '</div>' : '')
          + '</a>';
      }

      function esc(s) {
        if (!s) return "";
        var el = document.createElement("span");
        el.textContent = s;
        return el.innerHTML;
      }
    })();
    </script>
  `;

  return pageShell({
    title: t("enmoku.play_guide", lang),
    subtitle: t("enmoku.synopsis_highlights_characters_suffix", lang),
    bodyHTML,
    activeNav: "navi",
    currentPath: "/kabuki/navi/enmoku",
    i18nReady: true,
    googleClientId,
    lang,
    ogDesc: lang === "en"
      ? "Explore classic kabuki plays: synopses, highlights, and character guides. A comprehensive encyclopedia for kabuki enthusiasts."
      : "歌舞伎の名作演目を網羅。あらすじ・見どころ・登場人物をわかりやすく解説する演目事典",
    headExtra: `<style>
      .enmoku-group {
        margin-bottom: 1.5rem;
      }
      .enmoku-group-title {
        font-size: 0.95rem;
        color: var(--kin);
        margin-bottom: 0.6rem;
        padding-bottom: 0.4rem;
        border-bottom: 1px solid var(--border-light);
      }
      .enmoku-group-count {
        font-size: 0.75rem;
        color: var(--text-tertiary);
        font-weight: normal;
      }
      .detail-header {
        margin-bottom: 1rem;
      }
      .detail-title {
        font-size: 1.4rem;
        color: var(--kin);
        letter-spacing: 0.1em;
      }
      .detail-sub {
        font-size: 0.85rem;
        color: var(--text-tertiary);
        margin-top: 0.2rem;
      }
      .detail-text {
        font-size: 0.92rem;
        line-height: 1.8;
        color: var(--text-primary);
      }
      .tab-content { display: none; }
      .tab-visible { display: block; animation: fadeUp 0.3s ease; }
      .cast-card {
        background: var(--bg-subtle);
        border: 1px solid var(--border-light);
        border-radius: 10px;
        padding: 0.8rem 1rem;
        margin-bottom: 0.5rem;
      }
      .cast-card-has-img {
        display: flex;
        gap: 0.8rem;
        align-items: flex-start;
      }
      .cast-img {
        width: 72px;
        height: 72px;
        object-fit: cover;
        border-radius: 8px;
        flex-shrink: 0;
      }
      .cast-body { flex: 1; min-width: 0; }
      .cast-name {
        font-weight: bold;
        font-size: 0.95rem;
        color: var(--text-primary);
      }
      .cast-kana {
        font-size: 0.78rem;
        color: var(--text-tertiary);
      }
      .cast-desc {
        font-size: 0.85rem;
        color: var(--text-tertiary);
        margin-top: 0.3rem;
        line-height: 1.6;
      }
      .info-list {
        margin: 0;
      }
      .info-dt {
        font-size: 0.8rem;
        color: var(--kin);
        margin-top: 0.8rem;
        font-weight: bold;
      }
      .info-dd {
        font-size: 0.9rem;
        color: var(--text-primary);
        margin-left: 0;
        padding-left: 0.8rem;
        border-left: 2px solid var(--border-light);
      }
      /* ── 動画タブ ── */
      .video-section { }
      .video-intro {
        font-size: 0.9rem;
        color: var(--text-tertiary);
        margin-bottom: 1rem;
        line-height: 1.6;
      }
      .video-card {
        background: var(--bg-subtle);
        border: 1px solid var(--border-light);
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 0.8rem;
        transition: border-color 0.2s;
      }
      .video-card:hover { border-color: var(--kin); }
      .video-thumb-wrap { position: relative; }
      .video-thumb {
        width: 100%;
        display: block;
        aspect-ratio: 16/9;
        object-fit: cover;
      }
      .video-link {
        display: block;
        padding: 0.7rem 1rem;
        color: var(--text-primary);
        font-size: 0.9rem;
        font-weight: bold;
        text-decoration: none;
      }
      .video-link:hover { color: var(--kin); }
      .video-channel {
        margin-top: 1rem;
        text-align: center;
      }
      .video-channel a {
        color: var(--aka);
        font-size: 0.88rem;
        font-weight: bold;
      }
      .enmoku-authors {
        margin-top: 1.2rem;
        padding: 10px 14px;
        font-size: 13px;
        color: var(--text-secondary);
        background: var(--bg-subtle);
        border-radius: var(--radius-sm);
      }
      .enmoku-authors-label {
        font-weight: 600;
        color: var(--text-tertiary);
      }
    </style>`,
  });
}
