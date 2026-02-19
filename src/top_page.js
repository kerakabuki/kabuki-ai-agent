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
            <div class="hub-icon">📖</div>
            <div class="hub-body">
              <h3>KABUKI RECO</h3>
              <span class="hub-subtitle">歌舞伎帖</span>
              <p>観劇記録・推し俳優</p>
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

      <!-- JIKABUKI の価値 -->
      <section class="tp-section fade-up-d1">
        <h2 class="tp-section-title">JIKABUKI PLUS+ でできること</h2>
        <div class="jk-value-grid">
          <div class="jk-value-item">
            <div class="jk-value-icon">💬</div>
            <div class="jk-value-text"><strong>チャットで導入完了</strong><br>質問に答えるだけで公式サイト＋ボットが完成</div>
          </div>
          <div class="jk-value-item">
            <div class="jk-value-icon">🤝</div>
            <div class="jk-value-text"><strong>台本共有で横展開</strong><br>団体間で台本を共有し事務局負担を軽減</div>
          </div>
          <div class="jk-value-item">
            <div class="jk-value-icon">🗄️</div>
            <div class="jk-value-text"><strong>業界共有データベース</strong><br>芝居小屋・貸衣装・かつら師・大道具を検索</div>
          </div>
          <div class="jk-value-item">
            <div class="jk-value-icon">🎬</div>
            <div class="jk-value-text"><strong>記録を、未来の資料に</strong><br>公演記録・出演記録をデジタルアーカイブ化</div>
          </div>
        </div>
      </section>

      <!-- GATE -->
      <section class="tp-section fade-up-d2">
        <div class="jk-section-header">
          <span class="jk-section-badge jk-pub-badge">🏯 GATE</span>
          <div>
            <h3 class="jk-section-label">JIKABUKI GATE ── 表玄関</h3>
            <p class="jk-section-sublabel">団体を知ってもらう</p>
          </div>
        </div>
        <div class="hub-grid">
          <a href="/jikabuki/gate/kera/about" class="hub-card hub-jk-pub">
            <div class="hub-icon hub-icon-pub">🏠</div>
            <div class="hub-body">
              <h3>団体公式サイト</h3>
              <p>テンプレで自動生成・チャットボット付き</p>
            </div>
            <span class="hub-arrow">&rarr;</span>
          </a>
          <a href="/jikabuki/gate/kera/performance" class="hub-card hub-jk-pub">
            <div class="hub-icon hub-icon-pub">📅</div>
            <div class="hub-body">
              <h3>公演情報ページ</h3>
              <p>次回公演・過去公演を自動掲載</p>
            </div>
            <span class="hub-arrow">&rarr;</span>
          </a>
          <a href="/jikabuki/gate/kera/story" class="hub-card hub-jk-pub">
            <div class="hub-icon hub-icon-pub">🔥</div>
            <div class="hub-body">
              <h3>ストーリー</h3>
              <p>気良歌舞伎の歩み──全10話</p>
            </div>
            <span class="hub-arrow">&rarr;</span>
          </a>
        </div>
      </section>

      <!-- INFO -->
      <section class="tp-section fade-up-d2">
        <div class="jk-section-header">
          <span class="jk-section-badge jk-pub-badge">📡 INFO</span>
          <div>
            <h3 class="jk-section-label">JIKABUKI INFO ── お知らせ</h3>
            <p class="jk-section-sublabel">地歌舞伎の今を知る</p>
          </div>
        </div>
        <div class="hub-grid">
          <a href="/jikabuki/info/news" class="hub-card hub-jk-pub">
            <div class="hub-icon hub-icon-pub">📰</div>
            <div class="hub-body">
              <h3>地歌舞伎ニュース</h3>
              <p>地歌舞伎に関するニュースを自動取得</p>
            </div>
            <span class="hub-arrow">&rarr;</span>
          </a>
          <a href="/jikabuki/info/calendar" class="hub-card hub-jk-pub">
            <div class="hub-icon hub-icon-pub">🗓️</div>
            <div class="hub-body">
              <h3>イベントカレンダー</h3>
              <p>全国の地歌舞伎公演・イベント一覧</p>
            </div>
            <span class="hub-arrow">&rarr;</span>
          </a>
        </div>
      </section>

      <!-- BASE -->
      <section class="tp-section fade-up-d3" style="margin-top:0.5rem;">
        <div class="jk-section-header">
          <span class="jk-section-badge jk-int-badge">🔧 BASE</span>
          <div>
            <h3 class="jk-section-label">JIKABUKI BASE ── 楽屋</h3>
            <p class="jk-section-sublabel">運営に使う＋業界共有データベース</p>
          </div>
        </div>
        <div class="hub-grid">
          <a href="/jikabuki/base" class="hub-card hub-jk-int">
            <div class="hub-icon hub-icon-int">📋</div>
            <div class="hub-body">
              <h3>公演記録・出演記録</h3>
              <p>演目・配役・日程のアーカイブ</p>
            </div>
            <span class="hub-arrow">&rarr;</span>
          </a>
          <a href="/jikabuki/base" class="hub-card hub-jk-int">
            <div class="hub-icon hub-icon-int">📖</div>
            <div class="hub-body">
              <h3>デジタル台本</h3>
              <p>スマホ・タブレットで稽古に使える</p>
            </div>
            <span class="hub-arrow">&rarr;</span>
          </a>
          <a href="/jikabuki/base/scripts" class="hub-card hub-jk-int">
            <div class="hub-icon hub-icon-int">🤝</div>
            <div class="hub-body">
              <h3>台本共有ライブラリ</h3>
              <p>団体間で台本を共有し事務局負担を軽減</p>
            </div>
            <span class="hub-arrow">&rarr;</span>
          </a>
          <a href="/jikabuki/base/db" class="hub-card hub-jk-int">
            <div class="hub-icon hub-icon-int">🗄️</div>
            <div class="hub-body">
              <h3>業界共有データベース</h3>
              <p>芝居小屋・貸衣装・かつら師・大道具</p>
            </div>
            <span class="hub-arrow">&rarr;</span>
          </a>
        </div>
      </section>

      <!-- LABO -->
      <section class="tp-section fade-up-d3">
        <div class="jk-section-header">
          <span class="jk-section-badge jk-int-badge">🧪 LABO</span>
          <div>
            <h3 class="jk-section-label">JIKABUKI LABO ── 試す・作る</h3>
            <p class="jk-section-sublabel">稽古ツール＋ベータテスト</p>
          </div>
        </div>
        <div class="hub-grid">
          <a href="/jikabuki/labo" class="hub-card hub-jk-int">
            <div class="hub-icon hub-icon-int">🎤</div>
            <div class="hub-body">
              <h3>稽古モード【実践版】</h3>
              <p>自分の役の台詞稽古・台本/動画連動</p>
            </div>
            <span class="hub-arrow">&rarr;</span>
          </a>
          <a href="/jikabuki/labo" class="hub-card hub-jk-int">
            <div class="hub-icon hub-icon-int">🎙️</div>
            <div class="hub-body">
              <h3>台詞稽古チャレンジ</h3>
              <p>カラオケ風の台詞練習ツール</p>
            </div>
            <span class="hub-arrow">&rarr;</span>
          </a>
        </div>
      </section>

      <div class="jk-more-link fade-up-d4">
        <a href="/jikabuki/gate/kera" class="tp-link">JIKABUKI PLUS+ 詳細 &rarr;</a>
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
      /* ── JIKABUKI PLUS+ セクション ── */
      .jk-section-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
      }
      .jk-section-badge {
        font-size: 11px;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 6px;
        letter-spacing: 0.5px;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .jk-pub-badge { background: var(--accent-1-soft); color: var(--accent-1); }
      .jk-int-badge { background: var(--bg-subtle); color: var(--text-secondary); }
      .jk-section-label {
        font-family: 'Noto Serif JP', serif;
        font-size: 15px;
        font-weight: 600;
        color: var(--text-primary);
        letter-spacing: 1px;
      }
      .jk-section-sublabel {
        font-size: 11px;
        color: var(--text-tertiary);
        margin-top: 1px;
      }
      .hub-jk-pub { border-left: 3px solid var(--accent-1); }
      .hub-jk-int { border-left: 3px solid var(--text-tertiary); }
      .hub-icon-pub { background: var(--accent-1-soft); }
      .hub-icon-int { background: var(--bg-subtle); }
      .jk-more-link {
        text-align: center;
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border-light);
      }

      /* ── JIKABUKI 特徴セクション ── */
      .jk-value-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-top: 0.5rem;
      }
      .jk-value-item {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-sm);
        padding: 14px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: var(--shadow-sm);
      }
      .jk-value-icon {
        font-size: 20px;
        flex-shrink: 0;
      }
      .jk-value-text {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.6;
      }
      .jk-value-text strong {
        color: var(--text-primary);
        font-weight: 600;
      }

      /* ── レスポンシブ ── */
      @media (max-width: 600px) {
        .hub-grid-4 { grid-template-columns: 1fr; }
        .feature-trio { grid-template-columns: 1fr; }
        .jk-value-grid { grid-template-columns: 1fr; }
        .catch-lead { font-size: 14px; letter-spacing: 1px; }
      }
    </style>`,
  });
}
