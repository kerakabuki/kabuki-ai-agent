/**
 * NAVIの全演目キャストをPOST 365のcharactersにインポート
 * 既存キャラクターは重複チェック（name + related_play）
 */

const NAVI_BASE = 'https://kabukiplus.com';
const POST365_BASE = 'https://kabuki-post-365.kerakabuki.workers.dev';
const TOKEN = process.argv[2] || '';

if (!TOKEN) {
  console.error('Usage: node scripts/import-navi-cast.mjs <API_TOKEN>');
  process.exit(1);
}

const headers = { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

// Fetch existing POST 365 characters
const existing = await fetch(`${POST365_BASE}/api/v1/characters`, { headers }).then(r => r.json());
const existingSet = new Set(existing.map(c => `${c.name}|${c.related_play}`));
console.log(`既存キャラクター: ${existing.length}件\n`);

// Fetch NAVI catalog
const catalog = await fetch(`${NAVI_BASE}/api/enmoku/catalog`).then(r => r.json());

let imported = 0, skipped = 0, noImage = 0;

for (const item of catalog) {
  const data = await fetch(`${NAVI_BASE}/api/enmoku/${item.id}`).then(r => r.json());
  const cast = data.cast || [];
  const playTitle = item.short;

  for (const c of cast) {
    // Parse name and reading: "弁慶（べんけい）" → name: "弁慶", reading: "べんけい"
    const nameMatch = c.name.match(/^(.+?)(?:（(.+?)）)?$/);
    const name = nameMatch ? nameMatch[1].trim() : c.name;
    const reading = nameMatch ? (nameMatch[2] || '').trim() : '';

    // Skip if no image
    if (!c.image) {
      noImage++;
      continue;
    }

    // Check duplicate
    const key = `${name}|${playTitle}`;
    if (existingSet.has(key)) {
      // Update existing with NAVI image URL
      const match = existing.find(e => e.name === name && e.related_play === playTitle);
      if (match) {
        await fetch(`${POST365_BASE}/api/v1/characters/${match.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            ...match,
            navi_image_url: `${NAVI_BASE}${c.image}`,
            navi_enmoku_id: item.id,
            navi_cast_id: c.id,
          }),
        });
        console.log(`🔄 ${playTitle}/${name} — NAVI画像URL更新`);
      }
      skipped++;
      continue;
    }

    // Create new character
    const imageUrl = `${NAVI_BASE}${c.image}`;
    const body = {
      name,
      name_reading: reading,
      aliases: null,
      related_play: playTitle,
      description: c.desc || null,
      personality_tags: null,
      season_tags: '通年',
      related_characters: null,
      kabuki_navi_url: null,
      navi_image_url: imageUrl,
      navi_enmoku_id: item.id,
      navi_cast_id: c.id,
    };

    const res = await fetch(`${POST365_BASE}/api/v1/characters`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const result = await res.json();
    console.log(`✅ ${playTitle}/${name} → id:${result.id} | ${c.image}`);

    existingSet.add(key);
    imported++;
  }
}

console.log(`\n━━━ 完了 ━━━`);
console.log(`新規: ${imported}件`);
console.log(`スキップ: ${skipped}件`);
console.log(`画像なし: ${noImage}件`);
