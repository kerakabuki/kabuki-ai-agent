// src/shared_scripts_page.js
// =========================================================
// 台本共有ブラウジング — /jikabuki/scripts
// 公開された台本を団体横断で閲覧
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";

export function sharedScriptsPageHTML(sharedScripts) {
  const list = sharedScripts || [];

  const cardsHTML = list.length ? list.map(s => {
    const t = s.type || "json";
    const badge = t === "pdf" ? "PDF" : t === "text" ? "TEXT" : "JSON";
    const badgeClass = t === "pdf" ? "ss-type-pdf" : t === "text" ? "ss-type-text" : "ss-type-json";
    return `
    <a href="/groups/${escHTML(s.group_id || "")}/scripts/${escHTML(s.id || "")}" class="ss-card fade-up">
      <div class="ss-card-icon">${t === "pdf" ? "📄" : "📖"}</div>
      <div class="ss-card-body">
        <div class="ss-card-title">${escHTML(s.title || s.id)}</div>
        ${s.play ? `<div class="ss-card-play">${escHTML(s.play)}</div>` : ""}
        ${s.perf_date || s.perf_venue ? `<div class="ss-card-perf">🎭 ${escHTML(s.perf_date || "")}${s.perf_date && s.perf_venue ? " / " : ""}${escHTML(s.perf_venue || "")}</div>` : ""}
        ${s.group_name ? `<div class="ss-card-group">📍 ${escHTML(s.group_name)}</div>` : ""}
      </div>
      <span class="ss-type-badge ${badgeClass}">${badge}</span>
      <span class="ss-card-arrow">&rarr;</span>
    </a>`;
  }).join("") : `
    <div class="empty-state">
      共有台本はまだ登録されていません。<br>
      各団体の台本管理ページからアップロードし、公開設定を「共有」にすると表示されます。
    </div>
  `;

  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>&rsaquo;</span><a href="/?brand=jikabuki">JIKABUKI PLUS+</a><span>&rsaquo;</span>台本共有
    </div>

    <section class="ss-intro fade-up">
      <h2 class="ss-intro-title">台本共有ライブラリ</h2>
      <p class="ss-intro-desc">
        各地の地歌舞伎団体が公開した台本を閲覧できます。<br>
        台本の調達・管理は多くの団体にとって大きな負担。<br>
        共有することで、より多くの団体が新しい演目に挑戦できます。
      </p>
    </section>

    <section class="ss-section fade-up-d1">
      <h2 class="section-title">公開台本一覧</h2>
      <div class="ss-list">
        ${cardsHTML}
      </div>
    </section>

    <section class="ss-contribute fade-up-d2">
      <div class="ss-contribute-card">
        <div class="ss-contribute-icon">🤝</div>
        <h3>台本を共有しませんか？</h3>
        <p>あなたの団体の台本を共有すると、他の団体の助けになります。</p>
        <p class="ss-contribute-note">台本のデジタル化・共有設定については<a href="/?brand=jikabuki">JIKABUKI PLUS+</a>をご覧ください。</p>
      </div>
    </section>
  `;

  return pageShell({
    title: "台本共有ライブラリ",
    subtitle: "団体間で台本を共有し事務局負担を軽減",
    bodyHTML,
    activeNav: "base",
    brand: "jikabuki",
    headExtra: `<style>
      .ss-intro {
        text-align: center; padding: 1.5rem 1rem 2rem;
        border-bottom: 1px solid var(--border-light); margin-bottom: 2rem;
      }
      .ss-intro-title {
        font-family: 'Noto Serif JP', serif; font-size: 1.2rem;
        font-weight: 700; color: var(--accent-1); letter-spacing: 0.1em; margin-bottom: 8px;
      }
      .ss-intro-desc { font-size: 14px; color: var(--text-secondary); line-height: 2; }
      .ss-section { margin-bottom: 2rem; }
      .ss-list { display: flex; flex-direction: column; gap: 8px; }
      .ss-card {
        display: flex; align-items: center; gap: 14px; padding: 16px;
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-md); text-decoration: none; color: var(--text-primary);
        transition: all 0.15s; box-shadow: var(--shadow-sm);
      }
      .ss-card:hover { border-color: var(--gold); box-shadow: var(--shadow-md); text-decoration: none; }
      .ss-card-icon { font-size: 24px; flex-shrink: 0; }
      .ss-card-body { flex: 1; min-width: 0; }
      .ss-card-title { font-family: 'Noto Serif JP', serif; font-size: 15px; font-weight: 600; }
      .ss-card-play { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
      .ss-card-perf { font-size: 11px; color: var(--accent-1); margin-top: 2px; }
      .ss-card-group { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }
      .ss-card-arrow { color: var(--text-tertiary); font-size: 16px; flex-shrink: 0; }
      .ss-type-badge {
        font-size: 9px; font-weight: 600; padding: 2px 6px; border-radius: 4px;
        letter-spacing: 0.5px; text-transform: uppercase; flex-shrink: 0;
      }
      .ss-type-json { background: #e3f2fd; color: #1565c0; }
      .ss-type-text { background: #e8f5e9; color: #2e7d32; }
      .ss-type-pdf  { background: #fce4ec; color: #c62828; }
      .ss-contribute { margin-top: 2rem; }
      .ss-contribute-card {
        text-align: center; padding: 24px;
        background: var(--bg-card); border: 1px dashed var(--accent-1);
        border-radius: var(--radius-md); box-shadow: var(--shadow-sm);
      }
      .ss-contribute-icon { font-size: 32px; margin-bottom: 8px; }
      .ss-contribute-card h3 { font-family: 'Noto Serif JP', serif; font-size: 16px; font-weight: 600; margin-bottom: 6px; }
      .ss-contribute-card p { font-size: 13px; color: var(--text-secondary); line-height: 1.8; }
      .ss-contribute-note { font-size: 12px; color: var(--text-tertiary); margin-top: 8px; }
    </style>`
  });
}
