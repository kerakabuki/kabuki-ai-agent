// src/top_page.js
// =========================================================
// トップページ — / （3層構造：けらのすけ → 注目コンテンツ → モジュール一覧）
// =========================================================
import { pageShell } from "./web_layout.js";

export function topPageHTML() {
  const bodyHTML = `
    <!-- ── ブランド切替トグル ── -->
    <div class="brand-toggle-wrap fade-up">
      <div class="brand-toggle">
        <button class="brand-toggle-btn bt-kabuki active" onclick="switchBrand('kabuki')">KABUKI PLUS+</button>
        <button class="brand-toggle-btn bt-jikabuki" onclick="switchBrand('jikabuki')">JIKABUKI PLUS+</button>
      </div>
      <div class="brand-toggle-labels">
        <span>歌舞伎ファン・初心者向け</span>
        <span>地歌舞伎の演者・運営者向け</span>
      </div>
    </div>

    <!-- ═══ KABUKI PLUS+ コンテンツ ═══ -->
    <div id="content-kabuki" style="display:none;">

      <!-- ━━ Layer 1: けらのすけ ━━ -->
      <section class="kera-hero fade-up">
        <div class="kera-hero-inner">
          <img src="https://kabukiplus.com/assets/keranosukelogo.png" alt="けらのすけ" class="kera-hero-avatar">
          <div class="kera-hero-body">
            <div class="kera-hero-name">けらのすけ</div>
            <div class="kera-hero-role">歌舞伎の友達AI</div>
            <p class="kera-hero-msg">
              やあ！歌舞伎のことなら何でも聞いてね。<br>
              「歌舞伎座に初めて行く」「義経千本桜ってどんな話？」<br>
              なんて気軽にどうぞ！
            </p>
          </div>
        </div>
        <div class="kera-hero-cta-row">
          <a href="https://line.me/R/oaMessage/@117oizby/" target="_blank" rel="noopener" class="kera-hero-cta">
            <span class="kera-hero-cta-icon">💬</span>
            LINE で話す
          </a>
          <a href="/kabuki/chat" target="_blank" rel="noopener" class="kera-hero-cta kera-hero-cta-web">
            <span class="kera-hero-cta-icon">🌐</span>
            Web で聞く
          </a>
        </div>
        <div class="kera-hero-sub">演目ガイド・公演情報・クイズ・用語解説──何でも聞ける歌舞伎AIアシスタント</div>
      </section>

      <!-- ━━ Layer 2: 注目演目 ━━ -->
      <section class="tp-section fade-up-d1" id="tp-featured" style="display:none;">
        <h2 class="tp-section-title">注目の演目</h2>
        <div id="tp-featured-items" class="featured-grid"></div>
        <div class="featured-more">
          <a href="/kabuki/live">公演スケジュールを見る &rarr;</a>
        </div>
      </section>

      <!-- ━━ Layer 3: モジュール一覧 ━━ -->
      <section class="tp-section fade-up-d2">
        <h2 class="tp-section-title">コンテンツ</h2>
        <div class="hub-grid hub-grid-4">
          <a href="/kabuki/navi" class="hub-card hub-navi">
            <div class="hub-icon">🧭</div>
            <div class="hub-body">
              <h3>KABUKI NAVI</h3>
              <span class="hub-subtitle">歌舞伎羅針盤</span>
              <p>演目・人物・用語を探索</p>
            </div>
            <span class="hub-arrow">&rarr;</span>
          </a>
          <a href="/kabuki/live" class="hub-card hub-live">
            <div class="hub-icon">📡</div>
            <div class="hub-body">
              <h3>KABUKI LIVE</h3>
              <span class="hub-subtitle">歌舞伎瓦版</span>
              <p>ニュース・公演スケジュール</p>
            </div>
            <span class="hub-arrow">&rarr;</span>
          </a>
          <a href="/kabuki/reco" class="hub-card hub-reco">
            <div class="hub-icon">📝</div>
            <div class="hub-body">
              <h3>KABUKI RECO</h3>
              <span class="hub-subtitle">歌舞伎帖</span>
              <p>観劇記録・推し俳優・統計</p>
            </div>
            <span class="hub-arrow">&rarr;</span>
          </a>
          <a href="/kabuki/dojo" class="hub-card hub-dojo">
            <div class="hub-icon">🥋</div>
            <div class="hub-body">
              <h3>KABUKI DOJO</h3>
              <span class="hub-subtitle">歌舞伎道場</span>
              <p>クイズ・台詞稽古・大向う</p>
            </div>
            <span class="hub-arrow">&rarr;</span>
          </a>
        </div>
      </section>

      <section class="tp-section fade-up-d3">
        <p class="tp-mission">
          気良歌舞伎（岐阜県）から、全国の地歌舞伎へ。<br>
          伝統をテクノロジーで守るプロジェクトです。
        </p>
        <p class="tp-mission-link"><a href="/project">プロジェクト概要を読む &rarr;</a></p>
      </section>

      <div class="brand-cross-link">
        <span>🏯</span> 地歌舞伎の団体運営・稽古には
        <a href="/?brand=jikabuki">JIKABUKI PLUS+</a>
      </div>

    </div>

    <!-- ═══ JIKABUKI PLUS+ コンテンツ ═══ -->
    <div id="content-jikabuki" style="display:none;">

      <!-- ━━ Layer 1: けらのすけ ━━ -->
      <section class="kera-hero kera-hero-jk fade-up">
        <div class="kera-hero-inner">
          <img src="https://kabukiplus.com/assets/keranosukelogo.png" alt="けらのすけ" class="kera-hero-avatar">
          <div class="kera-hero-body">
            <div class="kera-hero-name">けらのすけ</div>
            <div class="kera-hero-role">地歌舞伎の案内AI</div>
            <p class="kera-hero-msg">
              団体の公式サイト立ち上げ、台本共有、稽古管理──<br>
              チャットで質問に答えるだけで、全部まとめてスタートできるよ。
            </p>
          </div>
        </div>
        <div class="kera-hero-cta-row">
          <a href="/jikabuki/base/onboarding" class="kera-hero-cta kera-hero-cta-jk">
            <span class="kera-hero-cta-icon">🏯</span>
            新規団体登録
          </a>
        </div>
        <div class="kera-hero-sub">登録するだけで公式サイト・FAQ・チャットボットが自動で揃います</div>
      </section>

      <!-- ━━ Layer 2: 4つのモジュール ━━ -->
      <section class="tp-section fade-up-d1">
        <h2 class="tp-section-title">4つのモジュール</h2>
        <div class="jk-mod-grid">
          <a href="/jikabuki/gate" class="jk-mod-card jk-mod-accent-1">
            <div class="jk-mod-icon">🏯</div>
            <div class="jk-mod-body">
              <div class="jk-mod-title">GATE</div>
              <div class="jk-mod-sub">ぶたい</div>
              <div class="jk-mod-desc">団体紹介・公演情報・ストーリーなど、外に向けた公式サイト。チャットボットで質問にも自動対応。</div>
            </div>
            <span class="jk-mod-arrow">&rarr;</span>
          </a>
          <a href="/jikabuki/info" class="jk-mod-card jk-mod-accent-2">
            <div class="jk-mod-icon">📡</div>
            <div class="jk-mod-body">
              <div class="jk-mod-title">INFO</div>
              <div class="jk-mod-sub">たより</div>
              <div class="jk-mod-desc">全国の地歌舞伎団体ディレクトリ、ニュース自動取得、公演カレンダー。</div>
            </div>
            <span class="jk-mod-arrow">&rarr;</span>
          </a>
          <a href="/jikabuki/base" class="jk-mod-card jk-mod-accent-3">
            <div class="jk-mod-icon">🔧</div>
            <div class="jk-mod-body">
              <div class="jk-mod-title">BASE</div>
              <div class="jk-mod-sub">がくや</div>
              <div class="jk-mod-desc">稽古スケジュール・配役管理・台本共有・公演記録など、団体運営に必要なツールが揃う楽屋。</div>
            </div>
            <span class="jk-mod-arrow">&rarr;</span>
          </a>
          <a href="/jikabuki/labo" class="jk-mod-card jk-mod-accent-4">
            <div class="jk-mod-icon">🧪</div>
            <div class="jk-mod-body">
              <div class="jk-mod-title">LABO</div>
              <div class="jk-mod-sub">こうぼう</div>
              <div class="jk-mod-desc">演目ガイド・用語辞典・クイズなど、全団体で共有するコンテンツの制作・編集。</div>
            </div>
            <span class="jk-mod-arrow">&rarr;</span>
          </a>
        </div>
      </section>

      <div class="tp-section fade-up-d4" style="text-align:center;">
        <p class="tp-mission">
          気良歌舞伎（岐阜県）から、全国の地歌舞伎へ。<br>
          伝統をテクノロジーで守るプロジェクトです。
        </p>
        <p class="tp-mission-link"><a href="/project">プロジェクト概要を読む &rarr;</a></p>
      </div>

      <div class="brand-cross-link">
        <span>🎭</span> 歌舞伎の観劇・学習には
        <a href="/?brand=kabuki">KABUKI PLUS+</a>
      </div>

    </div>

    <!-- ── データ取得スクリプト ── -->
    <script>
    /* 注目演目（KABUKI） */
    (function(){
      fetch("/api/featured").then(function(r){ return r.json(); }).then(function(data){
        var items = data && data.featured || [];
        if (!items.length) return;
        var shown = items.slice(0, 3);
        var el = document.getElementById("tp-featured-items");
        if (!el) return;
        el.innerHTML = shown.map(function(f){
          var theater = f.theater || "";
          var title = f.title || "";
          var period = f.period_text || "";
          var naviLink = f.naviId ? '/kabuki/navi/enmoku/' + encodeURIComponent(f.naviId) : '';
          var tag = naviLink ? '<a href="' + naviLink + '" class="featured-guide-link">演目ガイド</a>' : '';
          return '<div class="featured-card">'
            + '<div class="featured-theater">' + theater.replace(/</g,"&lt;") + '</div>'
            + '<div class="featured-title">' + title.replace(/</g,"&lt;") + '</div>'
            + '<div class="featured-period">' + period.replace(/</g,"&lt;") + '</div>'
            + tag
            + '</div>';
        }).join("");
        document.getElementById("tp-featured").style.display = "";
      }).catch(function(){});
    })();
    </script>

    <!-- ── ブランド切替スクリプト ── -->
    <script>
    var __tabNav = {
      kabuki: [
        { href: "/", icon: "\u{1F3E0}", label: "\u30C8\u30C3\u30D7", key: "home" },
        { href: "/kabuki/navi", icon: "\u{1F9ED}", label: "NAVI", key: "navi" },
        { href: "/kabuki/live", icon: "\u{1F4E1}", label: "LIVE", key: "live" },
        { href: "/kabuki/reco", icon: "\u{1F4DD}", label: "RECO", key: "reco" },
        { href: "/kabuki/dojo", icon: "\u{1F94B}", label: "DOJO", key: "dojo" }
      ],
      jikabuki: [
        { href: "/", icon: "\u{1F3E0}", label: "\u30C8\u30C3\u30D7", key: "home" },
        { href: "/jikabuki/gate", icon: "\u{1F3EF}", label: "GATE", key: "gate" },
        { href: "/jikabuki/info", icon: "\u{1F4E1}", label: "INFO", key: "info" },
        { href: "/jikabuki/base", icon: "\u{1F527}", label: "BASE", key: "base" },
        { href: "/jikabuki/labo", icon: "\u{1F9EA}", label: "LABO", key: "labo" }
      ]
    };
    function switchBrand(brand) {
      document.getElementById('content-kabuki').style.display = brand === 'kabuki' ? '' : 'none';
      document.getElementById('content-jikabuki').style.display = brand === 'jikabuki' ? '' : 'none';
      var btns = document.querySelectorAll('.brand-toggle-btn');
      for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
      document.querySelector('.bt-' + brand).classList.add('active');
      var hb = document.querySelector('.header-brand');
      if (hb) hb.textContent = brand === 'jikabuki' ? '\u{1F3EF} JIKABUKI PLUS+' : '\u{1F3AD} KABUKI PLUS+';
      var h1 = document.querySelector('header h1');
      if (h1) h1.textContent = brand === 'jikabuki' ? '\u6F14\u3058\u308B\u4EBA\u306E\u3001\u30C7\u30B8\u30BF\u30EB\u697D\u5C4B\u3002' : '\u6B4C\u821E\u4F0E\u3092\u3001\u3082\u3063\u3068\u9762\u767D\u304F\u3002';
      var sub = document.querySelector('.header-sub');
      if (sub) sub.textContent = brand === 'jikabuki' ? '\u8A18\u9332\u3059\u308B\u3001\u7A3D\u53E4\u3059\u308B\u3001\u5171\u6709\u3059\u308B\u3002' : '\u89B3\u308B\u3001\u5B66\u3076\u3001\u6F14\u3058\u308B\u3002';
      var tb = document.getElementById('pwa-tab-bar');
      if (tb) {
        var items = __tabNav[brand] || __tabNav.kabuki;
        tb.innerHTML = items.map(function(n) {
          var cls = n.key === 'home' ? 'pwa-tab-active' : '';
          return '<a href="' + n.href + '" class="' + cls + '"><span class="pwa-tab-icon">' + n.icon + '</span>' + n.label + '</a>';
        }).join('');
      }
      try { localStorage.setItem('kabuki_plus_brand', brand); } catch(e) {}
    }
    (function() {
      try {
        var params = new URLSearchParams(location.search);
        var q = params.get('brand');
        if (q === 'kabuki' || q === 'jikabuki') {
          switchBrand(q);
          if (history.replaceState) history.replaceState(null, '', '/');
        } else {
          var saved = localStorage.getItem('kabuki_plus_brand');
          switchBrand(saved === 'jikabuki' ? 'jikabuki' : 'kabuki');
        }
      } catch(e) { switchBrand('kabuki'); }
    })();
    </script>

  `;

  return pageShell({
    title: "歌舞伎を、もっと面白く。",
    subtitle: "観る、学ぶ、演じる。",
    bodyHTML,
    activeNav: "home",
    hideNav: true,
    ogImage: "https://kabukiplus.com/assets/ogp/ogp_kabukiplus_top.png",
    headExtra: `<style>
      /* ── ブランド切替トグル ── */
      .brand-toggle-wrap { text-align: center; margin-bottom: 1.5rem; }
      .brand-toggle {
        display: inline-flex;
        border-radius: var(--radius-sm);
        overflow: hidden;
        border: 1px solid var(--border-light);
        box-shadow: var(--shadow-sm);
      }
      .brand-toggle-btn {
        padding: 10px 20px;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 1px;
        border: none;
        cursor: pointer;
        font-family: 'Noto Serif JP', serif;
        transition: all 0.2s;
        background: var(--bg-subtle);
        color: var(--text-tertiary);
      }
      .brand-toggle-btn.active.bt-kabuki {
        background: var(--text-primary);
        color: white;
      }
      .brand-toggle-btn.active.bt-jikabuki {
        background: var(--accent-1);
        color: white;
      }
      .brand-toggle-labels {
        display: flex;
        justify-content: center;
        gap: 0;
        margin-top: 6px;
      }
      .brand-toggle-labels span {
        flex: 1;
        font-size: 10px;
        color: var(--text-tertiary);
        max-width: 160px;
        text-align: center;
      }

      /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         Layer 1: けらのすけヒーロー
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
      .kera-hero {
        text-align: center;
        padding: 24px 20px 28px;
        margin-bottom: 2rem;
        background: linear-gradient(180deg, var(--gold-soft) 0%, var(--bg-page) 100%);
        border-radius: var(--radius-lg);
        border: 1px solid var(--gold-light);
      }
      .kera-hero-jk {
        background: linear-gradient(180deg, var(--accent-1-soft) 0%, var(--bg-page) 100%);
        border-color: #e8c8c0;
      }
      .kera-hero-inner {
        display: flex;
        align-items: center;
        gap: 16px;
        text-align: left;
        margin-bottom: 16px;
      }
      .kera-hero-avatar {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid white;
        box-shadow: var(--shadow-md);
        flex-shrink: 0;
      }
      .kera-hero-body { flex: 1; min-width: 0; }
      .kera-hero-name {
        font-family: 'Noto Serif JP', serif;
        font-size: 18px;
        font-weight: 700;
        color: var(--text-primary);
        letter-spacing: 2px;
      }
      .kera-hero-role {
        font-size: 11px;
        color: var(--gold-dark);
        font-weight: 500;
        letter-spacing: 0.5px;
        margin-top: 2px;
      }
      .kera-hero-jk .kera-hero-role {
        color: var(--accent-1);
      }
      .kera-hero-msg {
        margin-top: 8px;
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.8;
      }
      .kera-hero-cta {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 28px;
        background: #06C755;
        color: white;
        border-radius: 28px;
        font-size: 14px;
        font-weight: 600;
        text-decoration: none;
        box-shadow: 0 4px 12px rgba(6,199,85,0.3);
        transition: all 0.2s;
        letter-spacing: 0.5px;
      }
      .kera-hero-cta:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(6,199,85,0.4);
        text-decoration: none;
        color: white;
      }
      .kera-hero-cta-icon { font-size: 16px; }
      .kera-hero-cta-row {
        display: flex;
        gap: 10px;
        justify-content: center;
        flex-wrap: wrap;
      }
      .kera-hero-cta-web {
        background: linear-gradient(135deg, var(--gold), var(--gold-dark));
        box-shadow: 0 4px 12px rgba(197,162,85,0.3);
      }
      .kera-hero-cta-web:hover {
        box-shadow: 0 6px 16px rgba(197,162,85,0.4);
      }
      .kera-hero-sub {
        margin-top: 12px;
        font-size: 11px;
        color: var(--text-tertiary);
        letter-spacing: 0.3px;
      }

      /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         Layer 2: 注目演目
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
      .featured-grid {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .featured-card {
        padding: 14px 16px;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-left: 3px solid var(--gold);
        border-radius: var(--radius-sm);
        box-shadow: var(--shadow-sm);
      }
      .featured-theater {
        font-size: 11px;
        color: var(--gold-dark);
        font-weight: 600;
        letter-spacing: 0.5px;
        margin-bottom: 2px;
      }
      .featured-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 15px;
        font-weight: 600;
        color: var(--text-primary);
        letter-spacing: 1px;
      }
      .featured-period {
        font-size: 12px;
        color: var(--text-secondary);
        margin-top: 2px;
      }
      .featured-guide-link {
        display: inline-block;
        margin-top: 6px;
        font-size: 11px;
        color: var(--gold-dark);
        border: 1px solid var(--gold-light);
        border-radius: 12px;
        padding: 2px 10px;
        text-decoration: none;
        transition: all 0.15s;
      }
      .featured-guide-link:hover {
        background: var(--gold-soft);
        text-decoration: none;
      }
      .featured-more {
        text-align: right;
        margin-top: 10px;
        font-size: 13px;
      }
      .featured-more a { color: var(--gold-dark); }

      /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         Layer 3 共通
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
      .tp-section { margin-bottom: 2rem; }
      .tp-section-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: 'Noto Serif JP', serif;
        font-size: 15px;
        font-weight: 600;
        color: var(--text-primary);
        letter-spacing: 1px;
        margin: 0 0 14px;
      }
      .tp-section-title::before {
        content: '';
        width: 3px;
        height: 18px;
        background: var(--gold);
        border-radius: 2px;
        flex-shrink: 0;
      }

      /* ── ハブカード ── */
      .hub-grid-4 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .hub-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 18px 20px;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        text-decoration: none;
        color: var(--text-primary);
        transition: transform 0.15s, box-shadow 0.15s;
        box-shadow: var(--shadow-sm);
        backdrop-filter: blur(4px);
      }
      .hub-navi { border-left: 3px solid var(--accent-1); }
      .hub-live { border-left: 3px solid var(--accent-2); }
      .hub-reco { border-left: 3px solid var(--accent-4); }
      .hub-dojo { border-left: 3px solid var(--accent-3); }
      .hub-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
        text-decoration: none;
      }
      .hub-icon {
        width: 44px; height: 44px;
        border-radius: var(--radius-sm);
        display: flex; align-items: center; justify-content: center;
        font-size: 20px; flex-shrink: 0;
      }
      .hub-navi .hub-icon { background: var(--accent-1-soft); }
      .hub-live .hub-icon { background: var(--accent-2-soft); }
      .hub-reco .hub-icon { background: var(--accent-4-soft); }
      .hub-dojo .hub-icon { background: var(--accent-3-soft); }
      .hub-body h3 {
        font-family: 'Noto Serif JP', serif;
        font-size: 15px; font-weight: 600;
        color: var(--text-primary); letter-spacing: 1px; margin-bottom: 2px;
      }
      .hub-body .hub-subtitle {
        display: block; font-size: 11px;
        color: var(--text-tertiary); letter-spacing: 0.5px; margin-bottom: 4px;
      }
      .hub-body p { font-size: 12px; color: var(--text-secondary); }
      .hub-arrow {
        color: var(--text-tertiary); font-size: 16px;
        margin-left: auto; transition: transform 0.15s; flex-shrink: 0;
      }
      .hub-card:hover .hub-arrow { transform: translateX(3px); color: var(--gold); }

      /* ── プロジェクト ── */
      .tp-mission {
        font-size: 14px; color: var(--text-secondary);
        line-height: 1.8; text-align: center; margin: 0 0 8px;
      }
      .tp-mission-link { text-align: center; margin: 0 0 1.25rem; font-size: 13px; }
      .tp-mission-link a { color: var(--gold); text-decoration: none; }
      .tp-mission-link a:hover { text-decoration: underline; }

      /* ── JIKABUKI モジュールカード ── */
      .jk-mod-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .jk-mod-card {
        display: flex; flex-direction: column; gap: 8px; padding: 18px 16px;
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-lg); text-decoration: none; color: var(--text-primary);
        transition: all 0.18s; box-shadow: var(--shadow-sm);
        position: relative; border-top: 3px solid transparent;
      }
      .jk-mod-accent-1 { border-top-color: var(--accent-1); }
      .jk-mod-accent-2 { border-top-color: var(--accent-2); }
      .jk-mod-accent-3 { border-top-color: var(--accent-3); }
      .jk-mod-accent-4 { border-top-color: var(--accent-4); }
      .jk-mod-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); text-decoration: none; }
      .jk-mod-icon { font-size: 28px; }
      .jk-mod-body { flex: 1; }
      .jk-mod-title { font-family: 'Noto Serif JP', serif; font-size: 16px; font-weight: 700; letter-spacing: 2px; }
      .jk-mod-sub { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }
      .jk-mod-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.7; margin-top: 6px; }
      .jk-mod-arrow { position: absolute; top: 16px; right: 14px; font-size: 16px; color: var(--text-tertiary); transition: transform 0.15s; }
      .jk-mod-card:hover .jk-mod-arrow { transform: translateX(3px); color: var(--gold); }

      /* ── ブランド相互リンク ── */
      .brand-cross-link {
        text-align: center; font-size: 12px; color: var(--text-tertiary);
        margin: 2rem 0 0.5rem; padding: 12px 0; border-top: 1px solid var(--border-light);
      }
      .brand-cross-link span { margin-right: 2px; }
      .brand-cross-link a { color: var(--gold-dark); font-weight: 500; }

      /* ── レスポンシブ ── */
      @media (max-width: 600px) {
        .hub-grid-4 { grid-template-columns: 1fr; }
        .jk-val-grid { grid-template-columns: 1fr; }
        .jk-mod-grid { grid-template-columns: 1fr; }
        .kera-hero-inner { flex-direction: column; text-align: center; gap: 12px; }
        .kera-hero-avatar { width: 64px; height: 64px; }
        .kera-hero-msg { font-size: 12px; text-align: center; }
        .kera-hero-msg br { display: none; }
      }
    </style>`,
  });
}
