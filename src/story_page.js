// src/story_page.js
// =========================================================
// 気良歌舞伎ストーリー — /story , /story/:id
// 全10話＋まとめ — 日英バイリンガル全文アーカイブ
// =========================================================
import { pageShell } from "./web_layout.js";

export function storyPageHTML() {
  const bodyHTML = `
    <div class="breadcrumb" id="bc">
      <a href="/">トップ</a><span>›</span><a href="/jikabuki/gate/kera">JIKABUKI PLUS+</a><span>›</span><span id="bc-tail">ストーリー</span>
    </div>

    <!-- ── 言語切替 ── -->
    <div class="lang-toggle">
      <button class="lang-btn lang-active" data-lang="ja">日本語</button>
      <button class="lang-btn" data-lang="en">English</button>
    </div>

    <!-- ── メインアプリ ── -->
    <div id="app">
      <div class="loading">ストーリーを読み込み中…</div>
    </div>

    <script>
    (function(){
      var app = document.getElementById("app");
      var bcTail = document.getElementById("bc-tail");
      var lang = "ja";
      var stories = null;

      // ── 言語切替 ──
      document.querySelectorAll(".lang-btn").forEach(function(btn){
        btn.addEventListener("click", function(){
          lang = btn.dataset.lang;
          document.querySelectorAll(".lang-btn").forEach(function(b){ b.classList.remove("lang-active"); });
          btn.classList.add("lang-active");
          route();
        });
      });

      // ── データ取得 ──
      fetch("/api/stories")
        .then(function(r){ return r.json(); })
        .then(function(data){
          stories = data;
          route();
          window.addEventListener("popstate", route);
        })
        .catch(function(){
          app.innerHTML = '<div class="empty-state">読み込みに失敗しました。</div>';
        });

      // ── ルーティング ──
      function route() {
        if (!stories) return;
        var path = location.pathname;
        var m = path.match(/^\\/jikabuki\\/gate\\/kera\\/story\\/(\\d+|summary)$/);
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

      // ── 一覧画面 ──
      function showList() {
        bcTail.innerHTML = lang === "ja" ? "ストーリー" : "Story";
        var intro = stories.intro || {};
        var html = '';

        // イントロ
        html += '<section class="story-hero fade-up">';
        html += '<h2 class="story-hero-title">' + (lang === "ja" ? "気良歌舞伎ストーリー" : "The Kera Kabuki Story") + '</h2>';
        html += '<p class="story-hero-sub">' + (lang === "ja"
          ? "2005年の復活から20年——小さな山里の歌舞伎が歩んできた物語"
          : "From a 2005 revival to twenty years of tradition — the story of a small village\\'s kabuki") + '</p>';
        if (intro[lang]) {
          html += '<div class="story-hero-quote">' + esc(intro[lang]) + '</div>';
        }
        html += '</section>';

        // ストーリーカード
        html += '<div class="story-grid">';
        var list = stories.stories || [];
        list.forEach(function(s, i){
          var d = s[lang] || s.ja || {};
          html += '<a href="/jikabuki/gate/kera/story/' + s.id + '" class="story-card fade-up" data-nav style="animation-delay:' + (i*0.05) + 's">';
          html += '<div class="story-card-num">' + (s.id === "summary" ? (lang==="ja"?"まとめ":"Summary") : "#" + s.id) + '</div>';
          html += '<h3 class="story-card-title">' + esc(d.title || "") + '</h3>';
          html += '<p class="story-card-excerpt">' + esc(d.excerpt || "") + '</p>';
          html += '</a>';
        });
        html += '</div>';

        app.innerHTML = html;
        bindNav();
      }

      // ── 個別ストーリー画面 ──
      function showStory(id) {
        var list = stories.stories || [];
        var s = list.find(function(x){ return String(x.id) === String(id); });
        if (!s) { showList(); return; }
        var d = s[lang] || s.ja || {};
        var idx = list.indexOf(s);

        bcTail.innerHTML = '<a href="/jikabuki/gate/kera/story" data-nav>' + (lang==="ja"?"ストーリー":"Story") + '</a><span> › </span>' + esc(d.title || "");

        var html = '';
        html += '<article class="story-article fade-up">';
        html += '<div class="story-article-num">' + (s.id === "summary" ? (lang==="ja"?"まとめ":"Summary") : "#" + s.id) + '</div>';
        html += '<h2 class="story-article-title">' + esc(d.title || "") + '</h2>';
        if (d.subtitle) html += '<p class="story-article-sub">' + esc(d.subtitle) + '</p>';
        html += '<div class="story-article-body">';
        (d.paragraphs || []).forEach(function(p){
          if (p.startsWith("**") && p.endsWith("**")) {
            html += '<p class="story-accent">' + esc(p.slice(2,-2)) + '</p>';
          } else if (p.startsWith("---")) {
            html += '<hr class="story-divider">';
          } else {
            html += '<p>' + esc(p) + '</p>';
          }
        });
        html += '</div>';

        // 外部リンク
        html += '<div class="story-ext-links">';
        if (s.noteUrl) html += '<a href="' + s.noteUrl + '" target="_blank" rel="noopener" class="ext-link">📝 note で読む</a>';
        if (s.mediumUrl) html += '<a href="' + s.mediumUrl + '" target="_blank" rel="noopener" class="ext-link">📖 Read on Medium</a>';
        html += '</div>';

        // Prev / Next
        html += '<nav class="story-pager">';
        if (idx > 0) {
          var prev = list[idx - 1];
          var pd = prev[lang] || prev.ja || {};
          html += '<a href="/jikabuki/gate/kera/story/' + prev.id + '" data-nav class="pager-prev">← ' + esc(pd.title || "") + '</a>';
        } else {
          html += '<span></span>';
        }
        if (idx < list.length - 1) {
          var next = list[idx + 1];
          var nd = next[lang] || next.ja || {};
          html += '<a href="/jikabuki/gate/kera/story/' + next.id + '" data-nav class="pager-next">' + esc(nd.title || "") + ' →</a>';
        }
        html += '</nav>';

        html += '<div style="text-align:center;margin-top:1.5rem;"><a href="/jikabuki/gate/kera/story" data-nav class="btn btn-secondary">' + (lang==="ja"?"← 一覧に戻る":"← Back to list") + '</a></div>';
        html += '</article>';

        app.innerHTML = html;
        bindNav();
      }

      // ── SPA ナビ ──
      function bindNav() {
        document.querySelectorAll("[data-nav]").forEach(function(a){
          a.addEventListener("click", function(e){
            e.preventDefault();
            navigate(a.getAttribute("href"));
          });
        });
      }

      function esc(s) {
        if (!s) return "";
        var el = document.createElement("span");
        el.textContent = s;
        return el.innerHTML;
      }
    })();
    </script>
  `;

  return pageShell({
    title: "気良歌舞伎ストーリー",
    subtitle: "The Kera Kabuki Story",
    bodyHTML,
    brand: "jikabuki",
    activeNav: "jikabuki",
    headExtra: `<style>
      /* ── 言語切替 ── */
      .lang-toggle {
        display: flex;
        gap: 0.3rem;
        margin-bottom: 1.2rem;
        justify-content: flex-end;
      }
      .lang-btn {
        padding: 0.35rem 0.9rem;
        font-size: 0.78rem;
        border: 1px solid var(--border-medium);
        border-radius: 20px;
        background: transparent;
        color: var(--text-tertiary);
        cursor: pointer;
        transition: all 0.2s;
      }
      .lang-btn:hover { border-color: var(--kin); color: var(--kin); }
      .lang-active {
        background: var(--kin) !important;
        color: var(--text-primary) !important;
        border-color: var(--kin) !important;
        font-weight: bold;
      }

      /* ── ヒーロー ── */
      .story-hero {
        text-align: center;
        padding: 1.5rem 1rem 2rem;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 1.5rem;
      }
      .story-hero-title {
        font-size: 1.5rem;
        color: var(--kin);
        letter-spacing: 0.15em;
      }
      .story-hero-sub {
        font-size: 0.88rem;
        color: var(--text-tertiary);
        margin-top: 0.4rem;
        line-height: 1.6;
      }
      .story-hero-quote {
        max-width: 600px;
        margin: 1.2rem auto 0;
        font-size: 0.9rem;
        color: var(--text-tertiary);
        line-height: 1.9;
        font-style: italic;
        border-left: 3px solid var(--aka);
        padding-left: 1rem;
        text-align: left;
      }

      /* ── カードグリッド ── */
      .story-grid {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
      }
      .story-card {
        display: block;
        background: var(--bg-subtle);
        border: 1px solid var(--border-light);
        border-radius: 12px;
        padding: 1.2rem 1.2rem;
        text-decoration: none;
        transition: all 0.25s;
        position: relative;
        overflow: hidden;
      }
      .story-card:hover {
        border-color: var(--kin);
        transform: translateX(4px);
        text-decoration: none;
      }
      .story-card::before {
        content: "";
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 3px;
        background: var(--aka);
        transition: width 0.2s;
      }
      .story-card:hover::before { width: 5px; }
      .story-card-num {
        font-size: 0.72rem;
        font-weight: bold;
        color: var(--aka);
        letter-spacing: 0.1em;
        margin-bottom: 0.3rem;
      }
      .story-card-title {
        font-size: 1rem;
        color: var(--text-primary);
        margin-bottom: 0.3rem;
      }
      .story-card-excerpt {
        font-size: 0.82rem;
        color: var(--text-tertiary);
        line-height: 1.5;
        margin: 0;
      }

      /* ── 記事本文 ── */
      .story-article { max-width: 720px; }
      .story-article-num {
        font-size: 0.78rem;
        font-weight: bold;
        color: var(--aka);
        letter-spacing: 0.1em;
        margin-bottom: 0.4rem;
      }
      .story-article-title {
        font-size: 1.4rem;
        color: var(--kin);
        line-height: 1.4;
        margin-bottom: 0.4rem;
      }
      .story-article-sub {
        font-size: 0.88rem;
        color: var(--text-tertiary);
        margin-bottom: 1.5rem;
        font-style: italic;
      }
      .story-article-body p {
        font-size: 0.94rem;
        color: var(--text-tertiary);
        line-height: 2;
        margin-bottom: 0.8rem;
      }
      .story-accent {
        font-size: 1rem !important;
        color: var(--text-primary) !important;
        font-weight: bold;
        text-align: center;
        margin: 1.2rem 0 !important;
      }
      .story-divider {
        border: none;
        border-top: 1px solid var(--border-light);
        margin: 1.5rem 0;
      }

      /* ── 外部リンク ── */
      .story-ext-links {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border-light);
      }
      .ext-link {
        padding: 0.5rem 1rem;
        font-size: 0.82rem;
        background: var(--bg-subtle);
        border: 1px solid var(--border-medium);
        border-radius: 8px;
        color: var(--kin);
        text-decoration: none;
        transition: all 0.2s;
      }
      .ext-link:hover { border-color: var(--kin); text-decoration: none; }

      /* ── ページャ ── */
      .story-pager {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border-light);
      }
      .pager-prev, .pager-next {
        font-size: 0.84rem;
        color: var(--kin);
        text-decoration: none;
        max-width: 45%;
      }
      .pager-prev:hover, .pager-next:hover { text-decoration: underline; }
      .pager-next { text-align: right; }

      @media (max-width: 600px) {
        .story-hero-title { font-size: 1.2rem; }
        .story-article-title { font-size: 1.15rem; }
        .story-article-body p { font-size: 0.9rem; line-height: 1.9; }
        .story-pager { flex-direction: column; }
      }
    </style>`,
  });
}
