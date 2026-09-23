import type { Env } from '../types';
import { publishInstagram, type InstagramResult } from './instagram-publish';
import { jstDate } from './reels';
export interface AutoPostReport {
  date:string; postsProcessed:number;
  results:Array<{postId:number;platforms:InstagramResult[]}>;
}
export async function executeAutoPost(env:Env,targetDate?:string):Promise<AutoPostReport> {
  const date=targetDate||jstDate();
  const report:AutoPostReport={date,postsProcessed:0,results:[]};
  if(date!==jstDate()) return report;
  const posts=await env.DB.prepare(`SELECT id FROM posts WHERE post_date=? AND auto_publish=1
    AND status IN ('draft','approved','posted') ORDER BY instagram_posted DESC,id LIMIT 1`).bind(date).all<{id:number}>();
  for(const p of posts.results){
    report.results.push({postId:p.id,platforms:[await publishInstagram(env,p.id,true)]});report.postsProcessed++;
  }
  return report;
}
export async function postSinglePlatform(env:Env,postId:number,platform:string,_image?:Uint8Array):Promise<InstagramResult> {
  if(platform!=='instagram') return {platform,success:false,error:'365はInstagram専用です。Facebook・XはCodexで転記します。'};
  return publishInstagram(env,postId,false);
}
