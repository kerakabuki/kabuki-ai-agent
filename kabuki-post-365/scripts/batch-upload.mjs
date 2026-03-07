#!/usr/bin/env node
/**
 * バッチ画像アップロード + Gemini Vision自動タグ付けスクリプト
 *
 * Usage:
 *   node scripts/batch-upload.mjs --base-url http://localhost:8787 --dir "/d/気良歌舞伎/記録写真/ブロマイド/2025"
 *   node scripts/batch-upload.mjs --base-url https://kabuki-post-365.kerakabuki.workers.dev --token YOUR_TOKEN --dir "..."
 *
 * Options:
 *   --base-url   API base URL (required)
 *   --token      API Bearer token (optional, not needed for local dev)
 *   --dir        Image directory to process (required)
 *   --gemini-key Gemini API key (for direct Vision analysis, bypasses Worker)
 *   --dry-run    Analyze only, don't upload
 *   --skip-analyze  Skip Gemini Vision, use folder name as play_name
 *   --update-only   Only update metadata for existing images (by id range)
 *   --id-from    Start image ID for update-only mode
 *   --id-to      End image ID for update-only mode
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse CLI args
const args = process.argv.slice(2);
function getArg(name) {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return null;
  if (name === 'dry-run' || name === 'skip-analyze') return true;
  return args[i + 1] || null;
}

const BASE_URL = getArg('base-url');
const TOKEN = getArg('token');
const DIR = getArg('dir');
const GEMINI_KEY = getArg('gemini-key');
const DRY_RUN = getArg('dry-run');
const SKIP_ANALYZE = getArg('skip-analyze');
const UPDATE_ONLY = getArg('update-only');
const ID_FROM = getArg('id-from') ? Number(getArg('id-from')) : null;
const ID_TO = getArg('id-to') ? Number(getArg('id-to')) : null;

if (!BASE_URL || (!DIR && !UPDATE_ONLY)) {
  console.error('Usage: node scripts/batch-upload.mjs --base-url URL --dir PATH [--token TOKEN] [--gemini-key KEY] [--dry-run] [--skip-analyze]');
  console.error('  or:  node scripts/batch-upload.mjs --base-url URL --update-only --id-from N --id-to M --gemini-key KEY --token TOKEN --dir PATH');
  process.exit(1);
}

const headers = {};
if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

// Collect image files recursively, grouped by parent folder
function collectImages(dir) {
  const groups = [];

  function walk(current, playName) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    const images = [];

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        // Use deepest meaningful folder name as play_name hint
        walk(fullPath, entry.name);
      } else if (IMAGE_EXTS.includes(path.extname(entry.name).toLowerCase())) {
        images.push(fullPath);
      }
    }

    if (images.length > 0) {
      groups.push({ playHint: playName || path.basename(current), folder: current, images });
    }
  }

  walk(dir, path.basename(dir));
  return groups;
}

// Analyze single image — direct Gemini API call (bypasses Worker resource limits)
async function analyzeImage(filePath) {
  if (!GEMINI_KEY) {
    // Fallback: use Worker endpoint
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    const blob = new Blob([fileBuffer], { type: mimeType });
    const formData = new FormData();
    formData.append('image', blob, path.basename(filePath));
    const res = await fetch(`${BASE_URL}/api/v1/images/analyze`, { method: 'POST', headers, body: formData });
    if (!res.ok) throw new Error(`Analyze failed (${res.status}): ${await res.text()}`);
    return res.json();
  }

  // Direct Gemini Vision API call
  const fileBuffer = fs.readFileSync(filePath);
  const base64 = Buffer.from(fileBuffer).toString('base64');
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

  // Fetch characters for matching
  let characterList = '';
  try {
    const chars = await fetch(`${BASE_URL}/api/v1/characters`, { headers }).then(r => r.json());
    characterList = chars.map(c => `- ${c.name}（${c.name_reading}）: 演目「${c.related_play}」${c.aliases ? `、別名: ${c.aliases}` : ''}`).join('\n');
  } catch { /* ignore */ }

  const userPrompt = `この画像を分析して、以下のJSON形式でメタデータを返してください。

【登録済みキャラクター一覧】
${characterList || '（なし）'}

【出力形式】
{
  "play_name": "画像に関連する歌舞伎の演目名（不明なら空文字）",
  "scene_type": "場面タイプ（例: 見得, 立回り, 花道, 舞踊, 群衆, ポートレート, 舞台全景, 稽古風景, 衣裳, 小道具 など）",
  "visual_features": "画像の視覚的特徴をカンマ区切りで（例: 隈取り,赤い衣裳,刀,桜の背景）",
  "season_tag": "季節タグ（春, 夏, 秋, 冬, 通年 のいずれか）",
  "character_match": "上記キャラクター一覧の中で最も一致するキャラクター名（一致なしならnull）",
  "description": "画像の説明（20文字以内）"
}

簡潔に回答してください。各フィールドは短く。`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: userPrompt },
      ]}],
      systemInstruction: { parts: [{ text: 'あなたは歌舞伎の専門家です。歌舞伎に関連する画像を分析し、メタデータを構造化して返してください。' }] },
      generationConfig: { temperature: 0.3, maxOutputTokens: 4096, topP: 0.8, responseMimeType: 'application/json' },
    }),
  });

  if (!res.ok) throw new Error(`Gemini API error (${res.status}): ${await res.text()}`);

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    parsed = match ? JSON.parse(match[0]) : {};
  }
  return parsed;
}

// Upload single image via API (with 8 resize variants generated server-side...
// Actually the resize is client-side in browser. For CLI we send original only.)
async function uploadImage(filePath, metadata) {
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  const blob = new Blob([fileBuffer], { type: mimeType });
  const formData = new FormData();
  formData.append('original', blob, path.basename(filePath));

  // Append metadata
  if (metadata.play_name) formData.append('play_name', metadata.play_name);
  if (metadata.scene_type) formData.append('scene_type', metadata.scene_type);
  if (metadata.visual_features) formData.append('visual_features', metadata.visual_features);
  if (metadata.season_tag) formData.append('season_tag', metadata.season_tag);
  if (metadata.navi_caption) formData.append('navi_caption', metadata.navi_caption);
  if (metadata.character_id) formData.append('character_id', String(metadata.character_id));

  const res = await fetch(`${BASE_URL}/api/v1/images/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed (${res.status}): ${text}`);
  }
  return res.json();
}

// Extract play name from folder path
function extractPlayName(folderPath) {
  // Pattern: "2025寿曽我対面" → "寿曽我対面", "2025白浪五人男" → "白浪五人男"
  const basename = path.basename(folderPath);
  const match = basename.match(/\d{4}(.+)/);
  return match ? match[1] : basename;
}

// Main
async function main() {
  console.log(`\n📂 スキャン中: ${DIR}`);
  const groups = collectImages(DIR);

  let totalImages = 0;
  for (const g of groups) totalImages += g.images.length;
  console.log(`📷 ${groups.length}グループ、合計 ${totalImages}枚\n`);

  // Filter: prefer 20_編集済 > 10_セレクト > 01_原本 per play
  // Group by play (grandparent folder)
  const playMap = new Map();
  for (const g of groups) {
    // Determine play from path hierarchy (handle both / and \ separators)
    const parts = g.folder.replace(/\\/g, '/').split('/');
    // Find the play folder (e.g. "2025寿曽我対面")
    let playFolder = '';
    for (const p of parts) {
      if (/^\d{4}/.test(p) && p.length > 4) {
        playFolder = p;
      }
    }
    if (!playFolder) playFolder = g.playHint;

    const folderName = path.basename(g.folder);
    const priority = folderName.startsWith('20_') ? 3 : folderName.startsWith('10_') ? 2 : 1;

    if (!playMap.has(playFolder) || playMap.get(playFolder).priority < priority) {
      playMap.set(playFolder, { ...g, priority, playFolder });
    }
  }

  const selectedGroups = Array.from(playMap.values());
  let selectedTotal = 0;
  for (const g of selectedGroups) selectedTotal += g.images.length;

  console.log(`🎯 選択されたグループ:`);
  for (const g of selectedGroups) {
    const playName = extractPlayName(g.playFolder);
    console.log(`   ${playName} (${path.basename(g.folder)}): ${g.images.length}枚`);
  }
  console.log(`   合計: ${selectedTotal}枚\n`);

  const results = [];
  let processed = 0;

  for (const group of selectedGroups) {
    const playName = extractPlayName(group.playFolder);
    console.log(`\n━━━ ${playName} ━━━`);

    for (const imagePath of group.images) {
      processed++;
      const fileName = path.basename(imagePath);
      process.stdout.write(`[${processed}/${selectedTotal}] ${fileName} ... `);

      let metadata = {
        play_name: playName,
        scene_type: 'ポートレート',
        visual_features: '',
        season_tag: '通年',
        character_match: null,
        character_id: null,
        description: '',
        navi_caption: '',
      };

      // Use filename as character hint if it's not a number pattern
      const nameWithoutExt = path.basename(imagePath, path.extname(imagePath));
      if (!/^(IMG_|YMT|DSC|\d+_ブロマイド)/.test(nameWithoutExt)) {
        // Filename is likely a character name (e.g. "曽我五郎.png")
        metadata.navi_caption = `${playName} - ${nameWithoutExt}`;
      }

      // AI analysis
      if (!SKIP_ANALYZE) {
        try {
          const analysis = await analyzeImage(imagePath);
          metadata = {
            play_name: playName,  // Always use folder-derived play name
            scene_type: analysis.scene_type || 'ポートレート',
            visual_features: analysis.visual_features || '',
            season_tag: analysis.season_tag || '通年',
            character_match: analysis.character_match || null,
            character_id: analysis.character_id || null,
            description: analysis.description || '',
            navi_caption: metadata.navi_caption || analysis.description || '',
          };
          console.log(`✨ ${metadata.scene_type} | ${metadata.visual_features.substring(0, 40)}`);
        } catch (err) {
          console.log(`⚠️ 分析エラー: ${err.message}`);
        }

        // Rate limit: 1s between API calls
        await new Promise(r => setTimeout(r, 1000));
      } else {
        console.log(`⏭️ 分析スキップ`);
      }

      // Upload
      if (!DRY_RUN) {
        try {
          const uploadResult = await uploadImage(imagePath, metadata);
          console.log(`   ✅ アップロード完了 (id: ${uploadResult.id})`);
          results.push({ file: fileName, id: uploadResult.id, metadata });
        } catch (err) {
          console.log(`   ❌ アップロードエラー: ${err.message}`);
          results.push({ file: fileName, error: err.message });
        }
      } else {
        results.push({ file: fileName, metadata, dryRun: true });
      }
    }
  }

  // Summary
  console.log(`\n\n━━━ 完了 ━━━`);
  const success = results.filter(r => r.id);
  const errors = results.filter(r => r.error);
  console.log(`✅ 成功: ${success.length}枚`);
  if (errors.length) console.log(`❌ エラー: ${errors.length}枚`);
  if (DRY_RUN) console.log(`🔍 ドライラン: ${results.length}枚分析済み（アップロードなし）`);

  // Save results JSON
  const outPath = path.join(__dirname, `batch-result-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`📄 結果: ${outPath}\n`);
}

// Update-only mode: re-analyze existing images and update metadata
async function updateOnly() {
  if (!ID_FROM || !ID_TO || !DIR) {
    console.error('--update-only requires --id-from, --id-to, --dir, and --gemini-key');
    process.exit(1);
  }

  console.log(`\n🔄 メタデータ更新モード: id ${ID_FROM}〜${ID_TO}`);

  // Get existing image records
  const images = await fetch(`${BASE_URL}/api/v1/images`, { headers }).then(r => r.json());
  const targets = images.filter(img => img.id >= ID_FROM && img.id <= ID_TO);
  console.log(`📷 対象: ${targets.length}枚\n`);

  // Build a map of filename -> local file path
  const localFiles = new Map();
  function walkDir(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walkDir(full);
      else localFiles.set(entry.name, full);
    }
  }
  walkDir(DIR);

  let updated = 0;
  for (let i = 0; i < targets.length; i++) {
    const img = targets[i];
    process.stdout.write(`[${i + 1}/${targets.length}] id:${img.id} ${img.filename} ... `);

    // Find local file
    const localPath = localFiles.get(img.filename);
    if (!localPath) {
      console.log('⏭️ ローカルファイルが見つかりません');
      continue;
    }

    try {
      const analysis = await analyzeImage(localPath);

      // Determine play name from folder path
      const parts = localPath.replace(/\\/g, '/').split('/');
      let playName = '';
      for (const p of parts) {
        if (/^\d{4}/.test(p) && p.length > 4) {
          const match = p.match(/\d{4}(.+)/);
          playName = match ? match[1] : p;
        }
      }

      const metadata = {
        character_id: img.character_id,
        play_name: playName || analysis.play_name || img.play_name,
        scene_type: analysis.scene_type || img.scene_type || 'ポートレート',
        visual_features: analysis.visual_features || img.visual_features || '',
        season_tag: analysis.season_tag || img.season_tag || '通年',
        navi_caption: analysis.description || img.navi_caption || '',
        navi_display_order: img.navi_display_order,
        navi_visible: img.navi_visible,
      };

      if (!DRY_RUN) {
        await fetch(`${BASE_URL}/api/v1/images/${img.id}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(metadata),
        });
      }

      console.log(`✨ ${metadata.scene_type} | ${(metadata.visual_features || '').substring(0, 40)}`);
      updated++;
    } catch (err) {
      console.log(`⚠️ ${err.message.substring(0, 80)}`);
    }

    // Rate limit
    if (i < targets.length - 1) await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n━━━ 完了 ━━━`);
  console.log(`✅ 更新: ${updated}/${targets.length}枚\n`);
}

if (UPDATE_ONLY) {
  updateOnly().catch(err => { console.error('Fatal:', err); process.exit(1); });
} else {
  main().catch(err => { console.error('Fatal error:', err); process.exit(1); });
}
