import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { receptionGifts, GIFT_OBJECT_PREFIX, shiranamiCardSVG } from '../src/reception_gifts.js';
const require = createRequire(process.env.RECEPTION_CARD_DEPS || resolve('package.json'));
const sharp = require('sharp');
const root = 'assets/reception/2026/shiranami';
await mkdir(root + '/cards', { recursive: true });
const manifest = [];
for (const gift of receptionGifts) {
  const source = await readFile(`${root}/source/${gift.id}.jpg`);
  const svg = shiranamiCardSVG('data:image/jpeg;base64,' + source.toString('base64'));
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  const thumb = await sharp(png).resize({ width: 180 }).webp({ quality: 80 }).toBuffer();
  const preview = await sharp(png).resize({ width: 480 }).webp({ quality: 86 }).toBuffer();
  await writeFile(`${root}/cards/${gift.id}.svg`, svg);
  for (const [suffix, bytes, type] of [['.png', png, 'image/png'], ['-thumb.webp', thumb, 'image/webp'], ['-preview.webp', preview, 'image/webp']]) {
    const file = `${root}/cards/${gift.id}${suffix}`;
    await writeFile(file, bytes);
    manifest.push({ id: gift.id, file, key: `${GIFT_OBJECT_PREFIX}/${gift.id}${suffix}`, type, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
}
await writeFile(`${root}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ files: manifest.length, totalBytes: manifest.reduce((n,a) => n+a.bytes,0), cards: manifest.filter(x=>x.type==='image/png').map(x=>({ id:x.id,bytes:x.bytes })) }, null, 2));
