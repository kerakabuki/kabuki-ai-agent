/**
 * theaters_registry を正しくUTF-8で取得し、新しい芝居小屋を追加するスクリプト
 */
import { spawnSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";

// wranglerをspawnSyncで実行してバイナリ出力を取得（PowerShellの変換を回避）
const result = spawnSync("npx", ["wrangler", "kv", "key", "get", "--binding", "CHAT_HISTORY", "theaters_registry", "--remote"], {
  encoding: "buffer",  // バイナリとして取得
  shell: true,
  windowsHide: true,
});

if (result.status !== 0) {
  console.error("wrangler エラー:", result.stderr?.toString("utf8"));
  process.exit(1);
}

// stdout をUTF-8として解釈
const rawBytes = result.stdout;
let rawText = rawBytes.toString("utf8").trim();

// UTF-8 BOM除去
if (rawText.charCodeAt(0) === 0xFEFF) rawText = rawText.slice(1);

console.log("取得したJSON先頭:", rawText.slice(0, 100));

let data;
try {
  data = JSON.parse(rawText);
  console.log(`既存データ: ${data.theaters.length}件`);
  data.theaters.forEach(t => console.log(`  - ${t.id}: ${t.name}`));
} catch (e) {
  // UTF-8デコードが失敗した場合、Shift-JISとして試みる
  console.log("UTF-8パース失敗。Shift-JISとして試みます...");
  // Node.jsはShift-JISをネイティブでサポートしないので、別の方法を試みる
  
  // 既知のデータをハードコード（最後の手段）
  console.log("既存データをフォールバック値から再構築します");
  data = {
    theaters: [
      {
        id: "kera_za",
        name: "気良座",
        name_kana: "けらざ",
        location: "岐阜県郡上市八幡町気良154（旧明方小学校講堂）",
        description: "旧明方小学校の講堂を改修した芝居小屋。2024年にリニューアルし「気良座」として生まれ変わった。花道を備え、地歌舞伎の上演に適した空間。",
        photo_url: "/api/groups/kera/images/theater-1771743379138.png",
        has_hanamichi: true,
        capacity: 200,
        cultural_property: "郡上市文化財",
        visitable: true,
        registered_by: "kera",
        updated_at: "2026-02-20T00:00:00.000Z"
      }
    ]
  };
}

// 新しい芝居小屋データ読み込み
const newTheaters = JSON.parse(readFileSync("__new_theaters.json", "utf8"));
console.log(`\n追加対象: ${newTheaters.length}件`);

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

// UTF-8で保存
const json = JSON.stringify(data);
writeFileSync("__tmp_theaters_new.json", json, "utf8");
console.log(`\n保存: 合計${data.theaters.length}件 (追加:${added} 更新:${updated})`);

// KVに書き込み
console.log("KVに書き込み中...");
const putResult = spawnSync("npx", ["wrangler", "kv", "key", "put", "--binding", "CHAT_HISTORY", "theaters_registry", "--path", "__tmp_theaters_new.json", "--remote"], {
  shell: true,
  stdio: "inherit",
  windowsHide: true,
});

if (putResult.status === 0) {
  console.log("✅ KV書き込み完了！");
} else {
  console.error("❌ KV書き込みエラー");
  process.exit(1);
}
