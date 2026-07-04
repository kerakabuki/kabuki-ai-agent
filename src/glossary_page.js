// src/glossary_page.js
// =========================================================
// 用語辞典ページ — /glossary
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";
import { t, langPrefix } from "./i18n.js";

const CAT_ICONS = {
  "演技・演出": "🎭", "役柄": "🎎", "舞台": "🏯", "音・裏方": "🎵",
  "家の芸": "📜", "ジャンル": "📚", "鑑賞": "🎫", "衣装・小道具": "👘",
};

// =========================================================
// SSR版 用語詳細ページ（SEO対応）
// =========================================================
export function glossaryTermSSR({ term, allTerms, lang = "ja" }) {
  const e = escHTML;
  const termName = term.term || "";
  const reading = term.reading || "";
  const category = term.category || "";
  const desc = term.desc || term.description || "";
  const catIcon = CAT_ICONS[category] || "📖";

  const descPlain = desc.replace(/\n/g, " ").slice(0, 150).trim();
  const ogDesc = t("glossary.og_term", lang).replace("${termName}", termName) + descPlain + "…";
  const langPath = lang === "en" ? "/en" : "";
  const pageUrl = `https://kabukiplus.com${langPath}/kabuki/navi/glossary/term/${encodeURIComponent(termName)}`;

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "name": termName,
    "description": desc.replace(/\n/g, " ").slice(0, 300),
    "inDefinedTermSet": {
      "@type": "DefinedTermSet",
      "name": t("glossary.jsonld_name", lang),
      "url": `https://kabukiplus.com${langPath}/kabuki/navi/glossary`,
    },
    "url": pageUrl,
    "inLanguage": lang === "en" ? "en" : "ja",
  };

  // 同じカテゴリの他の用語（関連用語）
  const sameCategory = (allTerms || []).filter(t => t.category === category && t.term !== termName);
  sameCategory.sort(() => Math.random() - 0.5);
  const related = sameCategory.slice(0, 6);

  let relatedHTML = "";
  if (related.length) {
    relatedHTML = `<section class="glossary-section" id="sec-related">
      <h2 class="glossary-section-title">${e(catIcon)} ${t("glossary.related_title", lang).replace("$" + "{category}", e(category))}</h2>
      <div class="glossary-related-list">
        ${related.map(r => `<a href="${langPrefix(lang)}/kabuki/navi/glossary/term/${encodeURIComponent(r.term)}" class="glossary-related-item">
          <span class="glossary-related-name">${e(r.term)}</span>
          ${r.reading ? `<span class="glossary-related-reading">${e(r.reading)}</span>` : ""}
        </a>`).join("")}
      </div>
    </section>`;
  }

  const bodyHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="${langPrefix(lang)}/">${t("common.breadcrumb_top", lang)}</a><span>›</span><a href="${langPrefix(lang)}/kabuki/navi">KABUKI NAVI</a><span>›</span><a href="${langPrefix(lang)}/kabuki/navi/glossary">${t("glossary.breadcrumb", lang)}</a><span>›</span><a href="${langPrefix(lang)}/kabuki/navi/glossary/${encodeURIComponent(category)}">${e(category)}</a><span>›</span><span>${e(termName)}</span>
    </nav>

    <article class="glossary-detail" itemscope itemtype="https://schema.org/DefinedTerm">
      <div class="glossary-header fade-up">
        <h1 class="glossary-term-name" itemprop="name">${e(termName)}</h1>
        ${reading ? `<p class="glossary-reading">${e(reading)}</p>` : ""}
        <p class="glossary-cat">${e(catIcon)} ${e(category)}</p>
      </div>

      <section class="glossary-section" id="sec-desc">
        <h2 class="glossary-section-title">${t("glossary.section_desc", lang)}</h2>
        <div class="glossary-desc" itemprop="description">${formatGlossarySSR(desc || t("glossary.no_desc", lang))}</div>
      </section>

      ${relatedHTML}

      <div style="margin-top:1.5rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
        <a href="${langPrefix(lang)}/kabuki/navi/glossary/${encodeURIComponent(category)}" class="btn btn-secondary">${t("glossary.back_to_category", lang).replace("$" + "{category}", e(category))}</a>
        <a href="${langPrefix(lang)}/kabuki/navi/glossary" class="btn btn-secondary">${t("glossary.all_categories", lang)}</a>
      </div>
    </article>
  `;

  return pageShell({
    title: `${termName}${reading && !termName.includes(reading) ? `（${reading}）` : ""} — ${t("glossary.title", lang)}`,
    subtitle: t("glossary.title", lang),
    bodyHTML,
    activeNav: "navi",
    currentPath: "/kabuki/navi/glossary",
    i18nReady: true,
    lang,
    ogDesc,
    ogUrl: pageUrl,
    canonicalUrl: pageUrl,
    headExtra: `
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>
  .glossary-detail { max-width: 800px; margin: 0 auto; }
  .glossary-header { margin-bottom: 1.5rem; }
  .glossary-term-name { font-size: 1.6rem; font-weight: 700; margin: 0; font-family: 'Noto Serif JP', serif; color: var(--kin, #A8873A); }
  .glossary-reading { font-size: 0.85rem; color: var(--text-tertiary); margin: 0.2rem 0 0; }
  .glossary-cat { font-size: 0.8rem; color: var(--text-tertiary); margin: 0.3rem 0 0; }
  .glossary-section { margin-bottom: 2rem; scroll-margin-top: 3.5rem; }
  .glossary-section-title { font-size: 1.15rem; font-weight: 700; margin: 0 0 0.75rem; padding-bottom: 0.4rem; border-bottom: 2px solid var(--kin, #A8873A); }
  .glossary-desc { font-size: 0.95rem; line-height: 1.85; color: var(--text-primary); }
  .glossary-desc p { margin: 0 0 1em; }
  .glossary-related-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .glossary-related-item { display: inline-flex; flex-direction: column; padding: 0.5rem 0.8rem; background: var(--bg-subtle, #f5f5f5); border: 1px solid var(--border, #e5e5e5); border-radius: 8px; text-decoration: none; color: var(--text-primary); transition: border-color 0.2s; }
  .glossary-related-item:hover { border-color: var(--kin, #A8873A); text-decoration: none; }
  .glossary-related-name { font-size: 0.9rem; font-weight: 600; }
  .glossary-related-reading { font-size: 0.75rem; color: var(--text-tertiary); }
</style>`,
  });
}

// =========================================================
// SSR版 カテゴリ別用語一覧ページ（SEO対応）
// =========================================================
export function glossaryCategorySSR({ category, terms, lang = "ja" }) {
  const e = escHTML;
  const catIcon = CAT_ICONS[category] || "📖";
  const sorted = [...terms].sort((a, b) => (a.term || "").localeCompare(b.term || "", "ja"));

  const ogDesc = t("glossary.og_category", lang).replace("${category}", category).replace("${count}", terms.length) + sorted.slice(0, 5).map(tm => tm.term).join("・") + "…";
  const langPath = lang === "en" ? "/en" : "";
  const pageUrl = `https://kabukiplus.com${langPath}/kabuki/navi/glossary/${encodeURIComponent(category)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "name": t("glossary.jsonld_category", lang).replace("$" + "{category}", category),
    "description": ogDesc,
    "url": pageUrl,
    "hasDefinedTerm": sorted.map(t => ({
      "@type": "DefinedTerm",
      "name": t.term,
      "url": `https://kabukiplus.com${langPath}/kabuki/navi/glossary/term/${encodeURIComponent(t.term)}`,
    })),
  };

  let listHTML = "";
  for (const t of sorted) {
    listHTML += `<a href="${langPrefix(lang)}/kabuki/navi/glossary/term/${encodeURIComponent(t.term)}" class="list-item">
      <div class="list-item-title">${e(t.term)}</div>
      ${t.reading ? `<div class="list-item-sub">${e(t.reading)}</div>` : ""}
    </a>`;
  }

  const bodyHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="${langPrefix(lang)}/">${t("common.breadcrumb_top", lang)}</a><span>›</span><a href="${langPrefix(lang)}/kabuki/navi">KABUKI NAVI</a><span>›</span><a href="${langPrefix(lang)}/kabuki/navi/glossary">${t("glossary.breadcrumb", lang)}</a><span>›</span><span>${e(category)}</span>
    </nav>
    <h2 class="section-title">${e(catIcon)} ${e(category)} <span style="font-size:0.8rem;color:var(--text-tertiary);">${t("glossary.term_count", lang).replace("$" + "{count}", terms.length)}</span></h2>
    ${listHTML}
    <div style="margin-top:1rem;"><a href="${langPrefix(lang)}/kabuki/navi/glossary" class="btn btn-secondary">${t("glossary.back_all", lang)}</a></div>
  `;

  return pageShell({
    title: `${category} — ${t("glossary.title", lang)}`,
    subtitle: t("glossary.title", lang),
    bodyHTML,
    activeNav: "navi",
    currentPath: "/kabuki/navi/glossary",
    i18nReady: true,
    lang,
    ogDesc,
    ogUrl: pageUrl,
    canonicalUrl: pageUrl,
    headExtra: `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": sorted.slice(0, 50).map(tm => ({
    "@type": "Question",
    "name": `${tm.term}とは？`,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": (tm.desc || tm.description || "").slice(0, 300),
    },
  })),
})}</script>`,
  });
}

function formatGlossarySSR(text) {
  return escHTML(text).replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>");
}

export function glossaryPageHTML({ googleClientId = "", lang = "ja" } = {}) {
  const bodyHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="${langPrefix(lang)}/">${t("common.breadcrumb_top", lang)}</a><span>›</span><a href="${langPrefix(lang)}/kabuki/navi">KABUKI NAVI</a><span>›</span><span>${t("glossary.breadcrumb", lang)}</span>
    </nav>

    <div class="search-bar">
      <input type="text" id="search-input" placeholder="${t("glossary.search_placeholder", lang)}" autocomplete="off">
    </div>

    <div id="app">
      <div class="loading">${t("glossary.loading", lang)}</div>
    </div>

    <script>
    (function(){
      var app = document.getElementById("app");
      var searchInput = document.getElementById("search-input");
      var allTerms = null;

      var CAT_ORDER = ${lang === "en" ? `[
        { key: "Acting & Direction", icon: "🎭" },
        { key: "Roles & Characters", icon: "🎎" },
        { key: "Stage", icon: "🏯" },
        { key: "Music & Backstage", icon: "🎵" },
        { key: "House Specialties", icon: "📜" },
        { key: "Genres", icon: "📚" },
        { key: "Theatergoing", icon: "🎫" },
        { key: "Costumes & Props", icon: "👘" }
      ]` : `[
        { key: "演技・演出", icon: "🎭" },
        { key: "役柄", icon: "🎎" },
        { key: "舞台", icon: "🏯" },
        { key: "音・裏方", icon: "🎵" },
        { key: "家の芸", icon: "📜" },
        { key: "ジャンル", icon: "📚" },
        { key: "鑑賞", icon: "🎫" },
        { key: "衣装・小道具", icon: "👘" }
      ]`};

      fetch("/api/glossary?lang=${lang}")
        .then(function(r){ return r.json(); })
        .then(function(data){
          if (Array.isArray(data)) { allTerms = data; }
          else if (data && Array.isArray(data.terms)) { allTerms = data.terms; }
          else { allTerms = []; }
          showCategories();
        })
        .catch(function(){
          app.innerHTML = '<div class="empty-state">${t("glossary.load_error", lang)}</div>';
        });

      function showCategories() {
        var catCounts = {};
        allTerms.forEach(function(t){ catCounts[t.category] = (catCounts[t.category] || 0) + 1; });

        var html = '<h2 class="section-title">${t("glossary.section_title", lang)} <span style="font-size:0.8rem;color:var(--text-tertiary);">' + '${t("glossary.all_count", lang)}'.replace('$' + '{count}', allTerms.length) + '</span></h2>';
        html += '<div class="card-grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr));">';
        CAT_ORDER.forEach(function(c, i) {
          if (!catCounts[c.key]) return;
          html += '<a href="${langPrefix(lang)}/kabuki/navi/glossary/' + encodeURIComponent(c.key) + '" class="card fade-up-d' + i + '" style="text-align:center;padding:1.2rem;">';
          html += '<div style="font-size:2rem;margin-bottom:0.3rem;">' + c.icon + '</div>';
          html += '<h3 style="font-size:0.95rem;">' + esc(c.key) + '</h3>';
          html += '<p class="card-desc">' + '${t("glossary.cat_count", lang)}'.replace('$' + '{count}', catCounts[c.key]) + '</p>';
          html += '</a>';
        });
        html += '</div>';
        app.innerHTML = html;
      }

      var searchTimer;
      searchInput.addEventListener("input", function() {
        clearTimeout(searchTimer);
        var q = searchInput.value.trim().toLowerCase();
        if (!q) { if (allTerms) showCategories(); return; }
        searchTimer = setTimeout(function(){
          if (!allTerms) return;
          var results = allTerms.filter(function(t){
            return (t.term || "").toLowerCase().indexOf(q) >= 0
              || (t.reading || "").toLowerCase().indexOf(q) >= 0
              || (t.desc || t.description || "").toLowerCase().indexOf(q) >= 0;
          });
          if (results.length === 0) {
            app.innerHTML = '<div class="empty-state">' + '${t("glossary.no_match", lang)}'.replace('$' + '{q}', esc(q)) + '</div>';
            return;
          }
          var html = '<h2 class="section-title">${t("glossary.search_results", lang)} <span style="font-size:0.8rem;color:#888;">' + '${t("glossary.result_count", lang)}'.replace('$' + '{count}', results.length) + '</span></h2>';
          results.forEach(function(t) {
            html += '<a href="${langPrefix(lang)}/kabuki/navi/glossary/term/' + encodeURIComponent(t.term) + '" class="list-item">';
            html += '<div class="list-item-title">' + esc(t.term) + '</div>';
            html += '<div class="list-item-sub">' + esc(t.category) + (t.reading ? ' · ' + esc(t.reading) : '') + '</div>';
            html += '</a>';
          });
          app.innerHTML = html;
        }, 200);
      });

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
    title: t("glossary.title", lang),
    subtitle: t("glossary.subtitle", lang),
    bodyHTML,
    activeNav: "navi",
    currentPath: "/kabuki/navi/glossary",
    i18nReady: true,
    googleClientId,
    lang,
    headExtra: `<style>
      .search-bar { margin-bottom: 1rem; }
      .search-bar input {
        width: 100%; padding: 0.7rem 1rem; border-radius: 10px;
        border: 1px solid var(--border, #ddd); background: var(--bg-card, #fff);
        color: var(--text-primary); font-size: 0.9rem; font-family: inherit;
        outline: none; transition: border-color 0.2s;
      }
      .search-bar input:focus { border-color: var(--kin); }
      .search-bar input::placeholder { color: var(--text-tertiary); }
    </style>`,
  });
}
