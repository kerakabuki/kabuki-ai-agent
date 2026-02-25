// src/glossary_page.js
// =========================================================
// 用語辞典ページ — /glossary
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";

export function glossaryPageHTML({ googleClientId = "" } = {}) {
  const bodyHTML = `
    <div class="breadcrumb" id="breadcrumb">
      <a href="/">トップ</a><span>›</span><a href="/kabuki/navi">KABUKI NAVI</a><span>›</span><span id="bc-tail">用語辞典</span>
    </div>

    <div class="search-bar">
      <input type="text" id="search-input" placeholder="🔍 用語を検索…" autocomplete="off">
    </div>

    <div id="app">
      <div class="loading">用語データを読み込み中…</div>
    </div>

    <script>
    (function(){
      var app = document.getElementById("app");
      var bcTail = document.getElementById("bc-tail");
      var searchInput = document.getElementById("search-input");
      var allTerms = null;

      var CAT_ORDER = [
        { key: "演技・演出", icon: "🎭" },
        { key: "役柄", icon: "🎎" },
        { key: "舞台", icon: "🏯" },
        { key: "音・裏方", icon: "🎵" },
        { key: "家の芸", icon: "📜" },
        { key: "ジャンル", icon: "📚" },
        { key: "鑑賞", icon: "🎫" },
        { key: "衣装・小道具", icon: "👘" }
      ];

      // ── データ読み込み ──
      fetch("/api/glossary")
        .then(function(r){ return r.json(); })
        .then(function(data){
          if (Array.isArray(data)) { allTerms = data; }
          else if (data && Array.isArray(data.terms)) { allTerms = data.terms; }
          else { allTerms = []; }
          route();
        })
        .catch(function(){
          app.innerHTML = '<div class="empty-state">用語データの読み込みに失敗しました。</div>';
        });

      // ── ルーティング ──
      function route() {
        if (!allTerms) return;
        var path = location.pathname;
        var m;
        if (path === "/kabuki/navi/glossary") {
          showCategories();
        } else if ((m = path.match(/^\\/kabuki\\/navi\\/glossary\\/term\\/(.+)$/))) {
          showTerm(decodeURIComponent(m[1]));
        } else if ((m = path.match(/^\\/kabuki\\/navi\\/glossary\\/(.+)$/))) {
          showCategory(decodeURIComponent(m[1]));
        }
      }

      // ── カテゴリ一覧 ──
      function showCategories() {
        bcTail.innerHTML = "歌舞伎用語いろは";
        searchInput.style.display = "block";
        var catCounts = {};
        allTerms.forEach(function(t){ catCounts[t.category] = (catCounts[t.category] || 0) + 1; });

        var html = '<h2 class="section-title">用語辞典 <span style="font-size:0.8rem;color:var(--text-tertiary);">全' + allTerms.length + '語</span></h2>';
        html += '<div class="card-grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr));">';
        CAT_ORDER.forEach(function(c, i) {
          if (!catCounts[c.key]) return;
          html += '<a href="/kabuki/navi/glossary/' + encodeURIComponent(c.key) + '" class="card fade-up-d' + i + '" onclick="return nav(this)" style="text-align:center;padding:1.2rem;">';
          html += '<div style="font-size:2rem;margin-bottom:0.3rem;">' + c.icon + '</div>';
          html += '<h3 style="font-size:0.95rem;">' + esc(c.key) + '</h3>';
          html += '<p class="card-desc">' + catCounts[c.key] + '語</p>';
          html += '</a>';
        });
        html += '</div>';
        app.innerHTML = html;
      }

      // ── カテゴリ内一覧 ──
      function showCategory(cat) {
        searchInput.style.display = "block";
        var catObj = CAT_ORDER.find(function(c){ return c.key === cat; }) || { icon: "📖" };
        bcTail.innerHTML = '<a href="/kabuki/navi/glossary" onclick="return nav(this)">用語辞典</a><span>›</span>' + esc(cat);
        var terms = allTerms.filter(function(t){ return t.category === cat; });
        terms.sort(function(a,b){ return (a.term || "").localeCompare(b.term || "", "ja"); });

        var html = '<h2 class="section-title">' + catObj.icon + ' ' + esc(cat) + ' <span style="font-size:0.8rem;color:var(--text-tertiary);">' + terms.length + '語</span></h2>';
        terms.forEach(function(t, i) {
          html += '<a href="/kabuki/navi/glossary/term/' + encodeURIComponent(t.term) + '" class="list-item fade-up" style="animation-delay:' + (i*0.03) + 's" onclick="return nav(this)">';
          html += '<div class="list-item-title">' + esc(t.term) + '</div>';
          if (t.reading) html += '<div class="list-item-sub">' + esc(t.reading) + '</div>';
          html += '</a>';
        });
        html += '<div style="margin-top:1rem;"><a href="/kabuki/navi/glossary" class="btn btn-secondary" onclick="return nav(this)">← カテゴリ一覧へ</a></div>';
        app.innerHTML = html;
      }

      // ── 用語詳細 ──
      function showTerm(termName) {
        searchInput.style.display = "none";
        var term = allTerms.find(function(t){ return t.term === termName; });
        if (!term) {
          app.innerHTML = '<div class="empty-state">用語が見つかりませんでした。<br><a href="/kabuki/navi/glossary" onclick="return nav(this)">一覧に戻る</a></div>';
          return;
        }
        var catObj = CAT_ORDER.find(function(c){ return c.key === term.category; }) || { icon: "📖" };
        bcTail.innerHTML = '<a href="/kabuki/navi/glossary" onclick="return nav(this)">用語辞典</a><span>›</span>'
          + '<a href="/kabuki/navi/glossary/' + encodeURIComponent(term.category) + '" onclick="return nav(this)">' + esc(term.category) + '</a>'
          + '<span>›</span>' + esc(term.term);

        var html = '<div class="term-detail fade-up">';
        html += '<div class="term-header">';
        html += '<h2 class="term-name">' + esc(term.term) + '</h2>';
        if (term.reading) html += '<p class="term-reading">' + esc(term.reading) + '</p>';
        html += '<p class="term-cat">' + catObj.icon + ' ' + esc(term.category) + '</p>';
        html += '</div>';
        html += '<hr style="border:none;border-top:1px solid #333;margin:1rem 0;">';
        html += '<div class="term-desc">' + formatText(term.desc || term.description || "説明がありません") + '</div>';
        html += '</div>';
        html += '<div style="margin-top:1.5rem;display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">';
        html += '<a href="/kabuki/navi/glossary/' + encodeURIComponent(term.category) + '" class="btn btn-secondary" onclick="return nav(this)">← ' + esc(term.category) + 'に戻る</a>';
        html += '<a href="/kabuki/navi/glossary" class="btn btn-secondary" onclick="return nav(this)">カテゴリ一覧</a>';
        html += '<button class="btn btn-secondary" id="clip-btn" onclick="toggleClipTerm(\\'' + esc(term.term).replace(/'/g,"") + '\\')">✅ 理解した！</button>';
        html += '</div>';
        app.innerHTML = html;
        updateClipBtn("term", term.term);
        recordRecent("term", term.term, term.term);
      }

      // ── 検索 ──
      var searchTimer;
      searchInput.addEventListener("input", function() {
        clearTimeout(searchTimer);
        var q = searchInput.value.trim().toLowerCase();
        if (!q) { route(); return; }
        searchTimer = setTimeout(function(){
          if (!allTerms) return;
          var results = allTerms.filter(function(t){
            return (t.term || "").toLowerCase().indexOf(q) >= 0
              || (t.reading || "").toLowerCase().indexOf(q) >= 0
              || (t.desc || t.description || "").toLowerCase().indexOf(q) >= 0;
          });
          bcTail.innerHTML = '<a href="/kabuki/navi/glossary" onclick="return nav(this)">用語辞典</a><span>›</span>検索: ' + esc(q);
          if (results.length === 0) {
            app.innerHTML = '<div class="empty-state">「' + esc(q) + '」に一致する用語はありませんでした。</div>';
            return;
          }
          var html = '<h2 class="section-title">検索結果 <span style="font-size:0.8rem;color:#888;">' + results.length + '件</span></h2>';
          results.forEach(function(t, i) {
            html += '<a href="/kabuki/navi/glossary/term/' + encodeURIComponent(t.term) + '" class="list-item" onclick="return nav(this)">';
            html += '<div class="list-item-title">' + esc(t.term) + '</div>';
            html += '<div class="list-item-sub">' + esc(t.category) + (t.reading ? ' · ' + esc(t.reading) : '') + '</div>';
            html += '</a>';
          });
          app.innerHTML = html;
        }, 200);
      });

      // ── ヘルパー ──
      function esc(s) {
        if (!s) return "";
        var el = document.createElement("span");
        el.textContent = s;
        return el.innerHTML;
      }
      function formatText(s) {
        return esc(s).replace(/\\n/g, "<br>");
      }

      // ── マイページ連携（localStorage） ──
      var LOG_KEY = "keranosuke_log_v1";
      function getLog() {
        try { var r = localStorage.getItem(LOG_KEY); return r ? JSON.parse(r) : null; } catch(e){ return null; }
      }
      function defaultLog() {
        return { v:1, updated_at:0, recent:[], clips:{ enmoku:[], person:[], term:[] }, practice:{ serifu:{ last_ts:0, progress:0 } } };
      }
      function putLog(log) {
        log.updated_at = Math.floor(Date.now()/1000);
        try { localStorage.setItem(LOG_KEY, JSON.stringify(log)); } catch(e){}
      }
      function recordRecent(type, id, title) {
        var log = getLog() || defaultLog();
        if (!log.recent) log.recent = [];
        var alreadySeen = log.recent.some(function(r){ return r.type===type && r.id===id; });
        log.recent = log.recent.filter(function(r){ return !(r.type===type && r.id===id); });
        log.recent.unshift({ type:type, id:id, title:title, ts:Math.floor(Date.now()/1000) });
        if (log.recent.length > 30) log.recent = log.recent.slice(0,30);
        /* XP加算（初回閲覧のみ） */
        if (!alreadySeen) {
          if (typeof log.xp !== 'number') log.xp = 0;
          log.xp += 1;
          var today = new Date();
          var todayKey = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
          if (!log.daily_log) log.daily_log = {};
          if (!log.daily_log[todayKey]) log.daily_log[todayKey] = { views:0, clips:0, quiz:0, keiko:0, theater:0 };
          log.daily_log[todayKey].views++;
        }
        putLog(log);
      }
      function isClipped(type, id) {
        var log = getLog();
        if (!log || !log.clips) return false;
        if (type === "term") return (log.clips.term||[]).indexOf(id) >= 0;
        return false;
      }
      function toggleClip(type, id) {
        var log = getLog() || defaultLog();
        if (!log.clips) log.clips = { enmoku:[], person:[], term:[] };
        var wasClipped = false;
        if (type === "term") {
          if (!log.clips.term) log.clips.term = [];
          var idx = log.clips.term.indexOf(id);
          if (idx >= 0) { log.clips.term.splice(idx,1); wasClipped = true; }
          else log.clips.term.push(id);
        }
        /* XP加算（保存時のみ） */
        if (!wasClipped) {
          if (typeof log.xp !== 'number') log.xp = 0;
          log.xp += 2;
          var today = new Date();
          var todayKey = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
          if (!log.daily_log) log.daily_log = {};
          if (!log.daily_log[todayKey]) log.daily_log[todayKey] = { views:0, clips:0, quiz:0, keiko:0, theater:0 };
          log.daily_log[todayKey].clips++;
        }
        putLog(log);
        return isClipped(type, id);
      }
      function updateClipBtn(type, id) {
        var btn = document.getElementById("clip-btn");
        if (!btn) return;
        btn.textContent = isClipped(type, id) ? "✅ 理解した！" : "☐ 理解した！";
        btn.style.borderColor = isClipped(type, id) ? "var(--kin)" : "";
      }
      window.toggleClipTerm = function(term) {
        toggleClip("term", term);
        updateClipBtn("term", term);
      };

      // ── SPA ナビゲーション ──
      window.nav = function(el) {
        var href = el.getAttribute("href");
        if (href && href.startsWith("/kabuki/navi/glossary")) {
          history.pushState(null, "", href);
          searchInput.value = "";
          route();
          window.scrollTo(0, 0);
          return false;
        }
        return true;
      };
      window.addEventListener("popstate", function(){ searchInput.value = ""; route(); });
    })();
    </script>
  `;

  return pageShell({
    title: "歌舞伎用語いろは",
    subtitle: "126の用語をカテゴリ別に解説",
    bodyHTML,
    activeNav: "navi",
    googleClientId,
    headExtra: `<style>
      .search-bar {
        margin-bottom: 1rem;
      }
      .search-bar input {
        width: 100%;
        padding: 0.7rem 1rem;
        border-radius: 10px;
        border: 1px solid #444;
        background: var(--surface);
        color: var(--shiro);
        font-size: 0.9rem;
        font-family: inherit;
        outline: none;
        transition: border-color 0.2s;
      }
      .search-bar input:focus {
        border-color: var(--kin);
      }
      .search-bar input::placeholder {
        color: #666;
      }
      .term-detail {
        background: var(--surface);
        border: 1px solid #333;
        border-radius: 14px;
        padding: 1.5rem;
      }
      .term-name {
        font-size: 1.4rem;
        color: var(--kin);
      }
      .term-reading {
        font-size: 0.85rem;
        color: #888;
        margin-top: 0.2rem;
      }
      .term-cat {
        font-size: 0.8rem;
        color: #666;
        margin-top: 0.3rem;
      }
      .term-desc {
        font-size: 0.92rem;
        line-height: 1.8;
        color: var(--shiro);
      }
    </style>`,
  });
}
