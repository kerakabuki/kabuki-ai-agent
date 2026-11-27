#!/usr/bin/env node
// 外部AIの契約プランと利用枠の残りを、この PC から読める範囲で一覧にする（読み取りのみ）。
//
// 使い方（リポジトリルートから）: node scripts/ai-models/plans.mjs
//
// 読み方:
//   Codex       … ~/.codex/sessions の最新の会話記録にある rate_limits（plan_type・5時間/週の使用率）
//   ElevenLabs  … /v1/user/subscription（.env の ELEVENLABS_API_KEY。キーに User 読み取り権限が必要）
//   Antigravity … 起動中のアプリの GetUserStatus（127.0.0.1 のみ。アプリが起動していなければ飛ばす）
// 読めないもの:
//   Claude Code … アプリの使用量の表示（Claude が get_usage で読む）
//   Gemini API  … 料金は Google AI Studio の「課金」画面か Google Cloud の請求画面でしか見られない
// キーやトークンは画面にも記録にも出さない。

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
const jst = d => new Date(d).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const rows = [];

function codex() {
  const base = path.join(os.homedir(), '.codex', 'sessions');
  const files = [];
  const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.jsonl')) files.push(p); } };
  walk(base);
  files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  for (const f of files.slice(0, 5)) {
    const lines = fs.readFileSync(f, 'utf8').trim().split('\n').reverse();
    for (const l of lines) {
      if (!l.includes('rate_limits')) continue;
      const j = JSON.parse(l); const rl = j.payload?.rate_limits || j.payload?.info?.rate_limits || j.rate_limits;
      if (!rl) continue;
      const w = [rl.primary, rl.secondary].filter(Boolean).map(x => `${x.window_minutes >= 10080 ? '週' : x.window_minutes / 60 + '時間'}の枠 ${Math.round(x.used_percent)}%使用（${jst(x.resets_at * 1000)}に戻る）`);
      return { plan: 'ChatGPT ' + (rl.plan_type || '?'), usage: w.join('・') + `　※${jst(fs.statSync(f).mtimeMs)}時点` };
    }
  }
  throw new Error('記録なし');
}

async function elevenlabs() {
  const env = fs.readFileSync(path.join(REPO, '.env'), 'utf8');
  const key = env.match(/^ELEVENLABS_API_KEY\s*=\s*["']?([^\r\n"']+)/m)?.[1]?.trim();
  if (!key) throw new Error('キーなし');
  const r = await fetch('https://api.elevenlabs.io/v1/user/subscription', { headers: { 'xi-api-key': key }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json();
  return { plan: `${j.tier}（${j.status}）`, usage: `文字数 ${j.character_count.toLocaleString()} / ${j.character_limit.toLocaleString()}（${Math.round(j.character_count / j.character_limit * 100)}%・${jst(j.next_character_count_reset_unix * 1000)}に戻る）` };
}

async function antigravity() {
  const d = path.join(os.homedir(), '.gemini', 'antigravity', 'daemon');
  const alive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
  const h = fs.readdirSync(d).filter(f => /^hub_\d+\.json$/.test(f)).map(f => JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'))).find(x => x.pid && alive(x.pid));
  if (!h) throw new Error('アプリが起動していない');
  const r = await fetch(`http://127.0.0.1:${h.httpPort}/exa.language_server_pb.LanguageServerService/GetUserStatus`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Connect-Protocol-Version': '1', 'X-Codeium-Csrf-Token': h.csrfToken }, body: '{}', signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const u = (await r.json()).userStatus || {};
  const q = (u.cascadeModelConfigData?.clientModelConfigs || []).map(c => c.quotaInfo).filter(Boolean);
  const min = q.length ? Math.min(...q.map(x => x.remainingFraction ?? 1)) : null;
  const reset = q.map(x => x.resetTime).filter(Boolean).sort()[0];
  return { plan: u.userTier?.description || '?', usage: min == null ? '枠の情報なし' : `モデルの枠 いちばん少ないもので ${Math.round(min * 100)}%残り${reset ? `（${jst(reset)}に戻る）` : ''}` };
}

for (const [name, fn] of [['Codex', codex], ['ElevenLabs', elevenlabs], ['Antigravity', antigravity]]) {
  try { const v = await fn(); rows.push(`- ${name}: ${v.plan} … ${v.usage}`); }
  catch (e) { rows.push(`- ${name}: 読めない（${String(e.message || e).slice(0, 40)}）`); }
}
rows.push('- Claude Code: アプリの使用量の表示で確認（Claude が get_usage で読める）');
rows.push('- Gemini API: Google AI Studio の「課金」画面で確認（この PC からは読めない）');
console.log(rows.join('\n'));
