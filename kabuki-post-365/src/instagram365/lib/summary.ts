import type {Env} from '../../types';
import {POLICIES} from './policies';
import {ManualError} from './focus';

type PublishedRow={request_id:string;state:string;caption:string;permalink:string|null;published_at:string|null;last_error_class:string|null};
function instagramLink(value:string|null):string|null {
 if(!value)return null;
 try{const u=new URL(value);return u.protocol==='https:'&&['instagram.com','www.instagram.com'].includes(u.hostname)&&/^\/p\/[^/]+\/?$/.test(u.pathname)?u.href:null;}catch{return null;}
}

// Only recorded fields are exposed. Approval tokens, bindings and signed media URLs never reach this response.
// This endpoint performs SELECTs only; it cannot claim, publish or reconcile a post.
export async function readFeedSummary(env:Env,date:string|null){
 if(!date||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw new ManualError('valid_date_required',400);
 const startDate='2026-10-30',endDate='2026-11-30';
 const mode=date<startDate?'legacy':date>endDate?'ended':'scheduled';
 const entries=[];
 for(const p of POLICIES.filter(p=>p.date===date)){
  const row=await env.DB.prepare('SELECT request_id,state,caption,permalink,published_at,last_error_class FROM manual_announcements WHERE request_id=?').bind(p.requestId).first<PublishedRow>();
  const state=row?.state??(Date.now()>=Date.parse(p.expiresAt)?'unverified':'scheduled');
  const permalink=instagramLink(row?.permalink??null);
  entries.push({date:p.date,requestId:p.requestId,slot:p.slot,timeJST:p.slot==='morning'?'08:00':'19:00',imageId:p.imageId,playName:p.playName,imageUrl:'/media/'+p.deliveryKey,altText:p.altText,caption:row?.caption??p.caption,state,publishedAt:row?.published_at??null,permalink,needsAttention:['failed','uncertain','unverified'].includes(state)||state==='published'&&!permalink,errorClass:row?.last_error_class??null});
 }
 return{date,startDate,endDate,mode,entries,readOnly:true as const};
}

export async function readFeedRangeSummary(env:Env,from:string|null,to:string|null){
 const a=await readFeedSummary(env,from),b=await readFeedSummary(env,to);
 if(!from||!to||to<from||(Date.parse(to)-Date.parse(from))/86400000>31)throw new ManualError('range_must_be_at_most_31_days',400);
 const entries=[...a.entries];
 for(let at=Date.parse(from)+86400000;at<=Date.parse(to);at+=86400000)entries.push(...(at===Date.parse(to)?b.entries:(await readFeedSummary(env,new Date(at).toISOString().slice(0,10))).entries));
 return{from,to,startDate:a.startDate,endDate:a.endDate,entries,readOnly:true as const};
}
