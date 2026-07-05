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
//   GET  /api/publish          … YouTube公開情報（採用値・実測チャプター・完成プレビュー）
//   POST /api/publish-draft    … Gemini でタイトル/概要欄/固定コメントの叩き台を生成（保存しない）
//   GET  /file?p=<プレフィックスパス> … 素材ファイルをストリーム返却
//
// 注意: ELEVENLABS_API_KEY / GEMINI_API_KEY の値はログ・レスポンスに一切出力しない。

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
// 通常は3555。環境変数 STUDIO_PORT で上書き可（検証用に別ポートで並行起動するため）
const PORT = Number(process.env.STUDIO_PORT) || 3555;

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

// Gemini APIキー: 環境変数 → .env → リポジトリ直下の .gemini_api_key ファイル の順（画像生成スクリプトと同じ探索順）
function geminiApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (ENV.GEMINI_API_KEY) return ENV.GEMINI_API_KEY;
  const keyFile = join(REPO, '.gemini_api_key');
  if (existsSync(keyFile)) return readFileSync(keyFile, 'utf8').trim();
  return '';
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

// ---- YouTube 公開情報 ------------------------------------------------------

// 出力フォルダの chapters.json（ビルド時に build スクリプトが書き出した実測値）を読む。無ければ null。
function loadChapters() {
  const P = currentPaths();
  const file = join(P.OUT, 'chapters.json');
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

// 概要欄テンプレの {{chapters}} を実測チャプター行に置換して完成文を返す。
// chapters が無い場合は案内文に置換する。
function renderDescription(template, chapters) {
  const tpl = template || '';
  let block;
  if (chapters && Array.isArray(chapters.chapters) && chapters.chapters.length) {
    block = chapters.chapters.map(c => `${c.time} ${c.title}`).join('\n');
  } else {
    block = '（全体ビルド後に自動挿入されます）';
  }
  return tpl.replace(/\{\{chapters\}\}/g, block);
}

// コードフェンス等を剥がして最初のJSONオブジェクトを取り出す（Gemini応答の耐性処理）
function extractJson(text) {
  let s = String(text || '').trim();
  // ```json ... ``` / ``` ... ``` を除去
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  // 素のテキストに紛れた最初の { ... } を拾う
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return JSON.parse(s);
}

// Gemini でタイトル案・概要欄下書き・固定コメント案を生成（保存はしない）
async function generatePublishDraft() {
  const key = geminiApiKey();
  if (!key) { const e = new Error('.gemini_api_key が見つかりません'); e.code = 'NO_KEY'; throw e; }
  const config = loadConfig();
  const yt = config.youtube || {};

  // 入力コンテキスト: エピソードtitle・全ブロックのsubtitleText・既存タイトル案
  const blocksText = (config.blocks || [])
    .map(b => `【ブロック${b.id}】${b.subtitleText || ''}`)
    .join('\n');
  const existingTitles = (yt.titleCandidates || []).map((t, i) => `${i + 1}. ${t}`).join('\n');

  const prompt = `あなたはYouTube動画の公開情報（メタデータ）を作るアシスタントです。
以下は歌舞伎の演目解説動画「${config.episode.title}」のナレーション全文です。この内容をもとに、YouTube向けの公開情報の叩き台を作ってください。

# ナレーション本文（ブロックごと）
${blocksText}

# 既存のタイトル案（参考・踏襲してよい）
${existingTitles}

# 要件
- タイトル案は3つ。日本語。検索性を重視し「曽根崎心中」「歌舞伎」「国宝」「近松門左衛門」などのキーワードを自然に含める。シリーズ名「【超訳！歌舞伎ナビ】」を頭に付ける
- 概要欄（description）は本文の要約＋見どころ。冒頭の1〜2文だけナビゲーター「けらのすけ」の口調（語尾「〜だよ」「〜だね」、明るく親しみやすい）で書き、それ以降は落ち着いた通常の説明文にする。チャプター一覧や公演告知は含めなくてよい（別テンプレで挿入するため）
- 固定コメント（pinnedComment）は視聴者への一言。1〜3文程度、けらのすけの口調でよい
- 出力は必ず次のJSON形式のみ（前後に説明文やコードフェンスを付けない）:
{"titles":["案1","案2","案3"],"description":"概要欄本文","pinnedComment":"固定コメント"}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4000,
      responseMimeType: 'application/json',
      // 思考トークンで出力上限を食い潰してJSONが途中で切れるのを防ぐ（worker.js callGeminiVision 準拠）
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), 30000);
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timerId);
  }
  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    // レスポンス本文にキーは含まれない（URLクエリのみ）ので本文の先頭のみ通知
    throw new Error(`Gemini 生成失敗 (HTTP ${res.status}): ${bodyText.slice(0, 300)}`);
  }
  const json = await res.json();
  const textPart = json.candidates?.[0]?.content?.parts?.find(p => p.text);
  if (!textPart) throw new Error('Gemini応答が空でした');

  let parsed;
  try {
    parsed = extractJson(textPart.text);
  } catch {
    throw new Error('Gemini応答をJSONとして解釈できませんでした');
  }
  return {
    titles: Array.isArray(parsed.titles) ? parsed.titles.slice(0, 3) : [],
    description: typeof parsed.description === 'string' ? parsed.description : '',
    pinnedComment: typeof parsed.pinnedComment === 'string' ? parsed.pinnedComment : '',
  };
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

    // YouTube公開情報の取得（採用値・実測チャプター・完成プレビュー）
    if (req.method === 'GET' && path === '/api/publish') {
      const config = loadConfig();
      const yt = config.youtube || {};
      const chapters = loadChapters();
      return sendJSON(res, 200, {
        youtube: yt,
        chapters,
        rendered: { description: renderDescription(yt.description, chapters) },
      });
    }

    // YouTube公開情報の叩き台をGeminiで生成（保存はしない）
    if (req.method === 'POST' && path === '/api/publish-draft') {
      try {
        const result = await generatePublishDraft();
        return sendJSON(res, 200, result);
      } catch (e) {
        if (e.code === 'NO_KEY') return sendJSON(res, 501, { error: e.message });
        return sendJSON(res, 500, { error: e.message });
      }
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

// ショートカットからの二重起動は「既に起動済み」として正常終了させる
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log(`既に起動済みです: http://${HOST}:${PORT}`);
    process.exit(0);
  }
  throw e;
});

server.listen(PORT, HOST, () => {
  console.log(`歌舞伎ナビ スタジオ 起動: http://${HOST}:${PORT}`);
  console.log(`設定JSON: ${CONFIG_PATH}`);
});
