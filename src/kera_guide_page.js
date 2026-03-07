// src/kera_guide_page.js
// =========================================================
// 気良歌舞伎 はじめての方へ（観劇ガイド） — /kerakabuki/guide
// スタンドアロン HTML（pageShell 不使用）
// ダークテーマ・CSSプレフィックス: kg-
// =========================================================

export function keraGuidePageHTML() {

  const FAQ_ITEMS = [
    { q: "公演はいつですか？", a: "毎年9月第4土曜日（白山神社祭礼）に定期公演を行っています。17:00開演が目安ですが、年によって変わることがあります。最新情報は公式InstagramやWebサイトでご確認ください。" },
    { q: "入場料はかかりますか？予約は必要？", a: "気良座での定期公演は予約不要・自由席・無料です（ご祝儀・おひねり歓迎）。チケットも不要なので、そのまま会場にお越しください。" },
    { q: "写真・動画撮影はできますか？", a: "撮影についてのルールは公演ごとに案内があります。当日のアナウンスや掲示を必ずご確認ください。" },
    { q: "トイレはありますか？", a: "明宝歴史民俗資料館のトイレをご利用ください。" },
    { q: "バリアフリー対応していますか？", a: "バリアフリー対応の施設ではありません。入口で靴を脱いで上がる際に段差があります。靴を入れるポリ袋は会場で用意しています。大きな荷物の預かりやロッカーはないため、できるだけ最小限の荷物でのご来場をおすすめします。" },
    { q: "飲食はできますか？", a: "常設の飲食店・売店はありません。公演によっては屋外で軽食の出店（バザー）が出ることがあります。飲み物は持参がおすすめです（においの強いものは控えてください）。" },
    { q: "子ども連れでも大丈夫ですか？", a: "お子さま連れも大歓迎です。実際に子役として出演しているメンバーもいます。途中で泣いてしまった場合は一時的に外に出ていただければ問題ありません。" },
    { q: "参加したい・手伝いたいのですが？", a: "新しい仲間を随時募集しています。演者・裏方いずれも経験不問です。稽古に参加できる方であれば歓迎します。公式SNSからお気軽にお問い合わせください。" },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQ_ITEMS.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  };

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>はじめての方へ — 気良歌舞伎</title>
<meta name="description" content="気良歌舞伎の観劇ガイド。地歌舞伎とは何か、観劇マナー、気良座へのアクセス、周辺情報、よくある質問をまとめました。">
<meta property="og:title" content="はじめての方へ — 気良歌舞伎">
<meta property="og:description" content="気良歌舞伎の観劇ガイド。地歌舞伎とは、観劇マナー、アクセス、FAQ。">
<meta property="og:image" content="https://kabukiplus.com/assets/ogp/ogp_kabukiplus_top.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="気良歌舞伎">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/kera-favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/kera-touch-icon.png">
<meta name="theme-color" content="#0a0a0f">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify(faqJsonLd)}</script>
<style>${KG_CSS}</style>
</head>
<body>

<!-- ═══════ STICKY NAV ═══════ -->
<nav class="kg-nav" id="kg-nav">
  <a href="/kerakabuki" class="kg-nav-brand">気良歌舞伎</a>
  <button class="kg-nav-toggle" id="kg-nav-toggle" aria-label="メニュー"><span></span><span></span><span></span></button>
  <div class="kg-nav-links" id="kg-nav-links">
    <a href="#jikabuki">地歌舞伎とは</a>
    <a href="#guide">観劇ガイド</a>
    <a href="#access">アクセス</a>
    <a href="#area">周辺情報</a>
    <a href="#faq">FAQ</a>
  </div>
</nav>

<!-- ═══════ §1 HERO ═══════ -->
<section class="kg-hero" id="hero">
  <div class="kg-hero-inner">
    <p class="kg-hero-en kg-reveal">GUIDE</p>
    <h1 class="kg-hero-title kg-reveal">はじめての方へ</h1>
    <p class="kg-hero-sub kg-reveal">気良歌舞伎をもっと楽しむための観劇ガイド</p>
  </div>
  <div class="kg-scroll-hint" aria-hidden="true">
    <span class="kg-scroll-arrow"></span>
  </div>
</section>

<!-- ═══════ §2 地歌舞伎とは ═══════ -->
<section class="kg-section" id="jikabuki">
  <h2 class="kg-section-title kg-reveal">地歌舞伎とは</h2>
  <div class="kg-text-block">
    <p class="kg-reveal">「地歌舞伎（じかぶき）」とは、地域の人々が自ら演じる歌舞伎のことです。プロの役者が演じる大歌舞伎（松竹歌舞伎）とは異なり、農家や会社員、学生など、ふだんは別の仕事を持つ人たちが舞台に立ちます。</p>
    <p class="kg-reveal">岐阜県は全国でも地歌舞伎が最も盛んな地域のひとつ。県内には30以上の保存会が活動しており、江戸時代から続く芝居小屋や舞台が数多く残っています。</p>
    <p class="kg-reveal">気良歌舞伎は、岐阜県郡上市明宝気良（けら）地区に伝わる地歌舞伎です。人口400人に満たない山あいの集落で、2005年に17年ぶりに復活。以来、毎年秋の白山神社祭礼で公演を重ねてきました。</p>
    <div class="kg-highlight kg-reveal">
      <p><strong>大歌舞伎と地歌舞伎のちがい</strong></p>
      <ul>
        <li><strong>演じる人</strong> — 大歌舞伎はプロの歌舞伎役者。地歌舞伎は地域の住民。</li>
        <li><strong>場所</strong> — 大歌舞伎は歌舞伎座などの大劇場。地歌舞伎は神社の境内や地域の芝居小屋。</li>
        <li><strong>距離感</strong> — 地歌舞伎は客席と舞台がとても近く、掛け声やおひねりで一体感が生まれます。</li>
        <li><strong>入場料</strong> — 地歌舞伎の多くは無料。ご祝儀やおひねりで応援する文化があります。</li>
      </ul>
    </div>
    <p class="kg-reveal kg-accent-text">堅苦しさは一切なし。お祭り気分で気軽にお越しください。</p>
  </div>
</section>

<!-- ═══════ §3 観劇ガイド ═══════ -->
<section class="kg-section" id="guide">
  <h2 class="kg-section-title kg-reveal">観劇ガイド</h2>
  <p class="kg-section-sub kg-reveal">気良歌舞伎を楽しむためのポイントをまとめました。</p>

  <div class="kg-cards">
    <div class="kg-card kg-reveal">
      <h3 class="kg-card-title">服装・持ち物</h3>
      <p>カジュアルな普段着でOKです。ドレスコードはありません。</p>
      <ul>
        <li>秋の公演は会場周辺が肌寒い一方、会場内は熱気で暑くなることも。<strong>脱ぎ着しやすい服装</strong>がおすすめです。</li>
        <li>椅子はありますが数に限りがあるため、<strong>座布団や敷物</strong>があると安心です。</li>
        <li>飲み物は持参がおすすめです。</li>
        <li>靴を脱いで上がるため、<strong>脱ぎやすい靴</strong>が便利です（靴を入れるポリ袋は会場で用意しています）。</li>
      </ul>
    </div>

    <div class="kg-card kg-reveal">
      <h3 class="kg-card-title">観劇マナー</h3>
      <p>地歌舞伎はお祭りの一部。大歌舞伎ほど堅苦しいルールはありません。</p>
      <ul>
        <li>途中入場・途中退場OK。お気軽にどうぞ。</li>
        <li>携帯電話はマナーモードに。</li>
        <li>撮影ルールは公演ごとに異なります。当日のアナウンスを確認してください。</li>
        <li>においの強い飲食物は控えてください。</li>
      </ul>
    </div>

    <div class="kg-card kg-reveal">
      <h3 class="kg-card-title">掛け声の掛け方</h3>
      <p>掛け声は地歌舞伎の醍醐味のひとつ。役者への応援として、見得（みえ）や決めポーズのタイミングで声をかけます。</p>
      <ul>
        <li><strong>「日本一！」「待ってました！」「いいぞ！」</strong> — 初心者にも掛けやすい定番の掛け声。</li>
        <li>タイミングは「ここだ！」と思った瞬間でOK。周りの常連さんに合わせると自然に掛けられます。</li>
        <li>掛け声が苦手な方は拍手だけでも十分です。</li>
      </ul>
    </div>

    <div class="kg-card kg-reveal">
      <h3 class="kg-card-title">ご祝儀・おひねり</h3>
      <p>地歌舞伎ならではの応援文化です。必須ではないので、無理のない範囲でお楽しみください。</p>
      <ul>
        <li><strong>ご祝儀</strong> — 応援の気持ちとして受付でお預かりします。金額は自由です。</li>
        <li><strong>おひねり</strong> — 小銭などを紙に包んだもの。役者が見得を切ったタイミングで舞台に向かって投げます。</li>
        <li>おひねり用の紙は会場で用意していることもあります。</li>
      </ul>
    </div>
  </div>
</section>

<!-- ═══════ §4 アクセス ═══════ -->
<section class="kg-section" id="access">
  <h2 class="kg-section-title kg-reveal">アクセス</h2>

  <div class="kg-access-info kg-reveal">
    <div class="kg-access-venue">
      <h3 class="kg-access-venue-name">気良座（けらざ）</h3>
      <p class="kg-access-venue-sub">旧明方小学校木造講堂（2024年開場）</p>
    </div>
    <div class="kg-access-detail">
      <div class="kg-access-row">
        <span class="kg-access-label">住所</span>
        <span>〒501-4303 岐阜県郡上市明宝気良154</span>
      </div>
    </div>
  </div>

  <div class="kg-map-wrap kg-reveal">
    <iframe
      src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d1600!2d137.030034!3d35.857015!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2z5bKQ6Zic55yM6YOh5LiK5biC5piO5a6d5rCX6Imv!5e0!3m2!1sja!2sjp"
      width="100%" height="350" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
      title="気良座の地図"></iframe>
  </div>

  <div class="kg-cards kg-cards-2col">
    <div class="kg-card kg-reveal">
      <h3 class="kg-card-title">車でお越しの方</h3>
      <ul>
        <li>東海北陸自動車道<strong>「郡上八幡IC」</strong>から国道472号経由で<strong>約30分</strong></li>
        <li>カーナビは<strong>「明宝歴史民俗資料館」</strong>を目的地に設定してください</li>
        <li><strong>駐車場は無料</strong>です（台数に限りがあります）</li>
      </ul>
    </div>

    <div class="kg-card kg-reveal">
      <h3 class="kg-card-title">公共交通機関でお越しの方</h3>
      <ul>
        <li>長良川鉄道<strong>「郡上八幡駅」</strong>から明宝線バスで「明宝庁舎前」下車、徒歩約10分</li>
        <li>終演後はバスがないため、公共交通のみでの往復は難しい場合があります</li>
        <li>乗り合いや送迎については公式SNSでご相談ください</li>
      </ul>
    </div>
  </div>
</section>

<!-- ═══════ §5 周辺情報 ═══════ -->
<section class="kg-section" id="area">
  <h2 class="kg-section-title kg-reveal">周辺情報</h2>
  <p class="kg-section-sub kg-reveal">明宝（めいほう）エリアの見どころ・グルメ・宿泊</p>

  <div class="kg-cards kg-cards-3col">
    <div class="kg-card kg-card-area kg-reveal">
      <span class="kg-area-icon" aria-hidden="true">&#127860;</span>
      <h3 class="kg-card-title">グルメ</h3>
      <ul>
        <li><strong>明宝ハム</strong> — 全国的に有名なブランド。地元の豚肉を使った手作りハムは、お土産にも最適。</li>
        <li><strong>明宝トマトケチャップ</strong> — 完熟トマト100%の手作りケチャップ。</li>
        <li><strong>鶏ちゃん（けいちゃん）</strong> — 郡上の郷土料理。味噌や醤油で味付けした鶏肉を野菜と焼く。</li>
      </ul>
    </div>

    <div class="kg-card kg-card-area kg-reveal">
      <span class="kg-area-icon" aria-hidden="true">&#9968;</span>
      <h3 class="kg-card-title">観光・レジャー</h3>
      <ul>
        <li><strong>めいほうスキー場</strong> — 冬季は良質な雪でスキー・スノーボードが楽しめます。</li>
        <li><strong>明宝歴史民俗資料館</strong> — 地域の生活道具や歴史資料を展示。気良座の隣。</li>
        <li><strong>郡上踊り（郡上おどり）</strong> — 7〜9月に郡上八幡で開催される日本三大盆踊り。</li>
      </ul>
    </div>

    <div class="kg-card kg-card-area kg-reveal">
      <span class="kg-area-icon" aria-hidden="true">&#127969;</span>
      <h3 class="kg-card-title">宿泊</h3>
      <ul>
        <li><strong>料理旅館みずかみ</strong> — 気良地区の料理旅館。</li>
        <li><strong>旅館くご</strong> — 気良地区の旅館。</li>
        <li><strong>民宿しもだ</strong> — 気良地区の民宿。</li>
        <li><strong>明宝温泉 湯星館</strong> — 天然温泉の日帰り入浴・宿泊施設。</li>
        <li><strong>郡上八幡エリア</strong> — ホテルや旅館が多く、車で約30分。</li>
      </ul>
    </div>
  </div>
</section>

<!-- ═══════ §6 よくある質問（FAQ） ═══════ -->
<section class="kg-section" id="faq">
  <h2 class="kg-section-title kg-reveal">よくある質問</h2>

  <div class="kg-faq-list">
${FAQ_ITEMS.map((f, i) => `    <details class="kg-faq-item kg-reveal">
      <summary class="kg-faq-q">${esc(f.q)}</summary>
      <div class="kg-faq-a">${esc(f.a)}</div>
    </details>`).join("\n")}
  </div>
</section>

<!-- ═══════ FOOTER ═══════ -->
<footer class="kg-footer">
  <div class="kg-footer-inner">
    <p class="kg-footer-name">気良歌舞伎</p>
    <p class="kg-footer-addr">岐阜県郡上市明宝気良 &mdash; 気良座</p>
    <div class="kg-footer-links">
      <a href="/kerakabuki">気良歌舞伎トップ</a>
      <a href="/kerakabuki/press">PRESS / お知らせ</a>
      <a href="/kerakabuki/archive">公演アーカイブ</a>
      <a href="/kerakabuki/story/1">ストーリー全文</a>
    </div>
    <p class="kg-footer-copy">&copy; 気良歌舞伎</p>
  </div>
</footer>

<!-- ═══════ CLIENT JS ═══════ -->
<script>
(function(){
  /* ── Mobile nav toggle ── */
  var toggle = document.getElementById("kg-nav-toggle");
  var links = document.getElementById("kg-nav-links");
  toggle.addEventListener("click", function(){ links.classList.toggle("kg-nav-open"); toggle.classList.toggle("kg-nav-active"); });
  links.addEventListener("click", function(e){ if (e.target.tagName === "A") { links.classList.remove("kg-nav-open"); toggle.classList.remove("kg-nav-active"); } });

  /* ── Sticky nav background on scroll ── */
  var nav = document.getElementById("kg-nav");
  var scrolled = false;
  function checkScroll(){
    var s = window.scrollY > 60;
    if (s !== scrolled) { scrolled = s; nav.classList.toggle("kg-nav-scrolled", s); }
  }
  window.addEventListener("scroll", checkScroll, { passive: true });
  checkScroll();

  /* ── IntersectionObserver: scroll reveal ── */
  var io;
  var revealEls = document.querySelectorAll(".kg-reveal");
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting) { e.target.classList.add("kg-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add("kg-visible"); });
  }

  /* ── Smooth scroll for hash links ── */
  document.addEventListener("click", function(e){
    var a = e.target.closest("a[href^='#']");
    if (!a) return;
    var target = document.getElementById(a.getAttribute("href").slice(1));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: "smooth" }); }
  });
})();
</script>
</body>
</html>`;
}

function esc(s) {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* ════════════════════════════════════════
   CSS
   ════════════════════════════════════════ */
const KG_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  font-family: "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif;
  background: #0a0a0f; color: #e8e4dc;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
a { color: inherit; }
img { max-width: 100%; display: block; }

/* ── Site Nav ── */
.kg-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 1.5rem; height: 56px;
  transition: background 0.3s, box-shadow 0.3s;
}
.kg-nav-scrolled {
  background: rgba(10,10,15,0.92);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 1px 8px rgba(0,0,0,0.5);
}
.kg-nav-brand {
  font-family: "Noto Serif JP", serif;
  font-size: 1.05rem; font-weight: 700;
  color: #c5a255; text-decoration: none;
  letter-spacing: 0.15em;
}
.kg-nav-links {
  display: flex; gap: 1.5rem;
}
.kg-nav-links a {
  font-size: 0.8rem; color: #b8a88a;
  text-decoration: none; letter-spacing: 0.08em;
  transition: color 0.2s;
}
.kg-nav-links a:hover { color: #e8c96a; }
.kg-nav-toggle {
  display: none; background: none; border: none;
  cursor: pointer; width: 28px; height: 20px;
  position: relative; flex-direction: column; justify-content: space-between;
}
.kg-nav-toggle span {
  display: block; width: 100%; height: 2px;
  background: #c5a255; border-radius: 1px;
  transition: all 0.25s;
}
.kg-nav-active span:nth-child(1) { transform: translateY(9px) rotate(45deg); }
.kg-nav-active span:nth-child(2) { opacity: 0; }
.kg-nav-active span:nth-child(3) { transform: translateY(-9px) rotate(-45deg); }

@media (max-width: 640px) {
  .kg-nav-toggle { display: flex; }
  .kg-nav-links {
    display: none; position: absolute;
    top: 56px; left: 0; right: 0;
    flex-direction: column; gap: 0;
    background: rgba(10,10,15,0.96);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(197,162,85,0.14);
  }
  .kg-nav-open { display: flex; }
  .kg-nav-links a {
    padding: 0.9rem 1.5rem; font-size: 0.88rem;
    border-bottom: 1px solid rgba(197,162,85,0.08);
  }
}

/* ── Hero ── */
.kg-hero {
  min-height: 46vh;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center;
  background: linear-gradient(180deg, #0a0a0f 0%, #12101c 100%);
  position: relative; overflow: hidden;
  padding-top: 56px;
}
.kg-hero-inner { padding: 2rem 1rem; position: relative; z-index: 1; }
.kg-hero-en {
  font-family: "Noto Sans JP", sans-serif;
  font-size: 0.78rem; font-weight: 600;
  letter-spacing: 0.35em; color: #6a5d4a;
  margin-bottom: 0.8rem;
  text-transform: uppercase;
}
.kg-hero-title {
  font-family: "Noto Serif JP", serif;
  font-size: clamp(1.8rem, 6vw, 2.8rem);
  letter-spacing: 0.2em;
  color: #c5a255;
}
.kg-hero-sub {
  margin-top: 1rem;
  font-size: clamp(0.82rem, 2.2vw, 0.95rem);
  color: #b8a88a;
  letter-spacing: 0.08em;
  line-height: 1.8;
}
.kg-scroll-hint {
  position: absolute; bottom: 1.5rem; left: 50%;
  transform: translateX(-50%);
}
.kg-scroll-arrow {
  display: block; width: 18px; height: 18px;
  border-right: 2px solid #c5a255; border-bottom: 2px solid #c5a255;
  transform: rotate(45deg);
  animation: kgBounce 2s infinite;
}
@keyframes kgBounce {
  0%,100% { transform: rotate(45deg) translateY(0); opacity: 0.5; }
  50% { transform: rotate(45deg) translateY(6px); opacity: 1; }
}

/* ── Sections ── */
.kg-section {
  max-width: 900px; margin: 0 auto;
  padding: 4.5rem 1.2rem;
}
.kg-section-title {
  font-family: "Noto Serif JP", serif;
  font-size: 1.5rem; color: #c5a255;
  letter-spacing: 0.25em; text-align: center;
  margin-bottom: 0.5rem;
  position: relative; padding-bottom: 0.8rem;
}
.kg-section-title::after {
  content: ""; display: block;
  width: 40px; height: 2px;
  background: linear-gradient(90deg, #c5a255, #e8c96a);
  margin: 0.6rem auto 0;
}
.kg-section-sub {
  text-align: center; font-size: 0.88rem;
  color: #6a5d4a; margin-bottom: 2rem;
}

/* ── Text block ── */
.kg-text-block {
  max-width: 700px; margin: 1.5rem auto 0;
}
.kg-text-block p {
  font-size: 0.92rem; color: #b8a88a;
  line-height: 2; margin-bottom: 1rem;
}
.kg-accent-text {
  font-size: 1rem !important; color: #e8e4dc !important;
  font-weight: bold; text-align: center;
  margin: 1.5rem 0 !important;
}
.kg-highlight {
  background: rgba(18,18,28,0.92);
  border: 1px solid rgba(197,162,85,0.14);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
}
.kg-highlight p {
  margin-bottom: 0.8rem; color: #e8e4dc !important;
  font-size: 0.95rem !important;
}
.kg-highlight ul {
  list-style: none; padding: 0;
}
.kg-highlight li {
  position: relative;
  padding: 0.4rem 0 0.4rem 1.2rem;
  font-size: 0.88rem; color: #b8a88a;
  line-height: 1.7;
}
.kg-highlight li::before {
  content: ""; position: absolute;
  left: 0; top: 0.9rem;
  width: 6px; height: 6px;
  background: #c5a255; border-radius: 50%;
}
.kg-highlight li strong { color: #e8e4dc; }

/* ── Cards ── */
.kg-cards {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 1.2rem; margin-top: 1.5rem;
}
.kg-cards-2col { grid-template-columns: 1fr 1fr; }
.kg-cards-3col { grid-template-columns: repeat(3, 1fr); }
.kg-card {
  background: rgba(18,18,28,0.92);
  border: 1px solid rgba(197,162,85,0.14);
  border-radius: 12px;
  padding: 1.5rem;
  transition: border-color 0.2s;
}
.kg-card:hover { border-color: rgba(197,162,85,0.3); }
.kg-card-title {
  font-family: "Noto Serif JP", serif;
  font-size: 1.05rem; color: #c5a255;
  margin-bottom: 0.8rem;
  letter-spacing: 0.05em;
}
.kg-card p {
  font-size: 0.88rem; color: #b8a88a;
  line-height: 1.75; margin-bottom: 0.6rem;
}
.kg-card ul {
  list-style: none; padding: 0;
}
.kg-card li {
  position: relative;
  padding: 0.35rem 0 0.35rem 1.1rem;
  font-size: 0.85rem; color: #b8a88a;
  line-height: 1.7;
}
.kg-card li::before {
  content: ""; position: absolute;
  left: 0; top: 0.85rem;
  width: 5px; height: 5px;
  background: #c5a255; border-radius: 50%;
}
.kg-card li strong { color: #e8e4dc; }

/* ── Area cards ── */
.kg-card-area { text-align: center; }
.kg-card-area .kg-card-title { margin-top: 0.3rem; }
.kg-card-area ul { text-align: left; }
.kg-area-icon {
  display: block; font-size: 1.8rem;
  margin-bottom: 0.2rem;
}

/* ── Access ── */
.kg-access-info {
  background: rgba(18,18,28,0.92);
  border: 1px solid rgba(197,162,85,0.14);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem auto; max-width: 700px;
}
.kg-access-venue {
  text-align: center; margin-bottom: 1.2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(197,162,85,0.1);
}
.kg-access-venue-name {
  font-family: "Noto Serif JP", serif;
  font-size: 1.2rem; color: #c5a255;
  letter-spacing: 0.1em;
}
.kg-access-venue-sub {
  font-size: 0.82rem; color: #6a5d4a;
  margin-top: 0.3rem;
}
.kg-access-detail { max-width: 600px; margin: 0 auto; }
.kg-access-row {
  display: flex; gap: 0.8rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(197,162,85,0.06);
  font-size: 0.88rem; color: #b8a88a;
}
.kg-access-row:last-child { border-bottom: none; }
.kg-access-label {
  flex-shrink: 0; min-width: 60px;
  font-weight: bold; color: #c5a255;
  font-size: 0.82rem;
}
.kg-map-wrap {
  max-width: 700px; margin: 1.5rem auto;
  border-radius: 12px; overflow: hidden;
  border: 1px solid rgba(197,162,85,0.14);
}
.kg-map-wrap iframe {
  display: block; width: 100%; height: 350px;
}

/* ── FAQ ── */
.kg-faq-list {
  max-width: 700px; margin: 1.5rem auto 0;
  display: flex; flex-direction: column; gap: 0.6rem;
}
.kg-faq-item {
  background: rgba(18,18,28,0.92);
  border: 1px solid rgba(197,162,85,0.14);
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.2s;
}
.kg-faq-item[open] { border-color: rgba(197,162,85,0.3); }
.kg-faq-q {
  padding: 0.9rem 1.1rem;
  cursor: pointer; user-select: none;
  font-size: 0.9rem; font-weight: 600;
  color: #e8e4dc; line-height: 1.5;
  list-style: none;
  display: flex; align-items: flex-start; gap: 0.5rem;
}
.kg-faq-q::-webkit-details-marker { display: none; }
.kg-faq-q::before {
  content: "\\25B6"; font-size: 0.5rem; color: #c5a255;
  flex-shrink: 0; margin-top: 0.35rem;
  transition: transform 0.2s;
}
.kg-faq-item[open] .kg-faq-q::before { transform: rotate(90deg); }
.kg-faq-a {
  padding: 0 1.1rem 1rem 2rem;
  font-size: 0.85rem; color: #b8a88a;
  line-height: 1.8;
  border-top: 1px solid rgba(197,162,85,0.08);
  padding-top: 0.8rem;
}

/* ── Footer ── */
.kg-footer {
  border-top: 1px solid rgba(197,162,85,0.12);
  padding: 3rem 1.2rem 2.5rem;
  text-align: center;
}
.kg-footer-inner { max-width: 600px; margin: 0 auto; }
.kg-footer-name {
  font-family: "Noto Serif JP", serif;
  font-size: 1.1rem; color: #c5a255;
  letter-spacing: 0.2em; margin-bottom: 0.4rem;
}
.kg-footer-addr {
  font-size: 0.8rem; color: #6a5d4a;
  margin-bottom: 1.2rem;
}
.kg-footer-links {
  display: flex; justify-content: center;
  gap: 1.5rem; flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
.kg-footer-links a {
  font-size: 0.82rem; color: #b8a88a;
  text-decoration: none; transition: color 0.2s;
}
.kg-footer-links a:hover { color: #e8c96a; }
.kg-footer-copy {
  font-size: 0.72rem; color: #3a3530;
}

/* ── Scroll reveal ── */
.kg-reveal {
  opacity: 0; transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.kg-visible { opacity: 1; transform: translateY(0); }
@media (prefers-reduced-motion: reduce) {
  .kg-reveal { opacity: 1; transform: none; transition: none; }
  .kg-scroll-arrow { animation: none; }
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .kg-cards { grid-template-columns: 1fr; }
  .kg-cards-2col { grid-template-columns: 1fr; }
  .kg-cards-3col { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .kg-section { padding: 3rem 1rem; }
  .kg-section-title { font-size: 1.25rem; }
  .kg-hero-title { letter-spacing: 0.12em; }
  .kg-access-row { flex-direction: column; gap: 0.2rem; }
  .kg-map-wrap iframe { height: 260px; }
}
`;
