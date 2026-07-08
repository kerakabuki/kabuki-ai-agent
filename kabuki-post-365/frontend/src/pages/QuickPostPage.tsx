import { useState, useRef, useCallback } from 'react';
import {
  Camera, Loader2, Sparkles, ArrowLeft, ArrowRight, Send,
  Check, AlertCircle, Image as ImageIcon, RefreshCw,
} from 'lucide-react';
import { api } from '../lib/api';
import { processImageFile } from '../lib/image-resize';

// テーマ選択肢（既存テーマから「クイズ」を除いたもの）
const THEME_OPTIONS = ['舞台裏', '演目', '役者', '豆知識', '名場面', '歴史'];

// 投稿先プラットフォーム（x は現在無効のため対象外。実際の可否は設定の disabled_platforms で判定）
const QUICK_PLATFORMS: { key: string; label: string }[] = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'bluesky', label: 'Bluesky' },
];

// AI画像分析の結果
interface Analysis {
  play_name: string;
  scene_type: string;
  visual_features: string;
  season_tag: string;
  character_match: string | null;
  character_id: number | null;
  description: string;
}

// プラットフォームごとの投稿結果
interface PostResult {
  platform: string;
  label: string;
  ok: boolean;
  error?: string;
}

// 全プラットフォームの投稿済みフラグ
const POSTED_FLAGS = ['x_posted', 'instagram_posted', 'facebook_posted', 'bluesky_posted'];

// 例外メッセージを安全に取り出す
function errMsg(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

// いずれかのプラットフォームに投稿済みか
function isAnyPosted(post: Record<string, unknown>): boolean {
  return POSTED_FLAGS.some((k) => !!post[k]);
}

// 未投稿（全 *_posted=0）の孤児draftを削除する。失敗しても無視
async function deleteIfUnposted(pId: number): Promise<void> {
  try {
    const p = await api.posts.get(pId);
    if (!isAnyPosted(p)) await api.posts.delete(pId);
  } catch {
    // 削除失敗は致命的ではないので無視
  }
}

// JSTの本日日付（YYYY-MM-DD）を返す
function jstToday(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
}

// 曜日番号（0=日〜6=土）。カレンダー生成（calendar-engine の getUTCDay）と揃えるため UTC基準で算出
function dayOfWeekOf(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

// Bluesky向けに画像を2MB制限内へ圧縮（PostEditPage と同じ方針）
async function compressImage(r2Key: string, maxSize = 950_000): Promise<Blob | undefined> {
  try {
    const res = await fetch(`/images/r2/${r2Key}`);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    if (blob.size <= maxSize) return blob;
    const img = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
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
    for (let q = 0.8; q >= 0.3; q -= 0.1) {
      const c = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', q),
      );
      if (c && c.size <= maxSize) return c;
    }
    return (await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.3),
    )) || undefined;
  } catch {
    return undefined;
  }
}

export default function QuickPostPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1: 写真
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  // Step 2: 内容
  const [theme, setTheme] = useState('舞台裏');
  const [memo, setMemo] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [imageId, setImageId] = useState<number | null>(null);
  const [postId, setPostId] = useState<number | null>(null);

  // Step 3: プレビュー・投稿
  const [basePost, setBasePost] = useState<Record<string, unknown> | null>(null); // PUTのベースにする現在値
  const [texts, setTexts] = useState<{ instagram_text: string; facebook_text: string; bluesky_text: string }>({
    instagram_text: '',
    facebook_text: '',
    bluesky_text: '',
  });
  const [posting, setPosting] = useState(false);
  const [results, setResults] = useState<PostResult[]>([]);
  const [postError, setPostError] = useState('');
  const [disabledPlatforms, setDisabledPlatforms] = useState<string[]>(['x']); // 無効化プラットフォーム（x はデフォルト対象外）

  // 画像を選択 → プレビュー表示 → 自動でAI分析
  const analyzeFile = useCallback(async (f: File) => {
    setAnalyzing(true);
    setAnalyzeError('');
    try {
      const fd = new FormData();
      fd.append('image', f);
      const r = await api.images.analyze(fd);
      const a: Analysis = {
        play_name: r.play_name || '',
        scene_type: r.scene_type || '',
        visual_features: r.visual_features || '',
        season_tag: r.season_tag || '通年',
        character_match: r.character_match || null,
        character_id: r.character_id || null,
        description: r.description || '',
      };
      setAnalysis(a);
      // 稽古シーンと判定されたら「舞台裏」をデフォルトに
      if ((a.scene_type || '').includes('稽古')) setTheme('舞台裏');
    } catch (e: unknown) {
      setAnalyzeError(errMsg(e, 'AI分析に失敗しました'));
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setAnalysis(null);
    // 前回の投稿が未投稿の下書きなら削除（孤児draftが当日の自動投稿枠で勝手に投稿されるのを防ぐ）
    if (postId != null) deleteIfUnposted(postId);
    // 画像を差し替えたら以降のステップの状態をリセット
    setImageId(null);
    setPostId(null);
    setBasePost(null);
    setResults([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    analyzeFile(f);
  }, [previewUrl, postId, analyzeFile]);

  // Step 2: 本文を生成（画像アップロード → 投稿作成 → テキスト生成）
  const handleGenerate = useCallback(async () => {
    if (!file) return;
    setGenerating(true);
    setGenerateError('');
    try {
      // 1) 画像アップロード（未アップロード時のみ。リトライで二重登録しない）
      let imgId = imageId;
      if (imgId == null) {
        const fd = await processImageFile(file);
        fd.append('play_name', analysis?.play_name || '');
        fd.append('scene_type', analysis?.scene_type || '');
        fd.append('visual_features', analysis?.visual_features || '');
        fd.append('season_tag', analysis?.season_tag || '通年');
        fd.append('navi_caption', analysis?.description || '');
        // Geminiの推定キャラは verified=0 で登録され本文には使われない（後で写真チェックで検品）
        if (analysis?.character_id) fd.append('character_id', String(analysis.character_id));
        const up = await api.images.upload(fd);
        imgId = up.id as number;
        setImageId(imgId);
      }

      // 2) 投稿を作成（未作成時のみ）
      let pId = postId;
      if (pId == null) {
        const today = jstToday();
        const created = await api.posts.create({
          post_date: today,
          day_of_week: dayOfWeekOf(today),
          theme,
          image_id: imgId,
          status: 'draft',
        });
        pId = created.id as number;
        setPostId(pId);
      } else {
        // 既存投稿の再生成: テーマ変更をDBへ反映してから生成（generate/single はDBのthemeを読むため）
        const latest = await api.posts.get(pId);
        await api.posts.update(pId, { ...latest, theme });
      }

      // 3) テキスト生成（メモを customPrompt として渡す）
      const gen = await api.generate.single(pId, memo.trim() || undefined);
      const t = gen.texts || {};
      setTexts({
        instagram_text: t.instagram_text || '',
        facebook_text: t.facebook_text || '',
        bluesky_text: t.bluesky_text || '',
      });

      // PUTのベースにする現在の投稿全体を取得
      const full = await api.posts.get(pId);
      setBasePost(full);

      // 投稿先の可否（disabled_platforms）を取得しておく
      try {
        const settings = await api.settings.getAll();
        setDisabledPlatforms(
          (settings.disabled_platforms || '').split(',').map((s) => s.trim()).filter(Boolean),
        );
      } catch {
        setDisabledPlatforms(['x']);
      }

      setResults([]);
      setStep(3);
    } catch (e: unknown) {
      setGenerateError(errMsg(e, '本文の生成に失敗しました'));
    } finally {
      setGenerating(false);
    }
  }, [file, imageId, postId, analysis, theme, memo]);

  // Step 3: 今すぐ投稿
  const handlePostNow = useCallback(async () => {
    if (postId == null) return;
    setPosting(true);
    setPostError('');
    setResults([]);
    try {
      // 1) 毎回まず最新の投稿を取得（DB側の *_posted フラグを絶対に巻き戻さないため）
      const latest = await api.posts.get(postId);

      // 2) 編集分だけ差し替えて保存（*_posted 等はlatestの値をそのまま維持）
      const merged = {
        ...latest,
        instagram_text: texts.instagram_text,
        facebook_text: texts.facebook_text,
        bluesky_text: texts.bluesky_text,
        status: latest.status || 'draft',
      };
      await api.posts.update(postId, merged);

      // 3) 投稿対象 = 無効化されておらず、かつ最新GETで未投稿（{platform}_posted=0）のもの
      const targets = QUICK_PLATFORMS.filter(
        (p) => !disabledPlatforms.includes(p.key) && !latest[`${p.key}_posted`],
      );

      const r2Key = latest.image_r2_key as string | undefined;
      const out: PostResult[] = [];
      for (const p of targets) {
        try {
          let imageBlob: Blob | undefined;
          if (p.key === 'bluesky' && r2Key) {
            imageBlob = await compressImage(r2Key);
          }
          const res = await api.autoPost.postSingle(postId, p.key, imageBlob);
          out.push({ platform: p.key, label: p.label, ok: !!res.success, error: res.error });
        } catch (e: unknown) {
          out.push({ platform: p.key, label: p.label, ok: false, error: errMsg(e, '投稿エラー') });
        }
        setResults([...out]);
      }

      // 4) 投稿後の最新状態を取得しなおしてボタン表示（投稿済み判定）を更新
      try {
        setBasePost(await api.posts.get(postId));
      } catch {
        setBasePost(merged);
      }
    } catch (e: unknown) {
      setPostError(errMsg(e, '投稿処理に失敗しました'));
    } finally {
      setPosting(false);
    }
  }, [postId, texts, disabledPlatforms]);

  const stepPill = (n: number, label: string) => (
    <div className="flex items-center gap-1.5">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
          step === n ? 'bg-red-700 text-white' : step > n ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
        }`}
      >
        {step > n ? <Check size={14} /> : n}
      </div>
      <span className={`text-xs ${step === n ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{label}</span>
    </div>
  );

  // Step 3: 投稿対象と投稿済み状態（basePost の *_posted フラグを正とする）
  const enabledPlatforms = QUICK_PLATFORMS.filter((p) => !disabledPlatforms.includes(p.key));
  const platformPosted = (key: string): boolean => !!basePost?.[`${key}_posted`];
  const remainingPlatforms = enabledPlatforms.filter((p) => !platformPosted(p.key));
  const allPosted = basePost != null && remainingPlatforms.length === 0;
  const hasFailure = results.some((r) => !r.ok);

  return (
    <div className="max-w-md mx-auto pb-8">
      <div className="flex items-center gap-2 mb-4">
        <Camera size={22} className="text-red-700" />
        <h2 className="text-xl font-bold text-gray-900">クイック投稿</h2>
      </div>

      {/* ステップ表示 */}
      <div className="flex items-center justify-between mb-6 px-1">
        {stepPill(1, '写真')}
        <div className="flex-1 h-px bg-gray-200 mx-2" />
        {stepPill(2, '内容')}
        <div className="flex-1 h-px bg-gray-200 mx-2" />
        {stepPill(3, '投稿')}
      </div>

      {/* Step 1: 写真を選ぶ */}
      {step === 1 && (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!previewUrl ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-2xl py-16 flex flex-col items-center justify-center text-gray-500 hover:border-red-400 hover:text-red-600 transition-colors"
            >
              <Camera size={48} className="mb-3" />
              <span className="text-base font-medium">写真を選ぶ</span>
              <span className="text-xs text-gray-400 mt-1">カメラで撮影 / アルバムから選択</span>
            </button>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden border border-gray-200">
                <img src={previewUrl} alt="プレビュー" className="w-full object-cover max-h-80" />
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} /> 写真を選び直す
              </button>

              {/* AI分析結果 */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-blue-600" />
                  <span className="text-sm font-semibold text-gray-800">AIによる分析</span>
                </div>
                {analyzing ? (
                  <div className="flex items-center gap-2 text-sm text-blue-600 py-2">
                    <Loader2 size={16} className="animate-spin" /> 分析中…
                  </div>
                ) : analyzeError ? (
                  <div className="space-y-2">
                    <p className="text-sm text-red-600 flex items-center gap-1.5">
                      <AlertCircle size={14} /> {analyzeError}
                    </p>
                    <button
                      onClick={() => file && analyzeFile(file)}
                      className="text-sm text-red-700 font-medium hover:underline"
                    >
                      もう一度分析する
                    </button>
                  </div>
                ) : analysis ? (
                  <dl className="text-sm space-y-1.5 text-gray-700">
                    {analysis.play_name && (
                      <div className="flex gap-2"><dt className="text-gray-400 w-16 shrink-0">演目</dt><dd>{analysis.play_name}</dd></div>
                    )}
                    {analysis.scene_type && (
                      <div className="flex gap-2"><dt className="text-gray-400 w-16 shrink-0">場面</dt><dd>{analysis.scene_type}</dd></div>
                    )}
                    {analysis.visual_features && (
                      <div className="flex gap-2"><dt className="text-gray-400 w-16 shrink-0">特徴</dt><dd>{analysis.visual_features}</dd></div>
                    )}
                    {analysis.description && (
                      <div className="flex gap-2"><dt className="text-gray-400 w-16 shrink-0">説明</dt><dd>{analysis.description}</dd></div>
                    )}
                    {analysis.character_match && (
                      <div className="flex gap-2"><dt className="text-gray-400 w-16 shrink-0">候補役</dt><dd className="text-amber-600">{analysis.character_match}（要確認）</dd></div>
                    )}
                  </dl>
                ) : (
                  <p className="text-sm text-gray-400">分析結果がありません</p>
                )}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={analyzing}
                className="w-full py-3.5 bg-red-700 text-white rounded-xl font-semibold text-base hover:bg-red-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                内容の確認へ <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: 内容の確認 */}
      {step === 2 && (
        <div className="space-y-4">
          {previewUrl && (
            <div className="rounded-2xl overflow-hidden border border-gray-200">
              <img src={previewUrl} alt="プレビュー" className="w-full object-cover max-h-56" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">テーマ</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base"
            >
              {THEME_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">一言メモ（任意）</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              placeholder="今日は太功記の立ち回りを稽古しました"
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">メモの内容を反映して本文を生成します</p>
          </div>

          {generateError && (
            <p className="text-sm text-red-600 flex items-center gap-1.5">
              <AlertCircle size={14} /> {generateError}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setStep(1)}
              disabled={generating}
              className="py-3.5 px-4 border border-gray-300 rounded-xl font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
            >
              <ArrowLeft size={18} /> 戻る
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 py-3.5 bg-red-700 text-white rounded-xl font-semibold text-base hover:bg-red-800 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {generating ? '生成中…' : '本文を生成'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: プレビューと投稿 */}
      {step === 3 && (
        <div className="space-y-4">
          {previewUrl && (
            <div className="rounded-2xl overflow-hidden border border-gray-200">
              <img src={previewUrl} alt="プレビュー" className="w-full object-cover max-h-48" />
            </div>
          )}

          {QUICK_PLATFORMS.map((p) => {
            const key = `${p.key}_text` as keyof typeof texts;
            const result = results.find((r) => r.platform === p.key);
            const posted = platformPosted(p.key) || (result?.ok ?? false);
            const disabledPlatform = disabledPlatforms.includes(p.key);
            return (
              <div key={p.key} className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-gray-400" /> {p.label}
                  </span>
                  {disabledPlatform ? (
                    <span className="text-xs text-gray-400">投稿対象外</span>
                  ) : posted ? (
                    <span className="text-xs text-green-700 flex items-center gap-1">
                      <Check size={14} /> 投稿完了
                    </span>
                  ) : result && !result.ok ? (
                    <span className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} /> 失敗
                    </span>
                  ) : null}
                </div>
                <textarea
                  value={texts[key]}
                  onChange={(e) => setTexts((prev) => ({ ...prev, [key]: e.target.value }))}
                  rows={5}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none"
                  placeholder={`${p.label}の本文`}
                />
                {result && !result.ok && result.error && (
                  <p className="text-xs text-red-600 mt-1.5">{result.error}</p>
                )}
              </div>
            );
          })}

          {postError && (
            <p className="text-sm text-red-600 flex items-center gap-1.5">
              <AlertCircle size={14} /> {postError}
            </p>
          )}

          <button
            onClick={handlePostNow}
            disabled={posting || allPosted}
            className={`w-full py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-60 ${
              allPosted ? 'bg-green-600 text-white' : 'bg-red-700 text-white hover:bg-red-800'
            }`}
          >
            {posting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : allPosted ? (
              <Check size={18} />
            ) : (
              <Send size={18} />
            )}
            {posting ? '投稿中…' : allPosted ? '投稿済み' : hasFailure ? 'もう一度投稿する' : '今すぐ投稿'}
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setStep(2)}
              disabled={posting}
              className="py-2.5 px-4 border border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
            >
              <ArrowLeft size={16} /> 内容に戻る
            </button>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            保存だけして投稿しなかった場合、当日の自動投稿枠が未実行ならその枠で自動投稿されます。
          </p>
        </div>
      )}
    </div>
  );
}
