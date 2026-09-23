// 超訳！歌舞伎ナビ05「曽根崎心中」動画自動組み立て
// 台本: docs/youtube/youtube-script-sonezaki-kaisetsu.md の構成表に対応
// 使い方: node scripts/video/build_sonezaki_video.mjs [--config <json>] [--blocks 1,5]（部分再生成） [--dry-run]（尺の検算のみ）
//   --config 省略時は studio/episodes/sonezaki05.json を読み込む
//   ブロック定義・定数はすべて設定JSONから読み込む（挙動は従来のBLOCKSハードコード版と同一）
//   ブロックに layout がある場合（v6画面設計）は、先に
//   `node scripts/video/render_layout.mjs --config <json>` でレイアウトPNGを焼いておくこと
//   ブロックに clip がある場合（舞台映像インサート）は、元動画の区間をそのまま1ブロックにする
//   （ナレーション・字幕・けらのすけなし。尺は clip.dur。BGMは settings.bgmMuteOnClip で消す。clip.crop で寄せられる）
//
// パイプライン:
//   1. ブロックごとに 画像スライド + けらのすけ(クロマキー) + 字幕ASS + ナレーション → seg{n}.mp4
//   2. セグメント連結 → body.mp4
//   3. BGM(音量オートメーション) + 効果音 をミックス → body_mix.mp4
//   4. OP正規化 + ED再構築(グリーンバック合成) + 本編 を連結 → 完成mp4

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { makePaths, resolveAsset } from '../../studio/paths.mjs';

// ---- 引数 ------------------------------------------------------------------
function argVal(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}
const CONFIG_PATH = argVal('--config') || 'studio/episodes/sonezaki05.json';
const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));

// ---- 設定JSON → 定数展開 ---------------------------------------------------
const P = makePaths(config.episode.epDir);
const { COMMON, VOICE, OUT } = P;
// 同じエピソードの素材を使う別成果物（縦ショート等）が中間ファイルを潰し合わないよう、
// workName を指定すると work ディレクトリを分けられる。
const WORK = config.episode.workName ? join(P.OUT, config.episode.workName) : P.WORK;
// v6レイアウト（HTML→PNG）の焼き上がり置き場。render_layout.mjs と同じ規則で決める
const LAYOUT_DIR = join(WORK, 'layout');
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
// 字幕(Sub)スタイルの全項目。既定値は従来の見た目そのままで、
// settings.subStyle を書いたエピソードだけが上書きされる（v6の濃紺帯など）。
const SUB_STYLE = {
  fontName: 'Meiryo',
  fontSize: SUB_FONT,
  primaryColour: '&H00FFFFFF',
  secondaryColour: '&H00FFFFFF',
  outlineColour: '&H00201830',
  backColour: '&H90000000',
  bold: 1,
  spacing: 0,
  borderStyle: 1,   // 1=縁取り＋影 / 3=不透明の帯（v6の濃紺帯はこちら）
  outline: 3,       // borderStyle:3 のときは帯の内側余白になる
  shadow: 2,
  alignment: 2,
  marginL: 80,
  marginR: 80,
  marginV: 50,
  ...(S.subStyle ?? {}),
};
// 字幕の終わりを少し延ばして途切れを防ぐ既定動作は、次の字幕と一瞬重なる。
// この重なりがあると libass の衝突回避が働き、2行字幕が1行分せり上がって
// 位置が揃わない。subNoOverlap を立てると重なりを作らない（v6の帯字幕はこちら）。
const SUB_TAIL = 0.15;
const SUB_NO_OVERLAP = S.subNoOverlap ?? false;
// スライドの収め方（縦動画対応）
//   cover   : 画面いっぱいにセンタークロップ（従来動作・既定）
//   blurpad : 元のアスペクトのまま中央に置き、余白は同じ画のぼかしで埋める
// slides[].fit で個別に上書きできる。16:9素材を9:16に流用するとき、
// 主役が中央にある絵は cover、端に寄っている絵は blurpad が向く。
const SLIDE_FIT = S.slideFit ?? 'cover';
const KENBURNS = S.kenburns ?? 0;       // スロー ズーム量（0.08 で最終8%拡大・0で無効）
const BLUR_SIGMA = S.blurSigma ?? 40;   // blurpad の余白のぼかし強さ
const FADE_DUR = S.fadeDur ?? 0.8;      // ブロックの In/Out フェード秒
// 舞台映像インサート（clip ブロック）の区間は舞台音を聞かせるため BGM を 0 にする（既定 true）
const BGM_MUTE_ON_CLIP = S.bgmMuteOnClip ?? true;
const BGM_CLIP_FADE = S.bgmClipFade ?? 0.3;  // BGM を 0 へ落とす／戻すときのなだらかさ（秒）
// ブロック内のスライドをクロスフェードでつなぐ秒数（0 = 従来のハードカット）。ブロック間は従来どおり連結
const SLIDE_XFADE = S.slideXfade ?? 0;
// スライドの切り替え時刻の決め方。"weight"（既定）= 従来どおり文の長さの比率をブロック尺に掛ける。
// "sentence" = layout の state が始まる文の字幕開始時刻に切り替えを合わせる（クロスフェードはその時刻を中心にかける）
const SLIDE_TIMING = S.slideTiming ?? 'weight';
// けらのすけの口パク（layout.keraLive = 口の形の素材フォルダ。closed/half/open/blink.png）。
// 未指定なら従来どおり（立ち姿はレイアウトPNGに焼き込み済み）
const KERA_LIVE_DIR = config.layout?.keraLive ? asset(config.layout.keraLive) : null;
const KERA_SHAPES = ['closed', 'half', 'open', 'blink'];
const KERA_OPEN = S.keraMouthOpen ?? 0.5;        // 発話音量の上位（90パーセンタイル）に対する比: これより大きいと開き
const KERA_HALF = S.keraMouthHalf ?? 0.2;        // これより大きいと半開き、未満は閉じ
const KERA_HOLD = 2;                             // 同じ形を最低これだけのフレーム保つ（ちらつき防止）
const KERA_BLINK = [2.5, 5];                     // まばたきの間隔（秒）
const KERA_BLINK_FRAMES = 3;
// layout.keraMotion: "video" のときは、口の形の素材の代わりに口パクダミー動画（グリーンバック）を重ねる。
// 口は声と同期しないが、体の揺れ・まばたき・口の動きがある（以前の回の見た目）。
// 位置は keraLive の矩形（closed.png ＝ 静止画の切り出し範囲）に、動画の同じ範囲を合わせる。
// 動画はグリーンバック静止画（2160x3840）と同じ絵を1/3にしたものなので、切り出し範囲も1/3でそのまま対応する。
const KERA_VIDEO = KERA_LIVE_DIR && config.layout?.keraMotion === 'video';
const KERA_VIDEO_TALK = (config.layout?.keraTalk
  ?? ['common:けらのすけ動画/クチパクダミー１.mp4', 'common:けらのすけ動画/クチパクダミー２.mp4']).map(asset);
const KERA_VIDEO_IDLE = asset(config.layout?.keraIdle ?? 'common:けらのすけ動画/けらのすけ（無言待機）.mp4');
const KERA_STILL_W = 2160;   // 口の形の素材の元にしたグリーンバック静止画の幅
// 口の形の素材の meta.json（静止画からの切り出し範囲 crop を動画の位置合わせに使う）
const KERA_META = KERA_VIDEO ? JSON.parse(readFileSync(join(KERA_LIVE_DIR, 'meta.json'), 'utf8')) : null;

// アバター定義: videos をプレフィックスパスから解決
const AVATAR = {};
for (const [k, v] of Object.entries(config.avatar ?? {})) {
  AVATAR[k] = { h: v.h, videos: v.videos.map(asset) };
}

// ---- ブロック定義（設定JSONから展開） ------------------------------------
// slides: weight はナレーション長に対する表示比率
// captions: sentFrom/sentTo は文インデックス（省略時はブロック全体）
// subtitleText（字幕用・漢字）を従来の text として使う。img/file/audio はプレフィックス解決。
const BLOCKS = config.blocks.map(raw => {
  const b = { ...raw };
  // 音声なしブロック（テキストカード＋BGMのみのPV等）は audio を持たない → null
  b.audio = raw.audio ? asset(raw.audio) : null;
  b.text = raw.subtitleText;
  if (raw.slides) b.slides = raw.slides.map(s => ({ ...s, img: asset(s.img) }));
  if (raw.slidesBySent) b.slidesBySent = raw.slidesBySent.map(s => ({ ...s, img: asset(s.img) }));
  if (raw.se) b.se = raw.se.map(s => ({ ...s, file: asset(s.file) }));
  if (raw.seBySent) b.seBySent = raw.seBySent.map(s => ({ ...s, file: asset(s.file) }));
  if (raw.clip) b.clip = { ...raw.clip, src: asset(raw.clip.src) };
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
function probeSize(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file]);
  const [w, h] = out.toString().trim().split(',').map(Number);
  return { w, h };
}
// 静止画のスローズーム。入力は -loop 1 で複数フレーム化済みなので d=1
// （d>1 だと入力フレーム数×d に増殖する）。事前に2倍へ拡大して粗さを抑える。
function zoomChain(frames, outW, outH) {
  return `zoompan=z='1+${KENBURNS}*on/${frames}':d=1`
    + `:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${outW}x${outH}:fps=${FPS}`;
}
function splitSentences(text) {
  // 「どうして？」のように句点類の直後が閉じカッコなら、そこでは文を切らない
  // （切ると「」から見ていこう。」という字幕ができる）
  const s = text ?? '';
  const out = [];
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    cur += s[i];
    if ('。！？'.includes(s[i]) && !'」』）)'.includes(s[i + 1] ?? '')) {
      if (cur.trim()) out.push(cur.trim());
      cur = '';
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
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

// settings.subWrap: "balanced" のときの字幕組み（未指定なら従来の wrapLine のまま）。
// 1枚の字幕は最大2行・1行 WRAP_MAX 字。切れ目は「、」＞助詞の後ろ＞それ以外の順に選び、
// カタカナ語や漢字語の途中では切らない。2行に収まらない文は「、」で字幕を複数枚に分け、
// 文の表示時間を文字数比で割り振る。
const SUB_WRAP_BALANCED = S.subWrap === 'balanced';
const KATA = /[ァ-ヶー]/, KANJI = /[一-龯々]/, PARTICLE = /[はがをにでとものへや]/;
function breakScore(s, i) {  // s[i-1] と s[i] の間で切るときの点数（高いほど良い）
  const l = s[i - 1], r = s[i];
  if (l === '、') return 10;
  if (KATA.test(l) && KATA.test(r)) return -20;
  if (KANJI.test(l) && KANJI.test(r)) return -10;
  if (PARTICLE.test(l) && !/[ぁ-ゖ]/.test(r)) return 4;
  if (PARTICLE.test(l)) return 1;
  return 0;
}
function twoLines(s, max) {  // 2行に収まる最良の切れ目。収まらなければ null
  if (s.length <= max) return [s];
  let best = null;
  for (let i = 1; i < s.length; i++) {
    if (i > max || s.length - i > max) continue;
    if (breakScore(s, i) < 1) continue;  // 「、」か助詞の後ろでしか折らない（語の途中は不可）
    const score = breakScore(s, i) - Math.abs(i - s.length / 2) * 0.3;
    if (!best || score > best.score) best = { i, score };
  }
  return best ? [s.slice(0, best.i), s.slice(best.i)] : null;
}
function subtitleCues(text, start, end, max = WRAP_MAX) {
  const lines = twoLines(text, max);
  if (lines) return [{ text: lines.join('\\N'), start, end }];
  // 2行に収まらない → 真ん中に近い「、」（無ければ最良の切れ目）で2枚に分ける
  let cut = -1, bestScore = -Infinity;
  for (let i = 2; i < text.length - 1; i++) {
    const sc = breakScore(text, i) * 2 - Math.abs(i - text.length / 2) * 0.2;
    if (sc > bestScore) { bestScore = sc; cut = i; }
  }
  const a = text.slice(0, cut), b = text.slice(cut);
  const mid = start + (end - start) * (a.length / text.length);
  return [...subtitleCues(a, start, mid, max), ...subtitleCues(b, mid, end, max)];
}
function fmtAss(t) {
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = (t % 60);
  return `${h}:${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
}
function fmtChap(t) {
  const m = Math.floor(t / 60), s = Math.round(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// 写真レイヤー: 写真 → fit → 動き → 黒地の (x,y) に配置 → レイアウトPNG(アルファ)を重ねる → [s{i}]
//   inIdx: 写真の入力番号 / pngIdx: レイアウトPNGの入力番号 / frames: スライドの総フレーム数
// 動きは perspective で毎フレーム小数ピクセル単位に補間して描く（下の photoLayerChain 内の注記参照）。
function even(n) { return Math.round(n / 2) * 2; }
function photoLayerChain(i, inIdx, pngIdx, pl, frames) {
  const w = even(pl.w), h = even(pl.h);
  if (pl.x < 0 || pl.y < 0 || pl.x + w > W || pl.y + h > H) {
    throw new Error(`photoLayer の矩形が画面からはみ出しています: ${JSON.stringify({ x: pl.x, y: pl.y, w, h })}`);
  }
  const fx = pl.focus?.x ?? 0.5, fy = pl.focus?.y ?? 0.4;
  const A = pl.amount ?? 0.08;
  let fg = '';
  if (pl.fit === 'blurpad') {
    // 縦位置写真: 矩形を同じ写真のぼかしで埋め、手前に全体を収める
    fg += `[${inIdx}:v]split=2[pb${i}][pf${i}];`;
    fg += `[pb${i}]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},`
      + `gblur=sigma=${BLUR_SIGMA},setsar=1[pbb${i}];`;
    fg += `[pf${i}]scale=${w}:${h}:force_original_aspect_ratio=decrease:flags=lanczos,setsar=1[pff${i}];`;
    fg += `[pbb${i}][pff${i}]overlay=(W-w)/2:(H-h)/2,format=yuv444p[pc${i}];`;
  } else {
    // cover: 注視点 focus を残すようにクロップ
    fg += `[${inIdx}:v]scale=${w}:${h}:force_original_aspect_ratio=increase:flags=lanczos,`
      + `crop=${w}:${h}:(iw-${w})*${fx}:(ih-${h})*${fy},setsar=1,format=yuv444p[pc${i}];`;
  }
  // 動き（スライドの表示時間いっぱいで一定速度）。ズームは focus を中心に寄る／引く。
  // zoompan は切り出し位置を整数ピクセルに丸めるため毎フレーム揺れる（実測で隣同士の揺れ0.22）。
  // perspective で「写す範囲の四隅」を毎フレーム小数ピクセルで指定し、補間して描くと揺れが消える（同0.018）。
  // 2倍解像度で処理しても滑らかさ・画質はほぼ同じで約7倍遅いので、等倍で処理する。
  const P = `min(on/${Math.max(1, frames - 1)},1)`;
  let Z = null, left = null;
  switch (pl.move) {
    case 'zoomIn':  Z = `(1+${A}*${P})`; break;
    case 'zoomOut': Z = `(1+${A}-${A}*${P})`; break;
    // パンは amount 分だけ拡大して余白をつくり、focus を中心にその余白を横に渡る
    case 'panRight': Z = `(1+${A})`; left = `clip((W-W/${Z})*(${fx}-0.5+${P}),0,W-W/${Z})`; break;
    case 'panLeft':  Z = `(1+${A})`; left = `clip((W-W/${Z})*(${fx}+0.5-${P}),0,W-W/${Z})`; break;
    default: Z = null;
  }
  let motion = '';
  if (Z) {
    const L = left ?? `(W-W/${Z})*${fx}`;
    const T = `(H-H/${Z})*${fy}`;
    const R = `${L}+W/${Z}`, B = `${T}+H/${Z}`;
    motion = `perspective=x0='${L}':y0='${T}':x1='${R}':y1='${T}':x2='${L}':y2='${B}':x3='${R}':y3='${B}'`
      + `:interpolation=cubic:eval=frame,`;
  }
  fg += `[pc${i}]${motion}format=yuv420p,fps=${FPS}`
    + `,pad=${W}:${H}:${pl.x}:${pl.y}:color=black,setsar=1[pz${i}];`;
  fg += `[pz${i}][${pngIdx}:v]overlay=0:0:format=auto,format=yuv420p,setsar=1,fps=${FPS}[s${i}];`;
  return fg;
}

// ---- けらのすけの口パク ------------------------------------------------------
// ブロックIDをシードにした決定的な乱数（まばたきの間隔を毎回同じにする）
function seededRandom(seed) {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ブロック全体（LEAD込み）のフレームごとの口の形を決める。
// ナレーションを 48kHz モノラルPCMで取り出し、1/FPS 秒ごとのRMSを発話音量の90パーセンタイルと比べる。
// 音声の前後（LEAD・TAIL）は閉じ。音声なしブロックは全フレーム閉じ（まばたきだけ入る）。
function keraMouthFrames(b) {
  const RATE = 48000;
  const spf = RATE / FPS;                              // 1フレームあたりのサンプル数
  const n = Math.ceil(b.dur * FPS) + 2;
  const lead = Math.round(LEAD * 1000) * RATE / 1000;  // セグメントの adelay（ミリ秒丸め）と同じずれ
  const rms = new Array(n).fill(0);
  if (b.audio) {
    const pcm = execFileSync('ffmpeg', ['-v', 'error', '-i', b.audio, '-ac', '1', '-ar', String(RATE), '-f', 's16le', '-'],
      { maxBuffer: 1024 * 1024 * 1024 });
    const total = Math.floor(pcm.length / 2);
    for (let f = 0; f < n; f++) {
      const a = Math.max(0, Math.round(f * spf - lead)), z = Math.min(total, Math.round((f + 1) * spf - lead));
      if (z <= a) continue;
      let sum = 0;
      for (let i = a; i < z; i++) { const v = pcm.readInt16LE(i * 2); sum += v * v; }
      rms[f] = Math.sqrt(sum / (z - a));
    }
  }
  // 発話とみなす音量（最大の2%超）の90パーセンタイルを基準にする
  const max = Math.max(0, ...rms);
  const voiced = rms.filter(v => v > max * 0.02).sort((x, y) => x - y);
  const ref = voiced.length ? voiced[Math.min(voiced.length - 1, Math.floor(voiced.length * 0.9))] : 0;
  const raw = rms.map(v => {
    if (!ref) return 'closed';
    const r = v / ref;
    return r > KERA_OPEN ? 'open' : r > KERA_HALF ? 'half' : 'closed';
  });
  // 同じ形を最低 KERA_HOLD フレーム保つ
  const seq = [];
  let cur = raw[0], held = 0;
  for (let f = 0; f < n; f++) {
    if (raw[f] !== cur && held >= KERA_HOLD) { cur = raw[f]; held = 0; }
    seq.push(cur);
    held++;
  }
  // まばたき: 間隔は決定的な乱数。口が閉じている3フレームにだけ入れる（開いていれば最大2秒後ろへずらす）
  const rnd = seededRandom(b.id);
  const gap = () => Math.round((KERA_BLINK[0] + rnd() * (KERA_BLINK[1] - KERA_BLINK[0])) * FPS);
  for (let f = gap(); f < n - KERA_BLINK_FRAMES; f += gap()) {
    let g = f;
    const limit = Math.min(n - KERA_BLINK_FRAMES, f + 2 * FPS);  // 2秒先まで閉じ口の間を探す
    while (g < limit && !seq.slice(g, g + KERA_BLINK_FRAMES).every(x => x === 'closed')) g++;
    if (g >= limit) continue;
    for (let k = 0; k < KERA_BLINK_FRAMES; k++) seq[g + k] = 'blink';
    f = g;
  }
  const counts = Object.fromEntries(KERA_SHAPES.map(k => [k, seq.filter(x => x === k).length]));
  return { seq, counts, rms, ref };
}

// 口の形の素材を表示サイズへ縮小してキャッシュする（アルファの縁が黒ずまないよう sharp で縮める）
async function keraSprites(w, h) {
  const dir = join(WORK, 'kera_live', `${w}x${h}`);
  mkdirSync(dir, { recursive: true });
  const { default: sharp } = await import('sharp');
  const out = {};
  for (const k of KERA_SHAPES) {
    const src = join(KERA_LIVE_DIR, `${k}.png`);
    const dst = join(dir, `${k}.png`);
    if (!existsSync(src)) throw new Error(`口パク素材がありません: ${src}`);
    if (!existsSync(dst) || statSync(dst).mtimeMs <= statSync(src).mtimeMs) {
      await sharp(src).resize(w, h, { fit: 'fill' }).png().toFile(dst);
    }
    out[k] = dst;
  }
  return out;
}

// フレーム列 → ffconcat（同じ形が続く区間は1行にまとめる。最後の1枚は duration が効かないので重ねて書く）
function writeKeraConcat(file, seq, sprites) {
  const q = (p) => `'${p.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`;
  const lines = ['ffconcat version 1.0'];
  for (let f = 0; f < seq.length;) {
    let e = f;
    while (e < seq.length && seq[e] === seq[f]) e++;
    lines.push(`file ${q(sprites[seq[f]])}`, `duration ${((e - f) / FPS).toFixed(6)}`);
    f = e;
  }
  lines.push(`file ${q(sprites[seq[seq.length - 1]])}`);
  writeFileSync(file, lines.join('\n') + '\n', 'utf8');
}

// 元動画に音声ストリームがあるか
function hasAudioStream(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a',
    '-show_entries', 'stream=index', '-of', 'csv=p=0', file]);
  return out.toString().trim().length > 0;
}

// 舞台映像インサート → seg{id}.mp4
// 解像度・fps・音声形式は通常セグメントに揃え、-t で尺を厳守する（連結でズレないように）。
// 元素材は長尺・大容量なので -ss を入力側に置いて高速シークする
// （再エンコード時の入力側 -ss はフレーム精度で切り出される）。
function buildClipSegment(b) {
  const c = b.clip;
  const dur = b.dur.toFixed(3);
  const withAudio = hasAudioStream(c.src);
  const args = ['-ss', c.start.toFixed(3), '-t', dur, '-i', c.src];
  if (!withAudio) args.push('-f', 'lavfi', '-t', dur, '-i', 'anullsrc=r=48000:cl=stereo');
  const fade = b.fade
    ? `,fade=t=in:d=${FADE_DUR},fade=t=out:st=${(b.dur - FADE_DUR).toFixed(2)}:d=${FADE_DUR}`
    : '';
  // clip.crop {x,y,w,h}（元素材のピクセル座標）で役者に寄せられる。未指定なら全景
  const crop = c.crop ? `crop=${c.crop.w}:${c.crop.h}:${c.crop.x}:${c.crop.y},` : '';
  // 舞台音は区間の途中から切り出すので、頭と終わりを短くフェードさせてプツッという切れ目を消す
  const afIn = c.audioFadeIn ?? 0.15, afOut = c.audioFadeOut ?? 0.4;
  const afade = `,afade=t=in:d=${afIn},afade=t=out:st=${Math.max(0, b.dur - afOut).toFixed(3)}:d=${afOut}`;
  // 元素材の末尾を越えて尺が足りない場合も、最終フレームを伸ばして尺を守る
  const fg = `[0:v]${crop}scale=${W}:${H}:force_original_aspect_ratio=decrease,`
    + `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=${FPS},format=yuv420p,`
    + `tpad=stop_mode=clone:stop_duration=${dur}${fade}[v];`
    + `[${withAudio ? '0:a:0' : '1:a'}]aresample=48000,aformat=channel_layouts=stereo,volume=${c.vol ?? 1}${afade},apad[a]`;
  run([
    ...args, '-filter_complex', fg,
    '-map', '[v]', '-map', '[a]',
    '-t', dur,
    '-c:v', 'libx264', '-crf', CRF, '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    `seg${b.id}.mp4`,
  ]);
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
Style: Sub,${SUB_STYLE.fontName},${SUB_STYLE.fontSize},${SUB_STYLE.primaryColour},${SUB_STYLE.secondaryColour},${SUB_STYLE.outlineColour},${SUB_STYLE.backColour},${SUB_STYLE.bold},0,0,0,100,100,${SUB_STYLE.spacing},0,${SUB_STYLE.borderStyle},${SUB_STYLE.outline},${SUB_STYLE.shadow},${SUB_STYLE.alignment},${SUB_STYLE.marginL},${SUB_STYLE.marginR},${SUB_STYLE.marginV},1
Style: Cap,Meiryo,${CAP_FONT},&H00FFFFFF,&H00FFFFFF,&H00000000,&H70000000,1,0,0,0,100,100,0,0,3,2,0,7,50,50,40,1
Style: Title,Yu Mincho,${S.titleFontSize ?? 72},&H00FFFFFF,&H00FFFFFF,&H00101020,&HA0000000,1,0,0,0,100,100,2,0,1,2,3,5,120,120,60,1
Style: Band,Yu Mincho,${S.bandFontSize ?? 62},&H00FFFFFF,&H00FFFFFF,&H00000000,&HB8201810,1,0,0,0,100,100,2,0,3,16,0,2,100,100,${S.bandMarginV ?? 150},1

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
  if (b.clip) {
    // 舞台映像インサート: 元動画の区間がそのまま1ブロック。LEAD/TAIL は足さない。
    // 字幕・スライド・SE の文単位計算は持たない
    if (!(b.clip.dur > 0) || !(b.clip.start >= 0)) {
      throw new Error(`ブロック${b.id}: clip.start / clip.dur が不正です`);
    }
    b.dur = b.clip.dur;
    b.narrDur = b.dur;
    b.sents = [];
    b.slides = [];
    continue;
  }
  if (b.audio) {
    // 音声ありブロック: ナレーション尺を実測 → LEAD/tail を足して総尺
    b.narrDur = probeDur(b.audio);
    b.dur = LEAD + b.narrDur + (b.tail ?? TAIL);
  } else {
    // 音声なしブロック: 総尺 dur を直接指定（LEAD/tail込み）→ frac系タイミング計算用に narrDur を逆算
    // b.dur は raw.dur を展開済み（そのまま総尺として使う）
    b.narrDur = b.dur - LEAD - (b.tail ?? TAIL);
  }
  // 字幕テキストが無いブロックは文分割しない（captions のみで構成）
  b.sents = b.text ? sentenceTimes(b, b.narrDur) : [];
  // layout（v6画面設計）ブロック: render_layout.mjs が焼いたPNGをそのままスライドにする。
  // state の表示時間は slidesBySent と同じく sentFrom/sentTo から割り出す
  // （文が無いブロックは state ごとの weight を使う）。
  if (b.layout?.states?.length) {
    const states = b.layout.states;
    const bySent = b.sents.length > 0 && states.every(s => s.sentFrom != null && s.sentTo != null);
    b.slides = states.map((st, i) => {
      const img = join(LAYOUT_DIR, `block${b.id}_s${i + 1}.png`);
      if (!existsSync(img)) {
        throw new Error(`レイアウトPNGがありません: ${img}\n`
          + `  先に実行してください: node scripts/video/render_layout.mjs --config ${CONFIG_PATH}`);
      }
      const weight = bySent
        ? (b.sents[st.sentTo].end - b.sents[st.sentFrom].start) / b.narrDur
        : (st.weight ?? 1);
      // 写真レイヤー（動く写真の下地）はサイドカーJSONに解決済みで書かれている
      const sidecar = join(LAYOUT_DIR, `block${b.id}_s${i + 1}.json`);
      const side = existsSync(sidecar) ? JSON.parse(readFileSync(sidecar, 'utf8')) : {};
      const photoLayer = side.photoLayer ?? null;
      // 口パク用のけらのすけ矩形（keraLive のときだけ render_layout.mjs が書く）
      const kera = KERA_LIVE_DIR ? (side.kera ?? null) : null;
      if (KERA_LIVE_DIR && st.kera !== false && !('kera' in side)) {
        throw new Error(`けらのすけの矩形がサイドカーにありません: ${sidecar}\n`
          + `  keraLive を付けて再描画してください: node scripts/video/render_layout.mjs --config ${CONFIG_PATH} --force`);
      }
      if (st.photoLayer && !photoLayer) {
        throw new Error(`写真レイヤーのサイドカーがありません（または古い）: ${sidecar}\n`
          + `  再描画してください: node scripts/video/render_layout.mjs --config ${CONFIG_PATH} --force`);
      }
      // 1920x1080で焼いてあるので、そのまま等倍で敷く
      const startAt = bySent ? b.sents[st.sentFrom].start : null;
      const slide = photoLayer ? { img, weight, fit: 'cover', photoLayer, startAt } : { img, weight, fit: 'cover', startAt };
      if (kera) slide.kera = kera;
      return slide;
    });
  }
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

// 1.5) --dry-run: ffmpeg を叩かず、尺とスライドの割り当てだけ確かめる（設定JSONの検算用）
if (process.argv.includes('--dry-run')) {
  let acc = 0;
  for (const b of BLOCKS) {
    const slides = (b.slides ?? []).map(s => `${s.weight.toFixed(3)}:${s.img.split(/[\\/]/).pop()}`).join(' ');
    const what = b.clip
      ? `映像[${b.clip.src.split(/[\\/]/).pop()} ${b.clip.start}s〜${(b.clip.start + b.clip.dur).toFixed(2)}s]`
      : `スライド[${slides}]`;
    console.log(`ブロック${b.id}  開始 ${acc.toFixed(2)}s  尺 ${b.dur.toFixed(2)}s  文 ${b.sents.length}  ${what}`);
    if (KERA_LIVE_DIR && (b.slides ?? []).some(s => s.kera)) {
      const { counts } = keraMouthFrames(b);
      console.log(`  けらのすけ口パク: 開き ${counts.open} / 半開き ${counts.half} / 閉じ ${counts.closed} / まばたき ${counts.blink} フレーム`
        + (b.audio ? '' : '（音声なし: 閉じ＋まばたきのみ）'));
    }
    acc += b.dur;
  }
  console.log(`本編合計 ${acc.toFixed(2)}s (${fmtChap(acc)})`);
  process.exit(0);
}

// 2) セグメント生成
for (const b of BLOCKS) {
  if (only && !only.includes(b.id)) continue;
  console.log(`--- ブロック${b.id} (${b.dur.toFixed(1)}s)${b.clip ? ' 舞台映像' : ''}`);

  if (b.clip) {
    buildClipSegment(b);
    continue;
  }

  // 字幕ASS
  let ass = ASS_HEADER;
  b.sents.forEach((s, i) => {
    let end = Math.min(s.end + SUB_TAIL, b.dur);
    const next = b.sents[i + 1];
    if (SUB_NO_OVERLAP && next) end = Math.min(end, next.start - 0.01);
    if (SUB_WRAP_BALANCED) {
      for (const c of subtitleCues(s.text, s.start, end)) {
        ass += `Dialogue: 0,${fmtAss(c.start)},${fmtAss(c.end - 0.01)},Sub,,0,0,0,,${c.text}\n`;
      }
      return;
    }
    ass += `Dialogue: 0,${fmtAss(s.start)},${fmtAss(end)},Sub,,0,0,0,,${wrapLine(s.text)}\n`;
  });
  for (const c of (b.captions ?? [])) {
    const start = c.start ?? (c.frac ? LEAD + c.frac[0] * b.narrDur : 0.2);
    const end = c.end ?? (c.frac ? LEAD + c.frac[1] * b.narrDur : b.dur);
    ass += `Dialogue: 1,${fmtAss(start)},${fmtAss(end)},${c.style ?? 'Cap'},,0,0,0,,${c.text}\n`;
  }
  const assName = `block${b.id}.ass`;
  writeFileSync(join(WORK, assName), '﻿' + ass, 'utf8');

  // 入力: スライド画像 → けらのすけ → ナレーション
  const args = [];
  const totalW = b.slides.reduce((a, s) => a + s.weight, 0);
  let slideDurs = b.slides.map(s => (s.weight / totalW) * b.dur);
  if (SLIDE_TIMING === 'sentence' && b.slides.length > 1 && b.slides.every(s => s.startAt != null)) {
    const cuts = b.slides.map((s, i) => (i === 0 ? 0 : Math.max(0, s.startAt - SLIDE_XFADE / 2)));
    slideDurs = cuts.map((c, i) => (i < cuts.length - 1 ? cuts[i + 1] : b.dur) - c);
  }
  const nSlides = b.slides.length;
  // クロスフェード: 重なる分だけ最後以外のスライドを延ばし、ブロック尺 b.dur を守る
  // （短すぎるスライドがあるときは、そのスライドの半分までに抑える）
  const xf = SLIDE_XFADE > 0 && nSlides > 1
    ? Math.min(SLIDE_XFADE, ...slideDurs.map(d => d / 2))
    : 0;
  if (xf > 0) for (let i = 0; i < nSlides - 1; i++) slideDurs[i] += xf;
  b.slides.forEach((s, i) => args.push('-loop', '1', '-framerate', String(FPS), '-t', slideDurs[i].toFixed(3), '-i', s.img));

  // layout ブロックはけらのすけの立ち姿がPNGに焼き込まれているので、
  // グリーンバック動画のオーバーレイは載せない（avatar:"none" 相当）
  const av = b.layout ? null : AVATAR[b.avatar];
  let avIdx = -1;
  if (av) {
    avIdx = nSlides;
    // ブロックごとに１/２を交互に使うと単調さが減る
    const v = av.videos[Number(b.id.replace(/\D/g, '')) % av.videos.length] ?? av.videos[0];
    args.push('-stream_loop', '-1', '-i', v);
  }
  const naIdx = avIdx >= 0 ? avIdx + 1 : nSlides;
  if (b.audio) {
    args.push('-i', b.audio);
  } else {
    // 音声なしブロック: 無音ソースを流し込む（naIdx の位置は変えない）
    args.push('-f', 'lavfi', '-t', b.dur.toFixed(3), '-i', 'anullsrc=r=48000:cl=stereo');
  }
  // 写真レイヤーの写真は既存の入力番号をずらさないよう、ナレーションの後ろに足す
  const photoIdx = [];
  let nextIdx = naIdx + 1;
  b.slides.forEach((s, i) => {
    if (!s.photoLayer) return;
    photoIdx[i] = nextIdx++;
    args.push('-loop', '1', '-framerate', String(FPS), '-t', slideDurs[i].toFixed(3), '-i', s.photoLayer.img);
  });
  // けらのすけの口パク: 表示サイズごとに ffconcat の連番を1本ずつ読む
  const keraBySize = new Map();   // 'WxH' → { idx, slides:[i...], video? }
  if (KERA_VIDEO && b.slides.some(s => s.kera)) {
    // 口パクダミー動画: 話すブロックはクチパクダミーをブロックごとに交互に、音声なしは無言待機。ループして尺を満たす
    const talk = KERA_VIDEO_TALK[Number(String(b.id).replace(/\D/g, '') || 0) % KERA_VIDEO_TALK.length];
    const src = b.audio ? talk : KERA_VIDEO_IDLE;
    for (const [i, s] of b.slides.entries()) {
      if (!s.kera) continue;
      const key = `${Math.round(s.kera.w)}x${Math.round(s.kera.h)}`;
      if (!keraBySize.has(key)) {
        keraBySize.set(key, { idx: nextIdx++, slides: [], video: true });
        args.push('-stream_loop', '-1', '-t', (b.dur + 0.5).toFixed(3), '-i', src);
      }
      keraBySize.get(key).slides.push(i);
    }
  } else if (KERA_LIVE_DIR && b.slides.some(s => s.kera)) {
    const { seq } = keraMouthFrames(b);
    for (const [i, s] of b.slides.entries()) {
      if (!s.kera) continue;
      const w = Math.round(s.kera.w), h = Math.round(s.kera.h);
      const key = `${w}x${h}`;
      if (!keraBySize.has(key)) {
        const sprites = await keraSprites(w, h);
        const list = join(WORK, `kera_block${b.id}_${key}.ffconcat`);
        writeKeraConcat(list, seq, sprites);
        keraBySize.set(key, { idx: nextIdx++, slides: [] });
        args.push('-f', 'concat', '-safe', '0', '-i', list);
      }
      keraBySize.get(key).slides.push(i);
    }
  }

  // filtergraph
  let fg = '';
  for (let i = 0; i < nSlides; i++) {
    const slide = b.slides[i];
    const fit = slide.fit ?? SLIDE_FIT;
    const frames = Math.max(2, Math.round(slideDurs[i] * FPS));
    if (slide.photoLayer) {
      fg += photoLayerChain(i, photoIdx[i], i, slide.photoLayer, frames);
      continue;
    }
    // ズーム時は先に2倍で組み立て、zoompan で等倍に落とす
    const z = KENBURNS > 0 ? 2 : 1;

    if (fit === 'blurpad') {
      // 元画像を幅いっぱいの帯として中央に置き、上下の余白は同じ画のぼかしで埋める
      const src = probeSize(slide.img);
      const bandH = Math.round(W * src.h / src.w / 2) * 2;
      fg += `[${i}:v]split=2[bgi${i}][fgi${i}];`;
      fg += `[bgi${i}]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},`
          + `gblur=sigma=${BLUR_SIGMA},format=yuv420p,setsar=1[bgb${i}];`;
      fg += `[fgi${i}]scale=${W * z}:${bandH * z},format=yuv420p,`
          + (KENBURNS > 0 ? `${zoomChain(frames, W, bandH)},` : '')
          + `setsar=1[fgb${i}];`;
      fg += `[bgb${i}][fgb${i}]overlay=(W-w)/2:(H-h)/2,fps=${FPS}[s${i}];`;
    } else {
      // クロップの注視点（0〜1）。16:9素材を9:16に流用するとき、
      // 被写体が端に寄っている絵は cropX でそこを残す。
      // 既定はセンター。ゆかりの地の4:3実写だけ上寄せ（鳥居・像の頭が切れないように）。
      const cw = W * z, ch = H * z;
      const cx = slide.cropX ?? 0.5;
      const cy = slide.cropY ?? (slide.img.includes('ゆかりの地') ? 0.15 : 0.5);
      const crop = `crop=${cw}:${ch}:(iw-${cw})*${cx}:(ih-${ch})*${cy}`;
      fg += `[${i}:v]scale=${cw}:${ch}:force_original_aspect_ratio=increase,${crop},`
          + (KENBURNS > 0 ? `format=yuv420p,${zoomChain(frames, W, H)},` : '')
          + `setsar=1,fps=${FPS}[s${i}];`;
    }
  }
  // けらのすけの口パクを各スライドに重ねる（クロスフェードの前。スライドと一緒にフェードする）
  const lab = b.slides.map((_, i) => `s${i}`);
  if (keraBySize.size) {
    // スライド i の先頭がブロックの何フレーム目か（クロスフェードの重なり分を差し引く）
    const startF = [];
    let t0 = 0;
    for (let i = 0; i < nSlides; i++) { startF.push(Math.round(t0 * FPS)); t0 += slideDurs[i] - xf; }
    for (const { idx, slides, video } of keraBySize.values()) {
      const outs = slides.map(i => `ka${i}`);
      // 動画のときは、矩形（静止画の切り出し範囲）に動画の同じ範囲が重なるよう、動画全体を拡大して置く
      let vb = null;
      if (video) {
        const k0 = b.slides[slides[0]].kera;
        const vid = probeSize(b.audio ? KERA_VIDEO_TALK[0] : KERA_VIDEO_IDLE);
        const f = vid.w / KERA_STILL_W;                       // 静止画 → 動画の縮尺（1/3）
        const box = { x: KERA_META.crop.left * f, y: KERA_META.crop.top * f, w: KERA_META.crop.width * f };
        const s = k0.w / box.w;                               // 動画 → 画面の倍率
        vb = { s, box, W: even(vid.w * s), H: even(vid.h * s) };
        // 先に表示サイズへ拡大縮小してから抜く（抜いた後に縮めると縁の色がにごって黒い線になる）。
        // YUVの chromakey＋緑かぶり除去のあと、アルファを1px削って縁のにじみを落とす
        fg += `[${idx}:v]fps=${FPS},scale=${vb.W}:${vb.H}:flags=lanczos,`
          + `chromakey=0x00FF00:0.10:0.10,despill=type=green:mix=0.6:expand=0.2,format=rgba,`
          + `split[kc${idx}][kx${idx}];[kx${idx}]alphaextract,erosion[ke${idx}];[kc${idx}][ke${idx}]alphamerge`;
      } else {
        fg += `[${idx}:v]fps=${FPS},format=rgba`;
      }
      fg += (outs.length > 1 ? `,split=${outs.length}` : '') + outs.map(o => `[${o}]`).join('') + ';';
      for (const i of slides) {
        const k = b.slides[i].kera;
        let x = Math.round(k.x), y = Math.round(k.y), w = Math.round(k.w), h = Math.round(k.h);
        if (vb) {
          // 動画フレーム全体の置き場所（矩形の左上に、動画内の切り出し範囲の左上が来るように）
          x = Math.round(k.x - vb.box.x * vb.s); y = Math.round(k.y - vb.box.y * vb.s); w = vb.W; h = vb.H;
        }
        // 右帯の枠（kera:"large"）と画面の外は切り落とす
        const c = k.clip ?? { x: 0, y: 0, w: W, h: H };
        const x0 = Math.max(x, Math.round(c.x), 0), y0 = Math.max(y, Math.round(c.y), 0);
        const x1 = Math.min(x + w, Math.round(c.x + c.w), W), y1 = Math.min(y + h, Math.round(c.y + c.h), H);
        const f0 = startF[i], f1 = f0 + Math.round(slideDurs[i] * FPS) + 2;
        fg += `[ka${i}]trim=start_frame=${f0}:end_frame=${f1},setpts=PTS-STARTPTS,`
          + `crop=${x1 - x0}:${y1 - y0}:${x0 - x}:${y0 - y}[kb${i}];`;
        fg += `[s${i}][kb${i}]overlay=${x0}:${y0}:format=auto[k${i}];`;
        lab[i] = `k${i}`;
      }
    }
  }
  if (xf > 0) {
    // xfade は画素形式・タイムベースが揃っている必要があるので正規化してからつなぐ
    for (let i = 0; i < nSlides; i++) fg += `[${lab[i]}]format=yuv420p,setsar=1,fps=${FPS},settb=AVTB[q${i}];`;
    let cur = 'q0';
    let len = slideDurs[0];
    for (let k = 1; k < nSlides; k++) {
      const out = k === nSlides - 1 ? 'base' : `x${k}`;
      fg += `[${cur}][q${k}]xfade=transition=fade:duration=${xf.toFixed(3)}:offset=${(len - xf).toFixed(3)}[${out}];`;
      cur = out;
      len += slideDurs[k] - xf;
    }
  } else {
    fg += b.slides.map((_, i) => `[${lab[i]}]`).join('') + `concat=n=${nSlides}:v=1:a=0[base];`;
  }
  let vlast = 'base';
  if (av) {
    fg += `[${avIdx}:v]scale=-1:${av.h},format=rgba,colorkey=0x00FF00:0.30:0.10,despill=type=green[avk];`;
    fg += `[${vlast}][avk]overlay=x=W-w-70:y=H-h[ov];`;
    vlast = 'ov';
  }
  // fade:true のブロックは字幕ごとフェードさせるため subtitles の後にフェードを連結
  const blockFade = b.fade
    ? `,fade=t=in:d=${FADE_DUR},fade=t=out:st=${(b.dur - FADE_DUR).toFixed(2)}:d=${FADE_DUR}`
    : '';
  fg += `[${vlast}]subtitles=${assName}${blockFade}[vsub];`;
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
// 静音区間はオプション。未指定なら常時通常音量（starts[undefined] で NaN になるのを防ぐ）
const hasQuiet = S.quietFromBlock != null && S.quietToBlock != null;
const quietStart = hasQuiet ? starts[S.quietFromBlock] : null;
const quietEnd = hasQuiet ? starts[S.quietToBlock] : null;

// settings.bgmSections: 区間ごとに曲を切り替える（未指定なら従来どおり settings.bgm 1本）。
//   [{ from: '1', to: '3', file: 'bgm:x.mp3', vol: 0.2, offset: 0 }, ...]  from/to はブロックID（両端含む）。
//   offset は曲の何秒目から使うか。つなぎ目は settings.bgmSectionFade 秒（既定1.2）重ねてクロスフェードする
const BGM_SECTIONS = Array.isArray(S.bgmSections) && S.bgmSections.length ? S.bgmSections : null;
const mixInputs = ['-i', 'body.mp4'];
if (BGM_SECTIONS) BGM_SECTIONS.forEach(sec => mixInputs.push('-stream_loop', '-1', '-i', asset(sec.file)));
else mixInputs.push('-stream_loop', '-1', '-i', asset(S.bgm));
const seBase = 1 + (BGM_SECTIONS ? BGM_SECTIONS.length : 1);
const seList = [];
for (const b of BLOCKS) {
  for (const s of (b.se ?? [])) {
    seList.push({ ...s, absAt: starts[b.id] + LEAD + (s.at ?? 0), blockDur: b.dur });
  }
}
seList.forEach(s => mixInputs.push('-i', s.file));

// BGM: 通常0.13 → 静かなパート0.045、端でフェード
// clip ブロック（舞台映像）の区間は BGM を 0 に落とす。clip が無いエピソードは従来の式のまま
const clipRanges = BGM_MUTE_ON_CLIP
  ? BLOCKS.filter(b => b.clip).map(b => [starts[b.id], starts[b.id] + b.dur])
  : [];
let bgmVolExpr;
if (clipRanges.length === 0) {
  bgmVolExpr = hasQuiet
    ? `volume='if(between(t,${quietStart.toFixed(2)},${quietEnd.toFixed(2)}),${S.bgmVolQuiet},${S.bgmVolNormal})':eval=frame`
    : `volume=${S.bgmVolNormal}`;
} else {
  const base = hasQuiet
    ? `if(between(t,${quietStart.toFixed(2)},${quietEnd.toFixed(2)}),${S.bgmVolQuiet},${S.bgmVolNormal})`
    : `${S.bgmVolNormal}`;
  // 区間の外側 BGM_CLIP_FADE 秒で 1→0 に落とし、区間内は 0（区間からの距離で係数を決める）
  const gates = clipRanges.map(([s0, e0]) =>
    `clip(max(${s0.toFixed(3)}-t,t-${e0.toFixed(3)})/${BGM_CLIP_FADE},0,1)`);
  bgmVolExpr = `volume='${base}*${gates.join('*')}':eval=frame`;
}
let fg2;
let mixLabels;
if (!BGM_SECTIONS) {
  fg2 = `[1:a]aresample=48000,aformat=channel_layouts=stereo,`
    + `${bgmVolExpr},`
    + `afade=t=in:d=1.5,afade=t=out:st=${(bodyDur - 3).toFixed(2)}:d=3,atrim=0:${bodyDur.toFixed(2)}[bgm];`;
  mixLabels = ['[0:a]', '[bgm]'];
} else {
  const XF = S.bgmSectionFade ?? 1.2;
  const gate = clipRanges.length
    ? clipRanges.map(([s0, e0]) => `clip(max(${s0.toFixed(3)}-t,t-${e0.toFixed(3)})/${BGM_CLIP_FADE},0,1)`).join('*')
    : null;
  fg2 = '';
  mixLabels = ['[0:a]'];
  BGM_SECTIONS.forEach((sec, k) => {
    const endBlock = BLOCKS.find(b => b.id === String(sec.to));
    if (starts[sec.from] == null || !endBlock) throw new Error(`bgmSections[${k}] の from/to がブロックIDと一致しません: ${sec.from}〜${sec.to}`);
    const isFirst = k === 0, isLast = k === BGM_SECTIONS.length - 1;
    // 次の区間へは XF 秒はみ出して重ね、前の区間とは XF 秒かけて入れ替わる
    const s0 = Math.max(0, starts[sec.from] - (isFirst ? 0 : XF / 2));
    const e0 = isLast ? bodyDur : Math.min(bodyDur, starts[endBlock.id] + endBlock.dur + XF / 2);
    const len = e0 - s0;
    const fin = isFirst ? 1.5 : XF, fout = isLast ? 3 : XF;
    fg2 += `[${1 + k}:a]aresample=48000,aformat=channel_layouts=stereo,`
      + `atrim=start=${(sec.offset ?? 0).toFixed(2)},asetpts=PTS-STARTPTS,atrim=0:${len.toFixed(3)},`
      + `volume=${sec.vol ?? S.bgmVolNormal},afade=t=in:d=${fin},afade=t=out:st=${(len - fout).toFixed(3)}:d=${fout},`
      + `adelay=${Math.round(s0 * 1000)}:all=1`
      + (gate ? `,volume='${gate}':eval=frame` : '')
      + `[bgm${k}];`;
    mixLabels.push(`[bgm${k}]`);
  });
}
seList.forEach((s, i) => {
  const idx = i + seBase;
  let chain = `[${idx}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${s.vol}`;
  if (s.ambient) chain += `,atrim=0:${s.blockDur.toFixed(2)},afade=t=out:st=${(s.blockDur - 2.5).toFixed(2)}:d=2.5`;
  chain += `,adelay=${Math.round(s.absAt * 1000)}:all=1[se${i}];`;
  fg2 += chain;
  mixLabels.push(`[se${i}]`);
});
fg2 += mixLabels.join('') + `amix=inputs=${mixLabels.length}:normalize=0:duration=first[mix]`;
run([...mixInputs, '-filter_complex', fg2, '-map', '0:v', '-map', '[mix]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', 'body_mix.mp4']);

// 5) OP正規化（S.op が無ければスキップ）
let hasOp = false;
if (S.op) {
  console.log('--- OP');
  run(['-i', asset(S.op),
    '-vf', `scale=${W}:${H},setsar=1,fps=${FPS},format=yuv420p`,
    '-c:v', 'libx264', '-crf', CRF, '-preset', 'medium',
    '-af', 'aresample=48000,aformat=channel_layouts=stereo', '-c:a', 'aac', '-b:a', '192k',
    'op.mp4']);
  hasOp = true;
}

// 6) ED再構築（歌舞伎ナビED.movはffmpeg非対応DNxHDのため、けらのすけED.mp4を背景合成で再現）
// S.edSrc が無ければスキップ
let hasEd = false;
let edDur = 0;
if (S.edSrc) {
  console.log('--- ED');
  const edSrc = asset(S.edSrc);
  edDur = probeDur(edSrc);
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
  hasEd = true;
}

// 7) 最終連結（存在するパーツだけ連結）
console.log('--- 最終連結');
const finalParts = [];
if (hasOp) finalParts.push('op.mp4');
finalParts.push('body_mix.mp4');
if (hasEd) finalParts.push('ed.mp4');
writeFileSync(join(WORK, 'final.txt'), finalParts.map(f => `file '${f}'`).join('\n'), 'utf8');
const FINAL = `${OUT}/${config.episode.outputName}`;
run(['-f', 'concat', '-safe', '0', '-i', 'final.txt',
  '-c:v', 'libx264', '-crf', CRF, '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
  '-movflags', '+faststart',
  FINAL]);

// 8) チャプター出力（概要欄用）
const opDur = hasOp ? probeDur(join(WORK, 'op.mp4')) : 0;
const totalStr = fmtChap(opDur + bodyDur + edDur);
console.log('\n=== 完成 ===');
console.log(FINAL);
console.log(`総尺: ${totalStr}`);
console.log('\n--- 概要欄チャプター（実測） ---');

// チャプター行を組み立て（OPがあるときだけ先頭にオープニング。
// OPなしで入れると0:00が重複し、YouTubeがチャプターを認識しない）
const chapterList = hasOp ? [{ time: '0:00', title: 'オープニング' }] : [];
for (const ch of (config.chapters ?? [])) {
  chapterList.push({ time: fmtChap(opDur + starts[ch.block]), title: ch.label });
}
for (const ch of chapterList) {
  console.log(`${ch.time} ${ch.title}`);
}

// 実測値を出力フォルダに永続化（スタジオの「公開情報」タブが読み込む）
const chaptersJson = { total: totalStr, generatedAt: new Date().toISOString(), chapters: chapterList };
// workName 指定時（同一エピソードの別成果物）は本編の chapters.json を上書きしない
const chaptersPath = join(OUT, config.episode.workName ? `chapters_${config.episode.workName}.json` : 'chapters.json');
writeFileSync(chaptersPath, JSON.stringify(chaptersJson, null, 2) + '\n', 'utf8');
console.log(`\nチャプター実測値を保存: ${chaptersPath}`);
