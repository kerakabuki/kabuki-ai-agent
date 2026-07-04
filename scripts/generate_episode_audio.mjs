// 超訳！歌舞伎ナビ 各エピソードのナレーション音声をElevenLabs APIで一括生成する
// 使い方: node scripts/generate_episode_audio.mjs --script docs/youtube-script-sonezaki-tts.md --voice xOKkuQfZt5N7XfbFdn9W --out "D:\...\音声"
// APIキーは .env の ELEVENLABS_API_KEY から読む（gitignore対象。チャット等に貼らないこと）
// TTS用マークダウンの規約: "## ブロック{n}" 見出し + 直後の ```...``` コードフェンス内にタグ付きテキスト
// 出力ファイル名は見出しの{n}をそのまま使う（例: ブロック1.mp3, ブロック6-2.mp3, ブロック8.mp3）

import fs from 'fs';
import path from 'path';

function loadEnv(envPath) {
  const out = {};
  if (!fs.existsSync(envPath)) return out;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = /^([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line.trim());
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) { out[argv[i].slice(2)] = argv[i + 1]; i++; }
  }
  return out;
}

function parseBlocks(markdown) {
  const blocks = [];
  const re = /^##\s*ブロック([\d-]+)[^\n]*\n+```\n([\s\S]*?)\n```/gm;
  let m;
  while ((m = re.exec(markdown))) {
    blocks.push({ id: m[1], text: m[2].trim() });
  }
  return blocks;
}

const args = parseArgs(process.argv.slice(2));
if (!args.script || !args.voice || !args.out) {
  console.error('必須引数不足: --script <md> --voice <voice_id> --out <output_dir> [--model eleven_v3] [--only 1,3,6-2]');
  process.exit(1);
}

const env = loadEnv('.env');
const apiKey = process.env.ELEVENLABS_API_KEY || env.ELEVENLABS_API_KEY;
if (!apiKey) { console.error('ELEVENLABS_API_KEY が見つかりません（.env を確認）'); process.exit(1); }

const modelId = args.model || 'eleven_v3';
const markdown = fs.readFileSync(args.script, 'utf8');
let blocks = parseBlocks(markdown);
if (blocks.length === 0) { console.error('台本からブロックを検出できませんでした（見出し形式を確認）'); process.exit(1); }
if (args.only) {
  const wanted = new Set(args.only.split(','));
  blocks = blocks.filter(b => wanted.has(b.id));
}

fs.mkdirSync(args.out, { recursive: true });
console.log(`対象ブロック: ${blocks.map(b => b.id).join(', ')}（計${blocks.length}件） / voice=${args.voice} model=${modelId}`);

let ok = 0, fail = 0;
for (const b of blocks) {
  const outPath = path.join(args.out, `ブロック${b.id}.mp3`);
  process.stdout.write(`ブロック${b.id} 生成中（${b.text.length}文字）... `);
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${args.voice}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: b.text, model_id: modelId }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.log(`失敗 (HTTP ${res.status}): ${body.slice(0, 300)}`);
      fail++;
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outPath, buf);
    console.log(`OK → ${outPath}（${(buf.length / 1024).toFixed(0)}KB）`);
    ok++;
  } catch (e) {
    console.log(`エラー: ${e.message}`);
    fail++;
  }
  await new Promise(r => setTimeout(r, 800)); // レート制限への配慮
}

console.log(`\n完了: 成功${ok}件 / 失敗${fail}件`);
if (fail > 0) process.exit(1);
