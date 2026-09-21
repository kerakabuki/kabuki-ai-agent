import { createRequire } from 'node:module';
import { readFile, mkdir, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const require = createRequire(process.env.RECEPTION_DEPS || resolve('kabuki-post-365/package.json'));
const { Miniflare } = require('miniflare');
const { build } = require('esbuild');
export async function runtime({ persist = false } = {}) {
  await mkdir('.reception-build', { recursive: true });
  await build({ entryPoints: ['worker.js'], outfile: '.reception-build/worker.mjs', bundle: true, format: 'esm', platform: 'browser', target: 'es2022', logLevel: 'warning' });
  const mf = new Miniflare({
    modules: true, scriptPath: resolve('.reception-build/worker.mjs'), compatibilityDate: '2026-09-21',
    kvNamespaces: ['CHAT_HISTORY'], d1Databases: ['RECEPTION_DB'], r2Buckets: ['ASSETS_BUCKET', 'CONTENT_BUCKET', 'ENMOKU_BUCKET', 'QUIZ_BUCKET'],
    bindings: { RECEPTION_PREVIEW: '1' },
    ...(persist ? { d1Persist: resolve('.reception-preview-state'), kvPersist: resolve('.reception-preview-kv') } : {}),
  });
  const db = await mf.getD1Database('RECEPTION_DB');
  await db.prepare('CREATE TABLE IF NOT EXISTS local_reception_migrations (name TEXT PRIMARY KEY)').run();
  for (const file of (await readdir('migrations/reception')).filter(f=>f.endsWith('.sql')).sort()) {
    if (await db.prepare('SELECT name FROM local_reception_migrations WHERE name=?').bind(file).first()) continue;
    const sql=await readFile('migrations/reception/'+file,'utf8');
    await db.batch([...sql.split(';').map(x=>x.trim()).filter(Boolean).map(statement=>db.prepare(statement)),db.prepare('INSERT INTO local_reception_migrations (name) VALUES (?)').bind(file)]);
  }
  const kv = await mf.getKVNamespace('CHAT_HISTORY');
  // ローカルの架空アカウントのみ。本番コードに認証の迂回は設けない。
  await kv.put('session:local-manager', JSON.stringify({ userId: 'local-manager', displayName: '動作確認用の担当者' }));
  await kv.put('session:local-member', JSON.stringify({ userId: 'local-member', displayName: '動作確認用の一般メンバー' }));
  await kv.put('session:other-manager', JSON.stringify({ userId: 'other-manager' }));
  await kv.put('group_members:kera', JSON.stringify([{ userId: 'local-manager', role: 'manager' }, { userId: 'local-member', role: 'member' }]));
  await kv.put('group_members:other', JSON.stringify([{ userId: 'other-manager', role: 'manager' }]));
  return { mf, db, kv };
}
