// src/architecture_page.js
// =========================================================
// サービス構成図 — /architecture
// KABUKI PLUS+ / JIKABUKI PLUS+ ツインブランド構想 v3.1
// =========================================================

export function architecturePageHTML() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>サービス構成図 | KABUKI PLUS+</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎭</text></svg>">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg-page: #FAF7F2;
    --bg-card: rgba(255,255,255,0.92);
    --bg-subtle: #F3EDE4;
    --text-primary: #3D3127;
    --text-secondary: #7A6F63;
    --text-tertiary: #A89E93;
    --gold: #C5A255;
    --gold-light: #E8D5A3;
    --gold-soft: #F5EDD8;
    --gold-dark: #A8873A;
    --accent-red: #C04A35;
    --accent-red-soft: #FCEAE6;
    --accent-green: #6B9E78;
    --accent-green-soft: #E8F3EB;
    --accent-blue: #6B8FAD;
    --accent-blue-soft: #E6EFF6;
    --border-light: #EDE7DD;
    --shadow-sm: 0 1px 3px rgba(61,49,39,0.06);
    --shadow-md: 0 4px 12px rgba(61,49,39,0.08);
    --shadow-lg: 0 8px 24px rgba(61,49,39,0.10);
    --radius-md: 12px;
    --radius-sm: 8px;
    --radius-lg: 16px;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Noto Sans JP', sans-serif;
    background: var(--bg-page);
    color: var(--text-primary);
    line-height: 1.7;
    position: relative;
  }
  body::before {
    content: ''; position: fixed; inset: 0; z-index: 0;
    pointer-events: none; opacity: 0.025;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23A8873A' stroke-width='1.2'%3E%3Cpath d='M0 20 L20 20 L20 0'/%3E%3Cpath d='M20 20 L20 40 L40 40'/%3E%3Cpath d='M40 40 L40 20 L60 20'/%3E%3Cpath d='M60 20 L60 0'/%3E%3Cpath d='M40 40 L40 60 L20 60'/%3E%3Cpath d='M20 60 L20 80'/%3E%3Cpath d='M60 20 L60 40 L80 40'/%3E%3Cpath d='M0 60 L20 60'/%3E%3Cpath d='M60 40 L60 60 L80 60'/%3E%3Cpath d='M40 60 L60 60 L60 80'/%3E%3Cpath d='M0 40 L20 40'/%3E%3Cpath d='M40 0 L40 20'/%3E%3Cpath d='M80 0 L80 20'/%3E%3Cpath d='M80 60 L80 80'/%3E%3Cpath d='M40 80 L40 60'/%3E%3Cpath d='M0 0 L0 20'/%3E%3Cpath d='M0 60 L0 80'/%3E%3C/g%3E%3C/svg%3E");
    background-size: 80px 80px;
  }
  body > * { position: relative; z-index: 1; }
  .page { max-width: 800px; margin: 0 auto; padding: 20px 16px 60px; }
  .page-title { text-align: center; padding: 32px 0 24px; }
  .page-title .label { font-size: 11px; letter-spacing: 3px; color: var(--gold); margin-bottom: 4px; }
  .page-title h1 { font-family: 'Noto Serif JP', serif; font-size: 20px; font-weight: 700; letter-spacing: 2px; }
  .page-title .sub { font-size: 12px; color: var(--text-tertiary); margin-top: 4px; }
  .deco-line { display: flex; align-items: center; justify-content: center; gap: 12px; margin: 12px auto; max-width: 160px; }
  .deco-line::before, .deco-line::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, transparent, var(--gold-light), transparent); }
  .deco-line .diamond { width: 5px; height: 5px; background: var(--gold); transform: rotate(45deg); }
  .top-concept { text-align: center; padding: 20px; background: linear-gradient(135deg, var(--gold), var(--gold-dark)); color: white; border-radius: var(--radius-md); margin-bottom: 4px; box-shadow: var(--shadow-md); }
  .top-concept .tc-label { font-size: 10px; letter-spacing: 3px; opacity: 0.8; margin-bottom: 2px; }
  .top-concept h2 { font-family: 'Noto Serif JP', serif; font-size: 18px; font-weight: 700; letter-spacing: 3px; }
  .top-concept .tc-sub { font-size: 12px; opacity: 0.85; margin-top: 2px; }
  .connector { display: flex; justify-content: center; padding: 0; position: relative; height: 32px; }
  .connector::before { content: ''; position: absolute; top: 0; left: 50%; width: 2px; height: 12px; background: var(--gold-light); }
  .connector::after { content: ''; position: absolute; top: 12px; left: calc(25% + 4px); right: calc(25% + 4px); height: 2px; background: var(--gold-light); }
  .connector-legs { position: absolute; top: 12px; left: calc(25% + 4px); right: calc(25% + 4px); height: 20px; }
  .connector-legs::before, .connector-legs::after { content: ''; position: absolute; top: 0; width: 2px; height: 20px; background: var(--gold-light); }
  .connector-legs::before { left: 0; }
  .connector-legs::after { right: 0; }
  .twin-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .brand-col { border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-light); box-shadow: var(--shadow-md); background: var(--bg-card); }
  .brand-header { padding: 16px 18px; text-align: center; }
  .brand-header.kabuki-plus { background: linear-gradient(135deg, #3D3127, #5A4E42); color: white; }
  .brand-header.jikabuki-plus { background: linear-gradient(135deg, var(--accent-red), #A03828); color: white; }
  .brand-header .bh-icon { font-size: 20px; margin-bottom: 2px; }
  .brand-header h3 { font-family: 'Noto Serif JP', serif; font-size: 15px; font-weight: 700; letter-spacing: 2px; }
  .brand-header .bh-sub { font-size: 11px; opacity: 0.8; margin-top: 2px; }
  .brand-header .bh-target { display: inline-block; font-size: 10px; margin-top: 8px; padding: 2px 10px; border-radius: 20px; background: rgba(255,255,255,0.2); letter-spacing: 0.5px; }
  .feature-list { padding: 12px 14px 16px; display: flex; flex-direction: column; gap: 8px; }
  .feat { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--bg-subtle); border-radius: var(--radius-sm); transition: background 0.15s; }
  .feat:hover { background: var(--gold-soft); }
  .feat .feat-icon { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; background: white; box-shadow: var(--shadow-sm); }
  .feat .feat-name { font-size: 13px; font-weight: 600; }
  .feat .feat-desc { font-size: 10px; color: var(--text-tertiary); margin-top: 1px; }
  .feat.feat-new { position: relative; }
  .feat.feat-new::after { content: 'NEW'; position: absolute; top: -5px; right: 8px; font-size: 9px; font-weight: 700; color: white; background: var(--accent-green); padding: 1px 6px; border-radius: 4px; letter-spacing: 0.5px; }
  .feat.feat-expand { background: var(--accent-red-soft); border: 1px dashed var(--accent-red); position: relative; }
  .feat.feat-expand::after { content: '横展開'; position: absolute; top: -6px; right: 8px; font-size: 9px; font-weight: 600; color: white; background: var(--accent-red); padding: 1px 6px; border-radius: 4px; letter-spacing: 0.5px; }
  .sublabel { font-size: 12px; font-weight: 600; padding: 4px 0 2px; letter-spacing: 0.5px; display: flex; align-items: baseline; gap: 6px; }
  .sublabel-desc { font-size: 10px; font-weight: 400; color: var(--text-tertiary); }
  .sublabel-public { color: var(--accent-red); }
  .sublabel-internal { color: var(--text-secondary); }
  .sublabel-kabuki { color: #3D3127; }
  .shared-base-connector { display: flex; justify-content: center; height: 28px; position: relative; }
  .shared-base-connector::before { content: ''; position: absolute; bottom: 0; left: calc(25% + 4px); right: calc(25% + 4px); height: 2px; background: var(--gold-light); }
  .shared-base-connector .leg-l, .shared-base-connector .leg-r { position: absolute; top: 0; width: 2px; height: 100%; background: var(--gold-light); }
  .shared-base-connector .leg-l { left: calc(25% + 4px); }
  .shared-base-connector .leg-r { right: calc(25% + 4px); }
  .shared-base-connector .leg-c { position: absolute; bottom: 0; left: 50%; width: 2px; height: 14px; background: var(--gold-light); transform: translateX(-50%); }
  .shared-base { border-radius: var(--radius-md); border: 2px solid var(--gold-light); background: var(--bg-card); padding: 18px 20px; box-shadow: var(--shadow-sm); }
  .shared-base .sb-title { text-align: center; font-family: 'Noto Serif JP', serif; font-size: 14px; font-weight: 600; color: var(--gold-dark); margin-bottom: 12px; letter-spacing: 1px; }
  .shared-items { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .shared-item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: var(--gold-soft); border-radius: var(--radius-sm); font-size: 12px; font-weight: 500; }
  .shared-item .si-icon { font-size: 16px; flex-shrink: 0; }
  .note-section { margin-top: 40px; }
  .note-title { font-family: 'Noto Serif JP', serif; font-size: 14px; font-weight: 600; color: var(--gold-dark); margin-bottom: 12px; display: flex; align-items: center; gap: 8px; letter-spacing: 1px; }
  .note-title::before { content: ''; width: 3px; height: 16px; background: var(--gold); border-radius: 2px; }
  .comparison-table { width: 100%; border-collapse: collapse; font-size: 13px; background: var(--bg-card); border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-sm); border: 1px solid var(--border-light); }
  .comparison-table th { padding: 10px 14px; font-weight: 600; font-size: 12px; letter-spacing: 0.5px; text-align: left; border-bottom: 2px solid var(--border-light); }
  .comparison-table th:first-child { background: var(--bg-subtle); color: var(--text-secondary); width: 100px; }
  .comparison-table th.col-kabuki { background: #3D3127; color: white; }
  .comparison-table th.col-jikabuki { background: var(--accent-red); color: white; }
  .comparison-table td { padding: 10px 14px; border-bottom: 1px solid var(--border-light); vertical-align: top; }
  .comparison-table td:first-child { font-weight: 500; color: var(--text-tertiary); font-size: 12px; background: rgba(243,237,228,0.4); }
  .comparison-table tr:last-child td { border-bottom: none; }

  /* AI Pipeline */
  .ai-pipeline { background: linear-gradient(135deg, #3D3127, #5A4E42); color: #F3EDE4; border-radius: var(--radius-lg); padding: 24px 20px; box-shadow: var(--shadow-lg); margin-bottom: 16px; }
  .ai-pipeline .aip-title { font-family: 'Noto Serif JP', serif; font-size: 15px; font-weight: 700; color: var(--gold-light); text-align: center; margin-bottom: 16px; letter-spacing: 1px; }
  .ai-step { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: rgba(255,255,255,0.08); border-radius: var(--radius-sm); margin-bottom: 6px; }
  .ai-step .step-num { width: 24px; height: 24px; border-radius: 50%; background: var(--gold); color: #3D3127; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ai-step .step-name { font-size: 12px; font-weight: 600; color: var(--gold-light); }
  .ai-step .step-desc { font-size: 10px; color: #C0B8A8; margin-top: 1px; }
  .ai-arrow { text-align: center; color: var(--gold); font-size: 12px; padding: 2px 0; }

  /* Stats bar */
  .stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 16px 0; }
  .sbar-item { text-align: center; padding: 12px 8px; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-sm); box-shadow: var(--shadow-sm); }
  .sbar-item .sbar-num { font-family: 'Noto Serif JP', serif; font-size: 20px; font-weight: 700; color: var(--gold-dark); }
  .sbar-item .sbar-label { font-size: 10px; color: var(--text-tertiary); margin-top: 2px; }

  .channel-roles { display: flex; gap: 10px; }
  .arch-note { margin-top: 20px; padding: 20px; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-md); font-size: 13px; color: var(--text-secondary); line-height: 1.8; box-shadow: var(--shadow-sm); }
  .arch-note strong { color: var(--text-primary); }
  .footer { text-align: center; padding: 32px 0; font-size: 11px; color: var(--text-tertiary); letter-spacing: 1px; }

  @media (max-width: 560px) {
    .page { padding: 12px 12px 40px; }
    .page-title { padding: 20px 0 16px; }
    .page-title h1 { font-size: 17px; }
    .twin-columns { grid-template-columns: 1fr; gap: 12px; }
    .connector::after, .connector-legs, .shared-base-connector .leg-l, .shared-base-connector .leg-r, .shared-base-connector::before { display: none; }
    .connector { height: 16px; }
    .connector::before { height: 16px; }
    .shared-base-connector { height: 16px; }
    .shared-base-connector .leg-c { height: 16px; }
    .shared-items { grid-template-columns: 1fr; }
    .shared-base { padding: 14px; }
    .comparison-table { font-size: 11px; display: block; overflow-x: auto; white-space: nowrap; }
    .comparison-table th, .comparison-table td { padding: 8px 10px; min-width: 120px; }
    .comparison-table td:first-child, .comparison-table th:first-child { min-width: 70px; position: sticky; left: 0; z-index: 1; }
    .comparison-table td:first-child { background: var(--bg-subtle); }
    .brand-header h3 { font-size: 14px; }
    .brand-header .bh-sub { font-size: 10px; }
    .feat { padding: 8px 10px; gap: 8px; }
    .feat .feat-icon { width: 28px; height: 28px; font-size: 13px; }
    .feat .feat-name { font-size: 12px; }
    .feat .feat-desc { font-size: 9px; }
    .sublabel { font-size: 11px; flex-direction: column; gap: 1px; }
    .sublabel-desc { font-size: 9px; }
    .top-concept { padding: 14px; }
    .top-concept h2 { font-size: 15px; }
    .note-title { font-size: 13px; }
    .arch-note { font-size: 12px; padding: 14px; line-height: 1.7; }
    .channel-roles { flex-direction: column; }
    .stats-bar { grid-template-columns: repeat(2, 1fr); }
    .ai-pipeline { padding: 18px 14px; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="page-title">
    <div class="label">ARCHITECTURE v3.1</div>
    <h1>サービス構成図</h1>
    <div class="sub">KABUKI PLUS+ / JIKABUKI PLUS+ ツインブランド構想</div>
    <div class="deco-line"><span class="diamond"></span></div>
  </div>

  <div class="top-concept">
    <div class="tc-label">JIKABUKI × AI PROJECT</div>
    <h2>守るために、変わる。</h2>
    <div class="tc-sub">地歌舞伎を、テクノロジーの力でもっと身近に、もっと面白く。</div>
  </div>

  <!-- Stats bar -->
  <div style="margin: 16px 0 0;">
    <div class="stats-bar" style="margin:0;">
      <div class="sbar-item"><div class="sbar-num">56,300+</div><div class="sbar-label">行のコード</div></div>
      <div class="sbar-item"><div class="sbar-num">72</div><div class="sbar-label">モジュール</div></div>
      <div class="sbar-item"><div class="sbar-num">95+</div><div class="sbar-label">ルート</div></div>
      <div class="sbar-item"><div class="sbar-num">60+</div><div class="sbar-label">API</div></div>
    </div>
    <div style="text-align:right; font-size:10px; color:var(--text-tertiary); margin-top:4px; letter-spacing:0.5px;">R8.3.7 現在</div>
  </div>

  <div class="connector"><div class="connector-legs"></div></div>

  <div class="twin-columns">
    <!-- KABUKI PLUS+ -->
    <div class="brand-col">
      <div class="brand-header kabuki-plus">
        <div class="bh-icon">🎭</div>
        <h3>KABUKI PLUS+</h3>
        <div class="bh-sub">歌舞伎を、もっと面白く。</div>
        <div class="bh-target">歌舞伎ファン・初心者向け</div>
      </div>
      <div class="feature-list">
        <div class="sublabel sublabel-kabuki">🧭 KABUKI NAVI<span class="sublabel-desc">── 読んで学ぶ（23+演目 / 126語 / コラム21本）</span></div>
        <div class="feat"><div class="feat-icon">🎭</div><div><div class="feat-name">演目ガイド</div><div class="feat-desc">あらすじ・見どころ・配役（23+演目）</div></div></div>
        <div class="feat"><div class="feat-icon">📘</div><div><div class="feat-name">用語辞典</div><div class="feat-desc">126語・8カテゴリ</div></div></div>
        <div class="feat"><div class="feat-icon">⭐</div><div><div class="feat-name">おすすめ演目</div><div class="feat-desc">パーソナライズレコメンド</div></div></div>
        <div class="feat"><div class="feat-icon">🎫</div><div><div class="feat-name">観劇ナビ</div><div class="feat-desc">初心者向け6ステップガイド</div></div></div>
        <div class="feat feat-new"><div class="feat-icon">📝</div><div><div class="feat-name">コラム記事</div><div class="feat-desc">台詞解説・研究紀行ほか（21本）</div></div></div>
      </div>
      <div style="margin:0 14px; border-top:1px dashed var(--border-light);"></div>
      <div class="feature-list">
        <div class="sublabel sublabel-kabuki">📡 KABUKI LIVE<span class="sublabel-desc">── 今を見る（自動取得・6劇場）</span></div>
        <div class="feat"><div class="feat-icon">📰</div><div><div class="feat-name">歌舞伎ニュース</div><div class="feat-desc">毎日自動取得（Google News RSS）</div></div></div>
        <div class="feat"><div class="feat-icon">🎫</div><div><div class="feat-name">公演スケジュール</div><div class="feat-desc">6大劇場・kabuki-bito.jp連携</div></div></div>
        <div class="feat"><div class="feat-icon">⭐</div><div><div class="feat-name">注目演目</div><div class="feat-desc">ピックアップ・開幕カウントダウン</div></div></div>
        <div class="feat"><div class="feat-icon">💕</div><div><div class="feat-name">推し俳優ニュース</div><div class="feat-desc">お気に入り俳優の最新情報</div></div></div>
      </div>
      <div style="margin:0 14px; border-top:1px dashed var(--border-light);"></div>
      <div class="feature-list">
        <div class="sublabel sublabel-kabuki">📝 KABUKI RECO<span class="sublabel-desc">── 記録する（KV / R2）</span></div>
        <div class="feat"><div class="feat-icon">📝</div><div><div class="feat-name">観劇記録</div><div class="feat-desc">500件/人・写真・編集対応</div></div></div>
        <div class="feat feat-new"><div class="feat-icon">📤</div><div><div class="feat-name">SNSシェア</div><div class="feat-desc">X / Facebook / LINE・公開プロフィール</div></div></div>
        <div class="feat feat-new"><div class="feat-icon">🏅</div><div><div class="feat-name">バッジ・ランク</div><div class="feat-desc">11段階称号・祝福演出</div></div></div>
      </div>
      <div style="margin:0 14px; border-top:1px dashed var(--border-light);"></div>
      <div class="feature-list">
        <div class="sublabel sublabel-kabuki">🥋 KABUKI DOJO<span class="sublabel-desc">── やってみる（体験型）</span></div>
        <div class="feat feat-new"><div class="feat-icon">❓</div><div><div class="feat-name">歌舞伎クイズ</div><div class="feat-desc">3段階難易度（初級/中級/上級）</div></div></div>
        <div class="feat"><div class="feat-icon">🗣️</div><div><div class="feat-name">台詞稽古チャレンジ</div><div class="feat-desc">カラオケ風・YouTube字幕同期</div></div></div>
        <div class="feat"><div class="feat-icon">📢</div><div><div class="feat-name">大向う道場</div><div class="feat-desc">掛け声タイミング・おひねり演出</div></div></div>
      </div>
    </div>

    <!-- JIKABUKI PLUS+ -->
    <div class="brand-col">
      <div class="brand-header jikabuki-plus">
        <div class="bh-icon">🏯</div>
        <h3>JIKABUKI PLUS+</h3>
        <div class="bh-sub">演じる人の、デジタル楽屋。</div>
        <div class="bh-target">地歌舞伎の演者・運営者向け</div>
      </div>

      <!-- GATE -->
      <div class="feature-list">
        <div class="sublabel sublabel-public">🏯 JIKABUKI GATE<span class="sublabel-desc">── 表玄関（8テーマ）</span></div>
        <div class="feat"><div class="feat-icon">🏠</div><div><div class="feat-name">団体公式サイト</div><div class="feat-desc">8テーマから選択・自動生成</div></div></div>
        <div class="feat feat-new"><div class="feat-icon">🤖</div><div><div class="feat-name">カスタムFAQボット</div><div class="feat-desc">質問に答えるだけで完成（19テンプレート）</div></div></div>
        <div class="feat"><div class="feat-icon">📅</div><div><div class="feat-name">公演情報ページ</div><div class="feat-desc">SNSリンク・アクセス情報</div></div></div>
        <div class="feat feat-new"><div class="feat-icon">🏛️</div><div><div class="feat-name">気良歌舞伎公式LP</div><div class="feat-desc">公式サイト・アーカイブ・ガイド・お知らせ</div></div></div>
      </div>
      <div style="margin:0 14px; border-top:1px dashed var(--border-light);"></div>

      <!-- INFO -->
      <div class="feature-list">
        <div class="sublabel sublabel-public">📡 JIKABUKI INFO<span class="sublabel-desc">── お知らせ・カレンダー</span></div>
        <div class="feat"><div class="feat-icon">📰</div><div><div class="feat-name">地歌舞伎ニュース</div><div class="feat-desc">団体名バッチ検索・Google News</div></div></div>
        <div class="feat"><div class="feat-icon">🏛️</div><div><div class="feat-name">団体・劇場ディレクトリ</div><div class="feat-desc">都道府県検索・お気に入り</div></div></div>
        <div class="feat"><div class="feat-icon">🗓️</div><div><div class="feat-name">イベントカレンダー</div><div class="feat-desc">全国の公演・イベント一覧</div></div></div>
      </div>
      <div style="margin:0 14px; border-top:1px dashed var(--border-light);"></div>

      <!-- BASE -->
      <div class="feature-list">
        <div class="sublabel sublabel-internal">🔧 JIKABUKI BASE<span class="sublabel-desc">── 楽屋（団体運営ツール）</span></div>
        <div class="feat"><div class="feat-icon">👥</div><div><div class="feat-name">メンバー管理</div><div class="feat-desc">参加申請・役割制御（マネージャー/メンバー）</div></div></div>
        <div class="feat"><div class="feat-icon">📅</div><div><div class="feat-name">稽古スケジュール</div><div class="feat-desc">月次カレンダー・出欠管理（○△×）</div></div></div>
        <div class="feat"><div class="feat-icon">📋</div><div><div class="feat-name">公演記録</div><div class="feat-desc">演目・配役・写真アーカイブ</div></div></div>
        <div class="feat"><div class="feat-icon">📖</div><div><div class="feat-name">デジタル台本</div><div class="feat-desc">テキスト/JSON/PDF・バージョン管理</div></div></div>
        <div class="feat feat-new"><div class="feat-icon">💰</div><div><div class="feat-name">収支管理</div><div class="feat-desc">複式管理・年度切替・CSV/PDF出力</div></div></div>
        <div class="feat feat-expand"><div class="feat-icon">🤝</div><div><div class="feat-name">台本共有</div><div class="feat-desc">団体間で共有し事務局負担を軽減</div></div></div>
      </div>
      <div style="margin:0 14px; border-top:1px dashed var(--border-light);"></div>

      <!-- LABO -->
      <div class="feature-list">
        <div class="sublabel sublabel-internal">🧪 JIKABUKI LABO<span class="sublabel-desc">── コンテンツ管理</span></div>
        <div class="feat"><div class="feat-icon">🎭</div><div><div class="feat-name">演目エディタ</div><div class="feat-desc">新規/編集/未整備候補の3モード</div></div></div>
        <div class="feat"><div class="feat-icon">📘</div><div><div class="feat-name">用語・クイズエディタ</div><div class="feat-desc">一括JSONインポート対応</div></div></div>
        <div class="feat"><div class="feat-icon">🏯</div><div><div class="feat-name">GATEエディタ</div><div class="feat-desc">テーマ・FAQ・コンテンツ編集</div></div></div>
        <div class="feat"><div class="feat-icon">✅</div><div><div class="feat-name">承認ワークフロー</div><div class="feat-desc">エディター申請 → マスター承認</div></div></div>
      </div>
    </div>
  </div>

  <div class="shared-base-connector">
    <span class="leg-l"></span><span class="leg-r"></span><span class="leg-c"></span>
  </div>

  <div class="shared-base">
    <div class="sb-title">共有基盤</div>
    <div class="shared-items">
      <div class="shared-item"><span class="si-icon">🤖</span>けらのすけ AI（Gemini 2.5 Flash）</div>
      <div class="shared-item"><span class="si-icon">🔄</span>Workers AI（Llama 3.1 8B フォールバック）</div>
      <div class="shared-item"><span class="si-icon">☁️</span>Cloudflare Workers / R2 / KV</div>
      <div class="shared-item"><span class="si-icon">🎬</span>稽古エンジン（YouTube区間再生/cue）</div>
      <div class="shared-item"><span class="si-icon">💬</span>Webチャット（けらのすけに聞く）</div>
      <div class="shared-item"><span class="si-icon">🔐</span>認証（LINE OAuth / Google Sign-In）</div>
      <div class="shared-item"><span class="si-icon">📱</span>PWA（Service Worker / ボトムタブ）</div>
      <div class="shared-item"><span class="si-icon">📊</span>OGP / JSON-LD（全ページSEO対応）</div>
    </div>
    <div style="margin-top:14px; border-top:1px dashed var(--border-light); padding-top:14px;">
      <div style="font-size:11px; font-weight:600; color:var(--gold-dark); margin-bottom:8px; letter-spacing:0.5px;">チャネル役割</div>
      <div class="channel-roles">
        <div style="flex:1; padding:10px 12px; background:var(--accent-green-soft); border-radius:8px;">
          <div style="font-size:12px; font-weight:600; color:#06C755; margin-bottom:2px;">💬 LINE Bot</div>
          <div style="font-size:10px; color:var(--text-secondary); line-height:1.5;">けらのすけとの会話に特化。6モード（kera/performance/general/recommend/quiz/news）。Flex Message。</div>
        </div>
        <div style="flex:1; padding:10px 12px; background:var(--accent-blue-soft); border-radius:8px;">
          <div style="font-size:12px; font-weight:600; color:var(--accent-blue); margin-bottom:2px;">🌐 Web PWA</div>
          <div style="font-size:10px; color:var(--text-secondary); line-height:1.5;">全機能提供。72モジュール・95+ルート。オフライン対応。インストール可能。OGP対応。</div>
        </div>
      </div>
    </div>
  </div>

  <!-- AI Pipeline -->
  <div class="note-section">
    <div class="note-title">AI パイプライン（keraAIv2）</div>
    <div class="ai-pipeline">
      <div class="aip-title">けらのすけ ── 歌舞伎の「友達」</div>
      <div class="ai-step"><div class="step-num">1</div><div><div class="step-name">キャッシュ確認</div><div class="step-desc">正規化クエリで応答キャッシュを検索（TTL 6h）</div></div></div>
      <div class="ai-arrow">↓</div>
      <div class="ai-step"><div class="step-num">2</div><div><div class="step-name">レート制限チェック</div><div class="step-desc">14 RPM 上限 → 超過時は Workers AI へフォールバック</div></div></div>
      <div class="ai-arrow">↓</div>
      <div class="ai-step"><div class="step-num">3</div><div><div class="step-name">RAG コンテキスト構築</div><div class="step-desc">演目・用語・FAQ・公演の4ソースから 8,000字以内で構築（3-gram類義語検索）</div></div></div>
      <div class="ai-arrow">↓</div>
      <div class="ai-step"><div class="step-num">4</div><div><div class="step-name">Gemini 2.5 Flash 呼び出し</div><div class="step-desc">temperature 0.1 / topP 0.9 / 1,500トークン / 20秒タイムアウト</div></div></div>
      <div class="ai-arrow">↓</div>
      <div class="ai-step"><div class="step-num">5</div><div><div class="step-name">Function Calling（5ツール）</div><div class="step-desc">公演検索 / ニュース / 用語 / 演目 / 団体情報</div></div></div>
      <div class="ai-arrow">↓</div>
      <div class="ai-step"><div class="step-num">6</div><div><div class="step-name">応答 + 保存</div><div class="step-desc">会話履歴（20メッセージ、1h TTL）+ 応答キャッシュ保存</div></div></div>
    </div>
  </div>

  <!-- ブランド比較表 -->
  <div class="note-section">
    <div class="note-title">ブランド比較</div>
    <table class="comparison-table">
      <thead><tr><th></th><th class="col-kabuki">KABUKI PLUS+</th><th class="col-jikabuki">JIKABUKI PLUS+</th></tr></thead>
      <tbody>
        <tr><td>テーマ</td><td>歌舞伎全般を楽しむ</td><td>地歌舞伎を発信・運営する</td></tr>
        <tr><td>ターゲット</td><td>歌舞伎ファン・初心者</td><td>地歌舞伎の演者・事務局</td></tr>
        <tr><td>価値</td><td>知る・観る・学ぶ・やってみる</td><td>発信する・記録する・稽古する・共有する</td></tr>
        <tr><td>公開面</td><td>NAVI / LIVE / RECO / DOJO</td><td>GATE（8テーマ・FAQボット）/ INFO</td></tr>
        <tr><td>内部面</td><td>─</td><td>BASE（メンバー管理・稽古・台本・収支）/ LABO</td></tr>
        <tr><td>導入体験</td><td>─</td><td>チャットで質問に答えるだけで公式サイト完成</td></tr>
        <tr><td>スケール</td><td>歌舞伎全体（6大劇場）</td><td>気良歌舞伎 → 全国200団体へ横展開</td></tr>
      </tbody>
    </table>
  </div>

  <!-- 認証・権限 -->
  <div class="note-section">
    <div class="note-title">認証・権限マトリクス</div>
    <table class="comparison-table">
      <thead><tr><th>ロール</th><th class="col-kabuki">スコープ</th><th class="col-jikabuki">できること</th></tr></thead>
      <tbody>
        <tr><td>マスター</td><td>グローバル</td><td>全操作・エディター承認・団体承認・システム管理</td></tr>
        <tr><td>エディター</td><td>グローバル</td><td>演目 / 用語 / クイズの作成・編集（承認制）</td></tr>
        <tr><td>マネージャー</td><td>団体単位</td><td>メンバー承認・役割変更・団体プロフィール管理</td></tr>
        <tr><td>メンバー</td><td>団体単位</td><td>台本閲覧・ノート投稿・出欠登録</td></tr>
        <tr><td>ゲスト</td><td>─</td><td>NAVI / LIVE / DOJO / GATE の閲覧</td></tr>
      </tbody>
    </table>
  </div>

  <!-- メモ -->
  <div class="arch-note">
    <strong>💡 この構成のポイント</strong><br><br>
    <strong>けらのすけ = 歌舞伎の「友達」</strong> ── 教科書ではなく友達。Gemini 2.5 Flash + RAG（8,000字の文脈構築）+ Function Calling 5ツールで、演目・用語・公演・ニュース・団体情報を横断的に検索して答える。Workers AI（Llama 3.1 8B）がフォールバックとして常時待機し、応答を保証。<br><br>
    <strong>ランニングコストほぼ無料</strong> ── Cloudflare Workers / KV / R2 の無料枠 + Gemini 無料枠。地歌舞伎団体の財務負担にならない持続可能な設計。<br><br>
    <strong>3層キャッシュ戦略</strong> ── Service Worker（ブラウザ内）+ HTTP Cache-Control + KVキャッシュ（サーバーサイド）。静的アセットは永続キャッシュ、HTMLはNetwork-first、GATEページはno-cache（常に最新）。<br><br>
    <strong>チャットで導入完了</strong> ── 新しい団体は、けらのすけの質問に答えていくだけで、FAQ・公式サイト・チャットボットが自動生成。8テーマから選ぶだけでデザインも完成。ITに不慣れな事務局でも参入障壁ゼロ。<br><br>
    <strong>段階的に</strong> ── まず気良歌舞伎で全機能を使い込み、磨いてから他団体へ。気良歌舞伎が「最高のテンプレート」になる。
  </div>

  <div style="text-align: center; margin-top: 24px;">
    <a href="/project" style="display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; font-size: 14px; color: var(--gold-dark); font-weight: 600; text-decoration: none;">← プロジェクト紹介へ</a>
  </div>

  <div class="footer">
    JIKABUKI × AI — Architecture v3.1
  </div>
</div>
</body>
</html>`;
}
