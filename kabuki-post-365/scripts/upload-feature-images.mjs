#!/usr/bin/env node
/**
 * 機能紹介用OGP画像をPOST365のR2/DBにアップロードするスクリプト
 *
 * Usage:
 *   node scripts/upload-feature-images.mjs --base-url https://kabuki-post-365.kerakabuki.workers.dev --token YOUR_TOKEN
 *   node scripts/upload-feature-images.mjs --base-url http://localhost:8787
 *   node scripts/upload-feature-images.mjs --base-url URL --token TOKEN --dry-run
 *
 * Options:
 *   --base-url   API base URL (required)
 *   --token      API Bearer token (optional for local dev)
 *   --dry-run    Show what would be uploaded without uploading
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Feature → OGP image mapping (matches FEATURES in types.ts)
const FEATURE_IMAGES = [
  { ogpImage: 'ogp_navi.png',            label: 'KABUKI NAVI',    brand: 'KABUKI+',    scene: '機能紹介', visual: 'KABUKI NAVI,演目ガイド,用語辞典,観劇ナビ,アプリ画面' },
  { ogpImage: 'ogp_live.png',            label: 'KABUKI LIVE',    brand: 'KABUKI+',    scene: '機能紹介', visual: 'KABUKI LIVE,公演情報,劇場,スケジュール,アプリ画面' },
  { ogpImage: 'ogp_reco.png',            label: 'KABUKI RECO',    brand: 'KABUKI+',    scene: '機能紹介', visual: 'KABUKI RECO,観劇記録,統計,チャート,アプリ画面' },
  { ogpImage: 'ogp_dojo.png',            label: 'KABUKI DOJO',    brand: 'KABUKI+',    scene: '機能紹介', visual: 'KABUKI DOJO,クイズ,大向う道場,練習,アプリ画面' },
  { ogpImage: 'ogp_kabukiplus_top.png',  label: 'けらのすけ AI',  brand: 'KABUKI+',    scene: '機能紹介', visual: 'けらのすけ,AIチャット,歌舞伎AI,会話画面' },
  { ogpImage: 'ogp_gate.png',            label: 'JIKABUKI GATE',  brand: 'JIKABUKI+',  scene: '機能紹介', visual: 'JIKABUKI GATE,団体公式ページ,地歌舞伎,CMS,アプリ画面' },
  { ogpImage: 'ogp_info.png',            label: 'JIKABUKI INFO',  brand: 'JIKABUKI+',  scene: '機能紹介', visual: 'JIKABUKI INFO,地歌舞伎情報,団体検索,芝居小屋,アプリ画面' },
  { ogpImage: 'ogp_base.png',            label: 'JIKABUKI BASE',  brand: 'JIKABUKI+',  scene: '機能紹介', visual: 'JIKABUKI BASE,団体運営,稽古管理,収支管理,アプリ画面' },
  { ogpImage: 'ogp_labo.png',            label: 'JIKABUKI LABO',  brand: 'JIKABUKI+',  scene: '機能紹介', visual: 'JIKABUKI LABO,コンテンツ管理,エディタ,アプリ画面' },
  { ogpImage: 'ogp_jikabukiplus_top.png', label: 'YouTube/JIKABUKI+', brand: 'YouTube', scene: '機能紹介', visual: 'YouTube,気良歌舞伎,チャンネル,動画' },
];

// Parse CLI args
const args = process.argv.slice(2);
function getArg(name) {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return null;
  if (name === 'dry-run') return true;
  return args[i + 1] || null;
}

const BASE_URL = getArg('base-url');
const TOKEN = getArg('token');
const DRY_RUN = getArg('dry-run');

if (!BASE_URL) {
  console.error('Usage: node scripts/upload-feature-images.mjs --base-url URL [--token TOKEN] [--dry-run]');
  process.exit(1);
}

const headers = {};
if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;

// OGP images are in the parent repo's assets/ogp/
const OGP_DIR = path.resolve(__dirname, '../../assets/ogp');

async function checkExisting() {
  const res = await fetch(`${BASE_URL}/api/v1/images`, { headers });
  if (!res.ok) throw new Error(`Failed to list images: ${res.status}`);
  const images = await res.json();
  return new Set(images.map(img => img.filename));
}

async function uploadFeatureImage(feature) {
  const filePath = path.join(OGP_DIR, feature.ogpImage);
  if (!fs.existsSync(filePath)) {
    console.warn(`  SKIP: ${feature.ogpImage} not found at ${filePath}`);
    return null;
  }

  const fileBuffer = fs.readFileSync(filePath);
  const form = new FormData();
  const blob = new Blob([fileBuffer], { type: 'image/png' });
  form.append('original', blob, feature.ogpImage);
  form.append('scene_type', feature.scene);
  form.append('visual_features', feature.visual);
  form.append('season_tag', '通年');
  form.append('navi_caption', `${feature.label}（${feature.brand}）`);

  const res = await fetch(`${BASE_URL}/api/v1/images/upload`, {
    method: 'POST',
    headers: { ...headers },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`  ERROR uploading ${feature.ogpImage}: ${res.status} ${text}`);
    return null;
  }

  const result = await res.json();
  console.log(`  OK: ${feature.ogpImage} → id=${result.id}`);
  return result;
}

async function main() {
  console.log('=== 機能紹介用OGP画像アップロード ===');
  console.log(`API: ${BASE_URL}`);
  console.log(`OGP dir: ${OGP_DIR}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'UPLOAD'}`);
  console.log('');

  // Check which images already exist
  let existingFilenames;
  try {
    existingFilenames = await checkExisting();
  } catch (e) {
    console.error('Failed to check existing images:', e.message);
    existingFilenames = new Set();
  }

  let uploaded = 0;
  let skipped = 0;

  for (const feature of FEATURE_IMAGES) {
    const filePath = path.join(OGP_DIR, feature.ogpImage);
    const exists = fs.existsSync(filePath);
    const alreadyUploaded = existingFilenames.has(feature.ogpImage);

    if (alreadyUploaded) {
      console.log(`SKIP (already exists): ${feature.ogpImage} — ${feature.label}`);
      skipped++;
      continue;
    }

    if (!exists) {
      console.log(`SKIP (file not found): ${feature.ogpImage}`);
      skipped++;
      continue;
    }

    const stat = fs.statSync(filePath);
    console.log(`UPLOAD: ${feature.ogpImage} (${(stat.size / 1024).toFixed(0)} KB) — ${feature.label} [${feature.brand}]`);

    if (!DRY_RUN) {
      await uploadFeatureImage(feature);
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
    }
    uploaded++;
  }

  console.log('');
  console.log(`Done: ${uploaded} uploaded, ${skipped} skipped`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
