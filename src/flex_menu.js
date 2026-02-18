// src/flex_menu.js
// KABUKI PLUS+ テック×和モダンスタイル（WEBと統一）
// 画像アイコン不使用、絵文字のみ

export const KABUKI = {
  bg: "#FAF7F2",
  card: "#FFFFFF",
  cardAlt: "#F5F0E8",
  gold: "#C5A255",
  goldDark: "#A8873A",
  text: "#3D3127",
  dim: "#8A7D72",
  dimmer: "#B0A89E",
  red: "#D4614B",
  blue: "#6B8FAD",
  green: "#6B9E78",
  border: "#EDE7DD"
};

/* ─── 共通パーツ ─── */
function _menuItem(emoji, label, desc, data) {
  return {
    type: "box",
    layout: "horizontal",
    paddingAll: "14px",
    backgroundColor: KABUKI.card,
    cornerRadius: "12px",
    borderWidth: "light",
    borderColor: KABUKI.border,
    action: { type: "postback", label, data },
    contents: [
      { type: "text", text: emoji, size: "xl", flex: 0, gravity: "center" },
      {
        type: "box",
        layout: "vertical",
        paddingStart: "12px",
        flex: 4,
        contents: [
          { type: "text", text: label, weight: "bold", size: "md", color: KABUKI.text },
          { type: "text", text: desc, size: "xxs", color: KABUKI.dim, wrap: true }
        ]
      },
      { type: "text", text: "›", size: "lg", color: KABUKI.goldDark, flex: 0, gravity: "center" }
    ]
  };
}

function _menuLink(emoji, label, desc, uri) {
  return {
    type: "box",
    layout: "horizontal",
    paddingAll: "14px",
    backgroundColor: KABUKI.card,
    cornerRadius: "12px",
    borderWidth: "light",
    borderColor: KABUKI.border,
    action: { type: "uri", label, uri },
    contents: [
      { type: "text", text: emoji, size: "xl", flex: 0, gravity: "center" },
      {
        type: "box",
        layout: "vertical",
        paddingStart: "12px",
        flex: 4,
        contents: [
          { type: "text", text: label, weight: "bold", size: "md", color: KABUKI.text },
          { type: "text", text: desc, size: "xxs", color: KABUKI.dim, wrap: true }
        ]
      },
      { type: "text", text: "›", size: "lg", color: KABUKI.goldDark, flex: 0, gravity: "center" }
    ]
  };
}

function _sectionHeader(text) {
  return {
    type: "text",
    text: `▎${text}`,
    weight: "bold",
    size: "sm",
    color: KABUKI.goldDark,
    margin: "lg"
  };
}

/* =========================================================
   メインメニュー（初回挨拶・KABUKI PLUS+ トップ）
========================================================= */
export function mainMenuFlex(env, url) {
  const origin = url || "https://kerakabuki.kerakabuki.workers.dev";

  return {
    type: "flex",
    altText: "KABUKI PLUS+ メニュー",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        backgroundColor: KABUKI.bg,
        paddingAll: "18px",
        contents: [
          {
            type: "text",
            text: "KABUKI PLUS+",
            weight: "bold",
            size: "xl",
            color: KABUKI.goldDark
          },
          {
            type: "text",
            text: "歌舞伎AIガイド｜気になるメニューをタップ",
            size: "xs",
            color: KABUKI.dim,
            wrap: true
          },
          { type: "separator", margin: "md", color: KABUKI.border },

          _sectionHeader("NAVI — 読んで学ぶ"),
          _menuItem("🧭", "KABUKI NAVI", "演目・用語・おすすめを探索", "step=navi_home"),
          _menuItem("📜", "演目・人物ガイド", "20演目のあらすじ・みどころ・登場人物", "step=enmoku_list"),
          _menuItem("📖", "歌舞伎用語いろは", "126の用語をカテゴリ別に解説", "mode=general"),
          _menuItem("🏮", "おすすめ演目", "初心者向け／ジャンル別にサクッと", "mode=recommend"),

          _sectionHeader("LIVE — 今を見る"),
          _menuItem("📰", "歌舞伎ニュース", "最新ニュースをチェック", "step=news"),
          _menuLink("📡", "KABUKI LIVE", "ニュース＋公演スケジュール", `${origin}/live`),

          _sectionHeader("RECO — 記録する"),
          _menuLink("📖", "KABUKI RECO", "観劇記録・推し俳優", `${origin}/reco`),

          _sectionHeader("DOJO — やってみる"),
          _menuItem("👺", "歌舞伎クイズ", "全100問の三択で楽しく学ぼう", "mode=quiz"),
          _menuLink("🥋", "KABUKI DOJO", "台詞稽古・大向う道場をブラウザで体験", `${origin}/dojo`),

          {
            type: "text",
            text: "💡「0」でいつでもメニューに戻れるよ",
            size: "xxs",
            color: KABUKI.dimmer,
            wrap: true,
            margin: "md"
          }
        ]
      }
    }
  };
}

/* =========================================================
   KABUKI NAVI ホーム（調べる系サブメニュー）
========================================================= */
export function naviHomeFlex(env, url) {
  const origin = url || "https://kerakabuki.kerakabuki.workers.dev";

  return {
    type: "flex",
    altText: "KABUKI NAVI",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        backgroundColor: KABUKI.bg,
        paddingAll: "18px",
        contents: [
          {
            type: "text",
            text: "🧭 KABUKI NAVI",
            weight: "bold",
            size: "xl",
            color: KABUKI.goldDark
          },
          {
            type: "text",
            text: "歌舞伎の世界を探索しよう",
            size: "xs",
            color: KABUKI.dim,
            wrap: true
          },
          { type: "separator", margin: "md", color: KABUKI.border },
          _menuItem("🏠", "初心者FAQ", "気良歌舞伎の基本・参加方法", "step=talk_list"),
          _menuItem("📜", "演目を探す", "あらすじ・みどころ・登場人物", "step=enmoku_list"),
          _menuItem("📖", "用語を調べる", "カテゴリ別に歌舞伎用語を解説", "step=glossary_cat"),
          _menuItem("🏮", "おすすめ演目", "初心者向け・ジャンル別にサクッと", "step=recommend_list"),
          _menuItem("📰", "歌舞伎ニュース", "最新ニュースをチェック", "step=news"),

          { type: "separator", margin: "md", color: KABUKI.border },

          _sectionHeader("RECO / DOJO"),
          _menuLink("📖", "KABUKI RECO", "観劇記録・推し俳優", `${origin}/reco`),
          _menuItem("👺", "歌舞伎クイズ", "全100問の三択で楽しく学ぼう", "mode=quiz"),
          _menuLink("🥋", "KABUKI DOJO", "台詞稽古・大向う道場", `${origin}/dojo`),

          {
            type: "text",
            text: "💡「0」メニュー ／「9」ひとつ戻る",
            size: "xxs",
            color: KABUKI.dimmer,
            wrap: true,
            margin: "md"
          }
        ]
      }
    }
  };
}
