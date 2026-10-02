import assert from 'node:assert/strict';
import vm from 'node:vm';
import { runtime } from './reception-runtime.mjs';
import { SURVEY_2026 } from '../src/survey_2026.js';
import { surveyOpen, validateAnswers, tallySurvey, surveyCSV } from '../src/survey.js';
import { surveyPage, surveyAdminPage, surveyLoginPage } from '../src/survey_page.js';
import { keraOfficialPageHTML } from '../src/kera_official_page.js';
import { postcardPageHTML } from '../src/postcard_page.js';
// 締切の判定はローカル環境だけ SURVEY_NOW で固定し、実行日に左右されないようにする。
const { mf, db } = await runtime({ bindings: { SURVEY_NOW: '2026-10-01T12:00:00+09:00' } });
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
  check('フォームに全設問がある', questions.filter(q => !q.legacy).every(q => formHTML.includes(`name="${q.id}"`)) && formHTML.includes('name="website"'));
  check('本番のテーブルがあれば準備中にしない', !formHTML.includes('アンケートの準備中です') && formHTML.includes('id="surveyForm"'));
  check('共有URLをog:urlで示す', formHTML.includes('<meta property="og:url" content="https://kabukiplus.com/kerakabuki/survey/2026">'));
  check('スクリプトが止まっても感想をURLに載せない', formHTML.includes('<form id="surveyForm" method="post" novalidate>'));
  check('ヒントとエラーを各入力に結び付ける', formHTML.includes('name="overall" value="great" aria-describedby="overall-error"') && formHTML.includes('name="highlights" value="scene1" aria-describedby="highlights-hint highlights-error"') && formHTML.includes('aria-describedby="comment-hint comment-error comment-count"') && !/<fieldset[^>]*aria-describedby/.test(formHTML));
  check('受付済みの案内は通常は隠す', /<p class="notice" id="alreadyNotice" hidden>この回答は、すでに受け付けています/.test(formHTML));
  const idLine = formHTML.match(/const newId=[^\n]*;/)[0];
  const makeId = vm.runInNewContext(idLine + 'newId', { crypto: { getRandomValues: a => crypto.getRandomValues(a) } });
  const ids = Array.from({ length: 500 }, makeId);
  check('randomUUIDのない端末でもサーバーが受け付けるUUID v4を作る', ids.every(id => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)) && new Set(ids).size === ids.length);
  const head = await call(base, 'HEAD');
  check('回答画面はHEADに本文なしで答える', head.status === 200 && head.headers.get('cache-control').includes('no-store') && head.headers.get('content-type').startsWith('text/html') && (await head.arrayBuffer()).byteLength === 0);
  const adminHead = await call(base + '/admin', 'HEAD');
  check('集計画面のHEADも権限を確かめる', adminHead.status === 401 && (await adminHead.arrayBuffer()).byteLength === 0 && (await call(base + '/admin', 'HEAD', undefined, manager)).status === 200);
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

  // 公開後の設問追加: 保存・集計・旧回答の再送まで検証する。
  const prefectureQuestion = questions.find(q => q.id === 'prefecture');
  check('都道府県は47都道府県と海外の48択で重複しない', prefectureQuestion.options.length === 48 && new Set(prefectureQuestion.options.map(o => o[0])).size === 48 && new Set(prefectureQuestion.options.map(o => o[1])).size === 48 && prefectureQuestion.options[0][1] === '北海道' && prefectureQuestion.options.at(-2)[1] === '沖縄県' && prefectureQuestion.options.at(-1)[1] === '海外');
  check('都道府県は任意の選択欄で旧地域設問は表示しない', formHTML.includes('<select id="prefecture" name="prefecture"') && formHTML.includes('選択してください（任意）') && !formHTML.includes('name="region"') && !prefectureQuestion.required);
  check('岐阜県内の地域は最初は非表示かつ無効', formHTML.includes('<fieldset class="q" id="q-gifu_area" hidden disabled>'));
  check('幕間解説とイヤホンガイドを独立した選択肢として表示', formHTML.includes('value="okuda_intermission"') && formHTML.includes('おくだ健太郎氏による幕間解説') && formHTML.includes('value="earphone_guide"') && formHTML.includes('イヤホンガイド'));
  const beforeInvalidRegion = await count();
  check('一覧にない都道府県を拒否', (await post(answer({ prefecture: 'unknown' }))).status === 400);
  check('都道府県に配列を渡すと拒否', (await post(answer({ prefecture: ['gifu'] }))).status === 400);
  check('岐阜県の無効な地域を拒否', (await post(answer({ prefecture: 'gifu', gifu_area: 'unknown' }))).status === 400);
  check('解説も特になしとの同時選択を拒否', (await post(answer({ aids: ['none', 'okuda_intermission'] }))).status === 400 && (await post(answer({ aids: ['none', 'earphone_guide'] }))).status === 400);
  check('無効な地域や解説の回答は保存しない', await count() === beforeInvalidRegion);
  const newGifu = answer({ prefecture: 'gifu', gifu_area: 'meiho', aids: ['earphone_guide', 'okuda_intermission'] });
  check('岐阜県と明宝と解説2項目を保存', (await post(newGifu)).status === 200 && JSON.stringify(await stored(newGifu.request_id)) === JSON.stringify({ overall: 'great', aids: ['okuda_intermission', 'earphone_guide'], prefecture: 'gifu', gifu_area: 'meiho' }));
  const withoutArea = answer({ prefecture: 'gifu' });
  check('岐阜県内の地域は未回答でも送信可能', (await post(withoutArea)).status === 200 && !('gifu_area' in await stored(withoutArea.request_id)));
  const newIshikawa = answer({ prefecture: 'ishikawa', gifu_area: 'gujo' });
  check('他県の回答に岐阜県内の地域を混ぜて保存しない', (await post(newIshikawa)).status === 200 && (await stored(newIshikawa.request_id)).prefecture === 'ishikawa' && !('gifu_area' in await stored(newIshikawa.request_id)));
  const noRegion = answer({ gifu_area: 'meiho' });
  check('都道府県の未回答を許可し従属地域は捨てる', (await post(noRegion)).status === 200 && JSON.stringify(await stored(noRegion.request_id)) === '{"overall":"great"}');
  const overseas = answer({ prefecture: 'abroad' });
  check('海外を保存できる', (await post(overseas)).status === 200 && (await stored(overseas.request_id)).prefecture === 'abroad');
  const beforeRetry = await count();
  check('新しい地域・解説の再送でも重複しない', (await post(newGifu)).status === 200 && await count() === beforeRetry);
  // 旧版が保存した正規化済みJSONとハッシュを直接用意し、改修後に同じ内容を再送する。
  const legacyAnswers = { overall: 'great', aids: ['pamphlet', 'kaisetsu'], visits: 'first', region: 'meiho', age: '40s' };
  const legacyText = JSON.stringify(legacyAnswers);
  const legacyHash = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(legacyText))).toString('hex');
  const legacyId = crypto.randomUUID();
  await db.prepare('INSERT INTO survey_responses (survey_id,request_id,payload_hash,answers,created_at,updated_at) VALUES (?,?,?,?,?,?)').bind('2026', legacyId, legacyHash, legacyText, '2026-09-29T10:00:00.000Z', '2026-09-29T10:00:00.000Z').run();
  const beforeLegacyRetry = await count();
  check('変更前に保存した回答を再送しても200で件数を増やさない', (await post(answer(legacyAnswers, { request_id: legacyId }))).status === 200 && await count() === beforeLegacyRetry);
  check('旧回答の保存内容とハッシュを変更しない', (await db.prepare('SELECT answers,payload_hash FROM survey_responses WHERE request_id=?').bind(legacyId).first()).answers === legacyText && (await db.prepare('SELECT payload_hash FROM survey_responses WHERE request_id=?').bind(legacyId).first()).payload_hash === legacyHash);
  const updated = await summary();
  check('新しい都道府県と解説を担当者APIで集計', updated.tallies.prefecture.counts.gifu === 2 && updated.tallies.prefecture.counts.ishikawa === 1 && updated.tallies.prefecture.counts.abroad === 1 && updated.tallies.aids.counts.okuda_intermission === 1 && updated.tallies.aids.counts.earphone_guide === 1);
  check('岐阜県内集計の対象は岐阜県回答者だけ', updated.tallies.gifu_area.eligible === 2 && updated.tallies.gifu_area.answered === 1 && updated.tallies.gifu_area.counts.meiho === 1 && updated.tallies.gifu_area.counts.gujo === 0);
  const updatedCSV = await (await call(api + '/admin/export', 'GET', undefined, manager)).text();
  check('CSVに新しい地域と解説を日本語で出力し旧地域も残す', updatedCSV.includes('"お住まい","都道府県","岐阜県内の地域"') && updatedCSV.includes('"石川県"') && updatedCSV.includes('"岐阜県","明宝（気良を含む）"') && updatedCSV.includes('おくだ健太郎氏による幕間解説、イヤホンガイド') && updatedCSV.includes('"明宝（気良を含む）","",""'));

  // 10月の設問追加（座席の位置）: 表示・保存・集計・掛け合わせを検証する。
  const seatRadios = [...formHTML.matchAll(/<input type="radio" name="seat" value="([^"]+)"/g)].map(m => m[1]);
  check('座席の位置は4択のラジオで「会場で気になったこと」より前に出る', JSON.stringify(seatRadios) === JSON.stringify(['front', 'middle', 'back', 'standing']) && formHTML.indexOf('name="seat"') < formHTML.indexOf('name="improve"') && !questions.find(q => q.id === 'seat').required);
  const beforeInvalidSeat = await count();
  check('選択肢にない座席の位置を拒否し保存しない', (await post(answer({ seat: 'balcony' }))).status === 400 && (await post(answer({ seat: ['back'] }))).status === 400 && await count() === beforeInvalidSeat);
  const seated = answer({ seat: 'back', improve: ['seats', 'sound'] });
  check('座席の位置を保存できる', (await post(seated)).status === 200 && JSON.stringify(await stored(seated.request_id)) === JSON.stringify({ overall: 'great', seat: 'back', improve: ['seats', 'sound'] }));
  const seatRows = [
    { id: 1, answers: '{"overall":"great","seat":"back","improve":["sound"]}', excluded: 0, created_at: 'a' },
    { id: 2, answers: '{"overall":"great","seat":"back","improve":["seats"]}', excluded: 0, created_at: 'b' },
    { id: 3, answers: '{"overall":"great","seat":"front","improve":["none"]}', excluded: 0, created_at: 'c' },
    { id: 4, answers: '{"overall":"great","seat":"middle"}', excluded: 0, created_at: 'd' },
    { id: 5, answers: '{"overall":"great","improve":["sound"]}', excluded: 0, created_at: 'e' },
    { id: 6, answers: '{"overall":"great","seat":"back","improve":["sound"]}', excluded: 1, created_at: 'f' },
    { id: 7, answers: '{"seat":"back",壊れた', excluded: 0, created_at: 'g' },
  ];
  const seatUnit = tallySurvey(SURVEY_2026, seatRows);
  check('tallySurveyは座席の位置を数える', seatUnit.tallies.seat.answered === 4 && seatUnit.tallies.seat.counts.back === 2 && seatUnit.tallies.seat.counts.front === 1 && seatUnit.tallies.seat.counts.middle === 1 && seatUnit.tallies.seat.counts.standing === 0);
  const seatTab = seatUnit.crosstabs.find(c => c.id === 'seat_improve');
  const seatLine = v => seatTab.rows.find(r => r.value === v);
  check('掛け合わせは座席の位置を定義順に並べ、両方に答えた人だけを分母にする', seatUnit.crosstabs.length === 1 && seatTab.by === 'seat' && seatTab.target === 'improve' && seatTab.values.join() === 'sound,seats' && seatTab.rows.map(r => r.value).join() === 'front,middle,back,standing'
    && seatLine('back').n === 2 && seatLine('back').counts.sound === 1 && seatLine('back').counts.seats === 1
    && seatLine('front').n === 1 && seatLine('front').counts.sound === 0 && seatLine('front').counts.seats === 0
    && seatLine('middle').n === 0 && seatLine('standing').n === 0 && seatLine('standing').counts.sound === 0);
  check('掛け合わせのない調査は空配列', JSON.stringify(tallySurvey({ ...SURVEY_2026, crosstabs: undefined }, seatRows).crosstabs) === '[]');
  const oddTab = tallySurvey(SURVEY_2026, [
    { id: 1, answers: '{"overall":"great","seat":"balcony","improve":["sound"]}', excluded: 0, created_at: 'a' },
    { id: 2, answers: '{"overall":"great","seat":"back","improve":"sound"}', excluded: 0, created_at: 'b' },
    { id: 3, answers: '{"overall":"great","seat":"back","improve":["bogus"]}', excluded: 0, created_at: 'c' },
  ]).crosstabs[0];
  check('掛け合わせは選択肢にない座席・配列でない回答・選択肢にない値だけの回答を数えない', oddTab.rows.every(r => r.n === 0));
  const seatSummary = await summary();
  const apiTab = seatSummary.crosstabs?.find(c => c.id === 'seat_improve');
  check('担当者APIに掛け合わせが入る', apiTab && apiTab.title === '座席の位置と「会場で気になったこと」' && apiTab.rows.find(r => r.value === 'back').n === 1 && apiTab.rows.find(r => r.value === 'back').counts.sound === 1 && apiTab.rows.find(r => r.value === 'back').counts.seats === 1 && seatSummary.tallies.seat.counts.back === 1);
  const adminHTML = surveyAdminPage(SURVEY_2026);
  check('担当者画面に掛け合わせ欄と座席の位置の注記を埋め込む', adminHTML.includes('<h2 style="margin-top:30px">掛け合わせ</h2><div id="crosstabs"></div>') && adminHTML.includes('"adminNote":"回答受付の途中（10月）に追加した設問です。') && adminHTML.includes("label('seat',a.seat)") && !surveyAdminPage({ ...SURVEY_2026, crosstabs: [] }).includes('id="crosstabs"'));
  // 担当者画面のスクリプトを簡易DOMで動かし、掛け合わせ表・注記・回答一覧の座席の位置を確かめる。
  class FakeNode {
    constructor(tagName) { Object.assign(this, { tagName, children: [], attributes: {}, style: {}, textContent: '', className: '' }); }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren(...nodes) { this.children = nodes; }
    setAttribute(k, v) { this.attributes[k] = String(v); }
    removeAttribute(k) { delete this.attributes[k]; }
    focus() {}
  }
  const nodes = {};
  const fakeData = { ...seatUnit, responses: [{ id: 3, created_at: '2026-10-02T00:00:00.000Z', excluded: 0, answers: { overall: 'great', age: '40s', seat: 'front', improve: ['none'], comment: 'x' } }, { id: 4, created_at: '2026-10-02T00:00:00.000Z', excluded: 0, answers: { overall: 'great', age: '40s', comment: 'y' } }] };
  vm.runInNewContext(adminHTML.match(/<script>([\s\S]*?)<\/script>/)[1], {
    document: { getElementById: id => (nodes[id] ||= new FakeNode('div')), createElement: tag => new FakeNode(tag) },
    fetch: async () => ({ ok: true, status: 200, json: async () => fakeData }),
  });
  await new Promise(r => setTimeout(r, 20));
  const walk = n => [n, ...n.children.flatMap(walk)];
  const text = n => n.textContent + n.children.map(text).join('');
  const tableNodes = walk(nodes.crosstabs).filter(n => n.tagName === 'tr').map(tr => tr.children.map(c => (c.tagName === 'th' ? c.scope + ':' : '') + text(c)));
  check('担当者画面の掛け合わせ表を行見出し・列見出し・割合つきで描く', JSON.stringify(tableNodes) === JSON.stringify([
    ['col:座席の位置', 'col:回答者', 'col:台詞・音の聞こえ方', 'col:座席・舞台の見やすさ'],
    ['row:前のほう（舞台の近く）', '1人', '0人（0.0%）', '0人（0.0%）'],
    ['row:中ほど', '0人', '—', '—'],
    ['row:後ろのほう', '2人', '1人（50.0%）', '1人（50.0%）'],
    ['row:立ち見', '0人', '—', '—'],
  ]) && walk(nodes.crosstabs).some(n => n.textContent === '両方の設問に答えた人を分母にしています。') && walk(nodes.crosstabs).some(n => n.className === 'tableWrap'));
  const seatTally = nodes.tallies.children.find(card => card.children[0].textContent === 'どのあたりでご覧になりましたか');
  check('座席の位置の集計カードに追加時期の注記を出す', seatTally && seatTally.children[2].className === 'qnote' && seatTally.children[2].textContent.startsWith('回答受付の途中（10月）') && nodes.tallies.children.filter(card => card.children.some(c => c.className === 'qnote')).length === 1);
  const metas = walk(nodes.responses).filter(n => n.className === 'respMeta').map(n => n.textContent);
  check('回答一覧の見出しに年代の後ろへ座席の位置を出す（未回答なら出さない）', metas[0].endsWith('40代・前のほう（舞台の近く）') && metas[1].endsWith('40代'));
  const emptyData = { ...tallySurvey(SURVEY_2026, []), responses: [] };
  const emptyNodes = {};
  vm.runInNewContext(adminHTML.match(/<script>([\s\S]*?)<\/script>/)[1], {
    document: { getElementById: id => (emptyNodes[id] ||= new FakeNode('div')), createElement: tag => new FakeNode(tag) },
    fetch: async () => ({ ok: true, status: 200, json: async () => emptyData }),
  });
  await new Promise(r => setTimeout(r, 20));
  check('掛け合わせに回答者がいなければ「まだ回答がありません」', walk(emptyNodes.crosstabs).some(n => n.textContent === 'まだ回答がありません') && !walk(emptyNodes.crosstabs).some(n => n.tagName === 'table'));
  const seatCSV = await (await call(api + '/admin/export', 'GET', undefined, manager)).text();
  check('CSVに「座席の位置」列を「会場で気になったこと」の前に出す', seatCSV.split('\r\n')[0].includes('"再来場の意向","座席の位置","会場で気になったこと"') && seatCSV.includes('"後ろのほう","座席・舞台の見やすさ、台詞・音の聞こえ方"'));

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
  // 期限後の環境を別に立て、画面と送信の両方が締め切られることを確かめる。
  const late = await runtime({ bindings: { SURVEY_NOW: '2026-11-01T00:00:00+09:00' } });
  try {
    const closed = await (await late.mf.dispatchFetch(origin + base)).text();
    check('期限後は回答画面が受付終了でフォームなし', closed.includes('アンケートの受付は終了しました') && !closed.includes('id="surveyForm"'));
    const lateAnswer = answer();
    const lateSend = await late.mf.dispatchFetch(origin + api, { method: 'POST', headers: { 'content-type': 'application/json', origin }, body: JSON.stringify(lateAnswer) });
    check('期限後の送信は410', lateSend.status === 410 && (await lateSend.json()).error.includes('受付は終了しました') && (await late.db.prepare('SELECT COUNT(*) AS n FROM survey_responses').first()).n === 0);
  } finally { await late.mf.dispose(); }
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
} finally { await mf.dispose(); }
