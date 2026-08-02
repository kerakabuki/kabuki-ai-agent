// 秋田魁新報 記事見出し検索（秋田県立図書館 ADEAC）から見出しを収集する
// 対象: https://adeac.jp/akita-pref/detailed-search （1900-1999年の見出し283,858件）
// 使い方: node scripts/collect_sakigake_headlines.mjs "キーワード1" "キーワード2" ...
//         引数なしの場合は既定の地芝居関連キーワードセットを使用
// 出力: research/newspapers/sakigake_headlines.json （キーワード別・重複除去済み）
// 注意: 公共アーカイブへの礼儀としてリクエスト間に1.2秒の待機を入れている。並列実行しないこと。

import fs from 'fs';

const BASE = 'https://adeac.jp/akita-pref/detailed-search';
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
const SLEEP = (ms) => new Promise(r => setTimeout(r, ms));

const DEFAULT_KEYWORDS = ['地芝居', '村芝居', '素人芝居', '素人歌舞伎', '農村歌舞伎', '子供歌舞伎', '芝居小屋', '地狂言', '旅芝居', '康楽館'];

function parseInputs(html) {
  const form = new URLSearchParams();
  for (const m of html.matchAll(/<input[^>]*>/g)) {
    const tag = m[0];
    const n = (/name="([^"]*)"/.exec(tag) || [])[1]; if (!n) continue;
    const type = (/type="([^"]*)"/.exec(tag) || [])[1] || 'text';
    const v = (/value="([^"]*)"/.exec(tag) || [])[1] || '';
    if (type === 'hidden' || type === 'text') form.set(n, v);
    else if ((type === 'radio' || type === 'checkbox') && /checked/.test(tag)) form.set(n, v);
  }
  for (const m of html.matchAll(/<select[^>]*name="([^"]*)"[^>]*>([\s\S]*?)<\/select>/g)) {
    const sel = (/<option[^>]*selected[^>]*value="([^"]*)"/.exec(m[2]) || /<option[^>]*value="([^"]*)"/.exec(m[2]) || [])[1] || '';
    form.set(m[1], sel);
  }
  return form;
}

function decode(s) {
  return s.replace(/<em>|<\/em>/g, '').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function parseRows(html) {
  const rows = [];
  for (const m of html.matchAll(/catalog_grid_rpt_catalogsLink_(\d+)"[^>]*>([\s\S]*?)<\/a>\s*<span id="catalog_grid_rpt_viewLine2_\1"[^>]*>([^<]*)<\/span>/g)) {
    const headline = decode(m[2].replace(/<[^>]+>/g, '')).trim();
    const line2 = m[3].trim(); // 例: 1973年10月2日 夕刊 4面（1973-10-02）
    const iso = (/（(\d{4}-\d{2}-\d{2})）/.exec(line2) || [])[1] || '';
    const edition = (/(朝刊|夕刊)/.exec(line2) || [])[1] || '';
    const page = (/(\d+)面/.exec(line2) || [])[1] || '';
    rows.push({ headline, date: iso, edition, page });
  }
  return rows;
}

function totalCount(html) {
  const t = html.replace(/<[^>]+>/g, ' ');
  const m = /検索結果\s*[:：]?\s*([0-9,]+)\s*件/.exec(t) || /該当\s*([0-9,]+)\s*件/.exec(t) || /全\s*([0-9,]+)\s*件/.exec(t);
  return m ? parseInt(m[1].replace(/,/g, ''), 10) : null;
}

async function searchKeyword(kw) {
  // セッション開始（VIEWSTATE + Cookie 取得）
  const r1 = await fetch(BASE, { headers: UA });
  const cookies = (r1.headers.getSetCookie ? r1.headers.getSetCookie() : [r1.headers.get('set-cookie')]).filter(Boolean).map(c => c.split(';')[0]).join('; ');
  const h1 = await r1.text();
  const form = parseInputs(h1);
  form.set('fieldsAll_input', kw);
  form.set('tabRBL', 'catalogs');
  form.set('searchBTN', '検索');
  for (const d of ['resetBTN', 'dummyBTN', 'searchBTN_top', 'searchBTN_top_mini', 'searchCLEAR_top', 'searchItemAdd', 'convert']) form.delete(d);

  const post = async (body) => {
    const r = await fetch(BASE + '?mode=catalog', {
      method: 'POST',
      headers: { ...UA, 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookies, 'Referer': BASE, 'Origin': 'https://adeac.jp' },
      body: body.toString(),
    });
    return r.text();
  };

  await SLEEP(1200);
  let html = await post(form);
  const total = totalCount(html);
  const all = parseRows(html);

  // ページング: 結果ページのフォームを再解析し pageinput を進める
  let guard = 0;
  while (guard++ < 60) {
    const pageForm = parseInputs(html);
    const cur = parseInt(pageForm.get('pageinput') || '1', 10);
    const rowsNow = parseRows(html).length;
    if (rowsNow === 0) break;
    // 最終ページ判定: 総件数が分かればそれ、無ければ空ページで停止
    if (total !== null && all.length >= total) break;
    const next = cur + 1;
    pageForm.set('pageinput', String(next));
    pageForm.set('pagenateBtn', (/name="pagenateBtn"[^>]*value="([^"]*)"/.exec(html) || [, '移動'])[1]);
    for (const d of ['resetBTN', 'dummyBTN', 'searchBTN', 'searchBTN_top', 'searchBTN_top_mini', 'searchCLEAR_top', 'searchItemAdd', 'convert']) pageForm.delete(d);
    await SLEEP(1200);
    const nextHtml = await post(pageForm);
    const nextRows = parseRows(nextHtml);
    if (nextRows.length === 0) break;
    // 同一ページが返ってきたら停止（ページング不成立）
    if (nextRows[0] && all.length && nextRows[0].headline === all[all.length - nextRows.length]?.headline) break;
    all.push(...nextRows);
    html = nextHtml;
  }
  return { total, rows: all };
}

const keywords = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_KEYWORDS;
const out = { collectedAt: new Date().toISOString(), source: '秋田魁新報記事見出し検索（秋田県立図書館/ADEAC, 1900-1999, 283,858件）', url: BASE, keywords: {}, items: [] };
const seen = new Set();

for (const kw of keywords) {
  process.stderr.write(`検索中: ${kw} ... `);
  try {
    const { total, rows } = await searchKeyword(kw);
    out.keywords[kw] = { total, fetched: rows.length };
    let added = 0;
    for (const r of rows) {
      const key = r.date + '|' + r.headline;
      if (seen.has(key)) { // 既出記事にもキーワードを追記
        const ex = out.items.find(x => x.date === r.date && x.headline === r.headline);
        if (ex && !ex.matched.includes(kw)) ex.matched.push(kw);
        continue;
      }
      seen.add(key);
      out.items.push({ ...r, matched: [kw] });
      added++;
    }
    process.stderr.write(`総数${total} 取得${rows.length} 新規${added}\n`);
  } catch (e) {
    out.keywords[kw] = { error: e.message };
    process.stderr.write(`ERROR ${e.message}\n`);
  }
  await SLEEP(1500);
}

out.items.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
fs.mkdirSync('research/newspapers', { recursive: true });
fs.writeFileSync('research/newspapers/sakigake_headlines.json', JSON.stringify(out, null, 1));
console.log(`保存: research/newspapers/sakigake_headlines.json（ユニーク${out.items.length}件）`);
