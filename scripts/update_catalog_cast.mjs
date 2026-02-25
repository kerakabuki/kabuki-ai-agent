// cast_count の修正と has_kodomo フラグを catalog.json に反映する
// Usage: node scripts/update_catalog_cast.mjs
import { writeFileSync } from "fs";

const BASE = "https://kerakabuki.kerakabuki.workers.dev";
const OUT = "__new_catalog.json";

// cast_count の手動修正値（端役含む実際の必要人数）
const CAST_OVERRIDES = {
  inasegawa: 10,  // 稲瀬川勢揃い（捕手含む）
  terakoya:  19,  // 寺子屋（捕手5名＋子役6名追加）
};

// 子役が必要な演目
const HAS_KODOMO = new Set([
  "terakoya",             // 寺子屋（菅秀才・小太郎・よだれくり・寺子たち）
  "moritunajinya",        // 盛綱陣屋（小四郎・小三郎）
  "sendaihagi",           // 先代萩（千松・鶴千代）
  "adachigaharasandanme", // 袖萩祭文（お君）
]);

const catRes = await fetch(`${BASE}/api/enmoku/catalog`);
const catalog = await catRes.json();

let castFixed = 0, kodomoAdded = 0;
for (const entry of catalog) {
  if (CAST_OVERRIDES[entry.id] != null) {
    entry.cast_count = CAST_OVERRIDES[entry.id];
    castFixed++;
  }
  if (HAS_KODOMO.has(entry.id)) {
    entry.has_kodomo = true;
    kodomoAdded++;
  }
}

console.log(`cast_count 修正: ${castFixed}件, has_kodomo 追加: ${kodomoAdded}件`);
writeFileSync(OUT, JSON.stringify(catalog, null, 2), "utf8");
console.log(`Written to ${OUT}`);
