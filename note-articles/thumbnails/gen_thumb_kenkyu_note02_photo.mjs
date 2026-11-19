// 歌舞伎研究ノート2（note nef835206ef41）の見出し画像・写真主役版（1280×670）
// 1つ目の版（gen_thumb_kenkyu_note02.mjs＝研究ノート1と同じ明朝の三分割）が「イマイチ」だったので作り直し。2026-11-19 に D を採用して note に掲載
// 写真: 2021年 勢揃い公演 六段目の映像 0627-Cyusingura-Rokudanme.mp4 の 3596.0秒のコマ
//   （屏風の前で刀を少し抜いて横たえ、右手で髷を直している瞬間。コマは D:\気良歌舞伎\youtubeチャンネル用\サムネ画像\歌舞伎研究ノート\コマ\）
// 写真を全面に敷き、左を暗くして源ノ角ゴシック Black（Noto Sans JP 900）の題字を大きく置く（超訳ナビのサムネと同じ考え方）
// 使い方（リポジトリルートから）: node note-articles/thumbnails/gen_thumb_kenkyu_note02_photo.mjs [案のキー…]
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const FRAME = 'D:/気良歌舞伎/youtubeチャンネル用/サムネ画像/歌舞伎研究ノート/コマ/r6_kami_3596.0.jpg';
const OUTDIR = 'note-articles/thumbnails';

// 勘平が右寄り（全体の約7割の位置）に来る範囲（元 1920×1080）
const buf = await sharp(FRAME).extract({ left: 470, top: 318, width: 917, height: 480 })
  .resize(1280 * 2, 670 * 2).sharpen({ sigma: 0.8 }).modulate({ saturation: 1.05 }).jpeg({ quality: 92 }).toBuffer();
const img = `data:image/jpeg;base64,${buf.toString('base64')}`;

// l1＝白の前置き、l2＝黄の大文字
const VARIANTS = {
  'D_親殺しの直後': { l1: '親殺しの直後、', l1s: 64, l2: '髪を直す。', l2s: 128 },
  'E_なぜ今髪を': { l1: 'なぜ今、', l1s: 92, l2: '髪を？', l2s: 150 },
};
const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(VARIANTS);

const page = (v) => `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1280px;height:670px;overflow:hidden;background:#000}
.s{position:relative;width:1280px;height:670px;font-family:'Noto Sans JP',sans-serif;font-weight:900}
.ph{position:absolute;inset:0;background:url(${img}) center/cover}
.dark{position:absolute;inset:0;background:linear-gradient(90deg,rgba(8,8,14,.9) 0%,rgba(8,8,14,.78) 30%,rgba(8,8,14,.2) 52%,rgba(8,8,14,0) 62%)}
.tag{position:absolute;left:52px;top:52px;background:#C8102E;color:#fff;font-size:30px;padding:4px 18px 8px;letter-spacing:.04em}
.big{position:absolute;left:48px;color:#fff;line-height:1.05;-webkit-text-stroke:12px #05070f;paint-order:stroke fill;text-shadow:0 6px 18px rgba(0,0,0,.6)}
.y{color:#FFD54A}
.series{position:absolute;left:54px;bottom:44px;color:rgba(255,255,255,.92);font-weight:700;font-size:24px;letter-spacing:.08em;text-shadow:0 2px 8px #000}
</style></head><body><div class="s">
  <div class="ph"></div><div class="dark"></div>
  <div class="tag">忠臣蔵 六段目</div>
  <div class="big" style="top:${300 - v.l1s - 20}px;font-size:${v.l1s}px">${v.l1}</div>
  <div class="big y" style="top:300px;font-size:${v.l2s}px">${v.l2}</div>
  <div class="series">勘平の刀と屏風｜歌舞伎研究ノート2</div>
</div></body></html>`;

const browser = await puppeteer.launch({ headless: true, args: ['--font-render-hinting=none', '--force-color-profile=srgb'] });
try {
  const pg = await browser.newPage();
  await pg.setViewport({ width: 1280, height: 670, deviceScaleFactor: 1 });
  for (const k of keys) {
    await pg.setContent(page(VARIANTS[k]), { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    const out = `${OUTDIR}/kenkyu_note02_${k}.png`;
    writeFileSync(out, await pg.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1280, height: 670 } }));
    console.log('saved', out);
  }
} finally { await browser.close(); }
