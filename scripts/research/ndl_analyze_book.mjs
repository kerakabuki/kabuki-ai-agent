/**
 * NDL次世代デジタルライブラリーから特定書籍の全文テキストを取得し
 * 地芝居・村芝居関連ページを抽出・分析
 *
 * Usage: node scripts/ndl_analyze_book.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';

const FULLTEXT_API = 'https://lab.ndl.go.jp/dl/api/book/fulltext-json';
const PAGE_API = 'https://lab.ndl.go.jp/dl/api/page/search';
const DELAY_MS = 1500;

// 分析対象の書籍
const TARGET_BOOKS = [
  { id: '1215241', title: '民衆娯楽調査資料 第1輯 (全国農村娯楽状況)', year: 1931 },
  { id: '1215244', title: '民衆娯楽調査資料 第5輯', year: 1934 },
  { id: '1215250', title: '民衆娯楽調査資料 第6輯', year: 1934 },
  { id: '971732', title: '民衆娯楽の基調', year: 1922 },
];

// 地芝居関連キーワード
const SHIBAI_KEYWORDS = ['地芝居', '村芝居', '素人芝居', '農村歌舞伎', '地歌舞伎', '素人歌舞伎'];

// 地域名（都道府県＋旧国名＋地名）
const REGIONS = {
  // 都道府県
  '北海道': '北海道', '青森': '青森県', '岩手': '岩手県', '宮城': '宮城県',
  '秋田': '秋田県', '山形': '山形県', '福島': '福島県',
  '茨城': '茨城県', '栃木': '栃木県', '群馬': '群馬県', '埼玉': '埼玉県',
  '千葉': '千葉県', '東京': '東京都', '神奈川': '神奈川県',
  '新潟': '新潟県', '富山': '富山県', '石川': '石川県', '福井': '福井県',
  '山梨': '山梨県', '長野': '長野県', '岐阜': '岐阜県', '静岡': '静岡県',
  '愛知': '愛知県', '三重': '三重県', '滋賀': '滋賀県', '京都': '京都府',
  '大阪': '大阪府', '兵庫': '兵庫県', '奈良': '奈良県', '和歌山': '和歌山県',
  '鳥取': '鳥取県', '島根': '島根県', '岡山': '岡山県', '広島': '広島県',
  '山口': '山口県', '徳島': '徳島県', '香川': '香川県', '愛媛': '愛媛県',
  '高知': '高知県', '福岡': '福岡県', '佐賀': '佐賀県', '長崎': '長崎県',
  '熊本': '熊本県', '大分': '大分県', '宮崎': '宮崎県', '鹿児島': '鹿児島県',
  '沖縄': '沖縄県',
  // 旧国名（地芝居関連地域）
  '美濃': '岐阜県(美濃)', '飛騨': '岐阜県(飛騨)', '東濃': '岐阜県(東濃)',
  '三河': '愛知県(三河)', '尾張': '愛知県(尾張)',
  '信濃': '長野県(信濃)', '信州': '長野県(信州)',
  '播磨': '兵庫県(播磨)', '播州': '兵庫県(播州)',
  '讃岐': '香川県(讃岐)', '土佐': '高知県(土佐)',
  '出羽': '山形県/秋田県(出羽)', '陸奥': '東北(陸奥)',
  '武蔵': '埼玉県/東京都(武蔵)', '相模': '神奈川県(相模)',
  '越後': '新潟県(越後)', '上野': '群馬県(上野)',
};

async function getFulltext(bookId) {
  const url = `${FULLTEXT_API}/${bookId}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.list || [];
}

async function getHitPages(bookId, keyword) {
  const url = `${PAGE_API}?f-book=${bookId}&q-contents=${encodeURIComponent(keyword)}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.list || [];
}

function extractContext(text, keyword, windowSize = 100) {
  const contexts = [];
  let idx = 0;
  while ((idx = text.indexOf(keyword, idx)) !== -1) {
    const start = Math.max(0, idx - windowSize);
    const end = Math.min(text.length, idx + keyword.length + windowSize);
    contexts.push(text.substring(start, end));
    idx += keyword.length;
  }
  return contexts;
}

async function analyzeBook(book) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📖 ${book.title} (${book.year})`);
  console.log(`${'='.repeat(60)}`);

  // 全文テキスト取得
  console.log('全文テキスト取得中...');
  const pages = await getFulltext(book.id);
  if (!pages) {
    console.log('  取得失敗');
    return null;
  }
  console.log(`  ${pages.length}ページ取得`);

  // 地芝居関連ページを抽出
  const relevantPages = [];
  for (const page of pages) {
    const content = page.contents || '';
    const hasKeyword = SHIBAI_KEYWORDS.some(kw => content.includes(kw));
    if (hasKeyword) {
      relevantPages.push({
        page: page.page,
        content,
      });
    }
  }
  console.log(`  地芝居関連ページ: ${relevantPages.length}/${pages.length}ページ`);

  // 関連ページから地域名を抽出
  const regionMentions = {};
  const keywordContexts = {};

  for (const p of relevantPages) {
    // 地域名抽出
    for (const [name, pref] of Object.entries(REGIONS)) {
      if (p.content.includes(name)) {
        if (!regionMentions[pref]) regionMentions[pref] = [];
        // コンテキスト（地域名の周辺テキスト）
        const contexts = extractContext(p.content, name, 50);
        for (const ctx of contexts) {
          // 芝居関連のコンテキストのみ
          if (SHIBAI_KEYWORDS.some(kw => ctx.includes(kw)) ||
              ctx.includes('芝居') || ctx.includes('歌舞伎') || ctx.includes('演劇')) {
            regionMentions[pref].push({
              page: p.page,
              context: ctx.replace(/\n/g, ' ').trim(),
            });
          }
        }
      }
    }

    // キーワードごとのコンテキスト
    for (const kw of SHIBAI_KEYWORDS) {
      const contexts = extractContext(p.content, kw, 80);
      if (contexts.length > 0) {
        if (!keywordContexts[kw]) keywordContexts[kw] = [];
        for (const ctx of contexts) {
          keywordContexts[kw].push({
            page: p.page,
            context: ctx.replace(/\n/g, ' ').trim(),
          });
        }
      }
    }
  }

  // 結果表示
  console.log('\n--- 地域×地芝居の言及 ---');
  const sortedRegions = Object.entries(regionMentions)
    .filter(([, mentions]) => mentions.length > 0)
    .sort((a, b) => b[1].length - a[1].length);

  for (const [region, mentions] of sortedRegions) {
    console.log(`\n  【${region}】 ${mentions.length}件`);
    for (const m of mentions.slice(0, 3)) {
      console.log(`    p.${m.page}: ...${m.context.substring(0, 80)}...`);
    }
  }

  console.log('\n--- キーワード別コンテキスト数 ---');
  for (const [kw, contexts] of Object.entries(keywordContexts)) {
    console.log(`  ${kw}: ${contexts.length}箇所`);
  }

  return {
    book,
    totalPages: pages.length,
    relevantPages: relevantPages.length,
    regionMentions: Object.fromEntries(
      sortedRegions.map(([region, mentions]) => [region, mentions])
    ),
    keywordContexts,
  };
}

async function main() {
  const results = [];

  for (const book of TARGET_BOOKS) {
    await new Promise(r => setTimeout(r, DELAY_MS));
    const result = await analyzeBook(book);
    if (result) results.push(result);
  }

  // 全書籍横断の地域集計
  console.log('\n\n' + '='.repeat(60));
  console.log('全書籍横断 地域別集計');
  console.log('='.repeat(60));

  const totalRegions = {};
  for (const r of results) {
    for (const [region, mentions] of Object.entries(r.regionMentions)) {
      if (!totalRegions[region]) totalRegions[region] = 0;
      totalRegions[region] += mentions.length;
    }
  }
  for (const [region, count] of Object.entries(totalRegions).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${region}: ${count}件`);
  }

  // 保存
  mkdirSync('research', { recursive: true });
  writeFileSync('research/ndl_fulltext_analysis.json', JSON.stringify(results, null, 2), 'utf-8');
  console.log('\nSaved to research/ndl_fulltext_analysis.json');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
