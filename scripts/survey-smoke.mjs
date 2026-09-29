// 公開後のアンケートの簡易確認。本番（または任意のURL）に対して、画面・導線・権限・送信の可否を確かめる。
// 使い方: node scripts/survey-smoke.mjs [https://kabukiplus.com] [--send]
// 既定では何も保存しない。--send を付けたときだけテスト回答を1件送信し、後片付け用の送信番号を表示する。
const base = (process.argv.slice(2).find(a => !a.startsWith('--')) || 'https://kabukiplus.com').replace(/\/+$/, '');
const origin = new URL(base).origin;
const survey = '/kerakabuki/survey/2026';
const api = '/api/kerakabuki/survey/2026';
const results = [];
const check = (name, ok, detail = '') => { results.push(ok); console.log(`${ok ? 'OK' : 'NG'}  ${name}${detail ? '（' + detail + '）' : ''}`); };
const get = path => fetch(base + path, { redirect: 'manual', headers: { 'cache-control': 'no-cache' } });
const answer = request_id => JSON.stringify({ request_id, website: '', answers: { overall: 'great', comment: '【動作確認】公開後の送信テストです。確認後すぐに削除します。' } });
const send = (request_id, from) => fetch(base + api, { method: 'POST', headers: { 'content-type': 'application/json', origin: from }, body: answer(request_id) });

const page = await get(survey);
const html = await page.text();
check('回答画面が表示される', page.status === 200, String(page.status));
check('フォームがある（「準備中」ではない）', html.includes('id="surveyForm"'));
check('回答画面をキャッシュしない', (page.headers.get('cache-control') || '').includes('no-store'));
check('回答画面を検索に載せない', (page.headers.get('x-robots-tag') || '').includes('noindex'));
const top = await get('/kerakabuki');
check('公式トップにアンケートへのリンクがある', top.status === 200 && (await top.text()).includes(`href="${survey}"`));
// /kerakabuki/pc ははがきQRの訪問数を数えているので、ここでは開かない。
for (const path of ['/kerakabuki/reception/2026', '/kerakabuki/annai']) {
  const r = await get(path);check(`既存ページ ${path} が表示される`, r.status === 200, String(r.status));
}
check('未ログインの集計画面は開けない', (await get(survey + '/admin')).status === 401);
check('未ログインの集計APIは使えない', (await get(api + '/admin')).status === 401);
check('未ログインのCSVは取れない', (await get(api + '/admin/export')).status === 401);
check('他サイトからの送信は断る（保存されない）', (await send(crypto.randomUUID(), 'https://example.com')).status === 403);
if (process.argv.includes('--send')) {
  const id = crypto.randomUUID();
  const sent = await send(id, origin);
  const data = await sent.json().catch(() => ({}));
  check('テスト回答を送信できる', sent.status === 200 && data.ok === true, `${sent.status} ${JSON.stringify(data)}`);
  console.log(`TEST_REQUEST_ID=${id}`);
}
const failed = results.filter(ok => !ok).length;
console.log(failed ? `NG ${failed}件` : `すべてOK（${results.length}項目）`);
process.exit(failed ? 1 : 0);
