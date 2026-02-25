// src/labo_quiz_page.js
// =========================================================
// LABO — クイズエディタ
// クイズデータ（quizzes.json）の追加・編集・削除
// =========================================================
import { pageShell } from "./web_layout.js";

export function laboQuizPageHTML({ googleClientId = "" } = {}) {
  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span><a href="/jikabuki/labo">LABO</a><span>›</span><span>クイズエディタ</span>
    </div>

    <section class="labo-intro fade-up">
      <h2 class="labo-title">クイズエディタ</h2>
      <p class="labo-desc">歌舞伎クイズの新規追加・編集・削除ができます。</p>
    </section>

    <!-- モード選択 -->
    <section class="labo-section fade-up" id="quiz-mode">
      <div class="labo-mode-grid">
        <button class="labo-mode-btn active" id="btn-list" onclick="QuizEditor.switchMode('list')">
          <span class="labo-mode-icon">📋</span>
          <span class="labo-mode-label">一覧・編集</span>
        </button>
        <button class="labo-mode-btn" id="btn-new" onclick="QuizEditor.switchMode('new')">
          <span class="labo-mode-icon">✏️</span>
          <span class="labo-mode-label">新規追加</span>
        </button>
        <button class="labo-mode-btn" id="btn-bulk" onclick="QuizEditor.switchMode('bulk')">
          <span class="labo-mode-icon">📦</span>
          <span class="labo-mode-label">一括JSON</span>
        </button>
      </div>
    </section>

    <!-- 権限なしバー -->
    <div class="labo-editor-request" id="quiz-editor-request" style="display:none">
      <div class="labo-request-inner">
        <span class="labo-request-icon">🔒</span>
        <div class="labo-request-text">
          <strong>編集には承認が必要です</strong>
          <span id="quiz-request-status">管理者に編集権限を申請してください。</span>
        </div>
        <button class="labo-btn labo-btn-secondary" id="quiz-request-btn" onclick="QuizEditor.requestAccess()">編集権限を申請</button>
      </div>
    </div>

    <div id="quiz-save-status" class="labo-save-status" style="display:none"></div>

    <!-- 一覧モード -->
    <section class="labo-section fade-up" id="quiz-list-section">
      <div class="quiz-list-header">
        <h3 class="labo-section-title">クイズ一覧 (<span id="quiz-total">0</span>問)</h3>
        <input type="text" id="quiz-search" class="labo-input" placeholder="問題文で検索…" oninput="QuizEditor.filterList()">
      </div>
      <div id="quiz-list" class="quiz-list">
        <div class="loading">読み込み中…</div>
      </div>
    </section>

    <!-- 新規追加 / 編集フォーム -->
    <section class="labo-section fade-up" id="quiz-form-section" style="display:none">
      <div class="labo-editor-header">
        <h3 class="labo-section-title" id="form-title">新規クイズ追加</h3>
        <div class="labo-editor-actions">
          <button class="labo-btn labo-btn-secondary" onclick="QuizEditor.switchMode('list')">← 一覧へ</button>
          <button class="labo-btn labo-btn-primary" onclick="QuizEditor.saveOne()">💾 保存</button>
        </div>
      </div>

      <div class="labo-field">
        <label class="labo-label">クイズID <span class="labo-required">*</span></label>
        <input type="number" id="f-quiz-id" class="labo-input" placeholder="例: 101（自動連番にする場合は空欄）">
        <span class="labo-hint">既存IDを指定すると上書きします。空欄で自動採番。</span>
      </div>

      <div class="labo-field">
        <label class="labo-label">問題文 <span class="labo-required">*</span></label>
        <textarea id="f-question" class="labo-textarea" rows="3" placeholder="例: 「見得を切る」の意味は？"></textarea>
      </div>

      <div class="labo-field">
        <label class="labo-label">選択肢（3つ） <span class="labo-required">*</span></label>
        <div class="quiz-choices-edit">
          <div class="quiz-choice-row">
            <span class="quiz-choice-num">①</span>
            <input type="text" id="f-choice-0" class="labo-input" placeholder="選択肢1">
            <label class="quiz-correct-label"><input type="radio" name="correct" value="0"> 正解</label>
          </div>
          <div class="quiz-choice-row">
            <span class="quiz-choice-num">②</span>
            <input type="text" id="f-choice-1" class="labo-input" placeholder="選択肢2">
            <label class="quiz-correct-label"><input type="radio" name="correct" value="1"> 正解</label>
          </div>
          <div class="quiz-choice-row">
            <span class="quiz-choice-num">③</span>
            <input type="text" id="f-choice-2" class="labo-input" placeholder="選択肢3">
            <label class="quiz-correct-label"><input type="radio" name="correct" value="2"> 正解</label>
          </div>
        </div>
      </div>

      <div class="labo-field">
        <label class="labo-label">解説</label>
        <textarea id="f-explanation" class="labo-textarea" rows="3" placeholder="正解の解説を入力（任意）"></textarea>
      </div>

      <div class="labo-editor-footer">
        <button class="labo-btn labo-btn-secondary" onclick="QuizEditor.switchMode('list')">← 一覧へ</button>
        <button class="labo-btn labo-btn-primary" onclick="QuizEditor.saveOne()">💾 保存</button>
      </div>
    </section>

    <!-- 一括JSONモード -->
    <section class="labo-section fade-up" id="quiz-bulk-section" style="display:none">
      <div class="labo-editor-header">
        <h3 class="labo-section-title">一括JSON編集</h3>
        <div class="labo-editor-actions">
          <button class="labo-btn labo-btn-secondary" onclick="QuizEditor.switchMode('list')">← 一覧へ</button>
          <button class="labo-btn labo-btn-primary" onclick="QuizEditor.saveBulk()">💾 一括保存</button>
        </div>
      </div>
      <p class="labo-hint" style="margin-bottom:8px;">
        quizzes.json の中身を直接編集できます。保存すると全データが上書きされます。
      </p>
      <textarea id="bulk-json" class="labo-textarea" rows="20" style="font-family:'Consolas','Courier New',monospace;font-size:12px;"></textarea>
      <div class="labo-editor-footer">
        <button class="labo-btn labo-btn-secondary" onclick="QuizEditor.switchMode('list')">← 一覧へ</button>
        <button class="labo-btn labo-btn-primary" onclick="QuizEditor.saveBulk()">💾 一括保存</button>
      </div>
    </section>

    <script>
    (function() {
      var quizData = [];
      var currentUser = null;
      var isEditorUser = false;
      var editingIndex = -1;

      function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

      function switchMode(mode) {
        document.querySelectorAll('.labo-mode-btn').forEach(function(b) { b.classList.remove('active'); });
        document.getElementById('quiz-list-section').style.display = 'none';
        document.getElementById('quiz-form-section').style.display = 'none';
        document.getElementById('quiz-bulk-section').style.display = 'none';
        hideSaveStatus();

        if (mode === 'list') {
          document.getElementById('btn-list').classList.add('active');
          document.getElementById('quiz-list-section').style.display = '';
          renderList(quizData);
        } else if (mode === 'new') {
          document.getElementById('btn-new').classList.add('active');
          document.getElementById('quiz-form-section').style.display = '';
          document.getElementById('form-title').textContent = '新規クイズ追加';
          clearForm();
          editingIndex = -1;
        } else if (mode === 'bulk') {
          document.getElementById('btn-bulk').classList.add('active');
          document.getElementById('quiz-bulk-section').style.display = '';
          document.getElementById('bulk-json').value = JSON.stringify(quizData, null, 2);
        }
      }

      function clearForm() {
        document.getElementById('f-quiz-id').value = '';
        document.getElementById('f-question').value = '';
        document.getElementById('f-choice-0').value = '';
        document.getElementById('f-choice-1').value = '';
        document.getElementById('f-choice-2').value = '';
        document.getElementById('f-explanation').value = '';
        var radios = document.querySelectorAll('input[name="correct"]');
        radios.forEach(function(r) { r.checked = false; });
        radios[0].checked = true;
      }

      function fillForm(q, idx) {
        editingIndex = idx;
        document.getElementById('f-quiz-id').value = q.quiz_id != null ? q.quiz_id : '';
        document.getElementById('f-question').value = q.question || '';
        var choices = q.choices || [];
        document.getElementById('f-choice-0').value = choices[0] || '';
        document.getElementById('f-choice-1').value = choices[1] || '';
        document.getElementById('f-choice-2').value = choices[2] || '';
        document.getElementById('f-explanation').value = q.explanation || '';
        var ai = q.answer_index != null ? Number(q.answer_index) : 0;
        var radios = document.querySelectorAll('input[name="correct"]');
        radios.forEach(function(r) { r.checked = (Number(r.value) === ai); });

        document.getElementById('form-title').textContent = '編集: ID ' + (q.quiz_id != null ? q.quiz_id : '(新規)');
        switchMode('edit_form');
        document.getElementById('quiz-form-section').style.display = '';
        document.querySelectorAll('.labo-mode-btn').forEach(function(b) { b.classList.remove('active'); });
      }

      /* ── データ読み込み ── */
      function loadData() {
        fetch('/api/quiz')
          .then(function(r) { return r.json(); })
          .then(function(data) {
            quizData = Array.isArray(data) ? data : (data && Array.isArray(data.list) ? data.list : []);
            document.getElementById('quiz-total').textContent = quizData.length;
            renderList(quizData);
          })
          .catch(function() {
            document.getElementById('quiz-list').innerHTML = '<div class="empty-state">クイズデータの読み込みに失敗しました。</div>';
          });
      }

      /* ── 一覧レンダ ── */
      function renderList(list) {
        var el = document.getElementById('quiz-list');
        document.getElementById('quiz-total').textContent = quizData.length;
        if (!list.length) {
          el.innerHTML = '<div class="empty-state">クイズがありません。</div>';
          return;
        }
        var h = '';
        list.forEach(function(q, i) {
          var realIdx = quizData.indexOf(q);
          var choices = q.choices || [];
          var ai = q.answer_index != null ? Number(q.answer_index) : 0;
          h += '<div class="quiz-item" data-idx="' + realIdx + '">';
          h += '<div class="quiz-item-header">';
          h += '<span class="quiz-item-id">ID: ' + esc(String(q.quiz_id != null ? q.quiz_id : '?')) + '</span>';
          h += '<div class="quiz-item-actions">';
          h += '<button class="labo-btn-small" onclick="QuizEditor.editQuiz(' + realIdx + ')">✏️ 編集</button>';
          h += '<button class="labo-btn-small quiz-del-btn" onclick="QuizEditor.deleteQuiz(' + realIdx + ')">🗑</button>';
          h += '</div>';
          h += '</div>';
          h += '<div class="quiz-item-question">' + esc(q.question || '') + '</div>';
          h += '<div class="quiz-item-choices">';
          var labels = ['①','②','③'];
          choices.forEach(function(c, ci) {
            h += '<span class="quiz-item-choice' + (ci === ai ? ' is-correct' : '') + '">' + labels[ci] + ' ' + esc(c) + '</span>';
          });
          h += '</div>';
          if (q.explanation) {
            h += '<div class="quiz-item-explanation">💡 ' + esc(q.explanation) + '</div>';
          }
          h += '</div>';
        });
        el.innerHTML = h;
      }

      function filterList() {
        var q = (document.getElementById('quiz-search').value || '').trim().toLowerCase();
        if (!q) { renderList(quizData); return; }
        var filtered = quizData.filter(function(item) {
          return (item.question || '').toLowerCase().indexOf(q) >= 0
            || String(item.quiz_id).indexOf(q) >= 0
            || (item.choices || []).some(function(c) { return c.toLowerCase().indexOf(q) >= 0; });
        });
        renderList(filtered);
      }

      /* ── 編集 ── */
      function editQuiz(idx) {
        if (idx < 0 || idx >= quizData.length) return;
        fillForm(quizData[idx], idx);
      }

      /* ── 削除 ── */
      function deleteQuiz(idx) {
        if (idx < 0 || idx >= quizData.length) return;
        var q = quizData[idx];
        if (!confirm('ID ' + (q.quiz_id != null ? q.quiz_id : '?') + ' のクイズを削除しますか？\\n「' + (q.question || '').substring(0,40) + '…」')) return;
        quizData.splice(idx, 1);
        saveAll('削除して保存中…');
      }

      /* ── フォーム → オブジェクト ── */
      function buildQuizFromForm() {
        var question = (document.getElementById('f-question').value || '').trim();
        if (!question) { showSaveStatus('問題文を入力してください', 'error'); return null; }

        var c0 = (document.getElementById('f-choice-0').value || '').trim();
        var c1 = (document.getElementById('f-choice-1').value || '').trim();
        var c2 = (document.getElementById('f-choice-2').value || '').trim();
        if (!c0 || !c1 || !c2) { showSaveStatus('選択肢を3つすべて入力してください', 'error'); return null; }

        var answerIndex = 0;
        var radios = document.querySelectorAll('input[name="correct"]');
        radios.forEach(function(r) { if (r.checked) answerIndex = Number(r.value); });

        var explanation = (document.getElementById('f-explanation').value || '').trim();

        var rawId = document.getElementById('f-quiz-id').value.trim();
        var quizId;
        if (rawId !== '') {
          quizId = Number(rawId);
        } else {
          var maxId = 0;
          quizData.forEach(function(q) {
            var id = Number(q.quiz_id);
            if (!isNaN(id) && id > maxId) maxId = id;
          });
          quizId = maxId + 1;
        }

        var obj = {
          quiz_id: quizId,
          question: question,
          choices: [c0, c1, c2],
          answer_index: answerIndex
        };
        if (explanation) obj.explanation = explanation;
        return obj;
      }

      /* ── 単体保存 ── */
      function saveOne() {
        if (!isEditorUser) { showSaveStatus('編集権限がありません。申請してください。', 'error'); return; }
        var obj = buildQuizFromForm();
        if (!obj) return;

        if (editingIndex >= 0) {
          quizData[editingIndex] = obj;
        } else {
          var existing = quizData.findIndex(function(q) { return q.quiz_id === obj.quiz_id; });
          if (existing >= 0) {
            if (!confirm('ID ' + obj.quiz_id + ' は既に存在します。上書きしますか？')) return;
            quizData[existing] = obj;
          } else {
            quizData.push(obj);
          }
        }

        saveAll('保存中…');
      }

      /* ── 一括保存 ── */
      function saveBulk() {
        if (!isEditorUser) { showSaveStatus('編集権限がありません。申請してください。', 'error'); return; }
        var raw = document.getElementById('bulk-json').value.trim();
        try {
          var parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) { showSaveStatus('JSONは配列である必要があります', 'error'); return; }
          quizData = parsed;
        } catch(e) {
          showSaveStatus('JSONパースエラー: ' + e.message, 'error');
          return;
        }
        saveAll('一括保存中…');
      }

      /* ── 全データ保存 ── */
      function saveAll(msg) {
        showSaveStatus(msg || '保存中…', 'info');
        fetch('/api/quiz', {
          method: 'PUT',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quizData)
        })
        .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
        .then(function(res) {
          if (res.ok && res.data.ok) {
            showSaveStatus('✅ 保存しました（' + quizData.length + '問）', 'success');
            switchMode('list');
          } else {
            showSaveStatus('❌ ' + (res.data.error || 'unknown error'), 'error');
          }
        })
        .catch(function(e) { showSaveStatus('❌ 通信エラー: ' + e, 'error'); });
      }

      /* ── ステータス ── */
      var _toastTimer = null;
      function showSaveStatus(msg, type) {
        var el = document.getElementById('quiz-save-status');
        el.style.display = '';
        el.className = 'labo-save-status labo-status-' + type;
        el.textContent = msg;
        var toast = document.getElementById('quiz-toast');
        if (!toast) {
          toast = document.createElement('div');
          toast.id = 'quiz-toast';
          document.body.appendChild(toast);
        }
        toast.className = 'labo-toast labo-toast-' + type;
        toast.textContent = msg;
        toast.style.display = '';
        toast.style.opacity = '1';
        if (_toastTimer) clearTimeout(_toastTimer);
        if (type === 'success' || type === 'error') {
          _toastTimer = setTimeout(function() {
            toast.style.opacity = '0';
            setTimeout(function() { toast.style.display = 'none'; }, 300);
          }, 3000);
        }
      }
      function hideSaveStatus() {
        var el = document.getElementById('quiz-save-status');
        if (el) el.style.display = 'none';
        var toast = document.getElementById('quiz-toast');
        if (toast) toast.style.display = 'none';
      }

      /* ── 権限申請 ── */
      function requestAccess() {
        fetch('/api/editor/request', { method: 'POST', credentials: 'same-origin' })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            var el = document.getElementById('quiz-request-status');
            if (data.ok) {
              if (data.status === 'already_approved') {
                isEditorUser = true;
                updateEditorUI();
                if (el) el.textContent = '承認済みです！';
              } else {
                if (el) el.textContent = '申請しました。承認をお待ちください。';
              }
              var btn = document.getElementById('quiz-request-btn');
              if (btn) btn.style.display = 'none';
            }
          })
          .catch(function() {});
      }

      function updateEditorUI() {
        var saveBtns = document.querySelectorAll('.labo-btn-primary');
        var delBtns = document.querySelectorAll('.quiz-del-btn');
        var requestBar = document.getElementById('quiz-editor-request');
        if (isEditorUser) {
          saveBtns.forEach(function(b) { b.style.display = ''; });
          delBtns.forEach(function(b) { b.style.display = ''; });
          if (requestBar) requestBar.style.display = 'none';
        } else {
          saveBtns.forEach(function(b) { b.style.display = 'none'; });
          delBtns.forEach(function(b) { b.style.display = 'none'; });
          if (requestBar) requestBar.style.display = '';
        }
      }

      /* ── 認証チェック ── */
      function checkAuth() {
        fetch('/api/auth/me', { credentials: 'same-origin' })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (data.loggedIn && data.user) {
              currentUser = data.user;
              isEditorUser = !!data.user.isEditor;
              updateEditorUI();
              if (!isEditorUser && data.user.editorRequested) {
                var statusEl = document.getElementById('quiz-request-status');
                if (statusEl) statusEl.textContent = '申請中です。承認をお待ちください。';
                var reqBtn = document.getElementById('quiz-request-btn');
                if (reqBtn) reqBtn.style.display = 'none';
              }
            } else {
              updateEditorUI();
            }
          })
          .catch(function() {});
      }

      checkAuth();
      loadData();

      window.QuizEditor = {
        switchMode: switchMode,
        filterList: filterList,
        editQuiz: editQuiz,
        deleteQuiz: deleteQuiz,
        saveOne: saveOne,
        saveBulk: saveBulk,
        requestAccess: requestAccess
      };
    })();
    </script>
  `;

  return pageShell({
    title: "LABO - クイズエディタ",
    subtitle: "歌舞伎クイズの追加・編集",
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
      .labo-section { margin-bottom: 24px; }
      .labo-section-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 16px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 12px;
      }
      .labo-mode-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }
      .labo-mode-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 16px 8px;
        background: var(--bg-card);
        border: 2px solid var(--border-light);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all 0.15s;
        font-family: inherit;
      }
      .labo-mode-btn:hover {
        border-color: var(--gold);
        background: var(--gold-soft, #fdf8ec);
      }
      .labo-mode-btn.active {
        border-color: var(--gold);
        background: var(--gold-soft, #fdf8ec);
        box-shadow: 0 0 0 1px var(--gold);
      }
      .labo-mode-icon { font-size: 24px; }
      .labo-mode-label { font-size: 13px; font-weight: 600; color: var(--text-primary); }

      /* 一覧ヘッダ */
      .quiz-list-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      .quiz-list-header .labo-section-title { margin: 0; white-space: nowrap; }
      .quiz-list-header .labo-input { flex: 1; }

      /* クイズアイテム */
      .quiz-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 600px;
        overflow-y: auto;
      }
      .quiz-item {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        padding: 14px 16px;
        transition: border-color 0.15s;
      }
      .quiz-item:hover {
        border-color: var(--gold-light, #e8d5a0);
      }
      .quiz-item-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .quiz-item-id {
        font-size: 11px;
        font-weight: 600;
        color: var(--text-tertiary);
        background: var(--bg-subtle);
        padding: 2px 8px;
        border-radius: 4px;
        font-family: monospace;
      }
      .quiz-item-actions {
        display: flex;
        gap: 6px;
      }
      .quiz-item-question {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        line-height: 1.6;
        margin-bottom: 8px;
      }
      .quiz-item-choices {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 6px;
      }
      .quiz-item-choice {
        font-size: 12px;
        padding: 3px 10px;
        border-radius: 16px;
        background: var(--bg-subtle);
        color: var(--text-secondary);
        border: 1px solid var(--border-light);
      }
      .quiz-item-choice.is-correct {
        background: rgba(76,175,80,0.12);
        color: #2e7d32;
        border-color: rgba(76,175,80,0.3);
        font-weight: 600;
      }
      .quiz-item-explanation {
        font-size: 12px;
        color: var(--text-tertiary);
        line-height: 1.5;
        padding: 6px 10px;
        background: var(--bg-subtle);
        border-radius: 6px;
      }

      /* 編集フォーム */
      .quiz-choices-edit {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .quiz-choice-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .quiz-choice-num {
        font-size: 16px;
        font-weight: 600;
        color: var(--gold);
        flex-shrink: 0;
        width: 24px;
        text-align: center;
      }
      .quiz-choice-row .labo-input { flex: 1; }
      .quiz-correct-label {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary);
        white-space: nowrap;
        cursor: pointer;
      }
      .quiz-correct-label input[type="radio"] {
        accent-color: #4CAF50;
      }
      .quiz-del-btn {
        background: rgba(231,76,60,0.08) !important;
        color: #e74c3c !important;
        border-color: rgba(231,76,60,0.2) !important;
      }
      .quiz-del-btn:hover {
        background: rgba(231,76,60,0.15) !important;
      }

      /* 共通 */
      .labo-editor-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
        flex-wrap: wrap;
        gap: 8px;
      }
      .labo-editor-actions { display: flex; gap: 8px; }
      .labo-editor-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid var(--border-light);
      }
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
      .labo-hint {
        font-size: 11px;
        color: var(--text-tertiary);
        margin-top: 4px;
        line-height: 1.5;
      }
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
      .labo-btn-small:hover {
        border-color: var(--gold);
        color: var(--gold-dark);
      }
      .labo-save-status {
        padding: 10px 14px;
        border-radius: var(--radius-sm);
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 12px;
      }
      .labo-status-info { background: #e8f4fd; color: #1a6fb5; }
      .labo-status-success { background: #e8f8e8; color: #1a7a2a; }
      .labo-status-error { background: #fde8e8; color: #b51a1a; }
      .labo-toast {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        z-index: 9000;
        transition: opacity 0.3s;
        pointer-events: none;
      }
      .labo-toast-info { background: #1a6fb5; color: #fff; }
      .labo-toast-success { background: #1a7a2a; color: #fff; }
      .labo-toast-error { background: #b51a1a; color: #fff; }

      .labo-editor-request { margin-bottom: 16px; }
      .labo-request-inner {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 18px;
        background: #fef3cd;
        border: 1px solid #f0d78c;
        border-radius: 10px;
        flex-wrap: wrap;
      }
      .labo-request-icon { font-size: 22px; flex-shrink: 0; }
      .labo-request-text {
        flex: 1; min-width: 200px;
        display: flex; flex-direction: column; gap: 2px;
      }
      .labo-request-text strong { font-size: 14px; color: #856404; }
      .labo-request-text span { font-size: 12px; color: #856404; }

      @media (max-width: 600px) {
        .labo-mode-grid { grid-template-columns: 1fr; }
        .quiz-list-header { flex-direction: column; align-items: stretch; }
        .quiz-choice-row { flex-wrap: wrap; }
      }
    </style>`
  });
}
