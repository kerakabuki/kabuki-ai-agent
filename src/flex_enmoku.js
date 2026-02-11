// src/flex_enmoku.js

/* =========================================================
   演目カタログ（R2）
========================================================= */
let ENMOKU_CATALOG_CACHE = null;

export async function loadEnmokuCatalog(env) {
  if (ENMOKU_CATALOG_CACHE) return ENMOKU_CATALOG_CACHE;

  try {
    // まずcatalog.jsonを試す
    const obj = await env.ENMOKU_BUCKET.get("catalog.json");
    if (obj) {
      const catalog = await obj.json();
      catalog.sort((a, b) => (a.sort_key || "").localeCompare(b.sort_key || "", "ja"));
      ENMOKU_CATALOG_CACHE = catalog;
      console.log("loadEnmokuCatalog: loaded from catalog.json,", catalog.length, "items");
      return catalog;
    }

    // フォールバック：R2の全ファイルから動的構築
    console.log("loadEnmokuCatalog: catalog.json not found, building from R2 files...");
    const listed = await env.ENMOKU_BUCKET.list();
    const catalog = [];

    for (const item of listed.objects) {
      const key = item.key;
      if (!key.endsWith(".json") || key === "catalog.json" || key === "quizzes.json") continue;
      const id = key.replace(/\.json$/, "");

      try {
        const data = await loadEnmokuJson(env, id);
        if (!data) continue;
        catalog.push({
          id,
          short: data.title_short || data.title || id,
          full: data.title || id,
          sort_key: "",
          group: null
        });
      } catch (e2) {
        console.log("loadEnmokuCatalog: skip", id, String(e2));
      }
    }

    catalog.sort((a, b) => a.short.localeCompare(b.short, "ja"));
    ENMOKU_CATALOG_CACHE = catalog;
    console.log("loadEnmokuCatalog: built from R2,", catalog.length, "items");
    return catalog;
  } catch (e) {
    console.log("loadEnmokuCatalog error:", String(e?.stack || e));
    return [];
  }
}

export async function loadEnmokuJson(env, enmokuId) {
  try {
    console.log("loadEnmokuJson: fetching", `${enmokuId}.json`);
    const obj = await env.ENMOKU_BUCKET.get(`${enmokuId}.json`);
    console.log("loadEnmokuJson: obj is", obj ? "found" : "null");
    if (!obj) return null;
    return await obj.json();
  } catch (e) {
    console.log("loadEnmokuJson error:", String(e?.stack || e));
    return null;
  }
}

/* =========================================================
   Helpers
========================================================= */
function splitNameKana(s) {
  const m = (s || "").match(/^(.*?)[（(](.*)[）)]$/);
  return m ? { name: m[1].trim(), kana: m[2].trim() } : { name: s, kana: "" };
}

function trimDesc(s, max = 1400) {
  const t = String(s || "");
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

/* =========================================================
   Quick Reply（2通目ナビ）
========================================================= */
export function sectionNavMessage(currentSection) {
  const items = [];
  const add = (label, section, displayText) => {
    if (currentSection !== section) {
      items.push({
        type: "action",
        action: {
          type: "postback",
          label,
          data: `step=section&section=${section}`,
          displayText: displayText || label
        }
      });
    }
  };

  add("📖 あらすじ", "synopsis", "あらすじ");
  add("🌟 みどころ", "highlights", "みどころ");
  add("🎭 登場人物", "cast", "登場人物");
  add("📝 作品情報", "info", "作品情報");

  items.push({ type: "action", action: { type: "postback", label: "📚 演目一覧", data: "step=enmoku_list", displayText: "演目一覧" } });
  items.push({ type: "action", action: { type: "postback", label: "🏠 メニュー", data: "step=menu", displayText: "メニュー" } });

  const navText = {
    synopsis: "次はどこを見る？🙂",
    highlights: "次はどこを見る？🙂",
    info: "次はどこを見る？🙂",
    cast: "人物を見終わったら？🙂"
  }[currentSection] || "次はどこを見る？🙂";

  // ✅ QuickReply は「最後のメッセージ」に付けるのが安定
  return { type: "text", text: navText, quickReply: { items } };
}

export function castNavMessage() {
  return {
    type: "text",
    text: "ほかの人物も見る？🙂",
    quickReply: {
      items: [
        { type: "action", action: { type: "postback", label: "人物一覧", data: "step=section&section=cast", displayText: "人物一覧" } },
        { type: "action", action: { type: "postback", label: "項目へ戻る", data: "step=section_menu", displayText: "項目へ戻る" } },
        { type: "action", action: { type: "postback", label: "演目一覧", data: "step=enmoku_list", displayText: "演目一覧" } },
        { type: "action", action: { type: "postback", label: "メニュー", data: "step=menu", displayText: "メニュー" } }
      ]
    }
  };
}

/* =========================================================
   演目ガイド Flex
========================================================= */
function enmokuRow(e, indented = false) {
  return {
    type: "box",
    layout: "vertical",
    paddingAll: indented ? "10px" : "12px",
    paddingStart: indented ? "24px" : "12px",
    backgroundColor: indented ? "#EBF0F5" : "#F3F4F6",
    cornerRadius: "12px",
    action: { type: "postback", label: e.short, data: `step=enmoku&enmoku=${encodeURIComponent(e.id)}` },
    contents: [
      { type: "text", text: e.short, weight: "bold", size: indented ? "sm" : "md", wrap: true },
      ...(e.full && e.full !== e.short
        ? [{ type: "text", text: e.full, size: "xxs", color: "#888888", wrap: true }]
        : [])
    ]
  };
}

export async function enmokuListFlex(env) {
  const catalog = await loadEnmokuCatalog(env);
  if (catalog.length === 0) return { type: "text", text: "演目データがまだないよ🙏" };

  // グルーピング
  const groups = [];
  const groupMap = {};
  for (const e of catalog) {
    if (e.group) {
      if (!(e.group in groupMap)) {
        groupMap[e.group] = groups.length;
        groups.push({ label: e.group, items: [] });
      }
      groups[groupMap[e.group]].items.push(e);
    } else {
      groups.push({ label: null, items: [e] });
    }
  }

  // 一覧行（グループは1行にまとめる）
  const rows = [];
  for (const g of groups) {
    if (g.label && g.items.length > 1) {
      rows.push({
        type: "box",
        layout: "horizontal",
        paddingAll: "12px",
        backgroundColor: "#E8EDF3",
        cornerRadius: "12px",
        action: { type: "postback", label: g.label, data: `step=group&group=${encodeURIComponent(g.label)}` },
        contents: [
          { type: "text", text: `📁 ${g.label}`, weight: "bold", size: "md", flex: 4, wrap: true },
          { type: "text", text: `${g.items.length}演目 ▶`, size: "xs", color: "#666666", align: "end", flex: 2, gravity: "center" }
        ]
      });
    } else {
      rows.push(enmokuRow(g.items[0], false));
    }
  }

  // カルーセル分割
  const MAX_ROWS = 8;
  const pages = [];
  let currentPage = [];
  for (const row of rows) {
    if (currentPage.length >= MAX_ROWS) {
      pages.push(currentPage);
      currentPage = [];
    }
    currentPage.push(row);
  }
  if (currentPage.length > 0) pages.push(currentPage);

  const bubbles = pages.map((pageRows, i) => ({
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "text",
          text: pages.length > 1 ? `演目をえらんでね（${i + 1}/${pages.length}）` : "演目をえらんでね",
          weight: "bold",
          size: "lg"
        },
        { type: "text", text: `全${catalog.length}演目🙂`, size: "xs", color: "#666666" },
        ...pageRows,
        {
          type: "button",
          style: "secondary",
          margin: "md",
          action: { type: "postback", label: "メニュー", data: "step=menu" }
        }
      ]
    }
  }));

  if (bubbles.length === 1) return { type: "flex", altText: "演目をえらんでね", contents: bubbles[0] };
  return { type: "flex", altText: "演目をえらんでね", contents: { type: "carousel", contents: bubbles } };
}

export async function groupSubMenuFlex(env, groupName) {
  const catalog = await loadEnmokuCatalog(env);
  const items = catalog.filter(e => e.group === groupName);

  if (items.length === 0) return { type: "text", text: "該当する演目が見つからなかったよ🙏" };

  return {
    type: "flex",
    altText: groupName,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          { type: "text", text: groupName, weight: "bold", size: "lg", wrap: true },
          { type: "text", text: "どの場面を見る？🙂", size: "xs", color: "#666666" },
          ...items.map(e => enmokuRow(e, false)),
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            margin: "md",
            contents: [
              { type: "button", style: "secondary", flex: 1, action: { type: "postback", label: "演目一覧", data: "step=enmoku_list" } },
              { type: "button", style: "secondary", flex: 1, action: { type: "postback", label: "メニュー", data: "step=menu" } }
            ]
          }
        ]
      }
    }
  };
}

export function sectionMenuFlex(enmokuTitle) {
  const tile = (icon, label, section, bg) => ({
    type: "box",
    layout: "vertical",
    paddingAll: "12px",
    spacing: "sm",
    backgroundColor: bg,
    cornerRadius: "14px",
    flex: 1,
    action: {
      type: "postback",
      label,
      data: `step=section&section=${section}`,
      displayText: label
    },
    contents: [
      { type: "text", text: icon, size: "xl", flex: 0 },
      { type: "text", text: label, weight: "bold", size: "sm", wrap: true }
    ]
  });

  const footerBtn = (label, data) => ({
    type: "button",
    style: "secondary",
    height: "sm",
    flex: 1,
    action: { type: "postback", label, data, displayText: label }
  });

  return {
    type: "flex",
    altText: `「${enmokuTitle}」メニュー`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          { type: "text", text: `「${enmokuTitle}」`, weight: "bold", size: "lg", wrap: true },
          { type: "text", text: "知りたい項目をえらんでね🙂", size: "sm", color: "#666666", wrap: true },
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                spacing: "sm",
                contents: [
                  tile("📖", "あらすじ", "synopsis", "#E3F2FD"),
                  tile("🌟", "みどころ", "highlights", "#FFF3E0")
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                spacing: "sm",
                contents: [
                  tile("🎭", "登場人物", "cast", "#E8F5E9"),
                  tile("📝", "作品情報", "info", "#F3E5F5")
                ]
              }
            ]
          }
        ]
      },
      footer: {
        type: "box",
        layout: "horizontal",
        spacing: "sm",
        contents: [
          footerBtn("演目一覧へ", "step=enmoku_list"),
          footerBtn("メニュー", "step=menu")
        ]
      }
    }
  };
}

/* =========================================================
   セクション詳細（あらすじ/みどころ/作品情報）をFlexカード化
   ※ QuickReplyは別メッセージ(sectionNavMessage)で最後に付ける
========================================================= */
export function enmokuSectionDetailFlex(title, sectionLabel, icon, body) {
  const desc = trimDesc(body, 1400);

  return {
    type: "flex",
    altText: `${title}｜${sectionLabel}`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          { type: "text", text: title, weight: "bold", size: "xl", wrap: true },
          { type: "text", text: `${icon} ${sectionLabel}`, size: "xs", color: "#888888" },
          { type: "separator" },
          { type: "text", text: desc, size: "sm", wrap: true, lineSpacing: "6px" }
        ]
      }
    }
  };
}

/* =========================================================
   登場人物一覧
========================================================= */
export function castListFlex(enmokuTitle, cast, page = 1, perPage = 10) {
  const total = cast.length;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const p = Math.min(Math.max(1, page), maxPage);
  const start = (p - 1) * perPage;
  const items = cast.slice(start, start + perPage);

  const rows = items.map(c => {
    const { name, kana } = splitNameKana(c.name);
    return {
      type: "box",
      layout: "vertical",
      paddingAll: "10px",
      backgroundColor: "#F3F4F6",
      cornerRadius: "10px",
      action: { type: "postback", label: name, data: `step=cast&person=${encodeURIComponent(c.id)}` },
      contents: [
        { type: "text", text: name, weight: "bold", size: "sm", wrap: true },
        ...(kana ? [{ type: "text", text: `（${kana}）`, size: "xxs", color: "#666666", wrap: true }] : [])
      ]
    };
  });

  // ページング行（グロッサリ風）
  const navLine = [];
  if (maxPage > 1) {
    const btns = [];
    if (p > 1) btns.push({ type: "button", style: "secondary", flex: 1, action: { type: "postback", label: "前へ", data: `step=cast_list&page=${p - 1}` } });
    btns.push({ type: "button", style: "secondary", flex: 1, action: { type: "postback", label: `${p}/${maxPage}`, data: `step=cast_list&page=${p}` } });
    if (p < maxPage) btns.push({ type: "button", style: "secondary", flex: 1, action: { type: "postback", label: "次へ", data: `step=cast_list&page=${p + 1}` } });
    navLine.push({ type: "box", layout: "horizontal", spacing: "sm", contents: btns });
  }

  return {
    type: "flex",
    altText: `登場人物（${enmokuTitle}）`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "text",
            text: maxPage > 1 ? `🎭 登場人物（${p}/${maxPage}）` : "🎭 登場人物",
            weight: "bold",
            size: "lg",
            wrap: true
          },
          { type: "text", text: `${enmokuTitle}｜全${total}人`, size: "xs", color: "#666666", wrap: true },
          ...rows,
          ...navLine,
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            margin: "md",
            contents: [
              { type: "button", style: "secondary", flex: 1, action: { type: "postback", label: "項目へ戻る", data: "step=section_menu" } },
              { type: "button", style: "secondary", flex: 1, action: { type: "postback", label: "演目一覧へ", data: "step=enmoku_list" } }
            ]
          }
        ]
      }
    }
  };
}

/* =========================================================
   登場人物詳細（用語詳細と同じ"見出しカード"）
   ※ QuickReplyは別メッセージ(castNavMessage)で最後に付ける
========================================================= */
export function castDetailFlex(enmokuTitle, person) {
  const name = person?.name || "";
  const desc = trimDesc(person?.desc || "", 1200);

  return {
    type: "flex",
    altText: `${name}（登場人物）`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          { type: "text", text: name, weight: "bold", size: "xl", wrap: true },
          { type: "text", text: `🎭 登場人物｜${enmokuTitle}`, size: "xs", color: "#888888", wrap: true },
          { type: "separator" },
          { type: "text", text: desc, size: "sm", wrap: true, lineSpacing: "6px" }
        ]
      }
    }
  };
}