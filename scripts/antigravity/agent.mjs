#!/usr/bin/env node
// Antigravity（Google のエージェントIDE）へ依頼を送る道具
//
// 起動中の Antigravity アプリの agentapi に、Claude が書いた依頼を渡す。ユーザーが別画面に貼り直さなくて済むようにする。
// 結果は依頼の中で「このファイルに書く」と指定し、そのファイルを Claude が読む（agentapi は本文を返さないため）。
//
// 使い方（リポジトリルートから・Antigravity アプリを起動しておく）:
//   node scripts/antigravity/agent.mjs new --task <依頼書.md> [--model flash|pro|flash_lite] [--title 題]
//   node scripts/antigravity/agent.mjs send --to <会話ID> --task <依頼書.md>
//   node scripts/antigravity/agent.mjs status <会話ID>
//
// 接続先: ~/.gemini/antigravity/daemon/hub_*.json のうち、生きているプロセスのもの（127.0.0.1 のみ）。
// 接続用トークンは環境変数で子プロセスに渡すだけで、表示・記録しない。

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const EXE = path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local'), 'Programs', 'antigravity', 'resources', 'bin', 'language_server.exe');
const DAEMON = path.join(os.homedir(), '.gemini', 'antigravity', 'daemon');

function alive(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } }

function hub() {
  const files = fs.readdirSync(DAEMON).filter(f => /^hub_\d+\.json$/.test(f))
    .map(f => ({ f, t: fs.statSync(path.join(DAEMON, f)).mtimeMs })).sort((a, b) => b.t - a.t);
  for (const { f } of files) {
    const h = JSON.parse(fs.readFileSync(path.join(DAEMON, f), 'utf8'));
    if (h.pid && alive(h.pid) && h.httpPort && h.csrfToken) return h;
  }
  throw new Error('ANTIGRAVITY_NOT_RUNNING: Antigravity アプリを起動してから再実行してください');
}

function parse(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) o[a.slice(2)] = argv[++i]; else o._.push(a);
  }
  return o;
}

function agentapi(args) {
  const h = hub();
  const r = spawnSync(EXE, ['agentapi', ...args], {
    env: { ...process.env, ANTIGRAVITY_LS_ADDRESS: `127.0.0.1:${h.httpPort}`, ANTIGRAVITY_CSRF_TOKEN: h.csrfToken },
    encoding: 'utf8', timeout: 120000, windowsHide: true,
  });
  if (r.error) throw r.error;
  process.stdout.write(r.stdout || '');
  if (r.stderr) process.stderr.write(r.stderr);
  process.exitCode = r.status ?? 1;
}

const o = parse(process.argv.slice(2));
const mode = o._[0];
const text = () => { if (!o.task) throw new Error('--task <依頼書.md> が必要です'); return fs.readFileSync(path.resolve(o.task), 'utf8'); };
try {
  if (mode === 'new') agentapi(['new-conversation', `--model=${o.model || 'flash'}`, ...(o.title ? [`--title=${o.title}`] : []), text()]);
  else if (mode === 'send') agentapi(['send-message', ...(o.title ? [`--title=${o.title}`] : []), o.to, text()]);
  else if (mode === 'status') agentapi(['get-conversation-metadata', o._[1]]);
  else { console.error('USAGE: new --task <md> [--model] [--title] | send --to <id> --task <md> | status <id>'); process.exitCode = 2; }
} catch (e) { console.error(String(e.message || e)); process.exitCode = 1; }
