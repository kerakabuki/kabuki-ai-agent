// src/group_notes_page.js
// =========================================================
// 稽古メモ・参考動画 ページ — /groups/:groupId/notes
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";

export function groupNotesPageHTML(group) {
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
      <a href="/">トップ</a><span>&rsaquo;</span><a href="/jikabuki/base">BASE</a><span>&rsaquo;</span><a href="/jikabuki/gate/${gid}">${name}</a><span>&rsaquo;</span>稽古メモ
    </div>

    <div id="gn-app">
      <div class="loading">読み込み中...</div>
    </div>

    <script>
    (function(){
      var GID = "${gid}";
      var notes = [];
      var filter = "all";

      function esc(s) { return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

      function youtubeId(url) {
        if (!url) return null;
        var m = url.match(/(?:youtube\\.com\\/watch\\?v=|youtu\\.be\\/)([\\w-]+)/);
        return m ? m[1] : null;
      }

      function loadNotes() {
        fetch("/api/groups/" + GID + "/notes")
          .then(function(r){ return r.json(); })
          .then(function(data){ notes = data.notes || []; render(); checkUrlParams(); })
          .catch(function(){ notes = []; render(); checkUrlParams(); });
      }

      function render() {
        var app = document.getElementById("gn-app");
        var tags = {};
        notes.forEach(function(n){ (n.tags||[]).forEach(function(t){ tags[t] = (tags[t]||0)+1; }); });
        var tagKeys = Object.keys(tags).sort();

        var html = '<div class="gn-toolbar">'
          + '<button class="btn btn-primary" onclick="GN.showAdd()">+ メモを追加</button>'
          + '<span class="gn-count">' + notes.length + '件</span>'
          + '</div>';

        if (tagKeys.length) {
          html += '<div class="gn-tags">';
          html += '<button class="gn-tag' + (filter === "all" ? " gn-tag-active" : "") + '" onclick="GN.setFilter(\\'all\\')">すべて</button>';
          tagKeys.forEach(function(t){
            html += '<button class="gn-tag' + (filter === t ? " gn-tag-active" : "") + '" onclick="GN.setFilter(\\'' + esc(t) + '\\')">' + esc(t) + ' (' + tags[t] + ')</button>';
          });
          html += '</div>';
        }

        html += '<div id="gn-form-area"></div>';

        var filtered = filter === "all" ? notes : notes.filter(function(n){ return (n.tags||[]).indexOf(filter) >= 0; });
        var sorted = filtered.slice().sort(function(a,b){ return (b.created_at||"").localeCompare(a.created_at||""); });

        if (!sorted.length) {
          html += '<div class="empty-state">メモはまだありません。</div>';
        } else {
          sorted.forEach(function(note){
            var idx = notes.indexOf(note);
            var vid = youtubeId(note.video_url);
            html += '<div class="gn-card">'
              + '<div class="gn-card-header">'
              + '<div class="gn-card-date">' + esc(note.created_at ? note.created_at.slice(0,10) : "") + '</div>'
              + '<div class="gn-card-actions">'
              + '<button class="gr-btn-edit" onclick="GN.editNote(' + idx + ')">編集</button>'
              + '<button class="gr-btn-del" onclick="GN.delNote(' + idx + ')">削除</button>'
              + '</div></div>';
            if (note.tags && note.tags.length) {
              html += '<div class="gn-card-tags">';
              note.tags.forEach(function(t){ html += '<span class="gn-card-tag">' + esc(t) + '</span>'; });
              html += '</div>';
            }
            html += '<div class="gn-card-text">' + esc(note.text).replace(/\\n/g, "<br>") + '</div>';
            if (note.image_url) {
              html += '<div class="gn-card-image"><img src="' + esc(note.image_url) + '" alt="写真" loading="lazy"></div>';
            }
            if (note.video_url) {
              if (vid) {
                html += '<div class="gn-card-video"><iframe src="https://www.youtube.com/embed/' + vid + '" frameborder="0" allowfullscreen></iframe></div>';
              } else {
                html += '<div class="gn-card-link"><a href="' + esc(note.video_url) + '" target="_blank" rel="noopener">🔗 参考リンク</a></div>';
              }
            }
            html += '</div>';
          });
        }

        app.innerHTML = html;
      }

      function showForm(note, idx) {
        var isEdit = idx !== null && idx !== undefined;
        note = note || { text: "", tags: [], video_url: "", image_url: "" };
        var area = document.getElementById("gn-form-area");
        if (!area) { render(); area = document.getElementById("gn-form-area"); }

        /* 既存タグを収集 */
        var allTags = {};
        notes.forEach(function(n){ (n.tags||[]).forEach(function(t){ allTags[t] = true; }); });
        var currentTags = (note.tags || []).slice();
        var tagChipsHtml = '';
        var existingTags = Object.keys(allTags).sort();
        if (existingTags.length) {
          tagChipsHtml = '<div class="gnf-tag-chips">';
          existingTags.forEach(function(t) {
            var active = currentTags.indexOf(t) >= 0 ? ' gnf-tag-chip-active' : '';
            tagChipsHtml += '<button type="button" class="gnf-tag-chip' + active + '" onclick="GN.toggleTagChip(this,\\'' + esc(t) + '\\')">' + esc(t) + '</button>';
          });
          tagChipsHtml += '</div>';
        }

        var imagePreview = '';
        if (note.image_url) {
          imagePreview = '<div class="gnf-image-preview" id="gnf-image-preview"><img src="' + esc(note.image_url) + '" alt="プレビュー"><button type="button" class="gnf-image-remove" onclick="GN.removeImage()">✕</button></div>';
        } else {
          imagePreview = '<div class="gnf-image-preview" id="gnf-image-preview"></div>';
        }

        area.innerHTML = '<div class="gr-form">'
          + '<h3 class="gr-form-title">' + (isEdit ? 'メモを編集' : '新しいメモ') + '</h3>'
          + '<div class="gr-form-row"><label>メモ</label><textarea id="gnf-text" rows="5" placeholder="稽古で気づいたこと、参考情報など">' + esc(note.text||"") + '</textarea></div>'
          + '<div class="gr-form-row"><label>タグ</label>'
          + tagChipsHtml
          + '<input type="text" id="gnf-tags" value="' + esc(currentTags.join(", ")) + '" placeholder="カンマ区切りで入力、または上のボタンで追加"></div>'
          + '<div class="gr-form-row"><label>参考動画URL（YouTube等）</label><input type="text" id="gnf-video" value="' + esc(note.video_url||"") + '" placeholder="https://youtu.be/..."></div>'
          + '<div class="gr-form-row"><label>写真（任意）</label>'
          + '<input type="file" id="gnf-image-file" accept="image/jpeg,image/png,image/webp" style="display:none;" onchange="GN.uploadImage(this)">'
          + '<button type="button" class="btn btn-secondary" onclick="document.getElementById(\\'gnf-image-file\\').click()" style="font-size:13px;padding:6px 14px;">📷 写真を追加</button>'
          + '<span class="gnf-upload-status" id="gnf-upload-status"></span>'
          + imagePreview
          + '<input type="hidden" id="gnf-image-url" value="' + esc(note.image_url||"") + '">'
          + '</div>'
          + '<div class="gr-form-actions">'
          + '<button class="btn btn-primary" onclick="GN.saveForm(' + (isEdit ? idx : "null") + ')">保存</button>'
          + '<button class="btn btn-secondary" onclick="GN.cancelForm()">キャンセル</button>'
          + '</div></div>';
        area.scrollIntoView({ behavior: "smooth" });
      }

      function showToast(msg) {
        var existing = document.querySelector('.gn-toast');
        if (existing) existing.remove();
        var toast = document.createElement('div');
        toast.className = 'gn-toast';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(function() { toast.classList.add('gn-toast-hide'); }, 1800);
        setTimeout(function() { toast.remove(); }, 2200);
      }

      function saveForm(idx) {
        var imgUrlEl = document.getElementById("gnf-image-url");
        var entry = {
          text: document.getElementById("gnf-text").value.trim(),
          tags: document.getElementById("gnf-tags").value.split(",").map(function(s){ return s.trim(); }).filter(Boolean),
          video_url: document.getElementById("gnf-video").value.trim(),
          image_url: imgUrlEl ? imgUrlEl.value.trim() : "",
          created_at: (idx !== null && notes[idx]) ? notes[idx].created_at : new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        if (!entry.text) { alert("メモの内容を入力してください。"); return; }
        if (idx !== null && idx !== undefined && idx >= 0) {
          notes[idx] = entry;
        } else {
          notes.push(entry);
        }
        saveToServer();
        render();
        showToast('メモを保存しました');
      }

      function delNote(idx) {
        if (!confirm("このメモを削除しますか？")) return;
        notes.splice(idx, 1);
        saveToServer();
        render();
      }

      function saveToServer() {
        fetch("/api/groups/" + GID + "/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: notes })
        }).catch(function(e){ console.error("Save error:", e); });
      }

      function checkUrlParams() {
        var params = new URLSearchParams(window.location.search);
        var tag = params.get("tag");
        var date = params.get("date");
        if (tag || date) {
          var preset = { text: "", tags: [], video_url: "" };
          if (tag) preset.tags = [tag];
          if (date) {
            preset.tags = preset.tags || [];
            if (date && preset.tags.indexOf(date) < 0) {
              preset.tags.push(date);
            }
          }
          showForm(preset, null);
          if (window.history && window.history.replaceState) {
            window.history.replaceState({}, "", window.location.pathname);
          }
        }
      }

      window.GN = {
        showAdd: function(){ showForm(null, null); },
        editNote: function(idx){ showForm(notes[idx], idx); },
        delNote: delNote,
        saveForm: saveForm,
        cancelForm: function(){ var area = document.getElementById("gn-form-area"); if (area) area.innerHTML = ""; },
        setFilter: function(f){ filter = f; render(); },
        toggleTagChip: function(btn, tag) {
          var input = document.getElementById('gnf-tags');
          if (!input) return;
          var tags = input.value.split(",").map(function(s){ return s.trim(); }).filter(Boolean);
          var idx = tags.indexOf(tag);
          if (idx >= 0) {
            tags.splice(idx, 1);
            btn.classList.remove('gnf-tag-chip-active');
          } else {
            tags.push(tag);
            btn.classList.add('gnf-tag-chip-active');
          }
          input.value = tags.join(", ");
        },
        uploadImage: function(fileInput) {
          var file = fileInput.files && fileInput.files[0];
          if (!file) return;
          var statusEl = document.getElementById('gnf-upload-status');
          if (statusEl) { statusEl.textContent = 'アップロード中…'; statusEl.style.color = 'var(--text-tertiary)'; }
          var fd = new FormData();
          fd.append('file', file);
          fd.append('type', 'note');
          fetch('/api/groups/' + encodeURIComponent(GID) + '/images', {
            method: 'POST', credentials: 'same-origin', body: fd
          })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (data.url) {
              var urlInput = document.getElementById('gnf-image-url');
              if (urlInput) urlInput.value = data.url;
              if (statusEl) statusEl.textContent = '';
              var prev = document.getElementById('gnf-image-preview');
              if (prev) {
                prev.innerHTML = '<img src="' + data.url + '" alt="プレビュー"><button type="button" class="gnf-image-remove" onclick="GN.removeImage()">✕</button>';
              }
            } else {
              if (statusEl) { statusEl.textContent = 'エラー: ' + (data.error || '失敗'); statusEl.style.color = 'var(--accent-1)'; }
            }
            fileInput.value = '';
          })
          .catch(function(err) {
            if (statusEl) { statusEl.textContent = '通信エラー'; statusEl.style.color = 'var(--accent-1)'; }
            fileInput.value = '';
          });
        },
        removeImage: function() {
          var urlInput = document.getElementById('gnf-image-url');
          if (urlInput) urlInput.value = '';
          var prev = document.getElementById('gnf-image-preview');
          if (prev) prev.innerHTML = '';
        }
      };

      loadNotes();
    })();
    </script>
  `;

  return pageShell({
    title: `稽古メモ - ${g.name}`,
    subtitle: "気づきの記録＋参考URLリンク",
    bodyHTML,
    activeNav: "base",
    brand: "jikabuki",
    headExtra: `<style>
      .gn-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 1rem; }
      .gn-count { font-size: 13px; color: var(--text-tertiary); }
      .gn-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 1rem; }
      .gn-tag {
        font-size: 12px; padding: 5px 12px; border: 1px solid var(--border-light);
        border-radius: 20px; cursor: pointer; background: var(--bg-card);
        color: var(--text-secondary); font-family: inherit; transition: all 0.15s;
      }
      .gn-tag:hover { border-color: var(--gold); color: var(--gold-dark); }
      .gn-tag-active { background: var(--gold-soft); border-color: var(--gold); color: var(--gold-dark); font-weight: 600; }
      .gn-card {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        padding: 16px;
        margin-bottom: 10px;
        box-shadow: var(--shadow-sm);
      }
      .gn-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
      .gn-card-date { font-size: 12px; color: var(--text-tertiary); }
      .gn-card-actions { display: flex; gap: 6px; }
      .gn-card-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
      .gn-card-tag { font-size: 10px; padding: 2px 8px; background: var(--gold-soft); color: var(--gold-dark); border-radius: 4px; }
      .gn-card-text { font-size: 14px; line-height: 1.8; color: var(--text-primary); }
      .gn-card-video { margin-top: 12px; position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: var(--radius-sm); }
      .gn-card-video iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
      .gn-card-link { margin-top: 8px; }
      .gn-card-link a { font-size: 13px; color: var(--gold-dark); }
      .gr-btn-edit, .gr-btn-del {
        font-size: 11px; padding: 4px 10px; border: 1px solid var(--border-light);
        border-radius: 4px; cursor: pointer; background: var(--bg-card); color: var(--text-secondary);
        font-family: inherit; transition: all 0.15s;
      }
      .gr-btn-edit:hover { border-color: var(--gold); color: var(--gold-dark); }
      .gr-btn-del:hover { border-color: var(--accent-1); color: var(--accent-1); }
      .gr-form {
        background: var(--bg-card); border: 2px solid var(--gold-light);
        border-radius: var(--radius-md); padding: 20px; margin-bottom: 1.5rem; box-shadow: var(--shadow-md);
      }
      .gr-form-title { font-family: 'Noto Serif JP', serif; font-size: 16px; font-weight: 600; margin-bottom: 16px; }
      .gr-form-row { margin-bottom: 12px; }
      .gr-form-row label { display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; }
      .gr-form-row input, .gr-form-row textarea {
        width: 100%; padding: 10px 12px; border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm); font-size: 14px; font-family: inherit;
        background: var(--bg-page); color: var(--text-primary);
      }
      .gr-form-row input:focus, .gr-form-row textarea:focus { border-color: var(--gold); outline: none; }
      .gr-form-actions { display: flex; gap: 10px; margin-top: 16px; }

      /* ── トースト ── */
      .gn-toast {
        position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
        background: #333; color: #fff; padding: 10px 24px; border-radius: 8px;
        font-size: 14px; font-family: inherit; z-index: 9999;
        box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        animation: gnToastIn 0.25s ease-out;
      }
      .gn-toast-hide { opacity: 0; transition: opacity 0.3s; }
      @keyframes gnToastIn { from { opacity: 0; transform: translateX(-50%) translateY(12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

      /* ── タグオートコンプリート ── */
      .gnf-tag-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
      .gnf-tag-chip {
        font-size: 12px; padding: 4px 12px; border: 1px solid var(--border-light);
        border-radius: 16px; cursor: pointer; background: var(--bg-card);
        color: var(--text-secondary); font-family: inherit; transition: all 0.15s;
      }
      .gnf-tag-chip:hover { border-color: var(--gold); color: var(--gold-dark); }
      .gnf-tag-chip-active { background: var(--gold-soft); border-color: var(--gold); color: var(--gold-dark); font-weight: 600; }

      /* ── 画像アップロード ── */
      .gnf-upload-status { font-size: 12px; margin-left: 8px; }
      .gnf-image-preview { position: relative; display: inline-block; margin-top: 8px; }
      .gnf-image-preview img { max-width: 100%; max-height: 180px; border-radius: 6px; border: 1px solid var(--border-light); display: block; }
      .gnf-image-remove {
        position: absolute; top: 4px; right: 4px;
        background: rgba(0,0,0,0.6); color: #fff; border: none;
        border-radius: 50%; width: 22px; height: 22px;
        font-size: 13px; cursor: pointer; line-height: 22px; text-align: center;
      }
      .gn-card-image { margin-top: 10px; }
      .gn-card-image img { max-width: 100%; border-radius: 6px; border: 1px solid var(--border-light); }

      /* ── モバイル対応 ── */
      @media (max-width: 480px) {
        .gr-form { padding: 14px; }
        .gr-form-row input, .gr-form-row textarea { font-size: 16px; }
        .gn-card { padding: 12px; }
        .gn-card-text { font-size: 13px; }
        .gn-toolbar { flex-wrap: wrap; }
      }
    </style>`
  });
}
