// src/group_records_page.js
// =========================================================
// 公演記録詳細データベース — /groups/:groupId/records
// 演目ごとに出演者・スタッフを詳細登録
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";

export function groupRecordsPageHTML(group, googleClientId) {
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
      <a href="/">トップ</a><span>&rsaquo;</span><a href="/jikabuki/base">BASE</a><span>&rsaquo;</span><a href="/jikabuki/gate/${gid}">${name}</a><span>&rsaquo;</span>公演記録
    </div>

    <div id="gr-app">
      <div class="loading">読み込み中...</div>
    </div>

    <script>
    (function(){
      var GID = "${gid}";
      var records = [];
      var userRole = null;
      var canEdit = false;

      function esc(s) { return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
      function genId(prefix) { return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2,6); }
      function toArr(v) { if (!v) return []; if (Array.isArray(v)) return v; return [v]; }

      var ALL_STAFF_FIELDS = [
        { key: "kuroko", label: "黒衣" },
        { key: "furi_tsuke", label: "振付" },
        { key: "tsuke", label: "附け打ち" },
        { key: "gidayu", label: "義太夫" },
        { key: "shamisen", label: "三味線" },
        { key: "geza", label: "下座" },
        { key: "kaoshi", label: "顔師" },
        { key: "costume", label: "衣装屋" }
      ];

      var suggestions = {};
      var allScripts = [];

      function init() {
        Promise.all([
          fetch("/api/auth/me").then(function(r){ return r.json(); }).catch(function(){ return {}; }),
          fetch("/api/groups/" + GID + "/records").then(function(r){ return r.json(); }).catch(function(){ return { records: [] }; }),
          fetch("/api/groups/" + GID + "/scripts").then(function(r){ return r.json(); }).catch(function(){ return { scripts: [] }; })
        ]).then(function(results) {
          var me = results[0];
          var data = results[1];
          records = data.records || [];
          allScripts = results[2].scripts || [];

          buildSuggestions();
          if (me && me.loggedIn && me.user) {
            var u = me.user;
            var role = null;
            if (u.isMaster) role = "master";
            else if (u.isEditor) role = "editor";
            if (u.groups) {
              var membership = u.groups.find(function(g){ return g.group_id === GID; });
              if (membership) role = membership.role || role;
            }
            userRole = role;
            canEdit = (role === "master" || role === "editor" || role === "manager" || u.isMaster);
          }
          renderList();
        });
      }

      // ── サジェスト候補構築 ──
      function buildSuggestions() {
        suggestions = { cast_name: {}, cast_role: {} };
        ALL_STAFF_FIELDS.forEach(function(sf){ suggestions[sf.key] = {}; });
        records.forEach(function(r) {
          (r.plays || []).forEach(function(play) {
            (play.cast || []).forEach(function(c) {
              if (c.name && c.name.trim()) suggestions.cast_name[c.name.trim()] = 1;
              if (c.role && c.role.trim()) suggestions.cast_role[c.role.trim()] = 1;
            });
            ALL_STAFF_FIELDS.forEach(function(sf) {
              toArr(play[sf.key]).forEach(function(v) {
                if (v && v.trim()) suggestions[sf.key][v.trim()] = 1;
              });
            });
          });
        });
        renderDataLists();
      }

      function renderDataLists() {
        var container = document.getElementById("gr-datalists");
        if (!container) {
          container = document.createElement("div");
          container.id = "gr-datalists";
          container.style.display = "none";
          document.body.appendChild(container);
        }
        var h = '';
        function dl(id, obj) {
          h += '<datalist id="' + id + '">';
          Object.keys(obj).sort().forEach(function(k){ h += '<option value="' + esc(k) + '">'; });
          h += '</datalist>';
        }
        dl("dl-cast-name", suggestions.cast_name);
        dl("dl-cast-role", suggestions.cast_role);
        ALL_STAFF_FIELDS.forEach(function(sf){ dl("dl-" + sf.key, suggestions[sf.key]); });
        container.innerHTML = h;
      }

      // ── 一覧表示 ──
      function renderList() {
        var app = document.getElementById("gr-app");
        var sorted = records.slice().sort(function(a,b){ return (b.year||0) - (a.year||0) || (b.id||"").localeCompare(a.id||""); });

        var byYear = {};
        sorted.forEach(function(r){
          var y = r.year || "不明";
          if (!byYear[y]) byYear[y] = [];
          byYear[y].push(r);
        });
        var years = Object.keys(byYear).sort(function(a,b){ return b - a; });

        var html = '';
        if (canEdit) {
          html += '<div class="gr-toolbar">'
            + '<button class="btn btn-primary" onclick="GR.showAdd()">＋ 公演を追加</button>'
            + '<span class="gr-count">' + records.length + '件の公演記録</span>'
            + '</div>';
        } else {
          html += '<div class="gr-toolbar"><span class="gr-count">' + records.length + '件の公演記録</span></div>';
        }

        if (!years.length) {
          html += '<div class="empty-state">公演記録はまだありません。</div>';
        } else {
          years.forEach(function(year){
            html += '<div class="gr-year-group">';
            html += '<h3 class="gr-year">' + esc(String(year)) + '</h3>';
            byYear[year].forEach(function(r){
              var ri = records.indexOf(r);
              html += renderRecordCard(r, ri);
            });
            html += '</div>';
          });
        }
        app.innerHTML = html;
      }

      function renderRecordCard(r, ri) {
        var playCount = (r.plays||[]).length;
        var h = '<div class="gr-card" id="gr-card-' + ri + '">'
          + '<div class="gr-card-header" onclick="GR.toggle(' + ri + ')">'
          + '<div class="gr-card-info">'
          + '<span class="gr-card-date">' + esc(r.date_display || "") + '</span>'
          + '<span class="gr-card-title">' + esc(r.title || "（無題）") + '</span>'
          + (r.venue ? '<span class="gr-card-venue">' + esc(r.venue) + '</span>' : '')
          + '</div>'
          + '<div class="gr-card-meta">'
          + (playCount ? '<span class="gr-card-plays-count">' + playCount + '演目</span>' : '')
          + '<span class="gr-card-chevron" id="gr-chev-' + ri + '">▼</span>'
          + '</div>'
          + '</div>'
          + '<div class="gr-card-body" id="gr-body-' + ri + '" style="display:none;">';

        if (r.note) h += '<div class="gr-card-note">' + esc(r.note) + '</div>';

        (r.plays || []).forEach(function(play, pi) {
          h += '<div class="gr-play">'
            + '<div class="gr-play-title">' + esc(play.title || "（演目名なし）") + '</div>';
          if (play.cast && play.cast.length) {
            h += '<table class="gr-cast-table"><thead><tr><th>役名</th><th>出演者</th></tr></thead><tbody>';
            play.cast.forEach(function(c){ h += '<tr><td>' + esc(c.role) + '</td><td>' + esc(c.name) + '</td></tr>'; });
            h += '</tbody></table>';
          }
          var staffItems = [];
          ALL_STAFF_FIELDS.forEach(function(sf) {
            var arr = toArr(play[sf.key]);
            if (arr.length) staffItems.push({ label: sf.label, val: arr.join("、") });
          });
          if (staffItems.length) {
            h += '<div class="gr-staff-credits">'
              + '<div class="gr-staff-credits-title">スタッフ</div>'
              + '<div class="gr-staff-credits-grid">';
            staffItems.forEach(function(s){
              h += '<div class="gr-staff-credit-item">'
                + '<span class="gr-staff-label">' + esc(s.label) + '</span>'
                + '<span class="gr-staff-val">' + esc(s.val) + '</span>'
                + '</div>';
            });
            h += '</div></div>';
          }
          if (play.note) h += '<div class="gr-play-note">' + esc(play.note) + '</div>';
          h += '</div>';
        });

        // ── 関連台本 ──
        var recTitle = r.title || "";
        var linked = allScripts.filter(function(s){ return s.performance_tag && s.performance_tag === recTitle; });
        h += '<div class="gr-linked-scripts">'
          + '<div class="gr-linked-scripts-label">&#128214; 関連台本</div>';
        if (linked.length) {
          linked.forEach(function(s) {
            var typeLabel = s.type === "pdf" ? "PDF" : s.type === "json" ? "JSON" : "TXT";
            h += '<a href="/groups/' + GID + '/scripts" class="gr-linked-script-item" title="' + esc(s.title||"") + '">'
              + '<span class="gr-linked-script-type gr-linked-script-type-' + esc(s.type||"text") + '">' + typeLabel + '</span>'
              + '<span class="gr-linked-script-name">' + esc(s.title || "（無題）") + (s.play ? ' ／ ' + esc(s.play) : '') + '</span>'
              + '</a>';
          });
        } else {
          h += '<span class="gr-linked-scripts-empty">紐付けられた台本はありません</span>';
          if (canEdit) {
            h += '<a href="/groups/' + GID + '/scripts" class="gr-linked-scripts-add">台本をアップロードして紐付ける →</a>';
          }
        }
        h += '</div>';

        if (canEdit) {
          h += '<div class="gr-card-actions">'
            + '<button class="gr-btn-edit" onclick="GR.editRecord(' + ri + ')">編集</button>'
            + '<button class="gr-btn-del" onclick="GR.delRecord(' + ri + ')">削除</button>'
            + '</div>';
        }
        h += '</div></div>';
        return h;
      }

      // ── 展開トグル ──
      function toggle(ri) {
        var body = document.getElementById("gr-body-" + ri);
        var chev = document.getElementById("gr-chev-" + ri);
        if (!body) return;
        var open = body.style.display !== "none";
        body.style.display = open ? "none" : "block";
        if (chev) chev.textContent = open ? "▼" : "▲";
      }

      // ── 編集フォーム ──
      function showForm(r, ri) {
        var isEdit = ri !== null && ri !== undefined;
        r = r || { id: genId("r"), year: new Date().getFullYear(), date_display: "", title: "", venue: "", note: "", plays: [] };
        var app = document.getElementById("gr-app");

        var h = '<div class="gr-form">'
          + '<h3 class="gr-form-heading">' + (isEdit ? '公演を編集' : '新しい公演を追加') + '</h3>'
          + '<div class="gr-form-section">'
          + '<div class="gr-form-row gr-form-row-half"><label>年</label><input type="number" id="grf-year" value="' + (r.year||"") + '"></div>'
          + '<div class="gr-form-row gr-form-row-half"><label>日付表示</label><input type="text" id="grf-date" value="' + esc(r.date_display||"") + '" placeholder="例: 9月28日"></div>'
          + '</div>'
          + '<div class="gr-form-row"><label>公演名</label><input type="text" id="grf-title" value="' + esc(r.title||"") + '" placeholder="例: 五代目座長襲名披露公演"></div>'
          + '<div class="gr-form-row"><label>会場</label><input type="text" id="grf-venue" value="' + esc(r.venue||"") + '"></div>'
          + '<div class="gr-form-row"><label>備考</label><input type="text" id="grf-note" value="' + esc(r.note||"") + '"></div>'
          + '<div class="gr-form-row"><label>YouTube動画URL</label><input type="url" id="grf-youtube" value="' + esc(r.youtube_url||"") + '" placeholder="https://www.youtube.com/watch?v=..."></div>';

        h += '<div class="gr-plays-section">'
          + '<div class="gr-plays-header"><h4>演目</h4><button type="button" class="btn btn-sm" onclick="GR.addPlay()">＋ 演目を追加</button></div>'
          + '<div id="grf-plays">';
        (r.plays || []).forEach(function(play, pi) {
          h += renderPlayForm(play, pi);
        });
        h += '</div></div>';

        h += '<div class="gr-form-actions">'
          + '<button class="btn btn-primary gr-save-btn" onclick="GR.saveForm(' + (isEdit ? ri : "null") + ')">保存</button>'
          + '<button class="btn btn-secondary" onclick="GR.cancel()">キャンセル</button>'
          + '</div></div>';

        app.innerHTML = h;
        app.scrollIntoView({ behavior: "smooth" });
      }

      function renderPlayForm(play, pi) {
        play = play || { id: genId("p"), title: "", genre: "", duration_min: "", cast: [], kuroko: [], furi_tsuke: [], tsuke: [], gidayu: [], shamisen: [], geza: [], kaoshi: [], costume: [], note: "" };
        var h = '<div class="gr-play-form" data-pi="' + pi + '">'
          + '<div class="gr-play-form-header">'
          + '<span class="gr-play-num">演目 ' + (pi+1) + '</span>'
          + '<button type="button" class="gr-btn-del-sm" onclick="GR.removePlay(' + pi + ')" title="演目を削除">✕</button>'
          + '</div>'
          + '<div class="gr-form-row"><label>演目名</label><input type="text" class="grf-play-title" value="' + esc(play.title||"") + '" placeholder="例: 白浪五人男「稲瀬川勢揃い」"></div>'
          + '<div class="gr-form-row gr-form-row-inline">'
          + '<label>ジャンル</label>'
          + '<select class="grf-play-genre">'
          + '<option value="">--</option>'
          + '<option value="jidaimono"' + (play.genre==="jidaimono" ? ' selected' : '') + '>時代物</option>'
          + '<option value="sewamono"' + (play.genre==="sewamono" ? ' selected' : '') + '>世話物</option>'
          + '<option value="shosagoto"' + (play.genre==="shosagoto" ? ' selected' : '') + '>所作事・舞踊</option>'
          + '<option value="other"' + (play.genre==="other" ? ' selected' : '') + '>その他</option>'
          + '</select>'
          + '<label style="margin-left:16px">上演時間</label>'
          + '<input type="number" class="grf-play-duration" min="1" max="300" value="' + esc(String(play.duration_min||"")) + '" placeholder="分" style="width:70px">'
          + '<span style="font-size:12px;color:var(--text-tertiary);margin-left:4px">分</span>'
          + '</div>';

        // 出演者（役名+名前）
        h += '<div class="gr-sub-section">'
          + '<div class="gr-sub-header"><label>出演者</label><button type="button" class="btn btn-xs" onclick="GR.addCast(' + pi + ')">＋</button></div>'
          + '<div class="grf-cast-list">';
        (play.cast || []).forEach(function(c, ci) {
          h += '<div class="gr-cast-row">'
            + '<input type="text" class="grf-cast-role" list="dl-cast-role" value="' + esc(c.role||"") + '" placeholder="役名">'
            + '<input type="text" class="grf-cast-name" list="dl-cast-name" value="' + esc(c.name||"") + '" placeholder="出演者名">'
            + '<button type="button" class="gr-btn-del-xs" onclick="this.parentElement.remove()">✕</button>'
            + '</div>';
        });
        h += '</div></div>';

        // スタッフクレジット（2列グリッド）
        h += '<div class="gr-staff-section">'
          + '<div class="gr-staff-section-header">スタッフクレジット</div>'
          + '<div class="gr-staff-grid">';
        ALL_STAFF_FIELDS.forEach(function(f) {
          var vals = toArr(play[f.key]);
          h += '<div class="gr-staff-col">'
            + '<div class="gr-sub-header"><label>' + f.label + '</label><button type="button" class="btn btn-xs" onclick="GR.addMulti(' + pi + ',\\'' + f.key + '\\')">＋</button></div>'
            + '<div class="grf-multi-list" data-field="' + f.key + '">';
          vals.forEach(function(v) {
            h += '<div class="gr-multi-row">'
              + '<input type="text" class="grf-multi-val" list="dl-' + f.key + '" value="' + esc(v) + '" placeholder="氏名">'
              + '<button type="button" class="gr-btn-del-xs" onclick="this.parentElement.remove()">✕</button>'
              + '</div>';
          });
          h += '</div></div>';
        });
        h += '</div></div>';

        h += '<div class="gr-form-row"><label>備考</label><input type="text" class="grf-play-note" value="' + esc(play.note||"") + '"></div>'
          + '</div>';
        return h;
      }

      function addPlay() {
        var container = document.getElementById("grf-plays");
        if (!container) return;
        var pi = container.querySelectorAll(".gr-play-form").length;
        var tmp = document.createElement("div");
        tmp.innerHTML = renderPlayForm(null, pi);
        container.appendChild(tmp.firstChild);
      }

      function removePlay(pi) {
        var forms = document.querySelectorAll("#grf-plays .gr-play-form");
        if (forms[pi]) {
          if (!confirm("この演目を削除しますか？")) return;
          forms[pi].remove();
          reindexPlays();
        }
      }

      function reindexPlays() {
        var forms = document.querySelectorAll("#grf-plays .gr-play-form");
        forms.forEach(function(f, i) {
          f.setAttribute("data-pi", i);
          var num = f.querySelector(".gr-play-num");
          if (num) num.textContent = "演目 " + (i+1);
          var delBtn = f.querySelector(".gr-play-form-header .gr-btn-del-sm");
          if (delBtn) delBtn.setAttribute("onclick", "GR.removePlay(" + i + ")");
          var addCastBtn = f.querySelector('.gr-sub-header .btn-xs[onclick*="addCast"]');
          if (addCastBtn) addCastBtn.setAttribute("onclick", "GR.addCast(" + i + ")");
          f.querySelectorAll('.gr-sub-header .btn-xs[onclick*="addMulti"]').forEach(function(b) {
            var m = b.getAttribute("onclick").match(/addMulti\\(\\d+,'(\\w+)'\\)/);
            if (m) b.setAttribute("onclick", "GR.addMulti(" + i + ",'" + m[1] + "')");
          });
        });
      }

      function addCast(pi) {
        var forms = document.querySelectorAll("#grf-plays .gr-play-form");
        if (!forms[pi]) return;
        var list = forms[pi].querySelector(".grf-cast-list");
        var row = document.createElement("div");
        row.className = "gr-cast-row";
        row.innerHTML = '<input type="text" class="grf-cast-role" list="dl-cast-role" placeholder="役名">'
          + '<input type="text" class="grf-cast-name" list="dl-cast-name" placeholder="出演者名">'
          + '<button type="button" class="gr-btn-del-xs" onclick="this.parentElement.remove()">✕</button>';
        list.appendChild(row);
      }

      function addMulti(pi, field) {
        var forms = document.querySelectorAll("#grf-plays .gr-play-form");
        if (!forms[pi]) return;
        var list = forms[pi].querySelector('.grf-multi-list[data-field="' + field + '"]');
        if (!list) return;
        var lbl = "";
        ALL_STAFF_FIELDS.forEach(function(sf){ if (sf.key === field) lbl = sf.label; });
        var row = document.createElement("div");
        row.className = "gr-multi-row";
        row.innerHTML = '<input type="text" class="grf-multi-val" list="dl-' + field + '" placeholder="' + lbl + '">'
          + '<button type="button" class="gr-btn-del-xs" onclick="this.parentElement.remove()">✕</button>';
        list.appendChild(row);
      }

      function collectPlays() {
        var plays = [];
        document.querySelectorAll("#grf-plays .gr-play-form").forEach(function(f) {
          var durVal = parseInt((f.querySelector(".grf-play-duration")||{}).value || "");
          var play = {
            id: genId("p"),
            title: (f.querySelector(".grf-play-title")||{}).value || "",
            genre: (f.querySelector(".grf-play-genre")||{}).value || "",
            duration_min: isNaN(durVal) ? null : durVal,
            cast: [],
            kuroko: [], furi_tsuke: [], tsuke: [], gidayu: [], shamisen: [], geza: [],
            kaoshi: [], costume: [], note: ""
          };
          f.querySelectorAll(".grf-cast-list .gr-cast-row").forEach(function(row) {
            var role = (row.querySelector(".grf-cast-role")||{}).value || "";
            var nm = (row.querySelector(".grf-cast-name")||{}).value || "";
            if (role || nm) play.cast.push({ role: role.trim(), name: nm.trim() });
          });
          ALL_STAFF_FIELDS.forEach(function(sf) {
            var list = f.querySelector('.grf-multi-list[data-field="' + sf.key + '"]');
            if (list) {
              play[sf.key] = [];
              list.querySelectorAll(".grf-multi-val").forEach(function(inp) {
                if (inp.value.trim()) play[sf.key].push(inp.value.trim());
              });
            }
          });
          play.note = (f.querySelector(".grf-play-note")||{}).value || "";
          play.title = play.title.trim();
          play.note = play.note.trim();
          plays.push(play);
        });
        return plays;
      }

      function saveForm(ri) {
        var entry = {
          id: (ri !== null && ri !== undefined && records[ri]) ? records[ri].id : genId("r"),
          year: parseInt(document.getElementById("grf-year").value) || new Date().getFullYear(),
          date_display: document.getElementById("grf-date").value.trim(),
          title: document.getElementById("grf-title").value.trim(),
          venue: document.getElementById("grf-venue").value.trim(),
          note: document.getElementById("grf-note").value.trim(),
          youtube_url: (document.getElementById("grf-youtube") || {}).value.trim() || "",
          plays: collectPlays()
        };
        if (ri !== null && ri !== undefined && ri >= 0) {
          records[ri] = entry;
        } else {
          records.push(entry);
        }
        saveToServer();
      }

      function delRecord(ri) {
        if (!confirm("この公演記録を削除しますか？")) return;
        records.splice(ri, 1);
        saveToServer();
      }

      function saveToServer() {
        var btn = document.querySelector(".gr-save-btn");
        if (btn) { btn.disabled = true; btn.textContent = "保存中..."; }
        fetch("/api/groups/" + GID + "/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records: records })
        }).then(function(res) {
          if (!res.ok) throw new Error("Save failed");
          buildSuggestions();
          renderList();
        }).catch(function(e) {
          alert("保存に失敗しました: " + e.message);
          if (btn) { btn.disabled = false; btn.textContent = "保存"; }
        });
      }

      window.GR = {
        showAdd: function(){ showForm(null, null); },
        editRecord: function(ri){ showForm(records[ri], ri); },
        delRecord: delRecord,
        saveForm: saveForm,
        cancel: function(){ renderList(); },
        toggle: toggle,
        addPlay: addPlay,
        removePlay: removePlay,
        addCast: addCast,
        addMulti: addMulti
      };

      init();
    })();
    </script>
  `;

  return pageShell({
    title: `公演記録 - ${g.name}`,
    subtitle: "演目・配役・スタッフのアーカイブ",
    bodyHTML,
    activeNav: "base",
    brand: "jikabuki",
    googleClientId: googleClientId || "",
    headExtra: `<style>
      .gr-toolbar {
        display: flex; align-items: center; gap: 12px; margin-bottom: 1.5rem;
      }
      .gr-count { font-size: 13px; color: var(--text-tertiary); }
      .gr-year-group { margin-bottom: 1.5rem; }
      .gr-year {
        font-family: 'Noto Serif JP', serif; font-size: 16px; font-weight: 600;
        color: var(--gold-dark); padding-bottom: 6px;
        border-bottom: 1px solid var(--border-light); margin-bottom: 10px; letter-spacing: 1px;
      }

      /* ── カード一覧 ── */
      .gr-card {
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-md); margin-bottom: 8px; box-shadow: var(--shadow-sm); overflow: hidden;
      }
      .gr-card-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 14px 16px; cursor: pointer; transition: background 0.15s;
      }
      .gr-card-header:hover { background: var(--bg-subtle); }
      .gr-card-info { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; flex: 1; min-width: 0; }
      .gr-card-date { font-size: 13px; font-weight: 600; white-space: nowrap; }
      .gr-card-title { font-family: 'Noto Serif JP', serif; font-size: 14px; font-weight: 600; }
      .gr-card-venue { font-size: 12px; color: var(--text-tertiary); background: var(--bg-subtle); padding: 2px 8px; border-radius: 4px; }
      .gr-card-meta { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
      .gr-card-plays-count { font-size: 11px; color: var(--text-tertiary); background: var(--bg-subtle); padding: 2px 8px; border-radius: 10px; }
      .gr-card-chevron { font-size: 10px; color: var(--text-tertiary); transition: transform 0.2s; }
      .gr-card-body { padding: 0 16px 16px; }
      .gr-card-note { font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; padding: 8px 12px; background: var(--bg-subtle); border-radius: 6px; }
      .gr-card-actions { display: flex; gap: 8px; margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border-light); }

      /* ── 演目詳細（閲覧） ── */
      .gr-play {
        border: 1px solid var(--border-light); border-radius: var(--radius-sm);
        padding: 12px 14px; margin-bottom: 10px; background: var(--bg-page);
      }
      .gr-play-title {
        font-family: 'Noto Serif JP', serif; font-size: 14px; font-weight: 600;
        margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dashed var(--border-light);
      }
      .gr-cast-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 13px; }
      .gr-cast-table th { text-align: left; font-weight: 600; color: var(--text-secondary); font-size: 11px; padding: 4px 8px; border-bottom: 1px solid var(--border-light); }
      .gr-cast-table td { padding: 4px 8px; border-bottom: 1px solid var(--border-light); }
      /* ── スタッフクレジット（閲覧） ── */
      .gr-staff-credits { margin-top: 10px; border-top: 1px dashed var(--border-light); padding-top: 8px; }
      .gr-staff-credits-title { font-size: 10px; font-weight: 700; color: var(--text-tertiary); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; }
      .gr-staff-credits-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 4px 16px; }
      .gr-staff-credit-item { display: flex; align-items: baseline; gap: 4px; font-size: 12px; }
      .gr-staff-label { font-size: 10px; font-weight: 700; color: var(--text-tertiary); white-space: nowrap; }
      .gr-staff-val { color: var(--text-secondary); }
      .gr-play-note { font-size: 12px; color: var(--text-tertiary); margin-top: 6px; }

      /* ── 関連台本 ── */
      .gr-linked-scripts {
        margin-top: 14px; padding: 10px 14px;
        background: rgba(255,255,255,0.5); border-radius: 8px;
        border: 1px solid var(--border-light);
      }
      .gr-linked-scripts-label {
        font-size: 11px; font-weight: 700; color: var(--text-tertiary);
        letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 8px;
      }
      .gr-linked-script-item {
        display: flex; align-items: center; gap: 8px;
        padding: 5px 0; border-bottom: 1px dashed var(--border-light);
        text-decoration: none; color: var(--text-primary);
        font-size: 13px; transition: color 0.15s;
      }
      .gr-linked-script-item:last-child { border-bottom: none; }
      .gr-linked-script-item:hover { color: var(--gold-dark); }
      .gr-linked-script-type {
        font-size: 9px; font-weight: 700; padding: 2px 5px;
        border-radius: 3px; flex-shrink: 0; letter-spacing: 0.5px;
      }
      .gr-linked-script-type-pdf { background: #fde8e8; color: #c0392b; }
      .gr-linked-script-type-text { background: #e8f4e8; color: #27ae60; }
      .gr-linked-script-type-json { background: #e8eef8; color: #2980b9; }
      .gr-linked-script-name { flex: 1; }
      .gr-linked-scripts-empty { font-size: 12px; color: var(--text-tertiary); }
      .gr-linked-scripts-add {
        display: inline-block; margin-top: 6px; font-size: 11px;
        color: var(--gold-dark); text-decoration: none;
      }
      .gr-linked-scripts-add:hover { text-decoration: underline; }

      .gr-btn-edit, .gr-btn-del {
        font-size: 12px; padding: 6px 14px; border: 1px solid var(--border-light);
        border-radius: 4px; cursor: pointer; background: var(--bg-card); color: var(--text-secondary);
        font-family: inherit; transition: all 0.15s;
      }
      .gr-btn-edit:hover { border-color: var(--gold); color: var(--gold-dark); }
      .gr-btn-del:hover { border-color: var(--accent-1); color: var(--accent-1); }

      /* ── 編集フォーム ── */
      .gr-form {
        background: var(--bg-card); border: 2px solid var(--gold-light);
        border-radius: var(--radius-md); padding: 24px; margin-bottom: 2rem; box-shadow: var(--shadow-md);
      }
      .gr-form-heading { font-family: 'Noto Serif JP', serif; font-size: 17px; font-weight: 600; margin-bottom: 20px; }
      .gr-form-section { display: flex; gap: 12px; flex-wrap: wrap; }
      .gr-form-row { margin-bottom: 12px; }
      .gr-form-row label { display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; }
      .gr-form-row input, .gr-form-row textarea {
        width: 100%; padding: 10px 12px; border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm); font-size: 14px; font-family: inherit;
        background: var(--bg-page); color: var(--text-primary); box-sizing: border-box;
      }
      .gr-form-row input:focus, .gr-form-row textarea:focus { border-color: var(--gold); outline: none; box-shadow: 0 0 0 3px rgba(197,162,85,0.1); }
      .gr-form-row-half { flex: 1; min-width: 120px; }
      .gr-form-row-inline { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
      .gr-form-row-inline label { display: inline; margin-bottom: 0; white-space: nowrap; }
      .gr-form-row-inline select { padding: 8px 10px; border: 1px solid var(--border-medium); border-radius: var(--radius-sm); font-size: 14px; font-family: inherit; background: var(--bg-page); color: var(--text-primary); }
      .gr-form-row-third { display: inline-block; width: calc(33.3% - 8px); margin-right: 8px; vertical-align: top; }
      @media (max-width: 600px) { .gr-form-row-third { width: 100%; margin-right: 0; } }
      .gr-form-actions { display: flex; gap: 10px; margin-top: 20px; }
      .gr-save-btn { min-width: 100px; justify-content: center; display: flex; }

      /* ── 演目フォーム ── */
      .gr-plays-section { margin-top: 20px; }
      .gr-plays-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
      .gr-plays-header h4 { font-family: 'Noto Serif JP', serif; font-size: 15px; margin: 0; }
      .gr-play-form {
        border: 1px solid var(--border-medium); border-radius: var(--radius-sm);
        padding: 16px; margin-bottom: 14px; background: var(--bg-page); position: relative;
      }
      .gr-play-form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
      .gr-play-num { font-weight: 600; font-size: 13px; color: var(--gold-dark); }

      .gr-sub-section { margin-bottom: 10px; }
      .gr-sub-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
      .gr-sub-header label { font-size: 12px; font-weight: 600; color: var(--text-secondary); margin: 0; }

      /* ── スタッフクレジット（フォーム） ── */
      .gr-staff-section { margin-top: 14px; border: 1px solid var(--border-light); border-radius: var(--radius-sm); padding: 12px 14px; background: var(--bg-subtle); }
      .gr-staff-section-header { font-size: 11px; font-weight: 700; color: var(--text-tertiary); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px; }
      .gr-staff-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
      @media (max-width: 500px) { .gr-staff-grid { grid-template-columns: 1fr; } }
      .gr-staff-col { }
      .gr-staff-col .gr-sub-header { margin-bottom: 4px; }
      .gr-staff-col .gr-multi-row { margin-bottom: 3px; }

      .gr-cast-row, .gr-multi-row { display: flex; gap: 6px; margin-bottom: 4px; align-items: center; }
      .gr-cast-row input { flex: 1; padding: 7px 10px; border: 1px solid var(--border-light); border-radius: 4px; font-size: 13px; font-family: inherit; background: var(--bg-card); box-sizing: border-box; }
      .gr-multi-row input { flex: 1; padding: 7px 10px; border: 1px solid var(--border-light); border-radius: 4px; font-size: 13px; font-family: inherit; background: var(--bg-card); box-sizing: border-box; }
      .gr-cast-row input:focus, .gr-multi-row input:focus { border-color: var(--gold); outline: none; }

      .btn-sm { font-size: 12px; padding: 4px 12px; }
      .btn-xs { font-size: 11px; padding: 2px 8px; border: 1px solid var(--border-light); border-radius: 4px; cursor: pointer; background: var(--bg-card); color: var(--text-secondary); font-family: inherit; }
      .btn-xs:hover { border-color: var(--gold); color: var(--gold-dark); }
      .gr-btn-del-sm {
        font-size: 14px; width: 26px; height: 26px; border: 1px solid var(--border-light);
        border-radius: 4px; cursor: pointer; background: var(--bg-card); color: var(--text-tertiary);
        display: flex; align-items: center; justify-content: center; transition: all 0.15s;
      }
      .gr-btn-del-sm:hover { border-color: var(--accent-1); color: var(--accent-1); }
      .gr-btn-del-xs {
        font-size: 12px; width: 22px; height: 22px; border: 1px solid var(--border-light);
        border-radius: 4px; cursor: pointer; background: var(--bg-card); color: var(--text-tertiary);
        display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s;
      }
      .gr-btn-del-xs:hover { border-color: var(--accent-1); color: var(--accent-1); }
    </style>`
  });
}
