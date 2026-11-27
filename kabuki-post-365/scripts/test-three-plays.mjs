import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { build } from 'esbuild';
import { Miniflare, Response as MFResponse } from 'miniflare';
await fs.mkdir('.cache', { recursive:true });
await build({entryPoints:['./src/lib/three-plays.ts'],bundle:true,format:'esm',platform:'node',outfile:'.cache/three-plays-policy.mjs'});
const policy=await import('../.cache/three-plays-policy.mjs');
await fs.writeFile('.cache/three-plays-entry.mjs', `
import worker from '../src/index.ts';
import {currentFeedSlot} from '../src/lib/feed-slots.ts';
import {settings} from '../src/lib/reels.ts';
import {ensureImages} from '../src/lib/auto-image.ts';
import {generateMissingTexts} from '../src/lib/daily-run.ts';
import {shouldRunStoryNow,runEveningStory} from '../src/lib/story-post.ts';
import {prepareThreePlaySlot,guardThreePlayPublication} from '../src/lib/three-plays.ts';
const RealDate=globalThis.Date; let testTime=RealDate.parse('2026-10-20T00:00:00Z'), lateMutation=null;
globalThis.Date=class extends RealDate {constructor(...args){if(args.length)super(...args);else super(testTime);}static now(){return testTime;}};
export default {async fetch(request,env,ctx){
 const u=new URL(request.url);
 if(u.pathname==='/__test/clock'){testTime=RealDate.parse(u.searchParams.get('at'));return Response.json({ok:true});}
 if(u.pathname==='/__test/late-mutation'){lateMutation=await request.json();return Response.json({ok:true});}
 if(u.pathname==='/__test/prepare')return Response.json(await prepareThreePlaySlot(env,await settings(env),u.searchParams.get('date'),u.searchParams.get('slot')));
 if(u.pathname==='/__test/side-paths'){const date=u.searchParams.get('date');return Response.json({images:await ensureImages(env,date),text:await generateMissingTexts(env,date)});}
 if(u.pathname==='/__test/story'){const decision=await shouldRunStoryNow(env);await runEveningStory(env);return Response.json(decision);}
 if(u.pathname.startsWith('/__test/guard/')){const p=await env.DB.prepare('SELECT * FROM posts WHERE id=?').bind(Number(u.pathname.split('/').pop())).first();const s=await settings(env);return Response.json(await guardThreePlayPublication(env,s,p,{date:new Date(testTime+32400000).toISOString().slice(0,10),slot:currentFeedSlot(s)}));}
 let reads=0;
 const testEnv={...env,R2:{get:async(...args)=>{reads++;if(reads===2&&lateMutation){const change=lateMutation;lateMutation=null;if(change.at)testTime=RealDate.parse(change.at);if(change.sql)await env.DB.prepare(change.sql).bind(...change.args).run();}return env.R2.get(...args);}}};
 return worker.fetch(request,testEnv,ctx);
},scheduled:worker.scheduled};
`);
await build({entryPoints:['.cache/three-plays-entry.mjs'],bundle:true,format:'esm',platform:'browser',outfile:'.cache/test-three-plays-worker.mjs'});
let containers=0,publishes=0,outbound=0,uncertain=false, processing=false, mutateBeforeFinal=null;
let db;
const mf=new Miniflare({modules:true,scriptPath:'.cache/test-three-plays-worker.mjs',compatibilityDate:'2026-02-11',
 d1Databases:['DB'],r2Buckets:['R2'],kvNamespaces:['KV'],bindings:{API_TOKEN:'test',META_ACCESS_TOKEN:'test',INSTAGRAM_USER_ID:'ig'},
 outboundService:async request=>{
  outbound++;
  const u=new URL(request.url);
  assert.equal(u.host,'graph.facebook.com','No Gemini, image generation or other external calls');
  if(u.pathname.endsWith('/media_publish')){publishes++;return uncertain?MFResponse.json({error:{message:'unknown publication result'}},{status:502}):MFResponse.json({id:'media'+publishes});}
  if(u.pathname.endsWith('/media')&&request.method==='POST'){
   containers++;const body=await request.json();assert(!body.media_type,'Curated feed is always a photo');
   return MFResponse.json({id:'container'+containers});
  }
  if(/\/container\d+$/.test(u.pathname)){
   if(mutateBeforeFinal){const action=mutateBeforeFinal;mutateBeforeFinal=null;await action();}
   return MFResponse.json({status_code:processing?'IN_PROGRESS':'FINISHED'});
  }
  return MFResponse.json({permalink:'https://www.instagram.com/p/test'+publishes+'/'});
 }});
let checks=0;const passed=[];
function check(value,label){assert.ok(value,label);checks++;passed.push(label);}
const clone=x=>structuredClone(x);
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const names=['盛綱陣屋','九段目・山科閑居','切られ与三'];
const bytes=Array.from({length:6},(_,i)=>Buffer.from('OFFLINE IMAGE FIXTURE '+i));
const photos=policy.PLAY_IDS.flatMap((playId,index)=>['portrait','stage'].map((kind,k)=>{
 const imageId=9101+index*2+k,characterName=kind==='portrait'?'登場人物'+index:null;
 const copy=kind==='portrait'?'原文で確認した人物の関係です。':'台本と写真で確認した場面です。';
 const p={id:'photo'+imageId,playId,playName:names[index],kind,imageId,r2Key:'originals/test'+imageId+'.jpg',imageSha256:sha(bytes[index*2+k]),
  characterId:kind==='portrait'?9201+index:null,characterName,naviCastId:kind==='portrait'?'person_'+index:null,
  copy,hashtags:'#気良歌舞伎',credits:['撮影：検証用架空資料'],source:{reference:'offline fixture source',sha256:sha('fixture source'),excerpt:(characterName||'')+'\n'+copy},
  photoReview:{reference:'offline fixture inspection',sha256:sha('fixture inspection'),excerpt:names[index]+' '+(characterName||'')+' '+kind},
  rights:{instagram:true,reference:'OFFLINE TEST PERMISSION ONLY'},reviewedBy:'offline test fixture',reviewedAt:'2026-10-19T00:00:00Z',validThrough:'2027-10-20'};
 p.text=policy.reviewedText(p);return p;
}));
const manifest={schemaVersion:1,revision:'offline_test_v1',startDate:'2026-10-20',reuseAfterDays:60,photos};
await fs.writeFile('../evidence/manifest-complete-OFFLINE-EXAMPLE.json',JSON.stringify({...manifest,_warning:'架空のテスト素材。公開用承認・写真・権利ではありません。'},null,2)+'\n');
const s={ig_editorial_mode:policy.THREE_PLAY_MODE,ig_three_plays_manifest_v1:JSON.stringify(manifest)};
check(policy.parseThreePlayManifest(s.ig_three_plays_manifest_v1).photos.length===6,'complete structural manifest');
check(policy.PLAY_IDS.every((p,i)=>policy.playForDate(manifest,'2026-10-'+(20+i))===p),'daily same-play rotation: Mori/Yamashina/Kirare');
for(const mutation of [m=>m.schemaVersion=2,m=>m.startDate='2026-02-30',m=>m.photos[0].rights.instagram=false,
 m=>m.photos[0].source.excerpt='wrong excerpt',m=>m.photos[0].characterId=null,m=>m.photos[0].text='創作した人物関係',m=>m.photos[0].playId='sonezaki',m=>m.photos[0].photoReview.excerpt='AI生成写真',m=>m.photos[0].imageSha256='no hash']){
 const bad=clone(manifest);mutation(bad);check(policy.threePlayMode({...s,ig_three_plays_manifest_v1:JSON.stringify(bad)},'2026-10-20').state==='invalid','invalid manifest fails closed #'+checks);
}
check(policy.threePlayMode(s,'2026-10-19').state==='waiting'&&!policy.threePlayOwnsDate(s,'2026-10-19'),'before activation date preserves old mode');
check(policy.threePlayMode({},'2026-10-20').state==='off','absent mode preserves existing behavior');
try{
 db=await mf.getD1Database('DB');
 for(const name of (await fs.readdir('migrations')).filter(x=>x.endsWith('.sql')).sort()){
  if(name==='0006_allow_multiple_posts_per_day.sql')await db.prepare('ALTER TABLE posts ADD COLUMN quiz_answer_comment TEXT').run();
  const sql=(await fs.readFile('migrations/'+name,'utf8')).replace(/--[^\n]*/g,'');
  for(const statement of sql.split(';').map(x=>x.trim()).filter(Boolean))await db.prepare(statement).run();
 }
 const bucket=await mf.getR2Bucket('R2');
 for(let i=0;i<photos.length;i++){
  const p=photos[i];await bucket.put(p.r2Key,new Uint8Array(bytes[i]),{httpMetadata:{contentType:'image/jpeg'}});
  if(p.kind==='portrait')await db.prepare('INSERT INTO characters(id,name,navi_enmoku_id,navi_cast_id) VALUES(?,?,?,?)').bind(p.characterId,p.characterName,p.playId,p.naviCastId).run();
  await db.prepare('INSERT INTO images(id,filename,r2_key,character_id,verified,privacy_excluded,play_name,scene_type) VALUES(?,?,?,?,1,0,?,?)').bind(p.imageId,'test'+p.imageId+'.jpg',p.r2Key,p.characterId,p.playName,p.kind==='portrait'?'ポートレート':'舞台').run();
 }
 const api=async(route,method='GET',body)=>{
  const r=await mf.dispatchFetch('http://localhost/api/v1/'+route,{method,headers:{Authorization:'Bearer test','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  return {status:r.status,data:await r.json()};
 };
 const clock=at=>mf.dispatchFetch('http://localhost/__test/clock?at='+encodeURIComponent(at));
 const testGet=async(route)=>(await mf.dispatchFetch('http://localhost/__test/'+route)).json();
 const setManifest=async m=>{await db.prepare("INSERT OR REPLACE INTO settings(key,value) VALUES('ig_three_plays_manifest_v1',?)").bind(JSON.stringify(m)).run();};
 await db.prepare("INSERT OR REPLACE INTO settings(key,value) VALUES('ig_editorial_mode',?),('ig_three_plays_manifest_v1',?),('reels_enabled','1'),('reel_bgm_key','reels/audio/test.mp3'),('evening_feed_start_date','2026-09-29'),('evening_feed_end_date','2026-10-12')").bind(policy.THREE_PLAY_MODE,JSON.stringify(manifest)).run();
 const createLegacy=async(date,slot='morning')=>{
  const r=await api('posts','POST',{post_date:date,day_of_week:1,theme:'old prepared Sonezaki',image_id:photos[0].imageId,instagram_text:'旧候補',publish_slot:slot});
  assert.equal(r.status,201);await db.prepare('UPDATE posts SET auto_publish=1 WHERE id=?').bind(r.data.id).run();return r.data.id;
 };
 const legacy=await createLegacy('2026-10-20');await createLegacy('2026-10-21');
 const schedule=(await api('auto-post/schedule')).data;
 check(schedule.today.slots.length===2&&schedule.tomorrow.slots.length===2,'permanent evening feed after Oct 12');
 check(!(await api('auto-post/post/'+legacy+'/instagram','POST')).data.success&&containers===0,'manual publication cannot bypass old-candidate guard');
 const short=clone(manifest);short.photos=short.photos.filter(x=>x.playId!=='moritunajinya');await setManifest(short);
 check((await api('auto-post/daily-run','POST',{date:'2026-10-20'})).data.postsProcessed===0&&outbound===0,'shortage skips without another-play/Gemini/image fallback');
 await setManifest(manifest);
 const side=await testGet('side-paths?date=2026-10-20');
 check(side.images.assigned===0&&side.images.generated===0&&side.text.generated===0&&outbound===0,'direct image/text preparation cannot call generation');
 const oldBody=await db.prepare('SELECT instagram_text FROM posts WHERE id=?').bind(legacy).first();
 check((await api('generate/single/'+legacy,'POST')).status===500&&outbound===0&&(await db.prepare('SELECT instagram_text FROM posts WHERE id=?').bind(legacy).first()).instagram_text===oldBody.instagram_text,'manual generate refuses and preserves existing copy');
 check((await api('reels/prepare','POST')).data.queued===0&&(await api('reels/jobs/claim','POST')).data.job===null,'reel prepare/claim skip new-mode dates including preprepared rows');
 const first=(await api('auto-post/daily-run','POST',{date:'2026-10-20'})).data;
 check(first.postsProcessed===1&&first.results[0].platforms[0].success&&containers===1&&publishes===1,'morning: verified exact portrait source publishes once');
 const morning=first.results[0].postId;
 check((await db.prepare('SELECT instagram_text FROM posts WHERE id=?').bind(legacy).first()).instagram_text==='旧候補','legacy working rows not overwritten');
 await api('auto-post/daily-run','POST',{date:'2026-10-20'});await api('auto-post/post/'+morning+'/instagram','POST');
 check(publishes===1,'same-day repeated trigger/manual does not republish');
 await clock('2026-10-20T01:00:00Z');
 check((await api('auto-post/trigger','POST')).data.postsProcessed===0&&publishes===1,'10:00 JST is missed, never catch up');
 await clock('2026-10-20T10:00:00Z');
 const story=await testGet('story');check(story.run===false&&publishes===1,'no additional Stories publication');
 processing=true;
 const pending=(await api('auto-post/trigger','POST')).data;
 check(pending.results[0].platforms[0].pending===true&&containers===2&&publishes===1,'processing container retained without publishing again');
 processing=false;
 const evening=(await api('auto-post/trigger','POST')).data;
 check(evening.postsProcessed===1&&evening.results[0].platforms[0].success&&publishes===2&&containers===2,'19:00 resumes same container and uses same-play verified stage photo');
 check((await db.prepare('SELECT image_id FROM posts WHERE id=?').bind(evening.results[0].postId).first()).image_id===photos[1].imageId,'morning/evening stay on same Mori play');
 await clock('2026-10-20T11:00:00Z');
 check((await api('auto-post/trigger','POST')).data.postsProcessed===0&&publishes===2,'20:00 JST also skips missed evening');
 await clock('2026-10-21T00:00:00Z');
 const prep=await testGet('prepare?date=2026-10-21&slot=morning');check(!!prep.postId,'Yamashina reviewed row prepared');
 const row=await db.prepare('SELECT * FROM posts WHERE id=?').bind(prep.postId).first();
 for(const [field,value] of [['instagram_text','誤った人物紹介'],['image_id',photos[0].imageId],['theme','old prepared'],['post_date','2026-10-20'],['publish_slot','evening'],['content_type','reel']]){
  await db.prepare('UPDATE posts SET '+field+'=? WHERE id=?').bind(value,prep.postId).run();
  check(!(await api('auto-post/post/'+prep.postId+'/instagram','POST')).data.success&&publishes===2,'actual manual publish guard rejects changed '+field);
  await db.prepare('UPDATE posts SET '+field+'=? WHERE id=?').bind(row[field],prep.postId).run();
 }
 await db.prepare('UPDATE images SET privacy_excluded=1 WHERE id=?').bind(row.image_id).run();
 check(!(await api('auto-post/post/'+prep.postId+'/instagram','POST')).data.success,'privacy revocation blocks actual publication');
 await db.prepare('UPDATE images SET privacy_excluded=0,character_id=? WHERE id=?').bind(photos[0].characterId,row.image_id).run();
 check(!(await api('auto-post/post/'+prep.postId+'/instagram','POST')).data.success,'wrong character binding blocks actual publication');
 await db.prepare('UPDATE images SET character_id=? WHERE id=?').bind(photos[2].characterId,row.image_id).run();
 await bucket.put(photos[2].r2Key,new Uint8Array(Buffer.from('CHANGED IMAGE')));
 check(!(await api('auto-post/post/'+prep.postId+'/instagram','POST')).data.success,'R2 bytes changed after inspection block actual publication');
 await bucket.put(photos[2].r2Key,new Uint8Array(bytes[2]));
 const expired=clone(manifest);expired.photos[2].validThrough='2026-10-20';await setManifest(expired);
 check(!(await api('auto-post/post/'+prep.postId+'/instagram','POST')).data.success,'expired exact source approval cannot publish');await setManifest(manifest);
 mutateBeforeFinal=()=>db.prepare("UPDATE posts SET instagram_text='changed after container' WHERE id=?").bind(prep.postId).run();
 check(!(await api('auto-post/post/'+prep.postId+'/instagram','POST')).data.success&&publishes===2,'copy edit during container processing blocked immediately before media_publish');
 await db.prepare('UPDATE posts SET instagram_text=? WHERE id=?').bind(row.instagram_text,prep.postId).run();
 mutateBeforeFinal=()=>db.prepare("UPDATE settings SET value='invalidated policy' WHERE key='ig_three_plays_manifest_v1'").run();
 check(!(await api('auto-post/post/'+prep.postId+'/instagram','POST')).data.success&&publishes===2,'policy change during processing blocked before media_publish');await setManifest(manifest);
 mutateBeforeFinal=()=>db.prepare("UPDATE settings SET value='' WHERE key='ig_editorial_mode'").run();
 check(!(await api('auto-post/post/'+prep.postId+'/instagram','POST')).data.success&&publishes===2,'mode revoked during processing blocks curated media_publish');
 await db.prepare("UPDATE settings SET value=? WHERE key='ig_editorial_mode'").bind(policy.THREE_PLAY_MODE).run();
 const lateChange=async(sql,args)=>mf.dispatchFetch('http://localhost/__test/late-mutation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sql,args})});
 const current=await db.prepare('SELECT * FROM posts WHERE id=?').bind(prep.postId).first();
 for(const [field,value] of [['post_date','2026-10-20'],['publish_slot','evening'],['auto_publish',0],['character_id',photos[0].characterId],['publish_container_id','forged-container'],['published_media_key','wrong.jpg'],['published_caption','wrong caption']]){
  await lateChange('UPDATE posts SET '+field+'=? WHERE id=?',[value,prep.postId]);
  check(!(await api('auto-post/post/'+prep.postId+'/instagram','POST')).data.success&&publishes===2,'atomic final claim rejects late '+field+' edit during R2 read');
  await db.prepare('UPDATE posts SET '+field+'=? WHERE id=?').bind(current[field],prep.postId).run();
 }
 for(const [field,value,restore] of [['verified',0,1],['privacy_excluded',1,0],['character_id',photos[0].characterId,photos[2].characterId]]){
  await lateChange('UPDATE images SET '+field+'=? WHERE id=?',[value,row.image_id]);
  check(!(await api('auto-post/post/'+prep.postId+'/instagram','POST')).data.success&&publishes===2,'atomic final claim rejects late image '+field+' edit');
  await db.prepare('UPDATE images SET '+field+'=? WHERE id=?').bind(restore,row.image_id).run();
 }
 await lateChange("UPDATE settings SET value='' WHERE key='ig_editorial_mode'",[]);
 check(!(await api('auto-post/post/'+prep.postId+'/instagram','POST')).data.success&&publishes===2,'atomic final claim rejects late mode revocation');
 await db.prepare("UPDATE settings SET value=? WHERE key='ig_editorial_mode'").bind(policy.THREE_PLAY_MODE).run();
 await lateChange("UPDATE settings SET value='invalid JSON' WHERE key='ig_three_plays_manifest_v1'",[]);
 check(!(await api('auto-post/post/'+prep.postId+'/instagram','POST')).data.success&&publishes===2,'atomic final claim rejects late manifest revocation');await setManifest(manifest);
 for(const [key,value] of [['disabled_platforms','instagram'],['image_required_credits',JSON.stringify({[row.image_id]:'変更後の撮影者クレジット'})]]){
  await lateChange('INSERT OR REPLACE INTO settings(key,value) VALUES(?,?)',[key,value]);
  check(!(await api('auto-post/post/'+prep.postId+'/instagram','POST')).data.success&&publishes===2,'atomic final claim rejects late '+key+' change');
  await db.prepare('DELETE FROM settings WHERE key=?').bind(key).run();
 }
 await mf.dispatchFetch('http://localhost/__test/late-mutation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({at:'2026-10-21T01:00:00Z'})});
 check(!(await api('auto-post/post/'+prep.postId+'/instagram','POST')).data.success&&publishes===2,'hashing across 10:00 boundary skips actual publication');await clock('2026-10-21T00:00:00Z');
 const oldUncertain=await createLegacy('2026-10-19');await db.prepare("UPDATE posts SET publish_state='uncertain' WHERE id=?").bind(oldUncertain).run();
 check(!(await api('auto-post/post/'+prep.postId+'/instagram','POST')).data.success&&publishes===2,'direct managed processing row blocked by older unresolved publication');
 await db.prepare("UPDATE posts SET publish_state='failed' WHERE id=?").bind(oldUncertain).run();
 uncertain=true;await api('auto-post/post/'+prep.postId+'/instagram','POST');const count=publishes;
 check((await db.prepare('SELECT publish_state FROM posts WHERE id=?').bind(prep.postId).first()).publish_state==='uncertain','unknown Meta response persisted as uncertain');
 await api('auto-post/post/'+prep.postId+'/instagram','POST');await api('auto-post/trigger','POST');
 check(publishes===count,'uncertain publication never resent');
 await clock('2026-10-22T00:00:00Z');
 check((await api('auto-post/trigger','POST')).data.postsProcessed===0&&publishes===count,'unresolved prior publication holds new slots');
 await db.prepare("UPDATE posts SET publish_state='published',instagram_posted=1 WHERE id=?").bind(prep.postId).run();uncertain=false;
 const kirare=(await api('auto-post/trigger','POST')).data;
 check(kirare.results[0].platforms[0].success&&(await db.prepare('SELECT image_id FROM posts WHERE id=?').bind(kirare.results[0].postId).first()).image_id===photos[4].imageId,'after reconciliation rotates to Kirare portrait');
 await clock('2026-10-23T00:00:00Z');
 check((await api('auto-post/trigger','POST')).data.postsProcessed===0,'recently published image not reused; empty same-play pool skips');
 await db.prepare("UPDATE settings SET value='invalid JSON' WHERE key='ig_three_plays_manifest_v1'").run();
 const invalidStory=await testGet('story');
 check(invalidStory.run===false&&(await api('auto-post/trigger','POST')).data.postsProcessed===0,'invalid enabled mode fails closed for feed and Stories');
 check((await api('auto-post/trigger/2026-10-20','POST')).data.postsProcessed===0,'old requested dates never catch up');
 await fs.writeFile('../evidence/three-play-test-results.json',JSON.stringify({passed:checks,containers,publishes,mockedExternalRequests:outbound,realExternalRequests:0,checks:passed},null,2)+'\n');
 console.log(JSON.stringify({passed:checks,containers,publishes,realExternalRequests:0}));
}finally{await mf.dispose();}
