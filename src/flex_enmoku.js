// src/flex_enmoku.js
// 歌舞伎風パレット（トップメニューと統一）
import { KABUKI } from "./flex_menu.js";

/* =========================================================
   演目カタログ（R2）
========================================================= */
let ENMOKU_CATALOG_CACHE = null;

export function clearEnmokuCatalogCache() {
  ENMOKU_CATALOG_CACHE = null;
}

export async function loadEnmokuCatalog(env) {
  if (ENMOKU_CATALOG_CACHE) return ENMOKU_CATALOG_CACHE;

  try {
    // まずcatalog.jsonを試す
    const obj = await env.ENMOKU_BUCKET.get("catalog.json");
    if (obj) {
      const catalog = await obj.json();
      catalog.sort((a, b) => (a.sort_key || "").localeCompare(b.sort_key || "", "ja"));
      ENMOKU_CATALOG_CACHE = catalog;
      return catalog;
    }

    const listed = await env.ENMOKU_BUCKET.list();
    const catalog = [];

    for (const item of listed.objects) {
      const key = item.key;
      if (!key.endsWith(".json") || key === "catalog.json" || key === "quizzes.json" || key === "glossary.json" || key === "recommend.json") continue;
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
      }
    }

    catalog.sort((a, b) => a.short.localeCompare(b.short, "ja"));
    ENMOKU_CATALOG_CACHE = catalog;
    return catalog;
  } catch (e) {
    console.error("loadEnmokuCatalog error:", String(e?.stack || e));
    return [];
  }
}

export async function loadEnmokuJson(env, enmokuId) {
  try {
    const obj = await env.ENMOKU_BUCKET.get(`${enmokuId}.json`);
    if (!obj) return null;
    return await obj.json();
  } catch (e) {
    console.error("loadEnmokuJson error:", String(e?.stack || e));
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
export function sectionNavMessage(currentSection, enmokuId) {
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

  // ⭐ クリップ（演目を保存）
  if (enmokuId) {
    items.push({ type: "action", action: { type: "postback", label: "⭐ 保存", data: `step=clip_toggle&type=enmoku&id=${encodeURIComponent(enmokuId)}`, displayText: "⭐ 保存" } });
  }

  items.push({ type: "action", action: { type: "postback", label: "📚 演目一覧", data: "step=enmoku_list", displayText: "演目一覧" } });
  items.push({ type: "action", action: { type: "postback", label: "🧭 ナビ", data: "step=navi_home", displayText: "ナビ" } });

  const navText = {
    synopsis: "次はどこを見る？🙂",
    highlights: "次はどこを見る？🙂",
    info: "次はどこを見る？🙂",
    cast: "人物を見終わったら？🙂"
  }[currentSection] || "次はどこを見る？🙂";

  // ✅ QuickReply は「最後のメッセージ」に付けるのが安定
  return { type: "text", text: navText, quickReply: { items } };
}

export function castNavMessage(personId, enmokuId) {
  const items = [
    { type: "action", action: { type: "postback", label: "人物一覧", data: "step=section&section=cast", displayText: "人物一覧" } },
    { type: "action", action: { type: "postback", label: "項目へ戻る", data: "step=section_menu", displayText: "項目へ戻る" } },
  ];

  // ⭐ クリップ（人物を保存）
  if (personId && enmokuId) {
    items.push({ type: "action", action: { type: "postback", label: "⭐ 保存", data: `step=clip_toggle&type=person&id=${encodeURIComponent(personId)}&parent=${encodeURIComponent(enmokuId)}`, displayText: "⭐ 保存" } });
  }

  items.push({ type: "action", action: { type: "postback", label: "演目一覧", data: "step=enmoku_list", displayText: "演目一覧" } });
  items.push({ type: "action", action: { type: "postback", label: "🧭 ナビ", data: "step=navi_home", displayText: "ナビ" } });

  return {
    type: "text",
    text: "ほかの人物も見る？🙂",
    quickReply: { items }
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
    backgroundColor: indented ? KABUKI.cardAlt : KABUKI.card,
    cornerRadius: "12px",
    action: { type: "postback", label: e.short, data: `step=enmoku&enmoku=${encodeURIComponent(e.id)}` },
    contents: [
      { type: "text", text: e.short, weight: "bold", size: indented ? "sm" : "md", color: KABUKI.text, wrap: true },
      ...(e.full && e.full !== e.short
        ? [{ type: "text", text: e.full, size: "xxs", color: KABUKI.dimmer, wrap: true }]
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
        backgroundColor: KABUKI.cardAlt,
        cornerRadius: "12px",
        action: { type: "postback", label: g.label, data: `step=group&group=${encodeURIComponent(g.label)}` },
        contents: [
          { type: "text", text: `📁 ${g.label}`, weight: "bold", size: "md", color: KABUKI.text, flex: 4, wrap: true },
          { type: "text", text: `${g.items.length}演目 ▶`, size: "xs", color: KABUKI.dim, align: "end", flex: 2, gravity: "center" }
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
      backgroundColor: KABUKI.bg,
      contents: [
        {
          type: "text",
          text: pages.length > 1 ? `演目をえらんでね（${i + 1}/${pages.length}）` : "演目をえらんでね",
          weight: "bold",
          size: "lg",
          color: KABUKI.gold
        },
        { type: "text", text: `全${catalog.length}演目 🌱 順次追加中`, size: "xs", color: KABUKI.dim },
        ...pageRows,
        {
          type: "button",
          style: "secondary",
          margin: "md",
          action: { type: "postback", label: "🧭 ナビ", data: "step=navi_home" }
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
        backgroundColor: KABUKI.bg,
        contents: [
          { type: "text", text: groupName, weight: "bold", size: "lg", color: KABUKI.gold, wrap: true },
          { type: "text", text: "どの場面を見る？🙂", size: "xs", color: KABUKI.dim },
          ...items.map(e => enmokuRow(e, false)),
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            margin: "md",
            contents: [
              { type: "button", style: "secondary", flex: 1, action: { type: "postback", label: "演目一覧", data: "step=enmoku_list" } },
              { type: "button", style: "secondary", flex: 1, action: { type: "postback", label: "🧭 ナビ", data: "step=navi_home" } }
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
      { type: "text", text: label, weight: "bold", size: "sm", color: KABUKI.text, wrap: true }
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
        backgroundColor: KABUKI.bg,
        contents: [
          { type: "text", text: `「${enmokuTitle}」`, weight: "bold", size: "lg", color: KABUKI.gold, wrap: true },
          { type: "text", text: "知りたい項目をえらんでね🙂", size: "sm", color: KABUKI.dim, wrap: true },
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
                  tile("📖", "あらすじ", "synopsis", KABUKI.card),
                  tile("🌟", "みどころ", "highlights", KABUKI.cardAlt)
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                spacing: "sm",
                contents: [
                  tile("🎭", "登場人物", "cast", KABUKI.card),
                  tile("📝", "作品情報", "info", KABUKI.cardAlt)
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
          footerBtn("🧭 ナビ", "step=navi_home")
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
        backgroundColor: KABUKI.bg,
        contents: [
          { type: "text", text: title, weight: "bold", size: "xl", color: KABUKI.text, wrap: true },
          { type: "text", text: `${icon} ${sectionLabel}`, size: "xs", color: KABUKI.dimmer },
          { type: "separator" },
          { type: "text", text: desc, size: "sm", color: KABUKI.text, wrap: true, lineSpacing: "6px" }
        ]
      }
    }
  };
}

/* =========================================================
   登場人物一覧
========================================================= */
export function castListFlex(enmokuTitle, cast, page = 1, perPage = 10) {
  const list = Array.isArray(cast) ? cast : [];
  const total = list.length;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const p = Math.min(Math.max(1, page), maxPage);
  const start = (p - 1) * perPage;
  const items = list.slice(start, start + perPage);

  const rows = items.map(c => {
    const { name, kana } = splitNameKana(c.name);
    return {
      type: "box",
      layout: "vertical",
      paddingAll: "10px",
      backgroundColor: KABUKI.card,
      cornerRadius: "10px",
      action: { type: "postback", label: name, data: `step=cast&person=${encodeURIComponent(c.id)}` },
      contents: [
        { type: "text", text: name, weight: "bold", size: "sm", color: KABUKI.text, wrap: true },
        ...(kana ? [{ type: "text", text: `（${kana}）`, size: "xxs", color: KABUKI.dim, wrap: true }] : [])
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
        backgroundColor: KABUKI.bg,
        contents: [
          {
            type: "text",
            text: maxPage > 1 ? `🎭 登場人物（${p}/${maxPage}）` : "🎭 登場人物",
            weight: "bold",
            size: "lg",
            color: KABUKI.gold,
            wrap: true
          },
          { type: "text", text: `${enmokuTitle}｜全${total}人`, size: "xs", color: KABUKI.dim, wrap: true },
          ...rows,
          ...navLine,
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            margin: "md",
            contents: [
              { type: "button", style: "secondary", flex: 1, action: { type: "postback", label: "項目へ戻る", data: "step=section_menu" } },
              { type: "button", style: "secondary", flex: 1, action: { type: "postback", label: "🧭 ナビ", data: "step=navi_home" } }
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
        backgroundColor: KABUKI.bg,
        contents: [
          { type: "text", text: name, weight: "bold", size: "xl", color: KABUKI.text, wrap: true },
          { type: "text", text: `🎭 登場人物｜${enmokuTitle}`, size: "xs", color: KABUKI.dimmer, wrap: true },
          { type: "separator" },
          { type: "text", text: desc, size: "sm", color: KABUKI.text, wrap: true, lineSpacing: "6px" }
        ]
      }
    }
  };
}