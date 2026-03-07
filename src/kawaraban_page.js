// src/kawaraban_page.js
// =========================================================
// 地歌舞伎かわら版 — /kerakabuki/kawaraban
// スタンドアロン HTML（ダークテーマ、kera_official_page.js と統一）
// =========================================================

export function kawarabanPageHTML() {
  const issues = [
    { num: "第十一号", label: "第11号", file: "11", date: "2021年" },
    { num: "第十号",   label: "第10号", file: "10", date: "2020年" },
    { num: "第九号",   label: "第9号",  file: "09", date: "2017年12月" },
    { num: "第八号",   label: "第8号",  file: "08", date: "2017年10月" },
    { num: "第七号",   label: "第7号",  file: "07", date: "2017年8月" },
    { num: "第六号",   label: "第6号",  file: "06", date: "2017年7月" },
    { num: "第五号",   label: "第5号",  file: "05", date: "2017年5月" },
    { num: "第四号",   label: "第4号",  file: "04", date: "2016年11月", imageOnly: true },
    { num: "第参号",   label: "第3号",  file: "03", date: "2016年8月" },
    { num: "第弐号",   label: "第2号",  file: "02", date: "2016年7月" },
    { num: "創刊号",   label: "創刊号", file: "01", date: "2016年5月" },
  ];

  const cardsHTML = issues.map((iss) => {
    const hasFile = iss.file !== null;
    const tag = hasFile ? "a" : "div";
    const href = hasFile ? ` href="/kerakabuki/kawaraban/pdf/${iss.file}" target="_blank"` : "";
    const cls = hasFile ? "kw-card kw-has-pdf kw-reveal" : "kw-card kw-no-pdf kw-reveal";
    return `<${tag}${href} class="${cls}">
      <div class="kw-num">${iss.label}</div>
      <h3 class="kw-title">高雄・気良<br>地歌舞伎かわら版</h3>
      <div class="kw-sub">${iss.num}</div>
      ${iss.date ? `<div class="kw-date">${iss.date}</div>` : ""}
      ${hasFile ? (iss.imageOnly ? '<div class="kw-badge">画像を見る</div>' : '<div class="kw-badge">PDFを見る</div>') : '<div class="kw-badge kw-na">準備中</div>'}
    </${tag}>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>地歌舞伎かわら版 — 気良歌舞伎</title>
<meta name="description" content="高雄歌舞伎保存会・気良歌舞伎が共同で発行する「地歌舞伎かわら版」バックナンバー一覧。">
<meta property="og:title" content="地歌舞伎かわら版 — 気良歌舞伎">
<meta property="og:description" content="高雄歌舞伎保存会・気良歌舞伎が共同で発行する「地歌舞伎かわら版」バックナンバー一覧。">
<meta property="og:image" content="https://kabukiplus.com/assets/ogp/ogp_kabukiplus_top.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="気良歌舞伎">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/apple-touch-icon.png" type="image/png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta name="theme-color" content="#0a0a0f">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>${KW_CSS}</style>
</head>
<body>

<!-- ═══════ NAV ═══════ -->
<nav class="kw-nav" id="kw-nav">
  <a href="/kerakabuki" class="kw-nav-brand">気良歌舞伎</a>
  <div class="kw-nav-links">
    <a href="/kerakabuki">トップ</a>
    <a href="/kerakabuki/press">PRESS</a>
  </div>
</nav>

<!-- ═══════ HERO ═══════ -->
<section class="kw-hero">
  <p class="kw-hero-label">KERAKABUKI</p>
  <h1 class="kw-hero-title">地歌舞伎かわら版</h1>
  <p class="kw-hero-sub">高雄歌舞伎保存会・気良歌舞伎 共同発行</p>
</section>

<!-- ═══════ INTRO ═══════ -->
<section class="kw-section">
  <p class="kw-intro kw-reveal">地歌舞伎の魅力や活動報告をお届けする「かわら版」のバックナンバー一覧です。<br>カードをクリックするとPDF（または画像）でご覧いただけます。</p>
</section>

<!-- ═══════ GRID ═══════ -->
<section class="kw-section">
  <div class="kw-grid">
    ${cardsHTML}
  </div>
</section>

<!-- ═══════ FOOTER ═══════ -->
<footer class="kw-footer">
  <div class="kw-footer-inner">
    <p class="kw-footer-name">気良歌舞伎</p>
    <p class="kw-footer-addr">岐阜県郡上市明宝気良 &mdash; 気良座</p>
    <div class="kw-footer-links">
      <a href="/kerakabuki">公式ページ</a>
      <a href="/kerakabuki/press">PRESS / お知らせ</a>
      <a href="/kerakabuki/story/1">ストーリー全文</a>
    </div>
    <p class="kw-footer-copy">&copy; 気良歌舞伎</p>
  </div>
</footer>

<script>
(function(){
  var nav = document.getElementById("kw-nav");
  var scrolled = false;
  function checkScroll(){
    var s = window.scrollY > 40;
    if (s !== scrolled) { scrolled = s; nav.classList.toggle("kw-nav-scrolled", s); }
  }
  window.addEventListener("scroll", checkScroll, { passive: true });
  checkScroll();

  var els = document.querySelectorAll(".kw-reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting) { e.target.classList.add("kw-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    els.forEach(function(el){ io.observe(el); });
  } else {
    els.forEach(function(el){ el.classList.add("kw-visible"); });
  }
})();
</script>
</body>
</html>`;
}

/* ════════════════════════════════════════
   CSS
   ════════════════════════════════════════ */
const KW_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  font-family: "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif;
  background: #0a0a0f; color: #e8e4dc;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
a { color: inherit; }

/* ── Nav ── */
.kw-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 1.5rem; height: 56px;
  transition: background 0.3s, box-shadow 0.3s;
}
.kw-nav-scrolled {
  background: rgba(10,10,15,0.92);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 1px 8px rgba(0,0,0,0.5);
}
.kw-nav-brand {
  font-family: "Noto Serif JP", serif;
  font-size: 1.05rem; font-weight: 700;
  color: #c5a255; text-decoration: none;
  letter-spacing: 0.15em;
}
.kw-nav-links { display: flex; gap: 1.5rem; }
.kw-nav-links a {
  font-size: 0.8rem; color: #b8a88a;
  text-decoration: none; letter-spacing: 0.08em;
  transition: color 0.2s;
}
.kw-nav-links a:hover { color: #e8c96a; }

/* ── Hero ── */
.kw-hero {
  padding: 7rem 1rem 3rem;
  text-align: center;
  background: linear-gradient(180deg, #0a0a0f 0%, #12101c 50%, #0a0a0f 100%);
}
.kw-hero-label {
  font-size: 0.72rem; font-weight: 600;
  color: #6a5d4a; letter-spacing: 0.35em;
  text-transform: uppercase;
  margin-bottom: 0.8rem;
}
.kw-hero-title {
  font-family: "Noto Serif JP", serif;
  font-size: clamp(1.5rem, 5vw, 2.2rem);
  letter-spacing: 0.2em;
  color: #c5a255;
}
.kw-hero-sub {
  margin-top: 0.8rem;
  font-size: 0.85rem; color: #b8a88a;
  letter-spacing: 0.08em;
}

/* ── Section ── */
.kw-section {
  max-width: 900px; margin: 0 auto;
  padding: 2rem 1.2rem;
}
.kw-intro {
  text-align: center; font-size: 0.88rem;
  color: #b8a88a; line-height: 1.8;
}

/* ── Scroll reveal ── */
.kw-reveal {
  opacity: 0; transform: translateY(16px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.kw-visible { opacity: 1; transform: translateY(0); }
@media (prefers-reduced-motion: reduce) {
  .kw-reveal { opacity: 1; transform: none; transition: none; }
}

/* ── Grid ── */
.kw-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}
.kw-card {
  display: flex; flex-direction: column;
  align-items: center;
  background: rgba(18,18,28,0.7);
  border: 1px solid rgba(197,162,85,0.14);
  border-radius: 14px;
  padding: 1.3rem 0.8rem 1rem;
  text-align: center;
  text-decoration: none;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}
.kw-has-pdf { cursor: pointer; }
.kw-has-pdf:hover {
  border-color: #c5a255;
  transform: translateY(-3px);
  box-shadow: 0 4px 16px rgba(197,162,85,0.15);
  text-decoration: none;
}
.kw-no-pdf { opacity: 0.4; cursor: default; }
.kw-num {
  display: inline-block;
  font-size: 0.7rem; font-weight: bold;
  color: #e08080;
  background: rgba(200,80,80,0.12);
  padding: 0.15rem 0.6rem;
  border-radius: 20px;
  margin-bottom: 0.5rem;
}
.kw-title {
  font-size: 0.82rem; font-weight: 600;
  color: #e8e4dc;
  line-height: 1.4;
  margin-bottom: 0.2rem;
}
.kw-sub { font-size: 0.74rem; color: #6a5d4a; }
.kw-date { font-size: 0.68rem; color: #b8a88a; margin-top: 0.25rem; }
.kw-badge {
  margin-top: 0.6rem;
  font-size: 0.7rem; font-weight: 600;
  color: #c5a255;
}
.kw-na { color: #6a5d4a; font-weight: normal; }

@media (max-width: 600px) {
  .kw-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 0.7rem; }
  .kw-card { padding: 1rem 0.5rem 0.8rem; }
  .kw-hero-title { font-size: 1.4rem; }
}

/* ── Footer ── */
.kw-footer {
  border-top: 1px solid rgba(197,162,85,0.12);
  padding: 3rem 1.2rem 2.5rem;
  text-align: center;
}
.kw-footer-inner { max-width: 600px; margin: 0 auto; }
.kw-footer-name {
  font-family: "Noto Serif JP", serif;
  font-size: 1.1rem; color: #c5a255;
  letter-spacing: 0.2em; margin-bottom: 0.4rem;
}
.kw-footer-addr {
  font-size: 0.8rem; color: #6a5d4a;
  margin-bottom: 1.2rem;
}
.kw-footer-links {
  display: flex; justify-content: center;
  gap: 1.5rem; flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
.kw-footer-links a {
  font-size: 0.82rem; color: #b8a88a;
  text-decoration: none; transition: color 0.2s;
}
.kw-footer-links a:hover { color: #e8c96a; }
.kw-footer-copy { font-size: 0.72rem; color: #3a3530; }
`;
