import { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { useSettings } from '../hooks/useData';
import { api } from '../lib/api';

interface SettingField {
  key: string;
  label: string;
  type: string;
  placeholder?: string;
}

interface SettingGroup {
  title: string;
  fields: SettingField[];
}

const SETTING_GROUPS: SettingGroup[] = [
  {
    title: '基本設定',
    fields: [
      { key: 'account_name', label: 'アカウント名', type: 'text', placeholder: '気良歌舞伎' },
      { key: 'start_date', label: '開始日', type: 'date' },
      { key: 'common_hashtags', label: '共通ハッシュタグ', type: 'text', placeholder: '#歌舞伎 #kabuki' },
      { key: 'kabuki_navi_base_url', label: 'KABUKI PLUS+ URL', type: 'text', placeholder: 'https://kabukiplus.com' },
    ],
  },
  {
    title: 'SNSアカウント',
    fields: [
      { key: 'sns_instagram', label: 'Instagram', type: 'text', placeholder: 'https://www.instagram.com/kerakabuki_official' },
      { key: 'sns_x', label: 'X（旧Twitter）', type: 'text', placeholder: 'https://x.com/KeraKabuki' },
      { key: 'sns_facebook', label: 'Facebook', type: 'text', placeholder: 'https://www.facebook.com/kerakabuki' },
      { key: 'sns_note', label: 'Note', type: 'text', placeholder: 'https://note.com/kerakabuki' },
      { key: 'sns_youtube', label: 'YouTube', type: 'text', placeholder: 'https://www.youtube.com/@kerakabuki' },
    ],
  },
  {
    title: 'CTAテンプレート',
    fields: [
      { key: 'cta_a_template', label: 'CTA A（詳しく知る）', type: 'text' },
      { key: 'cta_b_template', label: 'CTA B（公演情報）', type: 'text' },
      { key: 'cta_c_template', label: 'CTA C（歌舞伎を楽しむ）', type: 'text' },
      { key: 'cta_d_template', label: 'CTA D（クイズ予告）', type: 'text' },
    ],
  },
];

export default function SettingsPage() {
  const { data: settings, loading, refresh } = useSettings();
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(edited)) {
        await api.settings.update(key, value);
      }
      setEdited({});
      refresh();
      alert('設定を保存しました');
    } catch (e: any) {
      alert('エラー: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const getValue = (key: string) => edited[key] ?? settings[key] ?? '';
  const hasChanges = Object.keys(edited).length > 0;

  if (loading) return <div className="text-center py-12 text-gray-500">読み込み中...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">設定</h2>

      <div className="max-w-2xl space-y-6">
        {SETTING_GROUPS.map((group) => (
          <div key={group.title} className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">{group.title}</h3>
            <div className="space-y-4">
              {group.fields.map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
                  <input
                    type={type}
                    value={getValue(key)}
                    onChange={e => setEdited({ ...edited, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2 px-6 py-3 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
