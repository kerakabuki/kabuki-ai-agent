// Check all NAVI enmoku cast images
const BASE = 'https://kabukiplus.com';

const catRes = await fetch(`${BASE}/api/enmoku/catalog`);
const catalog = await catRes.json();

let totalCast = 0;
let withImage = 0;
const results = [];

for (const item of catalog) {
  const res = await fetch(`${BASE}/api/enmoku/${item.id}`);
  const data = await res.json();
  const cast = data.cast || [];
  const imgCount = cast.filter(c => c.image).length;
  totalCast += cast.length;
  withImage += imgCount;
  if (cast.length > 0) {
    results.push({ play: item.short, id: item.id, cast: cast.length, images: imgCount });
  }
}

results.forEach(r => console.log(`${r.play}: ${r.cast}人, 画像${r.images}枚`));
console.log('---');
console.log(`合計: ${totalCast}人, 画像あり: ${withImage}枚`);
