// =============================================================
// 大向こう キュー編集ツール — /training/kakegoe/editor
// =============================================================
export function kakegoeEditorHTML() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>大向こう キュー編集 - 気良歌舞伎</title>
<style>
  :root{--kuro:#1a1a1a;--aka:#C41E3A;--moegi:#6B8E23;--kin:#C5A55A;--shiro:#F5F0E8;}
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:"Noto Sans JP","Hiragino Sans",sans-serif;
    background:var(--kuro);color:var(--shiro);min-height:100vh;}
  .bar{height:6px;background:repeating-linear-gradient(90deg,
    var(--kuro) 0%,var(--kuro) 33.33%,
    var(--moegi) 33.33%,var(--moegi) 66.66%,
    var(--aka) 66.66%,var(--aka) 100%);}
  header{text-align:center;padding:1rem;border-bottom:2px solid var(--kin);}
  header h1{font-size:1.2rem;color:var(--kin);letter-spacing:0.15em;}
  header p{font-size:0.75rem;color:#999;margin-top:0.3rem;}

  /* ── 入力エリア ── */
  .input-row{max-width:760px;margin:1rem auto;padding:0 1rem;display:flex;gap:0.5rem;flex-wrap:wrap;}
  .input-row input{flex:1;min-width:200px;padding:0.5rem 0.8rem;border:1px solid #555;
    border-radius:6px;background:#222;color:var(--shiro);font-size:0.9rem;font-family:inherit;}
  .input-row button{padding:0.5rem 1.2rem;border:none;border-radius:6px;
    font-size:0.9rem;font-family:inherit;cursor:pointer;}
  #btn-load{background:var(--kin);color:var(--kuro);font-weight:bold;}

  /* ── 動画エリア ── */
  #stage{max-width:760px;margin:0 auto;position:relative;display:none;}
  #player-wrap{position:relative;width:100%;padding-top:56.25%;background:#000;}
  #player-wrap iframe{position:absolute;top:0;left:0;width:100%;height:100%;}

  /* ── 現在時間 ── */
  #time-display{text-align:center;font-size:1.4rem;color:var(--kin);
    font-variant-numeric:tabular-nums;padding:0.5rem 0;font-weight:bold;}

  /* ── タップボタン ── */
  .tap-row{max-width:760px;margin:0 auto;padding:0 1rem;
    display:none;gap:0.6rem;}
  .tap-row button{flex:1;padding:1rem;border-radius:12px;font-size:1.1rem;
    font-family:inherit;cursor:pointer;border:2px solid;transition:transform 0.1s;}
  .tap-row button:active{transform:scale(0.95);}
  #btn-kakegoe{background:#3a1515;color:var(--shiro);border-color:var(--aka);}
  #btn-kakegoe:active{background:var(--aka);}
  #btn-hakushu{background:#1a2a1a;color:var(--shiro);border-color:var(--moegi);}
  #btn-hakushu:active{background:var(--moegi);}

  /* ── キューリスト ── */
  #cue-list-wrap{max-width:760px;margin:1rem auto;padding:0 1rem;}
  #cue-list-wrap h2{font-size:0.95rem;color:var(--kin);margin-bottom:0.5rem;
    border-left:3px solid var(--aka);padding-left:0.6rem;}
  table{width:100%;border-collapse:collapse;font-size:0.8rem;}
  th{text-align:left;color:#999;padding:0.3rem 0.4rem;border-bottom:1px solid #333;}
  td{padding:0.3rem 0.4rem;border-bottom:1px solid #222;vertical-align:middle;}
  .time-cell{color:var(--kin);font-variant-numeric:tabular-nums;white-space:nowrap;font-weight:bold;}
  .type-kakegoe{color:var(--aka);} .type-hakushu{color:var(--moegi);}
  td input,td select{background:#222;color:var(--shiro);border:1px solid #444;
    border-radius:4px;padding:0.25rem 0.4rem;font-size:0.8rem;font-family:inherit;width:100%;}
  td select{width:auto;}
  .del-btn{background:none;border:none;color:#666;cursor:pointer;font-size:1rem;}
  .del-btn:hover{color:var(--aka);}

  /* ── エクスポート ── */
  #export-area{max-width:760px;margin:1rem auto;padding:0 1rem;}
  #export-area h2{font-size:0.95rem;color:var(--kin);margin-bottom:0.5rem;
    border-left:3px solid var(--moegi);padding-left:0.6rem;}
  #export-box{width:100%;min-height:120px;background:#111;color:#ccc;
    border:1px solid #333;border-radius:6px;padding:0.6rem;font-family:"Consolas","Courier New",monospace;
    font-size:0.75rem;resize:vertical;}
  .export-btns{margin-top:0.5rem;display:flex;gap:0.5rem;}
  .export-btns button{padding:0.4rem 1rem;border:none;border-radius:6px;
    cursor:pointer;font-size:0.85rem;font-family:inherit;}
  #btn-export{background:var(--kin);color:var(--kuro);font-weight:bold;}
  #btn-copy{background:var(--moegi);color:#fff;font-weight:bold;}
  #copy-msg{color:var(--moegi);font-size:0.8rem;margin-left:0.5rem;opacity:0;transition:opacity 0.3s;}

  footer{text-align:center;padding:1rem;font-size:0.75rem;color:#555;
    border-top:1px solid #333;margin-top:2rem;}
  footer a{color:var(--kin);text-decoration:none;}
</style>
</head>
<body>

<div class="bar"></div>
<header>
  <h1>大向こう キュー編集ツール</h1>
  <p>動画を再生しながらタップ → タイミングを自動記録</p>
</header>
<div class="bar"></div>

<div class="input-row">
  <input id="video-id" placeholder="YouTube動画ID（例: I5QncXeoIm0）" value="I5QncXeoIm0">
  <button id="btn-load">動画を読み込む</button>
</div>

<div id="stage">
  <div id="player-wrap"><div id="player"></div></div>
</div>
<div id="time-display">0:00.0</div>

<div class="tap-row" id="tap-row">
  <button id="btn-kakegoe">🎤 掛け声</button>
  <button id="btn-hakushu">👏 拍手</button>
</div>

<div id="cue-list-wrap">
  <h2>記録されたキュー (<span id="cue-count">0</span>)</h2>
  <table>
    <thead><tr><th>時間</th><th>種類</th><th>テキスト</th><th>ヒント</th><th></th></tr></thead>
    <tbody id="cue-tbody"></tbody>
  </table>
</div>

<div id="export-area">
  <h2>エクスポート</h2>
  <textarea id="export-box" readonly></textarea>
  <div class="export-btns">
    <button id="btn-export">生成</button>
    <button id="btn-copy">📋 コピー</button>
    <span id="copy-msg">コピーしました！</span>
  </div>
</div>

<footer><a href="/training/kakegoe">大向こう稽古へ戻る</a></footer>

<script>
// ── state ──
let player = null;
let cueData = []; // { time, type, text, hint }
let ticker = null;

const kakegoeTexts = [
  // 定番
  "待ってました！", "たっぷりと！", "しっとりと！", "よっ！",
  // スケール系
  "日本一！", "世界一！", "宇宙一！",
  // 褒め言葉
  "看板役者！", "千両役者！", "よっ二枚目！",
  // 気良歌舞伎の役者（肩書き）
  "よっ座長！",               // 弁天小僧
  "よっ市役所課長！",         // 忠信利平
  "よっトップセールスマン！", // 赤星十三郎
  "よっ信用金庫！",           // 南郷力丸
  "よっ太っ腹社長！",         // 日本駄右衛門
  // その他
  "大統領！",
];
const defaultKakegoe = "待ってました！";

// ── YouTube API ──
const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);
window.onYouTubeIframeAPIReady = () => console.log("YT API ready");

// ── 動画読み込み ──
document.getElementById("btn-load").onclick = () => {
  const vid = document.getElementById("video-id").value.trim();
  if (!vid) return;
  document.getElementById("stage").style.display = "block";
  document.getElementById("tap-row").style.display = "flex";
  if (player) player.destroy();
  player = new YT.Player("player", {
    videoId: vid,
    playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
    events: { onReady: () => startTicker() }
  });
};

function startTicker() {
  if (ticker) clearInterval(ticker);
  ticker = setInterval(() => {
    if (!player || typeof player.getCurrentTime !== "function") return;
    const t = player.getCurrentTime();
    document.getElementById("time-display").textContent = fmtTime(t);
  }, 100);
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m + ":" + sec.toFixed(1).padStart(4, "0");
}

function fmtTimeShort(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ":" + String(sec).padStart(2, "0");
}

// ── タップ記録 ──
function recordCue(type) {
  if (!player || typeof player.getCurrentTime !== "function") return;
  const t = parseFloat(player.getCurrentTime().toFixed(1));
  const entry = {
    time: t,
    type: type,
    text: type === "kakegoe" ? defaultKakegoe : "",
    hint: ""
  };
  cueData.push(entry);
  cueData.sort((a, b) => a.time - b.time);
  renderTable();
}

document.getElementById("btn-kakegoe").onclick = () => recordCue("kakegoe");
document.getElementById("btn-hakushu").onclick = () => recordCue("hakushu");

// ── キーボードショートカット ──
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
  if (e.key === "k" || e.key === "K") recordCue("kakegoe");
  if (e.key === "h" || e.key === "H") recordCue("hakushu");
});

// ── テーブル描画 ──
function renderTable() {
  const tbody = document.getElementById("cue-tbody");
  document.getElementById("cue-count").textContent = cueData.length;
  tbody.innerHTML = "";
  cueData.forEach((c, i) => {
    const tr = document.createElement("tr");

    // 時間
    const tdTime = document.createElement("td");
    tdTime.className = "time-cell";
    tdTime.textContent = fmtTimeShort(c.time) + " (" + c.time + "s)";
    tr.appendChild(tdTime);

    // 種類
    const tdType = document.createElement("td");
    const sel = document.createElement("select");
    ["kakegoe","hakushu"].forEach(v => {
      const opt = document.createElement("option");
      opt.value = v; opt.textContent = v === "kakegoe" ? "🎤 掛け声" : "👏 拍手";
      if (v === c.type) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.onchange = () => { c.type = sel.value; if (c.type === "hakushu") c.text = ""; renderTable(); };
    tdType.appendChild(sel);
    tr.appendChild(tdType);

    // テキスト
    const tdText = document.createElement("td");
    if (c.type === "kakegoe") {
      const selT = document.createElement("select");
      kakegoeTexts.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t; opt.textContent = t;
        if (t === c.text) opt.selected = true;
        selT.appendChild(opt);
      });
      selT.onchange = () => { c.text = selT.value; };
      tdText.appendChild(selT);
    } else {
      tdText.innerHTML = "<span style='color:#666'>（拍手）</span>";
    }
    tr.appendChild(tdText);

    // ヒント
    const tdHint = document.createElement("td");
    const inp = document.createElement("input");
    inp.value = c.hint; inp.placeholder = "例: 弁天小僧 登場";
    inp.oninput = () => { c.hint = inp.value; };
    tdHint.appendChild(inp);
    tr.appendChild(tdHint);

    // 削除
    const tdDel = document.createElement("td");
    const btnDel = document.createElement("button");
    btnDel.className = "del-btn"; btnDel.textContent = "✕";
    btnDel.onclick = () => { cueData.splice(i, 1); renderTable(); };
    tdDel.appendChild(btnDel);
    tr.appendChild(tdDel);

    tbody.appendChild(tr);
  });
}

// ── エクスポート ──
document.getElementById("btn-export").onclick = () => {
  const lines = cueData.map(c => {
    if (c.type === "kakegoe") {
      return '      { time: ' + c.time + ', type: "kakegoe", text: "' + c.text + '", hint: "' + c.hint + '" }';
    } else {
      return '      { time: ' + c.time + ', type: "hakushu", hint: "' + c.hint + '" }';
    }
  });
  const vid = document.getElementById("video-id").value.trim();
  const out = "cues: [\\n" + lines.join(",\\n") + "\\n    ]";
  document.getElementById("export-box").value = out;
};

document.getElementById("btn-copy").onclick = () => {
  const box = document.getElementById("export-box");
  navigator.clipboard.writeText(box.value).then(() => {
    const msg = document.getElementById("copy-msg");
    msg.style.opacity = "1";
    setTimeout(() => { msg.style.opacity = "0"; }, 2000);
  });
};

renderTable();
<\/script>
</body>
</html>`;
}
