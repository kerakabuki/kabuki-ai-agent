// =============================================================
// 台詞道場 キュー編集ツール — /training/serifu/editor
// =============================================================
export function serifuEditorHTML() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>台詞キュー編集 - KABUKI DOJO</title>
<style>
  :root{--kuro:#1a1a1a;--aka:#C41E3A;--moegi:#6B8E23;--kin:#C5A55A;--shiro:#F5F0E8;--murasaki:#7B2D8E;}
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

  /* ── 台詞入力 + タップエリア ── */
  .serifu-input-area{max-width:760px;margin:0 auto;padding:0 1rem;display:none;}
  .serifu-input-area h3{font-size:0.9rem;color:var(--kin);margin-bottom:0.5rem;}
  #serifu-text{width:100%;padding:0.6rem 0.8rem;border:1px solid #555;
    border-radius:6px;background:#222;color:var(--shiro);font-size:1rem;
    font-family:inherit;margin-bottom:0.5rem;}
  .tap-row{display:flex;gap:0.6rem;margin-bottom:0.8rem;}
  .tap-row button{flex:1;padding:1rem;border-radius:12px;font-size:1.1rem;
    font-family:inherit;cursor:pointer;border:2px solid;transition:transform 0.1s;}
  .tap-row button:active{transform:scale(0.95);}
  #btn-serifu{background:#2a1a3a;color:var(--shiro);border-color:var(--murasaki);}
  #btn-serifu:active{background:var(--murasaki);}
  #btn-pause-mark{background:#1a2a2a;color:var(--shiro);border-color:#4FC3F7;}
  #btn-pause-mark:active{background:#0288D1;}

  .help-text{font-size:0.75rem;color:#888;line-height:1.5;margin-bottom:0.5rem;
    background:#111;padding:0.6rem;border-radius:6px;border-left:3px solid var(--murasaki);}

  /* ── 台詞テンプレート ── */
  .template-area{max-width:760px;margin:0 auto;padding:0 1rem;display:none;}
  .template-area h3{font-size:0.9rem;color:var(--kin);margin-bottom:0.5rem;
    border-left:3px solid var(--murasaki);padding-left:0.6rem;}
  #template-box{width:100%;min-height:100px;background:#111;color:#ccc;
    border:1px solid #333;border-radius:6px;padding:0.6rem;font-family:inherit;
    font-size:0.85rem;resize:vertical;line-height:1.8;}
  .template-btns{margin-top:0.5rem;display:flex;gap:0.5rem;margin-bottom:1rem;}
  .template-btns button{padding:0.4rem 1rem;border:none;border-radius:6px;
    cursor:pointer;font-size:0.85rem;font-family:inherit;background:var(--murasaki);color:#fff;font-weight:bold;}

  /* ── キューリスト ── */
  #cue-list-wrap{max-width:760px;margin:1rem auto;padding:0 1rem;}
  #cue-list-wrap h2{font-size:0.95rem;color:var(--kin);margin-bottom:0.5rem;
    border-left:3px solid var(--aka);padding-left:0.6rem;}
  table{width:100%;border-collapse:collapse;font-size:0.8rem;}
  th{text-align:left;color:#999;padding:0.3rem 0.4rem;border-bottom:1px solid #333;}
  td{padding:0.3rem 0.4rem;border-bottom:1px solid #222;vertical-align:middle;}
  .time-cell{color:var(--kin);font-variant-numeric:tabular-nums;white-space:nowrap;font-weight:bold;}
  .type-serifu{color:var(--murasaki);} .type-pause{color:#4FC3F7;}
  td input,td select{background:#222;color:var(--shiro);border:1px solid #444;
    border-radius:4px;padding:0.25rem 0.4rem;font-size:0.8rem;font-family:inherit;width:100%;}
  .del-btn{background:none;border:none;color:#666;cursor:pointer;font-size:1rem;}
  .del-btn:hover{color:var(--aka);}
  .adj-btn{background:#333;border:1px solid #555;color:var(--kin);cursor:pointer;
    font-size:0.85rem;width:24px;height:24px;border-radius:4px;line-height:1;
    font-weight:bold;padding:0;vertical-align:middle;}
  .adj-btn:hover{background:#444;border-color:var(--kin);}
  .adj-btn:active{background:var(--kin);color:var(--kuro);}

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
  <h1>🎤 台詞キュー編集ツール</h1>
  <p>動画を再生しながらタップ → 台詞の開始タイミングを自動記録</p>
</header>
<div class="bar"></div>

<div class="preset-area" style="max-width:760px;margin:1rem auto;padding:0 1rem;">
  <h3 style="font-size:0.9rem;color:var(--kin);margin-bottom:0.5rem;border-left:3px solid var(--kin);padding-left:0.6rem;">プリセット選択</h3>
  <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
    <button class="preset-btn" data-vid="iFwMXYtqYA0" data-id="benten" style="padding:0.5rem 1rem;border:1px solid #555;border-radius:8px;background:#222;color:var(--shiro);cursor:pointer;font-family:inherit;font-size:0.85rem;">🎭 弁天小僧（浜松屋）</button>
    <button class="preset-btn" data-vid="JsXKbp5oUBo" data-id="gonin_daemon" style="padding:0.5rem 1rem;border:1px solid #555;border-radius:8px;background:#222;color:var(--shiro);cursor:pointer;font-family:inherit;font-size:0.85rem;">👹 日本駄右衛門</button>
    <button class="preset-btn" data-vid="mN1FqZXeLjM" data-id="gonin_benten" style="padding:0.5rem 1rem;border:1px solid #555;border-radius:8px;background:#222;color:var(--shiro);cursor:pointer;font-family:inherit;font-size:0.85rem;">🌸 弁天小僧（勢揃い）</button>
    <button class="preset-btn" data-vid="RGaNSktrUSE" data-id="gonin_tadanobu" style="padding:0.5rem 1rem;border:1px solid #555;border-radius:8px;background:#222;color:var(--shiro);cursor:pointer;font-family:inherit;font-size:0.85rem;">🌙 忠信利平</button>
    <button class="preset-btn" data-vid="okvHgcAI2UM" data-id="gonin_akaboshi" style="padding:0.5rem 1rem;border:1px solid #555;border-radius:8px;background:#222;color:var(--shiro);cursor:pointer;font-family:inherit;font-size:0.85rem;">⭐ 赤星十三郎</button>
    <button class="preset-btn" data-vid="JpL3ost8nU8" data-id="gonin_nango" style="padding:0.5rem 1rem;border:1px solid #555;border-radius:8px;background:#222;color:var(--shiro);cursor:pointer;font-family:inherit;font-size:0.85rem;">🌊 南郷力丸</button>
  </div>
</div>

<div class="input-row">
  <input id="video-id" placeholder="YouTube動画ID（例: iFwMXYtqYA0）" value="">
  <button id="btn-load">動画を読み込む</button>
</div>

<div id="stage">
  <div id="player-wrap"><div id="player"></div></div>
</div>
<div id="time-display">0:00.0</div>

<!-- 台詞テンプレート（事前入力） -->
<div class="template-area" id="template-area">
  <h3>台詞テンプレート（1行1台詞）</h3>
  <textarea id="template-box" placeholder="台詞を1行ずつ入力してください。&#10;例:&#10;知らざぁ言って聞かせやしょう&#10;浜の真砂と五右衛門が&#10;..."></textarea>
  <div class="template-btns">
    <button id="btn-load-template">台詞を読み込む</button>
  </div>
</div>

<!-- タップエリア -->
<div class="serifu-input-area" id="serifu-area">
  <div class="help-text">
    📌 <strong>使い方：</strong>動画を再生しながら、台詞が始まるタイミングで「台詞タップ」を押してください。<br>
    テンプレートを読み込むと、次の台詞が自動で入ります。手動で入力もOK。<br>
    「間（ま）」は台詞の切れ目（無音の区間）をマークできます。
  </div>
  <div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.5rem;">
    <span style="font-size:0.8rem;color:#999;white-space:nowrap;">次の台詞:</span>
    <input id="serifu-text" placeholder="台詞テキスト（例: 知らざぁ言って聞かせやしょう）">
  </div>
  <div class="tap-row">
    <button id="btn-serifu">🎤 台詞タップ</button>
    <button id="btn-pause-mark">⏸ 間（ま）</button>
  </div>
</div>

<div id="cue-list-wrap">
  <h2>記録されたキュー (<span id="cue-count">0</span>)</h2>
  <table>
    <thead><tr><th>時間</th><th>種類</th><th>台詞テキスト</th><th></th></tr></thead>
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

<footer><a href="/kabuki/dojo">← KABUKI DOJO へ戻る</a></footer>

<script>
// ── preset templates ──
var PRESET_TEMPLATES = {
  benten: "知らざぁ言って聞かせやしょう\\n浜の真砂と五右衛門が\\n歌に残した盗人の\\n種は尽きねぇ七里が浜\\nその白浪の夜働き\\n以前を言やァ江の島で\\n年季勤めの稚児ヶ渕\\n百味で散らす蒔銭を\\n当に小皿の一文子\\n百が二百と賽銭の\\nくすね銭せえだんだんに\\n悪事はのぼる上の宮\\n岩本院で講中の\\n枕さがしも度重なり\\nお手長講と札附きに\\nとうとう島を追い出され\\nそれから若衆の美人局\\nここやかしこの寺島で\\n小耳に聞いた音羽屋の\\n似ぬ声色で小ゆすりかたり\\n名さえ由縁の弁天小僧\\n菊之助たァおれがことだ",
  gonin_daemon: "問われて名乗るも　おこがましいが\\n生まれは遠州浜松在\\n十四の年から親に放れ\\n身の生業も白浪の\\n沖を越えたる夜働き\\n盗みはすれど非道はせず\\n人に情けを掛川から\\n金谷をかけて宿々で\\n義賊と噂　高札に\\n回る配布の盥越し\\n危ねえその身の境涯も\\n最早四十に人間の　定めは僅か五十年\\n六十余州に隠れのねえ\\n賊徒の張本、日本駄右衛門",
  gonin_benten: "さて、その次ぎは江ノ島の\\n岩本院の稚児上がり\\nふだん着慣れし　振袖から\\n髷も島田に　由比ヶ浜\\n打ち込む浪に　しっぽりと\\n女に化けて　美人局\\n油断のならぬ　小娘も\\n小袋坂に　身の破れ\\n悪い浮名も　龍ノ口\\n土の牢へも　二度三度\\nだんだん越ゆる　鳥居数\\n八幡さまの　氏子にて\\n鎌倉無宿と　肩書きも\\n島に育って　その名せえ\\n弁天小僧、菊之助",
  gonin_tadanobu: "続いて後に　控えしは\\n月の武蔵の　江戸育ち\\n幼児の折から　手癖が悪く\\n抜け参りから　ぐれ出して\\n旅をかせぎに　西国を\\n回って首尾も　吉野山\\nまぶな仕事も　大峯に\\n足を留めたる　奈良の京\\n碁打ちと言って　寺々や\\n豪家へ入り込み　盗んだる\\n金が御嶽の　罪科は\\n蹴抜けの塔の　二重三重\\n重なる悪事に　高飛びなし\\n後を隠せし　判官の\\n御名前騙りの　忠信利平",
  gonin_akaboshi: "またその次に　列なるは\\n以前は武家の　中小姓\\n故主のために　切取りも\\n鈍き刃の　腰越や\\n砥上ヶ原に　身の錆を\\n砥ぎなおしても　抜け兼ぬる\\n盗み心の　深翠り\\n柳の都　谷七郷\\n花水橋の　切取りから\\n今牛若と　名も高く\\n忍ぶ姿も　人の目に\\n月影ヶ谷　神輿ヶ嶽\\n今日ぞ命の　明け方に\\n消ゆる間近き　星月夜\\nその名も　赤星十三郎",
  gonin_nango: "さてどんじりに　控えしは\\n潮風荒き　小ゆるぎの\\n磯馴れの松の　曲がりなり\\n人となったる　浜育ち\\n仁義の道も　白川の\\n夜船へ乗り込む　船盗人\\n波にきらめく　稲妻の\\n白刃で脅す　人殺し\\n背負って立たれぬ　罪科は\\nその身に重き　虎ヶ石\\n悪事千里と　言うからは\\nどうで終いは　木の空と\\n覚悟は予て　鴫立沢\\n然し哀れは　身に知らぬ\\n念仏嫌えの　南郷力丸",
};

// ── state ──
let player = null;
let cueData = []; // { time, type, text }
let ticker = null;
let templateLines = [];
let templateIndex = 0;

// ── YouTube IFrame API ──
function loadYT(videoId) {
  document.getElementById("stage").style.display = "block";
  document.getElementById("serifu-area").style.display = "block";
  document.getElementById("template-area").style.display = "block";
  if (player) { player.loadVideoById(videoId); return; }
  window.onYouTubeIframeAPIReady = function() {
    player = new YT.Player("player", {
      videoId: videoId,
      playerVars: { rel: 0, modestbranding: 1 },
      events: {
        onReady: function() {},
        onStateChange: function(e) {
          if (e.data === YT.PlayerState.PLAYING) startTicker();
          else stopTicker();
        }
      }
    });
  };
  var tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

function startTicker() {
  stopTicker();
  ticker = setInterval(function() {
    if (!player || !player.getCurrentTime) return;
    var t = player.getCurrentTime();
    var m = Math.floor(t / 60);
    var s = (t % 60).toFixed(1).padStart(4, "0");
    document.getElementById("time-display").textContent = m + ":" + s;
  }, 100);
}
function stopTicker() { if (ticker) { clearInterval(ticker); ticker = null; } }

// ── Template ──
document.getElementById("btn-load-template").addEventListener("click", function() {
  var raw = document.getElementById("template-box").value.trim();
  templateLines = raw.split("\\n").map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
  templateIndex = 0;
  if (templateLines.length > 0) {
    document.getElementById("serifu-text").value = templateLines[0];
  }
  alert(templateLines.length + " 行の台詞を読み込みました！動画を再生してタイミングをタップしてね。");
});

function advanceTemplate() {
  templateIndex++;
  if (templateIndex < templateLines.length) {
    document.getElementById("serifu-text").value = templateLines[templateIndex];
  } else {
    document.getElementById("serifu-text").value = "";
    document.getElementById("serifu-text").placeholder = "（全台詞タップ済み）";
  }
}

// ── Record cue ──
function recordCue(type) {
  if (!player || !player.getCurrentTime) return;
  var t = player.getCurrentTime();
  var text = "";
  if (type === "serifu") {
    text = document.getElementById("serifu-text").value.trim();
    if (!text) { alert("台詞テキストを入力してね！"); return; }
    advanceTemplate();
  }
  cueData.push({ time: parseFloat(t.toFixed(1)), type: type, text: text });
  cueData.sort(function(a, b) { return a.time - b.time; });
  renderTable();
}

// ── Render ──
function renderTable() {
  var tbody = document.getElementById("cue-tbody");
  tbody.innerHTML = "";
  document.getElementById("cue-count").textContent = cueData.length;
  for (var i = 0; i < cueData.length; i++) {
    (function(idx) {
      var c = cueData[idx];
      var tr = document.createElement("tr");

      var tdTime = document.createElement("td");
      tdTime.className = "time-cell";
      tdTime.style.whiteSpace = "nowrap";
      var btnMinus = document.createElement("button");
      btnMinus.textContent = "−";
      btnMinus.className = "adj-btn";
      btnMinus.addEventListener("click", function() { cueData[idx].time = Math.max(0, parseFloat((cueData[idx].time - 0.1).toFixed(1))); renderTable(); });
      tdTime.appendChild(btnMinus);
      var timeSpan = document.createElement("span");
      timeSpan.style.cursor = "pointer";
      timeSpan.style.padding = "0 4px";
      timeSpan.style.minWidth = "50px";
      timeSpan.style.display = "inline-block";
      timeSpan.style.textAlign = "center";
      var m = Math.floor(c.time / 60);
      var s = (c.time % 60).toFixed(1).padStart(4, "0");
      timeSpan.textContent = m + ":" + s;
      timeSpan.addEventListener("click", function() {
        if (player && player.seekTo) player.seekTo(cueData[idx].time, true);
      });
      tdTime.appendChild(timeSpan);
      var btnPlus = document.createElement("button");
      btnPlus.textContent = "+";
      btnPlus.className = "adj-btn";
      btnPlus.addEventListener("click", function() { cueData[idx].time = parseFloat((cueData[idx].time + 0.1).toFixed(1)); renderTable(); });
      tdTime.appendChild(btnPlus);
      tr.appendChild(tdTime);

      var tdType = document.createElement("td");
      tdType.className = c.type === "serifu" ? "type-serifu" : "type-pause";
      tdType.textContent = c.type === "serifu" ? "🎤 台詞" : "⏸ 間";
      tr.appendChild(tdType);

      var tdText = document.createElement("td");
      if (c.type === "serifu") {
        var inp = document.createElement("input");
        inp.value = c.text;
        inp.addEventListener("change", function() { cueData[idx].text = this.value; });
        tdText.appendChild(inp);
      } else {
        tdText.textContent = "—";
        tdText.style.color = "#555";
      }
      tr.appendChild(tdText);

      var tdDel = document.createElement("td");
      var delBtn = document.createElement("button");
      delBtn.className = "del-btn";
      delBtn.textContent = "✕";
      delBtn.addEventListener("click", function() { cueData.splice(idx, 1); renderTable(); });
      tdDel.appendChild(delBtn);
      tr.appendChild(tdDel);

      // 時間クリックでジャンプは timeSpan に移動済み

      tbody.appendChild(tr);
    })(i);
  }
}

// ── Export ──
function exportCues() {
  var lines = cueData.map(function(c) {
    if (c.type === "serifu") {
      return '  { time: ' + c.time + ', type: "serifu", text: "' + c.text.replace(/"/g, '\\\\"') + '" },';
    } else {
      return '  { time: ' + c.time + ', type: "pause" },';
    }
  });
  document.getElementById("export-box").value = "cues: [\\n" + lines.join("\\n") + "\\n]";
}

// ── Events ──
document.getElementById("btn-load").addEventListener("click", function() {
  var id = document.getElementById("video-id").value.trim();
  if (!id) return;
  // YouTube URL からIDを抽出
  var m = id.match(/(?:youtu\\.be\\/|v=)([a-zA-Z0-9_-]{11})/);
  if (m) id = m[1];
  loadYT(id);
});

document.getElementById("btn-serifu").addEventListener("click", function() { recordCue("serifu"); });
document.getElementById("btn-pause-mark").addEventListener("click", function() { recordCue("pause"); });
document.getElementById("btn-export").addEventListener("click", exportCues);
document.getElementById("btn-copy").addEventListener("click", function() {
  var box = document.getElementById("export-box");
  box.select();
  document.execCommand("copy");
  var msg = document.getElementById("copy-msg");
  msg.style.opacity = "1";
  setTimeout(function() { msg.style.opacity = "0"; }, 1500);
});

// ── Preset buttons ──
document.querySelectorAll(".preset-btn").forEach(function(btn) {
  btn.addEventListener("click", function() {
    var vid = btn.getAttribute("data-vid");
    var pid = btn.getAttribute("data-id");
    // Set video ID and load
    document.getElementById("video-id").value = vid;
    loadYT(vid);
    // Set template
    if (PRESET_TEMPLATES[pid]) {
      document.getElementById("template-box").value = PRESET_TEMPLATES[pid];
      templateLines = PRESET_TEMPLATES[pid].split("\\n").map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
      templateIndex = 0;
      if (templateLines.length > 0) {
        document.getElementById("serifu-text").value = templateLines[0];
      }
      // Clear previous cues
      cueData = [];
      renderTable();
    }
    // Highlight active button
    document.querySelectorAll(".preset-btn").forEach(function(b) { b.style.borderColor = "#555"; b.style.background = "#222"; });
    btn.style.borderColor = "var(--kin)";
    btn.style.background = "#2a2510";
  });
});

// キーボードショートカット（スペースで台詞タップ、Enterで間マーク）
document.addEventListener("keydown", function(e) {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
  if (e.code === "Space") { e.preventDefault(); recordCue("serifu"); }
  if (e.code === "Enter") { e.preventDefault(); recordCue("pause"); }
});
</script>

</body>
</html>`;
}
