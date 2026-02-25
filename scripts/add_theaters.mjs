/**
 * 地歌舞伎かわら版 掲載芝居小屋を theaters_registry に追加するスクリプト
 * 情報源:
 *   かしも明治座  : https://meijiza.jp/
 *   美濃歌舞伎博物館 相生座 : http://nakasendou.jp/aioiza/
 *   村国座       : https://www.city.kakamigahara.lg.jp/kankobunka/1010039/murakuniza/
 */

import { execSync } from "child_process";
import { writeFileSync } from "fs";

// ── 現在の theaters_registry を取得 ────────────────────────────────────────
const raw = execSync(
  'npx wrangler kv key get --binding CHAT_HISTORY "theaters_registry"',
  { encoding: "utf8" }
);
const data = JSON.parse(raw);
console.log(`現在の芝居小屋数: ${data.theaters.length}`);

// ── 追加する芝居小屋データ ──────────────────────────────────────────────────
const newTheaters = [
  {
    id: "kashimo_meijiza",
    name: "かしも明治座",
    name_kana: "かしもめいじざ",
    location: "岐阜県中津川市加子母4793-2",
    description:
      "明治27年（1894年）建築の木造芝居小屋。岐阜県指定有形民俗文化財。本花道・仮花道・すっぽん・廻り舞台（人力）・二階席（コの字型）を備える本格的な農村芝居小屋。加子母歌舞伎の本拠地として毎年公演が行われ、中村七之助が名誉館主を務める。楽屋の壁には十八代目中村勘三郎らの落し書きが残る。",
    has_hanamichi: true,
    has_mawari_butai: true,
    has_suppon: true,
    capacity: null,
    cultural_property: "岐阜県指定有形民俗文化財",
    visitable: true,
    has_parking: true,
    parking_note: "駐車場あり",
    access_info: "TEL: 0573-79-3611 / 開館時間 10:00〜16:00 / 月曜休館（月曜祝日の場合は翌日）",
    latitude: 35.5196,
    longitude: 137.4969,
    website: "https://meijiza.jp/",
    registered_by: "admin",
    updated_at: new Date().toISOString(),
  },
  {
    id: "aioiza",
    name: "美濃歌舞伎博物館 相生座",
    name_kana: "みのかぶきはくぶつかん あいおいざ",
    location: "岐阜県瑞浪市日吉町8004-25",
    description:
      "明治27年（1894年）着工・翌年完成の「相生座」と、明治初期に名古屋・大曽根から旧恵那郡明智町に移築された「常盤座」を合体復元し、昭和51年（1976年）に誕生した芝居小屋。江戸末期から明治・大正・昭和の歌舞伎衣裳・かつら・小道具約4,000点を収蔵。市川猿之助（現猿翁）・中村勘三郎らも公演を行った。毎年9月の長月公演を開催。美濃歌舞伎保存会が運営。入館料300円・要予約。",
    has_hanamichi: true,
    has_mawari_butai: true,
    has_suppon: true,
    capacity: null,
    cultural_property: null,
    visitable: true,
    has_parking: false,
    access_info: "TEL: 0572-68-0205 / 開館時間 10:00〜16:00 / 月曜休館・要予約 / 最寄り駅: JR瑞浪駅（タクシー片道約4,000円）",
    latitude: 35.3695,
    longitude: 137.4066,
    website: "http://nakasendou.jp/aioiza/",
    registered_by: "admin",
    updated_at: new Date().toISOString(),
  },
  {
    id: "murakuniza",
    name: "村国座",
    name_kana: "むらくにざ",
    location: "岐阜県各務原市各務おがせ町3-46-1（村国神社境内）",
    description:
      "明治初期に建設された農村歌舞伎舞台。廻り舞台を備え、130年以上が経過した黒光りする木の柱や板張りの客席・大きな梁の小屋組みなど、江戸時代の農村芝居の姿をよく伝える。国の重要有形民俗文化財に指定。子供歌舞伎も盛んに行われている。平成の大修理を経て保存。",
    has_hanamichi: true,
    has_mawari_butai: true,
    has_suppon: false,
    capacity: null,
    cultural_property: "国指定重要有形民俗文化財",
    visitable: true,
    has_parking: true,
    parking_note: "無料駐車場 普通車80台（大型バス利用可）",
    access_info: "TEL: 058-370-7144 / 岐阜県各務原市各務おがせ町3-46-1 / 名古屋から約1時間30分・岐阜市から約40分",
    latitude: 35.4273,
    longitude: 136.8584,
    registered_by: "admin",
    updated_at: new Date().toISOString(),
  },
];

// ── マージ（既存エントリは上書き、新規は追加）─────────────────────────────
let addedCount = 0;
let updatedCount = 0;

for (const t of newTheaters) {
  const idx = data.theaters.findIndex((x) => x.id === t.id);
  if (idx >= 0) {
    data.theaters[idx] = { ...data.theaters[idx], ...t };
    updatedCount++;
    console.log(`✏️  更新: ${t.name}`);
  } else {
    data.theaters.push(t);
    addedCount++;
    console.log(`➕ 追加: ${t.name}`);
  }
}

// ── KV に書き込み ───────────────────────────────────────────────────────────
const json = JSON.stringify(data);
writeFileSync("__tmp_theaters_new.json", json, "utf8");

console.log("\n__tmp_theaters_new.json を確認してから以下のコマンドでKVに書き込みます...");
execSync(
  'npx wrangler kv key put --binding CHAT_HISTORY "theaters_registry" --path __tmp_theaters_new.json',
  { stdio: "inherit" }
);

console.log(`\n✅ 完了: ${addedCount}件追加 / ${updatedCount}件更新 / 合計${data.theaters.length}件`);
