// src/flex_menu.js
// KABUKI PLUS+ メインメニュー（Flex Message）
// けらのすけ中心 + LINE内操作優先設計

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

/* ─── Webリンク行（軽量カード用） ─── */
function _webLink(label, uri) {
  return {
    type: "box",
    layout: "horizontal",
    paddingAll: "10px",
    action: { type: "uri", label, uri },
    contents: [
      { type: "text", text: label, size: "sm", color: KABUKI.text, flex: 4, gravity: "center" },
      { type: "text", text: "›", size: "md", color: KABUKI.dimmer, flex: 0, gravity: "center" }
    ]
  };
}

/* ─── 会話型ウェルカムメッセージ（QuickReply付き） ─── */
export function mainMenuMessage(env, url) {
  const origin = url || "https://kabukiplus.com";
  return {
    type: "text",
    text: "けらのすけだよ。\n歌舞伎のこと、何でも聞いてね。\n\n例えば──\n「義経千本桜ってどんな話？」\n「初めて歌舞伎座に行くんだけど」\n「隈取について教えて」",
    quickReply: { items: [
      { type: "action", action: { type: "message", label: "演目を調べる", text: "演目ガイド" } },
      { type: "action", action: { type: "message", label: "用語辞典", text: "用語辞典" } },
      { type: "action", action: { type: "message", label: "ニュース", text: "ニュース" } },
      { type: "action", action: { type: "message", label: "おすすめ", text: "おすすめ教えて" } },
      { type: "action", action: { type: "uri", label: "KABUKI PLUS+", uri: `${origin}/kabuki/navi` } },
    ]}
  };
}

/* ─── 軽量カード（ヘルプ・Web導線用） ─── */
export function mainMenuFlex(env, url) {
  const origin = url || "https://kabukiplus.com";

  const bubble = {
    type: "bubble",
    size: "kilo",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "lg",
      backgroundColor: KABUKI.bg,
      paddingAll: "20px",
      contents: [
        // ─── タイトル ───
        {
          type: "text",
          text: "KABUKI PLUS+",
          weight: "bold",
          size: "md",
          color: KABUKI.goldDark
        },
        {
          type: "text",
          text: "歌舞伎のことは何でも聞いてね。\nメッセージを送るだけでOK。",
          size: "xs",
          color: KABUKI.dim,
          wrap: true,
          lineSpacing: "4px"
        },
        // ─── Web導線 ───
        {
          type: "box",
          layout: "vertical",
          spacing: "none",
          backgroundColor: KABUKI.card,
          cornerRadius: "10px",
          contents: [
            _webLink("KABUKI PLUS+",         `${origin}/kabuki/navi`),
            _webLink("DOJO（クイズ・稽古）",  `${origin}/kabuki/dojo`),
            _webLink("RECO（観劇記録）",      `${origin}/kabuki/reco`),
          ]
        }
      ]
    }
  };

  return {
    type: "flex",
    altText: "KABUKI PLUS+",
    contents: bubble
  };
}
