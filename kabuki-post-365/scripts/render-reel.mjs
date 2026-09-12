import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {pathToFileURL} from 'node:url';
const exec=promisify(execFile);
const FFMPEG=process.env.FFMPEG_PATH||'ffmpeg',FFPROBE=process.env.FFPROBE_PATH||'ffprobe';
export function safeSubtitle(s,max=44){
  return Array.from(String(s||'').replace(/[{}\\\r\n]/g,' ').replace(/https?:\/\/\S+/g,'').trim()).slice(0,max).join('');
}
function wrap(s,width=19){const a=Array.from(s);return a.slice(0,width).join('')+(a.length>width?'\\N'+a.slice(width,width*2).join(''):'');}
async function run(args,cwd){
  try{return await exec(FFMPEG,['-hide_banner','-loglevel','error','-y',...args],{cwd,timeout:180000,maxBuffer:2e6,windowsHide:true});}
  catch(e){throw new Error(`FFmpeg failed: ${String(e.stderr||e.message).slice(-1200)}`);}
}
export async function probe(file){const {stdout}=await exec(FFPROBE,['-v','error','-show_streams','-show_format','-of','json',file],{windowsHide:true});return JSON.parse(stdout);}
function ass(title,subtitles,duration){
 const end=`0:00:${duration.toFixed(2).padStart(5,'0')}`;
 const cues=subtitles.map((line,i)=>{
  const time=n=>`0:00:${n.toFixed(2).padStart(5,'0')}`;
  const clean=safeSubtitle(line,80),short=Array.from(clean).length>38?Array.from(clean).slice(0,36).join('')+'…':clean;
  return `Dialogue: 0,${time(i*duration/subtitles.length)},${time((i+1)*duration/subtitles.length)},Body,,0,0,0,,${wrap(short)}`;
 }).join('\n');
 return `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Title,Noto Sans CJK JP,55,&H00262018,&H000000FF,&H00EEE8DF,&H00000000,1,0,0,0,100,100,1,0,1,1,0,8,70,70,115,1
Style: Body,Noto Sans CJK JP,44,&H00262018,&H000000FF,&H00EEE8DF,&H00000000,0,0,0,0,100,100,1,0,1,1,0,2,70,70,260,1
Style: Brand,Noto Sans CJK JP,29,&H006B6258,&H000000FF,&H00EEE8DF,&H00000000,0,0,0,0,100,100,1,0,1,0,0,2,70,70,195,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,${end},Title,,0,0,0,,${wrap(safeSubtitle(title,32),16)}
${cues}
Dialogue: 0,0:00:00.00,${end},Brand,,0,0,0,,YouTube 気良歌舞伎
`;
}
export async function renderReel(manifest,photoPaths,bgmPath,dir){
 if(![1,2,3].includes(photoPaths.length))throw Error('1〜3枚の写真が必要です');
 const duration=({1:12,2:16,3:20})[photoPaths.length],segment=duration/photoPaths.length;
 const pieces=String(manifest.caption||'').split(/(?<=[。！？])|\n/).map(x=>x.trim()).filter(x=>x&&!x.startsWith('#')&&!/^https?:/.test(x));
 const lines=[];
 for(let i=0;i<pieces.length;i++){
  let line=pieces[i];if(Array.from(line).length<9&&i+1<pieces.length)line+=pieces[++i];lines.push(line);
 }
 await fs.mkdir(dir,{recursive:true});
 for(let i=0;i<photoPaths.length;i++){
  await fs.copyFile(photoPaths[i],path.join(dir,`photo${i}.jpg`));
  const subtitles=photoPaths.length===1&&lines.length?lines.slice(0,3):[lines[i]||manifest.photos[i]?.caption||'気良歌舞伎'];
  await fs.writeFile(path.join(dir,`text${i}.ass`),ass(manifest.title,subtitles,segment),'utf8');
  const frames=Math.round(segment*30);
  await run(['-i',`photo${i}.jpg`,'-vf',`scale=1040:1320:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:'260+(1320-ih)/2':color=0xEEE8DF,zoompan=z='min(1+on*0.000045,1.014)':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=${frames}:s=1080x1920:fps=30,subtitles=text${i}.ass,format=yuv420p`,
   '-frames:v',String(frames),'-c:v','libx264','-preset','veryfast','-crf','22','-threads','2','-an',`clip${i}.mp4`],dir);
 }
 await fs.writeFile(path.join(dir,'concat.txt'),photoPaths.map((_,i)=>`file 'clip${i}.mp4'`).join('\n'));
 await fs.copyFile(bgmPath,path.join(dir,'bgm.mp3'));
 await run(['-f','concat','-safe','0','-i','concat.txt','-stream_loop','-1','-i','bgm.mp3',
  '-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','160k',
  '-af',`loudnorm=I=-18:TP=-2:LRA=11,afade=t=in:d=0.4,afade=t=out:st=${duration-0.7}:d=0.7`,
  '-t',String(duration),'-movflags','+faststart','reel.mp4'],dir);
 await run(['-i','reel.mp4','-frames:v','1','-q:v','3','cover.jpg'],dir);
 const video=path.join(dir,'reel.mp4'),cover=path.join(dir,'cover.jpg');
 const info=await probe(video),v=info.streams.find(x=>x.codec_type==='video'),a=info.streams.find(x=>x.codec_type==='audio');
 if(v?.width!==1080||v?.height!==1920||v?.codec_name!=='h264'||a?.codec_name!=='aac'
  ||Math.abs(Number(info.format.duration)-duration)>0.15||Number(info.format.size)>40000000)throw Error('動画の形式検証に失敗しました');
 return {video,cover,info};
}
async function auth(){
 if(process.env.KP365_API_TOKEN)return process.env.KP365_API_TOKEN;
 if(!process.env.ACTIONS_ID_TOKEN_REQUEST_URL||!process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN)throw Error('Renderer credentials unavailable');
 const u=new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL);u.searchParams.set('audience','kabuki-post-365-render');
 const r=await fetch(u,{headers:{Authorization:`Bearer ${process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}`}});
 if(!r.ok)throw Error(`OIDC HTTP ${r.status}`);return (await r.json()).value;
}
async function api(base,route,options={}){
 const r=await fetch(`${base}/api/v1/reels/jobs${route}`,{...options,headers:{...options.headers,Authorization:`Bearer ${await auth()}`},signal:AbortSignal.timeout(120000)});
 if(!r.ok)throw Error(`Renderer API ${r.status}: ${(await r.text()).slice(0,250)}`);return r;
}
export async function runJobs(){
 const base=process.env.KP365_BASE_URL||'https://kabuki-post-365.kerakabuki.workers.dev';
 let completed=0,failed=0;
 for(let i=0;i<7;i++){
  const {job}=await(await api(base,'/claim',{method:'POST'})).json();if(!job)break;
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'kp365-reel-'));
  try{
   const paths=[];
   for(let n=0;n<job.manifest.photos.length;n++){
    const r=await api(base,`/${job.id}/assets/${n}`,{headers:{'x-render-lease':job.lease_token}});
    const p=path.join(dir,`input${n}.jpg`);await fs.writeFile(p,new Uint8Array(await r.arrayBuffer()));paths.push(p);
   }
   const bgm=await api(base,`/${job.id}/assets/bgm`,{headers:{'x-render-lease':job.lease_token}});
   const bgmPath=path.join(dir,'input.mp3');await fs.writeFile(bgmPath,new Uint8Array(await bgm.arrayBuffer()));
   const out=await renderReel(job.manifest,paths,bgmPath,dir);
   const form=new FormData();form.set('lease_token',job.lease_token);
   form.set('video',new Blob([await fs.readFile(out.video)],{type:'video/mp4'}),'reel.mp4');
   form.set('cover',new Blob([await fs.readFile(out.cover)],{type:'image/jpeg'}),'cover.jpg');
   await api(base,`/${job.id}/complete`,{method:'POST',body:form});completed++;console.log(`Rendered post ${job.post_id}`);
  }catch(e){
   failed++;console.error(`Job ${job.id} failed: ${e.message}`);
   await api(base,`/${job.id}/fail`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lease_token:job.lease_token,error:e.message})}).catch(()=>{});
   break;
  }finally{await fs.rm(dir,{recursive:true,force:true});}
 }
 console.log(JSON.stringify({completed,failed}));if(failed)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await runJobs();
