#!/usr/bin/env node
/**
 * OGP Composite Image Generator
 *
 * Usage: node generate-ogp.mjs [--size 1080x1080] [--base-url https://kabukiplus.com]
 *
 * 1. Visits each feature page at mobile viewport → takes screenshot
 * 2. Renders OGP composite HTML with phone mockup + screenshot → saves PNG
 * 3. Outputs to assets/ogp/output/
 */
import puppeteer from 'puppeteer';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, 'output');

const PHOTOS_DIR = join(__dirname, '..', 'photos');

const FEATURES = [
  { name: 'KABUKI NAVI（演目ガイド）', nameJa: '歌舞伎羅針盤', nameEn: 'KABUKI NAVI', brand: 'KABUKI+', tagline: '知れば知るほど、面白い。', sub: '演目のあらすじ・人物・用語', path: '/kabuki/navi/enmoku', file: 'feature_navi_enmoku', bgPhoto: 'about-enmoku.webp' },
  { name: 'KABUKI NAVI（用語辞典）', nameJa: '歌舞伎羅針盤', nameEn: 'KABUKI NAVI', brand: 'KABUKI+', tagline: '126語の歌舞伎用語辞典', sub: '8カテゴリ・読みがな付き', path: '/kabuki/navi/glossary', file: 'feature_navi_glossary', bgPhoto: 'about-kesho.webp' },
  { name: 'KABUKI NAVI（観劇ナビ）', nameJa: '歌舞伎羅針盤', nameEn: 'KABUKI NAVI', brand: 'KABUKI+', tagline: '初めての歌舞伎を、ナビ。', sub: 'チケットからマナーまで6ステップ', path: '/kabuki/navi/kangekinavi', file: 'feature_navi_kangeki', bgPhoto: '2025-shiranami.webp' },
  { name: 'KABUKI LIVE（公演情報）', nameJa: '歌舞伎瓦版', nameEn: 'KABUKI LIVE', brand: 'KABUKI+', tagline: '歌舞伎の今を、知る。', sub: '歌舞伎ニュース・全国公演スケジュール', path: '/kabuki/live', file: 'feature_live', bgPhoto: '2025-soga-mie.webp' },
  { name: 'KABUKI RECO（観劇記録）', nameJa: '歌舞伎帖', nameEn: 'KABUKI RECO', brand: 'KABUKI+', tagline: 'あなたの感動を、記録に。', sub: '観劇ログ・推し俳優・歌舞伎ライフを可視化', path: '/kabuki/reco', file: 'feature_reco', bgPhoto: '2025-portrait.webp' },
  { name: 'KABUKI DOJO（歌舞伎クイズ）', nameJa: '歌舞伎道場', nameEn: 'KABUKI DOJO', brand: 'KABUKI+', tagline: '知識で、もっと楽しく。', sub: '3段階の難易度で歌舞伎の知識をテスト', path: '/kabuki/dojo/quiz', file: 'feature_dojo_quiz', bgPhoto: '2025-fuuingin.webp' },
  { name: 'KABUKI DOJO（大向う道場）', nameJa: '歌舞伎道場', nameEn: 'KABUKI DOJO', brand: 'KABUKI+', tagline: '掛け声の練習、始めよう。', sub: '動画連動で掛け声＆拍手タイミング練習', path: '/kabuki/dojo/kakegoe', file: 'feature_dojo_kakegoe', bgPhoto: 'hero-kiraza.webp' },
  { name: 'けらのすけ（AIチャット）', nameJa: 'けらのすけ', nameEn: 'AI CHAT', brand: 'KABUKI+', tagline: '歌舞伎のこと、何でも聞いて。', sub: 'AIアシスタントが演目・用語・公演情報を回答', path: '/kabuki/chat', file: 'feature_chat', bgPhoto: 'about-kuroko.webp' },
  { name: 'JIKABUKI GATE（団体公式ページ）', nameJa: '地歌舞伎門', nameEn: 'JIKABUKI GATE', brand: 'JIKABUKI+', tagline: '団体の顔を、簡単に。', sub: '地歌舞伎団体の公式ページを作成・運営', path: '/jikabuki/gate', file: 'feature_gate', bgPhoto: 'about-butaiura.webp' },
  { name: 'JIKABUKI INFO（地歌舞伎情報）', nameJa: '地歌舞伎情報', nameEn: 'JIKABUKI INFO', brand: 'JIKABUKI+', tagline: '全国の地歌舞伎を、ここに。', sub: '団体検索・芝居小屋データベース・イベント情報', path: '/jikabuki/info', file: 'feature_info', bgPhoto: '2025-gakuya.webp' },
  { name: 'JIKABUKI BASE（団体運営ツール）', nameJa: '地歌舞伎基地', nameEn: 'JIKABUKI BASE', brand: 'JIKABUKI+', tagline: '団体運営を、もっとスムーズに。', sub: '稽古カレンダー・出欠・台本・収支管理', path: '/jikabuki/base', file: 'feature_base', bgPhoto: '2025-soga-mie.webp' },
  { name: 'JIKABUKI LABO（コンテンツ管理）', nameJa: '地歌舞伎工房', nameEn: 'JIKABUKI LABO', brand: 'JIKABUKI+', tagline: 'みんなで育てる、歌舞伎データ。', sub: '演目・用語・クイズのコンテンツエディター', path: '/jikabuki/labo', file: 'feature_labo', bgPhoto: 'about-enmoku.webp' },
  { name: 'YouTube：気良歌舞伎チャンネル', nameJa: '気良歌舞伎', nameEn: 'YouTube', brand: 'YouTube', tagline: '舞台の裏側、お見せします。', sub: '練習風景・本番映像・歌舞伎入門動画', path: '', file: 'feature_youtube', bgPhoto: 'hero-kiraza.webp' },
];

// Parse args
const args = process.argv.slice(2);
let width = 1080, height = 1080;
let baseUrl = 'https://kabukiplus.com';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--size' && args[i + 1]) {
    const [w, h] = args[i + 1].split('x').map(Number);
    if (w && h) { width = w; height = h; }
    i++;
  }
  if (args[i] === '--base-url' && args[i + 1]) {
    baseUrl = args[i + 1];
    i++;
  }
}

function buildCompositeHtml(feature, screenshotBase64, bgPhotoBase64, w, h) {
  const isSquare = w === h;
  const phoneW = isSquare ? 240 : 220;
  const phoneH = isSquare ? 490 : 430;
  const brandColor = feature.brand === 'YouTube' ? '#ff0000' : '#c4a46c';

  const bgStyle = bgPhotoBase64
    ? `background: url('${bgPhotoBase64}') center/cover no-repeat;`
    : `background: linear-gradient(135deg, #2a2320 0%, #1e1a16 50%, #2a2320 100%);`;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@700&family=Noto+Sans+JP:wght@400;700&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: ${w}px; height: ${h}px; overflow: hidden; }

.container {
  width: ${w}px; height: ${h}px;
  ${bgStyle}
  position: relative;
  display: flex;
}

/* Dark overlay for readability */
.bg-overlay {
  position: absolute; inset: 0;
  background: ${bgPhotoBase64
    ? 'linear-gradient(135deg, rgba(20,18,14,0.82) 0%, rgba(30,26,22,0.75) 50%, rgba(20,18,14,0.85) 100%)'
    : 'none'};
  z-index: 0;
}

/* Gold corner accents */
.corner-tl, .corner-bl { position: absolute; left: 36px; width: 70px; height: 70px; border-left: 2px solid #c4a46c; z-index: 1; }
.corner-tl { top: 36px; border-top: 2px solid #c4a46c; }
.corner-bl { bottom: 36px; border-bottom: 2px solid #c4a46c; }
.corner-tl::after, .corner-bl::after {
  content: ''; position: absolute; left: -6px; width: 8px; height: 8px;
  border: 1.5px solid #c4a46c; border-radius: 50%;
}
.corner-tl::after { bottom: -20px; }
.corner-bl::after { top: -20px; }

/* Vertical accent line */
.vline {
  position: absolute;
  right: ${isSquare ? '340px' : '42%'};
  top: 60px; bottom: 60px;
  width: 1px;
  background: rgba(196,164,108,0.12);
  z-index: 1;
}

/* Text area */
.text-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: ${isSquare ? '0 40px 0 60px' : '0 20px 0 60px'};
  max-width: ${isSquare ? '58%' : '55%'};
  z-index: 1;
}

.brand-label {
  font-family: 'Segoe UI', sans-serif;
  font-size: ${isSquare ? 17 : 15}px;
  color: ${brandColor};
  letter-spacing: 3px;
  margin-bottom: ${isSquare ? 20 : 14}px;
}
.brand-label::before, .brand-label::after {
  content: '──  '; letter-spacing: -2px; opacity: 0.6;
}
.brand-label::after { content: '  ──'; }

.name-ja {
  font-family: 'Noto Serif JP', 'Hiragino Mincho ProN', 'Yu Mincho', serif;
  font-size: ${isSquare ? 56 : 48}px;
  font-weight: 700;
  color: #e8e0d4;
  letter-spacing: ${isSquare ? 12 : 10}px;
  text-align: center;
  line-height: 1.3;
}

.name-en {
  font-family: 'Segoe UI', sans-serif;
  font-size: ${isSquare ? 15 : 13}px;
  color: #777;
  letter-spacing: 4px;
  margin-top: ${isSquare ? 10 : 8}px;
}

.sep {
  width: 40px; height: 2px;
  background: #c4a46c;
  margin: ${isSquare ? '24px 0' : '18px 0'};
}

.tagline {
  font-family: 'Noto Sans JP', 'Hiragino Sans', sans-serif;
  font-size: ${isSquare ? 26 : 22}px;
  font-weight: 700;
  color: #e8e0d4;
  text-align: center;
  line-height: 1.5;
}

.sub {
  font-family: 'Noto Sans JP', 'Hiragino Sans', sans-serif;
  font-size: ${isSquare ? 13 : 12}px;
  color: #999;
  margin-top: ${isSquare ? 10 : 8}px;
  text-align: center;
}

/* Vertical ghost text */
.ghost-text {
  position: absolute;
  right: ${isSquare ? '52px' : '44px'};
  top: ${isSquare ? '140px' : '80px'};
  writing-mode: vertical-rl;
  font-family: 'Noto Serif JP', serif;
  font-size: ${isSquare ? 32 : 26}px;
  font-weight: 700;
  color: rgba(196,164,108,0.07);
  letter-spacing: 8px;
  z-index: 1;
}

.url-label {
  position: absolute;
  right: 50px; bottom: 36px;
  font-family: 'Segoe UI', sans-serif;
  font-size: ${isSquare ? 13 : 12}px;
  color: #777;
  z-index: 1;
}

/* Phone mockup */
.phone-area {
  position: absolute;
  right: ${isSquare ? '80px' : '60px'};
  top: 50%;
  transform: translateY(-50%);
  width: ${phoneW}px;
  height: ${phoneH}px;
  z-index: 2;
}

.phone-frame {
  width: 100%; height: 100%;
  background: #2c2c2e;
  border-radius: 28px;
  border: 2px solid #444;
  box-shadow: 8px 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset;
  position: relative;
  overflow: hidden;
}

.phone-notch {
  position: absolute;
  top: 6px; left: 50%; transform: translateX(-50%);
  width: 80px; height: 22px;
  background: #1a1a1a;
  border-radius: 0 0 14px 14px;
  z-index: 3;
}

.phone-status {
  position: absolute;
  top: 8px; left: 16px;
  font-family: 'SF Pro', 'Segoe UI', sans-serif;
  font-size: 11px; font-weight: 600;
  color: #aaa;
  z-index: 4;
}

.phone-screen {
  position: absolute;
  top: 6px; left: 6px;
  right: 6px; bottom: 6px;
  border-radius: 22px;
  overflow: hidden;
  background: #fff;
}

.phone-screen img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
}

.phone-home {
  position: absolute;
  bottom: 8px; left: 50%; transform: translateX(-50%);
  width: 60px; height: 4px;
  background: #666;
  border-radius: 2px;
  z-index: 3;
}
</style></head><body>
<div class="container">
  <div class="bg-overlay"></div>
  <div class="corner-tl"></div>
  <div class="corner-bl"></div>
  <div class="vline"></div>

  <div class="text-area">
    <div class="brand-label">${feature.brand}</div>
    <div class="name-ja">${feature.nameJa}</div>
    <div class="name-en">${feature.nameEn}</div>
    <div class="sep"></div>
    <div class="tagline">${feature.tagline}</div>
    <div class="sub">${feature.sub}</div>
  </div>

  <div class="ghost-text">${feature.nameJa}</div>

  ${screenshotBase64 ? `
  <div class="phone-area">
    <div class="phone-frame">
      <div class="phone-notch"></div>
      <div class="phone-status">9:41</div>
      <div class="phone-screen">
        <img src="${screenshotBase64}" />
      </div>
      <div class="phone-home"></div>
    </div>
  </div>
  ` : ''}

  <div class="url-label">kabukiplus.com</div>
</div>
</body></html>`;
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`🎨 OGP Composite Generator`);
  console.log(`   Size: ${width}×${height} | Base URL: ${baseUrl}`);
  console.log(`   Output: ${OUTPUT_DIR}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (let i = 0; i < FEATURES.length; i++) {
    const f = FEATURES[i];
    console.log(`[${i + 1}/${FEATURES.length}] ${f.name}`);

    // Load background photo
    let bgPhotoBase64 = null;
    if (f.bgPhoto) {
      const photoPath = join(PHOTOS_DIR, f.bgPhoto);
      if (existsSync(photoPath)) {
        // Convert webp to jpeg for better browser compatibility, resize to target
        const jpegBuf = await sharp(photoPath)
          .resize(width * 2, height * 2, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toBuffer();
        bgPhotoBase64 = 'data:image/jpeg;base64,' + jpegBuf.toString('base64');
        console.log(`   🖼️ Background: ${f.bgPhoto}`);
      } else {
        console.log(`   ⚠️ Photo not found: ${photoPath}`);
      }
    }

    let screenshotBase64 = null;

    // Step 1: Take screenshot of the feature page
    if (f.path) {
      const url = baseUrl + f.path;
      console.log(`   📸 Capturing ${url} ...`);
      try {
        const page = await browser.newPage();
        await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
        // Wait a bit for animations/lazy-loaded content
        await new Promise(r => setTimeout(r, 1500));
        const buf = await page.screenshot({ type: 'png' });
        screenshotBase64 = 'data:image/png;base64,' + buf.toString('base64');
        await page.close();
        console.log(`   ✅ Screenshot captured`);
      } catch (e) {
        console.log(`   ⚠️ Screenshot failed: ${e.message}`);
      }
    } else {
      console.log(`   ⏭️ No URL (${f.brand}) — text-only composite`);
    }

    // Step 2: Render composite HTML → screenshot
    const html = buildCompositeHtml(f, screenshotBase64, bgPhotoBase64, width, height);
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    // Wait for Google Fonts to load
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 500));

    const outPath = join(OUTPUT_DIR, `${f.file}_${width}x${height}.png`);
    await page.screenshot({ path: outPath, type: 'png' });
    await page.close();
    console.log(`   💾 Saved: ${outPath}\n`);
  }

  await browser.close();
  console.log(`✨ Done! ${FEATURES.length} images generated in ${OUTPUT_DIR}`);
}

main().catch(e => { console.error('❌ Error:', e); process.exit(1); });
