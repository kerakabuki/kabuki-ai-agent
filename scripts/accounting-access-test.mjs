// 合成セッション・会計・証憑のみ。ローカルMiniflareで認可とキャッシュを検証する。
// RECEPTION_DEPS / ACCOUNTING_BROWSER_DEPS は accounting-test.mjs と共通。
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve, join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import vm from 'node:vm';
import { runtime } from './reception-runtime.mjs';

const require = createRequire(process.env.ACCOUNTING_BROWSER_DEPS || resolve('package.json'));
const puppeteer = require('puppeteer');
const checks = [];
const check = name => { checks.push(name); console.log('PASS ' + name); };
const { mf, kv } = await runtime();
const bucket = await mf.getR2Bucket('CONTENT_BUCKET');
const origin = String(await mf.ready).replace(/\/$/, '');
const api = '/api/groups/kera/expenses';
const original = '/api/groups/kera/images/evidence-existing.pdf';
const legacy = '/api/groups/kera/images/receipt-existing.png';
const pdf = Buffer.from('%PDF-1.4\nSYNTHETIC-EXISTING-ORIGINAL\n%%EOF\n');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
const sentinel = 'SYNTHETIC-ACCOUNTING-PRIVATE';
const expense = { id: 'synthetic-1', date: '2026-10-29', type: 'income', category: '補助金・助成金', vendor: sentinel, total: 100, receipt_url: legacy, receipt_urls: [legacy, original] };
const saved = { expenses: [expense], carryForward: { 2025: 23 }, categoryMapping: { '会費': '会費収入' }, fyStartMonth: 4 };
await kv.put('group:kera', JSON.stringify({ group_id: 'kera', name: '動作確認用（架空データ）' }));
await kv.put('group_expenses:kera', JSON.stringify(saved));
for (const id of ['unregistered', 'global-master', 'member-master', 'pending', 'revoked']) {
  await kv.put('session:' + id, JSON.stringify({ userId: id }));
}
await kv.put('master_users', JSON.stringify(['global-master', 'member-master']));
const members = [
  { userId: 'local-manager', role: 'manager' }, { userId: 'local-member', role: 'member' },
  { userId: 'member-master', role: 'member' }, { userId: 'pending', role: 'pending' },
];
await kv.put('group_members:kera', JSON.stringify(members));
await bucket.put('images/kera/evidence-existing.pdf', new Uint8Array(pdf), { httpMetadata: { contentType: 'application/pdf' } });
await bucket.put('images/kera/receipt-existing.png', new Uint8Array(png), { httpMetadata: { contentType: 'image/png' } });
await bucket.put('images/other/evidence-existing.pdf', 'OTHER-GROUP-PRIVATE');
await bucket.put('images/theaters/evidence-existing.pdf', 'THEATER-GROUP-PRIVATE');
await bucket.put('images/kera/hero-existing.png', new Uint8Array(png), { httpMetadata: { contentType: 'image/png' } });
await bucket.put('images/theaters/misc-existing.png', new Uint8Array(png), { httpMetadata: { contentType: 'image/png' } });

const call = async (path, user = 'local-manager', init = {}) => {
  const request = new Request(origin + path, { ...init, headers: { ...(user ? { cookie: 'kl_session=' + user } : {}), ...init.headers } });
  return mf.dispatchFetch(request.url, { method: request.method, headers: Object.fromEntries(request.headers), ...(request.body ? { body: await request.arrayBuffer() } : {}) });
};
const privateResponse = response => {
  assert.match(response.headers.get('cache-control') || '', /private.*no-store/);
  assert.equal(response.headers.get('vary'), 'Cookie');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('access-control-allow-origin'), null);
};
const put = (expenses, user = 'local-manager', headers = {}) => call(api, user, {
  method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify({ expenses }),
});
const multipart = (bytes = pdf, type = 'application/pdf', extra = {}) => {
  const body = new FormData(); body.append('file', new File([bytes], 'synthetic', { type }));
  for (const [key, value] of Object.entries(extra)) body.append(key, value);
  return body;
};
const temp = await mkdtemp(join(tmpdir(), 'kabuki-accounting-access-'));
let browser;
try {
  const endpoints = [
    ['/groups/kera/accounting', 'GET'], [api, 'GET'], [api + '/export', 'GET'],
    [api, 'POST'], [api + '/upload', 'POST'], [api + '/scan', 'POST'],
  ];
  for (const [user, status] of [[null, 401], ['expired', 401], ['other-manager', 403], ['local-member', 403], ['unregistered', 403], ['global-master', 403], ['pending', 403]]) {
    const before = await kv.get('group_expenses:kera');
    const files = (await bucket.list()).objects.length;
    const keys = (await kv.list()).keys.map(k => k.name);
    for (const prefix of ['', '/en']) for (const [path, method] of endpoints) {
      const response = await call(prefix + path, user, { method, ...(method === 'POST' ? { body: 'invalid-untrusted-body' } : {}) });
      assert.equal(response.status, status, `${user} ${method} ${prefix + path}: ${response.status === status ? '' : await response.clone().text()}`);
      privateResponse(response);
      assert.ok(!(await response.text()).includes(sentinel));
    }
    assert.equal(await kv.get('group_expenses:kera'), before);
    assert.equal((await bucket.list()).objects.length, files);
    assert.deepEqual((await kv.list()).keys.map(k => k.name), keys);
    check(`${user || '未ログイン'}: 会計の全経路と/enを拒否し読取・書込・OCR副作用なし`);
  }
  for (const user of ['local-manager', 'member-master']) {
    for (const prefix of ['', '/en']) for (const path of ['/groups/kera/accounting', api, api + '/export']) {
      for (const method of ['GET', 'HEAD']) {
        const response = await call(prefix + path, user, { method });
        assert.equal(response.status, 200); privateResponse(response);
        if (method === 'HEAD') assert.equal(await response.text(), '');
      }
    }
    check(`${user}: 所属と既存役割を満たす会計GET/HEAD/CSVを許可`);
  }
  for (const user of [null, 'expired', 'other-manager', 'unregistered', 'global-master', 'pending']) {
    for (const path of [original, legacy, '/en' + original, '/en' + legacy, '/api/groups/kera/images/evidence-not-found.pdf']) {
      for (const method of ['GET', 'HEAD']) {
        const response = await call(path, user, { method });
        assert.equal(response.status, !user || user === 'expired' ? 401 : 403);
        privateResponse(response);
        assert.ok(!(await response.text()).includes('SYNTHETIC-EXISTING'));
      }
    }
  }
  check('原本URLの直アクセス・旧スキャン画像・/en・HEADも所属確認前に存在情報を返さない');
  for (const user of ['local-member', 'local-manager', 'member-master']) {
    for (const [path, bytes, mime] of [[original, pdf, 'application/pdf'], [legacy, png, 'image/png']]) {
      const response = await call(path, user); assert.equal(response.status, 200); privateResponse(response);
      assert.equal(response.headers.get('content-type'), mime);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
    }
  }
  check('所属メンバーは旧画像/PDF原本を取得でき、会計管理権限は拡大しない');
  assert.equal((await call('/api/groups/other/images/evidence-existing.pdf')).status, 403);
  assert.equal((await call('/api/groups/kera/images/evidence-other-id.pdf')).status, 404);
  assert.equal((await call('/api/groups/empty/expenses')).status, 403);
  assert.equal((await call('/api/groups/other/expenses')).status, 403);
  check('別団体ID・別証憑IDへの差替えと未登録団体を拒否');
  for (const prefix of ['', '/en']) {
    for (const user of [null, 'local-manager']) {
      const response = await call(prefix + '/api/theaters/images/evidence-existing.pdf', user);
      assert.equal(response.status, 404); privateResponse(response);
    }
    for (const path of ['/api/groups/kera/images/hero-existing.png', '/api/theaters/images/misc-existing.png']) {
      const response = await call(prefix + path, null); assert.equal(response.status, 200);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), png);
    }
  }
  check('theaters別名から証憑を取得できず、公開の団体/芝居小屋画像は継続表示');
  for (const type of ['receipt', 'evidence', 'receipt-custom', 'evidence-custom']) {
    const before = (await bucket.list()).objects.length;
    const response = await call('/api/groups/kera/images', null, { method: 'POST', body: multipart(png, 'image/png', { type }) });
    assert.equal(response.status, 400); assert.equal((await bucket.list()).objects.length, before);
  }
  check('公開画像uploadから会計証憑の名前空間へ書込できない');
  for (const [path, method] of [[api, 'DELETE'], [api, 'PUT'], [original, 'DELETE'], [api + '/upload', 'GET'], [api + '/scan', 'GET'], ['/groups/kera/accounting', 'POST']]) {
    const response = await call(path, 'local-manager', { method });
    assert.equal(response.status, 405); privateResponse(response);
  }
  assert.equal((await call(api + '/unknown')).status, 404);
  check('未実装の更新/削除メソッドや未知の会計APIは処理しない');
  for (const headers of [{ origin: 'https://untrusted.invalid' }, { 'sec-fetch-site': 'cross-site' }]) {
    const before = await kv.get('group_expenses:kera');
    assert.equal((await put([], 'local-manager', headers)).status, 403);
    for (const path of [api + '/upload', api + '/scan']) assert.equal((await call(path, 'local-manager', { method: 'POST', headers, body: 'untrusted' })).status, 403);
    assert.equal(await kv.get('group_expenses:kera'), before);
  }
  check('ログイン済みでも外部オリジンからの保存/upload/scanを拒否');
  let response = await put([expense, { ...expense, id: 'synthetic-2', receipt_url: 'https://kabukiplus.com' + legacy, receipt_urls: ['https://www.kabukiplus.com/en' + original] }], 'local-manager', { origin });
  assert.equal(response.status, 200); privateResponse(response);
  response = await put([{ ...expense, total: 222 }]); assert.equal(response.status, 200);
  let actual = JSON.parse(await kv.get('group_expenses:kera'));
  assert.equal(actual.expenses.length, 1); assert.equal(actual.expenses[0].total, 222);
  assert.deepEqual(actual.carryForward, saved.carryForward); assert.deepEqual(actual.categoryMapping, saved.categoryMapping);
  response = await put([]); assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(await kv.get('group_expenses:kera')).expenses, []);
  assert.ok(await bucket.get('images/kera/evidence-existing.pdf'));
  check('管理者の作成・更新・削除（一覧保存）と旧URL/会計設定を維持、外した原本も公開へ戻さない');
  await put([expense]);
  for (const value of [
    '/api/groups/other/images/evidence-existing.pdf', '/api/groups/kera/images/hero-existing.png',
    'https://untrusted.invalid' + original, 'javascript:alert(1)', '//untrusted.invalid' + original,
    '/api/theaters/images/evidence-existing.pdf', '/api/groups/kera/images/%65vidence-existing.pdf',
  ]) {
    for (const entry of [{ ...expense, receipt_url: value }, { ...expense, receipt_urls: [value] }]) {
      const before = await kv.get('group_expenses:kera'); response = await put([entry]);
      assert.equal(response.status, 400); privateResponse(response); assert.equal(await kv.get('group_expenses:kera'), before);
    }
  }
  check('別団体・公開画像・外部/危険URLを証憑に登録できず既存会計データを保持');
  response = await call(api + '/upload', 'local-manager', { method: 'POST', body: multipart() });
  assert.equal(response.status, 200); privateResponse(response);
  const uploaded = (await response.json()).receipt_url;
  assert.equal((await call(uploaded, null)).status, 401);
  assert.equal((await call(uploaded, 'other-manager')).status, 403);
  assert.deepEqual(Buffer.from(await (await call(uploaded, 'local-member')).arrayBuffer()), pdf);
  check('管理者の新規PDFアップロード原本は直ちに同団体限定');
  response = await call(api + '/scan', 'local-manager', { method: 'POST', body: multipart(png, 'image/png') });
  assert.equal(response.status, 200); privateResponse(response);
  const scanned = (await response.json()).receipt_url;
  assert.match(scanned, /\/receipt-/);
  assert.equal((await call(scanned, null)).status, 401);
  assert.deepEqual(Buffer.from(await (await call(scanned, 'local-member')).arrayBuffer()), png);
  check('既存スキャン経路の保存画像も同団体限定（Geminiキーなし・外部OCRなし）');
  await kv.put('group_members:kera', JSON.stringify([...members, { userId: 'revoked', role: 'manager' }]));
  assert.equal((await call(api, 'revoked')).status, 200);
  await kv.put('group_members:kera', JSON.stringify(members));
  assert.equal((await call(api, 'revoked')).status, 403);
  assert.equal((await call(original, 'revoked')).status, 403);
  await kv.delete('session:local-manager');
  assert.equal((await call(api)).status, 401); assert.equal((await call(original)).status, 401);
  await kv.put('session:local-manager', JSON.stringify({ userId: 'local-manager' }));
  check('所属削除とセッション失効が次回会計/原本アクセスに反映');

  // 団体全体を削除する既存管理経路も会計KVを消すため、所属必須にする。
  for (const mode of ['direct', 'approve']) {
    const gid = 'synthetic-drop-' + mode;
    const key = 'group_expenses:' + gid;
    await kv.put(key, JSON.stringify(saved));
    await kv.put('group:' + gid, JSON.stringify({ group_id: gid, name: '削除検証専用の架空団体' }));
    await kv.put('group_members:' + gid, JSON.stringify([{ userId: 'member-master', role: 'member' }, { userId: 'local-manager', role: 'manager' }]));
    await kv.put('group_delete_request:' + gid, JSON.stringify({ groupId: gid }));
    const path = mode === 'direct' ? '/api/groups/' + gid : '/api/groups/requests/delete/approve';
    const init = { method: mode === 'direct' ? 'DELETE' : 'POST', ...(mode === 'approve' ? { headers: { 'content-type': 'application/json' }, body: JSON.stringify({ requestId: gid }) } : {}) };
    for (const prefix of ['', '/en']) for (const user of [null, 'other-manager', 'local-member', 'local-manager', 'global-master']) {
      response = await call(prefix + path, user, init);
      assert.equal(response.status, user ? 403 : 401); privateResponse(response);
      assert.equal(await kv.get(key), JSON.stringify(saved));
      assert.ok(await kv.get('group:' + gid));
    }
    response = await call(path, 'member-master', { ...init, headers: { ...init.headers, origin: 'https://untrusted.invalid' } });
    assert.equal(response.status, 403); assert.ok(await kv.get(key));
    response = await call(path, 'member-master', init);
    assert.equal(response.status, 200); privateResponse(response);
    assert.equal(await kv.get(key), null); assert.equal(await kv.get('group:' + gid), null);
    check(`団体削除${mode === 'direct' ? 'API' : '承認'}は所属masterのみ許可し会計削除の迂回を防止`);
  }

  // Workerから実際に返るSWを実行し、旧キャッシュ削除とfetch戦略を検証する。
  const sw = await (await call('/sw.js', null)).text();
  const handlers = {}; const deleted = []; const writes = [];
  const cache = { addAll: async () => {}, put: async request => writes.push(request.url) };
  const context = {
    URL, Response, console,
    self: { location: { origin }, addEventListener: (type, cb) => { handlers[type] = cb; }, clients: { claim: async () => {} }, skipWaiting: async () => {} },
    caches: { keys: async () => ['kp-v4-runtime', 'kp-v4-static', 'unrelated'], delete: async key => deleted.push(key), open: async () => cache, match: async () => undefined },
    fetch: async () => new Response('private', { headers: { 'cache-control': 'private, no-store' } }),
  };
  vm.runInNewContext(sw, context);
  let pending; handlers.activate({ waitUntil: promise => { pending = promise; } }); await pending;
  assert.deepEqual(deleted.sort(), ['kp-v4-runtime', 'kp-v4-static']);
  for (const path of [api, '/en' + api, original, '/en' + original, '/groups/kera/accounting', '/en/groups/kera/accounting']) {
    let intercepted = false;
    handlers.fetch({ request: new Request(origin + path, { headers: { accept: 'text/html' } }), respondWith: () => { intercepted = true; } });
    assert.equal(intercepted, false, path);
  }
  for (const path of ['/assets/private.png', '/another-private-page']) {
    handlers.fetch({ request: new Request(origin + path, { headers: { accept: 'text/html' } }), respondWith: promise => { pending = promise; } }); await pending;
  }
  assert.deepEqual(writes, []);
  check('実配信SWは旧kpキャッシュを削除し日英の会計/原本を除外、no-store応答を保存しない');

  browser = await puppeteer.launch({ headless: true, userDataDir: join(temp, 'browser') });
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  const requested = [];
  page.on('request', request => {
    const url = new URL(request.url()); requested.push(url.href);
    if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
    return request.continue();
  });
  await page.setCookie({ name: 'kl_session', value: 'local-manager', url: origin });
  await page.goto(origin + '/groups/kera/accounting', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.ga-cta');
  // 出所不明な過去のリンクは表示・自動取得せず、保存データ自体は消さない。
  await kv.put('group_expenses:kera', JSON.stringify({ expenses: [{ ...expense, receipt_url: null, receipt_urls: ['https://untrusted.invalid/private.pdf', '/api/groups/other/images/evidence-existing.pdf'] }] }));
  requested.length = 0;
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForSelector('.ga-cta');
  await page.evaluate(() => GA.editExpense(0));
  assert.ok((await page.$eval('#gaf-receipt-section', el => el.textContent)).includes('この証憑のリンクは利用できません'));
  assert.equal(await page.$$eval('#gaf-receipt-section a, #gaf-receipt-section img', els => els.length), 0);
  assert.ok(!requested.some(url => url.includes('untrusted.invalid') || url.includes('/groups/other/images/')));
  check('既存の外部/別団体証憑リンクはブラウザで自動取得せず案内を表示');
  await kv.put('group_expenses:kera', JSON.stringify(saved));
  await page.deleteCookie({ name: 'kl_session', url: origin });
  response = await page.goto(origin + '/groups/kera/accounting', { waitUntil: 'domcontentloaded' });
  assert.equal(response.status(), 401); assert.equal(await page.$('#ga-app'), null);
  assert.ok(!(await page.content()).includes(sentinel));
  await page.setCookie({ name: 'kl_session', value: 'local-member', url: origin });
  response = await page.goto(origin + '/groups/kera/accounting', { waitUntil: 'domcontentloaded' });
  assert.equal(response.status(), 403); assert.equal(await page.$('#ga-app'), null);
  check('ブラウザでも未ログイン/一般メンバーへ会計UIを渡さず案内ページを表示');
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
} finally {
  if (browser) await browser.close();
  await mf.dispose();
  await rm(temp, { recursive: true, force: true });
}
