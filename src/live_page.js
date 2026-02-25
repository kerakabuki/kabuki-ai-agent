// src/live_page.js
// =========================================================
// KABUKI LIVE — /live
// 今を見る：歌舞伎ニュース + 公演スケジュール
// =========================================================
import { pageShell } from "./web_layout.js";
import { loadEnmokuCatalog } from "./flex_enmoku.js";
import { pickFeatured, saveMissedToKV } from "./featured_enmoku.js";
import { getPerformancesCached } from "./kabuki_bito.js";

/* ── 注目演目ブロック HTML 生成 ── */
function buildFeaturedHTML(featured) {
  if (!featured) return "";
  const { thisMonth, nextMonth, showNextMonth } = featured;
  if (!thisMonth && !nextMonth) return "";

  function card(item, labelPrefix, icon) {
    if (!item) return "";
    const naviLink = item.naviId
      ? `<a href="/kabuki/navi/enmoku/${encodeURIComponent(item.naviId)}" class="featured-navi-link">演目ガイドを見る →</a>`
      : `<span class="featured-no-navi">ガイド準備中</span>`;
    const cdText = item.countdown != null
      ? `<span class="featured-countdown">${icon} ${item.countdownLabel}あと<strong>${item.countdown}</strong>日</span>`
      : "";
    const theaters = item.theaters.length
      ? `<span class="featured-theaters">${item.theaters.join("・")}</span>`
      : "";
    return `<div class="featured-card">
      <div class="featured-label">${labelPrefix}</div>
      <div class="featured-title">${escHtml(item.title)}</div>
      ${cdText}
      ${theaters}
      <div class="featured-actions">${naviLink}</div>
    </div>`;
  }

  let html = '<section class="live-section fade-up" id="featured-section">';
  html += '<h2 class="section-title">🎯 注目の演目</h2>';
  html += '<div class="featured-grid">';
  html += card(thisMonth, "今月の注目", "⏳");
  if (showNextMonth && nextMonth) {
    html += card(nextMonth, "来月の注目", "⏳");
  }
  html += '</div></section>';
  return html;
}

function escHtml(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function livePageHTML(env) {
  /* enmoku タイトルをサーバー側で取得して HTML に埋め込む（クライアントフェッチ不要） */
  let enmokuTitlesJson = "[]";
  let featuredHTML = "";
  try {
    const catalog = env ? await loadEnmokuCatalog(env) : [];
    const titles = (catalog || []).map(e => ({ id: e.id, short: e.short || "", full: e.full || "" }));
    enmokuTitlesJson = JSON.stringify(titles).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");

    // 注目演目を計算
    if (env) {
      try {
        const perfData = await getPerformancesCached(env);
        const items = (perfData.items || []).map(p => {
          if (!p.period_text) return p;
          const ms = p.period_text.match(/(\d{4})年(\d{1,2})月(?:(\d{1,2})日)?/);
          if (!ms) return p;
          const y = +ms[1], mo = +ms[2], d = ms[3] ? +ms[3] : 1;
          const extra = { month_key: y * 100 + mo, start_date: `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}` };
          const endPart = p.period_text.split(/[〜～]/).slice(1).join('');
          if (endPart) {
            const ef = endPart.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
            const em = endPart.match(/(\d{1,2})月(\d{1,2})日/);
            const ed = endPart.match(/^[^\d]*(\d{1,2})日/);
            if (ef) extra.end_date = `${ef[1]}-${String(+ef[2]).padStart(2,'0')}-${String(+ef[3]).padStart(2,'0')}`;
            else if (em) extra.end_date = `${y}-${String(+em[1]).padStart(2,'0')}-${String(+em[2]).padStart(2,'0')}`;
            else if (ed) extra.end_date = `${y}-${String(mo).padStart(2,'0')}-${String(+ed[1]).padStart(2,'0')}`;
          }
          return { ...p, ...extra };
        });
        const featured = await pickFeatured(items, env);
        featuredHTML = buildFeaturedHTML(featured);

        // LABO用: missed をKVに保存（非同期・失敗しても無視）
        if (featured.missed.length) {
          const jst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
          const nextKey = jst.getMonth() === 11
            ? (jst.getFullYear() + 1) * 100 + 1
            : jst.getFullYear() * 100 + (jst.getMonth() + 2);
          saveMissedToKV(env, featured.missed, nextKey).catch(() => {});
        }
      } catch (e) {
        console.error("featured_enmoku error:", String(e?.stack || e));
      }
    }
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

    ${featuredHTML}

    <!-- ── 推し俳優ニュース ── -->
    <section class="live-section fade-up" id="oshi-section">
      <div class="section-title-row">
        <h2 class="section-title">⭐ 推し俳優ニュース<span class="oshi-count-badge" id="oshi-count-badge"></span></h2>
        <button class="oshi-manage-btn" id="oshi-manage-btn" onclick="LiveOshi.openPanel()">推しを管理</button>
      </div>
      <div id="oshi-section-body"><div class="loading" style="font-size:13px;">読み込み中…</div></div>
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

    </script>

    <script>
    /* ================================================================
       LiveOshi — 推し俳優ニュース＆登録管理モジュール
       RECO と同一の localStorage キー (favorite_actors_v1) を使用
       ================================================================ */
    (function() {
      var FAV_KEY  = "favorite_actors_v1";
      var MAX_FAV  = 5;
      var actorCache = null;
      var authChecked = false, isLoggedIn = false;

      function esc(s) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
      function normName(n) { return n.replace(/\s/g,"").replace(/[\uff08(][^\uff09)]*[\uff09)]/g,""); }

      /* ── データ ── */
      function loadFavs() {
        try { var r = localStorage.getItem(FAV_KEY); return r ? JSON.parse(r) : []; } catch(e) { return []; }
      }
      function saveFavs(list) {
        try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch(e) {}
        syncServer();
      }
      function syncServer() {
        if (!authChecked || !isLoggedIn) return;
        fetch('/api/userdata', {
          method: 'PUT', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ favorite_actors: loadFavs() })
        }).catch(function(){});
      }
      function loadActors(cb) {
        if (actorCache) { cb(actorCache); return; }
        fetch('/api/actors').then(function(r){ return r.json(); })
          .then(function(d){ actorCache = d; cb(d); })
          .catch(function(){ cb(null); });
      }
      function findMeikan(meikan, name) {
        if (!meikan) return null;
        var n = name.replace(/\s+/g,'');
        for (var i = 0; i < meikan.length; i++) {
          if ((meikan[i].name_kanji||'').replace(/\s+/g,'') === n) return meikan[i];
        }
        return null;
      }

      /* ── 人気俳優リスト（RECO と同一） ── */
      var POPULAR = [
        "\u5341\u4e09\u4ee3\u76ee\u5e02\u5ddd\u5718\u5341\u90ce","\u7247\u5ca1\u4ec1\u5de6\u885b\u9580",
        "\u5742\u6771\u7389\u4e09\u90ce","\u4e2d\u6751\u52d8\u4e5d\u90ce","\u4e2d\u6751\u4e03\u4e4b\u52a9",
        "\u5c3e\u4e0a\u83ca\u4e4b\u52a9","\u677e\u672c\u5e78\u56db\u90ce","\u677e\u672c\u767d\u9e1a",
        "\u4e2d\u6751\u829d\u7feb","\u5c3e\u4e0a\u677e\u4e5f","\u5c3e\u4e0a\u83ca\u4e94\u90ce",
        "\u7247\u5ca1\u611b\u4e4b\u52a9","\u4e2d\u6751\u6885\u7389","\u5e02\u5ddd\u67d3\u4e94\u90ce",
        "\u5c3e\u4e0a\u53f3\u8fd1","\u5742\u6771\u5df3\u4e4b\u52a9"
      ];

      /* ================================================================
         セクション描画
         ================================================================ */
      function renderSection() {
        var body = document.getElementById("oshi-section-body");
        if (!body) return;
        var favs = loadFavs();
        var manageBtn = document.getElementById("oshi-manage-btn");
        if (manageBtn) manageBtn.style.display = favs.length ? '' : 'none';

        if (!favs.length) {
          body.innerHTML =
            '<div class="oshi-empty-card">' +
              '<div class="oshi-empty-icon">\u2b50</div>' +
              '<p class="oshi-empty-text">\u63a8\u3057\u4ff3\u512a\u3092\u767b\u9332\u3059\u308b\u3068\u3001<br>\u305d\u306e\u4ff3\u512a\u306e\u6700\u65b0\u30cb\u30e5\u30fc\u30b9\u3092\u304a\u5c4a\u3051\u3057\u307e\u3059\u3002<\/p>' +
              '<button class="oshi-register-btn" onclick="LiveOshi.openPanel()">\u63a8\u3057\u4ff3\u512a\u3092\u767b\u9332\u3059\u308b<\/button>' +
            '<\/div>';
          return;
        }

        /* 俳優チップ行 */
        var h = '<div class="oshi-chips-row">';
        favs.forEach(function(name) {
          h += '<span class="oshi-chip">' + esc(normName(name)) + '<\/span>';
        });
        h += '<\/div>';
        h += '<div id="oshi-news-items"><div class="loading" style="font-size:12px;">\u8aad\u307f\u8fbc\u307f\u4e2d\u2026<\/div><\/div>';
        body.innerHTML = h;
        fetchOshiNews(favs);
      }

      /* oshi-news-items を毎回 ID で再取得して更新（stale 参照を避ける） */
      function setOshiNews(html) {
        var el = document.getElementById("oshi-news-items");
        if (el) el.innerHTML = html;
        var count = el ? el.querySelectorAll('a.oshi-news-row').length : 0;
        var badge = document.getElementById('oshi-count-badge');
        if (badge) badge.textContent = count > 0 ? count + '件' : '';
      }

      function fetchOshiNews(favs) {
        var names = favs.map(normName).filter(Boolean);
        if (!names.length) { setOshiNews('<p class="oshi-no-news">\u63a8\u3057\u4ff3\u512a\u3092\u767b\u9332\u3057\u3066\u304f\u3060\u3055\u3044\u3002<\/p>'); return; }
        var timer = setTimeout(function() {
          setOshiNews('<p class="oshi-no-news">\u30cb\u30e5\u30fc\u30b9\u306e\u53d6\u5f97\u306b\u6642\u9593\u304c\u304b\u304b\u3063\u3066\u3044\u307e\u3059\u3002\u3057\u3070\u3089\u304f\u304a\u5f85\u3061\u304f\u3060\u3055\u3044\u3002<\/p>');
        }, 12000);
        fetch("/api/oshi-news?actors=" + encodeURIComponent(names.join(",")))
          .then(function(r){ return r.json(); })
          .then(function(data) {
            clearTimeout(timer);
            var rows = ((data && data.results) || []).filter(function(r){ return r.article; });
            if (!rows.length) {
              setOshiNews('<p class="oshi-no-news">\u73fe\u5728\u3001\u63a8\u3057\u4ff3\u512a\u306e\u30cb\u30e5\u30fc\u30b9\u306f\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3067\u3057\u305f\u3002<\/p>');
              return;
            }
            setOshiNews(rows.map(function(r) {
              var pub = r.article.pubTs ? (function(ts){ var d=new Date(ts); return (d.getMonth()+1)+"/"+d.getDate(); })(r.article.pubTs) : "";
              return '<a href="' + esc(r.article.link||"#") + '" target="_blank" rel="noopener" class="oshi-news-row">'
                + '<span class="oshi-news-actor-tag">' + esc(normName(r.actor||"")) + '<\/span>'
                + '<span class="oshi-news-title">' + esc(r.article.title||"") + '<\/span>'
                + (pub ? '<span class="oshi-news-date">' + esc(pub) + '<\/span>' : '')
                + '<\/a>';
            }).join(''));
          })
          .catch(function() {
            clearTimeout(timer);
            setOshiNews('<p class="oshi-no-news">\u30cb\u30e5\u30fc\u30b9\u306e\u8aad\u307f\u8fbc\u307f\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002<\/p>');
          });
      }

      /* ================================================================
         管理パネル
         ================================================================ */
      function openPanel() {
        closePanel();
        var favs = loadFavs();
        var h = '<div class="oshi-panel-overlay" id="oshi-panel-overlay" onclick="LiveOshi.closePanel(event)">';
        h += '<div class="oshi-panel" onclick="event.stopPropagation()">';
        h += '<div class="oshi-panel-header">';
        h +=   '<span class="oshi-panel-title">\u2b50 \u63a8\u3057\u4ff3\u512a\u3092\u7ba1\u7406<\/span>';
        h +=   '<button class="oshi-panel-close" onclick="LiveOshi.closePanel()">\u2715<\/button>';
        h += '<\/div>';
        h += '<div class="oshi-panel-body">';

        /* 登録済みリスト */
        h += '<div class="oshi-panel-section">';
        h +=   '<div class="oshi-panel-label">\u767b\u9332\u6e08\u307f\uff08<span id="lv-fav-count">' + favs.length + '<\/span>\/' + MAX_FAV + '\u4eba\uff09<\/div>';
        h +=   '<div id="lv-reg-list">' + renderRegList(favs) + '<\/div>';
        h += '<\/div>';

        /* 人気俳優 */
        h += '<div class="oshi-panel-section">';
        h +=   '<div class="oshi-panel-label">\u2728 \u4eba\u6c17\u4ff3\u512a\u304b\u3089\u9078\u3076<\/div>';
        h +=   '<div id="lv-popular-grid" class="oshi-actor-grid">' + renderPopGrid(favs, null) + '<\/div>';
        h += '<\/div>';

        /* 検索 */
        h += '<div class="oshi-panel-section">';
        h +=   '<div class="oshi-panel-label">\uD83D\uDD0D \u540d\u524d\u30fb\u5c4b\u53f7\u3067\u691c\u7d22<\/div>';
        h +=   '<input type="text" class="oshi-search-input" id="lv-search" placeholder="\u4f8b\uff1a\u52d8\u4e5d\u90ce\u3001\u6210\u7530\u5c4b" oninput="LiveOshi.search()">';
        h +=   '<div id="lv-search-results" class="oshi-actor-grid"><\/div>';
        h += '<\/div>';

        h += '<\/div><\/div><\/div>';
        document.body.insertAdjacentHTML('beforeend', h);
        document.body.style.overflow = 'hidden';

        /* 名鑑ロード → リッチ表示 */
        loadActors(function(meikan) {
          renderRegListRich(loadFavs(), meikan);
          renderPopGridRich(loadFavs(), meikan);
        });
      }

      function closePanel(e) {
        if (e && e.target !== document.getElementById('oshi-panel-overlay')) return;
        var overlay = document.getElementById('oshi-panel-overlay');
        if (overlay) { overlay.remove(); document.body.style.overflow = ''; }
        renderSection();
      }

      function renderRegList(favs) {
        if (!favs.length) return '<p class="oshi-panel-empty">\u307e\u3060\u767b\u9332\u3055\u308c\u3066\u3044\u307e\u305b\u3093<\/p>';
        return favs.map(function(name) {
          return '<div class="oshi-reg-row">'
            + '<span class="oshi-reg-icon">\uD83C\uDFAD<\/span>'
            + '<span class="oshi-reg-name">\u2605 ' + esc(name) + '<\/span>'
            + '<button class="oshi-remove-btn" onclick="LiveOshi.toggle(\\'' + name.replace(/'/g,"\\\\'") + '\\')">\u89e3\u9664<\/button>'
            + '<\/div>';
        }).join('');
      }

      function renderRegListRich(favs, meikan) {
        var el = document.getElementById('lv-reg-list');
        if (!el) return;
        if (!favs.length) { el.innerHTML = '<p class="oshi-panel-empty">\u307e\u3060\u767b\u9332\u3055\u308c\u3066\u3044\u307e\u305b\u3093<\/p>'; return; }
        el.innerHTML = favs.map(function(name) {
          var info = findMeikan(meikan, name);
          var badge = info && info.yago
            ? '<span class="oshi-yago-sm">' + esc(info.yago.substring(0,3)) + '<\/span>'
            : '<span class="oshi-yago-sm">\uD83C\uDFAD<\/span>';
          var sub = info ? (info.generation || '') : '';
          return '<div class="oshi-reg-row">' + badge
            + '<div class="oshi-reg-info"><div class="oshi-reg-name">\u2605 ' + esc(name) + '<\/div>'
            + (sub ? '<div class="oshi-reg-sub">' + esc(sub) + '<\/div>' : '') + '<\/div>'
            + '<button class="oshi-remove-btn" onclick="LiveOshi.toggle(\\'' + name.replace(/'/g,"\\\\'") + '\\')">\u89e3\u9664<\/button>'
            + '<\/div>';
        }).join('');
      }

      function renderPopGrid(favs, meikan) {
        return POPULAR.map(function(name) {
          var isFav = favs.indexOf(name) >= 0;
          var yago = meikan ? (function(){ var i = findMeikan(meikan, name); return i && i.yago ? i.yago.substring(0,3) : ''; })() : '';
          return '<div class="oshi-actor-chip' + (isFav ? ' is-fav' : '') + '" onclick="LiveOshi.toggle(\\'' + name.replace(/'/g,"\\\\'") + '\\')">'
            + (yago ? '<span class="oshi-chip-yago">' + esc(yago) + '<\/span>' : '')
            + '<span class="oshi-chip-name">' + esc(name) + '<\/span>'
            + '<span class="oshi-chip-badge">' + (isFav ? '\u767b\u9332\u6e08' : '\uff0b') + '<\/span>'
            + '<\/div>';
        }).join('');
      }

      function renderPopGridRich(favs, meikan) {
        var el = document.getElementById('lv-popular-grid');
        if (el) el.innerHTML = renderPopGrid(favs, meikan);
      }

      /* ── toggle（add / remove） ── */
      window.LiveOshi = {
        openPanel: openPanel,
        closePanel: closePanel,
        toggle: function(name) {
          var f = loadFavs();
          var idx = f.indexOf(name);
          if (idx >= 0) { f.splice(idx, 1); }
          else {
            if (f.length >= MAX_FAV) { alert('\u63a8\u3057\u4ff3\u512a\u306e\u767b\u9332\u306f' + MAX_FAV + '\u4eba\u307e\u3067\u3067\u3059\u3002'); return; }
            f.push(name);
          }
          saveFavs(f);
          /* パネル内 UI 更新 */
          var countEl = document.getElementById('lv-fav-count');
          if (countEl) countEl.textContent = f.length;
          loadActors(function(meikan) {
            renderRegListRich(f, meikan);
            renderPopGridRich(f, meikan);
          });
          /* 検索結果も再描画 */
          var si = document.getElementById('lv-search');
          if (si && si.value.trim()) window.LiveOshi.search();
        },
        search: function() {
          var input = document.getElementById('lv-search');
          var results = document.getElementById('lv-search-results');
          if (!input || !results) return;
          var q = input.value.trim();
          if (!q) { results.innerHTML = ''; return; }
          loadActors(function(meikan) {
            if (!meikan) { results.innerHTML = '<p class="oshi-panel-empty">\u30c7\u30fc\u30bf\u8aad\u307f\u8fbc\u307f\u4e2d\u2026<\/p>'; return; }
            var f = loadFavs();
            var hits = [];
            for (var i = 0; i < meikan.length && hits.length < 20; i++) {
              var a = meikan[i];
              var nk = (a.name_kanji||'').replace(/\s+/g,'');
              if (nk.indexOf(q)>=0 || (a.name_kana||'').indexOf(q)>=0 || (a.yago||'').indexOf(q)>=0) hits.push(a);
            }
            if (!hits.length) { results.innerHTML = '<p class="oshi-panel-empty">\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3067\u3057\u305f<\/p>'; return; }
            results.innerHTML = hits.map(function(a) {
              var name = (a.name_kanji||'').replace(/\s+/g,'');
              var isFav = f.indexOf(name) >= 0;
              var yago = a.yago ? a.yago.substring(0,3) : '';
              return '<div class="oshi-actor-chip' + (isFav ? ' is-fav' : '') + '" onclick="LiveOshi.toggle(\\'' + name.replace(/'/g,"\\\\'") + '\\')">'
                + (yago ? '<span class="oshi-chip-yago">' + esc(yago) + '<\/span>' : '')
                + '<span class="oshi-chip-name">' + esc(name) + '<\/span>'
                + '<span class="oshi-chip-badge">' + (isFav ? '\u767b\u9332\u6e08' : '\uff0b') + '<\/span>'
                + '<\/div>';
            }).join('');
          });
        }
      };

      /* ── 初期化：ローカルデータで即時描画 → auth 後にサーバーマージ ── */
      renderSection(); // localStorage のデータで即時表示

      fetch('/api/auth/me', { credentials: 'same-origin' })
        .then(function(r){ return r.json(); })
        .then(function(auth) {
          authChecked = true;
          if (!auth.loggedIn) return;
          isLoggedIn = true;
          return fetch('/api/userdata', { credentials: 'same-origin' })
            .then(function(r){ return r.json(); })
            .then(function(ud) {
              var serverFavs = (ud && ud.favorite_actors) || [];
              if (!serverFavs.length) return;
              var local = loadFavs();
              var added = false;
              serverFavs.forEach(function(n) { if (local.indexOf(n)<0) { local.push(n); added = true; } });
              if (added) {
                try { localStorage.setItem(FAV_KEY, JSON.stringify(local.slice(0, MAX_FAV))); } catch(e){}
                renderSection(); // サーバーで新規の推しが見つかった場合のみ再描画
              }
            });
        })
        .catch(function() { authChecked = true; });
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
      var oshiFilterOn = false;
      var FAV_KEY = "favorite_actors_v1";
      function loadLocalFavs() {
        try { var r = localStorage.getItem(FAV_KEY); return r ? JSON.parse(r) : []; } catch(e) { return []; }
      }

      /* NAVI 演目照合マップ: サーバー埋め込みデータから構築 */
      function n2(s) { return (s||"").replace(/[\\s\\u3000（）()【】「」『』〈〉・]/g,""); }
      var enmokuMap = {};
      (function() {
        var list = ${enmokuTitlesJson};
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
        if (p.programs && p.programs.length > 0) {
          for (var ai = 0; ai < p.programs.length; ai++) {
            if (p.programs[ai].plays) p.programs[ai].plays.forEach(function(play) {
              var eid = findEnmokuId(play.title);
              if (eid) naviLinks.push({ title: play.title, id: eid });
            });
          }
        }
        if (p.programs && p.programs.length > 0) {
          for (var pi = 0; pi < p.programs.length; pi++) {
            var prog = p.programs[pi];
            if (prog.program) playsHTML += '<div class="perf-prog-label">' + esc(prog.program) + '<\/div>';
            if (prog.plays) for (var pj = 0; pj < prog.plays.length; pj++) {
              playsHTML += '<div class="perf-play-title">' + esc(prog.plays[pj].title) + '<\/div>';
            }
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
                if (g) g.innerHTML = '<div class="empty-state">\u3053\u306e\u6708\u306b\u63a8\u3057\u4ff3\u512a\u306e\u51fa\u6f14\u516c\u6f14\u306f\u3042\u308a\u307e\u305b\u3093\u3002<\/div>';
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

          /* localStorage の推し俳優を即時反映（LiveOshi が非同期で同期済みの場合も含む） */
          var localFavs = loadLocalFavs();
          if (localFavs.length) {
            localFavs.forEach(function(n) { favoriteActors.add(normActor(n)); });
            showOshiToggle();
          }
          /* LiveOshi の初期化完了後に localStorage が更新されている場合に備えて遅延再チェック */
          setTimeout(function() {
            var latest = loadLocalFavs();
            if (latest.length > localFavs.length) {
              latest.forEach(function(n) { favoriteActors.add(normActor(n)); });
              if (!localFavs.length) showOshiToggle();
              renderTabGrid();
            }
          }, 1500);
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

      /* ── 推し俳優ニュースセクション ── */
      .oshi-manage-btn {
        font-size: 12px; font-weight: 500; color: var(--gold-dark);
        background: var(--gold-soft); border: 1px solid var(--gold-light);
        border-radius: 20px; padding: 4px 12px; cursor: pointer;
        transition: all 0.15s; white-space: nowrap;
      }
      .oshi-manage-btn:hover { background: var(--gold); color: #fff; border-color: var(--gold); }

      /* 空状態 */
      .oshi-empty-card {
        background: var(--bg-card); border: 1px dashed var(--gold-light);
        border-radius: var(--radius-md); padding: 28px 20px;
        text-align: center;
      }
      .oshi-empty-icon { font-size: 32px; margin-bottom: 10px; }
      .oshi-empty-text {
        font-size: 13.5px; color: var(--text-secondary);
        line-height: 1.9; margin-bottom: 16px;
      }
      .oshi-register-btn {
        background: var(--gold); color: #fff; border: none;
        border-radius: 24px; padding: 10px 28px;
        font-size: 14px; font-weight: 600; cursor: pointer;
        transition: background 0.15s, transform 0.15s;
        font-family: inherit;
      }
      .oshi-register-btn:hover { background: var(--gold-dark); transform: translateY(-1px); }

      /* 俳優チップ行 */
      .oshi-chips-row {
        display: flex; flex-wrap: wrap; align-items: center;
        gap: 6px; margin-bottom: 14px;
      }
      .oshi-chip {
        font-size: 12px; font-weight: 600; color: var(--gold-dark);
        background: var(--gold-soft); border: 1px solid var(--gold-light);
        border-radius: 20px; padding: 3px 10px;
      }

      /* ニュース行 */
      .oshi-news-row {
        display: flex; align-items: baseline; gap: 6px;
        text-decoration: none; color: inherit;
        padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,.06);
        font-size: 13px; line-height: 1.5;
      }
      .oshi-news-row:last-child { border-bottom: none; }
      .oshi-news-row:hover .oshi-news-title { text-decoration: underline; }
      .oshi-news-actor-tag {
        flex-shrink: 0; font-size: 11px; font-weight: 600;
        color: var(--gold-dark);
        background: rgba(180,130,60,.1); border-radius: 4px;
        padding: 1px 6px;
      }
      .oshi-news-title {
        flex: 1; color: var(--text-primary);
        display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
      }
      .oshi-news-date {
        flex-shrink: 0; font-size: 11px; color: var(--text-tertiary);
      }
      .oshi-no-news {
        font-size: 13px; color: var(--text-tertiary);
        padding: 10px 0; margin: 0;
      }

      /* ── 管理パネル（モーダル） ── */
      .oshi-panel-overlay {
        position: fixed; inset: 0; z-index: 2000;
        background: rgba(0,0,0,.45); display: flex;
        align-items: flex-end; justify-content: center;
      }
      .oshi-panel {
        background: var(--bg-page); width: 100%; max-width: 520px;
        border-radius: 16px 16px 0 0; max-height: 80vh;
        display: flex; flex-direction: column; overflow: hidden;
      }
      .oshi-panel-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 16px 20px 12px; border-bottom: 1px solid var(--border-light);
        flex-shrink: 0;
      }
      .oshi-panel-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 15px; font-weight: 600; color: var(--text-primary);
      }
      .oshi-panel-close {
        background: none; border: none; font-size: 18px;
        color: var(--text-tertiary); cursor: pointer; padding: 4px 8px;
        border-radius: 6px; transition: background 0.15s;
      }
      .oshi-panel-close:hover { background: var(--bg-subtle); }
      .oshi-panel-body {
        overflow-y: auto; padding: 16px 20px 24px;
        -webkit-overflow-scrolling: touch;
      }
      .oshi-panel-section { margin-bottom: 20px; }
      .oshi-panel-section:last-child { margin-bottom: 0; }
      .oshi-panel-label {
        font-size: 11.5px; font-weight: 600; color: var(--text-tertiary);
        letter-spacing: 0.06em; margin-bottom: 10px; text-transform: uppercase;
      }
      .oshi-panel-empty {
        font-size: 13px; color: var(--text-tertiary); margin: 0; padding: 4px 0;
      }

      /* 登録済みリスト */
      .oshi-reg-row {
        display: flex; align-items: center; gap: 8px;
        padding: 8px 0; border-bottom: 1px solid var(--border-light);
      }
      .oshi-reg-row:last-child { border-bottom: none; }
      .oshi-yago-sm {
        display: inline-flex; align-items: center; justify-content: center;
        width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
        background: var(--gold-soft); color: var(--gold-dark);
        font-size: 11px; font-weight: 700; letter-spacing: -0.5px;
      }
      .oshi-reg-icon { font-size: 20px; flex-shrink: 0; }
      .oshi-reg-info { flex: 1; min-width: 0; }
      .oshi-reg-name { font-size: 13.5px; font-weight: 600; color: var(--text-primary); }
      .oshi-reg-sub { font-size: 11px; color: var(--text-tertiary); margin-top: 1px; }
      .oshi-remove-btn {
        font-size: 11.5px; color: var(--accent-1); background: none;
        border: 1px solid var(--accent-1); border-radius: 12px;
        padding: 3px 10px; cursor: pointer; white-space: nowrap; flex-shrink: 0;
        transition: all 0.15s;
      }
      .oshi-remove-btn:hover { background: var(--accent-1); color: #fff; }

      /* 俳優選択グリッド */
      .oshi-actor-grid {
        display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;
      }
      .oshi-actor-chip {
        display: flex; align-items: center; gap: 6px;
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-sm); padding: 8px 10px;
        cursor: pointer; transition: all 0.15s;
        -webkit-tap-highlight-color: transparent;
      }
      .oshi-actor-chip:hover { border-color: var(--gold); background: var(--gold-soft); }
      .oshi-actor-chip.is-fav {
        background: var(--gold-soft); border-color: var(--gold);
      }
      .oshi-chip-yago {
        display: inline-flex; align-items: center; justify-content: center;
        width: 28px; height: 28px; border-radius: 6px; flex-shrink: 0;
        background: var(--bg-subtle); color: var(--gold-dark);
        font-size: 10px; font-weight: 700; letter-spacing: -0.5px;
      }
      .oshi-actor-chip.is-fav .oshi-chip-yago { background: rgba(197,162,85,.15); }
      .oshi-chip-name { flex: 1; font-size: 12.5px; font-weight: 500; color: var(--text-primary); min-width: 0; }
      .oshi-chip-badge {
        font-size: 10px; font-weight: 600; flex-shrink: 0; padding: 1px 6px;
        border-radius: 10px; background: var(--bg-subtle); color: var(--text-tertiary);
      }
      .oshi-actor-chip.is-fav .oshi-chip-badge {
        background: var(--gold); color: #fff;
      }

      /* 検索フォーム */
      .oshi-search-input {
        width: 100%; box-sizing: border-box;
        padding: 9px 12px; font-size: 14px; font-family: inherit;
        border: 1px solid var(--border-medium); border-radius: var(--radius-sm);
        background: var(--bg-card); color: var(--text-primary);
        margin-bottom: 10px;
        transition: border-color 0.15s;
      }
      .oshi-search-input:focus { outline: none; border-color: var(--gold); }

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

      /* ── 注目演目ブロック ── */
      .featured-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .featured-card {
        background: var(--bg-card);
        border: 1px solid var(--gold-light, #e8d5a0);
        border-radius: var(--radius-md);
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        box-shadow: var(--shadow-sm);
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .featured-card:hover {
        border-color: var(--gold);
        box-shadow: var(--shadow-md);
      }
      .featured-label {
        font-size: 11px;
        font-weight: 700;
        color: var(--gold-dark);
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .featured-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 16px;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1.4;
      }
      .featured-countdown {
        font-size: 13px;
        color: var(--accent-1, #c0392b);
        font-weight: 600;
      }
      .featured-countdown strong {
        font-size: 18px;
        margin: 0 2px;
      }
      .featured-theaters {
        font-size: 11px;
        color: var(--text-tertiary);
      }
      .featured-actions {
        margin-top: 4px;
      }
      .featured-navi-link {
        display: inline-block;
        font-size: 12px;
        color: var(--gold-dark);
        text-decoration: none;
        padding: 4px 12px;
        border: 1px solid var(--gold-soft, #e8d5a0);
        border-radius: 20px;
        background: var(--gold-soft, #fdf8ec);
        transition: all 0.15s;
      }
      .featured-navi-link:hover {
        background: var(--gold);
        color: #fff;
        border-color: var(--gold);
      }
      .featured-no-navi {
        font-size: 11px;
        color: var(--text-tertiary);
        font-style: italic;
      }

      @media (max-width: 600px) {
        .perf-tab-btn { padding: 5px 14px; font-size: 13px; }
        .featured-grid { grid-template-columns: 1fr; }
        .featured-title { font-size: 15px; }
      }

      /* ── 推しニュース件数バッジ ── */
      .oshi-count-badge {
        display: inline-block;
        font-size: 11px;
        font-weight: 600;
        color: var(--gold-dark);
        background: var(--gold-soft);
        border: 1px solid var(--gold-light);
        border-radius: 10px;
        padding: 1px 7px;
        margin-left: 8px;
        vertical-align: middle;
        font-family: 'Noto Sans JP', sans-serif;
        letter-spacing: 0;
      }
      .oshi-count-badge:empty { display: none; }
    </style>`
  });
}
