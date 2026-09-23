import { useEffect, useState, useCallback } from 'react';
import { Film, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

// 夕方の舞台裏ストーリーズ投稿履歴ページ。
// 毎日19時台に自動投稿された舞台裏写真の履歴と、対象プールの残数を確認する。

interface StoryHistoryItem {
  id: number;
  filename: string;
  r2_key: string;
  scene_type: string | null;
  story_posted_at: string;
}

interface StoryHistoryResponse {
  pool_total: number;
  pool_unposted: number;
  history: StoryHistoryItem[];
}

// SQLite の datetime('now') は 'YYYY-MM-DD HH:MM:SS' 形式のUTC。JSTに変換して表示する。
function formatJST(dtUtc: string): string {
  const d = new Date(dtUtc.replace(' ', 'T') + 'Z');
  if (isNaN(d.getTime())) return dtUtc;
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export default function StoryHistoryPage() {
  const [data, setData] = useState<StoryHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = (await api.images.storyHistory()) as StoryHistoryResponse;
      setData(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) return <div className="text-center py-12 text-gray-500">読み込み中...</div>;

  const history = data?.history ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Film size={24} className="text-red-700" />
          ストーリーズ投稿履歴
        </h2>
        {data && (
          <span className="text-sm font-medium bg-red-50 text-red-800 px-3 py-1 rounded-full">
            対象{data.pool_total}枚・未投稿{data.pool_unposted}枚
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-6">
        毎日19時台に、写真チェック済みの舞台裏写真（楽屋・化粧・稽古など）を1枚、
        Instagramストーリーズへ自動投稿しています。ここで投稿済みの写真と対象プールの残りを確認できます。
        表示されるのは各写真の最新の投稿日時のみです（同じ写真が再投稿されると上書き）。
        未投稿が0枚になっても、投稿が古い写真から順に自動で再ローテーションします。
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          読み込みに失敗しました: {error}
        </div>
      )}

      {history.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Film size={40} className="mx-auto mb-3 text-gray-300" />
          <p>まだ投稿がありません（毎日19時台に自動投稿）</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((img) => (
            <div key={img.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* サムネイル（写真チェック画面と同じ /images/r2/ 経路） */}
              <div className="bg-gray-100 relative" style={{ aspectRatio: '4 / 3' }}>
                <img
                  src={`/images/r2/${img.r2_key}`}
                  alt={img.filename}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs hidden">
                  {img.filename}
                </div>
              </div>

              <div className="p-3">
                <div className="text-sm font-medium text-gray-900 truncate" title={img.filename}>
                  {img.filename}
                </div>
                {img.scene_type && (
                  <div className="text-xs text-gray-500 mt-1">場面: {img.scene_type}</div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  投稿: {formatJST(img.story_posted_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          再読み込み
        </button>
      </div>
    </div>
  );
}
