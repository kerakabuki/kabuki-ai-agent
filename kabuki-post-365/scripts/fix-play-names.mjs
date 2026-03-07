// Fix play_name for all images based on filename patterns
const BASE = 'https://kabuki-post-365.kerakabuki.workers.dev';
const TOKEN = '77b7691cf3fc092a74ec9e0e05cddca2';
const headers = { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

const imgs = await fetch(`${BASE}/api/v1/images`, { headers }).then(r => r.json());

for (const img of imgs) {
  let playName = img.play_name || '';

  // Fix: derive play_name from filename pattern
  if (img.filename.includes('曽我対面') || img.filename.includes('曽我')) {
    playName = '寿曽我対面';
  } else if (img.filename.includes('封印切')) {
    playName = '封印切';
  } else if (img.filename.includes('白浪五人男')) {
    playName = '白浪五人男';
  } else if (img.filename.includes('寿曽我対面')) {
    playName = '寿曽我対面';
  }

  // Also check known character names for 曽我対面
  const soga_chars = ['八幡', '化粧坂', '大磯虎御前', '小林朝比奈', '工藤祐経', '曽我五郎', '曽我兄弟', '曽我十郎', '近江'];
  if (soga_chars.some(c => img.filename.includes(c))) {
    playName = '寿曽我対面';
  }

  if (playName !== img.play_name) {
    console.log(`id:${img.id} ${img.filename} → ${playName}`);
    await fetch(`${BASE}/api/v1/images/${img.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        ...img,
        play_name: playName,
      }),
    });
  }
}

console.log('\n完了');
