import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Save, Loader2, ImageIcon, X, Search, ExternalLink, Copy, Check, MessageCircle } from 'lucide-react';
import { api } from '../lib/api';

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', maxLen: 2200 },
  { key: 'facebook', label: 'Facebook', maxLen: 500 },
  { key: 'bluesky', label: 'Bluesky', maxLen: 300 },
  { key: 'x', label: 'X', maxLen: 280 },
] as const;

const THEMES = ['演目', '役者', '豆知識', '名場面', 'クイズ', '舞台裏', '歴史', '機能紹介'];

const CTA_TYPES = [
  { value: 'N', label: 'N: なし' },
  { value: 'A', label: 'A: 詳しく知る' },
  { value: 'B', label: 'B: 公演情報' },
  { value: 'C', label: 'C: 歌舞伎を楽しむ' },
  { value: 'D', label: 'D: クイズ予告' },
  { value: 'E', label: 'E: カスタム' },
  { value: 'F', label: 'F: 機能紹介' },
];

export default function PostEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('instagram');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [characters, setCharacters] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    api.posts.get(Number(id)).then(setPost).finally(() => setLoading(false));
    api.characters.list().then(setCharacters);
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.posts.update(Number(id), post);
      const updated = await api.posts.get(Number(id));
      setPost(updated);
      alert('保存しました');
    } catch (e: any) {
      alert('エラー: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async (platform?: string) => {
    setGenerating(platform || 'all');
    try {
      if (platform) {
        const result = await api.generate.singlePlatform(Number(id), platform);
        setPost((p: any) => ({ ...p, ...result.texts }));
      } else {
        const result = await api.generate.single(Number(id));
        setPost((p: any) => ({ ...p, ...result.texts }));
      }
    } catch (e: any) {
      alert('エラー: ' + e.message);
    } finally {
      setGenerating(null);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await api.posts.updateStatus(Number(id), status);
      setPost((p: any) => ({ ...p, status }));
    } catch (e: any) {
      alert('エラー: ' + e.message);
    }
  };

  const [copied, setCopied] = useState(false);

  const getFullText = (platform: string) => {
    const text = post[`${platform}_text`] || '';
    const hashtags = post[`${platform}_hashtags`] || '';
    if (platform === 'bluesky') return text; // hashtags are inline
    return hashtags ? `${text}\n\n${hashtags}` : text;
  };

  const handleShareX = () => {
    const text = getFullText('x');
    if (!text) { alert('X の投稿文がありません'); return; }
    const url = `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleCopyText = async (platform: string) => {
    const text = getFullText(platform);
    if (!text) { alert('投稿文がありません'); return; }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageSelect = (image: any) => {
    setPost((p: any) => ({
      ...p,
      image_id: image.id,
      image_r2_key: image.r2_key,
      image_filename: image.filename,
    }));
    setShowImagePicker(false);
  };

  const handleImageClear = () => {
    setPost((p: any) => ({
      ...p,
      image_id: null,
      image_r2_key: null,
      image_filename: null,
    }));
  };

  if (loading) return <div className="text-center py-12 text-gray-500">読み込み中...</div>;
  if (!post) return <div className="text-center py-12 text-gray-500">投稿が見つかりません</div>;

  const activePlatform = PLATFORMS.find(p => p.key === activeTab)!;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">投稿編集</h2>
          <p className="text-sm text-gray-500">{post.post_date} ({post.theme})</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Info + Image */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">投稿情報</h3>
            <div className="space-y-3">
              {/* 日付 (read-only) */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">日付</label>
                <div className="text-sm font-medium text-gray-900">{post.post_date}</div>
              </div>

              {/* テーマ */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">テーマ</label>
                <select
                  value={post.theme || ''}
                  onChange={e => setPost({ ...post, theme: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                >
                  {THEMES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* キャラクター */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">キャラクター</label>
                <select
                  value={post.character_id || ''}
                  onChange={e => {
                    const charId = e.target.value ? Number(e.target.value) : null;
                    const char = characters.find(c => c.id === charId);
                    setPost({ ...post, character_id: charId, character_name: char?.name || null });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                >
                  <option value="">なし</option>
                  {characters.map(c => (
                    <option key={c.id} value={c.id}>{c.name}（{c.related_play}）</option>
                  ))}
                </select>
              </div>

              {/* 特別な日 */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">特別な日</label>
                <input
                  type="text"
                  value={post.special_day || ''}
                  onChange={e => setPost({ ...post, special_day: e.target.value })}
                  placeholder="例: 南座『曽根崎心中物語』開幕"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              {/* CTAタイプ */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">CTA タイプ</label>
                <select
                  value={post.cta_type || 'A'}
                  onChange={e => setPost({ ...post, cta_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                >
                  {CTA_TYPES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* CTA URL */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">CTA URL</label>
                <input
                  type="url"
                  value={post.cta_url || ''}
                  onChange={e => setPost({ ...post, cta_url: e.target.value })}
                  placeholder="https://kabukiplus.com/kabuki/live"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Image section */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ImageIcon size={16} />
              投稿画像
            </h3>
            {post.image_r2_key ? (
              <div>
                <div className="rounded-lg overflow-hidden bg-gray-50">
                  <img
                    src={`/images/r2/${post.image_r2_key}`}
                    alt={post.image_filename || '投稿画像'}
                    className="w-full h-auto object-contain max-h-64"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">{post.image_filename}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setShowImagePicker(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <ImageIcon size={14} />
                    変更
                  </button>
                  <button
                    onClick={handleImageClear}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    <X size={14} />
                    解除
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowImagePicker(true)}
                className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
              >
                <ImageIcon size={32} />
                <span className="text-sm">画像を選択</span>
              </button>
            )}
          </div>

          {/* Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">ステータス</h3>
            <div className="flex gap-2">
              {['draft', 'approved', 'posted'].map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    post.status === s
                      ? s === 'draft' ? 'bg-yellow-200 text-yellow-800' :
                        s === 'approved' ? 'bg-green-200 text-green-800' :
                        'bg-blue-200 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s === 'draft' ? '下書き' : s === 'approved' ? '承認済' : '投稿済'}
                </button>
              ))}
            </div>
          </div>

          {/* Generate all */}
          <button
            onClick={() => handleGenerate()}
            disabled={generating !== null}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50"
          >
            {generating === 'all' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            全プラットフォーム AI生成
          </button>
        </div>

        {/* Right: Text editor with tabs */}
        <div className="bg-white rounded-xl border border-gray-200">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {PLATFORMS.map(p => (
              <button
                key={p.key}
                onClick={() => setActiveTab(p.key)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === p.key
                    ? 'border-b-2 border-red-700 text-red-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-4">
            {/* Text */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">本文</label>
                <span className="text-xs text-gray-400">
                  {(post[`${activeTab}_text`] || '').length} / {activePlatform.maxLen}
                </span>
              </div>
              <textarea
                rows={8}
                value={post[`${activeTab}_text`] || ''}
                onChange={e => setPost({ ...post, [`${activeTab}_text`]: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Hashtags (not for Bluesky - hashtags are inline) */}
            {activeTab !== 'bluesky' && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">ハッシュタグ</label>
                <input
                  type="text"
                  value={post[`${activeTab}_hashtags`] || ''}
                  onChange={e => setPost({ ...post, [`${activeTab}_hashtags`]: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Bluesky note */}
            {activeTab === 'bluesky' && (
              <p className="text-xs text-gray-400">Bluesky はハッシュタグを本文中に含めます</p>
            )}

            {/* Comment (per-platform) */}
            {(() => {
              let comments: Record<string, string> = {};
              try {
                if (post.quiz_answer_comment) {
                  const parsed = JSON.parse(post.quiz_answer_comment);
                  if (typeof parsed === 'object' && parsed !== null) {
                    comments = parsed;
                  } else {
                    comments = { instagram: post.quiz_answer_comment, facebook: post.quiz_answer_comment };
                  }
                }
              } catch {
                comments = { instagram: post.quiz_answer_comment || '', facebook: post.quiz_answer_comment || '' };
              }
              return (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <MessageCircle size={14} />
                    {(activeTab === 'x' || activeTab === 'bluesky') ? '追記テキスト' : 'コメント欄投稿'}
                  </label>
                  <textarea
                    rows={3}
                    value={comments[activeTab] || ''}
                    onChange={e => {
                      const updated = { ...comments, [activeTab]: e.target.value };
                      setPost({ ...post, quiz_answer_comment: JSON.stringify(updated) });
                    }}
                    placeholder={(activeTab === 'x' || activeTab === 'bluesky')
                      ? "本文の末尾に改行して追記されます"
                      : post.theme === 'クイズ'
                        ? "例: 【クイズの答え】\n正解は「○○」でした！"
                        : "投稿後にコメント欄へ自動投稿されます"}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {(activeTab === 'x' || activeTab === 'bluesky')
                      ? '投稿時に本文末尾へ改行して追記されます'
                      : activeTab === 'facebook'
                        ? '投稿後にコメント欄へ自動投稿（URLなど）'
                        : '投稿後にコメント欄へ自動投稿'}
                  </p>
                </div>
              );
            })()}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {/* Per-platform generate */}
              <button
                onClick={() => handleGenerate(activeTab)}
                disabled={generating !== null}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-700 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                {generating === activeTab ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                AI生成
              </button>

              {/* Copy text */}
              <button
                onClick={() => handleCopyText(activeTab)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                {copied ? 'コピー済' : 'テキストをコピー'}
              </button>

              {/* X share button (Web Intent) */}
              {activeTab === 'x' && (
                <button
                  onClick={handleShareX}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-black rounded-lg hover:bg-gray-800"
                >
                  <ExternalLink size={14} />
                  X で投稿
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          保存
        </button>
      </div>

      {/* Image picker modal */}
      {showImagePicker && (
        <ImagePickerModal
          onSelect={handleImageSelect}
          onClose={() => setShowImagePicker(false)}
          currentImageId={post.image_id}
        />
      )}
    </div>
  );
}

function ImagePickerModal({ onSelect, onClose, currentImageId }: {
  onSelect: (image: any) => void;
  onClose: () => void;
  currentImageId: number | null;
}) {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.images.list().then(setImages).finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? images.filter(img =>
        (img.play_name || '').includes(search) ||
        (img.filename || '').includes(search) ||
        (img.visual_features || '').includes(search) ||
        (img.navi_caption || '').includes(search)
      )
    : images;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">画像を選択</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="演目名・ファイル名で検索..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Image grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="text-center py-12 text-gray-500">読み込み中...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {search ? '該当する画像がありません' : '画像がありません。画像管理ページからアップロードしてください。'}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {filtered.map((img: any) => (
                <button
                  key={img.id}
                  onClick={() => onSelect(img)}
                  className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    img.id === currentImageId
                      ? 'border-red-700 ring-2 ring-red-200'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img
                    src={`/images/r2/${img.r2_key}`}
                    alt={img.filename}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '';
                      (e.target as HTMLImageElement).className = 'w-full h-full bg-gray-200';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-white text-xs truncate">{img.play_name || img.filename}</p>
                  </div>
                  {img.id === currentImageId && (
                    <div className="absolute top-2 right-2 bg-red-700 text-white text-xs px-2 py-0.5 rounded-full">
                      選択中
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
