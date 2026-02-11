// src/flex_glossary.js

// カテゴリ順序とアイコン
export const GLOSSARY_CAT_ORDER = [
    { key: "演技・演出", icon: "🎭" },
    { key: "役柄", icon: "🎎" },
    { key: "舞台", icon: "🏯" },
    { key: "音・裏方", icon: "🎵" },
    { key: "家の芸", icon: "📜" },
    { key: "ジャンル", icon: "📚" },
    { key: "鑑賞", icon: "🎫" },
    { key: "衣装・小道具", icon: "👘" }
  ];
  
  // カテゴリ一覧Flex
  export function glossaryCategoryFlex(terms) {
    const catCounts = {};
    terms.forEach(t => { catCounts[t.category] = (catCounts[t.category] || 0) + 1; });
  
    const rows = GLOSSARY_CAT_ORDER
      .filter(c => catCounts[c.key])
      .map(c => ({
        type: "box",
        layout: "horizontal",
        paddingAll: "12px",
        backgroundColor: "#F3F4F6",
        cornerRadius: "12px",
        action: { type: "postback", label: c.key, data: `step=glossary_list&cat=${encodeURIComponent(c.key)}` },
        contents: [
          { type: "text", text: `${c.icon} ${c.key}`, weight: "bold", size: "md", flex: 4 },
          { type: "text", text: `${catCounts[c.key]}語 ▶`, size: "xs", color: "#666666", align: "end", flex: 2, gravity: "center" }
        ]
      }));
  
    return {
      type: "flex",
      altText: "用語カテゴリをえらんでね",
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            { type: "text", text: "歌舞伎用語いろは", weight: "bold", size: "lg" },
            { type: "text", text: `全${terms.length}語🙂 カテゴリをえらんでね`, size: "xs", color: "#666666" },
            { type: "text", text: "💡 用語を直接入力しても検索できるよ", size: "xxs", color: "#999999", wrap: true },
            ...rows,
            { type: "button", style: "secondary", margin: "md", action: { type: "postback", label: "メニュー", data: "step=menu" } }
          ]
        }
      }
    };
  }
  
  // カテゴリ内の用語一覧Flex（カルーセル）
  export function glossaryTermListFlex(terms, category) {
    const catTerms = terms.filter(t => t.category === category);
    if (catTerms.length === 0) return { type: "text", text: "該当する用語が見つからなかったよ🙏" };
  
    const MAX_ROWS = 8;
    const rows = catTerms.map(t => ({
      type: "box",
      layout: "vertical",
      paddingAll: "10px",
      backgroundColor: "#F3F4F6",
      cornerRadius: "10px",
      action: { type: "postback", label: t.term.substring(0, 20), data: `step=glossary_term&id=${encodeURIComponent(t.id)}` },
      contents: [{ type: "text", text: t.term, weight: "bold", size: "sm", wrap: true }]
    }));
  
    const pages = [];
    for (let i = 0; i < rows.length; i += MAX_ROWS) pages.push(rows.slice(i, i + MAX_ROWS));
  
    const catIcon = (GLOSSARY_CAT_ORDER.find(c => c.key === category) || {}).icon || "📖";
  
    const bubbles = pages.map((pageRows, i) => ({
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "text",
            text: pages.length > 1 ? `${catIcon} ${category}（${i + 1}/${pages.length}）` : `${catIcon} ${category}`,
            weight: "bold",
            size: "lg",
            wrap: true
          },
          { type: "text", text: `${catTerms.length}語`, size: "xs", color: "#666666" },
          ...pageRows,
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            margin: "md",
            contents: [
              { type: "button", style: "secondary", flex: 1, action: { type: "postback", label: "カテゴリ一覧", data: "step=glossary_cat" } },
              { type: "button", style: "secondary", flex: 1, action: { type: "postback", label: "メニュー", data: "step=menu" } }
            ]
          }
        ]
      }
    }));
  
    if (bubbles.length === 1) return { type: "flex", altText: `${category}の用語一覧`, contents: bubbles[0] };
    return { type: "flex", altText: `${category}の用語一覧`, contents: { type: "carousel", contents: bubbles } };
  }
  
  // 用語解説Flex
  export function glossaryTermDetailFlex(term) {
    let desc = term.desc || "";
    if (desc.length > 500) desc = desc.substring(0, 497) + "…";
  
    const catIcon = (GLOSSARY_CAT_ORDER.find(c => c.key === term.category) || {}).icon || "📖";
  
    return {
      type: "flex",
      altText: term.term,
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          contents: [
            { type: "text", text: term.term, weight: "bold", size: "xl", wrap: true },
            { type: "text", text: `${catIcon} ${term.category}`, size: "xs", color: "#888888" },
            { type: "separator" },
            { type: "text", text: desc, size: "sm", wrap: true, lineSpacing: "6px" },
            {
              type: "box",
              layout: "horizontal",
              spacing: "sm",
              margin: "lg",
              contents: [
                {
                  type: "button",
                  style: "secondary",
                  flex: 1,
                  action: { type: "postback", label: `${term.category}に戻る`, data: `step=glossary_list&cat=${encodeURIComponent(term.category)}` }
                },
                { type: "button", style: "secondary", flex: 1, action: { type: "postback", label: "メニュー", data: "step=menu" } }
              ]
            }
          ]
        }
      }
    };
  }
  
  // 検索結果Flex（複数ヒット時）
  export function glossarySearchResultFlex(results, query) {
    if (results.length === 1) return glossaryTermDetailFlex(results[0]);
  
    const MAX_SHOW = 10;
    const shown = results.slice(0, MAX_SHOW);
  
    const rows = shown.map(t => ({
      type: "box",
      layout: "vertical",
      paddingAll: "10px",
      backgroundColor: "#F3F4F6",
      cornerRadius: "10px",
      action: { type: "postback", label: t.term.substring(0, 20), data: `step=glossary_term&id=${encodeURIComponent(t.id)}` },
      contents: [
        { type: "text", text: t.term, weight: "bold", size: "sm", wrap: true },
        { type: "text", text: t.category, size: "xxs", color: "#888888" }
      ]
    }));
  
    return {
      type: "flex",
      altText: `「${query}」の検索結果`,
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            { type: "text", text: `🔍「${query}」の検索結果`, weight: "bold", size: "md", wrap: true },
            { type: "text", text: `${results.length}件ヒット${results.length > MAX_SHOW ? `（上位${MAX_SHOW}件を表示）` : ""}`, size: "xs", color: "#666666" },
            ...rows,
            {
              type: "box",
              layout: "horizontal",
              spacing: "sm",
              margin: "md",
              contents: [
                { type: "button", style: "secondary", flex: 1, action: { type: "postback", label: "カテゴリ一覧", data: "step=glossary_cat" } },
                { type: "button", style: "secondary", flex: 1, action: { type: "postback", label: "メニュー", data: "step=menu" } }
              ]
            }
          ]
        }
      }
    };
  }
  