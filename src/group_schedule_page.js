// src/group_schedule_page.js
// =========================================================
// 稽古スケジュール — /groups/:groupId/schedule
// 月次カレンダー表示 + 出欠確認(○△×) + 全メンバー編集可
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";

export function groupSchedulePageHTML(group) {
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
      <a href="/">トップ</a><span>&rsaquo;</span><a href="/jikabuki/base">BASE</a><span>&rsaquo;</span><span id="gs-breadcrumb-last">稽古スケジュール</span>
    </div>

    <div id="gs-goal"></div>
    <div id="gs-calendar"></div>
    <div id="gs-list"></div>

    <div class="gs-footer fade-up-d3">
      <a href="/jikabuki/base" class="btn btn-secondary">&larr; BASE に戻る</a>
    </div>

    <script>
    (function(){
      var GID = "${gid}";
      var schedules = [];
      var performanceGoal = null;
      var currentUser = null;
      var currentGroupRole = null;
      var calYear, calMonth;
      var editingId = null;
      var filterDate = null;
      var allScripts = [];

      function esc(s) {
        return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
      }

      function parseLocalDate(d) {
        if (!d) return null;
        var parts = d.split("-");
        return new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
      }

      function padZ(n) { return String(n).padStart(2, "0"); }

      function formatDate(dt) {
        return dt.getFullYear() + "-" + padZ(dt.getMonth()+1) + "-" + padZ(dt.getDate());
      }

      function dateLabel(d) {
        if (!d) return "";
        var dt = parseLocalDate(d);
        var days = ["日","月","火","水","木","金","土"];
        return (dt.getMonth()+1) + "月" + dt.getDate() + "日(" + days[dt.getDay()] + ")";
      }

      function typeClass(type) {
        var map = { "稽古": "keiko", "本番": "honban", "衣装合わせ": "isho", "会議": "kaigi", "その他": "other" };
        return map[type] || "other";
      }

      function canEdit() {
        return !!currentUser;
      }

      function canDelete(s) {
        if (!currentUser) return false;
        if (currentUser.isMaster) return true;
        if (currentGroupRole === "manager") return true;
        return s.created_by === currentUser.userId;
      }

      function normalizePlays(plays) {
        if (!plays || !plays.length) return [];
        return plays.map(function(p) {
          if (typeof p === "string") return { name: p, cast: [] };
          return { name: p.name || "", cast: p.cast || [] };
        });
      }

      // ─── データ読み込み ───────────────────────────────────────────

      function init() {
        var now = new Date();
        calYear = now.getFullYear();
        calMonth = now.getMonth();

        document.getElementById("gs-calendar").innerHTML = '<div class="loading">読み込み中...</div>';
        document.getElementById("gs-list").innerHTML = "";

        Promise.all([
          fetch("/api/auth/me").then(function(r){ return r.json(); }).catch(function(){ return {}; }),
          fetch("/api/groups/" + GID + "/schedule").then(function(r){ return r.json(); }).catch(function(){ return { schedules: [] }; }),
          fetch("/api/groups/" + GID + "/scripts").then(function(r){ return r.json(); }).catch(function(){ return { scripts: [] }; })
        ]).then(function(results) {
          var auth = results[0];
          var data = results[1];
          var scriptData = results[2];
          currentUser = auth.loggedIn ? auth.user : null;
          if (currentUser) {
            var grp = (currentUser.groups || []).find(function(g){ return g.groupId === GID; });
            currentGroupRole = grp ? grp.role : null;
          }
          schedules = data.schedules || [];
          performanceGoal = data.performance_goal || null;
          allScripts = scriptData.scripts || [];
          render();
        }).catch(function() {
          document.getElementById("gs-calendar").innerHTML = '<div class="empty-state">読み込みに失敗しました。</div>';
        });
      }

      function render() {
        var perfTitle = performanceGoal && performanceGoal.title ? performanceGoal.title : "";
        var bcEl = document.getElementById("gs-breadcrumb-last");
        if (bcEl) bcEl.textContent = perfTitle ? perfTitle + " \u7A3D\u53E4" : "\u7A3D\u53E4\u30B9\u30B1\u30B8\u30E5\u30FC\u30EB";
        document.title = (perfTitle ? perfTitle + " \u7A3D\u53E4" : "\u7A3D\u53E4\u30B9\u30B1\u30B8\u30E5\u30FC\u30EB") + " - JIKABUKI";
        renderGoal();
        renderCalendar();
        renderList();
      }

      // ─── 公演目標 ─────────────────────────────────────────────────

      function renderGoal() {
        var el = document.getElementById("gs-goal");
        if (!el) return;
        var g = performanceGoal;

        if (!g) {
          if (canEdit()) {
            el.innerHTML = '<div class="gs-goal-empty">'
              + '<p class="gs-goal-empty-text">\u516C\u6F14\u76EE\u6A19\u3092\u8A2D\u5B9A\u3057\u3066\u7A3D\u53E4\u306E\u30E2\u30C1\u30D9\u30FC\u30B7\u30E7\u30F3\u3092\u9AD8\u3081\u307E\u3057\u3087\u3046</p>'
              + '<button class="btn btn-primary btn-sm" onclick="GS.showGoalForm()">\u516C\u6F14\u76EE\u6A19\u3092\u8A2D\u5B9A</button>'
              + '<a href="/groups/' + GID + '/enmoku-select" class="gs-enmoku-select-hint-link">\u6F14\u76EE\u9078\u5B9A\u30B5\u30DD\u30FC\u30C8\u3067\u6F14\u76EE\u3092\u6E80\u305F\u3059 \u2192</a>'
              + '</div>';
          } else {
            el.innerHTML = "";
          }
          return;
        }

        var html = '<div class="gs-goal-card">';

        html += '<div class="gs-goal-top">';
        html += '<div class="gs-goal-title">' + esc(g.title || "\u516C\u6F14\u76EE\u6A19") + '</div>';
        if (canEdit()) {
          html += '<button class="gr-btn-edit" onclick="GS.showGoalForm()">\u7DE8\u96C6</button>';
        }
        html += '</div>';

        if (g.date) {
          var now = new Date(); now.setHours(0,0,0,0);
          var target = parseLocalDate(g.date);
          var diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

          html += '<div class="gs-goal-countdown">';
          if (diff > 0) {
            html += '<span class="gs-goal-days">' + diff + '</span>';
            html += '<span class="gs-goal-days-label">\u65E5\u5F8C\u304C\u516C\u6F14\u65E5</span>';
          } else if (diff === 0) {
            html += '<span class="gs-goal-days gs-goal-today">\u672C\u65E5\u516C\u6F14</span>';
          } else {
            html += '<span class="gs-goal-days gs-goal-done">\u516C\u6F14\u7D42\u4E86</span>';
          }
          html += '</div>';
        }

        html += '<div class="gs-goal-info">';
        if (g.date) {
          html += '<div class="gs-goal-date">&#128197; ' + dateLabel(g.date) + '</div>';
        }
        if (g.venue) {
          html += '<div class="gs-goal-venue">&#128205; ' + esc(g.venue) + '</div>';
        }
        html += '</div>';

        var plays = normalizePlays(g.plays);
        if (plays.length) {
          html += '<div class="gs-goal-plays">';
          html += '<div class="gs-goal-section-label">\u6F14\u76EE\u30FB\u914D\u5F79</div>';
          plays.forEach(function(p) {
            html += '<div class="gs-play-item">';
            html += '<div class="gs-play-name">&#127917; ' + esc(p.name) + '</div>';
            if (p.cast && p.cast.length) {
              html += '<div class="gs-play-cast">';
              html += p.cast.map(function(c) {
                return esc(c.role) + ': ' + esc(c.actor);
              }).join(' / ');
              html += '</div>';
            }
            html += '</div>';
          });
          html += '</div>';
        }

        html += '<a href="/groups/' + GID + '/enmoku-select" class="gs-enmoku-select-link">\u6F14\u76EE\u9078\u5B9A\u30B5\u30DD\u30FC\u30C8\u3092\u958B\u304F \u2192</a>';

        var perfTitle = g.title || "";
        var perfScripts = allScripts.filter(function(s) {
          return s.performance_tag === perfTitle && perfTitle;
        });

        html += '<div class="gs-goal-scripts">';
        html += '<div class="gs-goal-section-label">\u53F0\u672C</div>';
        if (perfScripts.length) {
          perfScripts.forEach(function(s) {
            var stClass = s.type === "pdf" ? "gs-stype-pdf" : s.type === "json" ? "gs-stype-json" : "gs-stype-text";
            var stLabel = s.type === "pdf" ? "PDF" : s.type === "json" ? "JSON" : "TEXT";
            html += '<a href="/groups/' + GID + '/scripts/' + esc(s.id) + '" class="gs-script-link">';
            html += '<span class="gs-script-inline-icon">' + (s.type === "pdf" ? "\\uD83D\\uDCC4" : "\\uD83D\\uDCD6") + '</span>';
            html += '<span class="gs-script-inline-name">' + esc(s.title || s.id) + '</span>';
            html += '<span class="gs-stype-badge ' + stClass + '">' + stLabel + '</span>';
            html += '</a>';
          });
        } else {
          html += '<p class="gs-scripts-empty">\u307E\u3060\u53F0\u672C\u306F\u767B\u9332\u3055\u308C\u3066\u3044\u307E\u305B\u3093</p>';
        }
        if (canEdit()) {
          html += '<div id="gs-script-upload-area"></div>';
          html += '<button class="gs-script-add-btn" onclick="GS.toggleScriptUpload()">+ \u53F0\u672C\u3092\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9</button>';
        }
        html += '<a href="/groups/' + GID + '/scripts" class="gs-scripts-all-link">\u5168\u3066\u306E\u53F0\u672C\u3092\u898B\u308B &rarr;</a>';
        html += '</div>';

        if (g.note) {
          html += '<div class="gs-goal-note">' + esc(g.note) + '</div>';
        }

        html += '</div>';
        el.innerHTML = html;
      }

      function renderPlayBlock(idx, p) {
        var castStr = (p.cast || []).map(function(c) {
          return c.role + ": " + c.actor;
        }).join("\\n");
        var html = '<div class="gs-play-block" data-idx="' + idx + '">';
        html += '<div class="gs-play-block-head">';
        html += '<input type="text" class="gsf-play-name" value="' + esc(p.name || "") + '" placeholder="\\u6F14\\u76EE\\u540D\\uFF08\\u4F8B: \\u7FA9\\u7D4C\\u5343\\u672C\\u685C\\uFF09">';
        html += '<button class="gs-play-del" data-idx="' + idx + '" onclick="GS.removePlayBlock(this.dataset.idx)">&times;</button>';
        html += '</div>';
        html += '<textarea class="gsf-play-cast" rows="2" placeholder="\\u914D\\u5F79\\uFF081\\u884C\\u306B1\\u3064\\u3001\\u4F8B: \\u72D0\\u5FE0\\u4FE1: \\u7530\\u4E2D\\uFF09">' + esc(castStr) + '</textarea>';
        html += '</div>';
        return html;
      }

      function showGoalForm() {
        var g = performanceGoal || {};
        var plays = normalizePlays(g.plays);
        if (!plays.length) plays = [{ name: "", cast: [] }];

        var html = '<div class="gr-form gs-goal-form-wrap">';
        html += '<h3 class="gr-form-title">\\u516C\\u6F14\\u76EE\\u6A19\\u3092\\u8A2D\\u5B9A</h3>';
        html += '<p class="gs-goal-form-hint">\\u6C7A\\u307E\\u3063\\u3066\\u3044\\u308B\\u9805\\u76EE\\u3060\\u3051\\u3067OK\\u3002\\u3042\\u3068\\u304B\\u3089\\u7DE8\\u96C6\\u3067\\u304D\\u307E\\u3059\\u3002</p>';

        html += '<div class="gr-form-row"><label>\\u516C\\u6F14\\u540D</label>'
          + '<input type="text" id="gsf-goal-title" value="' + esc(g.title || "") + '" placeholder="\\u4F8B: \\u4EE4\\u548C8\\u5E74 \\u6C17\\u826F\\u6B4C\\u821E\\u4F0E\\u516C\\u6F14"></div>';

        html += '<div class="gs-form-row2">';
        html += '<div class="gr-form-row"><label>\\u516C\\u6F14\\u65E5\\uFF08\\u672A\\u5B9A\\u3067\\u3082OK\\uFF09</label>'
          + '<input type="date" id="gsf-goal-date" value="' + esc(g.date || "") + '"></div>';
        html += '<div class="gr-form-row"><label>\\u4F1A\\u5834</label>'
          + '<input type="text" id="gsf-goal-venue" value="' + esc(g.venue || "") + '" placeholder="\\u4F8B: \\u6C17\\u826F\\u5EA7"></div>';
        html += '</div>';

        html += '<div class="gr-form-row gs-play-label-row"><label>\\u6F14\\u76EE\\u30FB\\u914D\\u5F79</label>'
          + '<a href="/groups/' + GID + '/enmoku-select" class="gs-enmoku-form-link" target="_blank">\\u6F14\\u76EE\\u9078\\u5B9A\\u30B5\\u30DD\\u30FC\\u30C8 &rarr;</a>'
          + '</div>';
        html += '<div id="gsf-plays-list">';
        plays.forEach(function(p, i) {
          html += renderPlayBlock(i, p);
        });
        html += '</div>';
        html += '<button class="btn btn-secondary btn-sm gs-add-play-btn" onclick="GS.addPlayBlock()">+ \\u6F14\\u76EE\\u3092\\u8FFD\\u52A0</button>';

        html += '<div class="gr-form-row" style="margin-top:12px"><label>\\u30E1\\u30E2</label>'
          + '<textarea id="gsf-goal-note" rows="2" placeholder="\\u4F55\\u3067\\u3082\\u81EA\\u7531\\u306B\\u66F8\\u3051\\u307E\\u3059">' + esc(g.note || "") + '</textarea></div>';

        html += '<div class="gr-form-actions">'
          + '<button class="btn btn-primary" onclick="GS.saveGoal()">\\u4FDD\\u5B58</button>'
          + '<button class="btn btn-secondary" onclick="GS.cancelGoalForm()">\\u30AD\\u30E3\\u30F3\\u30BB\\u30EB</button>';
        if (performanceGoal) {
          html += '<button class="btn btn-danger-outline gs-goal-clear" onclick="GS.clearGoal()">\\u30AF\\u30EA\\u30A2</button>';
        }
        html += '</div></div>';

        var el = document.getElementById("gs-goal");
        el.innerHTML = html;
        el.scrollIntoView({ behavior: "smooth" });
      }

      function saveGoal() {
        var title = document.getElementById("gsf-goal-title").value.trim();
        var date = document.getElementById("gsf-goal-date").value;
        var venue = document.getElementById("gsf-goal-venue").value.trim();
        var noteVal = document.getElementById("gsf-goal-note").value.trim();

        var playBlocks = document.querySelectorAll(".gs-play-block");
        var plays = [];
        playBlocks.forEach(function(block) {
          var name = block.querySelector(".gsf-play-name").value.trim();
          var castRaw = block.querySelector(".gsf-play-cast").value.trim();
          var cast = [];
          if (castRaw) {
            castRaw.split(/\\r?\\n/).forEach(function(line) {
              line = line.trim();
              if (!line) return;
              var sep = line.indexOf(":");
              if (sep < 0) sep = line.indexOf("\\uFF1A");
              if (sep >= 0) {
                cast.push({ role: line.slice(0, sep).trim(), actor: line.slice(sep + 1).trim() });
              } else {
                cast.push({ role: line, actor: "" });
              }
            });
          }
          if (name || cast.length) {
            plays.push({ name: name, cast: cast });
          }
        });

        if (!title && !date && !venue && !plays.length && !noteVal) {
          alert("\\u4F55\\u304B1\\u3064\\u4EE5\\u4E0A\\u5165\\u529B\\u3057\\u3066\\u304F\\u3060\\u3055\\u3044\\u3002");
          return;
        }

        var goal = {
          title: title,
          date: date,
          plays: plays,
          venue: venue,
          note: noteVal
        };

        var btn = document.querySelector(".gs-goal-form-wrap .btn-primary");
        if (btn) { btn.disabled = true; btn.textContent = "\\u4FDD\\u5B58\\u4E2D..."; }

        fetch("/api/groups/" + GID + "/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ performance_goal: goal })
        }).then(function(r) { return r.json(); })
          .then(function(data) {
            if (data.error) { alert("\\u4FDD\\u5B58\\u306B\\u5931\\u6557\\u3057\\u307E\\u3057\\u305F: " + data.error); if (btn) { btn.disabled = false; btn.textContent = "\\u4FDD\\u5B58"; } return; }
            performanceGoal = goal;
            render();
          })
          .catch(function() {
            alert("\\u901A\\u4FE1\\u30A8\\u30E9\\u30FC\\u304C\\u767A\\u751F\\u3057\\u307E\\u3057\\u305F\\u3002");
            if (btn) { btn.disabled = false; btn.textContent = "\\u4FDD\\u5B58"; }
          });
      }

      function clearGoal() {
        if (!confirm("\u516C\u6F14\u76EE\u6A19\u3092\u30AF\u30EA\u30A2\u3057\u307E\u3059\u304B\uFF1F")) return;
        fetch("/api/groups/" + GID + "/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ performance_goal: null })
        }).then(function(r) { return r.json(); })
          .then(function(data) {
            if (data.error) { alert("\u30AF\u30EA\u30A2\u306B\u5931\u6557\u3057\u307E\u3057\u305F: " + data.error); return; }
            performanceGoal = null;
            render();
          })
          .catch(function() { alert("\u901A\u4FE1\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002"); });
      }

      // ─── 台本インラインアップロード ─────────────────────────────────

      function toggleScriptUpload() {
        var area = document.getElementById("gs-script-upload-area");
        if (!area) return;
        if (area.innerHTML) { area.innerHTML = ""; return; }
        var g = performanceGoal || {};
        var html = '<div class="gs-sup-form">';

        // 著作権注意
        html += '<div class="gs-sup-copyright">'
          + '<div class="gs-sup-copyright-title">&#9888; 著作権について</div>'
          + '<p>台本には著作権が存在します。アップロード前に以下をご確認ください。</p>'
          + '<ul>'
          + '<li>自団体が作成・所有する台本、または著作権者から許諾を得た台本のみアップロードできます。</li>'
          + '<li>他団体・出版社等の台本を無断でアップロードすることは著作権侵害となる場合があります。</li>'
          + '<li>アップロードした台本の取り扱いについては、団体内で事前に合意を取ってください。</li>'
          + '</ul>'
          + '</div>';

        // 対応フォーマット＋非対応注意
        html += '<div class="gr-form-row">'
          + '<label>ファイル（.txt / .pdf / .json）</label>'
          + '<input type="file" id="gs-sup-file" accept=".txt,.pdf,.json" class="su-file-input">'
          + '<div class="gs-sup-format-note">'
          + '<span class="gs-sup-format-ok">✓ 対応: .txt .pdf .json</span>'
          + '<span class="gs-sup-format-ng">✗ 非対応: .doc .docx — WordはPDFに変換してからアップロードしてください</span>'
          + '</div>'
          + '</div>';

        html += '<div class="gr-form-row"><label>演目名</label>'
          + '<input type="text" id="gs-sup-title" placeholder="例: 義経千本桜"></div>';

        // 権利確認チェックボックス
        html += '<div class="su-rights-row">'
          + '<label class="su-rights-label">'
          + '<input type="checkbox" id="gs-sup-rights" class="su-rights-check">'
          + '<span>この台本のデジタル保存・団体内共有について著作権上の問題がないことを確認し、団体内で合意済みです</span>'
          + '</label></div>';

        html += '<div class="gr-form-actions" style="margin-top:10px;">'
          + '<button class="btn btn-primary btn-sm" onclick="GS.uploadScript()">アップロード</button>'
          + '<button class="btn btn-secondary btn-sm" onclick="GS.toggleScriptUpload()">キャンセル</button>'
          + '</div>';
        html += '<div id="gs-sup-status"></div>';
        html += '</div>';
        area.innerHTML = html;
      }

      function uploadScript() {
        var rightsCheck = document.getElementById("gs-sup-rights");
        if (!rightsCheck || !rightsCheck.checked) { alert("\\u6A29\\u5229\\u78BA\\u8A8D\\u306E\\u30C1\\u30A7\\u30C3\\u30AF\\u3092\\u5165\\u308C\\u3066\\u304F\\u3060\\u3055\\u3044\\u3002"); return; }
        var fileEl = document.getElementById("gs-sup-file");
        var file = fileEl && fileEl.files[0];
        if (!file) { alert("\\u30D5\\u30A1\\u30A4\\u30EB\\u3092\\u9078\\u629E\\u3057\\u3066\\u304F\\u3060\\u3055\\u3044\\u3002"); return; }
        if (file.size > 10 * 1024 * 1024) { alert("\\u30D5\\u30A1\\u30A4\\u30EB\\u30B5\\u30A4\\u30BA\\u304C10MB\\u3092\\u8D85\\u3048\\u3066\\u3044\\u307E\\u3059\\u3002"); return; }
        var g = performanceGoal || {};
        var title = (document.getElementById("gs-sup-title").value || "").trim();
        var fd = new FormData();
        fd.append("file", file);
        fd.append("title", title || file.name.replace(/\\.[^.]+$/, ""));
        fd.append("performance_tag", g.title || "");
        fd.append("perf_date", g.date || "");
        fd.append("perf_venue", g.venue || "");
        fd.append("visibility", "private");
        var btn = document.querySelector("#gs-script-upload-area .btn-primary");
        var status = document.getElementById("gs-sup-status");
        if (btn) { btn.disabled = true; btn.textContent = "\\u30A2\\u30C3\\u30D7\\u30ED\\u30FC\\u30C9\\u4E2D..."; }
        if (status) status.textContent = "";
        fetch("/api/groups/" + GID + "/scripts/upload", { method: "POST", body: fd })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (btn) { btn.disabled = false; btn.textContent = "\\u30A2\\u30C3\\u30D7\\u30ED\\u30FC\\u30C9"; }
            if (data.ok) {
              if (status) status.innerHTML = '<span style="color:var(--accent-3);">\\u30A2\\u30C3\\u30D7\\u30ED\\u30FC\\u30C9\\u5B8C\\u4E86\\uFF01</span>';
              reloadScripts();
            } else {
              if (status) status.innerHTML = '<span style="color:var(--accent-1);">\\u30A8\\u30E9\\u30FC: ' + esc(data.error || "\\u4E0D\\u660E") + '</span>';
            }
          })
          .catch(function(e) {
            if (btn) { btn.disabled = false; btn.textContent = "\\u30A2\\u30C3\\u30D7\\u30ED\\u30FC\\u30C9"; }
            if (status) status.innerHTML = '<span style="color:var(--accent-1);">\\u30A8\\u30E9\\u30FC: ' + e + '</span>';
          });
      }

      function reloadScripts() {
        fetch("/api/groups/" + GID + "/scripts")
          .then(function(r) { return r.json(); })
          .then(function(data) {
            allScripts = data.scripts || [];
            renderGoal();
          })
          .catch(function() {});
      }

      // ─── カレンダー ───────────────────────────────────────────────

      function renderCalendar() {
        var firstDay = new Date(calYear, calMonth, 1);
        var lastDay = new Date(calYear, calMonth + 1, 0);
        var daysInMonth = lastDay.getDate();
        var startDow = firstDay.getDay();

        var eventDates = {};
        schedules.forEach(function(s) {
          if (!s.date) return;
          var dt = parseLocalDate(s.date);
          if (dt.getFullYear() === calYear && dt.getMonth() === calMonth) {
            var day = dt.getDate();
            if (!eventDates[day]) eventDates[day] = [];
            eventDates[day].push(s.type || "その他");
          }
        });

        var monthNames = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
        var dowLabels = ["日","月","火","水","木","金","土"];
        var today = formatDate(new Date());

        var html = '<div class="gs-cal">';
        html += '<div class="gs-cal-nav">';
        html += '<button class="gs-cal-btn" onclick="GS.prevMonth()">&#8249;</button>';
        html += '<span class="gs-cal-title">' + calYear + '年' + monthNames[calMonth] + '</span>';
        html += '<button class="gs-cal-btn" onclick="GS.nextMonth()">&#8250;</button>';
        html += '</div>';

        html += '<div class="gs-cal-grid">';
        dowLabels.forEach(function(d, i) {
          var cls = "gs-cal-dow" + (i === 0 ? " gs-dow-sun" : i === 6 ? " gs-dow-sat" : "");
          html += '<div class="' + cls + '">' + d + '</div>';
        });

        for (var i = 0; i < startDow; i++) {
          html += '<div class="gs-cal-day gs-cal-empty"></div>';
        }

        for (var day = 1; day <= daysInMonth; day++) {
          var dateStr = calYear + "-" + padZ(calMonth+1) + "-" + padZ(day);
          var dow = (startDow + day - 1) % 7;
          var events = eventDates[day] || [];
          var isToday = dateStr === today;
          var isSelected = filterDate === dateStr;

          var cls = "gs-cal-day";
          if (dow === 0) cls += " gs-day-sun";
          if (dow === 6) cls += " gs-day-sat";
          if (isToday) cls += " gs-cal-today";
          if (isSelected) cls += " gs-cal-selected";
          if (events.length) cls += " gs-has-event";

          html += '<div class="' + cls + '" data-date="' + dateStr + '" onclick="GS.filterDay(this.dataset.date)">';
          html += '<span class="gs-day-num">' + day + '</span>';
          if (events.length) {
            html += '<div class="gs-dots">';
            events.slice(0, 3).forEach(function(type) {
              html += '<span class="gs-dot gs-dot-' + typeClass(type) + '"></span>';
            });
            html += '</div>';
          }
          html += '</div>';
        }
        html += '</div>';
        html += '</div>';

        if (filterDate) {
          html += '<div class="gs-filter-bar">&#128197; ' + dateLabel(filterDate) + ' でフィルター中'
            + ' <button class="gs-filter-clear" onclick="GS.clearFilter()">&#10005; 解除</button></div>';
        }

        document.getElementById("gs-calendar").innerHTML = html;
      }

      // ─── リスト ───────────────────────────────────────────────────

      function renderList() {
        var now = new Date();
        now.setHours(0, 0, 0, 0);

        var filtered = filterDate
          ? schedules.filter(function(s) { return s.date === filterDate; })
          : schedules;

        var sorted = filtered.slice().sort(function(a, b) {
          return (a.date || "").localeCompare(b.date || "");
        });

        var html = '<div class="gs-list-toolbar">';
        html += '<span class="gs-list-title">' + (filterDate ? dateLabel(filterDate) + 'の予定' : 'スケジュール一覧') + '</span>';
        if (canEdit()) {
          html += '<button class="btn btn-primary btn-sm" onclick="GS.showForm()">+ 追加</button>';
        }
        html += '</div>';

        html += '<div id="gs-form-area"></div>';

        if (!sorted.length) {
          html += '<div class="empty-state">スケジュールはまだありません。</div>';
        } else {
          var upcoming = sorted.filter(function(s) { return parseLocalDate(s.date) >= now; });
          var past = sorted.filter(function(s) { return parseLocalDate(s.date) < now; });

          if (upcoming.length) {
            html += '<div class="gs-section-label">今後の予定</div>';
            upcoming.forEach(function(s) { html += renderCard(s, false); });
          }
          if (past.length) {
            html += '<div class="gs-section-label gs-past-label">過去の予定</div>';
            past.slice().reverse().forEach(function(s) { html += renderCard(s, true); });
          }
        }

        document.getElementById("gs-list").innerHTML = html;
      }

      function renderCard(s, isPast) {
        var attendance = s.attendance || {};
        var myStatus = currentUser ? ((attendance[currentUser.userId] || {}).status || null) : null;

        var okCount = 0, maybeCount = 0, ngCount = 0;
        Object.keys(attendance).forEach(function(uid) {
          var st = (attendance[uid] || {}).status;
          if (st === "ok") okCount++;
          else if (st === "maybe") maybeCount++;
          else if (st === "ng") ngCount++;
        });

        var typeCls = "gs-type-" + typeClass(s.type || "その他");
        var timeStr = s.time_start || "";

        var html = '<div class="gs-card' + (isPast ? ' gs-card-past' : '') + '">';

        html += '<div class="gs-card-head">';
        html += '<div class="gs-card-date-wrap">';
        html += '<span class="gs-card-date">' + dateLabel(s.date) + '</span>';
        html += '<span class="gs-type-badge ' + typeCls + '">' + esc(s.type || "その他") + '</span>';
        html += '</div>';
        html += '<div class="gs-card-acts">';
        html += '<button class="gs-share-btn" data-id="' + esc(s.id) + '" onclick="GS.shareItem(this.dataset.id)" title="\u5171\u6709">'
          + '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C6.48 2 2 5.82 2 10.5c0 4.21 3.74 7.74 8.78 8.4.34.07.8.23.92.52.1.27.07.68.03.95l-.15.91c-.05.27-.21 1.07.94.58s6.27-3.69 8.56-6.32C22.89 13.47 22 11.5 22 10.5 22 5.82 17.52 2 12 2z"/></svg>'
          + ' \u5171\u6709</button>';
        if (canDelete(s)) {
          html += '<button class="gr-btn-edit" data-id="' + esc(s.id) + '" onclick="GS.editItem(this.dataset.id)">編集</button>';
          html += '<button class="gr-btn-del" data-id="' + esc(s.id) + '" onclick="GS.delItem(this.dataset.id)">削除</button>';
        }
        html += '</div>';
        html += '</div>';

        html += '<div class="gs-card-title">' + esc(s.title) + '</div>';

        if (timeStr || s.location) {
          html += '<div class="gs-card-meta">';
          if (timeStr) html += '<span class="gs-meta-item">&#128336; ' + timeStr + '</span>';
          if (s.location) html += '<span class="gs-meta-item">&#128205; ' + esc(s.location) + '</span>';
          html += '</div>';
        }

        if (s.note) {
          html += '<div class="gs-card-note">' + esc(s.note).replace(/\\n/g, "<br>") + '</div>';
        }

        html += '<div class="gs-attend-bar">';
        html += '<span class="gs-ac gs-ac-ok">&#9675; ' + okCount + '</span>';
        html += '<span class="gs-ac gs-ac-maybe">&#9651; ' + maybeCount + '</span>';
        html += '<span class="gs-ac gs-ac-ng">&#215; ' + ngCount + '</span>';
        html += '</div>';

        if (currentUser) {
          html += '<div class="gs-my-attend">';
          html += '<span class="gs-my-label">あなたの出欠:</span>';
          var labels = { ok: "○", maybe: "△", ng: "×" };
          ["ok", "maybe", "ng"].forEach(function(st) {
            var active = myStatus === st ? " gs-btn-active" : "";
            html += '<button class="gs-attend-btn gs-btn-' + st + active
              + '" data-id="' + esc(s.id) + '" data-status="' + st
              + '" onclick="GS.attend(this.dataset.id, this.dataset.status)">' + labels[st] + '</button>';
          });
          html += '</div>';
        }

        if (currentUser) {
          var memoTag = esc(s.title || '');
          var memoDate = esc(s.date || '');
          html += '<div class="gs-memo-link">'
            + '<a href="/groups/' + GID + '/notes?tag=' + encodeURIComponent(memoTag) + '&date=' + memoDate + '" class="gs-memo-btn">'
            + '\uD83D\uDCDD \u30E1\u30E2\u3092\u66F8\u304F</a>'
            + '</div>';
        }

        html += '</div>';
        return html;
      }

      // ─── フォーム ─────────────────────────────────────────────────

      function showForm(id) {
        var s = id ? schedules.find(function(x) { return x.id === id; }) : null;
        editingId = id || null;

        var typeOptions = ["稽古", "本番", "衣装合わせ", "会議", "その他"];

        var html = '<div class="gr-form">';
        html += '<h3 class="gr-form-title">' + (s ? 'スケジュールを編集' : '新しいスケジュール') + '</h3>';

        html += '<div class="gr-form-row"><label>タイトル <span class="req">*</span></label>'
          + '<input type="text" id="gsf-title" value="' + esc(s ? s.title : "") + '" placeholder="例: 第1回通し稽古"></div>';

        html += '<div class="gs-form-row2">';
        html += '<div class="gr-form-row"><label>日付 <span class="req">*</span></label>'
          + '<input type="date" id="gsf-date" value="' + esc(s ? s.date : "") + '"></div>';
        html += '<div class="gr-form-row"><label>種別</label><select id="gsf-type">';
        typeOptions.forEach(function(t) {
          html += '<option value="' + esc(t) + '"' + (s && s.type === t ? ' selected' : '') + '>' + esc(t) + '</option>';
        });
        html += '</select></div>';
        html += '</div>';

        html += '<div class="gr-form-row"><label>開始時刻</label><select id="gsf-start">';
        html += '<option value="">-- 未設定 --</option>';
        var curTime = s ? (s.time_start || "") : "";
        for (var h = 0; h < 24; h++) {
          for (var m = 0; m < 60; m += 30) {
            var tv = padZ(h) + ":" + padZ(m);
            html += '<option value="' + tv + '"' + (tv === curTime ? ' selected' : '') + '>' + tv + '</option>';
          }
        }
        html += '</select></div>';

        html += '<div class="gr-form-row"><label>場所</label>'
          + '<input type="text" id="gsf-loc" value="' + esc(s ? (s.location || "") : "") + '" placeholder="稽古場・会場名"></div>';

        html += '<div class="gr-form-row"><label>備考</label>'
          + '<textarea id="gsf-note" rows="3" placeholder="準備物・連絡事項など">' + esc(s ? (s.note || "") : "") + '</textarea></div>';

        html += '<div class="gr-form-actions">'
          + '<button class="btn btn-primary" onclick="GS.saveForm()">保存</button>'
          + '<button class="btn btn-secondary" onclick="GS.cancelForm()">キャンセル</button>'
          + '</div></div>';

        var area = document.getElementById("gs-form-area");
        area.innerHTML = html;
        area.scrollIntoView({ behavior: "smooth" });
      }

      function saveForm() {
        var title = document.getElementById("gsf-title").value.trim();
        var date = document.getElementById("gsf-date").value;
        if (!title) { alert("タイトルを入力してください。"); return; }
        if (!date) { alert("日付を入力してください。"); return; }

        var isNew = !editingId;
        var existing = editingId ? schedules.find(function(s) { return s.id === editingId; }) : null;

        var entry = {
          id: editingId || generateId(),
          title: title,
          date: date,
          type: document.getElementById("gsf-type").value,
          time_start: document.getElementById("gsf-start").value,
          location: document.getElementById("gsf-loc").value.trim(),
          note: document.getElementById("gsf-note").value.trim(),
          created_by: existing ? existing.created_by : (currentUser ? currentUser.userId : ""),
          created_at: existing ? existing.created_at : new Date().toISOString(),
          updated_at: new Date().toISOString(),
          attendance: existing ? (existing.attendance || {}) : {}
        };

        var btn = document.querySelector(".gr-form-actions .btn-primary");
        if (btn) { btn.disabled = true; btn.textContent = "保存中..."; }

        fetch("/api/groups/" + GID + "/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schedule: entry, isNew: isNew })
        }).then(function(r) { return r.json(); })
          .then(function(data) {
            if (data.error) { alert("保存に失敗しました: " + data.error); if (btn) { btn.disabled = false; btn.textContent = "保存"; } return; }
            var wasNew = isNew;
            if (editingId) {
              var idx = schedules.findIndex(function(s) { return s.id === editingId; });
              if (idx >= 0) schedules[idx] = entry; else schedules.push(entry);
            } else {
              schedules.push(entry);
            }
            editingId = null;
            document.getElementById("gs-form-area").innerHTML = "";
            render();
            showLineShareDialog(entry, wasNew);
          })
          .catch(function() {
            alert("通信エラーが発生しました。");
            if (btn) { btn.disabled = false; btn.textContent = "保存"; }
          });
      }

      function delItem(id) {
        if (!confirm("このスケジュールを削除しますか？")) return;
        fetch("/api/groups/" + GID + "/schedule/" + encodeURIComponent(id), {
          method: "DELETE"
        }).then(function(r) { return r.json(); })
          .then(function(data) {
            if (data.error) { alert("削除に失敗しました: " + data.error); return; }
            schedules = schedules.filter(function(s) { return s.id !== id; });
            render();
          })
          .catch(function() { alert("通信エラーが発生しました。"); });
      }

      function attend(id, status) {
        if (!currentUser) { alert("ログインが必要です。"); return; }
        var s = schedules.find(function(x) { return x.id === id; });
        if (!s) return;
        var current = ((s.attendance || {})[currentUser.userId] || {}).status;
        if (current === status) return;

        fetch("/api/groups/" + GID + "/schedule/" + encodeURIComponent(id) + "/attend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: status })
        }).then(function(r) { return r.json(); })
          .then(function(data) {
            if (data.error) { alert("回答に失敗しました: " + data.error); return; }
            s.attendance = s.attendance || {};
            s.attendance[currentUser.userId] = { status: status, note: "" };
            render();
          })
          .catch(function() { alert("通信エラーが発生しました。"); });
      }

      function buildShareText(s, isNew) {
        var dl = dateLabel(s.date);
        var timePart = s.time_start || "";
        var heading = isNew === false ? "\u3010\u7A3D\u53E4\u30B9\u30B1\u30B8\u30E5\u30FC\u30EB\u5909\u66F4\u3011" : "\u3010\u7A3D\u53E4\u30B9\u30B1\u30B8\u30E5\u30FC\u30EB\u3011";
        var parts = [
          heading,
          dl + (timePart ? " " + timePart : ""),
          s.title
        ];
        if (s.location) parts.push("\uD83D\uDCCD " + s.location);
        if (s.note) parts.push(s.note);
        parts.push("");
        parts.push("\u51FA\u6B20\u56DE\u7B54\u306F\u3053\u3061\u3089 \uD83D\uDC47");
        parts.push("https://kabukiplus.com/groups/" + GID + "/schedule");
        return parts.join("\\n");
      }

      function buildLineShareUrl(s, isNew) {
        return "https://line.me/R/share?text=" + encodeURIComponent(buildShareText(s, isNew));
      }

      function copyShareText(s, isNew) {
        var text = buildShareText(s, isNew);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function() {
            var btn = document.getElementById("gs-copy-btn");
            if (btn) { btn.textContent = "\u2713 \u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F"; btn.disabled = true; }
          }).catch(function() { fallbackCopy(text); });
        } else {
          fallbackCopy(text);
        }
      }

      function fallbackCopy(text) {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText = "position:fixed;opacity:0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); var btn = document.getElementById("gs-copy-btn"); if (btn) { btn.textContent = "\u2713 \u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F"; btn.disabled = true; } } catch(e) { alert("\u30B3\u30D4\u30FC\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002"); }
        document.body.removeChild(ta);
      }

      function showLineShareDialog(s, isNew) {
        var url = buildLineShareUrl(s, isNew);
        var overlay = document.createElement("div");
        overlay.className = "gs-share-overlay";
        overlay.addEventListener("click", function(e) {
          if (e.target === overlay || e.target.classList.contains("gs-share-close")) {
            overlay.remove();
          }
        });
        var title = isNew ? "\u4FDD\u5B58\u3057\u307E\u3057\u305F\uFF01" : "\u5909\u66F4\u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F\uFF01";
        var desc = isNew
          ? "\u30B0\u30EB\u30FC\u30D7LINE\u306B\u5171\u6709\u3057\u307E\u3059\u304B\uFF1F\\n\u30B9\u30DE\u30DB\u306F\u300CLINE\u306B\u5171\u6709\u300D\u3001PC\u306F\u300C\u30B3\u30D4\u30FC\u300D\u304C\u4FBF\u5229\u3067\u3059\u3002"
          : "\u5909\u66F4\u5185\u5BB9\u3092\u30B0\u30EB\u30FC\u30D7LINE\u306B\u5171\u6709\u3057\u307E\u3059\u304B\uFF1F\\n\u30B9\u30DE\u30DB\u306F\u300CLINE\u306B\u5171\u6709\u300D\u3001PC\u306F\u300C\u30B3\u30D4\u30FC\u300D\u304C\u4FBF\u5229\u3067\u3059\u3002";
        var shareEntry = JSON.stringify(s).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
        var shareIsNew = isNew ? "true" : "false";
        overlay.innerHTML = '<div class="gs-share-dialog">'
          + '<div class="gs-share-title">' + title + '</div>'
          + '<p class="gs-share-desc">' + desc + '</p>'
          + '<div class="gs-share-btns">'
          + '<a href="' + esc(url) + '" target="_blank" rel="noopener" class="gs-share-line-btn">'
          + '<svg viewBox="0 0 24 24" width="20" height="20" fill="#fff"><path d="M12 2C6.48 2 2 5.82 2 10.5c0 4.21 3.74 7.74 8.78 8.4.34.07.8.23.92.52.1.27.07.68.03.95l-.15.91c-.05.27-.21 1.07.94.58s6.27-3.69 8.56-6.32C22.89 13.47 22 11.5 22 10.5 22 5.82 17.52 2 12 2z"/></svg>'
          + ' LINE\u306B\u5171\u6709</a>'
          + '<button id="gs-copy-btn" class="gs-share-copy-btn">\uD83D\uDCCB \u30C6\u30AD\u30B9\u30C8\u3092\u30B3\u30D4\u30FC</button>'
          + '</div>'
          + '<button class="btn btn-secondary gs-share-close">\u9589\u3058\u308B</button>'
          + '</div>';
        document.body.appendChild(overlay);
        document.getElementById("gs-copy-btn").addEventListener("click", function() {
          copyShareText(s, isNew);
        });
      }

      function generateId() {
        if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
      }

      window.GS = {
        prevMonth: function() {
          calMonth--;
          if (calMonth < 0) { calMonth = 11; calYear--; }
          renderCalendar();
        },
        nextMonth: function() {
          calMonth++;
          if (calMonth > 11) { calMonth = 0; calYear++; }
          renderCalendar();
        },
        filterDay: function(d) {
          filterDate = filterDate === d ? null : d;
          render();
        },
        clearFilter: function() { filterDate = null; render(); },
        showForm: function() { showForm(null); },
        editItem: function(id) { showForm(id); },
        delItem: delItem,
        saveForm: saveForm,
        cancelForm: function() {
          editingId = null;
          var area = document.getElementById("gs-form-area");
          if (area) area.innerHTML = "";
        },
        attend: attend,
        shareItem: function(id) {
          var s = schedules.find(function(x){ return x.id === id; });
          if (s) showLineShareDialog(s);
        },
        showGoalForm: showGoalForm,
        saveGoal: saveGoal,
        cancelGoalForm: function() { renderGoal(); },
        clearGoal: clearGoal,
        toggleScriptUpload: toggleScriptUpload,
        uploadScript: uploadScript,
        addPlayBlock: function() {
          var list = document.getElementById("gsf-plays-list");
          if (!list) return;
          var idx = list.querySelectorAll(".gs-play-block").length;
          list.insertAdjacentHTML("beforeend", renderPlayBlock(idx, { name: "", cast: [] }));
        },
        removePlayBlock: function(idx) {
          var blocks = document.querySelectorAll(".gs-play-block");
          if (blocks.length <= 1) {
            var b0 = blocks[0];
            if (b0) { b0.querySelector(".gsf-play-name").value = ""; b0.querySelector(".gsf-play-cast").value = ""; }
            return;
          }
          var block = document.querySelector('.gs-play-block[data-idx="' + idx + '"]');
          if (block) block.remove();
        }
      };

      init();
    })();
    <\/script>
  `;

  return pageShell({
    title: `稽古スケジュール - ${g.name}`,
    subtitle: "スケジュール管理・出欠確認",
    bodyHTML,
    activeNav: "base",
    brand: "jikabuki",
    headExtra: `<style>
      /* ── 公演目標 ──────────────────────────────────── */
      .gs-goal-card {
        background: linear-gradient(135deg, var(--bg-card) 0%, var(--gold-soft, #fdf6e3) 100%);
        border: 2px solid var(--gold-light, #e6c94e);
        border-radius: var(--radius-md);
        padding: 20px;
        margin-bottom: 1rem;
        box-shadow: var(--shadow-md);
        text-align: center;
      }
      .gs-goal-top {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 8px;
      }
      .gs-goal-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 15px; font-weight: 700; color: var(--text-primary);
        text-align: left;
      }
      .gs-goal-countdown {
        padding: 12px 0 8px;
        display: flex; flex-direction: column; align-items: center; gap: 2px;
      }
      .gs-goal-days {
        font-family: 'Noto Serif JP', serif;
        font-size: 48px; font-weight: 900;
        color: var(--gold-dark, #a0850a);
        line-height: 1.1;
        letter-spacing: -0.02em;
      }
      .gs-goal-days-label {
        font-size: 13px; font-weight: 600;
        color: var(--text-secondary);
      }
      .gs-goal-today {
        font-size: 28px;
        color: var(--accent-1, #c62828);
      }
      .gs-goal-done {
        font-size: 20px;
        color: var(--text-tertiary);
      }
      .gs-goal-info {
        display: flex; justify-content: center; gap: 16px;
        font-size: 13px; color: var(--text-secondary);
        margin: 8px 0 4px; flex-wrap: wrap;
      }
      .gs-goal-plays {
        margin-top: 10px; text-align: left;
        padding: 10px 14px;
        background: rgba(255,255,255,0.6);
        border-radius: 8px;
      }
      .gs-goal-plays-label {
        font-size: 12px; font-weight: 600;
        color: var(--text-secondary);
        display: block; margin-bottom: 4px;
      }
      .gs-goal-play-list {
        margin: 0; padding: 0 0 0 18px;
        font-size: 14px; line-height: 1.8;
        color: var(--text-primary);
      }
      .gs-goal-play-list li {
        font-family: 'Noto Serif JP', serif;
        font-weight: 600;
      }
      .gs-goal-note {
        margin-top: 8px; font-size: 13px;
        color: var(--text-secondary); line-height: 1.6;
      }
      .gs-goal-empty {
        background: var(--bg-card);
        border: 2px dashed var(--border-medium);
        border-radius: var(--radius-md);
        padding: 24px 16px;
        text-align: center;
        margin-bottom: 1rem;
      }
      .gs-goal-empty-text {
        font-size: 14px; color: var(--text-secondary);
        margin: 0 0 12px;
      }
      .gs-goal-form-wrap {
        margin-bottom: 1rem;
      }
      .gs-goal-form-hint {
        font-size: 13px;
        color: var(--text-tertiary);
        margin: -8px 0 14px;
        line-height: 1.5;
      }
      .gs-goal-section-label {
        font-size: 11px; font-weight: 700;
        color: var(--text-tertiary);
        letter-spacing: 0.08em; text-transform: uppercase;
        margin-bottom: 8px; padding-bottom: 4px;
        border-bottom: 1px solid var(--border-light);
      }
      .gs-play-item { margin-bottom: 6px; }
      .gs-play-name {
        font-family: 'Noto Serif JP', serif;
        font-size: 14px; font-weight: 600;
        color: var(--text-primary);
      }
      .gs-play-cast {
        font-size: 12px; color: var(--text-secondary);
        margin: 2px 0 0 22px; line-height: 1.6;
      }
      .gs-goal-scripts {
        margin-top: 12px; padding: 12px 14px;
        background: rgba(255,255,255,0.6);
        border-radius: 8px;
        overflow: hidden;
      }
      .gs-script-link {
        display: flex; align-items: center; gap: 8px;
        padding: 8px 10px; margin-bottom: 4px;
        border-radius: 6px; text-decoration: none;
        color: var(--text-primary);
        transition: background 0.15s;
      }
      .gs-script-link:hover { background: var(--bg-subtle); text-decoration: none; }
      .gs-script-inline-icon { font-size: 18px; flex-shrink: 0; }
      .gs-script-inline-name {
        flex: 1; font-size: 13px; font-weight: 500;
        min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .gs-stype-badge {
        font-size: 9px; font-weight: 600; padding: 2px 6px;
        border-radius: 4px; letter-spacing: 0.5px;
        text-transform: uppercase; flex-shrink: 0;
      }
      .gs-stype-json { background: var(--accent-2-soft, #e3f2fd); color: var(--accent-2, #1565c0); }
      .gs-stype-text { background: var(--accent-3-soft, #e8f5e9); color: var(--accent-3, #2e7d32); }
      .gs-stype-pdf  { background: var(--accent-1-soft, #fce4ec); color: var(--accent-1, #c62828); }
      .gs-scripts-empty {
        font-size: 12px; color: var(--text-tertiary);
        margin: 4px 0 8px; padding: 0;
      }
      .gs-script-add-btn {
        display: block; width: 100%;
        padding: 8px; margin: 8px 0 4px;
        border: 1.5px dashed var(--border-medium);
        border-radius: 6px; background: none;
        color: var(--text-secondary); font-size: 13px;
        cursor: pointer; font-family: inherit;
        transition: all 0.15s;
      }
      .gs-script-add-btn:hover {
        border-color: var(--gold); color: var(--gold-dark);
      }
      .gs-scripts-all-link {
        display: block; text-align: center;
        font-size: 12px; color: var(--text-secondary);
        margin-top: 8px; text-decoration: none;
      }
      .gs-scripts-all-link:hover { color: var(--gold-dark); }
      .gs-play-label-row { display: flex; align-items: center; justify-content: space-between; }
      .gs-play-label-row label { margin-bottom: 0; }
      .gs-enmoku-form-link {
        font-size: 11px; font-weight: 600; padding: 3px 10px;
        border: 1px solid var(--gold-light); border-radius: 10px;
        background: var(--gold-soft, #fdf8ef); color: var(--gold-dark);
        text-decoration: none; transition: all 0.15s; white-space: nowrap; flex-shrink: 0;
      }
      .gs-enmoku-form-link:hover { background: var(--gold-dark); color: #fff; text-decoration: none; }
      .gs-enmoku-select-link {
        display: block; text-align: center; text-decoration: none;
        font-size: 12px; font-weight: 600;
        color: var(--gold-dark); margin: 8px 0 4px;
        padding: 6px 10px; border: 1px solid var(--gold-light);
        border-radius: 20px; transition: all 0.15s;
        background: var(--gold-soft, #fdf8ef);
      }
      .gs-enmoku-select-link:hover { background: var(--gold-dark); color: #fff; text-decoration: none; }
      .gs-enmoku-select-hint-link {
        display: block; margin-top: 10px; font-size: 12px;
        color: var(--text-tertiary); text-decoration: none; transition: color 0.15s;
      }
      .gs-enmoku-select-hint-link:hover { color: var(--gold-dark); text-decoration: none; }
      .gs-sup-form {
        margin-top: 8px; padding: 14px;
        border: 1px solid var(--border-light);
        border-radius: 8px; background: var(--bg-page);
        box-sizing: border-box; overflow: hidden;
      }
      .gs-sup-form .gr-form-row { overflow: hidden; }
      .gs-sup-form .gr-form-row input,
      .gs-sup-form .gr-form-row label span {
        overflow-wrap: break-word; word-wrap: break-word;
      }
      .gs-sup-copyright {
        background: #fef9e7;
        border: 1px solid #f9e29a;
        border-radius: 8px;
        padding: 12px 14px;
        margin-bottom: 14px;
        font-size: 12px;
        line-height: 1.7;
        color: var(--text-secondary);
      }
      .gs-sup-copyright-title {
        font-size: 13px;
        font-weight: 700;
        color: #a0850a;
        margin-bottom: 6px;
      }
      .gs-sup-copyright p { margin: 0 0 6px; }
      .gs-sup-copyright ul { margin: 0; padding-left: 18px; }
      .gs-sup-copyright li { margin-bottom: 3px; }
      .gs-sup-format-note {
        margin-top: 6px;
        display: flex;
        flex-direction: column;
        gap: 3px;
        font-size: 12px;
      }
      .gs-sup-format-ok { color: #27ae60; font-weight: 600; }
      .gs-sup-format-ng {
        color: #c0392b;
        font-weight: 600;
        background: #fdedec;
        padding: 4px 8px;
        border-radius: 4px;
        line-height: 1.5;
      }
      .su-rights-row {
        background: var(--bg-subtle); padding: 10px 12px; border-radius: 8px;
        margin-top: 8px; margin-bottom: 4px;
      }
      .su-rights-label {
        display: flex; align-items: flex-start; gap: 8px;
        cursor: pointer; font-size: 12px; line-height: 1.6; font-weight: normal;
        color: var(--text-primary); margin-bottom: 0;
      }
      .su-rights-check { flex-shrink: 0; margin-top: 3px; width: auto !important; }
      .gs-play-block {
        border: 1px solid var(--border-light);
        border-radius: 8px; padding: 10px 12px;
        margin-bottom: 8px; background: var(--bg-page);
      }
      .gs-play-block-head {
        display: flex; align-items: center; gap: 8px;
        margin-bottom: 6px;
      }
      .gs-play-block-head input { flex: 1; }
      .gs-play-del {
        width: 28px; height: 28px; border-radius: 4px;
        border: 1px solid var(--border-light);
        background: none; font-size: 16px; cursor: pointer;
        color: var(--text-tertiary); font-family: inherit;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; transition: all 0.15s;
      }
      .gs-play-del:hover { border-color: var(--accent-1); color: var(--accent-1); }
      .gsf-play-cast {
        width: 100%; padding: 8px 10px;
        border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm); font-size: 13px;
        font-family: inherit; background: var(--bg-page);
        color: var(--text-primary); box-sizing: border-box;
      }
      .gsf-play-cast:focus { border-color: var(--gold); outline: none; }
      .gs-add-play-btn { margin: 4px 0 8px; }
      .btn-danger-outline {
        background: none;
        border: 1px solid var(--accent-1, #c62828);
        color: var(--accent-1, #c62828);
        border-radius: var(--radius-sm, 6px);
        padding: 8px 14px;
        cursor: pointer; font-family: inherit;
        font-size: 13px; transition: all 0.15s;
      }
      .btn-danger-outline:hover {
        background: var(--accent-1, #c62828);
        color: #fff;
      }

      /* ── カレンダー ────────────────────────────────── */
      .gs-cal {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        padding: 16px;
        margin-bottom: 1rem;
        box-shadow: var(--shadow-sm);
      }
      .gs-cal-nav {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 12px;
      }
      .gs-cal-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 16px; font-weight: 700; color: var(--text-primary);
      }
      .gs-cal-btn {
        background: none; border: 1px solid var(--border-light);
        border-radius: 6px; cursor: pointer; padding: 4px 12px;
        font-size: 18px; color: var(--text-secondary); line-height: 1;
        font-family: inherit; transition: all 0.15s;
      }
      .gs-cal-btn:hover { border-color: var(--gold); color: var(--gold-dark); }
      .gs-cal-grid {
        display: grid; grid-template-columns: repeat(7, 1fr);
        gap: 2px;
      }
      .gs-cal-dow {
        text-align: center; font-size: 11px; font-weight: 600;
        color: var(--text-tertiary); padding: 4px 0;
      }
      .gs-dow-sun { color: var(--accent-1); }
      .gs-dow-sat { color: #4a90d9; }
      .gs-cal-day {
        min-height: 44px; padding: 4px 2px; text-align: center;
        border-radius: 6px; cursor: pointer; transition: background 0.1s;
        display: flex; flex-direction: column; align-items: center; gap: 2px;
      }
      .gs-cal-day:hover { background: var(--bg-subtle); }
      .gs-cal-empty { cursor: default; }
      .gs-cal-empty:hover { background: none; }
      .gs-day-num { font-size: 13px; color: var(--text-primary); line-height: 1.4; }
      .gs-day-sun .gs-day-num { color: var(--accent-1); }
      .gs-day-sat .gs-day-num { color: #4a90d9; }
      .gs-cal-today .gs-day-num {
        background: var(--gold); color: #fff;
        border-radius: 50%; width: 22px; height: 22px;
        display: flex; align-items: center; justify-content: center;
        font-weight: 700;
      }
      .gs-cal-selected { background: var(--gold-soft); }
      .gs-dots { display: flex; gap: 2px; justify-content: center; flex-wrap: wrap; }
      .gs-dot {
        width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
      }
      .gs-dot-keiko  { background: #4caf50; }
      .gs-dot-honban { background: var(--accent-1); }
      .gs-dot-isho   { background: #9c27b0; }
      .gs-dot-kaigi  { background: #ff9800; }
      .gs-dot-other  { background: var(--text-tertiary); }

      /* ── フィルターバー ──────────────────────────────── */
      .gs-filter-bar {
        font-size: 13px; color: var(--text-secondary);
        background: var(--gold-soft); border-radius: 8px;
        padding: 8px 14px; margin-bottom: 1rem;
        display: flex; align-items: center; gap: 10px;
      }
      .gs-filter-clear {
        background: none; border: 1px solid var(--gold);
        border-radius: 4px; font-size: 11px; padding: 2px 8px;
        cursor: pointer; color: var(--gold-dark); font-family: inherit;
      }

      /* ── リストツールバー ────────────────────────────── */
      .gs-list-toolbar {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 12px; gap: 10px;
      }
      .gs-list-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 15px; font-weight: 700; color: var(--text-primary);
      }
      .btn-sm { font-size: 13px; padding: 6px 14px; }
      .gs-section-label {
        font-size: 11px; font-weight: 700; color: var(--text-tertiary);
        letter-spacing: 0.08em; text-transform: uppercase;
        margin: 16px 0 8px; padding-bottom: 4px;
        border-bottom: 1px solid var(--border-light);
      }
      .gs-past-label { color: var(--text-tertiary); opacity: 0.7; }

      /* ── カード ─────────────────────────────────────── */
      .gs-card {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        padding: 14px 16px;
        margin-bottom: 10px;
        box-shadow: var(--shadow-sm);
      }
      .gs-card-past { opacity: 0.7; }
      .gs-card-head {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 6px;
      }
      .gs-card-date-wrap { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .gs-card-date { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
      .gs-card-acts { display: flex; gap: 6px; flex-shrink: 0; }
      .gs-card-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 16px; font-weight: 700; color: var(--text-primary);
        margin-bottom: 6px;
      }
      .gs-card-meta {
        display: flex; flex-wrap: wrap; gap: 12px;
        font-size: 13px; color: var(--text-secondary);
        margin-bottom: 8px;
      }
      .gs-meta-item { display: flex; align-items: center; gap: 3px; }
      .gs-card-note {
        font-size: 13px; color: var(--text-secondary);
        line-height: 1.7; margin-bottom: 10px;
        padding: 8px 10px;
        background: var(--bg-subtle); border-radius: 6px;
      }

      /* ── 種別バッジ ─────────────────────────────────── */
      .gs-type-badge {
        font-size: 10px; padding: 2px 8px;
        border-radius: 10px; font-weight: 600; white-space: nowrap;
      }
      .gs-type-keiko  { background: #e8f5e9; color: #2e7d32; }
      .gs-type-honban { background: #fce4ec; color: #c62828; }
      .gs-type-isho   { background: #f3e5f5; color: #6a1b9a; }
      .gs-type-kaigi  { background: #fff3e0; color: #e65100; }
      .gs-type-other  { background: var(--bg-subtle); color: var(--text-secondary); }

      /* ── 出欠バー ────────────────────────────────────── */
      .gs-attend-bar {
        display: flex; gap: 12px; margin-bottom: 8px;
        font-size: 13px; font-weight: 600;
      }
      .gs-ac { padding: 3px 8px; border-radius: 4px; }
      .gs-ac-ok    { background: #e8f5e9; color: #2e7d32; }
      .gs-ac-maybe { background: #fff8e1; color: #f57f17; }
      .gs-ac-ng    { background: #fafafa; color: #9e9e9e; }

      /* ── 出欠ボタン ─────────────────────────────────── */
      .gs-my-attend {
        display: flex; align-items: center; gap: 8px;
        margin-top: 4px; flex-wrap: wrap;
      }
      .gs-my-label { font-size: 12px; color: var(--text-secondary); }
      .gs-attend-btn {
        width: 40px; height: 32px; border-radius: 6px;
        border: 1.5px solid var(--border-medium);
        font-size: 15px; cursor: pointer; font-family: inherit;
        background: var(--bg-page); color: var(--text-secondary);
        transition: all 0.15s; font-weight: 600;
      }
      .gs-btn-ok.gs-btn-active    { background: #e8f5e9; border-color: #4caf50; color: #2e7d32; }
      .gs-btn-maybe.gs-btn-active { background: #fff8e1; border-color: #ffc107; color: #e65100; }
      .gs-btn-ng.gs-btn-active    { background: #fafafa; border-color: #9e9e9e; color: #616161; }
      .gs-attend-btn:hover        { border-color: var(--gold); }

      /* ── メモを書くボタン ────────────────────────────── */
      .gs-memo-link {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--border-light);
      }
      .gs-memo-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--gold-dark, #a0850a);
        text-decoration: none;
        padding: 4px 12px;
        border: 1px solid var(--gold-light, #e6c94e);
        border-radius: 16px;
        background: var(--gold-soft, #fdf6e3);
        transition: all 0.15s;
        font-family: inherit;
      }
      .gs-memo-btn:hover {
        background: var(--gold-dark, #a0850a);
        color: #fff;
        text-decoration: none;
      }

      /* ── 編集・削除ボタン ────────────────────────────── */
      .gr-btn-edit, .gr-btn-del {
        font-size: 11px; padding: 4px 10px;
        border: 1px solid var(--border-light);
        border-radius: 4px; cursor: pointer;
        background: var(--bg-card); color: var(--text-secondary);
        font-family: inherit; transition: all 0.15s;
      }
      .gr-btn-edit:hover { border-color: var(--gold); color: var(--gold-dark); }
      .gr-btn-del:hover  { border-color: var(--accent-1); color: var(--accent-1); }

      /* ── フォーム ────────────────────────────────────── */
      .gr-form {
        background: var(--bg-card); border: 2px solid var(--gold-light);
        border-radius: var(--radius-md); padding: 20px;
        margin-bottom: 1.5rem; box-shadow: var(--shadow-md);
      }
      .gr-form-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 16px; font-weight: 600; margin-bottom: 16px;
      }
      .gr-form-row { margin-bottom: 12px; }
      .gr-form-row label { display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; }
      .gr-form-row input:not([type="checkbox"]), .gr-form-row select, .gr-form-row textarea {
        width: 100%; padding: 9px 11px; border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm); font-size: 14px; font-family: inherit;
        background: var(--bg-page); color: var(--text-primary); box-sizing: border-box;
      }
      .gr-form-row input:not([type="checkbox"]):focus, .gr-form-row select:focus, .gr-form-row textarea:focus {
        border-color: var(--gold); outline: none;
      }
      .gs-form-row2 {
        display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
      }
      .gr-form-actions { display: flex; gap: 10px; margin-top: 16px; }
      .req { color: var(--accent-1); }

      /* ── フッター ────────────────────────────────────── */
      .gs-footer {
        text-align: center; padding-top: 1.5rem;
        border-top: 1px solid var(--border-light); margin-top: 1rem;
      }

      /* -- LINE共有ボタン（カード内） ---------------------- */
      .gs-share-btn {
        display: inline-flex; align-items: center; gap: 3px;
        font-size: 11px; padding: 4px 10px;
        border: 1px solid #06C755; border-radius: 4px;
        color: #06C755; background: #fff;
        text-decoration: none; font-family: inherit;
        transition: all 0.15s;
      }
      .gs-share-btn:hover {
        background: #06C755; color: #fff;
        text-decoration: none;
      }

      /* -- LINE共有ダイアログ ------------------------------ */
      .gs-share-overlay {
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(0,0,0,0.45);
        display: flex; align-items: center; justify-content: center;
        padding: 16px;
      }
      .gs-share-dialog {
        background: var(--bg-card, #fff);
        border-radius: 16px; padding: 28px 24px;
        max-width: 320px; width: 100%;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0,0,0,0.18);
        display: flex; flex-direction: column; gap: 14px;
      }
      .gs-share-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 18px; font-weight: 700;
        color: var(--text-primary);
      }
      .gs-share-desc {
        font-size: 13px; color: var(--text-secondary);
        margin: 0; line-height: 1.6;
      }
      .gs-share-line-btn {
        display: flex; align-items: center; justify-content: center; gap: 8px;
        padding: 12px 20px; border-radius: 8px;
        background: #06C755; color: #fff;
        font-size: 15px; font-weight: 600;
        text-decoration: none; border: none;
        transition: opacity 0.2s;
      }
      .gs-share-line-btn:hover { opacity: 0.85; color: #fff; text-decoration: none; }
      .gs-share-btns {
        display: flex; flex-direction: column; gap: 8px;
      }
      .gs-share-copy-btn {
        display: flex; align-items: center; justify-content: center; gap: 8px;
        padding: 12px 20px; border-radius: 8px;
        background: var(--bg-page, #f5f5f5); color: var(--text-primary, #333);
        font-size: 15px; font-weight: 600;
        border: 1.5px solid var(--border-medium, #ccc);
        cursor: pointer; font-family: inherit;
        transition: all 0.15s;
      }
      .gs-share-copy-btn:hover { border-color: var(--gold, #c8a84e); color: var(--gold-dark, #a0850a); }
      .gs-share-copy-btn:disabled { opacity: 0.7; cursor: default; }
      .gs-share-close { margin-top: 2px; }

      @media (max-width: 480px) {
        .gs-form-row2 { grid-template-columns: 1fr; }
        .gs-cal-day { min-height: 36px; padding: 2px 1px; }
        .gs-day-num { font-size: 11px; }
        .gs-dot { width: 4px; height: 4px; }
        .gs-cal { padding: 10px; }
        .gs-cal-title { font-size: 14px; }
        .gs-cal-dow { font-size: 10px; }
      }
    </style>`
  });
}
