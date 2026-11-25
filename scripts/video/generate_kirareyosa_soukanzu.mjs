// 『切られ与三』あらすじ動画（相関図版）の相関図を、場面ごとの静止画（1920×1080 PNG）に書き出す
//
// 使い方:
//   node scripts/video/generate_kirareyosa_soukanzu.mjs --out <出力フォルダ> [--photos <札写真フォルダ>] [--card bromide|circle]
//
// 札の形（--card）:
//   bromide（既定）… 上に縦長の写真、下に名前。気良歌舞伎のブロマイドや舞台写真を大きく見せる。
//   circle ………… 丸の中に写真（または紋）、下に名前。
//
// 写真（--photos）:
//   フォルダに「与三郎」「お富」「蝙蝠安」「多左衛門」「赤間源左衛門」の名前の画像（.jpg/.jpeg/.png）を置くと札に入れる。
//   無い人物は、紋のような一文字（与・富・安・多・源）にする。源左衛門は気良の舞台に出ないので、紋のままでよい。
//   顔の位置は、同じフォルダの crop.json で人物ごとに調整できる（x・y は 0〜1 で写真のどこを見せるか、zoom は 1 以上で寄り）。
//     例: { "与三郎": { "x": 0.5, "y": 0.2, "zoom": 1.4 }, "お富": { "y": 0.15 } }
//   指定がなければ、左右は真ん中、上下は上寄り（y 0.18）で切り抜く。
//
// 画面の決まり（台本 docs/youtube/youtube-script-kirareyosa-arasuji.md と同じ）:
//   赤い実線＝恋／灰色の線＝囲う／点線＋「？」＝嘘・思い違い／墨の太い線＝血のつながり／「×」＝切れた
// 字幕（画面下）とけらのすけ（右下。small 推奨）にかからないよう、図は x 80〜1480・y 80〜860 に収めている。
//
// ブラウザ: puppeteer（リポジトリの依存）を使う。入っていなければ playwright を使う。
// フォント: 明朝体（Noto Serif CJK JP → 游明朝 → IPA明朝 の順に探す）。

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) { out[argv[i].slice(2)] = argv[i + 1]; i++; }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (!args.out) {
  console.error('必須引数不足: --out <出力フォルダ> [--photos <札写真フォルダ>] [--card bromide|circle]');
  process.exit(1);
}
const OUT = resolve(args.out);
const PHOTOS = args.photos ? resolve(args.photos) : null;
const CARD_STYLE = args.card === 'circle' ? 'circle' : 'bromide';
mkdirSync(OUT, { recursive: true });

const W = 1920, H = 1080;
const FONT = `'Noto Serif CJK JP','Noto Serif JP','Yu Mincho','YuMincho','Hiragino Mincho ProN','IPAMincho',serif`;

// 札の寸法と並び（札の左上からの位置で書く）
const LAYOUTS = {
  bromide: {
    w: 220, h: 310, rows: [345, 705],
    photo: { x: 12, y: 12, w: 196, h: 214, r: 8 },
    nameY: 264, nameMax: 36, descY: 292, descSize: 20,
  },
  circle: {
    w: 250, h: 236, rows: [360, 700],
    circle: { cx: 125, cy: 70, r: 54 },
    nameY: 176, nameMax: 40, descY: 215, descSize: 22,
  },
};
const L = LAYOUTS[CARD_STYLE];
const COLS = [300, 800, 1300];

// 色（世話物らしく、落ち着いた色に寄せる）
const C = {
  paper: '#F2EADB',
  card: '#FBF6EC',
  cardLine: '#5B4636',
  ink: '#231B15',
  sub: '#6B5848',
  koi: '#B0333A',      // 恋
  kakou: '#8C857E',    // 囲う
  nakama: '#6B6470',   // ゆすり仲間
  uso: '#5A4636',      // 嘘・思い違い
  red: '#A8322D',
};

// 人物（札の中心と、紋の一文字・色）
const [R1, R2] = L.rows;
const PEOPLE = {
  yosa:  { name: '与三郎',       mon: '与', color: '#3E5A7A', x: COLS[0], y: R1, desc: '伊豆屋の若旦那' },
  otomi: { name: 'お富',         mon: '富', color: '#A8414E', x: COLS[1], y: R1, desc: '元は江戸の芸者' },
  taza:  { name: '多左衛門',     mon: '多', color: '#5B6A3C', x: COLS[2], y: R1, desc: '和泉屋の番頭' },
  yasu:  { name: '蝙蝠安',       mon: '安', color: '#5A5662', x: COLS[0], y: R2, desc: 'ゆすりの小悪党' },
  gen:   { name: '赤間源左衛門', mon: '源', color: '#3A322C', x: COLS[2], y: R2, desc: '木更津の親分' },
};

// 線の形（札のふちからふちへ）
const hw = L.w / 2, hh = L.h / 2;
const kakouFrom = [COLS[2] - hw + 20, R2 - hh];
const kakouTo = [COLS[1] + hw - 20, R1 + hh + 4];
const kakouMid = [(kakouFrom[0] + kakouTo[0]) / 2, (kakouFrom[1] + kakouTo[1]) / 2];
const yTop = R1 + hh, yBottom = R2 - hh, yMid = (yTop + yBottom) / 2;
const arcTop = R1 - hh, arcApex = arcTop - 55;
const GEOM = {
  koi:    { d: `M ${COLS[0] + hw} ${R1} L ${COLS[1] - hw} ${R1}`, mid: [(COLS[0] + COLS[1]) / 2, R1], labelAt: [(COLS[0] + COLS[1]) / 2, R1 - 34] },
  danna:  { d: `M ${COLS[2] - hw} ${R1} L ${COLS[1] + hw} ${R1}`, mid: [(COLS[1] + COLS[2]) / 2, R1], labelAt: [(COLS[1] + COLS[2]) / 2, R1 - 34] },
  kakou:  { d: `M ${kakouFrom[0]} ${kakouFrom[1]} L ${kakouTo[0]} ${kakouTo[1]}`, mid: kakouMid, labelAt: [kakouMid[0] + 28, kakouMid[1] + 10] },
  // 上下の札の間が狭いときは、札を線の横に出す
  yusuri: { d: `M ${COLS[0]} ${yTop} L ${COLS[0]} ${yBottom}`, mid: [COLS[0], yMid], labelAt: yBottom - yTop < 70 ? [COLS[0] + 95, yMid] : [COLS[0], yMid] },
  arc:    { d: `M ${COLS[0] + 40} ${arcTop} Q ${(COLS[0] + COLS[1]) / 2} ${arcTop - 110} ${COLS[1] - 40} ${arcTop}`, mid: [(COLS[0] + COLS[1]) / 2, arcApex], labelAt: [(COLS[0] + COLS[1]) / 2, arcApex] },
};

// 線の見た目
const STYLE = {
  koi:      { stroke: C.koi, width: 8 },
  koiThin:  { stroke: C.koi, width: 5 },
  koiThick: { stroke: C.koi, width: 14 },
  kakou:    { stroke: C.kakou, width: 6, arrow: true },
  danna:    { stroke: C.kakou, width: 5, dash: '14 12' },
  nakama:   { stroke: C.nakama, width: 5 },
  uso:      { stroke: C.uso, width: 5, dash: '6 12' },
  chi:      { stroke: C.ink, width: 16, solidLabel: true },
};

// 場面（台本の 〔線：…〕 の順）
const koi = (extra = {}) => ({ geom: 'koi', style: 'koi', ...extra });
const kakou = (extra = {}) => ({ geom: 'kakou', style: 'kakou', label: '囲う', ...extra });
const danna = (extra = {}) => ({ geom: 'danna', style: 'danna', label: '旦那？', ...extra });
const yusuri = () => ({ geom: 'yusuri', style: 'nakama', label: 'ゆすり仲間' });
const later = { yosa: { desc: '切られ与三' }, otomi: { desc: '源氏店の女主人' }, gen: { faded: true }, taza: {}, yasu: {} };

const STATES = [
  { file: '00_フック', note: 'フック（いやさお富、久しぶりだなぁ）',
    cards: { yosa: { noDesc: true }, otomi: { noDesc: true } },
    lines: [koi({ faded: true, cut: true })] },
  { file: '01_人物紹介', note: '本編1（線は三回、引き直される）',
    cards: { yosa: {}, otomi: {}, taza: {}, yasu: {}, gen: {} }, lines: [] },
  { file: '02_見染め', note: '本編2（ひと目で惚れてしまう）',
    cards: { yosa: {}, otomi: {} }, lines: [koi({ label: 'ひと目惚れ' })] },
  { file: '03_囲う', note: '本編2（赤間源左衛門に囲われている身）',
    cards: { yosa: {}, otomi: {}, gen: {} }, lines: [koi({ label: 'ひと目惚れ' }), kakou()] },
  { file: '04_切れた', note: '本編2（一回目。二人の線は、ここで切れた）',
    cards: { yosa: { badge: { text: '刀傷 三十四か所', tone: 'ink' } }, otomi: { badge: { text: '死んだ？', tone: 'red' } }, gen: {} },
    lines: [koi({ faded: true, cut: true }), kakou()] },
  { file: '05_三年後', note: '本編3（お富は、生きていた／多左衛門の世話）',
    cards: { yosa: { desc: '切られ与三' }, otomi: { desc: '源氏店の女主人', badge: { text: '生きていた', tone: 'ink' } }, gen: { faded: true }, taza: {} },
    lines: [koi({ faded: true, cut: true }), kakou({ faded: true, label: null }), danna()] },
  { file: '06_ゆすり', note: '本編3（相棒は蝙蝠安）',
    cards: later, lines: [koi({ faded: true, cut: true }), kakou({ faded: true, label: null }), danna(), yusuri()] },
  { file: '07_再会', note: '本編3（「しがねぇ恋の情けが仇」のあと）',
    cards: later, lines: [koi({ style: 'koiThin', label: '再会' }), kakou({ faded: true, label: null }), danna(), yusuri()] },
  { file: '08_嘘の兄', note: '本編4（二回目。昔の恋人を「兄さん」と言い繕う）',
    cards: later, lines: [koi({ style: 'koiThin', label: '再会' }), kakou({ faded: true, label: null }), danna(), yusuri(),
      { geom: 'arc', style: 'uso', label: '兄？' }] },
  { file: '09_実の兄', note: '本編5（三回目。多左衛門こそ実の兄）',
    cards: later, lines: [koi({ style: 'koiThin', label: '再会' }), kakou({ faded: true, label: null }),
      { geom: 'danna', style: 'chi', label: '実の兄' }, yusuri(), { geom: 'arc', style: 'uso', label: '兄？' }] },
  { file: '10_嘘が消える', note: '本編5（点線「兄？」が消える）',
    cards: later, lines: [koi({ style: 'koiThin', label: '再会' }), kakou({ faded: true, label: null }),
      { geom: 'danna', style: 'chi', label: '実の兄' }, yusuri()] },
  { file: '11_幕切れ', note: '本編5（離しゃぁしねえよ）',
    cards: later, lines: [koi({ style: 'koiThick', label: '切るに切られぬ縁' }), kakou({ faded: true, label: null }),
      { geom: 'danna', style: 'chi', label: '実の兄' }, yusuri()] },
  { file: '12_まとめ', note: '本編6（できあがった相関図）', title: '『切られ与三』相関図',
    cards: later, lines: [koi({ style: 'koiThick', label: '切るに切られぬ縁' }), kakou({ faded: true, label: null }),
      { geom: 'danna', style: 'chi', label: '実の兄' }, yusuri()] },
];

// 札写真（あれば data URI にして埋め込む）と、顔の位置の指定
function photoFor(name) {
  if (!PHOTOS) return null;
  for (const ext of ['jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG']) {
    const p = join(PHOTOS, `${name}.${ext}`);
    if (existsSync(p)) {
      const mime = /png/i.test(ext) ? 'image/png' : 'image/jpeg';
      return `data:${mime};base64,${readFileSync(p).toString('base64')}`;
    }
  }
  return null;
}
const PHOTO = Object.fromEntries(Object.values(PEOPLE).map(p => [p.name, photoFor(p.name)]));
let CROP = {};
if (PHOTOS && existsSync(join(PHOTOS, 'crop.json'))) {
  CROP = JSON.parse(readFileSync(join(PHOTOS, 'crop.json'), 'utf8'));
}
const SIZE = {}; // 写真の縦横（ブラウザで読んで、向きの情報も反映した大きさを入れる）

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// 枠（fx, fy, fw, fh）いっぱいに写真を敷き詰めるときの位置と大きさ
function fitPhoto(name, fx, fy, fw, fh) {
  const s = SIZE[name];
  const crop = CROP[name] || {};
  const zoom = Math.max(1, Number(crop.zoom ?? 1));
  const px = Math.min(1, Math.max(0, Number(crop.x ?? 0.5)));
  const py = Math.min(1, Math.max(0, Number(crop.y ?? 0.18)));
  if (!s) return { x: fx, y: fy, w: fw, h: fh, par: 'xMidYMin slice' };
  const scale = Math.max(fw / s.w, fh / s.h) * zoom;
  const dw = s.w * scale, dh = s.h * scale;
  return { x: fx + (fw - dw) * px, y: fy + (fh - dh) * py, w: dw, h: dh, par: 'none' };
}

function face(key, p, left, top) {
  const photo = PHOTO[p.name];
  if (CARD_STYLE === 'bromide') {
    const f = L.photo;
    const fx = left + f.x, fy = top + f.y;
    if (photo) {
      const img = fitPhoto(p.name, fx, fy, f.w, f.h);
      return `<clipPath id="clip-${key}"><rect x="${fx}" y="${fy}" width="${f.w}" height="${f.h}" rx="${f.r}"/></clipPath>
        <image href="${photo}" x="${img.x}" y="${img.y}" width="${img.w}" height="${img.h}" preserveAspectRatio="${img.par}" clip-path="url(#clip-${key})"/>
        <rect x="${fx}" y="${fy}" width="${f.w}" height="${f.h}" rx="${f.r}" fill="none" stroke="${p.color}" stroke-width="3"/>`;
    }
    return `<rect x="${fx}" y="${fy}" width="${f.w}" height="${f.h}" rx="${f.r}" fill="${p.color}"/>
      <rect x="${fx + 8}" y="${fy + 8}" width="${f.w - 16}" height="${f.h - 16}" rx="${f.r - 2}" fill="none" stroke="${C.card}" stroke-opacity="0.5" stroke-width="2"/>
      <text x="${fx + f.w / 2}" y="${fy + f.h / 2 + 34}" text-anchor="middle" font-size="96" font-weight="700" fill="${C.card}">${esc(p.mon)}</text>`;
  }
  const c = L.circle;
  const cx = left + c.cx, cy = top + c.cy, r = c.r;
  if (photo) {
    const img = fitPhoto(p.name, cx - r, cy - r, r * 2, r * 2);
    return `<clipPath id="clip-${key}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
      <image href="${photo}" x="${img.x}" y="${img.y}" width="${img.w}" height="${img.h}" preserveAspectRatio="${img.par}" clip-path="url(#clip-${key})"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p.color}" stroke-width="4"/>`;
  }
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.color}"/>
    <circle cx="${cx}" cy="${cy}" r="${r - 7}" fill="none" stroke="${C.card}" stroke-opacity="0.55" stroke-width="2"/>
    <text x="${cx}" y="${cy + 20}" text-anchor="middle" font-size="58" font-weight="700" fill="${C.card}">${esc(p.mon)}</text>`;
}

function card(key, opt) {
  const p = PEOPLE[key];
  const { x, y } = p;
  const left = x - hw, top = y - hh;
  const nameSize = Math.min(L.nameMax, Math.floor((L.w - 36) / p.name.length));
  const desc = opt.noDesc ? null : (opt.desc ?? p.desc);
  let badge = '';
  if (opt.badge) {
    const bw = opt.badge.text.length * 25 + 30;
    const fill = opt.badge.tone === 'red' ? C.red : C.ink;
    badge = `<g transform="translate(${x + 58} ${top - 4}) rotate(-6)">
      <rect x="${-bw / 2}" y="-22" width="${bw}" height="44" rx="8" fill="${fill}"/>
      <text x="0" y="9" text-anchor="middle" font-size="25" font-weight="700" fill="${C.card}">${esc(opt.badge.text)}</text></g>`;
  }
  const faded = opt.faded ? ` opacity="0.32" filter="url(#gray)"` : '';
  return `<g${faded}>
    <rect x="${left}" y="${top}" width="${L.w}" height="${L.h}" rx="14" fill="${C.card}" stroke="${C.cardLine}" stroke-width="2" filter="url(#shadow)"/>
    <rect x="${left + 6}" y="${top + 6}" width="${L.w - 12}" height="${L.h - 12}" rx="10" fill="none" stroke="${C.cardLine}" stroke-opacity="0.22" stroke-width="1"/>
    ${face(key, p, left, top)}
    <text x="${x}" y="${top + L.nameY}" text-anchor="middle" font-size="${nameSize}" font-weight="700" fill="${C.ink}">${esc(p.name)}</text>
    ${desc ? `<text x="${x}" y="${top + L.descY}" text-anchor="middle" font-size="${L.descSize}" fill="${C.sub}">${esc(desc)}</text>` : ''}
    ${badge}
  </g>`;
}

function line(l) {
  const g = GEOM[l.geom], s = STYLE[l.style];
  const op = l.faded ? 0.3 : 1;
  let out = `<path d="${g.d}" fill="none" stroke="${s.stroke}" stroke-width="${s.width}" stroke-linecap="round"${s.dash ? ` stroke-dasharray="${s.dash}"` : ''}${s.arrow ? ` marker-end="url(#arrow)"` : ''} opacity="${op}"/>`;
  if (l.cut) {
    const [mx, my] = g.mid;
    out += `<g transform="translate(${mx} ${my}) rotate(6)" stroke="${C.ink}" stroke-width="12" stroke-linecap="round">
      <line x1="-30" y1="-30" x2="30" y2="30"/><line x1="30" y1="-30" x2="-30" y2="30"/></g>`;
  }
  if (l.label) {
    const [lx, ly] = g.labelAt;
    const fs = l.label.length >= 7 ? 24 : 26;   // 長い札（切るに切られぬ縁）は札の間に収まるよう少し小さく
    const lw = l.label.length * (fs + 1) + 28;
    const solid = s.solidLabel;
    out += `<g opacity="${op}">
      <rect x="${lx - lw / 2}" y="${ly - 23}" width="${lw}" height="46" rx="10" fill="${solid ? s.stroke : C.card}" stroke="${s.stroke}" stroke-width="2"/>
      <text x="${lx}" y="${ly + 9}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="${solid ? C.card : s.stroke}">${esc(l.label)}</text></g>`;
  }
  return out;
}

function svgFor(state) {
  const cardsSvg = Object.entries(state.cards).map(([k, o]) => card(k, o)).join('\n');
  const linesSvg = state.lines.map(line).join('\n');
  const title = state.title
    ? `<text x="790" y="${CARD_STYLE === 'bromide' ? 112 : 128}" text-anchor="middle" font-size="40" font-weight="700" fill="${C.ink}" letter-spacing="4">${esc(state.title)}</text>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${FONT}">
  <defs>
    <!-- 和紙のむら。細かいざらつきは動画で潰れてちらつくうえ画像も重くなるので、粗めのむらにとどめる -->
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="7"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.34  0 0 0 0 0.24  0 0 0 0.06 0"/>
    </filter>
    <filter id="fiber" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.006 0.05" numOctaves="3" seed="11"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.50  0 0 0 0 0.42  0 0 0 0 0.30  0 0 0 0.09 0"/>
    </filter>
    <radialGradient id="vignette" cx="50%" cy="45%" r="75%">
      <stop offset="60%" stop-color="#6E5536" stop-opacity="0"/>
      <stop offset="100%" stop-color="#6E5536" stop-opacity="0.22"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#3A2A1A" flood-opacity="0.18"/>
    </filter>
    <filter id="gray"><feColorMatrix type="saturate" values="0.1"/></filter>
    <marker id="arrow" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M 0 0 L 12 6 L 0 12 z" fill="${C.kakou}"/>
    </marker>
  </defs>
  <rect width="${W}" height="${H}" fill="${C.paper}"/>
  <rect width="${W}" height="${H}" filter="url(#fiber)"/>
  <rect width="${W}" height="${H}" filter="url(#grain)"/>
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
  ${title}
  ${linesSvg}
  ${cardsSvg}
</svg>`;
}

const page = svg => `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:${C.paper}}svg{display:block}</style></head><body>${svg}</body></html>`;

// ブラウザ（puppeteer → playwright の順）
async function openBrowser() {
  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'], executablePath: process.env.CHROME_PATH || undefined });
    const p = await browser.newPage();
    await p.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    return { page: p, close: () => browser.close() };
  } catch {
    const { chromium } = require('playwright');
    const browser = await chromium.launch();
    const p = await browser.newPage({ viewport: { width: W, height: H } });
    return { page: p, close: () => browser.close() };
  }
}

const { page: tab, close } = await openBrowser();

// 写真の縦横を、ブラウザで読んだ大きさ（スマホ写真の向きの情報も反映）で取る
const withPhoto = Object.entries(PHOTO).filter(([, uri]) => uri);
if (withPhoto.length) {
  await tab.setContent(`<!doctype html><html><body>${withPhoto.map(([n, uri], i) => `<img id="p${i}" data-name="${esc(n)}" src="${uri}">`).join('')}</body></html>`, { waitUntil: 'load' });
  const sizes = await tab.evaluate(() => [...document.images].map(im => ({ name: im.dataset.name, w: im.naturalWidth, h: im.naturalHeight })));
  for (const s of sizes) SIZE[s.name] = { w: s.w, h: s.h };
  console.log('写真:', sizes.map(s => `${s.name} ${s.w}×${s.h}`).join(' / '));
}

const made = [];
for (const st of STATES) {
  await tab.setContent(page(svgFor(st)), { waitUntil: 'load' });
  await tab.evaluate(() => document.fonts.ready);
  const file = join(OUT, `${st.file}.png`);
  await tab.screenshot({ path: file, type: 'png' });
  made.push({ file, note: st.note, name: st.file });
  console.log(`書き出し: ${file}`);
}

// 一覧（確認用。4列×4段）
const thumbs = made.map(m => ({ ...m, uri: `data:image/png;base64,${readFileSync(m.file).toString('base64')}` }));
const sheet = `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;background:#2b2520;font-family:${FONT}}
  .g{display:grid;grid-template-columns:repeat(4,480px);grid-auto-rows:270px}
  .c{position:relative}.c img{width:480px;height:270px;display:block}
  .c span{position:absolute;left:8px;top:6px;background:rgba(35,27,21,.82);color:#FBF6EC;font-size:18px;padding:2px 8px;border-radius:4px}
</style></head><body><div class="g">${thumbs.map(t => `<div class="c"><img src="${t.uri}"><span>${esc(t.name)}</span></div>`).join('')}</div></body></html>`;
await tab.setContent(sheet, { waitUntil: 'load' });
await tab.evaluate(() => document.fonts.ready);
const sheetFile = join(OUT, '一覧.png');
await tab.screenshot({ path: sheetFile, type: 'png', fullPage: true });
console.log(`書き出し: ${sheetFile}`);

writeFileSync(join(OUT, '使いどころ.txt'), made.map(m => `${m.name}.png\t${m.note}`).join('\n') + '\n');
await close();
