// src/architecture_page.js
// =========================================================
// サービス構成図 — /architecture
// KABUKI PLUS+ / JIKABUKI PLUS+ ツインブランド構想 v2.0
// =========================================================

export function architecturePageHTML() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KABUKI PLUS+ / JIKABUKI PLUS+ 構成図</title>
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
    --radius-md: 12px;
    --radius-sm: 8px;
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
  .feat.feat-expand { background: var(--accent-red-soft); border: 1px dashed var(--accent-red); position: relative; }
  .feat.feat-expand::after { content: '横展開'; position: absolute; top: -6px; right: 8px; font-size: 9px; font-weight: 600; color: white; background: var(--accent-red); padding: 1px 6px; border-radius: 4px; letter-spacing: 0.5px; }
  .sublabel { font-size: 12px; font-weight: 600; padding: 4px 0 2px; letter-spacing: 0.5px; display: flex; align-items: baseline; gap: 6px; }
  .sublabel-desc { font-size: 10px; font-weight: 400; color: var(--text-tertiary); }
  .sublabel-public { color: var(--accent-red); }
  .sublabel-internal { color: var(--text-secondary); }
  .sublabel-kabuki { color: #3D3127; }
  .navi-breakdown { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 24px; }
  .channel-roles { display: flex; gap: 10px; }
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
  .tab-preview { margin-top: 24px; }
  .tab-preview-label { font-size: 12px; font-weight: 500; color: var(--text-tertiary); margin-bottom: 8px; letter-spacing: 0.5px; }
  .arch-note { margin-top: 20px; padding: 16px; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-md); font-size: 13px; color: var(--text-secondary); line-height: 1.8; box-shadow: var(--shadow-sm); }
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
    .top-concept .tc-sub { font-size: 11px; }
    .note-title { font-size: 13px; }
    .arch-note { font-size: 12px; padding: 14px; line-height: 1.7; }
    .navi-breakdown { grid-template-columns: 1fr; }
    .note-section div[style*="display:flex; margin:8px 20px"] { margin-left: 12px !important; margin-right: 12px !important; }
    .channel-roles { flex-direction: column; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="page-title">
    <div class="label">🎭 ARCHITECTURE</div>
    <h1>サービス構成図</h1>
    <div class="sub">KABUKI PLUS+ / JIKABUKI PLUS+ ツインブランド構想</div>
    <div class="deco-line"><span class="diamond"></span></div>
  </div>

  <div class="top-concept">
    <div class="tc-label">JIKABUKI × AI PROJECT</div>
    <h2>守るために、変わる。</h2>
    <div class="tc-sub">地歌舞伎を、テクノロジーの力でもっと身近に、もっと面白く。</div>
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
        <div class="sublabel sublabel-kabuki">🧭 KABUKI NAVI<span class="sublabel-desc">── 読んで学ぶ（蓄積型・R2）</span></div>
        <div class="feat"><div class="feat-icon">🎭</div><div><div class="feat-name">演目ガイド</div><div class="feat-desc">あらすじ・見どころ・配役</div></div></div>
        <div class="feat"><div class="feat-icon">👤</div><div><div class="feat-name">人物事典</div><div class="feat-desc">俳優・歴史上の人物</div></div></div>
        <div class="feat"><div class="feat-icon">📘</div><div><div class="feat-name">用語いろは</div><div class="feat-desc">歌舞伎用語をわかりやすく</div></div></div>
        <div class="feat"><div class="feat-icon">⭐</div><div><div class="feat-name">おすすめ演目</div><div class="feat-desc">好みに合った演目を提案</div></div></div>
        <div class="feat"><div class="feat-icon">📊</div><div><div class="feat-name">学習ログ</div><div class="feat-desc">用語クリップ・学習進捗</div></div></div>
      </div>
      <div style="margin:0 14px; border-top:1px dashed var(--border-light);"></div>
      <div class="feature-list">
        <div class="sublabel sublabel-kabuki">📡 KABUKI LIVE<span class="sublabel-desc">── 今を見る（自動取得・Dify）</span></div>
        <div class="feat"><div class="feat-icon">📰</div><div><div class="feat-name">歌舞伎ニュース</div><div class="feat-desc">毎日自動取得・大歌舞伎</div></div></div>
        <div class="feat"><div class="feat-icon">🎫</div><div><div class="feat-name">公演スケジュール</div><div class="feat-desc">歌舞伎座ほか公演情報・チケット</div></div></div>
      </div>
      <div style="margin:0 14px; border-top:1px dashed var(--border-light);"></div>
      <div class="feature-list">
        <div class="sublabel sublabel-kabuki">📝 KABUKI RECO<span class="sublabel-desc">── 記録する</span></div>
        <div class="feat"><div class="feat-icon">📝</div><div><div class="feat-name">観劇記録</div><div class="feat-desc">観た演目・感想・推し俳優の記録</div></div></div>
      </div>
      <div style="margin:0 14px; border-top:1px dashed var(--border-light);"></div>
      <div class="feature-list">
        <div class="sublabel sublabel-kabuki">🥋 KABUKI DOJO<span class="sublabel-desc">── やってみる</span></div>
        <div class="feat"><div class="feat-icon">❓</div><div><div class="feat-name">歌舞伎クイズ</div><div class="feat-desc">知識の腕試し</div></div></div>
        <div class="feat"><div class="feat-icon">🗣️</div><div><div class="feat-name">台詞稽古チャレンジ</div><div class="feat-desc">名台詞をカラオケ感覚で体験</div></div></div>
        <div class="feat"><div class="feat-icon">📢</div><div><div class="feat-name">大向う道場</div><div class="feat-desc">掛け声タイミングを音ゲー風に</div></div></div>
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
        <div class="sublabel sublabel-public">🌐 JIKABUKI GATE<span class="sublabel-desc">── ぶたい：団体を知ってもらう</span></div>
        <div class="feat"><div class="feat-icon">🏠</div><div><div class="feat-name">団体公式サイト</div><div class="feat-desc">テンプレートで自動生成。気良歌舞伎がお手本</div></div></div>
        <div class="feat"><div class="feat-icon">🤖</div><div><div class="feat-name">団体チャットボット</div><div class="feat-desc">質問に答えるだけでFAQ＋ボットが完成</div></div></div>
        <div class="feat"><div class="feat-icon">📅</div><div><div class="feat-name">公演情報ページ</div><div class="feat-desc">次回公演・過去公演を自動掲載</div></div></div>
      </div>
      <div style="margin:0 14px; border-top:1px dashed var(--border-light);"></div>

      <!-- INFO -->
      <div class="feature-list">
        <div class="sublabel sublabel-public">📡 JIKABUKI INFO<span class="sublabel-desc">── お知らせ・カレンダー</span></div>
        <div class="feat"><div class="feat-icon">📰</div><div><div class="feat-name">地歌舞伎ニュース</div><div class="feat-desc">地歌舞伎に関するニュースを自動取得</div></div></div>
        <div class="feat"><div class="feat-icon">🗓️</div><div><div class="feat-name">イベントカレンダー</div><div class="feat-desc">全国の地歌舞伎公演・イベント一覧</div></div></div>
      </div>
      <div style="margin:0 14px; border-top:1px dashed var(--border-light);"></div>

      <!-- BASE -->
      <div class="feature-list">
        <div class="sublabel sublabel-internal">🔒 JIKABUKI BASE<span class="sublabel-desc">── 楽屋：運営＋業界共有DB</span></div>
        <div class="feat"><div class="feat-icon">📋</div><div><div class="feat-name">公演記録・出演記録</div><div class="feat-desc">演目・配役・日程のアーカイブ</div></div></div>
        <div class="feat"><div class="feat-icon">📖</div><div><div class="feat-name">デジタル台本</div><div class="feat-desc">スマホ・タブレットで稽古に使える</div></div></div>
        <div class="feat feat-expand"><div class="feat-icon">🤝</div><div><div class="feat-name">台本共有</div><div class="feat-desc">団体間で台本を共有し事務局負担を軽減</div></div></div>

        <div class="sublabel sublabel-internal" style="margin-top:8px;">🗄️ 業界共有データベース<span class="sublabel-desc">── みんなで登録・みんなで使う</span></div>
        <div class="feat"><div class="feat-icon">🏛️</div><div><div class="feat-name">芝居小屋DB</div><div class="feat-desc">全国の芝居小屋・上演可能施設</div></div></div>
        <div class="feat"><div class="feat-icon">👘</div><div><div class="feat-name">貸衣装屋DB</div><div class="feat-desc">衣装の取り扱い・対応演目</div></div></div>
        <div class="feat"><div class="feat-icon">💇</div><div><div class="feat-name">かつら師・化粧師DB</div><div class="feat-desc">依頼先・対応地域</div></div></div>
        <div class="feat"><div class="feat-icon">🪵</div><div><div class="feat-name">大道具セット所有状況</div><div class="feat-desc">どの団体がどの演目の道具を持つか</div></div></div>
      </div>
      <div style="margin:0 14px; border-top:1px dashed var(--border-light);"></div>

      <!-- LABO -->
      <div class="feature-list">
        <div class="sublabel sublabel-internal">🧪 JIKABUKI LABO<span class="sublabel-desc">── 試す・作る</span></div>
        <div class="feat"><div class="feat-icon">🎤</div><div><div class="feat-name">稽古モード【実践版】</div><div class="feat-desc">自分の役の台詞稽古・台本/動画連動</div></div></div>
        <div class="feat"><div class="feat-icon">🎙️</div><div><div class="feat-name">台詞稽古チャレンジ</div><div class="feat-desc">カラオケ風の台詞練習ツール</div></div></div>
        <div class="feat"><div class="feat-icon">🔬</div><div><div class="feat-name">ベータテスト</div><div class="feat-desc">開発中の新機能を試す場所</div></div></div>
      </div>
    </div>
  </div>

  <div class="shared-base-connector">
    <span class="leg-l"></span><span class="leg-r"></span><span class="leg-c"></span>
  </div>

  <div class="shared-base">
    <div class="sb-title">🔧 共有基盤</div>
    <div class="shared-items">
      <div class="shared-item"><span class="si-icon">🤖</span>けらのすけ（歌舞伎の友達AI）</div>
      <div class="shared-item"><span class="si-icon">🎬</span>稽古エンジン（YouTube区間再生/cue）</div>
      <div class="shared-item"><span class="si-icon">☁️</span>Cloudflare Workers / R2</div>
      <div class="shared-item"><span class="si-icon">🧠</span>Dify（LLM / RAG）</div>
    </div>
    <div style="margin-top:14px; border-top:1px dashed var(--border-light); padding-top:14px;">
      <div style="font-size:11px; font-weight:600; color:var(--gold-dark); margin-bottom:8px; letter-spacing:0.5px;">📡 チャネル役割</div>
      <div class="channel-roles">
        <div style="flex:1; padding:10px 12px; background:var(--accent-green-soft); border-radius:8px;">
          <div style="font-size:12px; font-weight:600; color:#06C755; margin-bottom:2px;">💬 LINE</div>
          <div style="font-size:10px; color:var(--text-secondary); line-height:1.5;">けらのすけとの会話に特化。歌舞伎の「友達」として相談に乗り、必要に応じてWebへ案内する。</div>
        </div>
        <div style="flex:1; padding:10px 12px; background:var(--accent-blue-soft); border-radius:8px;">
          <div style="font-size:12px; font-weight:600; color:var(--accent-blue); margin-bottom:2px;">🌐 Web</div>
          <div style="font-size:10px; color:var(--text-secondary); line-height:1.5;">情報を見る・記録する・使う。KABUKI PLUS+ と JIKABUKI PLUS+ の全機能を提供。</div>
        </div>
      </div>
    </div>
  </div>

  <!-- KABUKI PLUS+ の4つの柱 -->
  <div class="note-section">
    <div class="note-title">KABUKI PLUS+ の4つの柱</div>
    <div class="navi-breakdown">
      <div style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-md); padding:14px; box-shadow:var(--shadow-sm);">
        <div style="font-size:11px; color:var(--text-tertiary); letter-spacing:1px; margin-bottom:8px;">🧭 NAVI ── 読んで学ぶ</div>
        <div style="font-size:12px; color:var(--text-secondary); line-height:1.9;">演目・人物ガイド<br>用語いろは<br>おすすめ演目<br>学習ログ</div>
        <div style="font-size:10px; color:var(--text-tertiary); margin-top:6px;">蓄積型・R2</div>
      </div>
      <div style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-md); padding:14px; box-shadow:var(--shadow-sm);">
        <div style="font-size:11px; color:var(--text-tertiary); letter-spacing:1px; margin-bottom:8px;">📡 LIVE ── 今を見る</div>
        <div style="font-size:12px; color:var(--text-secondary); line-height:1.9;">歌舞伎ニュース<br>公演スケジュール</div>
        <div style="font-size:10px; color:var(--accent-red); margin-top:6px;">自動取得・Dify</div>
      </div>
      <div style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-md); padding:14px; box-shadow:var(--shadow-sm);">
        <div style="font-size:11px; color:var(--text-tertiary); letter-spacing:1px; margin-bottom:8px;">📝 RECO ── 記録する</div>
        <div style="font-size:12px; color:var(--text-secondary); line-height:1.9;">観劇記録<br>推し俳優の記録</div>
        <div style="font-size:10px; color:var(--text-tertiary); margin-top:6px;">ユーザーデータ</div>
      </div>
      <div style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-md); padding:14px; box-shadow:var(--shadow-sm);">
        <div style="font-size:11px; color:var(--text-tertiary); letter-spacing:1px; margin-bottom:8px;">🥋 DOJO ── やってみる</div>
        <div style="font-size:12px; color:var(--text-secondary); line-height:1.9;">歌舞伎クイズ<br>台詞稽古チャレンジ<br>大向う道場</div>
        <div style="font-size:10px; color:var(--text-tertiary); margin-top:6px;">体験型・エンタメ</div>
      </div>
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
        <tr><td>価値</td><td>知る・観る・学ぶ</td><td>発信する・記録する・稽古する</td></tr>
        <tr><td>公開面</td><td>NAVI、LIVE、RECO、DOJO</td><td>GATE（団体公式サイト・チャットボット・公演情報）</td></tr>
        <tr><td>内部面</td><td>─</td><td>BASE（公演/出演記録・台本・稽古メモ・稽古【実践版】）</td></tr>
        <tr><td>導入体験</td><td>─</td><td>チャットで質問に答えるだけで公式サイト＋ボット完成</td></tr>
        <tr><td>スケール</td><td>歌舞伎全体（大歌舞伎含む）</td><td>気良歌舞伎 → 全国の地歌舞伎団体へ横展開</td></tr>
      </tbody>
    </table>
  </div>

  <!-- トップページ構成イメージ -->
  <div class="note-section">
    <div class="note-title">トップページ構成イメージ</div>
    <div class="tab-preview-label">ヘッダー：ブランド切替トグル</div>
    <div style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-md); overflow:hidden; box-shadow:var(--shadow-sm); margin-bottom:20px;">
      <div style="text-align:center; padding:16px 16px 10px;">
        <div style="font-size:10px; letter-spacing:3px; color:var(--gold);">🎭</div>
        <div style="font-family:'Noto Serif JP',serif; font-size:16px; font-weight:700; margin:2px 0;">歌舞伎を、もっと面白く。</div>
        <div style="font-size:11px; color:var(--text-tertiary);">観る、学ぶ、演じる。</div>
      </div>
      <div style="display:flex; margin:8px 20px 14px; border-radius:8px; overflow:hidden; border:1px solid var(--border-light);">
        <div style="flex:1; text-align:center; padding:8px; background:#3D3127; color:white; font-size:12px; font-weight:600; letter-spacing:1px;">KABUKI PLUS+</div>
        <div style="flex:1; text-align:center; padding:8px; background:var(--bg-subtle); color:var(--text-tertiary); font-size:12px; font-weight:500; letter-spacing:1px;">JIKABUKI PLUS+</div>
      </div>
      <div style="padding:0 16px 14px;">
        <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:8px; letter-spacing:0.5px;">コンテンツ</div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          <div style="display:flex; align-items:center; gap:10px; padding:10px 12px; background:var(--bg-subtle); border-radius:8px;"><span style="font-size:16px;">🧭</span><div><div style="font-size:13px; font-weight:600;">KABUKI NAVI</div><div style="font-size:10px; color:var(--text-tertiary);">演目・用語・人物・おすすめ</div></div></div>
          <div style="display:flex; align-items:center; gap:10px; padding:10px 12px; background:var(--bg-subtle); border-radius:8px;"><span style="font-size:16px;">📡</span><div><div style="font-size:13px; font-weight:600;">KABUKI LIVE</div><div style="font-size:10px; color:var(--text-tertiary);">ニュース・公演スケジュール</div></div></div>
          <div style="display:flex; align-items:center; gap:10px; padding:10px 12px; background:var(--bg-subtle); border-radius:8px;"><span style="font-size:16px;">📖</span><div><div style="font-size:13px; font-weight:600;">KABUKI RECO</div><div style="font-size:10px; color:var(--text-tertiary);">観劇ログ・推し俳優の記録</div></div></div>
          <div style="display:flex; align-items:center; gap:10px; padding:10px 12px; background:var(--bg-subtle); border-radius:8px;"><span style="font-size:16px;">🥋</span><div><div style="font-size:13px; font-weight:600;">KABUKI DOJO</div><div style="font-size:10px; color:var(--text-tertiary);">クイズ・台詞稽古・大向う道場</div></div></div>
        </div>
      </div>
    </div>

    <div class="tab-preview-label">JIKABUKI PLUS+ に切り替えた場合</div>
    <div style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-md); overflow:hidden; box-shadow:var(--shadow-sm); margin-bottom:20px;">
      <div style="text-align:center; padding:16px 16px 10px;">
        <div style="font-size:10px; letter-spacing:3px; color:var(--accent-red);">🏯</div>
        <div style="font-family:'Noto Serif JP',serif; font-size:16px; font-weight:700; margin:2px 0;">演じる人の、デジタル楽屋。</div>
        <div style="font-size:11px; color:var(--text-tertiary);">記録する、稽古する、共有する。</div>
      </div>
      <div style="display:flex; margin:8px 20px 14px; border-radius:8px; overflow:hidden; border:1px solid var(--border-light);">
        <div style="flex:1; text-align:center; padding:8px; background:var(--bg-subtle); color:var(--text-tertiary); font-size:12px; font-weight:500; letter-spacing:1px;">KABUKI PLUS+</div>
        <div style="flex:1; text-align:center; padding:8px; background:var(--accent-red); color:white; font-size:12px; font-weight:600; letter-spacing:1px;">JIKABUKI PLUS+</div>
      </div>
      <div style="padding:0 16px 14px;">
        <div style="font-size:11px; color:var(--accent-red); font-weight:600; margin-bottom:8px; letter-spacing:0.5px;">🌐 JIKABUKI GATE ── ぶたい</div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          <div style="display:flex; align-items:center; gap:10px; padding:10px 12px; background:var(--bg-subtle); border-radius:8px;"><span style="font-size:16px;">🏠</span><div><div style="font-size:13px; font-weight:600;">団体公式サイト</div><div style="font-size:10px; color:var(--text-tertiary);">テンプレで自動生成・チャットボット付き</div></div></div>
        </div>

        <div style="margin:10px 0; border-top:1px dashed var(--border-light);"></div>

        <div style="font-size:11px; color:var(--accent-red); font-weight:600; margin-bottom:8px; letter-spacing:0.5px;">📡 JIKABUKI INFO ── お知らせ</div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          <div style="display:flex; align-items:center; gap:10px; padding:10px 12px; background:var(--bg-subtle); border-radius:8px;"><span style="font-size:16px;">📰</span><div><div style="font-size:13px; font-weight:600;">地歌舞伎ニュース</div><div style="font-size:10px; color:var(--text-tertiary);">ニュース＋イベントカレンダー</div></div></div>
        </div>

        <div style="margin:10px 0; border-top:1px dashed var(--border-light);"></div>

        <div style="font-size:11px; color:var(--text-secondary); font-weight:600; margin-bottom:8px; letter-spacing:0.5px;">🔒 JIKABUKI BASE ── 楽屋</div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          <div style="display:flex; align-items:center; gap:10px; padding:10px 12px; background:var(--bg-subtle); border-radius:8px;"><span style="font-size:16px;">📋</span><div><div style="font-size:13px; font-weight:600;">公演記録・台本共有</div><div style="font-size:10px; color:var(--text-tertiary);">運営ツール＋業界共有DB</div></div></div>
        </div>

        <div style="margin:10px 0; border-top:1px dashed var(--border-light);"></div>

        <div style="font-size:11px; color:var(--text-secondary); font-weight:600; margin-bottom:8px; letter-spacing:0.5px;">🧪 JIKABUKI LABO ── 試す・作る</div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          <div style="display:flex; align-items:center; gap:10px; padding:10px 12px; background:var(--bg-subtle); border-radius:8px;"><span style="font-size:16px;">🎤</span><div><div style="font-size:13px; font-weight:600;">稽古モード・台詞チャレンジ</div><div style="font-size:10px; color:var(--text-tertiary);">稽古ツール＋ベータテスト</div></div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- メモ -->
  <div class="arch-note">
    <strong>💡 この構成のポイント</strong><br><br>
    <strong>けらのすけ = 歌舞伎の「友達」</strong> ── 教科書ではなく友達。会話で相談に乗り（①）、必要ならWebに案内し（②）、GATEでは団体のサイトを一緒に作り（③）、詳しい解説はNAVIに任せる（④）。LINEでは会話のテンポを大事にする存在。<br><br>
    <strong>明快な棲み分け</strong> ── KABUKI PLUS+ は「観る人」、JIKABUKI PLUS+ は「演じる人・運営する人」。ターゲットが完全に分かれる。<br><br>
    <strong>JIKABUKI PLUS+ の4モジュール</strong> ── 「GATE」（ぶたい）・「INFO」（たより）・「BASE」（がくや）・「LABO」（こうぼう）。KABUKI PLUS+ の4モジュール（NAVI/LIVE/RECO/DOJO）と完全対称。全8モジュールの頭文字がすべて異なる。<br><br>
    <strong>チャットで導入完了</strong> ── 新しい団体は、けらのすけ（AI）の質問に答えていくだけで、FAQ・公式サイト・チャットボットが自動生成。ITに不慣れな事務局でも参入障壁ゼロ。気良歌舞伎のサイトがそのままテンプレートに。<br><br>
    <strong>台本共有で横展開</strong> ── 約200の地歌舞伎団体にとって、台本の調達・管理は大きな負担。共有できれば「使いたい」の強い動機に。<br><br>
    <strong>共有基盤</strong> ── けらのすけ（AI）、稽古エンジン、LINE Bot、Cloudflareインフラは両ブランド共通。<br><br>
    <strong>段階的に</strong> ── まず気良歌舞伎で全機能を使い込み、磨いてから他団体へ。気良歌舞伎が「最高のテンプレート」になる。
  </div>

  <div style="text-align: center; margin-top: 24px;">
    <a href="/project" style="display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; font-size: 14px; color: var(--gold-dark); font-weight: 600; text-decoration: none;">← プロジェクト解説へ戻る</a>
  </div>

  <div class="footer">
    🎭 JIKABUKI × AI — Architecture v2.0
  </div>
</div>
</body>
</html>`;
}
