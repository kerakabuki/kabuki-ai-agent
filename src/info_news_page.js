// src/info_news_page.js
// =========================================================
// 地歌舞伎ニュースページ — /jikabuki/info/news
// INFO配下：feedKey=jikabuki でフィルタした記事一覧
// =========================================================
import { pageShell } from "./web_layout.js";

export function infoNewsPageHTML() {
  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span><a href="/jikabuki/info">INFO</a><span>›</span>地歌舞伎ニュース
    </div>

    <section class="in-hero fade-up">
      <h2 class="in-hero-title">📰 地歌舞伎ニュース</h2>
      <p class="in-hero-lead">全国の地歌舞伎・地芝居に関する最新ニュースをまとめています。</p>
    </section>

    <div class="in-filter-bar fade-up">
      <input id="in-search" type="search" placeholder="キーワードで絞り込み…" class="in-search-input" />
      <span class="in-count" id="in-count"></span>
    </div>

    <div id="in-container">
      <div class="in-loading">ニュースを読み込み中…</div>
    </div>

    <script>
    (function(){
      var container = document.getElementById('in-container');
      var countEl   = document.getElementById('in-count');
      var searchEl  = document.getElementById('in-search');
      var allArticles = [];
      /* 団体名リスト（長い順にソートして部分一致の精度を上げる） */
      var groupNames = [];

      /* ニュース＋団体リストを並列取得 */
      Promise.all([
        fetch('/api/news?feedKey=jikabuki').then(function(r){ return r.json(); }),
        fetch('/api/jikabuki/groups').then(function(r){ return r.json(); }),
      ]).then(function(results){
        var newsData   = results[0];
        var groupsData = results[1];

        /* 団体名を長い順にセット（短い名前で誤マッチしないよう） */
        if (groupsData && groupsData.groups) {
          groupNames = groupsData.groups
            .map(function(g){ return g.name; })
            .filter(Boolean)
            .sort(function(a, b){ return b.length - a.length; });
        }

        if (!newsData || !newsData.articles || newsData.articles.length === 0) {
          container.innerHTML = '<div class="in-empty">📰 まだニュースが取得できていません。<br>しばらくしてからもう一度お試しください。</div>';
          return;
        }
        allArticles = newsData.articles;
        render(allArticles);

        if (newsData.updatedAt) {
          var d = new Date(newsData.updatedAt);
          var label = (d.getMonth()+1) + '/' + d.getDate() + ' ' +
                      ('0'+d.getHours()).slice(-2) + ':' + ('0'+d.getMinutes()).slice(-2) + ' 更新';
          var upd = document.createElement('p');
          upd.className = 'in-updated';
          upd.textContent = label;
          container.parentNode.insertBefore(upd, container);
        }
      }).catch(function(){
        container.innerHTML = '<div class="in-empty">ニュースの読み込みに失敗しました。</div>';
      });

      /* タイトル中に登場する登録団体名を返す（複数可） */
      function matchGroups(title) {
        var matched = [];
        for (var i = 0; i < groupNames.length; i++) {
          var name = groupNames[i];
          if (title.indexOf(name) !== -1) {
            matched.push(name);
            /* 既にマッチした名前を含む短い名前は追加しない（例：「気良歌舞伎」が出たら「歌舞伎」単体は不要） */
            if (matched.length >= 3) break;
          }
        }
        return matched;
      }

      searchEl.addEventListener('input', function(){
        var q = searchEl.value.trim();
        applyFilter(q);
      });

      function applyFilter(q) {
        if (!q) { render(allArticles); return; }
        var lq = q.toLowerCase();
        var filtered = allArticles.filter(function(a){
          return a.title.toLowerCase().indexOf(lq) !== -1 ||
                 (a.source||'').toLowerCase().indexOf(lq) !== -1;
        });
        render(filtered);
      }

      /* バッジクリック → 検索欄にセットして絞り込み */
      document.addEventListener('click', function(e){
        var badge = e.target.closest('.in-group-badge');
        if (!badge) return;
        e.preventDefault();
        e.stopPropagation();
        var name = badge.dataset.group;
        if (!name) return;
        searchEl.value = name;
        applyFilter(name);
      });

      function render(articles) {
        if (articles.length === 0) {
          container.innerHTML = '<div class="in-empty">該当するニュースがありません。</div>';
          countEl.textContent = '';
          return;
        }
        countEl.textContent = articles.length + ' 件';
        var html = '';
        articles.forEach(function(a, i){
          var date    = a.pubTs ? formatDate(a.pubTs) : '';
          var source  = a.source || '';
          var matched = matchGroups(a.title);

          html += '<a href="' + esc(a.link) + '" target="_blank" rel="noopener" class="in-card fade-up" style="animation-delay:' + (i * 0.03) + 's">';
          html += '<div class="in-card-meta">';
          /* 登録団体バッジ */
          matched.forEach(function(name){
            html += '<button type="button" class="in-group-badge" data-group="' + esc(name) + '">' + esc(name) + '</button>';
          });
          if (source) html += '<span class="in-source">' + esc(source) + '</span>';
          if (date)   html += '<time class="in-date">' + esc(date) + '</time>';
          html += '</div>';
          html += '<p class="in-title">' + esc(a.title) + '</p>';
          html += '</a>';
        });
        container.innerHTML = html;
      }

      function formatDate(ts){
        var d = new Date(ts);
        return d.getFullYear() + '/' + (d.getMonth()+1) + '/' + d.getDate();
      }
      function esc(s){
        if (!s) return '';
        return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      }
    })();
    </script>
  `;

  return pageShell({
    title: "地歌舞伎ニュース",
    subtitle: "INFO — 地歌舞伎の入口",
    bodyHTML,
    activeNav: "info",
    brand: "jikabuki",
    ogTitle: "地歌舞伎ニュース | JIKABUKI PLUS+",
    ogDesc: "全国の地歌舞伎・地芝居に関する最新ニュース一覧。地域の芝居文化を知る・応援するための情報をまとめています。",
    headExtra: `<style>
      /* ── ヒーロー ── */
      .in-hero {
        text-align: center;
        padding: 1.6rem 0 1rem;
      }
      .in-hero-title {
        font-size: clamp(1.3rem, 4vw, 1.8rem);
        font-weight: 700;
        color: var(--heading);
        margin: 0 0 0.4rem;
      }
      .in-hero-lead {
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin: 0;
        line-height: 1.7;
      }

      /* ── フィルターバー ── */
      .in-filter-bar {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      .in-search-input {
        flex: 1;
        padding: 0.55rem 0.9rem;
        border-radius: 8px;
        border: 1px solid var(--border-light);
        background: var(--bg-subtle);
        color: var(--text-primary);
        font-size: 0.9rem;
        outline: none;
      }
      .in-search-input:focus {
        border-color: var(--kin, #c5a55a);
      }
      .in-count {
        font-size: 0.8rem;
        color: var(--text-secondary);
        white-space: nowrap;
        min-width: 4rem;
        text-align: right;
      }

      /* ── 更新日時 ── */
      .in-updated {
        font-size: 0.75rem;
        color: var(--text-tertiary);
        text-align: right;
        margin: 0 0 0.5rem;
      }

      /* ── カード ── */
      .in-card {
        display: block;
        padding: 0.9rem 1.1rem;
        background: var(--bg-subtle);
        border: 1px solid var(--border-light);
        border-radius: 12px;
        margin-bottom: 0.6rem;
        text-decoration: none;
        color: var(--text-primary);
        transition: border-color 0.2s, transform 0.15s;
      }
      .in-card:hover {
        border-color: var(--kin, #c5a55a);
        transform: translateX(4px);
        text-decoration: none;
      }
      .in-card-meta {
        display: flex;
        gap: 0.6rem;
        align-items: center;
        margin-bottom: 0.3rem;
      }
      .in-source {
        font-size: 0.72rem;
        color: var(--text-tertiary);
      }
      .in-date {
        font-size: 0.72rem;
        color: var(--text-secondary);
        margin-left: auto;
      }
      .in-title {
        margin: 0;
        font-size: 0.93rem;
        font-weight: 600;
        line-height: 1.6;
        color: var(--text-primary);
      }

      /* ── 登録団体バッジ ── */
      .in-group-badge {
        display: inline-block;
        padding: 2px 7px;
        font-size: 0.68rem;
        font-weight: 600;
        border-radius: 4px;
        background: rgba(197,165,90,0.15);
        color: var(--kin, #c5a55a);
        border: 1px solid rgba(197,165,90,0.4);
        cursor: pointer;
        transition: background 0.15s;
        white-space: nowrap;
        line-height: 1.5;
      }
      .in-group-badge:hover {
        background: rgba(197,165,90,0.3);
      }

      /* ── ローディング / 空 ── */
      .in-loading, .in-empty {
        text-align: center;
        padding: 2.5rem 1rem;
        color: var(--text-secondary);
        font-size: 0.9rem;
        line-height: 1.75;
      }
    </style>`,
  });
}
