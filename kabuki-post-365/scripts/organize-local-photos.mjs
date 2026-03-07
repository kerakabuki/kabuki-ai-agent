#!/usr/bin/env node
/**
 * POST 365のGemini分析結果を使ってローカル画像ファイルをリネーム＆フォルダ分け
 *
 * 既存の記録写真フォルダ構成に合わせて整理:
 *
 * ■ 2024/一柳くん撮影/Kera-Kabuki/ (106枚 PNG → 場面タイプ別サブフォルダ)
 *   → 2024/祭礼公演/{演目 or 場面タイプ}/
 *       ├── 01_原本/  (リネーム済みファイル)
 *       └── 90_PR書き出し/  (将来用)
 *
 * ■ 2025/祭礼公演/舞台裏/01_原本/ (28枚 JPG → 場面タイプ別リネーム)
 *   → 2025/祭礼公演/舞台裏/{場面タイプ別サブフォルダ}/
 *       └── 01_原本/
 *
 * 命名規則: {年}_{演目or場面}_{連番3桁}_{説明}.{拡張子}
 * 例: 2024_見得_001_地歌舞伎の見得の場面.png
 *
 * Usage:
 *   node scripts/organize-local-photos.mjs <API_TOKEN> [--dry-run]
 *   node scripts/organize-local-photos.mjs <API_TOKEN>          ← 本実行（コピー）
 */

import fs from 'fs';
import path from 'path';

const TOKEN = process.argv[2] || '';
const DRY_RUN = process.argv.includes('--dry-run');

if (!TOKEN) {
  console.error('Usage: node scripts/organize-local-photos.mjs <API_TOKEN> [--dry-run]');
  process.exit(1);
}

const POST365_BASE = 'https://kabuki-post-365.kerakabuki.workers.dev';
const headers = { 'Authorization': `Bearer ${TOKEN}` };
const BASE_DIR = 'D:/気良歌舞伎/記録写真';

// ── scene_type → フォルダ名マッピング ──
function classifyScene(sceneType) {
  if (!sceneType) return '99_その他';
  const s = sceneType.toLowerCase();
  // 舞台系
  if (/舞台全景|舞台演技|舞台上/.test(s)) return '01_舞台全景';
  if (/見得/.test(s)) return '02_見得';
  if (/舞踊/.test(s)) return '03_舞踊';
  if (/立回り/.test(s)) return '04_立回り';
  // 人物系
  if (/ポートレート/.test(s)) return '05_ポートレート';
  // 裏方系
  if (/楽屋|化粧/.test(s)) return '06_楽屋_化粧';
  if (/衣裳|小道具/.test(s)) return '07_衣裳_小道具';
  if (/稽古/.test(s)) return '08_稽古風景';
  // その他
  if (/群衆|集合/.test(s)) return '09_群衆_集合';
  if (/舞台裏|運営|準備|休憩|イベント/.test(s)) return '10_舞台裏';
  if (/舞台/.test(s)) return '01_舞台全景';
  return '99_その他';
}

// ファイル名に使えない文字を除去
function sanitize(str, maxLen = 30) {
  if (!str) return '';
  return str
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, maxLen);
}

// ── ソース定義 ──
const SOURCES = [
  {
    label: '2024 一柳くん撮影 Kera-Kabuki',
    srcDir: path.join(BASE_DIR, '2024/一柳くん撮影/Kera-Kabuki'),
    // 出力: 2024/祭礼公演/{場面タイプ}/01_原本/
    destBase: path.join(BASE_DIR, '2024/祭礼公演'),
    year: '2024',
    useSubfolderStructure: false,
  },
  {
    label: '2025 祭礼公演 舞台裏',
    srcDir: path.join(BASE_DIR, '2025/祭礼公演/舞台裏/01_原本'),
    // 出力: 2025/祭礼公演/舞台裏/{場面タイプ}/
    destBase: path.join(BASE_DIR, '2025/祭礼公演/舞台裏'),
    year: '2025',
    useSubfolderStructure: false,
  },
];

async function main() {
  // Fetch metadata from API
  console.log('📡 POST 365からメタデータ取得中...');
  const res = await fetch(`${POST365_BASE}/api/v1/images`, { headers });
  const images = await res.json();
  console.log(`📷 ${images.length}件のメタデータ取得\n`);

  // Build metadata index: uploaded filename → metadata
  const metaIndex = new Map();
  for (const img of images) {
    // Uploaded filename is .jpg (converted from .png for 2024)
    metaIndex.set(img.filename, img);
  }

  if (DRY_RUN) console.log('🔍 ドライラン（ファイルは操作しません）\n');

  let totalOrganized = 0;
  let totalNotFound = 0;

  for (const source of SOURCES) {
    console.log(`${'━'.repeat(50)}`);
    console.log(`📂 ${source.label}`);
    console.log(`   ${source.srcDir}`);
    console.log(`${'━'.repeat(50)}`);

    if (!fs.existsSync(source.srcDir)) {
      console.log('⚠️ フォルダが見つかりません\n');
      continue;
    }

    const files = fs.readdirSync(source.srcDir)
      .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .sort();

    console.log(`📷 ${files.length}枚\n`);

    // Counter per scene folder
    const counters = {};
    const results = [];

    for (const file of files) {
      const ext = path.extname(file);
      const base = path.basename(file, ext);

      // Look up metadata (uploaded as .jpg)
      const lookupName = `${base}.jpg`;
      const meta = metaIndex.get(lookupName);

      if (!meta) {
        console.log(`  ⏭️ ${file} — メタデータなし`);
        totalNotFound++;
        continue;
      }

      const sceneFolder = classifyScene(meta.scene_type);
      const sceneName = sceneFolder.replace(/^\d+_/, '');

      // Counter
      counters[sceneFolder] = (counters[sceneFolder] || 0) + 1;
      const num = String(counters[sceneFolder]).padStart(3, '0');

      // New filename: {年}_{場面}_{連番}_{説明}.{拡張子}
      const desc = sanitize(meta.navi_caption || '', 25);
      const newName = `${source.year}_${sceneName}_${num}${desc ? '_' + desc : ''}${ext}`;

      // Dest path: 直接場面フォルダに配置
      const destDir = path.join(source.destBase, sceneFolder);
      const destPath = path.join(destDir, newName);

      results.push({ src: path.join(source.srcDir, file), dest: destPath, sceneFolder });

      if (DRY_RUN) {
        const relDest = path.relative(BASE_DIR, destPath);
        console.log(`  ${file}`);
        console.log(`  → ${relDest}\n`);
      }
    }

    // Execute copies
    if (!DRY_RUN) {
      for (const r of results) {
        fs.mkdirSync(path.dirname(r.dest), { recursive: true });
        fs.copyFileSync(r.src, r.dest);
        const relDest = path.relative(BASE_DIR, r.dest);
        console.log(`  ✅ ${path.basename(r.src)} → ${relDest}`);
      }
    }

    totalOrganized += results.length;

    // Show folder summary
    console.log(`\n  フォルダ内訳:`);
    const sorted = Object.entries(counters).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [folder, count] of sorted) {
      console.log(`    ${folder}: ${count}枚`);
    }
    console.log('');
  }

  // Final summary
  console.log(`${'━'.repeat(50)}`);
  console.log(`📊 整理結果`);
  console.log(`${'━'.repeat(50)}`);
  console.log(`整理: ${totalOrganized}枚`);
  console.log(`メタデータなし: ${totalNotFound}枚`);

  if (DRY_RUN) {
    console.log(`\n💡 実行するには --dry-run を外してください`);
    console.log(`   ※ 元ファイルはそのまま残ります（コピー方式）`);
  } else {
    console.log(`\n📁 元ファイルはそのまま残っています（コピー方式）`);
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
