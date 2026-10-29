// ローカルの合成証憑のみを使う。外部API・本番KV/R2への接続なし。
// node scripts/accounting-test.mjs
// 依存パッケージを別のcheckoutから使う場合は RECEPTION_DEPS / ACCOUNTING_BROWSER_DEPS に package.json を指定。
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import vm from 'node:vm';
import { runtime } from './reception-runtime.mjs';
import { groupAccountingPageHTML } from '../src/group_accounting_page.js';
import { MAX_EVIDENCE_BYTES, readEvidenceFile } from '../src/accounting_evidence.js';

const require = createRequire(process.env.ACCOUNTING_BROWSER_DEPS || resolve('package.json'));
const puppeteer = require('puppeteer');
const sharp = require('sharp');
const checks = [];
const check = (name, ok) => { assert.ok(ok, name); checks.push(name); console.log('PASS ' + name); };

function twoPagePDF() {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Resources << /Font << /F1 7 0 R >> >> /Contents 4 0 R >>',
    null,
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Resources << /Font << /F1 7 0 R >> >> /Contents 6 0 R >>',
    null,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  for (const [idx, page] of [[3, 1], [5, 2]]) {
    const stream = `BT /F1 18 Tf 30 100 Td (SYNTHETIC NOTICE - PAGE ${page}) Tj ET`;
    objects[idx] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  }
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((obj, i) => { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}

const pdf = twoPagePDF();
const baseImage = sharp({ create: { width: 240, height: 120, channels: 3, background: '#e8f5e9' } });
const png = await baseImage.clone().png().toBuffer();
const jpeg = await baseImage.clone().jpeg().toBuffer();
const webp = await baseImage.clone().webp().toBuffer();
const html = groupAccountingPageHTML({ group_id: 'kera', name: '合成データ検証用' });
for (const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
check('SSRが生成する全インラインJavaScriptの構文', true);
const { mf, kv } = await runtime();
await kv.put('group:kera', JSON.stringify({ group_id: 'kera', name: '動作確認用（架空データ）' }));
const bucket = await mf.getR2Bucket('CONTENT_BUCKET');
const origin = String(await mf.ready).replace(/\/$/, '');
const api = '/api/groups/kera/expenses';
const manager = { cookie: 'kl_session=local-manager' };
const call = async (path, init = {}) => {
  const request = new Request(origin + path, { ...init, headers: { ...manager, ...init.headers } });
  // NodeとMiniflareでFormDataの実装が異なるため、実際のHTTPと同じmultipartバイト列で渡す。
  return mf.dispatchFetch(request.url, { method: request.method, headers: Object.fromEntries(request.headers), ...(request.body ? { body: await request.arrayBuffer() } : {}) });
};
const upload = (bytes, type, name = 'synthetic.pdf', headers = {}) => {
  const body = new FormData();
  body.append('file', new File([bytes], name, { type }));
  return call(api + '/upload', { method: 'POST', body, headers });
};
const temp = await mkdtemp(join(tmpdir(), 'kabuki-accounting-test-'));
let browser;
try {
  for (const [bytes, type, ext] of [[pdf, 'application/pdf', 'pdf'], [png, 'image/png', 'png'], [jpeg, 'image/jpeg', 'jpg'], [webp, 'image/webp', 'webp']]) {
    const response = await upload(bytes, type, 'synthetic.' + ext);
    assert.equal(response.status, 200, await response.clone().text());
    const { receipt_url } = await response.json();
    const stored = await bucket.get('images/kera/' + receipt_url.split('/').pop());
    assert.equal(stored.httpMetadata.contentType, type);
    const read = await call(receipt_url);
    assert.equal(read.headers.get('content-type'), type);
    assert.deepEqual(Buffer.from(await read.arrayBuffer()), bytes);
    check(ext + 'を保存・配信して元のバイト列を保持（PDFは2ページ）', true);
  }
  for (const type of ['', 'application/octet-stream']) {
    const response = await upload(pdf, type, 'notice.PDF');
    check('MIMEが' + (type || '空') + 'でもPDFを内容から判定', response.status === 200);
  }
  for (const [name, bytes, type] of [
    ['空ファイル', '', 'application/pdf'],
    ['容量超過', Buffer.alloc(MAX_EVIDENCE_BYTES + 1), 'application/pdf'],
    ['未対応形式', '<svg/>', 'image/svg+xml'],
    ['PDFに偽装したHTML', '<html>invalid</html>', 'application/pdf'],
    ['不一致MIME', png, 'application/pdf'],
    ['途中で切れたPDF', '%PDF-1.4\ntruncated', 'application/pdf'],
  ]) {
    const before = (await bucket.list()).objects.length;
    const response = await upload(bytes, type);
    const error = await response.json();
    check(name + 'を拒否しR2へ保存しない', response.status === 400 && !!error.error && (await bucket.list()).objects.length === before);
  }
  const maxImage = Buffer.alloc(MAX_EVIDENCE_BYTES); png.copy(maxImage);
  check('容量上限ちょうどは許可', !(await readEvidenceFile(new File([maxImage], 'max.png', { type: 'image/png' }))).error);
  check('管理者以外の既存拒否を維持', (await upload(pdf, 'application/pdf', 'synthetic.pdf', { cookie: 'kl_session=local-member' })).status === 403);
  const missing = await call(api + '/upload', { method: 'POST', body: new FormData() });
  check('未選択を拒否', missing.status === 400);

  const pdfPath = join(temp, 'synthetic-two-page.pdf');
  const pngPath = join(temp, 'synthetic.png');
  const jpegPath = join(temp, 'synthetic-camera.jpg');
  const badPath = join(temp, 'invalid.pdf');
  await Promise.all([writeFile(pdfPath, pdf), writeFile(pngPath, png), writeFile(jpegPath, jpeg), writeFile(badPath, '<html>invalid</html>')]);
  browser = await puppeteer.launch({ headless: true, userDataDir: join(temp, 'browser') });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await page.setCookie({ name: 'kl_session', value: 'local-manager', url: origin });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  let uploadCount = 0;
  let scanCount = 0;
  let uploadMode = 'normal';
  let heldUpload;
  await page.setRequestInterception(true);
  page.on('request', async request => {
    const url = new URL(request.url());
    if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
    if (url.pathname === api + '/scan') {
      scanCount++;
      return request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ documents: [{ date: '2026-10-29', vendor: '合成撮影テスト', total: 100, items: [] }], receipt_urls: [] }) });
    }
    if (url.pathname === api + '/upload') {
      uploadCount++;
      if (uploadMode === 'hold') { heldUpload = request; return; }
      if (uploadMode === 'error') return request.respond({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: '合成テスト用の保存失敗' }) });
    }
    return request.continue();
  });
  await page.goto(origin + '/groups/kera/accounting', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.ga-cta');
  await page.evaluate(() => GA.showAddForm('income'));
  const choose = async (fromFiles, path) => {
    const pending = page.waitForFileChooser();
    await page.click(fromFiles ? '.gaf-evidence-actions button:nth-child(2)' : '.gaf-evidence-actions button:first-child');
    const chooser = await pending;
    if (path) await chooser.accept([path]); else await chooser.cancel();
  };
  // inputの実際のプロパティをclick直前に記録し、Androidでのcapture分離を確認。
  const trackPickers = () => {
    const click = HTMLInputElement.prototype.click;
    HTMLInputElement.prototype.click = function() {
      if (this.type === 'file') window.lastPicker = { accept: this.accept, capture: this.getAttribute('capture'), multiple: this.multiple };
      return click.call(this);
    };
  };
  await page.evaluateOnNewDocument(trackPickers);
  await page.evaluate(trackPickers);
  const urls = () => page.$eval('#gaf-receipt-urls', el => JSON.parse(el.value));
  await choose(true);
  check('ファイル選択キャンセルで添付・入力を変更しない', (await urls()).length === 0 && uploadCount === 0);
  const picker = await page.evaluate(() => window.lastPicker);
  check('ファイル選択にはcaptureがなくPDF・画像を許可', picker.capture === null && picker.accept.includes('application/pdf') && picker.accept.includes('image/png'));
  await choose(true, pdfPath);
  await page.waitForSelector('#gaf-receipt-section .ga-receipt-pdf');
  check('PDFリンクを表示し画像として読み込まない', (await urls()).length === 1 && await page.$eval('#gaf-receipt-section', el => !el.querySelector('img')));
  await choose(true, pngPath);
  await page.waitForFunction(() => JSON.parse(document.querySelector('#gaf-receipt-urls').value).length === 2);
  await page.waitForFunction(() => !document.querySelector('#gaf-save').disabled);
  await page.evaluate(() => { document.querySelector('#gaf-vendor').value = '合成補助金通知'; document.querySelector('#gaf-amount').value = '123'; GA.saveForm(null); });
  await page.waitForSelector('.ga-card-income .ga-receipt-pdf');
  await page.waitForFunction(() => document.querySelector('.ga-toast')?.textContent.includes('収入を保存しました'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.ga-card-income .ga-receipt-pdf');
  const saved = JSON.parse(await kv.get('group_expenses:kera')).expenses[0];
  check('収入にPDF＋画像を保存し再読込後も両方表示', saved.type === 'income' && saved.receipt_urls.length === 2 && !!await page.$('.ga-card-income img'));
  await page.evaluate(() => GA.editExpense(0));
  await choose(true, badPath);
  await page.waitForFunction(() => document.querySelector('.ga-toast')?.textContent.includes('形式を確認できません'));
  check('不正PDFのエラーを表示し既存証憑を保護', (await urls()).length === 2);
  uploadMode = 'error';
  await choose(true, pngPath);
  await page.waitForFunction(() => document.querySelector('.ga-toast')?.textContent.includes('合成テスト用の保存失敗'));
  check('HTTPエラーを成功扱いせず再試行可能', (await urls()).length === 2 && !await page.$eval('#gaf-save', el => el.disabled));
  uploadMode = 'normal';
  await choose(true, pngPath);
  await page.waitForFunction(() => JSON.parse(document.querySelector('#gaf-receipt-urls').value).length === 3);
  check('失敗後に同じファイルを再選択できる', (await urls()).length === 3);
  await page.waitForFunction(() => !document.querySelector('#gaf-save').disabled);
  await choose(false, jpegPath);
  await page.waitForFunction(() => JSON.parse(document.querySelector('#gaf-receipt-urls').value).length === 4);
  check('証憑撮影経路も保存できcapture=environmentを維持', (await page.evaluate(() => window.lastPicker.capture)) === 'environment');
  await page.waitForFunction(() => !document.querySelector('#gaf-save').disabled);
  uploadMode = 'hold';
  await choose(true, pdfPath);
  await page.waitForFunction(() => document.querySelector('#gaf-save').disabled);
  await page.evaluate(() => GA.saveForm(0));
  check('アップロード中の明細保存を抑止', (await urls()).length === 4);
  await page.evaluate(() => { GA.cancelForm(); GA.showAddForm('expense'); });
  assert.ok(heldUpload);
  await heldUpload.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ receipt_url: '/api/groups/kera/images/old-form.pdf' }) });
  await page.waitForNetworkIdle({ idleTime: 200 });
  check('アップロード中に別の明細へ移動しても証憑が混入しない', (await urls()).length === 0);
  uploadMode = 'normal';
  const pending = page.waitForFileChooser();
  await page.click('.ga-scan-btn');
  await (await pending).accept([jpegPath]);
  await page.waitForSelector('.ga-photo-preview');
  check('既存の写真読み取りの撮影・プレビューを維持', (await page.evaluate(() => window.lastPicker.capture)) === 'environment');
  await page.evaluate(() => GA.submitPhotos());
  await page.waitForFunction(() => document.querySelector('#gaf-vendor')?.value === '合成撮影テスト');
  check('既存OCR経路がフォームへ戻る（OCRレスポンスのみ合成）', scanCount === 1);
  const existingData = JSON.parse(await kv.get('group_expenses:kera'));
  const legacy = { ...saved, id: 'legacy-image', type: 'expense', vendor: '旧形式の合成証憑', receipt_url: saved.receipt_urls[1] };
  delete legacy.receipt_urls;
  existingData.expenses.push(legacy);
  await kv.put('group_expenses:kera', JSON.stringify(existingData));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.ga-card-receipt-thumb');
  await page.evaluate(() => GA.editExpense(1));
  check('旧receipt_url単独の画像を編集時に引き継ぐ', (await urls()).length === 1 && (await urls())[0] === legacy.receipt_url);
  await choose(true, pdfPath);
  await page.waitForFunction(() => JSON.parse(document.querySelector('#gaf-receipt-urls').value).length === 2 && !document.querySelector('#gaf-save').disabled);
  await page.evaluate(() => GA.saveForm(1));
  await page.waitForFunction(() => document.querySelector('.ga-toast')?.textContent.includes('支出を保存しました'));
  const afterLegacy = JSON.parse(await kv.get('group_expenses:kera'));
  check('既存支出の画像を保持したままPDFを追加保存できる', afterLegacy.expenses[1].receipt_urls[0] === legacy.receipt_url && afterLegacy.expenses[1].receipt_urls.length === 2);
  check('別明細と既存の会計データを変更しない', JSON.stringify(afterLegacy.expenses[0]) === JSON.stringify(saved));
  await page.evaluate(() => GA.editExpense(1));
  await page.evaluate(() => { GA.removeReceipt(1); GA.cancelForm(); });
  check('編集キャンセルは保存済み証憑を変更しない', JSON.stringify(JSON.parse(await kv.get('group_expenses:kera')).expenses[1]) === JSON.stringify(afterLegacy.expenses[1]));
  await page.evaluate(() => GA.editExpense(0));
  await page.waitForFunction(() => !document.querySelector('.ga-toast'));
  await page.screenshot({ path: process.env.ACCOUNTING_SCREENSHOT || join(temp, 'accounting-mobile.png'), fullPage: true });
  check('モバイル幅で横にはみ出さない', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  check('ページJavaScriptに実行エラーなし', errors.length === 0);
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
} finally {
  if (browser) await browser.close();
  await mf.dispose();
  await rm(temp, { recursive: true, force: true });
}
