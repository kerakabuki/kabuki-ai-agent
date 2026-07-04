// src/group_members_page.js
// =========================================================
// 団体メンバー管理ページ — /groups/:groupId/members
// manager / master のみアクセス可
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";

export function groupMembersPageHTML(group) {
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
  const gidSafe = escHTML(g.group_id);

  const bodyHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">トップ</a><span>&rsaquo;</span><a href="/jikabuki/base">BASE</a><span>&rsaquo;</span><a href="/jikabuki/gate/${gidSafe}">${name}</a><span>&rsaquo;</span>メンバー管理
    </nav>

    <section class="gm-welcome fade-up">
      <div class="gm-welcome-main">
        <div>
          <h2 class="gm-title">メンバー管理</h2>
          <p class="gm-subtitle">${name}</p>
        </div>
        <a href="/jikabuki/gate/${gidSafe}" class="gm-back-btn">&larr; GATEページへ</a>
      </div>
    </section>

    <div id="gm-auth-error" class="gm-error" style="display:none">
      <p>このページを表示する権限がありません。マネージャー以上のロールが必要です。</p>
      <a href="/jikabuki/gate/${gidSafe}">GATEページへ戻る</a>
    </div>

    <div id="gm-loading" class="loading">読み込み中…</div>

    <div id="gm-main" style="display:none">
      <!-- 招待リンク -->
      <section class="gm-section fade-up">
        <h3 class="gm-section-title">🔗 招待リンク</h3>
        <div id="gm-invite-content">
          <p class="gm-invite-desc">リンクをLINEグループに貼ると、メンバーがクリックするだけで自動参加できます。</p>
          <div id="gm-invite-url-wrap" style="display:none">
            <div class="gm-invite-url-row">
              <input type="text" id="gm-invite-url" class="gm-invite-url-input" readonly>
              <button class="btn btn-secondary btn-sm" onclick="GM.copyInviteUrl()">コピー</button>
            </div>
            <p class="gm-invite-note">⚠️ このリンクを知っていれば誰でも参加できます。流出した場合は「再生成」で無効化してください。</p>
          </div>
          <div class="gm-invite-actions">
            <button class="btn btn-primary btn-sm" id="gm-invite-gen-btn" onclick="GM.generateInviteToken()">招待リンクを生成</button>
            <button class="btn btn-secondary btn-sm" id="gm-invite-regen-btn" style="display:none" onclick="GM.generateInviteToken()">再生成（旧リンクを無効化）</button>
          </div>
        </div>
      </section>

      <!-- 参加申請 -->
      <section class="gm-section fade-up-d1">
        <h3 class="gm-section-title">📩 参加申請</h3>
        <div id="gm-requests-content"><div class="loading">読み込み中…</div></div>
      </section>

      <!-- メンバー一覧 -->
      <section class="gm-section fade-up-d2">
        <h3 class="gm-section-title">✅ メンバー一覧</h3>
        <div id="gm-members-content"><div class="loading">読み込み中…</div></div>
      </section>
    </div>

    <script>
    (function(){
      var groupId = '${gidSafe}';

      function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

      function showError() {
        document.getElementById('gm-loading').style.display = 'none';
        document.getElementById('gm-auth-error').style.display = '';
      }

      fetch('/api/auth/me', { credentials: 'same-origin' })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (!data.loggedIn) { showError(); return; }
          var g = (data.user.groups || []).find(function(x) { return x.groupId === groupId; });
          var myRole = g ? g.role : null;
          if (data.user.isMaster) myRole = 'master';

          if (myRole !== 'manager' && myRole !== 'master') { showError(); return; }

          document.getElementById('gm-loading').style.display = 'none';
          document.getElementById('gm-main').style.display = '';
          loadMembers();
        })
        .catch(function() { showError(); });

      function loadMembers() {
        fetch('/api/groups/' + groupId + '/members', { credentials: 'same-origin' })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            renderRequests(data.requests || []);
            renderMembers(data.members || []);
          })
          .catch(function() {
            document.getElementById('gm-requests-content').innerHTML = '<div class="empty-state">読み込みエラー</div>';
            document.getElementById('gm-members-content').innerHTML = '<div class="empty-state">読み込みエラー</div>';
          });
      }

      function renderRequests(reqs) {
        var el = document.getElementById('gm-requests-content');
        if (!reqs.length) {
          el.innerHTML = '<p class="gm-empty">現在、参加申請はありません。</p>';
          return;
        }
        var h = '';
        reqs.forEach(function(r) {
          var d = r.requestedAt ? new Date(r.requestedAt).toLocaleDateString('ja-JP') : '';
          h += '<div class="gm-request-row">';
          h += '<span class="gm-name">' + esc(r.displayName || r.userId) + '</span>';
          if (r.email) h += '<span class="gm-email">' + esc(r.email) + '</span>';
          h += '<span class="gm-date">' + d + '</span>';
          h += '<div class="gm-row-actions">';
          h += '<button class="btn-sm btn-approve" onclick="GroupMembers.approve(\\'' + esc(r.userId) + '\\',\\'' + esc(r.displayName || '') + '\\')">承認</button>';
          h += '<button class="btn-sm btn-reject" onclick="GroupMembers.reject(\\'' + esc(r.userId) + '\\')">却下</button>';
          h += '</div></div>';
        });
        el.innerHTML = h;
      }

      function renderMembers(members) {
        var el = document.getElementById('gm-members-content');
        if (!members.length) {
          el.innerHTML = '<p class="gm-empty">メンバーがいません。</p>';
          return;
        }
        var h = '';
        members.forEach(function(m) {
          var d = m.joinedAt ? new Date(m.joinedAt).toLocaleDateString('ja-JP') : '';
          var roleLabel = m.role === 'manager' ? 'マネージャー' : '所属員';
          h += '<div class="gm-member-row">';
          h += '<span class="gm-name">' + esc(m.displayName || m.userId) + '</span>';
          h += '<span class="gm-role gm-role-' + m.role + '">' + roleLabel + '</span>';
          h += '<span class="gm-date">' + d + '</span>';
          h += '<div class="gm-row-actions">';
          var nextRole = m.role === 'manager' ? 'member' : 'manager';
          var nextLabel = m.role === 'manager' ? '所属員に変更' : 'マネージャーに変更';
          h += '<button class="btn-sm btn-role" onclick="GroupMembers.changeRole(\\'' + esc(m.userId) + '\\',\\'' + nextRole + '\\')">' + nextLabel + '</button>';
          h += '<button class="btn-sm btn-remove" onclick="GroupMembers.remove(\\'' + esc(m.userId) + '\\',\\'' + esc(m.displayName||'') + '\\')">除名</button>';
          h += '</div></div>';
        });
        el.innerHTML = h;
      }

      function approve(userId, displayName) {
        fetch('/api/groups/' + groupId + '/members/approve', {
          method: 'POST', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId, displayName: displayName })
        }).then(function() { loadMembers(); });
      }

      function reject(userId) {
        fetch('/api/groups/' + groupId + '/members/reject', {
          method: 'POST', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId })
        }).then(function() { loadMembers(); });
      }

      function changeRole(userId, role) {
        fetch('/api/groups/' + groupId + '/members/role', {
          method: 'POST', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId, role: role })
        }).then(function() { loadMembers(); });
      }

      function removeMember(userId, name) {
        if (!confirm((name || userId) + ' を除名しますか？')) return;
        fetch('/api/groups/' + groupId + '/members/' + encodeURIComponent(userId), {
          method: 'DELETE', credentials: 'same-origin'
        }).then(function() { loadMembers(); });
      }

      function generateInviteToken() {
        var genBtn = document.getElementById('gm-invite-gen-btn');
        var regenBtn = document.getElementById('gm-invite-regen-btn');
        if (genBtn) { genBtn.disabled = true; genBtn.textContent = '生成中...'; }
        if (regenBtn) { regenBtn.disabled = true; }
        fetch('/api/groups/' + groupId + '/invite-token', {
          method: 'POST', credentials: 'same-origin'
        }).then(function(r) { return r.json(); })
          .then(function(data) {
            if (genBtn) { genBtn.disabled = false; genBtn.textContent = '招待リンクを生成'; }
            if (regenBtn) { regenBtn.disabled = false; }
            if (!data.ok) { alert('生成に失敗しました: ' + (data.error || '不明')); return; }
            var url = location.origin + '/groups/' + encodeURIComponent(groupId) + '/invite/' + data.token;
            var input = document.getElementById('gm-invite-url');
            var wrap = document.getElementById('gm-invite-url-wrap');
            if (input) input.value = url;
            if (wrap) wrap.style.display = '';
            if (genBtn) genBtn.style.display = 'none';
            if (regenBtn) regenBtn.style.display = '';
          })
          .catch(function() {
            if (genBtn) { genBtn.disabled = false; }
            if (regenBtn) { regenBtn.disabled = false; }
            alert('通信エラーが発生しました。');
          });
      }

      function copyInviteUrl() {
        var input = document.getElementById('gm-invite-url');
        if (!input) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(input.value).then(function() {
            var btn = document.querySelector('.gm-invite-url-row .btn');
            if (btn) { btn.textContent = '✓ コピー済み'; setTimeout(function() { btn.textContent = 'コピー'; }, 2000); }
          }).catch(function() { input.select(); document.execCommand('copy'); });
        } else {
          input.select();
          document.execCommand('copy');
        }
      }

      window.GroupMembers = {
        approve: approve,
        reject: reject,
        changeRole: changeRole,
        remove: removeMember,
      };

      window.GM = {
        generateInviteToken: generateInviteToken,
        copyInviteUrl: copyInviteUrl,
      };
    })();
    </script>
  `;

  return pageShell({
    title: "メンバー管理 — " + (g.name || ""),
    subtitle: "BASE 管理",
    bodyHTML,
    activeNav: "base",
    brand: "jikabuki",
    headExtra: `<style>
      .gm-welcome {
        padding: 24px 0 20px;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 24px;
      }
      .gm-welcome-main {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }
      .gm-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 20px;
        font-weight: 700;
        margin: 0;
        color: var(--text-primary);
      }
      .gm-subtitle {
        font-size: 13px;
        color: var(--text-secondary);
        margin: 4px 0 0;
      }
      .gm-back-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        font-size: 13px;
        color: var(--gold-dark);
        background: none;
        border: 1px solid var(--border-light);
        border-radius: var(--radius-sm);
        text-decoration: none;
        transition: all 0.15s;
      }
      .gm-back-btn:hover {
        border-color: var(--gold);
        background: var(--gold-soft);
        text-decoration: none;
      }
      .gm-error {
        padding: 24px;
        background: #fef2f2;
        border: 1px solid #fca5a5;
        border-radius: var(--radius-md);
        color: #991b1b;
        font-size: 14px;
        text-align: center;
      }
      .gm-error a { color: var(--gold-dark); }
      .gm-section {
        margin-bottom: 32px;
      }
      .gm-section-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 16px;
        font-weight: 700;
        margin: 0 0 16px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--border-light);
        color: var(--text-primary);
      }
      .gm-request-row, .gm-member-row {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        padding: 12px 16px;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        margin-bottom: 8px;
      }
      .gm-request-row { background: #fef9e7; border-color: #f0d78c; }
      .gm-row-actions { display: flex; gap: 6px; margin-left: auto; flex-shrink: 0; }
      .gm-name { font-weight: 600; font-size: 14px; }
      .gm-email { font-size: 12px; color: var(--text-tertiary); }
      .gm-date { font-size: 12px; color: var(--text-tertiary); }
      .gm-role { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
      .gm-role-manager { background: #d4edda; color: #155724; }
      .gm-role-member { background: #e2e3e5; color: #383d41; }
      .gm-empty { font-size: 13px; color: var(--text-tertiary); padding: 12px 0; }
      .btn-sm { padding: 5px 14px; border: none; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; }
      .btn-approve { background: #27ae60; color: #fff; }
      .btn-approve:hover { background: #219a52; }
      .btn-reject { background: #e74c3c; color: #fff; }
      .btn-reject:hover { background: #c0392b; }
      .btn-role { background: #3498db; color: #fff; }
      .btn-role:hover { background: #2980b9; }
      .btn-remove { background: #95a5a6; color: #fff; }
      .btn-remove:hover { background: #7f8c8d; }
      /* 招待リンク */
      .gm-invite-desc {
        font-size: 13px; color: var(--text-secondary);
        margin: 0 0 12px; line-height: 1.7;
      }
      .gm-invite-url-row {
        display: flex; gap: 8px; align-items: center;
        margin-bottom: 8px;
      }
      .gm-invite-url-input {
        flex: 1; padding: 9px 12px;
        border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm);
        font-size: 13px; font-family: inherit;
        background: var(--bg-subtle); color: var(--text-primary);
        min-width: 0;
      }
      .gm-invite-note {
        font-size: 12px; color: var(--text-tertiary);
        margin: 0 0 12px; line-height: 1.6;
      }
      .gm-invite-actions { display: flex; gap: 8px; }
    </style>`
  });
}
