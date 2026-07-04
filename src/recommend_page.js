// src/recommend_page.js
// =========================================================
// おすすめ演目ページ — /recommend
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";
import { t, langPrefix } from "./i18n.js";

export function recommendPageHTML({ googleClientId = "", lang = "ja" } = {}) {
  const bodyHTML = `
    <div class="breadcrumb" id="breadcrumb">
      <a href="${langPrefix(lang)}/">${t("common.breadcrumb_top", lang)}</a><span>›</span><a href="${langPrefix(lang)}/kabuki/navi">KABUKI NAVI</a><span>›</span><span id="bc-tail">${t("recommend.title", lang)}</span>
    </div>
    <div id="app">
      <div class="loading">${t("recommend.loading", lang)}</div>
    </div>

    <script>
    (function(){
      var app = document.getElementById("app");
      var bcTail = document.getElementById("bc-tail");
      var recData = null;

      fetch("/api/recommend?lang=${lang}")
        .then(function(r){ return r.json(); })
        .then(function(data){
          recData = data;
          route();
        })
        .catch(function(){
          app.innerHTML = '<div class="empty-state">${t("recommend.error", lang)}</div>';
        });

      function route() {
        if (!recData) return;
        var path = location.pathname;
        var m;
        if ((m = path.match(/^\\/kabuki\\/navi\\/recommend\\/(.+)$/))) {
          showDetail(decodeURIComponent(m[1]));
        } else {
          showList();
        }
      }

      function getFaqs() {
        if (Array.isArray(recData)) return recData;
        if (recData && Array.isArray(recData.faqs)) return recData.faqs;
        return [];
      }

      // ── おすすめ一覧 ──
      function showList() {
        bcTail.innerHTML = "${t("recommend.title", lang)}";
        var faqs = getFaqs();
        if (faqs.length === 0) {
          app.innerHTML = '<div class="empty-state">${t("recommend.empty", lang)}</div>';
          return;
        }

        var html = '<h2 class="section-title">${t("recommend.title", lang)} <span style="font-size:0.8rem;color:var(--text-tertiary);">' + faqs.length + '${t("recommend.count_suffix", lang)}</span></h2>';
        html += '<p style="font-size:0.85rem;color:var(--text-tertiary);margin-bottom:1rem;">${t("recommend.lead", lang)}</p>';

        faqs.forEach(function(f, i) {
          var id = f.id || i;
          html += '<a href="/kabuki/navi/recommend/' + encodeURIComponent(id) + '" class="list-item fade-up" style="animation-delay:' + (i*0.04) + 's" onclick="return nav(this)">';
          html += '<div class="list-item-title">🏮 ' + esc(f.label || f.question || "${t("recommend.untitled", lang)}") + '</div>';
          if (f.tags && f.tags.length) {
            html += '<div class="rec-tags">';
            f.tags.forEach(function(t){ html += '<span class="rec-tag">' + esc(t) + '</span>'; });
            html += '</div>';
          }
          html += '</a>';
        });
        app.innerHTML = html;
      }

      // ── おすすめ詳細 ──
      function showDetail(id) {
        var faqs = getFaqs();
        var faq = faqs.find(function(f){ return String(f.id) === String(id); }) || faqs[Number(id)];
        if (!faq) {
          app.innerHTML = '<div class="empty-state">${t("recommend.not_found", lang)}<br><a href="${langPrefix(lang)}/kabuki/navi/recommend" onclick="return nav(this)">${t("recommend.back_to_list", lang)}</a></div>';
          return;
        }
        bcTail.innerHTML = '<a href="${langPrefix(lang)}/kabuki/navi/recommend" onclick="return nav(this)">${t("recommend.breadcrumb", lang)}</a><span>›</span>' + esc(faq.label || faq.question || "${t("recommend.title", lang)}");

        var html = '<div class="rec-detail fade-up">';
        html += '<h2 class="rec-detail-title">' + esc(faq.question || faq.label || "${t("recommend.title", lang)}") + '</h2>';
        html += '<hr style="border:none;border-top:1px solid var(--border-light);margin:0.8rem 0;">';
        html += '<div class="rec-answer">' + formatText(faq.answer || "${t("recommend.no_answer", lang)}") + '</div>';

        // 動画リンク
        var videos = recData && recData.videos || {};
        var enmokuIds = faq.enmoku || [];
        var vLinks = [];
        enmokuIds.forEach(function(eid){ if (videos[eid]) vLinks.push(videos[eid]); });

        if (vLinks.length > 0) {
          html += '<div class="rec-videos">';
          html += '<h3 class="rec-videos-title">▶ ${t("recommend.videos_title", lang)}</h3>';
          vLinks.forEach(function(v) {
            html += '<a href="' + esc(v.url) + '" target="_blank" rel="noopener" class="rec-video-link">🎬 ' + esc(v.title || "${t("recommend.watch_video", lang)}") + '</a>';
          });
          html += '</div>';
        }

        // 関連演目リンク（カタログと照合して正しいID・表示名で表示）
        if (enmokuIds.length > 0) {
          html += '<div class="rec-related" id="rec-related-wrap"><p class="rec-related-loading">${t("recommend.related_loading", lang)}</p></div>';
        }

        html += '</div>';
        html += '<div style="margin-top:1.5rem;">';
        html += '<a href="${langPrefix(lang)}/kabuki/navi/recommend" class="btn btn-secondary" onclick="return nav(this)">${t("recommend.back_btn", lang)}</a>';
        html += '</div>';
        app.innerHTML = html;

        if (enmokuIds.length > 0) {
          var enmokuAlias = { moritsuna:"moritunajinya", sodehagi:"adachigaharasandanme", chushingura07:"gionichiriki", chushingura09:"yamashinakankyo", kirare:"kirareyosa", hamamamatsuya:"hamamatsuya" };
          fetch("/api/enmoku/catalog?lang=${lang}")
            .then(function(r){ return r.json(); })
            .then(function(catalog){
              var list = Array.isArray(catalog) ? catalog : [];
              var resolved = [];
              enmokuIds.forEach(function(eid){
                var lookupId = enmokuAlias[eid] || eid;
                var e = list.find(function(c){ return c.id === lookupId || c.id === eid || (c.short && String(c.short) === String(eid)) || (c.full && String(c.full) === String(eid)); });
                if (e) resolved.push({ id: e.id, label: e.short || e.full || e.id }); else resolved.push({ id: eid, label: eid });
              });
              var wrap = document.getElementById("rec-related-wrap");
              if (!wrap) return;
              var inner = '<h3 style="font-size:0.85rem;color:var(--kin);margin-bottom:0.4rem;">📜 ${t("recommend.related_title", lang)}</h3>';
              resolved.forEach(function(r){
                inner += '<a href="${langPrefix(lang)}/kabuki/navi/enmoku/' + encodeURIComponent(r.id) + '" class="rec-related-btn">' + esc(r.label) + '</a>';
              });
              wrap.innerHTML = inner;
            })
            .catch(function(){
              var wrap = document.getElementById("rec-related-wrap");
              if (wrap) wrap.innerHTML = '<h3 style="font-size:0.85rem;color:var(--kin);margin-bottom:0.4rem;">📜 ${t("recommend.related_title", lang)}</h3><p class="rec-related-loading">${t("recommend.related_error", lang)}</p>';
            });
        }
      }

      // ── ヘルパー ──
      function esc(s) {
        if (!s) return "";
        var el = document.createElement("span");
        el.textContent = s;
        return el.innerHTML;
      }
      function formatText(s) {
        var t = s || "";
        var idx = t.indexOf("\uD83C\uDFAC \u52D5\u753B\u3067\u4E88\u7FD2");
        if (idx >= 0) t = t.substring(0, idx);
        t = t.replace(/https?:\\/\\/\\S+/g, "");
        t = t.replace(/\\n\\n\\n+/g, "\\n\\n");
        return esc(t).replace(/\\n/g, "<br>");
      }

      window.nav = function(el) {
        var href = el.getAttribute("href");
        if (href && href.startsWith("/kabuki/navi/recommend")) {
          history.pushState(null, "", href);
          route();
          window.scrollTo(0, 0);
          return false;
        }
        return true;
      };
      window.addEventListener("popstate", route);
    })();
    </script>
  `;

  const recPageUrl = `https://kabukiplus.com${langPrefix(lang)}/kabuki/navi/recommend`;
  const recOgDesc = lang === "en"
    ? "Find your perfect kabuki play! Answer a few questions and get personalized recommendations for beginners."
    : "あなたにぴったりの歌舞伎演目を診断。好みや気分に合わせて初心者におすすめの演目をご提案します";
  const recJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": t("recommend.title", lang),
    "description": recOgDesc,
    "url": recPageUrl,
    "inLanguage": lang === "en" ? "en" : "ja",
    "applicationCategory": "Entertainment",
    "provider": { "@type": "Organization", "name": "KABUKI PLUS+", "url": "https://kabukiplus.com" },
  };

  return pageShell({
    title: t("recommend.title", lang),
    subtitle: t("recommend.subtitle", lang),
    bodyHTML,
    activeNav: "navi",
    currentPath: "/kabuki/navi/recommend",
    i18nReady: true,
    googleClientId,
    lang,
    ogDesc: recOgDesc,
    ogUrl: recPageUrl,
    canonicalUrl: recPageUrl,
    headExtra: `
<script type="application/ld+json">${JSON.stringify(recJsonLd)}</script>
<style>
      .rec-tags {
        display: flex;
        gap: 0.3rem;
        flex-wrap: wrap;
        margin-top: 0.3rem;
      }
      .rec-tag {
        font-size: 0.7rem;
        padding: 2px 8px;
        border-radius: 4px;
        background: var(--bg-card);
        color: var(--kin);
        border: 1px solid rgba(197,165,90,0.2);
      }
      .rec-detail {
        background: var(--bg-subtle);
        border: 1px solid var(--border-light);
        border-radius: 14px;
        padding: 1.5rem;
      }
      .rec-detail-title {
        font-size: 1.2rem;
        color: var(--kin);
        line-height: 1.5;
      }
      .rec-answer {
        font-size: 0.92rem;
        line-height: 1.8;
        color: var(--text-primary);
      }
      .rec-videos {
        margin-top: 1rem;
        padding-top: 0.8rem;
        border-top: 1px solid var(--border-light);
      }
      .rec-videos-title {
        font-size: 0.85rem;
        color: var(--aka);
        font-weight: bold;
        margin-bottom: 0.4rem;
      }
      .rec-video-link {
        display: block;
        padding: 0.5rem 0.8rem;
        margin-bottom: 0.3rem;
        background: var(--bg-card);
        border-radius: 8px;
        color: var(--text-primary);
        font-size: 0.88rem;
        text-decoration: none;
        transition: all 0.2s;
      }
      .rec-video-link:hover {
        background: var(--border-medium);
        color: var(--kin);
        text-decoration: none;
      }
      .rec-related {
        margin-top: 1rem;
        padding-top: 0.8rem;
        border-top: 1px solid var(--border-light);
      }
      .rec-related-loading { font-size: 0.85rem; color: var(--text-tertiary); margin: 0; }
      .rec-related-btn {
        display: inline-block;
        margin: 0.2rem;
        padding: 0.4rem 0.9rem;
        background: var(--bg-card);
        border: 1px solid rgba(197,165,90,0.4);
        border-radius: 8px;
        color: var(--kin);
        font-size: 0.88rem;
        text-decoration: none;
        transition: all 0.2s;
      }
      .rec-related-btn:hover {
        background: rgba(197,165,90,0.15);
        color: var(--text-primary);
        text-decoration: none;
      }
    </style>`,
  });
}
