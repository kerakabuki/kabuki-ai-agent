// src/group_script_page.js
// =========================================================
// デジタル台本 — /groups/:groupId/scripts
// アップロード + 一覧 + JSON/テキスト/PDFビューア
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";

// ─── 共通CSS ───
const SHARED_CSS = `
  .gs-intro { font-size: 13px; color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.8; }
  .gs-script-list { display: flex; flex-direction: column; gap: 8px; }
  .gs-script-card {
    display: flex; align-items: center; gap: 14px; padding: 16px;
    background: var(--bg-card); border: 1px solid var(--border-light);
    border-radius: var(--radius-md); text-decoration: none; color: var(--text-primary);
    transition: all 0.15s; box-shadow: var(--shadow-sm);
  }
  .gs-script-card:hover { border-color: var(--gold); box-shadow: var(--shadow-md); text-decoration: none; }
  .gs-script-icon { font-size: 24px; flex-shrink: 0; }
  .gs-script-body { flex: 1; min-width: 0; }
  .gs-script-title { font-family: 'Noto Serif JP', serif; font-size: 15px; font-weight: 600; }
  .gs-script-play { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
  .gs-script-perf { font-size: 11px; color: var(--accent-1); margin-top: 2px; }
  .gs-script-memo { font-size: 11px; color: var(--text-secondary); margin-top: 3px; line-height: 1.5; }
  .gs-script-meta { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }
  .gs-script-arrow { color: var(--text-tertiary); font-size: 16px; margin-left: auto; flex-shrink: 0; }
  .gs-type-badge {
    font-size: 9px; font-weight: 600; padding: 2px 6px; border-radius: 4px;
    letter-spacing: 0.5px; text-transform: uppercase; flex-shrink: 0;
  }
  .gs-type-json { background: var(--accent-2-soft); color: var(--accent-2); }
  .gs-type-text { background: var(--accent-3-soft); color: var(--accent-3); }
  .gs-type-pdf  { background: var(--accent-1-soft); color: var(--accent-1); }
  .gs-shared-badge { font-size: 9px; background: var(--gold-soft); color: var(--gold-dark); padding: 2px 6px; border-radius: 4px; margin-left: 6px; }
  .gs-del-btn {
    font-size: 10px; color: var(--text-tertiary); background: none; border: 1px solid var(--border-light);
    border-radius: 4px; padding: 3px 8px; cursor: pointer; font-family: inherit; transition: all 0.15s; flex-shrink: 0;
  }
  .gs-del-btn:hover { border-color: var(--accent-1); color: var(--accent-1); }
`;

// ─── 台本一覧ページ (アップロードUI付き) ───
export function groupScriptListPageHTML(group, scripts) {
  if (!group) {
    return pageShell({
      title: "団体が見つかりません",
      bodyHTML: `<div class="empty-state">指定された団体は登録されていません。</div>`,
      brand: "jikabuki", activeNav: "jikabuki",
    });
  }

  const g = group;
  const name = escHTML(g.name || "");
  const gid = escHTML(g.group_id || "");

  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>&rsaquo;</span><a href="/jikabuki">JIKABUKI PLUS+</a><span>&rsaquo;</span><a href="/groups/${gid}">${name}</a><span>&rsaquo;</span>デジタル台本
    </div>

    <section class="fade-up">
      <p class="gs-intro">スマホ・タブレットで稽古に使えるデジタル台本です。演目名・場面はKABUKI PLUS+の演目ガイドと対応しています。</p>

      <div class="gs-toolbar">
        <button class="btn btn-primary" onclick="SU.toggleForm()">+ 台本をアップロード</button>
      </div>

      <div id="su-form-area" style="display:none;" class="su-form">
        <h3 class="su-form-title">台本をアップロード</h3>
        <div class="su-form-row">
          <label>ファイル（.txt / .pdf / .json）</label>
          <input type="file" id="su-file" accept=".txt,.pdf,.json" class="su-file-input">
        </div>
        <div class="su-form-row">
          <label>演目名</label>
          <input type="text" id="su-title" placeholder="例: 恋飛脚大和往来">
        </div>
        <div class="su-form-row">
          <label>場面</label>
          <input type="text" id="su-play" placeholder="例: 封印切">
        </div>
        <div class="su-form-row-half">
          <div class="su-form-row">
            <label>公演日（任意）</label>
            <input type="date" id="su-perf-date">
          </div>
          <div class="su-form-row">
            <label>公演場所（任意）</label>
            <input type="text" id="su-perf-venue" placeholder="例: 気良座">
          </div>
        </div>
        <div class="su-form-row">
          <label>備考メモ（任意）</label>
          <textarea id="su-memo" rows="2" placeholder="例: 2024年秋公演で使用。一部アレンジあり"></textarea>
        </div>
        <div class="su-form-row">
          <label>公開設定</label>
          <select id="su-visibility">
            <option value="private">非公開（自団体のみ）</option>
            <option value="shared">共有（台本共有ライブラリに公開）</option>
          </select>
        </div>
        <div class="su-form-actions">
          <button class="btn btn-primary" onclick="SU.upload()" id="su-upload-btn">アップロード</button>
          <button class="btn btn-secondary" onclick="SU.toggleForm()">キャンセル</button>
        </div>
        <div id="su-status" class="su-status"></div>
      </div>

      <div id="gs-list" class="gs-script-list">
        <div class="loading">読み込み中...</div>
      </div>
    </section>

    <div id="se-modal" class="se-overlay" style="display:none;" onclick="if(event.target===this)SU.closeEdit()">
      <div class="se-modal">
        <h3 class="se-modal-title">台本情報の編集</h3>
        <input type="hidden" id="se-id">
        <div class="su-form-row">
          <label>演目名</label>
          <input type="text" id="se-title">
        </div>
        <div class="su-form-row">
          <label>場面</label>
          <input type="text" id="se-play">
        </div>
        <div class="su-form-row-half">
          <div class="su-form-row">
            <label>公演日</label>
            <input type="date" id="se-perf-date">
          </div>
          <div class="su-form-row">
            <label>公演場所</label>
            <input type="text" id="se-perf-venue">
          </div>
        </div>
        <div class="su-form-row">
          <label>備考メモ</label>
          <textarea id="se-memo" rows="2"></textarea>
        </div>
        <div class="su-form-row">
          <label>公開設定</label>
          <select id="se-visibility">
            <option value="private">非公開（自団体のみ）</option>
            <option value="shared">共有（台本共有ライブラリに公開）</option>
          </select>
        </div>
        <div class="su-form-actions">
          <button class="btn btn-primary" onclick="SU.saveEdit()" id="se-save-btn">保存</button>
          <button class="btn btn-secondary" onclick="SU.closeEdit()">キャンセル</button>
        </div>
        <div id="se-status" class="su-status"></div>
      </div>
    </div>

    <script>
    (function(){
      var GID = "${gid}";

      function esc(s) { return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

      function loadList() {
        fetch("/api/groups/" + GID + "/scripts")
          .then(function(r){ return r.json(); })
          .then(function(data){
            var scripts = data.scripts || [];
            allScripts = scripts;
            var el = document.getElementById("gs-list");
            if (!scripts.length) {
              el.innerHTML = '<div class="empty-state">台本はまだ登録されていません。<br>上の「台本をアップロード」ボタンからファイルを追加してください。</div>';
              return;
            }
            el.innerHTML = scripts.map(function(s){
              var typeClass = s.type === "pdf" ? "gs-type-pdf" : s.type === "json" ? "gs-type-json" : "gs-type-text";
              var typeLabel = s.type === "pdf" ? "PDF" : s.type === "json" ? "JSON" : "TEXT";
              return '<div class="gs-script-card" style="cursor:default;">'
                + '<span class="gs-script-icon">' + (s.type === "pdf" ? "📄" : "📖") + '</span>'
                + '<a href="/groups/' + GID + '/scripts/' + esc(s.id) + '" class="gs-script-body" style="text-decoration:none;color:inherit;">'
                + '<div class="gs-script-title">' + esc(s.title || s.id) + '</div>'
                + (s.play ? '<div class="gs-script-play">' + esc(s.play) + '</div>' : '')
                + (s.perf_date || s.perf_venue ? '<div class="gs-script-perf">🎭 ' + (s.perf_date ? esc(s.perf_date) : '') + (s.perf_date && s.perf_venue ? ' / ' : '') + (s.perf_venue ? esc(s.perf_venue) : '') + '</div>' : '')
                + (s.memo ? '<div class="gs-script-memo">' + esc(s.memo) + '</div>' : '')
                + (s.uploaded_at ? '<div class="gs-script-meta">' + s.uploaded_at.slice(0,10) + '</div>' : '')
                + '</a>'
                + '<span class="gs-type-badge ' + typeClass + '">' + typeLabel + '</span>'
                + (s.visibility === "shared" ? '<span class="gs-shared-badge">共有</span>' : '<span class="gs-private-badge">非公開</span>')
                + '<div class="gs-card-actions">'
                + '<button class="gs-edit-btn" onclick="SU.openEdit(\\'' + esc(s.id) + '\\')">編集</button>'
                + '<button class="gs-del-btn" onclick="SU.del(\\'' + esc(s.id) + '\\')">削除</button>'
                + '</div>'
                + '</div>';
            }).join("");
          })
          .catch(function(){ document.getElementById("gs-list").innerHTML = '<div class="empty-state">読み込みに失敗しました。</div>'; });
      }

      var allScripts = [];

      window.SU = {
        toggleForm: function() {
          var area = document.getElementById("su-form-area");
          area.style.display = area.style.display === "none" ? "" : "none";
        },
        openEdit: function(id) {
          var s = allScripts.find(function(x){ return x.id === id; });
          if (!s) return;
          document.getElementById("se-id").value = s.id;
          document.getElementById("se-title").value = s.title || "";
          document.getElementById("se-play").value = s.play || "";
          document.getElementById("se-perf-date").value = s.perf_date || "";
          document.getElementById("se-perf-venue").value = s.perf_venue || "";
          document.getElementById("se-memo").value = s.memo || "";
          document.getElementById("se-visibility").value = s.visibility || "private";
          document.getElementById("se-status").textContent = "";
          document.getElementById("se-modal").style.display = "";
        },
        closeEdit: function() {
          document.getElementById("se-modal").style.display = "none";
        },
        saveEdit: function() {
          var id = document.getElementById("se-id").value;
          var body = {
            title: document.getElementById("se-title").value.trim(),
            play: document.getElementById("se-play").value.trim(),
            perf_date: document.getElementById("se-perf-date").value.trim(),
            perf_venue: document.getElementById("se-perf-venue").value.trim(),
            memo: document.getElementById("se-memo").value.trim(),
            visibility: document.getElementById("se-visibility").value
          };
          var btn = document.getElementById("se-save-btn");
          var st = document.getElementById("se-status");
          btn.disabled = true; btn.textContent = "保存中...";
          fetch("/api/groups/" + GID + "/scripts/" + encodeURIComponent(id), {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          })
          .then(function(r){ return r.json(); })
          .then(function(data){
            btn.disabled = false; btn.textContent = "保存";
            if (data.ok) {
              st.innerHTML = '<span style="color:var(--accent-3);">保存しました</span>';
              loadList();
              setTimeout(function(){ SU.closeEdit(); }, 600);
            } else {
              st.innerHTML = '<span style="color:var(--accent-1);">エラー: ' + esc(data.error || "不明") + '</span>';
            }
          })
          .catch(function(e){
            btn.disabled = false; btn.textContent = "保存";
            st.innerHTML = '<span style="color:var(--accent-1);">エラー: ' + e + '</span>';
          });
        },
        upload: function() {
          var fileEl = document.getElementById("su-file");
          var file = fileEl.files[0];
          if (!file) { alert("ファイルを選択してください。"); return; }
          if (file.size > 10 * 1024 * 1024) { alert("ファイルサイズが10MBを超えています。"); return; }

          var title = document.getElementById("su-title").value.trim();
          var play = document.getElementById("su-play").value.trim();
          var perfDate = document.getElementById("su-perf-date").value.trim();
          var perfVenue = document.getElementById("su-perf-venue").value.trim();
          var memo = document.getElementById("su-memo").value.trim();
          var vis = document.getElementById("su-visibility").value;
          var status = document.getElementById("su-status");
          var btn = document.getElementById("su-upload-btn");

          var fd = new FormData();
          fd.append("file", file);
          fd.append("title", title || file.name.replace(/\\.[^.]+$/, ""));
          fd.append("play", play);
          fd.append("perf_date", perfDate);
          fd.append("perf_venue", perfVenue);
          fd.append("memo", memo);
          fd.append("visibility", vis);

          btn.disabled = true;
          btn.textContent = "アップロード中...";
          status.textContent = "";

          fetch("/api/groups/" + GID + "/scripts/upload", { method: "POST", body: fd })
            .then(function(r){ return r.json(); })
            .then(function(data){
              btn.disabled = false;
              btn.textContent = "アップロード";
              if (data.ok) {
                status.innerHTML = '<span style="color:var(--accent-3);">アップロード完了！</span>';
                document.getElementById("su-file").value = "";
                document.getElementById("su-title").value = "";
                document.getElementById("su-play").value = "";
                document.getElementById("su-perf-date").value = "";
                document.getElementById("su-perf-venue").value = "";
                document.getElementById("su-memo").value = "";
                loadList();
              } else {
                status.innerHTML = '<span style="color:var(--accent-1);">エラー: ' + esc(data.error || "不明") + '</span>';
              }
            })
            .catch(function(e){
              btn.disabled = false;
              btn.textContent = "アップロード";
              status.innerHTML = '<span style="color:var(--accent-1);">エラー: ' + e + '</span>';
            });
        },
        del: function(id) {
          if (!confirm("この台本を削除しますか？")) return;
          fetch("/api/groups/" + GID + "/scripts/" + encodeURIComponent(id), { method: "DELETE" })
            .then(function(){ loadList(); })
            .catch(function(e){ alert("削除に失敗しました: " + e); });
        }
      };

      loadList();
    })();
    </script>
  `;

  return pageShell({
    title: `デジタル台本 - ${g.name}`,
    subtitle: "スマホ・タブレットで稽古に使える",
    bodyHTML,
    activeNav: "jikabuki",
    brand: "jikabuki",
    headExtra: `<style>
      ${SHARED_CSS}
      .gs-toolbar { margin-bottom: 1rem; }
      .su-form {
        background: var(--bg-card); border: 2px solid var(--gold-light);
        border-radius: var(--radius-md); padding: 20px; margin-bottom: 1.5rem;
        box-shadow: var(--shadow-md);
      }
      .su-form-title { font-family: 'Noto Serif JP', serif; font-size: 16px; font-weight: 600; margin-bottom: 16px; }
      .su-form-row { margin-bottom: 12px; }
      .su-form-row label { display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; }
      .su-form-row textarea {
        width: 100%; padding: 10px 12px; border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm); font-size: 14px; font-family: inherit;
        background: var(--bg-page); color: var(--text-primary); resize: vertical;
      }
      .su-form-row textarea:focus { border-color: var(--gold); outline: none; }
      .su-form-row input, .su-form-row select {
        width: 100%; padding: 10px 12px; border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm); font-size: 14px; font-family: inherit;
        background: var(--bg-page); color: var(--text-primary);
      }
      .su-form-row input:focus, .su-form-row select:focus { border-color: var(--gold); outline: none; }
      .su-file-input { padding: 8px !important; }
      .su-form-row-half { display: flex; gap: 12px; }
      .su-form-row-half .su-form-row { flex: 1; }
      @media (max-width: 480px) { .su-form-row-half { flex-direction: column; gap: 0; } }
      .su-form-actions { display: flex; gap: 10px; margin-top: 16px; }
      .su-status { margin-top: 8px; font-size: 13px; }
      .gs-card-actions { display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }
      .gs-edit-btn {
        font-size: 10px; color: var(--gold-dark); background: none; border: 1px solid var(--gold-light);
        border-radius: 4px; padding: 3px 8px; cursor: pointer; font-family: inherit; transition: all 0.15s;
      }
      .gs-edit-btn:hover { border-color: var(--gold); background: var(--gold-soft); }
      .gs-private-badge { font-size: 9px; background: var(--bg-subtle); color: var(--text-tertiary); padding: 2px 6px; border-radius: 4px; margin-left: 6px; }
      .se-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); z-index: 1000;
        display: flex; align-items: center; justify-content: center; padding: 16px;
      }
      .se-modal {
        background: var(--bg-card); border-radius: var(--radius-md);
        padding: 24px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      }
      .se-modal-title {
        font-family: 'Noto Serif JP', serif; font-size: 16px; font-weight: 600;
        margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--border-light);
      }
    </style>`
  });
}

// ─── JSON構造化ビューア（既存） ───
export function groupScriptViewerPageHTML(group, script) {
  if (!group || !script) {
    return pageShell({
      title: "台本が見つかりません",
      bodyHTML: `<div class="empty-state">指定された台本は登録されていません。</div>`,
      brand: "jikabuki", activeNav: "jikabuki",
    });
  }

  const g = group;
  const name = escHTML(g.name || "");
  const gid = escHTML(g.group_id || "");
  const s = script;

  const roles = [];
  (s.scenes || []).forEach(scene => {
    (scene.lines || []).forEach(line => {
      if (line.role && roles.indexOf(line.role) < 0) roles.push(line.role);
    });
  });

  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>&rsaquo;</span><a href="/groups/${gid}">${name}</a><span>&rsaquo;</span><a href="/groups/${gid}/scripts">台本</a><span>&rsaquo;</span>${escHTML(s.title || "")}
    </div>

    <div class="sv-controls fade-up">
      <label class="sv-role-label">自分の役：</label>
      <select id="sv-role-select" onchange="SV.setRole(this.value)">
        <option value="">（選択なし）</option>
        ${roles.map(r => `<option value="${escHTML(r)}">${escHTML(r)}</option>`).join("")}
      </select>
    </div>

    <div id="sv-content" class="fade-up-d1">
      ${(s.scenes || []).map((scene, si) => `
        <div class="sv-scene">
          <h3 class="sv-scene-title">${escHTML(scene.title || `第${si+1}場`)}</h3>
          ${scene.direction ? `<div class="sv-direction">${escHTML(scene.direction)}</div>` : ""}
          <div class="sv-lines">
            ${(scene.lines || []).map(line => {
              if (line.type === "direction") {
                return `<div class="sv-line sv-line-direction">${escHTML(line.text || "")}</div>`;
              }
              return `<div class="sv-line" data-role="${escHTML(line.role || "")}">
                <span class="sv-line-role">${escHTML(line.role || "")}</span>
                <span class="sv-line-text">${escHTML(line.text || "")}</span>
              </div>`;
            }).join("")}
          </div>
        </div>
      `).join("")}
    </div>

    <script>
    (function(){
      window.SV = {
        setRole: function(role) {
          var lines = document.querySelectorAll(".sv-line[data-role]");
          for (var i = 0; i < lines.length; i++) {
            if (!role) { lines[i].classList.remove("sv-highlight"); }
            else if (lines[i].getAttribute("data-role") === role) { lines[i].classList.add("sv-highlight"); }
            else { lines[i].classList.remove("sv-highlight"); }
          }
          try { localStorage.setItem("sv_role_${gid}", role); } catch(e) {}
        }
      };
      try {
        var saved = localStorage.getItem("sv_role_${gid}");
        if (saved) { document.getElementById("sv-role-select").value = saved; SV.setRole(saved); }
      } catch(e) {}
    })();
    </script>
  `;

  return pageShell({
    title: s.title || "台本",
    subtitle: s.play || "",
    bodyHTML,
    activeNav: "jikabuki",
    brand: "jikabuki",
    headExtra: `<style>
      .sv-controls {
        display: flex; align-items: center; gap: 10px;
        margin-bottom: 1.5rem; padding: 12px 16px;
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-md); box-shadow: var(--shadow-sm);
      }
      .sv-role-label { font-size: 13px; font-weight: 600; flex-shrink: 0; }
      #sv-role-select {
        padding: 8px 12px; border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm); font-size: 14px; font-family: inherit;
        background: var(--bg-page); color: var(--text-primary); flex: 1; max-width: 200px;
      }
      .sv-scene { margin-bottom: 2rem; }
      .sv-scene-title {
        font-family: 'Noto Serif JP', serif; font-size: 16px; font-weight: 600;
        color: var(--gold-dark); padding: 8px 0; border-bottom: 2px solid var(--gold-light);
        margin-bottom: 12px; letter-spacing: 1px;
      }
      .sv-direction {
        font-size: 13px; color: var(--text-tertiary); font-style: italic;
        padding: 6px 12px; margin-bottom: 8px; border-left: 3px solid var(--border-light);
      }
      .sv-lines { display: flex; flex-direction: column; }
      .sv-line {
        display: flex; gap: 12px; padding: 8px 12px;
        border-bottom: 1px solid var(--bg-subtle); transition: background 0.15s;
      }
      .sv-line:last-child { border-bottom: none; }
      .sv-line-direction {
        font-size: 13px; color: var(--text-tertiary); font-style: italic;
        padding-left: 2em; border-left: 3px solid var(--border-light);
      }
      .sv-line-role { font-size: 13px; font-weight: 600; color: var(--accent-1); min-width: 5em; flex-shrink: 0; }
      .sv-line-text { font-size: 15px; line-height: 1.8; }
      .sv-highlight { background: var(--gold-soft) !important; border-radius: 4px; }
      .sv-highlight .sv-line-role { color: var(--gold-dark); }
    </style>`
  });
}

// ─── テキスト台本ビューア ───
export function groupScriptTextViewerHTML(group, meta, content) {
  if (!group) {
    return pageShell({
      title: "台本が見つかりません",
      bodyHTML: `<div class="empty-state">指定された台本は登録されていません。</div>`,
      brand: "jikabuki", activeNav: "jikabuki",
    });
  }

  const g = group;
  const name = escHTML(g.name || "");
  const gid = escHTML(g.group_id || "");
  const title = escHTML(meta.title || meta.id);

  const lines = (content || "").split("\n");
  const numberedHTML = lines.map((line, i) =>
    `<div class="tv-line"><span class="tv-num">${i + 1}</span><span class="tv-text">${escHTML(line)}</span></div>`
  ).join("");

  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>&rsaquo;</span><a href="/groups/${gid}">${name}</a><span>&rsaquo;</span><a href="/groups/${gid}/scripts">台本</a><span>&rsaquo;</span>${title}
    </div>

    <div class="tv-header fade-up">
      <span class="gs-type-badge gs-type-text">TEXT</span>
      <span class="tv-info">${lines.length}行</span>
      ${meta.perf_date || meta.perf_venue ? `<span class="tv-perf">🎭 ${escHTML(meta.perf_date || "")}${meta.perf_date && meta.perf_venue ? " / " : ""}${escHTML(meta.perf_venue || "")}</span>` : ""}
      <a href="/api/groups/${gid}/scripts/${encodeURIComponent(meta.id)}/raw" download class="tv-download">ダウンロード</a>
    </div>
    ${meta.memo ? `<div class="tv-memo fade-up">${escHTML(meta.memo)}</div>` : ""}

    <div class="tv-content fade-up-d1">
      ${numberedHTML}
    </div>
  `;

  return pageShell({
    title: title,
    subtitle: meta.play || "",
    bodyHTML,
    activeNav: "jikabuki",
    brand: "jikabuki",
    headExtra: `<style>
      ${SHARED_CSS}
      .tv-header {
        display: flex; align-items: center; gap: 10px; margin-bottom: 1rem;
        padding: 10px 16px; background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-md); box-shadow: var(--shadow-sm);
      }
      .tv-info { font-size: 12px; color: var(--text-tertiary); }
      .tv-perf { font-size: 12px; color: var(--accent-1); }
      .tv-memo {
        font-size: 13px; color: var(--text-secondary); line-height: 1.7;
        padding: 10px 16px; margin-bottom: 1rem;
        background: var(--bg-subtle); border-radius: var(--radius-sm);
        border-left: 3px solid var(--gold-light);
      }
      .tv-download {
        margin-left: auto; font-size: 12px; color: var(--gold-dark);
        padding: 4px 12px; border: 1px solid var(--border-light); border-radius: 4px;
        text-decoration: none; transition: all 0.15s;
      }
      .tv-download:hover { border-color: var(--gold); background: var(--gold-soft); text-decoration: none; }
      .tv-content {
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-sm);
        font-family: 'Noto Sans JP', monospace; font-size: 14px; line-height: 1.9;
      }
      .tv-line { display: flex; border-bottom: 1px solid var(--bg-subtle); }
      .tv-line:last-child { border-bottom: none; }
      .tv-num {
        flex-shrink: 0; width: 3.5em; padding: 4px 8px; text-align: right;
        color: var(--text-tertiary); font-size: 11px; background: var(--bg-subtle);
        border-right: 1px solid var(--border-light); user-select: none;
      }
      .tv-text { padding: 4px 12px; white-space: pre-wrap; word-break: break-all; }
    </style>`
  });
}

// ─── PDF台本ビューア ───
export function groupScriptPdfViewerHTML(group, meta) {
  if (!group) {
    return pageShell({
      title: "台本が見つかりません",
      bodyHTML: `<div class="empty-state">指定された台本は登録されていません。</div>`,
      brand: "jikabuki", activeNav: "jikabuki",
    });
  }

  const g = group;
  const name = escHTML(g.name || "");
  const gid = escHTML(g.group_id || "");
  const title = escHTML(meta.title || meta.id);
  const rawUrl = `/api/groups/${gid}/scripts/${escHTML(meta.id)}/raw`;

  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>&rsaquo;</span><a href="/groups/${gid}">${name}</a><span>&rsaquo;</span><a href="/groups/${gid}/scripts">台本</a><span>&rsaquo;</span>${title}
    </div>

    <div class="pv-header fade-up">
      <span class="gs-type-badge gs-type-pdf">PDF</span>
      <span class="pv-title">${title}</span>
      ${meta.perf_date || meta.perf_venue ? `<span class="tv-perf">🎭 ${escHTML(meta.perf_date || "")}${meta.perf_date && meta.perf_venue ? " / " : ""}${escHTML(meta.perf_venue || "")}</span>` : ""}
      <a href="${rawUrl}" download class="tv-download">ダウンロード</a>
    </div>
    ${meta.memo ? `<div class="tv-memo fade-up">${escHTML(meta.memo)}</div>` : ""}

    <div class="pv-embed fade-up-d1">
      <iframe src="${rawUrl}" class="pv-iframe"></iframe>
    </div>

    <div class="pv-fallback fade-up-d2">
      <p>PDFが表示されない場合: <a href="${rawUrl}" target="_blank">新しいタブで開く</a></p>
    </div>
  `;

  return pageShell({
    title: title,
    subtitle: meta.play || "",
    bodyHTML,
    activeNav: "jikabuki",
    brand: "jikabuki",
    headExtra: `<style>
      ${SHARED_CSS}
      .pv-header {
        display: flex; align-items: center; gap: 10px; margin-bottom: 1rem;
        padding: 10px 16px; background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-md); box-shadow: var(--shadow-sm);
      }
      .pv-title { font-family: 'Noto Serif JP', serif; font-size: 15px; font-weight: 600; }
      .tv-download {
        margin-left: auto; font-size: 12px; color: var(--gold-dark);
        padding: 4px 12px; border: 1px solid var(--border-light); border-radius: 4px;
        text-decoration: none; transition: all 0.15s;
      }
      .tv-download:hover { border-color: var(--gold); background: var(--gold-soft); text-decoration: none; }
      .pv-embed {
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-sm);
      }
      .pv-iframe { width: 100%; height: 80vh; border: none; }
      .pv-fallback { text-align: center; margin-top: 1rem; font-size: 13px; color: var(--text-tertiary); }
    </style>`
  });
}
