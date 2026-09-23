import type { Env } from '../types';
import { assetUrl,captionFor,currentJob,ensureCrossposts,jstDate,publicBase,settings } from './reels';
interface PublishPost {
  id:number; post_date:string; auto_publish:number; status:string; instagram_posted:number;
  instagram_text:string|null; instagram_hashtags:string|null; r2_key:string|null;
  verified:number; privacy_excluded:number; content_type:string; publish_state:string;
  publish_container_id:string|null; publish_started_at:string|null; published_media_key:string|null;
  published_caption:string|null; ig_media_id:string|null; ig_permalink:string|null;
}
export interface InstagramResult {
  platform:string; success:boolean; skipped?:boolean; pending?:boolean;
  error?:string; platformPostId?:string; permalink?:string;
}
const GRAPH='https://graph.facebook.com/v21.0';
type MetaResponse={id?:string;status_code?:string;permalink?:string;error?:{message?:string};data?:Array<{id:string;caption?:string;permalink?:string;timestamp?:string}>};
async function graph(env:Env,path:string,body?:Record<string,unknown>):Promise<MetaResponse> {
  const res=await fetch(`${GRAPH}/${path}`,{method:body?'POST':'GET',
    headers:{Authorization:`Bearer ${env.META_ACCESS_TOKEN}`,'Content-Type':'application/json'},
    ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(25000)});
  const data=await res.json() as MetaResponse;
  if(!res.ok||data.error) throw new Error(data.error?.message||`Meta HTTP ${res.status}`);
  return data;
}
async function finished(env:Env,p:PublishPost,mediaId:string,permalink?:string):Promise<InstagramResult> {
  if(!permalink) {try{permalink=(await graph(env,`${mediaId}?fields=permalink`)).permalink;}catch{/* publication already proven */}}
  await env.DB.batch([
    env.DB.prepare(`UPDATE posts SET instagram_posted=1,ig_media_id=?,ig_permalink=?,publish_state='published',publish_error=NULL,status='posted',updated_at=datetime('now') WHERE id=?`).bind(mediaId,permalink||null,p.id),
    env.DB.prepare(`INSERT INTO post_log(post_id,platform,success,platform_post_id) SELECT ?,'instagram',1,?
      WHERE NOT EXISTS(SELECT 1 FROM post_log WHERE post_id=? AND platform='instagram' AND success=1 AND platform_post_id=?)`).bind(p.id,mediaId,p.id,mediaId),
  ]);
  await ensureCrossposts(env,p.id);
  return {platform:'instagram',success:true,platformPostId:mediaId,permalink};
}
export async function publishInstagram(env:Env,postId:number,automatic=false):Promise<InstagramResult> {
  const fail=(error:string):InstagramResult=>({platform:'instagram',success:false,error});
  const p=await env.DB.prepare(`SELECT p.*,i.r2_key,COALESCE(i.verified,0) verified,COALESCE(i.privacy_excluded,1) privacy_excluded
    FROM posts p LEFT JOIN images i ON i.id=p.image_id WHERE p.id=?`).bind(postId).first<PublishPost>();
  if(!p) return fail('投稿が見つかりません');
  if(p.instagram_posted) {
    await ensureCrossposts(env,p.id);
    return {platform:'instagram',success:true,skipped:true,platformPostId:p.ig_media_id||undefined,permalink:p.ig_permalink||undefined};
  }
  const s=await settings(env);
  if((s.disabled_platforms||'').split(',').map(x=>x.trim()).includes('instagram')) return fail('Instagramは停止中です');
  if(!env.INSTAGRAM_USER_ID||!env.META_ACCESS_TOKEN) return fail('Instagram認証が未設定です');
  if(automatic&&(!p.auto_publish||p.post_date!==jstDate()||!['draft','approved'].includes(p.status))) return fail('自動投稿の対象ではありません');
  if(!p.r2_key||p.privacy_excluded||(automatic&&!p.verified)) return fail('検品済みの使用可能な写真が必要です');
  if(!p.instagram_text) return fail('投稿文がありません');
  // Never resend a publish request with an uncertain response.
  if(['publishing','uncertain'].includes(p.publish_state)) {
    if(p.publish_container_id) {
      try {
        const state=await graph(env,`${p.publish_container_id}?fields=status_code`);
        if(state.status_code==='PUBLISHED') {
          const recent=await graph(env,`${env.INSTAGRAM_USER_ID}/media?fields=id,caption,permalink,timestamp&limit=25`);
          const since=Date.parse((p.publish_started_at||'1970-01-01').replace(' ','T')+'Z')-60000;
          const matches=(recent.data||[]).filter(m=>m.caption===p.published_caption&&Date.parse(m.timestamp||'')>=since);
          if(matches.length===1) return finished(env,p,matches[0].id,matches[0].permalink);
        }
      }catch{/* remain uncertain */}
    }
    return fail('公開結果を確認中です。重複防止のため再送信しません');
  }
  if(!p.publish_container_id) {
    if(p.publish_state==='creating'&&p.publish_started_at&&Date.now()-Date.parse(p.publish_started_at.replace(' ','T')+'Z')<120000)
      return {platform:'instagram',success:false,pending:true,error:'メディアを登録しています'};
    let key=p.r2_key,isReel=false;
    if(p.content_type==='reel'&&s.reels_enabled==='1') {
      const job=await currentJob(env,p.id);
      if(job?.status==='ready'&&job.video_key){key=job.video_key;isReel=true;}
    }
    const caption=captionFor(p.instagram_text,p.instagram_hashtags);
    const lock=await env.DB.prepare(`UPDATE posts SET publish_state='creating',publish_started_at=datetime('now'),published_media_key=?,published_caption=?,publish_error=NULL
      WHERE id=? AND instagram_posted=0 AND publish_container_id IS NULL
      AND (publish_state IN ('idle','failed') OR (publish_state='creating' AND publish_started_at<datetime('now','-2 minutes')))
      ${automatic?`AND NOT EXISTS(SELECT 1 FROM posts other WHERE other.post_date=posts.post_date AND other.id<>posts.id AND (other.instagram_posted=1 OR other.publish_state IN ('creating','processing','publishing','uncertain')))` : ''}
      RETURNING id`).bind(key,caption,p.id).first();
    if(!lock) return {platform:'instagram',success:false,skipped:true,error:'処理中、または当日の投稿は完了しています'};
    try {
      const media=await graph(env,`${env.INSTAGRAM_USER_ID}/media`,isReel
        ?{media_type:'REELS',video_url:assetUrl(publicBase(s),key),caption,share_to_feed:true}
        :{image_url:assetUrl(publicBase(s),key),caption});
      if(!media.id) throw new Error('コンテナIDが返りませんでした');
      p.publish_container_id=media.id;p.published_caption=caption;p.published_media_key=key;
      await env.DB.prepare(`UPDATE posts SET publish_state='processing',publish_container_id=? WHERE id=?`).bind(media.id,p.id).run();
    }catch(e){
      const msg=(e as Error).message;
      // A container alone is not a publication; creating another one is safe.
      await env.DB.prepare(`UPDATE posts SET publish_state='failed',publish_error=? WHERE id=?`).bind(msg,p.id).run();
      return fail(msg);
    }
  }
  try {
    let status:string|undefined;
    for(let i=0;i<3;i++) {
      status=(await graph(env,`${p.publish_container_id}?fields=status_code`)).status_code;
      if(status!=='IN_PROGRESS') break;
      if(i<2) await new Promise(r=>setTimeout(r,2000));
    }
    if(status==='ERROR'||status==='EXPIRED') {
      await env.DB.prepare(`UPDATE posts SET publish_state='failed',publish_container_id=NULL,publish_error=? WHERE id=?`).bind(`メディア処理: ${status}`,p.id).run();
      return fail(`メディア処理: ${status}`);
    }
    if(status==='PUBLISHED') {
      await env.DB.prepare(`UPDATE posts SET publish_state='uncertain' WHERE id=?`).bind(p.id).run();
      return fail('公開済みメディアの照合が必要です');
    }
    if(status!=='FINISHED') return {platform:'instagram',success:false,pending:true,error:'Instagramで動画を処理中です'};
    const claim=await env.DB.prepare(`UPDATE posts SET publish_state='publishing',publish_started_at=datetime('now') WHERE id=? AND publish_state='processing' AND instagram_posted=0 RETURNING id`).bind(p.id).first();
    if(!claim) return fail('別の処理が公開確認中です');
    try {
      const published=await graph(env,`${env.INSTAGRAM_USER_ID}/media_publish`,{creation_id:p.publish_container_id});
      if(!published.id) throw new Error('公開IDが返りませんでした');
      return await finished(env,p,published.id);
    }catch(e){
      await env.DB.prepare(`UPDATE posts SET publish_state='uncertain',publish_error=? WHERE id=?`).bind((e as Error).message,p.id).run();
      return fail('公開結果が不明です。Instagram側の照合まで再送信を保留します');
    }
  }catch(e){return fail((e as Error).message);}
}
