// src/labo_glossary_page.js
// =========================================================
// LABO — 用語エディタ
// 歌舞伎用語辞典（glossary.json）の追加・編集・削除
// =========================================================
import { pageShell } from "./web_layout.js";

const CAT_LIST = [
  "演技・演出", "役柄", "舞台", "音・裏方",
  "家の芸", "ジャンル", "鑑賞", "衣装・小道具"
];

export function laboGlossaryPageHTML({ googleClientId = "" } = {}) {
  const catOptions = CAT_LIST.map(c => `<option value="${c}">${c}</option>`).join("");

  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span><a href="/jikabuki/labo">LABO</a><span>›</span><span>用語エディタ</span>
    </div>

    <section class="labo-intro fade-up">
      <h2 class="labo-title">用語エディタ</h2>
      <p class="labo-desc">歌舞伎用語辞典の追加・編集・削除ができます。</p>
    </section>

    <!-- 権限なし表示 -->
    <div id="ge-no-auth" style="display:none">
      <div class="labo-request-inner">
        <span class="labo-request-icon">🔒</span>
        <div class="labo-request-text">
          <strong>編集には承認が必要です</strong>
          <span>管理者に編集権限を申請してください。</span>
        </div>
        <button class="labo-btn-small" onclick="GlossaryEditor.requestAccess()">編集権限を申請</button>
      </div>
    </div>

    <!-- メイン（エディター権限あり） -->
    <div id="ge-main" style="display:none">

      <!-- ツールバー -->
      <div class="ge-toolbar fade-up">
        <input type="text" id="ge-search" class="labo-input" placeholder="用語名で絞り込み…" oninput="GlossaryEditor.filter()">
        <select id="ge-cat-filter" class="labo-input ge-cat-select" onchange="GlossaryEditor.filter()">
          <option value="">すべてのカテゴリ</option>
          ${catOptions}
        </select>
        <button class="labo-btn labo-btn-primary" onclick="GlossaryEditor.openAddModal()">＋ 用語を追加</button>
      </div>

      <!-- 用語一覧 -->
      <div id="ge-list" class="ge-list fade-up">
        <div class="loading">読み込み中…</div>
      </div>

    </div>

    <!-- 追加・編集モーダル -->
    <div id="ge-modal-overlay" class="ge-modal-overlay" style="display:none" onclick="if(event.target===this)GlossaryEditor.closeModal()">
      <div class="ge-modal">
        <div class="ge-modal-header">
          <h3 id="ge-modal-title">用語を追加</h3>
          <button class="labo-preview-close" onclick="GlossaryEditor.closeModal()">✕</button>
        </div>
        <div class="ge-modal-body">
          <div class="labo-field">
            <label class="labo-label">用語名 <span class="labo-required">*</span></label>
            <input type="text" id="ge-f-term" class="labo-input" placeholder="例: 見得">
          </div>
          <div class="labo-field">
            <label class="labo-label">よみがな</label>
            <input type="text" id="ge-f-reading" class="labo-input" placeholder="例: みえ">
          </div>
          <div class="labo-field">
            <label class="labo-label">カテゴリ <span class="labo-required">*</span></label>
            <select id="ge-f-cat" class="labo-input">
              ${catOptions}
            </select>
          </div>
          <div class="labo-field">
            <label class="labo-label">説明 <span class="labo-required">*</span></label>
            <textarea id="ge-f-desc" class="labo-textarea" rows="5" placeholder="用語の説明を入力…"></textarea>
          </div>
          <div id="ge-modal-status" class="labo-save-status" style="display:none"></div>
        </div>
        <div class="ge-modal-footer">
          <button class="labo-btn labo-btn-secondary" onclick="GlossaryEditor.closeModal()">キャンセル</button>
          <button class="labo-btn labo-btn-primary" onclick="GlossaryEditor.save()">💾 保存</button>
        </div>
      </div>
    </div>

    <script>
    (function() {
      var allTerms = [];
      var editingIndex = -1;
      var isEditorUser = false;

      function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

      /* ── 認証チェック ── */
      function checkAuth() {
        fetch('/api/auth/me', { credentials: 'same-origin' })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (data.loggedIn && data.user && (data.user.isEditor || data.user.isMaster)) {
              isEditorUser = true;
              document.getElementById('ge-main').style.display = '';
              document.getElementById('ge-no-auth').style.display = 'none';
              loadTerms();
            } else {
              document.getElementById('ge-no-auth').style.display = '';
              document.getElementById('ge-main').style.display = 'none';
            }
          })
          .catch(function() {
            document.getElementById('ge-no-auth').style.display = '';
          });
      }
      checkAuth();

      /* ── データ読み込み ── */
      function loadTerms() {
        var el = document.getElementById('ge-list');
        el.innerHTML = '<div class="loading">読み込み中…<\\/div>';
        fetch('/api/glossary')
          .then(function(r) { return r.json(); })
          .then(function(data) {
            allTerms = (data && data.terms) ? data.terms : (Array.isArray(data) ? data : []);
            renderList(allTerms);
          })
          .catch(function() {
            el.innerHTML = '<div class="empty-state">用語データの読み込みに失敗しました。</div>';
          });
      }

      /* ── 一覧表示 ── */
      function renderList(terms) {
        var el = document.getElementById('ge-list');
        if (!terms.length) {
          el.innerHTML = '<div class="empty-state">用語がありません。</div>';
          return;
        }

        var byCategory = {};
        terms.forEach(function(t) {
          var cat = t.category || '未分類';
          if (!byCategory[cat]) byCategory[cat] = [];
          byCategory[cat].push(t);
        });

        var html = '';
        Object.keys(byCategory).sort().forEach(function(cat) {
          html += '<div class="ge-cat-group">';
          html += '<div class="ge-cat-header">' + esc(cat) + ' <span class="ge-cat-count">' + byCategory[cat].length + '語</span></div>';
          byCategory[cat].forEach(function(t) {
            var idx = allTerms.indexOf(t);
            html += '<div class="ge-term-row">';
            html += '<div class="ge-term-main">';
            html += '<span class="ge-term-name">' + esc(t.term) + '</span>';
            if (t.reading) html += '<span class="ge-term-reading">（' + esc(t.reading) + '）</span>';
            html += '<p class="ge-term-desc">' + esc((t.desc || t.description || '').slice(0, 80)) + ((t.desc || t.description || '').length > 80 ? '…' : '') + '</p>';
            html += '</div>';
            html += '<div class="ge-term-actions">';
            html += '<button class="labo-btn-small" onclick="GlossaryEditor.openEditModal(' + idx + ')">編集</button>';
            html += '<button class="labo-btn-small ge-del-btn" onclick="GlossaryEditor.deleteTerm(' + idx + ')">削除</button>';
            html += '</div>';
            html += '</div>';
          });
          html += '</div>';
        });
        el.innerHTML = html;
      }

      /* ── フィルタ ── */
      function filter() {
        var q = (document.getElementById('ge-search').value || '').trim().toLowerCase();
        var cat = document.getElementById('ge-cat-filter').value;
        var filtered = allTerms.filter(function(t) {
          var matchQ = !q || (t.term||'').toLowerCase().indexOf(q) >= 0
            || (t.reading||'').toLowerCase().indexOf(q) >= 0
            || (t.desc||t.description||'').toLowerCase().indexOf(q) >= 0;
          var matchCat = !cat || t.category === cat;
          return matchQ && matchCat;
        });
        renderList(filtered);
      }

      /* ── モーダル ── */
      function openAddModal() {
        editingIndex = -1;
        document.getElementById('ge-modal-title').textContent = '用語を追加';
        document.getElementById('ge-f-term').value = '';
        document.getElementById('ge-f-reading').value = '';
        document.getElementById('ge-f-cat').value = '演技・演出';
        document.getElementById('ge-f-desc').value = '';
        hideModalStatus();
        document.getElementById('ge-modal-overlay').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        document.getElementById('ge-f-term').focus();
      }

      function openEditModal(idx) {
        var t = allTerms[idx];
        if (!t) return;
        editingIndex = idx;
        document.getElementById('ge-modal-title').textContent = '用語を編集';
        document.getElementById('ge-f-term').value = t.term || '';
        document.getElementById('ge-f-reading').value = t.reading || '';
        document.getElementById('ge-f-cat').value = t.category || '演技・演出';
        document.getElementById('ge-f-desc').value = t.desc || t.description || '';
        hideModalStatus();
        document.getElementById('ge-modal-overlay').style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }

      function closeModal() {
        document.getElementById('ge-modal-overlay').style.display = 'none';
        document.body.style.overflow = '';
      }

      /* ── 保存 ── */
      function save() {
        var term = (document.getElementById('ge-f-term').value || '').trim();
        var reading = (document.getElementById('ge-f-reading').value || '').trim();
        var cat = document.getElementById('ge-f-cat').value;
        var desc = (document.getElementById('ge-f-desc').value || '').trim();

        if (!term) { showModalStatus('用語名を入力してください', 'error'); return; }
        if (!desc) { showModalStatus('説明を入力してください', 'error'); return; }

        var newTerms = allTerms.slice();
        var entry = { term: term, reading: reading, category: cat, desc: desc };

        if (editingIndex >= 0) {
          newTerms[editingIndex] = entry;
        } else {
          var dup = newTerms.some(function(t) { return t.term === term; });
          if (dup) { showModalStatus('同じ用語名が既に存在します', 'error'); return; }
          newTerms.push(entry);
        }

        showModalStatus('保存中…', 'info');
        putGlossary(newTerms, function(ok, err) {
          if (ok) {
            allTerms = newTerms;
            closeModal();
            renderList(allTerms);
            showToast('保存しました', 'success');
          } else {
            showModalStatus('保存に失敗しました: ' + (err || ''), 'error');
          }
        });
      }

      /* ── 削除 ── */
      function deleteTerm(idx) {
        var t = allTerms[idx];
        if (!t) return;
        if (!confirm('「' + t.term + '」を削除しますか？')) return;
        var newTerms = allTerms.slice();
        newTerms.splice(idx, 1);
        putGlossary(newTerms, function(ok, err) {
          if (ok) {
            allTerms = newTerms;
            renderList(allTerms);
            showToast('削除しました', 'success');
          } else {
            showToast('削除に失敗しました: ' + (err || ''), 'error');
          }
        });
      }

      /* ── API: glossary.json を丸ごと PUT ── */
      function putGlossary(terms, cb) {
        fetch('/api/glossary', {
          method: 'PUT',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ terms: terms })
        })
        .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
        .then(function(res) {
          if (res.ok) { cb(true); }
          else { cb(false, res.data.error || 'unknown'); }
        })
        .catch(function(e) { cb(false, String(e)); });
      }

      /* ── 権限申請 ── */
      function requestAccess() {
        fetch('/api/editor/request', { method: 'POST', credentials: 'same-origin' })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (data.ok) {
              if (data.status === 'already_approved') {
                isEditorUser = true;
                document.getElementById('ge-main').style.display = '';
                document.getElementById('ge-no-auth').style.display = 'none';
                loadTerms();
              } else {
                alert('申請しました。承認をお待ちください。');
              }
            }
          })
          .catch(function() {});
      }

      /* ── ステータス表示 ── */
      function showModalStatus(msg, type) {
        var el = document.getElementById('ge-modal-status');
        el.style.display = '';
        el.className = 'labo-save-status labo-status-' + type;
        el.textContent = msg;
      }
      function hideModalStatus() {
        document.getElementById('ge-modal-status').style.display = 'none';
      }

      var _toastTimer = null;
      function showToast(msg, type) {
        var toast = document.getElementById('ge-toast');
        if (!toast) {
          toast = document.createElement('div');
          toast.id = 'ge-toast';
          document.body.appendChild(toast);
        }
        toast.className = 'labo-toast labo-toast-' + type;
        toast.textContent = msg;
        toast.style.display = '';
        toast.style.opacity = '1';
        if (_toastTimer) clearTimeout(_toastTimer);
        _toastTimer = setTimeout(function() {
          toast.style.opacity = '0';
          setTimeout(function() { toast.style.display = 'none'; }, 300);
        }, 3000);
      }

      window.GlossaryEditor = {
        filter: filter,
        openAddModal: openAddModal,
        openEditModal: openEditModal,
        closeModal: closeModal,
        save: save,
        deleteTerm: deleteTerm,
        requestAccess: requestAccess
      };
    })();
    </script>
  `;

  return pageShell({
    title: "LABO - 用語エディタ",
    subtitle: "歌舞伎用語辞典の編集",
    bodyHTML,
    activeNav: "labo",
    brand: "jikabuki",
    googleClientId,
    headExtra: `<style>
      .labo-intro {
        text-align: center;
        padding: 24px 16px 20px;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 20px;
      }
      .labo-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 20px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 8px;
      }
      .labo-desc {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.8;
      }

      /* ツールバー */
      .ge-toolbar {
        display: flex;
        gap: 10px;
        margin-bottom: 16px;
        flex-wrap: wrap;
        align-items: center;
      }
      .ge-toolbar .labo-input { flex: 1; min-width: 160px; }
      .ge-cat-select { flex: 0 0 auto; width: auto; min-width: 160px; }

      /* 用語一覧 */
      .ge-list { display: flex; flex-direction: column; gap: 12px; }
      .ge-cat-group {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        overflow: hidden;
      }
      .ge-cat-header {
        padding: 10px 16px;
        background: var(--bg-subtle);
        font-family: 'Noto Serif JP', serif;
        font-size: 14px;
        font-weight: 700;
        color: var(--text-primary);
        border-bottom: 1px solid var(--border-light);
      }
      .ge-cat-count {
        font-size: 12px;
        font-weight: 400;
        color: var(--text-tertiary);
        margin-left: 6px;
      }
      .ge-term-row {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-light);
      }
      .ge-term-row:last-child { border-bottom: none; }
      .ge-term-main { flex: 1; min-width: 0; }
      .ge-term-name {
        font-size: 15px;
        font-weight: 700;
        color: var(--text-primary);
      }
      .ge-term-reading {
        font-size: 12px;
        color: var(--text-tertiary);
        margin-left: 6px;
      }
      .ge-term-desc {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.6;
        margin: 4px 0 0;
      }
      .ge-term-actions {
        display: flex;
        gap: 6px;
        flex-shrink: 0;
        padding-top: 2px;
      }
      .ge-del-btn:hover { border-color: var(--accent-1) !important; color: var(--accent-1) !important; }

      /* モーダル */
      .ge-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 2000;
        background: rgba(0,0,0,.5);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .ge-modal {
        background: var(--bg-page);
        width: 100%;
        max-width: 520px;
        max-height: 90vh;
        border-radius: var(--radius-lg);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .ge-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid var(--border-light);
      }
      .ge-modal-header h3 {
        font-family: 'Noto Serif JP', serif;
        font-size: 17px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
      }
      .ge-modal-body {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
      }
      .ge-modal-footer {
        padding: 14px 20px;
        border-top: 1px solid var(--border-light);
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      /* 権限なし */
      .labo-request-inner {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 18px;
        background: #fef3cd;
        border: 1px solid #f0d78c;
        border-radius: var(--radius-md);
        flex-wrap: wrap;
        margin-bottom: 16px;
      }
      .labo-request-icon { font-size: 22px; flex-shrink: 0; }
      .labo-request-text {
        flex: 1; min-width: 200px;
        display: flex; flex-direction: column; gap: 2px;
      }
      .labo-request-text strong { font-size: 14px; color: #856404; }
      .labo-request-text span { font-size: 12px; color: #856404; }

      /* 共通部品 */
      .labo-field { margin-bottom: 16px; }
      .labo-label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: var(--text-secondary);
        margin-bottom: 4px;
      }
      .labo-required { color: var(--accent-1, #c0392b); }
      .labo-input {
        width: 100%;
        box-sizing: border-box;
        padding: 8px 12px;
        font-size: 14px;
        font-family: inherit;
        border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm);
        background: var(--bg-card);
        color: var(--text-primary);
        transition: border-color 0.15s;
      }
      .labo-input:focus { outline: none; border-color: var(--gold); }
      .labo-textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 10px 12px;
        font-size: 14px;
        font-family: inherit;
        border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm);
        background: var(--bg-card);
        color: var(--text-primary);
        resize: vertical;
        line-height: 1.7;
        transition: border-color 0.15s;
      }
      .labo-textarea:focus { outline: none; border-color: var(--gold); }
      .labo-btn {
        padding: 8px 20px;
        font-size: 14px;
        font-weight: 600;
        font-family: inherit;
        border: none;
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.15s;
      }
      .labo-btn-primary { background: var(--gold); color: #fff; }
      .labo-btn-primary:hover { background: var(--gold-dark); }
      .labo-btn-secondary {
        background: var(--bg-subtle);
        color: var(--text-secondary);
        border: 1px solid var(--border-light);
      }
      .labo-btn-secondary:hover {
        background: var(--gold-soft, #fdf8ec);
        border-color: var(--gold);
        color: var(--gold-dark);
      }
      .labo-btn-small {
        padding: 5px 14px;
        font-size: 12px;
        font-weight: 600;
        font-family: inherit;
        background: var(--bg-subtle);
        color: var(--text-secondary);
        border: 1px solid var(--border-light);
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .labo-btn-small:hover { border-color: var(--gold); color: var(--gold-dark); }
      .labo-save-status {
        padding: 10px 14px;
        border-radius: var(--radius-sm);
        font-size: 13px;
        font-weight: 600;
        margin-top: 12px;
      }
      .labo-status-info { background: #e8f4fd; color: #1a6fb5; }
      .labo-status-success { background: #e8f8e8; color: #1a7a2a; }
      .labo-status-error { background: #fde8e8; color: #b51a1a; }
      .labo-preview-close {
        background: none; border: none; font-size: 18px;
        color: var(--text-tertiary); cursor: pointer; padding: 4px 8px; border-radius: 6px;
      }
      .labo-preview-close:hover { background: var(--bg-subtle); }
      .labo-toast {
        position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
        padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2); z-index: 9000;
        transition: opacity 0.3s; pointer-events: none;
      }
      .labo-toast-success { background: #1a7a2a; color: #fff; }
      .labo-toast-error { background: #b51a1a; color: #fff; }

      @media (max-width: 600px) {
        .ge-toolbar { flex-direction: column; }
        .ge-toolbar .labo-input, .ge-cat-select { width: 100%; }
        .ge-term-row { flex-direction: column; gap: 8px; }
        .ge-term-actions { align-self: flex-end; }
      }
    </style>`
  });
}
