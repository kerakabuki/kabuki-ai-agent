// src/kabuki_help_page.js
// =========================================================
// KABUKI PLUS+ ユーザーズガイド — /kabuki/help
// =========================================================
import { pageShell } from "./web_layout.js";
import { t, langPrefix } from "./i18n.js";

export function kabukiHelpPageHTML({ googleClientId = "", lang = "ja" } = {}) {
  const lp = langPrefix(lang);
  const bodyHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="${lp}/">${t("common.breadcrumb_top", lang)}</a><span>›</span>${t("help.breadcrumb", lang)}
    </nav>

    <!-- はじめに -->
    <section class="help-intro fade-up">
      <div class="help-intro-icon">🎭</div>
      <h2 class="help-intro-title">${t("help.intro_title", lang)}</h2>
      <p class="help-intro-desc">
        ${t("help.intro_desc", lang)}
      </p>
    </section>

    <!-- NAVI -->
    <section class="help-section fade-up-d1">
      <div class="help-section-header help-header-navi">
        <span class="help-section-icon">🧭</span>
        <div>
          <h2 class="help-section-title">${t("help.navi_title", lang)}</h2>
          <p class="help-section-subtitle">${t("help.navi_subtitle", lang)}</p>
        </div>
        <a href="${lp}/kabuki/navi" class="help-section-link">${t("help.open", lang)}</a>
      </div>
      <div class="help-card-grid">
        <div class="help-card help-card-accent-1">
          <div class="help-card-head">
            <span class="help-card-icon">📖</span>
            <h3>${t("help.play_guide", lang)}</h3>
          </div>
          <p class="help-card-desc">${t("help.play_guide_desc", lang)}</p>
          <a href="${lp}/kabuki/navi/enmoku" class="help-card-link">${t("help.play_guide_link", lang)}</a>
        </div>
        <div class="help-card help-card-accent-2">
          <div class="help-card-head">
            <span class="help-card-icon">📚</span>
            <h3>${t("help.glossary", lang)}</h3>
          </div>
          <p class="help-card-desc">${t("help.glossary_desc", lang)}</p>
          <a href="${lp}/kabuki/navi/glossary" class="help-card-link">${t("help.glossary_link", lang)}</a>
        </div>
        <div class="help-card help-card-accent-3">
          <div class="help-card-head">
            <span class="help-card-icon">⭐</span>
            <h3>${t("help.recommend", lang)}</h3>
          </div>
          <p class="help-card-desc">${t("help.recommend_desc", lang)}</p>
          <a href="${lp}/kabuki/navi/recommend" class="help-card-link">${t("help.recommend_link", lang)}</a>
        </div>
        <div class="help-card help-card-accent-gold">
          <div class="help-card-head">
            <span class="help-card-icon">🗺️</span>
            <h3>${t("help.theater_guide", lang)}</h3>
          </div>
          <p class="help-card-desc">${t("help.theater_guide_desc", lang)}</p>
          <a href="${lp}/kabuki/navi/theater" class="help-card-link">${t("help.theater_guide_link", lang)}</a>
        </div>
      </div>
    </section>

    <!-- LIVE -->
    <section class="help-section fade-up-d2">
      <div class="help-section-header help-header-live">
        <span class="help-section-icon">📡</span>
        <div>
          <h2 class="help-section-title">${t("help.live_title", lang)}</h2>
          <p class="help-section-subtitle">${t("help.live_subtitle", lang)}</p>
        </div>
        <a href="${lp}/kabuki/live" class="help-section-link">${t("help.open", lang)}</a>
      </div>
      <div class="help-card-grid">
        <div class="help-card help-card-accent-2">
          <div class="help-card-head">
            <span class="help-card-icon">🎪</span>
            <h3>${t("help.schedule", lang)}</h3>
          </div>
          <p class="help-card-desc">${t("help.schedule_desc", lang)}</p>
        </div>
        <div class="help-card help-card-accent-3">
          <div class="help-card-head">
            <span class="help-card-icon">📰</span>
            <h3>${t("help.news", lang)}</h3>
          </div>
          <p class="help-card-desc">${t("help.news_desc", lang)}</p>
          <a href="${lp}/kabuki/live/news" class="help-card-link">${t("help.news_link", lang)}</a>
        </div>
      </div>
    </section>

    <!-- RECO -->
    <section class="help-section fade-up-d2">
      <div class="help-section-header help-header-reco">
        <span class="help-section-icon">📝</span>
        <div>
          <h2 class="help-section-title">${t("help.reco_title", lang)}</h2>
          <p class="help-section-subtitle">${t("help.reco_subtitle", lang)}</p>
        </div>
        <a href="${lp}/kabuki/reco" class="help-section-link">${t("help.open", lang)}</a>
      </div>
      <div class="help-card-grid">
        <div class="help-card help-card-accent-1">
          <div class="help-card-head">
            <span class="help-card-icon">📋</span>
            <h3>${t("help.theater_log", lang)}</h3>
          </div>
          <p class="help-card-desc">${t("help.theater_log_desc", lang)}</p>
        </div>
        <div class="help-card help-card-accent-gold">
          <div class="help-card-head">
            <span class="help-card-icon">❤️</span>
            <h3>${t("help.favorite_actors", lang)}</h3>
          </div>
          <p class="help-card-desc">${t("help.favorite_actors_desc", lang)}</p>
        </div>
      </div>
      <div class="help-note">
        <span class="help-note-icon">💡</span>
        ${t("help.reco_note", lang)}
      </div>
    </section>

    <!-- DOJO -->
    <section class="help-section fade-up-d3">
      <div class="help-section-header help-header-dojo">
        <span class="help-section-icon">🥋</span>
        <div>
          <h2 class="help-section-title">${t("help.dojo_title", lang)}</h2>
          <p class="help-section-subtitle">${t("help.dojo_subtitle", lang)}</p>
        </div>
        <a href="${lp}/kabuki/dojo" class="help-section-link">${t("help.open", lang)}</a>
      </div>
      <div class="help-card-grid">
        <div class="help-card help-card-accent-1">
          <div class="help-card-head">
            <span class="help-card-icon">🧠</span>
            <h3>${t("help.quiz", lang)}</h3>
          </div>
          <p class="help-card-desc">${t("help.quiz_desc", lang)}</p>
          <a href="${lp}/kabuki/dojo/quiz" class="help-card-link">${t("help.quiz_link", lang)}</a>
        </div>
        <div class="help-card help-card-accent-3">
          <div class="help-card-head">
            <span class="help-card-icon">🎤</span>
            <h3>${t("help.serifu", lang)}</h3>
          </div>
          <p class="help-card-desc">${t("help.serifu_desc", lang)}</p>
          <a href="${lp}/kabuki/dojo/training/serifu" class="help-card-link">${t("help.serifu_link", lang)}</a>
        </div>
        <div class="help-card help-card-accent-2">
          <div class="help-card-head">
            <span class="help-card-icon">📣</span>
            <h3>${t("help.kakegoe", lang)}</h3>
          </div>
          <p class="help-card-desc">${t("help.kakegoe_desc", lang)}</p>
          <a href="${lp}/kabuki/dojo/training/kakegoe" class="help-card-link">${t("help.kakegoe_link", lang)}</a>
        </div>
      </div>
    </section>

    <!-- けらのすけ -->
    <section class="help-section fade-up-d3">
      <div class="help-section-header help-header-ai">
        <span class="help-section-icon">🤖</span>
        <div>
          <h2 class="help-section-title">${t("help.kera_title", lang)}</h2>
          <p class="help-section-subtitle">${t("help.kera_subtitle", lang)}</p>
        </div>
      </div>
      <div class="help-kera-box">
        <div class="help-kera-desc">
          <p>${t("help.kera_desc", lang)}</p>
          <ul class="help-kera-list">
            <li>${t("help.kera_item1", lang)}</li>
            <li>${t("help.kera_item2", lang)}</li>
            <li>${t("help.kera_item3", lang)}</li>
            <li>${t("help.kera_item4", lang)}</li>
            <li>${t("help.kera_item5", lang)}</li>
          </ul>
        </div>
        <div class="help-kera-cta">
          <a href="/auth/line" class="help-kera-btn-line">${t("help.kera_line_btn", lang)}</a>
          <p class="help-kera-cta-note">${t("help.kera_line_note", lang)}</p>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="help-section fade-up-d4">
      <h2 class="section-title">${t("help.faq_title", lang)}</h2>
      <div class="help-faq-list">
        <details class="help-faq-item">
          <summary class="help-faq-q">${t("help.faq_q1", lang)}</summary>
          <p class="help-faq-a">${t("help.faq_a1", lang)}</p>
        </details>
        <details class="help-faq-item">
          <summary class="help-faq-q">${t("help.faq_q2", lang)}</summary>
          <p class="help-faq-a">${t("help.faq_a2", lang)}</p>
        </details>
        <details class="help-faq-item">
          <summary class="help-faq-q">${t("help.faq_q3", lang)}</summary>
          <p class="help-faq-a">${t("help.faq_a3", lang)}</p>
        </details>
        <details class="help-faq-item">
          <summary class="help-faq-q">${t("help.faq_q4", lang)}</summary>
          <p class="help-faq-a">${t("help.faq_a4", lang)}</p>
        </details>
        <details class="help-faq-item">
          <summary class="help-faq-q">${t("help.faq_q5", lang)}</summary>
          <p class="help-faq-a">${t("help.faq_a5", lang)}</p>
        </details>
      </div>
    </section>

    <div class="help-footer fade-up-d4">
      <a href="${lp}/" class="btn btn-secondary">${t("help.back_to_top", lang)}</a>
    </div>
  `;

  const helpPageUrl = `https://kabukiplus.com${lp}/kabuki/help`;
  const helpOgDesc = lang === "en"
    ? "How to use KABUKI PLUS+: features guide, navigation tips, and frequently asked questions."
    : "KABUKI PLUS+の使い方ガイド。各機能の紹介・操作方法・よくある質問をまとめています";
  const helpJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "name": t("help.title", lang),
    "description": helpOgDesc,
    "url": helpPageUrl,
    "inLanguage": lang === "en" ? "en" : "ja",
    "publisher": { "@type": "Organization", "name": "KABUKI PLUS+", "url": "https://kabukiplus.com" },
  };

  return pageShell({
    title: t("help.title", lang),
    subtitle: t("help.subtitle", lang),
    bodyHTML,
    activeNav: "home",
    currentPath: "/kabuki/help",
    i18nReady: true,
    brand: "kabuki",
    lang,
    googleClientId,
    ogDesc: helpOgDesc,
    ogUrl: helpPageUrl,
    canonicalUrl: helpPageUrl,
    headExtra: `
<script type="application/ld+json">${JSON.stringify(helpJsonLd)}</script>
<style>
      /* ── はじめにセクション ── */
      .help-intro {
        text-align: center;
        padding: 24px 16px 32px;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 32px;
      }
      .help-intro-icon {
        font-size: 40px;
        margin-bottom: 12px;
      }
      .help-intro-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 18px;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 12px;
        letter-spacing: 1px;
      }
      .help-intro-desc {
        font-size: 13.5px;
        color: var(--text-secondary);
        line-height: 2;
        max-width: 560px;
        margin: 0 auto;
      }

      /* ── セクション ── */
      .help-section {
        margin-bottom: 36px;
      }
      .help-section-header {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 18px;
        border-radius: var(--radius-md);
        margin-bottom: 14px;
        border: 1px solid var(--border-light);
      }
      .help-section-icon {
        font-size: 28px;
        flex-shrink: 0;
      }
      .help-section-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 15px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 2px;
        letter-spacing: 0.5px;
      }
      .help-section-subtitle {
        font-size: 11px;
        color: var(--text-tertiary);
        margin: 0;
      }
      .help-section-link {
        margin-left: auto;
        flex-shrink: 0;
        font-size: 12px;
        font-weight: 600;
        color: var(--gold-dark);
        text-decoration: none;
        white-space: nowrap;
        padding: 5px 12px;
        border: 1px solid var(--gold-light);
        border-radius: 20px;
        transition: background 0.15s;
      }
      .help-section-link:hover {
        background: var(--gold-soft);
        text-decoration: none;
      }

      /* セクションヘッダーカラー */
      .help-header-navi { background: rgba(197,162,85,0.06); border-left: 3px solid var(--gold); }
      .help-header-live { background: rgba(107,143,173,0.06); border-left: 3px solid var(--accent-2); }
      .help-header-reco { background: rgba(212,97,75,0.06);  border-left: 3px solid var(--accent-1); }
      .help-header-dojo { background: rgba(107,158,120,0.06); border-left: 3px solid var(--accent-3); }
      .help-header-ai   { background: rgba(176,136,200,0.06); border-left: 3px solid #B088C8; }

      /* ── カードグリッド ── */
      .help-card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 12px;
      }
      .help-card {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        padding: 14px 16px;
        box-shadow: var(--shadow-sm);
      }
      .help-card-head {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }
      .help-card-icon {
        font-size: 20px;
        flex-shrink: 0;
      }
      .help-card h3 {
        font-family: 'Noto Serif JP', serif;
        font-size: 13.5px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
      }
      .help-card-desc {
        font-size: 12px;
        color: var(--text-secondary);
        line-height: 1.7;
        margin-bottom: 8px;
      }
      .help-card-link {
        font-size: 11.5px;
        color: var(--gold-dark);
        text-decoration: none;
        font-weight: 500;
      }
      .help-card-link:hover { text-decoration: underline; }

      /* カード左ボーダー */
      .help-card-accent-1    { border-left: 3px solid var(--accent-1); }
      .help-card-accent-2    { border-left: 3px solid var(--accent-2); }
      .help-card-accent-3    { border-left: 3px solid var(--accent-3); }
      .help-card-accent-gold { border-left: 3px solid var(--gold); }

      /* ── 注意書き ── */
      .help-note {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-top: 10px;
        padding: 10px 14px;
        background: var(--gold-soft);
        border: 1px solid var(--gold-light);
        border-radius: var(--radius-sm);
        font-size: 12px;
        color: var(--gold-dark);
        line-height: 1.6;
      }
      .help-note-icon { flex-shrink: 0; font-size: 14px; }

      /* ── けらのすけボックス ── */
      .help-kera-box {
        display: flex;
        gap: 20px;
        align-items: flex-start;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        padding: 20px;
        box-shadow: var(--shadow-sm);
        border-left: 3px solid #B088C8;
      }
      .help-kera-desc {
        flex: 1;
      }
      .help-kera-desc p {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.8;
        margin-bottom: 10px;
      }
      .help-kera-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .help-kera-list li {
        font-size: 12px;
        color: var(--text-secondary);
        padding-left: 16px;
        position: relative;
      }
      .help-kera-list li::before {
        content: "・";
        position: absolute;
        left: 0;
        color: #B088C8;
      }
      .help-kera-cta {
        flex-shrink: 0;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      .help-kera-btn-line {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 20px;
        background: #06C755;
        color: #fff;
        border-radius: 24px;
        font-size: 13px;
        font-weight: 600;
        text-decoration: none;
        white-space: nowrap;
        transition: opacity 0.15s;
      }
      .help-kera-btn-line:hover { opacity: 0.85; color: #fff; text-decoration: none; }
      .help-kera-cta-note {
        font-size: 11px;
        color: var(--text-tertiary);
        line-height: 1.5;
        max-width: 160px;
        margin: 0;
      }

      /* ── FAQ ── */
      .help-faq-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .help-faq-item {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-sm);
        box-shadow: var(--shadow-sm);
        overflow: hidden;
      }
      .help-faq-q {
        font-size: 13px;
        font-weight: 500;
        color: var(--text-primary);
        padding: 12px 16px;
        cursor: pointer;
        list-style: none;
        display: flex;
        align-items: center;
        gap: 8px;
        user-select: none;
      }
      .help-faq-q::-webkit-details-marker { display: none; }
      .help-faq-q::before {
        content: "▶";
        font-size: 10px;
        color: var(--gold);
        transition: transform 0.2s;
        flex-shrink: 0;
      }
      details[open] .help-faq-q::before {
        transform: rotate(90deg);
      }
      .help-faq-a {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.8;
        padding: 0 16px 14px 36px;
        margin: 0;
      }

      /* ── フッター ── */
      .help-footer {
        text-align: center;
        margin-top: 2rem;
        padding-bottom: 1.5rem;
      }

      @media (max-width: 480px) {
        .help-card-grid { grid-template-columns: 1fr; }
        .help-kera-box { flex-direction: column; }
        .help-kera-cta { align-self: stretch; }
        .help-kera-btn-line { justify-content: center; }
        .help-kera-cta-note { max-width: none; }
        .help-section-link { display: none; }
      }
    </style>`,
  });
}
