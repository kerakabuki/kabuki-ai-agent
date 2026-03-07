#!/usr/bin/env node
/**
 * ローカル画像をGemini VisionでAI分類 → リネーム＆フォルダ分け（アップロードなし）
 *
 * - 中断しても再開可能（処理済みファイルをJSONログに記録）
 * - PNG 16bitは一時JPGに変換してからGeminiに送信
 * - 元ファイルはそのまま残す（コピー方式）
 *
 * Usage:
 *   node scripts/classify-local-photos.mjs <GEMINI_KEY> [--dry-run] [--resume]
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

// sharp は必要な時だけ動的import
let sharp;

const GEMINI_KEY = process.argv[2] || '';
const DRY_RUN = process.argv.includes('--dry-run');
const RESUME = process.argv.includes('--resume');

if (!GEMINI_KEY || GEMINI_KEY.startsWith('--')) {
  console.error('Usage: node scripts/classify-local-photos.mjs <GEMINI_KEY> [--dry-run] [--resume]');
  process.exit(1);
}

const BASE_DIR = 'D:/気良歌舞伎/記録写真';
const TEMP_DIR = path.join(os.tmpdir(), 'kabuki-classify');
const LOG_FILE = path.join(BASE_DIR, 'ai_classify_log.json');

// ── 処理対象フォルダ ──
const SOURCES = [
  { srcDir: '2023/祭礼公演', destDir: '2023/祭礼公演', year: '2023', label: '2023 祭礼公演', excludeDirs: ['shimoda'] },
  { srcDir: '2023/祭礼公演/shimoda', destDir: '2023/祭礼公演', year: '2023', label: '2023 祭礼公演/shimoda' },
  { srcDir: '2023/清流文化プラザ公演', destDir: '2023/清流文化プラザ公演', year: '2023', label: '2023 清流文化プラザ公演' },
  { srcDir: '2024/祭礼公演', destDir: '2024/祭礼公演', year: '2024', label: '2024 祭礼公演', maxDepth: 1 },
  { srcDir: '2024/仮名手本忠臣蔵', destDir: '2024/仮名手本忠臣蔵', year: '2024', label: '2024 仮名手本忠臣蔵' },
  { srcDir: '2025/祭礼公演/寿曽我対面', destDir: '2025/祭礼公演/寿曽我対面', year: '2025', label: '2025 寿曽我対面' },
  { srcDir: '2025/祭礼公演/封印切', destDir: '2025/祭礼公演/封印切', year: '2025', label: '2025 封印切' },
  { srcDir: '2025/祭礼公演/白浪五人男', destDir: '2025/祭礼公演/白浪五人男', year: '2025', label: '2025 白浪五人男' },
  { srcDir: '2025/清流座公演', destDir: '2025/清流座公演', year: '2025', label: '2025 清流座公演' },
];

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff']);

// ── scene_type → フォルダ名 ──
function classifyScene(sceneType) {
  if (!sceneType) return '99_その他';
  const s = sceneType;
  if (/舞台全景|舞台演技|舞台上/.test(s)) return '01_舞台全景';
  if (/見得/.test(s)) return '02_見得';
  if (/舞踊/.test(s)) return '03_舞踊';
  if (/立回り/.test(s)) return '04_立回り';
  if (/ポートレート/.test(s)) return '05_ポートレート';
  if (/楽屋|化粧/.test(s)) return '06_楽屋_化粧';
  if (/衣裳|小道具/.test(s)) return '07_衣裳_小道具';
  if (/稽古/.test(s)) return '08_稽古風景';
  if (/群衆|集合/.test(s)) return '09_群衆_集合';
  if (/舞台裏|運営|準備|休憩|イベント|受付|屋台/.test(s)) return '10_舞台裏';
  if (/舞台/.test(s)) return '01_舞台全景';
  return '99_その他';
}

function sanitize(str, maxLen = 25) {
  if (!str) return '';
  return str.replace(/[\\/:*?"<>|。、]/g, '').replace(/\s+/g, '_').substring(0, maxLen);
}

// ── 画像ファイル収集 ──
function collectImages(srcDir, opts = {}) {
  const fullDir = path.join(BASE_DIR, srcDir);
  if (!fs.existsSync(fullDir)) return [];

  const files = [];
  const excludes = new Set(opts.excludeDirs || []);

  function walk(dir, depth) {
    if (opts.maxDepth !== undefined && depth > opts.maxDepth) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (excludes.has(e.name)) continue;
        // Skip already-organized folders (01_舞台全景 etc)
        if (/^\d{2}_/.test(e.name)) continue;
        walk(full, depth + 1);
      } else if (IMAGE_EXTS.has(path.extname(e.name).toLowerCase())) {
        files.push(full);
      }
    }
  }

  walk(fullDir, 0);
  return files.sort();
}

// ── Gemini Vision 分析 ──
async function analyzeImage(filePath) {
  let analysisPath = filePath;
  const ext = path.extname(filePath).toLowerCase();
  const fileSize = fs.statSync(filePath).size;

  // Convert large PNGs or files > 5MB to temp JPG
  if (ext === '.png' || ext === '.tif' || ext === '.tiff' || fileSize > 5 * 1024 * 1024) {
    if (!sharp) sharp = (await import('sharp')).default;
    const basename = path.basename(filePath, ext);
    const tempPath = path.join(TEMP_DIR, `${basename}_${Date.now()}.jpg`);
    await sharp(filePath)
      .resize(1500, null, { withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(tempPath);
    analysisPath = tempPath;
  }

  const fileBuffer = fs.readFileSync(analysisPath);
  const base64 = Buffer.from(fileBuffer).toString('base64');
  const mimeType = 'image/jpeg';

  // Cleanup temp file
  if (analysisPath !== filePath) {
    try { fs.unlinkSync(analysisPath); } catch {}
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: `この写真を分析してJSONで返してください。地歌舞伎（地方の素人歌舞伎）の記録写真です。

{
  "scene_type": "場面タイプ1つ（舞台全景/見得/舞踊/立回り/ポートレート/楽屋/化粧/衣裳/小道具/稽古風景/群衆/集合写真/舞台裏 のいずれか）",
  "description": "画像の説明（15文字以内）"
}` },
      ]}],
      systemInstruction: { parts: [{ text: '歌舞伎の専門家として画像を分類してください。簡潔にJSON形式で。' }] },
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048, responseMimeType: 'application/json' },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini ${res.status}: ${errText.substring(0, 100)}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
  try { return JSON.parse(text); } catch {
    const match = text.replace(/```json\s*/g, '').replace(/```/g, '').match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { scene_type: '不明', description: '' };
  }
}

// ── メイン ──
async function main() {
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

  // Load existing log for resume
  let processedLog = {};
  if (RESUME && fs.existsSync(LOG_FILE)) {
    processedLog = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
    console.log(`📋 既存ログ読み込み: ${Object.keys(processedLog).length}件処理済み\n`);
  }

  if (DRY_RUN) console.log('🔍 ドライラン\n');

  let totalFiles = 0;
  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  // Count total first
  const allSources = SOURCES.map(s => ({
    ...s,
    files: collectImages(s.srcDir, { excludeDirs: s.excludeDirs, maxDepth: s.maxDepth }),
  }));
  for (const s of allSources) totalFiles += s.files.length;
  console.log(`📷 合計: ${totalFiles}枚\n`);

  for (const source of allSources) {
    const { files } = source;
    if (files.length === 0) continue;

    console.log(`${'━'.repeat(50)}`);
    console.log(`📂 ${source.label} (${files.length}枚)`);
    console.log(`${'━'.repeat(50)}`);

    const counters = {};

    for (let i = 0; i < files.length; i++) {
      const filePath = files[i];
      const relPath = path.relative(BASE_DIR, filePath).replace(/\\/g, '/');

      // Skip if already processed
      if (processedLog[relPath]) {
        totalSkipped++;
        continue;
      }

      const ext = path.extname(filePath);
      const fileName = path.basename(filePath);
      process.stdout.write(`[${totalProcessed + totalSkipped + 1}/${totalFiles}] ${fileName} `);

      let analysis;
      try {
        analysis = await analyzeImage(filePath);
        process.stdout.write(`→ ${analysis.scene_type} `);
      } catch (err) {
        console.log(`❌ ${err.message.substring(0, 50)}`);
        totalErrors++;
        // Rate limit on error too
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      const sceneFolder = classifyScene(analysis.scene_type);
      const sceneName = sceneFolder.replace(/^\d+_/, '');

      counters[sceneFolder] = (counters[sceneFolder] || 0) + 1;
      const num = String(counters[sceneFolder]).padStart(3, '0');

      const desc = sanitize(analysis.description);
      const newName = `${source.year}_${sceneName}_${num}${desc ? '_' + desc : ''}${ext.toLowerCase()}`;
      const destDir = path.join(BASE_DIR, source.destDir, sceneFolder);
      const destPath = path.join(destDir, newName);

      if (!DRY_RUN) {
        fs.mkdirSync(destDir, { recursive: true });
        fs.copyFileSync(filePath, destPath);
      }

      console.log(`✅ ${sceneFolder}/${newName}`);

      // Record in log
      processedLog[relPath] = {
        dest: path.relative(BASE_DIR, destPath).replace(/\\/g, '/'),
        scene_type: analysis.scene_type,
        description: analysis.description,
      };

      totalProcessed++;

      // Save log every 10 files
      if (totalProcessed % 10 === 0) {
        fs.writeFileSync(LOG_FILE, JSON.stringify(processedLog, null, 2));
      }

      // Rate limit: 1.2s between calls
      if (i < files.length - 1) {
        await new Promise(r => setTimeout(r, 1200));
      }
    }

    // Show folder summary
    if (Object.keys(counters).length > 0) {
      console.log(`\n  内訳:`);
      for (const [f, c] of Object.entries(counters).sort()) {
        console.log(`    ${f}: ${c}枚`);
      }
    }
    console.log('');
  }

  // Final save
  fs.writeFileSync(LOG_FILE, JSON.stringify(processedLog, null, 2));

  // Cleanup
  try { fs.rmdirSync(TEMP_DIR); } catch {}

  console.log(`${'━'.repeat(50)}`);
  console.log(`📊 完了`);
  console.log(`${'━'.repeat(50)}`);
  console.log(`処理: ${totalProcessed}枚`);
  console.log(`スキップ(処理済): ${totalSkipped}枚`);
  console.log(`エラー: ${totalErrors}枚`);
  console.log(`ログ: ${LOG_FILE}`);
  if (DRY_RUN) console.log(`\n💡 実行するには --dry-run を外してください`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
