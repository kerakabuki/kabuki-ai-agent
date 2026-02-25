// src/info_groups_page.js
// =========================================================
// INFO — 全国地歌舞伎 団体名ディレクトリ
// 検索 + 都道府県フィルタ + お気に入り☆ + GATE誘導 + 外部リンク
// =========================================================
import { pageShell } from "./web_layout.js";

export function infoGroupsPageHTML({} = {}) {
  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span><a href="/jikabuki/info">INFO</a><span>›</span><span>全国の地歌舞伎団体</span>
    </div>

    <section class="ig-header fade-up">
      <h2 class="ig-title">全国の地歌舞伎・地芝居団体</h2>
      <p class="ig-subtitle" id="ig-subtitle">読み込み中…</p>
    </section>

    <section class="ig-controls fade-up">
      <div class="ig-search-wrap">
        <input type="text" id="ig-search" class="ig-search" placeholder="団体名・都道府県で検索…" autocomplete="off">
      </div>
      <select id="ig-pref-filter" class="ig-pref-filter">
        <option value="">すべての地域</option>
      </select>
    </section>

    <p class="ig-fav-hint fade-up">☆ を押してお気に入りに登録できます（ログイン不要）</p>

    <section class="ig-list-section fade-up">
      <div id="ig-list" class="ig-list">
        <p class="ig-loading">読み込み中…</p>
      </div>
      <p class="ig-result-count" id="ig-result-count"></p>
    </section>

    <section class="ig-footer-notice fade-up">
      <p>公式サイト・SNS・次回公演情報の掲載を希望される団体の方はご連絡ください。</p>
      <a href="/jikabuki/base/onboarding" class="ig-apply-btn">
        団体登録を申請する →
      </a>
    </section>

    <script>
    (function() {
      var allGroups = [];
      var favSet = {};

      function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

      /* ── 地方ブロック定義（北海道→沖縄） ── */
      var BLOCKS = [
        { label: '北海道',   prefs: ['北海道'] },
        { label: '東北',     prefs: ['青森県','岩手県','宮城県','秋田県','山形県','福島県'] },
        { label: '関東',     prefs: ['茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県'] },
        { label: '北陸',     prefs: ['新潟県','富山県','石川県','福井県'] },
        { label: '中部',     prefs: ['山梨県','長野県','岐阜県','静岡県','愛知県','三重県'] },
        { label: '近畿',     prefs: ['滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県'] },
        { label: '中国',     prefs: ['鳥取県','島根県','岡山県','広島県','山口県'] },
        { label: '四国',     prefs: ['徳島県','香川県','愛媛県','高知県'] },
        { label: '九州・沖縄', prefs: ['福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'] },
      ];

      /* 都道府県 → ブロックラベル の逆引きマップ */
      var PREF_TO_BLOCK = {};
      var PREF_ORDER = [];
      BLOCKS.forEach(function(b) {
        b.prefs.forEach(function(p) {
          PREF_TO_BLOCK[p] = b.label;
          PREF_ORDER.push(p);
        });
      });

      function prefRank(pref) {
        var i = PREF_ORDER.indexOf(pref);
        return i === -1 ? 99 : i;
      }

      /* ── LINK_ICONS: type → {icon, label} ── */
      var LINK_ICONS = {
        website:   { icon: '🌐', label: 'Website' },
        youtube:   { icon: '▶️', label: 'YouTube' },
        x:         { icon: '𝕏', label: 'X' },
        twitter:   { icon: '𝕏', label: 'X' },
        instagram: { icon: '📷', label: 'Instagram' },
        facebook:  { icon: '📘', label: 'Facebook' },
        tiktok:    { icon: '🎵', label: 'TikTok' },
      };

      function loadFavs() {
        try { var a = JSON.parse(localStorage.getItem('jikabuki_fav_groups') || '[]'); a.forEach(function(n){ favSet[n]=true; }); } catch(e){}
      }
      function saveFavs() {
        var arr = []; for (var k in favSet) { if (favSet[k]) arr.push(k); }
        try { localStorage.setItem('jikabuki_fav_groups', JSON.stringify(arr)); } catch(e){}
      }

      function toggleFav(name) {
        if (favSet[name]) delete favSet[name]; else favSet[name] = true;
        saveFavs();
        render();
      }

      function render() {
        var q = (document.getElementById('ig-search').value || '').trim().toLowerCase();
        var pref = document.getElementById('ig-pref-filter').value;

        var filtered = allGroups.filter(function(g) {
          if (q && g.name.toLowerCase().indexOf(q) === -1 && (g.prefecture||'').toLowerCase().indexOf(q) === -1) return false;
          if (pref && g.prefecture !== pref) return false;
          return true;
        });

        var list = document.getElementById('ig-list');
        if (filtered.length === 0) {
          list.innerHTML = '<p class="ig-empty">該当する団体が見つかりません</p>';
        } else {
          var html = '';
          var currentBlock = null;
          /* 検索・絞込み中はブロックヘッダーを省略 */
          var showBlocks = !q && !pref;

          filtered.forEach(function(g) {
            /* ブロックヘッダー */
            if (showBlocks) {
              var block = PREF_TO_BLOCK[g.prefecture] || '';
              if (block && block !== currentBlock) {
                currentBlock = block;
                html += '<div class="ig-block-header">' + esc(block) + '</div>';
              }
            }

            var isFav = !!favSet[g.name];
            var star = isFav ? '★' : '☆';
            var cls = isFav ? 'ig-item ig-fav' : 'ig-item';
            var safeName = esc(g.name).replace(/'/g, "\\\\'");

            /* 県名バッジ */
            var prefBadge = g.prefecture
              ? '<span class="ig-pref">' + esc(g.prefecture) + '</span>'
              : '';

            /* 外部リンクアイコン */
            var linkBtns = '';
            var links = g.links || {};
            var types = Object.keys(links);
            if (types.length > 0) {
              linkBtns = types.map(function(t) {
                var info = LINK_ICONS[t] || { icon: '🔗', label: t };
                var url = links[t];
                if (url) {
                  return '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" class="ig-link-btn ig-link-active" title="' + esc(info.label) + '">' + info.icon + '</a>';
                }
                return '<span class="ig-link-btn ig-link-disabled" title="' + esc(info.label) + '（未登録）">' + info.icon + '</span>';
              }).join('');
            }

            /* GATEあり → CTA */
            var gateBtn = g.gate_id
              ? '<a href="/jikabuki/gate/' + esc(g.gate_id) + '" class="ig-gate-btn">🏮 GATE ›</a>'
              : '<span class="ig-status-badge">情報募集中</span>';

            html += '<div class="' + cls + '">'
              + '<button class="ig-star" onclick="InfoGroups.toggleFav(\\'' + safeName + '\\')" title="お気に入り">' + star + '</button>'
              + '<div class="ig-item-body">'
              +   '<div class="ig-item-main">'
              +     '<span class="ig-name">' + esc(g.name) + '</span>'
              +     prefBadge
              +   '</div>'
              +   (linkBtns ? '<div class="ig-item-links">' + linkBtns + '</div>' : '')
              + '</div>'
              + '<div class="ig-item-right">' + gateBtn + '</div>'
              + '</div>';
          });
          list.innerHTML = html;
        }

        var countEl = document.getElementById('ig-result-count');
        if (q || pref) {
          countEl.textContent = filtered.length + ' / ' + allGroups.length + ' 件';
        } else {
          countEl.textContent = '';
        }
      }

      function buildPrefFilter(groups) {
        var prefSet = {};
        groups.forEach(function(g) { if (g.prefecture) prefSet[g.prefecture] = true; });
        var sel = document.getElementById('ig-pref-filter');
        BLOCKS.forEach(function(b) {
          var available = b.prefs.filter(function(p) { return prefSet[p]; });
          if (!available.length) return;
          var grp = document.createElement('optgroup');
          grp.label = b.label;
          available.forEach(function(p) {
            var opt = document.createElement('option');
            opt.value = p; opt.textContent = p;
            grp.appendChild(opt);
          });
          sel.appendChild(grp);
        });
      }

      function init() {
        loadFavs();
        var params = new URLSearchParams(location.search);
        var initQ = params.get('q') || '';
        if (initQ) document.getElementById('ig-search').value = initQ;

        fetch('/api/jikabuki/groups')
          .then(function(r) { return r.json(); })
          .then(function(data) {
            allGroups = (data.groups || []).sort(function(a, b) {
              var pr = prefRank(a.prefecture) - prefRank(b.prefecture);
              if (pr !== 0) return pr;
              return (a.sort_key || a.name).localeCompare(b.sort_key || b.name, 'ja');
            });
            var sub = document.getElementById('ig-subtitle');
            if (sub) sub.textContent = allGroups.length + ' 団体';
            buildPrefFilter(allGroups);
            render();
          })
          .catch(function() {
            document.getElementById('ig-list').innerHTML = '<p class="ig-empty">読み込みに失敗しました</p>';
          });

        document.getElementById('ig-search').addEventListener('input', render);
        document.getElementById('ig-pref-filter').addEventListener('change', render);
      }

      window.InfoGroups = { toggleFav: toggleFav };
      init();
    })();
    </script>
  `;

  const headExtra = `<style>
.ig-header { text-align: center; margin-bottom: 0.5rem; }
.ig-title { font-family: var(--ff-serif, 'Noto Serif JP', serif); font-size: 1.4rem; color: var(--heading); margin: 0 0 0.3rem; }
.ig-subtitle { color: var(--text-muted, var(--text-secondary)); font-size: 0.9rem; margin: 0; }

.ig-controls { display: flex; gap: 0.6rem; margin-bottom: 1rem; flex-wrap: wrap; }
.ig-search-wrap { flex: 1; min-width: 180px; }
.ig-search {
  width: 100%; padding: 10px 14px; border: 1px solid var(--border-medium, #d5cec4);
  border-radius: var(--radius-md, 12px); font-size: 0.95rem;
  background: var(--bg-card); color: var(--heading); outline: none; transition: border-color 0.2s;
  font-family: inherit;
}
.ig-search:focus { border-color: var(--gold, #c5a255); }
.ig-pref-filter {
  padding: 10px 12px; border: 1px solid var(--border-medium, #d5cec4);
  border-radius: var(--radius-md, 12px); font-size: 0.9rem;
  background: var(--bg-card); color: var(--heading); cursor: pointer; min-width: 140px;
  font-family: inherit;
}
.ig-fav-hint {
  text-align: center; font-size: 0.82rem; color: var(--text-muted, var(--text-secondary));
  margin: 0 0 0.6rem; letter-spacing: 0.01em;
}

.ig-list-section {
  background: var(--bg-card); border-radius: var(--radius-md, 12px);
  box-shadow: var(--shadow-sm); padding: 0.4rem 0; margin-bottom: 1rem;
  border: 1px solid var(--border-light);
}
.ig-list { display: flex; flex-direction: column; }

/* ── ブロックヘッダー ── */
.ig-block-header {
  padding: 6px 14px;
  font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em;
  color: var(--gold-dark, #a8873a);
  background: var(--bg-subtle, #f5f0ea);
  border-bottom: 1px solid var(--border-light, #ece7e0);
  border-top: 1px solid var(--border-light, #ece7e0);
  position: sticky; top: 0; z-index: 1;
}
.ig-block-header:first-child { border-top: none; }

/* ── 行アイテム ── */
.ig-item {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 10px 14px; border-bottom: 1px solid var(--border-light, #ece7e0);
  transition: background 0.15s;
}
.ig-item:last-child { border-bottom: none; }
.ig-item:hover { background: var(--bg-subtle, #faf7f3); }
.ig-item.ig-fav { background: #fef9f0; }
.ig-star {
  background: none; border: none; cursor: pointer;
  font-size: 1.15rem; color: #d4a843; padding: 0; line-height: 1; flex-shrink: 0;
  transition: transform 0.15s;
}
.ig-star:hover { transform: scale(1.2); }

.ig-item-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.2rem; }
.ig-item-main { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.ig-name { font-size: 0.95rem; font-weight: 600; color: var(--heading, var(--text-primary)); }
.ig-pref {
  font-size: 0.72rem; color: var(--text-muted, var(--text-secondary));
  background: var(--bg-subtle, #f5f0ea); padding: 2px 7px; border-radius: 8px;
  white-space: nowrap;
}

/* 外部リンクアイコン */
.ig-item-links { display: flex; gap: 0.3rem; }
.ig-link-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; font-size: 0.8rem; border-radius: 6px;
  text-decoration: none; transition: background 0.15s;
}
.ig-link-active { background: var(--bg-subtle, #f5f0ea); color: var(--heading); cursor: pointer; }
.ig-link-active:hover { background: var(--gold-soft, #f5edd8); text-decoration: none; }
.ig-link-disabled { background: none; color: var(--border-light, #ddd); cursor: default; opacity: 0.4; }

/* 右側: GATE or ステータス */
.ig-item-right { flex-shrink: 0; display: flex; align-items: center; }
.ig-gate-btn {
  display: inline-flex; align-items: center; gap: 0.25rem;
  padding: 4px 10px; border-radius: 16px; font-size: 0.75rem; font-weight: 700;
  background: linear-gradient(135deg, #5c2d0e 0%, #3e1f0d 100%); color: #f5d6a8;
  text-decoration: none; white-space: nowrap; transition: opacity 0.15s;
}
.ig-gate-btn:hover { opacity: 0.85; text-decoration: none; color: #f5d6a8; }
.ig-status-badge {
  font-size: 0.68rem; font-weight: 600; padding: 2px 8px; border-radius: 10px;
  background: var(--bg-subtle, #f5f0ea); color: var(--text-muted, #999);
  border: 1px solid var(--border-light, #ddd); white-space: nowrap;
}

.ig-empty, .ig-loading { text-align: center; padding: 2rem 1rem; color: var(--text-muted, var(--text-secondary)); font-size: 0.9rem; }
.ig-result-count { text-align: center; color: var(--text-muted, var(--text-secondary)); font-size: 0.8rem; margin: 0.5rem 0 0; }

.ig-footer-notice {
  text-align: center; padding: 1.5rem;
  background: var(--bg-subtle, #f5f0ea); border-radius: var(--radius-md, 12px);
  border: 1px dashed var(--border-medium, #d5cec4);
}
.ig-footer-notice p { margin: 0 0 0.4rem; font-size: 0.85rem; color: var(--text-muted, var(--text-secondary)); }
.ig-apply-btn {
  display: inline-block; margin-top: 0.6rem; padding: 8px 20px;
  border-radius: 20px; background: var(--gold-dark, #a8873a); color: #fff;
  text-decoration: none; font-size: 0.85rem; font-weight: 600; transition: opacity 0.2s;
}
.ig-apply-btn:hover { opacity: 0.85; text-decoration: none; color: #fff; }

@media (max-width: 600px) {
  .ig-item { padding: 8px 10px; gap: 0.4rem; }
  .ig-name { font-size: 0.88rem; }
  .ig-gate-btn { padding: 3px 8px; font-size: 0.7rem; }
  .ig-item-links { gap: 0.2rem; }
  .ig-link-btn { width: 22px; height: 22px; font-size: 0.75rem; }
}
</style>`;

  return pageShell({
    title: "全国の地歌舞伎団体",
    subtitle: "団体名ディレクトリ",
    bodyHTML,
    headExtra,
    ogDesc: "全国約100の地歌舞伎団体を収録した名前ディレクトリ。団体名で検索・都道府県で絞り込み。☆でお気に入り登録できます（ログイン不要）。",
    activeNav: "info",
    brand: "jikabuki",
  });
}
