import {useEffect,useState} from 'react';
import {api} from '../lib/api';
export default function ReelPanel({postId,published}:{postId:number;published:boolean}){
 const [job,setJob]=useState<{status:string;video_url:string|null}|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [date,setDate]=useState(new Date(Date.now()+32400000+86400000).toISOString().slice(0,10));
 useEffect(()=>{void api.reels.post(postId).then(setJob).catch(()=>{});},[postId]);
 async function schedule(){setBusy(true);try{await api.posts.schedule(postId,date);await api.reels.prepare();setJob(await api.reels.post(postId));setError(`${date}の定期投稿に設定しました`);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <section className="border rounded-xl p-4 my-4 bg-white space-y-3"><h3 className="font-semibold">リールと予約</h3>
  {job?.video_url&&<video src={job.video_url} controls preload="metadata" className="max-h-80 rounded-lg"/>}
  <p className="text-sm text-gray-500">{job?({ready:'動画の準備完了',queued:'クラウドで作成待ち',rendering:'動画を作成中',failed:'動画作成に失敗'}[job.status]||job.status):'写真チェック後に日付を選ぶと、クラウドでリールを作成します。'}</p>
  {!published&&<div className="flex gap-3 flex-wrap"><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="border rounded-lg p-2"/><button disabled={busy} onClick={schedule} className="bg-red-800 text-white rounded-lg px-4 py-2 disabled:opacity-50">{busy?'予約中…':'この日の定期投稿にする'}</button></div>}
  {error&&<p className="text-sm" role="status">{error}</p>}
 </section>;
}
