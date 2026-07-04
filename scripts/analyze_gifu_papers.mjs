/**
 * 岐阜県の地芝居団体の研究状況を分析
 */
import { readFileSync } from 'fs';

const papers = JSON.parse(readFileSync('research/jishibai_papers_extended.json', 'utf-8'));
const groups = JSON.parse(readFileSync('jikabuki_groups.json', 'utf-8'));

// 岐阜県の団体一覧
const gifuGroups = groups.groups.filter(g => g.prefecture === '岐阜県');
console.log(`=== 岐阜県の地芝居団体数: ${gifuGroups.length} ===\n`);

// 各県の団体数
const prefGroupCount = {};
for (const g of groups.groups) {
  prefGroupCount[g.prefecture] = (prefGroupCount[g.prefecture] || 0) + 1;
}

// 岐阜県団体ごとの論文ヒット数
console.log('=== 岐阜県 団体別ヒット数 ===');
const gifuKeywords = new Set();
for (const g of gifuGroups) {
  const allKw = [g.name, g.venue, ...(g.keywords || [])].filter(Boolean);
  const matchedPapers = papers.papers.filter(p => allKw.includes(p.matchedQuery));

  // 明治座は東京の劇場のノイズが多いのでフラグ
  const isNoise = allKw.includes('明治座');
  const note = isNoise ? ' ⚠️ 東京明治座のノイズ含む' : '';

  console.log(`  ${g.name} (${allKw.join(', ')}): ${matchedPapers.length}件${note}`);
  for (const kw of allKw) gifuKeywords.add(kw);
}

// 全県の比較: 団体数 vs 論文数
console.log('\n=== 県別比較: 団体数 vs 論文数 ===');

// 全県の団体キーワードマップ
const prefPaperCount = {};
for (const g of groups.groups) {
  const allKw = [g.name, g.venue, ...(g.keywords || [])].filter(Boolean);
  const matched = papers.papers.filter(p => allKw.includes(p.matchedQuery));
  // 明治座ノイズ除外
  const filtered = allKw.includes('明治座')
    ? matched.filter(p => p.matchedQuery !== '明治座')
    : matched;
  prefPaperCount[g.prefecture] = (prefPaperCount[g.prefecture] || 0) + filtered.length;
}

const comparison = Object.entries(prefGroupCount)
  .map(([pref, groupCount]) => ({
    pref,
    groups: groupCount,
    papers: prefPaperCount[pref] || 0,
    ratio: ((prefPaperCount[pref] || 0) / groupCount).toFixed(1),
  }))
  .sort((a, b) => b.groups - a.groups);

console.log('  県名 | 団体数 | 論文数 | 1団体あたり');
console.log('  ' + '-'.repeat(45));
for (const { pref, groups, papers, ratio } of comparison) {
  console.log(`  ${pref.padEnd(6)} | ${String(groups).padStart(4)} | ${String(papers).padStart(4)} | ${ratio}`);
}

// 基本キーワード（地芝居、農村歌舞伎等）での岐阜関連論文
console.log('\n=== 基本キーワードでの岐阜関連論文 ===');
const baseKeywords = ['地芝居', '地歌舞伎', '農村歌舞伎', '素人歌舞伎', '村芝居', '芝居小屋 歌舞伎'];
const gifuRelated = papers.papers.filter(p => {
  if (!baseKeywords.includes(p.matchedQuery)) return false;
  // タイトルやキーワードに岐阜関連の語が含まれるか
  const text = [p.title, ...p.keywords, p.publisher || ''].join(' ');
  return text.includes('岐阜') || text.includes('美濃') || text.includes('飛騨') ||
         text.includes('東濃') || text.includes('中津川') || text.includes('恵那') ||
         text.includes('加子母') || text.includes('下呂');
});
console.log(`  岐阜関連: ${gifuRelated.length}件`);
for (const p of gifuRelated) {
  console.log(`  - [${p.publicationDate || '?'}] ${p.title}`);
  if (p.authors.length) console.log(`    著者: ${p.authors.join(', ')}`);
}
