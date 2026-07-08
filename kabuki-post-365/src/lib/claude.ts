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
  platform?: string,
  customPrompt?: string,
): Promise<GeneratedTexts> {
  // character_name は添付画像に紐づくキャラクターのみ（JOIN側で保証）。無ければ空
  const characterName = post.character_name as string || '';
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
- 改行と絵文字で読みやすく（マークダウン記法「#」「##」「**」「-」は絶対に使わない。SNSでは記号がそのまま表示される）
- URLリンクは本文に含めないこと（アルゴリズム的にリーチが下がるため）
- 誘導したい場合は「プロフィールのリンクから」と案内`,
    x: `X（旧Twitter）投稿文
【文字数制限 — 最重要ルール】Xでは日本語1文字が2文字分カウントされる
- x_textは110文字以内（絶対厳守。絵文字・改行含めて110文字）
- x_hashtagsは20文字以内（絶対厳守）
- 短くインパクトのある文
- ハッシュタグは2-3個
- URLは本文に含めないこと（Xはリンク付き投稿のリーチを下げるため。誘導先URLは自動でリプライに投稿される）
- 「プロフィールのリンクから」という案内はXでは使わないこと`,
    facebook: `Facebook投稿文（最大500文字程度）
- 丁寧で落ち着いた口調
- 詳しい解説を含めてOK
- コミュニティ感のある呼びかけ
- マークダウン記法（「#」「##」「**」「-」）は絶対に使わない（SNSでは記号がそのまま表示される）
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

【事実に関するルール（最重要）】
- 与えられた情報に書かれていないことを事実として書かない。演目のあらすじや人物設定を自分の知識で補完しない
- 気良歌舞伎が特定の演目を上演した・稽古している、といった活動実績は、情報として与えられない限り書かない
- 添付画像について、与えられた説明（キャラクター情報・画像の特徴）以外の断定をしない

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
${theme !== '機能紹介' && characterName ? `【添付画像のキャラクター/演目】${characterName}` : ''}
${theme !== '機能紹介' && !characterName ? `【注意】添付画像に特定の登場人物は紐づいていません。画像と結びつけて特定の演目の登場人物を語らないでください。この注意がある場合、自分から特定の登場人物名を持ち出さず、テーマに沿った一般的な内容にしてください（クイズ問題など与えられた情報に人物名が含まれる場合は、そのまま使って構いません）。` : ''}
${characterDesc ? `【キャラクター説明】${characterDesc}` : ''}
${personalityTags ? `【性格タグ】${personalityTags}` : ''}
${visualFeatures ? `【画像の特徴】${visualFeatures}` : ''}
${sceneType ? `【場面タイプ】${sceneType}` : ''}
${cta ? `【CTA】${cta}` : '【CTA】なし（CTAは入れず、読者への問いかけや自分の感想で自然に締めてください）'}${ctaUrl ? `\n【誘導先URL】${ctaUrl}
- Blueskyの本文にはこのURLを含めてOK
- X・Facebook・Instagramの本文にはURLを含めないでください（アルゴリズム的にリーチが下がるため）
- Xでは誘導先URLは自動でリプライに投稿されるため、本文で無理に触れなくてよい
- Facebook・Instagramでは「プロフィールのリンクから」と案内してください` : ''}
【共通ハッシュタグ】${commonHashtags}
${customPrompt ? `\n【追加指示】${customPrompt}` : ''}
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
      maxOutputTokens: 8192,
      topP: 0.9,
    },
  });
  console.log('Gemini request URL:', url.replace(/key=.*/, 'key=***'));
  console.log('Gemini request body length:', requestBody.length);

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
      const errBody = await res.text();
      console.error(`Gemini API error (attempt ${attempt}): status=${res.status}, body=${errBody.substring(0, 500)}`);
      lastError = `Gemini API error ${res.status}: ${errBody.substring(0, 300)}`;
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
  let parsed: Record<string, string> | null = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Try to extract the last complete JSON object (skip thinking text)
    const jsonMatches = [...text.matchAll(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g)];
    for (let i = jsonMatches.length - 1; i >= 0; i--) {
      try {
        const candidate = JSON.parse(jsonMatches[i][0]);
        if (candidate.instagram_text || candidate.x_text) {
          parsed = candidate;
          break;
        }
      } catch { /* try next */ }
    }
    if (!parsed) {
      // Last resort: find outermost braces
      const first = text.indexOf('{');
      const last = text.lastIndexOf('}');
      if (first !== -1 && last > first) {
        try {
          parsed = JSON.parse(text.substring(first, last + 1));
        } catch { /* give up */ }
      }
    }
  }

  if (!parsed) {
    console.error('Gemini raw response:', text.substring(0, 500));
    throw new Error('Failed to parse Gemini response as JSON');
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
