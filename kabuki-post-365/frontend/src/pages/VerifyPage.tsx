import { useEffect, useState, useCallback, useMemo } from 'react';
import { ShieldCheck, Loader2, Check, Ban, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { useCharacters } from '../hooks/useData';

// 写真チェック（検品）ページ。
// Gemini Vision の自動分類は必ず verified=0 で登録されるため、
// 人間がここで確認して初めて verified=1 になり、本文生成のキャラクター文脈に使えるようになる。

interface ImageItem {
  id: number;
  filename: string;
  r2_key: string;
  character_id: number | null;
  play_name: string | null;
  scene_type: string | null;
  visual_features: string | null;
}

interface CharacterOption {
  id: number;
  name: string;
  related_play?: string | null;
}

export default function VerifyPage() {
  const { data: characters } = useCharacters();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  // 各カードの操作中フラグ・キャラ選択状態
  const [processing, setProcessing] = useState<Record<number, boolean>>({});
  const [selectedChar, setSelectedChar] = useState<Record<number, number | ''>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = (await api.images.list({ verified: '0' })) as ImageItem[];
      // キャラクター紐付けあり（Gemini推定あり）を先に、なしを後に
      list.sort((a, b) => {
        const av = a.character_id != null ? 0 : 1;
        const bv = b.character_id != null ? 0 : 1;
        if (av !== bv) return av - bv;
        return a.id - b.id;
      });
      setImages(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // キャラクターID → キャラクター情報の逆引き
  const charMap = useMemo(() => {
    const m = new Map<number, CharacterOption>();
    for (const c of characters as CharacterOption[]) m.set(c.id, c);
    return m;
  }, [characters]);

  // 検品確定後、リストからローカル除去
  const removeLocal = useCallback((id: number) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const runVerify = useCallback(
    async (id: number, data?: { character_id?: number | null; play_name?: string | null }) => {
      setProcessing((prev) => ({ ...prev, [id]: true }));
      try {
        await api.images.verify(id, data);
        removeLocal(id);
      } catch (e) {
        alert(`検品に失敗しました: ${(e as Error).message}`);
        setProcessing((prev) => ({ ...prev, [id]: false }));
      }
    },
    [removeLocal]
  );

  // 1. 現状のキャラのまま確定（body に character_id を含めない）
  const handleConfirmAsIs = (id: number) => runVerify(id);

  // 2. キャラを変更して確定
  const handleChangeChar = (id: number) => {
    const cid = selectedChar[id];
    if (cid === '' || cid == null) return;
    const c = charMap.get(Number(cid));
    runVerify(id, { character_id: Number(cid), play_name: c?.related_play ?? null });
  };

  // 3. 特定の人物なしで確定
  const handleNoCharacter = (id: number) => runVerify(id, { character_id: null, play_name: null });

  if (loading) return <div className="text-center py-12 text-gray-500">読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck size={24} className="text-red-700" />
          写真チェック
        </h2>
        <span className="text-sm font-medium bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
          未チェック: {images.length}件
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Gemini Vision の自動分類は誤ることがあります。ここで人間が確認した写真だけが、
        投稿本文のキャラクター説明に使われます。
      </p>

      {images.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <ShieldCheck size={40} className="mx-auto mb-3 text-green-500" />
          <p>未チェックの写真はありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {images.map((img) => {
            const busy = processing[img.id];
            const guessedChar = img.character_id != null ? charMap.get(img.character_id) : null;
            return (
              <div key={img.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* 写真（大きめ表示） */}
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

                <div className="p-4">
                  {/* Gemini推定情報 */}
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5">
                      <Sparkles size={12} />
                      Gemini推定
                    </div>
                    <div className="text-sm text-gray-900 font-medium">
                      キャラ: {guessedChar ? guessedChar.name : '（特定なし）'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                      {img.play_name && <div>演目: {img.play_name}</div>}
                      {img.scene_type && <div>場面: {img.scene_type}</div>}
                      {img.visual_features && <div>特徴: {img.visual_features}</div>}
                    </div>
                  </div>

                  {/* 操作ボタン */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleConfirmAsIs(img.id)}
                      disabled={busy}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      ✅ この人物で確定
                      {guessedChar ? `（${guessedChar.name}）` : '（特定なし）'}
                    </button>

                    <div className="flex items-center gap-2">
                      <select
                        value={selectedChar[img.id] ?? ''}
                        onChange={(e) =>
                          setSelectedChar((prev) => ({
                            ...prev,
                            [img.id]: e.target.value ? Number(e.target.value) : '',
                          }))
                        }
                        disabled={busy}
                        className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2 py-2 text-sm"
                      >
                        <option value="">キャラを選び直す…</option>
                        {(characters as CharacterOption[]).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleChangeChar(img.id)}
                        disabled={busy || !selectedChar[img.id]}
                        className="flex-shrink-0 px-3 py-2 bg-red-700 text-white text-sm rounded-lg hover:bg-red-800 disabled:opacity-50"
                      >
                        変更して確定
                      </button>
                    </div>

                    <button
                      onClick={() => handleNoCharacter(img.id)}
                      disabled={busy}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 disabled:opacity-50"
                    >
                      <Ban size={14} />
                      🚫 特定の人物なし
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
