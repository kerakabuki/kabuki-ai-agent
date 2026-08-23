// src/kaisetsu_page.js
// =========================================================
// 気良歌舞伎 当日の演目解説 — /kerakabuki/kaisetsu
// 開演前・幕間に、暗い客席で読まれる前提で作る
//   ・登録も何も要らずに読める（価値を先に渡す）
//   ・輝度を落とし、周囲の迷惑にならないようにする
//   ・文字は大きめ（暗所・高齢の読者）
//   ・幕間に読み返せるよう、三場へ飛べる目次を置く
// 内容は src/kera_kaisetsu.js（KAISETSU）が唯一の出所
// CSSプレフィックス: ks-
// =========================================================

import { KAISETSU as K } from "./kera_kaisetsu.js";

export function kaisetsuPageHTML() {
  const esc = (s) => String(s ?? "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

  const toc = K.scenes.map(s => `
    <a href="#scene-${esc(s.no)}" class="ks-toc-item">
      <span class="ks-toc-no">${esc(s.no)}</span>
      <span class="ks-toc-name">${esc(s.name)}${s.watch?.highlight ? '<em class="ks-toc-star">見どころ</em>' : ""}</span>
    </a>`).join("");

  const people = K.people.map(p => `
    <div class="ks-person">
      <div class="ks-person-name">${esc(p.name)}<span class="ks-person-yomi">${esc(p.yomi)}</span></div>
      <p class="ks-person-desc">${esc(p.desc)}</p>
    </div>`).join("");

  const scenes = K.scenes.map(s => `
    <article class="ks-scene" id="scene-${esc(s.no)}">
      <header class="ks-scene-head">
        <span class="ks-scene-no">${esc(s.no)}</span>
        <div>
          <h2 class="ks-scene-name">${esc(s.name)}</h2>
          <p class="ks-scene-yomi">${esc(s.yomi)}</p>
        </div>
      </header>
      <p class="ks-scene-summary">${esc(s.summary)}</p>
      ${s.body.map(t => `<p class="ks-p">${esc(t)}</p>`).join("")}
      ${s.quote ? `<blockquote class="ks-quote">${esc(s.quote).replace(/\n/g, "<br>")}</blockquote>` : ""}
      ${s.watch ? `
      <div class="ks-watch${s.watch.highlight ? " ks-watch-hi" : ""}">
        <p class="ks-watch-title">${esc(s.watch.title)}</p>
        <p class="ks-watch-text">${esc(s.watch.text)}</p>
      </div>` : ""}
    </article>`).join("");

  const ohineri = K.ohineri.items.map(i => `
    <div class="ks-oh-item">
      <span class="ks-oh-label">${esc(i.label)}</span>
      <p class="ks-oh-text">${esc(i.text)}</p>
    </div>`).join("");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(K.title)} 解説 — 気良歌舞伎</title>
<meta name="description" content="${esc(K.title)}（${esc(K.reading)}）全三場のあらすじと見どころ、おひねりの投げ方。気良歌舞伎の当日案内です。">
<meta property="og:title" content="${esc(K.title)} 解説 — 気良歌舞伎">
<meta property="og:description" content="全三場のあらすじと見どころ。">
<meta property="og:type" content="article">
<meta property="og:site_name" content="気良歌舞伎">
<link rel="icon" href="/assets/kera-favicon-32.png" type="image/png" sizes="32x32">
<meta name="theme-color" content="#07070a">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Noto+Sans+JP:wght@300;400;500;700&display=swap" rel="stylesheet">
<style>${KS_CSS}</style>
</head>
<body>

<header class="ks-hero">
  <p class="ks-kicker">令和八年　気良歌舞伎公演</p>
  <h1 class="ks-title">${esc(K.title)}</h1>
  <p class="ks-reading">${esc(K.reading)}</p>
  <p class="ks-meta">原作　${esc(K.author)}　／　全三場</p>
</header>

<div class="ks-dim-note">
  <p>暗い客席でも読めるよう、画面は暗めにしてあります。まわりの方のご迷惑にならないよう、明るさを下げてご覧ください。</p>
</div>

<main class="ks-main">

  <section class="ks-block">
    ${K.intro.map(t => `<p class="ks-p ks-p-lead">${esc(t)}</p>`).join("")}
  </section>

  <nav class="ks-toc" aria-label="場の目次">
    <p class="ks-toc-label">三場の構成</p>
    ${toc}
  </nav>

  <section class="ks-block">
    <h2 class="ks-h2">おもな登場人物</h2>
    <div class="ks-people">${people}</div>
  </section>

  ${scenes}

  <section class="ks-block ks-oh">
    <h2 class="ks-h2">おひねりの投げ方</h2>
    <p class="ks-p">${esc(K.ohineri.intro)}</p>
    <div class="ks-oh-list">${ohineri}</div>
  </section>

  <section class="ks-cta">
    <p class="ks-cta-lead">来年の公演案内も、お届けしましょうか。</p>
    <a href="/kerakabuki/annai" class="ks-cta-btn">案内の受け取り方法を選ぶ</a>
    <p class="ks-cta-sub">LINE・メール・郵送から選べます。いま決めなくても大丈夫です。</p>
  </section>

</main>

<footer class="ks-footer">
  <nav class="ks-footer-links">
    <a href="/kerakabuki/pc">アクセス・宿泊</a>
    <a href="/kerakabuki/guide">はじめての方へ</a>
    <a href="/kerakabuki">気良歌舞伎について</a>
  </nav>
  <p class="ks-footer-name">気良歌舞伎一座</p>
</footer>

</body>
</html>`;
}

const KS_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  font-family: "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif;
  background: #07070a;
  color: #c9c3b8;
  font-size: 17px;
  line-height: 2.05;
  -webkit-font-smoothing: antialiased;
  padding-bottom: 3rem;
}
a { color: inherit; }

/* ── HERO ── */
.ks-hero {
  padding: 3rem 1.4rem 2rem; text-align: center;
  border-bottom: 1px solid rgba(150,120,60,0.2);
}
.ks-kicker { font-size: 0.76rem; letter-spacing: 0.26em; color: #6d6252; margin-bottom: 1rem; }
.ks-title {
  font-family: "Noto Serif JP", serif; font-weight: 700;
  font-size: clamp(2rem, 11vw, 2.9rem); letter-spacing: 0.16em;
  color: #d9d2c4; line-height: 1.4;
}
.ks-reading { font-size: 0.8rem; letter-spacing: 0.24em; color: #6d6252; margin-top: 0.5rem; }
.ks-meta { font-size: 0.82rem; color: #857a68; margin-top: 1rem; letter-spacing: 0.08em; }

.ks-dim-note {
  background: rgba(150,120,60,0.07); padding: 0.9rem 1.4rem;
  border-bottom: 1px solid rgba(150,120,60,0.14);
}
.ks-dim-note p {
  max-width: 620px; margin: 0 auto;
  font-size: 0.8rem; line-height: 1.8; color: #7d7361;
}

.ks-main { max-width: 620px; margin: 0 auto; padding: 0 1.4rem; }
.ks-block { padding: 2.2rem 0; }
.ks-p { margin-bottom: 1rem; }
.ks-p:last-child { margin-bottom: 0; }
.ks-p-lead { color: #b5aea1; }
.ks-h2 {
  font-family: "Noto Serif JP", serif; font-size: 1.05rem; font-weight: 600;
  color: #a98f52; letter-spacing: 0.12em; margin-bottom: 1.1rem;
}

/* ── 目次 ── */
.ks-toc {
  border: 1px solid rgba(150,120,60,0.22); border-radius: 4px;
  padding: 1.1rem 1.2rem; margin: 0.5rem 0 1rem;
}
.ks-toc-label {
  font-size: 0.72rem; letter-spacing: 0.2em; color: #6d6252; margin-bottom: 0.8rem;
}
.ks-toc-item {
  display: flex; align-items: baseline; gap: 0.9rem;
  padding: 0.55rem 0; text-decoration: none;
  border-top: 1px solid rgba(150,120,60,0.12);
}
.ks-toc-item:first-of-type { border-top: none; }
.ks-toc-no {
  font-family: "Noto Serif JP", serif; font-size: 1.05rem; color: #a98f52;
  width: 1.4rem; flex-shrink: 0;
}
.ks-toc-name { font-size: 0.98rem; color: #c9c3b8; }
.ks-toc-star {
  font-style: normal; font-size: 0.68rem; letter-spacing: 0.1em;
  color: #b8722f; border: 1px solid rgba(184,114,47,0.5);
  border-radius: 2px; padding: 0.05rem 0.4rem; margin-left: 0.6rem;
}

/* ── 登場人物 ── */
.ks-people { display: grid; gap: 0.9rem; }
.ks-person { border-left: 2px solid rgba(150,120,60,0.3); padding-left: 0.9rem; }
.ks-person-name {
  font-family: "Noto Serif JP", serif; font-size: 1.05rem; color: #d9d2c4;
  letter-spacing: 0.08em;
}
.ks-person-yomi { font-family: "Noto Sans JP", sans-serif; font-size: 0.72rem; color: #6d6252; margin-left: 0.7rem; letter-spacing: 0.12em; }
.ks-person-desc { font-size: 0.9rem; color: #9c9384; line-height: 1.8; }

/* ── 場 ── */
.ks-scene { padding: 2.4rem 0; border-top: 1px solid rgba(150,120,60,0.16); }
.ks-scene-head { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.2rem; }
.ks-scene-no {
  font-family: "Noto Serif JP", serif; font-size: 1.7rem; color: #a98f52;
  width: 2.2rem; height: 2.2rem; line-height: 2.2rem; text-align: center;
  border: 1px solid rgba(169,143,82,0.45); border-radius: 50%; flex-shrink: 0;
}
.ks-scene-name {
  font-family: "Noto Serif JP", serif; font-size: 1.3rem; font-weight: 600;
  color: #d9d2c4; letter-spacing: 0.1em; line-height: 1.4;
}
.ks-scene-yomi { font-size: 0.72rem; color: #6d6252; letter-spacing: 0.14em; }
.ks-scene-summary { color: #b5aea1; margin-bottom: 1rem; }

.ks-quote {
  font-family: "Noto Serif JP", serif; font-size: 1.06rem; line-height: 2.4;
  color: #d9d2c4; letter-spacing: 0.06em;
  border-left: 2px solid #a98f52; padding: 0.4rem 0 0.4rem 1.2rem;
  margin: 1.4rem 0;
}

.ks-watch {
  border: 1px solid rgba(150,120,60,0.25); border-radius: 4px;
  padding: 1rem 1.1rem; margin-top: 1.4rem;
}
.ks-watch-hi { border-color: rgba(184,114,47,0.55); background: rgba(184,114,47,0.07); }
.ks-watch-title {
  font-size: 0.92rem; font-weight: 700; color: #a98f52;
  letter-spacing: 0.06em; margin-bottom: 0.4rem;
}
.ks-watch-hi .ks-watch-title { color: #c9873c; }
.ks-watch-text { font-size: 0.92rem; color: #a99f8f; line-height: 1.95; }

/* ── おひねり ── */
.ks-oh { border-top: 1px solid rgba(150,120,60,0.16); }
.ks-oh-list { display: grid; gap: 0.9rem; margin-top: 1.2rem; }
.ks-oh-item { border-left: 2px solid rgba(150,120,60,0.3); padding-left: 0.9rem; }
.ks-oh-label { font-size: 0.86rem; font-weight: 700; color: #a98f52; letter-spacing: 0.08em; }
.ks-oh-text { font-size: 0.9rem; color: #9c9384; line-height: 1.85; }

/* ── CTA ── */
.ks-cta {
  border-top: 1px solid rgba(150,120,60,0.16);
  padding: 2.4rem 0 1rem; text-align: center;
}
.ks-cta-lead { font-family: "Noto Serif JP", serif; font-size: 1.02rem; color: #c9c3b8; margin-bottom: 1.1rem; }
.ks-cta-btn {
  display: inline-block; text-decoration: none;
  border: 1px solid rgba(169,143,82,0.6); border-radius: 4px;
  padding: 0.8rem 1.6rem; color: #d9d2c4; font-size: 0.95rem; letter-spacing: 0.08em;
}
.ks-cta-sub { font-size: 0.8rem; color: #6d6252; margin-top: 0.9rem; }

/* ── FOOTER ── */
.ks-footer { max-width: 620px; margin: 2.5rem auto 0; padding: 1.6rem 1.4rem 0; border-top: 1px solid rgba(150,120,60,0.16); text-align: center; }
.ks-footer-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 1.1rem; margin-bottom: 1rem; }
.ks-footer-links a { font-size: 0.85rem; color: #857a68; text-decoration: none; }
.ks-footer-name { font-family: "Noto Serif JP", serif; font-size: 0.88rem; color: #6d6252; letter-spacing: 0.18em; }

a:focus-visible, .ks-toc-item:focus-visible { outline: 2px solid #a98f52; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
`;
