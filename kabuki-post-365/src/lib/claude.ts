import type { Env } from '../types';
import { buildCtaText } from './cta';

interface GeneratedTexts {
  instagram_text: string;
  instagram_hashtags: string;
  x_text: string;
  x_hashtags: string;
  facebook_text: string;
  facebook_hashtags: string;
  bluesky_text: string;
  cta_url: string | null;
  quiz_answer_comment: string | null;
}

export async function generatePostText(
  env: Env,
  post: Record<string, unknown>,
  settings: Record<string, string>,
  platform?: string
): Promise<GeneratedTexts> {
  const characterName = post.character_name as string || '（キャラクター未設定）';
  const characterDesc = post.character_description as string || '';
  const personalityTags = post.personality_tags as string || '';
  const visualFeatures = post.visual_features as string || '';
  const sceneType = post.scene_type as string || '';
  const theme = post.theme as string || '';
  const specialDay = post.special_day as string || '';
  const postDate = post.post_date as string || '';
  const ctaType = post.cta_type as string || 'A';
  const ctaUrl = post.cta_url as string || '';

  const cta = buildCtaText(ctaType, settings);
  const commonHashtags = settings.common_hashtags || '#歌舞伎 #kabuki';

  const platforms = platform ? [platform] : ['instagram', 'x', 'facebook', 'bluesky'];
  const platformSpecs: Record<string, string> = {
    instagram: `Instagram投稿文（最大2200文字、改行自由、ハッシュタグは本文とは別に出力）
- 親しみやすく丁寧な口調
- 絵文字を適度に使用
- 見出し・箇条書きで読みやすく
- URLリンクは本文に含めないこと（アルゴリズム的にリーチが下がるため）
- 誘導したい場合は「プロフィールのリンクから」と案内`,
    x: `X（旧Twitter）投稿文（最大280文字、簡潔に）
- 短くインパクトのある文
- ハッシュタグは2-3個
- 本文にCTAリンクを含める場合はURL分の文字数を考慮`,
    facebook: `Facebook投稿文（最大500文字程度）
- 丁寧で落ち着いた口調
- 詳しい解説を含めてOK
- コミュニティ感のある呼びかけ
- URLリンクは本文に含めないこと（アルゴリズム的にリーチが下がるため）
- 誘導したい場合は「プロフィールのリンクから」と案内`,
    bluesky: `Bluesky投稿文（最大300文字、ハッシュタグは本文中に含める）
- カジュアルで親しみやすい口調
- URLはそのまま記載（リッチテキストで自動リンク化される）
- ハッシュタグは#付きで本文中に2-3個含める（別出力不要）`,
  };

  const promptParts = platforms.map(p => platformSpecs[p]).join('\n\n');

  const accountName = settings.account_name || '気良歌舞伎';
  const snsAccounts = [
    settings.sns_instagram ? `Instagram: ${settings.sns_instagram}` : '',
    settings.sns_x ? `X: ${settings.sns_x}` : '',
    settings.sns_facebook ? `Facebook: ${settings.sns_facebook}` : '',
    settings.sns_note ? `Note: ${settings.sns_note}` : '',
    settings.sns_youtube ? `YouTube: ${settings.sns_youtube}` : '',
  ].filter(Boolean).join('\n');

  const systemPrompt = `あなたは「${accountName}」の歌舞伎が大好きなSNS担当です。
フォロワーと一緒に歌舞伎を楽しんでいる一人として、自分の言葉で語ってください。

【気良歌舞伎の活動について】
- 衣装は貸衣装を利用している
- 化粧は専門の方にお願いしている
- 大道具・小道具は座員が自分たちで手作りしている
- 義太夫・三味線は他の団体の方にお願いしている

【トーン指針】
- 「ぜひチェック」「お見逃しなく」「必見」などの売り込み表現は使わない
- フォロワーに話しかけるように、対話を意識する（問いかけ、共感、感想の共有）
- 歌舞伎に詳しくない人にも楽しんでもらえるよう、わかりやすく
- 「自分も好きだから語りたい」という温度感で

【公式SNSアカウント】
${snsAccounts}

※各プラットフォームの投稿文では、同じプラットフォームの公式アカウントURLは含めないでください（フォロワーは既にフォロー済み）。
※他プラットフォームへの誘導や、KABUKI PLUS+サイトへのリンクは適度に活用してください。`;

  // Build feature introduction context if theme is 機能紹介
  let featureContext = '';
  if (theme === '機能紹介' && specialDay) {
    try {
      const feature = JSON.parse(specialDay as string);
      // Check if JIKABUKI+ feature and if posting month is recruitment period
      const postMonth = postDate ? new Date(postDate as string).getMonth() + 1 : 0;
      const isJikabuki = feature.brand === 'JIKABUKI+';
      const recruitmentNote = isJikabuki && postMonth >= 1 && postMonth <= 3
        ? `\n【募集のお知らせ】JIKABUKI PLUS+を一緒に使ってくれる地歌舞伎・地芝居の団体を募集しています。3月中に始めていただけると嬉しいです。興味のある団体さんはお気軽にご連絡ください。`
        : '';

      featureContext = `
【紹介する機能】${feature.name}（${feature.brand}）
【機能の説明】${feature.description}
【主な特徴】${(feature.highlights as string[]).join(' / ')}
【URL】${settings.kabuki_navi_base_url || 'https://kabukiplus.com'}${feature.path}
${feature.story ? `【作った背景】${feature.story}` : ''}
${feature.imageAlt ? `【添付画像の内容】${feature.imageAlt}` : ''}${recruitmentNote}

※気良歌舞伎は岐阜県の地歌舞伎団体で、自分たちの活動の中で必要になったツールを開発してきました。
※「作った背景」のストーリーを軸に、なぜこの機能が生まれたかを語ってください。機能スペックの羅列ではなく、実際の困りごと→解決の流れで自然に紹介する形で。
※添付画像は機能のスクリーンショット入り画像です。画面に映っている内容にも触れてください。
※売り込み表現（「ぜひ」「必見」「お見逃しなく」）は使わない。あくまで「こういうのあるよ」くらいの温度感で。
${recruitmentNote ? '※「募集のお知らせ」の内容を投稿の最後に自然な形で添えてください。押しつけがましくなく、「一緒にやりませんか」くらいの温度感で。' : ''}`;
    } catch { /* not a feature post */ }
  }

  // Build quiz context from verified quiz_posts data
  const quizQuestion = post.quiz_question as string || '';
  const quizOptions = post.quiz_options as string || '';
  const quizCorrectAnswer = post.quiz_correct_answer as number;
  const quizExplanation = post.quiz_explanation as string || '';

  let quizContext = '';
  let quizAnswerInstruction = '';

  if (theme === 'クイズ' && quizQuestion) {
    let optionsList = '';
    let correctAnswerText = '';
    try {
      const options = JSON.parse(quizOptions) as string[];
      optionsList = options.map((o, i) => `${i + 1}. ${o}`).join('\n');
      correctAnswerText = options[quizCorrectAnswer] || '';
    } catch { /* ignore */ }

    quizContext = `
【クイズ問題（この問題をそのまま使ってください。自分で問題を作らないでください）】
問題: ${quizQuestion}
選択肢:
${optionsList}
正解: ${correctAnswerText}
解説: ${quizExplanation}`;

    quizAnswerInstruction = `

【クイズ答え追記テキストについて（comment_x / comment_bluesky）】
X・Blueskyの本文末尾に追記するクイズの正解と解説を書いてください。
- 正解は「${correctAnswerText}」です
- 解説: ${quizExplanation}
- 上記の正解と解説に基づいて書いてください。事実を正確に。知らないことは書かないでください
- comment_x: X向け（x_textの文字数と合計して280文字以内に収まるよう簡潔に）
- comment_bluesky: Bluesky向け（bluesky_textの文字数と合計して300文字以内に収まるよう簡潔に）`;
  } else if (theme === 'クイズ' && !quizQuestion) {
    quizContext = `
【注意】このクイズ投稿にはクイズデータが紐づいていません。クイズ問題は作成せず、歌舞伎の豆知識として投稿文を作成してください。`;
  }

  const userPrompt = `以下の情報をもとに、SNS投稿文を作成してください。

【投稿日】${postDate}
【テーマ】${theme}
${specialDay && theme !== '機能紹介' ? `【特別な日】${specialDay}` : ''}
${featureContext}${quizContext}
${theme !== '機能紹介' ? `【キャラクター/演目】${characterName}` : ''}
${characterDesc ? `【キャラクター説明】${characterDesc}` : ''}
${personalityTags ? `【性格タグ】${personalityTags}` : ''}
${visualFeatures ? `【画像の特徴】${visualFeatures}` : ''}
${sceneType ? `【場面タイプ】${sceneType}` : ''}
${cta ? `【CTA】${cta}` : '【CTA】なし（CTAは入れず、読者への問いかけや自分の感想で自然に締めてください）'}${ctaUrl ? `\n【誘導先URL】${ctaUrl}
- X・Blueskyの本文にはこのURLを含めてOK
- Facebook・Instagramの本文にはURLを含めないでください（アルゴリズム的にリーチが下がるため）
- Facebook・Instagramでは「プロフィールのリンクから」と案内してください` : ''}
【共通ハッシュタグ】${commonHashtags}

以下の各プラットフォーム用の投稿文を作成してください：

${promptParts}

以下のJSON形式で回答してください（コードブロックなし）：
{
  "instagram_text": "...",
  "instagram_hashtags": "...",
  "x_text": "...",
  "x_hashtags": "...",
  "facebook_text": "...",
  "facebook_hashtags": "...",
  "bluesky_text": "..."${theme === 'クイズ' && quizQuestion ? `,
  "comment_x": "...",
  "comment_bluesky": "..."` : ''}
}${quizAnswerInstruction}`;

  // Gemini 2.5 Flash API (with retry for cold start)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
  const requestBody = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2500,
      topP: 0.9,
      responseMimeType: 'application/json',
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  let res: Response | null = null;
  let lastError = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });
      if (res.ok) break;
      lastError = `Gemini API error ${res.status}: ${await res.text()}`;
      res = null;
    } catch (e) {
      lastError = `Fetch failed: ${(e as Error).message}`;
      res = null;
    }
    if (attempt === 0) await new Promise(r => setTimeout(r, 2000));
  }

  if (!res || !res.ok) {
    throw new Error(lastError || 'Gemini API request failed after retries');
  }

  const data = await res.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  // Gemini 2.5 Flash may return multiple parts (thinking + response)
  // Collect text from all parts, then extract JSON
  const allParts = data.candidates?.[0]?.content?.parts || [];
  let text = allParts.map(p => p.text || '').join('');

  // Parse JSON from response
  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Try to extract the last complete JSON object (skip thinking text)
    const jsonMatches = [...text.matchAll(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g)];
    let found = false;
    for (let i = jsonMatches.length - 1; i >= 0; i--) {
      try {
        const candidate = JSON.parse(jsonMatches[i][0]);
        if (candidate.instagram_text || candidate.x_text) {
          parsed = candidate;
          found = true;
          break;
        }
      } catch { /* try next */ }
    }
    if (!found) {
      // Last resort: find outermost braces
      const first = text.indexOf('{');
      const last = text.lastIndexOf('}');
      if (first !== -1 && last > first) {
        try {
          parsed = JSON.parse(text.substring(first, last + 1));
          found = true;
        } catch { /* give up */ }
      }
    }
    if (!found!) {
      console.error('Gemini raw response:', text.substring(0, 500));
      throw new Error('Failed to parse Gemini response as JSON');
    }
  }

  return {
    instagram_text: parsed.instagram_text || '',
    instagram_hashtags: parsed.instagram_hashtags || commonHashtags,
    x_text: parsed.x_text || '',
    x_hashtags: parsed.x_hashtags || commonHashtags,
    facebook_text: parsed.facebook_text || '',
    facebook_hashtags: parsed.facebook_hashtags || commonHashtags,
    bluesky_text: parsed.bluesky_text || '',
    cta_url: (post.cta_url as string) || null,
    quiz_answer_comment: (parsed.comment_x || parsed.comment_bluesky)
      ? JSON.stringify({
          x: parsed.comment_x || '',
          bluesky: parsed.comment_bluesky || '',
        })
      : null,
  };
}
