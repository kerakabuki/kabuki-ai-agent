// 気良歌舞伎 実写PV（縦動画）v2 — 設計やり直し版
//
// v1 の反省:
//   1. 本番の音を全部ミュートして生成BGMを敷いた → 義太夫・三味線・拍子木・客席が消えた
//   2. 全カット2.4〜2.8秒の等間隔＋全カットにクロスフェード → メトロノーム
//   3. テロップが黒箱＋白明朝の自動字幕デザイン → 歌舞伎の団体に見えない
//
// v2 の方針:
//   1. 本番の音をそのまま使う。素材側の打音（拍子木/ツケ）に映像を合わせる
//   2. ハードカット。尺は打音の間隔に従うので不揃いになる（それでいい）
//   3. 定式幕の三色（黒・柿・萌黄）を意匠に使う
//
// 使い方: node scripts/video/build_troupe_pv2.mjs [--lang ja|en]

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function argVal(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}
const LANG = argVal('--lang', 'ja');
const FONT = LANG === 'en' ? 'Georgia' : 'Yu Mincho';
const t2 = (c) => (c && typeof c === 'object' ? c[LANG] : c);

const W = 1080, H = 1920, FPS = 30, CRF = '19';

// ---- 定式幕の三色 -----------------------------------------------------------
// 原作にも「黒、柿、萌黄——三色に染まった定式幕」とある。歌舞伎の色の署名。
const KURO  = '0x0D0B09';
const KAKI  = '0xA84A25';
const MOEGI = '0x6E8F3A';
// 地色。黒地に黒の縞は読めないので、エンドカードは番付の紙の色に反転させる。
const KAMI  = '0xEFE7D8';

const VIDEO_ROOT = 'D:/気良歌舞伎/ビデオ';
const V1 = `${VIDEO_ROOT}/2025気良歌舞伎 五代目座長襲名披露公演【第1幕】寿曽我対面 座長襲名口上.mp4`;
const V2 = `${VIDEO_ROOT}/2025気良歌舞伎 五代目座長襲名披露公演【第2幕】恋飛脚大和往来 封印切.mp4`;
const V3 = `${VIDEO_ROOT}/2025気良歌舞伎 五代目座長襲名披露公演【第3幕】白浪五人男 稲瀬川勢揃い.mp4`;

const OUT_DIR = 'D:/気良歌舞伎/youtubeチャンネル用/PV気良歌舞伎';
const WORK = join(OUT_DIR, `work2_${LANG}`);
const OUTPUT = join(OUT_DIR, argVal('--out', LANG === 'en' ? 'PV_KeraKabuki_v2_EN.mp4' : 'PV_気良歌舞伎_v2.mp4'));

// ---- 音の骨格 ---------------------------------------------------------------
// V3 の 203.0秒以降をそのまま音の土台にする。
// 検出済みの打音（絶対秒）: 204.05 / 207.86 / 211.49 / 212.27 / 213.03 / 213.80 / 214.24 / 217.92
const BED_SRC = V3;
const BED_START = 203.0;
const BED_DUR = 20.0;

// 打音を BED_START からの相対秒に直したもの = カットの切れ目
//   1.05  4.86  8.49  9.27  10.03  10.80  11.24  14.92
// ここから「溜め → 溜め → 連打4発 → 解放 → エンドカード」という構造を作る。
const CUTS = [
  // 掴み。1カット目は長く持つ
  { src: V3, start: 191.8, dur: 4.86, fit: 'cover', cropX: 0.40, caption: null },

  // 名乗り
  { src: V3, start: 200.6, dur: 3.63, fit: 'blurpad',
    caption: { ja: '田舎の素人が、\\N本気で歌舞伎をやっています。',
               en: 'Everyday villagers.\\NReal Kabuki, seriously performed.' } },

  // ここから連打4発。打音の間隔がそのままカット尺になる（0.78→0.76→0.77→0.44）
  { src: V1, start: 443.6, dur: 0.78, fit: 'blurpad', caption: null },
  { src: V1, start: 1158.3, dur: 0.76, fit: 'cover', cropX: 0.50, caption: null },
  { src: V2, start: 3625.0, dur: 0.77, fit: 'blurpad', caption: null },
  { src: V3, start: 191.9, dur: 0.44, fit: 'cover', cropX: 0.55, caption: null },

  // 解放
  { src: V3, start: 208.3, dur: 3.68, fit: 'blurpad',
    caption: { ja: '白浪五人男「稲瀬川勢揃い」', en: 'Shiranami Gonin Otoko — Inasegawa' } },
];
// エンドカードの尺。Shorts/リールでは長い静止カードで離脱が起き、ループも切れるので
// --card で短くできるようにしてある（既定は音の解放に合わせた 5.08）。
const CARD_DUR = Number(argVal('--card', '5.08'));

const BLUR_SIGMA = 40;

function run(args) {
  return execFileSync('ffmpeg', ['-hide_banner', '-y', ...args], { cwd: WORK, stdio: ['ignore', 'pipe', 'pipe'] });
}
function fmtAss(t) {
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = (t % 60);
  return `${h}:${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
}

// テロップ帯: 黒帯の上に定式幕の三色を細いルールとして走らせる
const BAND_Y = 1580, BAND_H = 130, RULE_Y = 1568, RULE_H = 12;
const SEG = Math.floor(W / 3);
const drawBand = () =>
  `drawbox=x=0:y=${BAND_Y}:w=${W}:h=${BAND_H}:color=0x2A231C@0.82:t=fill,`
  + `drawbox=x=0:y=${RULE_Y}:w=${SEG}:h=${RULE_H}:color=${KURO}@1.0:t=fill,`
  + `drawbox=x=${SEG}:y=${RULE_Y}:w=${SEG}:h=${RULE_H}:color=${KAKI}@1.0:t=fill,`
  + `drawbox=x=${SEG * 2}:y=${RULE_Y}:w=${W - SEG * 2}:h=${RULE_H}:color=${MOEGI}@1.0:t=fill`;

const ASS_HEADER = `[Script Info]
ScriptType: v4.00+
PlayResX: ${W}
PlayResY: ${H}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Band,${FONT},${LANG === 'en' ? 44 : 54},&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,2,0,1,0,0,2,80,80,218,1
Style: Card,${FONT},${LANG === 'en' ? 46 : 58},&H001A150D,&H001A150D,&H00D8E8F0,&H00000000,0,0,0,0,100,100,3,0,1,0,0,5,100,100,60,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

mkdirSync(WORK, { recursive: true });

// 1) カットごとにセグメント生成（フェードなし＝ハードカット）
CUTS.forEach((c, i) => {
  console.log(`--- cut${i} (${c.dur}s, ${c.fit})`);
  let fg;
  if (c.fit === 'blurpad') {
    fg = `[0:v]split=2[bgi][fgi];`
      + `[bgi]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},gblur=sigma=${BLUR_SIGMA},format=yuv420p,setsar=1[bg];`
      + `[fgi]scale=${W}:-2,format=yuv420p,setsar=1[fg];`
      + `[bg][fg]overlay=(W-w)/2:(H-h)/2,fps=${FPS}[base]`;
  } else {
    const cx = c.cropX ?? 0.5;
    fg = `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,`
      + `crop=${W}:${H}:(iw-${W})*${cx}:(ih-${H})*0.5,setsar=1,fps=${FPS}[base]`;
  }

  const caption = t2(c.caption);
  let chain = '[base]';
  if (caption) {
    let ass = ASS_HEADER;
    ass += `Dialogue: 0,${fmtAss(0.0)},${fmtAss(c.dur)},Band,,0,0,0,,${caption}\n`;
    writeFileSync(join(WORK, `cut${i}.ass`), '\ufeff' + ass, 'utf8');
    chain += `${drawBand()},subtitles=cut${i}.ass[vout]`;
  } else {
    chain += `null[vout]`;
  }
  fg += `;${chain}`;

  run([
    '-ss', String(c.start), '-t', String(c.dur), '-i', c.src,
    '-filter_complex', fg,
    '-map', '[vout]', '-an',
    '-c:v', 'libx264', '-crf', CRF, '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    `cut${i}.mp4`,
  ]);
});

// 2) エンドカード — 番付の紙地に黒文字。定式幕の三色を一本の帯として走らせる。
//    黒地に黒の縞は読めないため、ここだけ明暗を反転させる。
console.log('--- エンドカード');
const CARD_TEXT = {
  ja: '{\\an2\\pos(540,880)}気良歌舞伎',
  en: '{\\an2\\pos(540,880)}Kera Kabuki',
};
const CARD_SUB = {
  ja: '{\\an8\\pos(540,1055)\\fs32}岐阜県郡上市明宝気良\\N\\N{\\fs30}田舎の素人が、\\N本気でやっている歌舞伎です。',
  en: '{\\an8\\pos(540,1055)\\fs28}Gujo, Gifu, Japan\\N\\N{\\fs26}Everyday villagers,\\Nperforming real Kabuki.',
};
let cardAss = ASS_HEADER;
cardAss += `Dialogue: 0,${fmtAss(0.3)},${fmtAss(CARD_DUR)},Card,,0,0,0,,${CARD_TEXT[LANG]}\n`;
cardAss += `Dialogue: 0,${fmtAss(0.5)},${fmtAss(CARD_DUR)},Card,,0,0,0,,${CARD_SUB[LANG]}\n`;
writeFileSync(join(WORK, 'card.ass'), '\ufeff' + cardAss, 'utf8');
const CY = 930, CH = 70;
run([
  '-f', 'lavfi', '-t', String(CARD_DUR), '-i', `color=c=${KAMI}:s=${W}x${H}:r=${FPS}`,
  '-filter_complex',
  `[0:v]drawbox=x=0:y=${CY}:w=${SEG}:h=${CH}:color=${KURO}@1.0:t=fill,`
  + `drawbox=x=${SEG}:y=${CY}:w=${SEG}:h=${CH}:color=${KAKI}@1.0:t=fill,`
  + `drawbox=x=${SEG * 2}:y=${CY}:w=${W - SEG * 2}:h=${CH}:color=${MOEGI}@1.0:t=fill,`
  + `subtitles=card.ass,fade=t=in:d=0.4[vout]`,
  '-map', '[vout]',
  '-c:v', 'libx264', '-crf', CRF, '-preset', 'medium', '-pix_fmt', 'yuv420p',
  'card.mp4',
]);

// 3) 連結
console.log('--- 連結');
const parts = CUTS.map((_, i) => `cut${i}.mp4`).concat(['card.mp4']);
writeFileSync(join(WORK, 'concat.txt'), parts.map(f => `file '${f}'`).join('\n'), 'utf8');
run(['-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-c', 'copy', 'body.mp4']);

// 4) 本番の音を乗せる
//    生成BGMは使わない。V3の実音をラウドネス正規化して土台にする。
console.log('--- 本番音のミックス');
const totalDur = CUTS.reduce((a, c) => a + c.dur, 0) + CARD_DUR;
run([
  '-i', 'body.mp4',
  '-ss', String(BED_START), '-t', String(BED_DUR), '-i', BED_SRC,
  '-filter_complex',
  `[1:a]aresample=48000,aformat=channel_layouts=stereo,`
  + `loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,`
  + `afade=t=in:d=0.3,afade=t=out:st=${(totalDur - 2.0).toFixed(2)}:d=2.0,`
  + `apad,atrim=0:${totalDur.toFixed(2)}[a]`,
  '-map', '0:v', '-map', '[a]',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', 'body_mix.mp4',
]);

// 5) 最終出力
console.log('--- 最終出力');
run(['-i', 'body_mix.mp4', '-c:v', 'libx264', '-crf', CRF, '-preset', 'medium', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', OUTPUT]);

console.log('\n=== 完成 ===');
console.log(OUTPUT);
console.log(`総尺: ${totalDur.toFixed(1)}s`);
