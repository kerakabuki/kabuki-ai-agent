// src/manners_page.js
// =========================================================
// 観劇マナーページ — /kabuki/navi/manners
// 会場でのNG集（やっちゃダメなこと）に特化したシンプル構成
// =========================================================
import { pageShell } from "./web_layout.js";
import { t, langPrefix } from "./i18n.js";

const MANNER_RULES = [
  {
    icon: "📱",
    titleKey: "manners.rule1_title",
    accent: "accent-1",
    itemKeys: ["manners.rule1_item1", "manners.rule1_item2", "manners.rule1_item3", "manners.rule1_item4"],
  },
  {
    icon: "📸",
    titleKey: "manners.rule2_title",
    accent: "accent-2",
    itemKeys: ["manners.rule2_item1", "manners.rule2_item2", "manners.rule2_item3"],
  },
  {
    icon: "🍱",
    titleKey: "manners.rule3_title",
    accent: "accent-3",
    itemKeys: ["manners.rule3_item1", "manners.rule3_item2", "manners.rule3_item3"],
  },
  {
    icon: "🚶",
    titleKey: "manners.rule4_title",
    accent: "accent-gold",
    itemKeys: ["manners.rule4_item1", "manners.rule4_item2"],
  },
  {
    icon: "🔇",
    titleKey: "manners.rule5_title",
    accent: "accent-1",
    itemKeys: ["manners.rule5_item1", "manners.rule5_item2", "manners.rule5_item3"],
  },
  {
    icon: "🎒",
    titleKey: "manners.rule6_title",
    accent: "accent-2",
    itemKeys: ["manners.rule6_item1", "manners.rule6_item2", "manners.rule6_item3", "manners.rule6_item4"],
  },
];

export function mannersPageHTML({ googleClientId = "", lang = "ja" } = {}) {
  const rulesHTML = MANNER_RULES.map((r) => `
    <div class="manner-rule-card fade-up">
      <div class="manner-rule-header manner-${r.accent}">
        <span class="manner-rule-icon">${r.icon}</span>
        <h3 class="manner-rule-title">${t(r.titleKey, lang)}</h3>
      </div>
      <ul class="manner-rule-list">
        ${r.itemKeys.map((k) => `<li>${t(k, lang)}</li>`).join("")}
      </ul>
    </div>
  `).join("\n");

  const lp = langPrefix(lang);
  const bodyHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="${lp}/">${t("common.breadcrumb_top", lang)}</a><span>›</span><a href="${lp}/kabuki/navi">KABUKI NAVI</a><span>›</span>${t("manners.breadcrumb", lang)}
    </nav>

    <!-- 観劇ナビへの導線バナー -->
    <a href="${lp}/kabuki/navi/theater" class="manner-navi-banner fade-up">
      <span class="manner-navi-banner-icon">🧭</span>
      <span class="manner-navi-banner-text">${t("manners.navi_banner", lang)}</span>
      <span class="manner-navi-banner-arrow">→</span>
    </a>

    <section class="manner-intro fade-up">
      <p class="manner-lead">
        ${t("manners.lead", lang)}
      </p>
    </section>

    <!-- ── 会場でのマナー ── -->
    <section class="manner-section">
      <h2 class="section-title">${t("manners.section_title", lang)}</h2>
      <div class="manner-rules-grid">
        ${rulesHTML}
      </div>
    </section>

    <div class="manner-footer fade-up">
      <a href="${lp}/kabuki/navi" class="btn btn-secondary">${t("manners.back_navi", lang)}</a>
    </div>
  `;

  const mannersPageUrl = `https://kabukiplus.com${langPrefix(lang)}/kabuki/navi/manners`;
  const mannersOgDesc = lang === "en"
    ? "Essential etiquette for kabuki theater: dress code, food & drinks, applause, and how to enjoy the show."
    : "初めての歌舞伎観劇も安心。服装・飲食・拍手のタイミングなど、知っておきたい観劇マナーガイド";
  const mannersJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "name": t("manners.title", lang),
    "description": mannersOgDesc,
    "url": mannersPageUrl,
    "inLanguage": lang === "en" ? "en" : "ja",
    "mainEntity": MANNER_RULES.map(r => ({
      "@type": "Question",
      "name": t(r.titleKey, lang),
      "acceptedAnswer": {
        "@type": "Answer",
        "text": r.itemKeys.map(k => t(k, lang)).join(" "),
      },
    })),
  };

  return pageShell({
    lang,
    title: t("manners.title", lang),
    subtitle: t("manners.subtitle", lang),
    bodyHTML,
    activeNav: "navi",
    currentPath: "/kabuki/navi/manners",
    i18nReady: true,
    googleClientId,
    ogDesc: mannersOgDesc,
    ogUrl: mannersPageUrl,
    canonicalUrl: mannersPageUrl,
    headExtra: `
<script type="application/ld+json">${JSON.stringify(mannersJsonLd)}</script>
<style>
      /* ── 観劇ナビ導線バナー ── */
      .manner-navi-banner {
        display: flex;
        align-items: center;
        gap: 10px;
        background: var(--gold-soft);
        border: 1px solid var(--gold-light);
        border-radius: var(--radius-sm);
        padding: 12px 16px;
        margin-bottom: 20px;
        text-decoration: none;
        color: var(--gold-dark);
        font-size: 13.5px;
        transition: background 0.15s;
      }
      .manner-navi-banner:hover {
        background: var(--gold-light);
        text-decoration: none;
        color: var(--gold-dark);
      }
      .manner-navi-banner-icon { font-size: 18px; flex-shrink: 0; }
      .manner-navi-banner-text { flex: 1; }
      .manner-navi-banner-text strong { font-weight: 600; }
      .manner-navi-banner-arrow { flex-shrink: 0; font-size: 16px; }

      /* ── イントロ ── */
      .manner-intro {
        text-align: center;
        padding: 20px 16px 28px;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 28px;
      }
      .manner-lead {
        font-size: 14px;
        line-height: 2;
        color: var(--text-secondary);
        letter-spacing: 0.08em;
      }

      /* ── セクション ── */
      .manner-section {
        margin-bottom: 2.5rem;
      }

      /* ── 会場マナーグリッド ── */
      .manner-rules-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 14px;
      }
      .manner-rule-card {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        overflow: hidden;
        box-shadow: var(--shadow-sm);
      }
      .manner-rule-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-light);
      }
      .manner-accent-1   { background: rgba(212,97,75,0.08);  border-left: 3px solid var(--accent-1); }
      .manner-accent-2   { background: rgba(107,143,173,0.08); border-left: 3px solid var(--accent-2); }
      .manner-accent-3   { background: rgba(107,158,120,0.08); border-left: 3px solid var(--accent-3); }
      .manner-accent-gold { background: rgba(197,162,85,0.08);  border-left: 3px solid var(--gold); }
      .manner-rule-icon {
        font-size: 22px;
        flex-shrink: 0;
      }
      .manner-rule-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
      }
      .manner-rule-list {
        list-style: none;
        margin: 0;
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .manner-rule-list li {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.6;
        padding-left: 14px;
        position: relative;
      }
      .manner-rule-list li::before {
        content: "・";
        position: absolute;
        left: 0;
        color: var(--gold);
      }

      /* ── フッター ── */
      .manner-footer {
        text-align: center;
        margin-top: 2.5rem;
        padding-bottom: 1.5rem;
      }

      @media (max-width: 480px) {
        .manner-rules-grid { grid-template-columns: 1fr; }
      }
    </style>`,
  });
}
