import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { build } from 'esbuild';
import { Miniflare } from 'miniflare';

await fs.mkdir('.cache', { recursive: true });
await build({ entryPoints: ['./src/index.ts'], bundle: true, format: 'esm', platform: 'browser', outfile: '.cache/test-crosspost-catchup.mjs' });
const mf = new Miniflare({
  modules: true, scriptPath: '.cache/test-crosspost-catchup.mjs', compatibilityDate: '2026-02-11',
  d1Databases: ['DB'], r2Buckets: ['R2'], kvNamespaces: ['KV'],
  bindings: { API_TOKEN: 'test' },
  outboundService: () => { throw Error('Crosspost catch-up test must not call a social API'); }
});

try {
  const db = await mf.getD1Database('DB');
  for (const name of (await fs.readdir('migrations')).filter(x => x.endsWith('.sql')).sort()) {
    if (name === '0006_allow_multiple_posts_per_day.sql')
      await db.prepare('ALTER TABLE posts ADD COLUMN quiz_answer_comment TEXT').run();
    const sql = (await fs.readFile(`migrations/${name}`, 'utf8')).replace(/--[^\n]*/g, '');
    for (const statement of sql.split(';').map(x => x.trim()).filter(Boolean))
      await db.prepare(statement).run();
  }
  const day = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  const api = (route, method = 'GET', body) => mf.dispatchFetch(`http://localhost/api/v1/${route}`, {
    method, headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  await db.prepare("UPDATE settings SET value=? WHERE key='crosspost_start_date'").bind(day).run();
  await db.prepare("INSERT INTO images(id,filename,r2_key,verified,privacy_excluded,play_name,scene_type) VALUES(9001,'test.jpg','test.jpg',1,0,'曽根崎心中','舞台')").run();
  const ids = [];
  for (let n = 0; n < 4; n++) {
    const response = await api('posts', 'POST', {
      post_date: day, day_of_week: 1, theme: 'test', image_id: 9001,
      instagram_text: '公開済み本文', facebook_text: 'FB本文', x_text: 'X本文'
    });
    assert.equal(response.status, 201);
    const id = (await response.json()).id;
    ids.push(id);
    await db.prepare("UPDATE posts SET instagram_posted=1,ig_media_id=?,ig_permalink=?,published_caption='公開済み本文',published_media_key='test.jpg' WHERE id=?")
      .bind(`media-${id}`, `https://www.instagram.com/p/source${id}/`, id).run();
    for (const platform of ['facebook', 'x'])
      await db.prepare('INSERT INTO crossposts(post_id,platform) VALUES(?,?)').bind(id, platform).run();
  }
  const queue = async () => {
    const response = await api('crossposts/queue');
    assert.equal(response.status, 200);
    return response.json();
  };
  const start = (id, platform) => api(`crossposts/${id}/${platform}/start`, 'POST', { caption: '確認済み本文' });
  const finish = (id, platform, status = 'published') => api(`crossposts/${id}/${platform}/result`, 'POST', {
    status, ...(status === 'published'
      ? { permalink: platform === 'x' ? `https://x.com/KeraKabuki/status/${id}` : `https://www.facebook.com/kerakabuki/posts/${id}` }
      : { error: '公開結果を確認できない' })
  });
  let state = await queue();
  assert(state.platforms.every(p => p.daily_limit === null && p.remaining_today === null && p.next.post_id === ids[0]));
  assert.equal((await start(ids[1], 'facebook')).status, 409, 'oldest-first order stays enforced');
  assert.equal((await start(ids[0], 'facebook')).status, 200);
  assert.equal((await start(ids[1], 'facebook')).status, 409, 'publishing lock stays enforced');
  assert.equal((await finish(ids[0], 'facebook')).status, 200);
  for (const id of ids.slice(1)) {
    state = await queue();
    assert.equal(state.platforms[0].next.post_id, id);
    assert.equal(state.platforms[0].blocked_reason, null);
    assert.equal((await start(id, 'facebook')).status, 200);
    assert.equal((await finish(id, 'facebook')).status, 200);
  }
  assert.equal((await start(ids[0], 'x')).status, 200);
  assert.equal((await finish(ids[0], 'x', 'uncertain')).status, 200);
  state = await queue();
  assert.equal(state.platforms[1].blocked_reason, 'needs_review');
  assert.equal(state.platforms[1].next, null);
  assert.equal((await start(ids[1], 'x')).status, 409, 'uncertain result blocks all later X posts');
  assert.equal((await finish(ids[0], 'x')).status, 200);
  for (const id of ids.slice(1)) {
    assert.equal((await start(id, 'x')).status, 200);
    assert.equal((await finish(id, 'x')).status, 200);
  }
  state = await queue();
  assert(state.platforms.every(p => p.backlog_count === 0 && p.next === null && p.blocked_reason === null));
  assert(state.platforms.every(p => p.published_today.length === 4));
  console.log('Crosspost catch-up: oldest-first, 4 per platform, publishing lock and uncertain hold passed');
} finally {
  await mf.dispose();
}
