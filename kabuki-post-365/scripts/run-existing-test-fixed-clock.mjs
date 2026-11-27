// Executes an unchanged existing test body with only a Worker-side clock injected.
// Original source is preserved. This resolves its dependency on the current feed hour.
import fs from 'node:fs/promises';
const original=await fs.readFile('scripts/test-instagram.mjs','utf8');
const day=new Date(Date.now()+32400000).toISOString().slice(0,10);
const time=Date.parse(day+'T00:00:00Z');
const clock=`const OriginalDate=globalThis.Date;globalThis.Date=class extends OriginalDate{constructor(...args){if(args.length)super(...args);else super(${time});}static now(){return ${time};}};`;
const adapted=original.replace("outfile:'.cache/test-worker.mjs'",`outfile:'.cache/test-worker-fixed-clock.mjs',banner:{js:${JSON.stringify(clock)}}`)
 .replace("scriptPath:'.cache/test-worker.mjs'","scriptPath:'.cache/test-worker-fixed-clock.mjs'");
await fs.writeFile('scripts/.test-instagram-fixed-clock.mjs',adapted);
await import('./.test-instagram-fixed-clock.mjs');
