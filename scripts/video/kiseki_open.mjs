// 「軌跡」投影映像のオープニング（約18秒・1920×1080 / 30fps・無音）
// 見得をビートに合わせてハードカットで刻み、地歌舞伎×ＡＩを前面に出す
// 画面は左960=黒地に文字／右960=写真（プロジェクタ2台に分けて投影するため）
// BGM は Neu_Kabuki（OpenTracks・MFP）の 124.5BPM に合わせてある。本編側でまとめて音を乗せる
// 使い方: node _scratch/kiseki5_open.mjs <出力mp4>
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2];
const WORK = 'D:/気良歌舞伎/台本/曽根崎心中/output/軌跡/work/op';
rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });

const W = 1920, H = 1080, FPS = 30;
const B = 60 / 124.52;        // 1拍（秒）
const INTRO = 3.40;           // Neu_Kabuki のビートが入るまで
const PW = 960, PH = 1080;    // 右パネル（写真）＝プロジェクタ1台ぶん
const SAFE_R = 872;           // 文字は左パネルの内側に収める
const R = 'D:/気良歌舞伎/記録写真';
const COMMON = 'D:/気良歌舞伎/youtubeチャンネル用/超訳！歌舞伎ナビ/歌舞伎ナビ共通素材';

// 刻むカット（14枚）。強い順ではなく、色と構図が隣り合わないように並べる
const FLASH = [
  `${R}/2025/祭礼公演_曽我対面＋封印切＋白浪/寿曽我対面/02_見得/2025_見得_002_地歌舞伎の見得.jpg`,
  `${R}/2024/祭礼公演_白浪＋太功記＋忠臣蔵/02_見得/2024_見得_035_槍を構える見得.jpg`,
  `${R}/2019/祭礼公演_伊勢音頭＋太功記/2019.9.21気良歌舞伎/⑤絵本太功記十段目/⑤絵本太功記十段目 (136).JPG`,
  `${R}/2023/祭礼公演_白浪＋切られ与三/02_見得/2023_見得_003_地歌舞伎の見得.jpg`,

  `${R}/2024/祭礼公演_忠臣蔵七段目/02_見得/2024_見得_001_地歌舞伎の見得.jpg`,
  `${R}/2013/祭礼公演_盛綱陣屋/2013_祭礼公演_盛綱陣屋_305.jpg`,
  `${R}/2025/祭礼公演_曽我対面＋封印切＋白浪/寿曽我対面/02_見得/2025_見得_025_地歌舞伎の演技.jpg`,
  `${R}/2025/祭礼公演_曽我対面＋封印切＋白浪/封印切/01_原本/2025_封印切_0047.jpg`,

  `${R}/2017/祭礼公演_先代萩/猪島敏昭/Fuji/2017_祭礼公演_先代萩_猪島敏昭_075.jpg`,
  `${R}/2024/祭礼公演_白浪＋太功記＋忠臣蔵/02_見得/2024_見得_009_傘を持つ役者の見得.jpg`,
  `${R}/2015/祭礼公演_子ども白浪＋箱根霊験記/猪島敏昭/演目_箱根霊験記_滝壺/2015_猪島敏昭_演目_箱根霊験記_滝壺_113.jpg`,

  `${R}/2010/山田浩二/演目_熊谷陣屋/2010_山田浩二_演目_熊谷陣屋_019.jpg`,
  `${R}/2025/ぎふ清流座公演_封印切/02_見得/2025_見得_002_見得を切る役者.jpg`,
  `${R}/2024/祭礼公演_白浪＋太功記＋忠臣蔵/01_舞台全景/2024_舞台全景_005_傘を持つ役者たちの舞台.jpg`,
];

// 並び: イントロ → 刻み4 → 札 → 刻み4 → 札 → 刻み3 → けらのすけ → 刻み3 → タイトル → 黒
const SEQ = [
  { kind: 'intro', beats: INTRO / B, word: '気良歌舞伎' },
  { kind: 'flash', n: 4 },
  { kind: 'card', beats: 2, lines: ['歌舞伎 × ＡＩ'], flash: true },
  { kind: 'flash', n: 4 },
  { kind: 'card', beats: 2, lines: ['新世代による、', '新しい地歌舞伎'], flash: true, small: true },
  { kind: 'flash', n: 3 },
  { kind: 'kera', beats: 3, note: 'ＡＩナビゲーター　けらのすけ' },
  { kind: 'flash', n: 3 },
  { kind: 'title', beats: 8, over: '気良歌舞伎', lines: ['復活からの軌跡'] },
  { kind: 'black', beats: 2 },
];

const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });
const ENC = ['-c:v', 'libx264', '-crf', '16', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-r', String(FPS)];
const GOTHIC = "'Noto Sans JP Black','Noto Sans JP',sans-serif";

async function bake(src, i) {
  const out = join(WORK, `f${String(i).padStart(2, '0')}.png`);
  if (!existsSync(src)) throw new Error(`写真が見つかりません: ${src}`);
  const img = sharp(src).rotate();
  const m = await img.metadata();
  // rotate() 後の向きで測る（EXIFの回転があると metadata の幅高さは回す前の値）
  const sw = m.orientation >= 5 ? m.height : m.width;
  const sh = m.orientation >= 5 ? m.width : m.height;
  const k = Math.max(PW / sw, PH / sh);
  const rw = Math.max(PW, Math.round(sw * k)), rh = Math.max(PH, Math.round(sh * k));
  await img.resize(rw, rh, { kernel: 'lanczos3' })
    .extract({ left: Math.round((rw - PW) / 2), top: Math.round((rh - PH) * 0.34), width: PW, height: PH })
    .png().toFile(out);
  return out;
}

const shell = (body, css) => `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;background:transparent;overflow:hidden}
.stage{position:relative;width:${W}px;height:${H}px}
.box{position:absolute;left:110px;top:0;width:720px;height:${H}px;display:flex;flex-direction:column;
     align-items:flex-start;justify-content:center;color:#fff;font-family:${GOTHIC};font-weight:900}
.box .big{font-size:88px;letter-spacing:.06em;line-height:1.34}
.box .mid{font-size:72px;letter-spacing:.06em;line-height:1.4}
.box .over{font-size:34px;letter-spacing:.3em;font-weight:700;opacity:.85;margin-bottom:22px}
.box .note{position:absolute;left:0;bottom:120px;font-size:30px;letter-spacing:.18em;font-weight:700;opacity:.9}
.kera{position:absolute;left:1020px;bottom:0;height:960px}
${css}
</style></head><body><div class="stage">${body}</div></body></html>`;

const browser = await puppeteer.launch({ headless: true, args: ['--font-render-hinting=none', '--force-color-profile=srgb'] });
const pg = await browser.newPage();
await pg.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
const shot = async (html, file) => {
  await pg.setContent(html, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  const right = await pg.evaluate(() => {
    const r = document.createRange();
    let m = 0;
    for (const el of document.querySelectorAll('.big,.mid,.over,.note')) {
      r.selectNodeContents(el);
      for (const b of r.getClientRects()) m = Math.max(m, b.right);
    }
    return Math.ceil(m);
  });
  writeFileSync(file, await pg.screenshot({ type: 'png', omitBackground: true }));
  return right;
};

const keraBuf = await sharp(`${COMMON}/けらのすけ（背景透過）.png`).trim().resize({ height: 960 }).png().toBuffer();
const keraURL = `data:image/png;base64,${keraBuf.toString('base64')}`;
const over = [];
const parts = [];
let fi = 0;

for (const [si, s] of SEQ.entries()) {
  const dur = s.kind === 'flash' ? s.n * B : s.beats * B;
  const tag = String(si).padStart(2, '0');

  if (s.kind === 'flash') {
    for (let k = 0; k < s.n; k++, fi++) {
      const png = await bake(FLASH[fi], fi);
      const out = join(WORK, `s${tag}_${k}.mp4`);
      const d = +B.toFixed(3), fr = Math.round(d * FPS);
      // 1カット内で 3% だけ寄る。頭は白の抜き（刻みを立てる）
      const P = `min(on/${Math.max(1, fr - 1)},1)`, Z = `(1+0.03*${P})`;
      const mv = `perspective=x0='(W-W/${Z})*0.5':y0='(H-H/${Z})*0.4':x1='(W-W/${Z})*0.5+W/${Z}':y1='(H-H/${Z})*0.4'`
        + `:x2='(W-W/${Z})*0.5':y2='(H-H/${Z})*0.4+H/${Z}':x3='(W-W/${Z})*0.5+W/${Z}':y3='(H-H/${Z})*0.4+H/${Z}'`
        + `:interpolation=cubic:eval=frame`;
      const fg = `[1:v]setsar=1,format=yuv444p,${mv},format=yuv420p,fps=${FPS}[ph];`
        + `[0:v][ph]overlay=${PW}:0,fade=t=in:st=0:d=0.07:color=white,format=yuv420p[v]`;
      ff(['-f', 'lavfi', '-i', `color=c=black:s=${W}x${H}:r=${FPS}:d=${d}`,
        '-loop', '1', '-t', String(d), '-i', png, '-filter_complex', fg, '-map', '[v]', ...ENC, out]);
      parts.push(out);
    }
    continue;
  }

  let body = '';
  if (s.kind === 'intro') body = `<div class="box"><div class="big">${s.word}</div></div>`;
  else if (s.kind === 'card') body = `<div class="box">${s.lines.map(l => `<div class="${s.small ? 'mid' : 'big'}">${l}</div>`).join('')}</div>`;
  else if (s.kind === 'kera') body = `<img class="kera" src="${keraURL}"><div class="box"><div class="note">${s.note}</div></div>`;
  else if (s.kind === 'title') body = `<div class="box"><div class="over">${s.over}</div>${s.lines.map(l => `<div class="big">${l}</div>`).join('')}</div>`;

  const out = join(WORK, `s${tag}.mp4`);
  if (s.kind === 'black') {
    ff(['-f', 'lavfi', '-i', `color=c=black:s=${W}x${H}:r=${FPS}:d=${dur.toFixed(3)}`, ...ENC, out]);
    parts.push(out);
    continue;
  }
  const png = join(WORK, `t${tag}.png`);
  const right = await shot(shell(body, ''), png);
  if (right > SAFE_R) over.push(`${s.kind}(${right}px)`);

  // 札: 黒地＋文字。頭を白で抜いて、イントロだけはゆっくり出す
  const inSt = s.kind === 'intro' ? 1.0 : 0.02, inD = s.kind === 'intro' ? 1.3 : 0.12;
  const white = s.flash || s.kind === 'title' ? `,fade=t=in:st=0:d=0.10:color=white` : '';
  const fg = `[1:v]format=rgba,fade=t=in:st=${inSt}:d=${inD}:alpha=1[t];`
    + `[0:v][t]overlay=x=0:y='if(lt(t,${(inSt + inD).toFixed(2)}),14-14*min(1,max(0,(t-${inSt})/${inD})),0)':format=auto`
    + `${white},format=yuv420p[v]`;
  ff(['-f', 'lavfi', '-i', `color=c=black:s=${W}x${H}:r=${FPS}:d=${dur.toFixed(3)}`,
    '-loop', '1', '-t', dur.toFixed(3), '-i', png, '-filter_complex', fg, '-map', '[v]', ...ENC, out]);
  parts.push(out);
}
await browser.close();
if (over.length) console.log(`!! 文字が ${SAFE_R}px を越えた: ${over.join(' ')}`);
else console.log(`文字はすべて左 ${SAFE_R}px 以内`);

// ハードカットでつなぐ
const list = join(WORK, 'list.txt');
writeFileSync(list, parts.map(p => `file '${p}'`).join('\n'), 'utf8');
ff(['-f', 'concat', '-safe', '0', '-i', list, ...ENC, OUT]);
const dur = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', OUT]).toString().trim();
console.log(`オープニング ${dur.toFixed(2)}秒 / 刻み${FLASH.length}カット → ${OUT}`);
