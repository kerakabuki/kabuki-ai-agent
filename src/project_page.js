// src/project_page.js
// =========================================================
// JIKABUKI×AI プロジェクト紹介ページ — /project
// =========================================================

export function projectPageHTML() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>JIKABUKI×AI プロジェクト | KABUKI PLUS+</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎭</text></svg>">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
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
    --accent-red: #C04A35;
    --accent-red-soft: #FCEAE6;
    --accent-blue: #6B8FAD;
    --accent-blue-soft: #E6EFF6;
    --accent-green: #6B9E78;
    --accent-green-soft: #E8F3EB;
    --border-light: #EDE7DD;
    --border-medium: #DDD5C8;
    --shadow-sm: 0 1px 3px rgba(61,49,39,0.06);
    --shadow-md: 0 4px 12px rgba(61,49,39,0.08);
    --shadow-lg: 0 8px 24px rgba(61,49,39,0.10);
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Noto Sans JP', sans-serif;
    background: var(--bg-page);
    color: var(--text-primary);
    line-height: 1.8;
    position: relative;
  }

  body::before {
    content: '';
    position: fixed;
    inset: 0; z-index: 0;
    pointer-events: none;
    opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23A8873A' stroke-width='1.2'%3E%3Cpath d='M0 20 L20 20 L20 0'/%3E%3Cpath d='M20 20 L20 40 L40 40'/%3E%3Cpath d='M40 40 L40 20 L60 20'/%3E%3Cpath d='M60 20 L60 0'/%3E%3Cpath d='M40 40 L40 60 L20 60'/%3E%3Cpath d='M20 60 L20 80'/%3E%3Cpath d='M60 20 L60 40 L80 40'/%3E%3Cpath d='M0 60 L20 60'/%3E%3Cpath d='M60 40 L60 60 L80 60'/%3E%3Cpath d='M40 60 L60 60 L60 80'/%3E%3Cpath d='M0 40 L20 40'/%3E%3Cpath d='M40 0 L40 20'/%3E%3Cpath d='M80 0 L80 20'/%3E%3Cpath d='M80 60 L80 80'/%3E%3Cpath d='M40 80 L40 60'/%3E%3Cpath d='M0 0 L0 20'/%3E%3Cpath d='M0 60 L0 80'/%3E%3C/g%3E%3C/svg%3E");
    background-size: 80px 80px;
  }

  body > * { position: relative; z-index: 1; }

  .container { max-width: 640px; margin: 0 auto; padding: 0 16px; }

  /* ── ヒーロー ── */
  .hero {
    text-align: center;
    padding: 48px 20px 20px;
  }

  .hero .brand {
    font-size: 11px; letter-spacing: 4px; color: var(--gold); margin-bottom: 8px;
  }

  .hero .project-name {
    font-family: 'Noto Serif JP', serif;
    font-size: 28px; font-weight: 700; letter-spacing: 3px;
  }

  .hero .project-name .ai { color: var(--gold-dark); }

  .deco-line {
    display: flex; align-items: center; justify-content: center;
    gap: 12px; margin: 16px auto; max-width: 200px;
  }
  .deco-line::before, .deco-line::after {
    content: ''; flex: 1; height: 1px;
    background: linear-gradient(90deg, transparent, var(--gold-light), transparent);
  }
  .deco-line .diamond {
    width: 5px; height: 5px; background: var(--gold); transform: rotate(45deg);
  }

  .hero .catchphrase {
    font-family: 'Noto Serif JP', serif;
    font-size: 20px;
    font-weight: 700;
    color: var(--accent-red);
    margin: 20px 0 6px;
    letter-spacing: 2px;
  }

  .hero .tagline {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.8;
  }

  .hero .tagline-sub {
    font-size: 12px;
    color: var(--text-tertiary);
    margin-top: 8px;
    font-style: italic;
    letter-spacing: 0.5px;
  }

  /* ── セクション ── */
  .section { margin-top: 40px; }

  .section-heading {
    display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
  }

  .section-heading .bar {
    width: 3px; height: 18px; background: var(--gold); border-radius: 2px;
  }

  .section-heading h2 {
    font-family: 'Noto Serif JP', serif;
    font-size: 16px; font-weight: 600; letter-spacing: 1px;
  }

  /* ── カード ── */
  .card {
    background: var(--bg-card);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    backdrop-filter: blur(4px);
    padding: 24px;
    margin-bottom: 16px;
  }

  .card p {
    font-size: 14px; color: var(--text-secondary); margin-bottom: 12px;
  }
  .card p:last-child { margin-bottom: 0; }

  .points-card .point-item {
    font-size: 14px; color: var(--text-secondary);
    line-height: 1.75;
    margin-bottom: 14px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--border-light);
  }
  .points-card .point-item:last-of-type { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }

  .card .lead {
    font-family: 'Noto Serif JP', serif;
    font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;
  }

  /* ── ベン図 ── */
  .venn-section {
    text-align: center;
    padding: 8px 0 0;
  }

  .venn-container {
    position: relative;
    width: 280px;
    height: 240px;
    margin: 0 auto 24px;
  }

  .venn-circle {
    position: absolute;
    width: 150px;
    height: 150px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.5px;
    line-height: 1.4;
    transition: transform 0.3s;
  }

  .venn-circle:hover {
    transform: scale(1.05);
    z-index: 10;
  }

  .venn-circle.c-culture {
    background: rgba(61, 49, 39, 0.82);
    color: #fff;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
  }
  .venn-circle.c-culture:hover {
    transform: translateX(-50%) scale(1.05);
  }

  .venn-circle.c-arts {
    background: rgba(140, 135, 128, 0.72);
    color: #fff;
    bottom: 10px;
    left: 10px;
  }

  .venn-circle.c-digital {
    background: rgba(192, 74, 53, 0.72);
    color: #fff;
    bottom: 10px;
    right: 10px;
  }

  .venn-label-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    text-align: left;
  }

  .venn-label {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.6;
  }

  .venn-label .dot {
    width: 10px; height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 5px;
  }

  .dot-culture { background: rgba(61, 49, 39, 0.82); }
  .dot-arts { background: rgba(140, 135, 128, 0.72); }
  .dot-digital { background: rgba(192, 74, 53, 0.72); }

  /* ── 開発者の想い ── */
  .dev-message {
    background: linear-gradient(135deg, #3D3127 0%, #5A4E42 100%);
    color: #F3EDE4;
    border-radius: var(--radius-lg);
    padding: 32px 28px;
    margin-bottom: 16px;
    box-shadow: var(--shadow-lg);
    position: relative;
    overflow: hidden;
  }
  .dev-message::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 180px; height: 180px;
    border-radius: 50%;
    background: rgba(197,162,85,0.08);
  }
  .dev-message .dm-quote {
    font-family: 'Noto Serif JP', serif;
    font-size: 18px;
    font-weight: 600;
    color: var(--gold-light);
    margin-bottom: 16px;
    letter-spacing: 1px;
    line-height: 1.6;
  }
  .dev-message .dm-body {
    font-size: 13px;
    line-height: 2.0;
    color: #D8D0C4;
  }
  .dev-message .dm-body p {
    color: inherit;
    margin-bottom: 14px;
  }
  .dev-message .dm-body p:last-child { margin-bottom: 0; }
  .dev-message .dm-sign {
    margin-top: 20px;
    font-size: 12px;
    color: var(--gold);
    letter-spacing: 1px;
    text-align: right;
  }

  /* ── ビジョンカード ── */
  .vision-grid {
    display: flex; flex-direction: column; gap: 12px;
  }

  .vision-item {
    display: flex; gap: 14px; padding: 18px 20px;
    background: var(--bg-card); border: 1px solid var(--border-light);
    border-radius: var(--radius-md); box-shadow: var(--shadow-sm);
  }

  .vision-item .v-icon {
    width: 44px; height: 44px; border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; flex-shrink: 0;
  }

  .vision-item:nth-child(1) .v-icon { background: var(--accent-red-soft); }
  .vision-item:nth-child(2) .v-icon { background: var(--accent-blue-soft); }
  .vision-item:nth-child(3) .v-icon { background: var(--accent-green-soft); }
  .vision-item:nth-child(4) .v-icon { background: var(--gold-soft); }

  .vision-item .v-title {
    font-family: 'Noto Serif JP', serif; font-size: 14px; font-weight: 600; margin-bottom: 2px;
  }

  .vision-item .v-desc {
    font-size: 12px; color: var(--text-secondary); line-height: 1.6;
  }

  /* ── 数字で見る ── */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }
  .stat-card {
    text-align: center;
    padding: 20px 12px;
    background: var(--bg-card);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
  }
  .stat-card .stat-num {
    font-family: 'Noto Serif JP', serif;
    font-size: 28px;
    font-weight: 700;
    color: var(--gold-dark);
    line-height: 1.2;
  }
  .stat-card .stat-unit {
    font-size: 13px;
    color: var(--gold-dark);
    font-weight: 600;
  }
  .stat-card .stat-label {
    font-size: 11px;
    color: var(--text-tertiary);
    margin-top: 4px;
    line-height: 1.4;
  }

  /* ── 機能一覧 ── */
  .feature-row {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
  }

  .feature-card {
    background: var(--bg-card); border: 1px solid var(--border-light);
    border-radius: var(--radius-md); box-shadow: var(--shadow-sm);
    padding: 16px; text-align: center;
    transition: transform 0.15s, box-shadow 0.15s;
  }

  .feature-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
  .feature-card .f-icon { font-size: 24px; margin-bottom: 6px; }
  .feature-card .f-title {
    font-family: 'Noto Serif JP', serif; font-size: 13px; font-weight: 600; margin-bottom: 3px;
  }
  .feature-card .f-desc { font-size: 11px; color: var(--text-tertiary); line-height: 1.5; }

  /* ── AI紹介カード ── */
  .ai-card {
    background: linear-gradient(135deg, var(--gold), var(--gold-dark));
    color: white;
    border-radius: var(--radius-lg);
    padding: 28px 24px;
    margin-bottom: 16px;
    box-shadow: var(--shadow-md);
    text-align: center;
  }
  .ai-card .ai-name {
    font-family: 'Noto Serif JP', serif;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 2px;
    margin-bottom: 4px;
  }
  .ai-card .ai-role {
    font-size: 13px;
    opacity: 0.9;
    margin-bottom: 16px;
  }
  .ai-card .ai-features {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    text-align: left;
  }
  .ai-card .ai-feat {
    padding: 10px 12px;
    background: rgba(255,255,255,0.15);
    border-radius: var(--radius-sm);
    font-size: 12px;
    line-height: 1.5;
  }
  .ai-card .ai-feat strong {
    display: block;
    font-size: 11px;
    opacity: 0.8;
    margin-bottom: 2px;
    letter-spacing: 0.5px;
  }

  /* ── チャネルリンク集 ── */
  .channel-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .channel-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    background: var(--bg-card);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    text-decoration: none;
    color: inherit;
    transition: all 0.15s;
  }

  .channel-link:hover {
    border-color: var(--gold-light);
    background: var(--bg-accent-soft);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .channel-link .ch-icon {
    width: 36px; height: 36px;
    border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
    background: var(--bg-subtle);
  }

  .channel-link .ch-name {
    font-size: 13px; font-weight: 500;
  }

  .channel-link .ch-desc {
    font-size: 10px; color: var(--text-tertiary);
  }

  /* ── プロジェクト情報テーブル ── */
  .info-table { width: 100%; font-size: 13px; border-collapse: collapse; }
  .info-table td {
    padding: 10px 0; border-bottom: 1px solid var(--border-light); vertical-align: top;
  }
  .info-table td:first-child {
    width: 100px; font-weight: 500; color: var(--text-tertiary);
    font-size: 12px; letter-spacing: 0.5px;
  }
  .info-table td:last-child { color: var(--text-secondary); }

  /* ── 応援セクション ── */
  .support-section { margin-top: 48px; text-align: center; }

  .support-message {
    font-family: 'Noto Serif JP', serif;
    font-size: 18px; font-weight: 600; letter-spacing: 1px; margin-bottom: 6px;
  }

  .support-sub {
    font-size: 13px; color: var(--text-secondary); margin-bottom: 28px; line-height: 1.8;
  }

  .support-cards { display: flex; flex-direction: column; gap: 14px; }

  .support-card {
    display: flex; align-items: center; gap: 16px; padding: 20px;
    background: var(--bg-card); border: 1px solid var(--border-light);
    border-radius: var(--radius-md); box-shadow: var(--shadow-sm);
    text-align: left; cursor: pointer; transition: all 0.15s;
    text-decoration: none; color: inherit;
  }

  .support-card:hover {
    border-color: var(--gold-light); background: var(--bg-accent-soft); transform: translateX(4px);
  }

  .support-card .s-icon {
    width: 48px; height: 48px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; flex-shrink: 0;
  }

  .support-card:nth-child(1) .s-icon {
    background: linear-gradient(135deg, var(--gold), var(--gold-dark)); color: white;
  }
  .support-card:nth-child(2) .s-icon { background: var(--accent-blue-soft); }
  .support-card:nth-child(3) .s-icon { background: var(--accent-green-soft); }

  .support-card .s-text { flex: 1; }
  .support-card .s-title {
    font-family: 'Noto Serif JP', serif; font-size: 15px; font-weight: 600;
  }
  .support-card .s-desc {
    font-size: 12px; color: var(--text-secondary); margin-top: 2px; line-height: 1.5;
  }
  .support-card .s-arrow {
    color: var(--text-tertiary); font-size: 16px; transition: transform 0.15s; flex-shrink: 0;
  }
  .support-card:hover .s-arrow { transform: translateX(3px); color: var(--gold); }

  /* SNSシェアバー */
  .share-bar { display: flex; justify-content: center; gap: 12px; margin-top: 24px; }

  .share-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 10px 20px; border-radius: 24px;
    font-size: 13px; font-weight: 500; text-decoration: none;
    transition: all 0.15s; border: none; cursor: pointer;
    font-family: inherit;
  }
  .share-btn:hover { transform: translateY(-1px); box-shadow: var(--shadow-md); }
  .share-btn.x-share { background: #1D1D1D; color: white; }
  .share-btn.line-share { background: #06C755; color: white; }
  .share-btn.copy-link {
    background: var(--bg-subtle); color: var(--text-secondary);
    border: 1px solid var(--border-medium);
  }

  /* トップに戻る */
  .back-to-top {
    display: inline-flex; align-items: center; gap: 6px;
    margin-top: 32px; padding: 10px 20px;
    background: none; border: 1px solid var(--border-medium);
    border-radius: var(--radius-sm); font-size: 13px;
    color: var(--text-secondary); text-decoration: none; transition: all 0.15s;
  }
  .back-to-top:hover {
    border-color: var(--gold); color: var(--gold-dark); background: var(--gold-soft);
  }

  /* ── ナビバー ── */
  .pj-navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px;
    background: rgba(250, 247, 242, 0.92);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border-light);
  }
  .pj-navbar-brand {
    font-family: 'Noto Serif JP', serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    text-decoration: none;
    letter-spacing: 1px;
  }
  .pj-navbar-brand:hover { color: var(--gold-dark); }
  .pj-navbar-links {
    display: flex;
    gap: 16px;
    align-items: center;
  }
  .pj-navbar-links a {
    font-size: 12px;
    color: var(--text-secondary);
    text-decoration: none;
    letter-spacing: 0.5px;
    transition: color 0.15s;
  }
  .pj-navbar-links a:hover { color: var(--gold-dark); }

  .site-footer {
    text-align: center;
    padding: 32px 20px 24px;
    border-top: 1px solid var(--border-light);
    background: var(--bg-subtle);
  }
  .site-footer-links {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-bottom: 12px;
  }
  .site-footer-links a {
    font-size: 12px;
    color: var(--text-secondary);
    text-decoration: none;
    transition: color 0.15s;
  }
  .site-footer-links a:hover { color: var(--gold-dark); }
  .site-footer-copy {
    font-size: 11px;
    color: var(--text-tertiary);
    letter-spacing: 1px;
  }

  /* アニメーション */
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-in { animation: fadeInUp 0.4s ease-out both; }
  .delay-1 { animation-delay: 0.05s; }
  .delay-2 { animation-delay: 0.10s; }
  .delay-3 { animation-delay: 0.15s; }
  .delay-4 { animation-delay: 0.20s; }
  .delay-5 { animation-delay: 0.25s; }
  .delay-6 { animation-delay: 0.30s; }
  .delay-7 { animation-delay: 0.35s; }
  .delay-8 { animation-delay: 0.40s; }
  .delay-9 { animation-delay: 0.45s; }
  .delay-10 { animation-delay: 0.50s; }

  @media (max-width: 480px) {
    .hero .project-name { font-size: 24px; }
    .hero .catchphrase { font-size: 18px; }
    .feature-row { grid-template-columns: 1fr; }
    .channel-grid { grid-template-columns: 1fr; }
    .share-bar { flex-direction: column; align-items: center; }
    .venn-container { width: 240px; height: 210px; }
    .venn-circle { width: 130px; height: 130px; font-size: 10px; }
    .stats-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .stat-card { padding: 14px 8px; }
    .stat-card .stat-num { font-size: 22px; }
    .ai-card .ai-features { grid-template-columns: 1fr; }
    .dev-message { padding: 24px 20px; }
    .dev-message .dm-quote { font-size: 16px; }
  }
</style>
</head>
<body>

<!-- ═══ ナビバー ═══ -->
<nav class="pj-navbar">
  <a href="/" class="pj-navbar-brand">KABUKI PLUS+</a>
  <div class="pj-navbar-links">
    <a href="/?brand=jikabuki">JIKABUKI PLUS+</a>
    <a href="/">トップ</a>
  </div>
</nav>

<!-- ═══ ヒーロー ═══ -->
<header class="hero animate-in">
  <div class="brand">KABUKI PLUS+</div>
  <div class="project-name">JIKABUKI × <span class="ai">AI</span></div>
  <div class="deco-line"><span class="diamond"></span></div>
  <div class="catchphrase">守るために、変わる。</div>
  <div class="tagline">
    地歌舞伎を、テクノロジーの力で<br>
    もっと身近に、もっと面白く。
  </div>
  <div class="tagline-sub">
    Not just preserving the tradition.<br>
    Carrying forward the spirit — into the future, and to the world.
  </div>
</header>

<div class="container">

  <!-- ═══ プロジェクト概要 ═══ -->
  <section class="section animate-in delay-1">
    <div class="section-heading">
      <span class="bar"></span>
      <h2>プロジェクトについて</h2>
    </div>

    <div class="card">
      <p class="lead">「地歌舞伎」を知っていますか？</p>
      <p>
        江戸時代から続く地域の歌舞伎文化──農家や会社員など、地域の人々が自ら演じる「地歌舞伎」。岐阜県郡上市の気良歌舞伎もその一つ。2024年に完成した常設舞台「気良座」を拠点に活動しています。
      </p>
      <p>
        JIKABUKI×AI は、AIの力で歌舞伎の「知る・観る・演じる」体験をもっと豊かにするプラットフォームです。初めての歌舞伎ファンから、実際に舞台に立つ演者まで、それぞれに必要なツールをひとつの場所に。
      </p>
      <p>
        歌舞伎AIガイド「けらのすけ」を中心に、ファン向けの <strong>KABUKI PLUS+</strong> と、地歌舞伎団体の運営を支える <strong>JIKABUKI PLUS+</strong> の 2ブランド・8モジュールで構成。LINE Bot と Web PWA の2面展開で、サーバーレス基盤により<strong>ランニングコストほぼ無料</strong>で運用しています。
      </p>
    </div>
  </section>

  <!-- ═══ 開発者の想い ═══ -->
  <section class="section animate-in delay-2">
    <div class="section-heading">
      <span class="bar"></span>
      <h2>開発者の想い</h2>
    </div>

    <div class="dev-message">
      <div class="dm-quote">
        「伝統を守る」って、<br>
        古いものをそのまま置いておくことじゃない。
      </div>
      <div class="dm-body">
        <p>気良歌舞伎の事務局を務めるなかで、いつも感じていたことがあります。台本を探すのに何日もかかる。稽古のスケジュール調整はLINEグループで埋もれる。団体の魅力を伝えたくても、ウェブサイトを作る余裕がない。</p>
        <p>全国に約200ある地歌舞伎の団体が、きっと同じ課題を抱えている。ならば、テクノロジーの力で「演じる人の楽屋」を作れないか。ファンの人たちが歌舞伎をもっと気軽に楽しめる場所を作れないか。</p>
        <p>AIに歌舞伎のことを教え込み、演目ガイドや用語辞典を整え、公演情報を自動で集め、団体の公式サイトを質問に答えるだけで生成できるようにする──。ひとつひとつ、手作りで積み上げてきました。</p>
        <p>56,000行を超えるコードのすべてに、「地歌舞伎を次の世代に届けたい」という想いが込められています。</p>
      </div>
      <div class="dm-sign">── 気良歌舞伎事務局</div>
    </div>
  </section>

  <!-- ═══ 3つの柱（ベン図） ═══ -->
  <section class="section venn-section animate-in delay-3">
    <div class="section-heading">
      <span class="bar"></span>
      <h2>コンセプト ── 3つの柱</h2>
    </div>

    <div class="venn-container">
      <div class="venn-circle c-culture">地域文化<br><small>Regional<br>Culture</small></div>
      <div class="venn-circle c-arts">伝統芸能<br><small>Traditional<br>Performing Arts</small></div>
      <div class="venn-circle c-digital">デジタル化<br><small>Digital<br>Innovation</small></div>
    </div>

    <div class="card" style="text-align: left;">
      <div class="venn-label-group">
        <div class="venn-label">
          <span class="dot dot-culture"></span>
          <span><strong>地域文化</strong> ── 気良の地域に根付く伝統文化を未来へつなぐ</span>
        </div>
        <div class="venn-label">
          <span class="dot dot-arts"></span>
          <span><strong>伝統芸能</strong> ── 歌舞伎という「表現の力」で地域を盛り上げる</span>
        </div>
        <div class="venn-label">
          <span class="dot dot-digital"></span>
          <span><strong>デジタル化</strong> ── デジタルの新しい手段で保存と発信を可能にする</span>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ 数字で見る ═══ -->
  <section class="section animate-in delay-4">
    <div class="section-heading">
      <span class="bar"></span>
      <h2>数字で見るプロジェクト<span style="font-size:11px; font-weight:400; color:var(--text-tertiary); margin-left:8px;">R8.3.7 現在</span></h2>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-num">56,300<span class="stat-unit">+</span></div>
        <div class="stat-label">行のコード</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">72</div>
        <div class="stat-label">モジュール</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">8</div>
        <div class="stat-label">機能モジュール</div>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-num">23<span class="stat-unit">+</span></div>
        <div class="stat-label">演目ガイド</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">126</div>
        <div class="stat-label">用語辞典</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">6</div>
        <div class="stat-label">対応劇場</div>
      </div>
    </div>
  </section>

  <!-- ═══ けらのすけ ═══ -->
  <section class="section animate-in delay-5">
    <div class="section-heading">
      <span class="bar"></span>
      <h2>AI「けらのすけ」</h2>
    </div>

    <div class="ai-card">
      <div class="ai-name">けらのすけ</div>
      <div class="ai-role">歌舞伎の「友達」── 教科書ではなく、会話で寄り添う存在</div>
      <div class="ai-features">
        <div class="ai-feat">
          <strong>メインAI</strong>
          Gemini 2.5 Flash<br>+ RAG検索拡張生成
        </div>
        <div class="ai-feat">
          <strong>Function Calling</strong>
          公演 / ニュース / 用語<br>演目 / 団体情報
        </div>
        <div class="ai-feat">
          <strong>フォールバック</strong>
          Workers AI で<br>常時応答を保証
        </div>
        <div class="ai-feat">
          <strong>チャネル</strong>
          LINE Bot +<br>Web チャット
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ ビジョン ═══ -->
  <section class="section animate-in delay-5">
    <div class="section-heading">
      <span class="bar"></span>
      <h2>めざしていること</h2>
    </div>

    <div class="vision-grid">
      <div class="vision-item">
        <div class="v-icon">🧭</div>
        <div>
          <div class="v-title">知るをもっと手軽に</div>
          <div class="v-desc">演目のあらすじ、用語の意味、俳優の情報──AIガイド「けらのすけ」に聞くだけで、歌舞伎の予備知識がすぐ手に入る世界。23+の演目ガイドと126語の用語辞典を搭載。</div>
        </div>
      </div>
      <div class="vision-item">
        <div class="v-icon">📡</div>
        <div>
          <div class="v-title">地歌舞伎情報を全国に届ける</div>
          <div class="v-desc">6大劇場の公演スケジュールを自動取得。ニュースは毎日2回自動更新。分散していた地歌舞伎の情報を集約し、全国200以上の団体をつなぐ情報ハブへ。</div>
        </div>
      </div>
      <div class="vision-item">
        <div class="v-icon">🔧</div>
        <div>
          <div class="v-title">演じる人の楽屋をつくる</div>
          <div class="v-desc">稽古スケジュール、出欠管理、配役管理、台本共有、公演記録、収支管理──地歌舞伎団体の運営に必要なツールをひとつのプラットフォームに。</div>
        </div>
      </div>
      <div class="vision-item">
        <div class="v-icon">🏯</div>
        <div>
          <div class="v-title">地歌舞伎を次の世代へ</div>
          <div class="v-desc">気良歌舞伎から始まり、全国の地歌舞伎団体へ。質問に答えるだけで公式サイト・FAQボット・チャットボットが完成。ITに不慣れな事務局でも参入障壁ゼロ。</div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ 主な機能 ═══ -->
  <section class="section animate-in delay-6">
    <div class="section-heading">
      <span class="bar"></span>
      <h2>つくっているもの</h2>
    </div>

    <p style="font-size:13px; font-weight:600; color:var(--text-secondary); margin:0 0 8px; letter-spacing:1px;">KABUKI PLUS+（ファン向け）</p>
    <div class="feature-row" style="margin-bottom:20px;">
      <div class="feature-card">
        <div class="f-icon">🧭</div>
        <div class="f-title">KABUKI NAVI</div>
        <div class="f-desc">演目ガイド・用語辞典<br>おすすめ・観劇マナー</div>
      </div>
      <div class="feature-card">
        <div class="f-icon">📡</div>
        <div class="f-title">KABUKI LIVE</div>
        <div class="f-desc">ニュース自動取得<br>6劇場 公演スケジュール</div>
      </div>
      <div class="feature-card">
        <div class="f-icon">📝</div>
        <div class="f-title">KABUKI RECO</div>
        <div class="f-desc">観劇記録・推し管理<br>SNSシェア・公開プロフィール</div>
      </div>
      <div class="feature-card">
        <div class="f-icon">🥋</div>
        <div class="f-title">KABUKI DOJO</div>
        <div class="f-desc">3段階クイズ・台詞稽古<br>大向う道場・おひねり</div>
      </div>
    </div>

    <p style="font-size:13px; font-weight:600; color:var(--text-secondary); margin:0 0 8px; letter-spacing:1px;">JIKABUKI PLUS+（演者・運営者向け）</p>
    <div class="feature-row">
      <div class="feature-card">
        <div class="f-icon">🏯</div>
        <div class="f-title">GATE</div>
        <div class="f-desc">団体公式サイト<br>8テーマ・FAQボット</div>
      </div>
      <div class="feature-card">
        <div class="f-icon">📡</div>
        <div class="f-title">INFO</div>
        <div class="f-desc">地歌舞伎ニュース<br>団体・劇場ディレクトリ</div>
      </div>
      <div class="feature-card">
        <div class="f-icon">🔧</div>
        <div class="f-title">BASE</div>
        <div class="f-desc">稽古・配役・台本・収支<br>スケジュール・出欠管理</div>
      </div>
      <div class="feature-card">
        <div class="f-icon">🧪</div>
        <div class="f-title">LABO</div>
        <div class="f-desc">演目ガイド制作<br>用語・クイズ編集</div>
      </div>
    </div>
  </section>

  <!-- ═══ プロジェクトの要点 ═══ -->
  <section class="section animate-in delay-7">
    <div class="section-heading">
      <span class="bar"></span>
      <h2>プロジェクトの要点</h2>
    </div>

    <div class="card points-card">
      <div class="point-item"><strong>けらのすけ = 歌舞伎の「友達」</strong> ── 教科書ではなく友達。会話で相談に乗り、必要ならWebへ案内。Gemini 2.5 Flash + RAG + Function Calling 5ツールで、演目・用語・公演・ニュース・団体情報を横断検索。</div>
      <div class="point-item"><strong>ランニングコストほぼ無料</strong> ── Cloudflare Workers / KV / R2の無料枠 + Gemini無料枠で運用。地歌舞伎団体の負担にならないサステナブルな設計。</div>
      <div class="point-item"><strong>LINE + Web の2面展開</strong> ── 日本のユーザーリーチに最適。LINEは会話特化、Webは全機能。PWA対応でスマホにインストール可能。</div>
      <div class="point-item"><strong>チャットで導入完了</strong> ── 新規団体はけらのすけの質問に答えるだけで、FAQ・公式サイト・チャットボットが自動生成。8テーマから選ぶだけでデザインも完成。</div>
      <div class="point-item"><strong>段階的に</strong> ── まず気良歌舞伎で全機能を使い込み、磨いてから他団体へ。気良が「最高のテンプレート」に。</div>
      <p style="margin-top:1rem; font-size:13px;"><a href="/architecture" style="color:var(--gold-dark); font-weight:600;">サービス構成図で詳しく見る →</a></p>
    </div>
  </section>

  <!-- ═══ チャネルリンク集 ═══ -->
  <section class="section animate-in delay-8">
    <div class="section-heading">
      <span class="bar"></span>
      <h2>気良歌舞伎チャネル</h2>
    </div>

    <div class="channel-grid">
      <a href="https://kerakabuki.jimdofree.com/" class="channel-link" target="_blank" rel="noopener">
        <div class="ch-icon">🌐</div>
        <div>
          <div class="ch-name">公式サイト</div>
          <div class="ch-desc">基本情報・公演案内</div>
        </div>
      </a>
      <a href="https://www.youtube.com/@kerakabuki" class="channel-link" target="_blank" rel="noopener">
        <div class="ch-icon">▶️</div>
        <div>
          <div class="ch-name">YouTube</div>
          <div class="ch-desc">公演映像・台詞解説</div>
        </div>
      </a>
      <a href="https://note.com/kerakabuki" class="channel-link" target="_blank" rel="noopener">
        <div class="ch-icon">📝</div>
        <div>
          <div class="ch-name">Note</div>
          <div class="ch-desc">ブログ・物語発信</div>
        </div>
      </a>
      <a href="https://medium.com/@kerakabuki" class="channel-link" target="_blank" rel="noopener">
        <div class="ch-icon">🌏</div>
        <div>
          <div class="ch-name">Medium</div>
          <div class="ch-desc">英語ブログ</div>
        </div>
      </a>
      <a href="https://www.facebook.com/kerakabuki/" class="channel-link" target="_blank" rel="noopener">
        <div class="ch-icon">📘</div>
        <div>
          <div class="ch-name">Facebook</div>
          <div class="ch-desc">活動報告・イベント</div>
        </div>
      </a>
      <a href="https://www.instagram.com/kerakabuki_official/" class="channel-link" target="_blank" rel="noopener">
        <div class="ch-icon">📷</div>
        <div>
          <div class="ch-name">Instagram</div>
          <div class="ch-desc">ビジュアル発信</div>
        </div>
      </a>
      <a href="https://x.com/KeraKabuki" class="channel-link" target="_blank" rel="noopener">
        <div class="ch-icon">𝕏</div>
        <div>
          <div class="ch-name">X (Twitter)</div>
          <div class="ch-desc">最新情報・海外発信</div>
        </div>
      </a>
      <a href="https://opensea.io/KeraKabukiNFT/items" class="channel-link" target="_blank" rel="noopener">
        <div class="ch-icon">💎</div>
        <div>
          <div class="ch-name">OpenSea</div>
          <div class="ch-desc">NFTコレクション</div>
        </div>
      </a>
    </div>
  </section>

  <!-- ═══ プロジェクト情報 ═══ -->
  <section class="section animate-in delay-9">
    <div class="section-heading">
      <span class="bar"></span>
      <h2>プロジェクト情報</h2>
    </div>

    <div class="card">
      <table class="info-table">
        <tr><td>運営</td><td>気良歌舞伎（けらかぶき）</td></tr>
        <tr><td>開発者</td><td>けらのすけ（気良歌舞伎事務局）</td></tr>
        <tr><td>開発協力</td><td>岐阜大学 日本語・日本文化教育センター<br>株式会社杉インターフェース</td></tr>
        <tr><td>技術構成</td><td>Cloudflare Workers / R2 / KV<br>Gemini 2.5 Flash + Workers AI<br>LINE Messaging API</td></tr>
        <tr><td>規模</td><td>51,500+ 行 / 68 モジュール / 90+ ルート</td></tr>
        <tr><td>開始</td><td>2025年〜</td></tr>
        <tr><td>ステータス</td><td>公開運用中</td></tr>
      </table>
    </div>
  </section>

  <!-- ═══ 応援セクション ═══ -->
  <section class="support-section animate-in delay-10">
    <div class="support-message">応援してくれませんか？</div>
    <div class="support-sub">
      気良歌舞伎が開発しているプロジェクトです。<br>
      どんな形の応援でも、大きな力になります。
    </div>

    <div class="support-cards">
      <a href="https://congrant.com/project/kerakabuki/21600" target="_blank" rel="noopener" class="support-card">
        <div class="s-icon">💛</div>
        <div class="s-text">
          <div class="s-title">サポートする</div>
          <div class="s-desc">開発費用・サーバー費用を支援いただけると、開発をもっと加速できます。</div>
        </div>
        <span class="s-arrow">→</span>
      </a>
      <a href="/join" class="support-card">
        <div class="s-icon">🤝</div>
        <div class="s-text">
          <div class="s-title">一緒につくる</div>
          <div class="s-desc">エンジニア、デザイナー、歌舞伎好き──スキル問わず、興味のある方はぜひ。</div>
        </div>
        <span class="s-arrow">→</span>
      </a>
      <a href="/feedback" class="support-card">
        <div class="s-icon">💬</div>
        <div class="s-text">
          <div class="s-title">使ってみて感想を聞かせて</div>
          <div class="s-desc">「ここがいい」「ここが惜しい」──ユーザーの声が一番の道しるべです。</div>
        </div>
        <span class="s-arrow">→</span>
      </a>
    </div>

    <div class="share-bar">
      <a href="https://twitter.com/intent/tweet?text=JIKABUKI%C3%97AI%20%E2%80%93%20%E5%9C%B0%E6%AD%8C%E8%88%9E%E4%BC%8E%E3%82%92AI%E3%81%A7%E3%82%82%E3%81%A3%E3%81%A8%E8%BA%AB%E8%BF%91%E3%81%AB%F0%9F%8E%AD&url=https%3A%2F%2Fkabukiplus.com%2Fproject" class="share-btn x-share" target="_blank" rel="noopener">
        𝕏 シェア
      </a>
      <a href="https://social-plugins.line.me/lineit/share?url=https%3A%2F%2Fkabukiplus.com%2Fproject" class="share-btn line-share" target="_blank" rel="noopener">
        LINE で送る
      </a>
      <button class="share-btn copy-link" onclick="navigator.clipboard.writeText(location.href); this.textContent='✓ コピーしました';">
        🔗 リンクをコピー
      </button>
    </div>
  </section>

  <div style="text-align: center;">
    <a href="/" class="back-to-top animate-in delay-10">← トップに戻る</a>
  </div>

</div>

<footer class="site-footer">
  <div class="site-footer-links">
    <a href="/">トップ</a>
    <a href="/?brand=jikabuki">JIKABUKI PLUS+</a>
    <a href="/jikabuki/gate/kera">気良歌舞伎</a>
    <a href="/architecture">構成図</a>
  </div>
  <div class="site-footer-copy">KABUKI PLUS+ &copy; 2026</div>
</footer>

</body>
</html>`;
}
