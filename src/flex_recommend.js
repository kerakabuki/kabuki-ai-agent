// src/flex_recommend.js

// （必要なら将来使える）タグ順序とアイコン
export const RECOMMEND_TAG_ORDER = [
  { key: "初心者", icon: "🔰" },
  { key: "雰囲気", icon: "🎨" },
  { key: "じっくり", icon: "📖" },
  { key: "ジャンル", icon: "🎭" },
  { key: "キャラ", icon: "🔥" }
];

// おすすめ一覧Flex（全FAQ → タップで回答表示）
export function recommendListFlex(faqs) {
  if (!faqs || faqs.length === 0) return { type: "text", text: "おすすめデータがまだないよ🙏" };

  const MAX_ROWS = 7;
  const rows = faqs.map(f => ({
    type: "box",
    layout: "vertical",
    paddingAll: "10px",
    backgroundColor: "#F3F4F6",
    cornerRadius: "10px",
    action: { type: "postback", label: (f.label || "").substring(0, 20), data: `step=recommend_detail&id=${encodeURIComponent(f.id)}` },
    contents: [{ type: "text", text: f.label || f.question || "（無題）", weight: "bold", size: "sm", wrap: true }]
  }));

  const pages = [];
  for (let i = 0; i < rows.length; i += MAX_ROWS) pages.push(rows.slice(i, i + MAX_ROWS));

  const bubbles = pages.map((pageRows, i) => ({
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "text",
          text: pages.length > 1 ? `おすすめ演目（${i + 1}/${pages.length}）` : "おすすめ演目",
          weight: "bold",
          size: "lg"
        },
        { type: "text", text: "気になる質問をタップしてね🙂", size: "xs", color: "#666666" },
        ...pageRows,
        { type: "button", style: "secondary", margin: "md", action: { type: "postback", label: "メニュー", data: "step=menu" } }
      ]
    }
  }));

  if (bubbles.length === 1) return { type: "flex", altText: "おすすめ演目", contents: bubbles[0] };
  return { type: "flex", altText: "おすすめ演目", contents: { type: "carousel", contents: bubbles } };
}

// おすすめ回答Flex（動画リンク付き）
export function recommendDetailFlex(faq, recommendData) {
  let answer = faq.answer || "";
  if (answer.length > 500) answer = answer.substring(0, 497) + "…";

  const contents = [
    { type: "text", text: faq.question || faq.label || "おすすめ", weight: "bold", size: "lg", wrap: true },
    { type: "separator" },
    { type: "text", text: answer, size: "sm", wrap: true, lineSpacing: "6px" }
  ];

  // 動画リンク（enmokuの最初の数本）
  const videos = recommendData?.videos || {};
  const enmokuIds = faq.enmoku || [];
  const videoLinks = [];
  for (const eid of enmokuIds) {
    if (videos[eid]) videoLinks.push(videos[eid]);
  }

  if (videoLinks.length > 0) {
    contents.push({ type: "separator", margin: "md" });
    contents.push({ type: "text", text: "▶ 気良歌舞伎の公演動画", weight: "bold", size: "xs", color: "#E53935", margin: "md" });

    for (const vl of videoLinks.slice(0, 3)) {
      contents.push({
        type: "button",
        style: "link",
        height: "sm",
        action: { type: "uri", label: `🎬 ${String(vl.title || "").substring(0, 17)}`, uri: vl.url }
      });
    }
  }

  contents.push({
    type: "box",
    layout: "horizontal",
    spacing: "sm",
    margin: "lg",
    contents: [
      { type: "button", style: "secondary", flex: 1, action: { type: "postback", label: "おすすめ一覧", data: "step=recommend_list" } },
      { type: "button", style: "secondary", flex: 1, action: { type: "postback", label: "メニュー", data: "step=menu" } }
    ]
  });

  return {
    type: "flex",
    altText: faq.label || faq.question || "おすすめ",
    contents: {
      type: "bubble",
      body: { type: "box", layout: "vertical", spacing: "md", contents }
    }
  };
}
