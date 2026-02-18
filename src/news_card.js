// src/news_card.js
// =========================================================
// ニュースカード表示（LINE Flex / Web両対応）
// =========================================================

import { getCachedNews, formatNewsDate } from "./news.js";
import { KABUKI } from "./flex_menu.js";

/**
 * LINE Flex Message 形式のニュースカード生成
 * @returns {Object|null} LINE Flex message or null if no news
 */
export async function newsFlexMessage(env) {
  const cached = await getCachedNews(env);
  if (!cached || !cached.articles || cached.articles.length === 0) {
    return {
      type: "text",
      text: "📰 まだニュースが取得できていないよ。\nもう少し待ってね！",
    };
  }

  const articles = cached.articles.slice(0, 10);

  // 5件ずつ2ページに分割（carousel）
  const perPage = 5;
  const pages = [];
  for (let i = 0; i < articles.length; i += perPage) {
    pages.push(articles.slice(i, i + perPage));
  }

  const bubbles = pages.map((pageArticles, pageIdx) => {
    const rows = [];

    pageArticles.forEach((a, i) => {
      // 区切り
      if (i > 0) {
        rows.push({ type: "separator", margin: "md" });
      }

      // 記事行
      rows.push({
        type: "box",
        layout: "vertical",
        paddingAll: "10px",
        backgroundColor: KABUKI.card,
        cornerRadius: "8px",
        margin: "sm",
        action: {
          type: "uri",
          label: a.title.substring(0, 40),
          uri: a.link,
        },
        contents: [
          {
            type: "text",
            text: a.title,
            size: "sm",
            weight: "bold",
            wrap: true,
            maxLines: 3,
            color: KABUKI.text,
          },
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            margin: "xs",
            contents: [
              {
                type: "text",
                text: a.source || "ニュース",
                size: "xxs",
                color: KABUKI.dim,
                flex: 0,
              },
              {
                type: "text",
                text: formatNewsDate(a.pubTs),
                size: "xxs",
                color: KABUKI.dim,
                align: "end",
                flex: 0,
              },
            ],
          },
        ],
      });
    });

    return {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        backgroundColor: KABUKI.bg,
        contents: [
          {
            type: "text",
            text: pages.length > 1
              ? `📰 歌舞伎ニュース（${pageIdx + 1}/${pages.length}）`
              : "📰 歌舞伎ニュース",
            weight: "bold",
            size: "lg",
            color: KABUKI.gold,
          },
          {
            type: "text",
            text: `更新: ${formatUpdateTime(cached.updatedAt)}`,
            size: "xxs",
            color: KABUKI.dimmer,
          },
          ...rows,
        ],
      },
      footer: {
        type: "box",
        layout: "horizontal",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "secondary",
            flex: 1,
            action: {
              type: "postback",
              label: "メニュー",
              data: "step=menu",
            },
          },
        ],
      },
    };
  });

  if (bubbles.length === 1) {
    return { type: "flex", altText: "📰 歌舞伎ニュース", contents: bubbles[0] };
  }
  return {
    type: "flex",
    altText: "📰 歌舞伎ニュース",
    contents: { type: "carousel", contents: bubbles },
  };
}

/**
 * Web ウィジェット用 HTML カード生成
 * @returns {string} HTML string
 */
export async function newsWebHTML(env) {
  const cached = await getCachedNews(env);
  if (!cached || !cached.articles || cached.articles.length === 0) {
    return "📰 まだニュースが取得できていないよ。\nもう少し待ってね！";
  }

  const articles = cached.articles.slice(0, 8);
  const updateStr = formatUpdateTime(cached.updatedAt);

  let html = `<div style="font-size:13px;">`;
  html += `<div style="font-weight:bold;font-size:15px;margin-bottom:2px;">📰 歌舞伎ニュース</div>`;
  html += `<div style="font-size:10px;color:#999;margin-bottom:8px;">更新: ${escHTML(updateStr)}</div>`;

  articles.forEach((a) => {
    const date = formatNewsDate(a.pubTs);
    const source = a.source || "";
    html += `<a href="${escHTML(a.link)}" target="_blank" rel="noopener" `
      + `style="display:block;padding:8px 10px;margin-bottom:6px;`
      + `background:#F9FAFB;border-radius:8px;text-decoration:none;color:inherit;`
      + `border:1px solid #E5E7EB;">`;
    html += `<div style="font-weight:bold;font-size:13px;color:#1A1A2E;line-height:1.5;">${escHTML(a.title)}</div>`;
    html += `<div style="display:flex;justify-content:space-between;margin-top:3px;">`;
    html += `<span style="font-size:10px;color:#888;">${escHTML(source)}</span>`;
    html += `<span style="font-size:10px;color:#888;">${escHTML(date)}</span>`;
    html += `</div></a>`;
  });

  html += `</div>`;
  return html;
}

// ─── ヘルパー ───
function formatUpdateTime(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  const mo = d.getMonth() + 1;
  const dy = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${mo}/${dy} ${hh}:${mm}`;
}

function escHTML(s) {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
