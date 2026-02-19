// src/navi_page.js
// =========================================================
// 歌舞伎ナビ（Discover Hub） — /navi
// 演目・用語・おすすめへの入口（調べる系）
// =========================================================
import { pageShell } from "./web_layout.js";

const NAVI_CARDS = [
  { icon: "🧭", title: "観劇ナビ",       desc: "チケット購入・劇場アクセス・席の選び方・幕間まで、はじめての歌舞伎座を6ステップで丸ごとガイド", href: "/kabuki/navi/theater",  delay: 0, featured: true },
  { icon: "📜", title: "演目・人物ガイド", desc: "観る前に読んでおくと舞台がぐっと面白くなる。有名演目のあらすじ・みどころ・登場人物を詳しく解説", href: "/kabuki/navi/enmoku",   delay: 1, featured: true },
  { icon: "📖", title: "歌舞伎用語いろは", desc: "「見得を切る」「花道」「黒御簾」…舞台で気になった言葉を126語、カテゴリ別にわかりやすく解説",   href: "/kabuki/navi/glossary",  delay: 2 },
  { icon: "🏮", title: "おすすめ演目",    desc: "「何を観ればいい？」に答えます。初心者向け・ジャンル別のおすすめ演目を厳選してご紹介",           href: "/kabuki/navi/recommend", delay: 3 },
  { icon: "🎎", title: "観劇マナー",      desc: "スマホ・撮影・服装のルールをひと目で確認。これを知っておけば自信を持って劇場に入れます",          href: "/kabuki/navi/manners",   delay: 4 },
];

export function naviPageHTML({ googleClientId = "" } = {}) {
  const accentClasses = ["card-accent-gold", "card-accent-1", "card-accent-2", "card-accent-3", "card-accent-4"];
  const cards = NAVI_CARDS.map((c, i) => {
    const featured = c.featured ? " navi-card-featured" : "";
    return `
    <a href="${c.href}" class="card ${accentClasses[i] || ''}${featured} fade-up-d${c.delay}" style="display:flex;align-items:center;gap:16px;padding:20px;">
      <span class="card-emoji navi-emoji-${c.featured ? 'featured' : 'normal'}">${c.icon}</span>
      <div style="flex:1;min-width:0;">
        <h3>${c.title}${c.featured ? ' <span class="navi-badge">初心者向け</span>' : ''}</h3>
        <p class="card-desc">${c.desc}</p>
      </div>
      <span style="color:var(--text-tertiary);font-size:18px;flex-shrink:0;transition:transform 0.15s;" class="nc-arrow">→</span>
    </a>`;
  }).join("\n");

  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span>KABUKI NAVI
    </div>

    <section class="navi-intro fade-up">
      <p class="navi-lead">
        はじめての観劇も、もっと深く楽しむためにも。<br>
        歌舞伎の「知りたい」が、ここで見つかります。
      </p>
    </section>

    <div class="card-grid">
      ${cards}
    </div>

    <div class="navi-footer fade-up-d4">
      <p>
        気になる演目を観たら <a href="/kabuki/reco">KABUKI RECO</a> で記録を。<br>
        知識を試すなら <a href="/kabuki/dojo">KABUKI DOJO</a> でクイズ・稽古へ。
      </p>
    </div>
  `;

  return pageShell({
    title: "KABUKI NAVI",
    subtitle: "歌舞伎羅針盤",
    bodyHTML,
    activeNav: "navi",
    googleClientId,
    headExtra: `<style>
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
      .card-grid { grid-template-columns: 1fr; }
      .card:hover .nc-arrow {
        transform: translateX(3px);
        color: var(--gold);
      }

      /* ── おすすめカード強調 ── */
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
