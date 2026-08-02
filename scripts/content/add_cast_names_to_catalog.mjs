// 各演目 JSON の cast_names（名前のみ）を catalog.json に追加する
// Usage: node scripts/add_cast_names_to_catalog.mjs
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
    // 名前のみの文字列配列として格納
    entry.cast_names = castNames.map(function(c) { return c.name || ""; }).filter(Boolean);
    updated++;
  }
}

console.log(`cast_names 追加: ${updated}件`);
writeFileSync(OUT, JSON.stringify(catalog, null, 2), "utf8");
console.log(`Written to ${OUT}`);
