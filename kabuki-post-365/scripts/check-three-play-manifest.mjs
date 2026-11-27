import fs from 'node:fs/promises';
import {build} from 'esbuild';
if(!process.argv[2])throw Error('Usage: node scripts/check-three-play-manifest.mjs <reviewed-manifest.json>');
await fs.mkdir('.cache',{recursive:true});
await build({entryPoints:['./src/lib/three-plays.ts'],bundle:true,platform:'node',format:'esm',outfile:'.cache/check-three-plays.mjs'});
const {parseThreePlayManifest}=await import('../.cache/check-three-plays.mjs');
const m=parseThreePlayManifest(await fs.readFile(process.argv[2],'utf8'));
console.log(JSON.stringify({valid:true,revision:m.revision,startDate:m.startDate,photos:m.photos.length,slots:Object.fromEntries(['moritunajinya','yamashinakankyo','kirareyosa'].map(id=>[id,{morning:m.photos.filter(p=>p.playId===id&&p.kind==='portrait').length,evening:m.photos.filter(p=>p.playId===id&&p.kind==='stage').length}]))}));
// Structural validation only. This does not confer permission or execute a Worker/SNS API.
