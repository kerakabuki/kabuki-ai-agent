const BASE = process.argv[2] || 'https://kabuki-post-365.kerakabuki.workers.dev';
const TOKEN = process.argv[3] || '';
const headers = TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {};

const imgs = await fetch(`${BASE}/api/v1/images`, { headers }).then(r => r.json());
let withMeta = 0, withoutMeta = 0;
imgs.forEach(i => { if (i.visual_features) withMeta++; else withoutMeta++; });

console.log('合計:', imgs.length, '枚');
console.log('メタデータあり:', withMeta, '枚');
console.log('メタデータなし:', withoutMeta, '枚');
console.log();

if (withoutMeta > 0) {
  console.log('--- メタデータなし ---');
  imgs.filter(i => !i.visual_features).forEach(i =>
    console.log(`  id:${i.id} ${i.filename} | play: ${i.play_name || '(なし)'}`)
  );
}

console.log('\n--- サンプル（メタデータあり） ---');
imgs.filter(i => i.visual_features).slice(0, 5).forEach(i => {
  console.log(`  id:${i.id} ${i.filename}`);
  console.log(`    演目: ${i.play_name} | 場面: ${i.scene_type}`);
  console.log(`    特徴: ${i.visual_features}`);
});
