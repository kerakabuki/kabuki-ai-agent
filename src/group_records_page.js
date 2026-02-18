// src/group_records_page.js
// =========================================================
// 公演記録・出演記録 管理ページ — /groups/:groupId/records
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";

export function groupRecordsPageHTML(group) {
  if (!group) {
    return pageShell({
      title: "団体が見つかりません",
      bodyHTML: `<div class="empty-state">指定された団体は登録されていません。</div>`,
      brand: "jikabuki",
      activeNav: "jikabuki",
    });
  }

  const g = group;
  const name = escHTML(g.name || "");
  const gid = escHTML(g.group_id || "");

  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>&rsaquo;</span><a href="/jikabuki">JIKABUKI PLUS+</a><span>&rsaquo;</span><a href="/groups/${gid}">${name}</a><span>&rsaquo;</span>公演記録
    </div>

    <div id="gr-app">
      <div class="loading">読み込み中...</div>
    </div>

    <script>
    (function(){
      var GID = "${gid}";
      var perfs = ${JSON.stringify(g.performances || [])};
      var editing = null;

      function esc(s) { return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

      function render() {
        var app = document.getElementById("gr-app");
        var sorted = perfs.slice().sort(function(a,b){ return (b.year||0) - (a.year||0); });

        var byYear = {};
        sorted.forEach(function(p){
          var y = p.year || "不明";
          if (!byYear[y]) byYear[y] = [];
          byYear[y].push(p);
        });
        var years = Object.keys(byYear).sort(function(a,b){ return b - a; });

        var html = '<div class="gr-toolbar">'
          + '<button class="btn btn-primary" onclick="GR.showAdd()">+ 公演を追加</button>'
          + '<span class="gr-count">' + perfs.length + '件の公演記録</span>'
          + '</div>';

        html += '<div id="gr-form-area"></div>';

        if (!years.length) {
          html += '<div class="empty-state">公演記録はまだありません。</div>';
        } else {
          years.forEach(function(year){
            html += '<div class="gr-year-group">';
            html += '<h3 class="gr-year">' + esc(String(year)) + '</h3>';
            byYear[year].forEach(function(p, idx){
              var globalIdx = perfs.indexOf(p);
              html += '<div class="gr-item">'
                + '<div class="gr-item-header">'
                + '<div class="gr-item-info">'
                + '<span class="gr-item-date">' + esc(p.date_display || "") + '</span>'
                + (p.venue ? '<span class="gr-item-venue">' + esc(p.venue) + '</span>' : '')
                + '</div>'
                + '<div class="gr-item-actions">'
                + '<button class="gr-btn-edit" onclick="GR.editPerf(' + globalIdx + ')">編集</button>'
                + '<button class="gr-btn-del" onclick="GR.delPerf(' + globalIdx + ')">削除</button>'
                + '</div>'
                + '</div>'
                + (p.title ? '<div class="gr-item-title">' + esc(p.title) + '</div>' : '');
              if (p.plays && p.plays.length) {
                html += '<ul class="gr-item-plays">';
                p.plays.forEach(function(pl){ html += '<li>' + esc(pl) + '</li>'; });
                html += '</ul>';
              }
              if (p.cast_notes) {
                html += '<div class="gr-item-cast">' + esc(p.cast_notes) + '</div>';
              }
              html += '</div>';
            });
            html += '</div>';
          });
        }

        app.innerHTML = html;
      }

      function showForm(p, idx) {
        var isEdit = idx !== null && idx !== undefined;
        p = p || { year: new Date().getFullYear(), date_display: "", title: "", venue: "気良座", plays: [], cast_notes: "" };
        var area = document.getElementById("gr-form-area");
        if (!area) { render(); area = document.getElementById("gr-form-area"); }
        area.innerHTML = '<div class="gr-form">'
          + '<h3 class="gr-form-title">' + (isEdit ? '公演を編集' : '新しい公演を追加') + '</h3>'
          + '<div class="gr-form-row"><label>年</label><input type="number" id="grf-year" value="' + (p.year||"") + '"></div>'
          + '<div class="gr-form-row"><label>日付表示</label><input type="text" id="grf-date" value="' + esc(p.date_display||"") + '" placeholder="例: 9月28日"></div>'
          + '<div class="gr-form-row"><label>公演名</label><input type="text" id="grf-title" value="' + esc(p.title||"") + '" placeholder="例: 五代目座長襲名披露公演"></div>'
          + '<div class="gr-form-row"><label>会場</label><input type="text" id="grf-venue" value="' + esc(p.venue||"") + '"></div>'
          + '<div class="gr-form-row"><label>演目（1行1演目）</label><textarea id="grf-plays" rows="4" placeholder="白浪五人男「浜松屋」&#10;義経千本桜「すし屋」">' + esc((p.plays||[]).join("\\n")) + '</textarea></div>'
          + '<div class="gr-form-row"><label>配役メモ</label><textarea id="grf-cast" rows="2">' + esc(p.cast_notes||"") + '</textarea></div>'
          + '<div class="gr-form-actions">'
          + '<button class="btn btn-primary" onclick="GR.saveForm(' + (isEdit ? idx : "null") + ')">保存</button>'
          + '<button class="btn btn-secondary" onclick="GR.cancelForm()">キャンセル</button>'
          + '</div></div>';
        area.scrollIntoView({ behavior: "smooth" });
      }

      function saveForm(idx) {
        var entry = {
          year: parseInt(document.getElementById("grf-year").value) || new Date().getFullYear(),
          date_display: document.getElementById("grf-date").value.trim(),
          title: document.getElementById("grf-title").value.trim(),
          venue: document.getElementById("grf-venue").value.trim(),
          plays: document.getElementById("grf-plays").value.split("\\n").map(function(s){ return s.trim(); }).filter(Boolean),
          cast_notes: document.getElementById("grf-cast").value.trim()
        };
        if (idx !== null && idx !== undefined && idx >= 0) {
          perfs[idx] = entry;
        } else {
          perfs.push(entry);
        }
        saveToServer();
        render();
      }

      function delPerf(idx) {
        if (!confirm("この公演記録を削除しますか？")) return;
        perfs.splice(idx, 1);
        saveToServer();
        render();
      }

      function saveToServer() {
        fetch("/api/groups/" + GID, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ performances: perfs })
        }).catch(function(e){ console.error("Save error:", e); });
      }

      window.GR = {
        showAdd: function(){ showForm(null, null); },
        editPerf: function(idx){ showForm(perfs[idx], idx); },
        delPerf: delPerf,
        saveForm: saveForm,
        cancelForm: function(){
          var area = document.getElementById("gr-form-area");
          if (area) area.innerHTML = "";
        }
      };

      render();
    })();
    </script>
  `;

  return pageShell({
    title: `公演記録 - ${g.name}`,
    subtitle: "演目・配役・日程のアーカイブ",
    bodyHTML,
    activeNav: "jikabuki",
    brand: "jikabuki",
    headExtra: `<style>
      .gr-toolbar {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 1.5rem;
      }
      .gr-count { font-size: 13px; color: var(--text-tertiary); }
      .gr-year-group { margin-bottom: 1.5rem; }
      .gr-year {
        font-family: 'Noto Serif JP', serif;
        font-size: 16px; font-weight: 600;
        color: var(--gold-dark);
        padding-bottom: 6px;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 10px;
        letter-spacing: 1px;
      }
      .gr-item {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        padding: 14px 16px;
        margin-bottom: 8px;
        box-shadow: var(--shadow-sm);
      }
      .gr-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
      .gr-item-info { display: flex; align-items: center; gap: 10px; }
      .gr-item-date { font-size: 13px; font-weight: 600; }
      .gr-item-venue { font-size: 12px; color: var(--text-tertiary); background: var(--bg-subtle); padding: 2px 8px; border-radius: 4px; }
      .gr-item-actions { display: flex; gap: 6px; }
      .gr-btn-edit, .gr-btn-del {
        font-size: 11px; padding: 4px 10px; border: 1px solid var(--border-light);
        border-radius: 4px; cursor: pointer; background: var(--bg-card); color: var(--text-secondary);
        font-family: inherit; transition: all 0.15s;
      }
      .gr-btn-edit:hover { border-color: var(--gold); color: var(--gold-dark); }
      .gr-btn-del:hover { border-color: var(--accent-1); color: var(--accent-1); }
      .gr-item-title { font-family: 'Noto Serif JP', serif; font-size: 14px; font-weight: 600; margin-bottom: 6px; }
      .gr-item-plays { padding-left: 1.2em; margin: 0; list-style: none; }
      .gr-item-plays li { font-size: 13px; color: var(--text-secondary); line-height: 1.8; padding-left: 1em; text-indent: -1em; }
      .gr-item-plays li::before { content: '・'; color: var(--gold); }
      .gr-item-cast { font-size: 12px; color: var(--text-tertiary); margin-top: 6px; padding: 6px 10px; background: var(--bg-subtle); border-radius: 6px; }
      .gr-form {
        background: var(--bg-card);
        border: 2px solid var(--gold-light);
        border-radius: var(--radius-md);
        padding: 20px;
        margin-bottom: 2rem;
        box-shadow: var(--shadow-md);
      }
      .gr-form-title { font-family: 'Noto Serif JP', serif; font-size: 16px; font-weight: 600; margin-bottom: 16px; }
      .gr-form-row { margin-bottom: 12px; }
      .gr-form-row label { display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; }
      .gr-form-row input, .gr-form-row textarea {
        width: 100%; padding: 10px 12px; border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm); font-size: 14px; font-family: inherit;
        background: var(--bg-page); color: var(--text-primary);
      }
      .gr-form-row input:focus, .gr-form-row textarea:focus { border-color: var(--gold); outline: none; box-shadow: 0 0 0 3px rgba(197,162,85,0.1); }
      .gr-form-actions { display: flex; gap: 10px; margin-top: 16px; }
    </style>`
  });
}
