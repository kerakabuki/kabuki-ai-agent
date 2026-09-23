// けらのすけの口パク用スプライトを作る（一度きりの素材づくり用）
// 使い方: node scripts/video/make_kera_mouth_sprites.mjs
//
// 元画像: 共通素材/けらのすけ動画/けらのすけグリーンバック.png（2160x3840・v6の立ち姿と同じ絵）
// 出力先: 共通素材/けらのすけ口パク/ に closed / half / open / blink の4枚と meta.json
//
// 口パクダミー動画は頭がフレームごとに揺れていて口だけ切り貼りできないため、
// 高解像度の静止画を土台にして、口の開き（2段階）とまばたきを描き足す。
// 4枚とも同じキャンバス・同じ位置なので、ビルド側でフレームごとに差し替えるだけで口パクになる。

import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { COMMON } from '../../studio/paths.mjs';

const SRC = `${COMMON}/けらのすけ動画/けらのすけグリーンバック.png`;
const OUT = `${COMMON}/けらのすけ口パク`;
const OUT_H = 1600;  // 出力の高さ（画面での最大表示 約1450px を少し上回る程度）

// 元画像（2160x3840）上の顔の目印。グリッドを重ねた拡大画像で目視して決めた値
const MOUTH = { cx: 1053, cy: 1262, w: 140 };          // 閉じた口（ほほえみの線）
// 目はまつ毛と白目の縁まで含めた範囲（細かいグリッドの拡大画像で目視）
const EYES = [
  { cx: 851, cy: 1053, rx: 106, ry: 94 },
  { cx: 1265, cy: 1043, rx: 105, ry: 92 },
];

// ---- グリーンバックを透過にする -----------------------------------------------
async function keyGreen(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  for (let i = 0; i < w * h; i++) {
    const p = i * 4;
    const r = data[p], g = data[p + 1], b = data[p + 2];
    const spill = g - Math.max(r, b);       // 緑がどれだけ勝っているか
    if (spill > 60) {
      data[p + 3] = 0;
    } else if (spill > 20) {
      // 輪郭のなじませ: 緑の勝ち具合に応じて半透明にし、緑かぶりを取る
      data[p + 3] = Math.round(255 * (60 - spill) / 40);
      data[p + 1] = Math.max(r, b);
    } else if (spill > 0) {
      data[p + 1] = Math.max(r, b);           // 軽い緑かぶりだけ取る
    }
  }
  return { data, w, h };
}

// アルファのある範囲（キャラクターの外接矩形）
function bbox({ data, w, h }) {
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 16) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  return { x0, y0, x1, y1 };
}

// 指定位置のまわりの平均色（まぶたの肌色を拾う）
function avgColor({ data, w }, cx, cy, r) {
  let R = 0, G = 0, B = 0, n = 0;
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const p = (y * w + x) * 4;
      R += data[p]; G += data[p + 1]; B += data[p + 2]; n++;
    }
  }
  const hex = (v) => Math.round(v / n).toString(16).padStart(2, '0');
  return `#${hex(R)}${hex(G)}${hex(B)}`;
}

// ---- 口とまぶたの重ね絵（元画像と同じ 2160x3840 座標で描く） ----------------------
function mouthSVG(W, H, level) {
  // level: 0.3 = 半開き / 1.0 = 開き
  const mw = MOUTH.w * (0.5 + 0.22 * level);      // 口の幅
  const mh = MOUTH.w * (0.16 + 0.30 * level);     // 口の高さ
  const cx = MOUTH.cx, top = MOUTH.cy - 4;        // ほほえみの線に上辺をそろえる
  const L = cx - mw / 2, R = cx + mw / 2, B = top + mh;
  // 上辺はほほえみに沿ってゆるく下がり、下辺は丸く
  const d = `M ${L} ${top + 3}
    Q ${cx} ${top + mh * 0.18} ${R} ${top + 3}
    Q ${R + mw * 0.02} ${top + mh * 0.55} ${cx} ${B}
    Q ${L - mw * 0.02} ${top + mh * 0.55} ${L} ${top + 3} Z`;
  const tongueRy = mh * 0.30, tongueCy = B - tongueRy * 0.75;
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="in" cx="50%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#3a1418"/><stop offset="100%" stop-color="#6e2a31"/>
    </radialGradient>
    <clipPath id="cp"><path d="${d}"/></clipPath>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter>
  </defs>
  <g filter="url(#soft)">
    <path d="${d}" fill="url(#in)"/>
    <ellipse clip-path="url(#cp)" cx="${cx}" cy="${tongueCy}" rx="${mw * 0.30}" ry="${tongueRy}" fill="#c4636b"/>
    <path d="${d}" fill="none" stroke="#8a4a4c" stroke-width="3" stroke-opacity="0.55"/>
  </g>
</svg>`;
}

function blinkSVG(W, H, skins) {
  // まつ毛と白目の縁まで覆う楕円を、目の上と下から拾った肌色の縦グラデーションで塗る。
  // 縁は放射グラデーションのマスクでぼかしてなじませ、その上に閉じたまぶたの線を描く
  const defs = EYES.map((e, i) => {
    const rx = e.rx + 30, ry = e.ry + 24;
    return `
    <linearGradient id="skin${i}" x1="0" y1="${e.cy - ry}" x2="0" y2="${e.cy + ry}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${skins[i].top}"/><stop offset="100%" stop-color="${skins[i].bottom}"/>
    </linearGradient>
    <radialGradient id="fade${i}" cx="${e.cx}" cy="${e.cy}" r="${rx}" gradientUnits="userSpaceOnUse"
      gradientTransform="translate(${e.cx} ${e.cy}) scale(1 ${ry / rx}) translate(${-e.cx} ${-e.cy})">
      <stop offset="0%" stop-color="#fff"/><stop offset="88%" stop-color="#fff"/><stop offset="100%" stop-color="#000"/>
    </radialGradient>
    <mask id="m${i}"><rect x="0" y="0" width="${W}" height="${H}" fill="url(#fade${i})"/></mask>`;
  }).join('');
  const parts = EYES.map((e, i) => {
    const rx = e.rx + 30, ry = e.ry + 24;
    const y = e.cy + e.ry * 0.28;   // 閉じたまぶたは目の中心より少し下
    return `
    <rect x="${e.cx - rx}" y="${e.cy - ry}" width="${rx * 2}" height="${ry * 2}" fill="url(#skin${i})" mask="url(#m${i})"/>
    <path d="M ${e.cx - e.rx * 0.92} ${y - 6} Q ${e.cx} ${y + e.ry * 0.38} ${e.cx + e.rx * 0.92} ${y - 6}"
      fill="none" stroke="#2a1c22" stroke-width="15" stroke-linecap="round"/>`;
  }).join('');
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs}
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.8"/></filter>
  </defs>
  <g filter="url(#soft)">${parts}</g>
</svg>`;
}

// ---- メイン ---------------------------------------------------------------
const keyed = await keyGreen(SRC);
const { w: W, h: H } = keyed;
const base = sharp(keyed.data, { raw: { width: W, height: H, channels: 4 } }).png();
const baseBuf = await base.toBuffer();

// まぶたの肌色は、目のすぐ下（頬の上）から拾う
const skins = EYES.map(e => ({
  top: avgColor(keyed, e.cx, e.cy - e.ry - 22, 6),
  bottom: avgColor(keyed, e.cx, e.cy + e.ry + 22, 6),
}));

const states = {
  closed: baseBuf,
  half: await sharp(baseBuf).composite([{ input: Buffer.from(mouthSVG(W, H, 0.3)), left: 0, top: 0 }]).png().toBuffer(),
  open: await sharp(baseBuf).composite([{ input: Buffer.from(mouthSVG(W, H, 1.0)), left: 0, top: 0 }]).png().toBuffer(),
  blink: await sharp(baseBuf).composite([{ input: Buffer.from(blinkSVG(W, H, skins)), left: 0, top: 0 }]).png().toBuffer(),
};

// 4枚とも同じ外接矩形で切り出して、同じ大きさに縮小する（位置がずれないように）
const bb = bbox(keyed);
const pad = 8;
const crop = {
  left: Math.max(0, bb.x0 - pad), top: Math.max(0, bb.y0 - pad),
  width: Math.min(W, bb.x1 + pad) - Math.max(0, bb.x0 - pad),
  height: Math.min(H, bb.y1 + pad) - Math.max(0, bb.y0 - pad),
};
const outW = Math.round(crop.width * OUT_H / crop.height);
mkdirSync(OUT, { recursive: true });
for (const [name, buf] of Object.entries(states)) {
  await sharp(buf).extract(crop).resize(outW, OUT_H, { kernel: 'lanczos3' }).png().toFile(`${OUT}/${name}.png`);
}
const scale = OUT_H / crop.height;
writeFileSync(`${OUT}/meta.json`, JSON.stringify({
  w: outW, h: OUT_H,
  source: 'けらのすけ動画/けらのすけグリーンバック.png',
  crop,
  // 出力画像上の目印（確認・微調整用）
  mouth: { x: Math.round((MOUTH.cx - crop.left) * scale), y: Math.round((MOUTH.cy - crop.top) * scale) },
  eyes: EYES.map(e => ({ x: Math.round((e.cx - crop.left) * scale), y: Math.round((e.cy - crop.top) * scale) })),
}, null, 2), 'utf8');
console.log(`出力: ${OUT}（${outW}x${OUT_H}）crop=${JSON.stringify(crop)} 肌色=${skins.map(s => s.top + "→" + s.bottom).join(" ")}`);
