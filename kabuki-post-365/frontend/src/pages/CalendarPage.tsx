import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, Plus } from 'lucide-react';
import { useCalendar } from '../hooks/useData';
import { api } from '../lib/api';

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

const PLATFORM_BADGES: Record<string, { letter: string; label: string; color: string; postedColor: string }> = {
  x: { letter: 'X', label: 'X', color: 'bg-gray-200 text-gray-500', postedColor: 'bg-black text-white' },
  bluesky: { letter: 'B', label: 'Bluesky', color: 'bg-blue-100 text-blue-300', postedColor: 'bg-blue-500 text-white' },
  facebook: { letter: 'F', label: 'Facebook', color: 'bg-blue-100 text-blue-300', postedColor: 'bg-blue-700 text-white' },
  instagram: { letter: 'I', label: 'Instagram', color: 'bg-pink-100 text-pink-300', postedColor: 'bg-gradient-to-br from-purple-600 to-orange-500 text-white' },
};

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [generating, setGenerating] = useState(false);
  const { data, loading, refresh } = useCalendar(year, month);
  const navigate = useNavigate();

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const handleGenerate = async () => {
    if (!confirm('365日分のカレンダーを生成しますか？既存のデータは上書きされます。')) return;
    setGenerating(true);
    try {
      const result = await api.calendar.generate();
      alert(`${result.generated}件の投稿を生成しました（開始日: ${result.start_date}）`);
      refresh();
    } catch (e: any) {
      alert('エラー: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const goToToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
  };

  const handleAddPost = async (dateStr: string) => {
    const dow = new Date(dateStr).getDay();
    try {
      const result = await api.posts.create({
        post_date: dateStr,
        day_of_week: dow,
        theme: ['歴史', '演目', '役者', '豆知識', '名場面', 'クイズ', '舞台裏'][dow] || '豆知識',
        status: 'draft',
      });
      navigate(`/posts/${result.id}`);
    } catch (e: any) {
      alert('エラー: ' + e.message);
    }
  };

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const posts = data?.posts || [];
  const postMap = new Map<string, any>();
  for (const p of posts) postMap.set(p.post_date, p);

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Group posts by date (multiple posts per day)
  const postsMap = new Map<string, any[]>();
  for (const p of posts) {
    const arr = postsMap.get(p.post_date) || [];
    arr.push(p);
    postsMap.set(p.post_date, arr);
  }

  const cells: Array<{ day: number | null; dateStr: string; posts: any[] }> = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, dateStr: '', posts: [] });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, dateStr, posts: postsMap.get(dateStr) || [] });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">カレンダー</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            今日
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50 text-sm"
          >
            <Sparkles size={14} />
            {generating ? '生成中...' : '365日生成'}
          </button>
        </div>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={20} /></button>
        <span className="text-xl font-semibold">{year}年{month}月</span>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={20} /></button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">読み込み中...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-7">
            {DAY_LABELS.map((label, i) => (
              <div key={label} className={`text-center py-2 text-sm font-medium border-b border-gray-200 ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'
              }`}>{label}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {cells.map((cell, i) => {
              const isToday = cell.dateStr === todayStr;
              return (
                <div
                  key={i}
                  className={`min-h-[90px] p-1 border-b border-r border-gray-100 ${
                    isToday ? 'bg-red-50/50' : ''
                  }`}
                >
                  {cell.day && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${isToday ? 'font-bold text-red-700' : 'text-gray-500'}`}>
                          {cell.day}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAddPost(cell.dateStr); }}
                          className="w-4 h-4 flex items-center justify-center rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100"
                          title="投稿を追加"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                      {cell.posts.length > 0 ? (
                        <div className="space-y-0.5 mt-0.5">
                          {cell.posts.map((post: any) => (
                            <div
                              key={post.id}
                              onClick={() => navigate(`/posts/${post.id}`)}
                              className="cursor-pointer hover:bg-gray-100 rounded px-0.5 py-0.5 transition-colors"
                            >
                              <div className="text-[10px] px-1 py-0.5 rounded bg-gray-100 text-gray-700 truncate">
                                {post.theme}
                              </div>
                              <div className="flex gap-px px-0.5 mt-0.5">
                                {Object.entries(PLATFORM_BADGES).map(([key, badge]) => {
                                  const posted = !!post[`${key}_posted`];
                                  const hasText = !!post[`${key}_text`];
                                  return (
                                    <div
                                      key={key}
                                      title={`${badge.label}: ${posted ? '投稿済' : hasText ? 'テキスト有' : '未作成'}`}
                                      className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center text-[7px] font-bold leading-none ${
                                        posted ? badge.postedColor :
                                        hasText ? 'bg-yellow-300 text-yellow-700' :
                                        badge.color
                                      }`}
                                    >
                                      {badge.letter}
                                    </div>
                                  );
                                })}
                              </div>
                              {post.special_day && (
                                <div className="text-[9px] text-red-600 font-medium truncate">{post.special_day}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-gray-500">
        <span className="font-medium text-gray-700">凡例:</span>
        {Object.entries(PLATFORM_BADGES).map(([, badge]) => (
          <span key={badge.letter} className="flex items-center gap-1">
            <span className={`w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-bold ${badge.postedColor}`}>
              {badge.letter}
            </span>
            {badge.label}
          </span>
        ))}
        <span className="text-gray-400 ml-2">
          色付き=投稿済 / 黄=テキスト有 / 薄=未作成
        </span>
      </div>
    </div>
  );
}
