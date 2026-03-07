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

/* ─── ヒーローボタン（けらのすけに質問） ─── */
function _heroAction() {
  return {
    type: "box",
    layout: "horizontal",
    paddingAll: "14px",
    backgroundColor: KABUKI.goldDark,
    cornerRadius: "14px",
    justifyContent: "center",
    action: { type: "message", label: "けらのすけに質問", text: "けらのすけ" },
    contents: [
      { type: "text", text: "💬", size: "lg", flex: 0, gravity: "center" },
      {
        type: "text",
        text: "けらのすけに質問する",
        weight: "bold",
        size: "md",
        color: "#FFFFFF",
        flex: 0,
        gravity: "center",
        margin: "md"
      }
    ]
  };
}

/* ─── 2列グリッドのセル ─── */
function _gridCell(emoji, label, action) {
  return {
    type: "box",
    layout: "vertical",
    flex: 1,
    paddingAll: "10px",
    backgroundColor: KABUKI.card,
    cornerRadius: "12px",
    borderWidth: "light",
    borderColor: KABUKI.border,
    alignItems: "center",
    action,
    contents: [
      { type: "text", text: emoji, size: "xl", align: "center" },
      { type: "text", text: label, size: "xs", weight: "bold", color: KABUKI.text, align: "center", margin: "xs" }
    ]
  };
}

/* ─── 2列の行 ─── */
function _gridRow(left, right) {
  return {
    type: "box",
    layout: "horizontal",
    spacing: "sm",
    contents: [left, right]
  };
}

/* ─── Webリンク行（小さめ） ─── */
function _webLink(emoji, label, uri) {
  return {
    type: "box",
    layout: "horizontal",
    paddingAll: "10px",
    backgroundColor: KABUKI.card,
    cornerRadius: "10px",
    borderWidth: "light",
    borderColor: KABUKI.border,
    action: { type: "uri", label, uri },
    contents: [
      { type: "text", text: emoji, size: "md", flex: 0, gravity: "center" },
      { type: "text", text: label, size: "sm", color: KABUKI.text, flex: 4, gravity: "center", margin: "sm" },
      { type: "text", text: "↗", size: "sm", color: KABUKI.dimmer, flex: 0, gravity: "center" }
    ]
  };
}

/* ─── 会話型ウェルカムメッセージ（QuickReply付き） ─── */
export function mainMenuMessage(env, url) {
  const origin = url || "https://kabukiplus.com";
  return {
    type: "text",
    text: "やあ！けらのすけだよ🙂\n歌舞伎のことなら何でも聞いてね。\n\n💬 こんなふうに話しかけてみて：\n「勧進帳ってどんな話？」\n「歌舞伎座に初めて行くんだけど」\n「隈取ってなに？」",
    quickReply: { items: [
      { type: "action", action: { type: "message", label: "🎭 演目を調べる", text: "演目ガイド" } },
      { type: "action", action: { type: "message", label: "📖 用語辞典", text: "用語辞典" } },
      { type: "action", action: { type: "message", label: "📡 ニュース", text: "ニュース" } },
      { type: "action", action: { type: "message", label: "⭐ おすすめ", text: "おすすめ教えて" } },
      { type: "action", action: { type: "uri", label: "🧭 KABUKI PLUS+", uri: `${origin}/kabuki/navi` } },
    ]}
  };
}

/* ─── 旧メインメニュー（後方互換・Web用） ─── */
export function mainMenuFlex(env, url) {
  const origin = url || "https://kabukiplus.com";

  const bubble = {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      backgroundColor: KABUKI.bg,
      paddingAll: "18px",
      contents: [
        // ─── ヘッダー ───
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "box",
              layout: "vertical",
              flex: 4,
              contents: [
                { type: "text", text: "KABUKI PLUS+", weight: "bold", size: "lg", color: KABUKI.goldDark },
                { type: "text", text: "歌舞伎のことならおまかせ！", size: "xs", color: KABUKI.dim, margin: "xs" }
              ]
            },
            { type: "text", text: "🙂", size: "3xl", flex: 0, gravity: "center" }
          ]
        },

        // ─── けらのすけに質問（メインCTA） ───
        _heroAction(),

        { type: "separator", color: KABUKI.border },

        // ─── LINE内で使える機能（2列グリッド） ───
        {
          type: "text",
          text: "LINE でできること",
          size: "xxs",
          color: KABUKI.dim,
          weight: "bold"
        },
        _gridRow(
          _gridCell("🎭", "演目ガイド", { type: "postback", label: "演目ガイド", data: "mode=performance" }),
          _gridCell("📖", "用語辞典",   { type: "postback", label: "用語辞典",   data: "mode=general" })
        ),
        _gridRow(
          _gridCell("📡", "ニュース",   { type: "postback", label: "ニュース",   data: "step=news" }),
          _gridCell("⭐", "おすすめ",   { type: "postback", label: "おすすめ",   data: "mode=recommend" })
        ),

        { type: "separator", color: KABUKI.border },

        // ─── Webサイトへ ───
        {
          type: "text",
          text: "サイトを開く",
          size: "xxs",
          color: KABUKI.dim,
          weight: "bold"
        },
        _webLink("🧭", "KABUKI PLUS+",   `${origin}/kabuki/navi`),
        _webLink("🥋", "DOJO（クイズ・稽古）", `${origin}/kabuki/dojo`),
        _webLink("📝", "RECO（観劇記録）", `${origin}/kabuki/reco`),
        _webLink("🏯", "地歌舞伎（JIKABUKI）", `${origin}/jikabuki/gate/kera`)
      ]
    }
  };

  return {
    type: "flex",
    altText: "KABUKI PLUS+ メニュー",
    contents: bubble
  };
}
