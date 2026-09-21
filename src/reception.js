import { requireGroupRole } from './auth.js';
import { receptionPage, receptionAdminPage, receptionLoginPage, commemorativeSVG } from './reception_page.js';
import { cardPNG } from './reception_card.js';

export const RECEPTION_PATH = '/kerakabuki/reception/2026';
export const RECEPTION_API = '/api/kerakabuki/reception/2026';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
const clean = (v, max, label, required = false) => {
  if (typeof v !== 'string') { if (v == null && !required) return ''; throw fail(`${label}をご確認ください。`); }
  const s = v.normalize('NFC').trim();
  if ((required && !s) || s.length > max || /[\u0000-\u001f\u007f]/.test(s)) throw fail(`${label}をご確認ください。`);
  return s;
};

export function validateEntry(body, staff = false, proxy = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw fail('入力内容をご確認ください。');
  const unknown = proxy && body.contact_method === 'unknown';
  const method = unknown ? 'none' : body.contact_method;
  if (!['post', 'email', 'none'].includes(method)) throw fail('ご案内の方法を選んでください。');
  if (![true, false].includes(body.donation_declared)) throw fail('本日の受付内容を選んでください。');
  if (body.consent !== true) throw fail('お名前・連絡先の利用目的をご確認ください。');
  const entry = {
    name: clean(body.name, 100, 'お名前', true), kana: clean(body.kana, 100, 'ふりがな'),
    contact_method: method, postal_code: '', address: '', address_extra: '', email: '',
    donation_declared: body.donation_declared ? 1 : 0,
    donor_name: body.donation_declared ? clean(body.donor_name, 150, '祝儀袋のお名前') : '',
    source: body.source === 'paper' ? 'paper' : 'qr', paper_ref: '',
    entry_kind: proxy ? 'proxy' : 'visitor',
    attending: proxy ? 0 : body.attending === false ? 0 : 1,
    contact_confirmed: unknown ? 0 : 1,
  };
  if (body.attending !== undefined && typeof body.attending !== 'boolean') throw fail('観劇についてご確認ください。');
  if (proxy && !unknown && body.contact_confirmed !== true) throw fail('名義人ご本人の案内希望と利用目的を確認してください。');
  if (proxy) entry.donor_name = entry.name;
  if (method === 'post') {
    entry.postal_code = clean(body.postal_code, 12, '郵便番号', true).normalize('NFKC').replace(/[-\s]/g, '');
    if (!/^\d{7}$/.test(entry.postal_code)) throw fail('郵便番号を7桁で入力してください。');
    entry.address = clean(body.address, 180, '都道府県・市区町村・町域', true);
    entry.address_extra = clean(body.address_extra, 180, '丁目・番地・建物名', true);
  }
  if (method === 'email') {
    entry.email = clean(body.email, 254, 'メールアドレス', true);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email)) throw fail('メールアドレスをご確認ください。');
  }
  if (entry.source === 'paper') {
    if (!staff) throw fail('紙の記帳分は担当者画面から追加してください。', 403);
    entry.paper_ref = clean(body.paper_ref, 100, '芳名帳のページ・行', true);
  }
  return entry;
}

async function readJSON(request) {
  if (!(request.headers.get('content-type') || '').startsWith('application/json')) throw fail('送信形式をご確認ください。', 415);
  const origin = request.headers.get('origin');
  if (origin !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') throw fail('この画面から送信してください。', 403);
  if (Number(request.headers.get('content-length') || 0) > 64000) throw fail('入力が長すぎます。', 413);
  const bytes = await readBytes(request.body, 64000);
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw fail('入力内容を読み取れませんでした。'); }
}
async function readBytes(stream, limit) {
  const reader = stream?.getReader();
  if (!reader) throw fail('入力内容がありません。');
  let count = 0; const parts = [];
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    count += value.byteLength;
    if (count > limit) { await reader.cancel(); throw fail('入力が長すぎます。', 413); }
    parts.push(value);
  }
  const bytes = new Uint8Array(count); let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.length; }
  return bytes;
}
async function hash(value) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(x => x.toString(16).padStart(2, '0')).join('');
}
const receipt = (number) => `R8-${String(number).padStart(4, '0')}`;
const bind = (db, sql, args = []) => db.prepare(sql).bind(...args);
async function staffAccess(request, env) {
  const access = await requireGroupRole(request, env, 'kera', 'manager');
  if (!access.ok) throw fail(access.error, access.status);
  return access;
}

export function csvCell(value) {
  let text = String(value ?? '');
  // 表計算ソフトに数式として解釈させない。郵便番号の先頭ゼロも文字列として保持。
  if (/^[\s]*[=+\-@\t\r\n]/.test(text) || /^0\d+$/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
function csvRows(rows, audience) {
  const contact = ['受付番号', 'お名前', 'ふりがな', '案内方法', '郵便番号', '住所', '丁目・番地・建物名', 'メールアドレス'];
  const names = audience === 'all' ? [...contact, '祝儀申告', '祝儀袋名義', '受領確認', '金額（円）', '担当者メモ', '入力元', '紙の参照', '記帳日時', '記帳区分', '観劇', '持参者', '持参者受付番号'] : contact;
  const values = rows.map(r => {
    const fields = [receipt(r.number), r.name, r.kana, r.contact_confirmed ? { post: '郵送', email: 'メール', none: '不要' }[r.contact_method] : '未確認', r.postal_code.replace(/^(\d{3})(\d{4})$/, '$1-$2'), r.address, r.address_extra, r.email];
    return audience === 'all' ? [...fields, r.donation_declared ? 'あり' : 'なし', r.donor_name, r.received ? '受領済み' : '未確認', r.amount_yen, r.staff_note, r.source, r.paper_ref, r.created_at, r.entry_kind === 'proxy' ? '代理祝儀の名義人' : '来場者・持参者', r.attending ? '観劇' : '観劇なし', r.carrier_name || '', r.carrier_entry_number ? receipt(r.carrier_entry_number) : ''] : fields;
  });
  return [names, ...values].map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

export async function handleReception(request, env) {
  const url = new URL(request.url); const path = url.pathname;
  if (!(path === RECEPTION_PATH || path.startsWith(RECEPTION_PATH + '/') || path === RECEPTION_API || path.startsWith(RECEPTION_API + '/'))) return null;
  try {
    if (path === RECEPTION_PATH && request.method === 'GET') {
      if (url.searchParams.get('paper') === '1') await staffAccess(request, env);
      return html(receptionPage({ paper: url.searchParams.get('paper') === '1', preview: env.RECEPTION_PREVIEW === '1', available: !!env.RECEPTION_DB }));
    }
    if (path === RECEPTION_PATH + '/admin' && request.method === 'GET') {
      const access = await requireGroupRole(request, env, 'kera', 'manager');
      if (!access.ok) return html(receptionLoginPage(access.status), access.status);
      return html(receptionAdminPage({ preview: env.RECEPTION_PREVIEW === '1' }));
    }
    if (path === RECEPTION_PATH + '/commemorative.svg' && request.method === 'GET') {
      return new Response(commemorativeSVG(), { headers: { ...headers, 'Content-Type': 'image/svg+xml; charset=utf-8', 'Content-Disposition': 'attachment; filename="kerakabuki-2026.svg"' } });
    }
    if (path === RECEPTION_PATH + '/commemorative.png' && request.method === 'GET') {
      return new Response(Uint8Array.from(atob(cardPNG), char => char.charCodeAt(0)), { headers: { ...headers, 'Content-Type': 'image/png', 'Content-Disposition': (url.searchParams.get('view') === '1' ? 'inline' : 'attachment') + '; filename="kerakabuki-2026.png"' } });
    }
    if (path === RECEPTION_API + '/postal' && request.method === 'GET') {
      const code = url.searchParams.get('code') || '';
      if (!/^\d{7}$/.test(code)) throw fail('郵便番号を7桁で入力してください。');
      const res = await fetch('https://zipcloud.ibsnet.co.jp/api/search?zipcode=' + code, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw fail('住所検索を利用できません。住所を直接入力してください。', 503);
      const responseBody = await readBytes(res.body, 64000);
      const result = JSON.parse(new TextDecoder().decode(responseBody));
      if (result.status !== 200) throw fail('住所検索を利用できません。住所を直接入力してください。', 503);
      return json({ addresses: (result.results || []).slice(0, 20).map(r => `${r.address1}${r.address2}${r.address3}`) });
    }
    if (!env.RECEPTION_DB) throw fail('受付の準備中です。紙の芳名帳をご利用ください。', 503);
    const db = env.RECEPTION_DB;
    if (path === RECEPTION_API && request.method === 'POST') {
      const body = await readJSON(request);
      if (!UUID.test(body.request_id || '')) throw fail('画面を開き直してください。');
      if (body.website) throw fail('送信内容をご確認ください。');
      const access = body.source === 'paper' ? await staffAccess(request, env) : null;
      const entry = validateEntry(body, !!access);
      if (body.proxy_gifts !== undefined && (!Array.isArray(body.proxy_gifts) || body.proxy_gifts.length > 10)) throw fail('代理のご祝儀は1回に10件まで入力できます。');
      const proxies = (body.proxy_gifts || []).map(gift => {
        if (!gift || typeof gift !== 'object' || Array.isArray(gift)) throw fail('代理のご祝儀をご確認ください。');
        return validateEntry({ ...gift, donation_declared: true, consent: true, source: entry.source, paper_ref: entry.paper_ref }, !!access, true);
      });
      if (!entry.attending && !entry.donation_declared && !proxies.length) throw fail('お届けするご祝儀を入力してください。');
      const payloadHash = await hash(JSON.stringify({ entry, proxies }));
      let existing = await bind(db, 'SELECT number, payload_hash FROM reception_entries WHERE request_id = ?', [body.request_id]).first();
      if (!existing) {
        if (env.RECEPTION_LIMITER && !(await env.RECEPTION_LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') || 'local' })).success) throw fail('少し時間をおいて、もう一度送信してください。', 429);
        const now = new Date().toISOString(); const keys = Object.keys(entry);
        const statements = [bind(db, `INSERT INTO reception_entries (request_id,payload_hash,event_id,${keys.join(',')},created_at,updated_at,updated_by) VALUES (${Array(keys.length + 6).fill('?').join(',')}) ON CONFLICT(request_id) DO NOTHING`, [body.request_id, payloadHash, '2026', ...Object.values(entry), now, now, access?.session.userId || ''])];
        // 親と各祝儀袋を1トランザクションで保存。再送時も同じ組み合わせを一度だけ記録する。
        proxies.forEach((gift, i) => {
          const giftKeys = Object.keys(gift);
          statements.push(bind(db, `INSERT INTO reception_entries (request_id,payload_hash,event_id,${giftKeys.join(',')},created_at,updated_at,updated_by,carrier_entry_number) SELECT ${Array(giftKeys.length + 6).fill('?').join(',')},number FROM reception_entries WHERE request_id=? AND payload_hash=? ON CONFLICT(request_id) DO NOTHING`, [body.request_id + ':' + (i + 1), payloadHash, '2026', ...Object.values(gift), now, now, access?.session.userId || '', body.request_id, payloadHash]));
        });
        await db.batch(statements);
        existing = await bind(db, 'SELECT number, payload_hash FROM reception_entries WHERE request_id = ?', [body.request_id]).first();
      }
      if (!existing || existing.payload_hash !== payloadHash) throw fail('同じ送信番号ですでに記帳されています。受付係に内容の訂正をお申し付けください。', 409);
      const gifts = (await bind(db, 'SELECT number FROM reception_entries WHERE carrier_entry_number=? ORDER BY number', [existing.number]).all()).results;
      return json({ ok: true, receipt: receipt(existing.number), proxy_receipts: gifts.map(g => receipt(g.number)) });
    }
    if (path.startsWith(RECEPTION_API + '/admin')) {
      const access = await staffAccess(request, env);
      if (path === RECEPTION_API + '/admin' && request.method === 'GET') {
        const cursor = Math.max(0, Number(url.searchParams.get('cursor')) || 0);
        const rows = (await bind(db, 'SELECT e.*,c.name AS carrier_name FROM reception_entries e LEFT JOIN reception_entries c ON c.number=e.carrier_entry_number WHERE e.event_id = ? AND e.number > ? ORDER BY e.number LIMIT 101', ['2026', cursor]).all()).results;
        const totals = await bind(db, "SELECT COUNT(*) AS total, SUM(attending=1) AS attending, SUM(entry_kind='proxy') AS proxy, SUM(source='paper') AS paper, SUM(contact_method='post' AND contact_confirmed=1) AS post, SUM(contact_method='email' AND contact_confirmed=1) AS email, SUM(donation_declared=1 AND received=0) AS pending, SUM(received=1) AS received, COALESCE(SUM(amount_yen),0) AS amount FROM reception_entries WHERE event_id=?", ['2026']).first();
        return json({ entries: rows.slice(0, 100).map(({ request_id, payload_hash, ...r }) => ({ ...r, receipt: receipt(r.number) })), next: rows.length > 100 ? rows[99].number : null, totals });
      }
      if (path === RECEPTION_API + '/admin/export' && request.method === 'GET') {
        const audience = url.searchParams.get('audience') || 'all';
        if (!['all', 'post', 'email'].includes(audience)) throw fail('出力区分をご確認ください。');
        const query = 'SELECT e.*,c.name AS carrier_name FROM reception_entries e LEFT JOIN reception_entries c ON c.number=e.carrier_entry_number WHERE e.event_id=?' + (audience === 'all' ? '' : ' AND e.contact_method=? AND e.contact_confirmed=1') + ' ORDER BY e.number';
        const rows = (await bind(db, query, audience === 'all' ? ['2026'] : ['2026', audience]).all()).results;
        return new Response('\ufeff' + csvRows(rows, audience), { headers: { ...headers, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="kerakabuki-2026-${audience}.csv"` } });
      }
      const match = path.match(/\/admin\/(\d+)$/);
      if (match && request.method === 'PATCH') {
        const body = await readJSON(request); const number = Number(match[1]);
        const before = await bind(db, 'SELECT * FROM reception_entries WHERE number=? AND event_id=?', [number, '2026']).first();
        if (!before) throw fail('記帳が見つかりません。', 404);
        if (!Number.isInteger(body.revision) || body.revision !== before.revision) throw fail('別の担当者が更新しました。一覧を更新してから確認してください。', 409);
        if (typeof body.received !== 'boolean') throw fail('受領確認を選んでください。');
        const amount = body.amount_yen === null || body.amount_yen === '' ? null : body.amount_yen;
        if (amount !== null && (!Number.isInteger(amount) || amount < 0 || amount > 100000000)) throw fail('金額は0円以上の整数で入力してください。');
        if (!body.received && amount !== null) throw fail('金額を記録する場合は受領済みにしてください。');
        const note = typeof body.staff_note === 'string' ? body.staff_note.replace(/\r\n?/g, '\n').trim() : '';
        if (note.length > 500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(note)) throw fail('担当者メモは500文字以内で入力してください。');
        const corrected = body.entry ? validateEntry({ ...before, contact_method: before.contact_confirmed ? before.contact_method : 'unknown', ...body.entry, contact_confirmed: body.entry.contact_confirmed === true, attending: !!before.attending, donation_declared: !!before.donation_declared, source: before.source, paper_ref: before.paper_ref, consent: true }, true, before.entry_kind === 'proxy') : null;
        const now = new Date().toISOString(); const revision = before.revision + 1;
        const after = { ...(corrected || {}), received: body.received ? 1 : 0, amount_yen: amount, staff_note: note, revision };
        const oldValues = Object.fromEntries(Object.keys(after).map(key => [key, before[key]]));
        // 同時更新を revision で検出し、変更と履歴を同じトランザクションで確定。
        const result = await db.batch([
          bind(db, `UPDATE reception_entries SET ${Object.keys(after).map(key => `${key}=?`).join(',')},updated_at=?,updated_by=? WHERE number=? AND revision=?`, [...Object.values(after), now, access.session.userId, number, before.revision]),
          bind(db, 'INSERT INTO reception_audit (entry_number,actor,changed_at,before_json,after_json) SELECT ?,?,?,?,? WHERE changes()=1', [number, access.session.userId, now, JSON.stringify(oldValues), JSON.stringify(after)]),
        ]);
        if (result[0].meta.changes !== 1) throw fail('別の担当者が更新しました。一覧を更新してください。', 409);
        return json({ ok: true, revision });
      }
    }
    return json({ error: 'この操作は利用できません。' }, 404);
  } catch (error) {
    // 個人情報を含むリクエストや例外内容はログに出さない。
    if (!error.status) console.error('reception_request_failed', { path, method: request.method });
    return json({ error: error.status ? error.message : '処理を完了できませんでした。入力内容を残したまま、もう一度お試しください。' }, error.status || 503);
  }
}
