/**
 * Gemini APIのトークン消費をログに出すだけの薄い層。
 * モデルを差し替えたとき、切り替え前後の消費量を wrangler tail で見比べるためのもの。
 * DBには保存しない（課金の正本はGoogle Cloud Console側）。
 */

export interface GeminiUsage {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  /** thinking系モデルの思考トークン。出力側に課金される */
  thoughtsTokenCount?: number;
  totalTokenCount?: number;
}

export function logGeminiUsage(tag: string, model: string, usage?: GeminiUsage): void {
  if (!usage) return;
  const n = (v?: number) => (v === undefined ? '?' : String(v));
  console.log(
    `[gemini-usage] ${tag} model=${model} prompt=${n(usage.promptTokenCount)} ` +
      `output=${n(usage.candidatesTokenCount)} thinking=${n(usage.thoughtsTokenCount ?? 0)} ` +
      `total=${n(usage.totalTokenCount)}`,
  );
}
