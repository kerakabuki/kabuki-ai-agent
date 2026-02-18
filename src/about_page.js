// src/about_page.js
// =========================================================
// 気良歌舞伎とは — /about
// 団体紹介（Jimdo公式サイトの内容）＋ FAQ データ
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";

export function aboutPageHTML() {
  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span><a href="/jikabuki/gate/kera">JIKABUKI PLUS+</a><span>›</span>気良歌舞伎とは
    </div>

    <!-- ── イントロ ── -->
    <section class="about-intro fade-up">
      <h2 class="about-intro-title">気良歌舞伎</h2>
      <p class="about-intro-place">岐阜県郡上市明宝気良</p>
      <div class="about-intro-body">
        <p>
          岐阜・郡上、明宝気良。<br>
          日本の原風景が残るこの静かな山里は、秋、別の顔を見せる。
        </p>
        <p>
          昼は会社員、自営業。<br>
          だがこの夜だけは、彼らは「役者」になる。<br>
          纏うのは衣装だけじゃない、地域の誇りと、本気の魂だ。
        </p>
        <p>
          酒を片手に芝居小屋の床に座れば、もう他人じゃない。<br>
          飛び交うのは、ヤジか喝采か。<br>
          笑いも涙も、汗も息遣いも、すべてが混ざり合うカオス。
        </p>
        <p class="about-accent">素人歌舞伎の真髄がここにある。</p>
      </div>
    </section>

    <!-- ── 団体紹介 ── -->
    <section class="about-story fade-up" id="story">
      <h2 class="section-title">🏯 団体紹介</h2>
      <div class="story-body">
        <p>岐阜県郡上市明宝気良。世帯数は130世帯ぐらいの小さな集落。</p>
        <p>戦前から白山神社の祭礼の余興として素人歌舞伎が行われていたが、資金的な問題、人材の不足などによって途絶えてしまっていた。</p>
        <p>２００５年、地元の若者たちが集まり、地域の活性化のため、そして、何よりもこれまで自分たちを育ててくれた地域の人たちに楽しんでもらおう、と１７年ぶりに歌舞伎を復活させる。</p>
        <p>それから２０年が過ぎ、メンバーは２０代から５０代まで約４０名に。今では地域の毎年の恒例行事として皆に楽しみにしていただけるようになった。</p>
        <p class="story-highlight">我々は歌舞伎保存会ではない。</p>
        <p>他の地域の保存会の方のように伝統芸能の継承といった高尚な理念があるわけでない。</p>
        <p>ただ<strong>"気良の人たちに元気になってもらいたい"</strong>そして<strong>"自分たちも楽しもう"</strong>その思いだけでやってきた。</p>
        <p>地域の人たちは「気良の若い衆は元気！」と感じてくれているようだ。子どもたちも「気良歌舞伎ってスゴイ！僕も出たい！」と言ってくれる。気良を出て行った若い人も少しだけど帰ってきてくれるようにもなったきた。</p>
        <p class="story-highlight">今年も良かったよ！と言ってくださる方々がいる限り、続けていきたいと思う。</p>
      </div>

      <div class="story-info">
        <div class="story-info-item">
          <span class="story-info-label">定期公演</span>
          <span>毎年、気良白山神社祭礼に併せ、９月第３週の土曜日</span>
        </div>
        <div class="story-info-item">
          <span class="story-info-label">振付指導</span>
          <span>高雄歌舞伎保存会にご協力いただいている</span>
        </div>
        <div class="story-info-item">
          <span class="story-info-label">メンバー</span>
          <span>２０代から５０代まで約４０名</span>
        </div>
        <div class="story-info-item">
          <span class="story-info-label">加盟</span>
          <span>岐阜県地歌舞伎保存振興協議会（2017年〜）</span>
        </div>
        <div class="story-info-item">
          <span class="story-info-label">会場</span>
          <span>気良座（旧明方小学校木造講堂、2024年開場）</span>
        </div>
      </div>
    </section>

    <!-- ── 活動履歴 ── -->
    <section class="about-history fade-up" id="history">
      <h2 class="section-title">📜 活動履歴</h2>
      <div class="timeline">
        <div class="tl-item"><span class="tl-year">2005</span><div class="tl-body"><strong>気良歌舞伎復活</strong><br>初代座長 鈴木雅敏。以降、毎年白山神社祭礼定期公演</div></div>
        <div class="tl-item"><span class="tl-year">2010</span><div class="tl-body">二代目座長 奥村将典</div></div>
        <div class="tl-item"><span class="tl-year">2014</span><div class="tl-body">気良歌舞伎復活10周年記念公演（子ども歌舞伎に初挑戦）</div></div>
        <div class="tl-item"><span class="tl-year">2015</span><div class="tl-body">三代目座長 髙田新一郎<br>高雄・気良青年歌舞伎公演開催（2015年〜2017年）</div></div>
        <div class="tl-item"><span class="tl-year">2017</span><div class="tl-body">岐阜県地歌舞伎保存振興協議会に県内30団体目として加盟</div></div>
        <div class="tl-item"><span class="tl-year">2019</span><div class="tl-body">改元記念 清流の国ぎふ 地歌舞伎勢揃い公演出演<br>復活15周年記念公演</div></div>
        <div class="tl-item"><span class="tl-year">2020</span><div class="tl-body">四代目座長 佐藤真哉<br>「おうちで歌舞伎！」地芝居映像配信プロジェクト</div></div>
        <div class="tl-item"><span class="tl-year">2021</span><div class="tl-body">清流の国ぎふ 地歌舞伎勢揃い公演出演<br>「通し上演仮名手本忠臣蔵」映像配信プロジェクト</div></div>
        <div class="tl-item"><span class="tl-year">2022</span><div class="tl-body">飛騨美濃歌舞伎大会ぐじょう2022出演</div></div>
        <div class="tl-item"><span class="tl-year">2023</span><div class="tl-body">清流の国ぎふ 地歌舞伎勢揃い公演・秋 出演</div></div>
        <div class="tl-item"><span class="tl-year">2024</span><div class="tl-body"><strong>気良座こけら落とし公演</strong>（旧明方小学校木造講堂を「気良座」として開場）</div></div>
        <div class="tl-item tl-current"><span class="tl-year">2025</span><div class="tl-body"><strong>五代目座長 林克彦</strong><br>座長襲名披露公演</div></div>
      </div>
    </section>

    <!-- ── リンク ── -->
    <section class="about-links fade-up">
      <h2 class="section-title">🔗 公式SNS</h2>
      <div class="link-grid">
        <a href="https://www.instagram.com/kerakabuki_official/" target="_blank" rel="noopener" class="link-card">📷 Instagram</a>
        <a href="https://x.com/KeraKabuki" target="_blank" rel="noopener" class="link-card">𝕏 X（Twitter）</a>
        <a href="https://www.facebook.com/kerakabuki/" target="_blank" rel="noopener" class="link-card">📘 Facebook</a>
      </div>
    </section>

    <!-- ── 関連ページ ── -->
    <div class="about-nav-cards">
      <a href="/jikabuki/gate/kera/performance" class="card">
        <h3>📅 公演情報</h3>
        <p class="card-desc">次回公演予定と過去の公演履歴</p>
      </a>
      <a href="/jikabuki/gate/kera/kawaraban" class="card">
        <h3>📰 地歌舞伎かわら版</h3>
        <p class="card-desc">高雄・気良 地歌舞伎かわら版バックナンバー</p>
      </a>
    </div>

    <!-- ── カテゴリ別 FAQ ── -->
    <h2 class="section-title" style="margin-top:2rem;">❓ よくある質問</h2>
    <div id="app">
      <div class="loading">情報を読み込み中…</div>
    </div>

    <script>
    (function(){
      var app = document.getElementById("app");

      var CAT_ORDER = [
        { key: "気良歌舞伎",         icon: "🙂", title: "気良歌舞伎について" },
        { key: "地歌舞伎・地芝居",   icon: "👹", title: "地歌舞伎・地芝居について" },
        { key: "公演の基本",         icon: "📅", title: "公演の基本" },
        { key: "観劇ガイド",         icon: "🎭", title: "観劇ガイド" },
        { key: "会場・設備",         icon: "🏠", title: "会場・設備" },
        { key: "アクセス・周辺",     icon: "🧭", title: "アクセス・周辺" },
        { key: "参加・ボランティア", icon: "🙋", title: "参加・ボランティア" }
      ];

      fetch("/api/talk")
        .then(function(r){ return r.json(); })
        .then(function(data){
          var topics = [];
          if (data && Array.isArray(data.topics)) topics = data.topics;
          else if (Array.isArray(data)) topics = data;

          topics = topics.filter(function(t){
            var cat = (t.category || "").trim();
            return cat && cat !== "メニュー" && cat !== "meta";
          });

          if (topics.length === 0) {
            app.innerHTML = '<div class="empty-state">情報がまだ登録されていません。</div>';
            return;
          }
          render(topics);
        })
        .catch(function(){
          app.innerHTML = '<div class="empty-state">情報の読み込みに失敗しました。</div>';
        });

      function render(topics) {
        var bycat = {};
        topics.forEach(function(t) {
          var cat = (t.category || "その他").trim();
          if (!bycat[cat]) bycat[cat] = [];
          bycat[cat].push(t);
        });

        var orderedCats = [];
        CAT_ORDER.forEach(function(c) {
          if (bycat[c.key]) orderedCats.push({ key: c.key, icon: c.icon, title: c.title, items: bycat[c.key] });
        });
        for (var k in bycat) {
          if (!CAT_ORDER.find(function(c){ return c.key === k; })) {
            orderedCats.push({ key: k, icon: "📁", title: k, items: bycat[k] });
          }
        }

        var html = '<nav class="about-jump">';
        orderedCats.forEach(function(c) {
          html += '<a href="#cat-' + encodeURIComponent(c.key) + '" class="about-jump-item">' + c.icon + ' ' + esc(c.title) + '</a>';
        });
        html += '</nav>';

        orderedCats.forEach(function(c, ci) {
          html += '<section class="about-section fade-up" id="cat-' + encodeURIComponent(c.key) + '">';
          html += '<h2 class="section-title">' + c.icon + ' ' + esc(c.title) + '</h2>';
          c.items.forEach(function(t, ti) {
            html += '<details class="about-faq" ' + (ci === 0 && ti < 3 ? 'open' : '') + '>';
            html += '<summary class="about-faq-q">' + esc(t.label || t.question || "質問") + '</summary>';
            html += '<div class="about-faq-a">' + formatAnswer(t.answer || t.desc || "") + '</div>';
            html += '</details>';
          });
          html += '</section>';
        });

        app.innerHTML = html;
      }

      function esc(s) {
        if (!s) return "";
        var el = document.createElement("span");
        el.textContent = s;
        return el.innerHTML;
      }
      function formatAnswer(s) {
        return esc(s)
          .replace(/(https?:\\/\\/[^\\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
          .replace(/\\n/g, "<br>");
      }
    })();
    </script>
  `;

  return pageShell({
    title: "気良歌舞伎とは",
    subtitle: "岐阜・郡上・明宝の地歌舞伎",
    bodyHTML,
    activeNav: "jikabuki",
    brand: "jikabuki",
    headExtra: `<style>
      /* ── イントロ ── */
      .about-intro {
        text-align: center;
        padding: 1.5rem 1rem 2rem;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 1.5rem;
      }
      .about-intro-title { font-size: 1.6rem; color: var(--kin); letter-spacing: 0.3em; }
      .about-intro-place { font-size: 0.82rem; color: var(--text-tertiary); margin: 0.3rem 0 1.2rem; letter-spacing: 0.1em; }
      .about-intro-body { max-width: 600px; margin: 0 auto; text-align: left; }
      .about-intro-body p { font-size: 0.92rem; color: var(--text-tertiary); line-height: 1.9; margin-bottom: 0.7rem; }
      .about-accent { font-size: 1rem !important; color: var(--text-primary) !important; font-weight: bold; text-align: center; margin-top: 1rem !important; }

      /* ── 団体紹介 ── */
      .about-story { margin-bottom: 2rem; }
      .story-body { max-width: 700px; }
      .story-body p { font-size: 0.92rem; color: var(--text-tertiary); line-height: 1.9; margin-bottom: 0.7rem; }
      .story-body strong { color: var(--kin); }
      .story-highlight { font-size: 1rem !important; color: var(--text-primary) !important; font-weight: bold; }
      .story-info {
        margin-top: 1.2rem;
        background: var(--bg-subtle);
        border: 1px solid var(--border-light);
        border-radius: 12px;
        padding: 1rem 1.2rem;
      }
      .story-info-item {
        display: flex;
        gap: 0.8rem;
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--border-medium);
        font-size: 0.88rem;
        color: var(--text-tertiary);
      }
      .story-info-item:last-child { border-bottom: none; }
      .story-info-label {
        flex-shrink: 0;
        min-width: 80px;
        font-weight: bold;
        color: var(--kin);
        font-size: 0.82rem;
      }

      /* ── タイムライン ── */
      .timeline { position: relative; padding-left: 1.5rem; }
      .timeline::before {
        content: "";
        position: absolute;
        left: 0.45rem;
        top: 0.5rem;
        bottom: 0.5rem;
        width: 2px;
        background: var(--border-light);
      }
      .tl-item {
        position: relative;
        padding: 0.5rem 0 0.8rem 1rem;
      }
      .tl-item::before {
        content: "";
        position: absolute;
        left: -1.15rem;
        top: 0.75rem;
        width: 8px; height: 8px;
        border-radius: 50%;
        background: var(--text-secondary);
        border: 2px solid var(--text-primary);
      }
      .tl-current::before { background: var(--kin); box-shadow: 0 0 6px rgba(197,165,90,0.5); }
      .tl-year {
        display: inline-block;
        font-size: 0.82rem;
        font-weight: bold;
        color: var(--kin);
        min-width: 3rem;
      }
      .tl-body {
        font-size: 0.88rem;
        color: var(--text-tertiary);
        line-height: 1.6;
        margin-top: 0.1rem;
      }
      .tl-body strong { color: var(--text-primary); }

      /* ── リンク ── */
      .link-grid {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
      }
      .link-card {
        padding: 0.6rem 1.2rem;
        background: var(--bg-subtle);
        border: 1px solid var(--border-light);
        border-radius: 10px;
        color: var(--text-primary);
        font-size: 0.88rem;
        text-decoration: none;
        transition: all 0.2s;
      }
      .link-card:hover { border-color: var(--kin); color: var(--kin); text-decoration: none; }

      /* ── 関連ページカード ── */
      .about-nav-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 1rem;
        margin-top: 2rem;
      }

      /* ── ジャンプナビ ── */
      .about-jump {
        display: flex; flex-wrap: wrap; gap: 0.5rem;
        margin-bottom: 1.5rem; padding: 1rem;
        background: var(--bg-subtle); border-radius: 12px; border: 1px solid var(--border-light);
      }
      .about-jump-item {
        font-size: 0.8rem; padding: 0.4rem 0.8rem;
        background: var(--bg-card); border-radius: 8px;
        color: var(--kin); text-decoration: none;
        border: 1px solid rgba(197,165,90,0.2); transition: all 0.2s; white-space: nowrap;
      }
      .about-jump-item:hover { border-color: var(--kin); text-decoration: none; }

      /* ── FAQ ── */
      .about-section { margin-bottom: 2rem; }
      .about-faq {
        margin-bottom: 0.4rem; border: 1px solid var(--border-light); border-radius: 10px;
        overflow: hidden; background: var(--bg-subtle);
      }
      .about-faq[open] { border-color: rgba(197,165,90,0.3); }
      .about-faq-q {
        padding: 0.8rem 1rem; font-size: 0.92rem; font-weight: bold;
        color: var(--text-primary); cursor: pointer; list-style: none;
        display: flex; align-items: center; gap: 0.5rem;
      }
      .about-faq-q::-webkit-details-marker { display: none; }
      .about-faq-q::before {
        content: "▶"; font-size: 0.65rem; color: var(--kin);
        transition: transform 0.2s; flex-shrink: 0;
      }
      .about-faq[open] > .about-faq-q::before { transform: rotate(90deg); }
      .about-faq-q:hover { color: var(--kin); }
      .about-faq-a {
        padding: 0 1rem 1rem 1.8rem; font-size: 0.88rem;
        color: var(--text-tertiary); line-height: 1.8;
      }
      .about-faq-a a { color: var(--kin); word-break: break-all; }

      @media (max-width: 600px) {
        .about-intro-title { font-size: 1.3rem; }
        .about-jump { gap: 0.3rem; }
        .about-jump-item { font-size: 0.72rem; padding: 0.3rem 0.6rem; }
        .story-info-item { flex-direction: column; gap: 0.2rem; }
      }
    </style>`,
  });
}
