// =============================================================
// 台詞道場 — /training/serifu
// YouTube + カラオケ字幕（弁天小僧「知らざぁ言って聞かせやしょう」）
// =============================================================

export function serifuPageHTML() {

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>台詞稽古 ─ 弁天小僧 | KABUKI PLUS+</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg-page: #FAF7F2;
    --bg-card: rgba(255,255,255,0.90);
    --bg-subtle: #F3EDE4;
    --text-primary: #3D3127;
    --text-secondary: #7A6F63;
    --text-tertiary: #A89E93;
    --gold: #C5A255;
    --gold-dark: #A8873A;
    --gold-soft: #F5EDD8;
    --accent-1: #D4614B;
    --accent-3: #6B9E78;
    --border-light: #EDE7DD;
    --border-medium: #DDD5C8;
    --shadow-sm: 0 1px 3px rgba(61,49,39,0.06);
    --shadow-md: 0 4px 12px rgba(61,49,39,0.08);
    --radius-md: 12px;
    /* Legacy aliases for any remaining references */
    --kuro: var(--text-primary);
    --aka: var(--accent-1);
    --moegi: var(--accent-3);
    --kin: var(--gold);
    --shiro: var(--text-primary);
    /* Serifu-page legacy aliases */
    --bg: var(--bg-page); --bg-gradient: none;
    --surface: var(--bg-subtle); --surface-elevated: var(--bg-card);
    --border: var(--border-light); --border-focus: var(--border-medium);
    --gold-dim: var(--gold-dark); --gold-glow: rgba(197,162,85,0.15);
    --red: var(--accent-1); --text: var(--text-primary); --dim: var(--text-secondary);
    --dimmer: var(--text-tertiary); --unlit: rgba(61,49,39,0.18);
    --radius: 12px; --radius-lg: 16px; --shadow: var(--shadow-md);
    --shadow-gold: 0 8px 32px rgba(197,162,85,0.10);
  }
  body {
    background: var(--bg-page);
    color: var(--text-primary); font-family: 'Noto Sans JP', sans-serif;
    min-height: 100vh; min-height: 100dvh;
    display: flex; flex-direction: column; overflow-x: hidden;
  }
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
  .hidden { display: none !important; }
  /* ── イントロ画面 ── */
  #intro {
    max-width: 640px; margin: 0 auto; padding: 2.5rem 1.25rem;
    text-align: center; flex: 1;
    display: flex; flex-direction: column; justify-content: center;
  }
  #intro h1 {
    font-family: 'Noto Serif JP', serif; font-size: 2rem; font-weight: 900;
    letter-spacing: 0.35em; color: var(--text-primary);
    margin: 0 0 0.5rem;
    animation: intro-title 1.2s ease-out;
  }
  @keyframes intro-title {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  #intro .subtitle {
    font-size: 0.95rem; color: var(--dim); letter-spacing: 0.12em;
    margin-bottom: 1.75rem; line-height: 1.7;
  }
  .pre-btn {
    font-size: 0.8rem; color: var(--dimmer); margin-top: 1.5rem;
    letter-spacing: 0.08em;
  }
  .start-choices {
    display: flex; flex-wrap: wrap; gap: 14px; margin-top: 1rem;
    max-width: 560px; margin-left: auto; margin-right: auto; justify-content: center;
  }
  .start-choice {
    flex: 1; min-width: 160px;
    padding: 22px 14px; border: 1px solid var(--border);
    border-radius: var(--radius-lg); background: var(--surface);
    cursor: pointer; text-align: center;
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.2s;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    box-shadow: var(--shadow);
  }
  .start-choice:hover {
    border-color: var(--gold-dim); transform: translateY(-4px);
    box-shadow: var(--shadow-gold), 0 12px 28px rgba(0,0,0,0.35);
  }
  .start-choice:active { transform: translateY(-1px); }
  .start-choice:disabled { opacity: 0.5; cursor: wait; }
  .choice-icon { font-size: 2.2rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); }
  .choice-title {
    font-family: 'Noto Serif JP', serif; font-size: 1.15rem;
    font-weight: 700; color: var(--gold); letter-spacing: 0.12em;
  }
  .choice-desc { font-size: 0.8rem; color: var(--dim); line-height: 1.55; }
  /* 操作説明（折りたたみ） */
  .how-to {
    max-width: 540px; margin: 1.5rem auto 0; text-align: left;
  }
  .how-to .summary-box {
    font-size: 0.9rem; color: var(--text-secondary); line-height: 1.7;
    text-align: center; margin-bottom: 0.5rem;
  }
  .how-to .summary-box b { color: var(--gold); }
  .how-to details {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 0.9rem 1.25rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.2);
  }
  .how-to details summary {
    font-size: 0.9rem; color: var(--gold); cursor: pointer;
    text-align: center; letter-spacing: 0.1em;
    list-style: none; padding: 0.2rem 0;
  }
  .how-to details summary::-webkit-details-marker { display: none; }
  .how-to details summary::after { content: " ▼"; font-size: 0.7rem; }
  .how-to details[open] summary::after { content: " ▲"; }
  .how-to .detail-body {
    margin-top: 0.6rem; padding-top: 0.6rem;
    border-top: 1px solid var(--border);
  }
  .how-to ol {
    padding-left: 1.5rem; list-style: none; counter-reset: step;
  }
  .how-to ol li {
    counter-increment: step; margin-bottom: 0.5rem; font-size: 0.85rem;
    color: var(--text-secondary); line-height: 1.6; position: relative;
  }
  .how-to ol li::before {
    content: counter(step); position: absolute; left: -1.5rem;
    width: 1.3rem; height: 1.3rem; background: var(--red); color: #fff;
    border-radius: 50%; font-size: 0.7rem; font-weight: 700;
    display: flex; align-items: center; justify-content: center; top: 0.15rem;
    box-shadow: 0 2px 8px rgba(196,56,56,0.4);
  }
  .how-to ol li b { color: var(--gold); }
  .header {
    padding: 14px 18px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 12px; flex-shrink: 0;
    background: rgba(250,247,242,0.85); backdrop-filter: blur(8px);
  }
  .header-title {
    font-family: 'Noto Serif JP', serif; font-size: 1.2rem;
    font-weight: 900; letter-spacing: 0.2em; color: var(--text-primary);
  }
  .header-sub { font-size: 10px; color: var(--dim); letter-spacing: 0.12em; }
  .video-wrap {
    width: 100%; max-width: 640px; margin: 0 auto;
    padding: 14px 18px 0; flex-shrink: 0;
    position: sticky; top: 0; z-index: 10;
    background: transparent;
  }
  .video-container {
    position: relative; width: 100%; padding-bottom: 56.25%;
    background: #000; border-radius: var(--radius-lg); overflow: hidden;
    box-shadow: 0 8px 40px rgba(61,49,39,0.12);
  }
  .video-container iframe {
    position: absolute; top: 0; left: 0;
    width: 100%; height: 100%; border: 0;
  }
  /* ── 復唱オーバーレイ（動画上） ── */
  .video-overlay {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(10, 8, 12, 0.94);
    display: none; flex-direction: column;
    justify-content: center; align-items: center;
    z-index: 2; border-radius: var(--radius-lg); padding: 20px; gap: 8px;
  }
  .video-overlay.show { display: flex; }
  .video-overlay.flash {
    animation: overlay-flash 0.8s ease-out;
  }
  @keyframes overlay-flash {
    0% { background: rgba(224,184,74,0.92); }
    15% { background: rgba(224,184,74,0.7); }
    35% { background: rgba(40,35,25,0.95); }
    100% { background: rgba(12,10,14,0.96); }
  }
  .overlay-cue {
    position: absolute; width: 100px; height: 100px;
    border-radius: 50%; border: 3px solid var(--gold);
    opacity: 0; pointer-events: none;
  }
  .overlay-cue.ring1 { animation: ripple-out 0.9s ease-out forwards; }
  @keyframes ripple-out {
    0% { opacity: 1; transform: scale(0.1); border-width: 4px; }
    30% { opacity: 0.7; }
    100% { opacity: 0; transform: scale(5); border-width: 1px; }
  }
  .overlay-cue2 {
    position: absolute; width: 100px; height: 100px;
    border-radius: 50%; border: 2px solid var(--gold);
    opacity: 0; pointer-events: none;
  }
  .overlay-cue2.ring2 { animation: ripple-out 0.9s 0.12s ease-out forwards; }
  .overlay-phrase { text-align: center; opacity: 0; transition: opacity 0.5s ease; }
  .overlay-phrase.visible { opacity: 1; }
  .overlay-phrase .phrase-meta { display: none; }
  .overlay-phrase .phrase-text {
    font-size: 26px; letter-spacing: 3px; line-height: 1.9;
  }
  .overlay-phrase .phrase-reading {
    font-size: 13px; letter-spacing: 2px;
  }
  .lyrics-section {
    min-height: 280px; display: flex; flex-direction: column;
    max-width: 640px; margin: 0 auto; width: 100%;
  }
  .lyrics-section h2 {
    font-size: 13px; color: var(--gold); letter-spacing: 0.18em;
    padding: 14px 18px 10px; flex-shrink: 0; border-bottom: 1px solid var(--border);
  }
  .lyrics {
    overflow: hidden; padding: 10px 18px;
    max-width: 640px; margin: 0 auto; width: 100%;
    display: flex; flex-direction: column; justify-content: flex-start; gap: 6px;
  }
  .slot {
    border-radius: var(--radius); padding: 16px 18px;
    border-left: 4px solid transparent;
    min-height: 72px; transition: background 0.25s ease, border-color 0.2s;
  }
  .slot:empty { visibility: hidden; }
  #slot-prev { opacity: 0.35; }
  #slot-active {
    background: var(--gold-soft); border-left-color: var(--gold);
    box-shadow: 0 0 0 1px rgba(224,184,74,0.08);
  }
  #slot-next { border-left-color: var(--dimmer); }
  .phrase-meta {
    font-size: 10px; font-family: monospace;
    color: var(--dimmer); margin-bottom: 4px;
  }
  #slot-active .phrase-meta { color: var(--gold); }
  .phrase-text {
    font-family: 'Noto Serif JP', serif; font-size: 26px;
    font-weight: 700; letter-spacing: 3px; color: var(--unlit);
    line-height: 1.9;
  }
  #slot-active .phrase-text { color: var(--text); }
  .kchar { display: inline-block; position: relative; color: var(--unlit); }
  .kchar-sizer { visibility: hidden; }
  .kchar-base { position: absolute; left: 0; top: 0; color: var(--unlit); }
  .kchar-lit {
    position: absolute; left: 0; top: 0; color: var(--gold);
    overflow: hidden; white-space: nowrap; will-change: width;
  }
  .phrase-reading {
    font-family: 'Noto Sans JP', sans-serif; font-size: 13px;
    color: var(--dimmer); letter-spacing: 2px; margin-top: 2px;
    line-height: 1.6;
  }
  #slot-active .phrase-reading { color: var(--dim); }
  .mode-indicator {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 18px; flex-shrink: 0;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }
  .mode-label {
    font-size: 13px; font-weight: 700; color: var(--gold);
    letter-spacing: 0.05em;
  }
  .mode-desc {
    font-size: 11px; color: var(--dim); margin-left: 8px; font-weight: 400;
  }
  .mode-switch {
    border: 1px solid var(--border); border-radius: 20px;
    background: var(--surface-elevated); color: var(--dim); font-size: 11px;
    padding: 6px 14px; cursor: pointer; letter-spacing: 0.05em;
    font-family: 'Noto Sans JP', sans-serif;
    transition: border-color 0.2s, color 0.2s, background 0.2s;
  }
  .mode-switch:hover { border-color: var(--gold-dim); color: var(--gold); background: rgba(224,184,74,0.06); }
  .repeat-controls {
    display: none; flex-direction: row; gap: 10px;
    padding: 12px 18px; justify-content: center; flex-shrink: 0;
    border-top: 1px solid var(--border); background: var(--surface);
  }
  .repeat-controls.show { display: flex; }
  .repeat-btn {
    padding: 10px 22px; border: 1px solid var(--border); border-radius: 10px;
    background: var(--surface-elevated); color: var(--text); font-size: 14px;
    font-family: 'Noto Sans JP', sans-serif; cursor: pointer;
    transition: background 0.2s, border-color 0.2s, transform 0.15s;
  }
  .repeat-btn:hover { border-color: var(--border-focus); }
  .repeat-btn:active { transform: scale(0.98); }
  .repeat-btn-next {
    background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dim) 100%);
    color: var(--bg); border-color: var(--gold-dim);
    font-weight: 700; box-shadow: 0 4px 16px rgba(224,184,74,0.25);
  }
  .repeat-btn-next:hover { box-shadow: 0 6px 20px rgba(224,184,74,0.35); }
  .repeat-btn-next:active { opacity: 0.9; }
  .repeat-status {
    text-align: center; padding: 4px 16px; font-size: 12px;
    color: var(--dim); flex-shrink: 0;
  }
  .repeat-status.reciting {
    color: var(--gold); font-size: 16px; font-weight: 700;
    animation: recite-pulse 1.2s ease-in-out infinite;
  }
  @keyframes recite-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  .footer {
    padding: 10px 18px; border-top: 1px solid var(--border);
    font-size: 10px; color: var(--dimmer); text-align: center; flex-shrink: 0;
    letter-spacing: 0.08em;
  }
  .mic-section {
    display: none; padding: 12px 18px;
    border-bottom: 1px solid var(--border); flex-shrink: 0;
    max-width: 640px; margin: 0 auto; width: 100%;
    background: var(--surface);
  }
  .mic-section.show { display: block; }
  .mic-toggle {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 8px;
  }
  .mic-btn {
    padding: 8px 16px; border: 1px solid var(--border); border-radius: 10px;
    background: var(--surface-elevated); color: var(--dim); font-size: 12px;
    font-family: 'Noto Sans JP', sans-serif; cursor: pointer;
    transition: border-color 0.2s, color 0.2s, box-shadow 0.2s;
  }
  .mic-btn.active { border-color: #d84848; color: #e85858; box-shadow: 0 0 0 1px rgba(232,88,88,0.2); }
  .mic-btn:hover:not(:disabled) { border-color: var(--gold-dim); color: var(--gold); }
  .mic-btn:disabled { opacity: 0.7; cursor: not-allowed; }
  .mic-status { font-size: 11px; color: var(--dim); }
  .mic-mute-option { display: none; margin-top: 8px; font-size: 12px; color: var(--dim); }
  .mic-mute-option.show { display: flex; align-items: center; gap: 8px; }
  .mic-mute-option input { accent-color: var(--gold); }
  .volume-meter {
    height: 8px; background: var(--border); border-radius: 4px;
    overflow: hidden; position: relative;
  }
  .volume-bar {
    height: 100%; width: 0%; border-radius: 4px;
    background: linear-gradient(90deg, var(--gold-dim), var(--gold), #d84848);
    transition: width 0.06s ease-out;
  }
  /* ── 判定バッジ ── */
  .judge-badge {
    display: inline-block; font-size: 13px; font-weight: 700;
    padding: 2px 10px; border-radius: 6px; margin-left: 8px;
    vertical-align: middle; animation: badge-pop 0.4s ease-out;
  }
  @keyframes badge-pop {
    0% { transform: scale(0.5); opacity: 0; }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); opacity: 1; }
  }
  .judge-great { background: rgba(197,162,85,0.15); color: #A8873A; }
  .judge-good  { background: rgba(80,160,80,0.15); color: #3d8b3d; }
  .judge-miss  { background: rgba(200,50,50,0.15); color: #c83838; }
  /* ── オーバーレイ判定 ── */
  .overlay-judge {
    font-size: 28px; font-weight: 900; letter-spacing: 4px;
    opacity: 0; transform: scale(0.5);
    transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1);
    margin-top: 8px;
  }
  .overlay-judge.visible {
    opacity: 1; transform: scale(1);
  }
  .overlay-judge.great { color: #ffd700; text-shadow: 0 0 20px rgba(255,215,0,0.5); }
  .overlay-judge.good  { color: #80d080; text-shadow: 0 0 20px rgba(100,200,100,0.4); }
  .overlay-judge.miss  { color: #e05050; text-shadow: 0 0 20px rgba(200,50,50,0.4); }
  .score-display {
    display: none; text-align: center; padding: 14px 18px;
    border-bottom: 1px solid var(--border); flex-shrink: 0;
    max-width: 640px; margin: 0 auto; width: 100%;
    background: var(--surface); align-items: center; justify-content: center; gap: 24px;
  }
  .score-display.show { display: flex; }
  .score-main { display: flex; align-items: baseline; gap: 6px; }
  .score-value {
    font-family: 'Noto Serif JP', serif; font-size: 2.25rem;
    font-weight: 900; color: var(--gold); letter-spacing: 0.08em;
    text-shadow: 0 0 24px var(--gold-glow);
  }
  .score-label { font-size: 11px; color: var(--dim); letter-spacing: 0.05em; }
  .score-detail { display: flex; gap: 16px; font-size: 12px; font-weight: 600; }
  .score-great { color: #A8873A; }
  .score-good  { color: #3d8b3d; }
  .score-miss  { color: #c83838; }
  .micjudge-start-bar {
    display: none; align-items: center; justify-content: center; gap: 14px;
    padding: 16px 18px; background: var(--surface);
    border-bottom: 1px solid var(--border); flex-shrink: 0;
    max-width: 640px; margin: 0 auto; width: 100%;
    flex-wrap: wrap; text-align: center;
  }
  .micjudge-start-bar.show { display: flex; }
  .micjudge-start-bar .msg { font-size: 13px; color: var(--dim); }
  .micjudge-start-bar .btn-start {
    padding: 12px 28px; background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dim) 100%);
    color: var(--bg); border: none; border-radius: 12px; font-size: 15px; font-weight: 700;
    font-family: 'Noto Sans JP', sans-serif; cursor: pointer;
    letter-spacing: 0.12em; box-shadow: 0 4px 20px rgba(224,184,74,0.3);
    transition: transform 0.15s, box-shadow 0.2s;
  }
  .micjudge-start-bar .btn-start:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(224,184,74,0.4); }
  .micjudge-start-bar .btn-start:active { transform: translateY(0); }
  .micjudge-end-bar {
    display: none; align-items: center; justify-content: center; gap: 14px;
    padding: 16px 18px; background: var(--surface);
    border-bottom: 1px solid var(--border); flex-shrink: 0;
    max-width: 640px; margin: 0 auto; width: 100%;
    flex-wrap: wrap; text-align: center;
  }
  .micjudge-end-bar.show { display: flex; }
  .micjudge-end-bar .msg { font-size: 14px; color: var(--gold); font-weight: 600; letter-spacing: 0.08em; }
  .micjudge-end-bar .btn-restart {
    padding: 12px 28px; background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dim) 100%);
    color: var(--bg); border: none; border-radius: 12px; font-size: 15px; font-weight: 700;
    font-family: 'Noto Sans JP', sans-serif; cursor: pointer;
    letter-spacing: 0.12em; box-shadow: 0 4px 20px rgba(224,184,74,0.3);
    transition: transform 0.15s, box-shadow 0.2s;
  }
  .micjudge-end-bar .btn-restart:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(224,184,74,0.4); }
  .micjudge-end-bar .btn-restart:active { transform: translateY(0); }
  @media (max-width: 480px) {
    .phrase-text { font-size: 22px; letter-spacing: 2px; }
    .header-title { font-size: 15px; letter-spacing: 2px; }
  }
</style>
</head>
<body>

<div class="header">
  <a href="/kabuki/dojo" style="color:var(--gold);text-decoration:none;font-size:0.85rem;">← DOJO</a>
  <span style="font-size:24px">🎭</span>
  <div>
    <div class="header-title">台詞稽古</div>
    <div class="header-sub">弁天小僧（浜松屋の場）</div>
  </div>
</div>

<!-- ===== イントロ画面 ===== -->
<div id="intro">
  <div style="text-align:left;margin-bottom:0.5rem;align-self:flex-start;">
    <a href="/kabuki/dojo" style="color:var(--gold);text-decoration:none;font-size:0.9rem;">← KABUKI DOJO</a>
  </div>
  <h1>台詞稽古</h1>
  <div class="subtitle">弁天小僧（浜松屋の場）<br>「知らざぁ言って聞かせやしょう」</div>

  <div class="how-to">
    <div class="summary-box">
      <b>🎵 お手本と一緒に</b> 動画に合わせて声を出してみよう<br>
      <b>📢 復唱しよう</b> 1フレーズずつ止めてお手本を復唱<br>
      <b>🎤 マイク判定</b> 全編流しながら声のタイミングを採点
    </div>
    <details>
      <summary>くわしいあそびかた</summary>
      <div class="detail-body">
        <ol>
          <li>下の練習モードを選ぶと動画がスタート</li>
          <li><b>「お手本と一緒に」</b> ── 動画に合わせて声を出す</li>
          <li><b>「復唱しよう」</b> ── 1フレーズずつ止めて復唱。動画が光ったら台詞カードに合わせて</li>
          <li><b>「マイク判定」</b> ── お手本と同様に全編再生。台詞の区間で声を出すと Great/Good/Miss で採点</li>
          <li>台詞の間だけ動画を消すことはできませんが、マイク判定では<b>動画をミュート</b>にして自分の声だけ聞けます</li>
        </ol>
      </div>
    </details>
  </div>

  <div class="pre-btn">練習モードを選んでね</div>
  <div class="start-choices">
    <button class="start-choice" id="start-karaoke" disabled>
      <span class="choice-icon">🎵</span>
      <span class="choice-title">お手本と一緒に</span>
      <span class="choice-desc">動画に合わせて<br>声を出してみよう</span>
    </button>
    <button class="start-choice" id="start-repeat" disabled>
      <span class="choice-icon">📢</span>
      <span class="choice-title">復唱しよう</span>
      <span class="choice-desc">1フレーズずつ止めて<br>お手本を復唱</span>
    </button>
    <button class="start-choice" id="start-micjudge" disabled>
      <span class="choice-icon">🎤</span>
      <span class="choice-title">マイク判定</span>
      <span class="choice-desc">全編流して<br>声のタイミングを採点</span>
    </button>
  </div>
</div>

<div class="video-wrap hidden" id="video-wrap">
  <div class="video-container">
    <iframe id="yt-iframe" src="https://www.youtube.com/embed/iFwMXYtqYA0?enablejsapi=1&amp;playsinline=1&amp;rel=0&amp;modestbranding=1" title="弁天小僧" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>
    <div class="video-overlay" id="video-overlay">
      <div class="overlay-cue" id="overlay-cue"></div>
      <div class="overlay-cue2" id="overlay-cue2"></div>
      <div class="overlay-phrase" id="overlay-phrase"></div>
      <div class="overlay-judge" id="overlay-judge"></div>
    </div>
  </div>
</div>

<div class="micjudge-start-bar" id="micjudge-start-bar">
  <span class="msg">\u30DE\u30A4\u30AF\u3092ON\u306B\u3057\u3066\u304B\u3089\u300C\u518D\u751F\u958B\u59CB\u300D\u3092\u62BC\u3057\u3066\u306D</span>
  <button type="button" class="btn-start" id="micjudge-btn-start">\u518D\u751F\u958B\u59CB</button>
</div>

<div class="micjudge-end-bar" id="micjudge-end-bar">
  <span class="msg">\u304A\u3064\u304B\u308C\u3055\u307E\uFF01</span>
  <button type="button" class="btn-restart" id="micjudge-btn-restart">\u{1F4E2} \u3082\u3046\u4E00\u56DE\u30B9\u30BF\u30FC\u30C8</button>
</div>

<div class="mic-section" id="mic-section">
  <div class="mic-toggle">
    <button class="mic-btn" id="mic-btn">\u{1F3A4} \u30DE\u30A4\u30AFON</button>
    <span class="mic-status" id="mic-status"></span>
  </div>
  <label class="mic-mute-option" id="mic-mute-option">
    <input type="checkbox" id="video-mute-cb">
    <span>\u52D5\u753B\u3092\u30DF\u30E5\u30FC\u30C8\uFF08\u81EA\u5206\u306E\u58F0\u3060\u3051\u805E\u304F\uFF09</span>
  </label>
  <div class="volume-meter" id="volume-meter">
    <div class="volume-bar" id="volume-bar"></div>
  </div>
</div>

<div class="score-display" id="score-display">
  <div class="score-main">
    <span class="score-value" id="score-value">0</span>
    <span class="score-label">\u70B9</span>
  </div>
  <div class="score-detail">
    <span class="score-great" id="sc-great">\u{1F3AF} 0</span>
    <span class="score-good" id="sc-good">\u2B55 0</span>
    <span class="score-miss" id="sc-miss">\u274C 0</span>
  </div>
</div>

<div class="lyrics-section hidden" id="lyrics-section">
  <div class="mode-indicator" id="mode-indicator">
    <span><span class="mode-label" id="mode-label">🎵 お手本と一緒に</span><span class="mode-desc" id="mode-desc">動画に合わせて声を出してみよう</span></span>
    <button class="mode-switch" id="mode-switch">モード切替</button>
  </div>
  <div class="lyrics" id="lyrics">
    <div class="slot" id="slot-prev"></div>
    <div class="slot" id="slot-active"></div>
    <div class="slot" id="slot-next"></div>
  </div>
  <div class="repeat-status" id="repeat-status"></div>
  <div class="repeat-controls" id="repeat-controls">
    <button class="repeat-btn" id="btn-prev-phrase">⏮ 前へ</button>
    <button class="repeat-btn" id="btn-again">🔄 もう一度</button>
    <button class="repeat-btn repeat-btn-next" id="btn-next-phrase">次へ ⏭</button>
  </div>
</div>
<div style="flex:1"></div>
<div class="footer"><a href="/kabuki/dojo" style="color:var(--gold);text-decoration:none;">← KABUKI DOJO へ戻る</a></div>

<script>
(function() {
  var CUES = [];
  var packLoaded = false;

  fetch("/api/training/serifu/benten")
    .then(function(r) { return r.json(); })
    .then(function(pack) {
      CUES = pack.cues;
      packLoaded = true;
      var btns = document.querySelectorAll(".start-choice");
      for (var i = 0; i < btns.length; i++) btns[i].disabled = false;
    })
    .catch(function(e) {
      console.error("Training pack load error:", e);
    });

  function fmtTime(sec) {
    var m = Math.floor((sec || 0) / 60);
    var s = Math.floor((sec || 0) % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  // YouTube IFrame API を後から読み込む
  var player = null;
  var playerReady = false;

  window.onYouTubeIframeAPIReady = function() {};

  function tryInitPlayer() {
    var iframe = document.getElementById('yt-iframe');
    if (!iframe) return;

    var currentTime = 0;

    // YouTube postMessage API からの応答を受信
    window.addEventListener('message', function(e) {
      if (e.origin !== 'https://www.youtube.com') return;
      try {
        var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number') {
            currentTime = data.info.currentTime;
          }
        }
        if (data.event === 'initialDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number') {
            currentTime = data.info.currentTime;
          }
        }
      } catch(ex) {}
    });

    function startListening() {
      try {
        // listening を開始（これで infoDelivery イベントが送られてくるようになる）
        iframe.contentWindow.postMessage(JSON.stringify({
          event: 'listening',
          id: 1,
          channel: 'widget'
        }), 'https://www.youtube.com');
      } catch(ex) {}
    }

    // iframe 読み込み完了後にリスニング開始
    iframe.addEventListener('load', function() {
      startListening();
      // 念のため少し遅れてもう一度
      setTimeout(startListening, 1000);
      setTimeout(startListening, 3000);
    });
    // すでに読み込み済みの場合
    startListening();

    // ── YouTube 制御 ──
    function ytCmd(func, args) {
      try {
        iframe.contentWindow.postMessage(JSON.stringify({
          event: 'command', func: func, args: args || []
        }), 'https://www.youtube.com');
      } catch(ex) {}
    }

    // ── スタートボタン（モード選択） ──
    function startWith(m) {
      document.getElementById('intro').classList.add('hidden');
      document.getElementById('video-wrap').classList.remove('hidden');
      document.getElementById('lyrics-section').classList.remove('hidden');
      mode = m;
      updateModeIndicator();
      repeatCtrl.classList.toggle('show', m === 'repeat');
      if (m === 'repeat') {
        repeatSP = 0;
        resetRepeatState();
        updateRepeatStatus();
        micSection.classList.remove('show');
        document.getElementById('mic-mute-option').classList.remove('show');
      } else if (m === 'micJudge') {
        if (hasMicSupport) micSection.classList.add('show');
        document.getElementById('mic-mute-option').classList.add('show');
        resetScore();
        judgedPhrasesMicJudge = {};
        voiceSamples = [];
        micJudgeWaitingStart = true;
        micJudgeEndShown = false;
        document.getElementById('micjudge-start-bar').classList.add('show');
        document.getElementById('micjudge-end-bar').classList.remove('show');
        if (document.getElementById('video-mute-cb').checked) ytCmd('mute');
        else ytCmd('unMute');
      } else {
        micSection.classList.remove('show');
        document.getElementById('mic-mute-option').classList.remove('show');
        document.getElementById('micjudge-start-bar').classList.remove('show');
        document.getElementById('micjudge-end-bar').classList.remove('show');
      }
      ytCmd('seekTo', [5, true]);  // 0:05 からスタート
      if (m === 'micJudge') {
        ytCmd('pauseVideo');
      } else {
        ytCmd('playVideo');
      }
    }
    document.getElementById('start-karaoke').addEventListener('click', function() { startWith('karaoke'); });
    document.getElementById('start-repeat').addEventListener('click', function() { startWith('repeat'); });
    document.getElementById('start-micjudge').addEventListener('click', function() { startWith('micJudge'); });

    // ── オーバーレイ ──
    var videoOverlay = document.getElementById('video-overlay');
    var overlayCue = document.getElementById('overlay-cue');
    var overlayCue2 = document.getElementById('overlay-cue2');
    var overlayPhrase = document.getElementById('overlay-phrase');
    var overlayKchars = [];
    var overlayDismissPending = false;  // 動画再生開始まで消さないフラグ

    // ── 3スロット方式 ──
    var slotPrev = document.getElementById('slot-prev');
    var slotAct  = document.getElementById('slot-active');
    var slotNext = document.getElementById('slot-next');

    // serifu インデックスリスト
    var serifuList = [];
    for (var si = 0; si < CUES.length; si++) {
      if (CUES[si].type === 'serifu') serifuList.push(si);
    }

    // 各フレーズの HTML を事前生成
    var phraseHTML = {};
    var phraseNum = 0;
    for (var pi = 0; pi < CUES.length; pi++) {
      if (CUES[pi].type !== 'serifu') continue;
      phraseNum++;
      var c = CUES[pi];
      var textArr = [];
      for (var ti = 0; ti < c.text.length; ti++) {
        var cp = c.text.codePointAt(ti);
        if (cp > 0xFFFF) { textArr.push(c.text.charAt(ti) + c.text.charAt(ti + 1)); ti++; }
        else textArr.push(c.text.charAt(ti));
      }
      var chars = '';
      for (var j = 0; j < textArr.length; j++) {
        var ch = textArr[j].replace(/&/g,'&amp;').replace(/</g,'&lt;');
        chars += '<span class="kchar"><span class="kchar-sizer">' + ch + '</span>'
          + '<span class="kchar-base">' + ch + '</span>'
          + '<span class="kchar-lit" style="width:0%">' + ch + '</span></span>';
      }
      var rdg = c.reading
        ? '<div class="phrase-reading">' + c.reading.replace(/&/g,'&amp;').replace(/</g,'&lt;') + '</div>'
        : '';
      phraseHTML[pi] = '<div class="phrase-meta">#' + phraseNum + '\u3000' + fmtTime(c.time) + '</div>'
        + '<div class="phrase-text">' + chars + '</div>' + rdg;
    }

    var lPI = -999, lAI = -999, lNI = -999;
    var activeKchars = [];

    // ── モード管理 ──
    var mode = 'karaoke';        // 'karaoke' | 'repeat' | 'micJudge'
    var repeatSP = 0;            // リピートモードの現在位置（serifuList 内）
    var repeatPausedForSP = -1;  // 最後にポーズしたフレーズ位置（重複防止）
    var repeatPhase = 'listen';  // 'listen' | 'recite'
    var reciteStart = 0;         // 復唱アニメ開始時刻 (performance.now)
    var RECITE_DELAY = 1.2;      // お手本後、復唱開始までの待機（秒）
    var RECITE_AFTER = 1.5;      // 復唱完了後、次へ進むまでの待機（秒）

    var repeatCtrl = document.getElementById('repeat-controls');
    var repeatStatus = document.getElementById('repeat-status');
    var modeLabel = document.getElementById('mode-label');
    var modeDesc = document.getElementById('mode-desc');

    function updateModeIndicator() {
      if (mode === 'karaoke') {
        modeLabel.textContent = '🎵 お手本と一緒に';
        modeDesc.textContent = '動画に合わせて声を出してみよう';
      } else if (mode === 'repeat') {
        modeLabel.textContent = '📢 復唱しよう';
        modeDesc.textContent = '1フレーズずつ止めてお手本を復唱';
      } else {
        modeLabel.textContent = '🎤 マイク判定';
        modeDesc.textContent = '全編流して声のタイミングを採点';
      }
    }

    function dismissOverlay() {
      videoOverlay.classList.remove('show', 'flash');
      overlayCue.className = 'overlay-cue';
      overlayCue2.className = 'overlay-cue2';
      overlayPhrase.classList.remove('visible');
      overlayKchars = [];
      overlayDismissPending = false;
      overlayJudge.className = 'overlay-judge';
      overlayJudge.textContent = '';
    }

    function resetRepeatState() {
      repeatPhase = 'listen';
      repeatPausedForSP = -1;
      reciteStart = 0;
      repeatStatus.classList.remove('reciting');
      stopVoiceSampling();
      // オーバーレイは即消しせず、動画再生開始まで残す
      overlayDismissPending = true;
    }

    function setMode(m) {
      mode = m;
      updateModeIndicator();
      repeatCtrl.classList.toggle('show', m === 'repeat');
      repeatStatus.textContent = '';
      repeatStatus.classList.remove('reciting');
      dismissOverlay();
      stopVoiceSampling();
      if (m === 'repeat') {
        var t = currentTime;
        repeatSP = 0;
        for (var i = 0; i < serifuList.length; i++) {
          var ci = serifuList[i];
          if (t >= CUES[ci].time) repeatSP = i;
        }
        resetRepeatState();
        updateRepeatStatus();
        micSection.classList.remove('show');
        document.getElementById('mic-mute-option').classList.remove('show');
      } else if (m === 'micJudge') {
        if (hasMicSupport) micSection.classList.add('show');
        document.getElementById('mic-mute-option').classList.add('show');
        judgedPhrasesMicJudge = {};
        voiceSamples = [];
        resetScore();
        if (document.getElementById('video-mute-cb').checked) ytCmd('mute');
        else ytCmd('unMute');
      } else {
        micSection.classList.remove('show');
        document.getElementById('mic-mute-option').classList.remove('show');
        document.getElementById('micjudge-start-bar').classList.remove('show');
        document.getElementById('micjudge-end-bar').classList.remove('show');
        scoreDisplay.classList.remove('show');
        ytCmd('unMute');
      }
    }

    function updateRepeatStatus() {
      if (mode !== 'repeat') { repeatStatus.textContent = ''; return; }
      if (repeatPhase !== 'recite') {
        repeatStatus.classList.remove('reciting');
        repeatStatus.textContent = (repeatSP + 1) + ' / ' + serifuList.length + ' フレーズ';
      }
    }

    function goToPhrase(sp) {
      repeatSP = sp;
      resetRepeatState();
      updateRepeatStatus();
      var ci = serifuList[repeatSP];
      ytCmd('seekTo', [CUES[ci].time, true]);
      ytCmd('playVideo');
    }

    // ── マイク・音量検知（Web Audio API） ──
    var audioCtx = null, analyser = null, micStream = null, micDataArray = null;
    var micActive = false;
    var volumeBar = document.getElementById('volume-bar');
    var micSection = document.getElementById('mic-section');
    var micBtn = document.getElementById('mic-btn');
    var micStatusEl = document.getElementById('mic-status');
    var scoreDisplay = document.getElementById('score-display');
    var overlayJudge = document.getElementById('overlay-judge');
    var hasMicSupport = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

    // 音量サンプリング
    var voiceSamples = [];
    var sampleInterval = null;
    var VOICE_THRESHOLD = 0.015;
    var micCalibrating = false;

    // スコア
    var judgeResults = {};
    var greatCount = 0, goodCount = 0, missCount = 0;
    var judgedForSP = -1;
    var judgedPhrasesMicJudge = {};  // micJudge用: 判定済み cueIdx
    var lastMicJudgeSampleTime = 0;  // サンプリング間引き用
    var micJudgeWaitingStart = false;  // 再生開始待ち（マイクONの猶予）
    var micJudgeEndShown = false;      // 終了バー表示済み

    function getVolume() {
      if (!analyser) return 0;
      analyser.getByteTimeDomainData(micDataArray);
      var sum = 0;
      for (var vi = 0; vi < micDataArray.length; vi++) {
        var v = (micDataArray[vi] - 128) / 128;
        sum += v * v;
      }
      return Math.sqrt(sum / micDataArray.length);
    }

    // ── キャリブレーション（環境音測定） ──
    function calibrateMic() {
      micCalibrating = true;
      micBtn.disabled = true;
      micStatusEl.textContent = '\\u{1F50A} \\u74B0\\u5883\\u97F3\\u3092\\u6E2C\\u5B9A\\u4E2D\\u2026\\u9759\\u304B\\u306B\\u3057\\u3066\\u306D';
      var calSamples = [];
      var calInterval = setInterval(function() {
        if (!analyser) { clearInterval(calInterval); return; }
        calSamples.push(getVolume());
      }, 50);
      setTimeout(function() {
        clearInterval(calInterval);
        micCalibrating = false;
        micBtn.disabled = false;
        if (calSamples.length === 0) {
          VOICE_THRESHOLD = 0.015;
        } else {
          // 環境音の平均RMSを算出
          var sum = 0;
          for (var ci2 = 0; ci2 < calSamples.length; ci2++) sum += calSamples[ci2];
          var ambient = sum / calSamples.length;
          // 閾値 = 環境音の3倍（最低 0.01）
          VOICE_THRESHOLD = Math.max(ambient * 3, 0.01);
        }
        micActive = true;
        micBtn.classList.add('active');
        micBtn.textContent = '\\u{1F3A4} \\u30DE\\u30A4\\u30AFON';
        micStatusEl.textContent = '\\u2713 \\u6E96\\u5099\\u5B8C\\u4E86\\uFF08\\u95BE\\u5024: ' + VOICE_THRESHOLD.toFixed(3) + '\\uFF09';
      }, 1500);
    }

    function initMic() {
      micBtn.disabled = true;
      micStatusEl.textContent = '\\u30DE\\u30A4\\u30AF\\u3092\\u8D77\\u52D5\\u4E2D\\u2026';
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function(stream) {
          micStream = stream;
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          analyser = audioCtx.createAnalyser();
          analyser.fftSize = 2048;
          analyser.smoothingTimeConstant = 0.3;
          var source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          micDataArray = new Uint8Array(analyser.frequencyBinCount);
          // キャリブレーション開始（環境音を1.5秒測定してから有効化）
          calibrateMic();
        })
        .catch(function(e) {
          micBtn.disabled = false;
          micStatusEl.textContent = '\\u30DE\\u30A4\\u30AF\\u306E\\u8A31\\u53EF\\u304C\\u5FC5\\u8981\\u3067\\u3059';
        });
    }

    function stopMic() {
      if (micStream) {
        micStream.getTracks().forEach(function(tr) { tr.stop(); });
        micStream = null;
      }
      if (audioCtx) {
        audioCtx.close();
        audioCtx = null; analyser = null;
      }
      micActive = false;
      micCalibrating = false;
      micBtn.disabled = false;
      micBtn.classList.remove('active');
      micBtn.textContent = '\\u{1F3A4} \\u30DE\\u30A4\\u30AFOFF';
      micStatusEl.textContent = '';
      volumeBar.style.width = '0%';
    }

    if (hasMicSupport) {
      micBtn.addEventListener('click', function() {
        if (micActive) stopMic(); else initMic();
      });
    }
    document.getElementById('video-mute-cb').addEventListener('change', function() {
      if (mode !== 'micJudge') return;
      if (this.checked) ytCmd('mute'); else ytCmd('unMute');
    });
    document.getElementById('micjudge-btn-start').addEventListener('click', function() {
      if (mode !== 'micJudge' || !micJudgeWaitingStart) return;
      micJudgeWaitingStart = false;
      document.getElementById('micjudge-start-bar').classList.remove('show');
      ytCmd('playVideo');
    });
    document.getElementById('micjudge-btn-restart').addEventListener('click', function() {
      if (mode !== 'micJudge') return;
      micJudgeEndShown = false;
      micJudgeWaitingStart = true;
      judgedPhrasesMicJudge = {};
      voiceSamples = [];
      resetScore();
      document.getElementById('micjudge-end-bar').classList.remove('show');
      document.getElementById('micjudge-start-bar').classList.add('show');
      ytCmd('seekTo', [5, true]);
      ytCmd('pauseVideo');
    });

    function startVoiceSampling() {
      voiceSamples = [];
      if (sampleInterval) clearInterval(sampleInterval);
      sampleInterval = setInterval(function() {
        if (!micActive) return;
        voiceSamples.push({ time: performance.now(), vol: getVolume() });
      }, 50);
    }

    function stopVoiceSampling() {
      if (sampleInterval) { clearInterval(sampleInterval); sampleInterval = null; }
    }

    function judgePhrase(cueIdx) {
      if (!micActive || voiceSamples.length === 0) return null;
      var c = CUES[cueIdx];
      var dur = c.end - c.time;
      // フレーズを3分割
      var segCount = 3;
      var segments = [];
      for (var si2 = 0; si2 < segCount; si2++) segments.push({ voice: 0, total: 0 });
      var phraseStartMs = reciteStart + RECITE_DELAY * 1000;
      var phraseDurMs = dur * 1000;
      for (var vi2 = 0; vi2 < voiceSamples.length; vi2++) {
        var rel = voiceSamples[vi2].time - phraseStartMs;
        if (rel < 0 || rel > phraseDurMs) continue;
        var sIdx = Math.min(Math.floor(rel / phraseDurMs * segCount), segCount - 1);
        segments[sIdx].total++;
        if (voiceSamples[vi2].vol > VOICE_THRESHOLD) segments[sIdx].voice++;
      }
      var activeSeg = 0, totalS = 0, voiceS = 0;
      for (var si3 = 0; si3 < segCount; si3++) {
        totalS += segments[si3].total;
        voiceS += segments[si3].voice;
        if (segments[si3].total > 0 && segments[si3].voice / segments[si3].total > 0.3) activeSeg++;
      }
      var rate = totalS > 0 ? voiceS / totalS : 0;
      var result;
      if (activeSeg >= 3 && rate >= 0.5) { result = 'great'; greatCount++; }
      else if (activeSeg >= 2 && rate >= 0.25) { result = 'good'; goodCount++; }
      else { result = 'miss'; missCount++; }
      judgeResults[cueIdx] = result;
      return result;
    }

    // マイク判定モード用: 動画時間でタグ付きサンプルから判定
    function judgePhraseByVideoSamples(cueIdx) {
      if (!micActive) return null;
      var c = CUES[cueIdx];
      var t0 = c.time, t1 = c.end, dur = t1 - t0;
      var segCount = 3;
      var segments = [];
      for (var si2 = 0; si2 < segCount; si2++) segments.push({ voice: 0, total: 0 });
      for (var vi2 = 0; vi2 < voiceSamples.length; vi2++) {
        var vt = voiceSamples[vi2].videoTime;
        if (vt == null || vt < t0 || vt > t1) continue;
        var rel = (vt - t0) / dur;
        var sIdx = Math.min(Math.floor(rel * segCount), segCount - 1);
        segments[sIdx].total++;
        if (voiceSamples[vi2].vol > VOICE_THRESHOLD) segments[sIdx].voice++;
      }
      var activeSeg = 0, totalS = 0, voiceS = 0;
      for (var si3 = 0; si3 < segCount; si3++) {
        totalS += segments[si3].total;
        voiceS += segments[si3].voice;
        if (segments[si3].total > 0 && segments[si3].voice / segments[si3].total > 0.3) activeSeg++;
      }
      var rate = totalS > 0 ? voiceS / totalS : 0;
      var result;
      if (activeSeg >= 3 && rate >= 0.5) { result = 'great'; greatCount++; }
      else if (activeSeg >= 2 && rate >= 0.25) { result = 'good'; goodCount++; }
      else { result = 'miss'; missCount++; }
      judgeResults[cueIdx] = result;
      return result;
    }

    function updateScore() {
      var total = greatCount + goodCount + missCount;
      if (total === 0) return;
      scoreDisplay.classList.add('show');
      var score = Math.round((greatCount * 100 + goodCount * 60) / total);
      document.getElementById('score-value').textContent = score;
      document.getElementById('sc-great').textContent = '\\u{1F3AF} ' + greatCount;
      document.getElementById('sc-good').textContent = '\\u2B55 ' + goodCount;
      document.getElementById('sc-miss').textContent = '\\u274C ' + missCount;

      /* 稽古記録をlocalStorageに永続化 */
      try {
        var LOG_KEY = "keranosuke_log_v1";
        var raw = localStorage.getItem(LOG_KEY);
        var log = raw ? JSON.parse(raw) : {};
        if (!log.practice) log.practice = {};
        if (!log.practice.serifu_v2) log.practice.serifu_v2 = {};
        var enmokuKey = 'benten_kozo';
        var prev = log.practice.serifu_v2[enmokuKey] || { best_score: 0, sessions: 0, last_ts: 0 };
        prev.sessions++;
        if (score > prev.best_score) prev.best_score = score;
        prev.last_ts = Math.floor(Date.now()/1000);
        prev.last_great = greatCount;
        prev.last_good = goodCount;
        prev.last_miss = missCount;
        log.practice.serifu_v2[enmokuKey] = prev;
        /* XP加算 */
        if (typeof log.xp !== 'number') log.xp = 0;
        log.xp += 3;
        var today = new Date();
        var todayKey = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
        if (!log.daily_log) log.daily_log = {};
        if (!log.daily_log[todayKey]) log.daily_log[todayKey] = { views:0, clips:0, quiz:0, keiko:0, theater:0 };
        log.daily_log[todayKey].keiko++;
        log.updated_at = Math.floor(Date.now()/1000);
        localStorage.setItem(LOG_KEY, JSON.stringify(log));
      } catch(e){}
    }

    function showOverlayJudge(result) {
      overlayJudge.className = 'overlay-judge';
      if (result === 'great') {
        overlayJudge.textContent = '\\u{1F3AF} Great!';
        overlayJudge.className = 'overlay-judge great visible';
      } else if (result === 'good') {
        overlayJudge.textContent = '\\u2B55 Good';
        overlayJudge.className = 'overlay-judge good visible';
      } else {
        overlayJudge.textContent = '\\u274C Miss';
        overlayJudge.className = 'overlay-judge miss visible';
      }
    }

    function showSlotJudge(result) {
      var metaEl = slotAct.querySelector('.phrase-meta');
      if (!metaEl) return;
      var existing = metaEl.querySelector('.judge-badge');
      if (existing) existing.remove();
      var badge = document.createElement('span');
      badge.className = 'judge-badge';
      if (result === 'great') { badge.className += ' judge-great'; badge.textContent = '\\u{1F3AF} Great!'; }
      else if (result === 'good') { badge.className += ' judge-good'; badge.textContent = '\\u2B55 Good'; }
      else { badge.className += ' judge-miss'; badge.textContent = '\\u274C Miss'; }
      metaEl.appendChild(badge);
    }

    function resetScore() {
      greatCount = 0; goodCount = 0; missCount = 0;
      judgeResults = {}; judgedForSP = -1;
      scoreDisplay.classList.remove('show');
    }

    document.getElementById('mode-switch').addEventListener('click', function() {
      if (mode === 'karaoke') setMode('repeat');
      else if (mode === 'repeat') setMode('micJudge');
      else setMode('karaoke');
    });

    // ── リピートボタン ──
    document.getElementById('btn-again').addEventListener('click', function() {
      if (mode !== 'repeat') return;
      goToPhrase(repeatSP);
    });

    document.getElementById('btn-next-phrase').addEventListener('click', function() {
      if (mode !== 'repeat') return;
      goToPhrase(repeatSP < serifuList.length - 1 ? repeatSP + 1 : 0);
    });

    document.getElementById('btn-prev-phrase').addEventListener('click', function() {
      if (mode !== 'repeat') return;
      goToPhrase(repeatSP > 0 ? repeatSP - 1 : serifuList.length - 1);
    });

    // ── tick ──
    function tick() {
      var t = currentTime;

      var activeIdx = -1, prevIdx = -1, nextIdx = -1;

      if (mode === 'repeat') {
        // ── リピートモード ──
        var rci = serifuList[repeatSP];
        if (rci !== undefined) {
          var rc = CUES[rci];
          var rDur = rc.end - rc.time;

          if (repeatPhase === 'listen') {
            // 動画再生開始を検知 → 少し待ってからオーバーレイを消す
            if (overlayDismissPending && t >= rc.time + 0.4 && t < rc.end) {
              dismissOverlay();
            }
            // お手本再生中 → フレーズ終了で復唱フェーズへ
            if (t >= rc.end - 0.05 && repeatPausedForSP !== repeatSP) {
              repeatPausedForSP = repeatSP;
              ytCmd('pauseVideo');
              repeatPhase = 'recite';
              reciteStart = performance.now();
              repeatStatus.textContent = '🎙️ 復唱！';
              repeatStatus.classList.add('reciting');
              // オーバーレイ表示（全画面フラッシュ＋波紋）
              overlayDismissPending = false;
              overlayCue.className = 'overlay-cue';
              overlayCue2.className = 'overlay-cue2';
              videoOverlay.classList.remove('show', 'flash');
              void videoOverlay.offsetWidth;
              videoOverlay.classList.add('show', 'flash');
              overlayPhrase.innerHTML = phraseHTML[rci] || '';
              overlayPhrase.classList.remove('visible');
              overlayKchars = overlayPhrase.querySelectorAll('.kchar-lit');
              // 波紋アニメーション
              void overlayCue.offsetWidth;
              overlayCue.classList.add('ring1');
              overlayCue2.classList.add('ring2');
            }
          } else if (repeatPhase === 'recite') {
            // 復唱フェーズ: タイマーベースでアニメーション
            var reciteT = (performance.now() - reciteStart) / 1000;
            var reciteElapsed = reciteT - RECITE_DELAY;

            // 波紋後、台詞カードをフェードイン（波紋と少し重なるタイミング）
            if (reciteT >= RECITE_DELAY * 0.5 && !overlayPhrase.classList.contains('visible')) {
              overlayPhrase.classList.add('visible');
            }

            if (reciteElapsed >= rDur + RECITE_AFTER) {
              // 復唱完了 → 自動で次のフレーズへ
              resetRepeatState();
              if (repeatSP < serifuList.length - 1) repeatSP++;
              else repeatSP = 0;
              updateRepeatStatus();
              var nextCi = serifuList[repeatSP];
              ytCmd('seekTo', [CUES[nextCi].time, true]);
              ytCmd('playVideo');
            }
          }

          activeIdx = rci;
          prevIdx = repeatSP > 0 ? serifuList[repeatSP - 1] : -1;
          nextIdx = repeatSP < serifuList.length - 1 ? serifuList[repeatSP + 1] : -1;
        }
      } else if (mode === 'karaoke' || mode === 'micJudge') {
        // ── カラオケモード / マイク判定モード（全編再生） ──
        for (var i = 0; i < CUES.length; i++) {
          if (CUES[i].type === 'serifu' && t >= CUES[i].time && t <= CUES[i].end) {
            activeIdx = i; break;
          }
        }
        var sp = -1;
        for (var i = 0; i < serifuList.length; i++) {
          if (serifuList[i] === activeIdx) { sp = i; break; }
        }
        prevIdx = sp > 0 ? serifuList[sp - 1] : -1;
        nextIdx = sp >= 0 && sp < serifuList.length - 1 ? serifuList[sp + 1] : -1;

        // フレーズ間 → 次のフレーズを即座に active に昇格
        if (activeIdx < 0) {
          var lp = -1;
          for (var i = 0; i < serifuList.length; i++) {
            if (t > CUES[serifuList[i]].end) lp = i;
          }
          if (lp >= 0) {
            prevIdx = serifuList[lp];
            var np = lp + 1;
            if (np < serifuList.length) {
              activeIdx = serifuList[np];
              nextIdx = np + 1 < serifuList.length ? serifuList[np + 1] : -1;
            }
          } else {
            activeIdx = serifuList.length > 0 ? serifuList[0] : -1;
            nextIdx = serifuList.length > 1 ? serifuList[1] : -1;
          }
        }

        // ── マイク判定モード: 動画時間でサンプリング＆フレーズ通過で判定 ──
        if (mode === 'micJudge' && micActive && analyser) {
          var now = performance.now();
          if (now - lastMicJudgeSampleTime >= 50) {
            lastMicJudgeSampleTime = now;
            voiceSamples.push({ videoTime: t, vol: getVolume() });
            if (voiceSamples.length > 1500) {
              voiceSamples = voiceSamples.filter(function(s) { return s.videoTime >= t - 20; });
            }
          }
          for (var ji = 0; ji < serifuList.length; ji++) {
            var ci = serifuList[ji];
            var cue = CUES[ci];
            if (t > cue.end && !judgedPhrasesMicJudge[ci]) {
              judgedPhrasesMicJudge[ci] = true;
              var jr = judgePhraseByVideoSamples(ci);
              if (jr) {
                showOverlayJudge(jr);
                updateScore();
                setTimeout(function() {
                  overlayJudge.className = 'overlay-judge';
                  overlayJudge.textContent = '';
                }, 1200);
              }
            }
          }
          // 動画終了検知（最後の台詞のあと）→ もう一回スタートバー表示
          var lastCueEnd = CUES[serifuList[serifuList.length - 1]].end;
          if (t >= lastCueEnd + 0.5 && !micJudgeEndShown) {
            micJudgeEndShown = true;
            ytCmd('pauseVideo');
            document.getElementById('micjudge-end-bar').classList.add('show');
          }
        }
      }

      // ── スロット更新 ──
      if (prevIdx !== lPI) {
        lPI = prevIdx;
        slotPrev.innerHTML = prevIdx >= 0 && phraseHTML[prevIdx] ? phraseHTML[prevIdx] : '';
        var pLits = slotPrev.querySelectorAll('.kchar-lit');
        for (var i = 0; i < pLits.length; i++) pLits[i].style.width = '100%';
      }
      if (activeIdx !== lAI) {
        lAI = activeIdx;
        slotAct.innerHTML = activeIdx >= 0 && phraseHTML[activeIdx] ? phraseHTML[activeIdx] : '';
        activeKchars = slotAct.querySelectorAll('.kchar-lit');
      }
      if (nextIdx !== lNI) {
        lNI = nextIdx;
        slotNext.innerHTML = nextIdx >= 0 && phraseHTML[nextIdx] ? phraseHTML[nextIdx] : '';
      }

      // ── kchar-lit アニメーション ──
      if (activeIdx >= 0) {
        var c = CUES[activeIdx];
        var ct = c.charTimings, dur = c.end - c.time;

        if (mode === 'repeat' && repeatPhase === 'recite') {
          // 復唱中: オーバーレイのみアニメ、下カードはお手本状態（100%）のまま
          if (overlayKchars.length > 0) {
            var recElap = (performance.now() - reciteStart) / 1000 - RECITE_DELAY;
            var n = overlayKchars.length;
            for (var ci = 0; ci < n; ci++) {
              var cs, ce, cp2 = 0;
              if (ct && ct.length === n) {
                cs = Math.max(0, ct[ci]);
                ce = ci + 1 < n ? Math.max(cs + 0.01, ct[ci + 1]) : dur;
              } else {
                cs = ci / n * dur; ce = (ci + 1) / n * dur;
              }
              if (recElap >= ce) cp2 = 1;
              else if (recElap > cs) cp2 = (recElap - cs) / (ce - cs);
              overlayKchars[ci].style.width = (cp2 * 100) + '%';
            }
          }
        } else if (activeKchars.length > 0) {
          // 通常 & お手本再生中: 下カードをアニメーション
          var elapsed = t - c.time;
          var n = activeKchars.length;
          for (var ci = 0; ci < n; ci++) {
            var cs, ce, cp2 = 0;
            if (ct && ct.length === n) {
              cs = Math.max(0, ct[ci]);
              ce = ci + 1 < n ? Math.max(cs + 0.01, ct[ci + 1]) : dur;
            } else {
              cs = ci / n * dur; ce = (ci + 1) / n * dur;
            }
            if (elapsed >= ce) cp2 = 1;
            else if (elapsed > cs) cp2 = (elapsed - cs) / (ce - cs);
            activeKchars[ci].style.width = (cp2 * 100) + '%';
          }
        }
      }

      // ── 音量メーター更新 ──
      if ((micActive || micCalibrating) && analyser) {
        var vol = getVolume();
        var pct = Math.min(vol / 0.12 * 100, 100);
        volumeBar.style.width = pct + '%';
      }

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInitPlayer);
  } else {
    tryInitPlayer();
  }
})();
</script>
</body>
</html>`;
}
