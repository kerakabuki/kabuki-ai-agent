// src/navi_page.js
// =========================================================
// 歌舞伎ナビ（Discover Hub） — /navi
// 演目・用語・おすすめへの入口（調べる系）
// =========================================================
import { pageShell } from "./web_layout.js";

const NAVI_CARDS = [
  { icon: "📜", title: "演目・人物ガイド", desc: "20演目のあらすじ・みどころ・登場人物を詳しく解説", href: "/kabuki/navi/enmoku", delay: 0 },
  { icon: "📖", title: "歌舞伎用語いろは", desc: "126の用語をカテゴリ別にわかりやすく解説", href: "/kabuki/navi/glossary", delay: 1 },
  { icon: "🏮", title: "おすすめ演目", desc: "初心者向け・ジャンル別のおすすめ演目を紹介", href: "/kabuki/navi/recommend", delay: 2 },
  { icon: "🎎", title: "観劇マナー", desc: "会場のルール・掛け声・楽しみ方をまとめたガイド", href: "/kabuki/navi/manners", delay: 3 },
];

export function naviPageHTML() {
  const accentClasses = ["card-accent-1", "card-accent-2", "card-accent-gold", "card-accent-3"];
  const cards = NAVI_CARDS.map((c, i) => `
    <a href="${c.href}" class="card ${accentClasses[i] || ''} fade-up-d${c.delay}" style="display:flex;align-items:center;gap:16px;padding:20px;">
      <span class="card-emoji">${c.icon}</span>
      <div style="flex:1;min-width:0;">
        <h3>${c.title}</h3>
        <p class="card-desc">${c.desc}</p>
      </div>
      <span style="color:var(--text-tertiary);font-size:18px;flex-shrink:0;transition:transform 0.15s;" class="nc-arrow">→</span>
    </a>
  `).join("\n");

  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span>KABUKI NAVI
    </div>

    <section class="navi-intro fade-up">
      <p class="navi-lead">
        歌舞伎の世界を探索しよう。<br>
        演目の物語、登場人物、用語の意味──<br>
        知れば知るほど、観る楽しみが広がります。
      </p>
    </section>

    <div class="card-grid">
      ${cards}
    </div>

    <div class="navi-footer fade-up-d4">
      <p>
        気になる演目や用語を見つけたら、⭐保存でクリップ。<br>
        <a href="/kabuki/reco">KABUKI RECO</a>で観劇記録を、<a href="/kabuki/dojo">KABUKI DOJO</a>でクイズ・稽古を。
      </p>
    </div>
  `;

  return pageShell({
    title: "KABUKI NAVI",
    subtitle: "歌舞伎羅針盤",
    bodyHTML,
    activeNav: "navi",
    headExtra: `<style>
      .navi-intro {
        text-align: center;
        padding: 24px 16px 32px;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 24px;
      }
      .navi-lead {
        font-size: 14px;
        line-height: 2;
        color: var(--text-secondary);
        letter-spacing: 0.08em;
      }
      .card-grid { grid-template-columns: 1fr; }
      .card:hover .nc-arrow {
        transform: translateX(3px);
        color: var(--gold);
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
