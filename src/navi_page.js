// src/navi_page.js
// =========================================================
// 歌舞伎ナビ（Discover Hub） — /navi
// 演目・用語・おすすめへの入口（調べる系）
// =========================================================
import { pageShell } from "./web_layout.js";
import { t, langPrefix } from "./i18n.js";

export function naviPageHTML({ googleClientId = "", lang = "ja" } = {}) {
  const lp = langPrefix(lang);

  const NAVI_FEATURED = [
    { icon: "🧭", title: t("navi.theater_title", lang), desc: t("navi.theater_desc", lang), href: lp + "/kabuki/navi/theater", delay: 0 },
    { icon: "🎎", title: t("navi.manners_title", lang), desc: t("navi.manners_desc", lang), href: lp + "/kabuki/navi/manners", delay: 1 },
  ];
  const NAVI_SUB = [
    { icon: "📜", title: t("navi.enmoku_title", lang), desc: t("navi.enmoku_desc", lang), href: lp + "/kabuki/navi/enmoku", delay: 2 },
    { icon: "🏮", title: t("navi.recommend_title", lang), desc: t("navi.recommend_desc", lang), href: lp + "/kabuki/navi/recommend", delay: 3 },
    { icon: "📖", title: t("navi.glossary_title", lang), desc: t("navi.glossary_desc", lang), href: lp + "/kabuki/navi/glossary", delay: 4 },
    { icon: "🔤", title: t("navi.yurai_title", lang), desc: t("navi.yurai_desc", lang), href: lp + "/kabuki/navi/yurai", delay: 5 },
    { icon: "✍️", title: t("navi.column_title", lang), desc: t("navi.column_desc", lang), href: lp + "/kabuki/navi/column", delay: 6 },
  ];

  const featuredCards = NAVI_FEATURED.map((c) => `
    <a href="${c.href}" class="card navi-card-featured fade-up-d${c.delay}" style="display:flex;align-items:center;gap:16px;padding:20px;">
      <span class="card-emoji navi-emoji-featured">${c.icon}</span>
      <div style="flex:1;min-width:0;">
        <h3>${c.title} <span class="navi-badge">${t("common.beginner", lang)}</span></h3>
        <p class="card-desc">${c.desc}</p>
      </div>
      <span style="color:var(--text-tertiary);font-size:18px;flex-shrink:0;transition:transform 0.15s;" class="nc-arrow">→</span>
    </a>`).join("\n");

  const subCards = NAVI_SUB.map((c) => `
    <a href="${c.href}" class="card fade-up-d${c.delay}" style="display:flex;align-items:center;gap:14px;padding:16px;">
      <span class="card-emoji navi-emoji-normal">${c.icon}</span>
      <div style="flex:1;min-width:0;">
        <h3>${c.title}</h3>
        <p class="card-desc">${c.desc}</p>
      </div>
      <span style="color:var(--text-tertiary);font-size:18px;flex-shrink:0;transition:transform 0.15s;" class="nc-arrow">→</span>
    </a>`).join("\n");

  const bodyHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="${lp}/">${t("common.breadcrumb_top", lang)}</a><span>›</span>KABUKI NAVI
    </nav>

    <section class="navi-intro fade-up">
      <p class="navi-lead">
        ${t("navi.lead", lang).replace(/\n/g, "<br>")}
      </p>
    </section>

    <div class="navi-grid-featured">
      ${featuredCards}
    </div>

    <div class="navi-grid-sub">
      ${subCards}
    </div>

    <a href="${lp}/kabuki/chat" target="_blank" rel="noopener" class="card navi-chat-card fade-up-d5" style="display:flex;align-items:center;gap:16px;padding:20px;margin-top:14px;">
      <img src="https://kabukiplus.com/assets/keranosukelogo.png" alt="けらのすけ" class="navi-chat-avatar">
      <div style="flex:1;min-width:0;">
        <h3>${t("navi.chat_title", lang)} <span class="navi-badge" style="background:var(--accent-2-soft);color:var(--accent-2);border-color:#c5d6e6;">AI</span></h3>
        <p class="card-desc">${t("navi.chat_desc", lang)}</p>
      </div>
      <span style="color:var(--text-tertiary);font-size:18px;flex-shrink:0;transition:transform 0.15s;" class="nc-arrow">→</span>
    </a>

    <div class="navi-footer fade-up-d4">
      <p>
        ${lang === "en"
          ? `Seen a play? Log it on <a href="${lp}/kabuki/reco">KABUKI RECO</a>.<br>Test your knowledge at <a href="${lp}/kabuki/dojo">KABUKI DOJO</a>.`
          : `気になる演目を観たら <a href="/kabuki/reco">KABUKI RECO</a> で記録を。<br>知識を試すなら <a href="/kabuki/dojo">KABUKI DOJO</a> でクイズ・稽古へ。`}
      </p>
    </div>
  `;

  const naviPageUrl = `https://kabukiplus.com${lp}/kabuki/navi`;
  const naviOgDesc = lang === "en"
    ? "Your kabuki encyclopedia: play guides, glossary, actor profiles, theater info and recommended plays for beginners."
    : "歌舞伎の演目ガイド・用語いろは・人物事典・劇場案内・おすすめ演目。初心者から楽しめる歌舞伎総合ナビ";
  const naviJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "KABUKI NAVI",
    "description": naviOgDesc,
    "url": naviPageUrl,
    "inLanguage": lang === "en" ? "en" : "ja",
    "publisher": { "@type": "Organization", "name": "KABUKI PLUS+", "url": "https://kabukiplus.com" },
    "hasPart": [
      { "@type": "WebPage", "name": t("navi.theater_title", lang), "url": `${naviPageUrl}/theater` },
      { "@type": "WebPage", "name": t("navi.manners_title", lang), "url": `${naviPageUrl}/manners` },
      { "@type": "WebPage", "name": t("navi.enmoku_title", lang), "url": `${naviPageUrl}/enmoku` },
      { "@type": "WebPage", "name": t("navi.recommend_title", lang), "url": `${naviPageUrl}/recommend` },
      { "@type": "WebPage", "name": t("navi.glossary_title", lang), "url": `${naviPageUrl}/glossary` },
      { "@type": "WebPage", "name": t("navi.column_title", lang), "url": `${naviPageUrl}/column` },
    ],
  };

  return pageShell({
    title: "KABUKI NAVI",
    subtitle: t("navi.subtitle", lang),
    bodyHTML,
    activeNav: "navi",
    currentPath: "/kabuki/navi",
    i18nReady: true,
    googleClientId,
    lang,
    ogDesc: naviOgDesc,
    ogImage: "https://kabukiplus.com/assets/ogp/ogp_navi.png",
    ogUrl: naviPageUrl,
    canonicalUrl: naviPageUrl,
    headExtra: `
<script type="application/ld+json">${JSON.stringify(naviJsonLd)}</script>
<style>
      .navi-intro {
        text-align: center;
        padding: 20px 16px 28px;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 24px;
      }
      .navi-lead {
        font-size: 14.5px;
        line-height: 1.9;
        color: var(--text-secondary);
        letter-spacing: 0.06em;
      }
      .card:hover .nc-arrow {
        transform: translateX(3px);
        color: var(--gold);
      }

      /* ── 上段: 2カラム（初心者向け） ── */
      .navi-grid-featured {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 14px;
        margin-bottom: 14px;
      }
      /* ── 下段: 3カラム ── */
      .navi-grid-sub {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }

      @media (max-width: 700px) {
        .navi-grid-featured { grid-template-columns: 1fr; }
        .navi-grid-sub { grid-template-columns: 1fr; }
      }

      .navi-card-featured {
        background: linear-gradient(135deg, #fffef9 0%, var(--gold-soft) 100%);
      }
      .navi-emoji-featured {
        background: linear-gradient(135deg, var(--gold-soft), var(--gold-light));
        box-shadow: 0 2px 6px rgba(197,162,85,0.2);
      }
      .navi-emoji-normal {
        background: var(--bg-subtle);
      }
      .navi-badge {
        display: inline-block;
        font-size: 9px;
        font-weight: 600;
        font-family: 'Noto Sans JP', sans-serif;
        color: var(--gold-dark);
        background: var(--gold-soft);
        border: 1px solid var(--gold-light);
        border-radius: 4px;
        padding: 1px 5px;
        letter-spacing: 0.5px;
        vertical-align: middle;
        margin-left: 6px;
        position: relative;
        top: -1px;
      }

      .navi-chat-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid var(--gold-light);
        box-shadow: 0 2px 6px rgba(107,143,173,0.2);
        flex-shrink: 0;
      }

      .navi-footer {
        text-align: center;
        margin-top: 2rem;
        padding: 24px 16px;
        border-top: 1px solid var(--border-light);
        color: var(--text-tertiary);
        font-size: 13px;
        line-height: 1.8;
      }
    </style>`
  });
}
