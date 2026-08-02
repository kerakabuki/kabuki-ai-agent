/**
 * CiNii Research APIから地芝居・地歌舞伎関連の論文メタデータを収集
 * Usage: node scripts/collect_jishibai_papers.mjs
 */

const QUERY = '地芝居 OR 地歌舞伎';
const PER_PAGE = 20;
const BASE_URL = 'https://cir.nii.ac.jp/opensearch/articles';
const OUTPUT_FILE = 'research/jishibai_papers.json';

import { writeFileSync, mkdirSync } from 'fs';

function parseAtomXml(text) {
  const papers = [];
  // totalResults
  const totalMatch = text.match(/<opensearch:totalResults>(\d+)<\/opensearch:totalResults>/);
  const total = totalMatch ? parseInt(totalMatch[1]) : 0;

  // Split entries
  const entries = text.split('<entry>').slice(1);

  for (const entry of entries) {
    const get = (tag) => {
      const m = entry.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`));
      return m ? m[1].trim() : null;
    };

    const getAll = (tag) => {
      const matches = [...entry.matchAll(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'g'))];
      return matches.map(m => m[1].trim());
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

    // DOI
    const doiMatch = entry.match(/datatype="cir:DOI">([^<]+)</);
    if (doiMatch) paper.doi = doiMatch[1];

    papers.push(paper);
  }

  return { total, papers };
}

async function fetchPage(start) {
  const params = new URLSearchParams({
    q: QUERY,
    count: PER_PAGE.toString(),
    start: start.toString(),
    format: 'atom',
  });
  const url = `${BASE_URL}?${params}`;
  console.log(`Fetching: start=${start}...`);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const text = await res.text();
  return parseAtomXml(text);
}

async function main() {
  // First fetch to get total
  const first = await fetchPage(1);
  console.log(`Total papers: ${first.total}`);

  const allPapers = [...first.papers];

  // Fetch remaining pages
  for (let start = PER_PAGE + 1; start <= first.total; start += PER_PAGE) {
    // Rate limit: be polite to CiNii
    await new Promise(r => setTimeout(r, 1000));
    const page = await fetchPage(start);
    allPapers.push(...page.papers);
  }

  console.log(`Collected: ${allPapers.length} papers`);

  // Deduplicate by title
  const seen = new Set();
  const unique = allPapers.filter(p => {
    if (!p.title || seen.has(p.title)) return false;
    seen.add(p.title);
    return true;
  });
  console.log(`Unique: ${unique.length} papers`);

  // Sort by date (newest first)
  unique.sort((a, b) => (b.publicationDate || '').localeCompare(a.publicationDate || ''));

  // Output
  mkdirSync('research', { recursive: true });
  const output = {
    query: QUERY,
    collectedAt: new Date().toISOString(),
    totalFromApi: first.total,
    uniqueCount: unique.length,
    papers: unique,
  };
  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`Saved to ${OUTPUT_FILE}`);

  // Summary stats
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
  console.log('\n=== 著者別論文数 (上位10) ===');
  const topAuthors = Object.entries(authorCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
  for (const [author, count] of topAuthors) {
    console.log(`  ${author}: ${count}件`);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
