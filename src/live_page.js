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
      <div class="live-more live-more-row">
        <a href="/kabuki/live/news" class="live-news-more">ニュース一覧へ →</a>
        <span class="live-news-updated" id="news-updated"></span>
      </div>
    </section>

    <!-- ── 公演スケジュール ── -->
    <section class="live-section fade-up-d2" id="perf-section">
      <h2 class="section-title">公演スケジュール</h2>
      <div class="perf-theater-grid" id="perf-theater-grid"><div class="loading">読み込み中…</div></div>
      <div class="live-more">
        <a href="https://www.kabuki-bito.jp/theaters/kabukiza" target="_blank" rel="noopener" class="btn btn-secondary">歌舞伎美人で公演情報を見る →</a>
      </div>
    </section>

    <script>
    /* ── ニュース読み込み ── */
    (function(){
      var newsEl = document.getElementById("news-kabuki-items");
      fetch("/api/news")
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (!newsEl) return;
          var articles = (data && data.articles) || [];
          var kabuki = articles.filter(function(a) { return a.feedKey === "kabuki"; }).slice(0, 5);
          if (!kabuki.length) {
            newsEl.innerHTML = '<div class="empty-state">ニュースがありません<\/div>';
            return;
          }
          newsEl.innerHTML = kabuki.map(function(a) {
            var d = a.pubTs ? new Date(a.pubTs) : null;
            var ds = d ? (d.getMonth() + 1) + "/" + d.getDate() : "";
            return '<a href="' + (a.link || "#") + '" target="_blank" rel="noopener" class="live-news-item">'
              + '<span class="live-news-date">' + ds + '<\/span>'
              + '<span class="live-news-title">' + (a.title || "").replace(/</g, "&lt;") + '<\/span>'
              + '<\/a>';
          }).join("");
          var updEl = document.getElementById("news-updated");
          if (updEl && data.updatedAt) {
            var ud = new Date(data.updatedAt);
            updEl.textContent = "更新: " + (ud.getMonth()+1) + "/" + ud.getDate() + " " + ud.getHours() + ":" + ("0"+ud.getMinutes()).slice(-2);
          }
        })
        .catch(function() {
          if (newsEl) newsEl.innerHTML = '<div class="empty-state">読み込みに失敗しました<\/div>';
        });
    })();
    </script>

    <script>
    /* ── 公演スケジュール読み込み（月別ナビ＋NAVI演目解説リンク） ── */
    (function(){
      /* 日付解析: 日本語不使用・数字のみポジショナル抽出 */
      /* "2026年2月1日（日）～26日（木）" → nums=[2026,2,1,26] */
      function parsePeriod(pt) {
        if (!pt) return null;
        var nums = [], m, re = /\d+/g;
        while ((m = re.exec(pt)) !== null) nums.push(+m[0]);
        if (nums.length < 3) return null;
        var sy = nums[0], smo = nums[1], sd = nums[2];
        if (sy < 2020 || sy > 2040 || smo < 1 || smo > 12 || sd < 1 || sd > 31) return null;
        var start = new Date(sy, smo - 1, sd);
        var end;
        if (nums.length === 3) {
          end = new Date(sy, smo, 0, 23, 59, 59);
        } else if (nums[3] > 2020) {
          var ey = nums[3], emo = nums[4] || smo, ed = nums[5] || 28;
          end = new Date(ey, emo - 1, ed, 23, 59, 59);
        } else if (nums.length === 4) {
          end = new Date(sy, smo - 1, nums[3], 23, 59, 59);
        } else {
          var n3 = nums[3], n4 = nums[4];
          if (n3 >= 1 && n3 <= 12 && n4 >= 1 && n4 <= 31) {
            end = new Date(sy, n3 - 1, n4, 23, 59, 59);
          } else {
            end = new Date(sy, smo - 1, n3, 23, 59, 59);
          }
        }
        return { start: start, end: end };
      }
      function esc(s) { return (s||"").replace(/</g,"&lt;"); }
      function shortPeriod(pt) {
        if (!pt) return "";
        var nums = [], m, re = /\d+/g;
        while ((m = re.exec(pt)) !== null) nums.push(+m[0]);
        if (nums.length < 3) return pt;
        var smo = nums[1], sd = nums[2];
        if (nums.length === 3) return smo + "/" + sd + "~";
        if (nums[3] > 2020) return smo + "/" + sd + "~" + nums[4] + "/" + nums[5];
        if (nums.length === 4) return smo + "/" + sd + "~" + smo + "/" + nums[3];
        return smo + "/" + sd + "~" + nums[3] + "/" + nums[4];
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

      /* ── 公演表示 ── */
      var now = new Date();
      var rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
      var rangeEnd = new Date(now.getFullYear(), now.getMonth() + 3, 0, 23, 59, 59);

      function renderPerf(p) {
        var range = parsePeriod(p.period_text);
        var isNow = range && now >= range.start && now <= range.end;
        var ticket = "";
        if (p.status) {
          if (p.status.indexOf("好評販売中") >= 0) ticket = "販売中";
          else if (p.status.indexOf("発売予定") >= 0) {
            var nums2 = (p.status.match(/\d+/g) || []);
            ticket = nums2.length >= 2 ? nums2[nums2.length-2] + "/" + nums2[nums2.length-1] + " 発売" : p.status;
          } else ticket = p.status;
        }
        var sp = shortPeriod(p.period_text);
        var playsHTML = "";
        if (p.programs && p.programs.length > 0) {
          playsHTML = '<div class="perf-cell-programs">';
          for (var pi = 0; pi < p.programs.length; pi++) {
            var prog = p.programs[pi];
            if (prog.program) playsHTML += '<div class="perf-prog-label">' + esc(prog.program) + '</div>';
            if (prog.plays) {
              for (var pj = 0; pj < prog.plays.length; pj++) {
                var play = prog.plays[pj];
                playsHTML += '<div class="perf-play-title">' + esc(play.title);
                if (play.scenes) playsHTML += '<span class="perf-play-scene"> ' + esc(play.scenes) + '</span>';
                playsHTML += '</div>';
              }
            }
          }
          playsHTML += '</div>';
        }
        return '<div class="perf-cell-item">'
          + '<a href="' + p.url + '" target="_blank" rel="noopener" class="perf-cell-main">'
          + (isNow ? '<span class="perf-now-badge">上演中</span>' : '')
          + '<span class="perf-cell-title">' + esc(p.title) + '</span>'
          + '<span class="perf-cell-period">' + esc(sp) + '</span>'
          + playsHTML
          + (ticket ? '<span class="perf-cell-ticket">🎫 ' + esc(ticket) + '</span>' : '')
          + '</a></div>';
      }

      fetch("/api/performances")
        .then(function(r) { return r.json(); })
        .then(function(data) {
          var items = (data && data.items) || [];
          var gridEl = document.getElementById("perf-theater-grid");
          var navEl = document.getElementById("perf-month-nav");
          if (!gridEl) return;
          if (navEl) navEl.innerHTML = "";

          if (!items.length && data.refreshing) {
            gridEl.innerHTML = '<div class="empty-state">公演情報を取得中です…<br>'
              + '<small style="color:var(--text-tertiary);">初回または更新中のため1〜2分かかります。自動的に再読み込みします。</small><\/div>';
            setTimeout(function() { location.reload(); }, 70000);
            return;
          }
          if (!items.length) {
            gridEl.innerHTML = '<div class="empty-state">'
              + '公演情報を取得できませんでした。<br>'
              + '（歌舞伎美人からの自動取得は毎日実行されています）<br>'
              + '<button type="button" class="btn btn-secondary" style="margin-top:12px;" id="perf-fetch-btn">今すぐ取得を試す</button>'
              + '<\/div>';
            var btn = document.getElementById("perf-fetch-btn");
            if (btn) btn.addEventListener("click", function() {
              btn.disabled = true; btn.textContent = "取得中…";
              fetch("/api/performances-fetch")
                .then(function(r) { if (r.ok) location.reload(); else { btn.disabled=false; btn.textContent="今すぐ取得を試す"; }})
                .catch(function() { btn.disabled=false; btn.textContent="今すぐ取得を試す"; });
            });
            return;
          }

          /* 今月〜2ヶ月先でフィルタ */
          var filtered = items.filter(function(p) {
            var range = parsePeriod(p.period_text);
            if (!range) return true; /* parsePeriod失敗は表示する */
            return range.end >= rangeStart && range.start <= rangeEnd;
          });

          /* 劇場別に整理してHTML生成 */
          var theaters = [], byT = {};
          filtered.forEach(function(p) {
            var t = p.theater || "その他";
            if (!byT[t]) { byT[t] = []; theaters.push(t); }
            byT[t].push(p);
          });

          if (!theaters.length) {
            gridEl.innerHTML = '<div class="empty-state">表示対象期間に公演がありません。<\/div>';
            return;
          }

          gridEl.innerHTML = theaters.map(function(t) {
            return '<div class="perf-slot">'
              + '<div class="perf-theater-label">' + esc(t) + '</div>'
              + '<div class="perf-month-cards">' + byT[t].map(renderPerf).join("") + '</div>'
              + '</div>';
          }).join("");
        })
        .catch(function() {
          var gridEl = document.getElementById("perf-theater-grid");
          var navEl = document.getElementById("perf-month-nav");
          if (navEl) navEl.innerHTML = "";
          if (gridEl) gridEl.innerHTML = '<div class="empty-state">公演情報の読み込みに失敗しました。<\/div>';
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
      .live-more-row { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; }
      .live-news-updated { font-size: 11px; color: var(--text-tertiary); white-space: nowrap; }
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
