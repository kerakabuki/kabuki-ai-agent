import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {build} from 'esbuild';
import {Miniflare,Response as MFResponse} from 'miniflare';
await fs.mkdir('.cache',{recursive:true});
await build({entryPoints:['src/index.ts'],bundle:true,format:'esm',platform:'browser',outfile:'.cache/test-worker.mjs'});
let publishes=0,containers=0,uncertain=false;
const mf=new Miniflare({modules:true,scriptPath:'.cache/test-worker.mjs',compatibilityDate:'2026-02-11',
 d1Databases:['DB'],r2Buckets:['R2'],kvNamespaces:['KV'],bindings:{API_TOKEN:'test',META_ACCESS_TOKEN:'test-meta',INSTAGRAM_USER_ID:'ig'},
 outboundService:async request=>{
  const u=new URL(request.url);
  if(u.host!=='graph.facebook.com')throw Error('Unexpected outbound: '+u.host);
  if(u.pathname.endsWith('/media_publish')){publishes++;if(uncertain)return MFResponse.json({error:{message:'response lost'}},{status:502});return MFResponse.json({id:'media1'});}
  if(u.pathname.endsWith('/media')&&request.method==='POST'){containers++;return MFResponse.json({id:'container1'});}
  if(u.pathname.endsWith('/container1'))return MFResponse.json({status_code:'FINISHED'});
  return MFResponse.json({permalink:'https://www.instagram.com/p/test/'});
 }});
let checks=0;
function check(value,msg){assert.ok(value,msg);checks++;}
try{
 const db=await mf.getD1Database('DB');
 for(const name of (await fs.readdir('migrations')).filter(x=>x.endsWith('.sql')).sort()){
  // Production received this historical column out of band before migration 0006.
  if(name==='0006_allow_multiple_posts_per_day.sql')await db.prepare('ALTER TABLE posts ADD COLUMN quiz_answer_comment TEXT').run();
  const sql=(await fs.readFile('migrations/'+name,'utf8')).replace(/--[^\n]*/g,'');
  for(const stmt of sql.split(';').map(x=>x.trim()).filter(Boolean))await db.prepare(stmt).run();
 }
 const today=new Date(Date.now()+32400000).toISOString().slice(0,10);
 const bucket=await mf.getR2Bucket('R2');await bucket.put('test.mp4',new Uint8Array(2048),{httpMetadata:{contentType:'video/mp4'}});
 const full=await mf.dispatchFetch('http://localhost/media/test.mp4');
 check(full.status===200&&full.headers.get('Content-Type')==='video/mp4','full media response uses 200 and MP4 MIME');
 const range=await mf.dispatchFetch('http://localhost/media/test.mp4',{headers:{Range:'bytes=0-99'}});
 check(range.status===206&&range.headers.get('Content-Range')==='bytes 0-99/2048'&&(await range.arrayBuffer()).byteLength===100,'MP4 byte range response correct');
 const call=(url,method='GET',body,token='test')=>mf.dispatchFetch('http://localhost/api/v1/'+url,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 await db.prepare("INSERT INTO images(id,filename,r2_key,verified,privacy_excluded,play_name,scene_type) VALUES(9001,'test.jpg','test.jpg',1,0,'白浪五人男','舞台')").run();
 const create=async()=>{const r=await call('posts','POST',{post_date:today,day_of_week:1,theme:'test',image_id:9001,instagram_text:'舞台の写真です。',facebook_text:'旧本文',x_text:'旧X本文'});assert.equal(r.status,201);return (await r.json()).id;};
 const id=await create();
 check((await db.prepare('SELECT auto_publish FROM posts WHERE id=?').bind(id).first()).auto_publish===0,'manual drafts excluded');
 await db.prepare('UPDATE posts SET facebook_posted=1 WHERE id=?').bind(id).run();
 await call(`posts/${id}`,'PUT',{instagram_text:'新しい本文です。'});
 const p=await db.prepare('SELECT * FROM posts WHERE id=?').bind(id).first();
 check(p.facebook_posted===1&&p.facebook_text==='旧本文'&&p.x_text==='旧X本文','partial edit preserves other platform history');
 for(const platform of ['facebook','x','bluesky'])check(!(await(await call(`auto-post/post/${id}/${platform}`,'POST')).json()).success,'direct API disabled: '+platform);
 check(containers===0&&publishes===0,'disabled routes do not call Meta');
 check((await call('reels/jobs/claim','POST',null,'forged')).status===401,'forged renderer authentication rejected');
 await db.prepare("INSERT OR REPLACE INTO settings(key,value) VALUES('reels_enabled','1'),('reel_bgm_key','reels/audio/test.mp3')").run();
 await db.prepare('UPDATE posts SET auto_publish=1 WHERE id=?').bind(id).run();
 const claims=await Promise.all([call('reels/jobs/claim','POST'),call('reels/jobs/claim','POST')]);
 const jobs=await Promise.all(claims.map(x=>x.json()));
 check(jobs.filter(x=>x.job).length===1,'concurrent renderer claim unique');
 const job=jobs.find(x=>x.job).job;
 await call(`posts/${id}`,'PUT',{instagram_text:'差し替えた本文です。'});
 const form=new FormData();form.set('lease_token',job.lease_token);form.set('video',new Blob([new Uint8Array(2000)],{type:'video/mp4'}),'test.mp4');form.set('cover',new Blob(['jpg'],{type:'image/jpeg'}),'cover.jpg');
 const encoded=new Request('http://localhost',{method:'POST',body:form});
 const stale=await mf.dispatchFetch(`http://localhost/api/v1/reels/jobs/${job.id}/complete`,{method:'POST',headers:{Authorization:'Bearer test','Content-Type':encoded.headers.get('Content-Type')},body:new Uint8Array(await encoded.arrayBuffer())});
 check(stale.status===409,'stale render rejected after edit');
 const publish=await(await call('auto-post/trigger','POST')).json();
 check(publishes===1&&containers===1,'photo fallback publishes once');
 await call('auto-post/trigger','POST');
 check(publishes===1,'published source not duplicated');
 let transfers=await(await call('crossposts')).json();
 check(transfers.length===2,'publication creates two independent transfers');
 check((await call(`crossposts/${id}/facebook/start`,'POST',{caption:'FB本文'})).status===200,'FB starts');
 check((await call(`crossposts/${id}/facebook/start`,'POST',{caption:'duplicate'})).status===409,'duplicate FB start rejected');
 await call(`crossposts/${id}/facebook/result`,'POST',{status:'published',permalink:'https://www.facebook.com/kerakabuki/posts/test'});
 await call(`crossposts/${id}/x/start`,'POST',{caption:'X本文'});
 await call(`crossposts/${id}/x/result`,'POST',{status:'uncertain',error:'network interruption'});
 check((await call(`crossposts/${id}/x/start`,'POST',{caption:'X再送'})).status===409,'uncertain X held');
 transfers=await(await call('crossposts')).json();
 check(transfers.find(x=>x.platform==='facebook').status==='published'&&transfers.find(x=>x.platform==='x').status==='uncertain','FB success retained when X uncertain');
 const next=await create();uncertain=true;
 await call(`auto-post/post/${next}/instagram`,'POST');const count=publishes;
 await call(`auto-post/post/${next}/instagram`,'POST');
 check(publishes===count,'uncertain Instagram publish never resent');
 check((await db.prepare('SELECT publish_state FROM posts WHERE id=?').bind(next).first()).publish_state==='uncertain','uncertain Instagram state persisted');
 await db.prepare('DELETE FROM crossposts WHERE post_id=?').bind(id).run();
 await call(`auto-post/post/${id}/instagram`,'POST');
 check((await(await call('crossposts')).json()).length===2,'publication evidence repairs missing transfer records');
 // Catch-up uses isolated local records: no real SNS call occurs in these cases.
 await db.prepare('DELETE FROM crossposts').run();
 const day=n=>new Date(Date.parse(today+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
 await db.prepare("UPDATE settings SET value=? WHERE key='crosspost_start_date'").bind(day(-3)).run();
 async function transfer(date,posted=1){
  const post=await create();
  await db.prepare("UPDATE posts SET post_date=?,instagram_posted=?,ig_media_id=?,ig_permalink=?,published_caption='公開済みの本文',published_media_key='test.mp4' WHERE id=?")
   .bind(date,posted,'media-'+post,'https://www.instagram.com/p/source'+post+'/',post).run();
  for(const platform of ['facebook','x'])await db.prepare('INSERT INTO crossposts(post_id,platform) VALUES(?,?)').bind(post,platform).run();
  return post;
 }
 const oldest=await transfer(day(-2)),yesterday=await transfer(day(-1)),current=await transfer(today);
 const future=await transfer(day(1));await transfer(day(-4));await transfer(today,0);
 const queue=async()=>{const r=await call('crossposts/queue');assert.equal(r.status,200);return r.json();};
 const start=(id,platform='facebook')=>call(`crossposts/${id}/${platform}/start`,'POST',{caption:'元の投稿日を確認した転記本文'});
 const result=(id,platform,status='published')=>call(`crossposts/${id}/${platform}/result`,'POST',{status,
  ...(status==='published'?{permalink:platform==='x'?'https://x.com/KeraKabuki/status/123456':'https://www.facebook.com/kerakabuki/posts/test'}:{error:'test'})});
 let q=await queue();
 check(q.platforms.every(p=>p.backlog_count===3&&p.next.post_id===oldest),'queue catches older posts but excludes future, pre-start and unpublished sources');
 check(q.source_today_published===true,'queue reports today Instagram publication evidence');
 check((await(await call('crossposts?post_id='+yesterday)).json()).length===2,'source lookup can retrieve previous day media');
 check((await(await call('crossposts?post_id='+future)).json()).length===0,'source lookup excludes future posts');
 check((await call('crossposts/queue','GET',null,'bad')).status===401,'queue remains authenticated');
 check((await start(current)).status===409,'cannot skip the oldest unposted source');
 check((await call(`crossposts/${oldest}/facebook/start`,'POST',{caption:' '})).status===400,'empty caption rejected');
 const concurrent=await Promise.all([start(oldest),start(oldest)]);
 check(concurrent.filter(r=>r.status===200).length===1&&concurrent.filter(r=>r.status===409).length===1,'concurrent starts claim one slot');
 check((await start(oldest,'x')).status===200,'platform daily slots are independent');
 await result(oldest,'facebook');await result(oldest,'x','uncertain');
 check((await start(yesterday)).status===409,'one successful Facebook post blocks another source on the same day');
 check((await start(yesterday,'x')).status===409,'uncertain X blocks other sources too');
 q=await queue();
 check(q.platforms[0].blocked_reason==='daily_limit'&&q.platforms[0].next===null,'queue exposes daily cap without a new candidate');
 check(q.platforms[1].blocked_reason==='needs_review'&&q.platforms[1].needs_review[0].post_id===oldest,'queue exposes unresolved publication for reconciliation');
 await db.prepare("UPDATE crossposts SET started_at=datetime('now','-1 day'),updated_at=datetime('now','-1 day') WHERE post_id=?").bind(oldest).run();
 q=await queue();
 check(q.platforms[0].next.post_id===yesterday,'previous day success allows next pending source');
 check(q.platforms[1].blocked_reason==='needs_review','uncertainty keeps its hold across days');
 const competing=await Promise.all([start(yesterday),start(current)]);
 check(competing[0].status===200&&competing[1].status===409,'different sources cannot acquire simultaneous platform slots');
 await result(yesterday,'facebook','failed');
 check((await start(yesterday)).status===200,'confirmed failure may retry the same source');
 await result(yesterday,'facebook');
 check((await start(current)).status===409,'successful retry uses the day allowance');
 await result(oldest,'x');
 q=await queue();
 check(q.platforms[1].blocked_reason==='daily_limit','late success reconciliation counts on the confirmation day');
 // Pin saved timestamps to the Japanese midnight boundary without changing the runtime clock.
 const midnight=Date.parse(today+'T00:00:00Z')-9*3600000;
 const sqlTime=t=>new Date(t).toISOString().slice(0,19).replace('T',' ');
 await db.prepare("UPDATE crossposts SET started_at=?,updated_at=? WHERE platform='facebook' AND status='published'")
  .bind(sqlTime(midnight-1000),sqlTime(midnight-1000)).run();
 check((await queue()).platforms[0].next.post_id===current,'23:59:59 JST previous day does not use today quota');
 await db.prepare("UPDATE crossposts SET started_at=?,updated_at=? WHERE platform='facebook' AND post_id=?")
  .bind(sqlTime(midnight),sqlTime(midnight),yesterday).run();
 check((await queue()).platforms[0].blocked_reason==='daily_limit','00:00:00 JST uses today quota');
 check(publishes===count,'catch-up checks never publish to an actual SNS API');
 console.log(JSON.stringify({passed:checks,publishes,containers}));
}finally{await mf.dispose();}
