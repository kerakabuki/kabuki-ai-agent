// src/labo_hub_page.js
// =========================================================
// LABO ハブ — コンテンツ制作ワークスペース
// 4つのエディタ（演目・用語・台本・台詞道場）へのナビゲーション
// =========================================================
import { pageShell } from "./web_layout.js";

export function laboHubPageHTML({ googleClientId = "" } = {}) {
  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span><span>LABO</span>
    </div>

    <!-- ウェルカムバー -->
    <section class="labo-hub-welcome fade-up">
      <div class="labo-hub-welcome-main">
        <div class="labo-hub-welcome-text">
          <h2 class="labo-hub-title">LABO</h2>
          <p class="labo-hub-subtitle">こうぼう</p>
        </div>
        <div class="labo-hub-user" id="labo-hub-user">
          <span class="labo-hub-user-name" id="hub-user-name">未ログイン</span>
          <button class="labo-btn-small" id="hub-login-btn" onclick="openLoginModal()">ログイン</button>
        </div>
      </div>
    </section>

    <!-- エディタカード -->
    <section class="labo-hub-section fade-up">
      <div class="labo-hub-grid">

        <a href="/jikabuki/labo/enmoku" class="labo-hub-card accent-1">
          <div class="labo-hub-card-icon">📖</div>
          <div class="labo-hub-card-body">
            <div class="labo-hub-card-title">演目エディタ</div>
            <div class="labo-hub-card-desc">演目ガイドの新規作成・編集</div>
          </div>
          <div class="labo-hub-card-arrow">›</div>
        </a>

        <a href="/jikabuki/labo/glossary" class="labo-hub-card accent-2">
          <div class="labo-hub-card-icon">📝</div>
          <div class="labo-hub-card-body">
            <div class="labo-hub-card-title">用語エディタ</div>
            <div class="labo-hub-card-desc">歌舞伎用語辞典の追加・編集</div>
          </div>
          <div class="labo-hub-card-arrow">›</div>
        </a>

        <a href="/jikabuki/labo/gate" class="labo-hub-card accent-4">
          <div class="labo-hub-card-icon">🏯</div>
          <div class="labo-hub-card-body">
            <div class="labo-hub-card-title">GATEエディタ</div>
            <div class="labo-hub-card-desc">団体GATEページの編集・管理</div>
          </div>
          <div class="labo-hub-card-arrow">›</div>
        </a>

        <a href="/jikabuki/labo/quiz" class="labo-hub-card accent-1">
          <div class="labo-hub-card-icon">👺</div>
          <div class="labo-hub-card-body">
            <div class="labo-hub-card-title">クイズエディタ</div>
            <div class="labo-hub-card-desc">歌舞伎クイズの追加・編集・管理</div>
          </div>
          <div class="labo-hub-card-arrow">›</div>
        </a>

        <a href="/kabuki/dojo/training/serifu/editor" class="labo-hub-card accent-admin">
          <div class="labo-hub-card-icon">🎭</div>
          <div class="labo-hub-card-body">
            <div class="labo-hub-card-title">台詞道場エディタ</div>
            <div class="labo-hub-card-desc">稽古用キューデータの作成・編集</div>
          </div>
          <div class="labo-hub-card-arrow">›</div>
        </a>

        <a href="https://kabuki-post-365.kerakabuki.workers.dev" target="_blank" class="labo-hub-card accent-3">
          <div class="labo-hub-card-icon">📅</div>
          <div class="labo-hub-card-body">
            <div class="labo-hub-card-title">POST 365</div>
            <div class="labo-hub-card-desc">SNS自動投稿の管理・テキスト生成</div>
          </div>
          <div class="labo-hub-card-arrow">↗</div>
        </a>

      </div>
    </section>

    <!-- エディター申請セクション（未ログイン or 非エディター向け） -->
    <section class="labo-hub-section fade-up" id="labo-editor-apply" style="display:none">
      <div class="labo-apply-card">
        <div class="labo-apply-icon">🔓</div>
        <div class="labo-apply-body">
          <h3 class="labo-apply-title">エディター権限について</h3>
          <p class="labo-apply-desc">
            LABOのコンテンツ編集（演目ガイド・用語集・クイズなど）には<strong>エディター権限</strong>が必要です。<br>
            ログイン後に申請すると、管理者の承認を経て編集が可能になります。
          </p>
          <div class="labo-apply-steps">
            <div class="labo-apply-step"><span class="labo-apply-step-num">1</span>ログイン（LINE / Google）</div>
            <div class="labo-apply-step"><span class="labo-apply-step-num">2</span>下のボタンで申請</div>
            <div class="labo-apply-step"><span class="labo-apply-step-num">3</span>管理者が承認 → 編集開始</div>
          </div>
          <div class="labo-apply-actions" id="labo-apply-actions">
            <button class="labo-btn labo-btn-primary" id="labo-apply-login-btn" onclick="openLoginModal()">ログインして申請する</button>
          </div>
          <div id="labo-apply-status" class="labo-apply-status"></div>
        </div>
      </div>
    </section>

    <!-- 管理セクション（エディター権限ユーザーのみ） -->
    <section class="labo-hub-section labo-hub-admin fade-up" id="labo-hub-admin" style="display:none">
      <div class="labo-hub-admin-header">
        <h3 class="labo-hub-section-title">管理</h3>
      </div>

      <div id="labo-pending-area"></div>

      <div class="labo-hub-admin-toggle">
        <button class="labo-hub-card accent-admin" id="btn-admin-open" onclick="LaboHub.toggleAdmin()">
          <div class="labo-hub-card-icon">👥</div>
          <div class="labo-hub-card-body">
            <div class="labo-hub-card-title">エディター管理</div>
            <div class="labo-hub-card-desc">編集権限の承認・団体作成の管理</div>
          </div>
          <div class="labo-hub-card-arrow" id="admin-arrow">›</div>
        </button>
      </div>

      <div id="labo-admin-panel" style="display:none">
        <div class="labo-admin-panel-inner">
          <div class="labo-admin-panel-header">
            <h4>エディター管理パネル</h4>
            <button class="labo-btn-small" onclick="LaboHub.toggleAdmin()">閉じる</button>
          </div>
          <div id="labo-admin-content">
            <div class="loading">読み込み中…</div>
          </div>
        </div>
      </div>
    </section>

    <script>
    (function() {
      var currentUser = null;
      var isEditorUser = false;

      function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

      function checkAuth() {
        fetch('/api/auth/me', { credentials: 'same-origin' })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (data.loggedIn && data.user) {
              currentUser = data.user;
              isEditorUser = !!data.user.isEditor;

              var nameEl = document.getElementById('hub-user-name');
              var loginBtn = document.getElementById('hub-login-btn');
              var userArea = document.getElementById('labo-hub-user');

              if (nameEl) {
                var badge = isEditorUser ? '<span class="labo-hub-role-badge editor">エディター</span>'
                  : data.user.editorRequested ? '<span class="labo-hub-role-badge pending">申請中</span>'
                  : '';
                var avatar = currentUser.pictureUrl
                  ? '<img src="' + esc(currentUser.pictureUrl) + '" class="labo-hub-avatar">'
                  : '<span class="labo-hub-avatar-placeholder">👤</span>';
                userArea.innerHTML = avatar
                  + '<span class="labo-hub-user-name">' + esc(currentUser.displayName || currentUser.email || 'ログイン済み') + '</span>'
                  + badge;
              }
              if (loginBtn) loginBtn.style.display = 'none';

              var applySection = document.getElementById('labo-editor-apply');
              if (isEditorUser) {
                if (applySection) applySection.style.display = 'none';
                if (currentUser.isMaster) {
                  var adminSection = document.getElementById('labo-hub-admin');
                  if (adminSection) adminSection.style.display = '';
                  checkPendingRequests();
                }
              } else {
                if (applySection) applySection.style.display = '';
                var actions = document.getElementById('labo-apply-actions');
                var statusEl = document.getElementById('labo-apply-status');
                if (data.user.editorRequested) {
                  if (actions) actions.innerHTML = '<span class="labo-apply-requested">申請済み — 承認をお待ちください</span>';
                } else {
                  if (actions) actions.innerHTML = '<button class="labo-btn labo-btn-primary" onclick="LaboHub.requestEditor()">エディター権限を申請する</button>';
                }
              }
            } else {
              var applySection2 = document.getElementById('labo-editor-apply');
              if (applySection2) applySection2.style.display = '';
            }
          })
          .catch(function() {});
      }
      checkAuth();

      /* ── 未承認申請チェック ── */
      function checkPendingRequests() {
        var editorP = fetch('/api/editor/list', { credentials: 'same-origin' }).then(function(r) { return r.json(); });
        var groupP = (currentUser && currentUser.isMaster)
          ? fetch('/api/groups/requests', { credentials: 'same-origin' }).then(function(r) { return r.json(); })
          : Promise.resolve(null);
        var deleteP = (currentUser && currentUser.isMaster)
          ? fetch('/api/groups/requests/delete', { credentials: 'same-origin' }).then(function(r) { return r.json(); })
          : Promise.resolve(null);

        Promise.all([editorP, groupP, deleteP])
          .then(function(results) {
            var editorCount = (results[0].requests || []).length;
            var groupCount = results[1] ? (results[1].requests || []).length : 0;
            var deleteCount = results[2] ? (results[2].requests || []).length : 0;
            var totalCount = editorCount + groupCount + deleteCount;

            var area = document.getElementById('labo-pending-area');
            if (totalCount === 0) {
              if (area) area.innerHTML = '';
              return;
            }

            var parts = [];
            if (editorCount > 0) parts.push('エディター申請 ' + editorCount + '件');
            if (groupCount > 0) parts.push('団体作成申請 ' + groupCount + '件');
            if (deleteCount > 0) parts.push('団体削除申請 ' + deleteCount + '件');

            if (area) {
              area.innerHTML = '<div class="labo-hub-pending-banner">'
                + '<span>📩 <strong>' + parts.join('、') + '</strong> があります</span>'
                + '<button class="labo-btn-small" onclick="LaboHub.toggleAdmin()">確認する</button>'
                + '</div>';
            }

            var adminBtn = document.getElementById('btn-admin-open');
            if (adminBtn) {
              var badge = adminBtn.querySelector('.admin-badge');
              if (!badge) {
                badge = document.createElement('span');
                badge.className = 'admin-badge';
                adminBtn.appendChild(badge);
              }
              badge.textContent = totalCount;
            }
          })
          .catch(function() {});
      }

      /* ── 管理パネル ── */
      function toggleAdmin() {
        var panel = document.getElementById('labo-admin-panel');
        if (!panel) return;
        var visible = panel.style.display !== 'none';
        panel.style.display = visible ? 'none' : '';
        var arrow = document.getElementById('admin-arrow');
        if (arrow) arrow.textContent = visible ? '›' : '⌄';
        if (!visible) loadAdminData();
      }

      function loadAdminData() {
        var el = document.getElementById('labo-admin-content');
        el.innerHTML = '<div class="loading">読み込み中…</div>';

        var editorPromise = fetch('/api/editor/list', { credentials: 'same-origin' }).then(function(r) { return r.json(); });
        var groupReqPromise = (currentUser && currentUser.isMaster)
          ? fetch('/api/groups/requests', { credentials: 'same-origin' }).then(function(r) { return r.json(); })
          : Promise.resolve(null);
        var deleteReqPromise = (currentUser && currentUser.isMaster)
          ? fetch('/api/groups/requests/delete', { credentials: 'same-origin' }).then(function(r) { return r.json(); })
          : Promise.resolve(null);

        Promise.all([editorPromise, groupReqPromise, deleteReqPromise])
          .then(function(results) {
            var data = results[0];
            var groupReqData = results[1];
            var deleteReqData = results[2];
            var h = '';

            if (deleteReqData && deleteReqData.requests) {
              var dreqs = deleteReqData.requests;
              h += '<div class="admin-sub"><h4>🗑 団体削除申請（' + dreqs.length + '件）<\\/h4>';
              if (dreqs.length === 0) {
                h += '<p class="admin-empty">申請はありません<\\/p>';
              } else {
                dreqs.forEach(function(r) {
                  var d = r.requestedAt ? new Date(r.requestedAt).toLocaleDateString('ja-JP') : '';
                  h += '<div class="admin-group-req">';
                  h += '<div class="admin-group-req-header">';
                  h += '<strong>' + esc(r.groupName || r.groupId) + '<\\/strong>';
                  h += '<span class="admin-date">' + d + '<\\/span>';
                  h += '<\\/div>';
                  h += '<div class="admin-group-req-detail">';
                  h += '<div class="admin-detail-row"><span class="admin-detail-label">申請者<\\/span><span>' + esc(r.displayName || r.userId) + '<\\/span><\\/div>';
                  h += '<div class="admin-detail-row"><span class="admin-detail-label">理由<\\/span><span>' + esc(r.reason || '') + '<\\/span><\\/div>';
                  h += '<\\/div>';
                  h += '<div class="admin-group-req-actions">';
                  h += '<button class="labo-btn-small labo-btn-reject" onclick="LaboHub.approveDeleteRequest(\\'' + esc(r.requestId) + '\\',\\'' + esc(r.groupName || r.groupId) + '\\')">削除を承認<\\/button>';
                  h += '<button class="labo-btn-small" onclick="LaboHub.rejectDeleteRequest(\\'' + esc(r.requestId) + '\\',\\'' + esc(r.groupName || r.groupId) + '\\')">却下<\\/button>';
                  h += '<\\/div>';
                  h += '<\\/div>';
                });
              }
              h += '<\\/div>';
            }

            if (groupReqData && groupReqData.requests) {
              var greqs = groupReqData.requests;
              h += '<div class="admin-sub"><h4>🏯 団体作成申請（' + greqs.length + '件）<\\/h4>';
              if (greqs.length === 0) {
                h += '<p class="admin-empty">申請はありません<\\/p>';
              } else {
                greqs.forEach(function(r) {
                  var d = r.requestedAt ? new Date(r.requestedAt).toLocaleDateString('ja-JP') : '';
                  var gd = r.groupData || {};
                  h += '<div class="admin-group-req">';
                  h += '<div class="admin-group-req-header">';
                  h += '<strong>' + esc(gd.name || '(団体名なし)') + '<\\/strong>';
                  h += '<span class="admin-date">' + d + '<\\/span>';
                  h += '<\\/div>';
                  h += '<div class="admin-group-req-detail">';
                  h += '<div class="admin-detail-row"><span class="admin-detail-label">管理者<\\/span><span>' + esc(r.managerName || '') + '<\\/span><\\/div>';
                  h += '<div class="admin-detail-row"><span class="admin-detail-label">メール<\\/span><span>' + esc(r.contactEmail || '') + '<\\/span><\\/div>';
                  if (r.contactPhone) {
                    h += '<div class="admin-detail-row"><span class="admin-detail-label">電話<\\/span><span>' + esc(r.contactPhone) + '<\\/span><\\/div>';
                  }
                  h += '<div class="admin-detail-row"><span class="admin-detail-label">申請者<\\/span><span>' + esc(r.displayName || r.userId) + '<\\/span><\\/div>';
                  if (gd.tagline) {
                    h += '<div class="admin-detail-row"><span class="admin-detail-label">キャッチ<\\/span><span>' + esc(gd.tagline) + '<\\/span><\\/div>';
                  }
                  if (gd.venue && gd.venue.name) {
                    h += '<div class="admin-detail-row"><span class="admin-detail-label">会場<\\/span><span>' + esc(gd.venue.name) + '<\\/span><\\/div>';
                  }
                  h += '<\\/div>';
                  h += '<div class="admin-group-req-actions">';
                  h += '<button class="labo-btn-small labo-btn-approve" onclick="LaboHub.approveGroupRequest(\\'' + esc(r.requestId) + '\\',\\'' + esc(gd.name || '') + '\\')">承認<\\/button>';
                  h += '<button class="labo-btn-small labo-btn-reject" onclick="LaboHub.rejectGroupRequest(\\'' + esc(r.requestId) + '\\',\\'' + esc(gd.name || '') + '\\')">却下<\\/button>';
                  h += '<\\/div>';
                  h += '<\\/div>';
                });
              }
              h += '<\\/div>';
            }

            var reqs = data.requests || [];
            h += '<div class="admin-sub"><h4>📩 エディター承認待ち（' + reqs.length + '件）<\\/h4>';
            if (reqs.length === 0) {
              h += '<p class="admin-empty">申請はありません<\\/p>';
            } else {
              reqs.forEach(function(r) {
                var d = r.requestedAt ? new Date(r.requestedAt).toLocaleDateString('ja-JP') : '';
                h += '<div class="admin-request-row">';
                h += '<span class="admin-user-name">' + esc(r.displayName || r.userId) + '<\\/span>';
                if (r.email) h += '<span class="admin-user-email">' + esc(r.email) + '<\\/span>';
                h += '<span class="admin-date">' + d + '<\\/span>';
                h += '<button class="labo-btn-small labo-btn-approve" onclick="LaboHub.approveUser(\\'' + esc(r.userId) + '\\',\\'' + esc(r.displayName || '') + '\\')">承認<\\/button>';
                h += '<button class="labo-btn-small labo-btn-reject" onclick="LaboHub.rejectEditorRequest(\\'' + esc(r.userId) + '\\',\\'' + esc(r.displayName || '') + '\\')">却下<\\/button>';
                h += '<\\/div>';
              });
            }
            h += '<\\/div>';

            var eds = data.editors || [];
            h += '<div class="admin-sub"><h4>✅ 承認済みエディター（' + eds.length + '名）<\\/h4>';
            eds.forEach(function(e) {
              var d = e.approvedAt ? new Date(e.approvedAt).toLocaleDateString('ja-JP') : '';
              h += '<div class="admin-editor-row">';
              h += '<span class="admin-user-name">' + esc(e.displayName || e.userId) + '<\\/span>';
              h += '<span class="admin-date">' + d + ' 承認<\\/span>';
              h += '<button class="labo-btn-small labo-btn-revoke" onclick="LaboHub.revokeUser(\\'' + esc(e.userId) + '\\',\\'' + esc(e.displayName || '') + '\\')">権限解除<\\/button>';
              h += '<\\/div>';
            });
            h += '<\\/div>';

            if (currentUser && currentUser.isMaster) {
              h += '<div class="admin-sub"><h4>🔧 管理ツール<\\/h4>';
              h += '<button class="labo-btn-small" onclick="LaboHub.migrateAuthors()">著者データを統一（けらのすけ）<\\/button>';
              h += '<\\/div>';
            }

            el.innerHTML = h;
          })
          .catch(function(e) {
            el.innerHTML = '<div class="admin-empty">読み込みエラー: ' + esc(String(e)) + '<\\/div>';
          });
      }

      function approveUser(userId, displayName) {
        if (!confirm((displayName || userId) + ' を承認しますか？')) return;
        fetch('/api/editor/approve', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId, displayName: displayName })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.ok) { loadAdminData(); checkPendingRequests(); }
          else { alert('エラー: ' + (data.error || 'unknown')); }
        })
        .catch(function(e) { alert('通信エラー: ' + e); });
      }

      function rejectEditorRequest(userId, displayName) {
        if (!confirm((displayName || userId) + ' のエディター申請を却下しますか？')) return;
        fetch('/api/editor/reject', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.ok) { loadAdminData(); checkPendingRequests(); }
          else { alert('エラー: ' + (data.error || 'unknown')); }
        })
        .catch(function(e) { alert('通信エラー: ' + e); });
      }

      function revokeUser(userId, displayName) {
        if (!confirm((displayName || userId) + ' のエディター権限を解除しますか？')) return;
        fetch('/api/editor/revoke', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.ok) { loadAdminData(); }
          else { alert('エラー: ' + (data.error || 'unknown')); }
        })
        .catch(function(e) { alert('通信エラー: ' + e); });
      }

      function approveGroupRequest(requestId, groupName) {
        if (!confirm('「' + (groupName || requestId) + '」の団体作成を承認しますか？')) return;
        fetch('/api/groups/requests/approve', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: requestId })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.ok) {
            alert('承認しました。団体「' + (groupName || '') + '」が作成されました。');
            loadAdminData(); checkPendingRequests();
          } else { alert('エラー: ' + (data.error || 'unknown')); }
        })
        .catch(function(e) { alert('通信エラー: ' + e); });
      }

      function rejectGroupRequest(requestId, groupName) {
        if (!confirm('「' + (groupName || requestId) + '」の申請を却下しますか？')) return;
        fetch('/api/groups/requests/reject', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: requestId })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.ok) { loadAdminData(); checkPendingRequests(); }
          else { alert('エラー: ' + (data.error || 'unknown')); }
        })
        .catch(function(e) { alert('通信エラー: ' + e); });
      }

      function approveDeleteRequest(requestId, groupName) {
        if (!confirm('「' + (groupName || requestId) + '」を完全に削除します。この操作は取り消せません。本当に実行しますか？')) return;
        fetch('/api/groups/requests/delete/approve', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: requestId })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.ok) {
            alert('「' + (groupName || '') + '」を削除しました。');
            loadAdminData(); checkPendingRequests();
          } else { alert('エラー: ' + (data.error || 'unknown')); }
        })
        .catch(function(e) { alert('通信エラー: ' + e); });
      }

      function rejectDeleteRequest(requestId, groupName) {
        if (!confirm('「' + (groupName || requestId) + '」の削除申請を却下しますか？')) return;
        fetch('/api/groups/requests/delete/reject', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: requestId })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.ok) { loadAdminData(); checkPendingRequests(); }
          else { alert('エラー: ' + (data.error || 'unknown')); }
        })
        .catch(function(e) { alert('通信エラー: ' + e); });
      }

      function migrateAuthors() {
        if (!confirm('全演目の著者データを統一します（keranosuke_system → あなたのアカウント、表示名「けらのすけ」）。実行しますか？')) return;
        fetch('/api/enmoku/migrate-authors', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oldUserId: 'keranosuke_system',
            newUserId: currentUser.userId,
            displayName: 'けらのすけ'
          })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.ok) { alert('完了: ' + data.updated + '/' + data.total + ' 件を更新しました'); }
          else { alert('エラー: ' + (data.error || 'unknown')); }
        })
        .catch(function(e) { alert('通信エラー: ' + e); });
      }

      function requestEditor() {
        var actions = document.getElementById('labo-apply-actions');
        if (actions) actions.innerHTML = '<span class="labo-apply-requesting">申請中...</span>';
        fetch('/api/editor/request', { method: 'POST', credentials: 'same-origin' })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (data.ok) {
              if (data.status === 'already_approved') {
                if (actions) actions.innerHTML = '<span class="labo-apply-approved">承認済みです。ページを再読み込みしてください。</span>';
              } else {
                if (actions) actions.innerHTML = '<span class="labo-apply-requested">申請しました！ 管理者の承認をお待ちください。</span>';
              }
            } else {
              if (actions) actions.innerHTML = '<span class="labo-apply-error">エラー: ' + esc(data.error || '不明') + '</span>';
            }
          })
          .catch(function(e) {
            if (actions) actions.innerHTML = '<span class="labo-apply-error">通信エラー: ' + e + '</span>';
          });
      }

      window.LaboHub = {
        toggleAdmin: toggleAdmin,
        approveUser: approveUser,
        rejectEditorRequest: rejectEditorRequest,
        revokeUser: revokeUser,
        approveGroupRequest: approveGroupRequest,
        rejectGroupRequest: rejectGroupRequest,
        approveDeleteRequest: approveDeleteRequest,
        rejectDeleteRequest: rejectDeleteRequest,
        migrateAuthors: migrateAuthors,
        requestEditor: requestEditor
      };
    })();
    </script>
  `;

  return pageShell({
    title: "LABO",
    subtitle: "こうぼう",
    bodyHTML,
    activeNav: "labo",
    brand: "jikabuki",
    googleClientId,
    ogImage: "https://kabukiplus.com/assets/ogp/ogp_labo.png",
    headExtra: `<style>
      /* ウェルカムバー */
      .labo-hub-welcome {
        padding: 28px 20px 24px;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 24px;
      }
      .labo-hub-welcome-main {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }
      .labo-hub-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 22px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
      }
      .labo-hub-subtitle {
        font-size: 13px;
        color: var(--text-secondary);
        margin: 4px 0 0;
        line-height: 1.6;
      }
      .labo-hub-user {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }
      .labo-hub-user-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
      }
      .labo-hub-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
      }
      .labo-hub-avatar-placeholder {
        font-size: 24px;
        flex-shrink: 0;
      }
      .labo-hub-role-badge {
        font-size: 11px;
        font-weight: 600;
        padding: 2px 10px;
        border-radius: 20px;
        white-space: nowrap;
      }
      .labo-hub-role-badge.editor {
        background: var(--gold-soft, #fdf8ec);
        color: var(--gold-dark);
        border: 1px solid var(--gold-light, #e8d5a0);
      }
      .labo-hub-role-badge.pending {
        background: #fef3cd;
        color: #856404;
        border: 1px solid #f0d78c;
      }

      /* セクション */
      .labo-hub-section {
        margin-bottom: 28px;
      }
      .labo-hub-section-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 16px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 14px;
      }

      /* エディタカード */
      .labo-hub-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .labo-hub-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 18px 16px;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        text-decoration: none;
        color: inherit;
        cursor: pointer;
        transition: all 0.18s;
        position: relative;
        border-left: 4px solid transparent;
      }
      .labo-hub-card.accent-1 { border-left-color: var(--accent-1); }
      .labo-hub-card.accent-2 { border-left-color: var(--accent-2); }
      .labo-hub-card.accent-3 { border-left-color: var(--accent-3); }
      .labo-hub-card.accent-4 { border-left-color: var(--accent-4); }
      .labo-hub-card.accent-admin { border-left-color: var(--gold); }

      a.labo-hub-card:hover,
      button.labo-hub-card:hover {
        border-color: var(--gold);
        border-left-color: var(--gold);
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
      }
      .labo-hub-card.is-coming {
        opacity: 0.55;
        cursor: default;
      }
      .labo-hub-card.is-coming:hover {
        transform: none;
        box-shadow: none;
        border-color: var(--border-light);
      }
      .labo-hub-card-icon {
        font-size: 28px;
        flex-shrink: 0;
        width: 40px;
        text-align: center;
      }
      .labo-hub-card-body {
        flex: 1;
        min-width: 0;
      }
      .labo-hub-card-title {
        font-size: 15px;
        font-weight: 700;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .labo-hub-card-desc {
        font-size: 12px;
        color: var(--text-secondary);
        margin-top: 3px;
        line-height: 1.5;
      }
      .labo-hub-card-arrow {
        font-size: 20px;
        color: var(--text-tertiary);
        flex-shrink: 0;
        font-weight: 300;
      }
      .labo-hub-badge {
        font-size: 10px;
        font-weight: 600;
        color: var(--text-tertiary);
        background: var(--bg-subtle);
        border: 1px solid var(--border-light);
        padding: 1px 8px;
        border-radius: 10px;
        white-space: nowrap;
      }

      /* 管理セクション */
      .labo-hub-admin {
        padding-top: 20px;
        border-top: 1px solid var(--border-light);
      }
      .labo-hub-admin-header {
        margin-bottom: 12px;
      }
      .labo-hub-admin-toggle {
        margin-bottom: 12px;
      }
      button.labo-hub-card {
        width: 100%;
        font-family: inherit;
        text-align: left;
        border-top: 1px solid var(--border-light);
        border-right: 1px solid var(--border-light);
        border-bottom: 1px solid var(--border-light);
      }
      .labo-hub-pending-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 18px;
        background: #eaf4fc;
        border: 1px solid #b8d8f0;
        border-radius: var(--radius-md);
        margin-bottom: 14px;
        font-size: 14px;
        color: #2c5282;
        flex-wrap: wrap;
      }

      /* 管理パネル内部 */
      .labo-admin-panel-inner {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        padding: 20px;
        margin-top: 4px;
      }
      .labo-admin-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .labo-admin-panel-header h4 {
        font-family: 'Noto Serif JP', serif;
        font-size: 15px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
      }
      .admin-sub { margin-bottom: 20px; }
      .admin-sub h4 {
        font-size: 14px;
        color: var(--text-secondary);
        margin: 0 0 10px;
        padding-bottom: 6px;
        border-bottom: 1px solid var(--border-light);
      }
      .admin-empty {
        font-size: 13px;
        color: var(--text-tertiary);
        padding: 8px 0;
      }
      .admin-request-row, .admin-editor-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        background: var(--bg-subtle);
        border-radius: 8px;
        margin-bottom: 6px;
        flex-wrap: wrap;
      }
      .admin-request-row { background: #fef9e7; border: 1px solid #f0d78c; }
      .admin-user-name {
        font-weight: 600;
        font-size: 14px;
        color: var(--text-primary);
      }
      .admin-user-email {
        font-size: 12px;
        color: var(--text-tertiary);
      }
      .admin-date {
        font-size: 12px;
        color: var(--text-tertiary);
        margin-left: auto;
      }
      .admin-badge {
        position: absolute;
        top: 6px; right: 6px;
        background: #e74c3c;
        color: #fff;
        font-size: 11px;
        font-weight: 700;
        min-width: 20px;
        height: 20px;
        line-height: 20px;
        text-align: center;
        border-radius: 10px;
        padding: 0 5px;
      }
      .admin-group-req {
        padding: 14px;
        background: #eaf6ff;
        border: 1px solid #b8daff;
        border-radius: 8px;
        margin-bottom: 10px;
      }
      .admin-group-req-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .admin-group-req-header strong {
        font-size: 15px;
        color: var(--text-primary);
      }
      .admin-group-req-detail { padding: 8px 0; }
      .admin-detail-row {
        display: flex;
        gap: 8px;
        font-size: 13px;
        padding: 3px 0;
      }
      .admin-detail-label {
        font-weight: 600;
        color: var(--text-secondary);
        min-width: 70px;
      }
      .admin-group-req-actions {
        display: flex;
        gap: 8px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #b8daff;
      }

      /* ボタン */
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
      .labo-btn-approve {
        background: #27ae60 !important;
        color: #fff !important;
        border: none !important;
        font-weight: 600;
      }
      .labo-btn-approve:hover { background: #219a52 !important; }
      .labo-btn-revoke {
        background: none !important;
        color: #c0392b !important;
        border: 1px solid #e0b0b0 !important;
        font-weight: 600;
        font-size: 10px !important;
        margin-left: auto;
      }
      .labo-btn-revoke:hover { background: #fdedec !important; border-color: #c0392b !important; }
      .labo-btn-reject {
        background: #e74c3c !important;
        color: #fff !important;
        border: none !important;
        font-weight: 600;
      }
      .labo-btn-reject:hover { background: #c0392b !important; }

      /* エディター申請セクション */
      .labo-apply-card {
        display: flex; gap: 16px; align-items: flex-start;
        background: linear-gradient(135deg, #fdf6e3 0%, #fff8e1 100%);
        border: 2px solid var(--gold-light, #e6c94e);
        border-radius: var(--radius-md); padding: 24px;
        box-shadow: var(--shadow-sm);
      }
      .labo-apply-icon { font-size: 32px; flex-shrink: 0; }
      .labo-apply-body { flex: 1; }
      .labo-apply-title {
        font-family: 'Noto Serif JP', serif; font-size: 17px; font-weight: 700;
        margin: 0 0 8px; color: var(--text-primary);
      }
      .labo-apply-desc {
        font-size: 13px; line-height: 1.7; color: var(--text-secondary); margin: 0 0 16px;
      }
      .labo-apply-steps {
        display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;
      }
      .labo-apply-step {
        display: flex; align-items: center; gap: 6px;
        font-size: 12px; font-weight: 600; color: var(--text-secondary);
        background: rgba(255,255,255,0.7); padding: 6px 12px;
        border-radius: 20px; border: 1px solid var(--border-light);
      }
      .labo-apply-step-num {
        display: inline-flex; align-items: center; justify-content: center;
        width: 20px; height: 20px; border-radius: 50%;
        background: var(--gold, #c5a255); color: #fff;
        font-size: 11px; font-weight: 700; flex-shrink: 0;
      }
      .labo-apply-actions { margin-top: 4px; }
      .labo-apply-requested {
        display: inline-block; font-size: 13px; font-weight: 600;
        color: var(--gold-dark, #a0850a); background: rgba(255,255,255,0.7);
        padding: 8px 16px; border-radius: 6px;
      }
      .labo-apply-requesting { font-size: 13px; color: var(--text-tertiary); }
      .labo-apply-approved { font-size: 13px; font-weight: 600; color: #27ae60; }
      .labo-apply-error { font-size: 13px; color: #c0392b; }
      .labo-apply-status { margin-top: 8px; font-size: 13px; }

      @media (max-width: 600px) {
        .labo-hub-grid { grid-template-columns: 1fr; }
        .labo-hub-welcome-main { flex-direction: column; align-items: flex-start; }
        .labo-apply-card { flex-direction: column; }
        .labo-apply-steps { flex-direction: column; }
      }
    </style>`
  });
}
