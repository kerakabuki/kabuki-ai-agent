/**
 * NAVIの演目キャスト画像をPOST 365のcharactersに同期
 * NAVI cast name ↔ POST 365 character name をマッチングし、navi_image_url を更新
 */

const NAVI_BASE = 'https://kabukiplus.com';
const POST365_BASE = 'https://kabuki-post-365.kerakabuki.workers.dev';
const TOKEN = process.argv[2] || '';

if (!TOKEN) {
  console.error('Usage: node scripts/sync-navi-images.mjs <API_TOKEN>');
  process.exit(1);
}

const headers = { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

// Fetch POST 365 characters
const characters = await fetch(`${POST365_BASE}/api/v1/characters`, { headers }).then(r => r.json());
console.log(`POST 365 キャラクター: ${characters.length}件\n`);

// Fetch NAVI catalog
const catalog = await fetch(`${NAVI_BASE}/api/enmoku/catalog`).then(r => r.json());
console.log(`NAVI 演目: ${catalog.length}件\n`);

// Build NAVI cast index: name → { image, enmokuId, castId, enmokuTitle }
const naviCast = [];
for (const item of catalog) {
  const data = await fetch(`${NAVI_BASE}/api/enmoku/${item.id}`).then(r => r.json());
  for (const c of (data.cast || [])) {
    if (!c.image) continue;
    // Extract name without reading: "弁慶（べんけい）" → "弁慶"
    const nameOnly = c.name.replace(/（.*?）/g, '').trim();
    naviCast.push({
      name: nameOnly,
      fullName: c.name,
      image: c.image,
      enmokuId: item.id,
      castId: c.id,
      play: item.short,
    });
  }
}
console.log(`NAVI キャスト画像: ${naviCast.length}件\n`);

// Match POST 365 characters to NAVI cast
let matched = 0;
for (const char of characters) {
  // Try to match by: character name, aliases, related_play
  const candidates = naviCast.filter(nc => {
    // Direct name match
    if (nc.name === char.name) return true;
    // Alias match
    if (char.aliases && char.aliases.split(',').some(a => a.trim() === nc.name)) return true;
    return false;
  });

  if (candidates.length === 0) {
    console.log(`❌ ${char.name}（${char.related_play}）→ マッチなし`);
    continue;
  }

  // Prefer match from same play
  let best = candidates.find(c => {
    // Check if the play matches
    return char.related_play && (
      c.play.includes(char.related_play) ||
      char.related_play.includes(c.play)
    );
  }) || candidates[0];

  const imageUrl = `${NAVI_BASE}${best.image}`;
  console.log(`✅ ${char.name}（${char.related_play}）→ ${best.play}/${best.name} | ${best.image}`);

  // Update character
  await fetch(`${POST365_BASE}/api/v1/characters/${char.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      ...char,
      navi_image_url: imageUrl,
      navi_enmoku_id: best.enmokuId,
      navi_cast_id: best.castId,
    }),
  });
  matched++;
}

console.log(`\n━━━ 完了 ━━━`);
console.log(`マッチ: ${matched}/${characters.length}件`);
