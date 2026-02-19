// src/live_page.js
// =========================================================
// KABUKI LIVE — /live
// 今を見る：歌舞伎ニュース + 公演スケジュール
// =========================================================
import { pageShell } from "./web_layout.js";
import { loadEnmokuCatalog } from "./flex_enmoku.js";

export async function livePageHTML(env) {
  /* enmoku タイトルをサーバー側で取得して HTML に埋め込む（クライアントフェッチ不要） */
  let enmokuTitlesJson = "[]";
  try {
    const catalog = env ? await loadEnmokuCatalog(env) : [];
    const titles = (catalog || []).map(e => ({ id: e.id, short: e.short || "", full: e.full || "" }));
    enmokuTitlesJson = JSON.stringify(titles).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
  } catch (_) { /* フォールバック: マッチなしで表示 */ }
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
      <div class="section-title-row">
        <h2 class="section-title">歌舞伎ニュース</h2>
        <span class="section-updated" id="news-updated"></span>
      </div>
      <div class="live-news-grid">
        <div class="live-news-slot" id="news-kabuki-slot">
          <div class="live-news-items" id="news-kabuki-items">
            <div class="loading">読み込み中…</div>
          </div>
        </div>
      </div>
      <div id="oshi-news-block"></div>
      <div class="live-more">
        <a href="/kabuki/live/news" class="live-news-more">ニュース一覧へ →</a>
      </div>
    </section>

    <!-- ── 公演スケジュール ── -->
    <section class="live-section fade-up-d2" id="perf-section">
      <div class="section-title-row">
        <h2 class="section-title">公演スケジュール</h2>
        <span class="section-updated" id="perf-updated"></span>
      </div>
      <div class="perf-month-tabs" id="perf-month-tabs"></div>
      <div class="perf-oshi-row" id="perf-oshi-row" style="display:none">
        <label class="oshi-toggle-switch"><input type="checkbox" id="oshi-toggle-cb"><span class="oshi-toggle-track"><span class="oshi-toggle-knob"></span></span></label>
        <span class="oshi-toggle-text">\u2b50 推し俳優の出演のみ</span>
      </div>
      <div class="perf-theater-grid" id="perf-theater-grid"><div class="loading">読み込み中…</div></div>
      <div class="live-more">
        <a href="https://www.kabuki-bito.jp/theaters/kabukiza" target="_blank" rel="noopener" class="live-ext-link">歌舞伎美人で詳しく見る →</a>
      </div>
    </section>

    <script>
    /* ── ニュース読み込み ── */
    (function(){
      var newsEl = document.getElementById("news-kabuki-items");
      function escH(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
      function loadNews() {
        if (newsEl) newsEl.innerHTML = '<div class="loading">\u8aad\u307f\u8fbc\u307f\u4e2d\u2026<\/div>';
        fetch("/api/news")
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (!newsEl) return;
            var articles = (data && data.articles) || [];
            var kabuki = articles.filter(function(a) { return a.feedKey === "kabuki"; }).slice(0, 5);
            if (!kabuki.length) {
              newsEl.innerHTML = '<div class="empty-state">\u30cb\u30e5\u30fc\u30b9\u304c\u3042\u308a\u307e\u305b\u3093<\/div>';
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
              updEl.textContent = "\u66f4\u65b0: " + (ud.getMonth()+1) + "/" + ud.getDate() + " " + ud.getHours() + ":" + ("0"+ud.getMinutes()).slice(-2);
            }
          })
          .catch(function() {
            if (newsEl) newsEl.innerHTML = '<div class="empty-state">\u8aad\u307f\u8fbc\u307f\u306b\u5931\u6557\u3057\u307e\u3057\u305f'
              + '<br><button type="button" class="btn btn-secondary" style="margin-top:8px;font-size:12px;" onclick="loadNews()">\u518d\u8aad\u307f\u8fbc\u307f<\/button><\/div>';
          });
      }
      window.loadNews = loadNews;
      loadNews();
    })();

    /* ── 推しニュース（俳優名で直接ニュース検索 → 歌舞伎ニュースの下に表示） ── */
    function loadOshiNews(favs) {
      var oshiBlock = document.getElementById("oshi-news-block");
      if (!oshiBlock || !favs || !favs.length) return;
      function escH(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
      function normName(n) { return n.replace(/\\s/g,"").replace(/[\uff08\u0028][^\uff09\u0029]*[\uff09\u0029]/g,""); }
      var names = favs.map(normName).filter(Boolean);
      if (!names.length) return;
      oshiBlock.innerHTML = '<div class="oshi-news-header">\u2b50 \u3054\u8d14\u5c53\u30cb\u30e5\u30fc\u30b9'
        + '<span class="oshi-news-header-sub">\u3054\u8d14\u5c53\u5f79\u8005\u306e\u6700\u65b0\u60c5\u5831\u3092\u304a\u5c4a\u3051\u3057\u307e\u3059\u3002'
        + '<a href="/kabuki/reco">\u3054\u8d14\u5c53\u306e\u767b\u9332\u30fb\u5909\u66f4\u306f\u3053\u3061\u3089 \u2192<\/a><\/span><\/div>'
        + '<div class="loading" style="font-size:12px;padding:4px 0;">\u8aad\u307f\u8fbc\u307f\u4e2d\u2026<\/div>';
      fetch("/api/oshi-news?actors=" + encodeURIComponent(names.join(",")))
        .then(function(r){ return r.json(); })
        .then(function(data) {
          var results = (data && data.results) || [];
          var rows = results.filter(function(r){ return r.article; });
          if (!rows.length) {
            oshiBlock.innerHTML = '<p class="oshi-news-empty">\u2b50 \u3054\u8d14\u5c53\u306e\u6700\u65b0\u30cb\u30e5\u30fc\u30b9\u306f\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3067\u3057\u305f\u3002<\/p>';
            return;
          }
          var nh = '<div class="oshi-news-header">\u2b50 \u3054\u8d14\u5c53\u30cb\u30e5\u30fc\u30b9'
            + '<span class="oshi-news-header-sub">\u3054\u8d14\u5c53\u5f79\u8005\u306e\u6700\u65b0\u60c5\u5831\u3092\u304a\u5c4a\u3051\u3057\u307e\u3059\u3002'
            + '<a href="/kabuki/reco">\u3054\u8d14\u5c53\u306e\u767b\u9332\u30fb\u5909\u66f4\u306f\u3053\u3061\u3089 \u2192<\/a><\/span><\/div>';
          for (var i = 0; i < rows.length; i++) {
            var r = rows[i];
            var pub = r.article.pubTs ? (function(ts){
              var d = new Date(ts);
              return (d.getMonth()+1) + "/" + d.getDate();
            })(r.article.pubTs) : "";
            nh += '<a href="' + escH(r.article.link || "#") + '" target="_blank" rel="noopener" class="oshi-news-row">'
              + '<span class="oshi-news-actor">' + escH(normName(r.actor)) + '<\/span>'
              + '<span class="oshi-news-title">' + escH(r.article.title || "") + '<\/span>'
              + (pub ? '<span class="oshi-news-date">' + escH(pub) + '<\/span>' : '')
              + '<\/a>';
          }
          oshiBlock.innerHTML = nh;
        })
        .catch(function(){ oshiBlock.innerHTML = '<p class="oshi-news-empty">\u30cb\u30e5\u30fc\u30b9\u306e\u8aad\u307f\u8fbc\u307f\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002<\/p>'; });
    }
    /* localStorage に既に推しがあれば即座にロード */
    (function(){
      try {
        var raw = localStorage.getItem("favorite_actors_v1");
        var favs = raw ? JSON.parse(raw) : [];
        if (Array.isArray(favs) && favs.length) loadOshiNews(favs);
      } catch(e){}
    })();
    </script>

    <script>
    /* ── 公演スケジュール読み込み（月別ナビ＋NAVI演目解説リンク） ── */
    (function(){
      function parsePeriod(pt) {
        if (!pt) return null;
        var nums = [], m, re = /\\d+/g;
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
        var nums = [], m, re = /\\d+/g;
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

      /* 推し俳優セット（非同期で後から設定）*/
      var favoriteActors = new Set();
      function normActor(s) { return (s||"").replace(/\\s/g,""); }
      function getOshiInPerf(p) {
        var found = [];
        var progs = p.programs || [];
        for (var i = 0; i < progs.length; i++) {
          var plays = progs[i].plays || [];
          for (var j = 0; j < plays.length; j++) {
            var cast = plays[j].cast || [];
            for (var k = 0; k < cast.length; k++) {
              var name = cast[k].actor || "";
              if (favoriteActors.has(normActor(name)) && found.indexOf(name) < 0) found.push(name);
            }
          }
        }
        return found;
      }
      /* 推しトグル共有ステート */
      var oshiAuthState = "loading";
      var oshiFilterOn = false;
      var serverUD = null;
      var FAV_KEY = "favorite_actors_v1";
      function loadLocalFavs() {
        try { var r = localStorage.getItem(FAV_KEY); return r ? JSON.parse(r) : []; } catch(e) { return []; }
      }
      function saveLocalFavs(list) { try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch(e) {} }

      /* NAVI 演目照合マップ: サーバー埋め込みデータから構築 */
      var enmokuMap = {};
      (function() {
        var list = ${enmokuTitlesJson};
        function n2(s) { return (s||"").replace(/[\\s\\u3000（）()【】「」『』〈〉・]/g,""); }
        list.forEach(function(e) {
          if (e.short) enmokuMap[n2(e.short)] = e.id;
          if (e.full && e.full !== e.short) enmokuMap[n2(e.full)] = e.id;
        });
      })();
      function getMonthKey(p) {
        if (p.month_key) return p.month_key;
        var range = parsePeriod(p.period_text);
        if (range) return range.start.getFullYear() * 100 + (range.start.getMonth() + 1);
        return null;
      }
      function renderPerf(p) {
        var startD = p.start_date ? new Date(p.start_date) : null;
        var endD   = p.end_date   ? new Date(p.end_date)   : null;
        var range  = !startD ? parsePeriod(p.period_text) : null;
        var isNow  = startD
          ? (endD ? (now >= startD && now <= endD) : now >= startD)
          : (range && now >= range.start && now <= range.end);

        var sp = "";
        if (startD) {
          var sm = startD.getMonth()+1, sd = startD.getDate();
          if (endD) {
            var em = endD.getMonth()+1, ed = endD.getDate();
            sp = sm === em
              ? sm + "\u6708" + sd + "\u65e5\u301c" + ed + "\u65e5"
              : sm + "\u6708" + sd + "\u65e5\u301c" + em + "\u6708" + ed + "\u65e5";
          } else {
            sp = sm + "\u6708" + sd + "\u65e5\u301c";
          }
        } else {
          sp = shortPeriod(p.period_text) || (p.period_text || "");
        }

        var ticket = "";
        if (p.status) {
          if (p.status.indexOf("\u597d\u8a55\u8ca9\u58f2\u4e2d") >= 0) ticket = "\u8ca9\u58f2\u4e2d";
          else if (p.status.indexOf("\u767a\u58f2\u4e88\u5b9a") >= 0) {
            var sn = (p.status.match(/\\d+/g) || []);
            ticket = sn.length >= 2 ? sn[sn.length-2] + "/" + sn[sn.length-1] + " \u767a\u58f2" : p.status;
          } else ticket = p.status;
        }

        /* 演目リスト（右カラム用）＋ NAVI 照合 */
        var playsHTML = "";
        var naviLinks = [];
        function findEnmokuId(title) {
          var n = n2(title);
          if (enmokuMap[n]) return enmokuMap[n];
          var keys = Object.keys(enmokuMap);
          for (var ki = 0; ki < keys.length; ki++) {
            if (keys[ki].length >= 3 && n.indexOf(keys[ki]) >= 0) return enmokuMap[keys[ki]];
          }
          return null;
        }
        /* NAVI リンクは全演目から収集 */
        var totalPlayCount = 0;
        if (p.programs && p.programs.length > 0) {
          for (var ai = 0; ai < p.programs.length; ai++) {
            if (p.programs[ai].plays) p.programs[ai].plays.forEach(function(play) {
              totalPlayCount++;
              var eid = findEnmokuId(play.title);
              if (eid) naviLinks.push({ title: play.title, id: eid });
            });
          }
        }
        /* 表示は MAX_PLAYS 件まで、残りは「他○演目」 */
        var shownPlayCount = 0, MAX_PLAYS = 3;
        if (p.programs && p.programs.length > 0) {
          for (var pi = 0; pi < p.programs.length; pi++) {
            var prog = p.programs[pi];
            if (shownPlayCount >= MAX_PLAYS) break;
            if (prog.program) playsHTML += '<div class="perf-prog-label">' + esc(prog.program) + '<\/div>';
            if (prog.plays) for (var pj = 0; pj < prog.plays.length; pj++) {
              if (shownPlayCount >= MAX_PLAYS) break;
              playsHTML += '<div class="perf-play-title">' + esc(prog.plays[pj].title) + '<\/div>';
              shownPlayCount++;
            }
          }
          if (totalPlayCount > MAX_PLAYS) {
            playsHTML += '<div class="perf-play-more">\u4ed6' + (totalPlayCount - MAX_PLAYS) + '\u6f14\u76ee<\/div>';
          }
        }

        var naviHTML = "";
        if (naviLinks.length > 0) {
          naviHTML = '<div class="perf-navi-row">';
          for (var ni = 0; ni < naviLinks.length; ni++) {
            naviHTML += '<a href="/kabuki/navi/enmoku/' + encodeURIComponent(naviLinks[ni].id) + '" class="perf-navi-link">'
              + '\uD83D\uDCD6 \u300c' + esc(naviLinks[ni].title) + '\u300d\u306e\u89e3\u8aac\u3092\u8aad\u3080 \u2192<\/a>';
          }
          naviHTML += '<\/div>';
        }

        /* 推し出演チェック */
        var oshiActors = getOshiInPerf(p);
        var oshiHTML = oshiActors.length
          ? '<span class="perf-oshi-badge">\u2b50 ' + esc(oshiActors.map(function(n){ return n.replace(/\\s/g,""); }).join("\u30fb")) + ' \u51fa\u6f14<\/span>'
          : '';

        var hasPlays = playsHTML !== "";
        return '<div class="perf-cell-item">'
          + '<a href="' + p.url + '" target="_blank" rel="noopener" class="perf-cell-main' + (hasPlays ? ' has-plays' : '') + '">'
          + '<div class="perf-cell-left">'
          + (isNow ? '<span class="perf-now-badge">\u4e0a\u6f14\u4e2d<\/span>' : '')
          + '<span class="perf-cell-title">' + esc(p.title) + '<\/span>'
          + '<span class="perf-cell-period">' + esc(sp) + '<\/span>'
          + (ticket ? '<span class="perf-cell-ticket">\uD83C\uDF9F\uFE0F ' + esc(ticket) + '<\/span>' : '')
          + oshiHTML
          + '<\/div>'
          + (hasPlays ? '<div class="perf-cell-right">' + playsHTML + '<\/div>' : '')
          + '<\/a>'
          + naviHTML
          + '<\/div>';
      }
      function renderGrid(perfs) {
        var gridEl = document.getElementById("perf-theater-grid");
        if (!gridEl) return;
        var theaters = [], byT = {};
        perfs.forEach(function(p) {
          var t = p.theater || "その他";
          if (!byT[t]) { byT[t] = []; theaters.push(t); }
          byT[t].push(p);
        });
        if (!theaters.length) {
          gridEl.innerHTML = '<div class="empty-state">この月の公演はありません。<\/div>';
          return;
        }
        try {
          gridEl.innerHTML = theaters.map(function(t) {
            return '<div class="perf-slot">'
              + '<div class="perf-theater-label">' + esc(t) + '<\/div>'
              + '<div class="perf-month-cards">' + byT[t].map(renderPerf).join("") + '<\/div>'
              + '<\/div>';
          }).join("");
        } catch(e) {
          gridEl.innerHTML = '<div class="empty-state">\u516c\u6f14\u60c5\u5831\u306e\u8868\u793a\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002<\/div>';
        }
      }

      fetch("/api/performances")
        .then(function(r){ return r.json(); })
        .then(function(data) {
          var items = (data && data.items) || [];
          var gridEl = document.getElementById("perf-theater-grid");
          var tabsEl = document.getElementById("perf-month-tabs");
          if (!gridEl) return;

          if (!items.length && data.refreshing) {
            gridEl.innerHTML = '<div class="empty-state">公演情報を取得中です…<br>'
              + '<small style="color:var(--text-tertiary);">初回または更新中のため1〜2分かかります。自動的に再読み込みします。<\/small><\/div>';
            setTimeout(function() { location.reload(); }, 70000);
            return;
          }
          if (!items.length) {
            gridEl.innerHTML = '<div class="empty-state">'
              + '公演情報を取得できませんでした。<br>'
              + '（歌舞伎美人からの自動取得は毎日実行されています）<br>'
              + '<button type="button" class="btn btn-secondary" style="margin-top:12px;" id="perf-fetch-btn">今すぐ取得を試す<\/button>'
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

          var perfUpd = document.getElementById("perf-updated");
          if (perfUpd && data.fetched_at) {
            var ud = new Date(data.fetched_at);
            perfUpd.textContent = "\u66f4\u65b0: " + (ud.getMonth()+1) + "/" + ud.getDate();
          }

          var curKey = now.getFullYear() * 100 + (now.getMonth() + 1);
          var maxM = now.getMonth() + 2;
          var maxY = now.getFullYear() + Math.floor(maxM / 12);
          var maxKey = maxY * 100 + (maxM % 12 + 1);

          var keys = [], byMon = {};
          items.forEach(function(p) {
            var k = getMonthKey(p);
            if (k === null || k < curKey || k > maxKey) return;
            if (!byMon[k]) { byMon[k] = []; keys.push(k); }
            byMon[k].push(p);
          });
          keys.sort(function(a, b) { return a - b; });

          if (!keys.length) {
            gridEl.innerHTML = '<div class="empty-state">公演がありません。<\/div>';
            return;
          }

          var selKey = keys.indexOf(curKey) >= 0 ? curKey : (keys[0] || 0);

          /* ── 推しトグル ── */
          var toggleWired = false;
          function showOshiToggle() {
            if (toggleWired) return;
            var tr = document.getElementById("perf-oshi-row");
            var cb = document.getElementById("oshi-toggle-cb");
            if (!tr || !cb) return;
            tr.style.display = "";
            cb.addEventListener("change", function() {
              oshiFilterOn = cb.checked;
              renderTabGrid();
            });
            toggleWired = true;
          }

          function renderTabGrid() {
            var perfs = byMon[selKey] || [];
            if (oshiFilterOn) {
              perfs = perfs.filter(function(p) { return getOshiInPerf(p).length > 0; });
              if (!perfs.length) {
                var g = document.getElementById("perf-theater-grid");
                if (g) g.innerHTML = '<div class="empty-state">\u3053\u306e\u6708\u306b\u3054\u8d14\u5c53\u5f79\u8005\u306e\u51fa\u6f14\u516c\u6f14\u306f\u3042\u308a\u307e\u305b\u3093\u3002<\/div>';
                return;
              }
            }
            renderGrid(perfs);
          }

          function renderTabs() {
            if (!tabsEl) return;
            tabsEl.innerHTML = keys.map(function(k) {
              var mo = k % 100;
              return '<button type="button" class="perf-tab-btn' + (selKey === k ? ' active' : '') + '" data-k="' + k + '">' + mo + '\u6708<\/button>';
            }).join("");
            tabsEl.querySelectorAll(".perf-tab-btn").forEach(function(b) {
              b.addEventListener("click", function() {
                selKey = +b.getAttribute("data-k");
                renderTabs();
                renderTabGrid();
              });
            });
          }

          renderTabs();
          renderTabGrid();

          /* localStorage に推しがあれば即トグル表示 */
          var localFavs = loadLocalFavs();
          if (localFavs.length) {
            localFavs.forEach(function(n) { favoriteActors.add(normActor(n)); });
            showOshiToggle();
          }

          /* 認証 + 推し俳優を非同期取得 */
          fetch("/api/auth/me", { credentials: "same-origin" })
            .then(function(r){ return r.json(); })
            .then(function(auth) {
              if (!auth.loggedIn) {
                oshiAuthState = "loggedout";
                return;
              }
              return fetch("/api/userdata", { credentials: "same-origin" })
                .then(function(r){ return r.json(); })
                .then(function(ud) {
                  serverUD = ud;
                  oshiAuthState = "ready";
                  var favs = (ud && ud.favorite_actors) || [];
                  var local = loadLocalFavs();
                  favs.forEach(function(n) { if (local.indexOf(n) < 0) local.push(n); });
                  saveLocalFavs(local);
                  local.forEach(function(n) { favoriteActors.add(normActor(n)); });
                  if (local.length) {
                    loadOshiNews(local);
                    showOshiToggle();
                  }
                  renderTabGrid();
                });
            })
            .catch(function(){});
        })
        .catch(function() {
          var gridEl = document.getElementById("perf-theater-grid");
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
    googleClientId: env?.GOOGLE_CLIENT_ID || "",
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
      .section-title-row { display: flex; align-items: baseline; gap: 10px; margin-bottom: 4px; }
      .section-title-row .section-title { margin-bottom: 0; }
      .section-updated { font-size: 11px; color: var(--text-tertiary); white-space: nowrap; }
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
      .perf-month-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 8px;
      }
      .perf-tab-btn {
        padding: 6px 18px;
        font-size: 14px;
        font-family: 'Noto Serif JP', serif;
        color: var(--text-secondary);
        background: var(--bg-subtle);
        border: 1px solid var(--border-light);
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .perf-tab-btn:hover {
        background: var(--gold-soft);
        border-color: var(--gold);
        color: var(--gold-dark);
      }
      .perf-tab-btn.active {
        background: var(--gold);
        border-color: var(--gold);
        color: #fff;
        font-weight: 600;
      }
      /* ── 推しトグル ── */
      .perf-oshi-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
      }
      .oshi-toggle-switch {
        position: relative;
        display: inline-block;
        width: 40px;
        height: 22px;
        cursor: pointer;
        flex-shrink: 0;
      }
      .oshi-toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
      .oshi-toggle-track {
        position: absolute; inset: 0;
        background: var(--border-light);
        border-radius: 11px;
        transition: background 0.2s;
      }
      .oshi-toggle-knob {
        position: absolute;
        width: 18px; height: 18px;
        left: 2px; top: 2px;
        background: #fff;
        border-radius: 50%;
        transition: transform 0.2s;
        box-shadow: 0 1px 3px rgba(0,0,0,0.15);
      }
      .oshi-toggle-switch input:checked + .oshi-toggle-track { background: var(--gold); }
      .oshi-toggle-switch input:checked + .oshi-toggle-track .oshi-toggle-knob { transform: translateX(18px); }
      .oshi-toggle-text { font-size: 13px; color: var(--text-secondary); }

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
        background: var(--bg-subtle);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-sm);
        overflow: hidden;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .perf-cell-item:hover {
        border-color: var(--gold);
        box-shadow: var(--shadow-md);
      }
      .perf-cell-main {
        display: flex;
        flex-direction: row;
        gap: 0;
        padding: 8px 10px;
        text-decoration: none;
        color: var(--text-primary);
        transition: background 0.15s;
        align-items: stretch;
      }
      .perf-cell-main:hover {
        background: rgba(0,0,0,0.02);
        text-decoration: none;
        color: var(--text-primary);
      }
      .perf-cell-left {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 0 0 auto;
        min-width: 0;
      }
      .perf-cell-main.has-plays .perf-cell-left {
        width: 52%;
        padding-right: 10px;
      }
      .perf-cell-right {
        flex: 1;
        min-width: 0;
        border-left: 1px dashed var(--border-light);
        padding-left: 10px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 3px;
      }
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
      .perf-prog-label {
        font-size: 10px;
        font-weight: 600;
        color: var(--gold-dark);
        letter-spacing: 0.5px;
        margin-top: 2px;
      }
      .perf-play-title {
        font-size: 12px;
        color: var(--text-secondary);
        line-height: 1.4;
      }
      .perf-play-more {
        font-size: 11px;
        color: var(--text-tertiary);
        margin-top: 2px;
      }
      .perf-cell-ticket {
        font-size: 11px;
        color: var(--accent-3);
        margin-top: 2px;
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

      /* ── 推しニュース ── */
      .oshi-news-header {
        font-family: 'Noto Serif JP', serif;
        font-size: 14px; font-weight: 600;
        color: var(--gold-dark);
        margin: 16px 0 6px; padding-top: 10px;
        border-top: 1px solid rgba(0,0,0,.08);
      }
      .oshi-news-header-sub {
        font-weight: 400; font-size: 12px;
        color: var(--text-secondary);
        margin-left: 8px;
      }
      .oshi-news-header-sub a {
        color: var(--gold-dark); text-decoration: none;
      }
      .oshi-news-header-sub a:hover { text-decoration: underline; }
      .oshi-news-row {
        display: flex; align-items: baseline; gap: 6px;
        text-decoration: none; color: inherit;
        padding: 7px 0; border-bottom: 1px solid rgba(0,0,0,.06);
        font-size: 13px; line-height: 1.5;
      }
      .oshi-news-row:last-child { border-bottom: none; }
      .oshi-news-row:hover .oshi-news-title { text-decoration: underline; }
      .oshi-news-actor {
        flex-shrink: 0; font-size: 11px; font-weight: 600;
        color: var(--gold-dark);
        background: rgba(180,130,60,.1); border-radius: 4px;
        padding: 1px 5px;
      }
      .oshi-news-title {
        flex: 1; color: var(--text-primary);
        display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
      }
      .oshi-news-date {
        flex-shrink: 0; font-size: 11px; color: var(--text-tertiary);
      }
      .oshi-news-empty {
        font-size: 13px; color: var(--text-tertiary);
        padding: 10px 0; margin: 0;
      }

      /* ── 推し出演バッジ ── */
      .perf-oshi-badge {
        display: inline-block;
        font-size: 11px;
        color: var(--gold-dark);
        background: var(--gold-soft, #fdf8ec);
        border: 1px solid var(--gold-soft, #e8d5a0);
        border-radius: 4px;
        padding: 1px 6px;
        margin-top: 4px;
        width: fit-content;
        line-height: 1.6;
      }

      /* ── NAVI 解説リンク ── */
      .perf-navi-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 4px 10px 6px;
        border-top: 1px dashed var(--border-light);
      }
      .perf-navi-link {
        display: inline-flex;
        align-items: center;
        font-size: 11px;
        color: var(--gold-dark);
        text-decoration: none;
        gap: 2px;
        padding: 2px 8px;
        border: 1px solid var(--gold-soft, #e8d5a0);
        border-radius: 20px;
        background: var(--gold-soft, #fdf8ec);
        transition: all 0.15s;
      }
      .perf-navi-link:hover {
        background: var(--gold);
        color: #fff;
        border-color: var(--gold);
      }
      /* ── 外部リンク ── */
      .live-ext-link {
        font-size: 13px;
        color: var(--text-tertiary);
        text-decoration: none;
      }
      .live-ext-link:hover { color: var(--gold-dark); text-decoration: underline; }
      @media (max-width: 600px) {
        .perf-tab-btn { padding: 5px 14px; font-size: 13px; }
      }
    </style>`
  });
}
