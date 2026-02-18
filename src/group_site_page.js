// src/group_site_page.js
// =========================================================
// 団体公式サイト テンプレート — /groups/:groupId
// KV の団体データから動的生成
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";

export function groupSitePageHTML(group) {
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
  const tagline = escHTML(g.tagline || "");
  const desc = (g.description || "").replace(/\n/g, "<br>");

  const faqHTML = (g.faq || []).map((f, i) => `
    <div class="gs-faq-item fade-up-d${Math.min(i + 2, 7)}">
      <div class="gs-faq-q">${escHTML(f.q)}</div>
      <div class="gs-faq-a">${escHTML(f.a)}</div>
    </div>
  `).join("");

  const venueHTML = g.venue ? `
    <section class="gs-section fade-up-d1">
      <h2 class="section-title">会場</h2>
      <div class="gs-venue-card">
        <div class="gs-venue-name">📍 ${escHTML(g.venue.name || "")}</div>
        <div class="gs-venue-addr">${escHTML(g.venue.address || "")}</div>
      </div>
    </section>
  ` : "";

  const contactHTML = g.contact ? `
    <section class="gs-section fade-up-d3">
      <h2 class="section-title">お問い合わせ</h2>
      <div class="gs-contact-list">
        ${g.contact.instagram ? `<a href="${escHTML(g.contact.instagram)}" target="_blank" rel="noopener" class="gs-contact-link">📷 Instagram</a>` : ""}
        ${g.contact.website ? `<a href="${escHTML(g.contact.website)}" target="_blank" rel="noopener" class="gs-contact-link">🌐 公式サイト</a>` : ""}
        ${g.contact.email ? `<a href="mailto:${escHTML(g.contact.email)}" class="gs-contact-link">📧 メール</a>` : ""}
      </div>
    </section>
  ` : "";

  const gidSafe = escHTML(g.group_id);
  const linksHTML = `
    <section class="gs-section fade-up-d4">
      <h2 class="section-title">コンテンツ</h2>
      <div class="gs-links">
        <a href="/groups/${gidSafe}/performances" class="gs-link-card">
          <span class="gs-link-icon">📅</span>
          <div>
            <div class="gs-link-title">公演情報</div>
            <div class="gs-link-desc">過去の公演と次回予定</div>
          </div>
          <span class="gs-link-arrow">&rarr;</span>
        </a>
        <a href="/groups/${gidSafe}/records" class="gs-link-card">
          <span class="gs-link-icon">📋</span>
          <div>
            <div class="gs-link-title">公演記録・出演記録</div>
            <div class="gs-link-desc">演目・配役・日程のアーカイブ</div>
          </div>
          <span class="gs-link-arrow">&rarr;</span>
        </a>
        <a href="/groups/${gidSafe}/notes" class="gs-link-card">
          <span class="gs-link-icon">📝</span>
          <div>
            <div class="gs-link-title">稽古メモ</div>
            <div class="gs-link-desc">気づきの記録＋参考動画</div>
          </div>
          <span class="gs-link-arrow">&rarr;</span>
        </a>
        <a href="/groups/${gidSafe}/scripts" class="gs-link-card">
          <span class="gs-link-icon">📖</span>
          <div>
            <div class="gs-link-title">デジタル台本</div>
            <div class="gs-link-desc">スマホ・タブレットで稽古</div>
          </div>
          <span class="gs-link-arrow">&rarr;</span>
        </a>
        <a href="/groups/${gidSafe}/training" class="gs-link-card">
          <span class="gs-link-icon">🎤</span>
          <div>
            <div class="gs-link-title">稽古モード</div>
            <div class="gs-link-desc">台詞稽古・大向う道場</div>
          </div>
          <span class="gs-link-arrow">&rarr;</span>
        </a>
        ${g.group_id === "kera" ? `
        <a href="/jikabuki/gate/kera/story" class="gs-link-card">
          <span class="gs-link-icon">🔥</span>
          <div>
            <div class="gs-link-title">ストーリー</div>
            <div class="gs-link-desc">${name}の歩み</div>
          </div>
          <span class="gs-link-arrow">&rarr;</span>
        </a>
        <a href="/jikabuki/gate/kera/kawaraban" class="gs-link-card">
          <span class="gs-link-icon">📄</span>
          <div>
            <div class="gs-link-title">かわら版</div>
            <div class="gs-link-desc">バックナンバー</div>
          </div>
          <span class="gs-link-arrow">&rarr;</span>
        </a>
        ` : ""}
      </div>
    </section>
  `;

  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>&rsaquo;</span><a href="/jikabuki">JIKABUKI PLUS+</a><span>&rsaquo;</span>${name}
    </div>

    <section class="gs-hero fade-up">
      <h2 class="gs-hero-name">${name}</h2>
      ${tagline ? `<p class="gs-hero-tagline">${escHTML(tagline)}</p>` : ""}
      ${g.name_kana ? `<p class="gs-hero-kana">${escHTML(g.name_kana)}</p>` : ""}
    </section>

    <section class="gs-section fade-up-d1">
      <h2 class="section-title">紹介</h2>
      <div class="gs-desc">${desc}</div>
    </section>

    ${venueHTML}

    ${faqHTML ? `
    <section class="gs-section fade-up-d2">
      <h2 class="section-title">よくある質問</h2>
      <div class="gs-faq-list">${faqHTML}</div>
    </section>
    ` : ""}

    ${contactHTML}
    ${linksHTML}

    <div class="gs-chatbot-section fade-up-d5">
      <div class="gs-chatbot-intro">
        <span class="gs-chatbot-icon">🤖</span>
        <div>
          <div class="gs-chatbot-title">けらのすけに聞く</div>
          <div class="gs-chatbot-desc">${name}についてAIガイドが回答します</div>
        </div>
      </div>
      <p class="gs-chatbot-note">右下のチャットアイコンからお気軽にどうぞ</p>
    </div>

    <script src="/assets/keranosuke-widget.js" defer></script>
  `;

  return pageShell({
    title: name,
    subtitle: tagline,
    bodyHTML,
    activeNav: "jikabuki",
    brand: "jikabuki",
    headExtra: `<style>
      .gs-hero {
        text-align: center;
        padding: 1.5rem 1rem 2rem;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 2rem;
      }
      .gs-hero-name {
        font-family: 'Noto Serif JP', serif;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--accent-1);
        letter-spacing: 0.15em;
      }
      .gs-hero-tagline {
        font-size: 0.95rem;
        color: var(--text-secondary);
        margin-top: 0.5rem;
        letter-spacing: 0.08em;
      }
      .gs-hero-kana {
        font-size: 0.8rem;
        color: var(--text-tertiary);
        margin-top: 0.3rem;
      }
      .gs-section { margin-bottom: 2rem; }
      .gs-desc {
        font-size: 0.95rem;
        line-height: 2;
        color: var(--text-secondary);
        padding: 0 0.5rem;
      }
      .gs-venue-card {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        padding: 16px 20px;
        box-shadow: var(--shadow-sm);
      }
      .gs-venue-name {
        font-family: 'Noto Serif JP', serif;
        font-size: 15px;
        font-weight: 600;
        margin-bottom: 4px;
      }
      .gs-venue-addr {
        font-size: 13px;
        color: var(--text-secondary);
      }
      .gs-faq-list { display: flex; flex-direction: column; gap: 10px; }
      .gs-faq-item {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        padding: 16px;
        box-shadow: var(--shadow-sm);
      }
      .gs-faq-q {
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 6px;
        padding-left: 1.5em;
        text-indent: -1.5em;
      }
      .gs-faq-q::before {
        content: 'Q. ';
        color: var(--accent-1);
        font-weight: 700;
      }
      .gs-faq-a {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.8;
        padding-left: 1.5em;
      }
      .gs-faq-a::before {
        content: 'A. ';
        color: var(--gold-dark);
        font-weight: 600;
      }
      .gs-contact-list { display: flex; gap: 10px; flex-wrap: wrap; }
      .gs-contact-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 18px;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        text-decoration: none;
        color: var(--text-primary);
        font-size: 14px;
        transition: all 0.15s;
        box-shadow: var(--shadow-sm);
      }
      .gs-contact-link:hover {
        border-color: var(--gold);
        box-shadow: var(--shadow-md);
        text-decoration: none;
      }
      .gs-links { display: flex; flex-direction: column; gap: 8px; }
      .gs-link-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        text-decoration: none;
        color: var(--text-primary);
        transition: all 0.15s;
        box-shadow: var(--shadow-sm);
      }
      .gs-link-card:hover {
        border-color: var(--gold);
        box-shadow: var(--shadow-md);
        text-decoration: none;
      }
      .gs-link-icon { font-size: 20px; flex-shrink: 0; }
      .gs-link-title { font-size: 14px; font-weight: 600; }
      .gs-link-desc { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }
      .gs-link-arrow { color: var(--text-tertiary); margin-left: auto; font-size: 16px; flex-shrink: 0; }
      .gs-link-card:hover .gs-link-arrow { color: var(--gold); transform: translateX(3px); }
      .gs-chatbot-section {
        margin-top: 2rem;
        padding: 20px;
        background: var(--bg-card);
        border: 2px solid var(--gold-light);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
      }
      .gs-chatbot-intro {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 10px;
      }
      .gs-chatbot-icon { font-size: 28px; }
      .gs-chatbot-title { font-family: 'Noto Serif JP', serif; font-size: 15px; font-weight: 600; }
      .gs-chatbot-desc { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
      .gs-chatbot-note { font-size: 12px; color: var(--text-tertiary); text-align: center; }
    </style>`
  });
}
