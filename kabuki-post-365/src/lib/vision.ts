import type { Env, Character } from '../types';

export interface VisionAnalysisResult {
  play_name: string;
  scene_type: string;
  visual_features: string;
  season_tag: string;
  character_match: string | null;
  character_id: number | null;
  description: string;
}

export async function analyzeImageWithVision(
  env: Env,
  imageBase64: string,
  mimeType: string,
  characters: Character[]
): Promise<VisionAnalysisResult> {
  const characterList = characters
    .map((c) => `- ${c.name}（${c.name_reading}）: 演目「${c.related_play}」${c.aliases ? `、別名: ${c.aliases}` : ''}`)
    .join('\n');

  const systemPrompt = `あなたは歌舞伎の専門家です。歌舞伎に関連する画像を分析し、メタデータを構造化して返してください。
歌舞伎に関連しない画像の場合でも、見える内容をそのまま分析してください。`;

  const userPrompt = `この画像を分析して、以下のJSON形式でメタデータを返してください。

【登録済みキャラクター一覧】
${characterList || '（なし）'}

【出力形式】
{
  "play_name": "画像に関連する歌舞伎の演目名（不明なら空文字）",
  "scene_type": "場面タイプ（例: 見得, 立回り, 花道, 舞踊, 群衆, ポートレート, 舞台全景, 稽古風景, 衣裳, 小道具 など）",
  "visual_features": "画像の視覚的特徴をカンマ区切りで（例: 隈取り,赤い衣裳,刀,桜の背景）",
  "season_tag": "季節タグ（春, 夏, 秋, 冬, 通年 のいずれか）",
  "character_match": "上記キャラクター一覧の中で最も一致するキャラクター名（一致なしならnull）",
  "description": "画像の説明（20文字以内）"
}

簡潔に回答してください。各フィールドは短く。`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
            { text: userPrompt },
          ],
        },
      ],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
        topP: 0.8,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini Vision API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
  };

  const candidate = data.candidates?.[0];
  if (!candidate?.content?.parts?.length) {
    const reason = candidate?.finishReason || 'unknown';
    throw new Error(`Gemini returned no content (finishReason: ${reason})`);
  }

  const text = candidate.content.parts.map((p) => p.text || '').join('');
  if (!text.trim()) {
    throw new Error('Gemini returned empty text');
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Strip markdown code fences if present
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error(`Failed to parse Gemini Vision response: ${text.substring(0, 200)}`);
      }
    }
  }

  // Resolve character_id from character_match
  let characterId: number | null = null;
  const matchName = (parsed.character_match as string) || null;
  if (matchName) {
    const matched = characters.find(
      (c) =>
        c.name === matchName ||
        c.name_reading === matchName ||
        c.aliases?.includes(matchName)
    );
    if (matched) characterId = matched.id;
  }

  return {
    play_name: (parsed.play_name as string) || '',
    scene_type: (parsed.scene_type as string) || '',
    visual_features: (parsed.visual_features as string) || '',
    season_tag: (parsed.season_tag as string) || '通年',
    character_match: matchName,
    character_id: characterId,
    description: (parsed.description as string) || '',
  };
}
