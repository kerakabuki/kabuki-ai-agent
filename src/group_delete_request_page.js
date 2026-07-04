// src/group_delete_request_page.js
// =========================================================
// 団体削除申請ページ — /jikabuki/base/delete-request?group={id}
// =========================================================
import { pageShell } from "./web_layout.js";

export function groupDeleteRequestPageHTML({ groupId = "", groupName = "", googleClientId = "" } = {}) {
  const bodyHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">トップ</a><span>&rsaquo;</span><a href="/jikabuki/base">BASE</a><span>&rsaquo;</span>団体削除申請
    </nav>

    <section class="dr-section fade-up">
      <div class="dr-card">
        <div class="dr-icon">🗑</div>
        <h2 class="dr-title">団体削除申請</h2>
        <p class="dr-group-name" id="dr-group-name">${groupId ? groupName || groupId : "読み込み中…"}</p>
        <p class="dr-desc">
          この団体のデータ（台本・記録・メンバー情報など）を完全に削除します。<br>
          削除は取り消しできません。管理者（けらのすけ）が確認後、実行します。
        </p>

        <div id="dr-not-logged-in" style="display:none">
          <p class="dr-warn">ログインが必要です。</p>
          <button class="dr-btn" onclick="openLoginModal()">ログイン</button>
        </div>

        <div id="dr-no-auth" style="display:none">
          <p class="dr-warn">この団体のマネージャーのみ申請できます。</p>
          <a href="/jikabuki/base" class="dr-btn dr-btn-outline">BASEに戻る</a>
        </div>

        <form id="dr-form" style="display:none">
          <div class="dr-field">
            <label class="dr-label">削除理由 <span class="dr-required">*</span></label>
            <textarea id="dr-reason" rows="5" class="dr-textarea" placeholder="例：活動を終了したため"></textarea>
          </div>
          <p class="dr-warn-box">⚠ 一度削除すると、すべてのデータが失われ復元できません。</p>
          <div class="dr-actions">
            <a href="/jikabuki/base" class="dr-btn dr-btn-outline">キャンセル</a>
            <button type="button" class="dr-btn dr-btn-danger" onclick="submitRequest()">申請する</button>
          </div>
          <p id="dr-msg" class="dr-msg"></p>
        </form>

        <div id="dr-done" style="display:none">
          <p class="dr-success">削除申請を送信しました。管理者の確認をお待ちください。</p>
          <a href="/jikabuki/base" class="dr-btn">BASEに戻る</a>
        </div>
      </div>
    </section>

    <script>
    (function() {
      var groupId = '${groupId}';

      fetch('/api/auth/me', { credentials: 'same-origin' })
        .then(function(r) { return r.json(); })
        .then(function(d) {
          if (!d.loggedIn || !d.user) {
            document.getElementById('dr-not-logged-in').style.display = '';
            return;
          }
          var isMaster = d.user.isMaster;
          var groups = d.user.groups || [];
          var myGroup = groups.find(function(g) { return g.groupId === groupId; });
          var canManage = isMaster || (myGroup && myGroup.role === 'manager');
          if (!canManage) {
            document.getElementById('dr-no-auth').style.display = '';
            return;
          }
          document.getElementById('dr-form').style.display = '';
        })
        .catch(function() {
          document.getElementById('dr-not-logged-in').style.display = '';
        });

      window.submitRequest = function() {
        var reason = document.getElementById('dr-reason').value.trim();
        var msgEl = document.getElementById('dr-msg');
        if (!reason) { msgEl.textContent = '削除理由を入力してください。'; return; }
        msgEl.textContent = '送信中…';
        fetch('/api/groups/requests/delete', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupId: groupId, reason: reason }),
        })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (data.ok) {
              document.getElementById('dr-form').style.display = 'none';
              document.getElementById('dr-done').style.display = '';
            } else {
              msgEl.style.color = '#c0392b';
              msgEl.textContent = data.error || '送信に失敗しました。';
            }
          })
          .catch(function() { msgEl.textContent = '通信エラーが発生しました。'; });
      };
    })();
    </script>
  `;

  return pageShell({
    title: "団体削除申請",
    subtitle: "BASE",
    bodyHTML,
    activeNav: "base",
    brand: "jikabuki",
    googleClientId,
    headExtra: `<style>
      .dr-section { padding: 24px 20px; max-width: 520px; margin: 0 auto; }
      .dr-card {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-lg);
        padding: 36px 28px;
        text-align: center;
        box-shadow: var(--shadow-sm);
      }
      .dr-icon { font-size: 40px; margin-bottom: 12px; }
      .dr-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 20px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 6px;
      }
      .dr-group-name {
        font-size: 15px;
        font-weight: 600;
        color: var(--gold-dark);
        margin: 0 0 16px;
      }
      .dr-desc {
        font-size: 14px;
        color: var(--text-secondary);
        line-height: 1.8;
        margin: 0 0 24px;
      }
      .dr-field { text-align: left; margin-bottom: 16px; }
      .dr-label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 6px;
      }
      .dr-required { color: #c0392b; }
      .dr-textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 10px 12px;
        border: 1px solid var(--border-light);
        border-radius: var(--radius-sm);
        font-size: 14px;
        font-family: inherit;
        resize: vertical;
        background: var(--bg-subtle);
        color: var(--text-primary);
      }
      .dr-textarea:focus { outline: none; border-color: var(--gold); }
      .dr-warn {
        font-size: 13px;
        color: var(--text-secondary);
        margin: 0 0 16px;
      }
      .dr-warn-box {
        font-size: 13px;
        color: #c0392b;
        background: #fdf3f3;
        border: 1px solid #f5c6c6;
        border-radius: var(--radius-sm);
        padding: 10px 14px;
        text-align: left;
        margin: 0 0 20px;
      }
      .dr-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
      }
      .dr-btn {
        display: inline-block;
        padding: 10px 24px;
        font-size: 14px;
        font-weight: 600;
        font-family: inherit;
        border-radius: var(--radius-sm);
        cursor: pointer;
        text-decoration: none;
        border: none;
        background: var(--gold);
        color: #fff;
        transition: all 0.15s;
      }
      .dr-btn:hover { opacity: 0.88; text-decoration: none; }
      .dr-btn-outline {
        background: var(--bg-subtle);
        color: var(--text-secondary);
        border: 1px solid var(--border-light);
      }
      .dr-btn-danger { background: #c0392b; }
      .dr-msg {
        font-size: 13px;
        margin: 12px 0 0;
        min-height: 18px;
      }
      .dr-success {
        font-size: 15px;
        color: var(--accent-2);
        font-weight: 600;
        margin: 0 0 20px;
      }
    </style>`,
  });
}
