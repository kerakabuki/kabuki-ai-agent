// catalog.json を全フィールド込みで再構築するマスタースクリプト
// Usage: node scripts/rebuild_catalog.mjs
import { writeFileSync } from "fs";

const BASE = "https://kerakabuki.kerakabuki.workers.dev";
const OUT = "__new_catalog.json";

// ── ふりがな除去（漢字を含む役注記は保持）──
function stripFurigana(name) {
  return name.replace(/（[\u3040-\u30ff・ー\s]+）/g, "").trim();
}

// ── 除外する役名（演目ID → 除外する名前の配列）──
const EXCLUDE_ROLES = {
  kumagaijinya: ["平敦盛"],
};

// ── 端役・捕手など（演目ID → 追加役名の配列）──
const EXTRA_ROLES = {
  sushiya:              ["家来（2～4名）", "捕手（2～4名）"],
  iseondo:              ["仲居（2～4名）", "次郎助", "若衆（2～4名）"],
  inasegawa:            ["捕手（6名以上）"],
  gionichiriki:         ["女中（2～4名）", "駕籠（2名）", "三人侍（3名）※全編やる場合"],
  yamashinakankyo:      ["下女おりん"],
  yamazakikaido:        ["猪"],
  ashikagayakata:       ["家来（2～4名）", "大名（2～4名）", "茶坊主", "見附の侍"],
  terakoya:             ["捕手（4名以上）", "寺子（子役4名以上）", "百姓（4名以上）", "駕籠（2名）"],
  moritunajinya:        ["家来（2名以上）"],
  kirareyosa:           ["およし", "権助"],
  sendaihagi:           ["小槙", "腰元（2～4名）", "嘉藤太"],
  sogataimen:           ["大名（2～4名）"],
  adachigaharasandanme: ["家来（2～4名）"],
  takiba:               ["次郎", "八"],
  taikoukijudanme:      ["家来（2～4名）"],
  hamamatsuya:          ["手代（2～4名）", "丁稚（子役）", "按摩"],
  fuuinkiri:            ["女中（2～4名）"],
  nozakimura:           ["駕籠屋（2名）", "船頭", "下女お芳"],
  kanpeiharakiri:       ["猟師（3名）", "駕籠屋（2名）"],
  kumagaijinya:         ["堤軍次", "梶原景高", "百姓（2～4名）", "家来（2～4名）"],
};

// ── cast_count（端役込みの最小必要人数）──
const CAST_COUNT = {
  sushiya:              12,  // 8 + 2（家来） + 2（捕手）
  iseondo:              14,  // 9 + 2（仲居） + 1（次郎助） + 2（若衆）
  inasegawa:            11,  // 5 + 6
  gionichiriki:         12,  // 5 + 2 + 2 + 3
  yamashinakankyo:       7,  // 6 + 1
  yamazakikaido:         5,  // 4 + 1（猪）
  ashikagayakata:       12,  // 6 + 2（家来） + 2（大名） + 1（茶坊主） + 1（見附の侍）
  terakoya:             22,  // 8 + 4 + 4 + 4（百姓） + 2（駕籠）
  moritunajinya:        14,  // 12 + 2
  kirareyosa:            6,  // 4 + 1（およし） + 1（権助）
  sendaihagi:           12,  // 8 + 1（小槙） + 2（腰元） + 1（嘉藤太）
  sogataimen:           14,  // 12 + 2
  adachigaharasandanme:  9,  // 7 + 2
  takiba:                7,  // 5 + 2
  taikoukijudanme:       9,  // 7 + 2
  hamamatsuya:          11,  // 7 + 2（手代） + 1（丁稚） + 1（按摩）
  fuuinkiri:             7,  // 5 + 2
  nozakimura:            9,  // 5 + 2（駕籠屋） + 1（船頭） + 1（下女お芳）
  kanpeiharakiri:       12,  // 7 + 3（猟師） + 2（駕籠屋）
  kumagaijinya:         12,  // 6（敦盛除く） + 1（堤軍次） + 1（梶原景高） + 2（百姓） + 2（家来）
};

// ── duration_min（気良歌舞伎実績、分）──
const DURATION = {
  sushiya:               90,
  iseondo:               90,
  inasegawa:             15,
  gionichiriki:          80,
  yamashinakankyo:       90,
  yamazakikaido:         30,
  ashikagayakata:        45,
  terakoya:             100,
  moritunajinya:        100,
  kirareyosa:            70,
  sendaihagi:           100,
  sogataimen:            45,
  adachigaharasandanme:  90,
  takiba:                70,
  taikoukijudanme:       70,
  hamamatsuya:           60,
  fuuinkiri:             70,
  nozakimura:            70,
  kanpeiharakiri:        90,
  kumagaijinya:          90,
};

// ── 子役が必要な演目 ──
const HAS_KODOMO = new Set([
  "terakoya", "moritunajinya", "sendaihagi", "adachigaharasandanme", "hamamatsuya", "sushiya",
]);

// ── catalog.json を取得して更新 ──
const catRes = await fetch(`${BASE}/api/enmoku/catalog`);
const catalog = await catRes.json();

let castUpdated = 0;
for (const entry of catalog) {
  const res = await fetch(`${BASE}/api/enmoku/${entry.id}`);
  if (!res.ok) {
    // APIフェッチ失敗時も既存のcast_namesをオブジェクト形式から文字列形式に変換する
    if (Array.isArray(entry.cast_names)) {
      const excludes = EXCLUDE_ROLES[entry.id] || [];
      const cleaned = entry.cast_names
        .map(c => (typeof c === "string" ? c : stripFurigana(c.name || "")))
        .filter(n => n && !excludes.includes(n));
      const extras = EXTRA_ROLES[entry.id] || [];
      entry.cast_names = [...cleaned, ...extras];
    }
    if (CAST_COUNT[entry.id] != null) entry.cast_count = CAST_COUNT[entry.id];
    if (entry.cast_count == null && Array.isArray(entry.cast_names)) entry.cast_count = entry.cast_names.length;
    if (DURATION[entry.id] != null) entry.duration_min = DURATION[entry.id];
    entry.has_kodomo = HAS_KODOMO.has(entry.id);
    castUpdated++;
    continue;
  }
  const data = await res.json();
  const castNames = data.cast_names || data.cast || [];

  // cast_names: ふりがな除去 + 除外 + 端役追加
  const excludes = EXCLUDE_ROLES[entry.id] || [];
  const cleaned = castNames
    .map(c => stripFurigana(c.name || ""))
    .filter(n => n && !excludes.includes(n));
  const extras = EXTRA_ROLES[entry.id] || [];
  entry.cast_names = [...cleaned, ...extras];

  // cast_count
  if (CAST_COUNT[entry.id] != null) {
    entry.cast_count = CAST_COUNT[entry.id];
  }
  // cast_count が未設定の場合は cast_names 数を使う
  if (entry.cast_count == null) {
    entry.cast_count = entry.cast_names.length;
  }

  // duration_min
  if (DURATION[entry.id] != null) entry.duration_min = DURATION[entry.id];

  // has_kodomo
  entry.has_kodomo = HAS_KODOMO.has(entry.id);

  castUpdated++;
}

console.log(`更新: ${castUpdated}件`);
writeFileSync(OUT, JSON.stringify(catalog, null, 2), "utf8");
console.log(`Written to ${OUT}`);
