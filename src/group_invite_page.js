// src/group_invite_page.js
// =========================================================
// 招待リンク ランディングページ — /groups/:groupId/invite/:token
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";

export function groupInvitePageHTML(group, token, status) {
  const name = escHTML(group ? (group.name || "") : "");
  const gid = escHTML(group ? (group.group_id || "") : "");

  // status: "invalid" | "login" | "joining" | "already_member"
  let headingHTML = "";
  let bodyHTML2 = "";

  if (!group || status === "invalid") {
    headingHTML = "招待リンクが無効です";
    bodyHTML2 = `
      <div class="gi-icon">⚠️</div>
      <p class="gi-desc">このリンクは無効または期限切れです。<br>発行者に新しいリンクを発行してもらってください。</p>
      <a href="/" class="btn btn-secondary">トップへ戻る</a>
    `;
  } else if (status === "already_member") {
    headingHTML = `${name}のBASEへようこそ`;
    bodyHTML2 = `
      <div class="gi-icon">✅</div>
      <p class="gi-desc">あなたはすでにメンバーです。</p>
      <a href="/jikabuki/base" class="btn btn-primary">BASEを開く</a>
    `;
  } else if (status === "login") {
    const inviteUrl = `/groups/${encodeURIComponent(gid)}/invite/${encodeURIComponent(token)}`;
    headingHTML = `${name}のBASEに参加`;
    bodyHTML2 = `
      <div class="gi-icon">🏯</div>
      <p class="gi-desc">
        <strong>${name}</strong>の稽古メモ・スケジュール・台本などが<br>
        確認できるBASEに参加しましょう。
      </p>
      <a href="/auth/line?from=${encodeURIComponent(inviteUrl)}" class="gi-line-btn">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff" style="flex-shrink:0"><path d="M12 2C6.48 2 2 5.82 2 10.5c0 4.21 3.74 7.74 8.78 8.4.34.07.8.23.92.52.1.27.07.68.03.95l-.15.91c-.05.27-.21 1.07.94.58s6.27-3.69 8.56-6.32C22.89 13.47 22 11.5 22 10.5 22 5.82 17.52 2 12 2z"/></svg>
        LINEでログインして参加
      </a>
      <p class="gi-note">参加後、${name}のBASEダッシュボードが利用できます。</p>
    `;
  } else {
    // joining: ログイン済みでトークン検証OK → 自動参加してリダイレクト（このページは表示されないはず）
    headingHTML = `参加処理中...`;
    bodyHTML2 = `
      <div class="gi-icon">⏳</div>
      <p class="gi-desc">参加処理を行っています。しばらくお待ちください。</p>
    `;
  }

  const bodyHTML = `
    <div class="gi-wrap fade-up">
      <div class="gi-card">
        <div class="gi-group-badge">JIKABUKI BASE</div>
        <h2 class="gi-heading">${headingHTML}</h2>
        <div class="gi-content">
          ${bodyHTML2}
        </div>
      </div>
    </div>
  `;

  return pageShell({
    title: group ? `${name}のBASEに参加` : "招待リンクが無効です",
    bodyHTML,
    activeNav: "base",
    brand: "jikabuki",
    hideNav: true,
    headExtra: `<style>
      .gi-wrap {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 70vh;
        padding: 20px;
      }
      .gi-card {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-lg, 16px);
        padding: 40px 32px;
        max-width: 420px;
        width: 100%;
        text-align: center;
        box-shadow: var(--shadow-md);
      }
      .gi-group-badge {
        display: inline-block;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.12em;
        color: var(--gold-dark, #a0850a);
        background: var(--gold-soft, #fdf6e3);
        border: 1px solid var(--gold-light, #e6c94e);
        border-radius: 20px;
        padding: 3px 14px;
        margin-bottom: 16px;
      }
      .gi-heading {
        font-family: 'Noto Serif JP', serif;
        font-size: 20px;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 24px;
        line-height: 1.5;
      }
      .gi-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      .gi-desc {
        font-size: 14px;
        color: var(--text-secondary);
        line-height: 1.8;
        margin-bottom: 24px;
      }
      .gi-line-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 100%;
        padding: 14px 20px;
        background: #06C755;
        color: #fff;
        font-size: 16px;
        font-weight: 700;
        border-radius: 10px;
        text-decoration: none;
        transition: opacity 0.2s;
        margin-bottom: 16px;
      }
      .gi-line-btn:hover {
        opacity: 0.88;
        color: #fff;
        text-decoration: none;
      }
      .gi-note {
        font-size: 12px;
        color: var(--text-tertiary);
        margin: 0;
        line-height: 1.6;
      }
      @media (max-width: 480px) {
        .gi-card { padding: 32px 20px; }
        .gi-heading { font-size: 17px; }
      }
    </style>`
  });
}
