// Public watch-page evidence only. No cookies, credentials or generated video are used.
export interface VideoRule {id:string;label:string;searchQuery:string;titleIncludes:string[];officialChannelId:string;}
interface PlayerResponse {playabilityStatus?:{status?:string};videoDetails?:{videoId?:string;channelId?:string;title?:string;isPrivate?:boolean;isUpcoming?:boolean};microformat?:{playerMicroformatRenderer?:{isUnlisted?:boolean}};streamingData?:{formats?:unknown[];adaptiveFormats?:unknown[]};}
interface CaptionPolicy {fixedCaption?:boolean;youtubeCta?:string;caption:string;photoBaseText:string;youtubeRules:VideoRule[];}
export function playerResponse(html:string):PlayerResponse|null {
 const m=/\bytInitialPlayerResponse\s*=\s*/.exec(html);if(!m)return null;const start=html.indexOf('{',m.index+m[0].length);if(start<0)return null;
 let depth=0,quoted=false,escaped=false;
 for(let i=start;i<html.length;i++){const c=html[i];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;}else if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0){try{return JSON.parse(html.slice(start,i+1)) as PlayerResponse;}catch{return null;}}}
 return null;
}
export function evidencePublic(p:PlayerResponse|null,r:VideoRule){return !!p&&p.playabilityStatus?.status==='OK'&&p.videoDetails?.videoId===r.id&&p.videoDetails.channelId===r.officialChannelId&&p.videoDetails.isPrivate===false&&p.videoDetails.isUpcoming!==true&&p.microformat?.playerMicroformatRenderer?.isUnlisted===false&&r.titleIncludes.every(t=>p.videoDetails?.title?.includes(t))&&!!(p.streamingData?.formats?.length||p.streamingData?.adaptiveFormats?.length);}
async function readPlayer(response:Response){
 if(!response.ok||!response.body)return null;const reader=response.body.getReader(),decoder=new TextDecoder();let html='',size=0;
 try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>2097152)return null;html+=decoder.decode(part.value,{stream:true});const p=playerResponse(html);if(p)return p;}return playerResponse(html+decoder.decode());}
 finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
export async function checkVideo(r:VideoRule):Promise<boolean>{
 if(!/^[A-Za-z0-9_-]{11}$/.test(r.id)||r.officialChannelId!=='UCBi7GXW0HJ1opsOmKBX7iuw')return false;
 try{const response=await fetch('https://www.youtube.com/watch?v='+r.id+'&hl=ja',{headers:{Accept:'text/html'},redirect:'manual',signal:AbortSignal.timeout(10000)});return evidencePublic(await readPlayer(response),r);}catch{return false;}
}
export function captionWithVideo(p:CaptionPolicy,r:VideoRule|null){
 if(p.fixedCaption===true && p.youtubeRules.length===0)return p.caption;
 return p.photoBaseText+(r?'\n\n'+(p.youtubeCta??(r.label+'\nYouTubeで「'+r.searchQuery+'」と検索してください。')):'')+'\n#気良歌舞伎 #仮名手本忠臣蔵';}
export async function resolveVideoCaption(p:CaptionPolicy){for(const r of p.youtubeRules)if(await checkVideo(r))return{caption:captionWithVideo(p,r),rule:r};return{caption:captionWithVideo(p,null),rule:null};}
export function approvedCaption(p:CaptionPolicy,caption:string){return caption===captionWithVideo(p,null)||p.youtubeRules.some(r=>caption===captionWithVideo(p,r));}
