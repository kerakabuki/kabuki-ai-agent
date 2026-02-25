// src/enmoku_page.js
// =========================================================
// 演目ガイドページ — /enmoku, /enmoku/:id
// クライアントサイドルーティング（SPA風）
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";

export function enmokuPageHTML({ googleClientId = "" } = {}) {
  const bodyHTML = `
    <div class="breadcrumb" id="breadcrumb">
      <a href="/">トップ</a><span>›</span><a href="/kabuki/navi">KABUKI NAVI</a><span>›</span><span id="bc-tail">演目ガイド</span>
    </div>
    <div id="app">
      <div class="loading">演目データを読み込み中…</div>
    </div>

    <script>
    (function(){
      var app = document.getElementById("app");
      var bcTail = document.getElementById("bc-tail");
      var catalogCache = null;
      var detailCache = {};
      var videoMap = null;

      // ── ルーティング ──
      function route() {
        var path = location.pathname;
        var m;
        if (path === "/kabuki/navi/enmoku") {
          showCatalog();
        } else if ((m = path.match(/^\\/kabuki\\/navi\\/enmoku\\/(.+)$/))) {
          var id = decodeURIComponent(m[1]);
          showDetail(id);
        }
      }

      // ── 演目一覧 ──
      function showCatalog() {
        bcTail.innerHTML = "演目ガイド";
        if (catalogCache) { renderCatalog(catalogCache); return; }
        app.innerHTML = '<div class="loading">演目データを読み込み中…</div>';
        fetch("/api/enmoku/catalog")
          .then(function(r){ return r.json(); })
          .then(function(data){
            if (Array.isArray(data)) { catalogCache = data; renderCatalog(data); }
            else { app.innerHTML = '<div class="empty-state">演目データがまだ登録されていません。</div>'; }
          })
          .catch(function(){ app.innerHTML = '<div class="empty-state">演目データの読み込みに失敗しました。</div>'; });
      }

      function renderCatalog(catalog) {
        if (catalog.length === 0) {
          app.innerHTML = '<div class="empty-state">演目データがまだ登録されていません。</div>';
          return;
        }
        // グループ分け
        var groups = [];
        var gmap = {};
        catalog.forEach(function(e) {
          if (e.group) {
            if (!(e.group in gmap)) {
              gmap[e.group] = groups.length;
              groups.push({ label: e.group, items: [] });
            }
            groups[gmap[e.group]].items.push(e);
          } else {
            groups.push({ label: null, items: [e] });
          }
        });

        var html = '<h2 class="section-title">演目ガイド <span style="font-size:0.8rem;color:var(--text-tertiary);">全' + catalog.length + '演目</span></h2>';
        groups.forEach(function(g) {
          if (g.label) {
            html += '<div class="enmoku-group fade-up">';
            html += '<h3 class="enmoku-group-title">📁 ' + esc(g.label) + ' <span class="enmoku-group-count">' + g.items.length + '演目</span></h3>';
            g.items.forEach(function(e){ html += enmokuCard(e); });
            html += '</div>';
          } else {
            g.items.forEach(function(e){ html += enmokuCard(e); });
          }
        });
        app.innerHTML = html;
      }

      function enmokuCard(e) {
        return '<a href="/kabuki/navi/enmoku/' + encodeURIComponent(e.id) + '" class="list-item" onclick="return nav(this)">'
          + '<div class="list-item-title">' + esc(e.short) + '</div>'
          + (e.full && e.full !== e.short ? '<div class="list-item-sub">' + esc(e.full) + '</div>' : '')
          + '</a>';
      }

      // ── 動画データ読み込み ──
      function ensureVideos(cb) {
        if (videoMap !== null) { cb(); return; }
        fetch("/api/recommend")
          .then(function(r){ return r.json(); })
          .then(function(d){ videoMap = d && d.videos || {}; cb(); })
          .catch(function(){ videoMap = {}; cb(); });
      }

      // ── 演目詳細 ──
      function showDetail(id) {
        bcTail.innerHTML = '<a href="/kabuki/navi/enmoku" onclick="return nav(this)">\u6F14\u76EE\u30AC\u30A4\u30C9</a><span>\u203A</span><span id="bc-title">\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026</span>';
        if (detailCache[id]) {
          ensureVideos(function(){ renderDetail(id, detailCache[id]); });
          return;
        }
        app.innerHTML = '<div class="loading">\u6F14\u76EE\u30C7\u30FC\u30BF\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026</div>';
        fetch("/api/enmoku/" + encodeURIComponent(id))
          .then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); })
          .then(function(data){ detailCache[id] = data; ensureVideos(function(){ renderDetail(id, data); }); })
          .catch(function(){ app.innerHTML = '<div class="empty-state">\u6F14\u76EE\u30C7\u30FC\u30BF\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002<br><a href="/kabuki/navi/enmoku" onclick="return nav(this)">\u4E00\u89A7\u306B\u623B\u308B</a></div>'; });
      }

      function findVideos(id) {
        if (!videoMap) return [];
        var vids = [];
        if (videoMap[id]) vids.push(videoMap[id]);
        var aliasReverse = { hamamatsuya:"hamamamatsuya", moritunajinya:"moritsuna", adachigaharasandanme:"sodehagi", gionichiriki:"chushingura07", yamashinakankyo:"chushingura09", kirareyosa:"kirare", ashikagayakata:"chushingura03", yamazakikaido:"chushingura05", kanpeiharakiri:"chushingura06" };
        var altKey = aliasReverse[id];
        if (altKey && videoMap[altKey] && vids.length === 0) vids.push(videoMap[altKey]);
        for (var k in videoMap) {
          if (k === id || k === altKey) continue;
          var v = videoMap[k];
          if (v && v.title && v.title.indexOf(id) >= 0) vids.push(v);
        }
        return vids;
      }

      function renderDetail(id, data) {
        var title = data.title || data.title_short || id;
        var titleEl = document.getElementById("bc-title");
        if (titleEl) titleEl.textContent = title;

        var videos = findVideos(id);

        var sections = [
          { key: "synopsis", icon: "\uD83D\uDCD6", label: "\u3042\u3089\u3059\u3058" },
          { key: "highlights", icon: "\uD83C\uDF1F", label: "\u307F\u3069\u3053\u308D" },
          { key: "cast", icon: "\uD83C\uDFAD", label: "\u767B\u5834\u4EBA\u7269" },
          { key: "info", icon: "\uD83D\uDCDD", label: "\u4F5C\u54C1\u60C5\u5831" },
        ];
        if (videos.length > 0) {
          sections.push({ key: "video", icon: "\uD83C\uDFAC", label: "\u52D5\u753B" });
        }

        var html = '<div class="detail-header fade-up">';
        html += '<h2 class="detail-title">' + esc(title) + '</h2>';
        if (data.title && data.title_short && data.title !== data.title_short) {
          html += '<p class="detail-sub">' + esc(data.title) + '</p>';
        }
        html += '</div>';

        // タブバー
        html += '<div class="tab-bar" id="tab-bar">';
        sections.forEach(function(s, i) {
          html += '<button class="tab-item' + (i === 0 ? ' tab-active' : '') + '" data-tab="' + s.key + '">' + s.icon + ' ' + s.label + '</button>';
        });
        html += '</div>';

        // タブコンテンツ
        sections.forEach(function(s, i) {
          html += '<div class="tab-content' + (i === 0 ? ' tab-visible' : '') + '" data-panel="' + s.key + '">';
          if (s.key === "cast") {
            html += renderCast(data);
          } else if (s.key === "info") {
            html += renderInfo(data);
          } else if (s.key === "video") {
            html += renderVideo(videos, title);
          } else {
            var text = data[s.key] || data.sections && data.sections[s.key] || "";
            if (typeof text === "object") text = JSON.stringify(text, null, 2);
            html += '<div class="detail-text">' + formatText(String(text || "\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093")) + '</div>';
          }
          html += '</div>';
        });

        // 執筆者クレジット
        if (data.authors && data.authors.length) {
          html += '<div class="enmoku-authors">';
          html += '<span class="enmoku-authors-label">\u270D\uFE0F \u57F7\u7B46:</span> ';
          html += data.authors.map(function(a) { return esc(a.displayName || '\u533F\u540D'); }).join('\u3001');
          html += '</div>';
        }

        html += '<div style="margin-top:1.5rem;display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">';
        html += '<a href="/kabuki/navi/enmoku" class="btn btn-secondary" onclick="return nav(this)">← 演目一覧に戻る</a>';
        html += '<button class="btn btn-secondary" id="clip-btn" onclick="toggleClipEnmoku(\\'' + id + '\\',\\'' + esc(title).replace(/'/g,"") + '\\')">✅ 理解した！</button>';
        html += '</div>';

        app.innerHTML = html;
        initTabs();
        updateClipBtn("enmoku", id);
        recordRecent("enmoku", id, title);

        /* ハッシュ付きリンクからの遷移: #cast-xxx → 登場人物タブ + スクロール */
        var hash = location.hash;
        if (hash && hash.indexOf("#cast-") === 0) {
          var castBtn = document.querySelector('.tab-item[data-tab="cast"]');
          if (castBtn) castBtn.click();
          setTimeout(function() {
            var target = document.getElementById(hash.slice(1));
            if (target) {
              target.scrollIntoView({ behavior: "smooth", block: "center" });
              target.style.outline = "2px solid var(--kin)";
              target.style.outlineOffset = "4px";
              target.style.borderRadius = "10px";
              setTimeout(function(){ target.style.outline = "none"; }, 3000);
            }
          }, 100);
        }
      }

      function renderCast(data) {
        var cast = data.cast || (data.sections && data.sections.cast) || [];
        if (!Array.isArray(cast) || cast.length === 0) return '<p class="detail-text">登場人物データがありません。</p>';

        var html = '';
        cast.forEach(function(c) {
          var nm = splitNameKana(c.name || "");
          var anchorId = c.id ? 'cast-' + esc(c.id) : '';
          html += '<div class="cast-card"' + (anchorId ? ' id="' + anchorId + '"' : '') + '>';
          html += '<div class="cast-name">' + esc(nm.name) + '</div>';
          if (nm.kana) html += '<div class="cast-kana">' + esc(nm.kana) + '</div>';
          if (c.desc) html += '<div class="cast-desc">' + formatText(c.desc) + '</div>';
          html += '</div>';
        });
        return html;
      }

      function renderInfo(data) {
        var info = data.info || (data.sections && data.sections.info) || "";
        if (typeof info === "string") return '<div class="detail-text">' + formatText(info || "作品情報がありません") + '</div>';
        // object の場合はキー値ペアで表示
        var html = '<dl class="info-list">';
        for (var k in info) {
          html += '<dt class="info-dt">' + esc(k) + '</dt>';
          html += '<dd class="info-dd">' + esc(String(info[k])) + '</dd>';
        }
        html += '</dl>';
        return html;
      }

      function renderVideo(videos, title) {
        var html = '<div class="video-section">';
        html += '<p class="video-intro">\u300C' + esc(title) + '\u300D\u306E\u516C\u6F14\u52D5\u753B\u3092YouTube\u3067\u3054\u89A7\u3044\u305F\u3060\u3051\u307E\u3059\u3002</p>';
        videos.forEach(function(v) {
          var ytId = "";
          if (v.url) {
            var m2 = v.url.match(/youtu\\.be\\/([\\w-]+)/) || v.url.match(/[?&]v=([\\w-]+)/);
            if (m2) ytId = m2[1];
          }
          html += '<div class="video-card">';
          if (ytId) {
            html += '<div class="video-thumb-wrap"><a href="' + esc(v.url) + '" target="_blank" rel="noopener"><img class="video-thumb" src="https://img.youtube.com/vi/' + esc(ytId) + '/mqdefault.jpg" alt="' + esc(v.title || "") + '" loading="lazy"></a></div>';
          }
          html += '<a href="' + esc(v.url) + '" target="_blank" rel="noopener" class="video-link">\u25B6 ' + esc(v.title || "\u52D5\u753B\u3092\u898B\u308B") + '</a>';
          html += '</div>';
        });
        html += '<p class="video-channel"><a href="https://www.youtube.com/@kerakabuki" target="_blank" rel="noopener">\uD83D\uDCFA \u6C17\u826F\u6B4C\u821E\u4F0E YouTube\u30C1\u30E3\u30F3\u30CD\u30EB</a></p>';
        html += '</div>';
        return html;
      }

      function splitNameKana(s) {
        var m = (s || "").match(/^(.*?)[（(](.*)[）)]$/);
        return m ? { name: m[1].trim(), kana: m[2].trim() } : { name: s, kana: "" };
      }

      // ── タブ切替 ──
      function initTabs() {
        var bar = document.getElementById("tab-bar");
        if (!bar) return;
        bar.addEventListener("click", function(e) {
          var btn = e.target.closest(".tab-item");
          if (!btn) return;
          var key = btn.dataset.tab;
          bar.querySelectorAll(".tab-item").forEach(function(b){ b.classList.remove("tab-active"); });
          btn.classList.add("tab-active");
          document.querySelectorAll(".tab-content").forEach(function(p){
            p.classList.toggle("tab-visible", p.dataset.panel === key);
          });
        });
      }

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
      function recordRecent(type, id, title, parent) {
        var log = getLog() || defaultLog();
        if (!log.recent) log.recent = [];
        var alreadySeen = log.recent.some(function(r){ return r.type===type && r.id===id; });
        log.recent = log.recent.filter(function(r){ return !(r.type===type && r.id===id); });
        log.recent.unshift({ type:type, id:id, title:title, parent:parent||undefined, ts:Math.floor(Date.now()/1000) });
        if (log.recent.length > 30) log.recent = log.recent.slice(0,30);
        /* XP加算（初回閲覧のみ） */
        if (!alreadySeen && type === 'enmoku') {
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
        if (type === "enmoku") return (log.clips.enmoku||[]).indexOf(id) >= 0;
        if (type === "person") return (log.clips.person||[]).some(function(p){ return (typeof p==="string"?p:p.id)===id; });
        if (type === "term") return (log.clips.term||[]).indexOf(id) >= 0;
        return false;
      }
      function toggleClip(type, id, meta) {
        var log = getLog() || defaultLog();
        if (!log.clips) log.clips = { enmoku:[], person:[], term:[] };
        var wasClipped = false;
        if (type === "enmoku") {
          if (!log.clips.enmoku) log.clips.enmoku = [];
          var idx = log.clips.enmoku.indexOf(id);
          if (idx >= 0) { log.clips.enmoku.splice(idx,1); wasClipped = true; }
          else log.clips.enmoku.push(id);
        } else if (type === "person") {
          if (!log.clips.person) log.clips.person = [];
          var pi = log.clips.person.findIndex(function(p){ return (typeof p==="string"?p:p.id)===id; });
          if (pi >= 0) { log.clips.person.splice(pi,1); wasClipped = true; }
          else log.clips.person.push({ id:id, parent:meta&&meta.parent||"", title:meta&&meta.title||"" });
        } else if (type === "term") {
          if (!log.clips.term) log.clips.term = [];
          var ti = log.clips.term.indexOf(id);
          if (ti >= 0) { log.clips.term.splice(ti,1); wasClipped = true; }
          else log.clips.term.push(id);
        }
        /* XP加算（保存時のみ、削除時は加算しない） */
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
      window.toggleClipEnmoku = function(id, title) {
        toggleClip("enmoku", id);
        updateClipBtn("enmoku", id);
      };

      // ── SPA ナビゲーション ──
      window.nav = function(el) {
        var href = el.getAttribute("href");
        if (href && href.startsWith("/kabuki/navi/enmoku")) {
          history.pushState(null, "", href);
          route();
          window.scrollTo(0, 0);
          return false;
        }
        return true;
      };
      window.addEventListener("popstate", route);

      // 初期表示
      route();
    })();
    </script>
  `;

  return pageShell({
    title: "演目ガイド",
    subtitle: "あらすじ・みどころ・登場人物",
    bodyHTML,
    activeNav: "navi",
    googleClientId,
    headExtra: `<style>
      .enmoku-group {
        margin-bottom: 1.5rem;
      }
      .enmoku-group-title {
        font-size: 0.95rem;
        color: var(--kin);
        margin-bottom: 0.6rem;
        padding-bottom: 0.4rem;
        border-bottom: 1px solid var(--border-light);
      }
      .enmoku-group-count {
        font-size: 0.75rem;
        color: var(--text-tertiary);
        font-weight: normal;
      }
      .detail-header {
        margin-bottom: 1rem;
      }
      .detail-title {
        font-size: 1.4rem;
        color: var(--kin);
        letter-spacing: 0.1em;
      }
      .detail-sub {
        font-size: 0.85rem;
        color: var(--text-tertiary);
        margin-top: 0.2rem;
      }
      .detail-text {
        font-size: 0.92rem;
        line-height: 1.8;
        color: var(--text-primary);
      }
      .tab-content { display: none; }
      .tab-visible { display: block; animation: fadeUp 0.3s ease; }
      .cast-card {
        background: var(--bg-subtle);
        border: 1px solid var(--border-light);
        border-radius: 10px;
        padding: 0.8rem 1rem;
        margin-bottom: 0.5rem;
      }
      .cast-name {
        font-weight: bold;
        font-size: 0.95rem;
        color: var(--text-primary);
      }
      .cast-kana {
        font-size: 0.78rem;
        color: var(--text-tertiary);
      }
      .cast-desc {
        font-size: 0.85rem;
        color: var(--text-tertiary);
        margin-top: 0.3rem;
        line-height: 1.6;
      }
      .info-list {
        margin: 0;
      }
      .info-dt {
        font-size: 0.8rem;
        color: var(--kin);
        margin-top: 0.8rem;
        font-weight: bold;
      }
      .info-dd {
        font-size: 0.9rem;
        color: var(--text-primary);
        margin-left: 0;
        padding-left: 0.8rem;
        border-left: 2px solid var(--border-light);
      }
      /* ── 動画タブ ── */
      .video-section { }
      .video-intro {
        font-size: 0.9rem;
        color: var(--text-tertiary);
        margin-bottom: 1rem;
        line-height: 1.6;
      }
      .video-card {
        background: var(--bg-subtle);
        border: 1px solid var(--border-light);
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 0.8rem;
        transition: border-color 0.2s;
      }
      .video-card:hover { border-color: var(--kin); }
      .video-thumb-wrap { position: relative; }
      .video-thumb {
        width: 100%;
        display: block;
        aspect-ratio: 16/9;
        object-fit: cover;
      }
      .video-link {
        display: block;
        padding: 0.7rem 1rem;
        color: var(--text-primary);
        font-size: 0.9rem;
        font-weight: bold;
        text-decoration: none;
      }
      .video-link:hover { color: var(--kin); }
      .video-channel {
        margin-top: 1rem;
        text-align: center;
      }
      .video-channel a {
        color: var(--aka);
        font-size: 0.88rem;
        font-weight: bold;
      }
      .enmoku-authors {
        margin-top: 1.2rem;
        padding: 10px 14px;
        font-size: 13px;
        color: var(--text-secondary);
        background: var(--bg-subtle);
        border-radius: var(--radius-sm);
      }
      .enmoku-authors-label {
        font-weight: 600;
        color: var(--text-tertiary);
      }
    </style>`,
  });
}
