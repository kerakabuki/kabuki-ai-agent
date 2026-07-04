// 超訳！歌舞伎ナビ05「曽根崎心中」動画自動組み立て
// 台本: docs/youtube-script-sonezaki-kaisetsu.md の構成表に対応
// 使い方: node scripts/build_sonezaki_video.mjs [--blocks 1,5]（部分再生成）
//
// パイプライン:
//   1. ブロックごとに 画像スライド + けらのすけ(クロマキー) + 字幕ASS + ナレーション → seg{n}.mp4
//   2. セグメント連結 → body.mp4
//   3. BGM(音量オートメーション) + 効果音 をミックス → body_mix.mp4
//   4. OP正規化 + ED再構築(グリーンバック合成) + 本編 を連結 → 完成mp4

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'D:/気良歌舞伎/youtubeチャンネル用/超訳！歌舞伎ナビ';
const EP = `${ROOT}/歌舞伎ナビ05曽根崎心中`;
const COMMON = `${ROOT}/歌舞伎ナビ共通素材`;
const GEN = `${EP}/画像/生成`;
const PHOTO = `${EP}/画像/ゆかりの地`;
const VOICE = `${EP}/音声`;
const OUT = `${EP}/出力`;
const WORK = `${OUT}/work`;

const W = 1920, H = 1080, FPS = 24;
const LEAD = 0.4;          // ブロック頭の間
const TAIL = 0.8;          // ブロック尻の間
const CRF = '18';

const AVATAR = {
  normal: { h: 620, videos: [`${COMMON}/けらのすけ動画/クチパクダミー１.mp4`, `${COMMON}/けらのすけ動画/クチパクダミー２.mp4`] },
  small:  { h: 380, videos: [`${COMMON}/けらのすけ動画/クチパクダミー１.mp4`] },
};

// ---- ブロック定義（構成表どおり） ----------------------------------------
// slides: weight はナレーション長に対する表示比率
// captions: sentFrom/sentTo は文インデックス（省略時はブロック全体）
const BLOCKS = [
  {
    id: '1', audio: 'ブロック1.mp3', avatar: 'normal',
    slides: [{ img: `${GEN}/08_サムネ背景.png`, weight: 1 }],
    text: '映画『国宝』を観た人なら、きっと覚えてるよね——『曽根崎心中』。歌舞伎の中でも屈指の名作なんだけど、実はどんな話か、ちゃんと知らない人も多いんじゃないかな。このお話がどういうものなのか、けらのすけが4分で超訳するね。',
    captions: [{ text: '曽根崎心中　4分解説' }],
  },
  {
    id: '2', audio: 'ブロック2.mp3', avatar: 'normal',
    slides: [
      { img: `${COMMON}/タイトル.png`, weight: 0.4 },
      { img: `${GEN}/04_生玉社前.png`, weight: 0.6 },
    ],
    text: '『曽根崎心中』は、いまから300年以上前、元禄16年に近松門左衛門が書いた物語だよ。大坂で実際に起きた事件をもとに、わずか数週間で書き上げられたと伝えられているんだ。ストーリーはシンプルで、登場人物も少ない。「歌舞伎って難しそう」と思っている人にこそ、おすすめの演目だよ。',
    captions: [{ text: '近松門左衛門・元禄16年（1703年）／実話がもとになった物語' }],
    se: [{ file: `${COMMON}/効果音/拍子木1.mp3`, at: 0, vol: 0.5 }],
  },
  {
    id: '3', audio: 'ブロック3.mp3', avatar: 'normal',
    slides: [
      { img: `${GEN}/01_お初カード.png`, weight: 0.17 },
      { img: `${GEN}/02_徳兵衛カード.png`, weight: 0.17 },
      { img: `${PHOTO}/生玉神社 (2).JPG`, weight: 0.18 },
      { img: `${GEN}/04_生玉社前.png`, weight: 0.24 },
      { img: `${GEN}/03_九平次カード.png`, weight: 0.24 },
    ],
    text: '主人公は、醤油屋で真面目に働く手代の徳兵衛と、遊女のお初。将来を誓い合った恋人同士だよ。ところが徳兵衛には、望まない縁談が持ち上がるんだ。必死に断って、勝手に受け取られた結納金もなんとか取り戻す。でもそのお金を、親友の九平次に「貸してほしい」と泣きつかれてしまう。',
    captions: [{ text: '第一場・生玉社前（いくたましゃまえ）— 現在の生國魂神社（大阪）', frac: [0.34, 0.76] }],
    se: [{ file: `${COMMON}/効果音/拍子木2.mp3`, frac: 0.34, vol: 0.5 }],
  },
  {
    id: '4', audio: 'ブロック4.mp3', avatar: 'normal',
    slides: [
      { img: `${GEN}/03_九平次カード.png`, weight: 0.55 },
      { img: `${GEN}/02_徳兵衛カード.png`, weight: 0.45 },
    ],
    text: '善意で貸したお金だった。でも九平次は、最初から騙すつもりだったんだ。「そんな金は借りていない」。それどころか、大勢の前で徳兵衛を殴りつける。商人にとって、信用は命。無実の罪を着せられた徳兵衛は、生きる道を見失ってしまう。',
    se: [{ file: `${COMMON}/効果音/和太鼓でドン.mp3`, at: 0, vol: 0.55 }],
  },
  {
    id: '5', audio: 'ブロック5.mp3', avatar: 'small', quiet: true,
    slides: [{ img: `${GEN}/05_天満屋の夜.png`, weight: 1 }],
    text: '傷だらけの徳兵衛を、お初はひそかに店の縁の下にかくまうんだ。そこへ現れた九平次が、徳兵衛の悪口を並べたてる。お初は縁の下の徳兵衛に、足先だけで問いかける——死ぬ覚悟はあるか、って。徳兵衛は、その足にそっと喉を当てて、うなずくんだ。',
    captions: [{ text: '第二場・天満屋' }],
    se: [{ file: `${COMMON}/効果音/風が吹く3.mp3`, at: 0, vol: 0.35 }],
  },
  {
    id: '6', audio: 'ブロック6.mp3', avatar: 'none', quiet: true, tail: 1.4,
    slides: [
      { img: `${GEN}/06_道行シルエット.png`, weight: 0.5 },
      { img: `${GEN}/07_天神の森.png`, weight: 0.5 },
    ],
    text: '夜が更けて、ふたりは曽根崎・天神の森へ。皮肉なことに、そのあと九平次の悪事は明らかになって、徳兵衛の無実も証明される。でも、もう間に合わない。ふたりはあの世で結ばれることを信じて、命を絶ったんだ。',
    captions: [{ text: '第三場・天神の森' }],
    se: [{ file: `${COMMON}/効果音/夏の田舎の夜.mp3`, at: 0, vol: 0.3, ambient: true }],
  },
  {
    id: '6-2', audio: 'ブロック6-2.mp3', avatar: 'none',
    slides: [
      { img: `${PHOTO}/お初天神 (10).JPG`, weight: 0.25 },
      { img: `${PHOTO}/お初天神 (14).JPG`, weight: 0.3 },
      { img: `${PHOTO}/お初天神 (12).JPG`, weight: 0.2 },
      { img: `${PHOTO}/お初天神 (9).JPG`, weight: 0.25 },
    ],
    text: 'ところで、この物語の舞台は、いまも大阪にあるんだよ。ふたりが最期を迎えた天神の森は、いまは「お初天神」と呼ばれる神社になっていて、お初と徳兵衛の像が、寄り添うように立っているんだ。300年たったいまも、恋の成就を願うたくさんの人が、お参りに来ているんだよ。',
    captions: [{ text: '露天神社（お初天神）・大阪市北区曽根崎' }],
  },
  {
    id: '7', audio: 'ブロック7.mp3', avatar: 'normal',
    // 見どころ①②③: 文の文字数比でスライドと太鼓の位置を揃える（下で自動計算）
    slidesBySent: [
      { img: `${GEN}/05_天満屋の夜.png`, sentFrom: 0, sentTo: 4 },
      { img: `${GEN}/06_道行シルエット.png`, sentFrom: 5, sentTo: 6 },
      { img: `${GEN}/03_九平次カード.png`, sentFrom: 7, sentTo: 8 },
    ],
    text: '見どころを、3つだけ紹介するね。ひとつめは、さっき話した「縁の下」の場面。言葉を交わせない状況で、足の感触だけで、生きるか死ぬかの覚悟を確かめ合う。客席が静まり返る、歌舞伎屈指の名場面だよ。映画『国宝』を観た人は、きっと「あの場面だ」って思うはず。ふたつめは、近松の言葉の美しさ。「この世のなごり、よもなごり」——死に向かう道行の一節は、悲しいのに、美しいんだ。みっつめは、悪役・九平次の憎たらしさ。本気で腹が立ってきたら、それはもう物語に入り込んでいる証拠だよ。',
    captionsBySent: [
      { text: '見どころ①　足の会話', sentFrom: 1, sentTo: 4 },
      { text: '見どころ②　この世のなごり、よもなごり', sentFrom: 5, sentTo: 6 },
      { text: '見どころ③　憎まれ役・九平次', sentFrom: 7, sentTo: 8 },
    ],
    seBySent: [
      { file: `${COMMON}/効果音/和太鼓でドン.mp3`, sent: 1, vol: 0.5 },
      { file: `${COMMON}/効果音/和太鼓でドン.mp3`, sent: 5, vol: 0.5 },
      { file: `${COMMON}/効果音/和太鼓でドン.mp3`, sent: 7, vol: 0.5 },
    ],
  },
  {
    id: '8', audio: 'ブロック8.mp3', avatar: 'normal',
    slides: [{ img: `${COMMON}/背景.png`, weight: 1 }],
    text: 'あらすじをもっと詳しく知りたい人は、概要欄の「演目ガイド」から読んでみてね。それじゃあ、また次の超訳で会おうね。',
    captions: [{ text: 'もっと詳しく → 概要欄「演目ガイド」kabukiplus.com' }],
  },
];

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
function wrapLine(s, max = 30) {
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
Style: Sub,Meiryo,52,&H00FFFFFF,&H00FFFFFF,&H00201830,&H90000000,1,0,0,0,100,100,0,0,1,3,2,2,80,80,50,1
Style: Cap,Meiryo,42,&H00FFFFFF,&H00FFFFFF,&H00000000,&H70000000,1,0,0,0,100,100,0,0,3,2,0,7,50,50,40,1

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
  b.narrDur = probeDur(`${VOICE}/${b.audio}`);
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
  args.push('-i', `${VOICE}/${b.audio}`);

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
const quietStart = starts['5'], quietEnd = starts['6-2'];

const mixInputs = ['-i', 'body.mp4', '-stream_loop', '-1', '-i', `${COMMON}/BGM/Neu_Kabuki.mp3`];
const seList = [];
for (const b of BLOCKS) {
  for (const s of (b.se ?? [])) {
    seList.push({ ...s, absAt: starts[b.id] + LEAD + (s.at ?? 0), blockDur: b.dur });
  }
}
seList.forEach(s => mixInputs.push('-i', s.file));

// BGM: 通常0.13 → 静かなパート0.045、端でフェード
let fg2 = `[1:a]aresample=48000,aformat=channel_layouts=stereo,`
  + `volume='if(between(t,${quietStart.toFixed(2)},${quietEnd.toFixed(2)}),0.045,0.13)':eval=frame,`
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
run(['-i', `${COMMON}/OP_ED/歌舞伎ナビOP.mov`,
  '-vf', `scale=${W}:${H},setsar=1,fps=${FPS},format=yuv420p`,
  '-c:v', 'libx264', '-crf', CRF, '-preset', 'medium',
  '-af', 'aresample=48000,aformat=channel_layouts=stereo', '-c:a', 'aac', '-b:a', '192k',
  'op.mp4']);

// 6) ED再構築（歌舞伎ナビED.movはffmpeg非対応DNxHDのため、けらのすけED.mp4を背景合成で再現）
console.log('--- ED');
const edSrc = `${COMMON}/けらのすけ動画/けらのすけED.mp4`;
const edDur = probeDur(edSrc);
run([
  '-loop', '1', '-framerate', String(FPS), '-t', edDur.toFixed(3), '-i', `${COMMON}/背景.png`,
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
const FINAL = `${OUT}/曽根崎心中_超訳歌舞伎ナビ_draft_v1.mp4`;
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
console.log(`${fmtChap(opDur + starts['1'])} 映画『国宝』のあの演目`);
console.log(`${fmtChap(opDur + starts['2'])} 作品紹介`);
console.log(`${fmtChap(opDur + starts['3'])} あらすじ`);
console.log(`${fmtChap(opDur + starts['6-2'])} ゆかりの地はいまも大阪に`);
console.log(`${fmtChap(opDur + starts['7'])} 見どころ3つ`);
console.log(`${fmtChap(opDur + starts['8'])} まとめ`);
