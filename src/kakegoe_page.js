// =============================================================
// 大向こう稽古 — /training/kakegoe
// 白浪五人男「稲瀬川勢揃い」専用レイアウト
// =============================================================
export function kakegoePageHTML() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>大向う道場 ─ 白浪五人男 | KABUKI PLUS+</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
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
  }
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Noto Sans JP', sans-serif;
    background:var(--bg-page);color:var(--text-primary);min-height:100vh;
    overflow-x:hidden;}
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

  /* ── イントロ画面 ── */
  #intro{max-width:760px;margin:0 auto;padding:1rem;text-align:center;}
  #intro h1{font-size:1.8rem;letter-spacing:0.25em;color:var(--text-primary);
    margin:1rem 0 0.3rem;font-family:'Noto Serif JP', serif;}
  #intro .subtitle{font-size:1rem;color:var(--text-tertiary);letter-spacing:0.1em;margin-bottom:1rem;}

  /* 五人カード（モバイルはカルーセル） */
  .cast-row{display:flex;gap:0.5rem;justify-content:center;margin:0.8rem 0;
    overflow-x:auto;-webkit-overflow-scrolling:touch;
    scroll-snap-type:x mandatory;padding:0.3rem 0;}
  .cast-row::-webkit-scrollbar{display:none;}
  .cast-card{flex:0 0 auto;width:125px;border-radius:10px;overflow:hidden;
    border:2px solid var(--border-light);transition:all 0.3s;position:relative;
    scroll-snap-align:center;box-shadow:var(--shadow-sm);}
  .cast-card img{width:100%;display:block;}
  .cast-card .name{position:absolute;bottom:0;left:0;right:0;
    background:linear-gradient(transparent,rgba(0,0,0,0.85));
    padding:0.5rem 0.3rem 0.25rem;text-align:center;}
  .cast-card .name span{display:block;font-size:0.8rem;color:var(--kin);
    letter-spacing:0.1em;}
  .cast-card .name small{font-size:0.7rem;color:#999;}
  .cast-card .role{position:absolute;top:6px;left:6px;
    font-size:0.6rem;padding:2px 6px;border-radius:4px;
    letter-spacing:0.05em;}
  .role-kakegoe{background:var(--aka);color:#fff;}
  .role-hakushu{background:var(--moegi);color:#fff;}
  .cast-card.active{border-color:var(--kin);
    box-shadow:0 0 16px rgba(197,165,90,0.4);transform:scale(1.05);}
  @media(max-width:640px){
    .cast-row{justify-content:flex-start;padding:0.3rem 1rem;}
    .cast-card{width:110px;}
  }

  /* スタートボタン */
  #start-btn{display:inline-block;margin:1.2rem 0;padding:1rem 3rem;
    background:linear-gradient(135deg,var(--gold),var(--gold-dark));
    color:#fff;border:none;border-radius:14px;
    font-size:1.2rem;font-family:inherit;letter-spacing:0.2em;
    cursor:pointer;transition:all 0.2s;box-shadow:var(--shadow-md);}
  #start-btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(197,165,90,0.3);}
  #start-btn:active{transform:scale(0.97);}
  #start-btn:disabled{opacity:0.5;cursor:wait;}

  .intro-hint{font-size:0.85rem;color:var(--text-secondary);margin-top:0.5rem;line-height:1.6;}
  .intro-hint b{color:var(--kin);}

  /* 操作説明（折りたたみ） */
  .how-to{max-width:540px;margin:1rem auto 0;text-align:left;}
  .how-to .summary-box{font-size:0.9rem;color:var(--text-secondary);line-height:1.7;
    text-align:center;margin-bottom:0.5rem;}
  .how-to .summary-box b{color:var(--kin);}
  .how-to details{background:var(--bg-card);border:1px solid var(--border-medium);border-radius:12px;
    padding:0.8rem 1.2rem;box-shadow:var(--shadow-sm);}
  .how-to details summary{font-size:0.9rem;color:var(--kin);cursor:pointer;
    text-align:center;letter-spacing:0.1em;list-style:none;padding:0.2rem 0;}
  .how-to details summary::-webkit-details-marker{display:none;}
  .how-to details summary::after{content:" ▼";font-size:0.7rem;}
  .how-to details[open] summary::after{content:" ▲";}
  .how-to details .detail-body{margin-top:0.6rem;padding-top:0.6rem;
    border-top:1px solid var(--border-medium);}
  .how-to ol{padding-left:1.5rem;list-style:none;counter-reset:step;}
  .how-to ol li{counter-increment:step;margin-bottom:0.5rem;font-size:0.85rem;
    color:var(--text-secondary);line-height:1.6;position:relative;}
  .how-to ol li::before{content:counter(step);position:absolute;left:-1.5rem;
    width:1.3rem;height:1.3rem;background:var(--aka);color:#fff;
    border-radius:50%;font-size:0.7rem;display:flex;align-items:center;
    justify-content:center;top:0.15rem;}
  .how-to .tip{margin-top:0.7rem;padding:0.5rem 0.7rem;background:var(--bg-subtle);
    border-left:3px solid var(--kin);border-radius:4px;font-size:0.82rem;
    color:var(--text-secondary);line-height:1.5;}
  .how-to .tip b{color:var(--kin);}
  .how-to .caution{margin-top:0.8rem;padding:0.7rem 0.8rem;
    background:rgba(212,97,75,0.08);border:1px solid rgba(212,97,75,0.25);
    border-left:4px solid var(--aka);
    border-radius:6px;font-size:0.82rem;color:var(--text-primary);line-height:1.7;}
  .how-to .caution b{color:var(--accent-1);}

  /* ボタン前の安心テキスト */
  .pre-btn{font-size:0.8rem;color:var(--text-secondary);margin-bottom:0.3rem;}

  /* ── 動画エリア ── */
  #stage{max-width:720px;margin:0 auto;position:relative;display:none;padding:0.5rem 0.5rem 0;}
  #player-wrap{position:relative;width:100%;padding-top:56.25%;background:#000;border-radius:10px;overflow:hidden;}
  #player-wrap iframe{position:absolute;top:0;left:0;width:100%;height:100%;}

  /* ── 掛け声オーバーレイ ── */
  #kakegoe-overlay{position:absolute;top:0;left:0;right:0;bottom:0;
    pointer-events:none;display:flex;align-items:center;justify-content:center;
    z-index:10;}
  #kakegoe-text{font-size:3rem;font-weight:bold;color:#fff;
    text-shadow:0 0 20px var(--aka),0 0 40px var(--aka),
      0 4px 8px rgba(0,0,0,0.8);
    opacity:0;transform:scale(0.3);transition:all 0.3s ease-out;
    letter-spacing:0.15em;white-space:nowrap;}
  #kakegoe-text.show{opacity:1;transform:scale(1);}
  #kakegoe-text.fade{opacity:0;transform:scale(1.3);transition:all 0.8s ease-in;}

  /* ── 現在のキャラ表示バー ── */
  #now-playing{max-width:720px;margin:0.3rem auto;padding:0 1rem;
    display:none;text-align:center;}
  #now-char{display:inline-flex;align-items:center;gap:0.5rem;
    background:var(--bg-card);border:1px solid var(--border-medium);border-radius:20px;
    padding:0.3rem 1rem;box-shadow:var(--shadow-sm);}
  #now-char img{width:32px;height:32px;border-radius:50%;object-fit:cover;
    border:1px solid var(--kin);}
  #now-char span{font-size:0.95rem;color:var(--kin);}

  /* ── タップエリア ── */
  #tap-zone{max-width:720px;margin:0.8rem auto;padding:0 1rem;display:none;}
  .tap-buttons{display:flex;gap:0.6rem;}
  .tap-btn{flex:1;padding:1.4rem;border-radius:14px;
    color:var(--text-primary);font-size:1.3rem;font-family:inherit;
    cursor:pointer;letter-spacing:0.15em;transition:all 0.15s;
    text-align:center;position:relative;overflow:hidden;
    border-width:3px;border-style:solid;}
  #btn-kakegoe-play{background:var(--bg-card);
    border-color:var(--aka);box-shadow:var(--shadow-sm);}
  #btn-kakegoe-play:active{background:rgba(212,97,75,0.12);transform:scale(0.97);}
  #btn-hakushu-play{background:var(--bg-card);
    border-color:var(--moegi);box-shadow:var(--shadow-sm);}
  #btn-hakushu-play:active{background:rgba(107,158,120,0.12);transform:scale(0.97);}
  .tap-btn .sub{display:block;font-size:0.75rem;color:var(--text-tertiary);margin-top:0.3rem;
    letter-spacing:0.05em;}

  /* ── 次のヒント ── */
  #next-hint{max-width:720px;margin:0 auto;padding:0.5rem 1rem;
    text-align:center;font-size:1rem;color:var(--text-secondary);display:none;
    min-height:2.5rem;}
  #next-hint .hint-text{color:var(--kin);}

  /* ── タイムライン ── */
  #timeline{max-width:720px;margin:0.5rem auto;padding:0 1rem;display:none;}
  #timeline-bar{height:6px;background:var(--border-light);border-radius:3px;
    position:relative;overflow:visible;}
  #timeline-progress{height:100%;background:linear-gradient(90deg,var(--moegi),var(--aka));
    border-radius:3px;width:0%;transition:width 0.3s linear;}
  .cue-marker{position:absolute;top:-4px;width:14px;height:14px;
    background:var(--kin);border-radius:50%;transform:translateX(-50%);
    border:2px solid var(--bg-page);z-index:2;}
  .cue-marker.hakushu-marker{background:var(--moegi);}
  .cue-marker.hit{box-shadow:0 0 8px var(--moegi);filter:brightness(1.3);}
  .cue-marker.missed{background:var(--text-secondary);box-shadow:none;filter:none;}

  /* ── スコア ── */
  #score-bar{max-width:720px;margin:0 auto;padding:0.4rem 1rem;
    display:none;}
  .score-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.2rem 1rem;
    background:var(--bg-card);border-radius:10px;padding:0.5rem 1rem;box-shadow:var(--shadow-sm);}
  .score-row{display:flex;justify-content:space-between;align-items:center;
    font-size:0.95rem;}
  .s-label{color:var(--text-tertiary);} .s-val{font-weight:bold;}
  .s-great .s-val{color:var(--moegi);} .s-good .s-val{color:var(--kin);}
  .s-miss .s-val{color:var(--aka);} .s-ohineri .s-val{color:var(--kin);}

  /* ── 結果画面 ── */
  #result{max-width:720px;margin:2rem auto;padding:2rem;text-align:center;
    display:none;background:var(--bg-card);border-radius:14px;border:1px solid var(--border-medium);box-shadow:var(--shadow-md);}
  #result h2{color:var(--kin);font-size:1.5rem;margin-bottom:1rem;}
  #result .big-score{font-size:3rem;color:var(--kin);}
  #result .detail{margin-top:1rem;font-size:1rem;color:var(--text-secondary);line-height:1.8;}
  #result .cast-row{margin-top:1.2rem;}
  #result button{margin-top:1.5rem;padding:0.7rem 2rem;background:linear-gradient(135deg,var(--gold),var(--gold-dark));
    color:#fff;border:none;border-radius:8px;font-size:1rem;cursor:pointer;
    font-family:inherit;box-shadow:var(--shadow-sm);}

  footer{text-align:center;padding:1.2rem;font-size:0.85rem;color:var(--text-secondary);
    border-top:1px solid var(--border-light);margin-top:2rem;}
  footer a{color:var(--kin);text-decoration:none;}

  /* ── おひねりボーナス ── */
  #ohineri-zone{max-width:720px;margin:0.4rem auto;text-align:center;
    display:none;padding:0 1rem;}
  #ohineri-inner{position:relative;display:inline-block;}
  #btn-ohineri{padding:1rem 2.5rem;border-radius:50px;font-size:1.3rem;
    font-family:inherit;letter-spacing:0.15em;cursor:pointer;
    background:linear-gradient(135deg,#8B6914 0%,#C5A55A 50%,#8B6914 100%);
    background-size:200% 100%;
    color:#1a1a1a;font-weight:bold;border:none;
    box-shadow:0 0 20px rgba(197,165,90,0.5),0 0 60px rgba(197,165,90,0.2),
      inset 0 1px 0 rgba(255,255,255,0.3);
    transition:all 0.15s;position:relative;overflow:hidden;
    animation:ohineriShine 1s ease infinite;}
  #btn-ohineri:hover{transform:scale(1.05);}
  #btn-ohineri:active{transform:scale(0.93);
    box-shadow:0 0 30px rgba(197,165,90,0.8);}
  @keyframes ohineriShine{
    0%{background-position:100% 0;box-shadow:0 0 20px rgba(197,165,90,0.4),
      0 0 60px rgba(197,165,90,0.15);}
    50%{background-position:0% 0;box-shadow:0 0 30px rgba(197,165,90,0.7),
      0 0 80px rgba(197,165,90,0.3);}
    100%{background-position:100% 0;box-shadow:0 0 20px rgba(197,165,90,0.4),
      0 0 60px rgba(197,165,90,0.15);}
  }
  #ohineri-label{display:block;font-size:0.7rem;color:var(--text-tertiary);margin-top:0.3rem;
    letter-spacing:0.05em;}
  #ohineri-timer{height:4px;background:linear-gradient(90deg,var(--kin),var(--aka));
    border-radius:2px;margin-top:0.4rem;max-width:200px;
    display:inline-block;transition:width linear;}

  /* 飛ぶおひねり — 画面上の舞台まで飛んでいく */
  .coin{position:fixed;pointer-events:none;z-index:100;
    text-shadow:0 2px 8px rgba(0,0,0,0.5);
    animation:coinThrow var(--dur, 1.2s) cubic-bezier(0.2,0.8,0.3,1) forwards;}
  @keyframes coinThrow{
    0%{opacity:1;transform:translate(0, 0) rotate(0deg) scale(1);}
    40%{opacity:1;transform:translate(calc(var(--tx) * 0.5), calc(var(--ty) * 0.6)) rotate(360deg) scale(1.4);}
    100%{opacity:0;transform:translate(var(--tx), var(--ty)) rotate(900deg) scale(0.3);}
  }
  .coin-emoji{font-size:2.2rem;}

  /* ── リップル ── */
  @keyframes ripple{
    0%{transform:scale(0);opacity:0.6;}
    100%{transform:scale(4);opacity:0;}
  }
  .ripple{position:absolute;border-radius:50%;background:rgba(197,165,90,0.4);
    width:60px;height:60px;pointer-events:none;animation:ripple 0.6s ease-out forwards;}

  /* ── アニメーション ── */
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
  .cast-card{animation:fadeUp 0.5s ease both;}
  .cast-card:nth-child(2){animation-delay:0.08s;}
  .cast-card:nth-child(3){animation-delay:0.16s;}
  .cast-card:nth-child(4){animation-delay:0.24s;}
  .cast-card:nth-child(5){animation-delay:0.32s;}
</style>
</head>
<body>

<!-- ===== イントロ画面 ===== -->
<div id="intro">
  <div style="text-align:left;margin-bottom:0.5rem;">
    <a href="/kabuki/dojo" style="color:var(--gold);text-decoration:none;font-size:0.9rem;">← KABUKI DOJO</a>
  </div>
  <h1>大向う道場</h1>
  <div class="subtitle">白浪五人男「稲瀬川勢揃い」</div>

  <div class="cast-row" id="cast-row">
    <div class="cast-card" data-char="benten">
      <span class="role role-kakegoe">🎤 掛け声</span>
      <img src="https://raw.githubusercontent.com/kerakabuki/kabuki-ai-agent/main/assets/shiranami/benten.png" alt="弁天小僧">
      <div class="name"><span>弁天小僧</span><small>座長</small></div>
    </div>
    <div class="cast-card" data-char="tadanobu">
      <span class="role role-kakegoe">🎤 掛け声</span>
      <img src="https://raw.githubusercontent.com/kerakabuki/kabuki-ai-agent/main/assets/shiranami/tadanobu.png" alt="忠信利平">
      <div class="name"><span>忠信利平</span><small>郡上市役所</small></div>
    </div>
    <div class="cast-card" data-char="akaboshi">
      <span class="role role-kakegoe">🎤 掛け声</span>
      <img src="https://raw.githubusercontent.com/kerakabuki/kabuki-ai-agent/main/assets/shiranami/akaboshi.png" alt="赤星十三郎">
      <div class="name"><span>赤星十三郎</span><small>イケメン営業</small></div>
    </div>
    <div class="cast-card" data-char="nango">
      <span class="role role-kakegoe">🎤 掛け声</span>
      <img src="https://raw.githubusercontent.com/kerakabuki/kabuki-ai-agent/main/assets/shiranami/nango.png" alt="南郷力丸">
      <div class="name"><span>南郷力丸</span><small>信用金庫</small></div>
    </div>
    <div class="cast-card" data-char="dayemon">
      <span class="role role-kakegoe">🎤 掛け声</span>
      <img src="https://raw.githubusercontent.com/kerakabuki/kabuki-ai-agent/main/assets/shiranami/dayemon.png" alt="日本駄右衛門">
      <div class="name"><span>日本駄右衛門</span><small>太っ腹社長</small></div>
    </div>
  </div>

  <div class="how-to">
    <div class="summary-box">
      動画を見ながら <b>🎤 掛け声</b> と <b>👏 拍手</b> をタイミングよくタップ！拍手の後は <b>🪙 おひねり</b> チャンスも！
    </div>
    <details>
      <summary>📖 くわしいあそびかた</summary>
      <div class="detail-body">
        <ol>
          <li>下の <b>「稽古をはじめる」</b> ボタンを押すと動画がスタート</li>
          <li>画面の <b>ヒント</b> を見ながらタイミングを待つ</li>
          <li>役者の登場やツラネの見せ場で <b style="color:var(--aka);">🎤 掛け声！</b> をタップ</li>
          <li>見得やツラネの終わりで <b style="color:var(--moegi);">👏 拍手！</b> をタップ</li>
          <li>拍手が成功すると <b style="color:var(--kin);">🪙 おひねり</b> チャンス！タップでボーナス</li>
          <li>タイミングが良いほど高得点！全28回の掛け声＆拍手に挑戦</li>
        </ol>
        <div class="tip">
          💡 <b>大当たり</b>＝ぴったり、<b>良し</b>＝ちょっとずれ、<b>空振り</b>＝タイミング逃し。<br>
          掛け声と拍手の<b>種類を間違えない</b>ように！
        </div>
      </div>
    </details>
    <div class="caution">
      ⚠️ <b>大事なお願い</b><br>
      この大向う道場は歌舞伎の<b>大向うの掛け声</b>を楽しく学ぶための練習コンテンツです。<br>
      実際の歌舞伎公演では、掛け声のマナーや劇場のルールを守りましょう。<b>初心者のうちは拍手で十分</b>です。
    </div>
  </div>

  <div class="pre-btn">準備できたら押してね（動画が再生されます）</div>
  <button id="start-btn" disabled>🎭 稽古をはじめる</button>
</div>

<!-- ===== プレイ画面 ===== -->
<div id="stage">
  <div style="padding:0 0.5rem 0.3rem;">
    <a href="/kabuki/dojo" style="color:var(--gold);text-decoration:none;font-size:0.85rem;">← KABUKI DOJO</a>
  </div>
  <div id="player-wrap">
    <div id="player"></div>
    <div id="kakegoe-overlay">
      <div id="kakegoe-text"></div>
    </div>
  </div>
</div>

<div id="now-playing">
  <div id="now-char">
    <img id="now-char-img" src="https://raw.githubusercontent.com/kerakabuki/kabuki-ai-agent/main/assets/shiranami/benten.png" alt="">
    <span id="now-char-name">弁天小僧</span>
  </div>
</div>

<div id="timeline">
  <div id="timeline-bar">
    <div id="timeline-progress"></div>
  </div>
</div>

<div id="next-hint"></div>

<div id="tap-zone">
  <div class="tap-buttons">
    <button class="tap-btn" id="btn-kakegoe-play">
      🎤 掛け声！
      <span class="sub">声を掛けるタイミングで</span>
    </button>
    <button class="tap-btn" id="btn-hakushu-play">
      👏 拍手！
      <span class="sub">一区切りのタイミングで</span>
    </button>
  </div>
</div>

<div id="ohineri-zone">
  <div id="ohineri-inner">
    <button id="btn-ohineri">🪙 投げろ！おひねり！</button>
    <span id="ohineri-label">拍手成功！今だけのチャンス</span>
    <div id="ohineri-timer" style="width:200px;"></div>
  </div>
</div>

<div id="score-bar">
  <div class="score-grid">
    <div class="score-row s-great"><span class="s-label">大当たり</span><span class="s-val" id="s-great">0</span></div>
    <div class="score-row s-good"><span class="s-label">良し</span><span class="s-val" id="s-good">0</span></div>
    <div class="score-row s-miss"><span class="s-label">空振り</span><span class="s-val" id="s-miss">0</span></div>
    <div class="score-row s-ohineri"><span class="s-label">🪙 おひねり</span><span class="s-val" id="s-ohineri">0</span></div>
  </div>
</div>

<div id="result">
  <h2>お稽古おつかれさま！</h2>
  <div class="big-score" id="result-score"></div>
  <div class="detail" id="result-detail"></div>
  <div class="cast-row" id="result-cast"></div>
  <button onclick="location.reload()">もう一度やる</button>
</div>

<footer>
  <a href="/kabuki/dojo">← KABUKI DOJO へ戻る</a>
</footer>

<script>
// =========================================================
// キャラクターデータ
// =========================================================
const IMG_BASE = "https://raw.githubusercontent.com/kerakabuki/kabuki-ai-agent/main/assets/shiranami/";
const CHARS = {
  benten:   { name: "弁天小僧",     actor: "気良歌舞伎座長", kakegoe: "よっ座長！",             img: IMG_BASE + "benten.png" },
  tadanobu: { name: "忠信利平",     actor: "郡上市役所",     kakegoe: "よっ郡上市役所！",       img: IMG_BASE + "tadanobu.png" },
  akaboshi: { name: "赤星十三郎",   actor: "イケメン営業",   kakegoe: "よっイケメン営業！",     img: IMG_BASE + "akaboshi.png" },
  nango:    { name: "南郷力丸",     actor: "信用金庫",       kakegoe: "よっ信用金庫！",         img: IMG_BASE + "nango.png" },
  dayemon:  { name: "日本駄右衛門", actor: "太っ腹社長",     kakegoe: "よっ太っ腹社長！",       img: IMG_BASE + "dayemon.png" },
  all:      { name: "白浪五人男",   actor: "勢揃い",         kakegoe: "日本一！",               img: IMG_BASE + "complete.png" },
};

// =========================================================
// 演目データ（R2 training pack から動的ロード）
// =========================================================
let SCENE = null;
let CHAR_TIMELINE = [];

(async function loadTrainingPack() {
  try {
    const res = await fetch("/api/training/kakegoe/shiranami");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const pack = await res.json();
    SCENE = {
      id: pack.id,
      title: pack.title,
      videoId: pack.videoId,
      duration: pack.duration,
      cues: pack.cues
    };
    CHAR_TIMELINE = pack.charTimeline || [];
    document.getElementById("start-btn").disabled = false;
  } catch (e) {
    console.error("Training pack load error:", e);
    document.getElementById("start-btn").textContent = "読み込みエラー";
  }
})();

// =========================================================
// グローバル変数
// =========================================================
let player = null;
let cues = [];
let cueIndex = 0;
let score = { great: 0, good: 0, miss: 0, ohineri: 0 };
let ticker = null;
let ohineriTimer = null;
let ohineriActive = false;
const WINDOW_GREAT = 1.0;
const WINDOW_GOOD  = 2.5;
const WINDOW_GREAT_H = 3.5;
const WINDOW_GOOD_H  = 6.0;

// =========================================================
// YouTube IFrame API
// =========================================================
const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);
window.onYouTubeIframeAPIReady = () => console.log("YT API ready");

// =========================================================
// スタート
// =========================================================
document.getElementById("start-btn").addEventListener("click", startScene);

function startScene() {
  cues = SCENE.cues.map(c => ({ ...c, result: null }));
  cueIndex = 0;
  score = { great: 0, good: 0, miss: 0, ohineri: 0 };
  updateScoreUI();

  // UI切替
  document.getElementById("intro").style.display = "none";
  document.getElementById("stage").style.display = "block";
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.getElementById("tap-zone").style.display = "block";
  document.getElementById("next-hint").style.display = "block";
  document.getElementById("timeline").style.display = "block";
  document.getElementById("score-bar").style.display = "block";
  document.getElementById("now-playing").style.display = "block";
  document.getElementById("result").style.display = "none";

  buildTimeline();

  if (player) player.destroy();
  player = new YT.Player("player", {
    videoId: SCENE.videoId,
    playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1 },
    events: {
      onReady: () => { player.playVideo(); startTicker(); },
      onStateChange: onPlayerState
    }
  });
}

// =========================================================
// タイムライン
// =========================================================
function buildTimeline() {
  const bar = document.getElementById("timeline-bar");
  bar.querySelectorAll(".cue-marker").forEach(el => el.remove());
  const dur = SCENE.duration || 120;
  cues.forEach((c, i) => {
    const m = document.createElement("div");
    m.className = "cue-marker" + (c.type === "hakushu" ? " hakushu-marker" : "");
    m.id = "marker-" + i;
    m.style.left = ((c.time / dur) * 100) + "%";
    m.title = (c.type === "hakushu" ? "👏 " : "🎤 ") + (c.hint || c.text || "");
    bar.appendChild(m);
  });
  document.getElementById("timeline-progress").style.width = "0%";
}

// =========================================================
// 毎フレーム更新
// =========================================================
function startTicker() {
  if (ticker) clearInterval(ticker);
  ticker = setInterval(tick, 200);
}

function tick() {
  if (!player || typeof player.getCurrentTime !== "function") return;
  const t = player.getCurrentTime();
  const dur = SCENE.duration || 120;

  document.getElementById("timeline-progress").style.width =
    Math.min(100, (t / dur) * 100) + "%";

  updateHint(t);
  updateNowPlaying(t);

  while (cueIndex < cues.length && cues[cueIndex].result === null &&
         t > cues[cueIndex].time + (cues[cueIndex].type === "hakushu" ? WINDOW_GOOD_H : WINDOW_GOOD)) {
    cues[cueIndex].result = "miss";
    score.miss++;
    markCue(cueIndex, "missed");
    cueIndex++;
    updateScoreUI();
  }
}

// 現在のキャラクター表示を更新（CHAR_TIMELINE で判定）
function updateNowPlaying(t) {
  let currentChar = null;
  for (let i = CHAR_TIMELINE.length - 1; i >= 0; i--) {
    if (CHAR_TIMELINE[i].time <= t) {
      currentChar = CHAR_TIMELINE[i].char;
      break;
    }
  }
  const el = document.getElementById("now-char");
  if (currentChar && CHARS[currentChar]) {
    const ch = CHARS[currentChar];
    document.getElementById("now-char-img").src = ch.img;
    document.getElementById("now-char-name").textContent = ch.name + "（" + ch.actor + "）";
    // イントロのカードもハイライト
    document.querySelectorAll(".cast-card").forEach(c => c.classList.remove("active"));
    const card = document.querySelector('.cast-card[data-char="' + currentChar + '"]');
    if (card) card.classList.add("active");
  }
}

function updateHint(t) {
  const el = document.getElementById("next-hint");
  const next = cues.find(c => c.result === null);
  if (!next) {
    el.innerHTML = "もうキューはないよ！おつかれさま！";
    return;
  }
  const isKake = next.type !== "hakushu";
  const icon = isKake ? "🎤" : "👏";
  const label = isKake ? ("「" + (next.text || "掛け声") + "」") : "拍手";
  const diff = next.time - t;
  if (diff > 10) {
    el.innerHTML = "次は… " + icon + " <span class='hint-text'>" + next.hint + "</span>";
  } else if (diff > 3) {
    el.innerHTML = "もうすぐ！ " + icon + " <span class='hint-text'>" + label + "</span>";
  } else if (diff > 0) {
    el.innerHTML = "<span style='color:var(--aka);font-size:1.1rem;font-weight:bold;'>くるよ…！ " + icon + "</span>";
  } else {
    el.innerHTML = "<span style='color:var(--kin);font-size:1.1rem;font-weight:bold;'>今だ！！ " + icon + "</span>";
  }
}

// =========================================================
// タップ処理
// =========================================================
function handleTap(tapType, e, btn) {
  const rect = btn.getBoundingClientRect();
  const rip = document.createElement("div");
  rip.className = "ripple";
  rip.style.left = (e.clientX - rect.left - 30) + "px";
  rip.style.top = (e.clientY - rect.top - 30) + "px";
  btn.appendChild(rip);
  setTimeout(() => rip.remove(), 600);

  if (!player || typeof player.getCurrentTime !== "function") return;
  const t = player.getCurrentTime();

  let bestIdx = -1;
  let bestDiff = Infinity;
  for (let i = 0; i < cues.length; i++) {
    if (cues[i].result !== null) continue;
    const d = Math.abs(t - cues[i].time);
    if (d < bestDiff) { bestDiff = d; bestIdx = i; }
  }

  if (bestIdx < 0) return;

  const cue = cues[bestIdx];
  const cueType = cue.type || "kakegoe";
  const typeMatch = (tapType === cueType);
  const wGreat = cueType === "hakushu" ? WINDOW_GREAT_H : WINDOW_GREAT;
  const wGood  = cueType === "hakushu" ? WINDOW_GOOD_H  : WINDOW_GOOD;

  let wasHakushuHit = false;
  if (bestDiff <= wGreat && typeMatch) {
    cue.result = "great";
    score.great++;
    showKakegoe(cueType === "kakegoe" ? cue.text : "👏", "var(--kin)");
    markCue(bestIdx, "hit");
    if (cueType === "hakushu") wasHakushuHit = true;
  } else if (bestDiff <= wGood && typeMatch) {
    cue.result = "good";
    score.good++;
    showKakegoe(cueType === "kakegoe" ? cue.text : "👏", "var(--moegi)");
    markCue(bestIdx, "hit");
    if (cueType === "hakushu") wasHakushuHit = true;
  } else if (bestDiff <= wGood && !typeMatch) {
    showKakegoe("種類が違うよ！", "var(--aka)");
    return;
  } else {
    showKakegoe("…", "var(--text-secondary)");
    return;
  }

  while (cueIndex < cues.length && cues[cueIndex].result !== null) cueIndex++;
  updateScoreUI();

  // 拍手成功 → おひねりチャンス！
  if (wasHakushuHit) startOhineriChance();
}

document.getElementById("btn-kakegoe-play").addEventListener("click", function(e) {
  handleTap("kakegoe", e, this);
});
document.getElementById("btn-hakushu-play").addEventListener("click", function(e) {
  handleTap("hakushu", e, this);
});

// =========================================================
// 掛け声テキスト演出
// =========================================================
function showKakegoe(text, color) {
  const el = document.getElementById("kakegoe-text");
  el.textContent = text;
  el.style.color = color || "#fff";
  el.className = "show";
  setTimeout(() => { el.className = "fade"; }, 1200);
  setTimeout(() => { el.className = ""; }, 2000);
}

// =========================================================
// スコア / マーカー更新
// =========================================================
function updateScoreUI() {
  document.getElementById("s-great").textContent = score.great;
  document.getElementById("s-good").textContent = score.good;
  document.getElementById("s-miss").textContent = score.miss;
  document.getElementById("s-ohineri").textContent = score.ohineri;
}

// =========================================================
// おひねりボーナス
// =========================================================
const OHINERI_WINDOW = 2500; // ms

function startOhineriChance() {
  if (ohineriTimer) clearTimeout(ohineriTimer);
  ohineriActive = true;
  const zone = document.getElementById("ohineri-zone");
  const timerBar = document.getElementById("ohineri-timer");
  zone.style.display = "block";
  timerBar.style.transition = "none";
  timerBar.style.width = "200px";
  requestAnimationFrame(() => {
    timerBar.style.transition = "width " + OHINERI_WINDOW + "ms linear";
    timerBar.style.width = "0px";
  });
  ohineriTimer = setTimeout(() => {
    ohineriActive = false;
    zone.style.display = "none";
  }, OHINERI_WINDOW);
}

document.getElementById("btn-ohineri").addEventListener("click", function(e) {
  if (!ohineriActive) return;
  // 連打OK！閉じない、タイマーも止めない
  score.ohineri++;
  updateScoreUI();
  // 舞台に向かっておひねりが飛ぶ演出（連打するほど増える）
  const stage = document.getElementById("player-wrap");
  const stageRect = stage ? stage.getBoundingClientRect() : null;
  const count = 6 + Math.min(score.ohineri, 10); // 連打するほど豪華に
  spawnOhineri(e.clientX, e.clientY, stageRect, count);
  if (score.ohineri <= 3) {
    showKakegoe("🪙 おひねり！", "var(--kin)");
  } else if (score.ohineri <= 8) {
    showKakegoe("🪙🪙 太っ腹！", "var(--kin)");
  } else {
    showKakegoe("🪙🪙🪙 大盤振る舞い！！", "var(--kin)");
  }
});

function spawnOhineri(cx, cy, stageRect, count) {
  const coins = ["🪙", "💰", "🪙", "✨", "🪙", "💫", "🪙", "🪙", "🪙", "💰"];
  // 舞台の中央上あたりを着地点にする
  const stCx = stageRect ? stageRect.left + stageRect.width / 2 : window.innerWidth / 2;
  const stCy = stageRect ? stageRect.top + stageRect.height * 0.3 : 80;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "coin";
    el.style.left = cx + "px";
    el.style.top = cy + "px";
    // 各コインにバラけた着地点
    const targetX = (stCx - cx) + (Math.random() - 0.5) * (stageRect ? stageRect.width * 0.7 : 200);
    const targetY = (stCy - cy) + (Math.random() - 0.3) * 60;
    el.style.setProperty("--tx", targetX + "px");
    el.style.setProperty("--ty", targetY + "px");
    const dur = 0.9 + Math.random() * 0.5;
    el.style.setProperty("--dur", dur + "s");
    el.style.animationDelay = (i * 0.05) + "s";
    el.innerHTML = '<span class="coin-emoji">' + coins[i % coins.length] + '</span>';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }
}

function markCue(idx, cls) {
  const m = document.getElementById("marker-" + idx);
  if (m) m.classList.add(cls);
}

// =========================================================
// 動画終了 → 結果表示
// =========================================================
function onPlayerState(e) {
  if (e.data === YT.PlayerState.ENDED) {
    if (ticker) clearInterval(ticker);
    if (ohineriTimer) clearTimeout(ohineriTimer);
    ohineriActive = false;
    document.getElementById("ohineri-zone").style.display = "none";
    cues.forEach((c, i) => {
      if (c.result === null) { c.result = "miss"; score.miss++; markCue(i, "missed"); }
    });
    updateScoreUI();
    showResult();
  }
}

function showResult() {
  document.getElementById("tap-zone").style.display = "none";
  document.getElementById("next-hint").style.display = "none";
  document.getElementById("now-playing").style.display = "none";
  document.getElementById("ohineri-zone").style.display = "none";
  const total = cues.length;
  const pct = total > 0 ? Math.round(((score.great * 1.0 + score.good * 0.5) / total) * 100) : 0;

  let rank = "前座";
  if (pct >= 90) rank = "大名人 🏆";
  else if (pct >= 70) rank = "名人";
  else if (pct >= 50) rank = "上手";
  else if (pct >= 30) rank = "稽古中";

  document.getElementById("result-score").textContent = pct + "点（" + rank + "）";
  const ohineriLine = score.ohineri > 0 ? "<br>🪙 おひねり: " + score.ohineri + "回" : "";
  document.getElementById("result-detail").innerHTML =
    "大当たり: " + score.great + " / 良し: " + score.good + " / 空振り: " + score.miss +
    "<br>全" + total + "回の掛け声・拍手" + ohineriLine;

  // 結果画面にもキャラカードを表示
  const rc = document.getElementById("result-cast");
  rc.innerHTML = "";
  Object.values(CHARS).forEach(ch => {
    const div = document.createElement("div");
    div.className = "cast-card";
    div.style.width = "80px";
    div.innerHTML = '<img src="' + ch.img + '" alt="' + ch.name + '">' +
      '<div class="name"><span>' + ch.name + '</span></div>';
    rc.appendChild(div);
  });

  document.getElementById("result").style.display = "block";

  /* 稽古記録をlocalStorageに永続化 */
  try {
    const LOG_KEY = "keranosuke_log_v1";
    const raw = localStorage.getItem(LOG_KEY);
    const log = raw ? JSON.parse(raw) : {};
    if (!log.practice) log.practice = {};
    if (!log.practice.kakegoe) log.practice.kakegoe = { last_ts: 0, best_great: 0, best_good: 0, best_miss: 0, sessions: 0 };
    const kk = log.practice.kakegoe;
    kk.sessions = (kk.sessions || 0) + 1;
    kk.last_ts = Math.floor(Date.now()/1000);
    kk.last_great = score.great;
    kk.last_good = score.good;
    kk.last_miss = score.miss;
    if (score.great > (kk.best_great || 0)) kk.best_great = score.great;
    /* XP加算 */
    if (typeof log.xp !== 'number') log.xp = 0;
    log.xp += 3;
    const today = new Date();
    const todayKey = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
    if (!log.daily_log) log.daily_log = {};
    if (!log.daily_log[todayKey]) log.daily_log[todayKey] = { views:0, clips:0, quiz:0, keiko:0, theater:0 };
    log.daily_log[todayKey].keiko++;
    log.updated_at = Math.floor(Date.now()/1000);
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
  } catch(e){}
}
<\/script>

</body>
</html>`;
}
