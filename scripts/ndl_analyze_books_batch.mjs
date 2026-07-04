/**
 * NDL次世代デジタルライブラリーから有望書籍の全文テキストをバッチ分析
 * 地域×芝居の言及を自動抽出
 *
 * Usage: node scripts/ndl_analyze_books_batch.mjs
 */

import { writeFileSync, readFileSync, mkdirSync } from 'fs';

const FULLTEXT_API = 'https://lab.ndl.go.jp/dl/api/book/fulltext-json';
const DELAY_MS = 2000;

// 分析対象の書籍（前回分析済みを除く）
const TARGET_BOOKS = [
  // 民衆娯楽調査資料シリーズ（未分析分）
  { id: '1215266', title: '民衆娯楽調査資料 第14輯', year: 1942 },
  { id: '1215269', title: '民衆娯楽調査資料 第15輯', year: 1942 },
  { id: '1215264', title: '民衆娯楽調査資料 第13輯', year: 1942 },
  // 農村娯楽・文化
  { id: '1066393', title: '農村文化の課題', year: 1944 },
  { id: '1126125', title: '国民娯楽の問題', year: 1941 },
  { id: '964584', title: '民衆娯楽の研究', year: 1920 },
  // 素人演劇
  { id: '1025571', title: '素人演劇運動の理念と方策', year: 1942 },
  { id: '1263115', title: '移動演劇十講', year: 1942 },
  // 江戸期の規制史料
  { id: '2588494', title: '市中取締類集 [302] 遠国伺等之部', year: null },
  { id: '2589111', title: '天保撰要類集 [283] 芝居之部 三', year: null },
  { id: '2588503', title: '市中取締類集 [311] 遠国伺等之部', year: null },
  { id: '2589114', title: '天保撰要類集 [286] 芝居之部 四', year: null },
  // 演劇史
  { id: '1129997', title: '文化のこころ', year: 1943 },
  { id: '1018816', title: '百姓だつて人間だ', year: 1925 },
  { id: '1437277', title: '青年団史', year: 1941 },
  // 社会教育・調査
  { id: '939606', title: '社会教育要覧 大正10年度', year: 1921 },
  { id: '939607', title: '和歌山県社会教育要覧', year: 1924 },
];

// 地芝居関連キーワード
const SHIBAI_KEYWORDS = ['地芝居', '村芝居', '素人芝居', '地歌舞伎', '素人歌舞伎', '素人演劇', '農村歌舞伎'];

// 都道府県名
const PREFECTURES = [
  '北海道', '青森', '岩手', '宮城', '秋田', '山形', '福島',
  '茨城', '栃木', '群馬', '埼玉', '千葉', '東京', '神奈川',
  '新潟', '富山', '石川', '福井', '山梨', '長野', '岐阜', '静岡',
  '愛知', '三重', '滋賀', '京都', '大阪', '兵庫', '奈良', '和歌山',
  '鳥取', '島根', '岡山', '広島', '山口', '徳島', '香川', '愛媛',
  '高知', '福岡', '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島', '沖縄',
];

// 旧国名・地域名
const OLD_REGIONS = {
  '美濃': '岐阜', '飛騨': '岐阜', '東濃': '岐阜', '郡上': '岐阜',
  '三河': '愛知', '尾張': '愛知', '遠江': '静岡', '駿河': '静岡',
  '信濃': '長野', '信州': '長野', '甲斐': '山梨',
  '播磨': '兵庫', '播州': '兵庫', '但馬': '兵庫', '丹波': '兵庫/京都',
  '讃岐': '香川', '阿波': '徳島', '土佐': '高知', '伊予': '愛媛',
  '出羽': '山形/秋田', '陸奥': '東北', '越後': '新潟', '越中': '富山',
  '加賀': '石川', '越前': '福井', '上野': '群馬', '下野': '栃木',
  '武蔵': '埼玉/東京', '相模': '神奈川', '常陸': '茨城',
  '紀伊': '和歌山', '大和': '奈良', '近江': '滋賀', '伊勢': '三重',
  '肥前': '佐賀/長崎', '肥後': '熊本', '豊後': '大分', '日向': '宮崎',
  '薩摩': '鹿児島', '琉球': '沖縄',
};

async function getFulltext(bookId) {
  const url = `${FULLTEXT_API}/${bookId}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.list || [];
  } catch {
    return null;
  }
}

function analyzePages(pages) {
  const result = {
    totalPages: pages.length,
    relevantPages: 0,
    keywordCounts: {},
    regionMentions: {},
    excerpts: [],
  };

  for (const page of pages) {
    const content = page.contents || '';
    const matchedKws = SHIBAI_KEYWORDS.filter(kw => content.includes(kw));
    if (matchedKws.length === 0) continue;

    result.relevantPages++;

    for (const kw of matchedKws) {
      result.keywordCounts[kw] = (result.keywordCounts[kw] || 0) + 1;
    }

    // 地域名抽出（芝居関連コンテキスト内のみ）
    for (const kw of matchedKws) {
      let idx = 0;
      while ((idx = content.indexOf(kw, idx)) !== -1) {
        const start = Math.max(0, idx - 150);
        const end = Math.min(content.length, idx + kw.length + 150);
        const context = content.substring(start, end);

        // 都道府県名チェック
        for (const pref of PREFECTURES) {
          if (context.includes(pref)) {
            if (!result.regionMentions[pref]) result.regionMentions[pref] = [];
            result.regionMentions[pref].push({
              page: page.page,
              keyword: kw,
              context: context.replace(/\n/g, ' ').substring(0, 200),
            });
          }
        }

        // 旧国名チェック
        for (const [old, modern] of Object.entries(OLD_REGIONS)) {
          if (context.includes(old)) {
            const key = `${modern}(${old})`;
            if (!result.regionMentions[key]) result.regionMentions[key] = [];
            result.regionMentions[key].push({
              page: page.page,
              keyword: kw,
              context: context.replace(/\n/g, ' ').substring(0, 200),
            });
          }
        }

        idx += kw.length;
      }
    }

    // 代表的な抜粋（最大5件）
    if (result.excerpts.length < 5) {
      for (const kw of matchedKws) {
        const kwIdx = content.indexOf(kw);
        if (kwIdx >= 0) {
          const start = Math.max(0, kwIdx - 80);
          const end = Math.min(content.length, kwIdx + kw.length + 80);
          result.excerpts.push({
            page: page.page,
            text: content.substring(start, end).replace(/\n/g, ' '),
          });
          break;
        }
      }
    }
  }

  return result;
}

async function main() {
  const allResults = [];

  for (let i = 0; i < TARGET_BOOKS.length; i++) {
    const book = TARGET_BOOKS[i];
    process.stdout.write(`[${i + 1}/${TARGET_BOOKS.length}] ${book.title} ... `);

    await new Promise(r => setTimeout(r, DELAY_MS));
    const pages = await getFulltext(book.id);
    if (!pages) {
      console.log('取得失敗');
      continue;
    }

    const analysis = analyzePages(pages);
    console.log(`${analysis.totalPages}p中${analysis.relevantPages}p関連`);

    if (analysis.relevantPages > 0) {
      allResults.push({
        ...book,
        ...analysis,
      });

      // 簡易表示
      if (Object.keys(analysis.regionMentions).length > 0) {
        const regions = Object.entries(analysis.regionMentions)
          .sort((a, b) => b[1].length - a[1].length)
          .slice(0, 5)
          .map(([r, m]) => `${r}(${m.length})`)
          .join(', ');
        console.log(`  地域: ${regions}`);
      }
      const kws = Object.entries(analysis.keywordCounts)
        .map(([k, c]) => `${k}(${c})`)
        .join(', ');
      console.log(`  KW: ${kws}`);
    }
  }

  // 全体集計
  console.log('\n' + '='.repeat(60));
  console.log('全書籍横断 地域別集計（芝居コンテキスト内での言及）');
  console.log('='.repeat(60));

  const totalRegions = {};
  for (const r of allResults) {
    for (const [region, mentions] of Object.entries(r.regionMentions)) {
      totalRegions[region] = (totalRegions[region] || 0) + mentions.length;
    }
  }
  for (const [region, count] of Object.entries(totalRegions).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${region}: ${count}件`);
  }

  console.log('\n=== 分析済み書籍の全文キーワード出現回数 ===');
  const totalKw = {};
  for (const r of allResults) {
    for (const [kw, count] of Object.entries(r.keywordCounts)) {
      totalKw[kw] = (totalKw[kw] || 0) + count;
    }
  }
  for (const [kw, count] of Object.entries(totalKw).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${kw}: ${count}回`);
  }

  // 保存
  mkdirSync('research', { recursive: true });
  writeFileSync('research/ndl_batch_analysis.json', JSON.stringify({
    collectedAt: new Date().toISOString(),
    description: 'NDL有望書籍のバッチ全文分析',
    booksAnalyzed: allResults.length,
    totalRegionMentions: totalRegions,
    results: allResults,
  }, null, 2), 'utf-8');
  console.log('\nSaved to research/ndl_batch_analysis.json');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
