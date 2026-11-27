#!/usr/bin/env node
// 外部AI（Codex・Gemini API・Antigravity）のモデル一覧を調べ、前回から新しいモデルが増えていたら知らせる。
//
// 使い方（リポジトリルートから）:
//   node scripts/ai-models/check.mjs           … 差分があれば表示（記録は更新しない）
//   node scripts/ai-models/check.mjs --accept  … 今の一覧を「確認済み」として記録する（再設定を決めたあとに実行）
//   node scripts/ai-models/check.mjs --hook    … Claude Code の SessionStart フック用。新しいモデルがあるときだけ短く出力する
//
// 記録: scripts/ai-models/known.json（モデル名の一覧だけ。秘密値は入れない）
// 調べ方:
//   Codex       … ~/.codex/models_cache.json の slug
//   Gemini API  … models 一覧（scripts/gemini/ask.mjs と同じキー。キーが無ければ飛ばす）
//   Antigravity … アプリ本体に入っているモデル名（gemini-*/claude-*）。アプリ未導入なら飛ばす
// 失敗した調べ方は飛ばし、ほかの結果だけで判定する（フックでセッション開始を止めないため）。

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
const KNOWN = path.join(REPO, 'scripts', 'ai-models', 'known.json');
const mode = process.argv.includes('--accept') ? 'accept' : process.argv.includes('--hook') ? 'hook' : 'check';

function codex() {
  const f = path.join(os.homedir(), '.codex', 'models_cache.json');
  const s = fs.readFileSync(f, 'utf8');
  return [...new Set([...s.matchAll(/"slug"\s*:\s*"([^"]+)"/g)].map(m => m[1]))].sort();
}

async function gemini() {
  let key = process.env.GEMINI_API_KEY;
  const kf = path.join(REPO, '.gemini_api_key');
  if (!key && fs.existsSync(kf)) key = fs.readFileSync(kf, 'utf8').trim();
  if (!key) throw new Error('キーなし');
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': key }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json();
  return (j.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map(m => m.name.replace('models/', '')).filter(n => /^gemini-/.test(n)).sort();
}

function antigravity() {
  const exe = path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local'), 'Programs', 'antigravity', 'resources', 'bin', 'language_server.exe');
  const buf = fs.readFileSync(exe);
  const names = new Set();
  // 名前の後ろに別の文字列がくっついていることがあるので、既知の段階名（low/medium/high/xhigh/max）で区切る
  const re = /(gemini-\d+(?:\.\d+)?-[a-z]+(?:-(?:low|medium|high|xhigh|max))?|claude-(?:opus|sonnet|haiku)-\d+-\d+(?:-(?:low|medium|high|max))?)/g;
  const text = buf.toString('latin1');
  // 次の名前と切れ目なく並んでいる場合（…-progemini など）は、後ろにくっついた gemini/claude を外す
  for (const m of text.matchAll(re)) names.add(m[1].replace(/(?<=.)(gemini|claude)$/, ''));
  return [...names].filter(n => !/image|embedding|tts|live/.test(n)).sort();
}

const sources = { codex, gemini, antigravity };
const now = {}; const skipped = [];
for (const [k, fn] of Object.entries(sources)) {
  try { now[k] = await fn(); } catch (e) { skipped.push(`${k}（${String(e.message || e).slice(0, 40)}）`); }
}

const known = fs.existsSync(KNOWN) ? JSON.parse(fs.readFileSync(KNOWN, 'utf8')) : { sources: {} };
const added = {};
for (const [k, list] of Object.entries(now)) {
  const before = new Set(known.sources?.[k] || []);
  if (!known.sources?.[k]) continue; // 初回は差分を出さない
  const diff = list.filter(n => !before.has(n));
  if (diff.length) added[k] = diff;
}

if (mode === 'accept') {
  const next = { checkedAt: new Date().toISOString(), sources: { ...(known.sources || {}), ...now } };
  fs.writeFileSync(KNOWN, JSON.stringify(next, null, 2) + '\n');
  console.log('記録しました: ' + Object.entries(now).map(([k, v]) => `${k} ${v.length}件`).join('・') + (skipped.length ? `（飛ばした: ${skipped.join('、')}）` : ''));
} else {
  const label = { codex: 'Codex', gemini: 'Gemini API', antigravity: 'Antigravity' };
  const lines = Object.entries(added).map(([k, v]) => `- ${label[k]}: ${v.join(', ')}`);
  if (mode === 'hook') {
    if (lines.length) {
      console.log('【新しいAIモデル】前回の確認から次のモデルが増えています。ユーザーに伝え、依頼に使うモデルの再設定（codex-build の --kind の既定・scripts/gemini/ask.mjs・scripts/antigravity/agent.mjs の既定）を提案すること。決まったら `node scripts/ai-models/check.mjs --accept`。');
      console.log(lines.join('\n'));
    }
  } else {
    console.log(lines.length ? '新しいモデル:\n' + lines.join('\n') : '新しいモデルはありません');
    if (skipped.length) console.log('飛ばした調べ方: ' + skipped.join('、'));
    if (!fs.existsSync(KNOWN)) console.log('まだ記録がありません。--accept で今の一覧を記録してください。');
  }
}
