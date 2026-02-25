// src/flex_menu.js
// KABUKI PLUS+ / JIKABUKI PLUS+ サイト誘導メニュー
// カルーセル形式、全URIアクション

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

function _bubbleHeader(title, subtitle) {
  return [
    {
      type: "text",
      text: title,
      weight: "bold",
      size: "xl",
      color: KABUKI.goldDark
    },
    {
      type: "text",
      text: subtitle,
      size: "xs",
      color: KABUKI.dim,
      wrap: true
    },
    { type: "separator", margin: "md", color: KABUKI.border }
  ];
}

export function mainMenuFlex(env, url) {
  const origin = url || "https://kabukiplus.com";

  const kabukiBubble = {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      backgroundColor: KABUKI.bg,
      paddingAll: "18px",
      contents: [
        ..._bubbleHeader("KABUKI PLUS+", "歌舞伎をもっと楽しむ"),
        _menuLink("🧭", "KABUKI NAVI", "観劇ナビ・演目ガイド・用語辞典", `${origin}/kabuki/navi`),
        _menuLink("📡", "KABUKI LIVE", "ニュース・公演スケジュール", `${origin}/kabuki/live`),
        _menuLink("📖", "KABUKI RECO", "観劇記録・推し俳優", `${origin}/kabuki/reco`),
        _menuLink("🥋", "KABUKI DOJO", "クイズ・台詞稽古・大向う道場", `${origin}/kabuki/dojo`),
        {
          type: "text",
          text: "タップでサイトが開きます",
          size: "xxs",
          color: KABUKI.dimmer,
          align: "center",
          margin: "lg"
        }
      ]
    }
  };

  const jikabukiBubble = {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      backgroundColor: KABUKI.bg,
      paddingAll: "18px",
      contents: [
        ..._bubbleHeader("JIKABUKI PLUS+", "地歌舞伎の世界へ"),
        _menuLink("🏯", "GATE", "団体ポータル", `${origin}/jikabuki/gate/kera`),
        _menuLink("📡", "INFO", "地歌舞伎の公演・ニュース", `${origin}/jikabuki/info`),
        _menuLink("🔧", "BASE", "運営ツール", `${origin}/jikabuki/base`),
        _menuLink("🧪", "LABO", "研究・アーカイブ", `${origin}/jikabuki/labo`),
        {
          type: "text",
          text: "タップでサイトが開きます",
          size: "xxs",
          color: KABUKI.dimmer,
          align: "center",
          margin: "lg"
        }
      ]
    }
  };

  return {
    type: "flex",
    altText: "KABUKI PLUS+ / JIKABUKI PLUS+ メニュー",
    contents: {
      type: "carousel",
      contents: [kabukiBubble, jikabukiBubble]
    }
  };
}
