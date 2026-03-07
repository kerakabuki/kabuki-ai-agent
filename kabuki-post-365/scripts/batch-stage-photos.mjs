#!/usr/bin/env node
/**
 * 舞台写真バッチアップロード + Gemini Vision自動タグ付け
 *
 * - 2024 Kera-Kabuki (106枚 PNG 16bit) → sharp でJPG変換してからアップロード
 * - 2025 舞台裏 (28枚 JPG) → そのままアップロード
 *
 * Usage:
 *   node scripts/batch-stage-photos.mjs <API_TOKEN> <GEMINI_KEY>
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import sharp from 'sharp';

const TOKEN = process.argv[2] || '';
const GEMINI_KEY = process.argv[3] || '';

if (!TOKEN || !GEMINI_KEY) {
  console.error('Usage: node scripts/batch-stage-photos.mjs <API_TOKEN> <GEMINI_KEY>');
  process.exit(1);
}

const POST365_BASE = 'https://kabuki-post-365.kerakabuki.workers.dev';
const headers = { 'Authorization': `Bearer ${TOKEN}` };
const TEMP_DIR = path.join(os.tmpdir(), 'kabuki-stage-photos');

// Create temp dir
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// Two source folders
const SOURCES = [
  {
    label: '2025 祭礼公演 舞台裏',
    dir: 'D:/気良歌舞伎/記録写真/2025/祭礼公演/舞台裏/01_原本',
    playHint: '祭礼公演2025',
    sceneHint: '舞台裏',
    needsConvert: false,
  },
  {
    label: '2024 一柳くん撮影 Kera-Kabuki',
    dir: 'D:/気良歌舞伎/記録写真/2024/一柳くん撮影/Kera-Kabuki',
    playHint: '気良歌舞伎2024',
    sceneHint: '', // Let Gemini decide
    needsConvert: true, // PNG 16bit → JPG
  },
];

// Convert PNG to JPG using sharp (resize to max 2000px wide for Gemini + upload)
async function convertToJpg(pngPath) {
  const basename = path.basename(pngPath, path.extname(pngPath));
  const outPath = path.join(TEMP_DIR, `${basename}.jpg`);

  await sharp(pngPath)
    .resize(2000, null, { withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(outPath);

  return outPath;
}

// Gemini Vision analysis
async function analyzeImage(filePath, sceneHint) {
  const fileBuffer = fs.readFileSync(filePath);
  const base64 = Buffer.from(fileBuffer).toString('base64');
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

  // Fetch characters for matching
  let characterList = '';
  try {
    const chars = await fetch(`${POST365_BASE}/api/v1/characters`, { headers }).then(r => r.json());
    characterList = chars.map(c =>
      `- ${c.name}（${c.name_reading}）: 演目「${c.related_play}」`
    ).join('\n');
  } catch { /* ignore */ }

  const sceneContext = sceneHint ? `\n※この画像は「${sceneHint}」フォルダの写真です。` : '';

  const userPrompt = `この歌舞伎の写真を分析して、以下のJSON形式でメタデータを返してください。${sceneContext}

【登録済みキャラクター一覧】
${characterList || '（なし）'}

【出力形式】
{
  "play_name": "画像に関連する歌舞伎の演目名（不明なら空文字）",
  "scene_type": "場面タイプ（例: 見得, 立回り, 花道, 舞踊, 群衆, ポートレート, 舞台全景, 稽古風景, 楽屋, 化粧, 衣裳, 小道具, 集合写真 など）",
  "visual_features": "画像の視覚的特徴をカンマ区切りで（例: 隈取り,赤い衣裳,刀,桜の背景）",
  "season_tag": "季節タグ（春, 夏, 秋, 冬, 通年 のいずれか）",
  "character_match": "上記キャラクター一覧の中で最も一致するキャラクター名（一致なしならnull）",
  "description": "画像の説明（20文字以内）"
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: userPrompt },
      ]}],
      systemInstruction: { parts: [{ text: 'あなたは歌舞伎の専門家です。歌舞伎に関連する画像を分析し、メタデータを構造化して返してください。地歌舞伎（地方の素人歌舞伎）の可能性もあります。' }] },
      generationConfig: { temperature: 0.3, maxOutputTokens: 4096, topP: 0.8, responseMimeType: 'application/json' },
    }),
  });

  if (!res.ok) throw new Error(`Gemini API error (${res.status}): ${await res.text()}`);

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';

  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : {};
  }
}

// Upload image via API
async function uploadImage(filePath, metadata) {
  const fileBuffer = fs.readFileSync(filePath);
  const mimeType = 'image/jpeg';
  const blob = new Blob([fileBuffer], { type: mimeType });
  const formData = new FormData();
  formData.append('original', blob, path.basename(filePath));

  if (metadata.play_name) formData.append('play_name', metadata.play_name);
  if (metadata.scene_type) formData.append('scene_type', metadata.scene_type);
  if (metadata.visual_features) formData.append('visual_features', metadata.visual_features);
  if (metadata.season_tag) formData.append('season_tag', metadata.season_tag);
  if (metadata.character_id) formData.append('character_id', String(metadata.character_id));
  if (metadata.navi_caption) formData.append('navi_caption', metadata.navi_caption);

  const res = await fetch(`${POST365_BASE}/api/v1/images/upload`, {
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

// Match character name to ID
let cachedCharacters = null;
async function getCharacterId(characterName) {
  if (!characterName) return null;
  if (!cachedCharacters) {
    try {
      cachedCharacters = await fetch(`${POST365_BASE}/api/v1/characters`, { headers }).then(r => r.json());
    } catch { return null; }
  }
  const match = cachedCharacters.find(c => c.name === characterName);
  return match ? match.id : null;
}

// Main
async function main() {
  const allResults = [];
  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalErrors = 0;

  for (const source of SOURCES) {
    console.log(`\n${'━'.repeat(50)}`);
    console.log(`📂 ${source.label}`);
    console.log(`   ${source.dir}`);
    console.log(`${'━'.repeat(50)}`);

    if (!fs.existsSync(source.dir)) {
      console.log('⚠️ フォルダが見つかりません、スキップ');
      continue;
    }

    const files = fs.readdirSync(source.dir)
      .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .sort();

    console.log(`📷 ${files.length}枚\n`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const originalPath = path.join(source.dir, file);
      totalProcessed++;

      process.stdout.write(`[${i + 1}/${files.length}] ${file} `);

      // Convert if needed
      let uploadPath = originalPath;
      if (source.needsConvert) {
        try {
          process.stdout.write('→ JPG変換 ');
          uploadPath = await convertToJpg(originalPath);
          const origSize = (fs.statSync(originalPath).size / 1024 / 1024).toFixed(1);
          const newSize = (fs.statSync(uploadPath).size / 1024 / 1024).toFixed(1);
          process.stdout.write(`(${origSize}MB→${newSize}MB) `);
        } catch (err) {
          console.log(`❌ 変換エラー: ${err.message}`);
          totalErrors++;
          continue;
        }
      }

      // Gemini analysis
      let metadata = {
        play_name: source.playHint,
        scene_type: source.sceneHint || '舞台全景',
        visual_features: '',
        season_tag: '秋', // Both events are autumn
        character_match: null,
        character_id: null,
        description: '',
        navi_caption: '',
      };

      try {
        const analysis = await analyzeImage(uploadPath, source.sceneHint);
        const charId = await getCharacterId(analysis.character_match);

        metadata = {
          play_name: analysis.play_name || source.playHint,
          scene_type: analysis.scene_type || source.sceneHint || '舞台全景',
          visual_features: analysis.visual_features || '',
          season_tag: analysis.season_tag || '秋',
          character_match: analysis.character_match || null,
          character_id: charId,
          description: analysis.description || '',
          navi_caption: analysis.description || '',
        };
        process.stdout.write(`✨ ${metadata.scene_type}`);
      } catch (err) {
        process.stdout.write(`⚠️ 分析エラー`);
      }

      // Upload
      try {
        const result = await uploadImage(uploadPath, metadata);
        console.log(` → id:${result.id} ✅`);
        allResults.push({ file, id: result.id, source: source.label, metadata });
        totalSuccess++;
      } catch (err) {
        console.log(` → ❌ ${err.message.substring(0, 60)}`);
        allResults.push({ file, error: err.message, source: source.label });
        totalErrors++;
      }

      // Rate limit: 1.5s between Gemini calls
      if (i < files.length - 1) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }
  }

  // Cleanup temp dir
  try {
    const tempFiles = fs.readdirSync(TEMP_DIR);
    for (const f of tempFiles) fs.unlinkSync(path.join(TEMP_DIR, f));
    fs.rmdirSync(TEMP_DIR);
  } catch { /* ignore */ }

  // Summary
  console.log(`\n\n${'━'.repeat(50)}`);
  console.log(`📊 完了`);
  console.log(`${'━'.repeat(50)}`);
  console.log(`処理: ${totalProcessed}枚`);
  console.log(`成功: ${totalSuccess}枚`);
  console.log(`エラー: ${totalErrors}枚`);

  // Save results
  const outPath = path.join(
    path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')),
    `stage-photos-result-${Date.now()}.json`
  );
  try {
    fs.writeFileSync(outPath, JSON.stringify(allResults, null, 2));
    console.log(`📄 結果: ${outPath}`);
  } catch {
    // Fallback path
    const fallback = `./scripts/stage-photos-result-${Date.now()}.json`;
    fs.writeFileSync(fallback, JSON.stringify(allResults, null, 2));
    console.log(`📄 結果: ${fallback}`);
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
