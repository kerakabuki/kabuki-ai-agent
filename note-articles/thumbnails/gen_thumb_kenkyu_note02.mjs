// 歌舞伎研究ノート2「勘平は、なぜ刀で髪を直すのか」（note nef835206ef41）の見出し画像（1280×670）
// 研究ノート1（n304bce88e131）の見出し画像と同じ作り: 左に墨色の文字欄、中央に生成りの縦帯、右に舞台写真
// 写真: 2021年 清流の国ぎふ 地歌舞伎勢揃い公演 六段目（記録写真 202834427_…_n.jpg）。浅葱の紋服の勘平と屏風、刀を抜いた侍二人
// 元画像の下端に動画プレーヤーのシークバーが写っているので、そこは切り落とす
// 使い方（リポジトリルートから）: node note-articles/thumbnails/gen_thumb_kenkyu_note02.mjs [案のキー…]
// 案を省くと全部の案を kenkyu_note02_{キー}.png に書き出す。題字だけが案ごとに違う
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const PHOTO = 'D:/気良歌舞伎/記録写真/2021/清流文化プラザ公演_忠臣蔵五六段目/202834427_4132737626774965_7487577103785354191_n.jpg';
const OUTDIR = 'note-articles/thumbnails';
// 題字の案（y＝金色で強調する部分）。0 は最初に公開した版。2026-11-19 に A を採用して note に掲載
const VARIANTS = {
  '0_刀で髪を直す': { size: 58, t1: '勘平は、なぜ', t2: '<span class="y">刀で髪を直す</span>のか' },
  'A_親殺しと責められて': { size: 58, t1: '親殺しと責められて、', t2: '<span class="y">なぜ髪を直す？</span>' },
  'B_死骸を隠し': { size: 58, t1: '死骸を屏風で隠し、', t2: '<span class="y">刀に顔を映す</span>' },
  'C_刀が鏡になる': { size: 76, t1: '刀が、', t2: '<span class="y">鏡になる。</span>' },
};
const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(VARIANTS);

// 勘平・屏風・右の侍の刀が入る範囲（元画像 1275×667）
const crop = await sharp(PHOTO).extract({ left: 470, top: 175, width: 340, height: 425 })
  .resize(505 * 2, 670 * 2, { fit: 'cover', position: 'centre' })
  .modulate({ saturation: 1.05 }).jpeg({ quality: 92 }).toBuffer();
const img = `data:image/jpeg;base64,${crop.toString('base64')}`;

const page = (v) => `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1280px;height:670px;overflow:hidden;background:#1f1a17}
.s{position:relative;width:1280px;height:670px;font-family:'Noto Serif JP','Yu Mincho',serif;color:#efe8dc}
.left{position:absolute;left:0;top:0;width:690px;height:670px;background:#1f1a17}
.kicker{position:absolute;left:64px;top:96px;font-size:21px;letter-spacing:.06em;color:#cfc6b8}
.bar{position:absolute;left:64px;top:140px;width:44px;height:3px;background:#c0432e}
.t1{position:absolute;left:62px;top:186px;font-size:${v.size}px;font-weight:700;letter-spacing:.02em}
.t2{position:absolute;left:62px;top:${186 + Math.round(v.size * 1.45)}px;font-size:${v.size}px;font-weight:700;letter-spacing:.02em}
.t2 .y{color:#e9b949}
.sub{position:absolute;left:64px;top:${Math.max(410, 236 + Math.round(v.size * 2.45))}px;font-size:22px;line-height:1.75;color:#d8d0c3}
.brand{position:absolute;left:64px;bottom:72px;font-size:19px;color:#a89f92}
.strip{position:absolute;left:690px;top:0;width:85px;height:670px;background:#e7e0d1}
.v{position:absolute;top:70px;writing-mode:vertical-rl;color:#2a2420;font-size:21px;letter-spacing:.14em}
.photo{position:absolute;left:775px;top:0;width:505px;height:670px;background:url(${img}) center/cover}
</style></head><body><div class="s">
  <div class="left">
    <div class="kicker">仮名手本忠臣蔵　六段目「勘平腹切」</div>
    <div class="bar"></div>
    <div class="t1">${v.t1}</div>
    <div class="t2">${v.t2}</div>
    <div class="sub">『忠臣蔵』六段目の刀と屏風を<br>歌舞伎の芸談から読む</div>
    <div class="brand">気良歌舞伎</div>
  </div>
  <div class="strip">
    <div class="v" style="right:14px">六段目「刀と屏風」</div>
    <div class="v" style="right:44px">「段取りに見せない」</div>
  </div>
  <div class="photo"></div>
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
