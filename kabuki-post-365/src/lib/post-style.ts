import type { Env } from '../types';

// ── 投稿文の型崩し（2026-08）──
// 生成文が「この○○、〜ですよね✨」→ 感想 →「私たち気良歌舞伎は…」の一本調子に
// 収束していたため、日替わりで「構成そのもの」を切り替える。
// トーン指示だけを足しても同じ鋳型に戻るので、構成・長さ・絵文字量をセットで縛る。

export interface CompositionStyle {
  id: string;
  label: string;
  /** 検品済みキャラクター情報が紐づいている投稿でのみ選ばれる */
  needsCharacter?: boolean;
  /** 画像の特徴・場面タイプが分かっている投稿でのみ選ばれる（無いと写真の中身を創作するため） */
  needsVisual?: boolean;
  instruction: string;
}

export const COMPOSITION_STYLES: CompositionStyle[] = [
  {
    id: 'discovery',
    label: '発見先出し',
    instruction: `1行目から、読者が知らないであろう具体的な事実・気づきを書く。前置き・あいさつ・共感の呼びかけは一切書かない。
- 事実 → その事実がなぜ面白いか → 最後の1行だけ自分の感想、の順
- 本文の目安 400〜600字。絵文字は全体で2個まで`,
  },
  {
    id: 'one_detail',
    label: '一点凝視',
    needsVisual: true,
    instruction: `写真の中の細部を「ひとつだけ」選び、そこだけを見つめて書く。全体の説明も、演目の解説もしない。
- 選ぶ細部は【画像の特徴】【場面タイプ】に書かれている範囲から取る。写っていないものを想像で描写しない
- 選んだ細部（色・線・持ち物・手元・視線など）から書き出す
- 「他にも見どころが」と話を広げない。ひとつで終わる
- 本文の目安 200〜350字。絵文字は全体で1個まで`,
  },
  {
    id: 'monologue',
    label: '座員のひとりごと',
    instruction: `舞台を作っている側の人間の実感を、日記のように書く。情報を届ける文章にしない。
- 短い文を重ねる。文末を揃えない（ただし「です・ます」の丁寧語は保つ。常体で書かない）
- 「〜ですよね」「〜じゃないでしょうか」のような同意を求める言い回しを使わない
- まとめ・オチ・教訓をつけずに終わってよい
- 本文の目安 300〜500字。絵文字は全体で1個まで`,
  },
  {
    id: 'question',
    label: '問いを立てる',
    instruction: `1行目に、答えが人によって割れる問いを置く。「素敵ですよね？」のような同意を求めるだけの問いは禁止。
- 問い → 考えられる見方を2つ提示 → 自分はこう思う、を最後に短く
- 読者に結論を押しつけない
- 本文の目安 300〜500字。絵文字は全体で2個まで`,
  },
  {
    id: 'character_dive',
    label: '人物の一点突破',
    needsCharacter: true,
    instruction: `与えられた人物情報の中で、いちばん「ひどい」「おかしい」「切ない」一点だけを取り上げて書く。
- 経歴の要約や演目のあらすじ紹介はしない。その一点だけを掘る
- 与えられた情報に無い設定・エピソードは足さない
- 本文の目安 400〜600字。絵文字は全体で2個まで`,
  },
  {
    id: 'scene',
    label: '情景描写',
    needsVisual: true,
    instruction: `その場の光・音・空気を描写する文体で書く。読者への呼びかけ・問いかけを一切入れない。
- 描くのは【画像の特徴】【場面タイプ】に書かれている範囲まで。写っていない情景を作らない
- 見えているものを淡々と描く。「〜ですよね」「〜しませんか」は使わない
- 描写文でも文末はすべて「です・ます」で終える（体言止めは可。「〜だ」「〜である」「〜ている」「〜する」のような常体で文を終えない）
- 主観を書くのは最後の1行だけ
- 本文の目安 300〜450字。絵文字は全体で1個まで`,
  },
  {
    id: 'short',
    label: '短文と余白',
    instruction: `全体で100〜200字に収める。写真に語らせ、言葉は削る。
- 2〜4行。説明しない、盛り上げない
- 短くても中身は入れる。【画像の特徴】【場面タイプ】から具体を最低ひとつ拾って書く（「大切な一部です」のような当たり障りのないまとめだけで終わらせない）
- 気良歌舞伎の活動紹介やCTAの定型文を入れない（CTA指定がある場合のみ最小限に）
- 絵文字は0個か1個`,
  },
  {
    id: 'gap',
    label: '意外性の落差',
    instruction: `「そう思われがちだが、実は違う」という落差を軸に書く。
- 前段で一般的なイメージを書き、後段でひっくり返す
- ひっくり返す側の中身は、与えられた情報の範囲で書ける事実に限る（想像で補わない）
- 本文の目安 400〜600字。絵文字は全体で2個まで`,
  },
  {
    id: 'audience',
    label: '客席目線',
    instruction: `観に来た人の視点で書く。舞台の内側の事情ではなく、客席から何が見えるか・どう感じるかを書く。
- 席の位置による見え方の違い（前方・後方・花道近く）といった一般論は書いてよい
- 「隣の席の人がこう言っていた」「客席からこんな声が上がった」のような、実際にあったかのような場面や発言を創作しない
- 本文の目安 300〜500字。絵文字は全体で2個まで`,
  },
  {
    id: 'hands',
    label: '手を動かす話',
    instruction: `作る・運ぶ・直す・片付けるといった、手を動かす側の具体に寄せて書く。
- 大道具・小道具を座員が手作りしている点は書いてよいが、与えられていない具体的な作業内容を創作しない
- 「感動」「情熱」といった大きな言葉を使わず、作業の手ざわりで書く
- 本文の目安 300〜500字。絵文字は全体で1個まで`,
  },
];

/** テーマ側で構成が決まっている投稿は構成ローテーションの対象外（書き出し縛りだけ適用する） */
const FIXED_FORMAT_THEMES = ['クイズ', '機能紹介'];

function hashString(value: string): number {
  // FNV-1a 32bit（daily-run.ts の hashDate と同じ方式）
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * 投稿日とテーマから構成型を決定論的に選ぶ。
 * 日付のepoch dayを足しているので、連続する日は必ず違う構成になる
 * （テーマのハッシュはテーマごとに位相をずらすためのオフセット）。
 */
export function pickCompositionStyle(
  postDate: string,
  theme: string,
  hasCharacter: boolean,
  hasVisual: boolean,
): CompositionStyle | null {
  if (FIXED_FORMAT_THEMES.includes(theme)) return null;

  const pool = COMPOSITION_STYLES.filter(s =>
    (!s.needsCharacter || hasCharacter) && (!s.needsVisual || hasVisual),
  );
  if (pool.length === 0) return null;

  const epochDay = Math.floor(Date.parse(`${postDate}T00:00:00Z`) / 86400000);
  const base = Number.isFinite(epochDay) ? epochDay : 0;
  const index = (((base + hashString(theme)) % pool.length) + pool.length) % pool.length;
  return pool[index];
}

/**
 * 直近の投稿の書き出しを集める。生成プロンプトに「これと同じ入り方をするな」と渡すため。
 * 本文生成は最大7日先まで先回りするので、post_date の新しい順に取る。
 */
export async function fetchRecentOpenings(env: Env, limit = 12): Promise<string[]> {
  try {
    const { results } = await env.DB.prepare(
      `SELECT instagram_text FROM posts
       WHERE instagram_text IS NOT NULL AND instagram_text != ''
       ORDER BY post_date DESC LIMIT ?`,
    ).bind(limit).all();

    const openings: string[] = [];
    for (const row of results as Array<{ instagram_text: string }>) {
      const first = (row.instagram_text || '').split('\n').find(l => l.trim().length > 0) || '';
      const trimmed = first.trim().slice(0, 30);
      if (trimmed) openings.push(trimmed);
    }
    return openings;
  } catch (e) {
    // 書き出し回避はあくまで補助。取得に失敗しても生成は続ける
    console.error('fetchRecentOpenings failed:', (e as Error).message);
    return [];
  }
}

/** 実測でパターン化していた表現の禁止リスト（2026-08、直近1か月の生成文から抽出） */
export const BANNED_PHRASE_RULES = `【使い古された表現の禁止（最重要・実際に投稿がパターン化したため）】
- 指示語で写真を指してから感想を述べる形（「この○○、〜ですよね」「この○○、〜ませんか」「この○○を見ると〜ます」「この○○、〜します」）で書き始めない。直近の投稿の大半がこの型で、機械投稿の指紋になっている
- そもそも「この」「その」で始まる1文目にしない。名詞・事実・動作・問いのいずれかから始める
- すべてのプラットフォームの本文で「です・ます」の丁寧語を基本にする（構成の指定で常体が許されている場合を除く）
- 次の語は使わない: ワクワク / ドキドキ / 鳥肌 / 奥が深い / 思わず息をのむ / 心が温かく / 胸が高鳴る / 引き込まれます / 魅了され / 圧巻 / 素敵ですよね
- 「〜ですよね」「〜なんです」「〜なんですよ」は本文全体で合わせて2回まで
- すべての段落を「✨」で締めない。絵文字は指定された個数の上限を守る
- 「私たち気良歌舞伎は〜」で始まる自己紹介的な段落を毎回入れない`;

/** 構成型と書き出し回避をまとめてプロンプト片にする */
export function buildVariationPrompt(
  style: CompositionStyle | null,
  recentOpenings: string[],
): string {
  const parts: string[] = [];

  if (style) {
    parts.push(`【今日の構成（この形で書くこと）】${style.label}
${style.instruction}`);
  }

  if (recentOpenings.length > 0) {
    const list = recentOpenings.map(o => `- ${o}`).join('\n');
    parts.push(`【直近の投稿の書き出し（これらと同じ型・同じ語彙で書き始めない）】
${list}`);
  }

  parts.push(BANNED_PHRASE_RULES);

  return parts.join('\n\n');
}
