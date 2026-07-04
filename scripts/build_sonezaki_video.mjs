// 超訳！歌舞伎ナビ05「曽根崎心中」動画自動組み立て
// 台本: docs/youtube-script-sonezaki-kaisetsu.md の構成表に対応
// 使い方: node scripts/build_sonezaki_video.mjs [--config <json>] [--blocks 1,5]（部分再生成）
//   --config 省略時は studio/episodes/sonezaki05.json を読み込む
//   ブロック定義・定数はすべて設定JSONから読み込む（挙動は従来のBLOCKSハードコード版と同一）
//
// パイプライン:
//   1. ブロックごとに 画像スライド + けらのすけ(クロマキー) + 字幕ASS + ナレーション → seg{n}.mp4
//   2. セグメント連結 → body.mp4
//   3. BGM(音量オートメーション) + 効果音 をミックス → body_mix.mp4
//   4. OP正規化 + ED再構築(グリーンバック合成) + 本編 を連結 → 完成mp4

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { makePaths, resolveAsset } from '../studio/paths.mjs';

// ---- 引数 ------------------------------------------------------------------
function argVal(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}
const CONFIG_PATH = argVal('--config') || 'studio/episodes/sonezaki05.json';
const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));

// ---- 設定JSON → 定数展開 ---------------------------------------------------
const P = makePaths(config.episode.epDir);
const { COMMON, VOICE, OUT, WORK } = P;
const asset = (p) => resolveAsset(p, P);  // プレフィックスパス → 絶対パス

const S = config.settings;
const W = S.W, H = S.H, FPS = S.FPS;
const LEAD = S.LEAD;          // ブロック頭の間
const TAIL = S.TAIL;          // ブロック尻の間
const CRF = S.CRF;
// 字幕スタイル（スマホ視聴で読みやすいよう設定JSONから調整可能・フォールバックは従来値）
const SUB_FONT = S.subFontSize ?? 52;   // ナレーション字幕サイズ
const CAP_FONT = S.capFontSize ?? 42;   // 場面キャプションサイズ
const WRAP_MAX = S.wrapMax ?? 30;       // 1行の折返し文字数

// アバター定義: videos をプレフィックスパスから解決
const AVATAR = {};
for (const [k, v] of Object.entries(config.avatar)) {
  AVATAR[k] = { h: v.h, videos: v.videos.map(asset) };
}

// ---- ブロック定義（設定JSONから展開） ------------------------------------
// slides: weight はナレーション長に対する表示比率
// captions: sentFrom/sentTo は文インデックス（省略時はブロック全体）
// subtitleText（字幕用・漢字）を従来の text として使う。img/file/audio はプレフィックス解決。
const BLOCKS = config.blocks.map(raw => {
  const b = { ...raw };
  b.audio = asset(raw.audio);
  b.text = raw.subtitleText;
  if (raw.slides) b.slides = raw.slides.map(s => ({ ...s, img: asset(s.img) }));
  if (raw.slidesBySent) b.slidesBySent = raw.slidesBySent.map(s => ({ ...s, img: asset(s.img) }));
  if (raw.se) b.se = raw.se.map(s => ({ ...s, file: asset(s.file) }));
  if (raw.seBySent) b.seBySent = raw.seBySent.map(s => ({ ...s, file: asset(s.file) }));
  return b;
});

// ---- ユーティリティ --------------------------------------------------------
function run(args, opts = {}) {
  return execFileSync('ffmpeg', ['-hide_banner', '-y', ...args], { cwd: WORK, stdio: ['ignore', 'pipe', 'pipe'], ...opts });
}
function probeDur(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]);
  return parseFloat(out.toString().trim());
}
function splitSentences(text) {
  return text.match(/[^。！？]+[。！？]?/g).map(s => s.trim()).filter(Boolean);
}
// 長い字幕を句読点付近で2行に折る（libassのCJK自動折返しが効かないため）
function wrapLine(s, max = WRAP_MAX) {
  if (s.length <= max) return s;
  const mid = s.length / 2;
  let best = -1;
  for (let i = 6; i < s.length - 4; i++) {
    if (s[i] === '、' || s[i] === '—') {
      if (best < 0 || Math.abs(i - mid) < Math.abs(best - mid)) best = i;
    }
  }
  if (best < 0) best = Math.floor(mid) - 1;
  const a = s.slice(0, best + 1), b = s.slice(best + 1);
  return `${wrapLine(a, max)}\\N${wrapLine(b, max)}`;
}
function fmtAss(t) {
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = (t % 60);
  return `${h}:${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
}
function fmtChap(t) {
  const m = Math.floor(t / 60), s = Math.round(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// 文ごとの開始/終了時刻（ブロック内、LEADを含む絶対秒）を文字数比で割り当て
function sentenceTimes(block, narrDur) {
  const sents = splitSentences(block.text);
  const total = sents.reduce((a, s) => a + s.length, 0);
  let t = LEAD;
  return sents.map(s => {
    const d = (s.length / total) * narrDur;
    const e = { text: s, start: t, end: t + d };
    t += d;
    return e;
  });
}

const ASS_HEADER = `[Script Info]
ScriptType: v4.00+
PlayResX: ${W}
PlayResY: ${H}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Meiryo,${SUB_FONT},&H00FFFFFF,&H00FFFFFF,&H00201830,&H90000000,1,0,0,0,100,100,0,0,1,3,2,2,80,80,50,1
Style: Cap,Meiryo,${CAP_FONT},&H00FFFFFF,&H00FFFFFF,&H00000000,&H70000000,1,0,0,0,100,100,0,0,3,2,0,7,50,50,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

// ---- メイン ---------------------------------------------------------------
mkdirSync(WORK, { recursive: true });

const only = (() => {
  const i = process.argv.indexOf('--blocks');
  return i >= 0 ? process.argv[i + 1].split(',') : null;
})();

// 1) 各ブロックの長さを確定
for (const b of BLOCKS) {
  b.narrDur = probeDur(b.audio);
  b.dur = LEAD + b.narrDur + (b.tail ?? TAIL);
  b.sents = sentenceTimes(b, b.narrDur);
  // slidesBySent → weight 換算
  if (b.slidesBySent) {
    b.slides = b.slidesBySent.map(s => {
      const from = b.sents[s.sentFrom], to = b.sents[s.sentTo];
      return { img: s.img, weight: (to.end - from.start) / b.narrDur };
    });
  }
  if (b.captionsBySent) {
    b.captions = b.captionsBySent.map(c => ({
      text: c.text, start: b.sents[c.sentFrom].start, end: b.sents[c.sentTo].end,
    }));
  }
  if (b.seBySent) {
    b.se = (b.se ?? []).concat(b.seBySent.map(s => ({ file: s.file, at: b.sents[s.sent].start - LEAD, vol: s.vol })));
  }
}

// 2) セグメント生成
for (const b of BLOCKS) {
  if (only && !only.includes(b.id)) continue;
  console.log(`--- ブロック${b.id} (${b.dur.toFixed(1)}s)`);

  // 字幕ASS
  let ass = ASS_HEADER;
  for (const s of b.sents) {
    ass += `Dialogue: 0,${fmtAss(s.start)},${fmtAss(Math.min(s.end + 0.15, b.dur))},Sub,,0,0,0,,${wrapLine(s.text)}\n`;
  }
  for (const c of (b.captions ?? [])) {
    const start = c.start ?? (c.frac ? LEAD + c.frac[0] * b.narrDur : 0.2);
    const end = c.end ?? (c.frac ? LEAD + c.frac[1] * b.narrDur : b.dur);
    ass += `Dialogue: 1,${fmtAss(start)},${fmtAss(end)},Cap,,0,0,0,,${c.text}\n`;
  }
  const assName = `block${b.id}.ass`;
  writeFileSync(join(WORK, assName), '﻿' + ass, 'utf8');

  // 入力: スライド画像 → けらのすけ → ナレーション
  const args = [];
  const totalW = b.slides.reduce((a, s) => a + s.weight, 0);
  const slideDurs = b.slides.map(s => (s.weight / totalW) * b.dur);
  b.slides.forEach((s, i) => args.push('-loop', '1', '-framerate', String(FPS), '-t', slideDurs[i].toFixed(3), '-i', s.img));
  const nSlides = b.slides.length;

  const av = AVATAR[b.avatar];
  let avIdx = -1;
  if (av) {
    avIdx = nSlides;
    // ブロックごとに１/２を交互に使うと単調さが減る
    const v = av.videos[Number(b.id.replace(/\D/g, '')) % av.videos.length] ?? av.videos[0];
    args.push('-stream_loop', '-1', '-i', v);
  }
  const naIdx = avIdx >= 0 ? avIdx + 1 : nSlides;
  args.push('-i', b.audio);

  // filtergraph
  let fg = '';
  for (let i = 0; i < nSlides; i++) {
    // ゆかりの地の4:3実写は上寄りクロップ（鳥居・像の頭が切れないように）
    const crop = b.slides[i].img.includes('ゆかりの地')
      ? `crop=${W}:${H}:(iw-${W})/2:(ih-${H})*0.15`
      : `crop=${W}:${H}`;
    fg += `[${i}:v]scale=${W}:${H}:force_original_aspect_ratio=increase,${crop},setsar=1,fps=${FPS}[s${i}];`;
  }
  fg += b.slides.map((_, i) => `[s${i}]`).join('') + `concat=n=${nSlides}:v=1:a=0[base];`;
  let vlast = 'base';
  if (av) {
    fg += `[${avIdx}:v]scale=-1:${av.h},format=rgba,colorkey=0x00FF00:0.30:0.10,despill=type=green[avk];`;
    fg += `[${vlast}][avk]overlay=x=W-w-70:y=H-h[ov];`;
    vlast = 'ov';
  }
  fg += `[${vlast}]subtitles=${assName}[vsub];`;
  fg += `[${naIdx}:a]adelay=${Math.round(LEAD * 1000)}:all=1,apad,aresample=48000,aformat=channel_layouts=stereo[aout]`;

  run([
    ...args, '-filter_complex', fg,
    '-map', '[vsub]', '-map', '[aout]',
    '-t', b.dur.toFixed(3),
    '-c:v', 'libx264', '-crf', CRF, '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    `seg${b.id}.mp4`,
  ]);
}

// 3) 本編連結
console.log('--- 本編連結');
writeFileSync(join(WORK, 'body.txt'), BLOCKS.map(b => `file 'seg${b.id}.mp4'`).join('\n'), 'utf8');
run(['-f', 'concat', '-safe', '0', '-i', 'body.txt', '-c', 'copy', 'body.mp4']);

// 4) BGM + SE ミックス
console.log('--- BGM/SEミックス');
const bodyDur = BLOCKS.reduce((a, b) => a + b.dur, 0);
let t = 0;
const starts = {};
for (const b of BLOCKS) { starts[b.id] = t; t += b.dur; }
const quietStart = starts[S.quietFromBlock], quietEnd = starts[S.quietToBlock];

const mixInputs = ['-i', 'body.mp4', '-stream_loop', '-1', '-i', asset(S.bgm)];
const seList = [];
for (const b of BLOCKS) {
  for (const s of (b.se ?? [])) {
    seList.push({ ...s, absAt: starts[b.id] + LEAD + (s.at ?? 0), blockDur: b.dur });
  }
}
seList.forEach(s => mixInputs.push('-i', s.file));

// BGM: 通常0.13 → 静かなパート0.045、端でフェード
let fg2 = `[1:a]aresample=48000,aformat=channel_layouts=stereo,`
  + `volume='if(between(t,${quietStart.toFixed(2)},${quietEnd.toFixed(2)}),${S.bgmVolQuiet},${S.bgmVolNormal})':eval=frame,`
  + `afade=t=in:d=1.5,afade=t=out:st=${(bodyDur - 3).toFixed(2)}:d=3,atrim=0:${bodyDur.toFixed(2)}[bgm];`;
const mixLabels = ['[0:a]', '[bgm]'];
seList.forEach((s, i) => {
  const idx = i + 2;
  let chain = `[${idx}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${s.vol}`;
  if (s.ambient) chain += `,atrim=0:${s.blockDur.toFixed(2)},afade=t=out:st=${(s.blockDur - 2.5).toFixed(2)}:d=2.5`;
  chain += `,adelay=${Math.round(s.absAt * 1000)}:all=1[se${i}];`;
  fg2 += chain;
  mixLabels.push(`[se${i}]`);
});
fg2 += mixLabels.join('') + `amix=inputs=${mixLabels.length}:normalize=0:duration=first[mix]`;
run([...mixInputs, '-filter_complex', fg2, '-map', '0:v', '-map', '[mix]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', 'body_mix.mp4']);

// 5) OP正規化
console.log('--- OP');
run(['-i', asset(S.op),
  '-vf', `scale=${W}:${H},setsar=1,fps=${FPS},format=yuv420p`,
  '-c:v', 'libx264', '-crf', CRF, '-preset', 'medium',
  '-af', 'aresample=48000,aformat=channel_layouts=stereo', '-c:a', 'aac', '-b:a', '192k',
  'op.mp4']);

// 6) ED再構築（歌舞伎ナビED.movはffmpeg非対応DNxHDのため、けらのすけED.mp4を背景合成で再現）
console.log('--- ED');
const edSrc = asset(S.edSrc);
const edDur = probeDur(edSrc);
run([
  '-loop', '1', '-framerate', String(FPS), '-t', edDur.toFixed(3), '-i', asset(S.edBackground),
  '-i', edSrc,
  '-filter_complex',
  `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1[bg];`
  + `[1:v]scale=-1:1020,format=rgba,colorkey=0x00FF00:0.30:0.10,despill=type=green[av];`
  + `[bg][av]overlay=x=W-w-160:y=H-h,fps=${FPS},format=yuv420p[v];`
  + `[1:a]aresample=48000,aformat=channel_layouts=stereo[a]`,
  '-map', '[v]', '-map', '[a]', '-t', edDur.toFixed(3),
  '-c:v', 'libx264', '-crf', CRF, '-preset', 'medium',
  '-c:a', 'aac', '-b:a', '192k',
  'ed.mp4']);

// 7) 最終連結
console.log('--- 最終連結');
writeFileSync(join(WORK, 'final.txt'), ['op.mp4', 'body_mix.mp4', 'ed.mp4'].map(f => `file '${f}'`).join('\n'), 'utf8');
const FINAL = `${OUT}/${config.episode.outputName}`;
run(['-f', 'concat', '-safe', '0', '-i', 'final.txt',
  '-c:v', 'libx264', '-crf', CRF, '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
  '-movflags', '+faststart',
  FINAL]);

// 8) チャプター出力（概要欄用）
const opDur = probeDur(join(WORK, 'op.mp4'));
console.log('\n=== 完成 ===');
console.log(FINAL);
console.log(`総尺: ${fmtChap(opDur + bodyDur + edDur)}`);
console.log('\n--- 概要欄チャプター（実測） ---');
console.log(`0:00 オープニング`);
for (const ch of config.chapters) {
  console.log(`${fmtChap(opDur + starts[ch.block])} ${ch.label}`);
}
