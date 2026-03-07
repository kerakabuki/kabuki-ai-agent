import { useState, useRef, useCallback } from 'react';
import { Upload, Trash2, Star, Loader2, Sparkles, X, ImagePlus, ChevronDown, ChevronUp } from 'lucide-react';
import { useImages, useCharacters } from '../hooks/useData';
import { api } from '../lib/api';
import { processImageFile } from '../lib/image-resize';

interface StagedFile {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'analyzing' | 'analyzed' | 'uploading' | 'done' | 'error';
  error?: string;
  metadata: {
    play_name: string;
    scene_type: string;
    visual_features: string;
    season_tag: string;
    character_match: string | null;
    character_id: number | null;
    description: string;
    navi_caption: string;
  };
}

export default function ImagesPage() {
  const { data: images, loading, refresh } = useImages();
  const { data: characters } = useCharacters();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Batch upload state
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);
  const [batchUploading, setBatchUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showBatchPanel, setShowBatchPanel] = useState(false);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newStaged: StagedFile[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'pending' as const,
        metadata: {
          play_name: '',
          scene_type: '',
          visual_features: '',
          season_tag: '通年',
          character_match: null,
          character_id: null,
          description: '',
          navi_caption: '',
        },
      }));
    if (newStaged.length > 0) {
      setStagedFiles((prev) => [...prev, ...newStaged]);
      setShowBatchPanel(true);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addFiles(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [addFiles]
  );

  const removeStaged = useCallback((id: string) => {
    setStagedFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const updateStagedMetadata = useCallback((id: string, field: string, value: string | number | null) => {
    setStagedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, metadata: { ...f.metadata, [field]: value } } : f))
    );
  }, []);

  // AI Analysis - sequential with 1s delay
  const handleBatchAnalyze = useCallback(async () => {
    const pending = stagedFiles.filter((f) => f.status === 'pending' || f.status === 'error');
    if (pending.length === 0) return;

    setBatchAnalyzing(true);
    for (const staged of pending) {
      setStagedFiles((prev) =>
        prev.map((f) => (f.id === staged.id ? { ...f, status: 'analyzing' } : f))
      );

      try {
        const formData = new FormData();
        formData.append('image', staged.file);
        const result = await api.images.analyze(formData);

        setStagedFiles((prev) =>
          prev.map((f) =>
            f.id === staged.id
              ? {
                  ...f,
                  status: 'analyzed',
                  metadata: {
                    play_name: result.play_name || '',
                    scene_type: result.scene_type || '',
                    visual_features: result.visual_features || '',
                    season_tag: result.season_tag || '通年',
                    character_match: result.character_match || null,
                    character_id: result.character_id || null,
                    description: result.description || '',
                    navi_caption: result.description || '',
                  },
                }
              : f
          )
        );
      } catch (err: any) {
        setStagedFiles((prev) =>
          prev.map((f) =>
            f.id === staged.id ? { ...f, status: 'error', error: err.message } : f
          )
        );
      }

      // 1s delay between API calls to respect rate limits
      if (pending.indexOf(staged) < pending.length - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    setBatchAnalyzing(false);
  }, [stagedFiles]);

  // Bulk upload
  const handleBatchUpload = useCallback(async () => {
    const toUpload = stagedFiles.filter(
      (f) => f.status === 'analyzed' || f.status === 'pending'
    );
    if (toUpload.length === 0) return;

    setBatchUploading(true);
    for (const staged of toUpload) {
      setStagedFiles((prev) =>
        prev.map((f) => (f.id === staged.id ? { ...f, status: 'uploading' } : f))
      );

      try {
        const formData = await processImageFile(staged.file);
        formData.append('play_name', staged.metadata.play_name);
        formData.append('scene_type', staged.metadata.scene_type);
        formData.append('visual_features', staged.metadata.visual_features);
        formData.append('season_tag', staged.metadata.season_tag || '通年');
        formData.append('navi_caption', staged.metadata.navi_caption);
        if (staged.metadata.character_id) {
          formData.append('character_id', String(staged.metadata.character_id));
        }
        await api.images.upload(formData);

        setStagedFiles((prev) =>
          prev.map((f) => (f.id === staged.id ? { ...f, status: 'done' } : f))
        );
      } catch (err: any) {
        setStagedFiles((prev) =>
          prev.map((f) =>
            f.id === staged.id ? { ...f, status: 'error', error: err.message } : f
          )
        );
      }
    }
    setBatchUploading(false);
    refresh();
  }, [stagedFiles, refresh]);

  const clearCompleted = useCallback(() => {
    setStagedFiles((prev) => {
      prev.filter((f) => f.status === 'done').forEach((f) => URL.revokeObjectURL(f.previewUrl));
      return prev.filter((f) => f.status !== 'done');
    });
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('この画像を削除しますか？')) return;
    await api.images.delete(id);
    refresh();
  };

  const handleSetPrimary = async (id: number) => {
    await api.images.setPrimary(id);
    refresh();
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    await api.images.update(editingId, editForm);
    setEditingId(null);
    refresh();
  };

  const pendingCount = stagedFiles.filter((f) => f.status !== 'done').length;
  const analyzedCount = stagedFiles.filter((f) => f.status === 'analyzed').length;
  const uploadableCount = stagedFiles.filter(
    (f) => f.status === 'analyzed' || f.status === 'pending'
  ).length;

  const statusLabel = (s: StagedFile['status']) => {
    switch (s) {
      case 'pending': return { text: '待機中', color: 'bg-gray-100 text-gray-600' };
      case 'analyzing': return { text: 'AI分析中...', color: 'bg-blue-100 text-blue-700' };
      case 'analyzed': return { text: '分析完了', color: 'bg-green-100 text-green-700' };
      case 'uploading': return { text: 'アップロード中...', color: 'bg-yellow-100 text-yellow-700' };
      case 'done': return { text: '完了', color: 'bg-green-100 text-green-700' };
      case 'error': return { text: 'エラー', color: 'bg-red-100 text-red-700' };
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">画像管理</h2>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800"
          >
            <ImagePlus size={16} />
            画像を追加
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-xl p-8 mb-6 text-center transition-colors ${
          dragOver
            ? 'border-red-500 bg-red-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        <Upload size={32} className={`mx-auto mb-3 ${dragOver ? 'text-red-500' : 'text-gray-400'}`} />
        <p className="text-gray-600 font-medium">
          画像をドラッグ&ドロップ
        </p>
        <p className="text-sm text-gray-400 mt-1">複数ファイル対応 (JPG, PNG, WebP)</p>
      </div>

      {/* Batch panel */}
      {stagedFiles.length > 0 && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer"
            onClick={() => setShowBatchPanel(!showBatchPanel)}
          >
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-900">
                バッチアップロード ({pendingCount}件)
              </h3>
              {analyzedCount > 0 && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  {analyzedCount}件分析済み
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {stagedFiles.some((f) => f.status === 'done') && (
                <button
                  onClick={(e) => { e.stopPropagation(); clearCompleted(); }}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                >
                  完了を消去
                </button>
              )}
              {showBatchPanel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>

          {showBatchPanel && (
            <>
              {/* Action buttons */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                <button
                  onClick={handleBatchAnalyze}
                  disabled={batchAnalyzing || batchUploading || stagedFiles.every((f) => f.status !== 'pending' && f.status !== 'error')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {batchAnalyzing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  {batchAnalyzing ? 'AI分析中...' : 'AI分析'}
                </button>
                <button
                  onClick={handleBatchUpload}
                  disabled={batchUploading || batchAnalyzing || uploadableCount === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm rounded-lg hover:bg-red-800 disabled:opacity-50"
                >
                  {batchUploading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                  {batchUploading
                    ? 'アップロード中...'
                    : `一括アップロード (${uploadableCount}件)`}
                </button>
              </div>

              {/* Staged file cards */}
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {stagedFiles.map((staged) => {
                  const st = statusLabel(staged.status);
                  return (
                    <div key={staged.id} className="flex gap-4 p-4">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0">
                        <img
                          src={staged.previewUrl}
                          alt={staged.file.name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>

                      {/* Metadata fields */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {staged.file.name}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>
                            {st.text}
                          </span>
                        </div>

                        {staged.status === 'analyzing' && (
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <Loader2 size={14} className="animate-spin" />
                            Gemini Visionで分析中...
                          </div>
                        )}

                        {staged.error && (
                          <p className="text-sm text-red-600 mb-2">{staged.error}</p>
                        )}

                        {(staged.status === 'analyzed' ||
                          staged.status === 'pending' ||
                          staged.status === 'error') && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-500">演目名</label>
                              <input
                                type="text"
                                value={staged.metadata.play_name}
                                onChange={(e) =>
                                  updateStagedMetadata(staged.id, 'play_name', e.target.value)
                                }
                                className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                                placeholder="演目名"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">場面タイプ</label>
                              <input
                                type="text"
                                value={staged.metadata.scene_type}
                                onChange={(e) =>
                                  updateStagedMetadata(staged.id, 'scene_type', e.target.value)
                                }
                                className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                                placeholder="場面タイプ"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">視覚特徴</label>
                              <input
                                type="text"
                                value={staged.metadata.visual_features}
                                onChange={(e) =>
                                  updateStagedMetadata(staged.id, 'visual_features', e.target.value)
                                }
                                className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                                placeholder="視覚特徴"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">季節タグ</label>
                              <select
                                value={staged.metadata.season_tag}
                                onChange={(e) =>
                                  updateStagedMetadata(staged.id, 'season_tag', e.target.value)
                                }
                                className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                              >
                                <option value="通年">通年</option>
                                <option value="春">春</option>
                                <option value="夏">夏</option>
                                <option value="秋">秋</option>
                                <option value="冬">冬</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">キャラクター</label>
                              <select
                                value={staged.metadata.character_id ?? ''}
                                onChange={(e) =>
                                  updateStagedMetadata(
                                    staged.id,
                                    'character_id',
                                    e.target.value ? Number(e.target.value) : null
                                  )
                                }
                                className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                              >
                                <option value="">未設定</option>
                                {characters.map((c: any) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                              {staged.metadata.character_match && !staged.metadata.character_id && (
                                <p className="text-xs text-amber-600 mt-0.5">
                                  AI提案: {staged.metadata.character_match}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">説明</label>
                              <input
                                type="text"
                                value={staged.metadata.description}
                                onChange={(e) =>
                                  updateStagedMetadata(staged.id, 'description', e.target.value)
                                }
                                className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                                placeholder="説明"
                              />
                            </div>
                          </div>
                        )}

                        {staged.status === 'done' && (
                          <p className="text-sm text-green-600">アップロード完了</p>
                        )}
                      </div>

                      {/* Remove button */}
                      {staged.status !== 'uploading' &&
                        staged.status !== 'analyzing' &&
                        staged.status !== 'done' && (
                          <button
                            onClick={() => removeStaged(staged.id)}
                            className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600"
                          >
                            <X size={16} />
                          </button>
                        )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Existing images grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">読み込み中...</div>
      ) : images.length === 0 && stagedFiles.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>画像がありません</p>
          <p className="text-sm mt-2">上のエリアに画像をドラッグ&ドロップしてください</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img: any) => (
            <div key={img.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden group">
              <div className="aspect-square bg-gray-100 relative">
                <img
                  src={`/images/r2/${img.r2_key}`}
                  alt={img.filename}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs hidden">
                  {img.filename}
                </div>
                {img.is_primary === 1 && (
                  <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star size={10} /> プライマリ
                  </div>
                )}
                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => handleSetPrimary(img.id)} className="p-2 bg-white rounded-full hover:bg-yellow-100" title="プライマリに設定">
                    <Star size={16} />
                  </button>
                  <button onClick={() => handleDelete(img.id)} className="p-2 bg-white rounded-full hover:bg-red-100" title="削除">
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <div className="text-sm font-medium text-gray-900 truncate">{img.filename}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {img.season_tag || '通年'} | 使用回数: {img.usage_count}
                </div>
                <button
                  onClick={() => { setEditingId(img.id); setEditForm(img); }}
                  className="text-xs text-red-700 hover:underline mt-2"
                >
                  メタデータ編集
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setEditingId(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">メタデータ編集</h3>
            <div className="space-y-3">
              {[
                { key: 'play_name', label: '演目名' },
                { key: 'scene_type', label: '場面タイプ' },
                { key: 'visual_features', label: '視覚特徴' },
                { key: 'season_tag', label: '季節タグ' },
                { key: 'navi_caption', label: 'NAVIキャプション' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="text-sm font-medium text-gray-700">{label}</label>
                  <input
                    type="text"
                    value={editForm[key] || ''}
                    onChange={e => setEditForm({ ...editForm, [key]: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">キャンセル</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-800">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
