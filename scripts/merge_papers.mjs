/**
 * CiNiiとJ-STAGEの論文データをマージして統合分析
 */
import { readFileSync, writeFileSync } from 'fs';

const cinii = JSON.parse(readFileSync('research/jishibai_papers_extended.json', 'utf-8'));
const jstage = JSON.parse(readFileSync('research/jstage_papers.json', 'utf-8'));

console.log(`CiNii: ${cinii.uniqueCount}件`);
console.log(`J-STAGE: ${jstage.uniqueCount}件`);

// マージ
const all = [
  ...cinii.papers.map(p => ({ ...p, source: 'cinii' })),
  ...jstage.papers.map(p => ({ ...p, source: 'jstage' })),
];

// タイトルで重複排除（正規化して比較）
const normalize = (t) => (t || '').replace(/[\s\u3000]/g, '').replace(/[（）()]/g, '').toLowerCase();
const seen = new Map();
const unique = [];
for (const p of all) {
  const key = normalize(p.title);
  if (!key || seen.has(key)) {
    // 既存エントリにソース情報を追加
    if (key && seen.has(key)) {
      const existing = seen.get(key);
      if (!existing.sources) existing.sources = [existing.source];
      if (!existing.sources.includes(p.source)) existing.sources.push(p.source);
      // matchedQueryも統合
      if (p.matchedQuery && existing.matchedQuery !== p.matchedQuery) {
        if (!existing.matchedQueries) existing.matchedQueries = [existing.matchedQuery];
        if (!existing.matchedQueries.includes(p.matchedQuery)) existing.matchedQueries.push(p.matchedQuery);
      }
    }
    continue;
  }
  seen.set(key, p);
  unique.push(p);
}

console.log(`マージ後（重複排除）: ${unique.length}件`);

// 明治座ノイズ除外（タイトルに「地芝居」「歌舞伎」「芝居小屋」「農村」「村芝居」等が含まれないものを除外）
const relevantKeywords = ['芝居', '歌舞伎', '農村', '曳山', '祭', '舞台', '劇場', '座', '民俗', '伝統', '芸能', '演劇', '人形', '浄瑠璃', '狂言'];
const filtered = unique.filter(p => {
  if (p.matchedQuery === '明治座') {
    const text = [p.title, ...(p.keywords || [])].join(' ');
    return relevantKeywords.some(kw => text.includes(kw));
  }
  return true;
});
console.log(`ノイズ除去後: ${filtered.length}件`);

filtered.sort((a, b) => (b.publicationDate || '').localeCompare(a.publicationDate || ''));

// 保存
const output = {
  collectedAt: new Date().toISOString(),
  description: 'CiNii + J-STAGE 統合: 地芝居・地歌舞伎関連論文',
  ciniiCount: cinii.uniqueCount,
  jstageCount: jstage.uniqueCount,
  mergedUniqueCount: filtered.length,
  papers: filtered,
};
writeFileSync('research/jishibai_papers_merged.json', JSON.stringify(output, null, 2), 'utf-8');
console.log('\nSaved to research/jishibai_papers_merged.json');

// ---- 統合サマリー ----
// 両方にある論文
const bothSources = filtered.filter(p => p.sources && p.sources.length > 1);
console.log(`\n両方のDBにある論文: ${bothSources.length}件`);
console.log(`CiNiiのみ: ${filtered.filter(p => p.source === 'cinii' && (!p.sources || p.sources.length === 1)).length}件`);
console.log(`J-STAGEのみ: ${filtered.filter(p => p.source === 'jstage' && (!p.sources || p.sources.length === 1)).length}件`);

// 年別
const years = {};
for (const p of filtered) {
  const year = (p.publicationDate || 'unknown').slice(0, 4);
  years[year] = (years[year] || 0) + 1;
}
console.log('\n=== 年代別論文数 ===');
const decades = {};
for (const [year, count] of Object.entries(years)) {
  if (year === 'unknown') { decades['不明'] = count; continue; }
  const decade = year.slice(0, 3) + '0年代';
  decades[decade] = (decades[decade] || 0) + count;
}
for (const [decade, count] of Object.entries(decades).sort()) {
  console.log(`  ${decade}: ${count}件`);
}

// 著者
const authorCount = {};
for (const p of filtered) {
  for (const a of p.authors || []) {
    const name = a.replace(/,\s*/g, ' ').trim();
    authorCount[name] = (authorCount[name] || 0) + 1;
  }
}
console.log('\n=== 著者別論文数 (上位20) ===');
for (const [author, count] of Object.entries(authorCount).sort((a, b) => b[1] - a[1]).slice(0, 20)) {
  console.log(`  ${author}: ${count}件`);
}

// 団体別ヒット（J-STAGEで新たに見つかった団体）
const groups = JSON.parse(readFileSync('jikabuki_groups.json', 'utf-8'));
console.log('\n=== 団体別ヒット数（統合） ===');
for (const g of groups.groups) {
  const allKw = [g.name, g.venue, ...(g.keywords || [])].filter(Boolean);
  const matched = filtered.filter(p => {
    const queries = [p.matchedQuery, ...(p.matchedQueries || [])];
    return queries.some(q => allKw.includes(q));
  });
  if (matched.length > 0) {
    console.log(`  ${g.name} (${g.prefecture}): ${matched.length}件`);
  }
}
