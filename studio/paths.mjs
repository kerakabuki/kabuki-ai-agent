// 素材プレフィックスパスのリゾルバ（build スクリプトと server で共有）
// プレフィックス:
//   gen:X    → {EP}/画像/生成/X
//   photo:X  → {EP}/画像/ゆかりの地/X
//   common:X → {COMMON}/X
//   voice:X  → {EP}/音声/X
//   bgm:X    → {EP}/BGM/X
// プレフィックスなしの文字列はそのまま絶対/相対パスとして扱う（後方互換）。

import { resolve, sep } from 'node:path';

// 素材ルート（共通素材・各エピソードの親）
export const ROOT = 'D:/気良歌舞伎/youtubeチャンネル用/超訳！歌舞伎ナビ';
export const COMMON = `${ROOT}/歌舞伎ナビ共通素材`;

// エピソードごとのパス群を組み立てる
export function makePaths(epDir) {
  const EP = `${ROOT}/${epDir}`;
  return {
    ROOT,
    COMMON,
    EP,
    GEN: `${EP}/画像/生成`,
    PHOTO: `${EP}/画像/ゆかりの地`,
    VOICE: `${EP}/音声`,
    BGM: `${EP}/BGM`,
    OUT: `${EP}/出力`,
    WORK: `${EP}/出力/work`,
  };
}

// プレフィックスパス → 実ファイルの絶対パス
export function resolveAsset(p, paths) {
  if (typeof p !== 'string') return p;
  const idx = p.indexOf(':');
  // Windowsのドライブレター（"D:/..."）を誤検出しないよう、既知プレフィックスのみ処理
  if (idx > 0) {
    const prefix = p.slice(0, idx);
    const rest = p.slice(idx + 1);
    switch (prefix) {
      case 'gen':    return `${paths.GEN}/${rest}`;
      case 'photo':  return `${paths.PHOTO}/${rest}`;
      case 'common': return `${paths.COMMON}/${rest}`;
      case 'voice':  return `${paths.VOICE}/${rest}`;
      case 'bgm':    return `${paths.BGM}/${rest}`;
      default:       return p; // 未知プレフィックス（ドライブレター等）は素通し
    }
  }
  return p;
}

// 解決済み絶対パスが許可ディレクトリ配下にあるか検証（パストラバーサル対策）
export function isPathAllowed(absPath, allowedRoots) {
  const norm = resolve(absPath);
  return allowedRoots.some(root => {
    const r = resolve(root);
    return norm === r || norm.startsWith(r + sep);
  });
}
