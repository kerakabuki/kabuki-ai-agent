// 令和八年 気良歌舞伎公演「曽根崎心中」ご来場者アンケートの設問定義。
// 文言・選択肢を変えるときはこのファイルだけを直す。
// 選択肢の値（英字）はDBに保存されるので公開後は変えない（表示名だけ直す）。
const PREFECTURES = [
  ['hokkaido', '北海道'], ['aomori', '青森県'], ['iwate', '岩手県'], ['miyagi', '宮城県'], ['akita', '秋田県'], ['yamagata', '山形県'], ['fukushima', '福島県'],
  ['ibaraki', '茨城県'], ['tochigi', '栃木県'], ['gunma', '群馬県'], ['saitama', '埼玉県'], ['chiba', '千葉県'], ['tokyo', '東京都'], ['kanagawa', '神奈川県'],
  ['niigata', '新潟県'], ['toyama', '富山県'], ['ishikawa', '石川県'], ['fukui', '福井県'], ['yamanashi', '山梨県'], ['nagano', '長野県'], ['gifu', '岐阜県'], ['shizuoka', '静岡県'], ['aichi', '愛知県'],
  ['mie', '三重県'], ['shiga', '滋賀県'], ['kyoto', '京都府'], ['osaka', '大阪府'], ['hyogo', '兵庫県'], ['nara', '奈良県'], ['wakayama', '和歌山県'],
  ['tottori', '鳥取県'], ['shimane', '島根県'], ['okayama', '岡山県'], ['hiroshima', '広島県'], ['yamaguchi', '山口県'],
  ['tokushima', '徳島県'], ['kagawa', '香川県'], ['ehime', '愛媛県'], ['kochi', '高知県'],
  ['fukuoka', '福岡県'], ['saga', '佐賀県'], ['nagasaki', '長崎県'], ['kumamoto', '熊本県'], ['oita', '大分県'], ['miyazaki', '宮崎県'], ['kagoshima', '鹿児島県'], ['okinawa', '沖縄県'],
];
export const SURVEY_2026 = {
  id: '2026',
  eyebrow: '令和八年 気良歌舞伎公演 · 2026.9.26',
  title: 'ご来場者アンケート',
  shareTitle: '令和八年 気良歌舞伎公演 ご来場者アンケート',
  shareDescription: '「曽根崎心中」にご来場くださった皆さまへ。3分ほどのアンケートにご協力ください。',
  closesAt: '2026-10-31T23:59:59+09:00',
  closesLabel: '2026年10月31日（土）',
  sections: [
    { title: '「曽根崎心中」について', questions: [
      { id: 'overall', type: 'single', required: true, label: '公演はいかがでしたか', short: '総合評価', options: [['great', 'とてもよかった'], ['good', 'よかった'], ['fair', 'ふつう'], ['poor', 'あまりよくなかった'], ['bad', 'よくなかった']] },
      { id: 'highlights', type: 'multi', other: true, label: '心に残ったところをお選びください', hint: 'いくつでもお選びいただけます。', short: '心に残ったところ', options: [['scene1', '第一場　生玉社前ノ場'], ['scene2', '第二場　天満屋ノ場（縁の下の「足の会話」）'], ['scene3', '第三場　天神森ノ場（道行）'], ['relay', 'お初・徳兵衛の配役リレー'], ['video', '映像の演出（プロジェクションマッピング）'], ['costume', '衣装・化粧・かつら'], ['set', '舞台装置・大道具'], ['music', '義太夫・音楽'], ['audience', '掛け声・おひねりなど客席の熱気'], ['venue', '気良座（芝居小屋）の雰囲気'], ['other', 'その他']] },
      { id: 'relay', type: 'single', label: '第一場・第二場と第三場で、お初と徳兵衛を別の役者が演じ継ぐ「配役リレー」はいかがでしたか', short: '配役リレー', options: [['great', 'とてもよかった'], ['good', 'よかった'], ['neutral', 'どちらともいえない'], ['confusing', 'わかりにくかった'], ['unnoticed', '気づかなかった']] },
      { id: 'video', type: 'single', label: '舞台の背景に映像を映す演出（プロジェクションマッピング）はいかがでしたか', short: '映像の演出', options: [['great', 'とてもよかった'], ['good', 'よかった'], ['neutral', 'どちらともいえない'], ['without', 'ないほうがよかった'], ['unnoticed', '覚えていない']] },
      { id: 'story', type: 'single', label: 'お話の筋はわかりましたか', short: '筋のわかりやすさ', options: [['clear', 'よくわかった'], ['mostly', 'だいたいわかった'], ['partly', 'あまりわからなかった'], ['unclear', 'わからなかった']] },
      { id: 'aids', type: 'multi', exclusive: 'none', label: 'お話をつかむ助けになったものをお選びください', hint: 'いくつでもお選びいただけます。', short: '理解の助けになったもの', options: [['pamphlet', '当日のパンフレット'], ['okuda_intermission', 'おくだ健太郎氏による幕間解説'], ['earphone_guide', 'イヤホンガイド'], ['kaisetsu', '演目解説のページ（QRコード）'], ['youtube', 'YouTubeの解説動画'], ['web', 'noteの記事・ウェブの演目ガイド'], ['film', '映画『国宝』'], ['known', 'もともと知っていた'], ['none', '特になし']] },
    ] },
    { title: 'あなたについて', questions: [
      { id: 'visits', type: 'single', label: '気良歌舞伎をご覧になるのは何回目ですか', short: '観劇回数', options: [['first', 'はじめて'], ['few', '2〜4回目'], ['many', '5回以上']] },
      // 公開当初の回答と、開いたままの旧フォームからの送信・再送を保持する。新しい回答画面には出さない。
      { id: 'region', legacy: true, type: 'single', label: 'どちらからお越しになりましたか', short: 'お住まい', options: [['meiho', '明宝（気良を含む）'], ['gujo', '郡上市内（明宝以外）'], ['gifu', '岐阜県内（郡上市外）'], ['aichi', '愛知県'], ['other_pref', 'その他の都道府県'], ['abroad', '海外']] },
      { id: 'prefecture', type: 'single', presentation: 'select', label: 'お住まいの都道府県をお選びください', short: '都道府県', options: [...PREFECTURES, ['abroad', '海外']] },
      { id: 'gifu_area', type: 'single', dependsOn: 'prefecture', dependsValue: 'gifu', label: '岐阜県内のどちらからお越しになりましたか', hint: '差し支えなければお選びください。', short: '岐阜県内の地域', options: [['meiho', '明宝（気良を含む）'], ['gujo', '郡上市内（明宝以外）'], ['other_gifu', '岐阜県内（郡上市外）']] },
      { id: 'age', type: 'single', label: '年代をお選びください', short: '年代', options: [['u19', '10代以下'], ['20s', '20代'], ['30s', '30代'], ['40s', '40代'], ['50s', '50代'], ['60s', '60代'], ['70p', '70代以上']] },
      { id: 'source', type: 'multi', other: true, label: 'この公演を何で知りましたか', hint: 'いくつでもお選びいただけます。', short: '知ったきっかけ', options: [['postcard', '案内のはがき'], ['word', '家族・知人から'], ['cast', '出演者・関係者から'], ['newspaper', '新聞'], ['sns', 'Instagram・Facebookなど SNS'], ['youtube', 'YouTube'], ['website', 'ウェブサイト'], ['flyer', 'チラシ・ポスター'], ['local', '地域の回覧・お知らせ'], ['regular', '毎年来ている'], ['other', 'その他']] },
      { id: 'kokuho', type: 'single', label: '映画『国宝』をご覧になりましたか', short: '映画『国宝』', options: [['trigger', '観た（今回の来場のきっかけになった）'], ['seen', '観た（来場のきっかけではない）'], ['not_seen', '観ていない']] },
      { id: 'revisit', type: 'single', label: 'また気良歌舞伎を観に来たいと思いますか', short: '再来場の意向', options: [['definitely', 'ぜひ来たい'], ['maybe', '都合が合えば来たい'], ['unsure', 'わからない'], ['no', 'あまり思わない']] },
    ] },
    { title: '会場について', questions: [
      { id: 'improve', type: 'multi', other: true, exclusive: 'none', label: '会場で気になったこと・改善してほしいことをお選びください', hint: 'いくつでもお選びいただけます。', short: '会場で気になったこと', options: [['seats', '座席・舞台の見やすさ'], ['sound', '台詞・音の聞こえ方'], ['temperature', '暑さ・寒さ'], ['toilet', 'トイレ'], ['parking', '駐車場・道順'], ['time', '開演・終演の時刻'], ['guidance', '受付・場内の案内'], ['other', 'その他'], ['none', '特になし']] },
    ] },
    { title: 'ひとこと', questions: [
      { id: 'comment', type: 'text', max: 1000, label: 'ご感想・出演者へのメッセージなど、ご自由にお書きください', hint: 'お名前やご連絡先は書かないでください。', short: 'ご感想' },
      { id: 'quote', type: 'single', dependsOn: 'comment', label: 'このご感想を、公式サイトやSNSでご紹介してもよいですか', hint: 'お名前は出しません。', short: '紹介の可否', options: [['profile', '紹介してよい（「愛知県・40代」のように地域と年代を添える）'], ['anonymous', '紹介してよい（地域・年代も出さない）'], ['private', '紹介しないでほしい']] },
    ] },
  ],
};
