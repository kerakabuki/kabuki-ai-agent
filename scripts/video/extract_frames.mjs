// Gemini の候補 JSON から、指定した再生時刻に表示されるコマを原寸の PNG に切り出す。
// 使い方: node scripts/video/extract_frames.mjs --video <動画> --times <result.json> --out <出力フォルダ>
// ffmpeg と ffprobe が必要。frames.json の frame_time_sec は採用したコマの表示開始秒。

import { execFileSync } from 'node:child_process';
import { constants, copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

function 映像情報(動画) {
  const 結果 = execFileSync('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0', '-show_frames', '-show_entries',
    'frame=best_effort_timestamp_time,duration_time:frame_side_data=:stream=start_time,duration:format=start_time,duration',
    '-of', 'json', 動画,
  ], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 });
  const { frames, streams, format } = JSON.parse(結果);
  if (!frames?.length) throw new Error('映像のコマを取得できません。');

  const 原点 = Number(format.start_time ?? 0);
  const 開始秒 = frames.map(frame => Number((Number(frame.best_effort_timestamp_time) - 原点).toFixed(6)));
  if (!開始秒.every(Number.isFinite)) throw new Error('コマの表示時刻を取得できません。');
  const 最終コマ長 = Number(frames.at(-1).duration_time);
  const 終端 = 最終コマ長 > 0 ? 開始秒.at(-1) + 最終コマ長
    : Number(streams[0].start_time ?? 原点) - 原点 + Number(streams[0].duration ?? format.duration);
  if (!Number.isFinite(終端)) throw new Error('映像の長さを取得できません。');
  return { 開始秒, 終端: Number(終端.toFixed(6)) };
}

function ファイル名(順位, 秒) {
  const 十分の一秒 = Math.round(秒 * 10);
  const 分 = Math.floor(十分の一秒 / 600);
  const 秒表記 = ((十分の一秒 % 600) / 10).toFixed(1).padStart(4, '0');
  return `rank${順位}_${分}m${秒表記}s.png`;
}

function main() {
  const { values: { video, times, out } } = parseArgs({ options: {
    video: { type: 'string' }, times: { type: 'string' }, out: { type: 'string' },
  } });
  if (!video || !times || !out) {
    throw new Error('使い方: node scripts/video/extract_frames.mjs --video <動画> --times <result.json> --out <出力フォルダ>');
  }
  const 動画 = resolve(video);
  const 候補一覧 = JSON.parse(readFileSync(times, 'utf8').replace(/^\uFEFF/, ''));
  if (!Array.isArray(候補一覧)) throw new Error('時刻リストには JSON 配列を指定してください。');
  const { 開始秒, 終端 } = 映像情報(動画);
  const 抽出対象 = new Map();
  const 記録 = 候補一覧.map((候補, i) => {
    const { rank, time_sec } = 候補 ?? {};
    if (!Number.isSafeInteger(rank) || rank < 1 || !Number.isFinite(time_sec)) {
      throw new Error(`${i + 1} 件目の rank または time_sec が不正です。`);
    }
    if (time_sec < 0 || time_sec >= 終端) {
      const 理由 = `指定 ${time_sec} 秒は映像の範囲外（0 秒以上 ${終端} 秒未満）`;
      console.warn(`順位 ${rank} をスキップ: ${理由}`);
      return { ...候補, file: null, frame_time_sec: null, skip_reason: 理由 };
    }
    // 次のコマの開始までは直前のコマが表示される。映像の開始前は先頭コマを使う。
    const 番号 = Math.max(0, 開始秒.findLastIndex(秒 => 秒 <= time_sec));
    const file = ファイル名(rank, time_sec);
    if (抽出対象.has(file)) throw new Error(`候補の出力名が重複しています: ${file}`);
    抽出対象.set(file, 番号);
    return { ...候補, file, frame_time_sec: 開始秒[番号] };
  });

  const 出力先 = resolve(out);
  mkdirSync(出力先, { recursive: true });
  const 作業先 = mkdtempSync(join(出力先, '.extract-'));
  const 作成済み = [];
  try {
    // 表示順にまとめてデコードし、複数候補が同じコマを指す場合も一度だけ抽出する。
    const 番号順 = [...new Set(抽出対象.values())].sort((a, b) => a - b);
    if (番号順.length) {
      const 条件 = 番号順.map(番号 => `eq(n,${番号})`).join('+');
      execFileSync('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-nostdin', '-noautorotate', '-i', 動画,
        '-map', '0:v:0', '-vf', `select='${条件}'`, '-fps_mode', 'passthrough',
        '-frames:v', String(番号順.length), '-c:v', 'png', '%d.png',
      ], { cwd: 作業先, stdio: ['ignore', 'ignore', 'inherit'] });
    }
    writeFileSync(join(作業先, 'frames.json'), JSON.stringify(記録, null, 2) + '\n');
    const 保存 = (一時名, 名前) => {
      const 宛先 = join(出力先, 名前);
      copyFileSync(join(作業先, 一時名), 宛先, constants.COPYFILE_EXCL);
      作成済み.push(宛先);
    };
    for (const [名前, 番号] of 抽出対象) 保存(`${番号順.indexOf(番号) + 1}.png`, 名前);
    保存('frames.json', 'frames.json');
  } catch (error) {
    // 出力先に以前からあるファイルを保護し、今回の未完成分だけを片付ける。
    for (const パス of 作成済み) rmSync(パス);
    throw error;
  } finally {
    rmSync(作業先, { recursive: true, force: true });
  }
  console.log(`${記録.length} 件中 ${抽出対象.size} 枚を保存: ${出力先}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
