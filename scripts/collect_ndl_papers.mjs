/**
 * 国立国会図書館 SRU APIから地芝居・地歌舞伎関連の資料を収集
 * NDLはCiNii/J-STAGEにない書籍・報告書・地方資料も含む
 *
 * Usage: node scripts/collect_ndl_papers.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const BASE_URL = 'https://ndlsearch.ndl.go.jp/api/sru';
const PER_PAGE = 50;
const DELAY_MS = 2000;
const OUTPUT_FILE = 'research/ndl_papers.json';

const KEYWORDS = [
  '地芝居',
  '地歌舞伎',
  '農村歌舞伎',
  '村芝居',
  '芝居小屋',
  '素人歌舞伎',
  '地狂言',
  '回り舞台',
];

// 団体名で特に有望なもの（CiNii/J-STAGEでヒットした団体 + 岐阜県の主要団体）
function loadGroupKeywords() {
  const data = JSON.parse(readFileSync('jikabuki_groups.json', 'utf-8'));
  const keywords = [];
  for (const g of data.groups) {
    // 団体名（一般的すぎる名前は除外）
    const exclude = ['明治座', '祇園座', '常磐座', '坂東座', '松神会'];
    if (!exclude.includes(g.name) && g.name.length >= 4) {
      keywords.push(g.name);
    }
    // 会場名も有望なもの
    if (g.venue && g.venue.length >= 3 && !exclude.includes(g.venue)) {
      keywords.push(g.venue);
    }
  }
  return [...new Set(keywords)];
}

// XML パーサー（recordDataはHTMLエスケープされたXML）
function parseNdlXml(text) {
  const totalMatch = text.match(/<numberOfRecords>(\d+)<\/numberOfRecords>/);
  const total = totalMatch ? parseInt(totalMatch[1]) : 0;

  const papers = [];
  const records = text.split('<recordData>').slice(1);

  for (let rec of records) {
    // recordDataの中身はHTMLエスケープされている
    rec = rec.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');

    const get = (tag) => {
      const patterns = [
        new RegExp(`<dcterms:${tag}[^>]*>([^<]+)</dcterms:${tag}>`),
        new RegExp(`<dc:${tag}[^>]*>([^<]+)</dc:${tag}>`),
        new RegExp(`<dcndl:${tag}[^>]*>([^<]+)</dcndl:${tag}>`),
      ];
      for (const p of patterns) {
        const m = rec.match(p);
        if (m) return m[1].trim();
      }
      return null;
    };

    const getAll = (tag) => {
      const results = [];
      for (const ns of ['dcterms', 'dc', 'dcndl']) {
        const pattern = new RegExp(`<${ns}:${tag}[^>]*>([^<]+)</${ns}:${tag}>`, 'g');
        for (const m of rec.matchAll(pattern)) {
          results.push(m[1].trim());
        }
      }
      return results;
    };

    // タイトル: dcterms:title が最もクリーン
    const title = get('title');
    // 著者
    const creators = [...new Set(getAll('creator'))];
    // 日付
    const issued = get('issued') || get('date');
    // 出版者
    const publisher = get('publisher');
    // 説明
    const descriptions = getAll('description');
    // 主題
    const subjects = getAll('subject');
    // materialType
    const typeMatch = rec.match(/materialType[^>]*rdfs:label="([^"]+)"/);
    const materialType = typeMatch ? typeMatch[1] : null;
    // URL
    const urlMatch = rec.match(/BibAdminResource[^>]*rdf:about="([^"]+)"/);
    const url = urlMatch ? urlMatch[1] : null;

    if (title) {
      papers.push({
        title,
        authors: creators,
        publicationDate: issued,
        publisher,
        materialType,
        description: descriptions.filter(d => !d.startsWith('type :')).join('; ') || null,
        subjects,
        url,
        source: 'ndl',
      });
    }
  }

  return { total, papers };
}

async function fetchAllForKeyword(keyword) {
  const query = `title="${keyword}"`;
  const params = new URLSearchParams({
    operation: 'searchRetrieve',
    query,
    maximumRecords: PER_PAGE.toString(),
    startRecord: '1',
    recordSchema: 'dcndl',
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) return [];
  const text = await res.text();
  const { total, papers } = parseNdlXml(text);

  if (total === 0) return [];

  const allPapers = [...papers];
  const maxFetch = Math.min(total, 200);

  for (let start = PER_PAGE + 1; start <= maxFetch; start += PER_PAGE) {
    await new Promise(r => setTimeout(r, DELAY_MS));
    const params2 = new URLSearchParams({
      operation: 'searchRetrieve',
      query,
      maximumRecords: PER_PAGE.toString(),
      startRecord: start.toString(),
      recordSchema: 'dcndl',
    });
    const res2 = await fetch(`${BASE_URL}?${params2}`);
    if (!res2.ok) break;
    const text2 = await res2.text();
    const page = parseNdlXml(text2);
    allPapers.push(...page.papers);
  }

  return allPapers;
}

async function main() {
  const groupKeywords = loadGroupKeywords();
  const allQueries = [...new Set([...KEYWORDS, ...groupKeywords])];
  console.log(`検索クエリ総数: ${allQueries.length}件\n`);

  const allPapers = [];
  const queryStats = [];

  for (let i = 0; i < allQueries.length; i++) {
    const q = allQueries[i];
    process.stdout.write(`[${i + 1}/${allQueries.length}] "${q}" ... `);

    try {
      const papers = await fetchAllForKeyword(q);
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

  // 重複排除
  const normalize = (t) => (t || '').replace(/[\s\u3000]/g, '').replace(/[（）()【】\[\]]/g, '').toLowerCase();
  const seen = new Set();
  const unique = [];
  for (const p of allPapers) {
    const key = normalize(p.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(p);
  }
  console.log(`重複排除後: ${unique.length}件`);

  unique.sort((a, b) => (b.publicationDate || '').localeCompare(a.publicationDate || ''));

  mkdirSync('research', { recursive: true });
  const output = {
    collectedAt: new Date().toISOString(),
    description: '国立国会図書館SRU API: 地芝居・地歌舞伎関連資料',
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
  for (const { query, count } of queryStats.slice(0, 20)) {
    console.log(`  ${query}: ${count}件`);
  }

  // CiNii/J-STAGEにない可能性が高い資料タイプ
  console.log('\n=== NDLならではの資料（書籍・報告書等） ===');
  const bookLike = unique.filter(p => {
    const desc = (p.description || '').toLowerCase();
    const title = (p.title || '').toLowerCase();
    return desc.includes('報告') || desc.includes('調査') || title.includes('報告') ||
           title.includes('調査') || title.includes('資料') || title.includes('記録');
  });
  console.log(`  調査報告・資料系: ${bookLike.length}件`);
  for (const p of bookLike.slice(0, 15)) {
    console.log(`  - [${p.publicationDate || '?'}] ${p.title}`);
    if (p.authors.length) console.log(`    著者: ${p.authors.join(', ')}`);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
