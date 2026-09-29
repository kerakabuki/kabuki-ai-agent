import { requireGroupRole } from './auth.js';
import { readJSON, hash, csvCell } from './reception.js';
import { surveyPage, surveyAdminPage, surveyLoginPage } from './survey_page.js';
import { SURVEY_2026 } from './survey_2026.js';

export const SURVEY_PATH = '/kerakabuki/survey';
export const SURVEY_API = '/api/kerakabuki/survey';
// 翌年以降は定義ファイルを足してここへ登録するだけで済むようにする。
const SURVEYS = { [SURVEY_2026.id]: SURVEY_2026 };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const headers = {
  'Cache-Control': 'no-store, private', 'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow',
  'X-Frame-Options': 'DENY',
};
const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
});
const html = (value, status = 200) => new Response(value, {
  status, headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' },
});
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const bind = (db, sql, args = []) => db.prepare(sql).bind(...args);
const blank = v => v === undefined || v === null || v === '';
const questionsOf = survey => survey.sections.flatMap(s => s.questions);
const parse = text => { try { const v = JSON.parse(text); return v && typeof v === 'object' && !Array.isArray(v) ? v : null; } catch { return null; } };
// 回答日時は担当者が読みやすい日本時間で出す。
const jst = iso => { const t = Date.parse(iso); return Number.isNaN(t) ? '' : new Date(t + 9 * 3600000).toISOString().slice(0, 16).replace('T', ' '); };

export const surveyOpen = (survey, now = Date.now()) => now <= Date.parse(survey.closesAt);
// 動作確認用のローカル環境に限り、締切の判定に使う現在時刻を差し替える。
// 本番は RECEPTION_PREVIEW を設定しないので常に実際の時刻で判定する。
const clock = env => env.RECEPTION_PREVIEW === '1' && env.SURVEY_NOW ? Date.parse(env.SURVEY_NOW) : Date.now();

export function validateAnswers(survey, answers) {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) throw fail('回答内容をご確認ください。');
  const questions = questionsOf(survey);
  const picked = {};
  const check = q => {
    const value = answers[q.id];
    const bad = () => fail(`「${q.short}」の回答をご確認ください。`);
    const values = (q.options || []).map(([v]) => v);
    if (q.type === 'single') {
      if (blank(value)) return;
      if (typeof value !== 'string' || !values.includes(value)) throw bad();
      picked[q.id] = value;
    } else if (q.type === 'multi') {
      if (blank(value)) return;
      if (!Array.isArray(value) || value.some(v => typeof v !== 'string' || !values.includes(v)) || new Set(value).size !== value.length) throw bad();
      if (!value.length) return;
      if (q.exclusive && value.includes(q.exclusive) && value.length > 1) throw bad();
      picked[q.id] = values.filter(v => value.includes(v));
      // 「その他」を選んだときだけ自由記入を残す。選んでいなければ捨てる。
      if (q.other && value.includes('other')) {
        const other = answers[q.id + '_other'];
        if (blank(other)) return;
        if (typeof other !== 'string') throw fail(`「${q.short}（その他）」の記入をご確認ください。`);
        const s = other.normalize('NFC').trim();
        if (s.length > 100 || /[\u0000-\u001f\u007f]/.test(s)) throw fail(`「${q.short}（その他）」は100文字以内でお書きください。`);
        if (s) picked[q.id + '_other'] = s;
      }
    } else if (q.type === 'text') {
      if (blank(value)) return;
      if (typeof value !== 'string') throw bad();
      const s = value.normalize('NFC').replace(/\r\n?/g, '\n').trim();
      if (s.length > q.max) throw fail(`「${q.short}」は${q.max}文字以内でお書きください。`);
      if (CONTROL.test(s)) throw bad();
      if (s) picked[q.id] = s;
    }
  };
  // 依存先の回答が決まってから依存する設問を判定する（定義順に依存しない）。
  questions.filter(q => !q.dependsOn).forEach(check);
  questions.filter(q => q.dependsOn && !blank(picked[q.dependsOn]) && (q.dependsValue === undefined || picked[q.dependsOn] === q.dependsValue)).forEach(check);
  for (const q of questions) if (q.required && blank(picked[q.id])) throw fail(`「${q.label}」にお答えください。`);
  // 定義順に並べ直し、保存内容とハッシュを入力の並び順に左右されないようにする。
  const result = {};
  for (const q of questions) {
    if (q.id in picked) result[q.id] = picked[q.id];
    if (q.id + '_other' in picked) result[q.id + '_other'] = picked[q.id + '_other'];
  }
  return result;
}

export function tallySurvey(survey, rows) {
  const questions = questionsOf(survey).filter(q => (q.type === 'single' || q.type === 'multi') && (!q.dependsOn || q.dependsValue !== undefined));
  const tallies = Object.fromEntries(questions.map(q => [q.id, { answered: 0, eligible: 0, counts: Object.fromEntries(q.options.map(([v]) => [v, 0])), other: [] }]));
  let total = 0, excluded = 0, comments = 0, quotable = 0, lastAt = null;
  for (const row of rows) {
    if (Number(row.excluded) === 1) { excluded++; continue; }
    const answers = parse(row.answers);
    if (!answers) continue;
    total++;
    if (!lastAt || row.created_at > lastAt) lastAt = row.created_at;
    if (typeof answers.comment === 'string' && answers.comment) comments++;
    if (['profile', 'anonymous'].includes(answers.quote)) quotable++;
    for (const q of questions) {
      const tally = tallies[q.id];
      if (q.dependsOn && answers[q.dependsOn] !== q.dependsValue) continue;
      tally.eligible++;
      const value = answers[q.id];
      const chosen = (q.type === 'single' ? [value] : Array.isArray(value) ? value : []).filter(v => typeof v === 'string' && Object.hasOwn(tally.counts, v));
      if (!chosen.length) continue;
      tally.answered++;
      for (const v of chosen) tally.counts[v]++;
      const other = answers[q.id + '_other'];
      if (q.other && typeof other === 'string' && other) tally.other.push(other);
    }
  }
  return { total, excluded, comments, quotable, last_at: lastAt, tallies };
}

export function surveyCSV(survey, rows) {
  const questions = questionsOf(survey);
  const names = ['回答番号', '回答日時', '集計', ...questions.flatMap(q => q.other ? [q.short, `${q.short}（その他）`] : [q.short])];
  const label = (q, v) => (q.options.find(([value]) => value === v) || [v, v])[1];
  const values = [...rows].sort((a, b) => a.id - b.id).map(r => {
    const answers = parse(r.answers) || {};
    return [r.id, jst(r.created_at), Number(r.excluded) === 1 ? '除外' : '対象', ...questions.flatMap(q => {
      const v = answers[q.id];
      const cell = blank(v) ? '' : q.type === 'single' ? label(q, v) : q.type === 'multi' ? (Array.isArray(v) ? v.map(x => label(q, x)).join('、') : '') : String(v);
      return q.other ? [cell, answers[q.id + '_other'] || ''] : [cell];
    })];
  });
  return '\ufeff' + [names, ...values].map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

async function staffAccess(request, env) {
  const access = await requireGroupRole(request, env, 'kera', 'manager');
  if (!access.ok) throw fail(access.error, access.status);
  return access;
}
// migration未適用の本番で、全問答えたあとに送信だけ失敗するのを防ぐ。
async function tableReady(env) {
  if (!env.RECEPTION_DB) return false;
  try { await env.RECEPTION_DB.prepare('SELECT 1 FROM survey_responses LIMIT 1').first(); return true; } catch { return false; }
}

export async function handleSurvey(request, env) {
  const url = new URL(request.url); const path = url.pathname;
  if (!(path.startsWith(SURVEY_PATH + '/') || path.startsWith(SURVEY_API + '/'))) return null;
  try {
    const page = path.startsWith(SURVEY_PATH + '/') ? path.slice(SURVEY_PATH.length + 1).match(/^([^/]+)(\/admin)?$/) : null;
    // 画面はHEADも受ける（本文なしで同じヘッダーを返す）。
    if (page && ['GET', 'HEAD'].includes(request.method)) {
      const survey = Object.hasOwn(SURVEYS, page[1]) ? SURVEYS[page[1]] : null;
      if (!survey) return json({ error: 'この操作は利用できません。' }, 404);
      const preview = env.RECEPTION_PREVIEW === '1';
      const head = request.method === 'HEAD';
      if (!page[2]) return html(head ? null : surveyPage(survey, { open: surveyOpen(survey, clock(env)), available: await tableReady(env), preview }));
      const access = await requireGroupRole(request, env, 'kera', 'manager');
      if (!access.ok) return html(head ? null : surveyLoginPage(survey, access.status), access.status);
      return html(head ? null : surveyAdminPage(survey, { preview }));
    }
    const api = path.startsWith(SURVEY_API + '/') ? path.slice(SURVEY_API.length + 1).match(/^([^/]+)(?:\/admin(?:\/(export|\d+))?)?$/) : null;
    const survey = api && Object.hasOwn(SURVEYS, api[1]) ? SURVEYS[api[1]] : null;
    if (!survey) return json({ error: 'この操作は利用できません。' }, 404);
    const admin = path !== SURVEY_API + '/' + survey.id;
    if (!env.RECEPTION_DB) throw fail('アンケートの準備中です。時間をおいてお試しください。', 503);
    const db = env.RECEPTION_DB;
    if (!admin && request.method === 'POST') {
      const body = await readJSON(request);
      if (!surveyOpen(survey, clock(env))) throw fail('アンケートの受付は終了しました。ご協力ありがとうございました。', 410);
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw fail('回答内容をご確認ください。');
      if (typeof body.request_id !== 'string' || !UUID.test(body.request_id)) throw fail('画面を開き直してください。');
      if (body.website) throw fail('送信内容をご確認ください。');
      const answers = validateAnswers(survey, body.answers);
      const text = JSON.stringify(answers);
      const payloadHash = await hash(text);
      let existing = await bind(db, 'SELECT id, payload_hash FROM survey_responses WHERE request_id = ?', [body.request_id]).first();
      if (!existing) {
        if (env.SURVEY_LIMITER && !(await env.SURVEY_LIMITER.limit({ key: 'survey:' + (request.headers.get('CF-Connecting-IP') || 'local') })).success) throw fail('少し時間をおいて、もう一度送信してください。', 429);
        const now = new Date().toISOString();
        await bind(db, 'INSERT INTO survey_responses (survey_id,request_id,payload_hash,answers,created_at,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(request_id) DO NOTHING', [survey.id, body.request_id, payloadHash, text, now, now]).run();
        existing = await bind(db, 'SELECT id, payload_hash FROM survey_responses WHERE request_id = ?', [body.request_id]).first();
      }
      if (!existing || existing.payload_hash !== payloadHash) throw fail('この回答はすでに送信されています。別の方の回答は「別の方の回答をする」からお送りください。', 409);
      return json({ ok: true });
    }
    if (admin) {
      const access = await staffAccess(request, env);
      if (!api[2] && request.method === 'GET') {
        const rows = (await bind(db, 'SELECT id, answers, excluded, created_at FROM survey_responses WHERE survey_id=? ORDER BY id DESC', [survey.id]).all()).results;
        return json({ ...tallySurvey(survey, rows), responses: rows.map(r => ({ id: r.id, created_at: r.created_at, excluded: r.excluded, answers: parse(r.answers) || {} })) });
      }
      if (api[2] === 'export' && request.method === 'GET') {
        const rows = (await bind(db, 'SELECT id, answers, excluded, created_at FROM survey_responses WHERE survey_id=? ORDER BY id', [survey.id]).all()).results;
        return new Response(surveyCSV(survey, rows), { headers: { ...headers, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="kerakabuki-survey-${survey.id}.csv"` } });
      }
      if (/^\d+$/.test(api[2] || '') && request.method === 'PATCH') {
        const body = await readJSON(request);
        if (!body || typeof body.excluded !== 'boolean') throw fail('集計の対象をご確認ください。');
        const result = await bind(db, 'UPDATE survey_responses SET excluded=?, updated_at=?, updated_by=? WHERE id=? AND survey_id=?', [body.excluded ? 1 : 0, new Date().toISOString(), access.session.userId, Number(api[2]), survey.id]).run();
        if (!result.meta.changes) throw fail('回答が見つかりません。', 404);
        return json({ ok: true });
      }
    }
    return json({ error: 'この操作は利用できません。' }, 404);
  } catch (error) {
    // 回答内容や例外本文はログに出さない。
    if (!error.status) console.error('survey_request_failed', { path, method: request.method });
    return json({ error: error.status ? error.message : '処理を完了できませんでした。入力内容を残したまま、もう一度お試しください。' }, error.status || 503);
  }
}
