/**
 * NDL次世代デジタルライブラリーで地芝居関連書籍を広範に収集
 * 全文OCR検索可能な書籍のカタログを作成
 *
 * Usage: node scripts/ndl_broad_search.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';

const BOOK_API = 'https://lab.ndl.go.jp/dl/api/book/search';
const DELAY_MS = 1000;

// 広範なキーワード
const KEYWORDS = [
  '地芝居',        // 544
  '素人芝居',      // 887
  '村芝居',        // 1040
  '農村歌舞伎',    // 0 (前回)
  '芝居小屋',      // ?
  '素人演劇',      // ?
  '農村娯楽',      // ?
  '民衆娯楽',      // ?
  '農村舞台',      // ?
  '回り舞台',      // ?
  '地歌舞伎',      // ?
  '義太夫 農村',   // ?
  '郡上 芝居',     // ? (奥美濃関連)
  '美濃 歌舞伎',   // ?
  '飛騨 芝居',     // ?
  '恵那 芝居',     // ?
  '中津川 芝居',   // ?
  '鳳凰座',        // ?
  '白雲座',        // ?
  '明治座 歌舞伎',  // ?
  '大鹿 芝居',     // ?
  '小鹿野 芝居',   // ?
  '檜枝岐',        // ?
  '黒森歌舞伎',    // ?
  '長浜 曳山',     // ?
  '播州 芝居',     // ?
  '小豆島 歌舞伎', // ?
  '農村 演劇 調査', // ?
];

async function searchBooks(keyword, maxBooks = 60) {
  const books = [];
  for (let from = 0; from < maxBooks; from += 20) {
    const url = `${BOOK_API}?keyword=${encodeURIComponent(keyword)}&from=${from}&size=20`;
    try {
      const res = await fetch(url);
      if (!res.ok) break;
      const data = await res.json();
      if (!data.list || data.list.length === 0) break;
      books.push(...data.list.map(b => ({
        id: b.id,
        title: b.title,
        volume: b.volume,
        published: b.published,
        ndc: b.ndc,
        page: b.page,
        highlights: b.highlights || [],
      })));
      if (books.length >= data.hit || books.length >= maxBooks) break;
      await new Promise(r => setTimeout(r, DELAY_MS));
    } catch {
      break;
    }
  }
  return books;
}

async function main() {
  const allBooks = new Map(); // id -> book
  const queryStats = [];

  for (let i = 0; i < KEYWORDS.length; i++) {
    const kw = KEYWORDS[i];
    process.stdout.write(`[${i + 1}/${KEYWORDS.length}] "${kw}" ... `);

    await new Promise(r => setTimeout(r, DELAY_MS));
    const books = await searchBooks(kw);
    console.log(`${books.length}冊`);

    if (books.length > 0) {
      queryStats.push({ keyword: kw, count: books.length });
    }

    for (const b of books) {
      if (allBooks.has(b.id)) {
        const existing = allBooks.get(b.id);
        if (!existing.matchedKeywords) existing.matchedKeywords = [];
        if (!existing.matchedKeywords.includes(kw)) existing.matchedKeywords.push(kw);
      } else {
        b.matchedKeywords = [kw];
        allBooks.set(b.id, b);
      }
    }
  }

  const unique = [...allBooks.values()];
  console.log(`\n=== 結果 ===`);
  console.log(`総ユニーク書籍: ${unique.length}冊`);

  // 複数キーワードでヒットした書籍（重要度高い）
  const multiHit = unique.filter(b => b.matchedKeywords.length >= 2)
    .sort((a, b) => b.matchedKeywords.length - a.matchedKeywords.length);

  console.log(`\n=== 複数キーワードでヒットした重要書籍 ===`);
  for (const b of multiHit.slice(0, 30)) {
    console.log(`  [${b.published || '?'}] ${b.title} ${b.volume || ''}`);
    console.log(`    ID: ${b.id} | ヒットKW: ${b.matchedKeywords.join(', ')}`);
    if (b.highlights.length > 0) {
      const hl = b.highlights[0]?.toString().replace(/<\/?em>/g, '').substring(0, 100);
      console.log(`    HL: ${hl}...`);
    }
  }

  // 年代別
  const decades = {};
  for (const b of unique) {
    const year = String(b.published || '').slice(0, 4);
    if (year.length === 4 && !isNaN(year)) {
      const decade = year.slice(0, 3) + '0年代';
      decades[decade] = (decades[decade] || 0) + 1;
    }
  }
  console.log('\n=== 年代別 ===');
  for (const [decade, count] of Object.entries(decades).sort()) {
    console.log(`  ${decade}: ${count}冊`);
  }

  // クエリ統計
  console.log('\n=== キーワード別ヒット数 ===');
  for (const { keyword, count } of queryStats.sort((a, b) => b.count - a.count)) {
    console.log(`  ${keyword}: ${count}冊`);
  }

  // 保存
  mkdirSync('research', { recursive: true });
  const output = {
    collectedAt: new Date().toISOString(),
    description: 'NDL次世代デジタルライブラリー全文OCR検索可能書籍カタログ',
    totalUniqueBooks: unique.length,
    multiKeywordHits: multiHit.length,
    queryStats,
    books: unique.sort((a, b) => (b.matchedKeywords?.length || 0) - (a.matchedKeywords?.length || 0)),
  };
  writeFileSync('research/ndl_books_catalog.json', JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\nSaved to research/ndl_books_catalog.json`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
