/**
 * 既存 theaters_registry に新しい芝居小屋を追加するスクリプト
 * 既存データは __tmp_theaters.json (UTF-16 LE) から読み込む
 * 新しいデータは __new_theaters.json (UTF-8) から読み込む
 */
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

// 既存データ読み込み（UTF-16 LE）
const bytes = readFileSync("__tmp_theaters.json");
const rawUtf16 = bytes.toString("utf16le").replace(/^\uFEFF/, "").trim();

let data;
try {
  data = JSON.parse(rawUtf16);
  console.log(`既存データ読み込み完了: ${data.theaters.length}件`);
} catch (e) {
  console.error("既存データのパースエラー:", e.message);
  process.exit(1);
}

// 新しい芝居小屋データ読み込み（UTF-8）
const newTheaters = JSON.parse(readFileSync("__new_theaters.json", "utf8"));
console.log(`新規追加対象: ${newTheaters.length}件`);

// マージ
let added = 0, updated = 0;
const now = new Date().toISOString();

for (const t of newTheaters) {
  t.updated_at = now;
  const idx = data.theaters.findIndex((x) => x.id === t.id);
  if (idx >= 0) {
    data.theaters[idx] = { ...data.theaters[idx], ...t };
    console.log(`✏️  更新: ${t.name}`);
    updated++;
  } else {
    data.theaters.push(t);
    console.log(`➕ 追加: ${t.name}`);
    added++;
  }
}

// UTF-8 (BOMなし) で保存
const json = JSON.stringify(data, null, 2);
writeFileSync("__tmp_theaters_new.json", json, "utf8");
console.log(`\n保存完了: 合計${data.theaters.length}件 (追加:${added} 更新:${updated})`);

// KVに書き込み
console.log("KVに書き込み中...");
execSync(
  'npx wrangler kv key put --binding CHAT_HISTORY "theaters_registry" --path "__tmp_theaters_new.json"',
  { stdio: "inherit" }
);
console.log("✅ KV書き込み完了！");
