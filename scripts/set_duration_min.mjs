// 前セッションで入力した上演時間データを duration_min として enmoku JSON と catalog.json に反映する
// Usage: node scripts/set_duration_min.mjs
import { writeFileSync } from "fs";

const BASE = "https://kerakabuki.kerakabuki.workers.dev";
const OUT = "__new_catalog.json";

// 前セッションで入力した値（演目ID -> duration_min 分）
const DURATIONS = {
  sushiya:           90,  // すし屋
  iseondo:           90,  // 伊勢音頭・油屋
  inasegawa:         15,  // 稲瀬川勢揃い
  gionichiriki:      80,  // 祇園一力茶屋
  yamashinakankyo:   90,  // 九段目・山科閑居
  yamazakikaido:     30,  // 五段目・山崎街道
  ashikagayakata:    45,  // 三段目・足利館門前進物
  terakoya:         100,  // 寺子屋
  moritunajinya:    100,  // 盛綱陣屋
  kirareyosa:        70,  // 切られ与三
  sendaihagi:       100,  // 先代萩
  sogataimen:        45,  // 曽我対面
  adachigaharasandanme: 90, // 袖萩祭文
  takiba:            70,  // 瀧場
  taikoukijudanme:   70,  // 尼崎閑居
  hamamatsuya:       60,  // 浜松屋
  fuuinkiri:         70,  // 封印切
  nozakimura:        70,  // 野崎村
  kanpeiharakiri:    90,  // 六段目・勘平腹切
  kumagaijinya:      90,  // 熊谷陣屋
};

// catalog.json を取得して duration_min を追加し、内容を stdout に出力
const catRes = await fetch(`${BASE}/api/enmoku/catalog`);
const catalog = await catRes.json();

let updatedCount = 0;
for (const entry of catalog) {
  const dur = DURATIONS[entry.id];
  if (dur != null) {
    entry.duration_min = dur;
    updatedCount++;
  }
}

console.log(`catalog entries: ${catalog.length}, duration_min added: ${updatedCount}`);
writeFileSync(OUT, JSON.stringify(catalog, null, 2), "utf8");
console.log(`Written to ${OUT}`);
