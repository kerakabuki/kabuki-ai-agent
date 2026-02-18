// src/web_layout.js
// =========================================================
// 共通レイアウト — 歌舞伎デザインのページシェル
// =========================================================

/**
 * 歌舞伎風ページの共通シェル
 * @param {Object} opts
 * @param {string} opts.title - ページタイトル（<title>タグ＋ヘッダー見出し）
 * @param {string} [opts.subtitle] - ヘッダーのサブテキスト
 * @param {string} opts.bodyHTML - メインコンテンツHTML
 * @param {string} [opts.headExtra] - <head>内に追加するHTML（script/style等）
 * @param {string} [opts.activeNav] - ナビゲーションのアクティブ項目キー
 * @param {boolean} [opts.hideNav] - true ならグロナビを非表示
 * @returns {string} 完全なHTML文字列
 */
export function pageShell({ title, subtitle, bodyHTML, headExtra = "", activeNav = "", hideNav = false, brand = "kabuki" }) {
  const navItems = brand === "jikabuki" ? jikabukiNav : kabukiNav;
  function navLink(n) {
    const active = n.key === activeNav;
    const cls = active ? "nav-item nav-active" : "nav-item";
    return `<a href="${n.href}" class="${cls}">${n.icon} ${n.label}</a>`;
  }
  const hubLinks = navItems.map(navLink).join("\n        ");

  const brandIcon = brand === "jikabuki" ? "🏯" : "🎭";
  const brandName = brand === "jikabuki" ? "JIKABUKI PLUS+" : "KABUKI PLUS+";
  const brandTagline = brand === "jikabuki"
    ? "演じる人の、デジタル楽屋。"
    : "歌舞伎を、もっと面白く。";

  const brandToggleHTML = `
    <div class="nav-brand-toggle" aria-label="プラットフォーム切替">
      <a href="/?brand=kabuki" class="nav-toggle-btn ${brand === "kabuki" ? "active" : ""}">KABUKI</a>
      <a href="/?brand=jikabuki" class="nav-toggle-btn ${brand === "jikabuki" ? "active" : ""}">JIKABUKI</a>
    </div>`;
  const navHTML = hideNav ? "" : `
<nav class="global-nav" id="global-nav">
  <div class="nav-inner">
    <div class="nav-links">${hubLinks}</div>
    ${brandToggleHTML}
  </div>
</nav>`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHTML(title)} | ${brandName}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap" rel="stylesheet">
${headExtra}
<style>
${BASE_CSS}
</style>
</head>
<body>

<header>
  <div class="header-inner">
    <div class="header-brand">${brandIcon} ${brandName}</div>
    <h1>${escHTML(title)}</h1>
    ${subtitle ? `<p class="header-sub">${escHTML(subtitle)}</p>` : ""}
    <div class="deco-line"><span class="diamond"></span></div>
  </div>
</header>
${navHTML}

<main>
${bodyHTML}
</main>

<section class="layout-support" aria-label="応援">
  <p class="support-onelink"><a href="/project">このプロジェクトを応援する →</a></p>
</section>

<footer>
  <p>${brandName} &mdash; ${brandTagline}</p>
  <p style="margin-top:4px;font-size:0.72rem;"><a href="/project" style="color:inherit;text-decoration:none;">地歌舞伎&times;AI プロジェクト</a>｜Produced by <a href="/jikabuki/gate/kera/about">KERAKABUKI（気良歌舞伎）</a></p>
  <p style="margin-top:4px;"><a href="/">トップへ戻る</a></p>
</footer>

</body>
</html>`;
}

// ─── ナビゲーション定義 ───
// KABUKI PLUS+（歌舞伎ファン・初心者向け）
const kabukiNav = [
  { key: "home", href: "/",       icon: "🏠", label: "トップ" },
  { key: "navi", href: "/kabuki/navi",   icon: "🧭", label: "NAVI" },
  { key: "live", href: "/kabuki/live",   icon: "📡", label: "LIVE" },
  { key: "reco", href: "/kabuki/reco",   icon: "📖", label: "RECO" },
  { key: "dojo", href: "/kabuki/dojo",   icon: "🥋", label: "DOJO" },
];

// JIKABUKI PLUS+（地歌舞伎の演者・運営者向け）
const jikabukiNav = [
  { key: "home", href: "/",                        icon: "🏠", label: "トップ" },
  { key: "gate", href: "/jikabuki/gate/kera",      icon: "🏯", label: "GATE" },
  { key: "info", href: "/jikabuki/info",           icon: "📡", label: "INFO" },
  { key: "base", href: "/jikabuki/base",           icon: "🔧", label: "BASE" },
  { key: "labo", href: "/jikabuki/labo",           icon: "🧪", label: "LABO" },
];

// ─── HTML エスケープ ───
export function escHTML(s) {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── 共通 CSS（デザインガイド v1.0 準拠） ───
const BASE_CSS = `
  :root {
    --bg-page: #FAF7F2;
    --bg-card: rgba(255,255,255,0.90);
    --bg-subtle: #F3EDE4;
    --bg-accent-soft: #FFF8ED;

    --text-primary: #3D3127;
    --text-secondary: #7A6F63;
    --text-tertiary: #A89E93;
    --text-on-accent: #FFFFFF;

    --gold: #C5A255;
    --gold-light: #E8D5A3;
    --gold-soft: #F5EDD8;
    --gold-dark: #A8873A;
    --gold-deep: #8B7230;

    --accent-1: #D4614B;
    --accent-1-soft: #FCEAE6;
    --accent-2: #6B8FAD;
    --accent-2-soft: #E6EFF6;
    --accent-3: #6B9E78;
    --accent-3-soft: #E8F3EB;
    --accent-4: #B8860B;
    --accent-4-soft: #FDF4DC;

    --border-light: #EDE7DD;
    --border-medium: #DDD5C8;
    --shadow-sm: 0 1px 3px rgba(61,49,39,0.06);
    --shadow-md: 0 4px 12px rgba(61,49,39,0.08);
    --shadow-lg: 0 8px 24px rgba(61,49,39,0.10);

    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;

    /* 旧変数の互換エイリアス（既存ページとの後方互換） */
    --kuro: var(--text-primary);
    --aka: var(--accent-1);
    --moegi: var(--accent-3);
    --kin: var(--gold);
    --shiro: var(--text-primary);
    --fuji: #B088C8;
    --asagi: var(--accent-2);
    --surface: var(--bg-subtle);
    --surface-alt: var(--bg-card);
    --border: var(--border-light);
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: 'Noto Sans JP', sans-serif;
    font-size: 1rem;
    line-height: 1.7;
    background: var(--bg-page);
    color: var(--text-primary);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  /* 紗綾形テクスチャ */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23A8873A' stroke-width='1.2'%3E%3Cpath d='M0 20 L20 20 L20 0'/%3E%3Cpath d='M20 20 L20 40 L40 40'/%3E%3Cpath d='M40 40 L40 20 L60 20'/%3E%3Cpath d='M60 20 L60 0'/%3E%3Cpath d='M40 40 L40 60 L20 60'/%3E%3Cpath d='M20 60 L20 80'/%3E%3Cpath d='M60 20 L60 40 L80 40'/%3E%3Cpath d='M0 60 L20 60'/%3E%3Cpath d='M60 40 L60 60 L80 60'/%3E%3Cpath d='M40 60 L60 60 L60 80'/%3E%3Cpath d='M0 40 L20 40'/%3E%3Cpath d='M40 0 L40 20'/%3E%3Cpath d='M80 0 L80 20'/%3E%3Cpath d='M80 60 L80 80'/%3E%3Cpath d='M40 80 L40 60'/%3E%3Cpath d='M0 0 L0 20'/%3E%3Cpath d='M0 60 L0 80'/%3E%3C/g%3E%3C/svg%3E");
    background-size: 80px 80px;
  }
  body > * { position: relative; z-index: 1; }

  a { color: var(--gold-dark); text-decoration: none; }
  a:hover { color: var(--gold); text-decoration: underline; }

  /* ── ヘッダー ── */
  header {
    text-align: center;
    padding: 28px 20px 0;
    background: var(--bg-page);
  }
  .header-inner { max-width: 960px; margin: 0 auto; }
  .header-brand {
    font-size: 11px;
    letter-spacing: 4px;
    color: var(--gold);
  }
  header h1 {
    font-family: 'Noto Serif JP', serif;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 5px;
    color: var(--text-primary);
  }
  .header-sub {
    margin-top: 2px;
    font-size: 12px;
    color: var(--text-tertiary);
    letter-spacing: 1px;
  }
  /* デコライン */
  .deco-line {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin: 12px auto 0;
    max-width: 200px;
  }
  .deco-line::before, .deco-line::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--gold-light), transparent);
  }
  .deco-line .diamond {
    width: 5px; height: 5px;
    background: var(--gold);
    transform: rotate(45deg);
  }

  /* ── グローバルナビ ── */
  .global-nav {
    border-top: 1px solid var(--border-light);
    background: rgba(255,255,255,0.5);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .global-nav::-webkit-scrollbar { display: none; }
  .nav-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: 960px;
    margin: 0 auto;
    padding: 0 8px;
    gap: 0;
  }
  .nav-links {
    display: flex;
    flex-wrap: nowrap;
  }
  .nav-brand-toggle {
    display: flex;
    margin-left: auto;
    flex-shrink: 0;
    gap: 4px;
  }
  .nav-toggle-btn {
    padding: 6px 10px;
    font-size: 11px;
    font-weight: 500;
    color: var(--text-tertiary);
    text-decoration: none;
    border-radius: var(--radius-sm);
    transition: color 0.15s, background 0.15s;
  }
  .nav-toggle-btn:hover {
    color: var(--text-secondary);
    background: var(--bg-subtle);
    text-decoration: none;
  }
  .nav-toggle-btn.active {
    color: var(--gold-dark);
    background: var(--gold-soft);
  }
  .nav-item {
    flex-shrink: 0;
    padding: 10px 14px;
    font-size: 12px;
    color: var(--text-tertiary);
    text-decoration: none;
    white-space: nowrap;
    transition: color 0.2s;
    position: relative;
  }
  .nav-item:hover { color: var(--text-secondary); text-decoration: none; }
  .nav-active {
    color: var(--gold-dark) !important;
    font-weight: 500;
  }
  .nav-active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 14px; right: 14px;
    height: 2px;
    background: var(--gold);
    border-radius: 2px 2px 0 0;
  }

  /* ── メイン ── */
  main {
    max-width: 960px;
    margin: 0 auto;
    padding: 24px 16px;
    flex: 1;
    width: 100%;
  }

  /* ── セクション見出し ── */
  .section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Noto Serif JP', serif;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: 1px;
    margin: 0 0 14px;
  }
  .section-title::before {
    content: '';
    width: 3px;
    height: 18px;
    background: var(--gold);
    border-radius: 2px;
    flex-shrink: 0;
  }

  /* ── カードグリッド ── */
  .card-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }

  /* ── カード共通 ── */
  .card {
    background: var(--bg-card);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: 1.3rem;
    transition: transform 0.15s, box-shadow 0.15s;
    position: relative;
    overflow: hidden;
    text-decoration: none;
    color: var(--text-primary);
    display: block;
    box-shadow: var(--shadow-sm);
    backdrop-filter: blur(4px);
  }
  .card::before { display: none; }
  .card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    text-decoration: none;
  }
  .card h3 {
    font-family: 'Noto Serif JP', serif;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.3rem;
    letter-spacing: 1px;
  }
  .card .card-desc {
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.6;
  }
  /* 左ボーダーアクセント */
  .card-accent-1 { border-left: 3px solid var(--accent-1); }
  .card-accent-2 { border-left: 3px solid var(--accent-2); }
  .card-accent-3 { border-left: 3px solid var(--accent-3); }
  .card-accent-4 { border-left: 3px solid var(--accent-4); }
  .card-accent-gold { border-left: 3px solid var(--gold); }

  /* ── 絵文字アイコン ── */
  .card-emoji {
    font-size: 1.8rem;
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-subtle);
    border-radius: var(--radius-sm);
  }

  /* ── ローディング ── */
  .loading {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--text-tertiary);
    font-size: 0.9rem;
  }
  .loading::before {
    content: "";
    display: block;
    width: 32px; height: 32px;
    margin: 0 auto 0.8rem;
    border: 3px solid var(--border-light);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── 空状態 ── */
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--text-tertiary);
    font-size: 0.9rem;
  }

  /* ── ボタン ── */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1.2rem;
    border-radius: var(--radius-sm);
    font-size: 0.9rem;
    font-family: inherit;
    letter-spacing: 0.08em;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    color: inherit;
  }
  .btn-primary {
    background: linear-gradient(135deg, var(--gold), var(--gold-dark));
    color: var(--text-on-accent);
    font-family: 'Noto Serif JP', serif;
    font-weight: 600;
    letter-spacing: 2px;
    box-shadow: var(--shadow-md);
  }
  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-lg);
    text-decoration: none;
    color: var(--text-on-accent);
  }
  .btn-secondary {
    background: none;
    border: 1px solid var(--border-medium);
    color: var(--text-secondary);
  }
  .btn-secondary:hover {
    border-color: var(--gold);
    color: var(--gold-dark);
    background: var(--gold-soft);
    text-decoration: none;
  }
  .btn-ghost {
    background: none;
    border: 1px dashed var(--border-medium);
    border-radius: var(--radius-md);
    color: var(--text-tertiary);
  }
  .btn-ghost:hover {
    border-color: var(--gold);
    border-style: solid;
    color: var(--gold-dark);
    background: var(--gold-soft);
  }

  /* ── バッジ ── */
  .badge {
    display: inline-block;
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--accent-1);
    color: #fff;
    letter-spacing: 0.05em;
  }

  /* ── パンくず ── */
  .breadcrumb {
    font-size: 12px;
    color: var(--text-tertiary);
    margin-bottom: 1rem;
  }
  .breadcrumb a { color: var(--gold-dark); opacity: 0.8; }
  .breadcrumb a:hover { opacity: 1; }
  .breadcrumb span { margin: 0 0.3rem; color: var(--text-tertiary); }

  /* ── タブ ── */
  .tab-bar {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--border-light);
    margin-bottom: 1rem;
    overflow-x: auto;
  }
  .tab-item {
    flex-shrink: 0;
    padding: 0.6rem 1rem;
    font-size: 13px;
    color: var(--text-tertiary);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
    background: none;
    border-top: none;
    border-left: none;
    border-right: none;
    font-family: inherit;
  }
  .tab-item:hover { color: var(--text-secondary); }
  .tab-active {
    color: var(--gold-dark);
    border-bottom-color: var(--gold);
  }

  /* ── リスト ── */
  .list-item {
    display: block;
    padding: 0.8rem 1rem;
    background: var(--bg-card);
    border-radius: var(--radius-sm);
    margin-bottom: 0.5rem;
    border: 1px solid var(--border-light);
    transition: all 0.2s;
    text-decoration: none;
    color: var(--text-primary);
    box-shadow: var(--shadow-sm);
  }
  .list-item:hover {
    border-color: var(--gold);
    text-decoration: none;
    transform: translateX(3px);
    box-shadow: var(--shadow-md);
  }
  .list-item-title {
    font-family: 'Noto Serif JP', serif;
    font-weight: 600;
    font-size: 0.95rem;
  }
  .list-item-sub {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 0.15rem;
  }

  /* ── 検索バー ── */
  .search-bar {
    margin-bottom: 1rem;
  }
  .search-bar input {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-sm);
    font-size: 14px;
    font-family: inherit;
    background: var(--bg-card);
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.2s;
  }
  .search-bar input:focus {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgba(197,162,85,0.1);
  }

  /* ── フッター ── */
  footer {
    text-align: center;
    padding: 1rem;
    font-size: 0.8rem;
    color: var(--text-tertiary);
    border-top: 1px solid var(--border-light);
    flex-shrink: 0;
    background: var(--bg-subtle);
  }
  footer a { color: var(--gold-dark); text-decoration: none; }
  footer a:hover { text-decoration: underline; }

  /* ── アニメーション ── */
  @keyframes fadeUp {
    from { opacity:0; transform: translateY(12px); }
    to   { opacity:1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp 0.35s ease both; }
  .fade-up-d1 { animation: fadeUp 0.35s ease 0.05s both; }
  .fade-up-d2 { animation: fadeUp 0.35s ease 0.1s both; }
  .fade-up-d3 { animation: fadeUp 0.35s ease 0.15s both; }
  .fade-up-d4 { animation: fadeUp 0.35s ease 0.2s both; }
  .fade-up-d5 { animation: fadeUp 0.35s ease 0.25s both; }
  .fade-up-d6 { animation: fadeUp 0.35s ease 0.3s both; }
  .fade-up-d7 { animation: fadeUp 0.35s ease 0.35s both; }

  /* ── 応援セクション（全ページ共通フッター上・1行リンク） ── */
  .layout-support {
    max-width: 960px;
    margin: 0 auto;
    padding: 20px 16px;
    border-top: 1px solid var(--border-light);
    text-align: center;
  }
  .support-onelink {
    margin: 0;
    font-size: 14px;
  }
  .support-onelink a {
    color: var(--gold);
    text-decoration: none;
    font-weight: 500;
    letter-spacing: 0.5px;
  }
  .support-onelink a:hover {
    text-decoration: underline;
  }

  /* ── レスポンシブ ── */
  @media (max-width: 600px) {
    header h1 { font-size: 18px; letter-spacing: 3px; }
    .nav-item { font-size: 11px; padding: 8px 10px; }
    .nav-toggle-btn { padding: 5px 8px; font-size: 10px; }
    main { padding: 16px 12px; }
    .card-grid { grid-template-columns: 1fr; }
    .layout-support { padding: 16px 12px; }
  }
`;
