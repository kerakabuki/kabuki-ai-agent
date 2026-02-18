// src/live_page.js
// =========================================================
// KABUKI LIVE — /live
// 今を見る：歌舞伎ニュース + 公演スケジュール
// =========================================================
import { pageShell } from "./web_layout.js";

export function livePageHTML() {
  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span>KABUKI LIVE
    </div>

    <section class="live-intro fade-up">
      <p class="live-lead">
        歌舞伎の「今」をチェック。<br>
        最新ニュースと公演スケジュールをまとめてお届け。
      </p>
    </section>

    <!-- ── 歌舞伎ニュース ── -->
    <section class="live-section fade-up-d1" id="news-section">
      <h2 class="section-title">歌舞伎ニュース</h2>
      <div class="live-news-grid">
        <div class="live-news-slot" id="news-kabuki-slot">
          <h3 class="live-news-slot-title">🎭 大歌舞伎</h3>
          <div class="live-news-items" id="news-kabuki-items">
            <div class="loading">読み込み中…</div>
          </div>
        </div>
      </div>
      <div class="live-more">
        <a href="/kabuki/live/news" class="live-news-more">ニュース一覧へ →</a>
      </div>
    </section>

    <!-- ── 公演スケジュール ── -->
    <section class="live-section fade-up-d2" id="perf-section" style="display:none;">
      <h2 class="section-title">公演スケジュール</h2>
      <div class="perf-month-nav" id="perf-month-nav" aria-label="月を選ぶ"></div>
      <div class="perf-theater-grid" id="perf-theater-grid"></div>
      <div class="live-more">
        <a href="https://www.kabuki-bito.jp/theaters/kabukiza" target="_blank" rel="noopener" class="btn btn-secondary">歌舞伎美人で公演情報を見る →</a>
      </div>
    </section>

    <script>
    (function(){
      /* ── ニュース読み込み（タイムアウト＋再試行付き） ── */
      var newsEl = document.getElementById("news-kabuki-items");
      function setNewsError(msg, withRetry) {
        if (!newsEl) return;
        newsEl.innerHTML = '<div class="empty-state">' + (msg || "読み込みに失敗しました") + '</div>';
        if (withRetry) {
          var retryDiv = document.createElement("div");
          retryDiv.style.cssText = "margin-top:10px;text-align:center;";
          var retryBtn = document.createElement("button");
          retryBtn.type = "button";
          retryBtn.textContent = "再試行";
          retryBtn.style.cssText = "font-size:12px;padding:5px 14px;border:1px solid var(--gold);background:transparent;color:var(--gold);border-radius:4px;cursor:pointer;";
          retryBtn.addEventListener("click", loadKabukiNews);
          retryDiv.appendChild(retryBtn);
          newsEl.appendChild(retryDiv);
        }
      }
      var newsController = null;
      function loadKabukiNews() {
        if (newsController) newsController.abort();
        newsController = new AbortController();
        if (newsEl) newsEl.innerHTML = '<div class="loading">読み込み中…</div>';
        var timedOut = false;
        var newsTimeout = setTimeout(function() {
          timedOut = true;
          if (newsController) newsController.abort();
          setNewsError("読み込みがタイムアウトしました。", true);
        }, 8000);
        fetch("/api/news", { signal: newsController.signal })
          .then(function(r) {
            clearTimeout(newsTimeout);
            if (!r.ok) { setNewsError("読み込みに失敗しました（" + r.status + "）", true); return null; }
            return r.json();
          })
          .then(function(data) {
            if (!data) return;
            var articles = data && data.articles || [];
            var kabuki = articles.filter(function(a){ return a.feedKey === "kabuki"; }).slice(0,5);
            // バックグラウンド取得中：30秒後に自動リトライ
            if (!kabuki.length && data.refreshing) {
              if (newsEl) newsEl.innerHTML = '<div class="empty-state">ニュースを取得中です…<br><small style="color:var(--text-tertiary);">30秒後に自動的に更新します</small></div>';
              setTimeout(loadKabukiNews, 30000);
              return;
            }
            function renderItems(items, el) {
              if (!el) return;
              if (!items.length) { el.innerHTML = '<div class="empty-state">ニュースがありません</div>'; return; }
              el.innerHTML = items.map(function(a){
                var d = a.pubTs ? new Date(a.pubTs) : null;
                var ds = d ? (d.getMonth()+1) + "/" + d.getDate() : "";
                return '<a href="' + (a.link || "#") + '" target="_blank" rel="noopener" class="live-news-item">'
                  + '<span class="live-news-date">' + ds + '</span>'
                  + '<span class="live-news-title">' + (a.title||"").replace(/</g,"&lt;") + '</span>'
                  + '</a>';
              }).join("");
            }
            renderItems(kabuki, newsEl);
          })
          .catch(function() {
            clearTimeout(newsTimeout);
            if (!timedOut) setNewsError("読み込みに失敗しました", true);
          });
      }
      loadKabukiNews();

      /* ── 公演スケジュール読み込み（月別ナビ＋NAVI演目解説リンク） ── */
      function parsePeriod(pt) {
        if (!pt) return null;
        var sm = pt.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
        if (!sm) return null;
        var sy = +sm[1], smo = +sm[2], sd = +sm[3];
        var start = new Date(sy, smo - 1, sd);
        var em = pt.match(/～(?:(\d{1,2})月)?(\d{1,2})日/);
        var end;
        if (em) {
          var emo = em[1] ? +em[1] : smo;
          end = new Date(sy, emo - 1, +em[2], 23, 59, 59);
        } else {
          var mm = pt.match(/～(\d{1,2})月/);
          end = mm ? new Date(sy, +mm[1], 0, 23, 59, 59)
                    : new Date(sy, smo, 0, 23, 59, 59);
        }
        return { start: start, end: end };
      }
      function esc(s) { return (s||"").replace(/</g,"&lt;"); }
      function shortPeriod(pt) {
        if (!pt) return "";
        var sm = pt.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
        if (!sm) return pt;
        var smo = sm[2], sd = sm[3];
        var em = pt.match(/～(?:(\d{1,2})月)?(\d{1,2})日/);
        if (em) {
          var emo = em[1] || smo;
          return smo + "/" + sd + "〜" + emo + "/" + em[2];
        }
        return smo + "/" + sd + "〜";
      }
      function collectPlayTitles(p) {
        var titles = [];
        if (p.programs)
          p.programs.forEach(function(prog) {
            if (prog.plays)
              prog.plays.forEach(function(play) {
                if (play.title) titles.push(play.title);
              });
          });
        return titles;
      }

      Promise.all([
        fetch("/api/performances").then(function(r){ return r.json(); }).catch(function(){ return { items: [] }; }),
        fetch("/api/enmoku/catalog").then(function(r){ return r.json(); }).catch(function(){ return []; })
      ]).then(function(results){
        var data = results[0];
        var catalog = Array.isArray(results[1]) ? results[1] : [];
        var items = data && data.items || [];
        var now = new Date();
        var thisMonth = now.getMonth();
        var thisYear = now.getFullYear();
        var months = [0,1,2].map(function(off) {
          var m = thisMonth + off;
          var y = thisYear + Math.floor(m / 12);
          m = m % 12;
          return { year: y, month: m, label: (m + 1) + "月" };
        });
        var rangeStart = new Date(thisYear, thisMonth, 1);
        var rangeEnd = new Date(months[2].year, months[2].month + 1, 0, 23, 59, 59);
        var filtered = items.filter(function(p) {
          var range = parsePeriod(p.period_text);
          if (!range) return false;
          return range.end >= rangeStart && range.start <= rangeEnd;
        });

        document.getElementById("perf-section").style.display = "";
        var gridEl = document.getElementById("perf-theater-grid");
        var navEl = document.getElementById("perf-month-nav");

        if (!items.length && data.refreshing) {
          // バックグラウンドで取得中 → 70秒後にページリロード
          navEl.innerHTML = "";
          gridEl.innerHTML = '<div class="empty-state">公演情報を取得中です…<br>'
            + '<small style="color:var(--text-tertiary);">初回または更新中のため1〜2分かかります。自動的に再読み込みします。</small></div>';
          setTimeout(function() { location.reload(); }, 70000);
          return;
        }
        if (!items.length) {
          navEl.innerHTML = "";
          gridEl.innerHTML = '<div class="empty-state">'
            + '公演情報を取得できませんでした。<br>'
            + '（歌舞伎美人からの自動取得は毎日実行されています。キャッシュが空の可能性があります）<br>'
            + '<p class="perf-fetch-msg" id="perf-fetch-msg"></p>'
            + '<button type="button" class="btn btn-secondary" style="margin-top:12px;" id="perf-fetch-btn">今すぐ取得を試す</button>'
            + '</div>';
          var btn = document.getElementById("perf-fetch-btn");
          var msgEl = document.getElementById("perf-fetch-msg");
          if (btn) btn.addEventListener("click", function() {
            btn.disabled = true;
            if (msgEl) msgEl.textContent = "";
            btn.textContent = "取得中…（30秒〜1分かかることがあります）";
            fetch("/api/performances-fetch")
              .then(function(r) {
                if (r.ok) { location.reload(); return; }
                return r.json().then(function(d) { throw new Error(d.error || "取得に失敗しました"); }, function() { throw new Error("取得に失敗しました"); });
              })
              .catch(function(e) {
                btn.disabled = false;
                btn.textContent = "今すぐ取得を試す";
                if (msgEl) msgEl.innerHTML = "<strong style=\"color:var(--accent-1);\">" + (e.message || "エラーが発生しました") + "。しばらくしてから再度お試しください。</strong>";
              });
          });
          return;
        }
        if (!filtered.length) {
          navEl.innerHTML = "";
          gridEl.innerHTML = '<div class="empty-state">'
            + '表示対象期間（今月〜2ヶ月先）に公演がありません。<br>'
            + '公演データは歌舞伎美人から毎日自動取得しています。<br>'
            + '<p class="perf-fetch-msg" id="perf-fetch-msg"></p>'
            + '<button type="button" class="btn btn-secondary" style="margin-top:12px;" id="perf-fetch-btn">公演情報を今すぐ更新</button>'
            + '</div>';
          var btn = document.getElementById("perf-fetch-btn");
          var msgEl = document.getElementById("perf-fetch-msg");
          if (btn) btn.addEventListener("click", function() {
            btn.disabled = true;
            if (msgEl) msgEl.textContent = "";
            btn.textContent = "更新中…（30秒〜1分かかることがあります）";
            fetch("/api/performances-fetch")
              .then(function(r) {
                if (r.ok) { location.reload(); return; }
                return r.json().then(function(d) { throw new Error(d.error || "更新に失敗しました"); }, function() { throw new Error("更新に失敗しました"); });
              })
              .catch(function(e) {
                btn.disabled = false;
                btn.textContent = "公演情報を今すぐ更新";
                if (msgEl) msgEl.innerHTML = "<strong style=\"color:var(--accent-1);\">" + (e.message || "エラーが発生しました") + "。しばらくしてから再度お試しください。</strong>";
              });
          });
          return;
        }
        function perfMonth(p) {
          var range = parsePeriod(p.period_text);
          if (!range) return -1;
          return range.start.getMonth();
        }
        var theaterOrder = [];
        var byTheater = {};
        filtered.forEach(function(p) {
          if (!byTheater[p.theater]) { byTheater[p.theater] = []; theaterOrder.push(p.theater); }
          byTheater[p.theater].push(p);
        });
        var titleToId = {};
        catalog.forEach(function(e) {
          if (e.id) {
            if (e.short) titleToId[e.short] = e.id;
            if (e.full && e.full !== e.short) titleToId[e.full] = e.id;
          }
        });
        function findEnmokuId(p) {
          var titles = collectPlayTitles(p);
          for (var i = 0; i < titles.length; i++) {
            var id = titleToId[titles[i]];
            if (id) return id;
          }
          return null;
        }
        var selectedMonthIdx = 0;
        for (var mi = 0; mi < months.length; mi++) {
          var hasAny = theaterOrder.some(function(theater) {
            return byTheater[theater].some(function(p) { return perfMonth(p) === months[mi].month; });
          });
          if (hasAny) { selectedMonthIdx = mi; break; }
        }
        function renderPerf(p) {
          var isNow = false;
          var range = parsePeriod(p.period_text);
          if (range) isNow = now >= range.start && now <= range.end;
          var ticket = "";
          if (p.status) {
            if (p.status.indexOf("好評販売中") >= 0) ticket = "販売中";
            else if (p.status.indexOf("発売予定") >= 0) {
              var dm = p.status.match(/(\d{1,2})月(\d{1,2})日/);
              ticket = dm ? dm[1] + "/" + dm[2] + " 発売" : p.status;
            } else ticket = p.status;
          }
          var sp = shortPeriod(p.period_text);
          var playsHTML = "";
          if (p.programs && p.programs.length > 0) {
            playsHTML = '<div class="perf-cell-programs">';
            for (var pi = 0; pi < p.programs.length; pi++) {
              var prog = p.programs[pi];
              if (prog.program) {
                playsHTML += '<div class="perf-prog-label">' + esc(prog.program) + '</div>';
              }
              if (prog.plays && prog.plays.length > 0) {
                for (var pj = 0; pj < prog.plays.length; pj++) {
                  var play = prog.plays[pj];
                  playsHTML += '<div class="perf-play-title">' + esc(play.title);
                  if (play.scenes) {
                    playsHTML += '<span class="perf-play-scene"> ' + esc(play.scenes) + '</span>';
                  }
                  playsHTML += '</div>';
                }
              }
            }
            playsHTML += '</div>';
          }
          var enmokuId = findEnmokuId(p);
          var enmokuLink = enmokuId
            ? '<a href="/kabuki/navi/enmoku/' + encodeURIComponent(enmokuId) + '" class="perf-enmoku-link">📖 この演目の解説を読む →</a>'
            : '';
          return '<div class="perf-cell-item">'
            + '<a href="' + p.url + '" target="_blank" rel="noopener" class="perf-cell-main">'
            + (isNow ? '<span class="perf-now-badge">上演中</span>' : '')
            + '<span class="perf-cell-title">' + esc(p.title) + '</span>'
            + '<span class="perf-cell-period">' + esc(sp) + '</span>'
            + playsHTML
            + (ticket ? '<span class="perf-cell-ticket">🎫 ' + esc(ticket) + '</span>' : '')
            + '</a>'
            + (enmokuLink ? '<div class="perf-cell-enmoku">' + enmokuLink + '</div>' : '')
            + '</div>';
        }
        function renderGrid() {
          var mo = months[selectedMonthIdx];
          var grid = document.getElementById("perf-theater-grid");
          grid.innerHTML = theaterOrder.map(function(theater) {
            var perfs = byTheater[theater].filter(function(p) { return perfMonth(p) === mo.month; });
            if (!perfs.length) return '';
            return '<div class="perf-slot">'
              + '<div class="perf-theater-label">' + esc(theater) + '</div>'
              + '<div class="perf-month-cards">' + perfs.map(renderPerf).join("") + '</div>'
              + '</div>';
          }).filter(Boolean).join("");
        }
        function renderMonthNav() {
          var nav = document.getElementById("perf-month-nav");
          nav.innerHTML = '<div class="perf-month-nav-inner">'
            + (selectedMonthIdx > 0 ? '<button type="button" class="perf-month-nav-btn" aria-label="前の月" data-dir="-1">←</button>' : '<span class="perf-month-nav-placeholder"></span>')
            + '<span class="perf-month-nav-current">' + months[selectedMonthIdx].label + '</span>'
            + (selectedMonthIdx < months.length - 1 ? '<button type="button" class="perf-month-nav-btn" aria-label="次の月" data-dir="1">→</button>' : '<span class="perf-month-nav-placeholder"></span>')
            + '</div>';
          nav.querySelectorAll(".perf-month-nav-btn").forEach(function(btn) {
            btn.addEventListener("click", function() {
              var dir = parseInt(btn.getAttribute("data-dir"), 10);
              selectedMonthIdx = Math.max(0, Math.min(months.length - 1, selectedMonthIdx + dir));
              renderMonthNav();
              renderGrid();
            });
          });
        }
        renderMonthNav();
        renderGrid();
      }).catch(function(){
        document.getElementById("perf-section").style.display = "";
        document.getElementById("perf-month-nav").innerHTML = "";
        document.getElementById("perf-theater-grid").innerHTML = '<div class="empty-state">公演情報の読み込みに失敗しました。</div>';
      });
    })();
    </script>
  `;

  return pageShell({
    title: "KABUKI LIVE",
    subtitle: "歌舞伎瓦版",
    bodyHTML,
    activeNav: "live",
    headExtra: `<style>
      .live-intro {
        text-align: center;
        padding: 24px 16px 32px;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 24px;
      }
      .live-lead {
        font-size: 14px;
        line-height: 2;
        color: var(--text-secondary);
        letter-spacing: 0.08em;
      }
      .live-section { margin-bottom: 2rem; }
      .live-more { text-align: center; margin-top: 1rem; }
      .live-news-more {
        font-size: 14px;
        color: var(--gold);
        text-decoration: none;
      }
      .live-news-more:hover { text-decoration: underline; }

      /* ── ニュースグリッド ── */
      .live-news-grid {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .live-news-slot {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        padding: 16px 20px;
        box-shadow: var(--shadow-sm);
      }
      .live-news-slot-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 14px;
        font-weight: 600;
        color: var(--gold-dark);
        margin-bottom: 10px;
        letter-spacing: 1px;
      }
      .live-news-item {
        display: flex;
        align-items: baseline;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid var(--bg-subtle);
        text-decoration: none;
        color: var(--text-primary);
        font-size: 13px;
        transition: color 0.15s;
      }
      .live-news-item:last-child { border-bottom: none; }
      .live-news-item:hover { color: var(--gold-dark); text-decoration: none; }
      .live-news-date {
        flex-shrink: 0;
        font-size: 12px;
        color: var(--text-tertiary);
        min-width: 3em;
      }
      .live-news-title {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* ── 公演スケジュール ── */
      .perf-month-nav {
        margin-bottom: 12px;
      }
      .perf-month-nav-inner {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
      }
      .perf-month-nav-btn {
        padding: 8px 12px;
        font-size: 16px;
        color: var(--gold-dark);
        background: var(--bg-subtle);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.15s;
      }
      .perf-month-nav-btn:hover {
        background: var(--gold-soft);
        border-color: var(--gold);
      }
      .perf-month-nav-current {
        font-family: 'Noto Serif JP', serif;
        font-size: 15px;
        font-weight: 600;
        color: var(--text-primary);
        min-width: 3em;
        text-align: center;
      }
      .perf-month-nav-placeholder {
        display: inline-block;
        width: 36px;
      }
      .perf-theater-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .perf-slot {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        padding: 14px;
        overflow: hidden;
        box-shadow: var(--shadow-sm);
      }
      .perf-slot .perf-theater-label {
        font-family: 'Noto Serif JP', serif;
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        letter-spacing: 1px;
        margin-bottom: 10px;
      }
      .perf-month-cards {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .perf-cell-item {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 0;
        background: transparent;
        border: none;
      }
      .perf-cell-main {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 8px 10px;
        background: var(--bg-subtle);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-sm);
        text-decoration: none;
        color: var(--text-primary);
        transition: all 0.15s;
      }
      .perf-cell-main:hover {
        border-color: var(--gold);
        box-shadow: var(--shadow-md);
        text-decoration: none;
        color: var(--text-primary);
      }
      .perf-cell-enmoku {
        padding-left: 4px;
      }
      .perf-enmoku-link {
        font-size: 12px;
        color: var(--gold);
        text-decoration: none;
      }
      .perf-enmoku-link:hover { text-decoration: underline; }
      .perf-cell-main .perf-cell-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 13px;
        font-weight: 600;
        line-height: 1.3;
      }
      .perf-cell-period {
        font-size: 11px;
        color: var(--text-tertiary);
      }
      .perf-cell-programs {
        margin-top: 4px;
        padding-top: 4px;
        border-top: 1px dashed var(--border-light);
      }
      .perf-prog-label {
        font-size: 10px;
        font-weight: 600;
        color: var(--gold-dark);
        margin-top: 3px;
        letter-spacing: 0.5px;
      }
      .perf-play-title {
        font-size: 11px;
        color: var(--text-secondary);
        line-height: 1.4;
        padding-left: 6px;
      }
      .perf-play-scene {
        font-size: 10px;
        color: var(--text-tertiary);
      }
      .perf-cell-ticket {
        font-size: 11px;
        color: var(--accent-3);
      }
      .perf-now-badge {
        display: inline-block;
        font-size: 10px;
        background: var(--accent-1);
        color: #fff;
        padding: 1px 6px;
        border-radius: 4px;
        letter-spacing: 0.05em;
        width: fit-content;
        margin-bottom: 2px;
      }
      @media (max-width: 600px) {
        .perf-month-nav-btn { padding: 6px 10px; font-size: 14px; }
        .perf-month-nav-current { font-size: 14px; }
      }
    </style>`
  });
}
