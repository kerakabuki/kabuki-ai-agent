// src/reco_page.js
// =========================================================
// JIKABUKI PLUS+ ランディングページ — /jikabuki
// 公開プラットフォーム + 団体向け機能の2層構成
// =========================================================
import { pageShell } from "./web_layout.js";

const PUBLIC_CARDS = [
  { icon: "🏠", title: "団体公式サイト",   desc: "気良歌舞伎の紹介・歴史・会場・アクセス・参加方法", href: "/jikabuki/gate/kera/about" },
  { icon: "🤖", title: "団体チャットボット", desc: "けらのすけ（AI）が気良歌舞伎の質問に回答", href: "/jikabuki/gate/kera/about" },
  { icon: "📅", title: "公演情報ページ",   desc: "次回公演・過去公演を自動掲載", href: "/jikabuki/gate/kera/performance" },
  { icon: "🔥", title: "ストーリー",       desc: "気良歌舞伎の歩み──全10話＋まとめ", href: "/jikabuki/gate/kera/story" },
  { icon: "📄", title: "地歌舞伎かわら版", desc: "高雄・気良 地歌舞伎かわら版バックナンバー", href: "/jikabuki/gate/kera/kawaraban" },
  { icon: "🪙", title: "NFTガイド",       desc: "気良歌舞伎NFTの購入ガイド", href: "/jikabuki/gate/kera/nft" },
];

const INTERNAL_FEATURES = [
  { icon: "📋", title: "公演記録・出演記録", desc: "演目・配役・日程のアーカイブ", href: "/groups/kera/records" },
  { icon: "📝", title: "稽古メモ・参考動画", desc: "気づきの記録＋参考URLリンク", href: "/groups/kera/notes" },
  { icon: "📖", title: "デジタル台本",       desc: "スマホ・タブレットで稽古に使える", href: "/groups/kera/scripts" },
  { icon: "🎤", title: "稽古モード【実践版】", desc: "自分の役の台詞稽古・台本/動画連動", href: "/groups/kera/training" },
  { icon: "🤝", title: "台本共有ライブラリ",   desc: "団体間で台本を共有し事務局負担を軽減", href: "/jikabuki/base/scripts" },
];

export function recoPageHTML() {
  const publicCards = PUBLIC_CARDS.map((c, i) => `
    <a href="${c.href}" class="jk-feat-card fade-up-d${Math.min(i, 7)}">
      <div class="jk-feat-icon">${c.icon}</div>
      <div class="jk-feat-body">
        <div class="jk-feat-title">${c.title}</div>
        <div class="jk-feat-desc">${c.desc}</div>
      </div>
      <span class="jk-feat-arrow">&rarr;</span>
    </a>
  `).join("\n");

  const internalCards = INTERNAL_FEATURES.map(f => {
    if (f.expand) {
      return `<div class="jk-feat-card jk-feat-disabled jk-feat-expand">
        <div class="jk-feat-icon">${f.icon}</div>
        <div class="jk-feat-body">
          <div class="jk-feat-title">${f.title}</div>
          <div class="jk-feat-desc">${f.desc}</div>
        </div>
        <span class="jk-badge">横展開</span>
      </div>`;
    }
    if (f.href) {
      return `<a href="${f.href}" class="jk-feat-card">
        <div class="jk-feat-icon">${f.icon}</div>
        <div class="jk-feat-body">
          <div class="jk-feat-title">${f.title}</div>
          <div class="jk-feat-desc">${f.desc}</div>
        </div>
        <span class="jk-feat-arrow">&rarr;</span>
      </a>`;
    }
    return `<div class="jk-feat-card jk-feat-disabled">
      <div class="jk-feat-icon">${f.icon}</div>
      <div class="jk-feat-body">
        <div class="jk-feat-title">${f.title}</div>
        <div class="jk-feat-desc">${f.desc}</div>
      </div>
      <span class="jk-badge">準備中</span>
    </div>`;
  }).join("\n");

  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>&rsaquo;</span>JIKABUKI PLUS+
    </div>

    <section class="jk-hero fade-up">
      <div class="jk-hero-catch">守るために、変わる。</div>
      <p class="jk-hero-lead">
        地歌舞伎を、テクノロジーの力でもっと身近に、もっと面白く。<br>
        「JIKABUKI PLUS+」は、地歌舞伎の団体が<br>
        公演情報の発信、知識の蓄積、稽古の効率化を行うためのプラットフォームです。
      </p>
    </section>

    <!-- ── 地歌舞伎ニュース ── -->
    <section class="jk-news fade-up-d1" id="jk-news-section" style="display:none;">
      <h2 class="jk-news-heading">🏯 地歌舞伎ニュース</h2>
      <div id="jk-news-items" class="jk-news-list"></div>
      <div class="jk-news-more">
        <a href="/kabuki/live/news" class="tp-link">ニュース一覧 &rarr;</a>
      </div>
    </section>
    <script>
    (function(){
      fetch("/api/news").then(function(r){ return r.json(); }).then(function(data){
        var articles = data && data.articles || [];
        if (!articles.length) return;
        var jika = articles.filter(function(a){ return a.feedKey === "jikabuki"; }).slice(0, 5);
        if (!jika.length) return;
        var el = document.getElementById("jk-news-items");
        el.innerHTML = jika.map(function(a){
          var d = a.pubTs ? new Date(a.pubTs) : null;
          var ds = d ? (d.getMonth()+1) + "/" + d.getDate() : "";
          return '<a href="' + a.link + '" target="_blank" rel="noopener" class="jk-news-item">'
            + '<span class="jk-news-date">' + ds + '</span>'
            + '<span class="jk-news-title">' + (a.title||"").replace(/</g,"&lt;") + '</span>'
            + '</a>';
        }).join("");
        document.getElementById("jk-news-section").style.display = "";
      }).catch(function(){});
    })();
    </script>

    <!-- ── JIKABUKI GATE ── -->
    <section class="jk-block fade-up-d2">
      <div class="jk-block-header jk-block-pub">
        <span class="jk-block-icon">🏯</span>
        <div>
          <h2 class="jk-block-title">JIKABUKI GATE ── 表玄関</h2>
          <p class="jk-block-sub">団体を知ってもらう</p>
        </div>
      </div>
      <p class="jk-block-note">
        気良歌舞伎をお手本に、公式サイト・チャットボット・公演情報が自動生成されます。
      </p>
      <div class="jk-feat-list">
        ${publicCards}
      </div>
    </section>

    <!-- ── JIKABUKI BASE ── -->
    <section class="jk-block fade-up-d4">
      <div class="jk-block-header jk-block-int">
        <span class="jk-block-icon">🔧</span>
        <div>
          <h2 class="jk-block-title">JIKABUKI BASE ── 楽屋</h2>
          <p class="jk-block-sub">運営・稽古に使う</p>
        </div>
      </div>
      <p class="jk-block-note">
        公演記録の管理、デジタル台本、稽古ツールなど、運営・稽古に必要な機能を順次提供します。
      </p>
      <div class="jk-feat-list">
        ${internalCards}
      </div>
    </section>

    <!-- ── 共有基盤 ── -->
    <section class="jk-block fade-up-d6" style="margin-top:2rem;">
      <div class="jk-shared-base">
        <div class="jk-shared-title">共有基盤</div>
        <div class="jk-shared-grid">
          <div class="jk-shared-item">🤖 けらのすけ（AIガイド）</div>
          <div class="jk-shared-item">🎬 稽古エンジン</div>
          <div class="jk-shared-item">💬 LINE Bot / Web Widget</div>
          <div class="jk-shared-item">☁️ Cloudflare Workers / R2</div>
          <div class="jk-shared-item">🧠 Workers AI（LLM / RAG）</div>
        </div>
      </div>
    </section>

    <!-- ── 横展開 ── -->
    <section class="jk-block fade-up-d7" style="margin-top:2rem;">
      <div class="jk-block-header jk-block-pub">
        <span class="jk-block-icon">🚀</span>
        <div>
          <h2 class="jk-block-title">横展開・団体間連携</h2>
          <p class="jk-block-sub">他の地歌舞伎団体への展開</p>
        </div>
      </div>
      <div class="jk-feat-list">
        <a href="/jikabuki/base/onboarding" class="jk-feat-card">
          <div class="jk-feat-icon">🤖</div>
          <div class="jk-feat-body">
            <div class="jk-feat-title">新規団体登録</div>
            <div class="jk-feat-desc">質問に答えるだけで公式サイト＋チャットボットが完成</div>
          </div>
          <span class="jk-feat-arrow">&rarr;</span>
        </a>
        <a href="/jikabuki/base/scripts" class="jk-feat-card">
          <div class="jk-feat-icon">📖</div>
          <div class="jk-feat-body">
            <div class="jk-feat-title">台本共有ライブラリ</div>
            <div class="jk-feat-desc">団体間で台本を共有し事務局負担を軽減</div>
          </div>
          <span class="jk-feat-arrow">&rarr;</span>
        </a>
      </div>
    </section>

    <div class="jk-footer fade-up-d8">
      <p>
        JIKABUKI PLUS+ の機能は段階的に実装中です。<br>
        まずは気良歌舞伎で全機能を使い込み、磨いてから他団体へ展開予定。<br>
        ご要望・ご質問は<a href="/jikabuki/gate/kera/about">気良歌舞伎</a>までお気軽にどうぞ。
      </p>
    </div>
  `;

  return pageShell({
    title: "JIKABUKI PLUS+",
    subtitle: "演じる人の、デジタル楽屋。",
    bodyHTML,
    activeNav: "gate",
    brand: "jikabuki",
    headExtra: `<style>
      /* ── ヒーロー ── */
      .jk-hero {
        text-align: center;
        padding: 1.5rem 1rem 2rem;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 2rem;
      }
      .jk-hero-catch {
        font-family: 'Noto Serif JP', serif;
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--accent-1);
        letter-spacing: 0.15em;
        margin-bottom: 0.8rem;
      }
      .jk-hero-lead {
        font-size: 0.92rem;
        line-height: 2;
        color: var(--text-secondary);
        letter-spacing: 0.05em;
      }

      /* ── ニュース ── */
      .jk-news {
        margin-bottom: 2rem; padding: 20px;
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-md); box-shadow: var(--shadow-sm);
      }
      .jk-news-heading {
        font-family: 'Noto Serif JP', serif; font-size: 15px; font-weight: 600;
        color: var(--accent-1); margin-bottom: 12px; letter-spacing: 1px;
      }
      .jk-news-list { display: flex; flex-direction: column; gap: 0; }
      .jk-news-item {
        display: flex; align-items: baseline; gap: 10px; padding: 8px 4px;
        text-decoration: none; color: var(--text-primary); border-bottom: 1px solid var(--bg-subtle);
        transition: background 0.12s;
      }
      .jk-news-item:last-child { border-bottom: none; }
      .jk-news-item:hover { background: var(--gold-soft); text-decoration: none; }
      .jk-news-date { font-size: 11px; color: var(--text-tertiary); flex-shrink: 0; min-width: 3em; }
      .jk-news-title { font-size: 13px; line-height: 1.6; }
      .jk-news-more { text-align: right; margin-top: 8px; }

      /* ── ブロック ── */
      .jk-block { margin-bottom: 2rem; }
      .jk-block-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
      }
      .jk-block-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        flex-shrink: 0;
      }
      .jk-block-pub .jk-block-icon { background: var(--accent-1-soft); }
      .jk-block-int .jk-block-icon { background: var(--bg-subtle); }
      .jk-block-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        letter-spacing: 1px;
      }
      .jk-block-sub {
        font-size: 11px;
        color: var(--text-tertiary);
        margin-top: 1px;
      }
      .jk-block-note {
        font-size: 12px;
        color: var(--text-secondary);
        margin-bottom: 14px;
        padding-left: 2px;
        line-height: 1.8;
      }

      /* ── 機能カード ── */
      .jk-feat-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .jk-feat-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        text-decoration: none;
        color: var(--text-primary);
        transition: all 0.15s;
        box-shadow: var(--shadow-sm);
      }
      .jk-feat-card:hover {
        border-color: var(--gold);
        box-shadow: var(--shadow-md);
        text-decoration: none;
      }
      .jk-feat-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        flex-shrink: 0;
        background: var(--bg-subtle);
        box-shadow: var(--shadow-sm);
      }
      .jk-feat-body { flex: 1; min-width: 0; }
      .jk-feat-title {
        font-size: 14px;
        font-weight: 600;
      }
      .jk-feat-desc {
        font-size: 11px;
        color: var(--text-tertiary);
        margin-top: 2px;
      }
      .jk-feat-arrow {
        color: var(--text-tertiary);
        font-size: 16px;
        margin-left: auto;
        transition: transform 0.15s;
        flex-shrink: 0;
      }
      .jk-feat-card:hover .jk-feat-arrow {
        transform: translateX(3px);
        color: var(--gold);
      }
      .jk-feat-disabled {
        opacity: 0.6;
        cursor: default;
      }
      .jk-feat-disabled:hover {
        border-color: var(--border-light);
        box-shadow: var(--shadow-sm);
      }
      .jk-feat-expand {
        border: 1px dashed var(--accent-1);
        opacity: 0.7;
        position: relative;
      }
      .jk-feat-expand .jk-badge { background: var(--accent-1); }
      .jk-badge {
        font-size: 9px;
        font-weight: 600;
        background: var(--text-tertiary);
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        margin-left: auto;
        flex-shrink: 0;
        letter-spacing: 0.5px;
      }

      /* ── 共有基盤 ── */
      .jk-shared-base {
        border: 2px solid var(--gold-light);
        border-radius: var(--radius-md);
        background: var(--bg-card);
        padding: 18px 20px;
        box-shadow: var(--shadow-sm);
      }
      .jk-shared-title {
        text-align: center;
        font-family: 'Noto Serif JP', serif;
        font-size: 14px;
        font-weight: 600;
        color: var(--gold-dark);
        margin-bottom: 14px;
        letter-spacing: 1px;
      }
      .jk-shared-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }
      .jk-shared-item {
        padding: 8px 10px;
        background: var(--gold-soft);
        border-radius: var(--radius-sm);
        font-size: 12px;
        font-weight: 500;
      }
      @media (max-width: 600px) {
        .jk-shared-grid { grid-template-columns: 1fr; }
      }

      /* ── フッター ── */
      .jk-footer {
        text-align: center;
        margin-top: 2rem;
        padding: 1.5rem 1rem;
        border-top: 1px solid var(--border-light);
        color: var(--text-tertiary);
        font-size: 0.88rem;
        line-height: 1.8;
      }
    </style>`
  });
}
