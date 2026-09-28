// 実写素材（Insta360 などで撮った映像・記録写真）から動画を組み立てる
// 例: 「幕が開くまで」（studio/episodes/makuga_hiraku_made.json）・ショート（short_makuga_hiraku.json）
// 手順書: docs/youtube/makunouchi-2026.md §13
//
// 使い方:
//   素材一覧   node scripts/video/build_clip_video.mjs --inventory <素材フォルダ> [--out <出力フォルダ>]
//              → inventory.md（長さ・解像度・fps・音声）と thumbs/<名前>.jpg（コンタクトシート 6×4）
//              出力先の既定は <素材フォルダ>/出力/inventory/
//   組み立て   node scripts/video/build_clip_video.mjs --config <json> [--blocks A,B] [--draft]
//                [--src <素材フォルダ上書き>] [--out <出力フォルダ上書き>]
//              --draft   : 素材が未定（"TODO"）・見つからないクリップを仮の画にして、左上に「試作」と note を重ねる
//              --blocks  : 指定ブロックだけ作り直し、他は作業フォルダの既存 seg を使う
//
// パイプライン（組み立て）:
//   1. ブロックごとに クリップ（動画／写真／仮の画）を並べる → テロップ ASS を焼き込む → 映像・音声フェード
//      → seg{id}.mp4（確認用・AAC）と seg{id}.wav（連結用・PCM。AAC のつなぎ目のずれを避ける）
//   2. 映像は seg*.mp4 をコピーで連結、音声は seg*.wav を連結して loudnorm（2パス）→ AAC
//   3. <outputName> と <名前>.chapters.txt（YouTube のチャプター）を出力フォルダへ
//
// ffmpeg / ffprobe はシェルを通さず引数配列で呼ぶ（日本語・空白を含む Windows パスのため）。
// ASS は作業フォルダを cwd にして相対ファイル名で subtitles= に渡す（Windows のパスのエスケープ問題を避ける）。

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---- 共通 ------------------------------------------------------------------
const VIDEO_EXT = ['.mp4', '.mov', '.m4v', '.mkv'];
const INSTA_RAW_EXT = ['.insv', '.insp'];
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp'];
// リポジトリのルート（fallbackImg はここからの相対パス）
const REPO_ROOT = slash(resolve(dirname(fileURLToPath(import.meta.url)), '../..'));

function slash(p) { return String(p).replace(/\\/g, '/'); }
// 絶対パスか（C:/... ・ /... ・ //server/...）
function isAbs(p) { return /^([A-Za-z]:)?\//.test(slash(p)); }
function fail(msg) {
  console.error(`\nエラー: ${msg}`);
  process.exit(1);
}
function warn(msg) { console.warn(`  注意: ${msg}`); }

function argVal(name) {
  const i = process.argv.indexOf(name);
  if (i < 0) return null;
  const v = process.argv[i + 1];
  if (v == null || v.startsWith('--')) fail(`${name} のあとに値を書いてください。`);
  return v;
}
const hasFlag = (name) => process.argv.includes(name);

// ffmpeg 実行（失敗したら日本語のメッセージと ffmpeg のエラー末尾を出して止める）
function ffmpeg(args, cwd, label) {
  try {
    return execFileSync('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-loglevel', 'error', ...args], {
      cwd, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024,
    });
  } catch (e) {
    if (e.code === 'ENOENT') failNoFfmpeg();
    const tail = (e.stderr?.toString() ?? '').trim().split(/\r?\n/).slice(-15).join('\n');
    fail(`${label}に失敗しました（ffmpeg のエラー）:\n${tail || e.message}`);
  }
}
function failNoFfmpeg() {
  fail('ffmpeg / ffprobe が見つかりません。PowerShell で `winget install ffmpeg` を実行し、ターミナルを開き直してください。');
}

// ffprobe で動画の情報を調べる（読めなければ null）
const probeCache = new Map();
function probe(file) {
  if (probeCache.has(file)) return probeCache.get(file);
  let info = null;
  try {
    const out = execFileSync('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', file], {
      stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024,
    });
    const j = JSON.parse(out.toString());
    const v = (j.streams ?? []).find(s => s.codec_type === 'video' && s.disposition?.attached_pic !== 1);
    const a = (j.streams ?? []).find(s => s.codec_type === 'audio');
    let w = v?.width ?? 0, h = v?.height ?? 0;
    // スマホ等の縦動画は回転情報つきで保存されている → 表示上の縦横に直す
    const rot = Number(v?.side_data_list?.find(d => d.rotation != null)?.rotation ?? v?.tags?.rotate ?? 0);
    if (Math.abs(rot) % 180 === 90) [w, h] = [h, w];
    const dur = parseFloat(j.format?.duration ?? v?.duration ?? 'NaN');
    info = {
      dur: Number.isFinite(dur) ? dur : 0,
      w, h,
      fps: parseRate(v?.avg_frame_rate) || parseRate(v?.r_frame_rate),
      hasVideo: !!v,
      hasAudio: !!a,
      channels: a?.channels ?? 0,
      vcodec: v?.codec_name ?? '',
    };
  } catch (e) {
    if (e.code === 'ENOENT') failNoFfmpeg();
    info = null;
  }
  probeCache.set(file, info);
  return info;
}
function parseRate(r) {
  if (!r || r === '0/0') return 0;
  const [n, d] = r.split('/').map(Number);
  return d ? n / d : n;
}
function fmtFps(f) {
  if (!f) return '?';
  return Math.abs(f - Math.round(f)) < 0.01 ? String(Math.round(f)) : f.toFixed(2);
}
// 0:00.0 形式
function fmtClock(t) {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}
// ASS の時刻 h:mm:ss.cc
function fmtAss(t) {
  const cs = Math.max(0, Math.round(t * 100));
  const h = Math.floor(cs / 360000), m = Math.floor((cs % 360000) / 6000), s = Math.floor((cs % 6000) / 100);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs % 100).padStart(2, '0')}`;
}
// YouTube チャプターの時刻 m:ss（1時間以上は h:mm:ss）
function fmtChap(t) {
  const sec = Math.round(t);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}
const even = (x) => Math.max(2, Math.round(x / 2) * 2);
const num = (x, d = 3) => Number(x.toFixed(d)).toString();

// ffmpeg / 必要なフィルタがあるか確認
function checkFfmpeg(needed) {
  let out;
  try {
    out = execFileSync('ffmpeg', ['-hide_banner', '-filters'], { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024 }).toString();
  } catch (e) {
    if (e.code === 'ENOENT') failNoFfmpeg();
    fail(`ffmpeg を起動できませんでした: ${e.message}`);
  }
  const missing = needed.filter(f => !new RegExp(`\\s${f}\\s`).test(out));
  if (missing.length) {
    fail(`この ffmpeg には ${missing.join('・')} フィルタがありません。`
      + '`winget install ffmpeg`（Gyan の full ビルド）で入れ直してください。');
  }
}

// ============================================================================
// (a) 素材一覧モード
// ============================================================================
function walk(dir, skipDirs, out = []) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) {
      // 書き出した動画（出力フォルダ）は素材ではないので見ない
      if (e.name === '出力' || skipDirs.includes(slash(resolve(p)))) continue;
      walk(p, skipDirs, out);
    } else if (e.isFile()) {
      out.push(p);
    }
  }
  return out;
}
function fmtSize(bytes) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes < 1024 ** 2) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
}
const mdCell = (s) => String(s).replace(/\|/g, '\\|');

function runInventory(dirArg) {
  const root = slash(resolve(dirArg));
  if (!existsSync(root) || !statSync(root).isDirectory()) fail(`素材フォルダが見つかりません: ${root}`);
  checkFfmpeg(['fps', 'scale', 'tile']);
  const outDir = slash(resolve(argVal('--out') ?? `${root}/出力/inventory`));
  mkdirSync(`${outDir}/thumbs`, { recursive: true });

  const files = walk(root, [outDir]).map(slash);
  const rel = (p) => slash(relative(root, p));
  const byName = (a, b) => rel(a).localeCompare(rel(b), 'ja');
  const videos = files.filter(p => VIDEO_EXT.includes(extname(p).toLowerCase())).sort(byName);
  const raws = files.filter(p => INSTA_RAW_EXT.includes(extname(p).toLowerCase())).sort(byName);
  const lrvs = files.filter(p => extname(p).toLowerCase() === '.lrv');
  const images = files.filter(p => IMAGE_EXT.includes(extname(p).toLowerCase()));

  console.log(`素材フォルダ: ${root}`);
  console.log(`動画 ${videos.length} 本・Insta360 の元ファイル ${raws.length} 個・写真 ${images.length} 枚`);

  const rows = [];
  const sheets = [];
  const usedNames = new Set();
  videos.forEach((file, i) => {
    const r = rel(file);
    process.stdout.write(`[${i + 1}/${videos.length}] ${r} … `);
    const info = probe(file);
    if (!info || !info.hasVideo) {
      rows.push({ r, dur: '-', res: '-', fps: '-', audio: '-', note: '読めない（ffprobe で映像が見つからない）', sheet: '' });
      console.log('読めない');
      return;
    }
    const notes = [];
    if (info.w > 0 && info.w === info.h * 2) notes.push('360度（正距円筒）の可能性。設定の reframe で向きを切り出せる');
    if (info.h > info.w) notes.push('縦長');
    if (info.channels === 4) notes.push('音声4ch（空間音声の可能性。組み立て時は1ch目を使う）');

    // コンタクトシート: 等間隔に最大24コマ → 6×4 に並べる（drawtext は使わない）
    let name = r.replace(/\.[^.]+$/, '').replace(/[/\\:*?"<>|]/g, '__');
    if (usedNames.has(name)) name = `${name}_${extname(r).slice(1)}`;
    usedNames.add(name);
    // 0.5秒より細かくは取らない。各コマは区間の中央の時刻
    const n = Math.min(24, Math.max(1, Math.floor(info.dur * 2)));
    const step = info.dur / n;
    const times = Array.from({ length: n }, (_, k) => (k + 0.5) * step);
    // 長い素材はキーフレームだけ読む（5.7K の 360度素材を全部読むと時間がかかるため）
    const keyOnly = info.dur > 180;
    const sheetRel = `thumbs/${name}.jpg`;
    ffmpeg([
      ...(keyOnly ? ['-skip_frame', 'nokey'] : []),
      '-i', file, '-an', '-sn',
      // fps フィルタは k 番目の出力に「(k+0.5)×間隔 の直前のコマ」を使う → 区間の中央のコマになる
      '-vf', `fps=fps=${(1 / step).toFixed(6)}:start_time=0,scale=320:-2,tile=6x4`,
      '-frames:v', '1', '-q:v', '3', sheetRel,
    ], outDir, `コンタクトシート（${r}）の作成`);
    sheets.push({ r, sheetRel, times, keyOnly });
    rows.push({
      r,
      dur: `${fmtClock(info.dur)}（${info.dur.toFixed(1)}秒）`,
      res: `${info.w}×${info.h}`,
      fps: fmtFps(info.fps),
      audio: info.hasAudio ? `あり（${info.channels}ch）` : 'なし',
      note: notes.join('。'),
      sheet: `[${name}.jpg](${encodeURI(sheetRel)})`,
    });
    console.log('完了');
  });

  // ---- inventory.md ----
  let md = `# 素材一覧\n\n`;
  md += `- 素材フォルダ: \`${root}\`\n`;
  md += `- 作成: ${new Date().toLocaleString('ja-JP')}\n`;
  md += `- 設定JSONの clips の \`src\` には下の「ファイル」をそのまま書く。\`in\` は開始秒（下のタイル時刻が目安）。\n\n`;
  md += `## 動画（${videos.length}本）\n\n`;
  if (rows.length) {
    md += `| # | ファイル | 長さ | 解像度 | fps | 音声 | 備考 | コンタクトシート |\n|---|---|---|---|---|---|---|---|\n`;
    rows.forEach((x, i) => {
      md += `| ${i + 1} | ${mdCell(x.r)} | ${x.dur} | ${x.res} | ${x.fps} | ${x.audio} | ${mdCell(x.note)} | ${x.sheet} |\n`;
    });
  } else {
    md += `（MP4 / MOV / M4V / MKV が見つからなかった）\n`;
  }
  md += `\n## Insta360 の元ファイル（${raws.length}個・このままでは使えない）\n\n`;
  if (raws.length) {
    md += `| ファイル | 大きさ | 対応 |\n|---|---|---|\n`;
    for (const p of raws) {
      md += `| ${mdCell(rel(p))} | ${fmtSize(statSync(p).size)} | Insta360 Studio またはアプリで MP4 に書き出してから使う |\n`;
    }
  } else {
    md += `（.insv / .insp は無い）\n`;
  }
  if (lrvs.length) md += `\n- .lrv が ${lrvs.length} 個ある。プレビュー用の低画質ファイルなので使わない。\n`;
  if (images.length) md += `\n- 写真（jpg / png / webp）が ${images.length} 枚ある。clips に \`{"img": "ファイル"}\` で入れられる。\n`;

  md += `\n## コンタクトシートのタイル時刻\n\n`;
  md += `各シートは左上から右へ 1〜6、次の段が 7〜12 … と並ぶ（最大24コマ）。表の位置がシートの位置と同じ。数字は素材の先頭からの秒。\n`;
  for (const s of sheets) {
    md += `\n### ${mdCell(s.r)}\n\n\`${s.sheetRel}\`${s.keyOnly ? '（長い素材なのでキーフレームから取った。秒は±数秒ずれることがある）' : ''}\n\n`;
    md += `|   | 1列 | 2列 | 3列 | 4列 | 5列 | 6列 |\n|---|---|---|---|---|---|---|\n`;
    for (let row = 0; row < 4; row++) {
      const cells = [];
      for (let col = 0; col < 6; col++) {
        const k = row * 6 + col;
        cells.push(k < s.times.length ? `${k + 1}: ${s.times[k].toFixed(1)}秒` : '');
      }
      if (cells.every(c => !c)) break;
      md += `| ${row + 1}段 | ${cells.join(' | ')} |\n`;
    }
  }
  writeFileSync(`${outDir}/inventory.md`, md, 'utf8');
  console.log(`\n一覧: ${outDir}/inventory.md`);
  console.log(`コンタクトシート: ${outDir}/thumbs/`);
}

// ============================================================================
// (b) 組み立てモード
// ============================================================================
function runBuild(configPath) {
  if (!existsSync(configPath)) fail(`設定JSONが見つかりません: ${configPath}`);
  let config;
  try { config = JSON.parse(readFileSync(configPath, 'utf8')); } catch (e) { fail(`設定JSONを読めません（${configPath}）: ${e.message}`); }
  const EP = config.episode ?? {};
  const S = config.settings ?? {};
  const DRAFT = hasFlag('--draft');

  // ---- パス ----
  const srcOverride = argVal('--src');
  const SRC = slash(srcOverride ?? EP.srcDir ?? '');
  if (!SRC) fail('episode.srcDir（素材フォルダ）が設定されていません。');
  // --src だけ上書きしたときは、出力もその素材フォルダの下（出力）にする
  const OUT = slash(resolve(argVal('--out') ?? (srcOverride ? `${SRC}/出力` : (EP.outDir ?? `${SRC}/出力`))));
  const WORK = `${OUT}/${EP.workName ?? 'work'}`;
  if (!EP.outputName) fail('episode.outputName（書き出すファイル名）が設定されていません。');
  const FINAL = `${OUT}/${EP.outputName}`;

  // ---- 設定値 ----
  const W = S.W ?? 1920, H = S.H ?? 1080, FPS = S.FPS ?? 30;
  const CRF = String(S.CRF ?? 20), PRESET = S.preset ?? 'medium';
  const FADE_DUR = S.fadeDur ?? 0.5;         // ブロックの映像フェードの既定
  const AUDIO_FADE = S.audioFade ?? 0.08;    // クリップのつなぎ目の音声フェード
  const KENBURNS = S.kenburns ?? 0.06;       // 写真のゆっくりしたズーム量（0で無効）
  const BLUR_SIGMA = S.blurSigma ?? 40;      // contain の背景ぼかし
  const DEFAULT_FIT = S.fit ?? 'cover';
  const SR = 48000;                          // 音声のサンプルレート
  const PORTRAIT = H > W;

  if (!Array.isArray(config.blocks) || !config.blocks.length) fail('blocks がありません。');
  const ids = new Set();
  for (const b of config.blocks) {
    if (!b.id || !/^[A-Za-z0-9_-]+$/.test(b.id)) fail(`ブロックの id は英数字にしてください: ${JSON.stringify(b.id)}`);
    if (ids.has(b.id)) fail(`ブロックの id が重複しています: ${b.id}`);
    ids.add(b.id);
    if (!(b.dur > 0)) fail(`ブロック${b.id} の dur（秒）が正しくありません。`);
  }
  const only = (() => {
    const v = argVal('--blocks');
    if (!v) return null;
    const list = v.split(',').map(s => s.trim()).filter(Boolean);
    const unknown = list.filter(id => !ids.has(id));
    if (unknown.length) fail(`--blocks に無いブロックがあります: ${unknown.join(', ')}（あるのは ${[...ids].join(', ')}）`);
    return list;
  })();

  // ---- ASS スタイル ----
  const FONT = S.font ?? 'Yu Mincho';
  const NOTE_FONT = S.noteFont ?? 'Meiryo';
  const C_TEXT = '&H00DBEDF6';   // 生成り白 #f6eddb
  const C_GOLD = '&H00B9DCEA';   // 淡い金 #eadcb9
  const C_SUB = '&H00B5D9E8';    // 題名2行目 #e8d9b5
  const C_EDGE = '&H00101418';   // 縁取り（こげ茶に近い黒）
  const C_SHADOW = '&H80000000'; // 影
  const sz = (k, d) => S[k] ?? d;
  // Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut,
  //         ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
  const style = (name, font, size, color, bold, spacing, align, ml, mr, mv, o = {}) =>
    `Style: ${name},${font},${Math.round(size)},${color},${color},${o.edge ?? C_EDGE},${o.back ?? C_SHADOW},${bold ? -1 : 0},0,0,0,100,100,${spacing},0,`
    + `${o.border ?? 1},${o.outline ?? 2},${o.shadow ?? 2},${align},${Math.round(ml)},${Math.round(mr)},${Math.round(mv)},1`;
  const STYLES = {
    Main: style('Main', FONT, sz('mainFontSize', 56), C_TEXT, 1, sz('mainSpacing', 4), 2, 80, 80, sz('mainMarginV', 118)),
    Title: style('Title', FONT, sz('titleFontSize', 124), C_TEXT, 1, sz('titleSpacing', 25), 5, 80, 80, 0, { outline: 2, shadow: 3 }),
    Place: style('Place', FONT, sz('placeFontSize', 40), C_GOLD, 0, sz('placeSpacing', 10), 2, 80, 80, sz('placeMarginV', 124)),
    Label: style('Label', FONT, sz('labelFontSize', 44), C_TEXT, 1, sz('labelSpacing', 10), 1, sz('labelMarginL', 138), 80, sz('labelMarginV', 112)),
    Time: style('Time', FONT, sz('timeFontSize', 76), C_TEXT, 1, sz('timeSpacing', 12), 5, 80, 80, 0),
    Tagline: style('Tagline', FONT, sz('taglineFontSize', 56), C_TEXT, 1, sz('taglineSpacing', 8), 8, 80, 80, sz('taglineMarginV', 150)),
    // 縦長用: 画面の高さ 57〜68% あたり（ショートの下部UI・右のボタンに重ならない位置）
    MainV: style('MainV', FONT, sz('mainVFontSize', 66), C_TEXT, 1, sz('mainVSpacing', 4), 8, 60, 60, H * sz('mainVTop', 0.57)),
    SmallV: style('SmallV', FONT, sz('smallVFontSize', 42), C_GOLD, 0, sz('smallVSpacing', 5), 8, 60, 60, H * sz('smallVTop', 0.60)),
    // 試作の注記（左上・半透明の箱）
    Note: style('Note', NOTE_FONT, sz('noteFontSize', PORTRAIT ? 30 : 25), '&H00FFFFFF', 0, 0, 7,
      sz('noteMarginL', PORTRAIT ? 30 : 34), 40, sz('noteMarginV', PORTRAIT ? 150 : 28), { border: 3, outline: 6, shadow: 0, edge: '&H50000000', back: '&H00000000' }),
    // 仮画面の案内（--draft のときだけ使う）。中央のテロップ（Title・Time）と重ならないよう上寄り
    Center: style('Center', NOTE_FONT, PORTRAIT ? 44 : 40, '&H90FFFFFF', 0, 8, 8, 60, 60, H * 0.30, { outline: 0, shadow: 0 }),
    Shade: style('Shade', NOTE_FONT, 20, '&H00000000', 0, 0, 7, 0, 0, 0, { outline: 0, shadow: 0 }),
  };
  const CAPTION_STYLES = ['Main', 'Title', 'Place', 'Label', 'Time', 'Tagline', 'MainV', 'SmallV', 'Note'];
  const ASS_HEADER = `[Script Info]
ScriptType: v4.00+
PlayResX: ${W}
PlayResY: ${H}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${Object.values(STYLES).join('\n')}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  // 文字の後ろに敷く、ぼかした暗がり（明るい実写の上でも読めるように）。settings.shade=false で無効
  const SHADE = S.shade ?? true;
  const ellipse = (cx, cy, rx, ry) => {
    const k = 0.5523;
    const r = (v) => Math.round(v);
    return `m ${r(cx - rx)} ${r(cy)} b ${r(cx - rx)} ${r(cy - k * ry)} ${r(cx - k * rx)} ${r(cy - ry)} ${r(cx)} ${r(cy - ry)} `
      + `b ${r(cx + k * rx)} ${r(cy - ry)} ${r(cx + rx)} ${r(cy - k * ry)} ${r(cx + rx)} ${r(cy)} `
      + `b ${r(cx + rx)} ${r(cy + k * ry)} ${r(cx + k * rx)} ${r(cy + ry)} ${r(cx)} ${r(cy + ry)} `
      + `b ${r(cx - k * rx)} ${r(cy + ry)} ${r(cx - rx)} ${r(cy + k * ry)} ${r(cx - rx)} ${r(cy)}`;
  };
  const rect = (x1, y1, x2, y2) => `m ${Math.round(x1)} ${Math.round(y1)} l ${Math.round(x2)} ${Math.round(y1)} l ${Math.round(x2)} ${Math.round(y2)} l ${Math.round(x1)} ${Math.round(y2)}`;
  function shadeFor(styleName) {
    if (!SHADE) return null;
    switch (styleName) {
      case 'Main': case 'Place': case 'Label':
        return { draw: rect(-200, H * 0.70, W + 200, H + 200), alpha: '70', blur: 70 };
      case 'Title':
        return { draw: ellipse(W / 2, H / 2, W * 0.36, H * 0.26), alpha: '60', blur: 90 };
      case 'Time':
        return { draw: ellipse(W / 2, H / 2, W * 0.24, H * 0.14), alpha: '70', blur: 70 };
      case 'Tagline':
        return { draw: ellipse(W / 2, sz('taglineMarginV', 150) + sz('taglineFontSize', 56) * 0.6, W * 0.40, H * 0.11), alpha: '70', blur: 70 };
      case 'MainV': case 'SmallV': {
        const top = H * sz(styleName === 'MainV' ? 'mainVTop' : 'smallVTop', styleName === 'MainV' ? 0.57 : 0.60);
        return { draw: ellipse(W / 2, top + H * 0.05, W * 0.50, H * 0.11), alpha: '68', blur: 80 };
      }
      default: return null;
    }
  }
  // テロップ文言 → ASS 本文（改行は \N。題名の2行目は小さく）
  function captionText(styleName, text) {
    let t = String(text ?? '').replace(/\r?\n/g, '\\N');
    if (styleName === 'Title' && t.includes('\\N')) {
      const gap = Math.round(sz('titleFontSize', 124) * 0.2);
      t = t.replace('\\N', `\\N{\\fs${gap}}\\h\\N{\\fs${sz('titleSubFontSize', 34)}\\fsp${sz('titleSubSpacing', 4)}\\b0\\c&H${C_SUB.slice(-6)}&}`);
    }
    return t;
  }

  // ---- 素材パスの解決 ----
  const srcPath = (p) => slash(isAbs(p) ? p : `${SRC}/${p}`);
  const imgPath = (p) => {
    if (isAbs(p)) return slash(p);
    const inSrc = `${SRC}/${p}`;
    if (existsSync(inSrc)) return inSrc;
    const inRepo = `${REPO_ROOT}/${p}`;   // assets/photos/... などリポジトリの写真も使える
    return existsSync(inRepo) ? inRepo : inSrc;
  };
  const repoPath = (p) => slash(isAbs(p) ? p : `${REPO_ROOT}/${p}`);

  // ---- ブロックごとのクリップ計画（尺の割り振りと素材の有無） ----
  const missing = [];
  const blocks = config.blocks.map((raw, bi) => {
    const b = { ...raw };
    b.frames = Math.round(b.dur * FPS);
    b.D = b.frames / FPS;                         // フレームにそろえた尺
    b.samples = Math.round(b.D * SR);
    b.fadeIn = b.fadeIn ?? FADE_DUR;
    b.fadeOut = b.fadeOut ?? FADE_DUR;
    const clips = Array.isArray(b.clips) && b.clips.length ? b.clips : [{ src: 'TODO' }];

    // 尺: dur 省略のクリップはブロックの残り時間を等分
    const fixed = clips.filter(c => c.dur != null).reduce((a, c) => a + c.dur, 0);
    const free = clips.filter(c => c.dur == null).length;
    const rest = b.D - fixed;
    if (free > 0 && rest <= 0.05) fail(`ブロック${b.id}: dur を書いたクリップの合計（${num(fixed)}秒）がブロックの長さ（${b.D}秒）以上なので、dur を省いたクリップに時間が残りません。`);
    let durs = clips.map(c => c.dur ?? rest / free);
    const sum = durs.reduce((a, d) => a + d, 0);
    if (sum < b.D - 1e-6) {
      warn(`ブロック${b.id}: クリップの合計（${num(sum)}秒）がブロック（${b.D}秒）より短いので、最後のクリップを延ばします。`);
      durs[durs.length - 1] += b.D - sum;
    } else if (sum > b.D + 1e-6) {
      warn(`ブロック${b.id}: クリップの合計（${num(sum)}秒）がブロック（${b.D}秒）より長いので、後ろを切ります。`);
      let left = b.D;
      durs = durs.map(d => { const x = Math.min(d, left); left -= x; return x; });
    }
    // フレーム単位に割り振る（合計がブロックのフレーム数と必ず一致するように）
    let acc = 0;
    const plan = [];
    clips.forEach((c, ci) => {
      const f0 = Math.round(acc * FPS);
      acc += durs[ci];
      const f1 = ci === clips.length - 1 ? b.frames : Math.round(acc * FPS);
      if (f1 - f0 <= 0) return;   // 長さ0になったクリップは使わない
      const item = { ...c, n: ci + 1, frames: f1 - f0, start: f0 / FPS, d: (f1 - f0) / FPS };
      item.samples = Math.round(item.frames * SR / FPS);
      // 種類と素材の有無
      let reason = null;
      if (c.img != null) {
        item.kind = 'image';
        item.path = c.img ? imgPath(c.img) : '';
        if (!c.img || c.img === 'TODO') reason = '写真が未指定（TODO）';
        else if (!existsSync(item.path)) reason = `写真がありません: ${item.path}`;
      } else {
        item.kind = 'video';
        item.path = c.src && c.src !== 'TODO' ? srcPath(c.src) : '';
        if (!c.src || c.src === 'TODO') reason = '素材が未指定（"TODO"）';
        else if (!existsSync(item.path)) reason = `ファイルがありません: ${item.path}`;
        else {
          const info = probe(item.path);
          if (!info || !info.hasVideo) reason = `動画として読めません: ${item.path}`;
          else {
            item.info = info;
            const inSec = Number(c.in ?? 0);
            if (!(inSec >= 0)) fail(`ブロック${b.id} ${item.n}本目: in（開始秒）が正しくありません: ${c.in}`);
            if (inSec >= info.dur) reason = `開始秒 in=${inSec} が素材の長さ（${info.dur.toFixed(1)}秒）を超えています: ${c.src}`;
            else if (inSec + item.d > info.dur + 0.05) {
              warn(`ブロック${b.id} ${item.n}本目: ${c.src} は ${inSec}秒から ${item.d.toFixed(1)}秒ぶん取れません（素材は ${info.dur.toFixed(1)}秒）。足りない所は最後のコマで止めます。`);
            }
          }
        }
      }
      if (reason) {
        if (DRAFT) {
          // TODO は想定どおりなので黙って仮の画に。指定したのに使えない素材だけ知らせる
          if (!/TODO/.test(reason)) warn(`ブロック${b.id} ${item.n}本目: ${reason} → 仮の画にします。`);
          // 試作: fallbackImg（リポジトリの写真）をゆっくりズーム。無ければ暗い仮画面
          const fb = b.fallbackImg ? repoPath(b.fallbackImg) : null;
          if (fb && existsSync(fb)) { item.kind = 'image'; item.path = fb; item.fallback = true; }
          else {
            if (fb) warn(`ブロック${b.id}: fallbackImg が見つからないので暗い仮画面にします: ${fb}`);
            item.kind = 'placeholder'; item.fallback = true;
          }
        } else if (!only || only.includes(b.id)) {
          missing.push(`  ブロック${b.id}（${bi + 1}番目）${clips.length > 1 ? `の${item.n}本目` : ''}: ${reason}`);
        }
      }
      plan.push(item);
    });
    b.plan = plan;
    for (const c of b.captions ?? []) {
      if (!CAPTION_STYLES.includes(c.style)) fail(`ブロック${b.id}: テロップのスタイル "${c.style}" はありません（使えるのは ${CAPTION_STYLES.join(', ')}）。`);
      if (c.end > b.D + 0.01) warn(`ブロック${b.id}: テロップ「${c.text}」の終わり（${c.end}秒）がブロックの長さを超えています。`);
    }
    return b;
  });

  if (missing.length) {
    fail(`足りない素材があるため止めました（${missing.length}か所）。\n${missing.join('\n')}\n\n`
      + `素材を置いて設定JSON（${configPath}）の clips を直すか、試作なら --draft を付けて仮の画で書き出してください。`);
  }

  const needFilters = ['subtitles', 'fade', 'concat', 'zoompan', 'gblur', 'tpad'];
  if (blocks.some(b => b.plan.some(c => c.reframe && c.kind === 'video'))) needFilters.push('v360');
  if (S.loudnorm) needFilters.push('loudnorm');
  checkFfmpeg(needFilters);
  mkdirSync(WORK, { recursive: true });

  const total = blocks.reduce((a, b) => a + b.D, 0);
  console.log(`=== ${EP.title ?? basename(configPath)} ===`);
  console.log(`設定: ${configPath}`);
  console.log(`素材: ${SRC}`);
  console.log(`出力: ${FINAL}`);
  console.log(`${W}×${H} ${FPS}fps・${blocks.length}ブロック・計 ${fmtChap(total)}（${num(total, 2)}秒）${DRAFT ? '・試作（--draft）' : ''}`);
  if (only) console.log(`作り直すブロック: ${only.join(', ')}（他は作業フォルダの既存 seg を使う）`);

  // ---- 使い回す seg の確認（--blocks のとき。条件の違う seg が混ざらないよう、書き出す前に確かめる） ----
  for (const b of blocks.filter(x => only && !only.includes(x.id))) {
    const meta = `${WORK}/seg${b.id}.json`;
    if (!existsSync(`${WORK}/seg${b.id}.mp4`) || !existsSync(`${WORK}/seg${b.id}.wav`) || !existsSync(meta)) {
      fail(`ブロック${b.id}のセグメントが作業フォルダにありません（${WORK}）。--blocks を外して全部書き出してください。`);
    }
    const m = JSON.parse(readFileSync(meta, 'utf8'));
    if (m.W !== W || m.H !== H || m.FPS !== FPS || m.frames !== b.frames) {
      fail(`ブロック${b.id}の既存セグメントは設定と大きさ・長さが違います。--blocks ${b.id} を足して作り直してください。`);
    }
    if (m.draft && !DRAFT) {
      fail(`ブロック${b.id}の既存セグメントは試作（--draft）のままです。--blocks を外すか、--blocks に ${b.id} を足して作り直してください。`);
    }
  }
  // ---- 1) セグメント生成 ----
  const targets = blocks.filter(b => !only || only.includes(b.id));
  targets.forEach((b, ti) => {
    const t0 = Date.now();
    const kinds = b.plan.map(c => c.kind === 'video' ? (c.reframe ? '動画(360)' : '動画') : c.fallback ? (c.kind === 'image' ? '仮の画' : '仮画面') : '写真');
    process.stdout.write(`[${ti + 1}/${targets.length}] ブロック${b.id}（${num(b.D, 2)}秒・${kinds.join('＋')}）… `);

    // テロップ ASS
    let ass = ASS_HEADER;
    for (const c of b.captions ?? []) {
      const st = Math.max(0, c.start ?? 0), en = Math.min(b.D, c.end ?? b.D);
      if (en <= st) continue;
      const sh = shadeFor(c.style);
      if (sh) {
        ass += `Dialogue: 0,${fmtAss(st)},${fmtAss(en)},Shade,,0,0,0,,{\\an7\\pos(0,0)\\p1\\bord0\\shad0\\1c&H000000&\\1a&H${sh.alpha}&\\blur${sh.blur}\\fad(500,500)}${sh.draw}{\\p0}\n`;
      }
      ass += `Dialogue: 2,${fmtAss(st)},${fmtAss(en)},${c.style},,0,0,0,,{\\fad(500,500)\\blur2}${captionText(c.style, c.text)}\n`;
    }
    if (DRAFT) {
      const fb = b.plan.some(c => c.fallback) ? '　仮の画（素材未指定）' : '';
      const note = b.note ? `\\N{\\c&HA8E7FF&}${String(b.note).replace(/\r?\n/g, '\\N')}` : '';
      ass += `Dialogue: 5,${fmtAss(0)},${fmtAss(b.D)},Note,,0,0,0,,{\\3c&H1E26B3&\\3a&H00&\\b1}試作{\\r}${fb}${note}\n`;
      for (const c of b.plan.filter(x => x.kind === 'placeholder')) {
        ass += `Dialogue: 1,${fmtAss(c.start)},${fmtAss(c.start + c.d)},Center,,0,0,0,,Insta360 の映像が入る場所\n`;
      }
    }
    const assName = `block${b.id}.ass`;
    writeFileSync(`${WORK}/${assName}`, '\uFEFF' + ass, 'utf8');

    // 入力とフィルタ
    const args = [];
    const fg = [];
    let inIdx = 0;
    b.plan.forEach((c, k) => {
      const tail = `setsar=1,format=yuv420p,tpad=stop_mode=clone:stop_duration=${num(c.d + 1)},trim=end_frame=${c.frames},setpts=PTS-STARTPTS[v${k}]`;
      const fx = c.focusX ?? 0.5, fy = c.focusY ?? 0.5;
      const aTail = `apad,atrim=end_sample=${c.samples},asetpts=PTS-STARTPTS`;
      const silent = `anullsrc=r=${SR}:cl=stereo,aformat=sample_fmts=fltp:sample_rates=${SR}:channel_layouts=stereo,atrim=end_sample=${c.samples}[a${k}]`;

      if (c.kind === 'video') {
        const i = inIdx++;
        args.push('-ss', num(Number(c.in ?? 0)), '-t', num(c.d + 1), '-i', c.path);
        let head = `[${i}:v]setpts=PTS-STARTPTS,fps=${FPS}`;
        if (c.reframe) {
          // 360度（正距円筒）の素材から向きを切り出す。fov は横の画角（度）
          const r = c.reframe;
          const hf = r.fov ?? r.h_fov ?? (PORTRAIT ? 60 : 100);
          const vf = r.v_fov ?? (2 * Math.atan(Math.tan(hf / 2 * Math.PI / 180) * H / W) * 180 / Math.PI);
          head += `,v360=input=e:output=flat:yaw=${r.yaw ?? 0}:pitch=${r.pitch ?? 0}:roll=${r.roll ?? 0}`
            + `:h_fov=${num(hf, 2)}:v_fov=${num(vf, 2)}:w=${W}:h=${H}:interp=${r.interp ?? 'line'}`;
        }
        const fit = c.fit ?? DEFAULT_FIT;
        if (fit === 'contain') {
          // 元の縦横比のまま中央に置き、余白は同じ映像のぼかしで埋める（縮小してからぼかして軽くする）
          const bw = even(W / 8), bh = even(H / 8);
          fg.push(`${head},split=2[cb${k}][cf${k}]`);
          fg.push(`[cb${k}]scale=${bw}:${bh}:force_original_aspect_ratio=increase,crop=${bw}:${bh},`
            + `gblur=sigma=${num(BLUR_SIGMA / 8, 2)},scale=${W}:${H},colorchannelmixer=rr=0.8:gg=0.8:bb=0.8,setsar=1[cbb${k}]`);
          fg.push(`[cf${k}]scale=${W}:${H}:force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1[cff${k}]`);
          fg.push(`[cbb${k}][cff${k}]overlay=(W-w)/2:(H-h)/2,${tail}`);
        } else {
          if (fit !== 'cover') warn(`ブロック${b.id}: fit "${fit}" は無いので cover にします。`);
          fg.push(`${head},scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}:(iw-${W})*${fx}:(ih-${H})*${fy},${tail}`);
        }
        if (c.info.hasAudio) {
          const vol = c.vol ?? 1;
          // Insta360 の空間音声（4ch Ambisonics）は1ch目（全方向）を左右に使う
          const pan = c.info.channels === 4 ? 'pan=stereo|c0=c0|c1=c0,' : '';
          const af = Math.min(AUDIO_FADE, c.d / 3);
          fg.push(`[${i}:a]asetpts=PTS-STARTPTS,${pan}aresample=${SR},aformat=sample_fmts=fltp:sample_rates=${SR}:channel_layouts=stereo,`
            + `volume=${vol},${aTail},afade=t=in:st=0:d=${num(af)},afade=t=out:st=${num(c.d - af)}:d=${num(af)}[a${k}]`);
        } else {
          fg.push(silent);
        }
      } else if (c.kind === 'image') {
        const i = inIdx++;
        args.push('-loop', '1', '-framerate', String(FPS), '-t', num(c.d + 0.5), '-i', c.path);
        if (KENBURNS > 0) {
          // 2倍で組み立ててから zoompan で等倍に（ズームのがたつきを抑える）
          const w2 = W * 2, h2 = H * 2;
          fg.push(`[${i}:v]scale=${w2}:${h2}:force_original_aspect_ratio=increase,crop=${w2}:${h2}:(iw-${w2})*${fx}:(ih-${h2})*${fy},format=yuv420p,`
            + `zoompan=z='1+${KENBURNS}*on/${c.frames}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H}:fps=${FPS},${tail}`);
        } else {
          fg.push(`[${i}:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}:(iw-${W})*${fx}:(ih-${H})*${fy},fps=${FPS},${tail}`);
        }
        fg.push(silent);
      } else {
        // 暗い仮画面
        fg.push(`color=c=0x15120f:s=${W}x${H}:r=${FPS},${tail}`);
        fg.push(silent);
      }
    });
    const K = b.plan.length;
    fg.push(`${b.plan.map((_, k) => `[v${k}][a${k}]`).join('')}concat=n=${K}:v=1:a=1[vc][ac]`);
    // 映像: テロップ → ブロックの頭と尻に黒へのフェード（テロップごとフェードする）
    let vchain = `[vc]subtitles=${assName}`;
    if (b.fadeIn > 0) vchain += `,fade=t=in:st=0:d=${num(b.fadeIn)}`;
    if (b.fadeOut > 0) vchain += `,fade=t=out:st=${num(b.D - b.fadeOut)}:d=${num(b.fadeOut)}`;
    fg.push(`${vchain},format=yuv420p[vout]`);
    // 音声: 頭と尻にフェード（映像フェードが0でも、ぷつっと鳴らないよう短いフェードは入れる）
    const afi = Math.max(b.fadeIn, AUDIO_FADE), afo = Math.max(b.fadeOut, AUDIO_FADE);
    fg.push(`[ac]afade=t=in:st=0:d=${num(afi)},afade=t=out:st=${num(b.D - afo)}:d=${num(afo)},`
      + `apad=whole_len=${b.samples},atrim=end_sample=${b.samples},asplit=2[ao1][ao2]`);

    ffmpeg([
      ...args, '-filter_complex', fg.join(';\n'),
      '-map', '[vout]', '-map', '[ao1]',
      '-c:v', 'libx264', '-crf', CRF, '-preset', PRESET, '-pix_fmt', 'yuv420p', '-r', String(FPS),
      '-c:a', 'aac', '-b:a', '192k', '-ar', String(SR), '-movflags', '+faststart',
      `seg${b.id}.mp4`,
      '-map', '[ao2]', '-c:a', 'pcm_s16le', '-ar', String(SR), `seg${b.id}.wav`,
    ], WORK, `ブロック${b.id}の書き出し`);
    writeFileSync(`${WORK}/seg${b.id}.json`, JSON.stringify({ draft: DRAFT, W, H, FPS, frames: b.frames, at: new Date().toISOString() }) + '\n', 'utf8');
    console.log(`完了（${((Date.now() - t0) / 1000).toFixed(1)}秒）`);
  });

  // ---- 2) 連結 ----
  console.log('--- 連結');
  const vlist = blocks.map(b => `file 'seg${b.id}.mp4'\nduration ${num(b.D, 6)}`).join('\n') + '\n';
  const alist = blocks.map(b => `file 'seg${b.id}.wav'\nduration ${num(b.D, 6)}`).join('\n') + '\n';
  writeFileSync(`${WORK}/concat_v.txt`, vlist, 'utf8');
  writeFileSync(`${WORK}/concat_a.txt`, alist, 'utf8');

  let af = null;
  if (S.loudnorm) {
    // 2パスの loudnorm（1回目で測って、2回目は線形に合わせる。現場音が不自然に揺れないように）
    console.log('--- 音量をそろえる（loudnorm）');
    const LN = 'loudnorm=I=-16:TP=-1.5:LRA=11';
    const r = spawnSync('ffmpeg', ['-hide_banner', '-nostdin', '-nostats', '-f', 'concat', '-safe', '0', '-i', 'concat_a.txt',
      '-af', `${LN}:print_format=json`, '-f', 'null', '-'], { cwd: WORK, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    const m = (r.stderr ?? '').match(/\{[^{}]*"input_i"[^{}]*\}/);
    if (r.status === 0 && m) {
      const j = JSON.parse(m[0]);
      const ok = ['input_i', 'input_tp', 'input_lra', 'input_thresh', 'target_offset'].every(k => Number.isFinite(parseFloat(j[k])));
      af = ok
        ? `${LN}:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`
        : LN;   // 無音だけのとき等は測れない → 1パス
    } else {
      warn('音量の測定に失敗したので、1パスの loudnorm にします。');
      af = LN;
    }
    af += `,aresample=${SR}`;
  }
  ffmpeg([
    '-f', 'concat', '-safe', '0', '-i', 'concat_v.txt',
    '-f', 'concat', '-safe', '0', '-i', 'concat_a.txt',
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
    ...(af ? ['-af', af] : []),
    '-c:a', 'aac', '-b:a', '192k', '-ar', String(SR),
    '-movflags', '+faststart', FINAL,
  ], WORK, '連結');

  // ---- 3) チャプター（chapter のあるブロックの開始時刻） ----
  let t = 0;
  const chapters = [];
  for (const b of blocks) {
    if (b.chapter) chapters.push({ t, title: b.chapter });
    t += b.D;
  }
  const outInfo = probe(FINAL);
  probeCache.delete(FINAL);
  console.log('\n=== 完成 ===');
  console.log(FINAL);
  console.log(`総尺: ${fmtChap(outInfo?.dur ?? total)}（${(outInfo?.dur ?? total).toFixed(2)}秒）・${outInfo?.w}×${outInfo?.h}・音声${outInfo?.hasAudio ? 'あり' : 'なし'}`);
  if (chapters.length) {
    if (chapters[0].t !== 0) warn('最初のブロックに chapter がありません。YouTube のチャプターは 0:00 から始める必要があります。');
    if (chapters.length < 3) warn('YouTube のチャプターは3つ以上必要です。');
    chapters.forEach((c, i) => {
      const next = chapters[i + 1]?.t ?? total;
      if (next - c.t < 10) warn(`チャプター「${c.title}」が10秒未満です（YouTube では10秒以上必要）。`);
    });
    const txt = chapters.map(c => `${fmtChap(c.t)} ${c.title}`).join('\n') + '\n';
    const chapPath = `${OUT}/${EP.outputName.replace(/\.[^.]+$/, '')}.chapters.txt`;
    writeFileSync(chapPath, txt, 'utf8');
    console.log(`\n--- 概要欄のチャプター（${chapPath}）---\n${txt}`);
  }
}

// ============================================================================
// 入口
// ============================================================================
const USAGE = `使い方:
  素材一覧: node scripts/video/build_clip_video.mjs --inventory <素材フォルダ> [--out <出力フォルダ>]
  組み立て: node scripts/video/build_clip_video.mjs --config <設定JSON> [--blocks A,B] [--draft] [--src <素材フォルダ>] [--out <出力フォルダ>]`;

const invDir = argVal('--inventory');
const cfg = argVal('--config');
if (hasFlag('--help') || hasFlag('-h')) {
  console.log(USAGE);
} else if (invDir) {
  runInventory(invDir);
} else if (cfg) {
  runBuild(cfg);
} else {
  console.log(USAGE);
  process.exit(1);
}
