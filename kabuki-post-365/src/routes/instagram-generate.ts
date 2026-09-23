import { Hono } from 'hono';
import type { Env } from '../types';
import { generatePostText } from '../lib/claude';
import { settings } from '../lib/reels';
export const generateRoutes=new Hono<{Bindings:Env}>();
async function generate(env:Env,id:number,prompt?:string) {
  const p=await env.DB.prepare(`SELECT p.*,c.name character_name,c.description character_description,c.personality_tags,
    i.visual_features,i.scene_type,qp.question quiz_question,qp.options quiz_options,
    qp.correct_answer quiz_correct_answer,qp.explanation quiz_explanation
    FROM posts p LEFT JOIN images i ON i.id=p.image_id
    LEFT JOIN characters c ON c.id=i.character_id AND i.verified=1
    LEFT JOIN quiz_posts qp ON qp.post_id=p.id WHERE p.id=?`).bind(id).first<Record<string,unknown>>();
  if(!p) throw new Error('投稿がありません');
  if(p.instagram_posted||!['idle','failed'].includes(String(p.publish_state))) throw new Error('公開済み・処理中の本文は再生成できません');
  const texts=await generatePostText(env,p,await settings(env),'instagram',prompt);
  if(!texts.instagram_text.trim()) throw new Error('本文を生成できませんでした');
  await env.DB.prepare(`UPDATE posts SET instagram_text=?,instagram_hashtags=?,publish_container_id=NULL,publish_state='idle',updated_at=datetime('now')
    WHERE id=? AND instagram_posted=0 AND publish_state IN ('idle','failed')`).bind(texts.instagram_text,texts.instagram_hashtags,id).run();
  return {instagram_text:texts.instagram_text,instagram_hashtags:texts.instagram_hashtags};
}
generateRoutes.post('/single/:id/:platform',async c=>{
  if(c.req.param('platform')!=='instagram') return c.json({error:'文章生成はInstagram専用です'},400);
  const b=await c.req.json<{customPrompt?:string}>().catch(()=>({customPrompt:undefined}));
  return c.json({success:true,texts:await generate(c.env,Number(c.req.param('id')),b.customPrompt)});
});
generateRoutes.post('/single/:id',async c=>{
  const b=await c.req.json<{customPrompt?:string}>().catch(()=>({customPrompt:undefined}));
  return c.json({success:true,texts:await generate(c.env,Number(c.req.param('id')),b.customPrompt)});
});
generateRoutes.post('/batch',async c=>{
  const b=await c.req.json<{from?:string;to?:string;limit?:number}>();
  const {results}=await c.env.DB.prepare(`SELECT id FROM posts WHERE instagram_posted=0 AND instagram_text IS NULL
    AND publish_state IN ('idle','failed') AND post_date BETWEEN ? AND ? ORDER BY post_date LIMIT ?`)
    .bind(b.from||'0000-01-01',b.to||'9999-12-31',Math.min(30,Math.max(1,b.limit||10))).all<{id:number}>();
  let generated=0;const errors:string[]=[];
  for(const p of results){try{await generate(c.env,p.id);generated++;}catch(e){errors.push((e as Error).message);}}
  return c.json({generated,total:results.length,errors});
});
