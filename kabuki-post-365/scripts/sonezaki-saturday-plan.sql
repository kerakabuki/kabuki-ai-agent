-- 曽根崎心中 週次告知（毎週土曜・7/25〜9/26 の10回）
-- docs/pr-plan-r8-kera-sonezaki.md の「差し込み方式」を posts テーブルに反映する。
-- 本文カラムはNULLに戻し、翌朝の先読み生成が special_day（【特別な日】として
-- プロンプトに渡る）を踏まえて再生成する。生成文は投稿前に必ず目視レビューすること
-- （心中演目のため軽いノリの文面が出たら管理画面で手直し。企画書のルール）。
--
-- 実行: kabuki-post-365/ で
--   npx wrangler@latest d1 execute kabuki-post-365-db --remote --file=scripts/sonezaki-saturday-plan.sql
-- 戻し: 管理画面で各投稿の theme / special_day を個別に編集すれば戻せる。

-- 7/25(土) 演目発表フォロー（軸②: 映画『国宝』）
UPDATE posts SET theme='演目',
  special_day='令和8年の気良歌舞伎公演は『曽根崎心中』（近松門左衛門作）に初挑戦。映画『国宝』で話題になったあの演目。公演は9月26日(土)18時開演・気良座',
  cta_type='A', cta_url='https://kabukiplus.com/kabuki/navi/enmoku/sonezakisinju',
  instagram_text=NULL, instagram_hashtags=NULL, x_text=NULL, x_hashtags=NULL,
  facebook_text=NULL, facebook_hashtags=NULL, bluesky_text=NULL, quiz_answer_comment=NULL,
  updated_at=datetime('now')
WHERE id=481;

-- 8/1(土) 演目解説①: どんな物語か
UPDATE posts SET theme='演目',
  special_day='曽根崎心中の演目解説その1: どんな物語かをやさしく紹介（近松門左衛門作。醤油屋の手代・徳兵衛と遊女・お初の物語。あらすじは3行程度で）。公演は9月26日(土)18時開演・気良座',
  cta_type='A', cta_url='https://kabukiplus.com/kabuki/navi/enmoku/sonezakisinju',
  instagram_text=NULL, instagram_hashtags=NULL, x_text=NULL, x_hashtags=NULL,
  facebook_text=NULL, facebook_hashtags=NULL, bluesky_text=NULL, quiz_answer_comment=NULL,
  updated_at=datetime('now')
WHERE id=488;

-- 8/8(土) 稽古密着①（画像は稽古写真を管理画面で割当てること）
UPDATE posts SET theme='舞台裏',
  special_day='『曽根崎心中』の稽古が進行中。添付写真の場面を素直に紹介する（稽古の空気感重視）。公演は9月26日(土)18時開演・気良座',
  cta_type='B', cta_url='https://kabukiplus.com/jikabuki/gate/kera',
  instagram_text=NULL, instagram_hashtags=NULL, x_text=NULL, x_hashtags=NULL,
  facebook_text=NULL, facebook_hashtags=NULL, bluesky_text=NULL, quiz_answer_comment=NULL,
  updated_at=datetime('now')
WHERE id=495;

-- 8/15(土) 演目解説②: 足の会話
UPDATE posts SET theme='豆知識',
  special_day='曽根崎心中の演目解説その2: 見どころは天満屋の場「縁の下の足の会話」。お初と徳兵衛が足先だけで死の覚悟を確かめ合う名場面（映画『国宝』でも印象的に描かれた）。公演は9月26日(土)18時開演・気良座',
  cta_type='A', cta_url='https://kabukiplus.com/kabuki/navi/enmoku/sonezakisinju',
  instagram_text=NULL, instagram_hashtags=NULL, x_text=NULL, x_hashtags=NULL,
  facebook_text=NULL, facebook_hashtags=NULL, bluesky_text=NULL, quiz_answer_comment=NULL,
  updated_at=datetime('now')
WHERE id=502;

-- 8/22(土) 稽古密着②（画像は稽古写真を管理画面で割当てること）
UPDATE posts SET theme='舞台裏',
  special_day='『曽根崎心中』稽古の様子その2。添付写真の場面を素直に紹介する。公演は9月26日(土)18時開演・気良座',
  cta_type='B', cta_url='https://kabukiplus.com/jikabuki/gate/kera',
  instagram_text=NULL, instagram_hashtags=NULL, x_text=NULL, x_hashtags=NULL,
  facebook_text=NULL, facebook_hashtags=NULL, bluesky_text=NULL, quiz_answer_comment=NULL,
  updated_at=datetime('now')
WHERE id=509;

-- 8/29(土) 配役リレー発表（軸①メイン）
UPDATE posts SET theme='役者',
  special_day='配役リレー発表: お初と徳兵衛は二組が場をつないで演じる。第一場(生玉社前)・第二場(天満屋)は中核の役者、物語の結末となる第三場(天神森)は若手が初挑戦。同じ役が場をこえて受け継がれる、世代をつなぐ挑戦（優劣比較はしない）。公演は9月26日(土)18時開演・気良座',
  cta_type='B', cta_url='https://kabukiplus.com/jikabuki/gate/kera',
  instagram_text=NULL, instagram_hashtags=NULL, x_text=NULL, x_hashtags=NULL,
  facebook_text=NULL, facebook_hashtags=NULL, bluesky_text=NULL, quiz_answer_comment=NULL,
  updated_at=datetime('now')
WHERE id=516;

-- 9/5(土) 配役リレー深掘り（継承の物語）
UPDATE posts SET theme='役者',
  special_day='配役リレーの話の続き: 同じお初徳兵衛を場を替えて二組が演じる。地歌舞伎ならではの「継承」がそのままドラマになる。クライマックスの心中場を若手に託す意味を、押し付けがましくなく語る。公演は9月26日(土)18時開演・気良座',
  cta_type='B', cta_url='https://kabukiplus.com/jikabuki/gate/kera',
  instagram_text=NULL, instagram_hashtags=NULL, x_text=NULL, x_hashtags=NULL,
  facebook_text=NULL, facebook_hashtags=NULL, bluesky_text=NULL, quiz_answer_comment=NULL,
  updated_at=datetime('now')
WHERE id=523;

-- 9/12(土) 開演まで2週間 + アクセス案内
UPDATE posts SET theme='演目',
  special_day='『曽根崎心中』開演まであと2週間。日時と会場の案内を丁寧に: 9月26日(土)18時開演、会場は気良座（旧明方小学校講堂・岐阜県郡上市明宝気良154）。予習は演目ガイドから（プロフィールのリンク）。カウントダウンは品位を保ち、煽らない',
  cta_type='B', cta_url='https://kabukiplus.com/jikabuki/gate/kera',
  instagram_text=NULL, instagram_hashtags=NULL, x_text=NULL, x_hashtags=NULL,
  facebook_text=NULL, facebook_hashtags=NULL, bluesky_text=NULL, quiz_answer_comment=NULL,
  updated_at=datetime('now')
WHERE id=530;

-- 9/19(土) あと1週間・総まとめ
UPDATE posts SET theme='演目',
  special_day='『曽根崎心中』開演まであと1週間の総まとめ: 9月26日(土)18時開演・気良座（旧明方小学校講堂・岐阜県郡上市明宝気良154）。近松門左衛門作、気良歌舞伎初挑戦。お初徳兵衛は二組の配役リレー。「この世のなごり、夜もなごり」の世界へ。品位を保った落ち着いた文面で',
  cta_type='B', cta_url='https://kabukiplus.com/jikabuki/gate/kera',
  instagram_text=NULL, instagram_hashtags=NULL, x_text=NULL, x_hashtags=NULL,
  facebook_text=NULL, facebook_hashtags=NULL, bluesky_text=NULL, quiz_answer_comment=NULL,
  updated_at=datetime('now')
WHERE id=537;

-- 9/26(土) 公演当日の朝
UPDATE posts SET theme='演目',
  special_day='本日開演: 令和8年気良歌舞伎公演『曽根崎心中』、本日9月26日(土)18時開演・気良座（旧明方小学校講堂・岐阜県郡上市明宝気良154）。ここまで応援してくれた方への感謝と、心を込めて勤める決意を静かに。煽らず、品位を保って',
  cta_type='B', cta_url='https://kabukiplus.com/jikabuki/gate/kera',
  instagram_text=NULL, instagram_hashtags=NULL, x_text=NULL, x_hashtags=NULL,
  facebook_text=NULL, facebook_hashtags=NULL, bluesky_text=NULL, quiz_answer_comment=NULL,
  updated_at=datetime('now')
WHERE id=544;
