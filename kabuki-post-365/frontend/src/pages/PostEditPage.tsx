import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Sparkles, Save, Loader2, ImageIcon, X, Search,
  Copy, Check, Send, CheckCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { api } from '../lib/api';

const PLATFORMS = [
  { key: 'x', label: 'X', icon: '𝕏', maxLen: 280, color: 'bg-black', canPost: true },
  { key: 'bluesky', label: 'Bluesky', icon: '🦋', maxLen: 300, color: 'bg-blue-500', canPost: true },
  { key: 'facebook', label: 'Facebook', icon: 'f', maxLen: 500, color: 'bg-blue-700', canPost: true },
  { key: 'instagram', label: 'Instagram', icon: '📷', maxLen: 2200, color: 'bg-gradient-to-br from-purple-600 to-orange-500', canPost: true },
] as const;

const THEMES = ['演目', '役者', '豆知識', '名場面', 'クイズ', '舞台裏', '歴史', '機能紹介'];
const CTA_TYPES = [
  { value: 'N', label: 'なし' },
  { value: 'A', label: '詳しく知る' },
  { value: 'B', label: '公演情報' },
  { value: 'C', label: '歌舞伎を楽しむ' },
  { value: 'D', label: 'クイズ予告' },
  { value: 'E', label: 'カスタム' },
  { value: 'F', label: '機能紹介' },
];

export default function PostEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [posting, setPosting] = useState<string | null>(null);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showImageGen, setShowImageGen] = useState(false);
  const [characters, setCharacters] = useState<any[]>([]);
  const [showInfo, setShowInfo] = useState(true);
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  useEffect(() => {
    if (!id) return;
    api.posts.get(Number(id)).then(setPost).finally(() => setLoading(false));
    api.characters.list().then(setCharacters);
  }, [id]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await api.posts.update(Number(id), post);
      const updated = await api.posts.get(Number(id));
      setPost(updated);
    } catch (e: any) {
      alert('エラー: ' + e.message);
    } finally {
      setSaving(false);
    }
  }, [id, post]);

  const handleGenerate = async (platform?: string) => {
    setGenerating(platform || 'all');
    try {
      // Save first to ensure latest data
      await api.posts.update(Number(id), post);
      const prompt = customPrompt.trim() || undefined;
      if (platform) {
        const result = await api.generate.singlePlatform(Number(id), platform, prompt);
        setPost((p: any) => ({ ...p, ...result.texts }));
      } else {
        const result = await api.generate.single(Number(id), prompt);
        setPost((p: any) => ({ ...p, ...result.texts }));
      }
    } catch (e: any) {
      alert('エラー: ' + e.message);
    } finally {
      setGenerating(null);
    }
  };

  const compressImage = async (r2Key: string, maxSize = 950_000): Promise<Blob | null> => {
    try {
      const res = await fetch(`/images/r2/${r2Key}`);
      if (!res.ok) return null;
      const blob = await res.blob();
      if (blob.size <= maxSize) return blob;

      // Compress using Canvas
      const img = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      // Scale down if needed
      let { width, height } = img;
      const maxDim = 1200;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);

      // Try decreasing quality until under maxSize
      for (let q = 0.8; q >= 0.3; q -= 0.1) {
        const compressed = await new Promise<Blob | null>(resolve =>
          canvas.toBlob(b => resolve(b), 'image/jpeg', q)
        );
        if (compressed && compressed.size <= maxSize) return compressed;
      }
      // Return lowest quality attempt
      return await new Promise<Blob | null>(resolve =>
        canvas.toBlob(b => resolve(b), 'image/jpeg', 0.3)
      );
    } catch {
      return null;
    }
  };

  const handlePost = async (platform: string) => {
    setPosting(platform);
    try {
      // Save first
      await api.posts.update(Number(id), post);

      // For Bluesky: compress image client-side
      let imageBlob: Blob | undefined;
      if (platform === 'bluesky' && post.image_r2_key) {
        imageBlob = (await compressImage(post.image_r2_key)) || undefined;
      }

      const result = await api.autoPost.postSingle(Number(id), platform, imageBlob);
      if (result.success) {
        setPost((p: any) => ({ ...p, [`${platform}_posted`]: 1, status: 'posted' }));
      } else {
        alert(`投稿エラー: ${result.error}`);
      }
    } catch (e: any) {
      alert('投稿エラー: ' + (e.message || JSON.stringify(e)));
    } finally {
      setPosting(null);
    }
  };

  const getFullText = (platform: string) => {
    const text = post[`${platform}_text`] || '';
    const hashtags = post[`${platform}_hashtags`] || '';
    if (platform === 'bluesky') return text;
    return hashtags ? `${text}\n\n${hashtags}` : text;
  };

  const handleCopy = async (platform: string) => {
    const text = getFullText(platform);
    if (!text) { alert('投稿文がありません'); return; }
    await navigator.clipboard.writeText(text);
    setCopiedPlatform(platform);
    setTimeout(() => setCopiedPlatform(null), 2000);
  };

  const isPosted = (platform: string) => !!post[`${platform}_posted`];
  const hasText = (platform: string) => !!post[`${platform}_text`];

  if (loading) return <div className="text-center py-12 text-gray-500">読み込み中...</div>;
  if (!post) return <div className="text-center py-12 text-gray-500">投稿が見つかりません</div>;

  const allPosted = PLATFORMS.every(p => isPosted(p.key) || !hasText(p.key));
  const anyText = PLATFORMS.some(p => hasText(p.key));

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{post.post_date}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{post.theme}</span>
              {post.character_name && (
                <span className="text-xs text-gray-500">{post.character_name}</span>
              )}
              {allPosted && anyText && (
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                  <CheckCircle size={10} /> 全投稿済
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          保存
        </button>
      </div>

      {/* Collapsible Post Info */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4">
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700"
        >
          <span className="flex items-center gap-2">
            投稿設定
            {post.image_r2_key && <ImageIcon size={14} className="text-green-600" />}
          </span>
          {showInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showInfo && (
          <div className="px-4 pb-4 border-t border-gray-100 pt-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Theme */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">テーマ</label>
                <select
                  value={post.theme || ''}
                  onChange={e => setPost({ ...post, theme: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white"
                >
                  {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Character */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">キャラクター</label>
                <select
                  value={post.character_id || ''}
                  onChange={e => {
                    const charId = e.target.value ? Number(e.target.value) : null;
                    const char = characters.find(c => c.id === charId);
                    setPost({ ...post, character_id: charId, character_name: char?.name || null });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white"
                >
                  <option value="">なし</option>
                  {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* CTA */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">CTA</label>
                <select
                  value={post.cta_type || 'N'}
                  onChange={e => setPost({ ...post, cta_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white"
                >
                  {CTA_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              {/* Special day */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">特別な日</label>
                <input
                  type="text"
                  value={post.special_day || ''}
                  onChange={e => setPost({ ...post, special_day: e.target.value })}
                  placeholder="例: 南座開幕"
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                />
              </div>
            </div>

            {/* Image row */}
            <div className="mt-3 flex items-center gap-3">
              {post.image_r2_key ? (
                <>
                  <img
                    src={`/images/r2/${post.image_r2_key}`}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowImagePicker(true)}
                      className="text-xs text-gray-600 border border-gray-300 rounded-lg px-2 py-1 hover:bg-gray-50"
                    >
                      変更
                    </button>
                    <button
                      onClick={() => setShowImageGen(true)}
                      className="text-xs text-purple-600 border border-purple-200 rounded-lg px-2 py-1 hover:bg-purple-50 flex items-center gap-1"
                    >
                      <Sparkles size={10} /> AI生成
                    </button>
                    <button
                      onClick={() => setPost({ ...post, image_id: null, image_r2_key: null, image_filename: null })}
                      className="text-xs text-red-600 border border-red-200 rounded-lg px-2 py-1 hover:bg-red-50"
                    >
                      解除
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowImagePicker(true)}
                    className="flex items-center gap-1 text-xs text-gray-500 border border-dashed border-gray-300 rounded-lg px-3 py-2 hover:border-gray-400"
                  >
                    <ImageIcon size={14} /> 画像を選択
                  </button>
                  <button
                    onClick={() => setShowImageGen(true)}
                    className="flex items-center gap-1 text-xs text-purple-600 border border-dashed border-purple-300 rounded-lg px-3 py-2 hover:border-purple-400"
                  >
                    <Sparkles size={14} /> AI画像生成
                  </button>
                </div>
              )}

              {/* CTA URL */}
              <div className="flex-1">
                <input
                  type="url"
                  value={post.cta_url || ''}
                  onChange={e => setPost({ ...post, cta_url: e.target.value })}
                  placeholder="CTA URL"
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Prompt + Generate All Button */}
      <div className="mb-4 space-y-2">
        <textarea
          rows={2}
          value={customPrompt}
          onChange={e => setCustomPrompt(e.target.value)}
          placeholder="AI への追加指示（任意）例: けらのすけの紹介投稿として書いて、チャット画面のスクショを添付する前提で"
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
        />
        <button
          onClick={() => handleGenerate()}
          disabled={generating !== null}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-700 text-white rounded-xl hover:bg-red-800 disabled:opacity-50 font-medium"
        >
          {generating === 'all' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          全プラットフォーム AI一斉生成
        </button>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {PLATFORMS.map(platform => {
          const posted = isPosted(platform.key);
          const text = post[`${platform.key}_text`] || '';
          const hashtags = post[`${platform.key}_hashtags`] || '';
          const isEditing = editingPlatform === platform.key;
          const charCount = text.length;
          const isCopied = copiedPlatform === platform.key;
          const isPosting = posting === platform.key;
          const isGenerating = generating === platform.key;

          return (
            <div
              key={platform.key}
              className={`bg-white rounded-xl border-2 transition-colors ${
                posted ? 'border-green-300 bg-green-50/30' : 'border-gray-200'
              }`}
            >
              {/* Platform Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-full ${platform.color} text-white flex items-center justify-center text-xs font-bold`}>
                    {platform.icon}
                  </span>
                  <span className="font-medium text-sm text-gray-900">{platform.label}</span>
                  <span className="text-xs text-gray-400">{charCount}/{platform.maxLen}</span>
                </div>
                <div className="flex items-center gap-1">
                  {posted && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                      <CheckCircle size={10} /> 投稿済
                    </span>
                  )}
                </div>
              </div>

              {/* Text Content */}
              <div className="p-4">
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      rows={6}
                      value={text}
                      onChange={e => setPost({ ...post, [`${platform.key}_text`]: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      autoFocus
                    />
                    {platform.key !== 'bluesky' && (
                      <input
                        type="text"
                        value={hashtags}
                        onChange={e => setPost({ ...post, [`${platform.key}_hashtags`]: e.target.value })}
                        placeholder="ハッシュタグ"
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs"
                      />
                    )}
                    <button
                      onClick={() => setEditingPlatform(null)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      閉じる
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditingPlatform(platform.key)}
                    className="cursor-text min-h-[80px]"
                  >
                    {text ? (
                      <div>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{text}</p>
                        {hashtags && (
                          <p className="text-xs text-blue-600 mt-1">{hashtags}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-300 italic">テキストなし（AI生成またはクリックで入力）</p>
                    )}
                  </div>
                )}
              </div>

              {/* Character Count */}
              {text && (platform.key === 'x' || platform.key === 'bluesky') && (() => {
                const full = getFullText(platform.key);
                // X uses weighted counting: CJK/fullwidth = 2, ASCII = 1, URL = 23 fixed
                const countX = (s: string) => {
                  let c = 0;
                  const noUrl = s.replace(/https?:\/\/[^\s\u3000]+/g, () => { c += 23; return ''; });
                  for (const ch of noUrl) {
                    c += ch.charCodeAt(0) > 0x7F ? 2 : 1;
                  }
                  return c;
                };
                const count = platform.key === 'x' ? countX(full) : full.length;
                const limit = platform.key === 'x' ? 280 : 300;
                const over = count > limit;
                return (
                  <div className={`px-4 text-xs ${over ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                    {count} / {limit}{platform.key === 'x' ? 'カウント' : '文字'}{over && ` （${count - limit}オーバー）`}
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 px-4 pb-3">
                {/* AI Generate */}
                <button
                  onClick={() => handleGenerate(platform.key)}
                  disabled={generating !== null}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-700 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  AI生成
                </button>

                {/* Copy */}
                <button
                  onClick={() => handleCopy(platform.key)}
                  disabled={!text}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {isCopied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                  {isCopied ? 'コピー済' : 'コピー'}
                </button>

                {/* Post / Share Button */}
                {platform.key === 'x' ? (
                  /* X: Copy image + Web Intent */
                  <>
                    {post.image_r2_key && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`/images/r2/${post.image_r2_key}`);
                            const blob = await res.blob();
                            const pngBlob = blob.type === 'image/png' ? blob
                              : await new Promise<Blob>((resolve) => {
                                  const img = new Image();
                                  img.onload = () => {
                                    const canvas = document.createElement('canvas');
                                    canvas.width = img.width;
                                    canvas.height = img.height;
                                    canvas.getContext('2d')!.drawImage(img, 0, 0);
                                    canvas.toBlob(b => resolve(b!), 'image/png');
                                  };
                                  img.src = URL.createObjectURL(blob);
                                });
                            await navigator.clipboard.write([
                              new ClipboardItem({ 'image/png': pngBlob }),
                            ]);
                            alert('画像をコピーしました！Xの投稿画面でCtrl+Vで貼り付けてください');
                          } catch {
                            // Fallback: open image in new tab
                            window.open(`/images/r2/${post.image_r2_key}`, '_blank');
                            alert('画像コピーに失敗しました。新しいタブで画像を開いたので、右クリック→コピーしてください');
                          }
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 ml-auto"
                      >
                        <ImageIcon size={12} />
                        画像コピー
                      </button>
                    )}
                    {posted ? (
                      <span className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-white bg-green-500 rounded-lg ml-auto">
                        <CheckCircle size={12} />
                        投稿済
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            const fullText = getFullText('x');
                            if (!fullText) { alert('X の投稿文がありません'); return; }
                            window.open(
                              `https://x.com/intent/post?text=${encodeURIComponent(fullText)}`,
                              '_blank',
                              'width=600,height=400',
                            );
                          }}
                          disabled={!text}
                          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 ${post.image_r2_key ? '' : 'ml-auto'}`}
                        >
                          <Send size={12} />
                          Xで投稿
                        </button>
                        <button
                          onClick={async () => {
                            await api.posts.update(Number(id), { ...post, x_posted: 1 });
                            setPost((p: any) => ({ ...p, x_posted: 1, status: 'posted' }));
                          }}
                          disabled={!text}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-green-700 border border-green-200 rounded-lg hover:bg-green-50 disabled:opacity-50"
                        >
                          <Check size={12} />
                          投稿済みにする
                        </button>
                      </>
                    )}
                  </>
                ) : platform.canPost ? (
                  <button
                    onClick={() => {
                      if (!confirm(`${platform.label}に投稿しますか？`)) return;
                      handlePost(platform.key);
                    }}
                    disabled={!text || posted || isPosting}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs text-white rounded-lg disabled:opacity-50 ml-auto ${
                      posted ? 'bg-green-500' : `${platform.color} hover:opacity-90`
                    }`}
                  >
                    {isPosting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : posted ? (
                      <CheckCircle size={12} />
                    ) : (
                      <Send size={12} />
                    )}
                    {posted ? '投稿済' : isPosting ? '投稿中...' : `${platform.label}に投稿`}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Image picker modal */}
      {showImagePicker && (
        <ImagePickerModal
          onSelect={(image: any) => {
            setPost((p: any) => ({
              ...p,
              image_id: image.id,
              image_r2_key: image.r2_key,
              image_filename: image.filename,
            }));
            setShowImagePicker(false);
          }}
          onClose={() => setShowImagePicker(false)}
          currentImageId={post.image_id}
        />
      )}

      {/* AI Image generation modal */}
      {showImageGen && (
        <ImageGenModal
          onGenerated={(image: any) => {
            setPost((p: any) => ({
              ...p,
              image_id: image.id,
              image_r2_key: image.r2_key,
              image_filename: image.filename,
            }));
            setShowImageGen(false);
          }}
          onClose={() => setShowImageGen(false)}
        />
      )}
    </div>
  );
}

function ImageGenModal({ onGenerated, onClose }: {
  onGenerated: (image: any) => void;
  onClose: () => void;
}) {
  const [prompt, setPrompt] = useState('');
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<{ imageBase64: string; mimeType: string; id: number; r2_key: string; filename: string } | null>(null);

  const handleFileChange = (file: File | null) => {
    setReferenceFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setReferencePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setReferencePreview(null);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) { alert('プロンプトを入力してください'); return; }
    setGenerating(true);
    setPreview(null);
    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      if (referenceFile) {
        formData.append('reference_image', referenceFile);
      }
      const result = await api.images.generate(formData);
      setPreview({
        imageBase64: result.imageBase64,
        mimeType: result.mimeType,
        id: result.id,
        r2_key: result.r2_key,
        filename: result.filename,
      });
    } catch (e: any) {
      alert('画像生成エラー: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles size={18} className="text-purple-600" />
            AI画像生成
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Reference image */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">参考画像（任意）</label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={e => handleFileChange(e.target.files?.[0] || null)}
                className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border file:border-gray-300 file:bg-white file:text-gray-700 file:text-xs hover:file:bg-gray-50"
              />
              {referencePreview && (
                <img src={referencePreview} alt="参考" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
              )}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">プロンプト</label>
            <textarea
              rows={4}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="例: この画像のキャラクターを使って、SNS投稿用の画像を生成してください。スマートフォンのチャット画面の前に立ち、歌舞伎の舞台をイメージした和風の背景。正方形構図。"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 font-medium"
          >
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                生成中...（30秒〜1分）
              </>
            ) : (
              <>
                <Sparkles size={16} />
                画像を生成
              </>
            )}
          </button>

          {/* Preview */}
          {preview && (
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <img
                  src={`data:${preview.mimeType};base64,${preview.imageBase64}`}
                  alt="生成画像"
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onGenerated({ id: preview.id, r2_key: preview.r2_key, filename: preview.filename })}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  <Check size={14} />
                  この画像を使う
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center gap-1 px-4 py-2 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50 text-sm"
                >
                  <Sparkles size={14} />
                  再生成
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
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
  const [uploading, setUploading] = useState(false);

  const loadImages = () => {
    setLoading(true);
    api.images.list().then(setImages).finally(() => setLoading(false));
  };

  useEffect(() => { loadImages(); }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('original', file, file.name);
      formData.append('scene_type', 'アップロード');
      formData.append('visual_features', file.name);
      formData.append('season_tag', '通年');
      const result = await api.images.upload(formData);
      // Select the uploaded image immediately
      onSelect({ id: result.id, r2_key: result.r2_key, filename: result.filename });
    } catch (e: any) {
      alert('アップロードエラー: ' + e.message);
      setUploading(false);
    }
  };

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
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">画像を選択</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <div className="px-5 py-3 border-b border-gray-100 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="演目名・ファイル名で検索..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <label className={`flex items-center gap-1.5 px-3 py-2 text-sm border border-dashed border-gray-400 rounded-lg cursor-pointer hover:bg-gray-50 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
              {uploading ? 'アップロード中...' : '新規アップロード'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="text-center py-12 text-gray-500">読み込み中...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {search ? '該当する画像がありません' : '画像がありません'}
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
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-white text-xs truncate">{img.play_name || img.filename}</p>
                  </div>
                  {img.id === currentImageId && (
                    <div className="absolute top-2 right-2 bg-red-700 text-white text-xs px-2 py-0.5 rounded-full">選択中</div>
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
