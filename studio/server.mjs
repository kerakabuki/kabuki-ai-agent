// 歌舞伎ナビ スタジオ — ローカル制作管理サーバ（Node標準モジュールのみ・外部依存なし）
// 起動: node studio/server.mjs
// バインド: http://127.0.0.1:3555
//
// 提供API:
//   GET  /                     … studio/index.html
//   GET  /api/episode          … 設定JSON
//   PUT  /api/episode          … 設定JSON保存（.bak に1世代バックアップ）
//   GET  /api/assets           … 素材一覧（BGM/効果音/画像/音声・音声は秒数付き）
//   POST /api/tts   {blockId}  … 該当ブロックのナレーション再生成（ElevenLabs）
//   POST /api/music {prompt,seconds,filename} … BGM生成（Eleven Music）
//   POST /api/build {blocks}   … ビルド起動 → {jobId}
//   GET  /api/build/:jobId     … {running, log, exitCode}
//   GET  /file?p=<プレフィックスパス> … 素材ファイルをストリーム返却
//
// 注意: ELEVENLABS_API_KEY の値はログ・レスポンスに一切出力しない。

import http from 'node:http';
import { readFileSync, writeFileSync, copyFileSync, existsSync, createReadStream, statSync, mkdirSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile, spawn } from 'node:child_process';
import { makePaths, resolveAsset, isPathAllowed, ROOT } from './paths.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..');
const CONFIG_PATH = join(__dirname, 'episodes', 'sonezaki05.json');
const HOST = '127.0.0.1';
const PORT = 3555;

// ---- ユーティリティ --------------------------------------------------------

// .env を読む（APIキーの値はここでのみ保持し、外へ出さない）
function loadEnv(envPath) {
  const out = {};
  if (!existsSync(envPath)) return out;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = /^([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line.trim());
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}
const ENV = loadEnv(join(REPO, '.env'));
function apiKey() {
  return process.env.ELEVENLABS_API_KEY || ENV.ELEVENLABS_API_KEY || '';
}

function loadConfig() {
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
}
function currentPaths() {
  return makePaths(loadConfig().episode.epDir);
}

// ffprobe で秒数を取得（失敗時は null）
function probeDur(file) {
  return new Promise((resolve) => {
    execFile('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], (err, stdout) => {
      if (err) return resolve(null);
      const d = parseFloat(String(stdout).trim());
      resolve(Number.isFinite(d) ? d : null);
    });
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
};
function mimeFor(p) {
  return MIME[extname(p).toLowerCase()] || 'application/octet-stream';
}

function sendJSON(res, code, obj) {
  const body = Buffer.from(JSON.stringify(obj), 'utf8');
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': body.length });
  res.end(body);
}
function sendText(res, code, text) {
  const body = Buffer.from(text, 'utf8');
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Length': body.length });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

// フォルダ内のファイル名一覧（拡張子フィルタ・ソート）
async function listDir(dir, exts) {
  if (!existsSync(dir)) return [];
  const names = await readdir(dir);
  return names
    .filter(n => !exts || exts.includes(extname(n).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'ja'));
}

// ---- ビルドジョブ管理 ------------------------------------------------------
const jobs = new Map(); // jobId → { running, log, exitCode }
let jobSeq = 0;

function startBuild(blocks) {
  const jobId = String(++jobSeq);
  const job = { running: true, log: '', exitCode: null };
  jobs.set(jobId, job);

  const args = [join(__dirname, '..', 'scripts', 'build_sonezaki_video.mjs'), '--config', CONFIG_PATH];
  if (blocks) { args.push('--blocks', blocks); }

  const child = spawn(process.execPath, args, { cwd: REPO });
  const onData = (d) => { job.log += d.toString('utf8'); };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);
  child.on('error', (e) => { job.log += `\n[起動エラー] ${e.message}\n`; });
  child.on('close', (code) => { job.running = false; job.exitCode = code; });
  return jobId;
}

// ---- ElevenLabs 呼び出し（TTS / Music） -----------------------------------

async function generateTTS(blockId) {
  const key = apiKey();
  if (!key) throw new Error('ELEVENLABS_API_KEY が見つかりません（.env を確認）');
  const config = loadConfig();
  const P = makePaths(config.episode.epDir);
  const block = config.blocks.find(b => b.id === blockId);
  if (!block) throw new Error(`ブロック${blockId} が設定に存在しません`);

  const voiceId = config.episode.voiceId;
  const model = config.episode.ttsModel || 'eleven_v3';
  const fmt = config.episode.ttsOutputFormat || 'mp3_44100_128';
  const text = `${block.styleTag || ''} ${block.ttsText || ''}`.trim();

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${fmt}`,
    {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model_id: model }),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ElevenLabs TTS 失敗 (HTTP ${res.status}): ${body.slice(0, 300)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());

  // 出力先: voice: プレフィックスを解決
  const outPath = resolveAsset(block.audio, P);
  mkdirSync(dirname(outPath), { recursive: true });
  // 既存を .bak.mp3 に退避してから上書き
  if (existsSync(outPath)) {
    const bak = outPath.replace(/\.mp3$/i, '.bak.mp3');
    copyFileSync(outPath, bak);
  }
  writeFileSync(outPath, buf);
  const seconds = await probeDur(outPath);
  return { blockId, seconds, bytes: buf.length };
}

async function generateMusic({ prompt, seconds, filename }) {
  const key = apiKey();
  if (!key) throw new Error('ELEVENLABS_API_KEY が見つかりません（.env を確認）');
  if (!prompt || !seconds || !filename) throw new Error('prompt / seconds / filename は必須です');
  const config = loadConfig();
  const P = makePaths(config.episode.epDir);

  const lengthMs = Math.round(Number(seconds) * 1000);
  const res = await fetch('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128', {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, music_length_ms: lengthMs }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Eleven Music 失敗 (HTTP ${res.status}): ${body.slice(0, 300)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());

  // エピソードのBGMフォルダに保存
  const safeName = basename(filename).replace(/[\\/:*?"<>|]/g, '_');
  const finalName = /\.mp3$/i.test(safeName) ? safeName : `${safeName}.mp3`;
  const outPath = join(P.BGM, finalName);
  mkdirSync(P.BGM, { recursive: true });
  writeFileSync(outPath, buf);
  const dur = await probeDur(outPath);
  return { filename: finalName, seconds: dur, bytes: buf.length };
}

// ---- ルーティング ----------------------------------------------------------

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${HOST}:${PORT}`);
    const path = decodeURIComponent(url.pathname);

    // 静的: トップページ
    if (req.method === 'GET' && path === '/') {
      const html = readFileSync(join(__dirname, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    // 設定JSON 取得
    if (req.method === 'GET' && path === '/api/episode') {
      return sendJSON(res, 200, loadConfig());
    }

    // 設定JSON 保存（.bak バックアップ）
    if (req.method === 'PUT' && path === '/api/episode') {
      const body = await readBody(req);
      if (!body || !body.episode || !Array.isArray(body.blocks)) {
        return sendJSON(res, 400, { error: '設定JSONの形式が不正です' });
      }
      if (existsSync(CONFIG_PATH)) copyFileSync(CONFIG_PATH, CONFIG_PATH + '.bak');
      writeFileSync(CONFIG_PATH, JSON.stringify(body, null, 2) + '\n', 'utf8');
      return sendJSON(res, 200, { ok: true });
    }

    // 素材一覧
    if (req.method === 'GET' && path === '/api/assets') {
      const P = currentPaths();
      const [bgmCommon, bgmEp, se, gen, photo, voiceNames] = await Promise.all([
        listDir(join(P.COMMON, 'BGM'), ['.mp3']),
        listDir(P.BGM, ['.mp3']),
        listDir(join(P.COMMON, '効果音'), ['.mp3']),
        listDir(P.GEN, ['.png', '.jpg', '.jpeg']),
        listDir(P.PHOTO, ['.jpg', '.jpeg', '.png']),
        listDir(P.VOICE, ['.mp3']),
      ]);
      // 音声は秒数付き
      const voices = [];
      for (const n of voiceNames) {
        const d = await probeDur(join(P.VOICE, n));
        voices.push({ name: n, path: `voice:${n}`, seconds: d });
      }
      return sendJSON(res, 200, {
        bgm: [
          ...bgmCommon.map(n => ({ name: n, path: `common:BGM/${n}` })),
          ...bgmEp.map(n => ({ name: n, path: `bgm:${n}` })),
        ],
        se: se.map(n => ({ name: n, path: `common:効果音/${n}` })),
        images: {
          gen: gen.map(n => ({ name: n, path: `gen:${n}` })),
          photo: photo.map(n => ({ name: n, path: `photo:${n}` })),
        },
        voices,
      });
    }

    // TTS 再生成
    if (req.method === 'POST' && path === '/api/tts') {
      const body = await readBody(req);
      if (!body.blockId) return sendJSON(res, 400, { error: 'blockId が必要です' });
      try {
        const result = await generateTTS(String(body.blockId));
        return sendJSON(res, 200, result);
      } catch (e) {
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // 音楽生成
    if (req.method === 'POST' && path === '/api/music') {
      const body = await readBody(req);
      try {
        const result = await generateMusic(body);
        return sendJSON(res, 200, result);
      } catch (e) {
        return sendJSON(res, 500, { error: e.message });
      }
    }

    // ビルド起動
    if (req.method === 'POST' && path === '/api/build') {
      const body = await readBody(req);
      const blocks = body && body.blocks ? String(body.blocks) : null;
      const jobId = startBuild(blocks);
      return sendJSON(res, 200, { jobId });
    }

    // ビルド状態ポーリング
    if (req.method === 'GET' && path.startsWith('/api/build/')) {
      const jobId = path.slice('/api/build/'.length);
      const job = jobs.get(jobId);
      if (!job) return sendJSON(res, 404, { error: 'ジョブが見つかりません' });
      return sendJSON(res, 200, { running: job.running, log: job.log, exitCode: job.exitCode });
    }

    // 素材ファイル配信
    if (req.method === 'GET' && path === '/file') {
      const p = url.searchParams.get('p');
      if (!p) return sendText(res, 400, 'p パラメータが必要です');
      const P = currentPaths();
      const abs = resolveAsset(p, P);
      // パストラバーサル対策: 素材ルートまたはリポジトリ配下のみ許可
      if (!isPathAllowed(abs, [ROOT, REPO])) {
        return sendText(res, 403, '許可されていないパスです');
      }
      if (!existsSync(abs) || !statSync(abs).isFile()) {
        return sendText(res, 404, 'ファイルが見つかりません');
      }
      const size = statSync(abs).size;
      res.writeHead(200, {
        'Content-Type': mimeFor(abs),
        'Content-Length': size,
        'Cache-Control': 'no-cache',
      });
      return createReadStream(abs).pipe(res);
    }

    return sendText(res, 404, 'Not Found');
  } catch (e) {
    // エラー内容にAPIキーは含めない（元より扱っていない）
    return sendText(res, 500, `サーバエラー: ${e.message}`);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`歌舞伎ナビ スタジオ 起動: http://${HOST}:${PORT}`);
  console.log(`設定JSON: ${CONFIG_PATH}`);
});
