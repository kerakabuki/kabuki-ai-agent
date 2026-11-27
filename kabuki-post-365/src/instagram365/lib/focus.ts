import {requiredImageCredits} from './publication-policy';
import {resolveVideoCaption,approvedCaption,checkVideo,type VideoRule} from './youtube-public';
import {KNOWN_EXTERNAL} from './known-external';
import type { Env } from '../../types';
import {POLICIES} from './policies';
type Policy=typeof POLICIES[number];

const GRAPH = 'https://graph.facebook.com/v21.0';
const ORIGIN = 'https://kabuki-post-365.kerakabuki.workers.dev';
type Input = { token: string; assetId: string; sourceSha256: string; deliverySha256: string; captionSha256: string; accountId: string; accountUsername: string };
type Row = { request_id: string; video_id: string; source_sha256: string; delivery_sha256: string; caption_sha256: string; account_id: string; account_username: string; token_sha256: string; expires_at: string; caption: string; source_key: string; delivery_key: string; state: string; token_consumed: number; container_id: string|null; media_id: string|null; permalink: string|null; claimed_at: string; published_at: string|null; last_error_class: string|null };
type Media = { id: string; caption?: string; permalink?: string; timestamp?: string; media_type?: string; media_url?: string };
export class ManualError extends Error {
 constructor(public code: string, public httpStatus: 400|401|409|410|422|502|503 = 409) { super(code); }
}
export const hex = async (data: ArrayBuffer|Uint8Array|string) => {
 const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
 const hash = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
 return Array.from(new Uint8Array(hash), x => x.toString(16).padStart(2,'0')).join('');
};

// Immutable approval reference binds this exact dated photo; API_TOKEN remains the authentication credential.
export function createFocus(P:Policy){
const base=P;let resolved=false,selectedVideo:VideoRule|null=null;
async function resolveCaption(){if(resolved)return;const result=await resolveVideoCaption(base);P={...base,caption:result.caption,captionSha256:await hex(result.caption)};selectedVideo=result.rule;resolved=true;}
async function useSavedCaption(caption:string){if(!approvedCaption(base,caption))throw new ManualError('stored_caption_outside_approved_variants',422);P={...base,caption,captionSha256:await hex(caption)};resolved=true;}
function windowOpen() {
 if (Date.now() < Date.parse(P.notBefore) || Date.now() >= Date.parse(P.expiresAt)) throw new ManualError('manual_authorization_expired_or_not_started',410);
}
async function validateInput(env: Env, value: unknown): Promise<Input> {
 windowOpen();
 if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ManualError('manual_input_required',400);
 const v=value as Record<string,unknown>;
 const keys=['token','assetId','sourceSha256','deliverySha256','captionSha256','accountId','accountUsername'];
 if (Object.keys(v).length !== keys.length || keys.some(k=>typeof v[k]!=='string')) throw new ManualError('manual_exact_input_required',400);
 if (v.assetId!==base.assetId || v.sourceSha256!==base.sourceSha256 || v.deliverySha256!==base.deliverySha256 || v.captionSha256!==base.captionSha256 || v.accountUsername!==base.accountUsername || !env.INSTAGRAM_USER_ID || v.accountId!==env.INSTAGRAM_USER_ID || base.accountId && v.accountId!==base.accountId || await hex(v.token as string)!==base.tokenSha256 || await hex(base.caption)!==base.captionSha256) throw new ManualError('manual_approval_binding_mismatch',422);
 return v as Input;
}
async function row(env: Env): Promise<Row|null> {
 return env.DB.prepare('SELECT * FROM manual_announcements WHERE request_id=?').bind(P.requestId).first<Row>();
}
async function graph(env: Env, path: string, body?: Record<string,unknown>): Promise<Record<string,any>> {
 if (!env.META_ACCESS_TOKEN) throw new ManualError('existing_instagram_authentication_unavailable',503);
 const response=await fetch(GRAPH+'/'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+env.META_ACCESS_TOKEN,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),redirect:'manual',signal:AbortSignal.timeout(20000)});
 const value=await response.json() as Record<string,any>;
 if (!response.ok || value.error) throw new ManualError('existing_meta_request_rejected_http_'+response.status,502);
 return value;
}
async function identity(env: Env) {
 if (!env.INSTAGRAM_USER_ID || P.accountId && env.INSTAGRAM_USER_ID!==P.accountId) throw new ManualError('manual_account_binding_mismatch',422);
 const who=await graph(env,env.INSTAGRAM_USER_ID+'?fields=id,username');
 if (who.id!==env.INSTAGRAM_USER_ID || who.username!==P.accountUsername) throw new ManualError('manual_official_account_mismatch',422);
 return {id:String(who.id),username:String(who.username)};
}
async function photoProof(env:Env) {
 const creditSetting=await env.DB.prepare("SELECT value FROM settings WHERE key='image_required_credits'").first<{value:string}>();
 const creditLines=requiredImageCredits({image_required_credits:creditSetting?.value||''},[P.imageId]);
 if(creditLines.some(line=>!P.caption.split(/\r?\n/).map(v=>v.trim()).includes(line)))throw new ManualError('required_photo_credit_changed',422);
 const image=await env.DB.prepare('SELECT i.id,i.r2_key,i.verified,i.privacy_excluded,i.character_id,i.play_name,i.scene_type,c.name,c.navi_enmoku_id,c.navi_cast_id FROM images i LEFT JOIN characters c ON c.id=i.character_id WHERE i.id=?').bind(P.imageId).first<Record<string,unknown>>();
 if(!image||image.id!==P.imageId||image.r2_key!==P.deliveryKey||image.verified!==1||image.privacy_excluded!==0||image.character_id!==P.characterId||image.play_name!==P.playName||image.name!==P.characterName||image.navi_enmoku_id!==P.naviEnmokuId||image.navi_cast_id!==P.naviCastId||image.scene_type!==P.sceneType||/AI生成/i.test(String(image.scene_type||'')))throw new ManualError('approved_exact_photo_metadata_changed',422);
 return {imageId:P.imageId,playName:P.playName,characterName:P.characterName,originalSha256:P.sourceSha256,deliverySha256:P.deliverySha256,identityReviewedAt:P.identityReviewedAt,permissionProof:P.permissionSha256,identityProof:P.identitySha256,primaryProof:P.primarySha256};
}
const announcementMatch=(m:Media)=>m.caption===P.caption;
async function recent(env: Env): Promise<Media[]> {
 const v=await graph(env,env.INSTAGRAM_USER_ID+'/media?fields=id,caption,permalink,timestamp,media_type,media_url&limit=50');
 if(!Array.isArray(v.data)) throw new ManualError('instagram_recent_media_unavailable',503);
 return v.data as Media[];
}
async function assets(env:Env,_required=false) {
 const object=await env.R2.get(P.deliveryKey);
 if(!object||object.size<1000||object.size>2000000||await hex(await object.arrayBuffer())!==P.deliverySha256)throw new ManualError('approved_exact_photo_storage_changed',422);
 return {delivery:true,deliverySha256:P.deliverySha256,originalAndIdentityProofPinned:true};
}
async function inspect(env: Env, allowOwnClaim=false, requireAssets=false, readOnlyFuture=false) {
 if(!readOnlyFuture)windowOpen();
 await resolveCaption();
 const disabled=await env.DB.prepare("SELECT value FROM settings WHERE key='disabled_platforms'").first<{value:string}>();
 if((disabled?.value||'').split(',').map(x=>x.trim()).includes('instagram')) throw new ManualError('instagram_is_disabled',409);
 const own=await row(env);
 if(own && !allowOwnClaim) throw new ManualError('manual_one_time_slot_already_consumed',409);
 if(P.reuseAfterDays!==14)throw new ManualError('preserved_14_day_reuse_required',422);
 if(KNOWN_EXTERNAL.some(p=>p.date===P.date&&p.slot===P.slot))throw new ManualError('known_external_slot_already_published',409);
 if(KNOWN_EXTERNAL.some(p=>p.imageId===P.imageId&&(Date.parse(P.date)-Date.parse(p.date))/86400000<14))throw new ManualError('known_external_photo_within_14_days',409);
 const duplicate=await env.DB.prepare("SELECT id FROM posts WHERE instagram_posted=1 AND (published_caption=? OR (image_id=? AND post_date>=date(?,'-'||?||' days'))) LIMIT 1").bind(P.caption,P.imageId,P.date,P.reuseAfterDays-1).first();
 if(duplicate) throw new ManualError('manual_announcement_already_in_existing365',409);
 const previous=await env.DB.prepare("SELECT request_id FROM manual_announcements WHERE request_id<>? AND delivery_sha256=? AND (state IN ('creating','processing','publishing','uncertain') OR (state='published' AND (published_at IS NULL OR date(published_at,'+9 hours')>=date(?,'-'||?||' days')))) LIMIT 1").bind(P.requestId,P.deliverySha256,P.date,P.reuseAfterDays-1).first();if(previous)throw new ManualError('photo_previously_claimed',409);
 const sameSlot=await env.DB.prepare("SELECT id FROM posts WHERE post_date=? AND publish_slot=? AND (instagram_posted=1 OR publish_state IN ('creating','processing','publishing','uncertain')) LIMIT 1").bind(P.date,P.slot).first();if(sameSlot)throw new ManualError('existing_slot_used',409);
 const reservation=await env.DB.prepare("SELECT id FROM posts WHERE post_date=? AND publish_slot=? AND instagram_posted=0 AND (status IN ('approved','scheduled') OR publish_state IN ('creating','processing','publishing','uncertain')) LIMIT 1").bind(P.date,P.slot).first();
 if(reservation)throw new ManualError('existing_slot_reservation_requires_reconciliation',409);
 const inflight=await env.DB.prepare("SELECT id FROM posts WHERE instagram_posted=0 AND publish_state IN ('creating','processing','publishing','uncertain') LIMIT 1").first();
 if(inflight) throw new ManualError('existing365_publication_inflight_or_uncertain',409);
 const account=await identity(env),photo=await photoProof(env),media=await recent(env);
 if(media.some(announcementMatch)) throw new ManualError('manual_photo_already_on_instagram',409);
 if(media.some(m=>Date.parse(m.timestamp||'')>=Date.parse(P.notBefore)&&Date.parse(m.timestamp||'')<Date.parse(P.expiresAt)))throw new ManualError('instagram_has_today_publication',409);
 const otherManual=await env.DB.prepare("SELECT request_id FROM manual_announcements WHERE request_id<>? AND state IN ('creating','processing','publishing','uncertain') LIMIT 1").bind(P.requestId).first();
 if(otherManual)throw new ManualError('other_manual_publication_inflight_or_uncertain',409);
 return {account,photo,thumbnail:await assets(env,requireAssets),existing365DuplicateCount:0,instagramRecentDuplicateCount:0,existing365InflightCount:0,expiresAt:P.expiresAt,oneTimeClaimed:!!own,resolvedCaption:P.caption,youtubeIncluded:!!selectedVideo};
}
const preflight = (env: Env) => inspect(env);
function boundRow(saved: Row, accountId: string) {
 return saved.request_id===P.requestId && saved.video_id===P.assetId && saved.source_sha256===P.sourceSha256 && saved.delivery_sha256===P.deliverySha256 && saved.caption_sha256===P.captionSha256 && saved.caption===P.caption && saved.token_sha256===P.tokenSha256 && saved.account_id===accountId && saved.account_username===P.accountUsername && saved.expires_at===P.expiresAt && saved.source_key===P.sourceKey && saved.delivery_key===P.deliveryKey && saved.token_consumed===1;
}
async function publish(env: Env, value: unknown) {
 const input=await validateInput(env,value);
 const fresh=await inspect(env,false,true);
 if(fresh.account.id!==input.accountId) throw new ManualError('manual_account_binding_mismatch',422);
 const claim=await env.DB.prepare(`INSERT INTO manual_announcements(request_id,video_id,source_sha256,delivery_sha256,caption_sha256,account_id,account_username,token_sha256,expires_at,caption,source_key,delivery_key,state,token_consumed,claimed_at)
 SELECT ?,?,?,?,?,?,?,?,?,?,?,?,'creating',1,? WHERE NOT EXISTS(SELECT 1 FROM manual_announcements WHERE request_id=?)
 AND NOT EXISTS(SELECT 1 FROM posts WHERE instagram_posted=0 AND publish_state IN ('creating','processing','publishing','uncertain'))
 AND NOT EXISTS(SELECT 1 FROM posts WHERE instr(COALESCE(instagram_text,''),?)>0 OR instr(COALESCE(published_caption,''),?)>0 OR instr(COALESCE(theme,''),?)>0)
 AND NOT EXISTS(SELECT 1 FROM manual_announcements WHERE request_id<>? AND state IN ('creating','processing','publishing','uncertain'))
 AND NOT EXISTS(SELECT 1 FROM manual_announcements WHERE request_id<>? AND delivery_sha256=? AND state='published' AND (published_at IS NULL OR date(published_at,'+9 hours')>=date(?,'-'||?||' days')))
 AND NOT EXISTS(SELECT 1 FROM posts WHERE instagram_posted=1 AND image_id=? AND post_date>=date(?,'-'||?||' days'))
 AND NOT EXISTS(SELECT 1 FROM posts WHERE post_date=? AND publish_slot=? AND (instagram_posted=1 OR status IN ('approved','scheduled') OR publish_state IN ('creating','processing','publishing','uncertain')))`)
 .bind(P.requestId,P.assetId,P.sourceSha256,P.deliverySha256,P.captionSha256,input.accountId,P.accountUsername,P.tokenSha256,P.expiresAt,P.caption,P.sourceKey,P.deliveryKey,new Date().toISOString(),P.requestId,P.assetId,P.assetId,P.assetId,P.requestId,P.requestId,P.deliverySha256,P.date,P.reuseAfterDays-1,P.imageId,P.date,P.reuseAfterDays-1,P.date,P.slot).run();
 if(claim.meta.changes!==1) throw new ManualError('manual_one_time_claim_conflict',409);
 let irreversible=false;
 try {
  const container=await graph(env,input.accountId+'/media',{image_url:ORIGIN+'/media/'+P.deliveryKey,caption:P.caption,alt_text:P.altText});
  if(typeof container.id!=='string'||!container.id) throw new ManualError('manual_container_result_unavailable',502);
  await env.DB.prepare("UPDATE manual_announcements SET state='processing',container_id=? WHERE request_id=? AND state='creating'").bind(container.id,P.requestId).run();
  let ready=false;
  for(let i=0;i<30;i++) {
   const result=await graph(env,container.id+'?fields=status_code');
   if(result.status_code==='FINISHED') {ready=true;break;}
   if(result.status_code!=='IN_PROGRESS') throw new ManualError('manual_container_processing_rejected',502);
   if(i<29) await new Promise(r=>setTimeout(r,2000));
  }
  if(!ready) throw new ManualError('manual_container_processing_not_finished',503);
  const final=await inspect(env,true,true),saved=await row(env);
  if(final.account.id!==input.accountId||!saved||!boundRow(saved,input.accountId)||saved.state!=='processing'||saved.container_id!==container.id) throw new ManualError('manual_final_approval_or_container_changed',409);
  windowOpen();
  if(selectedVideo&&!await checkVideo(selectedVideo))throw new ManualError('youtube_public_status_changed_before_publication',409);
  const locked=await env.DB.prepare("UPDATE manual_announcements SET state='publishing' WHERE request_id=? AND state='processing' AND container_id=? AND token_consumed=1 AND account_id=? AND source_sha256=? AND delivery_sha256=? AND caption_sha256=? AND token_sha256=? AND expires_at=? RETURNING request_id")
   .bind(P.requestId,container.id,input.accountId,P.sourceSha256,P.deliverySha256,P.captionSha256,P.tokenSha256,P.expiresAt).first();
  if(!locked) throw new ManualError('manual_publish_claim_conflict',409);
  irreversible=true;
  const published=await graph(env,input.accountId+'/media_publish',{creation_id:container.id});
  if(typeof published.id!=='string'||!published.id) throw new ManualError('manual_publication_result_unavailable',502);
  await env.DB.prepare("UPDATE manual_announcements SET state='published',media_id=?,published_at=?,last_error_class=NULL WHERE request_id=? AND state='publishing'").bind(published.id,new Date().toISOString(),P.requestId).run();
  // A confirmed publication is never resent, even when permalink lookup fails.
  let permalink: string|null=null;
  try {const media=await graph(env,published.id+'?fields=permalink');if(typeof media.permalink==='string'&&media.permalink.startsWith('https://www.instagram.com/p/'))permalink=media.permalink;} catch { /* GET/status can fetch it later */ }
  if(permalink) await env.DB.prepare('UPDATE manual_announcements SET permalink=? WHERE request_id=? AND media_id=?').bind(permalink,P.requestId,published.id).run();
  return {success:true,requestId:P.requestId,platform:'instagram',mediaId:published.id,permalink,tokenConsumed:true,publicationRequests:1,automaticRetry:false};
 } catch(error) {
  const code=error instanceof ManualError?error.code:'manual_external_or_storage_error';
  // Keep a successfully stored publication; all other results consume this one attempt.
  await env.DB.prepare("UPDATE manual_announcements SET state=?,last_error_class=? WHERE request_id=? AND state<>'published'").bind(irreversible?'uncertain':'failed',code,P.requestId).run();
  throw new ManualError(irreversible?'manual_publication_uncertain_do_not_resend':code,502);
 }
}
async function status(env: Env) {
 const saved=await row(env);
 if(saved)await useSavedCaption(saved.caption);else await resolveCaption();
 const account=await identity(env);
 const media=await recent(env);
 const matches=media.filter(announcementMatch);
 const actual=saved?.media_id?media.find(m=>m.id===saved.media_id):matches.length===1?matches[0]:undefined;
 return {requestId:P.requestId,record:saved,account,observedMedia:actual||null,todayMedia:media.filter(m=>Date.parse(m.timestamp||'')>=Date.parse(P.todaySince)).map(m=>({id:m.id,caption:m.caption,permalink:m.permalink,timestamp:m.timestamp,media_type:m.media_type})),observedMatchingCount:matches.length,exactCaptionVerified:actual?.caption===P.caption,thumbnail:await assets(env,!!saved),publicationRequests:0,automaticRetry:false};
}
async function reconcile(env: Env) {
 const proof=await status(env),saved=proof.record;
 if(!saved||!['publishing','uncertain'].includes(saved.state)||!boundRow(saved,proof.account.id)||!proof.exactCaptionVerified||proof.observedMatchingCount!==1||!proof.observedMedia) throw new ManualError('manual_uncertain_result_not_uniquely_proven',409);
 const media=proof.observedMedia;
 await env.DB.prepare("UPDATE manual_announcements SET state='published',media_id=?,permalink=?,published_at=?,last_error_class=NULL WHERE request_id=? AND state IN ('publishing','uncertain') AND token_consumed=1").bind(media.id,media.permalink||null,media.timestamp||new Date().toISOString(),P.requestId).run();
 return {reconciled:true,mediaId:media.id,permalink:media.permalink,publicationRequests:0,automaticRetry:false};
}

return {preflight,publish,status,row,reconcile,readiness:(env:Env)=>inspect(env,false,true,true)};
}
