// src/faq_template.js
// =========================================================
// デフォルトFAQテンプレート定義
// {団体名} {会場名} {会場住所} はGATEページ表示時に自動置換
// =========================================================

export const FAQ_CATEGORIES = [
  "{団体名}について",
  "観劇の基本",
  "会場・設備",
  "アクセス・駐車場",
];

export const FAQ_TEMPLATE = [
  // ── {団体名}について ──
  { key: "about_what",     category: "{団体名}について", q: "{団体名}とは？（どんな地歌舞伎？）" },
  { key: "about_history",  category: "{団体名}について", q: "歴史・歩み（いつ頃から／特徴）" },
  { key: "about_members",  category: "{団体名}について", q: "どんな人が演じている？（地域・保存会・年齢層など）" },
  { key: "about_schedule", category: "{団体名}について", q: "公演はいつ（季節・頻度）？" },
  { key: "about_join",     category: "{団体名}について", q: "参加したい／手伝いたい（演者・裏方・ボランティア）" },
  { key: "about_support",  category: "{団体名}について", q: "応援したい（ご祝儀・おひねり・寄付・スポンサー）" },
  { key: "about_links",    category: "{団体名}について", q: "公式サイト／SNSはある？（リンク集）" },

  // ── 観劇の基本 ──
  { key: "viewing_ticket",   category: "観劇の基本", q: "チケットは必要？料金は？予約は？" },
  { key: "viewing_time",     category: "観劇の基本", q: "開場・開演・上演時間の目安は？" },
  { key: "viewing_flow",     category: "観劇の基本", q: "当日の流れ（受付→開演→休憩→終演）" },
  { key: "viewing_reentry",  category: "観劇の基本", q: "途中入退場／再入場はできる？" },
  { key: "viewing_photo",    category: "観劇の基本", q: "写真・動画撮影はOK？（幕間のみ等ルール）" },
  { key: "viewing_food",     category: "観劇の基本", q: "飲食はできる？（持ち込み／売店）" },
  { key: "viewing_clothing", category: "観劇の基本", q: "服装のおすすめ／持ち物（寒暖対策・座布団等）" },
  { key: "viewing_children", category: "観劇の基本", q: "子ども連れはOK？（泣いた時の対応など）" },

  // ── 会場・設備 ──
  { key: "facility_toilet",       category: "会場・設備", q: "トイレはある？" },
  { key: "facility_barrier_free", category: "会場・設備", q: "バリアフリー対応（段差／車椅子／優先席）" },
  { key: "facility_shoes",        category: "会場・設備", q: "靴・荷物はどうする？（土足／下駄箱／荷物置き場）" },
  { key: "facility_climate",      category: "会場・設備", q: "空調はある？寒暖対策は？" },
  { key: "facility_nursing",      category: "会場・設備", q: "授乳・おむつ替えスペースは？（あれば）" },
  { key: "facility_rest",         category: "会場・設備", q: "休憩スペースはある？" },
  { key: "facility_smoking",      category: "会場・設備", q: "喫煙所はある？（あれば）" },

  // ── アクセス・駐車場 ──
  { key: "access_directions",       category: "アクセス・駐車場", q: "会場へのアクセスは？（住所／ナビ設定）" },
  { key: "access_public_transport", category: "アクセス・駐車場", q: "公共交通で行ける？終演後の交通は？" },
  { key: "access_drive_time",      category: "アクセス・駐車場", q: "車での所要時間目安（主要地点から）" },
  { key: "access_parking",         category: "アクセス・駐車場", q: "駐車場はある？料金は？台数は？（満車時の案内）" },
  { key: "access_bus",             category: "アクセス・駐車場", q: "バス・大型車は停められる？（あれば）" },
  { key: "access_rain",            category: "アクセス・駐車場", q: "雨天時の注意（路面・足元等）" },
];
