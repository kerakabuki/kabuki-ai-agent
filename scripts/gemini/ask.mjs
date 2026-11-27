#!/usr/bin/env node
// Gemini への分析依頼と結果回収（映像・資料の分析用）
//
// Claude（司令塔）が依頼書を書き、このスクリプトで Gemini API に直接送って結果をファイルで回収する。
// ユーザーが別チャットに依頼文や結果を貼り直す必要をなくすための道具。
//
// 使い方（リポジトリルートから）:
//   node scripts/gemini/ask.mjs run --task <依頼書.md> [--media <動画/画像/PDF のパス or YouTube URL>]...
//        [--model gemini-pro-latest] [--json] [--keep-upload]
//   node scripts/gemini/ask.mjs models      … 使えるモデル一覧（映像分析向けの選定用）
//
// 記録: .gemini-handoff/runs/<日時-ID>/ に request.md・status.json・response.json（生応答）・
//       result.md（本文）・result.json（--json 指定時）。.gemini-handoff/ は丸ごと git 管理外。
//
// APIキー: 環境変数 GEMINI_API_KEY → リポジトリ直下 .gemini_api_key の順（studio/server.mjs と同じ）。
//          キーはヘッダーで送り、ログ・記録ファイルには一切書かない。
// ローカルファイルは Files API に一時アップロードし、回答後に削除する（--keep-upload で残す）。

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
const API = 'https://generativelanguage.googleapis.com';
const DEFAULT_MODEL = 'gemini-pro-latest'; // 最新の Pro を指す別名。固定したいときは --model

const MIME = {
  '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo', '.m4v': 'video/mp4',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.flac': 'audio/flac',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.pdf': 'application/pdf', '.txt': 'text/plain', '.md': 'text/markdown',
};

function apiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  const f = path.join(REPO, '.gemini_api_key');
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8').trim();
  throw new Error('NO_KEY: GEMINI_API_KEY も .gemini_api_key も見つかりません（キーはユーザーがファイルに置く）');
}

function parseArgs(argv) {
  const out = { media: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--task') out.task = argv[++i];
    else if (a === '--media') out.media.push(argv[++i]);
    else if (a === '--model') out.model = argv[++i];
    else if (a === '--json') out.json = true;
    else if (a === '--keep-upload') out.keepUpload = true;
    else if (!out.mode) out.mode = a;
    else throw new Error(`不明な引数: ${a}`);
  }
  return out;
}

async function api(method, url, { key, body, headers = {}, raw = false } = {}) {
  const res = await fetch(url, {
    method,
    headers: { 'x-goog-api-key': key, ...(body && !raw ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body ? (raw ? body : JSON.stringify(body)) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} ${method} ${url.replace(API, '')}: ${text.slice(0, 500)}`);
  return { res, json: text ? JSON.parse(text) : {} };
}

const isYouTube = s => /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//.test(s);

async function uploadFile(key, filePath, log) {
  const stat = fs.statSync(filePath);
  const mime = MIME[path.extname(filePath).toLowerCase()];
  if (!mime) throw new Error(`MIME不明の拡張子: ${filePath}`);
  log(`アップロード開始: ${path.basename(filePath)} (${(stat.size / 1e6).toFixed(1)} MB)`);
  // 表示名は ASCII に限る（日本語ファイル名をヘッダーに載せないため）
  const start = await api('POST', `${API}/upload/v1beta/files`, {
    key,
    body: { file: { display_name: `upload-${crypto.randomBytes(4).toString('hex')}${path.extname(filePath)}` } },
    headers: {
      'X-Goog-Upload-Protocol': 'resumable', 'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(stat.size), 'X-Goog-Upload-Header-Content-Type': mime,
    },
  });
  const uploadUrl = start.res.headers.get('x-goog-upload-url');
  if (!uploadUrl) throw new Error('アップロードURLが返りませんでした');
  const done = await api('POST', uploadUrl, {
    key, raw: true, body: fs.readFileSync(filePath),
    headers: { 'Content-Length': String(stat.size), 'X-Goog-Upload-Offset': '0', 'X-Goog-Upload-Command': 'upload, finalize' },
  });
  let file = done.json.file;
  // 動画はサーバ側の処理が終わる（ACTIVE）まで待つ
  for (let i = 0; file.state === 'PROCESSING' && i < 120; i++) {
    await new Promise(r => setTimeout(r, 5000));
    file = (await api('GET', `${API}/v1beta/${file.name}`, { key })).json;
  }
  if (file.state !== 'ACTIVE') throw new Error(`ファイル処理が完了しません: state=${file.state}`);
  log(`アップロード完了: ${file.name}`);
  return { name: file.name, uri: file.uri, mimeType: file.mimeType || mime, source: filePath };
}

function extractJson(text) {
  const t = text.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  try { return JSON.parse(t); } catch { /* 下で最初の {...} / [...] を探す */ }
  const m = t.match(/[[{][\s\S]*[\]}]/);
  if (!m) throw new Error('JSONが見つかりません');
  return JSON.parse(m[0]);
}

async function run(opts) {
  if (!opts.task) throw new Error('USAGE: run --task <依頼書.md> [--media <path|YouTube URL>]...');
  const key = apiKey();
  const model = opts.model || DEFAULT_MODEL;
  const taskPath = path.resolve(opts.task);
  const prompt = fs.readFileSync(taskPath, 'utf8');

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runDir = path.join(REPO, '.gemini-handoff', 'runs', `${stamp}-${crypto.randomBytes(4).toString('hex')}`);
  fs.mkdirSync(runDir, { recursive: true });
  const ignore = path.join(REPO, '.gemini-handoff', '.gitignore');
  if (!fs.existsSync(ignore)) fs.writeFileSync(ignore, '*\n');
  fs.copyFileSync(taskPath, path.join(runDir, 'request.md'));

  const logLines = [];
  const log = s => { const line = `[${new Date().toISOString()}] ${s}`; logLines.push(line); console.error(line); };
  const status = { model, task: taskPath, media: opts.media, startedAt: new Date().toISOString(), state: 'running' };
  const saveStatus = () => fs.writeFileSync(path.join(runDir, 'status.json'), JSON.stringify(status, null, 2));
  saveStatus();
  console.log(`RUN_DIR=${runDir}`);

  const uploaded = [];
  try {
    const parts = [];
    for (const m of opts.media) {
      if (isYouTube(m)) parts.push({ file_data: { file_uri: m } });
      else {
        const f = await uploadFile(key, path.resolve(m), log);
        uploaded.push(f);
        parts.push({ file_data: { file_uri: f.uri, mime_type: f.mimeType } });
      }
    }
    parts.push({ text: prompt });

    const body = {
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature: 0.2, ...(opts.json ? { responseMimeType: 'application/json' } : {}) },
    };
    log(`生成開始: ${model}`);
    const { json } = await api('POST', `${API}/v1beta/models/${model}:generateContent`, { key, body });
    fs.writeFileSync(path.join(runDir, 'response.json'), JSON.stringify(json, null, 2));
    const text = (json.candidates?.[0]?.content?.parts || []).filter(p => p.text && !p.thought).map(p => p.text).join('');
    if (!text) throw new Error(`応答が空です: finishReason=${json.candidates?.[0]?.finishReason} ${JSON.stringify(json.promptFeedback || {})}`);
    fs.writeFileSync(path.join(runDir, 'result.md'), text);
    if (opts.json) fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify(extractJson(text), null, 2));
    status.state = 'done';
    status.usage = json.usageMetadata;
    log('完了');
  } catch (e) {
    status.state = 'failed';
    status.error = String(e.message || e);
    log(`失敗: ${status.error}`);
    process.exitCode = 1;
  } finally {
    if (!opts.keepUpload) {
      for (const f of uploaded) {
        try { await api('DELETE', `${API}/v1beta/${f.name}`, { key }); log(`一時ファイル削除: ${f.name}`); }
        catch (e) { log(`一時ファイル削除に失敗（48時間で自動消去）: ${f.name}`); }
      }
    }
    status.uploads = uploaded.map(f => ({ name: f.name, source: f.source, kept: !!opts.keepUpload }));
    status.finishedAt = new Date().toISOString();
    saveStatus();
    fs.writeFileSync(path.join(runDir, 'log.txt'), logLines.join('\n') + '\n');
  }
}

async function models() {
  const key = apiKey();
  const { json } = await api('GET', `${API}/v1beta/models?pageSize=200`, { key });
  for (const m of json.models || []) {
    if ((m.supportedGenerationMethods || []).includes('generateContent')) console.log(`${m.name.replace('models/', '')}\t${m.inputTokenLimit}\t${m.displayName}`);
  }
}

const opts = parseArgs(process.argv.slice(2));
const main = opts.mode === 'run' ? run : opts.mode === 'models' ? models : null;
if (!main) { console.error('USAGE: node scripts/gemini/ask.mjs run --task <md> [--media <path|url>]... [--model] [--json] | models'); process.exit(2); }
main(opts).catch(e => { console.error(String(e.message || e)); process.exit(1); });
