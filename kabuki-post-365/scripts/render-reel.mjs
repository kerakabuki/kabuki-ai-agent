import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {pathToFileURL} from 'node:url';
const exec=promisify(execFile);
const FFMPEG=process.env.FFMPEG_PATH||'ffmpeg',FFPROBE=process.env.FFPROBE_PATH||'ffprobe';
export const TEMPLATE_VERSION='mobile-readable-v3';
export function safeSubtitle(s,max=1000){
  return Array.from(String(s||'').replace(/https?:\/\/\S+/g,'').replace(/[{}\\\r\n]/g,' ').replace(/\s+/g,' ').trim()).slice(0,max).join('');
}
const chars=s=>Array.from(s);
const noStart=/^[、。，．！？!?：:；;）」』】〉》〕］｝ーぁぃぅぇぉっゃゅょァィゥェォッャュョ]/u;
const noEnd=/[（「『【〈《〔［｛]$/u;
function splitText(text,width){
 const a=chars(safeSubtitle(text)),lines=[];
 while(a.length){
  let n=Math.min(width,a.length);
  if(a.length>width){
   const count=Math.ceil(a.length/width),target=Math.ceil(a.length/count),minimum=a.length-width*(count-1);
   const prefix=a.slice(0,width).join(''),candidates=[];
   const wordEnds=new Set([...new Intl.Segmenter('ja',{granularity:'word'}).segment(a.join(''))].map(w=>chars(a.join('').slice(0,w.index+w.segment.length)).length));
   for(const m of prefix.matchAll(/(?:には|では|から|まで|ことに|は|を|が|で|と|に|や|、)/gu)){
    const end=chars(prefix.slice(0,m.index+m[0].length)).length;
    if(end>=Math.max(minimum,Math.ceil(target*.6))&&end<=width&&wordEnds.has(end)&&!noStart.test(a[end])&&!noEnd.test(a[end-1]))candidates.push(end);
   }
   if(!candidates.length){
    for(const word of new Intl.Segmenter('ja',{granularity:'word'}).segment(prefix)){
     const end=chars(prefix.slice(0,word.index+word.segment.length)).length;
     if(end>=minimum&&end>=Math.ceil(target*.6)&&end<=width&&wordEnds.has(end)&&!noStart.test(a[end])&&!noEnd.test(a[end-1]))candidates.push(end);
    }
   }
   n=candidates.sort((x,y)=>Math.abs(x-target)-Math.abs(y-target))[0]||target;
   while(n>minimum&&(noStart.test(a[n])||noEnd.test(a[n-1])))n--;
  }
  lines.push(a.splice(0,n).join('').trim());
 }
 return lines.filter(Boolean);
}
export function wrapLines(text,width=12){return splitText(text,width);}
function sentenceCards(sentence){
 const phrases=sentence.match(/[^、]+、?/gu)||[],chunks=[];let current='';
 for(const phrase of phrases){
  if(current&&chars(current+phrase).length>24){chunks.push(current);current='';}
  if(chars(phrase).length>24){
   if(current){chunks.push(current);current='';}
   chunks.push(...splitText(phrase,24));
  }else current+=phrase;
 }
 if(current)chunks.push(current);
 return chunks.map(c=>wrapLines(c).join('\\N'));
}
export function captionCards(caption,maxCards=3,fallback='気良歌舞伎'){
 const paragraphs=String(caption||'').split(/\n+/).map(s=>s.trim())
  .filter(s=>s&&!s.startsWith('#')&&!/^https?:/.test(s));
 const sentences=paragraphs.join('').match(/[^。！？!?]+[。！？!?]*/gu)||[];
 const cards=[];
 for(let i=0;i<sentences.length;i++){
  let sentence=sentences[i];
  if(chars(sentence).length<9&&i+1<sentences.length)sentence+=sentences[++i];
  const next=sentenceCards(sentence);
  // Only include complete sentences. Details remain available in the post caption.
  if(next.length>maxCards-cards.length)break;
  cards.push(...next);
  if(cards.length===maxCards)break;
 }
 if(!cards.length){
  const lines=wrapLines(fallback);
  for(let i=0;i<Math.min(lines.length,2*maxCards);i+=2)cards.push(lines.slice(i,i+2).join('\\N'));
 }
 return cards;
}
export function captionCues(caption,duration,fallback){
 const cards=captionCards(caption,Math.floor(duration/3.5),fallback);
 const weights=cards.map(s=>Math.max(10,chars(s.replaceAll('\\N','')).length));
 const total=weights.reduce((a,b)=>a+b,0),spare=duration-cards.length*3;
 let t=0;
 return cards.map((text,i)=>{const start=t;t+=3+spare*weights[i]/total;return {text,start,end:i===cards.length-1?duration:t};});
}
async function run(args,cwd){
  try{return await exec(FFMPEG,['-hide_banner','-loglevel','error','-y',...args],{cwd,timeout:180000,maxBuffer:2e6,windowsHide:true});}
  catch(e){throw new Error(`FFmpeg failed: ${String(e.stderr||e.message).slice(-1200)}`);}
}
export async function probe(file){const {stdout}=await exec(FFPROBE,['-v','error','-show_streams','-show_format','-of','json',file],{windowsHide:true});return JSON.parse(stdout);}
export function ass(title,cues,duration,offset=0){
 const time=n=>'0:'+Math.floor(n/60).toString().padStart(2,'0')+':'+(n%60).toFixed(2).padStart(5,'0');
 const end=time(duration),font=safeSubtitle(process.env.REEL_FONT_FAMILY||'Noto Sans CJK JP');
 const events=cues.filter(c=>c.start<offset+duration&&c.end>offset).map(c=>
  'Dialogue: 1,'+time(Math.max(0,c.start-offset))+','+time(Math.min(duration,c.end-offset))+',Body,,0,0,0,,{\\an5\\pos(508,1458)}'+c.text).join('\n');
 const titleLines=wrapLines(title,12).slice(0,2).join('\\N');
 return [
'[Script Info]',
'ScriptType: v4.00+',
'PlayResX: 1080',
'PlayResY: 1920',
'WrapStyle: 2',
'ScaledBorderAndShadow: yes',
'[V4+ Styles]',
'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
'Style: Title,'+font+',80,&H00262018,&H000000FF,&H00EEE8DF,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,8,80,180,220,1',
'Style: Body,'+font+',96,&H00FFFFFF,&H000000FF,&H00221A15,&H00221A15,-1,0,0,0,100,100,0,0,1,1,0,2,80,180,405,1',
'Style: Brand,'+font+',42,&H006B6258,&H000000FF,&H00EEE8DF,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,8,80,180,160,1',
'[Events]',
'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
'Dialogue: 1,0:00:00.00,'+end+',Title,,0,0,0,,'+titleLines,
events,
'Dialogue: 1,0:00:00.00,'+end+',Brand,,0,0,0,,気良歌舞伎',
''].join('\n');
}
export async function renderReel(manifest,photoPaths,bgmPath,dir){
 if(![1,2,3].includes(photoPaths.length))throw Error('1〜3枚の写真が必要です');
 const duration=({1:12,2:16,3:20})[photoPaths.length],segment=duration/photoPaths.length;
 const cues=captionCues(manifest.caption,duration,manifest.title||'気良歌舞伎');
 await fs.mkdir(path.join(dir,'fonts'),{recursive:true});
 if(process.env.REEL_FONT_PATH)await fs.copyFile(process.env.REEL_FONT_PATH,path.join(dir,'fonts','NotoSansCJKjp-Bold.otf'));
 for(let i=0;i<photoPaths.length;i++){
  await fs.copyFile(photoPaths[i],path.join(dir,`photo${i}.jpg`));
  await fs.writeFile(path.join(dir,`text${i}.ass`),ass(manifest.title,cues,segment,i*segment),'utf8');
  const frames=Math.round(segment*30);
  await run(['-i',`photo${i}.jpg`,'-vf',`scale=960:960:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:'390+(960-ih)/2':color=0xEEE8DF,zoompan=z='min(1+on*0.000045,1.014)':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=${frames}:s=1080x1920:fps=30,drawbox=x=48:y=1360:w=920:h=196:color=0x221A15:t=fill,subtitles=text${i}.ass:fontsdir=fonts,format=yuv420p`,
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
