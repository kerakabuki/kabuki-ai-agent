// 各演目 JSON の cast_names 数を catalog.json に cast_count として追加する
// Usage: node scripts/add_cast_count_to_catalog.mjs
import { writeFileSync } from "fs";

const BASE = "https://kerakabuki.kerakabuki.workers.dev";
const OUT = "__new_catalog.json";

const catRes = await fetch(`${BASE}/api/enmoku/catalog`);
const catalog = await catRes.json();

let updated = 0;
for (const entry of catalog) {
  const res = await fetch(`${BASE}/api/enmoku/${entry.id}`);
  if (!res.ok) continue;
  const data = await res.json();
  const castNames = data.cast_names || data.cast || [];
  if (castNames.length > 0) {
    entry.cast_count = castNames.length;
    updated++;
  }
}

console.log(`catalog entries: ${catalog.length}, cast_count added: ${updated}`);
writeFileSync(OUT, JSON.stringify(catalog, null, 2), "utf8");
console.log(`Written to ${OUT}`);
