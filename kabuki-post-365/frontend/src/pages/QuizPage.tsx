import { useState, useRef } from 'react';
import { Upload, Edit, X } from 'lucide-react';
import { useQuizzes } from '../hooks/useData';
import { api } from '../lib/api';

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const DIFF_LABELS: Record<string, string> = { beginner: '初級', intermediate: '中級', advanced: '上級' };
const DIFF_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

export default function QuizPage() {
  const [filter, setFilter] = useState<Record<string, string>>({});
  const { data: quizzes, loading, refresh } = useQuizzes(Object.keys(filter).length ? filter : undefined);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = await api.quiz.import(data);
      alert(`${result.imported}件インポートしました`);
      refresh();
    } catch (err: any) {
      alert('インポートエラー: ' + err.message);
    }
  };

  const handleEdit = (q: any) => {
    setForm({ ...q, options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options });
    setEditingId(q.id);
  };

  const handleSave = async () => {
    if (!editingId) return;
    await api.quiz.update(editingId, form);
    setEditingId(null);
    refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">クイズ管理</h2>
        <div>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 text-sm">
            <Upload size={16} /> JSONインポート
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilter({})}
          className={`px-3 py-1.5 rounded-lg text-sm ${!filter.difficulty && !filter.used ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
        >すべて</button>
        {DIFFICULTIES.map(d => (
          <button key={d}
            onClick={() => setFilter({ difficulty: d })}
            className={`px-3 py-1.5 rounded-lg text-sm ${filter.difficulty === d ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
          >{DIFF_LABELS[d]}</button>
        ))}
        <button
          onClick={() => setFilter({ used: 'false' })}
          className={`px-3 py-1.5 rounded-lg text-sm ${filter.used === 'false' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
        >未使用</button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">読み込み中...</div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">クイズがありません</div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((q: any) => {
            const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
            return (
              <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${DIFF_COLORS[q.difficulty] || 'bg-gray-100'}`}>
                        {DIFF_LABELS[q.difficulty] || q.difficulty}
                      </span>
                      {q.category && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{q.category}</span>}
                      {q.post_date && <span className="text-xs text-gray-400">{q.post_date}</span>}
                    </div>
                    <p className="text-sm font-medium text-gray-900">{q.question}</p>
                    <div className="mt-2 grid grid-cols-2 gap-1">
                      {(options as string[]).map((opt: string, i: number) => (
                        <div key={i} className={`text-xs px-2 py-1 rounded ${i === q.correct_answer ? 'bg-green-50 text-green-700 font-medium' : 'bg-gray-50 text-gray-600'}`}>
                          {i + 1}. {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => handleEdit(q)} className="p-1 hover:bg-gray-100 rounded ml-2">
                    <Edit size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setEditingId(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">クイズ編集</h3>
              <button onClick={() => setEditingId(null)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">問題</label>
                <textarea rows={2} value={form.question || ''} onChange={e => setForm({ ...form, question: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
              {(form.options || []).map((_: string, i: number) => (
                <div key={i}>
                  <label className="text-sm font-medium text-gray-700">選択肢 {i + 1}</label>
                  <input type="text" value={form.options[i] || ''} onChange={e => {
                    const opts = [...form.options];
                    opts[i] = e.target.value;
                    setForm({ ...form, options: opts });
                  }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium text-gray-700">正解（0始まりのインデックス）</label>
                <input type="number" value={form.correct_answer ?? 0} onChange={e => setForm({ ...form, correct_answer: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">解説</label>
                <textarea rows={2} value={form.explanation || ''} onChange={e => setForm({ ...form, explanation: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">難易度</label>
                <select value={form.difficulty || 'intermediate'} onChange={e => setForm({ ...form, difficulty: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1">
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{DIFF_LABELS[d]}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">キャンセル</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-800">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
