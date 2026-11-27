import existing from '../runtime/existing365.js';
import {createFocus,ManualError} from './lib/focus';
import {POLICIES} from './lib/policies';
import type {Env} from '../types';
import {readFeedSummary,readFeedRangeSummary} from './lib/summary';

const PREFIX='/api/v1/instagram-schedule-20261029';
const START='2026-10-30',END='2026-11-30',LOG='instagram-schedule-20261029:';
export function clock(at=Date.now()){const d=new Date(at+32400000);return{date:d.toISOString().slice(0,10),hour:d.getUTCHours(),minute:d.getUTCMinutes()};}
export function select(at=Date.now()){const c=clock(at),slot=c.hour===8?'morning':c.hour===19?'evening':null;return POLICIES.find(p=>p.date===c.date&&p.slot===slot);}
const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
async function authenticated(req:Request,env:Env){if(!env.API_TOKEN)return false;const digest=async(x:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(x)));const a=await digest(req.headers.get('Authorization')||''),b=await digest('Bearer '+env.API_TOKEN);let diff=0;for(let n=0;n<a.length;n++)diff|=a[n]^b[n];return diff===0;}
function input(p:typeof POLICIES[number]){return{token:p.approvalReference,assetId:p.assetId,sourceSha256:p.sourceSha256,deliverySha256:p.deliverySha256,captionSha256:p.captionSha256,accountId:p.accountId,accountUsername:p.accountUsername};}
async function saveResult(env:Env,result:Record<string,unknown>){const value=JSON.stringify({at:new Date().toISOString(),...result});await env.KV.put(LOG+'last-slot-result',value,{expirationTtl:5184000});if(typeof result.requestId==='string')await env.KV.put(LOG+result.requestId,value,{expirationTtl:5184000});console.log(value);}

export default {
 ...existing,
 async fetch(req:Request,env:Env,ctx:ExecutionContext){
  const url=new URL(req.url),pathname=url.pathname;
  if(!pathname.startsWith(PREFIX))return existing.fetch(req,env,ctx);
  if(!await authenticated(req,env))return json({error:'existing_authentication_required'},401);
  try{
   if(pathname===PREFIX+'/summary'&&req.method==='GET')return json(url.searchParams.has('date')?await readFeedSummary(env,url.searchParams.get('date')):await readFeedRangeSummary(env,url.searchParams.get('from'),url.searchParams.get('to')));
   if(pathname===PREFIX+'/plan'&&req.method==='GET')return json({startDate:START,endDate:END,timezone:'Asia/Tokyo',morning:'08:00 daily',eveningDates:POLICIES.filter(p=>p.slot==='evening').map(p=>p.date),plans:POLICIES,afterEnd:'no automatic publication'});
   if(pathname===PREFIX+'/health'&&req.method==='GET'){
    const records=await env.DB.prepare("SELECT request_id,state,container_id,media_id,permalink,published_at,last_error_class FROM manual_announcements WHERE request_id LIKE 'instagram-scheduled-20261029:%' ORDER BY request_id").all();
    return json({at:new Date().toISOString(),startDate:START,endDate:END,next:POLICIES.find(p=>Date.parse(p.expiresAt)>Date.now())||null,lastCron:await env.KV.get(LOG+'last-cron','json'),lastSlotResult:await env.KV.get(LOG+'last-slot-result','json'),records:records.results,automaticRetryAfterClaim:false});
   }
   const parts=pathname.slice(PREFIX.length+1).split('/'),p=POLICIES.find(x=>x.date===parts[0]&&x.slot===parts[1]);
   if(!p||parts.length!==3)return json({error:'unknown_dated_slot'},404);
   const service=createFocus(p);
   if(req.method==='GET'&&parts[2]==='status')return json(await service.status(env));
   if(req.method==='GET'&&parts[2]==='readiness')return json({readOnly:true,date:p.date,slot:p.slot,windowEnforced:false,...await service.readiness(env)});
   if(req.method==='GET'&&parts[2]==='preflight')return json(await service.preflight(env));
   if(req.method==='POST'&&parts[2]==='publish'){if(await req.text()!=='{}')return json({error:'exact_empty_request_required'},400);return json(await service.publish(env,input(p)));}
   return json({error:'method_not_allowed'},405);
  }catch(e){return e instanceof ManualError?json({success:false,error:e.code,automaticRetry:false},e.httpStatus):json({success:false,error:'schedule_operation_error',automaticRetry:false},500);}
 },
 async scheduled(controller:ScheduledController,env:Env,ctx:ExecutionContext){
  const when=controller.scheduledTime,c=clock(when);
  if(c.date<START)return existing.scheduled(controller,env,ctx);
  // This owner never falls through to an expired campaign or extends beyond approved November content.
  await env.KV.put(LOG+'last-cron',JSON.stringify({at:new Date().toISOString(),scheduledAt:new Date(when).toISOString(),cron:controller.cron,date:c.date,hour:c.hour}),{expirationTtl:5184000});
  if(c.date>END)return;
  const p=select(when);if(!p)return;
  const service=createFocus(p),saved=await service.row(env);
  if(saved){
   if(['uncertain','publishing'].includes(saved.state)){
    try{const result=await service.reconcile(env);await saveResult(env,{requestId:p.requestId,event:'read_only_reconciliation',...result});}
    catch(e){await saveResult(env,{requestId:p.requestId,state:saved.state,event:'needs_attention_no_resend',error:e instanceof ManualError?e.code:'reconciliation_unavailable'});}
   }
   return;
  }
  try{const result=await service.publish(env,input(p));await saveResult(env,{event:'published',...result});}
  catch(e){await saveResult(env,{requestId:p.requestId,event:'publication_blocked',error:e instanceof ManualError?e.code:'schedule_operation_error',automaticRetryAfterClaim:false});}
 }
};
