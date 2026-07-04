// 曽根崎心中解説動画 生成AI画像の一括生成スクリプト
// プロンプト定義: docs/youtube-sonezaki-image-prompts.md
// API形式は kabuki-post-365/src/lib/image-gen.ts と同じ (Gemini native image generation)
//
// 使い方:
//   $env:GEMINI_API_KEY = "..."   # 事前に1回設定
//   node scripts/generate_sonezaki_images.mjs          # 全カット（既存ファイルはスキップ）
//   node scripts/generate_sonezaki_images.mjs cards    # 人物カードのみ (01-03)
//   node scripts/generate_sonezaki_images.mjs scenes   # 場面カットのみ (04-08)
//   node scripts/generate_sonezaki_images.mjs 06       # 番号指定で1枚だけ
//   末尾に --force で既存ファイルも作り直し

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT_DIR = 'D:\\気良歌舞伎\\youtubeチャンネル用\\超訳！歌舞伎ナビ\\歌舞伎ナビ05曽根崎心中\\画像\\生成';
const MODEL = 'gemini-3.1-flash-image-preview';

const STYLE =
  'A traditional Japanese ukiyo-e woodblock print style illustration, Edo period aesthetic, ' +
  'muted color palette of deep indigo, soft gold, pale pink and dark vermilion, ' +
  'flat colors with visible line work, no text, no watermark, no artist seal, no signature stamp, ' +
  'wide 16:9 landscape composition. ' +
  'Kimono must be worn right-over-left (migimae). No photorealism, no 3d render, no modern clothing.';

const STYLE_MATCH = 'Match the exact art style, line weight, coloring and paper texture of the reference image. ';

// refs: 参照画像として渡す生成済みカットの番号（キャラ一貫性のため）
const CUTS = [
  { no: '01', name: 'お初カード', refs: [], prompt:
    'A young courtesan of the Edo period standing gracefully, wearing an elegant purple kimono with floral patterns, traditional nihongami hairstyle with kanzashi hairpins, gentle but determined expression, full body, plain pale cream background.' },
  { no: '02', name: '徳兵衛カード', refs: ['01'], styleMatch: true, prompt:
    'A young Edo period merchant clerk (tedai) standing, wearing a simple striped brown and indigo kimono, honest and earnest face, slightly worried expression, full body, plain pale cream background.' },
  { no: '03', name: '九平次カード', refs: ['01'], styleMatch: true, prompt:
    'A sly villainous Edo period townsman standing with arms crossed, wearing a dark green kimono, smug cunning grin, sharp eyes, full body, plain pale cream background.' },
  { no: '04', name: '生玉社前', refs: [], prompt:
    'The precincts of an Edo period shrine in Osaka with a wooden torii gate, stone lanterns and low teahouse benches, daytime, gentle spring atmosphere, no people.' },
  { no: '05', name: '天満屋の夜', refs: ['04'], styleMatch: true, prompt:
    'Use the reference image ONLY for art style — this is a COMPLETELY DIFFERENT location: an Edo period teahouse in the Dojima pleasure quarter at night. No torii gate, no shrine, no stone lanterns. A wooden veranda (engawa) with a raised floor and dark shadow space beneath it, plain unmarked white paper lanterns with warm glow (absolutely no writing or characters anywhere in the image), noren curtains, quiet tense atmosphere, no people.' },
  { no: '06', name: '道行シルエット', refs: ['01', '02'], prompt:
    'Using the two reference character images (the woman in purple kimono and the man in striped kimono), draw them as two small silhouettes seen from behind, walking away hand in hand on a moonlit forest path at night, large pale full moon, torii gate silhouette in the distance, deep indigo night sky, melancholic and beautiful atmosphere.' },
  { no: '07', name: '天神の森', refs: [], prompt:
    'A moonlit sacred forest at Sonezaki shrine at night, no people, a large pale full moon behind tree silhouettes, a small torii gate, drifting mist, fireflies faintly glowing, atmospheric, melancholic and serene.' },
  { no: '08', name: 'サムネ背景', refs: ['01', '02'], prompt:
    'Using the two reference character images, a dramatic night scene of Sonezaki forest with a huge full moon, two small silhouettes of the lovers in kimono standing together under the moon, high contrast composition with large empty space on the left side for title text.' },
];

// APIキー: 環境変数 GEMINI_API_KEY → リポジトリ直下の .gemini_api_key ファイル の順で探す
const KEY_FILE = new URL('../.gemini_api_key', import.meta.url);
let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey && existsSync(KEY_FILE)) {
  apiKey = readFileSync(KEY_FILE, 'utf8').trim();
}
if (!apiKey) {
  console.error('APIキーが見つかりません。リポジトリ直下に .gemini_api_key ファイルを作成してください（.gitignore登録済み）。');
  process.exit(1);
}

const args = process.argv.slice(2).filter(a => a !== '--force');
const force = process.argv.includes('--force');
const target = args[0] ?? 'all';

function outPath(cut) {
  return join(OUT_DIR, `${cut.no}_${cut.name}.png`);
}

function selected(cut) {
  if (target === 'all') return true;
  if (target === 'cards') return Number(cut.no) <= 3;
  if (target === 'scenes') return Number(cut.no) >= 4;
  return cut.no === target.padStart(2, '0');
}

async function generate(cut) {
  const parts = [];
  for (const refNo of cut.refs) {
    const refCut = CUTS.find(c => c.no === refNo);
    const refFile = outPath(refCut);
    if (!existsSync(refFile)) {
      console.warn(`  [${cut.no}] 参照画像 ${refCut.no}_${refCut.name}.png が未生成のため参照なしで生成します`);
      continue;
    }
    parts.push({ inlineData: { mimeType: 'image/png', data: readFileSync(refFile).toString('base64') } });
  }
  parts.push({ text: `${STYLE}\n\n${cut.styleMatch ? STYLE_MATCH : ''}${cut.prompt}` });

  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'], temperature: 1.0 },
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`  [${cut.no}] APIエラー ${res.status} (試行${attempt + 1})`);
      if (attempt === 0) { await new Promise(r => setTimeout(r, 3000)); continue; }
      return false;
    }
    const data = await res.json();
    const respParts = data.candidates?.[0]?.content?.parts ?? [];
    const img = respParts.find(p => p.inlineData);
    if (!img) {
      console.error(`  [${cut.no}] 画像が返りませんでした (試行${attempt + 1})`);
      if (attempt === 0) continue;
      return false;
    }
    writeFileSync(outPath(cut), Buffer.from(img.inlineData.data, 'base64'));
    return true;
  }
  return false;
}

mkdirSync(OUT_DIR, { recursive: true });
let ok = 0, ng = 0, skip = 0;
for (const cut of CUTS) {
  if (!selected(cut)) continue;
  if (!force && existsSync(outPath(cut))) {
    console.log(`[${cut.no}] ${cut.name} — 既存のためスキップ（作り直しは --force）`);
    skip++;
    continue;
  }
  console.log(`[${cut.no}] ${cut.name} を生成中...`);
  if (await generate(cut)) { console.log(`  → 保存: ${outPath(cut)}`); ok++; }
  else ng++;
}
console.log(`\n完了: 成功 ${ok} / 失敗 ${ng} / スキップ ${skip}`);
if (ng > 0) process.exit(1);
