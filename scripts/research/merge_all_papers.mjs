/**
 * CiNii + J-STAGE + NDL の3ソースを統合マージ
 * Usage: node scripts/merge_all_papers.mjs
 */

import { readFileSync, writeFileSync } from 'fs';

const cinii = JSON.parse(readFileSync('research/jishibai_papers_extended.json', 'utf-8'));
const jstage = JSON.parse(readFileSync('research/jstage_papers.json', 'utf-8'));
const ndl = JSON.parse(readFileSync('research/ndl_papers.json', 'utf-8'));

console.log(`CiNii:   ${cinii.uniqueCount}件`);
console.log(`J-STAGE: ${jstage.uniqueCount}件`);
console.log(`NDL:     ${ndl.uniqueCount}件`);
console.log(`合計:    ${cinii.uniqueCount + jstage.uniqueCount + ndl.uniqueCount}件（重複あり）\n`);

// 全論文にソース情報を付与
const all = [
  ...cinii.papers.map(p => ({ ...p, source: 'cinii' })),
  ...jstage.papers.map(p => ({ ...p, source: 'jstage' })),
  ...ndl.papers.map(p => ({ ...p, source: 'ndl' })),
];

// タイトル正規化
function normalize(t) {
  if (!t) return '';
  return t
    .replace(/[\s\u3000\u00A0]/g, '')     // 空白除去
    .replace(/[（）()【】\[\]「」『』]/g, '') // 括弧除去
    .replace(/[：:・、。,.]/g, '')          // 記号除去
    .replace(/\|\|/g, '')                  // NDLの区切り
    .toLowerCase();
}

// 重複排除（タイトルの類似度で判定）
const seen = new Map(); // normalizedTitle -> paper
const unique = [];

for (const p of all) {
  const key = normalize(p.title);
  if (!key || key.length < 3) continue;

  if (seen.has(key)) {
    // 既存エントリに情報を統合
    const existing = seen.get(key);
    if (!existing.sources) existing.sources = [existing.source];
    if (!existing.sources.includes(p.source)) {
      existing.sources.push(p.source);
    }
    // matchedQueryを統合
    if (p.matchedQuery) {
      if (!existing.allMatchedQueries) {
        existing.allMatchedQueries = [existing.matchedQuery].filter(Boolean);
      }
      if (!existing.allMatchedQueries.includes(p.matchedQuery)) {
        existing.allMatchedQueries.push(p.matchedQuery);
      }
    }
    // 足りない情報を補完
    if (!existing.doi && p.doi) existing.doi = p.doi;
    if (!existing.url && p.url) existing.url = p.url;
    if (!existing.description && p.description) existing.description = p.description;
    if ((!existing.authors || existing.authors.length === 0) && p.authors?.length > 0) {
      existing.authors = p.authors;
    }
    continue;
  }

  seen.set(key, p);
  unique.push(p);
}

console.log(`重複排除後: ${unique.length}件`);

// ソース別統計
const sourceStats = { cinii: 0, jstage: 0, ndl: 0, multi: 0 };
for (const p of unique) {
  const sources = p.sources || [p.source];
  if (sources.length > 1) {
    sourceStats.multi++;
  } else {
    sourceStats[sources[0]]++;
  }
}
console.log(`\n=== ソース別 ===`);
console.log(`  CiNiiのみ:   ${sourceStats.cinii}件`);
console.log(`  J-STAGEのみ: ${sourceStats.jstage}件`);
console.log(`  NDLのみ:     ${sourceStats.ndl}件`);
console.log(`  複数ソース:  ${sourceStats.multi}件`);

// ソート（新しい順）
unique.sort((a, b) => {
  const dateA = (a.publicationDate || '').replace(/[^\d-]/g, '').slice(0, 10);
  const dateB = (b.publicationDate || '').replace(/[^\d-]/g, '').slice(0, 10);
  return dateB.localeCompare(dateA);
});

// 団体別集計
const groups = JSON.parse(readFileSync('jikabuki_groups.json', 'utf-8'));
console.log('\n=== 団体別ヒット数（統合） ===');
const groupHits = [];
for (const g of groups.groups) {
  const allKw = [g.name, g.venue, ...(g.keywords || [])].filter(Boolean);
  const matched = unique.filter(p => {
    const queries = [p.matchedQuery, ...(p.allMatchedQueries || [])].filter(Boolean);
    return queries.some(q => allKw.includes(q));
  });
  groupHits.push({ name: g.name, prefecture: g.prefecture, count: matched.length });
}
// ヒットあるもの（多い順）
const withHits = groupHits.filter(g => g.count > 0).sort((a, b) => b.count - a.count);
const withoutHits = groupHits.filter(g => g.count === 0);
for (const g of withHits) {
  console.log(`  ${g.name} (${g.prefecture}): ${g.count}件`);
}
console.log(`\n  論文ヒットなし: ${withoutHits.length}団体`);
console.log(`  → ${withoutHits.map(g => g.name).join(', ')}`);

// 年代別
const decades = {};
for (const p of unique) {
  const year = (p.publicationDate || '').replace(/[^\d]/g, '').slice(0, 4);
  if (!year || year.length < 4) { decades['不明'] = (decades['不明'] || 0) + 1; continue; }
  const decade = year.slice(0, 3) + '0年代';
  decades[decade] = (decades[decade] || 0) + 1;
}
console.log('\n=== 年代別論文数 ===');
for (const [decade, count] of Object.entries(decades).sort()) {
  const bar = '█'.repeat(Math.ceil(count / 5));
  console.log(`  ${decade}: ${String(count).padStart(4)}件 ${bar}`);
}

// 著者別
const authorCount = {};
for (const p of unique) {
  for (const a of p.authors || []) {
    const name = a.replace(/,\s*/g, ' ').replace(/\s+/g, ' ').trim();
    if (name.length < 2) continue;
    authorCount[name] = (authorCount[name] || 0) + 1;
  }
}
console.log('\n=== 著者別論文数 (上位30) ===');
for (const [author, count] of Object.entries(authorCount).sort((a, b) => b[1] - a[1]).slice(0, 30)) {
  console.log(`  ${author}: ${count}件`);
}

// 県別集計
const prefCount = {};
for (const g of groups.groups) {
  const allKw = [g.name, g.venue, ...(g.keywords || [])].filter(Boolean);
  const matched = unique.filter(p => {
    const queries = [p.matchedQuery, ...(p.allMatchedQueries || [])].filter(Boolean);
    return queries.some(q => allKw.includes(q));
  });
  prefCount[g.prefecture] = (prefCount[g.prefecture] || 0) + matched.length;
}
const prefGroupCount = {};
for (const g of groups.groups) {
  prefGroupCount[g.prefecture] = (prefGroupCount[g.prefecture] || 0) + 1;
}
console.log('\n=== 県別: 団体数 vs 論文数 ===');
console.log('  県名     | 団体数 | 論文数 | 1団体あたり');
console.log('  ' + '-'.repeat(48));
for (const [pref, gCount] of Object.entries(prefGroupCount).sort((a, b) => b[1] - a[1])) {
  const pCount = prefCount[pref] || 0;
  const ratio = (pCount / gCount).toFixed(1);
  console.log(`  ${pref.padEnd(7)} | ${String(gCount).padStart(4)} | ${String(pCount).padStart(4)} | ${ratio}`);
}

// 保存
const output = {
  collectedAt: new Date().toISOString(),
  description: 'CiNii + J-STAGE + NDL 統合: 地芝居・地歌舞伎関連論文・資料',
  sources: {
    cinii: cinii.uniqueCount,
    jstage: jstage.uniqueCount,
    ndl: ndl.uniqueCount,
    totalBeforeMerge: cinii.uniqueCount + jstage.uniqueCount + ndl.uniqueCount,
  },
  uniqueCount: unique.length,
  sourceBreakdown: sourceStats,
  papers: unique,
};
writeFileSync('research/jishibai_papers_all.json', JSON.stringify(output, null, 2), 'utf-8');
console.log(`\nSaved to research/jishibai_papers_all.json`);
