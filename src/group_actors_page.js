// src/group_actors_page.js
// =========================================================
// 役者DB — /groups/:groupId/actors
// 公演記録データから役者ごとの出演歴を一覧表示
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";

export function groupActorsPageHTML(group, googleClientId) {
  if (!group) {
    return pageShell({
      title: "団体が見つかりません",
      bodyHTML: `<div class="empty-state">指定された団体は登録されていません。</div>`,
      brand: "jikabuki",
      activeNav: "base",
    });
  }

  const g = group;
  const name = escHTML(g.name || "");
  const gid = escHTML(g.group_id || "");

  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>&rsaquo;</span><a href="/jikabuki/base">BASE</a><span>&rsaquo;</span><a href="/jikabuki/gate/${gid}">${name}</a><span>&rsaquo;</span>役者DB
    </div>

    <div id="actors-app">
      <div class="loading">読み込み中...</div>
    </div>

    <script>
    (function(){
      var GID = "${gid}";
      var GROUP_NAME = "${name}";

      function esc(s) { return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

      // 括弧内注記・半角全角スペースをすべて除去して正規化
      function normalizeName(n) {
        return (n || "")
          .replace(/[\(（][^)）]*[\)）]/g, "")  // 括弧内注記を除去
          .replace(/[\s\u3000]+/g, "")           // 半角・全角スペースを除去
          .trim();
      }

      // actorMap: 正規化名 → { displayName, entries[] }
      function buildActorMap(records) {
        var map = {};
        records.forEach(function(rec) {
          (rec.plays || []).forEach(function(play) {
            (play.cast || []).forEach(function(c) {
              var raw = (c.name || "").trim();
              if (!raw) return;
              var key = normalizeName(raw);
              if (!key) return;
              if (!map[key]) map[key] = { displayName: key, entries: [] };
              map[key].entries.push({
                year: rec.year || 0,
                era: rec.era || String(rec.year || ""),
                date_display: rec.date_display || "",
                recTitle: rec.title || "",
                playTitle: play.title || "",
                role: c.role || ""
              });
            });
          });
        });
        Object.keys(map).forEach(function(k) {
          map[k].entries.sort(function(a, b) { return b.year - a.year; });
        });
        return map;
      }

      function init() {
        fetch("/api/groups/" + GID + "/records")
          .then(function(r) { return r.json(); })
          .catch(function() { return { records: [] }; })
          .then(function(data) {
            var records = (data.records || []).slice();
            records.sort(function(a, b) { return b.year - a.year; });
            var actorMap = buildActorMap(records);
            render(actorMap);
          });
      }

      function render(actorMap) {
        var keys = Object.keys(actorMap).sort(function(a, b) {
          return actorMap[b].entries.length - actorMap[a].entries.length;
        });

        var html = '<div class="actors-header">'
          + '<h2 class="actors-title">役者DB</h2>'
          + '<p class="actors-subtitle">' + esc(GROUP_NAME) + ' の出演者一覧</p>'
          + '<div class="actors-search-wrap">'
          + '<input type="search" id="actors-search" class="actors-search" placeholder="名前で検索…" oninput="filterActors(this.value)">'
          + '</div>'
          + '<p class="actors-count" id="actors-count">' + keys.length + '名</p>'
          + '</div>';

        html += '<div class="actors-grid" id="actors-grid">';
        keys.forEach(function(key) {
          var actor = actorMap[key];
          var entries = actor.entries;

          var roles = [];
          entries.forEach(function(e) {
            if (e.role && roles.indexOf(e.role) === -1) roles.push(e.role);
          });
          html += '<div class="actor-card" data-name="' + esc(key) + '" data-key="' + esc(key) + '" onclick="showDetail(this.dataset.key)">';
          html += '<div class="actor-card-header">';
          html += '<span class="actor-name">' + esc(actor.displayName) + '</span>';
          html += '</div>';
          html += '<div class="actor-meta">';
          html += '<span class="actor-meta-item">出演 <strong>' + entries.length + '</strong>回</span>';
          html += '</div>';
          if (roles.length > 0) {
            html += '<div class="actor-roles">' + roles.slice(0, 4).map(function(r){ return '<span class="actor-role-tag">' + esc(r) + '</span>'; }).join('') + (roles.length > 4 ? '<span class="actor-role-tag more">…</span>' : '') + '</div>';
          }
          html += '</div>';
        });
        html += '</div>';

        // モーダル
        html += '<div class="actors-modal-overlay" id="actors-modal-overlay" onclick="closeModal()" style="display:none">'
          + '<div class="actors-modal" onclick="event.stopPropagation()">'
          + '<button class="actors-modal-close" onclick="closeModal()">&times;</button>'
          + '<div id="actors-modal-body"></div>'
          + '</div>'
          + '</div>';

        document.getElementById("actors-app").innerHTML = html;

        window.__actorMap = actorMap;
      }

      window.filterActors = function(q) {
        q = q.trim().toLowerCase();
        var cards = document.querySelectorAll(".actor-card");
        var visible = 0;
        cards.forEach(function(card) {
          var name = (card.dataset.name || "").toLowerCase();
          var show = !q || name.indexOf(q) !== -1;
          card.style.display = show ? "" : "none";
          if (show) visible++;
        });
        var countEl = document.getElementById("actors-count");
        if (countEl) countEl.textContent = visible + "名";
      };

      window.showDetail = function(key) {
        var map = window.__actorMap;
        if (!map || !map[key]) return;
        var actor = map[key];
        var entries = actor.entries;

        var html = '<h3 class="modal-actor-name">' + esc(actor.displayName) + '</h3>';
        html += '<div class="ga-table-scroll"><table class="actor-history-table"><thead><tr><th>年</th><th>演目</th><th>役名</th></tr></thead><tbody>';
        entries.forEach(function(e) {
          html += '<tr>';
          html += '<td class="ah-year"><span class="ah-era">' + esc(e.era) + '</span>' + (e.date_display ? '<br><span class="ah-date">' + esc(e.date_display) + '</span>' : '') + '</td>';
          html += '<td class="ah-play">' + esc(e.playTitle) + '</td>';
          html += '<td class="ah-role">' + esc(e.role) + '</td>';
          html += '</tr>';
        });
        html += '</tbody></table></div>';

        document.getElementById("actors-modal-body").innerHTML = html;
        document.getElementById("actors-modal-overlay").style.display = "flex";
        document.body.style.overflow = "hidden";
      };

      window.closeModal = function() {
        document.getElementById("actors-modal-overlay").style.display = "none";
        document.body.style.overflow = "";
      };

      init();
    })();
    </script>
  `;

  return pageShell({
    title: `役者DB — ${g.name || ""}`,
    subtitle: "出演歴データベース",
    bodyHTML,
    activeNav: "base",
    brand: "jikabuki",
    googleClientId,
    headExtra: `<style>
      /* ヘッダー */
      .actors-header {
        padding: 24px 20px 16px;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 20px;
      }
      .actors-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 20px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 4px;
      }
      .actors-subtitle {
        font-size: 13px;
        color: var(--text-secondary);
        margin: 0 0 14px;
      }
      .actors-search-wrap {
        margin-bottom: 10px;
      }
      .actors-search {
        width: 100%;
        max-width: 360px;
        padding: 8px 12px;
        border: 1px solid var(--border-light);
        border-radius: 8px;
        font-size: 14px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        box-sizing: border-box;
      }
      .actors-search:focus {
        outline: none;
        border-color: var(--accent);
      }
      .actors-count {
        font-size: 12px;
        color: var(--text-secondary);
        margin: 0;
      }

      /* グリッド */
      .actors-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px;
        padding: 0 20px 32px;
      }

      /* 役者カード */
      .actor-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-light);
        border-radius: 10px;
        padding: 14px 16px;
        cursor: pointer;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .actor-card:hover {
        border-color: var(--accent);
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      }
      .actor-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 8px;
      }
      .actor-name {
        font-size: 15px;
        font-weight: 600;
        color: var(--text-primary);
      }
      .actor-meta {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--text-secondary);
        margin-bottom: 8px;
      }
      .actor-meta-item strong {
        color: var(--text-primary);
        font-weight: 700;
      }
      .actor-roles {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      .actor-role-tag {
        font-size: 11px;
        background: var(--bg-primary, #fff);
        border: 1px solid var(--border-light);
        border-radius: 4px;
        padding: 1px 5px;
        color: var(--text-secondary);
      }
      .actor-role-tag.more {
        color: var(--text-secondary);
      }

      /* モーダル */
      .actors-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        z-index: 9000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
      }
      .actors-modal {
        background: var(--bg-primary, #fff);
        border-radius: 14px;
        width: 100%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        padding: 28px 24px;
        position: relative;
        box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      }
      .actors-modal-close {
        position: absolute;
        top: 14px;
        right: 16px;
        background: none;
        border: none;
        font-size: 22px;
        cursor: pointer;
        color: var(--text-secondary);
        line-height: 1;
        padding: 4px;
      }
      .modal-actor-name {
        font-family: 'Noto Serif JP', serif;
        font-size: 20px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 20px;
        padding-right: 32px;
      }
      .modal-section-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 20px 0 10px;
        padding-bottom: 6px;
        border-bottom: 1px solid var(--border-light);
      }
      .modal-section-title:first-of-type {
        margin-top: 0;
      }

      /* 出演歴テーブル */
      .actor-history-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      .actor-history-table th {
        text-align: left;
        font-size: 11px;
        font-weight: 600;
        color: var(--text-secondary);
        padding: 6px 8px;
        border-bottom: 1px solid var(--border-light);
      }
      .actor-history-table td {
        padding: 8px 8px;
        border-bottom: 1px solid var(--border-light);
        vertical-align: top;
      }
      .actor-history-table tr:last-child td {
        border-bottom: none;
      }
      .ah-year {
        white-space: nowrap;
        width: 90px;
      }
      .ah-era {
        font-size: 12px;
        color: var(--text-primary);
        font-weight: 600;
      }
      .ah-date {
        font-size: 11px;
        color: var(--text-secondary);
      }
      .ah-play {
        color: var(--text-primary);
        line-height: 1.4;
      }
      .ah-role {
        color: var(--accent, #1a73e8);
        font-weight: 600;
        white-space: nowrap;
      }

      /* ── 履歴テーブル横スクロール ── */
      .ga-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .ga-table-scroll .actor-history-table { min-width: 320px; }

      @media (max-width: 480px) {
        .actors-grid {
          grid-template-columns: 1fr 1fr;
          padding: 0 12px 24px;
          gap: 10px;
        }
        .actors-modal {
          padding: 20px 16px;
        }
        .actor-history-table {
          font-size: 12px;
        }
        .actor-history-table th, .actor-history-table td {
          padding: 5px 6px;
        }
        .ah-year { width: 70px; }
      }
    </style>`,
  });
}
