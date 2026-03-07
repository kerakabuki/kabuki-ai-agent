#!/usr/bin/env node
/**
 * 2024 Kera-Kabuki 残り68枚をアップロード
 * YMT04908以降のファイルを処理
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import sharp from 'sharp';

const TOKEN = process.argv[2] || '';
const GEMINI_KEY = process.argv[3] || '';

if (!TOKEN || !GEMINI_KEY) {
  console.error('Usage: node scripts/batch-stage-remaining.mjs <API_TOKEN> <GEMINI_KEY>');
  process.exit(1);
}

const POST365_BASE = 'https://kabuki-post-365.kerakabuki.workers.dev';
const headers = { 'Authorization': `Bearer ${TOKEN}` };
const TEMP_DIR = path.join(os.tmpdir(), 'kabuki-stage-remaining');
const SRC_DIR = 'D:/気良歌舞伎/記録写真/2024/一柳くん撮影/Kera-Kabuki';

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// Already uploaded filenames (YMT04375 - YMT04907)
const UPLOADED = new Set([
  'YMT04375','YMT04389','YMT04405','YMT04408','YMT04414','YMT04442','YMT04459','YMT04484',
  'YMT04491','YMT04511','YMT04518','YMT04530','YMT04542','YMT04550','YMT04603','YMT04613',
  'YMT04615','YMT04618','YMT04622','YMT04623','YMT04626','YMT04634','YMT04637','YMT04668',
  'YMT04669','YMT04671','YMT04728','YMT04735','YMT04827','YMT04849','YMT04864','YMT04869',
  'YMT04883','YMT04896','YMT04897','YMT04905','YMT04906','YMT04907',
]);

async function convertToJpg(pngPath) {
  const basename = path.basename(pngPath, path.extname(pngPath));
  const outPath = path.join(TEMP_DIR, `${basename}.jpg`);
  await sharp(pngPath)
    .resize(2000, null, { withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(outPath);
  return outPath;
}

let cachedCharacters = null;
async function getCharacters() {
  if (!cachedCharacters) {
    cachedCharacters = await fetch(`${POST365_BASE}/api/v1/characters`, { headers }).then(r => r.json());
  }
  return cachedCharacters;
}

async function analyzeImage(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const base64 = Buffer.from(fileBuffer).toString('base64');

  const chars = await getCharacters();
  const characterList = chars.map(c =>
    `- ${c.name}（${c.name_reading}）: 演目「${c.related_play}」`
  ).join('\n');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64 } },
        { text: `この歌舞伎の写真を分析してJSON形式でメタデータを返してください。

【登録済みキャラクター一覧】
${characterList}

【出力形式】
{
  "play_name": "演目名（不明なら空文字）",
  "scene_type": "場面タイプ（見得/立回り/花道/舞踊/群衆/ポートレート/舞台全景/稽古風景/楽屋/化粧/衣裳/小道具/集合写真 など）",
  "visual_features": "視覚的特徴をカンマ区切り",
  "season_tag": "春/夏/秋/冬/通年",
  "character_match": "一致するキャラクター名（なしならnull）",
  "description": "画像の説明（20文字以内）"
}` },
      ]}],
      systemInstruction: { parts: [{ text: 'あなたは歌舞伎の専門家です。地歌舞伎（地方の素人歌舞伎）の写真を分析してください。' }] },
      generationConfig: { temperature: 0.3, maxOutputTokens: 4096, topP: 0.8, responseMimeType: 'application/json' },
    }),
  });

  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
  try { return JSON.parse(text); } catch {
    const match = text.replace(/```json\s*/g, '').replace(/```/g, '').match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : {};
  }
}

async function uploadImage(filePath, metadata) {
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
  const formData = new FormData();
  formData.append('original', blob, path.basename(filePath));
  if (metadata.play_name) formData.append('play_name', metadata.play_name);
  if (metadata.scene_type) formData.append('scene_type', metadata.scene_type);
  if (metadata.visual_features) formData.append('visual_features', metadata.visual_features);
  if (metadata.season_tag) formData.append('season_tag', metadata.season_tag);
  if (metadata.character_id) formData.append('character_id', String(metadata.character_id));
  if (metadata.navi_caption) formData.append('navi_caption', metadata.navi_caption);

  const res = await fetch(`${POST365_BASE}/api/v1/images/upload`, { method: 'POST', headers, body: formData });
  if (!res.ok) throw new Error(`Upload ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  const allFiles = fs.readdirSync(SRC_DIR).filter(f => /\.png$/i.test(f)).sort();
  const remaining = allFiles.filter(f => !UPLOADED.has(path.basename(f, '.png')));

  console.log(`残り ${remaining.length}枚を処理\n`);

  let success = 0, errors = 0;

  for (let i = 0; i < remaining.length; i++) {
    const file = remaining[i];
    const originalPath = path.join(SRC_DIR, file);
    process.stdout.write(`[${i + 1}/${remaining.length}] ${file} `);

    try {
      // Convert PNG → JPG
      const jpgPath = await convertToJpg(originalPath);
      const origSize = (fs.statSync(originalPath).size / 1024 / 1024).toFixed(1);
      const newSize = (fs.statSync(jpgPath).size / 1024 / 1024).toFixed(1);
      process.stdout.write(`(${origSize}→${newSize}MB) `);

      // Analyze
      const analysis = await analyzeImage(jpgPath);
      const chars = await getCharacters();
      const charMatch = analysis.character_match ? chars.find(c => c.name === analysis.character_match) : null;

      const metadata = {
        play_name: analysis.play_name || '気良歌舞伎2024',
        scene_type: analysis.scene_type || '舞台全景',
        visual_features: analysis.visual_features || '',
        season_tag: analysis.season_tag || '秋',
        character_id: charMatch?.id || null,
        navi_caption: analysis.description || '',
      };

      process.stdout.write(`✨ ${metadata.scene_type} `);

      // Upload
      const result = await uploadImage(jpgPath, metadata);
      console.log(`→ id:${result.id} ✅`);
      success++;

      // Cleanup temp file
      fs.unlinkSync(jpgPath);
    } catch (err) {
      console.log(`❌ ${err.message.substring(0, 60)}`);
      errors++;
    }

    // Rate limit
    if (i < remaining.length - 1) await new Promise(r => setTimeout(r, 1500));
  }

  // Cleanup temp dir
  try { fs.rmdirSync(TEMP_DIR); } catch {}

  console.log(`\n━━━ 完了 ━━━`);
  console.log(`成功: ${success}枚`);
  console.log(`エラー: ${errors}枚`);
  console.log(`合計(既存+今回): ${38 + success}/${106}枚`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
