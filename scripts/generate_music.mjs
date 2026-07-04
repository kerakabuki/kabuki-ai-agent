// ElevenLabs Eleven Music APIでBGMを生成する
// 使い方: node scripts/generate_music.mjs --prompt "曲の指示文" --length 60 --out "D:\...\BGM\道行.mp3"
// APIキーは .env の ELEVENLABS_API_KEY から読む（音声生成と共通）
// 注意: 音楽はTTSよりクレジット消費が大きい。レスポンスヘッダの消費量を必ず確認すること

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

const args = parseArgs(process.argv.slice(2));
if (!args.prompt || !args.length || !args.out) {
  console.error('必須引数不足: --prompt <指示文> --length <秒数> --out <出力mp3> [--seed <数値>]');
  process.exit(1);
}

const env = loadEnv('.env');
const apiKey = process.env.ELEVENLABS_API_KEY || env.ELEVENLABS_API_KEY;
if (!apiKey) { console.error('ELEVENLABS_API_KEY が見つかりません（.env を確認）'); process.exit(1); }

const lengthMs = Math.round(Number(args.length) * 1000);
const body = { prompt: args.prompt, music_length_ms: lengthMs };
if (args.seed) body.seed = Number(args.seed);

console.log(`生成中: ${args.length}秒 / プロンプト: ${args.prompt.slice(0, 80)}...`);

const res = await fetch('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128', {
  method: 'POST',
  headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// クレジット消費をヘッダから拾う（ヘッダ名はAPI都合で変わりうるので cost/credit を含むものを全部出す)
for (const [k, v] of res.headers.entries()) {
  if (/cost|credit|character/i.test(k)) console.log(`ヘッダ ${k}: ${v}`);
}

if (!res.ok) {
  console.error(`失敗 (HTTP ${res.status}): ${(await res.text()).slice(0, 500)}`);
  process.exit(1);
}

const buf = Buffer.from(await res.arrayBuffer());
fs.mkdirSync(path.dirname(args.out), { recursive: true });
fs.writeFileSync(args.out, buf);
console.log(`OK → ${args.out}（${(buf.length / 1024).toFixed(0)}KB）`);
