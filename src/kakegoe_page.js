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
<title>大向こう稽古 ─ 白浪五人男 | 気良歌舞伎</title>
<style>
  :root {
    --kuro:#1a1a1a; --aka:#C41E3A; --moegi:#6B8E23;
    --kin:#C5A55A; --shiro:#F5F0E8;
  }
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:"Noto Serif JP","Yu Mincho","Hiragino Mincho ProN",serif;
    background:var(--kuro);color:var(--shiro);min-height:100vh;
    overflow-x:hidden;}

  .joshikimaku{height:8px;background:repeating-linear-gradient(90deg,
    var(--kuro) 0%,var(--kuro) 33.33%,
    var(--moegi) 33.33%,var(--moegi) 66.66%,
    var(--aka) 66.66%,var(--aka) 100%);}

  /* ── イントロ画面 ── */
  #intro{max-width:760px;margin:0 auto;padding:1rem;text-align:center;}
  #intro h1{font-size:1.8rem;letter-spacing:0.25em;color:var(--kin);
    margin:1rem 0 0.3rem;text-shadow:0 2px 8px rgba(0,0,0,0.7);}
  #intro .subtitle{font-size:1rem;color:#bbb;letter-spacing:0.1em;margin-bottom:1rem;}

  /* 五人カード */
  .cast-row{display:flex;gap:0.4rem;justify-content:center;margin:0.8rem 0;
    overflow-x:auto;-webkit-overflow-scrolling:touch;}
  .cast-card{flex:0 0 auto;width:120px;border-radius:10px;overflow:hidden;
    border:2px solid #333;transition:all 0.3s;position:relative;cursor:default;}
  .cast-card img{width:100%;display:block;}
  .cast-card .name{position:absolute;bottom:0;left:0;right:0;
    background:linear-gradient(transparent,rgba(0,0,0,0.85));
    padding:0.5rem 0.3rem 0.3rem;text-align:center;}
  .cast-card .name span{display:block;font-size:0.8rem;color:var(--kin);
    letter-spacing:0.1em;}
  .cast-card .name small{font-size:0.7rem;color:#999;}
  .cast-card.active{border-color:var(--kin);
    box-shadow:0 0 16px rgba(197,165,90,0.4);transform:scale(1.05);}

  /* スタートボタン */
  #start-btn{display:inline-block;margin:1.2rem 0;padding:1rem 3rem;
    background:linear-gradient(135deg,var(--aka) 0%,#8B0000 100%);
    color:#fff;border:2px solid var(--kin);border-radius:14px;
    font-size:1.2rem;font-family:inherit;letter-spacing:0.2em;
    cursor:pointer;transition:all 0.2s;text-shadow:0 2px 4px rgba(0,0,0,0.5);}
  #start-btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(197,165,90,0.3);}
  #start-btn:active{transform:scale(0.97);}

  .intro-hint{font-size:0.85rem;color:#777;margin-top:0.5rem;line-height:1.6;}
  .intro-hint b{color:var(--kin);}

  /* 操作説明 */
  .how-to{max-width:520px;margin:1rem auto 0;padding:1rem 1.2rem;
    background:#222;border:1px solid #444;border-radius:12px;text-align:left;}
  .how-to h3{font-size:1rem;color:var(--kin);margin-bottom:0.6rem;text-align:center;
    letter-spacing:0.15em;}
  .how-to ol{padding-left:1.5rem;list-style:none;counter-reset:step;}
  .how-to ol li{counter-increment:step;margin-bottom:0.5rem;font-size:0.9rem;
    color:#ccc;line-height:1.6;position:relative;}
  .how-to ol li::before{content:counter(step);position:absolute;left:-1.5rem;
    width:1.3rem;height:1.3rem;background:var(--aka);color:#fff;
    border-radius:50%;font-size:0.7rem;display:flex;align-items:center;
    justify-content:center;top:0.15rem;}
  .how-to .tip{margin-top:0.7rem;padding:0.5rem 0.7rem;background:#2a2020;
    border-left:3px solid var(--kin);border-radius:4px;font-size:0.85rem;
    color:#bbb;line-height:1.5;}
  .how-to .tip b{color:var(--kin);}
  .how-to .caution{margin-top:0.7rem;padding:0.6rem 0.7rem;
    background:rgba(196,30,58,0.12);border-left:3px solid var(--aka);
    border-radius:4px;font-size:0.82rem;color:#ccc;line-height:1.6;}
  .how-to .caution b{color:var(--aka);}

  /* ── 動画エリア ── */
  #stage{max-width:720px;margin:0 auto;position:relative;display:none;}
  #player-wrap{position:relative;width:100%;padding-top:56.25%;background:#000;}
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
    background:#2a2020;border:1px solid #444;border-radius:20px;
    padding:0.3rem 1rem;}
  #now-char img{width:32px;height:32px;border-radius:50%;object-fit:cover;
    border:1px solid var(--kin);}
  #now-char span{font-size:0.95rem;color:var(--kin);}

  /* ── タップエリア ── */
  #tap-zone{max-width:720px;margin:0.8rem auto;padding:0 1rem;display:none;}
  .tap-buttons{display:flex;gap:0.6rem;}
  .tap-btn{flex:1;padding:1.4rem;border-radius:14px;
    color:var(--shiro);font-size:1.3rem;font-family:inherit;
    cursor:pointer;letter-spacing:0.15em;transition:all 0.15s;
    text-align:center;position:relative;overflow:hidden;
    border-width:3px;border-style:solid;}
  #btn-kakegoe-play{background:linear-gradient(135deg,#3a1515 0%,#1e1e1e 100%);
    border-color:var(--aka);}
  #btn-kakegoe-play:active{background:var(--aka);transform:scale(0.97);}
  #btn-hakushu-play{background:linear-gradient(135deg,#1a2a1a 0%,#1e1e1e 100%);
    border-color:var(--moegi);}
  #btn-hakushu-play:active{background:var(--moegi);transform:scale(0.97);}
  .tap-btn .sub{display:block;font-size:0.75rem;color:#999;margin-top:0.3rem;
    letter-spacing:0.05em;}

  /* ── 次のヒント ── */
  #next-hint{max-width:720px;margin:0 auto;padding:0.5rem 1rem;
    text-align:center;font-size:1rem;color:#777;display:none;
    min-height:2.5rem;}
  #next-hint .hint-text{color:var(--kin);}

  /* ── タイムライン ── */
  #timeline{max-width:720px;margin:0.5rem auto;padding:0 1rem;display:none;}
  #timeline-bar{height:6px;background:#333;border-radius:3px;
    position:relative;overflow:visible;}
  #timeline-progress{height:100%;background:linear-gradient(90deg,var(--moegi),var(--aka));
    border-radius:3px;width:0%;transition:width 0.3s linear;}
  .cue-marker{position:absolute;top:-4px;width:14px;height:14px;
    background:var(--kin);border-radius:50%;transform:translateX(-50%);
    border:2px solid var(--kuro);z-index:2;}
  .cue-marker.hakushu-marker{background:var(--moegi);}
  .cue-marker.hit{box-shadow:0 0 8px var(--moegi);filter:brightness(1.3);}
  .cue-marker.missed{background:#555;box-shadow:none;filter:none;}

  /* ── スコア ── */
  #score-bar{max-width:720px;margin:0 auto;padding:0.6rem 1rem;
    display:none;text-align:center;}
  #score-bar span{font-size:1rem;margin:0 0.8rem;}
  .s-label{color:#999;} .s-val{color:var(--kin);font-weight:bold;}
  .s-great{color:var(--moegi)!important;} .s-good{color:var(--kin)!important;}
  .s-miss{color:var(--aka)!important;}

  /* ── 結果画面 ── */
  #result{max-width:720px;margin:2rem auto;padding:2rem;text-align:center;
    display:none;background:#2a2020;border-radius:14px;border:1px solid var(--kin);}
  #result h2{color:var(--kin);font-size:1.5rem;margin-bottom:1rem;}
  #result .big-score{font-size:3rem;color:var(--kin);}
  #result .detail{margin-top:1rem;font-size:1rem;color:#bbb;line-height:1.8;}
  #result .cast-row{margin-top:1.2rem;}
  #result button{margin-top:1.5rem;padding:0.7rem 2rem;background:var(--aka);
    color:#fff;border:none;border-radius:8px;font-size:1rem;cursor:pointer;
    font-family:inherit;}

  footer{text-align:center;padding:1.2rem;font-size:0.85rem;color:#555;
    border-top:1px solid #333;margin-top:2rem;}
  footer a{color:var(--kin);text-decoration:none;}

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

<div class="joshikimaku"></div>

<!-- ===== イントロ画面 ===== -->
<div id="intro">
  <h1>大向こう稽古</h1>
  <div class="subtitle">白浪五人男「稲瀬川勢揃い」</div>

  <div class="cast-row" id="cast-row">
    <div class="cast-card" data-char="benten">
      <img src="https://raw.githubusercontent.com/kerakabuki/kabuki-ai-agent/main/assets/shiranami/benten.png" alt="弁天小僧">
      <div class="name"><span>弁天小僧</span><small>ふきや</small></div>
    </div>
    <div class="cast-card" data-char="tadanobu">
      <img src="https://raw.githubusercontent.com/kerakabuki/kabuki-ai-agent/main/assets/shiranami/tadanobu.png" alt="忠信利平">
      <div class="name"><span>忠信利平</span><small>おんじ</small></div>
    </div>
    <div class="cast-card" data-char="akaboshi">
      <img src="https://raw.githubusercontent.com/kerakabuki/kabuki-ai-agent/main/assets/shiranami/akaboshi.png" alt="赤星十三郎">
      <div class="name"><span>赤星十三郎</span><small>よそべさ</small></div>
    </div>
    <div class="cast-card" data-char="nango">
      <img src="https://raw.githubusercontent.com/kerakabuki/kabuki-ai-agent/main/assets/shiranami/nango.png" alt="南郷力丸">
      <div class="name"><span>南郷力丸</span><small>さわ</small></div>
    </div>
    <div class="cast-card" data-char="dayemon">
      <img src="https://raw.githubusercontent.com/kerakabuki/kabuki-ai-agent/main/assets/shiranami/dayemon.png" alt="日本駄右衛門">
      <div class="name"><span>日本駄右衛門</span><small>もはっつぁ</small></div>
    </div>
  </div>

  <div class="how-to">
    <h3>📖 あそびかた</h3>
    <ol>
      <li>下の <b>「稽古をはじめる」</b> ボタンを押すと動画がスタート</li>
      <li>画面の <b>ヒント</b> を見ながらタイミングを待つ</li>
      <li>役者の登場やツラネの見せ場で <b style="color:var(--aka);">🎤 掛け声！</b> をタップ</li>
      <li>見得やツラネの終わりで <b style="color:var(--moegi);">👏 拍手！</b> をタップ</li>
      <li>タイミングが良いほど高得点！全28回の掛け声＆拍手に挑戦</li>
    </ol>
    <div class="tip">
      💡 <b>大当たり</b>＝ぴったりのタイミング、<b>良し</b>＝ちょっとずれ、<b>空振り</b>＝タイミング逃し。<br>
      掛け声と拍手の<b>種類を間違えない</b>ようにしてね！
    </div>
    <div class="caution">
      ⚠️ <b>大事なお願い</b><br>
      この大向こう稽古は<b>気良歌舞伎の公演</b>を楽しむための練習です。<br>
      プロの歌舞伎公演や他の舞台では、勝手な掛け声はお客さんや役者さんの迷惑になります。<b>気良歌舞伎以外の公演では大向こうを控えましょう。</b>
    </div>
  </div>

  <button id="start-btn">🎭 稽古をはじめる</button>
</div>

<!-- ===== プレイ画面 ===== -->
<div id="stage">
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

<div id="score-bar">
  <span><span class="s-label">大当たり </span><span class="s-val s-great" id="s-great">0</span></span>
  <span><span class="s-label">良し </span><span class="s-val s-good" id="s-good">0</span></span>
  <span><span class="s-label">空振り </span><span class="s-val s-miss" id="s-miss">0</span></span>
</div>

<div id="result">
  <h2>お稽古おつかれさま！</h2>
  <div class="big-score" id="result-score"></div>
  <div class="detail" id="result-detail"></div>
  <div class="cast-row" id="result-cast"></div>
  <button onclick="location.reload()">もう一度やる</button>
</div>

<footer>
  <a href="/training">お稽古メニューへ戻る</a>
</footer>

<script>
// =========================================================
// キャラクターデータ
// =========================================================
const IMG_BASE = "https://raw.githubusercontent.com/kerakabuki/kabuki-ai-agent/main/assets/shiranami/";
const CHARS = {
  benten:   { name: "弁天小僧",     actor: "ふきや",     img: IMG_BASE + "benten.png" },
  tadanobu: { name: "忠信利平",     actor: "おんじ",     img: IMG_BASE + "tadanobu.png" },
  akaboshi: { name: "赤星十三郎",   actor: "よそべさ",   img: IMG_BASE + "akaboshi.png" },
  nango:    { name: "南郷力丸",     actor: "さわ",       img: IMG_BASE + "nango.png" },
  dayemon:  { name: "日本駄右衛門", actor: "もはっつぁ", img: IMG_BASE + "dayemon.png" },
  all:      { name: "白浪五人男",   actor: "勢揃い",     img: IMG_BASE + "complete.png" },
};

// =========================================================
// 演目データ
// =========================================================
const SCENE = {
  id: "shiranami",
  title: "白浪五人男「稲瀬川勢揃い」",
  videoId: "I5QncXeoIm0",
  duration: 780,
  cues: [
    // ===== 花道 ─ 登場と見得 =====
    { time: 12.1,  type: "kakegoe", text: "ふきや！",       hint: "弁天小僧　花道登場",     char: "benten" },
    { time: 20,    type: "hakushu",                         hint: "弁天小僧　花道見得",     char: "benten" },

    { time: 53.4,  type: "kakegoe", text: "おんじ！",       hint: "忠信利平　花道登場",     char: "tadanobu" },
    { time: 59,    type: "hakushu",                         hint: "忠信利平　花道見得",     char: "tadanobu" },

    { time: 77.9,  type: "kakegoe", text: "よそべさ！",     hint: "赤星十三郎　花道登場",   char: "akaboshi" },
    { time: 82,    type: "hakushu",                         hint: "赤星十三郎　花道見得",   char: "akaboshi" },

    { time: 99.8,  type: "kakegoe", text: "さわ！",         hint: "南郷力丸　花道登場",     char: "nango" },
    { time: 106.3, type: "hakushu",                         hint: "南郷力丸　花道見得",     char: "nango" },

    { time: 122.9, type: "kakegoe", text: "もはっつぁ！",   hint: "日本駄右衛門　花道登場", char: "dayemon" },
    { time: 133.1, type: "hakushu",                         hint: "日本駄右衛門　花道見得", char: "dayemon" },

    // ===== 勢揃い =====
    { time: 154,   type: "kakegoe", text: "たっぷりと！",   hint: "五人男勢揃い",         char: "all" },
    { time: 227.9, type: "kakegoe", text: "よっ！",         hint: "五人男渡り台詞終わり", char: "all" },
    { time: 233.6, type: "hakushu",                         hint: "五人男渡り台詞終わり", char: "all" },
    { time: 267.8, type: "kakegoe", text: "待ってました！", hint: "捕手勢揃い",           char: "all" },

    // ===== つらね =====
    // 日本駄右衛門
    { time: 327.7, type: "kakegoe", text: "たっぷりと！",   hint: "日本駄右衛門　ツラネ",     char: "dayemon" },
    { time: 394.3, type: "kakegoe", text: "よっ！",         hint: "日本駄右衛門　見得",       char: "dayemon" },
    { time: 400.2, type: "hakushu",                         hint: "日本駄右衛門　ツラネ終わり", char: "dayemon" },

    // 弁天小僧
    { time: 458.4, type: "kakegoe", text: "よっ！",         hint: "弁天小僧　見得",           char: "benten" },
    { time: 464.5, type: "hakushu",                         hint: "弁天小僧　ツラネ終わり",   char: "benten" },

    // 忠信利平
    { time: 525.7, type: "kakegoe", text: "よっ！",         hint: "忠信利平　見得",           char: "tadanobu" },
    { time: 530.8, type: "hakushu",                         hint: "忠信利平　ツラネ終わり",   char: "tadanobu" },

    // 赤星十三郎
    { time: 588.1, type: "kakegoe", text: "しっとりと！",   hint: "赤星十三郎　ツラネ２",     char: "akaboshi" },
    { time: 602.5, type: "kakegoe", text: "よっ！",         hint: "赤星十三郎　決め",         char: "akaboshi" },
    { time: 608.8, type: "hakushu",                         hint: "赤星十三郎　ツラネ終わり", char: "akaboshi" },

    // 南郷力丸
    { time: 667.3, type: "kakegoe", text: "よっ！",         hint: "南郷力丸　見得",           char: "nango" },
    { time: 673.9, type: "hakushu",                         hint: "南郷力丸　ツラネ終わり",   char: "nango" },

    // ===== クライマックス =====
    { time: 753,   type: "kakegoe", text: "日本一！",       hint: "勢揃いの見得",     char: "all" },
    { time: 757.8, type: "hakushu",                         hint: "勢揃い",           char: "all" },
  ]
};

// =========================================================
// グローバル変数
// =========================================================
let player = null;
let cues = [];
let cueIndex = 0;
let score = { great: 0, good: 0, miss: 0 };
let ticker = null;
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
  score = { great: 0, good: 0, miss: 0 };
  updateScoreUI();

  // UI切替
  document.getElementById("intro").style.display = "none";
  document.getElementById("stage").style.display = "block";
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

// 現在のキャラクター表示を更新
function updateNowPlaying(t) {
  let currentChar = null;
  for (let i = cues.length - 1; i >= 0; i--) {
    if (cues[i].char && cues[i].time <= t + 5) {
      currentChar = cues[i].char;
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

  if (bestDiff <= wGreat && typeMatch) {
    cue.result = "great";
    score.great++;
    showKakegoe(cueType === "kakegoe" ? cue.text : "👏", "var(--kin)");
    markCue(bestIdx, "hit");
  } else if (bestDiff <= wGood && typeMatch) {
    cue.result = "good";
    score.good++;
    showKakegoe(cueType === "kakegoe" ? cue.text : "👏", "var(--moegi)");
    markCue(bestIdx, "hit");
  } else if (bestDiff <= wGood && !typeMatch) {
    showKakegoe("種類が違うよ！", "var(--aka)");
    return;
  } else {
    showKakegoe("…", "#555");
    return;
  }

  while (cueIndex < cues.length && cues[cueIndex].result !== null) cueIndex++;
  updateScoreUI();
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
  const total = cues.length;
  const pct = total > 0 ? Math.round(((score.great * 1.0 + score.good * 0.5) / total) * 100) : 0;

  let rank = "前座";
  if (pct >= 90) rank = "大名人 🏆";
  else if (pct >= 70) rank = "名人";
  else if (pct >= 50) rank = "上手";
  else if (pct >= 30) rank = "稽古中";

  document.getElementById("result-score").textContent = pct + "点（" + rank + "）";
  document.getElementById("result-detail").innerHTML =
    "大当たり: " + score.great + " / 良し: " + score.good + " / 空振り: " + score.miss +
    "<br>全" + total + "回の掛け声・拍手";

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
}
<\/script>

</body>
</html>`;
}
