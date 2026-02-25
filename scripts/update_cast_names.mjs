// cast_names のふりがな除去・端役追加を catalog.json に反映する
// Usage: node scripts/update_cast_names.mjs
import { writeFileSync } from "fs";

const BASE = "https://kerakabuki.kerakabuki.workers.dev";
const OUT = "__new_catalog.json";

// ふりがなパターン：（ひらがな・カタカナ・中点・長音符・スペースのみ）を削除
// 「弥陀六（実は平宗清）」など役注記（漢字含む）はそのまま残す
function stripFurigana(name) {
  return name.replace(/（[\u3040-\u30ff・ー\s]+）/g, "").trim();
}

// 端役・捕手など追加分（演目ID → 追加する役名の配列）
const EXTRA_ROLES = {
  terakoya:  ["捕手（約5人）", "子役（約6人）"],
  inasegawa: ["捕手（約5人）"],
};

const catRes = await fetch(`${BASE}/api/enmoku/catalog`);
const catalog = await catRes.json();

let updated = 0;
for (const entry of catalog) {
  const res = await fetch(`${BASE}/api/enmoku/${entry.id}`);
  if (!res.ok) continue;
  const data = await res.json();
  const castNames = data.cast_names || data.cast || [];
  if (castNames.length > 0) {
    const cleaned = castNames.map(c => stripFurigana(c.name || "")).filter(Boolean);
    const extras = EXTRA_ROLES[entry.id] || [];
    entry.cast_names = [...cleaned, ...extras];
    updated++;
  }
}

console.log(`cast_names 更新: ${updated}件`);
writeFileSync(OUT, JSON.stringify(catalog, null, 2), "utf8");
console.log(`Written to ${OUT}`);
