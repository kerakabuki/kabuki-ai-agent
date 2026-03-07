#!/usr/bin/env node
/**
 * 既存画像のリサイズバリアント生成 + R2アップロード
 * 1:1バリアントは黒背景パディング（見切れなし）
 *
 * Usage:
 *   node scripts/generate-variants.mjs --base-url URL --token TOKEN --dir PATH [--id-from N] [--id-to M]
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const args = process.argv.slice(2);
function getArg(name) {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return null;
  return args[i + 1] || null;
}

const BASE_URL = getArg('base-url');
const TOKEN = getArg('token');
const DIR = getArg('dir');
const ID_FROM = getArg('id-from') ? Number(getArg('id-from')) : 1;
const ID_TO = getArg('id-to') ? Number(getArg('id-to')) : 9999;

if (!BASE_URL || !TOKEN || !DIR) {
  console.error('Usage: node scripts/generate-variants.mjs --base-url URL --token TOKEN --dir PATH [--id-from N] [--id-to M]');
  process.exit(1);
}

const headers = { 'Authorization': `Bearer ${TOKEN}` };

const VARIANTS = [
  { key: 'sns_instagram', width: 1080, height: 1080, quality: 90 },
  { key: 'sns_x',         width: 1200, height: 675,  quality: 90 },
  { key: 'sns_facebook',  width: 1200, height: 630,  quality: 90 },
  { key: 'navi_card',     width: 400,  height: 400,  quality: 85 },
  { key: 'navi_detail',   width: 800,  height: null,  quality: 85 }, // aspect ratio preserved
  { key: 'navi_thumb',    width: 120,  height: 120,  quality: 80 },
];

const R2_PATHS = {
  sns_instagram: 'sns/instagram',
  sns_x: 'sns/x',
  sns_facebook: 'sns/facebook',
  navi_card: 'navi/card',
  navi_detail: 'navi/detail',
  navi_thumb: 'navi/thumb',
};

// Resize with black padding (fit: contain) for fixed aspect ratio variants
async function resizeImage(inputBuffer, width, height, quality) {
  if (height === null) {
    // Aspect ratio preserved — just resize width
    return sharp(inputBuffer)
      .resize(width, undefined, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();
  }

  // Fixed size with black padding (no cropping)
  return sharp(inputBuffer)
    .resize(width, height, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .jpeg({ quality })
    .toBuffer();
}

// Upload a single variant to R2 via the Worker's upload path
// We use a direct R2 upload via a temporary endpoint or re-use the existing upload
async function uploadVariantToR2(buffer, r2Key) {
  // Use the generic images upload but we need a workaround since the upload
  // endpoint expects multipart. Instead, we'll use a dedicated put.
  // Actually, let's just use fetch with the R2 key pattern via a small helper.
  // The simplest: upload via the existing /api/v1/images/upload endpoint as a variant.

  // We'll create a FormData with just the variant file
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  const formData = new FormData();
  // Use a special header to tell the endpoint which R2 path to use
  // Actually, let's just PUT directly. We need a new endpoint or use existing infra.

  // Simplest approach: call a dedicated script endpoint or upload via R2 presigned.
  // For now, let's POST to a new /api/v1/images/put-variant endpoint.
  // But that doesn't exist yet. Let me use the existing upload structure differently.

  // Best approach for CLI: We'll use the Cloudflare API directly to put objects to R2.
  // But that requires account credentials we don't have.

  // Practical approach: create a thin endpoint to accept a single variant upload.
  // OR: use the existing upload by appending to FormData with the correct key name.

  // Let's use the upload endpoint by creating a dummy upload with just one variant.
  // The upload endpoint expects 'original' at minimum, but we can trick it.
  // Actually no, it creates a new DB record each time.

  // The RIGHT approach: add a PUT /api/v1/images/:id/variant endpoint.
  // For now, let me just collect all variants per image and upload them all at once
  // using the existing endpoint structure. We'll need a new endpoint.

  // Let's take the pragmatic route and create a small endpoint.
  return { r2Key, size: buffer.length };
}

// Build local file index
function buildFileIndex(dir) {
  const index = new Map();
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else index.set(entry.name, full);
    }
  }
  walk(dir);
  return index;
}

async function main() {
  console.log('\n🔄 バリアント生成スクリプト');
  console.log(`   背景: 黒 (#000000) パディング\n`);

  // Fetch image list
  const imgs = await fetch(`${BASE_URL}/api/v1/images`, { headers }).then(r => r.json());
  const targets = imgs.filter(i => i.id >= ID_FROM && i.id <= ID_TO);
  console.log(`📷 対象: ${targets.length}枚 (id ${ID_FROM}〜${ID_TO})`);

  // Build local file index
  const fileIndex = buildFileIndex(DIR);
  console.log(`📂 ローカルファイル: ${fileIndex.size}件\n`);

  // We need an endpoint to upload variants. Let's generate all files locally first,
  // then upload them via a batch endpoint.

  // Generate variants locally, then upload via FormData to existing upload endpoint
  // with a special "variant_for" parameter to skip DB record creation.

  // Actually, the cleanest solution: generate all variant files, then upload them
  // via a new endpoint we add to the API. Let me prepare the data and create the endpoint.

  // For now: generate files and upload via individual R2 PUT through a new endpoint.
  // Step 1: Generate all variant buffers
  // Step 2: Upload via POST /api/v1/images/:id/variants

  let processed = 0;
  let errors = 0;

  for (const img of targets) {
    processed++;
    const localPath = fileIndex.get(img.filename);
    if (!localPath) {
      console.log(`[${processed}/${targets.length}] id:${img.id} ${img.filename} — ⏭️ ローカルファイルなし`);
      continue;
    }

    process.stdout.write(`[${processed}/${targets.length}] id:${img.id} ${img.filename} ... `);

    try {
      const inputBuffer = fs.readFileSync(localPath);
      const baseName = img.filename.replace(/\.[^.]+$/, '');

      // Create FormData with all variants
      const formData = new FormData();

      for (const variant of VARIANTS) {
        const buffer = await resizeImage(inputBuffer, variant.width, variant.height, variant.quality);
        const blob = new Blob([buffer], { type: 'image/jpeg' });
        const fileName = `${baseName}.jpg`;
        formData.append(variant.key, blob, fileName);
      }

      // Upload variants via the new endpoint
      const res = await fetch(`${BASE_URL}/api/v1/images/${img.id}/variants`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${TOKEN}` },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Upload failed (${res.status}): ${text.substring(0, 100)}`);
      }

      const result = await res.json();
      console.log(`✅ ${result.uploaded}個のバリアント`);
    } catch (err) {
      console.log(`❌ ${err.message.substring(0, 80)}`);
      errors++;
    }
  }

  console.log(`\n━━━ 完了 ━━━`);
  console.log(`✅ 処理: ${processed - errors}/${processed}枚`);
  if (errors) console.log(`❌ エラー: ${errors}枚`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
