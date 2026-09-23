// 気良歌舞伎 実写PV（縦動画）自動組み立て — 試作
// 公演本編ビデオ（16:9）からカットを切り出し、9:16に収めて連結する。
// イラスト素材を使う build_sonezaki_video.mjs とは素材の性質が違う
// （静止画のループ合成ではなく、実尺のある動画クリップのトリミング）ため別スクリプトにしている。
//
// 使い方: node scripts/video/build_troupe_pv.mjs [--lang ja|en]
//   キャプションは {ja, en} で両方持ち、--lang で切り替える。
//   英語は日本語の直訳ではなく、同じ「素人／本気」の対比構造で言い換えている
//   （「田舎の素人」は身内の自虐として機能するが、英語に直訳すると見下しに読める）。

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function argVal(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}
const LANG = argVal('--lang', 'ja');
const FONT = LANG === 'en' ? 'Georgia' : 'Yu Mincho';
const t2 = (c) => (c && typeof c === 'object' ? c[LANG] : c); // caption解決

const W = 1080, H = 1920, FPS = 30, CRF = '19';
const FADE = 0.35;

const VIDEO_ROOT = 'D:/気良歌舞伎/ビデオ';
const V1 = `${VIDEO_ROOT}/2025気良歌舞伎 五代目座長襲名披露公演【第1幕】寿曽我対面 座長襲名口上.mp4`;
const V2 = `${VIDEO_ROOT}/2025気良歌舞伎 五代目座長襲名披露公演【第2幕】恋飛脚大和往来 封印切.mp4`;
const V3 = `${VIDEO_ROOT}/2025気良歌舞伎 五代目座長襲名披露公演【第3幕】白浪五人男 稲瀬川勢揃い.mp4`;

const BGM = 'D:/気良歌舞伎/youtubeチャンネル用/超訳！歌舞伎ナビ/PV曽根崎心中R8/BGM/道行.mp3';
const SE_TAIKO = 'D:/気良歌舞伎/youtubeチャンネル用/超訳！歌舞伎ナビ/歌舞伎ナビ共通素材/効果音/和太鼓でドン.mp3';
const SE_HYOSHIGI = 'D:/気良歌舞伎/youtubeチャンネル用/超訳！歌舞伎ナビ/歌舞伎ナビ共通素材/効果音/拍子木1.mp3';

const OUT_DIR = 'C:/Users/NAO/AppData/Local/Temp/claude/C--Users-NAO-github-kabuki-ai-agent/62594433-781b-49da-82e3-9b4fe0e990b2/scratchpad/pv_out';
const WORK = join(OUT_DIR, `work_${LANG}`);
const OUTPUT = join(OUT_DIR, LANG === 'en' ? 'PV_KeraKabuki_prototype_v1_EN.mp4' : 'PV_気良歌舞伎_試作_v1.mp4');

// クリップ定義
//   fit: cover(縦センタークロップ) / blurpad(横幅そのまま・上下ぼかし埋め)
//   cropX: cover時のクロップ注視点（0=左端 1=右端）
//   caption: null または {ja, en}
const CLIPS = [
  { src: V3, start: 191.8, dur: 2.4, fit: 'cover', cropX: 0.40,
    caption: null },
  { src: V3, start: 200.6, dur: 3.0, fit: 'blurpad',
    caption: { ja: '田舎の素人が、\\N本気で歌舞伎をやっています。',
               en: 'Everyday villagers.\\NReal Kabuki, seriously performed.' } },
  { src: V1, start: 443.6, dur: 2.4, fit: 'blurpad',
    caption: { ja: '寿曽我対面', en: 'Kotobuki Soga Taimen' } },
  { src: V1, start: 1158.3, dur: 2.4, fit: 'cover', cropX: 0.50,
    caption: null },
  { src: V2, start: 3625.0, dur: 2.6, fit: 'blurpad',
    caption: { ja: '恋飛脚大和往来「封印切」', en: 'Koibikyaku Yamato Orai — Fuuinkiri' } },
  { src: V3, start: 208.3, dur: 2.8, fit: 'blurpad',
    caption: { ja: '白浪五人男「稲瀬川勢揃い」', en: 'Shiranami Gonin Otoko — Inasegawa' } },
];

const BLUR_SIGMA = 40;

function run(args) {
  return execFileSync('ffmpeg', ['-hide_banner', '-y', ...args], { cwd: WORK, stdio: ['ignore', 'pipe', 'pipe'] });
}
function fmtAss(t) {
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = (t % 60);
  return `${h}:${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
}

const ASS_HEADER = `[Script Info]
ScriptType: v4.00+
PlayResX: ${W}
PlayResY: ${H}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Band,${FONT},${LANG === 'en' ? 46 : 58},&H00FFFFFF,&H00FFFFFF,&H00000000,&HB8201810,1,0,0,0,100,100,2,0,3,16,0,2,100,100,150,1
Style: Card,${FONT},${LANG === 'en' ? 50 : 64},&H00FFFFFF,&H00FFFFFF,&H00101020,&HA0000000,1,0,0,0,100,100,2,0,1,2,3,5,120,120,60,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

mkdirSync(WORK, { recursive: true });

// 1) クリップごとにセグメント生成
CLIPS.forEach((c, i) => {
  console.log(`--- clip${i} (${c.dur}s, fit=${c.fit})`);
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
  fg += `;[base]fade=t=in:d=${FADE},fade=t=out:st=${(c.dur - FADE).toFixed(2)}:d=${FADE}[vfade]`;

  let ass = ASS_HEADER;
  const caption = t2(c.caption);
  if (caption) {
    ass += `Dialogue: 0,${fmtAss(0.3)},${fmtAss(c.dur - 0.2)},Band,,0,0,0,,${caption}\n`;
  }
  const assName = `clip${i}.ass`;
  writeFileSync(join(WORK, assName), '\ufeff' + ass, 'utf8');
  fg += `;[vfade]subtitles=${assName}[vout]`;

  run([
    '-ss', String(c.start), '-t', String(c.dur), '-i', c.src,
    '-filter_complex', fg,
    '-map', '[vout]', '-an',
    '-c:v', 'libx264', '-crf', CRF, '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    `seg${i}.mp4`,
  ]);
});

// 2) エンドカード（黒背景＋テキスト）
console.log('--- エンドカード');
const cardDur = 5.5;
const CARD_TEXT = {
  ja: '{\\an5}気良歌舞伎\\N{\\fs40}岐阜県郡上市\\N\\N{\\fs36}田舎の素人が、\\N本気でやっている歌舞伎です。',
  en: '{\\an5}Kera Kabuki\\N{\\fs32}Gujo, Gifu, Japan\\N\\N{\\fs28}Everyday villagers,\\Nperforming real Kabuki.',
};
let cardAss = ASS_HEADER;
cardAss += `Dialogue: 0,${fmtAss(0.3)},${fmtAss(cardDur)},Card,,0,0,0,,${CARD_TEXT[LANG]}\n`;
writeFileSync(join(WORK, 'card.ass'), '\ufeff' + cardAss, 'utf8');
run([
  '-f', 'lavfi', '-t', String(cardDur), '-i', `color=c=0x14100c:s=${W}x${H}:r=${FPS}`,
  '-filter_complex', `[0:v]fade=t=in:d=${FADE},subtitles=card.ass[vout]`,
  '-map', '[vout]',
  '-c:v', 'libx264', '-crf', CRF, '-preset', 'medium', '-pix_fmt', 'yuv420p',
  'card.mp4',
]);

// 3) 連結
console.log('--- 連結');
const parts = CLIPS.map((_, i) => `seg${i}.mp4`).concat(['card.mp4']);
writeFileSync(join(WORK, 'concat.txt'), parts.map(f => `file '${f}'`).join('\n'), 'utf8');
run(['-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-c', 'copy', 'body.mp4']);

// 4) BGM + 効果音ミックス
console.log('--- BGM/SEミックス');
const bodyDur = CLIPS.reduce((a, c) => a + c.dur, 0) + cardDur;
const mixInputs = ['-i', 'body.mp4', '-stream_loop', '-1', '-i', BGM, '-i', SE_TAIKO, '-i', SE_HYOSHIGI];
const fg2 = `[1:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.85,`
  + `afade=t=in:d=1.0,afade=t=out:st=${(bodyDur - 2.5).toFixed(2)}:d=2.5,atrim=0:${bodyDur.toFixed(2)}[bgm];`
  + `[2:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.6,adelay=0:all=1[se0];`
  + `[3:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.5,adelay=${Math.round(CLIPS[0].dur * 1000)}:all=1[se1];`
  + `[bgm][se0][se1]amix=inputs=3:normalize=0:duration=first[mix]`;
run([...mixInputs, '-filter_complex', fg2, '-map', '0:v', '-map', '[mix]',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', 'body_mix.mp4']);

// 5) 最終出力
console.log('--- 最終出力');
run(['-i', 'body_mix.mp4', '-c:v', 'libx264', '-crf', CRF, '-preset', 'medium', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', OUTPUT]);

console.log('\n=== 完成 ===');
console.log(OUTPUT);
console.log(`総尺: ${bodyDur.toFixed(1)}s`);
