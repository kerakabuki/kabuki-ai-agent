// src/top_page.js
// =========================================================
// トップページ — / （ブランド切替トグル付きポータル）
// サイト紹介ページ：初めて訪れた人が全体像を把握できるように
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
    <div id="content-kabuki">

      <!-- キャッチコピー -->
      <section class="catch-section fade-up">
        <p class="catch-lead">
          歌舞伎は、四百年の物語。<br>
          知れば知るほど、面白くなる。
        </p>
        <p class="catch-sub">
          はじめての歌舞伎でも大丈夫。<br>
          演目ガイド、用語解説、クイズ、稽古体験──<br>
          あなたの「ちょっと気になる」を、一緒に楽しもう。
        </p>
      </section>

      <!-- 4つのハブカード -->
      <section class="tp-section fade-up-d1">
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

      <!-- プロジェクト概要＋今すぐ試す -->
      <section class="tp-section fade-up-d2">
        <p class="tp-mission">
          気良歌舞伎（岐阜県）から、全国の地歌舞伎へ。<br>
          伝統をテクノロジーで守るプロジェクトです。
        </p>
        <p class="tp-mission-link"><a href="/project">プロジェクト概要を読む →</a></p>
      </section>

    </div>

    <!-- ═══ JIKABUKI PLUS+ コンテンツ ═══ -->
    <div id="content-jikabuki" style="display:none;">

      <!-- キャッチコピー -->
      <section class="catch-section fade-up">
        <p class="catch-lead">
          守るために、変わる。<br>
          地歌舞伎を、テクノロジーの力で。
        </p>
        <p class="catch-sub">
          公式サイトの立ち上げ、台本の共有、稽古の記録──<br>
          団体の運営に必要なものを、ひとつのプラットフォームに。<br>
          気良歌舞伎（岐阜県郡上市）から、全国の仲間へ。
        </p>
      </section>

      <!-- JIKABUKIでできること -->
      <section class="tp-section fade-up-d1">
        <h2 class="tp-section-title">JIKABUKIでできること</h2>
        <div class="jk-val-grid">
          <div class="jk-val-card">
            <div class="jk-val-icon">💬</div>
            <div class="jk-val-title">チャットで導入完了</div>
            <div class="jk-val-desc">LINE感覚のチャットで団体情報を入力するだけ。AIが公式ページを自動生成します。</div>
          </div>
          <div class="jk-val-card">
            <div class="jk-val-icon">📖</div>
            <div class="jk-val-title">台本共有 &amp; 配役管理</div>
            <div class="jk-val-desc">台本をアップロードして団体内で共有。公演ごとの配役も一元管理できます。</div>
          </div>
          <div class="jk-val-card">
            <div class="jk-val-icon">📅</div>
            <div class="jk-val-title">稽古スケジュール</div>
            <div class="jk-val-desc">稽古日程の登録・出欠確認・LINEへの共有がワンストップ。公演目標に向けた進捗も見える化。</div>
          </div>
          <div class="jk-val-card">
            <div class="jk-val-icon">🗂️</div>
            <div class="jk-val-title">業界データベース</div>
            <div class="jk-val-desc">演目ガイド・用語辞典・団体情報を横断的にデータベース化。ナレッジを次世代へ。</div>
          </div>
        </div>
      </section>

      <!-- 4モジュール詳細 -->
      <section class="tp-section fade-up-d2">
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

      <!-- 地歌舞伎ニュース -->
      <section class="tp-section jk-news-section fade-up-d3" id="tp-jk-news" style="display:none;">
        <h2 class="tp-section-title">地歌舞伎ニュース</h2>
        <div id="tp-jk-news-items" class="jk-news-list"></div>
        <div class="jk-news-more">
          <a href="/jikabuki/info/news" class="jk-news-link">ニュース一覧 &rarr;</a>
        </div>
      </section>
      <script>
      (function(){
        fetch("/api/news").then(function(r){ return r.json(); }).then(function(data){
          var articles = data && data.articles || [];
          if (!articles.length) return;
          var jika = articles.filter(function(a){ return a.feedKey === "jikabuki"; }).slice(0, 5);
          if (!jika.length) return;
          var el = document.getElementById("tp-jk-news-items");
          if (!el) return;
          el.innerHTML = jika.map(function(a){
            var d = a.pubTs ? new Date(a.pubTs) : null;
            var ds = d ? (d.getMonth()+1) + "/" + d.getDate() : "";
            return '<a href="' + a.link + '" target="_blank" rel="noopener" class="jk-news-item">'
              + '<span class="jk-news-date">' + ds + '</span>'
              + '<span class="jk-news-title">' + (a.title||"").replace(/</g,"&lt;") + '</span>'
              + '</a>';
          }).join("");
          document.getElementById("tp-jk-news").style.display = "";
        }).catch(function(){});
      })();
      </script>

      <!-- プロジェクトリンク -->
      <div class="tp-section fade-up-d4" style="text-align:center;">
        <p class="tp-mission">
          気良歌舞伎（岐阜県）から、全国の地歌舞伎へ。<br>
          伝統をテクノロジーで守るプロジェクトです。
        </p>
        <p class="tp-mission-link"><a href="/project">プロジェクト概要を読む →</a></p>
      </div>

    </div>

    <!-- ── ブランド切替スクリプト ── -->
    <script>
    function switchBrand(brand) {
      document.getElementById('content-kabuki').style.display = brand === 'kabuki' ? '' : 'none';
      document.getElementById('content-jikabuki').style.display = brand === 'jikabuki' ? '' : 'none';
      var btns = document.querySelectorAll('.brand-toggle-btn');
      for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
      document.querySelector('.bt-' + brand).classList.add('active');
      var hb = document.querySelector('.header-brand');
      if (hb) hb.textContent = brand === 'jikabuki' ? '🏯 JIKABUKI PLUS+' : '🎭 KABUKI PLUS+';
      var h1 = document.querySelector('header h1');
      if (h1) h1.textContent = brand === 'jikabuki' ? '演じる人の、デジタル楽屋。' : '歌舞伎を、もっと面白く。';
      var sub = document.querySelector('.header-sub');
      if (sub) sub.textContent = brand === 'jikabuki' ? '記録する、稽古する、共有する。' : '観る、学ぶ、演じる。';
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
          if (saved === 'jikabuki') switchBrand('jikabuki');
        }
      } catch(e) {}
    })();
    </script>

  `;

  return pageShell({
    title: "歌舞伎を、もっと面白く。",
    subtitle: "観る、学ぶ、演じる。",
    bodyHTML,
    activeNav: "home",
    hideNav: true,
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

      /* ── セクション ── */
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
      .tp-link {
        font-size: 13px;
        color: var(--text-secondary);
        text-decoration: none;
        padding: 8px 20px;
        border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm);
        transition: all 0.15s;
        display: inline-block;
      }
      .tp-link:hover {
        border-color: var(--gold);
        color: var(--gold-dark);
        background: var(--gold-soft);
        text-decoration: none;
      }

      /* ── キャッチコピー ── */
      .catch-section {
        text-align: center;
        padding: 0.5rem 0 1.8rem;
      }
      .catch-lead {
        font-family: 'Noto Serif JP', serif;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        letter-spacing: 2px;
        line-height: 2.2;
      }
      .catch-sub {
        margin-top: 8px;
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 2;
        letter-spacing: 0.05em;
      }

      /* ── ハブカード ── */
      .hub-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
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
        width: 44px;
        height: 44px;
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        flex-shrink: 0;
      }
      .hub-navi .hub-icon { background: var(--accent-1-soft); }
      .hub-live .hub-icon { background: var(--accent-2-soft); }
      .hub-reco .hub-icon { background: var(--accent-4-soft); }
      .hub-dojo .hub-icon { background: var(--accent-3-soft); }
      .hub-body h3 {
        font-family: 'Noto Serif JP', serif;
        font-size: 15px;
        font-weight: 600;
        color: var(--text-primary);
        letter-spacing: 1px;
        margin-bottom: 2px;
      }
      .hub-body .hub-subtitle {
        display: block;
        font-size: 11px;
        color: var(--text-tertiary);
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      .hub-body p {
        font-size: 12px;
        color: var(--text-secondary);
      }
      .hub-arrow {
        color: var(--text-tertiary);
        font-size: 16px;
        margin-left: auto;
        transition: transform 0.15s;
        flex-shrink: 0;
      }
      .hub-card:hover .hub-arrow {
        transform: translateX(3px);
        color: var(--gold);
      }

      /* ── プロジェクト概要＋今すぐ試す ── */
      .tp-mission {
        font-size: 14px;
        color: var(--text-secondary);
        line-height: 1.8;
        text-align: center;
        margin: 0 0 8px;
      }
      .tp-mission-link {
        text-align: center;
        margin: 0 0 1.25rem;
        font-size: 13px;
      }
      .tp-mission-link a {
        color: var(--gold);
        text-decoration: none;
      }
      .tp-mission-link a:hover { text-decoration: underline; }
      /* ── JIKABUKI バリューカード ── */
      .jk-val-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 0;
      }
      .jk-val-card {
        padding: 16px;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
      }
      .jk-val-icon { font-size: 22px; margin-bottom: 6px; }
      .jk-val-title { font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
      .jk-val-desc { font-size: 11px; color: var(--text-secondary); line-height: 1.7; }

      /* ── JIKABUKI モジュールカード ── */
      .jk-mod-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .jk-mod-card {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 18px 16px;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-lg);
        text-decoration: none;
        color: var(--text-primary);
        transition: all 0.18s;
        box-shadow: var(--shadow-sm);
        position: relative;
        border-top: 3px solid transparent;
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

      /* ── JIKABUKI ニュース ── */
      .jk-news-section {
        padding: 20px;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
      }
      .jk-news-list { display: flex; flex-direction: column; }
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
      .jk-news-link { font-size: 13px; color: var(--gold-dark); }

      /* ── レスポンシブ ── */
      @media (max-width: 600px) {
        .hub-grid-4 { grid-template-columns: 1fr; }
        .jk-val-grid { grid-template-columns: 1fr; }
        .jk-mod-grid { grid-template-columns: 1fr; }
        .catch-lead { font-size: 14px; letter-spacing: 1px; }
      }
    </style>`,
  });
}
