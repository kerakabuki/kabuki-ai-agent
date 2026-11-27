import { readFile, writeFile } from 'node:fs/promises';
// assets/kera-ogp-v1.jpg を base64 にして src/kera_ogp_image.js に書き出す（worker が /kerakabuki/ogp-v1.jpg で配信する）
const jpg = await readFile('assets/kera-ogp-v1.jpg');
await writeFile('src/kera_ogp_image.js', '// 気良歌舞伎の共有画像（OGP 1200×630 JPEG）。気良座の入口の写真に紋と名称を重ねたもの。\nexport const keraOgpJPEG = ' + JSON.stringify(jpg.toString('base64')) + ';\n');
console.log(JSON.stringify({ bytes: jpg.length, width: 1200, height: 630 }));
