// src/flex_talk.js
// =========================================================
// Talk（FAQ）: カテゴリ→質問→回答
// =========================================================

const PER_PAGE = 7; // LINEのボタン数を抑える（下に「次へ」「メニュー」が入る想定）

// カテゴリ表示順とアイコン
const TALK_CAT_ORDER = [
  { key: "気良歌舞伎",         icon: "🙂" },
  { key: "地歌舞伎・地芝居",   icon: "👹" },
  { key: "公演の基本",         icon: "📅" },
  { key: "観劇ガイド",         icon: "🎭" },
  { key: "会場・アクセス",     icon: "🏠" },
  { key: "参加・ボランティア", icon: "🙋" },
  { key: "明宝・周辺情報",     icon: "🍽️" },
];

/** genre_menu など「メニュー」カテゴリや meta 項目は FAQ から除外 */
function isMetaTopic(t) {
  return String(t?.category || "") === "メニュー"
      || String(t?.id || "") === "genre_menu";
}

function normalizeLabel(s) {
  return String(s || "").trim();
}

/**
 * ✅ displayText を付けない版
 * -> タップしてもトークに「押した文言」が出ない
 */
function buildButtons(labelsAndData) {
  return labelsAndData.map(x => ({
    type: "button",
    style: "secondary",
    height: "sm",
    action: {
      type: "postback",
      label: x.label.length > 20 ? x.label.slice(0, 19) + "…" : x.label,
      data: x.data
    }
  }));
}

function wrapMenuBubble(title, buttons, footerButtons = []) {
  return {
    type: "flex",
    altText: title,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: title,
            weight: "bold",
            size: "md",
            wrap: true
          },
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: buttons.length ? buttons : [
              { type: "text", text: "項目がないよ🙏", size: "sm", wrap: true }
            ]
          }
        ]
      },
      footer: footerButtons.length ? {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: footerButtons
      } : undefined
    }
  };
}

/**
 * カテゴリ一覧の順序を整える。
 * TALK_CAT_ORDER に定義されたものを先、未定義のものを後ろに追加。
 */
function orderedCategories(catSet) {
  const ordered = [];
  for (const c of TALK_CAT_ORDER) {
    if (catSet.has(c.key)) {
      ordered.push({ key: c.key, icon: c.icon });
    }
  }
  // ORDER未定義のカテゴリも拾う
  for (const k of catSet) {
    if (!TALK_CAT_ORDER.find(c => c.key === k)) {
      ordered.push({ key: k, icon: "📁" });
    }
  }
  return ordered;
}

/**
 * talkMenuFlex
 * - デフォルト：カテゴリ一覧（category フィールドから自動生成）
 * - options.cat があれば：そのカテゴリ内のFAQ一覧（ページングあり）
 */
export function talkMenuFlex(topics, page = 1, options = {}) {
  const p = Math.max(parseInt(page, 10) || 1, 1);
  const all = Array.isArray(topics) ? topics : [];
  const faqs = all.filter(t => !isMetaTopic(t));

  const cat = options?.cat ? decodeURIComponent(String(options.cat)) : null;

  // -------------------------
  // (A) カテゴリ一覧
  // -------------------------
  if (!cat) {
    const catSet = new Set(faqs.map(t => String(t.category || "")).filter(Boolean));
    const categories = orderedCategories(catSet);

    const btns = buildButtons(
      categories.map(c => ({
        label: `${c.icon} ${c.key}`,
        data: `step=talk_cat&cat=${encodeURIComponent(c.key)}`
      }))
    );

    const footer = buildButtons([
      { label: "メニュー", data: "step=menu" }
    ]);

    return wrapMenuBubble("🙂 気良歌舞伎ナビ\nカテゴリから選んでね🙂", btns, footer);
  }

  // -------------------------
  // (B) カテゴリ内 FAQ 一覧（category フィールドで絞り込み）
  // -------------------------
  const filtered = faqs.filter(t => String(t.category || "") === cat);

  const total = filtered.length;
  const maxPage = Math.max(1, Math.ceil(total / PER_PAGE));
  const cur = Math.min(p, maxPage);
  const slice = filtered.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);

  const catIcon = (TALK_CAT_ORDER.find(c => c.key === cat) || {}).icon || "📁";

  const btns = buildButtons(
    slice.map(t => ({
      label: normalizeLabel(t.label || t.question || "質問"),
      data: `step=talk_detail&id=${encodeURIComponent(String(t.id))}`
    }))
  );

  const footerItems = [];
  if (cur < maxPage) {
    footerItems.push({
      label: "次へ",
      data: `step=talk_cat&cat=${encodeURIComponent(cat)}&page=${cur + 1}`
    });
  }
  if (cur > 1) {
    footerItems.push({
      label: "前へ",
      data: `step=talk_cat&cat=${encodeURIComponent(cat)}&page=${cur - 1}`
    });
  }
  footerItems.push({ label: "カテゴリ一覧", data: "step=talk_list" });
  footerItems.push({ label: "メニュー", data: "step=menu" });

  const footer = buildButtons(footerItems);

  return wrapMenuBubble(`${catIcon} ${cat}（${cur}/${maxPage}）`, btns, footer);
}

export function talkAnswerFlex(topic) {
  const title = normalizeLabel(topic?.label || topic?.question || "回答");
  const ans = String(topic?.answer || "").trim() || "（回答が未設定だよ🙏）";

  // category フィールドからカテゴリを取得
  const cat = String(topic?.category || "").trim() || null;

  const footerItems = [];
  if (cat && cat !== "メニュー") {
    footerItems.push({
      label: `${cat}に戻る`,
      data: `step=talk_cat&cat=${encodeURIComponent(cat)}&page=1`
    });
  }
  footerItems.push({ label: "カテゴリ一覧", data: "step=talk_list" });
  footerItems.push({ label: "メニュー", data: "step=menu" });

  return {
    type: "flex",
    altText: title,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          { type: "text", text: title, weight: "bold", size: "md", wrap: true },
          { type: "text", text: ans, size: "sm", wrap: true }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: buildButtons(footerItems)
      }
    }
  };
}

/**
 * テキスト検索（フリーワード → FAQマッチ）
 * category / label / question / answer / tags / keywords を横断検索
 */
export function findTalkTopic(topics, text) {
  const q = String(text || "").trim().toLowerCase();
  if (!q) return null;

  const all = Array.isArray(topics) ? topics : [];
  const faqs = all.filter(t => !isMetaTopic(t));

  // 完全一致（label / question）
  const exact = faqs.find(t => {
    const label = String(t.label || "").trim().toLowerCase();
    const question = String(t.question || "").trim().toLowerCase();
    return label === q || question === q;
  });
  if (exact) return exact;

  // 部分一致（優先度順に検索）
  // Pass 1: label / question（最も意図に近い）
  const hitLabel = faqs.find(t => {
    const label = String(t.label || "").toLowerCase();
    const question = String(t.question || "").toLowerCase();
    return label.includes(q) || question.includes(q);
  });
  if (hitLabel) return hitLabel;

  // Pass 2: tags / keywords
  const hitTag = faqs.find(t => {
    const tags = (Array.isArray(t.tags) ? t.tags.map(String) : []).join(" ").toLowerCase();
    const kw = (Array.isArray(t.keywords) ? t.keywords.map(String) : []).join(" ").toLowerCase();
    return tags.includes(q) || kw.includes(q);
  });
  if (hitTag) return hitTag;

  // Pass 3: answer / category（広めのフォールバック）
  const hitBody = faqs.find(t => {
    const ans = String(t.answer || "").toLowerCase();
    const cat = String(t.category || "").toLowerCase();
    return ans.includes(q) || cat.includes(q);
  });

  return hitBody || null;
}
