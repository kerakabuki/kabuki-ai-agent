// src/kaisetsu_print_page.js
// =========================================================
// 気良歌舞伎 会場配布パンフ（A4・両面1枚） — /kerakabuki/kaisetsu/print
// 当日の演目解説を、客席で配る紙に組んだ印刷用ページ
//   ・前年は「字が小さくて読めない」と言われた。本文14pt、最小でも12pt
//   ・行は文節で折り返す（「一｜ヶ月」のような切れ方を避ける。Chrome・Edgeのみ有効）
//   ・白黒コピー前提。文字はすべて黒。網掛け・色文字・白抜きに頼らない
//   ・表：演目紹介・登場人物・第一場・QR　裏：第二場以降・おひねり
//   ・収まらない面は画面に警告を出す（切れて消えるより、はみ出して気づける方がよい）
// 内容は src/kera_kaisetsu.js（KAISETSU）が唯一の出所
// CSSプレフィックス: pp-
// =========================================================

import { KAISETSU as K } from "./kera_kaisetsu.js";

// 表面に載せる場の数。演目が替わって収まらなくなったらここで調整する
const FRONT_SCENES = 1;

// 解説ページ（https://kabukiplus.com/kerakabuki/kaisetsu）のQRコード。誤り訂正M・29×29モジュール
// 再生成方法: npm の qrcode で `QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 0 })` の path の d
const QR_PATH = "M0 0.5h7m5 0h2m2 0h4m2 0h7M0 1.5h1m5 0h1m4 0h1m3 0h3m2 0h1m1 0h1m5 0h1M0 2.5h1m1 0h3m1 0h1m1 0h1m5 0h2m4 0h1m1 0h1m1 0h3m1 0h1M0 3.5h1m1 0h3m1 0h1m1 0h1m1 0h1m1 0h4m1 0h1m1 0h1m2 0h1m1 0h3m1 0h1M0 4.5h1m1 0h3m1 0h1m1 0h1m2 0h1m2 0h1m1 0h5m1 0h1m1 0h3m1 0h1M0 5.5h1m5 0h1m1 0h1m1 0h1m2 0h1m1 0h4m1 0h1m1 0h1m5 0h1M0 6.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M8 7.5h2m1 0h1m2 0h1m4 0h2M0 8.5h1m1 0h5m2 0h2m2 0h2m2 0h1m1 0h1m2 0h5M0 9.5h2m1 0h3m1 0h1m2 0h1m1 0h1m3 0h1m1 0h7m3 0h1M4 10.5h5m1 0h2m2 0h3m3 0h5M0 11.5h2m2 0h2m1 0h4m1 0h1m1 0h1m1 0h1m2 0h1m2 0h4m1 0h1M0 12.5h4m2 0h1m3 0h1m1 0h3m2 0h1m5 0h1m1 0h2M1 13.5h2m2 0h1m1 0h4m1 0h1m1 0h1m4 0h6m3 0h1M0 14.5h1m2 0h1m1 0h2m3 0h2m2 0h5m2 0h2m2 0h2M0 15.5h1m1 0h2m1 0h1m1 0h1m4 0h1m2 0h1m2 0h3m3 0h1m2 0h1M2 16.5h2m1 0h2m1 0h3m2 0h2m2 0h1m1 0h1m5 0h2M0 17.5h2m5 0h1m1 0h2m3 0h1m1 0h1m1 0h2m2 0h3m1 0h1m1 0h1M0 18.5h1m1 0h3m1 0h3m1 0h1m1 0h2m1 0h2m1 0h1m1 0h2m1 0h2m1 0h1M0 19.5h1m2 0h3m2 0h3m1 0h1m1 0h1m4 0h1m1 0h1m2 0h1m2 0h1M0 20.5h1m1 0h1m3 0h2m2 0h1m1 0h3m2 0h1m2 0h5m1 0h3M8 21.5h2m2 0h1m1 0h1m1 0h5m3 0h5M0 22.5h7m3 0h1m1 0h1m1 0h7m1 0h1m1 0h3M0 23.5h1m5 0h1m1 0h2m1 0h1m2 0h3m2 0h2m3 0h1m2 0h2M0 24.5h1m1 0h3m1 0h1m1 0h1m3 0h1m2 0h3m2 0h5m1 0h3M0 25.5h1m1 0h3m1 0h1m1 0h3m1 0h2m2 0h1m1 0h2m5 0h4M0 26.5h1m1 0h3m1 0h1m1 0h1m1 0h3m2 0h1m2 0h2m1 0h7M0 27.5h1m5 0h1m2 0h5m5 0h2m1 0h2m1 0h1m1 0h1M0 28.5h7m1 0h1m3 0h1m2 0h1m1 0h1m1 0h1m1 0h1m4 0h1";

export function kaisetsuPrintPageHTML() {
  const esc = (s) => String(s ?? "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

  // 全○場（最後の場の番号から作る）
  const sceneCount = K.scenes.length ? K.scenes[K.scenes.length - 1].no : "";

  // 見どころ枠
  const watchBox = (w) => w ? `
      <div class="pp-watch${w.highlight ? " pp-watch-hi" : ""}">
        <p class="pp-watch-title">${w.highlight ? '<span class="pp-badge">見どころ</span>' : ""}${esc(w.title)}</p>
        <p class="pp-watch-text">${esc(w.text)}</p>
      </div>` : "";

  // 場の描画（表・裏共通）。引用がある場は、引用と見どころ枠を横並びにする
  const scene = (s) => `
    <article class="pp-scene">
      <header class="pp-scene-head">
        <span class="pp-scene-no">${esc(s.no)}</span>
        <h2 class="pp-scene-name">${esc(s.name)}<span class="pp-scene-yomi">${esc(s.yomi)}</span></h2>
      </header>
      <p class="pp-scene-summary">${esc(s.summary)}</p>
      ${(s.body || []).map(t => `<p class="pp-p">${esc(t)}</p>`).join("")}
      ${s.quote ? `<div class="pp-duo"><blockquote class="pp-quote">${esc(s.quote).replace(/\n/g, "<br>")}</blockquote>${watchBox(s.watch)}</div>` : watchBox(s.watch)}
    </article>`;

  const people = K.people.map(p => `
      <dt class="pp-person-name">${esc(p.name)}<span class="pp-person-yomi">${esc(p.yomi)}</span></dt><dd class="pp-person-desc">${esc(p.desc)}</dd>`).join("");

  const ohineri = K.ohineri.items.map(i => `
      <dt class="pp-oh-label">${esc(i.label)}</dt><dd>${esc(i.text)}</dd>`).join("");

  const frontScenes = K.scenes.slice(0, FRONT_SCENES).map(scene).join("");
  const backScenes = K.scenes.slice(FRONT_SCENES).map(scene).join("");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(K.title)} 会場配布パンフ（A4両面） — 気良歌舞伎</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/assets/kera-favicon-32.png" type="image/png" sizes="32x32">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&family=BIZ+UDPMincho:wght@400;700&display=swap" rel="stylesheet">
<style>${PP_CSS}</style>
</head>
<body>

<div class="pp-bar">
  <div class="pp-bar-in">
    <div class="pp-bar-text">
      <p class="pp-bar-title">会場配布パンフ（A4・両面1枚）</p>
      <p class="pp-bar-note">印刷の設定：Chrome か Edge で、用紙 A4／両面印刷（長辺とじ）／倍率 100%（実際のサイズ）／ヘッダーとフッターはオフ。白黒で刷っても読めるように組んであります。</p>
    </div>
    <button type="button" id="pp-print" class="pp-bar-btn">印刷する</button>
  </div>
</div>

<div id="pp-warn" role="alert" hidden></div>

<section class="pp-sheet pp-front" data-side="表面">
  <header class="pp-head">
    <p class="pp-kicker">${esc(K.event)}</p>
    <h1 class="pp-title">${esc(K.title)}</h1>
    <p class="pp-reading">${esc(K.reading)}</p>
    <p class="pp-meta">原作　${esc(K.author)}　／　全${esc(sceneCount)}場　／　${esc(K.date)}　${esc(K.venue)}</p>
  </header>

  <div class="pp-intro">
    ${K.intro.map(t => `<p class="pp-p">${esc(t)}</p>`).join("")}
  </div>

  <section class="pp-block">
    <h2 class="pp-h2">おもな登場人物</h2>
    <dl class="pp-people">${people}
    </dl>
  </section>

  ${frontScenes}

  <footer class="pp-front-foot">
    <svg class="pp-qr" viewBox="-4 -4 37 37" shape-rendering="crispEdges" role="img" aria-label="解説ページのQRコード"><path stroke="#000" d="${QR_PATH}"/></svg>
    <div class="pp-foot-text">
      <p class="pp-foot-lead">スマートフォンでも読めます</p>
      <p>QRコードをカメラで読み取ると、同じ解説を画面でご覧いただけます。</p>
      <p class="pp-url">kabukiplus.com/kerakabuki/kaisetsu</p>
    </div>
    <p class="pp-turn">裏面につづきます →</p>
  </footer>
</section>

<section class="pp-sheet pp-back" data-side="裏面">
  ${backScenes}

  <section class="pp-block pp-oh">
    <h2 class="pp-h2">おひねりの投げ方</h2>
    <p class="pp-p">${esc(K.ohineri.intro)}</p>
    <dl class="pp-oh-list">${ohineri}
    </dl>
  </section>

  <p class="pp-sign">気良歌舞伎一座</p>
</section>

<script>
(function () {
  // フォントを待ってから（無ければすぐ）
  var ready = function () {
    return (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  };

  // 印刷ボタン：フォントの読み込みを待ってから印刷ダイアログを出す
  document.getElementById("pp-print").addEventListener("click", function () {
    ready().then(function () { window.print(); });
  });

  // 収まり確認：各面が A4 の高さ（297mm）を超えていたら警告を出す
  ready().then(function () {
    var probe = document.createElement("div");
    probe.style.cssText = "position:absolute;visibility:hidden;width:1px;height:297mm;top:0;left:0;";
    document.body.appendChild(probe);
    var pageH = probe.getBoundingClientRect().height;
    probe.remove();

    var over = [];
    document.querySelectorAll(".pp-sheet").forEach(function (el) {
      if (el.getBoundingClientRect().height > pageH + 1) over.push(el.getAttribute("data-side"));
    });

    var warn = document.getElementById("pp-warn");
    if (over.length) {
      warn.textContent = over.join("・") + "がA4の1ページに収まっていません。このまま印刷すると次の用紙にはみ出します。";
      warn.hidden = false;
    } else {
      warn.hidden = true;
    }
  });
})();
</script>

</body>
</html>`;
}

const PP_CSS = `
@page { size: A4 portrait; margin: 0; }
:root { --pp-body: 14pt; --pp-lh: 1.6; }
* { margin: 0; padding: 0; box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body {
  font-family: "BIZ UDPGothic", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif;
  color: #000;
  background: #d6d3cd;
  font-size: var(--pp-body);
  line-height: var(--pp-lh);
  /* 文節で改行する。対応しないブラウザでは通常の改行になり、行数は増えない */
  word-break: auto-phrase;
}

/* ── 画面専用：操作バー ── */
.pp-bar {
  position: sticky; top: 0; z-index: 1;
  background: #1c1a17; color: #f3efe6;
  padding: 3mm 4mm;
}
.pp-bar-in {
  max-width: 210mm; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between; gap: 5mm;
}
.pp-bar-title { font-size: 13pt; font-weight: 700; }
.pp-bar-note { font-size: 11pt; line-height: 1.5; }
.pp-bar-btn {
  font: inherit; font-size: 13pt; font-weight: 700;
  background: #fff; color: #000; border: none;
  padding: 2mm 5mm; border-radius: 1mm; cursor: pointer; flex-shrink: 0;
}

/* ── 画面専用：収まり警告 ── */
#pp-warn {
  max-width: 210mm; margin: 4mm auto 0; padding: 3mm 4mm;
  border: .6mm solid #b3261e; background: #fdecea; color: #b3261e;
  font-size: 12pt; font-weight: 700;
}
#pp-warn[hidden] { display: none; }

/* ── 用紙 ── */
.pp-sheet {
  width: 210mm; min-height: 297mm;
  margin: 8mm auto; padding: 11mm 13mm 10mm;
  background: #fff;
  box-shadow: 0 1px 6px rgba(0,0,0,.25);
  display: flex; flex-direction: column;
}

@media print {
  body { background: #fff; }
  .pp-bar, #pp-warn { display: none !important; }
  .pp-sheet { margin: 0; box-shadow: none; }
  .pp-sheet + .pp-sheet { break-before: page; }
}

/* ── 表題 ── */
.pp-head {
  text-align: center;
  padding-bottom: 4mm; border-bottom: 1.2mm double #000; margin-bottom: 5mm;
}
.pp-kicker { font-size: 13pt; letter-spacing: .2em; }
.pp-title {
  font-family: "BIZ UDPMincho", "Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", serif;
  font-weight: 700; font-size: 38pt;
  letter-spacing: .25em; padding-left: .25em; /* 字間ぶんの中央補正 */
  line-height: 1.3; margin: 1.5mm 0 .5mm;
}
.pp-reading { font-size: 12pt; letter-spacing: .2em; }
.pp-meta { font-size: 13pt; margin-top: 2.5mm; }

/* ── 本文 ── */
.pp-intro { margin-bottom: 4mm; }
.pp-p { margin-bottom: 1.5mm; }
.pp-p:last-child { margin-bottom: 0; }
.pp-h2 {
  font-size: 15pt; font-weight: 700; letter-spacing: .1em; line-height: 1.5;
  border-bottom: .4mm solid #000; padding-bottom: .8mm; margin-bottom: 2.5mm;
}
.pp-block { margin-top: 5mm; }
.pp-intro + .pp-block { margin-top: 0; }

/* ── 登場人物 ── */
.pp-people {
  display: grid; grid-template-columns: 40mm 1fr;
  column-gap: 4mm; row-gap: 1.5mm; align-items: baseline;
}
.pp-person-name {
  font-family: "BIZ UDPMincho", "Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", serif;
  font-weight: 700; font-size: 15pt;
}
.pp-person-yomi {
  font-family: "BIZ UDPGothic", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif;
  font-weight: 400; font-size: 12pt; margin-left: 2mm;
}

/* ── 場 ── */
.pp-scene { margin-top: 5mm; break-inside: avoid; }
.pp-scene-head { display: flex; align-items: center; gap: 3.5mm; margin-bottom: 2mm; }
.pp-scene-no {
  font-family: "BIZ UDPMincho", "Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", serif;
  font-weight: 700; font-size: 16pt; line-height: 1;
  width: 10mm; height: 10mm; border: .5mm solid #000; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.pp-scene-name {
  font-family: "BIZ UDPMincho", "Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", serif;
  font-weight: 700; font-size: 18pt; letter-spacing: .08em; line-height: 1.3;
}
.pp-scene-yomi {
  font-family: "BIZ UDPGothic", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif;
  font-weight: 400; font-size: 12pt; letter-spacing: .1em; margin-left: 3mm;
}
.pp-scene-summary { font-weight: 700; margin-bottom: 1.5mm; }

/* ── 見どころ枠 ── */
.pp-watch {
  border: .5mm solid #000; border-radius: 1.5mm;
  padding: 2.5mm 4mm; margin-top: 2.5mm;
}
.pp-watch-hi { border-width: 1mm; }
.pp-watch-title { font-weight: 700; font-size: 14pt; margin-bottom: .8mm; }
.pp-badge {
  display: inline-block; border: .4mm solid #000;
  font-size: 12pt; line-height: 1.4; padding: 0 2mm; margin-right: 2.5mm;
  letter-spacing: .1em; vertical-align: .1em;
}

/* ── 引用＋見どころ（横並び） ── */
.pp-duo {
  display: grid; grid-template-columns: auto 1fr;
  column-gap: 6mm; align-items: start; margin-top: 2.5mm;
}
.pp-duo .pp-watch { margin-top: 0; }
.pp-quote {
  font-family: "BIZ UDPMincho", "Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", serif;
  font-weight: 400; font-size: 14pt; line-height: 1.75; letter-spacing: .05em;
  border-left: 1mm solid #000; padding: .5mm 0 .5mm 4.5mm;
  white-space: nowrap;
}

/* ── おひねり ── */
.pp-oh-list {
  display: grid; grid-template-columns: 40mm 1fr;
  column-gap: 4mm; row-gap: 1.5mm; margin-top: 2mm;
}
.pp-oh-label { font-weight: 700; }

/* ── 表面の下端：QR ── */
/* 直前のブロックとの間に最低 4mm の余白を残す */
.pp-front > :nth-last-child(2) { margin-bottom: 4mm; }
.pp-front-foot {
  margin-top: auto; padding-top: 4mm; border-top: .4mm solid #000;
  display: flex; align-items: center; gap: 4.5mm;
}
.pp-qr { width: 26mm; height: 26mm; flex-shrink: 0; }
.pp-foot-text { flex: 1; font-size: 13pt; line-height: 1.55; }
.pp-foot-lead { font-weight: 700; }
.pp-url { font-size: 12pt; }
.pp-turn { font-size: 13pt; font-weight: 700; white-space: nowrap; align-self: flex-end; }

/* ── 裏面の下端：署名 ── */
.pp-sign {
  margin-top: auto; padding-top: 4mm; text-align: right;
  font-family: "BIZ UDPMincho", "Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", serif;
  font-weight: 700; font-size: 14pt; letter-spacing: .2em;
}
`;
