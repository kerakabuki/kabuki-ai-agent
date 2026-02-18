// src/group_performance_page.js
// =========================================================
// 団体公演情報ページ — /groups/:groupId/performances
// KV の団体データから公演履歴を動的表示
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";

export function groupPerformancePageHTML(group) {
  if (!group) {
    return pageShell({
      title: "団体が見つかりません",
      bodyHTML: `<div class="empty-state">指定された団体は登録されていません。</div>`,
      brand: "jikabuki",
      activeNav: "jikabuki",
    });
  }

  const g = group;
  const name = escHTML(g.name || "");
  const perfs = g.performances || [];
  const nextPerf = g.next_performance || null;

  const nextPerfHTML = nextPerf ? `
    <section class="gp-next fade-up">
      <div class="gp-next-badge">NEXT</div>
      <h2 class="gp-next-title">${escHTML(nextPerf.title || "次回公演")}</h2>
      <div class="gp-next-details">
        ${nextPerf.date ? `<div class="gp-next-row"><span class="gp-next-label">📅 日時</span><span class="gp-next-value">${escHTML(nextPerf.date)}</span></div>` : ""}
        ${nextPerf.venue ? `<div class="gp-next-row"><span class="gp-next-label">📍 場所</span><span class="gp-next-value">${escHTML(nextPerf.venue)}</span></div>` : ""}
      </div>
      ${nextPerf.note ? `<p class="gp-next-note">${escHTML(nextPerf.note)}</p>` : ""}
    </section>
  ` : "";

  const perfsGrouped = {};
  perfs.forEach(p => {
    const y = p.year || "不明";
    if (!perfsGrouped[y]) perfsGrouped[y] = [];
    perfsGrouped[y].push(p);
  });
  const years = Object.keys(perfsGrouped).sort((a, b) => b - a);

  const archiveHTML = years.map(year => {
    const items = perfsGrouped[year];
    return `
      <div class="gp-year-group">
        <h3 class="gp-year">${escHTML(String(year))}</h3>
        ${items.map(p => `
          <div class="gp-item">
            <div class="gp-item-header">
              <span class="gp-item-date">${escHTML(p.date_display || p.date || "")}</span>
              ${p.venue ? `<span class="gp-item-venue">${escHTML(p.venue)}</span>` : ""}
            </div>
            ${p.title ? `<div class="gp-item-title">${escHTML(p.title)}</div>` : ""}
            ${(p.plays || []).length ? `
              <ul class="gp-item-plays">
                ${p.plays.map(pl => `<li>${escHTML(pl)}</li>`).join("")}
              </ul>
            ` : ""}
          </div>
        `).join("")}
      </div>
    `;
  }).join("");

  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>&rsaquo;</span><a href="/jikabuki">JIKABUKI PLUS+</a><span>&rsaquo;</span><a href="/groups/${escHTML(g.group_id)}">${name}</a><span>&rsaquo;</span>公演情報
    </div>

    ${nextPerfHTML}

    <section class="gp-archive fade-up-d1">
      <h2 class="section-title">過去の公演演目</h2>
      ${archiveHTML || '<div class="empty-state">公演記録はまだ登録されていません。</div>'}
    </section>

    <div class="gp-footer fade-up-d3">
      <a href="/groups/${escHTML(g.group_id)}" class="btn btn-secondary">&larr; ${name} トップに戻る</a>
    </div>
  `;

  return pageShell({
    title: `公演情報 - ${g.name}`,
    subtitle: "過去の公演と次回予定",
    bodyHTML,
    activeNav: "jikabuki",
    brand: "jikabuki",
    headExtra: `<style>
      .gp-next {
        background: var(--bg-card);
        border: 2px solid var(--accent-1);
        border-radius: var(--radius-md);
        padding: 24px 20px;
        margin-bottom: 2rem;
        text-align: center;
        box-shadow: var(--shadow-md);
        position: relative;
      }
      .gp-next-badge {
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--accent-1);
        color: white;
        font-size: 11px;
        font-weight: 700;
        padding: 3px 14px;
        border-radius: 20px;
        letter-spacing: 2px;
      }
      .gp-next-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 18px;
        font-weight: 700;
        margin: 8px 0 16px;
        letter-spacing: 1px;
      }
      .gp-next-details { display: inline-block; text-align: left; }
      .gp-next-row {
        display: flex;
        gap: 12px;
        margin-bottom: 6px;
        font-size: 14px;
      }
      .gp-next-label {
        font-weight: 600;
        flex-shrink: 0;
        min-width: 5em;
      }
      .gp-next-value { color: var(--text-secondary); }
      .gp-next-note {
        font-size: 12px;
        color: var(--text-tertiary);
        margin-top: 14px;
        line-height: 1.8;
      }

      .gp-archive { margin-bottom: 2rem; }
      .gp-year-group { margin-bottom: 1.5rem; }
      .gp-year {
        font-family: 'Noto Serif JP', serif;
        font-size: 16px;
        font-weight: 600;
        color: var(--gold-dark);
        padding-bottom: 6px;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 10px;
        letter-spacing: 1px;
      }
      .gp-item {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        padding: 14px 16px;
        margin-bottom: 8px;
        box-shadow: var(--shadow-sm);
      }
      .gp-item-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 6px;
      }
      .gp-item-date {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);
      }
      .gp-item-venue {
        font-size: 12px;
        color: var(--text-tertiary);
        padding: 2px 8px;
        background: var(--bg-subtle);
        border-radius: 4px;
      }
      .gp-item-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 6px;
        letter-spacing: 0.5px;
      }
      .gp-item-plays {
        padding-left: 1.2em;
        margin: 0;
        list-style: none;
      }
      .gp-item-plays li {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.8;
        padding-left: 1em;
        text-indent: -1em;
      }
      .gp-item-plays li::before {
        content: '・';
        color: var(--gold);
      }

      .gp-footer {
        text-align: center;
        padding-top: 1rem;
        border-top: 1px solid var(--border-light);
      }
    </style>`
  });
}
