#!/usr/bin/env node
// Claude（Claude Code を画面なしで動かす `claude -p`）へ依頼を送り、結果をファイルで受け取る道具。
// Codex や Antigravity が司令塔になったとき、原稿・レビュー・日本語の長文を Claude に頼むために使う。
//
// 使い方（リポジトリルートから）:
//   node scripts/claude/ask.mjs run --task <依頼書.md> [--model opus|sonnet|fable] [--effort low|medium|high] [--edit]
//     既定は読み取りだけ（Read・Grep・Glob と git の閲覧）。--edit を付けたときだけファイルの編集（Edit・Write）を許す。
//     どちらでも commit・push・デプロイ・外部への投稿はさせない（許可していない操作は確認なしで断られる）。
//
// 記録: .claude-handoff/runs/<日時-ID>/ に request.md・result.md（本文）・status.json（モデル・費用の目安・所要時間）。
//       .claude-handoff/ は丸ごと git 管理外。
// 使用量: ユーザーの Claude Code の契約（Pro）の枠を使う。重い作業の前は scripts/ai-models/plans.mjs で残りを確かめる。

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');

function parse(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--edit') o.edit = true;
    else if (a.startsWith('--')) o[a.slice(2)] = argv[++i];
    else o._.push(a);
  }
  return o;
}

const o = parse(process.argv.slice(2));
if (o._[0] !== 'run' || !o.task) {
  console.error('USAGE: node scripts/claude/ask.mjs run --task <依頼書.md> [--model opus|sonnet|fable] [--effort low|medium|high] [--edit]');
  process.exit(2);
}

const task = fs.readFileSync(path.resolve(o.task), 'utf8');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const runDir = path.join(REPO, '.claude-handoff', 'runs', `${stamp}-${crypto.randomBytes(4).toString('hex')}`);
fs.mkdirSync(runDir, { recursive: true });
const ign = path.join(REPO, '.claude-handoff', '.gitignore');
if (!fs.existsSync(ign)) fs.writeFileSync(ign, '*\n');
fs.writeFileSync(path.join(runDir, 'request.md'), task);

const readTools = ['Read', 'Grep', 'Glob', 'Bash(git status:*)', 'Bash(git diff:*)', 'Bash(git log:*)', 'Bash(git show:*)'];
const tools = o.edit ? [...readTools, 'Edit', 'Write'] : readTools;
const preface = [
  'これは別の司令塔（Codex または Antigravity）から Claude への依頼です。日本語で答えてください。',
  '最初に AGENTS.md と CLAUDE.md を読み、その約束に従ってください。',
  'commit・push・デプロイ・外部への投稿や送信はしないでください。依頼書の範囲だけを行い、判断が要る点は結果に書いて戻してください。',
  o.edit ? '編集してよいのは依頼書が指定したファイルだけです。' : 'ファイルは読むだけで、変更しないでください。',
  '最後の返答が結果としてそのまま記録されます。',
  '', '---', '',
].join('\n');

const args = ['-p', '--output-format', 'json', '--permission-mode', 'dontAsk', '--allowedTools', ...tools, '--no-session-persistence'];
if (o.model) args.push('--model', o.model);
if (o.effort) args.push('--effort', o.effort);

const status = { startedAt: new Date().toISOString(), model: o.model || '(既定)', effort: o.effort || '(既定)', edit: !!o.edit, state: 'running' };
const save = () => fs.writeFileSync(path.join(runDir, 'status.json'), JSON.stringify(status, null, 2));
save();
console.log('RUN_DIR=' + runDir);

const child = spawn('claude', args, { cwd: REPO, shell: process.platform === 'win32', windowsHide: true });
let out = '', err = '';
child.stdout.on('data', d => { out += d; });
child.stderr.on('data', d => { err += d; });
child.stdin.end(preface + task);
child.on('close', code => {
  status.finishedAt = new Date().toISOString();
  status.exitCode = code;
  try {
    const j = JSON.parse(out);
    fs.writeFileSync(path.join(runDir, 'result.md'), String(j.result ?? ''));
    status.state = j.is_error ? 'failed' : 'done';
    status.costUsd = j.total_cost_usd;
    status.durationMs = j.duration_ms;
    status.turns = j.num_turns;
  } catch {
    fs.writeFileSync(path.join(runDir, 'result.md'), out);
    status.state = code === 0 ? 'done' : 'failed';
  }
  if (err.trim()) status.stderr = err.trim().slice(0, 500);
  save();
  console.log(`state=${status.state} result=${path.join(runDir, 'result.md')}`);
  process.exitCode = status.state === 'done' ? 0 : 1;
});
