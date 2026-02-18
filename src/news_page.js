// src/news_page.js
// =========================================================
// ニュースページ — /news
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";

export function newsPageHTML() {
  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span><a href="/kabuki/live">KABUKI LIVE</a><span>›</span>ニュース一覧
    </div>

    <div id="news-container">
      <div class="loading">ニュースを読み込み中…</div>
    </div>

    <script>
    (function(){
      var container = document.getElementById("news-container");

      fetch("/api/news")
        .then(function(r){ return r.json(); })
        .then(function(data){
          if (!data || !data.articles || data.articles.length === 0) {
            container.innerHTML = '<div class="empty-state">📰 まだニュースが取得できていないよ。<br>もう少し待ってね！</div>';
            return;
          }
          render(data);
        })
        .catch(function(){
          container.innerHTML = '<div class="empty-state">ニュースの読み込みに失敗しました。</div>';
        });

      function render(data) {
        var articles = data.articles;
        var updated = data.updatedAt ? formatTime(data.updatedAt) : "";

        var html = '<p class="news-updated">更新: ' + esc(updated) + '</p>';

        articles.forEach(function(a, i) {
          var date = a.pubTs ? formatDate(a.pubTs) : "";
          var source = a.source || "";
          var cat = a.category || "";
          html += '<a href="' + esc(a.link) + '" target="_blank" rel="noopener" class="news-card fade-up" style="animation-delay:' + (i * 0.04) + 's">';
          html += '<div class="news-card-header">';
          if (cat) html += '<span class="news-cat">' + esc(cat) + '</span>';
          if (source) html += '<span class="news-source">' + esc(source) + '</span>';
          html += '</div>';
          html += '<h3 class="news-title">' + esc(a.title) + '</h3>';
          if (date) html += '<time class="news-date">' + esc(date) + '</time>';
          html += '</a>';
        });

        container.innerHTML = html;
      }

      function formatDate(ts) {
        var d = new Date(ts);
        return d.getFullYear() + "/" + (d.getMonth()+1) + "/" + d.getDate();
      }
      function formatTime(iso) {
        var d = new Date(iso);
        var mo = d.getMonth()+1, dy = d.getDate();
        var hh = ("0"+d.getHours()).slice(-2), mm = ("0"+d.getMinutes()).slice(-2);
        return mo + "/" + dy + " " + hh + ":" + mm;
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
    title: "ニュース一覧",
    subtitle: "KABUKI LIVE — 歌舞伎瓦版",
    bodyHTML,
    activeNav: "live",
    headExtra: `<style>
      .news-updated {
        font-size: 0.78rem;
        color: var(--text-secondary);
        margin-bottom: 1rem;
      }
      .news-card {
        display: block;
        padding: 1rem 1.2rem;
        background: var(--bg-subtle);
        border: 1px solid var(--border-light);
        border-radius: 12px;
        margin-bottom: 0.7rem;
        text-decoration: none;
        color: var(--text-primary);
        transition: all 0.2s;
      }
      .news-card:hover {
        border-color: var(--kin);
        transform: translateX(4px);
        text-decoration: none;
      }
      .news-card-header {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.3rem;
        align-items: center;
      }
      .news-cat {
        font-size: 0.7rem;
        padding: 2px 8px;
        border-radius: 4px;
        background: var(--bg-card);
        color: var(--kin);
        border: 1px solid rgba(197,165,90,0.3);
      }
      .news-source {
        font-size: 0.72rem;
        color: var(--text-tertiary);
      }
      .news-title {
        font-size: 0.95rem;
        font-weight: bold;
        line-height: 1.6;
        color: var(--text-primary);
      }
      .news-date {
        display: block;
        margin-top: 0.3rem;
        font-size: 0.72rem;
        color: var(--text-secondary);
      }
    </style>`,
  });
}
