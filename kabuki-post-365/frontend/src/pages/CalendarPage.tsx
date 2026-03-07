import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useCalendar } from '../hooks/useData';
import { api } from '../lib/api';

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-200',
  approved: 'bg-green-200',
  posted: 'bg-blue-200',
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

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const posts = data?.posts || [];
  const postMap = new Map<string, any>();
  for (const p of posts) postMap.set(p.post_date, p);

  const cells: Array<{ day: number | null; post: any }> = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, post: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, post: postMap.get(dateStr) });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">カレンダー</h2>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50"
        >
          <Sparkles size={16} />
          {generating ? '生成中...' : '365日生成'}
        </button>
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
            {cells.map((cell, i) => (
              <div
                key={i}
                className={`min-h-[100px] p-1 border-b border-r border-gray-100 ${
                  cell.day ? 'cursor-pointer hover:bg-gray-50' : ''
                }`}
                onClick={() => cell.post && navigate(`/posts/${cell.post.id}`)}
              >
                {cell.day && (
                  <>
                    <div className="text-xs text-gray-500 mb-1">{cell.day}</div>
                    {cell.post && (
                      <div className="space-y-1">
                        <div className={`text-[10px] px-1 py-0.5 rounded ${STATUS_COLORS[cell.post.status] || 'bg-gray-100'}`}>
                          {cell.post.theme}
                        </div>
                        {cell.post.character_name && (
                          <div className="text-[10px] text-gray-500 truncate">{cell.post.character_name}</div>
                        )}
                        {cell.post.special_day && (
                          <div className="text-[10px] text-red-600 font-medium">{cell.post.special_day}</div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-200" /> 下書き</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200" /> 承認済</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-200" /> 投稿済</span>
      </div>
    </div>
  );
}
