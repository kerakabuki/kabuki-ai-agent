export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  KV: KVNamespace;
  GEMINI_API_KEY: string;
  API_TOKEN: string;
  // SNS API secrets (all optional — unconfigured platforms are skipped)
  META_ACCESS_TOKEN?: string;
  INSTAGRAM_USER_ID?: string;
  FACEBOOK_PAGE_ID?: string;
  X_API_KEY?: string;
  X_API_SECRET?: string;
  X_ACCESS_TOKEN?: string;
  X_ACCESS_SECRET?: string;
  BLUESKY_HANDLE?: string;
  BLUESKY_APP_PASSWORD?: string;
}

export interface Character {
  id: number;
  name: string;
  name_reading: string;
  aliases: string | null;
  related_play: string;
  description: string | null;
  personality_tags: string | null;
  season_tags: string | null;
  related_characters: string | null;
  kabuki_navi_url: string | null;
  navi_image_url: string | null;
  navi_enmoku_id: string | null;
  navi_cast_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImageRecord {
  id: number;
  filename: string;
  r2_key: string;
  character_id: number | null;
  play_name: string | null;
  scene_type: string | null;
  visual_features: string | null;
  season_tag: string | null;
  usage_count: number;
  navi_display_order: number | null;
  navi_caption: string | null;
  navi_visible: number;
  is_primary: number;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: number;
  post_date: string;
  day_of_week: number;
  theme: string;
  image_id: number | null;
  character_id: number | null;
  special_day: string | null;
  instagram_text: string | null;
  instagram_hashtags: string | null;
  x_text: string | null;
  x_hashtags: string | null;
  facebook_text: string | null;
  facebook_hashtags: string | null;
  cta_type: string | null;
  cta_url: string | null;
  status: string;
  instagram_posted: number;
  x_posted: number;
  facebook_posted: number;
  bluesky_text: string | null;
  bluesky_posted: number;
  created_at: string;
  updated_at: string;
}

export interface QuizPost {
  id: number;
  post_id: number | null;
  question: string;
  options: string;
  correct_answer: number;
  explanation: string | null;
  difficulty: string;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}

// Day themes
export const DAY_THEMES: Record<number, string> = {
  1: '演目',   // Monday
  2: '役者',   // Tuesday
  3: '豆知識', // Wednesday
  4: '名場面', // Thursday
  5: 'クイズ', // Friday
  6: '舞台裏', // Saturday
  0: '歴史',   // Sunday
};

// Season mapping
export function getSeason(month: number): string {
  if (month >= 4 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

// CTA types
export const CTA_DISTRIBUTION: Record<number, string> = {
  1: 'N', // Monday — no CTA
  2: 'B', // Tuesday — performance info
  3: 'N', // Wednesday — no CTA
  4: 'N', // Thursday — no CTA
  5: 'D', // Friday — quiz teaser
  6: 'N', // Saturday — no CTA
  0: 'C', // Sunday — experience
};

// KABUKI+ / JIKABUKI+ feature list for weekly introduction posts
export interface FeatureInfo {
  name: string;
  brand: 'KABUKI+' | 'JIKABUKI+' | 'YouTube';
  path: string;
  description: string;
  highlights: string[];
  ogpImage: string; // filename in R2 originals/ (e.g. "feature_navi_enmoku.png")
  imageAlt: string; // image description for AI text generation
  story: string; // 気良歌舞伎がこの機能を作った背景・ストーリー
}

export const FEATURES: FeatureInfo[] = [
  // ── KABUKI PLUS+ ──
  {
    name: 'KABUKI NAVI（演目ガイド）',
    brand: 'KABUKI+',
    path: '/kabuki/navi/enmoku',
    description: '21の歌舞伎演目を、あらすじ・見どころ・配役付きでわかりやすく解説。初心者でも安心のガイド。',
    highlights: ['全文検索', '幕構成・配役・あらすじ・見どころ', '登場人物の詳しい紹介'],
    ogpImage: 'feature_navi_enmoku.png',
    imageAlt: 'KABUKI NAVIの演目ガイド画面。演目一覧と詳細ページのスクリーンショット',
    story: '気良歌舞伎のメンバーが演目の稽古に入るとき、あらすじや配役をまとめた資料がバラバラで毎回探すのが大変だった。「一箇所にまとまっていれば」という声から生まれた演目ガイド。',
  },
  {
    name: 'KABUKI NAVI（用語辞典）',
    brand: 'KABUKI+',
    path: '/kabuki/navi/glossary',
    description: '126語の歌舞伎用語を8カテゴリで収録。読みがなとわかりやすい解説付き。',
    highlights: ['126語・8カテゴリ', '読みがな付き', 'カテゴリ別閲覧'],
    ogpImage: 'feature_navi_glossary.png',
    imageAlt: 'KABUKI NAVIの用語辞典画面。カテゴリ別の歌舞伎用語一覧',
    story: '地歌舞伎の公演に来てくれたお客さんから「花道って何？」「下座音楽って？」と聞かれることが多かった。観劇前にさっと調べられる辞典があればと思い、メンバーの知識を集めて作った。',
  },
  {
    name: 'KABUKI NAVI（観劇ナビ）',
    brand: 'KABUKI+',
    path: '/kabuki/navi/kangekinavi',
    description: '初心者向け6ステップで歌舞伎観劇をナビゲート。チケット購入からマナーまで。',
    highlights: ['チケット→アクセス→座席→マナー→掛け声→雰囲気', '写真つきガイド'],
    ogpImage: 'feature_navi_kangeki.png',
    imageAlt: 'KABUKI NAVIの観劇ナビ画面。初心者向け6ステップガイド',
    story: '「歌舞伎を観てみたいけど、何から始めれば？」という友人や知人の声が多かった。チケットの買い方から当日の過ごし方まで、初めての人が迷わないガイドを作りたかった。',
  },
  {
    name: 'KABUKI LIVE（公演情報）',
    brand: 'KABUKI+',
    path: '/kabuki/live',
    description: '歌舞伎座・新橋演舞場・南座など全国6大劇場の公演スケジュールをリアルタイム更新。',
    highlights: ['6大劇場の公演情報', '歌舞伎ニュース自動収集', '開幕カウントダウン'],
    ogpImage: 'feature_live.png',
    imageAlt: 'KABUKI LIVEの公演情報画面。全国主要劇場の公演スケジュール一覧',
    story: '「今月どこで何やってる？」を調べるのに毎回あちこちのサイトを回るのが面倒だった。全国の歌舞伎公演情報を一箇所で見られるようにしたくて作った。',
  },
  {
    name: 'KABUKI RECO（観劇記録）',
    brand: 'KABUKI+',
    path: '/kabuki/reco',
    description: '観た歌舞伎を記録・振り返り。お気に入り俳優の管理、月次サマリー、SNSシェア。',
    highlights: ['観劇ログ500件', '統計・チャート', 'SNSシェア・公開プロフィール', '11段階ランク称号'],
    ogpImage: 'feature_reco.png',
    imageAlt: 'KABUKI RECOの観劇記録画面。統計チャートとランキング表示',
    story: 'メンバーの中に「今年何回観劇した？」「あの演目いつ観たっけ？」と振り返りたい人が多かった。映画の記録アプリのように、歌舞伎の観劇も記録して楽しめるようにしたかった。',
  },
  {
    name: 'KABUKI DOJO（歌舞伎クイズ）',
    brand: 'KABUKI+',
    path: '/kabuki/dojo/quiz',
    description: '3段階の難易度で歌舞伎の知識を楽しくテスト。初級から上級まで挑戦。',
    highlights: ['初級・中級・上級', '10ステージ制', '70%以上で次の難易度アンロック'],
    ogpImage: 'feature_dojo_quiz.png',
    imageAlt: 'KABUKI DOJOのクイズ画面。3段階の難易度選択とステージ表示',
    story: '地歌舞伎の公演の幕間で、お客さんに楽しんでもらえるクイズコーナーをやっていた。「スマホでいつでもできたら面白いのに」という発想からクイズ機能が生まれた。',
  },
  {
    name: 'KABUKI DOJO（大向う道場）',
    brand: 'KABUKI+',
    path: '/training/kakegoe',
    description: '動画に合わせて掛け声と拍手のタイミングを練習。白浪五人男で実践。',
    highlights: ['動画連動', '掛け声＆拍手タイミング練習', 'おひねりボーナス'],
    ogpImage: 'feature_dojo_kakegoe.png',
    imageAlt: 'KABUKI DOJOの大向う道場画面。動画連動の掛け声練習インターフェース',
    story: '岐阜大学の留学生との地歌舞伎体験交流会で「おひねりってどのタイミングで投げるの？」「大向こうは？」という声を聞いた。それがきっかけで、気良歌舞伎の公演動画を使って遊びながら掛け声やおひねりのタイミングを学べる機能を作った。',
  },
  {
    name: 'けらのすけ（AIチャット）',
    brand: 'KABUKI+',
    path: '/kabuki/chat',
    description: 'AIアシスタント「けらのすけ」に歌舞伎のことを何でも質問。演目・用語・公演情報をRAGで回答。',
    highlights: ['歌舞伎専門AI', '演目・用語の知識ベース', 'LINEでも利用可能'],
    ogpImage: 'feature_chat.png',
    imageAlt: 'けらのすけAIチャットの会話画面。歌舞伎に関するQ&Aインターフェース',
    story: '歌舞伎の質問をしたくても、詳しい人が近くにいるとは限らない。AIなら24時間いつでも気軽に聞ける。NAVIに蓄積した演目・用語のデータを活かして歌舞伎専門のAIアシスタントを作った。',
  },
  // ── JIKABUKI PLUS+ ──
  {
    name: 'JIKABUKI GATE（団体公式ページ）',
    brand: 'JIKABUKI+',
    path: '/jikabuki/gate',
    description: '地歌舞伎・地芝居の団体が自分たちの公式ページを簡単に作成・運営できるサービス。',
    highlights: ['8種類のテーマ', '公演案内・ニュース・FAQ', 'マルチテナント対応'],
    ogpImage: 'feature_gate.png',
    imageAlt: 'JIKABUKI GATEの団体公式ページ。テーマ選択と公演案内の管理画面',
    story: '地歌舞伎の団体はWebサイトを持っていないところが多い。気良歌舞伎も最初はSNSだけだった。ITに詳しくなくても簡単に公式ページを持てるようにしたかった。',
  },
  {
    name: 'JIKABUKI INFO（地歌舞伎情報）',
    brand: 'JIKABUKI+',
    path: '/jikabuki/info',
    description: '全国の地歌舞伎・地芝居団体の一覧、芝居小屋データベース、イベント情報を集約。',
    highlights: ['全国の団体検索', '芝居小屋データベース', '地歌舞伎ニュース'],
    ogpImage: 'feature_info.png',
    imageAlt: 'JIKABUKI INFOの地歌舞伎情報画面。全国の団体一覧と芝居小屋データベース',
    story: '全国に地歌舞伎の団体がたくさんあるのに、情報がまとまっていなくて互いの存在を知らないことも多い。地歌舞伎の世界をつなぐポータルを作りたかった。',
  },
  {
    name: 'JIKABUKI BASE（台本共有）',
    brand: 'JIKABUKI+',
    path: '/jikabuki/base',
    description: 'デジタル台本の管理・閲覧機能。スマホやタブレットで台本を表示、他の団体とも共有できる。',
    highlights: ['スマホ・タブレットで台本表示', 'デジタルデータで検索', '団体間で台本共有'],
    ogpImage: 'feature_base.png',
    imageAlt: 'JIKABUKI BASEの台本管理画面',
    story: '気良歌舞伎では台本を紙ではなくスマホやタブレットで表示している。デジタルデータなら検索もできるし、何より他の団体とも共有できる。参加団体を募集中で、気良歌舞伎の台本データはご自由にご覧いただけます（参考になるかはわからないけど）。',
  },
  {
    name: 'JIKABUKI BASE（公演記録・役者DB）',
    brand: 'JIKABUKI+',
    path: '/jikabuki/base',
    description: '過去の公演記録アーカイブと役者データベース。誰がどんな役を演じてきたかを一覧で確認、次の配役決めにも活用。',
    highlights: ['公演記録アーカイブ', '役者の出演履歴DB', '配役決めの参考資料'],
    ogpImage: 'feature_base.png',
    imageAlt: 'JIKABUKI BASEの公演記録・役者DB画面',
    story: '気良歌舞伎20年やってきて、そろそろ過去の公演記録を整理しようと思い立った。誰がどんな役をやってきたのかがわかる役者DB機能を作って、次の配役決めにも転用できるようにした。',
  },
  {
    name: 'JIKABUKI BASE（演目選び）',
    brand: 'JIKABUKI+',
    path: '/jikabuki/base',
    description: '次の公演の演目選びを支援。過去の上演履歴・上演時間・子役の有無・出演人数などの条件で演目を絞り込める。',
    highlights: ['過去の上演履歴から検索', '上演時間・子役有無で絞り込み', '出演可能人数から候補を提案'],
    ogpImage: 'feature_base.png',
    imageAlt: 'JIKABUKI BASEの演目選び画面',
    story: '演目決めに悩む季節がやってくる。過去に演じたもの、上演時間、子役のありなし、出演可能人数…いろんな条件を考えながら絞っていく作業は大変。それを助けてくれる機能を作った。',
  },
  {
    name: 'JIKABUKI BASE（稽古・会計）',
    brand: 'JIKABUKI+',
    path: '/jikabuki/base',
    description: '稽古スケジュール・出欠管理・収支管理など、団体運営の日常業務をまとめて管理。',
    highlights: ['稽古カレンダー＆出欠', '収支管理', 'LINEグループ＆紙からの移行'],
    ogpImage: 'feature_base.png',
    imageAlt: 'JIKABUKI BASEの稽古カレンダーと収支管理のダッシュボード',
    story: '稽古の出欠連絡はLINEグループ、会計は紙の帳簿…バラバラだった団体運営の日常業務を一箇所にまとめたかった。自分たちが毎日使うものだから、使いやすさにこだわって作った。',
  },
  {
    name: 'JIKABUKI LABO（コンテンツ管理）',
    brand: 'JIKABUKI+',
    path: '/jikabuki/labo',
    description: '演目・用語・クイズなどのコンテンツを編集・追加できるエディター。みんなで歌舞伎データベースを育てる。',
    highlights: ['演目エディタ', '用語集エディタ', 'クイズエディタ'],
    ogpImage: 'feature_labo.png',
    imageAlt: 'JIKABUKI LABOのコンテンツ管理画面。演目・用語エディターのインターフェース',
    story: '演目や用語のデータは一人で作るには限界がある。歌舞伎に詳しいメンバーがそれぞれの得意分野を持ち寄って、みんなでデータベースを育てられる仕組みが欲しかった。',
  },
  // ── YouTube チャンネル動画紹介 ──
  {
    name: 'YouTube：気良歌舞伎チャンネル紹介',
    brand: 'YouTube',
    path: '',
    description: '気良歌舞伎の練習風景や本番映像、歌舞伎の魅力を伝える動画をYouTubeで公開中。チャンネル登録で最新動画をチェック！',
    highlights: ['練習風景・舞台裏', '本番ダイジェスト', '歌舞伎入門動画', 'チャンネル登録お願いします'],
    ogpImage: 'feature_youtube.png',
    imageAlt: '気良歌舞伎のYouTubeチャンネル。練習風景や公演映像のサムネイル',
    story: '地歌舞伎の魅力は舞台を観てもらうのが一番だけど、遠方の人には難しい。練習風景や舞台裏も含めて動画で伝えることで、地歌舞伎に興味を持ってもらうきっかけを作りたかった。',
  },
];
