// =============================================================
// 大向こう稽古 — /training/kakegoe
// YouTube動画を再生しながら掛け声・拍手のタイミングでタップ！
// =============================================================
export function kakegoePageHTML() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>大向こう稽古 - 気良歌舞伎</title>
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

  header{text-align:center;padding:1.2rem 1rem;
    border-bottom:2px solid var(--kin);}
  header h1{font-size:1.3rem;letter-spacing:0.2em;color:var(--kin);}
  header p{font-size:0.8rem;color:#999;margin-top:0.3rem;}

  /* ── 動画セレクタ ── */
  #scene-select{max-width:720px;margin:1rem auto;padding:0 1rem;}
  #scene-select h2{font-size:1rem;color:var(--kin);margin-bottom:0.6rem;
    border-left:3px solid var(--aka);padding-left:0.6rem;}
  .scene-list{display:flex;flex-wrap:wrap;gap:0.5rem;}
  .scene-btn{background:#2a2020;border:1px solid #444;color:var(--shiro);
    padding:0.5rem 1rem;border-radius:8px;cursor:pointer;font-size:0.85rem;
    font-family:inherit;transition:all 0.2s;}
  .scene-btn:hover,.scene-btn.active{border-color:var(--kin);
    background:#3a2a1a;color:var(--kin);}

  /* ── 動画エリア ── */
  #stage{max-width:720px;margin:0 auto;position:relative;
    display:none;}
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

  /* ── タップエリア ── */
  #tap-zone{max-width:720px;margin:0.8rem auto;padding:0 1rem;
    display:none;}
  .tap-buttons{display:flex;gap:0.6rem;}
  .tap-btn{flex:1;padding:1.2rem;border-radius:14px;
    color:var(--shiro);font-size:1.2rem;font-family:inherit;
    cursor:pointer;letter-spacing:0.15em;transition:all 0.15s;
    text-align:center;position:relative;overflow:hidden;border-width:3px;border-style:solid;}
  #btn-kakegoe-play{background:linear-gradient(135deg,#3a1515 0%,#1e1e1e 100%);
    border-color:var(--aka);}
  #btn-kakegoe-play:active{background:var(--aka);transform:scale(0.97);}
  #btn-hakushu-play{background:linear-gradient(135deg,#1a2a1a 0%,#1e1e1e 100%);
    border-color:var(--moegi);}
  #btn-hakushu-play:active{background:var(--moegi);transform:scale(0.97);}
  .tap-btn .sub{display:block;font-size:0.65rem;color:#999;margin-top:0.3rem;
    letter-spacing:0.05em;}

  /* ── 次の掛け声ヒント ── */
  #next-hint{max-width:720px;margin:0 auto;padding:0.5rem 1rem;
    text-align:center;font-size:0.85rem;color:#777;display:none;
    min-height:2rem;}
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
  #score-bar span{font-size:0.9rem;margin:0 0.8rem;}
  .s-label{color:#999;} .s-val{color:var(--kin);font-weight:bold;}
  .s-great{color:var(--moegi)!important;} .s-good{color:var(--kin)!important;}
  .s-miss{color:var(--aka)!important;}

  /* ── 結果画面 ── */
  #result{max-width:720px;margin:2rem auto;padding:2rem;text-align:center;
    display:none;background:#2a2020;border-radius:14px;border:1px solid var(--kin);}
  #result h2{color:var(--kin);font-size:1.5rem;margin-bottom:1rem;}
  #result .big-score{font-size:3rem;color:var(--kin);}
  #result .detail{margin-top:1rem;font-size:0.9rem;color:#bbb;line-height:1.8;}
  #result button{margin-top:1.5rem;padding:0.7rem 2rem;background:var(--aka);
    color:#fff;border:none;border-radius:8px;font-size:1rem;cursor:pointer;
    font-family:inherit;}

  footer{text-align:center;padding:1.2rem;font-size:0.75rem;color:#555;
    border-top:1px solid #333;margin-top:2rem;}
  footer a{color:var(--kin);text-decoration:none;}

  /* ── リップル ── */
  @keyframes ripple{
    0%{transform:scale(0);opacity:0.6;}
    100%{transform:scale(4);opacity:0;}
  }
  .ripple{position:absolute;border-radius:50%;background:rgba(197,165,90,0.4);
    width:60px;height:60px;pointer-events:none;animation:ripple 0.6s ease-out forwards;}
</style>
</head>
<body>

<div class="joshikimaku"></div>
<header>
  <h1>大向こう稽古</h1>
  <p>動画に合わせて掛け声のタイミングを練習しよう</p>
</header>
<div class="joshikimaku"></div>

<div id="scene-select">
  <h2>演目をえらぶ</h2>
  <div class="scene-list" id="scene-list"></div>
</div>

<div id="stage">
  <div id="player-wrap">
    <div id="player"></div>
    <div id="kakegoe-overlay">
      <div id="kakegoe-text"></div>
    </div>
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
  <button onclick="location.reload()">もう一度えらぶ</button>
</div>

<footer>
  <a href="/training">お稽古メニューへ戻る</a>
</footer>

<!-- YouTube IFrame API -->
<script>
// =========================================================
// 演目データ（YouTube動画ID + 掛け声タイミング）
// =========================================================
const SCENES = [
  {
    id: "shiranami",
    title: "白浪五人男「稲瀬川勢揃い」",
    videoId: "I5QncXeoIm0",
    duration: 780,
    cues: [
      // ===== 花道 ─ 登場と見得 =====
      { time: 12.1,  type: "kakegoe", text: "ふきや！",       hint: "弁天小僧　花道登場" },
      { time: 20,    type: "hakushu",                         hint: "弁天小僧　花道見得" },

      { time: 53.4,  type: "kakegoe", text: "おんじ！",       hint: "忠信利平　花道登場" },
      { time: 59,    type: "hakushu",                         hint: "忠信利平　花道見得" },

      { time: 77.9,  type: "kakegoe", text: "よそべさ！",     hint: "赤星十三郎　花道登場" },
      { time: 82,    type: "hakushu",                         hint: "赤星十三郎　花道見得" },

      { time: 99.8,  type: "kakegoe", text: "さわ！",         hint: "南郷力丸　花道登場" },
      { time: 106.3, type: "hakushu",                         hint: "南郷力丸　花道見得" },

      { time: 122.9, type: "kakegoe", text: "もはっつぁ！",   hint: "日本駄右衛門　花道登場" },
      { time: 133.1, type: "hakushu",                         hint: "日本駄右衛門　花道見得" },

      // ===== 勢揃い =====
      { time: 154,   type: "kakegoe", text: "たっぷりと！",   hint: "五人男勢揃い" },
      { time: 227.9, type: "kakegoe", text: "よっ！",         hint: "五人男渡り台詞終わり" },
      { time: 233.6, type: "hakushu",                         hint: "五人男渡り台詞終わり" },
      { time: 267.8, type: "kakegoe", text: "待ってました！", hint: "捕手勢揃い" },

      // ===== つらね =====
      // 日本駄右衛門
      { time: 327.7, type: "kakegoe", text: "たっぷりと！",   hint: "日本駄右衛門　ツラネ" },
      { time: 394.3, type: "kakegoe", text: "よっ！",         hint: "日本駄右衛門　見得" },
      { time: 400.2, type: "hakushu",                         hint: "日本駄右衛門　ツラネ終わり" },

      // 弁天小僧（ツラネ開始の掛け声は省略 ─ 拍手直後で近すぎるため）
      { time: 458.4, type: "kakegoe", text: "よっ！",         hint: "弁天小僧　見得" },
      { time: 464.5, type: "hakushu",                         hint: "弁天小僧　ツラネ終わり" },

      // 忠信利平
      { time: 525.7, type: "kakegoe", text: "よっ！",         hint: "忠信利平　見得" },
      { time: 530.8, type: "hakushu",                         hint: "忠信利平　ツラネ終わり" },

      // 赤星十三郎
      { time: 588.1, type: "kakegoe", text: "しっとりと！",   hint: "赤星十三郎　ツラネ２" },
      { time: 602.5, type: "kakegoe", text: "よっ！",         hint: "赤星十三郎　決め" },
      { time: 608.8, type: "hakushu",                         hint: "赤星十三郎　ツラネ終わり" },

      // 南郷力丸
      { time: 667.3, type: "kakegoe", text: "よっ！",         hint: "南郷力丸　見得" },
      { time: 673.9, type: "hakushu",                         hint: "南郷力丸　ツラネ終わり" },

      // ===== クライマックス =====
      { time: 753,   type: "kakegoe", text: "日本一！",       hint: "勢揃いの見得" },
      { time: 757.8, type: "hakushu",                         hint: "" },
    ]
  }
  // ★ 他の演目を追加するには、同じ形式で SCENES に追加
];

// =========================================================
// グローバル変数
// =========================================================
let player = null;
let currentScene = null;
let cues = [];
let cueIndex = 0;
let score = { great: 0, good: 0, miss: 0 };
let ticker = null;
// 掛け声の判定幅
const WINDOW_GREAT = 1.0;   // ±1秒 = 大当たり
const WINDOW_GOOD  = 2.5;   // ±2.5秒 = 良し
// 拍手の判定幅（広め）
const WINDOW_GREAT_H = 2.0; // ±2秒 = 大当たり
const WINDOW_GOOD_H  = 4.0; // ±4秒 = 良し

// =========================================================
// シーン選択ボタンを生成
// =========================================================
(function buildSceneList() {
  const list = document.getElementById("scene-list");
  SCENES.forEach(s => {
    const btn = document.createElement("button");
    btn.className = "scene-btn";
    btn.textContent = s.title;
    btn.onclick = () => startScene(s);
    list.appendChild(btn);
  });
})();

// =========================================================
// YouTube IFrame API 読み込み
// =========================================================
const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);

window.onYouTubeIframeAPIReady = function() {
  console.log("YouTube API ready");
};

// =========================================================
// シーン開始
// =========================================================
function startScene(scene) {
  currentScene = scene;
  cues = scene.cues.map(c => ({ ...c, result: null }));
  cueIndex = 0;
  score = { great: 0, good: 0, miss: 0 };
  updateScoreUI();

  document.getElementById("scene-select").style.display = "none";
  document.getElementById("stage").style.display = "block";
  document.getElementById("tap-zone").style.display = "block";
  document.getElementById("next-hint").style.display = "block";
  document.getElementById("timeline").style.display = "block";
  document.getElementById("score-bar").style.display = "block";
  document.getElementById("result").style.display = "none";

  buildTimeline(scene);

  if (player) player.destroy();
  player = new YT.Player("player", {
    videoId: scene.videoId,
    playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1 },
    events: {
      onReady: () => { player.playVideo(); startTicker(); },
      onStateChange: onPlayerState
    }
  });
}

// =========================================================
// タイムラインを構築
// =========================================================
function buildTimeline(scene) {
  const bar = document.getElementById("timeline-bar");
  bar.querySelectorAll(".cue-marker").forEach(el => el.remove());
  const dur = scene.duration || 120;
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
  const dur = currentScene.duration || 120;

  document.getElementById("timeline-progress").style.width =
    Math.min(100, (t / dur) * 100) + "%";

  updateHint(t);

  while (cueIndex < cues.length && cues[cueIndex].result === null &&
         t > cues[cueIndex].time + (cues[cueIndex].type === "hakushu" ? WINDOW_GOOD_H : WINDOW_GOOD)) {
    cues[cueIndex].result = "miss";
    score.miss++;
    markCue(cueIndex, "missed");
    cueIndex++;
    updateScoreUI();
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
    "<br>全" + total + "回の掛け声";
  document.getElementById("result").style.display = "block";
}
<\/script>

</body>
</html>`;
}
