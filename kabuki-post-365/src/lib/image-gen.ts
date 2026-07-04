import type { Env } from '../types';

interface GenerateImageResult {
  success: boolean;
  imageBase64?: string;
  mimeType?: string;
  error?: string;
}

/**
 * Generate an image using Gemini API (Nano Banana / native image generation)
 */
export async function generateImage(
  env: Env,
  prompt: string,
  referenceImageBase64?: string,
  referenceMimeType?: string,
): Promise<GenerateImageResult> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'GEMINI_API_KEY is not configured' };
  }

  // Build request parts
  const parts: any[] = [];

  // If reference image provided, include it first
  if (referenceImageBase64 && referenceMimeType) {
    parts.push({
      inlineData: {
        mimeType: referenceMimeType,
        data: referenceImageBase64,
      },
    });
  }

  parts.push({ text: prompt });

  const model = 'gemini-3.1-flash-image-preview';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      temperature: 1.0,
    },
  };

  // Retry up to 2 times
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error(`Gemini image gen error (attempt ${attempt + 1}):`, res.status, errBody);
        if (attempt < 1) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        return { success: false, error: `Gemini API error: ${res.status}` };
      }

      const data = await res.json() as any;
      const candidates = data.candidates;
      if (!candidates || candidates.length === 0) {
        return { success: false, error: 'No candidates in response' };
      }

      // Find image part in response
      const responseParts = candidates[0].content?.parts || [];
      for (const part of responseParts) {
        if (part.inlineData) {
          return {
            success: true,
            imageBase64: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'image/png',
          };
        }
      }

      return { success: false, error: 'No image in response (text-only response returned)' };
    } catch (err: any) {
      console.error(`Gemini image gen exception (attempt ${attempt + 1}):`, err);
      if (attempt < 1) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      return { success: false, error: err.message || 'Unknown error' };
    }
  }

  return { success: false, error: 'All attempts failed' };
}
