// =============================================================
// 台詞道場 — /training/serifu
// 弁天小僧「知らざぁ言って聞かせやしょう」
// =============================================================
const SERIFU_CUES = [
  { time: 9.1, type: "serifu", text: "知らざあ言って聞かせやしょう" },
  { time: 19.3, type: "pause" },
  { time: 30.5, type: "serifu", text: "浜の真砂と五右衛門が" },
  { time: 35.1, type: "serifu", text: "歌に残した盗人の" },
  { time: 39.2, type: "serifu", text: "種は尽きねぇ七里が浜" },
  { time: 44.7, type: "serifu", text: "その白浪の夜働き" },
  { time: 48.2, type: "serifu", text: "以前を言やァ江の島で" },
  { time: 51.5, type: "serifu", text: "年季勤めの稚児ヶ渕" },
  { time: 56.8, type: "serifu", text: "百味で散らす蒔銭を" },
  { time: 59.7, type: "serifu", text: "当に小皿の一文子" },
  { time: 64.6, type: "serifu", text: "百が二百と賽銭の" },
  { time: 68.3, type: "serifu", text: "くすね銭せえだんだんに" },
  { time: 72.6, type: "serifu", text: "悪事はのぼる上の宮" },
  { time: 80.8, type: "serifu", text: "岩本院で講中の" },
  { time: 83.7, type: "serifu", text: "枕さがしも度重なり" },
  { time: 88, type: "serifu", text: "お手長講と札附きに" },
  { time: 91.2, type: "serifu", text: "とうとう島を追い出され" },
  { time: 97.7, type: "serifu", text: "それから若衆の美人局" },
  { time: 101.8, type: "serifu", text: "ここやかしこの寺島で" },
  { time: 105.4, type: "serifu", text: "小耳に聞いた音羽屋の" },
  { time: 108.9, type: "serifu", text: "似ぬ声色で小ゆすりかたり" },
  { time: 118.3, type: "serifu", text: "名さえ由縁（ゆかり）の弁天小僧" },
  { time: 124.4, type: "serifu", text: "菊之助たァおれがことだ" },
];

export function serifuPageHTML() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>台詞道場 ─ 知らざぁ言って聞かせやしょう | 気良歌舞伎</title>
<style>
  :root {
    --kuro:#1a1a1a; --aka:#C41E3A; --moegi:#6B8E23;
    --kin:#C5A55A; --shiro:#F5F0E8; --murasaki:#7B2D8E;
  }
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:"Noto Serif JP","Yu Mincho","Hiragino Mincho ProN",serif;
    background:var(--kuro);color:var(--shiro);min-height:100vh;
    overflow-x:hidden;}

  .joshikimaku{height:8px;background:repeating-linear-gradient(90deg,
    var(--kuro) 0%,var(--kuro) 33.33%,
    var(--moegi) 33.33%,var(--moegi) 66.66%,
    var(--aka) 66.66%,var(--aka) 100%);}

  #intro{max-width:640px;margin:0 auto;padding:1.5rem 1rem;text-align:center;}
  #intro h1{font-size:1.7rem;letter-spacing:0.2em;color:var(--kin);
    margin:0.5rem 0 0.3rem;text-shadow:0 2px 8px rgba(0,0,0,0.7);}
  #intro .subtitle{font-size:1rem;color:#bbb;letter-spacing:0.1em;margin-bottom:1.2rem;}
  #start-btn{display:inline-block;margin:1rem 0;padding:1rem 2.5rem;
    background:linear-gradient(135deg,var(--murasaki) 0%,#5a1a6a 100%);
    color:#fff;border:2px solid var(--kin);border-radius:14px;
    font-size:1.2rem;font-family:inherit;letter-spacing:0.2em;
    cursor:pointer;transition:all 0.2s;text-shadow:0 2px 4px rgba(0,0,0,0.5);}
  #start-btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(123,45,142,0.4);}
  #start-btn:active{transform:scale(0.97);}
  .intro-hint{font-size:0.85rem;color:#777;margin-top:0.8rem;line-height:1.6;}

  #stage{max-width:720px;margin:0 auto;position:relative;display:none;}
  #player-wrap{position:relative;width:100%;padding-top:56.25%;background:#000;}
  #player-wrap iframe{position:absolute;top:0;left:0;width:100%;height:100%;}

  /* 台詞表示（カラオケ風） */
  #serifu-zone{max-width:720px;margin:0.8rem auto;padding:1rem 1.2rem;display:none;
    background:linear-gradient(180deg,#1a1518 0%,#251a22 100%);
    border:2px solid rgba(123,45,142,0.5);border-radius:14px;
    min-height:120px;}
  #serifu-current{font-size:1.5rem;line-height:1.6;color:var(--shiro);
    letter-spacing:0.12em;text-align:center;margin-bottom:0.5rem;
    transition:opacity 0.25s ease;}
  #serifu-current.empty{color:#555;font-size:1.1rem;}
  #serifu-next{font-size:0.95rem;color:#888;text-align:center;
    letter-spacing:0.08em;min-height:1.6em;}
  #serifu-next .label{font-size:0.7rem;color:#666;margin-bottom:0.2rem;}

  #time-display{text-align:center;font-size:1rem;color:var(--kin);
    font-variant-numeric:tabular-nums;padding:0.4rem 0;display:none;}

  footer{text-align:center;padding:1.2rem;font-size:0.85rem;color:#555;
    border-top:1px solid #333;margin-top:2rem;}
  footer a{color:var(--kin);text-decoration:none;}
</style>
</head>
<body>

<div class="joshikimaku"></div>

<div id="intro">
  <h1>🎙️ 台詞道場</h1>
  <div class="subtitle">弁天小僧「知らざぁ言って聞かせやしょう」</div>
  <p class="intro-hint">動画に合わせて、表示される台詞を声に出して読んでみよう。</p>
  <button id="start-btn">🎭 稽古をはじめる</button>
</div>

<div id="stage">
  <div id="player-wrap"><div id="player"></div></div>
  <div id="time-display">0:00</div>
  <div id="serifu-zone">
    <div id="serifu-current" class="empty">再生すると台詞がここに表示されます</div>
    <div id="serifu-next"><span class="label">つぎ</span> <span id="serifu-next-text"></span></div>
  </div>
</div>

<div class="joshikimaku"></div>
<footer><a href="/training">稽古モードへ戻る</a></footer>

<script>
(function() {
  var cues = ${JSON.stringify(SERIFU_CUES)};
  var serifuOnly = cues.filter(function(c) { return c.type === "serifu"; });
  var player = null;
  var ticker = null;

  function getCurrentSerifuIndex(t) {
    var idx = -1;
    for (var i = 0; i < cues.length; i++) {
      if (cues[i].type === "serifu" && cues[i].time <= t) idx = i;
    }
    return idx;
  }

  function getSerifuIndexFromCues(idx) {
    var n = 0;
    for (var i = 0; i < cues.length; i++) {
      if (cues[i].type === "serifu") {
        if (n === idx) return i;
        n++;
      }
    }
    return -1;
  }

  function updateSerifu(t) {
    var i = getCurrentSerifuIndex(t);
    var currentEl = document.getElementById("serifu-current");
    var nextEl = document.getElementById("serifu-next-text");
    if (i < 0) {
      currentEl.textContent = "…";
      currentEl.className = "empty";
      nextEl.textContent = serifuOnly[0] ? serifuOnly[0].text : "";
      return;
    }
    var c = cues[i];
    if (c.type === "serifu") {
      currentEl.textContent = c.text;
      currentEl.className = "";
    } else {
      currentEl.className = "empty";
      currentEl.textContent = "（間）";
    }
    var nextCue = null;
    for (var j = i + 1; j < cues.length; j++) {
      if (cues[j].type === "serifu") { nextCue = cues[j]; break; }
    }
    nextEl.textContent = nextCue ? nextCue.text : "";
  }

  function startTicker() {
    if (ticker) return;
    ticker = setInterval(function() {
      if (!player || !player.getCurrentTime) return;
      var t = player.getCurrentTime();
      var m = Math.floor(t / 60);
      var s = Math.floor(t % 60);
      document.getElementById("time-display").textContent = m + ":" + (s < 10 ? "0" : "") + s;
      updateSerifu(t);
    }, 150);
  }
  function stopTicker() { if (ticker) { clearInterval(ticker); ticker = null; } }

  function loadVideo() {
    document.getElementById("intro").style.display = "none";
    document.getElementById("stage").style.display = "block";
    document.getElementById("serifu-zone").style.display = "block";
    document.getElementById("time-display").style.display = "block";
    if (player) return;
    window.onYouTubeIframeAPIReady = function() {
      player = new YT.Player("player", {
        videoId: "iFwMXYtqYA0",
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
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

  document.getElementById("start-btn").addEventListener("click", loadVideo);
})();
</script>
</body>
</html>`;
}
