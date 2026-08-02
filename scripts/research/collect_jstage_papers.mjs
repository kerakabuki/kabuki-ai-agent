/**
 * J-STAGE APIから地芝居・地歌舞伎関連の論文を全文検索で収集
 * + 団体名でも検索してマージ
 *
 * Usage: node scripts/collect_jstage_papers.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const BASE_URL = 'https://api.jstage.jst.go.jp/searchapi/do';
const PER_PAGE = 20;
const DELAY_MS = 1500;
const OUTPUT_FILE = 'research/jstage_papers.json';

// 基本キーワード
const BASE_KEYWORDS = [
  '地芝居',
  '地歌舞伎',
  '農村歌舞伎',
  '素人歌舞伎',
  '村芝居',
  '地狂言',
];

// 団体データからキーワード抽出
function loadGroupKeywords() {
  const data = JSON.parse(readFileSync('jikabuki_groups.json', 'utf-8'));
  const keywords = new Set();
  for (const g of data.groups) {
    keywords.add(g.name);
    if (g.venue && g.venue.length >= 3) keywords.add(g.venue);
    for (const kw of g.keywords || []) {
      if (kw.length >= 3) keywords.add(kw);
    }
  }
  // 一般的すぎる語を除外
  const exclude = ['明治座', '祇園座', '常磐座', '坂東座'];
  return [...keywords].filter(k => !exclude.includes(k));
}

// XML パーサー
function parseJstageXml(text) {
  const totalMatch = text.match(/<opensearch:totalResults>(\d+)<\/opensearch:totalResults>/);
  const total = totalMatch ? parseInt(totalMatch[1]) : 0;

  const papers = [];
  const entries = text.split('<entry>').slice(1);

  for (const entry of entries) {
    const get = (tag) => {
      const m = entry.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`));
      return m ? m[1].trim() : null;
    };
    const getAll = (tag) => {
      return [...entry.matchAll(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'g'))].map(m => m[1].trim());
    };
    const getAttr = (tag, attr) => {
      const m = entry.match(new RegExp(`<${tag}[^>]*${attr}="([^"]+)"`));
      return m ? m[1] : null;
    };

    // タイトル（ja優先）
    const titleJa = (() => {
      const m = entry.match(/<article_title[^>]*xml:lang="ja"[^>]*>([^<]+)<\/article_title>/);
      return m ? m[1].trim() : null;
    })();
    const titleEn = (() => {
      const m = entry.match(/<article_title[^>]*xml:lang="en"[^>]*>([^<]+)<\/article_title>/);
      return m ? m[1].trim() : null;
    })();

    // 著者
    const authorsJa = [...entry.matchAll(/<author[^>]*xml:lang="ja"[^>]*>([^<]+)<\/author>/g)].map(m => m[1].trim());
    const authorsEn = [...entry.matchAll(/<author[^>]*xml:lang="en"[^>]*>([^<]+)<\/author>/g)].map(m => m[1].trim());

    // 雑誌名
    const journalJa = (() => {
      const m = entry.match(/<material_title[^>]*xml:lang="ja"[^>]*>([^<]+)<\/material_title>/);
      return m ? m[1].trim() : null;
    })();

    const paper = {
      title: titleJa || titleEn || get('title'),
      titleEn: titleEn,
      authors: authorsJa.length > 0 ? authorsJa : authorsEn,
      journal: journalJa || get('material_title'),
      volume: get('prism:volume'),
      number: get('prism:number'),
      startingPage: get('prism:startingPage'),
      publicationDate: get('pubyear'),
      doi: get('prism:doi'),
      url: getAttr('link', 'href'),
      source: 'jstage',
    };

    papers.push(paper);
  }

  return { total, papers };
}

// Fetch
async function fetchAllForQuery(query) {
  const params = new URLSearchParams({
    service: '3',
    text: query,
    count: PER_PAGE.toString(),
    start: '1',
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) return [];
  const text = await res.text();
  const { total, papers } = parseJstageXml(text);

  if (total === 0) return [];

  const allPapers = [...papers];
  const maxFetch = Math.min(total, 100);

  for (let start = PER_PAGE + 1; start <= maxFetch; start += PER_PAGE) {
    await new Promise(r => setTimeout(r, DELAY_MS));
    const params2 = new URLSearchParams({
      service: '3',
      text: query,
      count: PER_PAGE.toString(),
      start: start.toString(),
    });
    const res2 = await fetch(`${BASE_URL}?${params2}`);
    if (!res2.ok) break;
    const text2 = await res2.text();
    const page = parseJstageXml(text2);
    allPapers.push(...page.papers);
  }

  return allPapers;
}

async function main() {
  const groupKeywords = loadGroupKeywords();
  const allQueries = [...new Set([...BASE_KEYWORDS, ...groupKeywords])];
  console.log(`検索クエリ総数: ${allQueries.length}件\n`);

  const allPapers = [];
  const queryStats = [];

  for (let i = 0; i < allQueries.length; i++) {
    const q = allQueries[i];
    process.stdout.write(`[${i + 1}/${allQueries.length}] "${q}" ... `);

    try {
      const papers = await fetchAllForQuery(q);
      console.log(`${papers.length}件`);
      for (const p of papers) p.matchedQuery = q;
      allPapers.push(...papers);
      if (papers.length > 0) {
        queryStats.push({ query: q, count: papers.length });
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  console.log(`\n収集合計: ${allPapers.length}件`);

  // 重複排除（タイトル or DOI）
  const seen = new Set();
  const unique = [];
  for (const p of allPapers) {
    const key = p.doi || p.title || p.url;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(p);
  }
  console.log(`重複排除後: ${unique.length}件`);

  unique.sort((a, b) => (b.publicationDate || '').localeCompare(a.publicationDate || ''));

  mkdirSync('research', { recursive: true });
  const output = {
    collectedAt: new Date().toISOString(),
    description: 'J-STAGE全文検索による地芝居・地歌舞伎関連論文',
    searchQueries: allQueries.length,
    totalCollected: allPapers.length,
    uniqueCount: unique.length,
    queryStats: queryStats.sort((a, b) => b.count - a.count),
    papers: unique,
  };
  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\nSaved to ${OUTPUT_FILE}`);

  // サマリー
  console.log('\n=== ヒットしたクエリ TOP 20 ===');
  for (const { query, count } of queryStats.sort((a, b) => b.count - a.count).slice(0, 20)) {
    console.log(`  ${query}: ${count}件`);
  }

  const years = {};
  for (const p of unique) {
    const year = p.publicationDate || 'unknown';
    years[year] = (years[year] || 0) + 1;
  }
  console.log('\n=== 年別論文数 ===');
  for (const [year, count] of Object.entries(years).sort()) {
    console.log(`  ${year}: ${count}件`);
  }

  const authorCount = {};
  for (const p of unique) {
    for (const a of p.authors) {
      authorCount[a] = (authorCount[a] || 0) + 1;
    }
  }
  console.log('\n=== 著者別論文数 (上位20) ===');
  for (const [author, count] of Object.entries(authorCount).sort((a, b) => b[1] - a[1]).slice(0, 20)) {
    console.log(`  ${author}: ${count}件`);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
