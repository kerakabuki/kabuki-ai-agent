/**
 * NDL次世代デジタルライブラリーAPIで地芝居関連書籍の全文テキストを分析
 *
 * Step 1: キーワードで書籍を検索
 * Step 2: 各書籍のヒットページのコンテキストを取得
 * Step 3: 地域名・団体名を自動抽出
 *
 * Usage: node scripts/ndl_fulltext_search.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const BOOK_API = 'https://lab.ndl.go.jp/dl/api/book/search';
const PAGE_API = 'https://lab.ndl.go.jp/dl/api/page/search';
const DELAY_MS = 1000;
const OUTPUT_FILE = 'research/ndl_fulltext_results.json';

const KEYWORDS = ['地芝居', '素人芝居', '村芝居', '農村歌舞伎'];

// 地域名パターン（県名＋代表的な地名）
const REGION_PATTERNS = [
  // 県名
  '岐阜', '愛知', '長野', '静岡', '三重', '滋賀', '兵庫', '岡山', '鳥取', '島根',
  '香川', '高知', '広島', '大分', '宮崎', '福島', '山形', '秋田', '岩手', '新潟',
  '群馬', '栃木', '茨城', '埼玉', '千葉', '神奈川', '東京', '山梨',
  // 地芝居で有名な地域
  '美濃', '飛騨', '東濃', '中津川', '恵那', '加子母', '下呂', '高山',
  '大鹿', '小鹿野', '檜枝岐', '黒森', '長浜', '播州', '小豆島',
  '鳳凰座', '白雲座', '明治座', '常磐座', '東座', '気良',
  // 一般的な芝居関連語
  '芝居小屋', '回り舞台', '花道', '義太夫', '浄瑠璃', '人形', '振付',
];

// 書籍検索
async function searchBooks(keyword, maxBooks = 100) {
  const books = [];
  for (let from = 0; from < maxBooks; from += 20) {
    const url = `${BOOK_API}?keyword=${encodeURIComponent(keyword)}&from=${from}&size=20`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    if (!data.list || data.list.length === 0) break;
    books.push(...data.list);
    if (books.length >= data.hit || books.length >= maxBooks) break;
    await new Promise(r => setTimeout(r, DELAY_MS));
  }
  return books;
}

// ページ検索（コンテキスト取得）
async function searchPages(bookId, keyword) {
  const url = `${PAGE_API}?f-book=${bookId}&q-contents=${encodeURIComponent(keyword)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.list) return [];
    return data.list.map(p => ({
      page: p.page,
      highlights: p.highlights,
      content: p.contents?.substring(0, 500), // 最初の500文字
    }));
  } catch {
    return [];
  }
}

// テキストから地域名を抽出
function extractRegions(text) {
  const found = [];
  for (const pattern of REGION_PATTERNS) {
    if (text.includes(pattern)) {
      found.push(pattern);
    }
  }
  return [...new Set(found)];
}

async function main() {
  const allResults = [];
  const regionCount = {};

  for (const keyword of KEYWORDS) {
    console.log(`\n=== "${keyword}" で書籍検索 ===`);
    const books = await searchBooks(keyword, 50); // 各キーワード最大50冊
    console.log(`  ${books.length}冊ヒット`);

    for (let i = 0; i < books.length; i++) {
      const book = books[i];
      process.stdout.write(`  [${i + 1}/${books.length}] ${book.title} (${book.published || '?'}) ... `);

      await new Promise(r => setTimeout(r, DELAY_MS));
      const pages = await searchPages(book.id, keyword);
      console.log(`${pages.length}ページ`);

      if (pages.length === 0) continue;

      // 全ヒット箇所のテキストを結合して地域名抽出
      const allText = pages.map(p => [p.highlights, p.content].filter(Boolean).join(' ')).join(' ');
      const regions = extractRegions(allText);

      for (const r of regions) {
        regionCount[r] = (regionCount[r] || 0) + 1;
      }

      allResults.push({
        keyword,
        bookId: book.id,
        title: book.title,
        volume: book.volume,
        published: book.published,
        hitPages: pages.length,
        regions,
        // 代表的なハイライト（最初の3ページ分）
        sampleHighlights: pages.slice(0, 3).map(p => p.highlights).filter(Boolean),
      });
    }
  }

  console.log(`\n=== 結果サマリー ===`);
  console.log(`分析した書籍: ${allResults.length}冊`);
  console.log(`総ヒットページ: ${allResults.reduce((s, r) => s + r.hitPages, 0)}ページ`);

  console.log('\n=== 地域名出現頻度 ===');
  const sortedRegions = Object.entries(regionCount).sort((a, b) => b[1] - a[1]);
  for (const [region, count] of sortedRegions) {
    console.log(`  ${region}: ${count}冊で言及`);
  }

  // 年代別
  const decades = {};
  for (const r of allResults) {
    const year = String(r.published || '').slice(0, 4);
    if (year.length === 4 && !isNaN(year)) {
      const decade = year.slice(0, 3) + '0年代';
      decades[decade] = (decades[decade] || 0) + 1;
    }
  }
  console.log('\n=== 年代別書籍数 ===');
  for (const [decade, count] of Object.entries(decades).sort()) {
    const bar = '█'.repeat(count);
    console.log(`  ${decade}: ${String(count).padStart(3)}冊 ${bar}`);
  }

  // 保存
  mkdirSync('research', { recursive: true });
  const output = {
    collectedAt: new Date().toISOString(),
    description: 'NDL次世代デジタルライブラリー全文検索: 地芝居関連書籍のテキスト分析',
    keywords: KEYWORDS,
    totalBooks: allResults.length,
    totalPages: allResults.reduce((s, r) => s + r.hitPages, 0),
    regionFrequency: Object.fromEntries(sortedRegions),
    results: allResults,
  };
  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\nSaved to ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
