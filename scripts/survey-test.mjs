import assert from 'node:assert/strict';
import vm from 'node:vm';
import { runtime } from './reception-runtime.mjs';
import { SURVEY_2026 } from '../src/survey_2026.js';
import { surveyOpen, validateAnswers, tallySurvey, surveyCSV } from '../src/survey.js';
import { surveyPage, surveyAdminPage, surveyLoginPage } from '../src/survey_page.js';
import { keraOfficialPageHTML } from '../src/kera_official_page.js';
import { postcardPageHTML } from '../src/postcard_page.js';
const { mf, db } = await runtime();
const origin = 'https://kabukiplus.com';
const api = '/api/kerakabuki/survey/2026';
const base = '/kerakabuki/survey/2026';
const manager = { cookie: 'kl_session=local-manager' };
const member = { cookie: 'kl_session=local-member' };
const otherManager = { cookie: 'kl_session=other-manager' };
const checks = [];
const check = (name, value) => { assert.ok(value, name);checks.push(name); };
const questions = SURVEY_2026.sections.flatMap(s => s.questions);
const answer = (answers = {}, overrides = {}) => ({ request_id: crypto.randomUUID(), website: '', answers: { overall: 'great', ...answers }, ...overrides });
async function call(path, method = 'GET', body, extra = {}) {
  return mf.dispatchFetch(origin + path, { method, headers: { ...(body ? { 'content-type': 'application/json', origin } : {}), ...extra }, ...(body ? { body: JSON.stringify(body) } : {}) });
}
const post = body => call(api, 'POST', body);
const stored = async id => JSON.parse((await db.prepare('SELECT answers FROM survey_responses WHERE request_id=?').bind(id).first()).answers);
const count = async () => (await db.prepare('SELECT COUNT(*) AS n FROM survey_responses').first()).n;
const summary = async () => (await call(api + '/admin', 'GET', undefined, manager)).json();
try {
  for (const page of [surveyPage(SURVEY_2026), surveyPage(SURVEY_2026, { open: false }), surveyPage(SURVEY_2026, { available: false }), surveyAdminPage(SURVEY_2026), surveyLoginPage(SURVEY_2026, 401), surveyLoginPage(SURVEY_2026, 403)]) {
    for (const m of page.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(m[1]);
  }
  check('生成した回答・締切後・準備中・集計・ログイン案内画面のJavaScript構文', true);
  check('締切後は受付終了と次回案内を出しフォームを出さない', surveyPage(SURVEY_2026, { open: false }).includes('受付は終了しました') && surveyPage(SURVEY_2026, { open: false }).includes('/kerakabuki/annai') && !surveyPage(SURVEY_2026, { open: false }).includes('surveyForm'));
  check('準備中はフォームを出さない', surveyPage(SURVEY_2026, { available: false }).includes('アンケートの準備中です') && !surveyPage(SURVEY_2026, { available: false }).includes('surveyForm'));

  const form = await call(base);const formHTML = await form.text();
  check('回答画面はログイン不要', form.status === 200);
  check('回答画面をキャッシュしない', form.headers.get('cache-control').includes('no-store'));
  check('回答画面を検索に載せない', form.headers.get('x-robots-tag').includes('noindex') && formHTML.includes('content="noindex,nofollow"'));
  check('共有用のOGPがある', formHTML.includes('property="og:title" content="令和八年 気良歌舞伎公演 ご来場者アンケート"') && formHTML.includes('og:image'));
  check('フォームに全設問がある', questions.every(q => formHTML.includes(`name="${q.id}"`)) && formHTML.includes('name="website"'));
  check('本番のテーブルがあれば準備中にしない', !formHTML.includes('アンケートの準備中です') && formHTML.includes('id="surveyForm"'));
  check('未知の年度は404', (await call('/kerakabuki/survey/2027')).status === 404 && (await call('/api/kerakabuki/survey/2027', 'POST', answer())).status === 404);
  check('/kerakabuki/survey 自体は他のルートに渡す', !(await (await call('/kerakabuki/survey')).text()).includes('この操作は利用できません。'));

  check('必須の総合評価なしを拒否', (await post(answer({ overall: undefined }))).status === 400);
  const noOverall = await (await post(answer({ overall: '' }))).json();
  check('必須の未回答はどの設問か分かる文言', noOverall.error === '「公演はいかがでしたか」にお答えください。');
  check('選択肢にない値を拒否', (await post(answer({ overall: 'excellent' }))).status === 400);
  const badMulti = await post(answer({ highlights: ['scene1', 1] }));
  check('複数選択に文字列以外を拒否', badMulti.status === 400 && (await badMulti.json()).error === '「心に残ったところ」の回答をご確認ください。');
  check('複数選択の重複を拒否', (await post(answer({ highlights: ['scene1', 'scene1'] }))).status === 400);
  check('複数選択に配列以外を拒否', (await post(answer({ highlights: 'scene1' }))).status === 400);
  check('「特になし」と他の同時選択を拒否', (await post(answer({ aids: ['none', 'pamphlet'] }))).status === 400 && (await post(answer({ improve: ['toilet', 'none'] }))).status === 400);
  check('1001文字のご感想を拒否', (await post(answer({ comment: 'あ'.repeat(1001) }))).status === 400);
  check('制御文字を拒否', (await post(answer({ comment: '感想\u0007です' }))).status === 400 && (await post(answer({ highlights: ['other'], highlights_other: '改行\nあり' }))).status === 400);
  check('101文字の「その他」を拒否', (await post(answer({ source: ['other'], source_other: 'い'.repeat(101) }))).status === 400);
  check('他サイトからの送信を拒否', (await call(api, 'POST', answer(), { origin: 'https://other.example' })).status === 403);
  check('隠し欄が埋まっていると拒否', (await post(answer({}, { website: 'https://spam.example' }))).status === 400);
  check('UUIDでない送信番号を拒否', (await post(answer({}, { request_id: 'abc' }))).status === 400 && (await post(answer({}, { request_id: [crypto.randomUUID()] }))).status === 400);
  check('回答がオブジェクトでなければ拒否', (await post(answer({}, { answers: ['great'] }))).status === 400);
  check('不正な送信は保存しない', await count() === 0);

  const r1 = answer({ highlights: ['other', 'scene2'], highlights_other: '  お囃子の生演奏  ', relay: 'good', region: 'aichi', age: '40s', visits: 'first', comment: '初めての曽根崎心中、\r\n涙が出ました。', quote: 'profile', source: ['sns', 'postcard'] });
  const first = await post(r1);assert.equal(first.status, 200, await first.clone().text());
  check('有効な回答を保存', (await first.json()).ok === true && await count() === 1);
  const saved = await stored(r1.request_id);
  check('保存時に定義順へ並べ、改行を統一し前後の空白を除く', JSON.stringify(Object.keys(saved)) === JSON.stringify(['overall', 'highlights', 'highlights_other', 'relay', 'visits', 'region', 'age', 'source', 'comment', 'quote']) && saved.highlights.join() === 'scene2,other' && saved.source.join() === 'postcard,sns' && saved.highlights_other === 'お囃子の生演奏' && saved.comment === '初めての曽根崎心中、\n涙が出ました。');
  check('同じ送信番号の再送で件数が増えない', (await post(r1)).status === 200 && (await post({ ...r1, answers: { ...r1.answers, source: ['postcard', 'sns'] } })).status === 200 && await count() === 1);
  const conflict = await post({ ...r1, answers: { ...r1.answers, overall: 'good' } });
  check('同じ送信番号で内容違いは409', conflict.status === 409 && (await conflict.json()).error.includes('別の方の回答をする'));

  const r2 = answer({ overall: 'good', highlights: ['scene2', 'relay'], aids: ['none'], comment: '=SUM(A1)', quote: 'anonymous' });
  const r3 = answer({ improve: ['toilet'], comment: '' });
  const r4 = answer({ overall: 'fair', highlights: ['scene1'], highlights_other: '捨てられるはずの記入' });
  const r5 = answer({ overall: 'good', comment: '   ', quote: 'profile' });
  const r6 = answer({ name: '気良 太郎', email: 'discard@example.com', aids: [] });
  for (const r of [r2, r3, r4, r5, r6]) { const res = await post(r); assert.equal(res.status, 200, await res.clone().text()); }
  check('「その他」を選んでいない自由記入は保存しない', !('highlights_other' in await stored(r4.request_id)));
  const quoteless = await stored(r5.request_id);
  check('ご感想が空なら紹介の可否を保存しない', !('comment' in quoteless) && !('quote' in quoteless));
  const unknown = await stored(r6.request_id);
  check('未知のキーと空の複数選択は保存しない', JSON.stringify(unknown) === JSON.stringify({ overall: 'great' }));
  check('IPアドレスや氏名の列を持たない', (await db.prepare('PRAGMA table_info(survey_responses)').all()).results.every(c => !/ip|agent|name|mail/i.test(c.name)));

  check('未ログインの集計APIは401', (await call(api + '/admin')).status === 401);
  check('未ログインのCSVは401', (await call(api + '/admin/export')).status === 401);
  check('未ログインのPATCHは401', (await call(api + '/admin/1', 'PATCH', { excluded: true })).status === 401);
  check('未ログインの集計画面はログイン案内', await call(base + '/admin').then(async r => r.status === 401 && (await r.text()).includes('/jikabuki/base')));
  check('一般メンバーを拒否', (await call(api + '/admin', 'GET', undefined, member)).status === 403 && (await call(api + '/admin/export', 'GET', undefined, member)).status === 403 && (await call(base + '/admin', 'GET', undefined, member)).status === 403);
  check('別団体の管理者を拒否', (await call(api + '/admin', 'GET', undefined, otherManager)).status === 403 && (await call(api + '/admin/1', 'PATCH', { excluded: true }, otherManager)).status === 403);
  check('担当者は集計画面・集計API・CSVを使える', (await call(base + '/admin', 'GET', undefined, manager)).status === 200 && (await call(api + '/admin', 'GET', undefined, manager)).status === 200 && (await call(api + '/admin/export', 'GET', undefined, manager)).status === 200);

  const t = await summary();
  check('集計対象数が送った回答数と一致', t.total === 6 && t.excluded === 0 && t.responses.length === 6);
  check('単一選択の件数が一致', t.tallies.overall.answered === 6 && t.tallies.overall.counts.great === 3 && t.tallies.overall.counts.good === 2 && t.tallies.overall.counts.fair === 1 && t.tallies.overall.counts.bad === 0);
  check('複数選択の件数が一致', t.tallies.highlights.answered === 3 && t.tallies.highlights.counts.scene2 === 2 && t.tallies.highlights.counts.scene1 === 1 && t.tallies.highlights.counts.relay === 1 && t.tallies.highlights.counts.other === 1 && t.tallies.aids.counts.none === 1 && t.tallies.aids.answered === 1);
  check('「その他」の記入を集める', JSON.stringify(t.tallies.highlights.other) === JSON.stringify(['お囃子の生演奏']));
  check('ご感想ありと紹介可の件数が一致', t.comments === 2 && t.quotable === 2);
  check('紹介の可否とご感想は設問別集計に含めない', !('quote' in t.tallies) && !('comment' in t.tallies));
  check('送信番号とハッシュを返さない', t.responses.every(r => !('request_id' in r) && !('payload_hash' in r)) && typeof t.responses[0].answers === 'object');
  check('回答一覧は新しい順', t.responses[0].id > t.responses.at(-1).id);

  const target = t.responses.find(r => r.answers.comment?.startsWith('初めて'));
  check('PATCHで集計から除外できる', (await call(api + '/admin/' + target.id, 'PATCH', { excluded: true }, manager)).status === 200);
  const excluded = await summary();
  check('除外すると集計から外れる', excluded.total === 5 && excluded.excluded === 1 && excluded.tallies.overall.counts.great === 2 && excluded.comments === 1 && excluded.quotable === 1 && excluded.tallies.highlights.other.length === 0 && excluded.responses.find(r => r.id === target.id).excluded === 1);
  check('除外の操作者を記録', (await db.prepare('SELECT updated_by FROM survey_responses WHERE id=?').bind(target.id).first()).updated_by === 'local-manager');
  check('集計に戻せる', (await call(api + '/admin/' + target.id, 'PATCH', { excluded: false }, manager)).status === 200 && (await summary()).total === 6);
  check('除外の指定がbooleanでなければ400', (await call(api + '/admin/' + target.id, 'PATCH', { excluded: 1 }, manager)).status === 400 && (await call(api + '/admin/' + target.id, 'PATCH', {}, manager)).status === 400);
  check('存在しない番号は404', (await call(api + '/admin/999999', 'PATCH', { excluded: true }, manager)).status === 404);
  check('PATCHも他サイトからは拒否', (await call(api + '/admin/' + target.id, 'PATCH', { excluded: true }, { ...manager, origin: 'https://other.example' })).status === 403);

  const csvResponse = await call(api + '/admin/export', 'GET', undefined, manager);
  const csvBytes = new Uint8Array(await csvResponse.clone().arrayBuffer());const csv = await csvResponse.text();
  check('CSVはBOM付きUTF-8で書き出す', csvBytes[0] === 0xef && csvBytes[1] === 0xbb && csvBytes[2] === 0xbf && csvResponse.headers.get('content-disposition').includes('kerakabuki-survey-2026.csv'));
  check('CSVの見出し行', csv.split('\r\n')[0].startsWith('"回答番号","回答日時","集計","総合評価","心に残ったところ","心に残ったところ（その他）"'));
  check('CSVは表示名で書き出す', csv.includes('"第二場　天満屋ノ場（縁の下の「足の会話」）、その他"') && csv.includes('"お囃子の生演奏"'));
  check('CSVの数式注入を無効化', csv.includes(`"'=SUM(A1)"`));
  const direct = surveyCSV(SURVEY_2026, [{ id: 2, answers: '{"overall":"bad"}', excluded: 1, created_at: '2026-09-27T15:30:00.000Z' }, { id: 1, answers: '{"overall":"great","comment":"+1"}', excluded: 0, created_at: '2026-09-26T23:05:00.000Z' }]);
  check('CSVは番号順・日本時間・対象/除外', direct.startsWith('\ufeff') && direct.split('\r\n')[1].startsWith('"1","2026-09-27 08:05","対象","とてもよかった"') && direct.split('\r\n')[2].startsWith('"2","2026-09-28 00:30","除外","よくなかった"') && direct.includes(`"'+1"`));

  const rows = [{ id: 1, answers: '{"overall":"great","aids":["none"],"comment":"a","quote":"private"}', excluded: 0, created_at: 'a' }, { id: 2, answers: '{壊れた', excluded: 0, created_at: 'b' }, { id: 3, answers: '{"overall":"bad"}', excluded: 1, created_at: 'c' }];
  const unit = tallySurvey(SURVEY_2026, rows);
  check('tallySurveyは壊れた行と除外を数えない', unit.total === 1 && unit.excluded === 1 && unit.tallies.overall.counts.bad === 0 && unit.comments === 1 && unit.quotable === 0 && unit.last_at === 'a');
  check('tallySurveyは全選択肢を0で初期化', Object.keys(unit.tallies.highlights.counts).length === 11 && unit.tallies.highlights.answered === 0);
  check('validateAnswersは依存先があれば紹介の可否を残す', validateAnswers(SURVEY_2026, { quote: 'private', comment: 'x', overall: 'fair' }).quote === 'private');

  const closes = Date.parse(SURVEY_2026.closesAt);
  check('締切前はsurveyOpenがtrue', surveyOpen(SURVEY_2026, Date.parse('2026-09-27T09:00:00+09:00')) && surveyOpen(SURVEY_2026, closes));
  check('締切後はsurveyOpenがfalse', !surveyOpen(SURVEY_2026, closes + 1000) && !surveyOpen(SURVEY_2026, Date.parse('2027-01-01T00:00:00+09:00')));
  // 公開ページの導線は受付期間中だけ出る（期間外にテストしたときは出ないことを確かめる）。
  const open = surveyOpen(SURVEY_2026);
  check('公式トップに期間中だけアンケートへのリンク', keraOfficialPageHTML().includes('href="/kerakabuki/survey/2026"') === open);
  check('/pc に期間中だけアンケートへのリンク', postcardPageHTML().includes('href="/kerakabuki/survey/2026"') === open && postcardPageHTML().includes('/kerakabuki/annai'));
  const sw = await (await call('/sw.js')).text();check('Service Workerはアンケートページを保存しない', sw.includes("url.pathname.startsWith('/kerakabuki/survey/')"));

  // migration未適用の本番を再現し、回答者が全問答えてから失敗しないことを確かめる。
  await db.prepare('ALTER TABLE survey_responses RENAME TO survey_responses_hold').run();
  const pending = await (await call(base)).text();
  check('テーブルがなければ準備中を表示しフォームを出さない', pending.includes('アンケートの準備中です') && !pending.includes('id="surveyForm"'));
  check('テーブルがなければ送信は503', (await post(answer())).status === 503);
  await db.prepare('ALTER TABLE survey_responses_hold RENAME TO survey_responses').run();
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
} finally { await mf.dispose(); }
