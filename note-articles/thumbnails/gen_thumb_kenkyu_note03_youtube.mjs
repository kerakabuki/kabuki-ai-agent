// 歌舞伎研究ノート3（動画「由良之助の文」）の YouTube サムネ（1280×720）。研究ノート2 の YouTube サムネ3案と同じ型
//   左上に赤の演目タグ、白の前置き＋黄の大文字、左下にシリーズ名
// 写真: 2014年祭礼公演 七段目の記録写真（D:\気良歌舞伎\記録写真\2014\祭礼公演_子ども白浪＋忠臣蔵七段目＋太功記\）
//   撮影者不明_011／014＝由良之助が長文を垂らして読み、二階におかる、縁の下に九太夫
//   中田幸三 DPP_8226＝由良之助の肩にいたずら紙（クレジット「撮影：中田幸三様」を入れる）
// 使い方（リポジトリルートから）: node note-articles/thumbnails/gen_thumb_kenkyu_note03_youtube.mjs [案のキー…]
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';

const PH = 'D:/気良歌舞伎/記録写真/2014/祭礼公演_子ども白浪＋忠臣蔵七段目＋太功記';
const OUTDIR = 'D:/気良歌舞伎/youtubeチャンネル用/歌舞伎研究ノート/03_由良之助の文/出力/サムネイル案';

// side＝題字を置く側。crop は元画像の画素（exif 回転後）で 16:9
const VARIANTS = {
  'A_垂らすか巻き取るか': {
    file: `${PH}/撮影者不明/演目_祇園一力/2014_撮影者不明_演目_祇園一力_011.jpg`,
    crop: { left: 0, top: 680, width: 3800, height: 2138 }, side: 'left', size: 100,
    l1: 'その密書、', l2: ['垂らすか、', '巻き取るか。'],
  },
  'B_肩の紙に気づいた': {
    file: `${PH}/中田幸三/演目_祇園一力/DPP_8226.JPG`,
    crop: { left: 420, top: 20, width: 1780, height: 1001 }, side: 'right',
    l1: '肩の紙に、', l2: ['気づいた？'], credit: '撮影：中田幸三様',
  },
  // 團十郎・菊五郎・仁左衛門・幸四郎らの型を読み比べる回、という入口。写真は A と同じ
  'D_名優たちの工夫': {
    file: `${PH}/撮影者不明/演目_祇園一力/2014_撮影者不明_演目_祇園一力_011.jpg`,
    crop: { left: 0, top: 637, width: 4500, height: 2531 }, side: 'left', size: 100,
    l1: '名優たちの工夫、', l1size: 62, l2: ['繰りおろす', '文。'],
  },
  // 動画の結び「手紙で、ピタリと一つに繋がる…歌舞伎の絵面」から
  'C_歌舞伎の絵面': {
    file: `${PH}/撮影者不明/演目_祇園一力/2014_撮影者不明_演目_祇園一力_014.jpg`,
    crop: { left: 0, top: 495, width: 4752, height: 2673 }, side: 'left',
    l1: '手紙でつながる、', l1size: 62, size: 112, l2: ['歌舞伎の', '絵面。'],
  },
};
const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(VARIANTS);

const page = (v, img) => {
  const L = v.side === 'left';
  const grad = L
    ? 'linear-gradient(90deg,rgba(8,8,14,.88) 0%,rgba(8,8,14,.7) 28%,rgba(8,8,14,.15) 46%,rgba(8,8,14,0) 56%)'
    : 'linear-gradient(270deg,rgba(8,8,14,.88) 0%,rgba(8,8,14,.7) 28%,rgba(8,8,14,.15) 46%,rgba(8,8,14,0) 56%)';
  const pos = L ? 'left:48px;text-align:left' : 'right:48px;text-align:right';
  const big = v.l2.map((t, i) => `<div class="big y" style="${pos};top:${300 + i * 132}px;font-size:${v.size || 124}px">${t}</div>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1280px;height:720px;overflow:hidden;background:#000}
.s{position:relative;width:1280px;height:720px;font-family:'Noto Sans JP',sans-serif;font-weight:900}
.ph{position:absolute;inset:0;background:url(${img}) center/cover}
.dark{position:absolute;inset:0;background:${grad}}
.btm{position:absolute;inset:0;background:linear-gradient(0deg,rgba(8,8,14,.7) 0%,rgba(8,8,14,0) 18%)}
.tag{position:absolute;${L ? 'left' : 'right'}:52px;top:44px;background:#C8102E;color:#fff;font-size:34px;padding:4px 18px 8px;letter-spacing:.04em}
.big{position:absolute;color:#fff;line-height:1.05;-webkit-text-stroke:12px #05070f;paint-order:stroke fill;text-shadow:0 6px 18px rgba(0,0,0,.6);white-space:nowrap}
.y{color:#FFD54A}
.series{position:absolute;left:52px;bottom:36px;color:rgba(255,255,255,.95);font-weight:700;font-size:28px;letter-spacing:.06em;text-shadow:0 2px 8px #000}
.credit{position:absolute;right:28px;bottom:36px;color:rgba(255,255,255,.85);font-weight:500;font-size:20px;text-shadow:0 2px 6px #000}
</style></head><body><div class="s">
  <div class="ph"></div><div class="dark"></div><div class="btm"></div>
  <div class="tag">忠臣蔵 七段目</div>
  <div class="big" style="${pos};top:190px;font-size:${v.l1size || 76}px">${v.l1}</div>
  ${big}
  <div class="series">由良之助の文｜歌舞伎研究ノート3</div>
  ${v.credit ? `<div class="credit">${v.credit}</div>` : ''}
</div></body></html>`;
};

mkdirSync(OUTDIR, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--font-render-hinting=none', '--force-color-profile=srgb'] });
try {
  const pg = await browser.newPage();
  await pg.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  for (const k of keys) {
    const v = VARIANTS[k];
    const buf = await sharp(v.file).rotate().extract(v.crop).resize(1280 * 2, 720 * 2)
      .sharpen({ sigma: 0.8 }).modulate({ saturation: 1.05 }).jpeg({ quality: 92 }).toBuffer();
    await pg.setContent(page(v, `data:image/jpeg;base64,${buf.toString('base64')}`), { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    const png = await pg.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1280, height: 720 } });
    const out = `${OUTDIR}/${k}.jpg`;
    writeFileSync(out, await sharp(png).jpeg({ quality: 92 }).toBuffer());
    console.log('saved', out);
  }
} finally { await browser.close(); }
