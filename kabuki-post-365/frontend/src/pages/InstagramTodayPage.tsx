import {useEffect,useState,useCallback} from 'react';
import {Link} from 'react-router-dom';
import {api} from '../lib/api';
type Post={id:number;post_date:string;instagram_text:string|null;instagram_posted:number;ig_permalink:string|null;publish_state:string;publish_error:string|null;auto_publish:number;content_type:string;image_r2_key:string|null;published_media_key:string|null};
type Job={status:string;video_url:string|null;error?:string};
type Transfer={platform:string;status:string;permalink:string|null};
const labels:Record<string,string>={queued:'動画作成待ち',rendering:'動画を作成中',ready:'動画の準備完了',failed:'要確認',idle:'準備中',processing:'Instagramで処理中',creating:'メディア登録中',publishing:'公開確認中',uncertain:'公開結果の照合が必要',published:'公開済み',pending:'転記待ち'};
export default function InstagramTodayPage(){
 const [posts,setPosts]=useState<Post[]>([]),[jobs,setJobs]=useState<Record<number,Job|null>>({}),[transfers,setTransfers]=useState<Transfer[]>([]);
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[enabled,setEnabled]=useState(false);
 const date=new Date(Date.now()+32400000).toISOString().slice(0,10);
 const load=useCallback(async()=>{
  try{
   const list=await api.posts.list({from:date,to:date}) as Post[];setPosts(list);
   const entries=await Promise.all(list.map(async p=>[p.id,await api.reels.post(p.id)] as const));setJobs(Object.fromEntries(entries));
   setTransfers(await api.crossposts.list(date));setEnabled((await api.reels.status()).enabled);setError('');
  }catch(e){setError((e as Error).message);}
 },[date]);
 useEffect(()=>{void load();const t=setInterval(()=>void load(),30000);return()=>clearInterval(t);},[load]);
 async function prepare(){setBusy(true);try{await api.reels.prepare();await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <div className="max-w-5xl mx-auto space-y-6">
  <div className="flex flex-wrap gap-4 justify-between items-center"><div><p className="text-sm text-stone-500">{date} · 気良歌舞伎</p><h2 className="text-2xl font-bold text-stone-900">今日のInstagram</h2></div><Link to="/quick" className="rounded-xl bg-red-800 text-white px-5 py-3">写真を追加する</Link></div>
  <div className="rounded-2xl bg-stone-100 border border-stone-200 p-5 text-sm leading-7"><strong>毎日9時のリール</strong><p>写真とBGMからクラウドで作成します。動画が間に合わない日は写真を公開します。</p><p>Facebook・Xは、PCとCodexが起動している間、9〜23時の毎時に未投稿分を確認します。前日分も古い順に、各SNSで1日1件まで転記します。{enabled?'リール自動作成：有効':'リール自動作成：準備中'}</p></div>
  {error&&<p role="alert" className="text-red-700 bg-red-50 p-4 rounded-xl">{error}</p>}
  {!posts.length&&<p className="p-8 bg-white rounded-xl">今日の投稿はありません。カレンダーから準備できます。</p>}
  {posts.map(p=><article key={p.id} className="bg-white border rounded-2xl p-5 grid md:grid-cols-[260px_1fr] gap-6">
   <div>{(p.published_media_key?.endsWith('.mp4')||jobs[p.id]?.video_url)?<video className="w-full max-h-[460px] rounded-xl bg-stone-100" src={p.published_media_key?.endsWith('.mp4')?`/media/${p.published_media_key}`:jobs[p.id]?.video_url||''} controls preload="metadata"/>:p.image_r2_key?<img className="w-full max-h-[460px] object-contain rounded-xl bg-stone-100" src={`/media/${p.published_media_key||p.image_r2_key}`} alt="投稿する写真"/>:<div className="aspect-[9/16] max-h-[460px] rounded-xl bg-stone-100 flex items-center justify-center text-stone-500 text-center p-6">{labels[jobs[p.id]?.status||'idle']}</div>}</div>
   <div className="space-y-4"><div className="flex gap-2 flex-wrap"><span className="bg-stone-100 px-3 py-1 rounded-full text-sm">{p.auto_publish?'定期投稿':'手動投稿の下書き'}</span><span className="bg-red-50 text-red-800 px-3 py-1 rounded-full text-sm">{p.instagram_posted?'公開済み':labels[p.publish_state]||p.publish_state}</span></div>
    <p className="whitespace-pre-wrap leading-7 text-stone-800">{p.instagram_text||'写真に合わせた本文を準備します。'}</p>
    {p.publish_error&&<p className="text-red-700 text-sm">{p.publish_error}</p>}
    <div className="flex gap-4"><Link className="text-red-800 underline" to={`/posts/${p.id}`}>内容を確認・編集</Link>{p.ig_permalink&&<a href={p.ig_permalink} target="_blank" rel="noreferrer" className="underline">Instagramで見る</a>}</div>
   </div>
  </article>)}
  <section className="bg-white border rounded-2xl p-5"><h3 className="font-bold mb-3">Facebook・Xへの転記</h3>{transfers.length?transfers.map((t,i)=><div key={i} className="py-2 flex gap-4"><span>{t.platform==='x'?'X':'Facebook'}</span><span>{labels[t.status]||t.status}</span>{t.permalink&&<a className="underline" href={t.permalink} target="_blank" rel="noreferrer">投稿を見る</a>}</div>):<p className="text-sm text-stone-500">Instagramで公開すると、転記待ちに追加されます。</p>}</section>
  <div className="flex flex-wrap gap-4 text-sm"><button onClick={prepare} disabled={busy} className="border rounded-lg px-4 py-2 disabled:opacity-50">{busy?'確認中…':'動画作成待ちを更新'}</button><Link to="/calendar" className="p-2 underline">今後の予定</Link><Link to="/verify" className="p-2 underline">写真チェック</Link><Link to="/stories" className="p-2 underline">ストーリーズ</Link></div>
 </div>;
}
