/**
 * ブロマイド画像（ID 1-48）をPOST 365から削除
 * DB レコード + R2 ファイルを DELETE エンドポイント経由で削除
 */

const POST365_BASE = 'https://kabuki-post-365.kerakabuki.workers.dev';
const TOKEN = process.argv[2] || '';

if (!TOKEN) {
  console.error('Usage: node scripts/delete-bromides.mjs <API_TOKEN>');
  process.exit(1);
}

const headers = { 'Authorization': `Bearer ${TOKEN}` };

let deleted = 0, failed = 0;

for (let id = 1; id <= 48; id++) {
  try {
    const res = await fetch(`${POST365_BASE}/api/v1/images/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (res.ok) {
      console.log(`✅ id:${id} 削除完了`);
      deleted++;
    } else {
      const text = await res.text();
      console.log(`⚠️ id:${id} ${res.status} — ${text}`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ id:${id} エラー: ${err.message}`);
    failed++;
  }
}

console.log(`\n━━━ 完了 ━━━`);
console.log(`削除: ${deleted}件`);
console.log(`失敗: ${failed}件`);
