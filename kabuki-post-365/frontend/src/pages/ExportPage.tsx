import { useState } from 'react';
import { Download } from 'lucide-react';
import { api } from '../lib/api';

export default function ExportPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [platform, setPlatform] = useState('all');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;
      if (platform !== 'all') params.platform = platform;

      const csvText = await api.export.csv(params);
      const blob = new Blob([csvText], { type: 'text/csv; charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kabuki-post-365_${from || 'all'}_${to || 'all'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('エクスポートエラー: ' + e.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">CSVエクスポート</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">開始日</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">終了日</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">プラットフォーム</label>
            <select value={platform} onChange={e => setPlatform(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="all">すべて</option>
              <option value="instagram">Instagram</option>
              <option value="x">X</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50"
          >
            <Download size={16} />
            {exporting ? 'エクスポート中...' : 'CSVダウンロード'}
          </button>
        </div>
      </div>
    </div>
  );
}
