import {useEffect,useState,useCallback} from 'react';
import {Link} from 'react-router-dom';
import {api,type InstagramFeedSummary} from '../lib/api';
type Post={publish_slot?:'morning'|'evening';id:number;post_date:string;instagram_text:string|null;instagram_posted:number;ig_permalink:string|null;publish_state:string;publish_error:string|null;auto_publish:number;image_r2_key:string|null;published_media_key:string|null};
type Job={status:string;video_url:string|null;error?:string};
type Transfer={platform:string;status:string;permalink:string|null};
const labels:Record<string,string>={scheduled:'予定済み',queued:'動画作成待ち',rendering:'動画を作成中',ready:'動画の準備完了',failed:'要確認',idle:'準備中',processing:'Instagramで処理中',creating:'メディア登録中',publishing:'公開確認中',uncertain:'公開結果の照合が必要',unverified:'公開記録の確認が必要',published:'公開済み',pending:'転記待ち'};
export default function InstagramTodayPage(){
 const [summary,setSummary]=useState<InstagramFeedSummary|null>(null),[posts,setPosts]=useState<Post[]>([]),[jobs,setJobs]=useState<Record<number,Job|null>>({}),[transfers,setTransfers]=useState<Transfer[]>([]);
 const [error,setError]=useState('');
 const date=new Date(Date.now()+32400000).toISOString().slice(0,10);
 const endDate=summary?.endDate && new Date(summary.endDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', timeZone: 'UTC' });
 const load=useCallback(async()=>{
  try{
   const actual=await api.instagramSchedule.summary(date);setSummary(actual);
   if(actual.mode==='legacy'){
    const list=await api.posts.list({from:date,to:date}) as Post[];setPosts(list);
    const entries=await Promise.all(list.map(async p=>[p.id,await api.reels.post(p.id)] as const));setJobs(Object.fromEntries(entries));
    setTransfers(await api.crossposts.list(date));
   }else{setPosts([]);setJobs({});setTransfers([]);}
   setError('');
  }catch(e){setError((e as Error).message);}
 },[date]);
 useEffect(()=>{void load();const t=setInterval(()=>void load(),30000);return()=>clearInterval(t);},[load]);
 return <div className="max-w-5xl mx-auto space-y-6">
  <div className="flex flex-wrap gap-4 justify-between items-center"><div><p className="text-sm text-stone-500">{date} · 気良歌舞伎</p><h2 className="text-2xl font-bold text-stone-900">今日のInstagram</h2></div><Link to="/quick" className="rounded-xl bg-red-800 text-white px-5 py-3">写真を追加する</Link></div>
  {error&&<p role="alert" className="text-red-700 bg-red-50 p-4 rounded-xl">公開記録を取得できませんでした。{error}</p>}
  {!summary&&!error&&<p className="p-8 bg-white rounded-xl">投稿予定と公開記録を確認しています。</p>}
  {summary?.mode==='scheduled'&&<>
   <div className="rounded-2xl bg-stone-100 border border-stone-200 p-5 text-sm leading-7"><strong>朝8時の写真投稿</strong><p>{endDate && `${endDate}まで、`}毎朝8時に投稿します。夕方19時の投稿がある日は、その日の欄に表示します。</p><p>サーバーに保存された公開記録を表示しています。公開URLから実際の投稿をご覧いただけます。</p></div>
   {summary.entries.length===0&&<p className="p-8 bg-white rounded-xl">この日の投稿予定はありません。</p>}
   {summary.entries.map(p=><article key={p.requestId} className="bg-white border rounded-2xl p-5 grid md:grid-cols-[260px_1fr] gap-6">
    <img className="w-full max-h-[460px] object-contain rounded-xl bg-stone-100" src={p.imageUrl} alt={p.altText}/>
    <div className="space-y-4"><div className="flex gap-2 flex-wrap"><span className="bg-stone-100 px-3 py-1 rounded-full text-sm">{p.slot==='morning'?'朝':'夕方'}{p.timeJST}</span><span className={p.needsAttention?'bg-amber-50 text-amber-900 px-3 py-1 rounded-full text-sm':'bg-red-50 text-red-800 px-3 py-1 rounded-full text-sm'}>{labels[p.state]||'要確認'}</span></div>
     <p className="text-sm text-stone-500">{p.playName}</p><p className="whitespace-pre-wrap leading-7 text-stone-800">{p.caption}</p>
     {p.publishedAt&&<p className="text-sm text-stone-500">公開記録：{new Date(p.publishedAt).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'})}</p>}
     {p.needsAttention&&<p className="text-amber-900 text-sm">公開結果の確認が必要です。再送せず、保存済みの記録と実際の投稿を照合してください。</p>}
     {p.permalink&&<a href={p.permalink} target="_blank" rel="noreferrer" className="underline text-red-800">Instagramで見る</a>}
    </div>
   </article>)}
  </>}
  {summary?.mode==='ended'&&<div className="p-6 bg-stone-100 rounded-2xl"><strong>今回の定時投稿期間は終了しました</strong><p>{endDate && `${endDate}までの予定でした。`}次の期間の投稿予定は未設定です。</p></div>}
  {summary?.mode==='legacy'&&posts.map(p=><article key={p.id} className="bg-white border rounded-2xl p-5 grid md:grid-cols-[260px_1fr] gap-6">
   <div>{p.published_media_key?.endsWith('.mp4')||jobs[p.id]?.video_url?<video className="w-full max-h-[460px] rounded-xl" src={p.published_media_key?.endsWith('.mp4')?`/media/${p.published_media_key}`:jobs[p.id]?.video_url||''} controls preload="metadata"/>:p.image_r2_key?<img className="w-full max-h-[460px] object-contain rounded-xl" src={`/media/${p.published_media_key||p.image_r2_key}`} alt="投稿用の写真"/>:<p>画像の準備状況を確認してください。</p>}</div>
   <div className="space-y-4"><span>{p.instagram_posted?'公開済み':labels[p.publish_state]||p.publish_state}</span><p className="whitespace-pre-wrap">{p.instagram_text}</p><div className="flex gap-4"><Link to={`/posts/${p.id}`} className="underline">内容を確認・編集</Link>{p.ig_permalink&&<a href={p.ig_permalink} target="_blank" rel="noreferrer" className="underline">Instagramで見る</a>}</div></div>
  </article>)}
  {transfers.length>0&&<section className="bg-white border rounded-2xl p-5"><h3 className="font-bold mb-3">Facebook・Xへの転記記録</h3>{transfers.map((t,i)=><div key={i} className="py-2 flex gap-4"><span>{t.platform==='x'?'X':'Facebook'}</span><span>{labels[t.status]||t.status}</span>{t.permalink&&<a className="underline" href={t.permalink} target="_blank" rel="noreferrer">投稿を見る</a>}</div>)}</section>}
  <div className="flex flex-wrap gap-4 text-sm"><button onClick={()=>void load()} className="border rounded-lg px-4 py-2">表示を更新</button><Link to="/calendar" className="p-2 underline">投稿カレンダー</Link><Link to="/verify" className="p-2 underline">写真チェック</Link><Link to="/stories" className="p-2 underline">ストーリーズ</Link></div>
 </div>;
}
