// src/enmoku_page.js
// =========================================================
// 演目ガイドページ — /enmoku, /enmoku/:id
// クライアントサイドルーティング（SPA風）
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";

// =========================================================
// SSR版 演目詳細ページ（SEO対応）
// =========================================================
export function enmokuDetailSSR({ id, data, catalogEntry, relatedColumns = [] }) {
  const e = escHTML;
  const title = data.title || data.title_short || id;
  const titleShort = data.title_short || title;
  const synopsis = data.synopsis || "";
  const highlights = data.highlights || "";
  const info = data.info || {};
  const cast = Array.isArray(data.cast) ? data.cast : [];
  const authors = Array.isArray(data.authors) ? data.authors : [];

  // あらすじの先頭120文字をdescriptionに
  const descText = synopsis.replace(/\n/g, " ").slice(0, 150).trim();
  const ogDesc = `${title}のあらすじ・見どころ・登場人物を解説。${descText}…`;
  const pageUrl = `https://kabukiplus.com/kabuki/navi/enmoku/${encodeURIComponent(id)}`;

  // JSON-LD 構造化データ
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `${title} — あらすじ・見どころ・登場人物｜KABUKI PLUS+`,
    "description": ogDesc,
    "url": pageUrl,
    "publisher": {
      "@type": "Organization",
      "name": "KABUKI PLUS+",
      "url": "https://kabukiplus.com"
    },
    "mainEntityOfPage": pageUrl,
  };
  if (info["作者"]) jsonLd.author = { "@type": "Person", "name": info["作者"] };

  // 作品情報テーブル
  const infoKeys = ["作者", "初演", "種別", "上演時間", "別名・通称", "原作"];
  let infoHTML = "";
  for (const k of infoKeys) {
    if (info[k]) {
      infoHTML += `<tr><th>${e(k)}</th><td>${e(String(info[k]))}</td></tr>`;
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
      <span class="enmoku-authors-label">✍️ 執筆:</span> ${authors.map(a => e(a.displayName || "匿名")).join("、")}
    </div>`;
  }

  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span><a href="/kabuki/navi">KABUKI NAVI</a><span>›</span><a href="/kabuki/navi/enmoku">演目ガイド</a><span>›</span><span>${e(titleShort)}</span>
    </div>

    <article class="enmoku-detail" itemscope itemtype="https://schema.org/Article">
      <div class="detail-header fade-up">
        <h1 class="detail-title" itemprop="headline">${e(title)}</h1>
        ${title !== titleShort ? `<p class="detail-sub">${e(title)}</p>` : ""}
      </div>

      <nav class="enmoku-toc" aria-label="セクション目次">
        ${infoHTML ? '<a href="#sec-info">📝 作品情報</a>' : ''}
        <a href="#sec-synopsis">📖 あらすじ</a>
        ${highlights ? '<a href="#sec-highlights">🌟 みどころ</a>' : ''}
        ${cast.length ? '<a href="#sec-cast">🎭 登場人物</a>' : ''}
      </nav>

      ${infoHTML ? `
      <section class="enmoku-section" id="sec-info">
        <h2 class="enmoku-section-title">📝 作品情報</h2>
        <table class="enmoku-info-table">${infoHTML}</table>
      </section>` : ""}

      <section class="enmoku-section" id="sec-synopsis" itemprop="articleBody">
        <h2 class="enmoku-section-title">📖 あらすじ</h2>
        <div class="detail-text">${formatSSR(synopsis || "データがありません")}</div>
      </section>

      ${highlights ? `
      <section class="enmoku-section" id="sec-highlights">
        <h2 class="enmoku-section-title">🌟 みどころ</h2>
        <div class="detail-text">${formatSSR(highlights)}</div>
      </section>` : ""}

      ${cast.length ? `
      <section class="enmoku-section" id="sec-cast">
        <h2 class="enmoku-section-title">🎭 登場人物</h2>
        ${castHTML}
      </section>` : ""}

      ${authorsHTML}

      ${relatedColumns.length ? `
      <section class="enmoku-section" style="margin-top:2rem;">
        <h2 class="enmoku-section-title">✍️ 関連コラム</h2>
        ${relatedColumns.map(col => `<a href="/kabuki/navi/column/${encodeURIComponent(col.id)}" style="display:block;padding:10px 0;border-bottom:1px solid var(--border,#e5e5e5);text-decoration:none;color:inherit;">
          <div style="font-weight:700;font-size:0.95rem;">${e(col.title)}</div>
          ${col.subtitle ? `<div style="font-size:0.82rem;color:var(--text-secondary);margin-top:2px;">${e(col.subtitle)}</div>` : ""}
        </a>`).join("")}
      </section>` : ""}

      <div style="margin-top:1.5rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
        <a href="/kabuki/navi/enmoku" class="btn btn-secondary">← 演目一覧に戻る</a>
      </div>
    </article>
  `;

  return pageShell({
    title: `${title} — あらすじ・見どころ・登場人物`,
    subtitle: "演目ガイド",
    bodyHTML,
    activeNav: "navi",
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
</style>`,
  });
}

function formatSSR(text) {
  return escHTML(text).replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>");
}

export function enmokuPageHTML({ googleClientId = "" } = {}) {
  const bodyHTML = `
    <div class="breadcrumb" id="breadcrumb">
      <a href="/">トップ</a><span>›</span><a href="/kabuki/navi">KABUKI NAVI</a><span>›</span><span id="bc-tail">演目ガイド</span>
    </div>
    <div id="app">
      <div class="loading">演目データを読み込み中…</div>
    </div>

    <script>
    (function(){
      var app = document.getElementById("app");

      // ── 演目一覧表示 ──
      app.innerHTML = '<div class="loading">演目データを読み込み中…</div>';
      fetch("/api/enmoku/catalog")
        .then(function(r){ return r.json(); })
        .then(function(data){
          if (!Array.isArray(data) || data.length === 0) {
            app.innerHTML = '<div class="empty-state">演目データがまだ登録されていません。</div>';
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

          var html = '<h2 class="section-title">演目ガイド <span style="font-size:0.8rem;color:var(--text-tertiary);">全' + data.length + '演目</span></h2>'
            + '<p style="font-size:0.85rem;color:var(--text-secondary);margin:0 0 1rem;">現在 <b>' + data.length + '</b> 演目を収録中。今後も順次追加していきます 🌱</p>';
          groups.forEach(function(g) {
            if (g.label) {
              html += '<div class="enmoku-group fade-up">';
              html += '<h3 class="enmoku-group-title">📁 ' + esc(g.label) + ' <span class="enmoku-group-count">' + g.items.length + '演目</span></h3>';
              g.items.forEach(function(e){ html += enmokuCard(e); });
              html += '</div>';
            } else {
              g.items.forEach(function(e){ html += enmokuCard(e); });
            }
          });
          app.innerHTML = html;
        })
        .catch(function(){ app.innerHTML = '<div class="empty-state">演目データの読み込みに失敗しました。</div>'; });

      function enmokuCard(e) {
        return '<a href="/kabuki/navi/enmoku/' + encodeURIComponent(e.id) + '" class="list-item">'
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
    title: "演目ガイド",
    subtitle: "あらすじ・みどころ・登場人物",
    bodyHTML,
    activeNav: "navi",
    googleClientId,
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
