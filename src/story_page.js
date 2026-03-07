// src/story_page.js
// =========================================================
// 気良歌舞伎ストーリー — /kerakabuki/story/:id
// スタンドアロン HTML（LP と統一デザイン）
// 全10話＋まとめ — 日英バイリンガル全文アーカイブ
// =========================================================

export function storyPageHTML() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>気良歌舞伎ストーリー</title>
<meta name="description" content="復活から20年。気良歌舞伎の歩みを全10話で辿る。">
<meta property="og:title" content="気良歌舞伎ストーリー">
<meta property="og:description" content="復活から20年。気良歌舞伎の歩みを全10話で辿る。">
<meta property="og:image" content="https://kabukiplus.com/assets/ogp/ogp_kabukiplus_top.png">
<meta property="og:type" content="article">
<meta property="og:site_name" content="気良歌舞伎">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/kera-favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/kera-touch-icon.png">
<meta name="theme-color" content="#0a0a0f">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>${STORY_CSS}</style>
</head>
<body>

<!-- ── Nav ── -->
<nav class="ks-nav" id="ks-nav">
  <a href="/kerakabuki" class="ks-nav-brand">気良歌舞伎</a>
  <div class="ks-nav-right">
    <div class="ks-lang">
      <button class="ks-lang-btn ks-lang-active" data-lang="ja">日本語</button>
      <button class="ks-lang-btn" data-lang="en">EN</button>
    </div>
  </div>
</nav>

<!-- ── Breadcrumb ── -->
<div class="ks-bc" id="ks-bc">
  <a href="/kerakabuki">気良歌舞伎</a><span>&rsaquo;</span><span id="ks-bc-tail">ストーリー</span>
</div>

<!-- ── App ── -->
<div id="app">
  <div class="ks-loading">読み込み中…</div>
</div>

<!-- ── Footer ── -->
<footer class="ks-footer">
  <a href="/kerakabuki">気良歌舞伎トップへ</a>
</footer>

<script>
(function(){
  var app = document.getElementById("app");
  var bcTail = document.getElementById("ks-bc-tail");
  var lang = "ja";
  var stories = null;

  /* ── Sticky nav ── */
  var nav = document.getElementById("ks-nav");
  var scrolled = false;
  window.addEventListener("scroll", function(){
    var s = window.scrollY > 40;
    if (s !== scrolled) { scrolled = s; nav.classList.toggle("ks-nav-scrolled", s); }
  }, { passive: true });

  /* ── Language toggle ── */
  document.querySelectorAll(".ks-lang-btn").forEach(function(btn){
    btn.addEventListener("click", function(){
      lang = btn.dataset.lang;
      document.querySelectorAll(".ks-lang-btn").forEach(function(b){ b.classList.remove("ks-lang-active"); });
      btn.classList.add("ks-lang-active");
      route();
    });
  });

  /* ── Fetch data ── */
  fetch("/api/stories")
    .then(function(r){ return r.json(); })
    .then(function(data){
      stories = data;
      route();
      window.addEventListener("popstate", route);
    })
    .catch(function(){
      app.innerHTML = '<div class="ks-empty">読み込みに失敗しました。</div>';
    });

  /* ── Router ── */
  function route() {
    if (!stories) return;
    var path = location.pathname;
    var m = path.match(/\\/story\\/(\\d+|summary)$/);
    if (m) {
      showStory(m[1]);
    } else {
      showList();
    }
  }

  function navigate(href) {
    history.pushState(null, "", href);
    route();
    window.scrollTo(0, 0);
  }

  /* ── List view ── */
  function showList() {
    document.title = lang === "ja" ? "気良歌舞伎ストーリー" : "The Kera Kabuki Story";
    bcTail.innerHTML = lang === "ja" ? "ストーリー" : "Story";
    var intro = stories.intro || {};
    var html = '';

    html += '<section class="ks-hero">';
    html += '<h1 class="ks-hero-title">' + (lang === "ja" ? "気良歌舞伎ストーリー" : "The Kera Kabuki Story") + '</h1>';
    html += '<p class="ks-hero-sub">' + (lang === "ja"
      ? "復活から20年。一座の歩みを、全10話で辿る。"
      : "Twenty years since the revival \\u2014 the journey of a village kabuki troupe, in ten chapters.") + '</p>';
    if (intro[lang]) {
      html += '<div class="ks-hero-quote">' + esc(intro[lang]) + '</div>';
    }
    html += '</section>';

    html += '<div class="ks-grid">';
    var list = stories.stories || [];
    list.forEach(function(s, i){
      var d = s[lang] || s.ja || {};
      html += '<a href="/kerakabuki/story/' + s.id + '" class="ks-card ks-reveal" data-nav style="--delay:' + (i*0.04) + 's">';
      html += '<div class="ks-card-num">' + (s.id === "summary" ? (lang==="ja"?"まとめ":"Summary") : "#" + s.id) + '</div>';
      html += '<h3 class="ks-card-title">' + esc(d.title || "") + '</h3>';
      html += '<p class="ks-card-excerpt">' + esc(d.excerpt || "") + '</p>';
      html += '</a>';
    });
    html += '</div>';

    app.innerHTML = html;
    bindNav();
    observeReveal();
  }

  /* ── Detail view ── */
  function showStory(id) {
    var list = stories.stories || [];
    var s = list.find(function(x){ return String(x.id) === String(id); });
    if (!s) { showList(); return; }
    var d = s[lang] || s.ja || {};
    var idx = list.indexOf(s);

    document.title = (d.title || "ストーリー") + " — 気良歌舞伎";
    bcTail.innerHTML = '<a href="/kerakabuki/story" data-nav>' + (lang==="ja"?"ストーリー":"Story") + '</a><span> &rsaquo; </span>' + esc(d.title || "");

    var html = '';
    html += '<article class="ks-article ks-reveal">';
    html += '<div class="ks-article-num">' + (s.id === "summary" ? (lang==="ja"?"まとめ":"Summary") : "#" + s.id) + '</div>';
    html += '<h1 class="ks-article-title">' + esc(d.title || "") + '</h1>';
    if (d.subtitle) html += '<p class="ks-article-sub">' + esc(d.subtitle) + '</p>';
    html += '<div class="ks-article-body">';
    (d.paragraphs || []).forEach(function(p){
      if (p.startsWith("**") && p.endsWith("**")) {
        html += '<p class="ks-strong">' + esc(p.slice(2,-2)) + '</p>';
      } else if (p.startsWith("---")) {
        html += '<hr class="ks-divider">';
      } else {
        html += '<p>' + esc(p) + '</p>';
      }
    });
    html += '</div>';

    html += '<div class="ks-ext">';
    if (s.noteUrl) html += '<a href="' + s.noteUrl + '" target="_blank" rel="noopener" class="ks-ext-link">note で読む</a>';
    if (s.mediumUrl) html += '<a href="' + s.mediumUrl + '" target="_blank" rel="noopener" class="ks-ext-link">Read on Medium</a>';
    html += '</div>';

    html += '<nav class="ks-pager">';
    if (idx > 0) {
      var prev = list[idx - 1];
      var pd = prev[lang] || prev.ja || {};
      html += '<a href="/kerakabuki/story/' + prev.id + '" data-nav class="ks-pager-prev">&larr; ' + esc(pd.title || "") + '</a>';
    } else {
      html += '<span></span>';
    }
    if (idx < list.length - 1) {
      var next = list[idx + 1];
      var nd = next[lang] || next.ja || {};
      html += '<a href="/kerakabuki/story/' + next.id + '" data-nav class="ks-pager-next">' + esc(nd.title || "") + ' &rarr;</a>';
    }
    html += '</nav>';

    html += '<div class="ks-back"><a href="/kerakabuki/story" data-nav>' + (lang==="ja"?"一覧に戻る":"Back to list") + '</a></div>';
    html += '</article>';

    app.innerHTML = html;
    bindNav();
    observeReveal();
  }

  /* ── SPA nav ── */
  function bindNav() {
    document.querySelectorAll("[data-nav]").forEach(function(a){
      a.addEventListener("click", function(e){
        e.preventDefault();
        navigate(a.getAttribute("href"));
      });
    });
  }

  /* ── Scroll reveal ── */
  function observeReveal() {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".ks-reveal").forEach(function(el){ el.classList.add("ks-visible"); });
      return;
    }
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add("ks-visible"); obs.unobserve(e.target); } });
    }, { threshold: 0.08 });
    document.querySelectorAll(".ks-reveal").forEach(function(el){ obs.observe(el); });
  }

  function esc(s) {
    if (!s) return "";
    var el = document.createElement("span");
    el.textContent = s;
    return el.innerHTML;
  }
})();
</script>
</body>
</html>`;
}

/* ════════════════════════════════════════
   CSS — dark theme matching kera_official_page
   ════════════════════════════════════════ */
const STORY_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  font-family: "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif;
  background: #0a0a0f; color: #e8e4dc;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; }

/* ── Nav ── */
.ks-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 1.2rem; height: 52px;
  transition: background 0.3s;
}
.ks-nav-scrolled {
  background: rgba(10,10,15,0.92);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 1px 6px rgba(0,0,0,0.4);
}
.ks-nav-brand {
  font-family: "Noto Serif JP", serif;
  font-size: 0.95rem; font-weight: 700;
  color: #c5a255; text-decoration: none;
  letter-spacing: 0.12em;
}
.ks-nav-right { display: flex; align-items: center; }
.ks-lang { display: flex; gap: 0.25rem; }
.ks-lang-btn {
  padding: 0.28rem 0.7rem; font-size: 0.72rem;
  border: 1px solid rgba(197,162,85,0.26); border-radius: 16px;
  background: transparent; color: #6a5d4a;
  cursor: pointer; transition: all 0.2s;
  font-family: inherit;
}
.ks-lang-btn:hover { border-color: #c5a255; color: #c5a255; }
.ks-lang-active {
  background: #c5a255 !important; color: #0a0a0f !important;
  border-color: #c5a255 !important; font-weight: 600;
}

/* ── Breadcrumb ── */
.ks-bc {
  padding: 64px 1.2rem 0; max-width: 780px; margin: 0 auto;
  font-size: 0.78rem; color: #6a5d4a;
}
.ks-bc a { color: #b8a88a; text-decoration: none; }
.ks-bc a:hover { color: #c5a255; }
.ks-bc span { margin: 0 0.3rem; }

/* ── Hero (list) ── */
.ks-hero {
  text-align: center; padding: 2.5rem 1rem 2rem;
  border-bottom: 1px solid rgba(197,162,85,0.1);
  margin-bottom: 1.5rem;
}
.ks-hero-title {
  font-family: "Noto Serif JP", serif;
  font-size: 1.5rem; color: #c5a255;
  letter-spacing: 0.18em;
}
.ks-hero-sub {
  font-size: 0.88rem; color: #6a5d4a;
  margin-top: 0.5rem; line-height: 1.6;
}
.ks-hero-quote {
  max-width: 600px; margin: 1.2rem auto 0;
  font-size: 0.9rem; color: #b8a88a;
  line-height: 1.9; font-style: italic;
  border-left: 3px solid #c83030;
  padding-left: 1rem; text-align: left;
}

/* ── Card grid ── */
.ks-grid {
  display: flex; flex-direction: column; gap: 0.7rem;
  max-width: 740px; margin: 0 auto; padding: 0 1.2rem 3rem;
}
.ks-card {
  display: block; padding: 1.2rem;
  background: rgba(18,18,28,0.92);
  border: 1px solid rgba(197,162,85,0.14);
  border-radius: 12px;
  text-decoration: none;
  transition: border-color 0.2s, transform 0.2s;
  position: relative; overflow: hidden;
}
.ks-card::before {
  content: ""; position: absolute;
  left: 0; top: 0; bottom: 0; width: 3px;
  background: #c83030; transition: width 0.2s;
}
.ks-card:hover { border-color: #c5a255; transform: translateX(4px); text-decoration: none; }
.ks-card:hover::before { width: 5px; }
.ks-card-num { font-size: 0.72rem; font-weight: bold; color: #c83030; letter-spacing: 0.1em; margin-bottom: 0.3rem; }
.ks-card-title { font-size: 1rem; color: #e8e4dc; margin-bottom: 0.3rem; }
.ks-card-excerpt { font-size: 0.82rem; color: #6a5d4a; line-height: 1.5; margin: 0; }

/* ── Article ── */
.ks-article { max-width: 740px; margin: 0 auto; padding: 2rem 1.2rem 3rem; }
.ks-article-num { font-size: 0.78rem; font-weight: bold; color: #c83030; letter-spacing: 0.1em; margin-bottom: 0.4rem; }
.ks-article-title {
  font-family: "Noto Serif JP", serif;
  font-size: 1.4rem; color: #c5a255;
  line-height: 1.4; margin-bottom: 0.4rem;
  letter-spacing: 0.05em;
}
.ks-article-sub { font-size: 0.88rem; color: #6a5d4a; margin-bottom: 1.5rem; font-style: italic; }
.ks-article-body p {
  font-size: 0.94rem; color: #b8a88a;
  line-height: 2; margin-bottom: 0.8rem;
}
.ks-strong {
  font-size: 1rem !important; color: #e8e4dc !important;
  font-weight: bold; text-align: center;
  margin: 1.2rem 0 !important;
}
.ks-divider { border: none; border-top: 1px solid rgba(197,162,85,0.12); margin: 1.5rem 0; }

/* ── Ext links ── */
.ks-ext {
  display: flex; gap: 0.6rem; flex-wrap: wrap;
  margin-top: 2rem; padding-top: 1rem;
  border-top: 1px solid rgba(197,162,85,0.1);
}
.ks-ext-link {
  padding: 0.5rem 1rem; font-size: 0.82rem;
  background: rgba(18,18,28,0.92);
  border: 1px solid rgba(197,162,85,0.26);
  border-radius: 8px; color: #c5a255;
  text-decoration: none; transition: all 0.2s;
}
.ks-ext-link:hover { border-color: #c5a255; text-decoration: none; }

/* ── Pager ── */
.ks-pager {
  display: flex; justify-content: space-between; gap: 1rem;
  margin-top: 2rem; padding-top: 1rem;
  border-top: 1px solid rgba(197,162,85,0.1);
}
.ks-pager-prev, .ks-pager-next {
  font-size: 0.84rem; color: #c5a255;
  text-decoration: none; max-width: 45%;
  transition: color 0.2s;
}
.ks-pager-prev:hover, .ks-pager-next:hover { color: #e8c96a; text-decoration: none; }
.ks-pager-next { text-align: right; }
.ks-back {
  text-align: center; margin-top: 1.5rem;
}
.ks-back a {
  display: inline-block; padding: 0.6rem 1.5rem;
  font-size: 0.84rem; color: #b8a88a;
  border: 1px solid rgba(197,162,85,0.26);
  border-radius: 8px; text-decoration: none;
  transition: all 0.2s;
}
.ks-back a:hover { border-color: #c5a255; color: #c5a255; }

/* ── Scroll reveal ── */
.ks-reveal {
  opacity: 0; transform: translateY(16px);
  transition: opacity 0.5s ease calc(var(--delay, 0s)), transform 0.5s ease calc(var(--delay, 0s));
}
.ks-visible { opacity: 1; transform: translateY(0); }
@media (prefers-reduced-motion: reduce) {
  .ks-reveal { opacity: 1; transform: none; transition: none; }
}

/* ── Footer ── */
.ks-footer {
  border-top: 1px solid rgba(197,162,85,0.1);
  padding: 2rem 1rem; text-align: center;
}
.ks-footer a {
  font-size: 0.82rem; color: #6a5d4a;
  text-decoration: none; transition: color 0.2s;
}
.ks-footer a:hover { color: #c5a255; }

/* ── Utility ── */
.ks-loading, .ks-empty {
  text-align: center; padding: 4rem 1rem;
  font-size: 0.88rem; color: #6a5d4a;
}

/* ── Mobile ── */
@media (max-width: 600px) {
  .ks-hero-title { font-size: 1.2rem; }
  .ks-article-title { font-size: 1.15rem; }
  .ks-article-body p { font-size: 0.9rem; line-height: 1.9; }
  .ks-pager { flex-direction: column; }
}
`;
