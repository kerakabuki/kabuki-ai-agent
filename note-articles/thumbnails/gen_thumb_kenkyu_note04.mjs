// 歌舞伎研究ノート4（勘平は、いつ腹を切るのか）の note 見出し画像（1280×670）
// 写真: 気良歌舞伎 2021年「清流の国ぎふ 地歌舞伎勢揃い公演」六段目の元映像 4318.5秒のコマ
//   （D:\気良歌舞伎\ビデオ\清流座\ぎふ清流プラザ令和３年\0627-Cyusingura-Rokudanme.mp4、1920×1080）。
//   二人侍の目の前で勘平が腹に刀を立てる瞬間＝東の型。頭が画面の上から3割より下にあるので、題字は上の帯に置く
// 使い方（リポジトリルートから）:
//   ffmpeg -ss 4318.5 -i "<元映像>" -frames:v 1 <FRAME>   ← FRAME が無いときだけ
//   node note-articles/thumbnails/gen_thumb_kenkyu_note04.mjs
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const FRAME = process.env.FRAME || 'D:/気良歌舞伎/youtubeチャンネル用/歌舞伎研究ノート/04_勘平の色に/コマ_気良2021_4318.5.png';
const OUT = 'note-articles/thumbnails/kenkyu_note04_header_いつ腹を切るのか.png';

// 1920×1080 から 1280:670 の比で上端から切る（幅いっぱい・高さ 1005）
const buf = await sharp(FRAME).extract({ left: 0, top: 0, width: 1920, height: 1005 })
  .resize(1280 * 2, 670 * 2).sharpen({ sigma: 0.8 }).modulate({ saturation: 1.05 }).jpeg({ quality: 92 }).toBuffer();
const img = `data:image/jpeg;base64,${buf.toString('base64')}`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1280px;height:670px;overflow:hidden;background:#000}
.s{position:relative;width:1280px;height:670px;font-family:'Noto Sans JP',sans-serif;font-weight:900}
.ph{position:absolute;inset:0;background:url(${img}) center/cover}
.dark{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,8,14,.88) 0%,rgba(8,8,14,.72) 22%,rgba(8,8,14,.15) 34%,rgba(8,8,14,0) 40%,rgba(8,8,14,0) 82%,rgba(8,8,14,.6) 100%)}
.tag{position:absolute;right:44px;top:30px;background:#C8102E;color:#fff;font-size:28px;padding:4px 16px 8px;letter-spacing:.04em}
.big{position:absolute;left:44px;color:#fff;line-height:1.05;-webkit-text-stroke:12px #05070f;paint-order:stroke fill;text-shadow:0 6px 18px rgba(0,0,0,.6);white-space:nowrap}
.y{color:#FFD54A}
.series{position:absolute;right:46px;bottom:26px;color:rgba(255,255,255,.95);font-weight:700;font-size:24px;letter-spacing:.06em;text-shadow:0 2px 8px #000}
</style></head><body><div class="s">
  <div class="ph"></div><div class="dark"></div>
  <div class="tag">忠臣蔵 六段目</div>
  <div class="big" style="top:20px;font-size:50px">勘平は、</div>
  <div class="big y" style="top:74px;font-size:100px">いつ腹を切るのか。</div>
  <div class="series">芸談で読む東京の型と上方の型｜歌舞伎研究ノート4</div>
</div></body></html>`;

const browser = await puppeteer.launch({ headless: true, args: ['--font-render-hinting=none', '--force-color-profile=srgb'] });
try {
  const pg = await browser.newPage();
  await pg.setViewport({ width: 1280, height: 670, deviceScaleFactor: 1 });
  await pg.setContent(html, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  writeFileSync(OUT, await pg.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1280, height: 670 } }));
  console.log('saved', OUT);
} finally { await browser.close(); }
