/**
 * 地芝居・地歌舞伎関連の論文を拡張収集
 * - 基本キーワード（地芝居, 地歌舞伎, 農村歌舞伎, 素人歌舞伎, 芝居小屋）
 * - 94団体の名称・会場名
 * - 関連研究者名
 *
 * Usage: node scripts/collect_jishibai_papers_extended.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const BASE_URL = 'https://cir.nii.ac.jp/opensearch/articles';
const PER_PAGE = 20;
const OUTPUT_FILE = 'research/jishibai_papers_extended.json';
const DELAY_MS = 1500; // CiNiiに優しく

// ---- 基本キーワード ----
const BASE_KEYWORDS = [
  '地芝居',
  '地歌舞伎',
  '農村歌舞伎',
  '素人歌舞伎',
  '村芝居',
  '地狂言',
  '芝居小屋 歌舞伎',
  '回り舞台 農村',
  '曳山 歌舞伎',
];

// ---- 団体データからキーワード抽出 ----
function loadGroupKeywords() {
  const data = JSON.parse(readFileSync('jikabuki_groups.json', 'utf-8'));
  const keywords = new Set();
  for (const g of data.groups) {
    // 団体名
    keywords.add(g.name);
    // 会場名（空でなければ）
    if (g.venue) keywords.add(g.venue);
    // keywords配列
    for (const kw of g.keywords || []) {
      keywords.add(kw);
    }
  }
  // 一般的すぎるものを除外（「祇園座」等は残す）
  return [...keywords].filter(k => k.length >= 3);
}

// ---- XML パーサー ----
function parseAtomXml(text) {
  const papers = [];
  const totalMatch = text.match(/<opensearch:totalResults>(\d+)<\/opensearch:totalResults>/);
  const total = totalMatch ? parseInt(totalMatch[1]) : 0;

  const entries = text.split('<entry>').slice(1);
  for (const entry of entries) {
    const get = (tag) => {
      const m = entry.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`));
      return m ? m[1].trim() : null;
    };
    const getAll = (tag) => {
      return [...entry.matchAll(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'g'))].map(m => m[1].trim());
    };
    const getLink = () => {
      const m = entry.match(/<link[^>]*href="([^"]+)"[^>]*type="text\/html"/);
      return m ? m[1] : null;
    };

    const paper = {
      title: get('title'),
      authors: getAll('name'),
      publisher: get('dc:publisher'),
      publicationName: get('prism:publicationName'),
      volume: get('prism:volume'),
      number: get('prism:number'),
      startingPage: get('prism:startingPage'),
      publicationDate: get('prism:publicationDate'),
      keywords: getAll('dc:subject'),
      url: getLink(),
    };
    const doiMatch = entry.match(/datatype="cir:DOI">([^<]+)</);
    if (doiMatch) paper.doi = doiMatch[1];
    papers.push(paper);
  }
  return { total, papers };
}

// ---- Fetch ----
async function fetchAllForQuery(query) {
  const params = new URLSearchParams({
    q: query, count: PER_PAGE.toString(), start: '1', format: 'atom',
  });
  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) return [];
  const text = await res.text();
  const { total, papers } = parseAtomXml(text);

  if (total === 0) return [];

  const allPapers = [...papers];
  // 上限100件（団体名で大量ヒットは稀、大量の場合はノイズの可能性）
  const maxFetch = Math.min(total, 100);
  for (let start = PER_PAGE + 1; start <= maxFetch; start += PER_PAGE) {
    await new Promise(r => setTimeout(r, DELAY_MS));
    const params2 = new URLSearchParams({
      q: query, count: PER_PAGE.toString(), start: start.toString(), format: 'atom',
    });
    const res2 = await fetch(`${BASE_URL}?${params2}`);
    if (!res2.ok) break;
    const text2 = await res2.text();
    const page = parseAtomXml(text2);
    allPapers.push(...page.papers);
  }

  return allPapers;
}

// ---- メイン ----
async function main() {
  const groupKeywords = loadGroupKeywords();
  console.log(`団体関連キーワード: ${groupKeywords.length}件`);

  const allQueries = [...BASE_KEYWORDS, ...groupKeywords];
  // 重複排除
  const uniqueQueries = [...new Set(allQueries)];
  console.log(`検索クエリ総数: ${uniqueQueries.length}件\n`);

  const allPapers = [];
  const queryStats = [];

  for (let i = 0; i < uniqueQueries.length; i++) {
    const q = uniqueQueries[i];
    process.stdout.write(`[${i + 1}/${uniqueQueries.length}] "${q}" ... `);

    try {
      const papers = await fetchAllForQuery(q);
      console.log(`${papers.length}件`);
      // タグ付け: どのクエリでヒットしたか
      for (const p of papers) {
        p.matchedQuery = q;
      }
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

  // タイトル+URLで重複排除
  const seen = new Set();
  const unique = [];
  for (const p of allPapers) {
    const key = p.title || p.url || JSON.stringify(p);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(p);
  }
  console.log(`重複排除後: ${unique.length}件`);

  // ソート（新しい順）
  unique.sort((a, b) => (b.publicationDate || '').localeCompare(a.publicationDate || ''));

  // 保存
  mkdirSync('research', { recursive: true });
  const output = {
    collectedAt: new Date().toISOString(),
    description: '地芝居・地歌舞伎関連論文（拡張検索）',
    searchQueries: uniqueQueries.length,
    totalCollected: allPapers.length,
    uniqueCount: unique.length,
    queryStats: queryStats.sort((a, b) => b.count - a.count),
    papers: unique,
  };
  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\nSaved to ${OUTPUT_FILE}`);

  // ---- サマリー ----
  console.log('\n=== ヒットしたクエリ TOP 20 ===');
  for (const { query, count } of queryStats.sort((a, b) => b.count - a.count).slice(0, 20)) {
    console.log(`  ${query}: ${count}件`);
  }

  const years = {};
  for (const p of unique) {
    const year = p.publicationDate?.slice(0, 4) || 'unknown';
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
  const topAuthors = Object.entries(authorCount).sort((a, b) => b[1] - a[1]).slice(0, 20);
  for (const [author, count] of topAuthors) {
    console.log(`  ${author}: ${count}件`);
  }

  // 県別集計（matchedQueryから推定）
  const groups = JSON.parse(readFileSync('jikabuki_groups.json', 'utf-8'));
  const prefMap = {};
  for (const g of groups.groups) {
    for (const kw of [g.name, g.venue, ...(g.keywords || [])]) {
      if (kw) prefMap[kw] = g.prefecture;
    }
  }
  const prefCount = {};
  for (const p of unique) {
    const pref = prefMap[p.matchedQuery];
    if (pref) {
      prefCount[pref] = (prefCount[pref] || 0) + 1;
    }
  }
  if (Object.keys(prefCount).length > 0) {
    console.log('\n=== 県別論文数（団体名ヒット分） ===');
    for (const [pref, count] of Object.entries(prefCount).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${pref}: ${count}件`);
    }
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
