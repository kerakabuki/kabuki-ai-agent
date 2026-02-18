// src/kawaraban_page.js
// =========================================================
// 地歌舞伎かわら版 — /kawaraban
// 高雄・気良 地歌舞伎かわら版バックナンバー（PDF閲覧対応）
// =========================================================
import { pageShell } from "./web_layout.js";

export function kawarabanPageHTML() {
  const issues = [
    { num: "第十一号", label: "第11号", file: "11", date: "2021年" },
    { num: "第十号",   label: "第10号", file: "10", date: "2020年" },
    { num: "第九号",   label: "第9号",  file: "09", date: "2017年12月" },
    { num: "第八号",   label: "第8号",  file: "08", date: "2017年10月" },
    { num: "第七号",   label: "第7号",  file: "07", date: "2017年8月" },
    { num: "第六号",   label: "第6号",  file: "06", date: "2017年7月" },
    { num: "第五号",   label: "第5号",  file: "05", date: "2017年5月" },
    { num: "第四号",   label: "第4号",  file: "04", date: "2016年11月", imageOnly: true },
    { num: "第参号",   label: "第3号",  file: "03", date: "2016年8月" },
    { num: "第弐号",   label: "第2号",  file: "02", date: "2016年7月" },
    { num: "創刊号",   label: "創刊号", file: "01", date: "2016年5月" },
  ];

  const cardsHTML = issues.map((iss, i) => {
    const hasFile = iss.file !== null;
    const tag = hasFile ? "a" : "div";
    const href = hasFile ? ` href="/jikabuki/gate/kera/kawaraban/pdf/${iss.file}" target="_blank"` : "";
    const cls = hasFile ? "kw-card kw-has-pdf" : "kw-card kw-no-pdf";
    return `
    <${tag}${href} class="${cls} fade-up" style="animation-delay:${i * 0.05}s">
      <div class="kw-num">${iss.label}</div>
      <h3 class="kw-title">高雄・気良<br>地歌舞伎かわら版</h3>
      <div class="kw-sub">${iss.num}</div>
      ${iss.date ? `<div class="kw-date">${iss.date}</div>` : ""}
      ${hasFile ? (iss.imageOnly ? '<div class="kw-pdf-badge">🖼 画像を見る</div>' : '<div class="kw-pdf-badge">📄 PDFを見る</div>') : '<div class="kw-pdf-badge kw-na">準備中</div>'}
    </${tag}>`;
  }).join("");

  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span><a href="/jikabuki/gate/kera">JIKABUKI PLUS+</a><span>›</span><a href="/jikabuki/gate/kera/about">気良歌舞伎とは</a><span>›</span>地歌舞伎かわら版
    </div>

    <section class="kw-intro fade-up">
      <h2 class="kw-intro-title">📰 高雄・気良 地歌舞伎かわら版</h2>
      <p class="kw-intro-desc">
        高雄歌舞伎保存会・気良歌舞伎が共同で発行している「地歌舞伎かわら版」のバックナンバー一覧です。<br>
        地歌舞伎の魅力や活動報告をお届けしています。カードをクリックするとPDFでご覧いただけます。
      </p>
    </section>

    <div class="kw-grid">
      ${cardsHTML}
    </div>
  `;

  return pageShell({
    title: "地歌舞伎かわら版",
    subtitle: "高雄・気良 地歌舞伎かわら版",
    bodyHTML,
    brand: "jikabuki",
    activeNav: "jikabuki",
    headExtra: `<style>
      .kw-intro {
        text-align: center;
        padding: 1rem 0 1.5rem;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 1.5rem;
      }
      .kw-intro-title { font-size: 1.3rem; color: var(--kin); }
      .kw-intro-desc { font-size: 0.88rem; color: var(--text-tertiary); margin-top: 0.6rem; line-height: 1.7; }
      .kw-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 1rem;
      }
      .kw-card {
        display: block;
        background: var(--bg-subtle);
        border: 1px solid var(--border-light);
        border-radius: 12px;
        padding: 1.2rem 0.8rem 0.8rem;
        text-align: center;
        text-decoration: none;
        transition: all 0.3s;
      }
      .kw-has-pdf { cursor: pointer; }
      .kw-has-pdf:hover {
        border-color: var(--kin);
        transform: translateY(-3px);
        box-shadow: 0 4px 16px rgba(197,165,90,0.15);
        text-decoration: none;
      }
      .kw-no-pdf { opacity: 0.5; cursor: default; }
      .kw-num {
        display: inline-block;
        font-size: 0.72rem; font-weight: bold;
        color: var(--aka);
        background: rgba(196,30,58,0.15);
        padding: 0.15rem 0.6rem;
        border-radius: 20px;
        margin-bottom: 0.4rem;
      }
      .kw-title {
        font-size: 0.82rem;
        color: var(--text-primary);
        line-height: 1.4;
        margin-bottom: 0.2rem;
      }
      .kw-sub { font-size: 0.74rem; color: var(--text-tertiary); }
      .kw-date { font-size: 0.68rem; color: var(--text-secondary); margin-top: 0.2rem; }
      .kw-pdf-badge {
        margin-top: 0.5rem;
        font-size: 0.7rem;
        color: var(--kin);
        font-weight: bold;
      }
      .kw-na { color: var(--text-secondary); font-weight: normal; }

      @media (max-width: 600px) {
        .kw-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 0.6rem; }
        .kw-card { padding: 0.8rem 0.5rem 0.6rem; }
        .kw-intro-title { font-size: 1.1rem; }
      }
    </style>`,
  });
}
