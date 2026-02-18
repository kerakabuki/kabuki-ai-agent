// worker.js（ルート）
// =========================================================
// Imports
// =========================================================
import { handleQuizMessage, loadQuizState } from "./src/quiz.js";

import { mainMenuFlex, naviHomeFlex } from "./src/flex_menu.js";

import {
  loadEnmokuCatalog,
  loadEnmokuJson,
  enmokuListFlex,
  groupSubMenuFlex,
  sectionMenuFlex,
  castListFlex,
  castDetailFlex,
  enmokuSectionDetailFlex,
  sectionNavMessage,
  castNavMessage
} from "./src/flex_enmoku.js";

import {
  GLOSSARY_CAT_ORDER,
  glossaryCategoryFlex,
  glossaryTermListFlex,
  glossaryTermDetailFlex,
  glossarySearchResultFlex
} from "./src/flex_glossary.js";

import {
  recommendListFlex,
  recommendDetailFlex
} from "./src/flex_recommend.js";

// ★ 歌舞伎ログ（閲覧履歴・クリップ）
import {
  loadLog,
  appendRecent,
  clearRecent,
  toggleClip,
  myPageFlex,
  myPageWeb,
  recentListFlex,
  recentListWeb,
  clipsMenuFlex,
  clipsMenuWeb,
  clipsListFlex,
  clipsListWeb,
  quizReviewFlex,
  quizReviewWeb
} from "./src/user_log.js";

// ★ 追加：気良歌舞伎ナビ（FAQ）
import {
  talkMenuFlex,
  talkAnswerFlex,
  findTalkTopic
} from "./src/flex_talk.js";

// ★ お稽古モード HTML
import { trainingPageHTML } from "./src/training_page.js";
import { kakegoePageHTML } from "./src/kakegoe_page.js";
import { kakegoeEditorHTML } from "./src/kakegoe_editor.js";
import { serifuEditorHTML } from "./src/serifu_editor.js";
import { serifuPageHTML } from "./src/serifu_page.js";

// ★ 認証（LINE Login + Google Sign-In）
import {
  lineLoginRedirect, lineLoginCallback, verifyGoogleToken,
  getSession, destroySession, authMe,
  migrateUserData, getUserData, putUserData,
} from "./src/auth.js";

// ★ ニュース（Google News RSS → KV）
import { fetchAndCacheNews, backfillNews, searchActorNews } from "./src/news.js";
import { newsFlexMessage, newsWebHTML } from "./src/news_card.js";

// ★ 歌舞伎美人 公演情報（kabuki-bito.jp → KV）
import { refreshPerformancesCache, getPerformancesCached } from "./src/kabuki_bito.js";

// ★ WEBページ（フルページ）
import { topPageHTML } from "./src/top_page.js";
import { aboutPageHTML } from "./src/about_page.js";
import { newsPageHTML } from "./src/news_page.js";
import { enmokuPageHTML } from "./src/enmoku_page.js";
import { glossaryPageHTML } from "./src/glossary_page.js";
import { recommendPageHTML } from "./src/recommend_page.js";
import { quizPageHTML } from "./src/quiz_page.js";
import { performancePageHTML } from "./src/performance_page.js";
import { kawarabanPageHTML } from "./src/kawaraban_page.js";
import { nftGuidePageHTML } from "./src/nft_guide_page.js";
import { storyPageHTML } from "./src/story_page.js";
import { mypagePageHTML } from "./src/mypage_page.js";
import { naviPageHTML } from "./src/navi_page.js";
import { mannersPageHTML } from "./src/manners_page.js";
import { recoPageHTML } from "./src/reco_page.js";
import { livePageHTML } from "./src/live_page.js";
import { dojoPageHTML } from "./src/dojo_page.js";
import { groupSitePageHTML } from "./src/group_site_page.js";
import { groupPerformancePageHTML } from "./src/group_performance_page.js";
import { groupRecordsPageHTML } from "./src/group_records_page.js";
import { groupNotesPageHTML } from "./src/group_notes_page.js";
import { groupScriptListPageHTML, groupScriptViewerPageHTML, groupScriptTextViewerHTML, groupScriptPdfViewerHTML } from "./src/group_script_page.js";
import { groupTrainingPageHTML } from "./src/group_training_page.js";
import { groupOnboardingPageHTML } from "./src/group_onboarding_page.js";
import { sharedScriptsPageHTML } from "./src/shared_scripts_page.js";
import { projectPageHTML } from "./src/project_page.js";
import { architecturePageHTML } from "./src/architecture_page.js";
import { joinPageHTML } from "./src/join_page.js";
import { feedbackPageHTML } from "./src/feedback_page.js";

// ★ WEBウィジェットJS（R2ではなくバンドルから配信）
import WIDGET_JS from "./src/keranosuke_widget.js";

/* =========================================================
   Utils
========================================================= */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/** 演目：recommend.json等のエイリアスID → catalog ID（= R2ファイル名） */
const ENMOKU_ALIAS = {
  moritsuna: "moritunajinya",
  moritsuna_jinya: "moritunajinya",
  sodehagi: "adachigaharasandanme",
  sodehagi_saimon: "adachigaharasandanme",
  chushingura07: "gionichiriki",
  chushingura_7: "gionichiriki",
  chushingura_7danme: "gionichiriki",
  gion_ichiryoku: "gionichiriki",
  gion_ichiryoku_chaya: "gionichiriki",
  chushingura09: "yamashinakankyo",
  chushingura_9: "yamashinakankyo",
  chushingura_9danme: "yamashinakankyo",
  yamashina: "yamashinakankyo",
  kirare: "kirareyosa",
  kirare_yosa: "kirareyosa",
  hamamamatsuya: "hamamatsuya",
};

/* =========================================================
   団体シードデータ（JIKABUKI PLUS+ マルチテナント基盤）
========================================================= */
const DEFAULT_GROUPS = {
  kera: {
    group_id: "kera",
    name: "気良歌舞伎",
    name_kana: "けらかぶき",
    tagline: "素人歌舞伎の真髄がここにある",
    description: "岐阜県郡上市明宝気良。世帯数は130世帯ぐらいの小さな集落。\n2005年、地元の若者たちが集まり、地域の活性化のため、17年ぶりに歌舞伎を復活。\nそれから20年が過ぎ、メンバーは20代から50代まで約40名に。今では地域の毎年の恒例行事として皆に楽しみにしていただけるようになった。\n\n我々は歌舞伎保存会ではない。ただ「気良の人たちに元気になってもらいたい」そして「自分たちも楽しもう」──その思いだけでやってきた。",
    venue: {
      name: "気良座",
      address: "岐阜県郡上市明宝気良（旧明方小学校講堂）"
    },
    contact: {
      instagram: "https://www.instagram.com/kerakabuki_official/"
    },
    faq: [
      { q: "チケットはどうやって買えますか？", a: "現在、チケットは事前予約制です。詳しくはInstagramでお知らせします。" },
      { q: "駐車場はありますか？", a: "はい、会場周辺に無料駐車場がございます。" },
      { q: "子供は入場できますか？", a: "もちろんです。お子様連れの方も大歓迎です。" },
      { q: "アクセスは？", a: "郡上八幡ICより車で約30分。公共交通機関の場合は長良川鉄道・郡上八幡駅からバスが出ています。" }
    ],
    next_performance: {
      title: "令和8年 気良歌舞伎公演（予定）",
      date: "令和8年9月26日（土） 17:00 開演",
      venue: "気良座（旧明方小学校講堂）",
      note: "詳細は決まり次第お知らせします。最新情報はInstagramでもご確認いただけます。"
    },
    performances: [
      { year: 2025, date_display: "9月28日", title: "五代目座長襲名披露公演", venue: "気良座", plays: ["寿曽我対面「工藤館」｜座長襲名劇中口上", "恋飛脚大和往来「封印切」", "白浪五人男「稲瀬川勢揃い」"] },
      { year: 2024, date_display: "9月28日", venue: "気良座", plays: ["義経千本桜「すし屋」", "義経千本桜「鳥居前」"] },
      { year: 2023, date_display: "9月23日", venue: "気良座", plays: ["白浪五人男「浜松屋」", "白浪五人男「稲瀬川勢揃い」", "一谷嫩軍記「熊谷陣屋」"] },
      { year: 2022, date_display: "10月1日", venue: "気良座", plays: ["恋飛脚大和往来「封印切」", "源平布引滝「実盛物語」"] },
      { year: 2021, date_display: "配信", title: "動画配信公演", venue: "気良座", plays: ["仮名手本忠臣蔵「殿中刃傷」", "白浪五人男「浜松屋」「稲瀬川勢揃い」"] },
      { year: 2019, date_display: "9月28日", venue: "気良座", plays: ["義経千本桜「すし屋」", "白浪五人男「浜松屋」「稲瀬川勢揃い」"] },
      { year: 2018, date_display: "9月29日", venue: "気良座", plays: ["一谷嫩軍記「熊谷陣屋」", "恋飛脚大和往来「封印切」"] },
      { year: 2017, date_display: "9月30日", venue: "気良座", plays: ["源平布引滝「実盛物語」", "白浪五人男「浜松屋」「稲瀬川勢揃い」"] },
      { year: 2016, date_display: "10月1日", venue: "気良座", plays: ["一谷嫩軍記「組打・陣門」", "恋飛脚大和往来「封印切」"] },
      { year: 2015, date_display: "10月3日", title: "10周年記念公演", venue: "気良座", plays: ["白浪五人男「浜松屋」「稲瀬川勢揃い」", "義経千本桜「すし屋」", "源平布引滝「実盛物語」"] },
      { year: 2014, date_display: "9月27日", venue: "気良座", plays: ["義経千本桜「すし屋」", "恋飛脚大和往来「封印切」"] },
      { year: 2013, date_display: "9月28日", venue: "気良座", plays: ["一谷嫩軍記「熊谷陣屋」", "白浪五人男「浜松屋」「稲瀬川勢揃い」"] },
      { year: 2012, date_display: "9月29日", venue: "気良座", plays: ["恋飛脚大和往来「封印切」", "仮名手本忠臣蔵「殿中刃傷」"] },
      { year: 2011, date_display: "10月1日", venue: "気良座", plays: ["源平布引滝「実盛物語」", "義経千本桜「すし屋」"] },
      { year: 2010, date_display: "10月2日", title: "5周年記念公演", venue: "気良座", plays: ["白浪五人男「浜松屋」「稲瀬川勢揃い」", "一谷嫩軍記「熊谷陣屋」"] },
      { year: 2009, date_display: "10月3日", venue: "気良座", plays: ["恋飛脚大和往来「封印切」"] },
      { year: 2008, date_display: "9月27日", venue: "気良座", plays: ["義経千本桜「すし屋」"] },
      { year: 2007, date_display: "10月6日", venue: "気良座", plays: ["白浪五人男「浜松屋」「稲瀬川勢揃い」"] },
      { year: 2006, date_display: "10月7日", venue: "気良座", plays: ["白浪五人男「浜松屋」「稲瀬川勢揃い」"] },
      { year: 2005, date_display: "10月8日", title: "復活公演", venue: "白山神社", plays: ["白浪五人男「浜松屋」「稲瀬川勢揃い」"] },
    ],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2026-02-16T00:00:00Z"
  }
};

function verifyGroupAuth(request, group) {
  if (!group || !group.passcode) return true;
  const authHeader = request.headers.get("X-Group-Passcode") || "";
  const url = new URL(request.url);
  const qsPasscode = url.searchParams.get("passcode") || "";
  return authHeader === group.passcode || qsPasscode === group.passcode;
}

async function getGroup(env, groupId) {
  const kvKey = `group:${groupId}`;
  const raw = await env.CHAT_HISTORY.get(kvKey);
  if (raw) return JSON.parse(raw);
  if (DEFAULT_GROUPS[groupId]) {
    await env.CHAT_HISTORY.put(kvKey, JSON.stringify(DEFAULT_GROUPS[groupId]));
    return DEFAULT_GROUPS[groupId];
  }
  return null;
}

async function listGroups(env) {
  const groups = [];
  for (const id of Object.keys(DEFAULT_GROUPS)) {
    const g = await getGroup(env, id);
    if (g) groups.push({ group_id: g.group_id, name: g.name, tagline: g.tagline });
  }
  return groups;
}

/* =========================================================
   Main fetch
========================================================= */
export default {
  async fetch(request, env, ctx) {
    // ---------- CORS preflight ----------
    if (request.method === "OPTIONS") {
      return corsResponse(request, new Response("", { status: 204 }));
    }

    // 必須バインドの存在確認（undefined.get エラー防止）
    if (!env?.CHAT_HISTORY) {
      console.error("CHAT_HISTORY binding missing. Add kv_namespaces in wrangler.toml.");
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    // originを保持（メニューの稽古モードリンク生成用）
    env._origin = url.origin;

    /* =====================================================
       0) ウィジェットJS（バンドルから直接配信、R2不要）
    ===================================================== */
    if (path === "/assets/keranosuke-widget.js" || path.startsWith("/assets/keranosuke-widget.js?")) {
      return new Response(WIDGET_JS, {
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "no-cache, max-age=0, must-revalidate",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    /* =====================================================
       0.1) Assets配信（R2 → 画像/JS/CSSを返す）
    ===================================================== */
    if (path.startsWith("/assets/")) {
      const key = path.replace(/^\/assets\//, "");

      if (!key || key.includes("..")) {
        return new Response("Bad Request", { status: 400 });
      }

      const obj = await env.ASSETS_BUCKET.get(key);
      if (!obj) return new Response("Not Found", { status: 404 });

      const ct =
        key.endsWith(".png") ? "image/png" :
        key.endsWith(".jpg") || key.endsWith(".jpeg") ? "image/jpeg" :
        key.endsWith(".webp") ? "image/webp" :
        key.endsWith(".gif") ? "image/gif" :
        key.endsWith(".js") ? "application/javascript; charset=utf-8" :
        key.endsWith(".css") ? "text/css; charset=utf-8" :
        "application/octet-stream";

      return new Response(obj.body, {
        headers: {
          "Content-Type": ct,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    /* =====================================================
       0.3) WEBページ（フルページ）
    ===================================================== */
    const HTML_HEADERS = { "Content-Type": "text/html; charset=utf-8" };

    if (path === "/") {
      return new Response(topPageHTML(), { headers: HTML_HEADERS });
    }

    /* ─── 301: KABUKI PLUS+ 旧URL → /kabuki/* ─── */
    if (path === "/navi") return new Response(null, { status: 301, headers: { "Location": "/kabuki/navi" } });
    if (path === "/enmoku" || path.startsWith("/enmoku/")) return new Response(null, { status: 301, headers: { "Location": "/kabuki/navi/enmoku" + (path.slice(7) || "") } });
    if (path === "/glossary" || path.startsWith("/glossary/")) return new Response(null, { status: 301, headers: { "Location": "/kabuki/navi/glossary" + (path.slice(9) || "") } });
    if (path === "/recommend" || path.startsWith("/recommend/")) return new Response(null, { status: 301, headers: { "Location": "/kabuki/navi/recommend" + (path.slice(10) || "") } });
    if (path === "/live") return new Response(null, { status: 301, headers: { "Location": "/kabuki/live" } });
    if (path === "/news") return new Response(null, { status: 301, headers: { "Location": "/kabuki/live/news" } });
    if (path === "/reco") return new Response(null, { status: 301, headers: { "Location": "/kabuki/reco" } });
    if (path === "/mypage") return new Response(null, { status: 301, headers: { "Location": "/kabuki/reco" } });
    if (path === "/dojo") return new Response(null, { status: 301, headers: { "Location": "/kabuki/dojo" } });
    if (path === "/quiz") return new Response(null, { status: 301, headers: { "Location": "/kabuki/dojo/quiz" } });
    if (path === "/training" || path.startsWith("/training/")) return new Response(null, { status: 301, headers: { "Location": "/kabuki/dojo/training" + (path.slice(10) || "") } });

    /* ─── 301: JIKABUKI GATE 旧URL → /jikabuki/gate/kera/* ─── */
    if (path === "/about") return new Response(null, { status: 301, headers: { "Location": "/jikabuki/gate/kera/about" } });
    if (path === "/performance") return new Response(null, { status: 301, headers: { "Location": "/jikabuki/gate/kera/performance" } });
    if (path === "/story") return new Response(null, { status: 301, headers: { "Location": "/jikabuki/gate/kera/story" } });
    if (path.startsWith("/story/")) return new Response(null, { status: 301, headers: { "Location": "/jikabuki/gate/kera/story" + path.slice(6) } });
    if (path === "/kawaraban") return new Response(null, { status: 301, headers: { "Location": "/jikabuki/gate/kera/kawaraban" } });
    const kwRedirect = path.match(/^\/kawaraban\/pdf\/(\d{2})$/);
    if (kwRedirect) return new Response(null, { status: 301, headers: { "Location": "/jikabuki/gate/kera/kawaraban/pdf/" + kwRedirect[1] } });
    if (path === "/nft-guide") return new Response(null, { status: 301, headers: { "Location": "/jikabuki/gate/kera/nft" } });
    if (path === "/jikabuki/scripts") return new Response(null, { status: 301, headers: { "Location": "/jikabuki/base/scripts" } });
    if (path === "/jikabuki/onboarding") return new Response(null, { status: 301, headers: { "Location": "/jikabuki/base/onboarding" } });
    if (path === "/calendar") return new Response(null, { status: 301, headers: { "Location": "/jikabuki/info/calendar" } });

    /* ─── KABUKI PLUS+ 新URL: /kabuki/* ─── */
    if (path === "/kabuki") return new Response(null, { status: 301, headers: { "Location": "/kabuki/navi" } });
    if (path === "/kabuki/navi") return new Response(naviPageHTML(), { headers: HTML_HEADERS });
    if (path === "/kabuki/navi/manners") return new Response(mannersPageHTML(), { headers: HTML_HEADERS });
    if (path === "/kabuki/navi/enmoku" || path.startsWith("/kabuki/navi/enmoku/")) return new Response(enmokuPageHTML(), { headers: HTML_HEADERS });
    if (path === "/kabuki/navi/glossary" || path.startsWith("/kabuki/navi/glossary/")) return new Response(glossaryPageHTML(), { headers: HTML_HEADERS });
    if (path === "/kabuki/navi/recommend" || path.startsWith("/kabuki/navi/recommend/")) return new Response(recommendPageHTML(), { headers: HTML_HEADERS });
    if (path === "/kabuki/live") return new Response(livePageHTML(), { headers: HTML_HEADERS });
    if (path === "/kabuki/live/news") return new Response(newsPageHTML(), { headers: HTML_HEADERS });
    if (path === "/kabuki/reco") return new Response(mypagePageHTML({ googleClientId: env.GOOGLE_CLIENT_ID || "" }), { headers: HTML_HEADERS });
    if (path === "/kabuki/dojo") return new Response(dojoPageHTML(), { headers: HTML_HEADERS });
    if (path === "/kabuki/dojo/quiz") return new Response(quizPageHTML(), { headers: HTML_HEADERS });
    if (path === "/kabuki/dojo/training") return new Response(trainingPageHTML(), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    if (path === "/kabuki/dojo/training/kakegoe") return new Response(kakegoePageHTML(), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    if (path === "/kabuki/dojo/training/kakegoe/editor") return new Response(kakegoeEditorHTML(), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    if (path === "/kabuki/dojo/training/serifu") return new Response(serifuPageHTML(), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate", "Pragma": "no-cache", "Expires": "0" } });
    if (path === "/kabuki/dojo/training/serifu/editor") return new Response(serifuEditorHTML(), { headers: { "Content-Type": "text/html; charset=utf-8" } });

    /* ─── JIKABUKI GATE kera 新URL: /jikabuki/gate/kera/* ─── */
    if (path === "/jikabuki/gate" || path === "/jikabuki/gate/kera") return new Response(null, { status: 301, headers: { "Location": "/jikabuki/gate/kera/about" } });
    if (path === "/jikabuki/gate/kera/about") return new Response(aboutPageHTML(), { headers: HTML_HEADERS });
    if (path === "/jikabuki/gate/kera/performance") return new Response(performancePageHTML(), { headers: HTML_HEADERS });
    if (path === "/jikabuki/gate/kera/story" || path.startsWith("/jikabuki/gate/kera/story/")) return new Response(storyPageHTML(), { headers: HTML_HEADERS });
    if (path === "/jikabuki/gate/kera/kawaraban") return new Response(kawarabanPageHTML(), { headers: HTML_HEADERS });
    const kwGateMatch = path.match(/^\/jikabuki\/gate\/kera\/kawaraban\/pdf\/(\d{2})$/);
    if (kwGateMatch) {
      try {
        let obj = await env.CONTENT_BUCKET.get(`kawaraban/kawaraban-${kwGateMatch[1]}.pdf`);
        let contentType = "application/pdf";
        let filename = `kawaraban-${kwGateMatch[1]}.pdf`;
        if (!obj) {
          obj = await env.CONTENT_BUCKET.get(`kawaraban/kawaraban-${kwGateMatch[1]}.png`);
          if (obj) { contentType = "image/png"; filename = `kawaraban-${kwGateMatch[1]}.png`; }
        }
        if (!obj) return new Response("Not found", { status: 404 });
        return new Response(obj.body, { headers: { "Content-Type": contentType, "Content-Disposition": `inline; filename="${filename}"`, "Cache-Control": "public, max-age=86400" } });
      } catch (e) { return new Response("Error: " + e.message, { status: 500 }); }
    }
    if (path === "/jikabuki/gate/kera/nft") return new Response(nftGuidePageHTML(), { headers: HTML_HEADERS });

    /* ─── JIKABUKI INFO/BASE 新URL ─── */
    if (path === "/jikabuki/info/news") return new Response(newsPageHTML(), { headers: HTML_HEADERS });
    if (path === "/jikabuki/info/calendar") return new Response(recoPageHTML(), { headers: HTML_HEADERS });
    if (path === "/jikabuki/base/onboarding") return new Response(groupOnboardingPageHTML(), { headers: HTML_HEADERS });
    if (path === "/jikabuki/base/scripts") {
      let sharedScripts = [];
      try {
        const groups = await listGroups(env);
        for (const grp of groups) {
          const gid = grp.group_id;
          const seen = new Set();
          const kvRaw = await env.CHAT_HISTORY.get(`group_scripts:${gid}`);
          const kvData = kvRaw ? JSON.parse(kvRaw) : { scripts: [] };
          for (const s of kvData.scripts) {
            if (s.visibility === "shared") {
              seen.add(s.id);
              sharedScripts.push({ id: s.id, group_id: gid, group_name: grp.name, title: s.title || s.id, play: s.play || "", type: s.type || "text", perf_date: s.perf_date || "", perf_venue: s.perf_venue || "" });
            }
          }
          const listed = await env.CONTENT_BUCKET.list({ prefix: `scripts/${gid}/` });
          for (const obj of (listed.objects || [])) {
            const fn = obj.key.replace(`scripts/${gid}/`, "");
            if (!fn.endsWith(".json")) continue;
            const id = fn.replace(".json", "");
            if (seen.has(id)) continue;
            try {
              const raw = await env.CONTENT_BUCKET.get(obj.key);
              if (raw) {
                const script = JSON.parse(await raw.text());
                if (script.visibility === "shared") sharedScripts.push({ id, group_id: gid, group_name: grp.name, title: script.title || id, play: script.play || "", type: "json" });
              }
            } catch (e) { /* skip */ }
          }
        }
      } catch (e) { console.error("Shared scripts error:", e); }
      return new Response(sharedScriptsPageHTML(sharedScripts), { headers: HTML_HEADERS });
    }
    if (path === "/jikabuki/base/db") return new Response(recoPageHTML(), { headers: HTML_HEADERS });

    if (path === "/project") {
      return new Response(projectPageHTML(), { headers: HTML_HEADERS });
    }

    if (path === "/join") {
      const formUrl = env.JOIN_FORM_URL || "https://example.com/join-form";
      const contactUrl = env.JOIN_CONTACT_URL || "/jikabuki/gate/kera/about";
      const html = joinPageHTML({
        siteName: "KABUKI PLUS+",
        projectName: "気良歌舞伎×AIプロジェクト",
        formUrl,
        contactUrl,
      });
      return new Response(html, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=300",
        },
      });
    }

    if (path === "/feedback") {
      const formUrl = env.FEEDBACK_FORM_URL || "https://example.com/feedback-form";
      const html = feedbackPageHTML({
        siteName: "KABUKI PLUS+",
        projectName: "気良歌舞伎×AIプロジェクト",
        formUrl,
        backUrl: "/project",
      });
      return new Response(html, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=300",
        },
      });
    }

    if (path === "/architecture") {
      return new Response(architecturePageHTML(), { headers: HTML_HEADERS });
    }

    // ═══════ 認証ルート ═══════
    if (path === "/auth/line") {
      return lineLoginRedirect(env, request);
    }
    if (path === "/auth/line/callback") {
      return await lineLoginCallback(request, env);
    }

    if (path === "/jikabuki/base") {
      return new Response(recoPageHTML(), { headers: HTML_HEADERS });
    }

    if (path === "/jikabuki/info") {
      return new Response(recoPageHTML(), { headers: HTML_HEADERS });
    }

    if (path === "/jikabuki/labo") {
      return new Response(recoPageHTML(), { headers: HTML_HEADERS });
    }

    if (path === "/jikabuki" || path.startsWith("/jikabuki/")) {
      return new Response(recoPageHTML(), { headers: HTML_HEADERS });
    }

    /* 旧 /reco/* は新URLへ */
    if (path.startsWith("/reco/")) {
      return new Response(null, { status: 301, headers: { "Location": "/kabuki/reco" } });
    }

    /* =====================================================
       0.5) 団体ページ（JIKABUKI PLUS+ マルチテナント）
    ===================================================== */
    if (path.startsWith("/groups/kira")) {
      const newPath = path.replace("/groups/kira", "/groups/kera");
      return new Response(null, { status: 301, headers: { "Location": newPath } });
    }

    const groupPerfMatch = path.match(/^\/groups\/([a-zA-Z0-9_-]+)\/performances$/);
    if (groupPerfMatch) {
      const group = await getGroup(env, groupPerfMatch[1]);
      return new Response(groupPerformancePageHTML(group), { headers: HTML_HEADERS });
    }

    const groupRecordsMatch = path.match(/^\/groups\/([a-zA-Z0-9_-]+)\/records$/);
    if (groupRecordsMatch) {
      const group = await getGroup(env, groupRecordsMatch[1]);
      return new Response(groupRecordsPageHTML(group), { headers: HTML_HEADERS });
    }

    const groupNotesMatch = path.match(/^\/groups\/([a-zA-Z0-9_-]+)\/notes$/);
    if (groupNotesMatch) {
      const group = await getGroup(env, groupNotesMatch[1]);
      return new Response(groupNotesPageHTML(group), { headers: HTML_HEADERS });
    }

    const groupScriptViewMatch = path.match(/^\/groups\/([a-zA-Z0-9_-]+)\/scripts\/([^/]+)$/);
    if (groupScriptViewMatch) {
      const gid = groupScriptViewMatch[1];
      const sid = decodeURIComponent(groupScriptViewMatch[2]);
      const group = await getGroup(env, gid);
      const kvRaw = await env.CHAT_HISTORY.get(`group_scripts:${gid}`);
      const kvData = kvRaw ? JSON.parse(kvRaw) : { scripts: [] };
      const meta = kvData.scripts.find(s => s.id === sid);
      if (meta && meta.type === "text") {
        let content = "";
        try {
          const obj = await env.CONTENT_BUCKET.get(`scripts/${gid}/${meta.filename}`);
          if (obj) content = await obj.text();
        } catch (e) { console.error("Script load error:", e); }
        return new Response(groupScriptTextViewerHTML(group, meta, content), { headers: HTML_HEADERS });
      }
      if (meta && meta.type === "pdf") {
        return new Response(groupScriptPdfViewerHTML(group, meta), { headers: HTML_HEADERS });
      }
      let script = null;
      try {
        const fn = meta ? meta.filename : `${sid}.json`;
        const obj = await env.CONTENT_BUCKET.get(`scripts/${gid}/${fn}`);
        if (obj) script = JSON.parse(await obj.text());
      } catch (e) { console.error("Script load error:", e); }
      return new Response(groupScriptViewerPageHTML(group, script), { headers: HTML_HEADERS });
    }

    const groupScriptListMatch = path.match(/^\/groups\/([a-zA-Z0-9_-]+)\/scripts\/?$/);
    if (groupScriptListMatch) {
      const gid = groupScriptListMatch[1];
      const group = await getGroup(env, gid);
      let scripts = [];
      try {
        const kvRaw = await env.CHAT_HISTORY.get(`group_scripts:${gid}`);
        const kvData = kvRaw ? JSON.parse(kvRaw) : { scripts: [] };
        const listed = await env.CONTENT_BUCKET.list({ prefix: `scripts/${gid}/` });
        const r2Only = (listed.objects || []).filter(o => {
          const fn = o.key.replace(`scripts/${gid}/`, "");
          return fn.endsWith(".json") && !kvData.scripts.some(s => s.filename === fn);
        }).map(o => {
          const fn = o.key.replace(`scripts/${gid}/`, "");
          const id = fn.replace(".json", "");
          return { id, title: id, type: "json" };
        });
        scripts = [...kvData.scripts, ...r2Only];
      } catch (e) { console.error("Script list error:", e); }
      return new Response(groupScriptListPageHTML(group, scripts), { headers: HTML_HEADERS });
    }

    const groupTrainingMatch = path.match(/^\/groups\/([a-zA-Z0-9_-]+)\/training$/);
    if (groupTrainingMatch) {
      const group = await getGroup(env, groupTrainingMatch[1]);
      return new Response(groupTrainingPageHTML(group), { headers: HTML_HEADERS });
    }

    const groupSiteMatch = path.match(/^\/groups\/([a-zA-Z0-9_-]+)\/?$/);
    if (groupSiteMatch) {
      const group = await getGroup(env, groupSiteMatch[1]);
      return new Response(groupSitePageHTML(group), { headers: HTML_HEADERS });
    }

    /* =====================================================
       0.4) 認証 API
    ===================================================== */
    if (path === "/api/auth/google" && request.method === "POST") {
      return corsResponse(request, await verifyGoogleToken(request, env));
    }
    if (path === "/api/auth/me") {
      return corsResponse(request, await authMe(request, env));
    }
    if (path === "/api/auth/logout" && request.method === "POST") {
      return corsResponse(request, await destroySession(request, env));
    }
    if (path === "/api/auth/migrate" && request.method === "POST") {
      return corsResponse(request, await migrateUserData(request, env));
    }
    if (path === "/api/userdata" && request.method === "GET") {
      return corsResponse(request, await getUserData(request, env));
    }
    if (path === "/api/userdata" && request.method === "PUT") {
      return corsResponse(request, await putUserData(request, env));
    }

    /* =====================================================
       0.5) JSON API（WEBページ用データ取得）
    ===================================================== */

    if (path === "/api/news") {
      try {
        // KV読み取りに5秒タイムアウト（ハング防止）
        const raw = await Promise.race([
          env.CHAT_HISTORY.get("news:latest"),
          new Promise((_, reject) => setTimeout(() => reject(new Error("KV timeout")), 5000)),
        ]);
        if (raw) {
          return corsResponse(request, jsonResponse(JSON.parse(raw)));
        }
        // キャッシュなし → バックグラウンドで取得開始して即返却
        ctx.waitUntil(fetchAndCacheNews(env));
        return corsResponse(request, jsonResponse({ articles: [], updatedAt: null, refreshing: true }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ articles: [], error: String(e) }, 500));
      }
    }

    if (path === "/api/performances") {
      try {
        const data = await getPerformancesCached(env);
        if (!data.items.length && !data.fetched_at) {
          // キャッシュなし → バックグラウンドで取得開始して即返却
          ctx.waitUntil(refreshPerformancesCache(env));
          return corsResponse(request, jsonResponse({ items: [], count: 0, fetched_at: null, refreshing: true }));
        }
        return corsResponse(request, jsonResponse(data));
      } catch (e) {
        return corsResponse(request, jsonResponse({ items: [], error: String(e) }, 500));
      }
    }


    // ★ 手動更新: 公演情報の即時取得
    if (path === "/api/performances-fetch") {
      try {
        const data = await refreshPerformancesCache(env);
        return corsResponse(request, jsonResponse({ ok: true, count: data.count }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ ok: false, error: String(e) }, 500));
      }
    }

    // ★ 団体 API（JIKABUKI PLUS+）
    if (path === "/api/groups") {
      try {
        const groups = await listGroups(env);
        return corsResponse(request, jsonResponse(groups));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    const groupApiMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)$/);
    if (groupApiMatch) {
      const groupId = groupApiMatch[1];
      if (request.method === "POST") {
        try {
          const body = await request.json();
          const existing = await getGroup(env, groupId);
          const merged = { ...existing, ...body, group_id: groupId, updated_at: new Date().toISOString() };
          await env.CHAT_HISTORY.put(`group:${groupId}`, JSON.stringify(merged));
          return corsResponse(request, jsonResponse({ ok: true, group: merged }));
        } catch (e) {
          return corsResponse(request, jsonResponse({ error: String(e) }, 500));
        }
      }
      try {
        const group = await getGroup(env, groupId);
        if (!group) return corsResponse(request, jsonResponse({ error: "Not found" }, 404));
        return corsResponse(request, jsonResponse(group));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    // ★ 団体メモ API
    const groupNotesApiMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/notes$/);
    if (groupNotesApiMatch) {
      const gid = groupNotesApiMatch[1];
      const kvKey = `group_notes:${gid}`;
      if (request.method === "POST") {
        try {
          const body = await request.json();
          await env.CHAT_HISTORY.put(kvKey, JSON.stringify({ notes: body.notes || [] }));
          return corsResponse(request, jsonResponse({ ok: true }));
        } catch (e) {
          return corsResponse(request, jsonResponse({ error: String(e) }, 500));
        }
      }
      try {
        const raw = await env.CHAT_HISTORY.get(kvKey);
        const data = raw ? JSON.parse(raw) : { notes: [] };
        return corsResponse(request, jsonResponse(data));
      } catch (e) {
        return corsResponse(request, jsonResponse({ notes: [], error: String(e) }, 500));
      }
    }

    // ★ 台本 API（アップロード / 一覧 / rawダウンロード / 削除）
    const scriptUploadMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/scripts\/upload$/);
    if (scriptUploadMatch && request.method === "POST") {
      const gid = scriptUploadMatch[1];
      try {
        const formData = await request.formData();
        const file = formData.get("file");
        const title = formData.get("title") || "";
        const play = formData.get("play") || "";
        const perfDate = formData.get("perf_date") || "";
        const perfVenue = formData.get("perf_venue") || "";
        const memo = formData.get("memo") || "";
        const visibility = formData.get("visibility") || "private";

        if (!file || !file.name) {
          return corsResponse(request, jsonResponse({ error: "No file provided" }, 400));
        }
        if (file.size > 10 * 1024 * 1024) {
          return corsResponse(request, jsonResponse({ error: "File too large (max 10MB)" }, 400));
        }

        const ext = (file.name.match(/\.([a-z0-9]+)$/i) || [])[1] || "txt";
        const allowedExt = ["txt", "pdf", "json"];
        if (!allowedExt.includes(ext.toLowerCase())) {
          return corsResponse(request, jsonResponse({ error: "Unsupported file type. Allowed: txt, pdf, json" }, 400));
        }

        const base = (title || file.name.replace(/\.[^.]+$/, ""))
          .toLowerCase().replace(/[^a-z0-9ぁ-んァ-ヶ一-龠_-]/g, "_").replace(/_+/g, "_").slice(0, 50)
          || "script";
        const suffix = perfDate ? "_" + perfDate.replace(/-/g, "") : "";
        let id = base + suffix;
        const kvKey0 = `group_scripts:${gid}`;
        const raw0 = await env.CHAT_HISTORY.get(kvKey0);
        const existing0 = raw0 ? JSON.parse(raw0) : { scripts: [] };
        if (existing0.scripts.some(s => s.id === id)) {
          id = id + "_" + Date.now().toString(36);
        }
        const filename = id + "." + ext.toLowerCase();
        const r2Key = `scripts/${gid}/${filename}`;

        const arrayBuffer = await file.arrayBuffer();
        await env.CONTENT_BUCKET.put(r2Key, arrayBuffer, {
          httpMetadata: { contentType: file.type || "application/octet-stream" }
        });

        const data = existing0;
        data.scripts = data.scripts.filter(s => s.id !== id);
        data.scripts.push({
          id, title: title || file.name, play, filename,
          type: ext.toLowerCase() === "pdf" ? "pdf" : ext.toLowerCase() === "json" ? "json" : "text",
          size: file.size,
          perf_date: perfDate,
          perf_venue: perfVenue,
          memo,
          visibility,
          uploaded_at: new Date().toISOString()
        });
        await env.CHAT_HISTORY.put(kvKey0, JSON.stringify(data));

        return corsResponse(request, jsonResponse({ ok: true, id, filename }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    const scriptRawMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/scripts\/([^/]+)\/raw$/);
    if (scriptRawMatch) {
      const gid = scriptRawMatch[1];
      const sid = decodeURIComponent(scriptRawMatch[2]);
      try {
        const kvKey = `group_scripts:${gid}`;
        const raw = await env.CHAT_HISTORY.get(kvKey);
        const data = raw ? JSON.parse(raw) : { scripts: [] };
        const meta = data.scripts.find(s => s.id === sid);
        const filename = meta ? meta.filename : sid + ".json";
        const r2Key = `scripts/${gid}/${filename}`;
        const obj = await env.CONTENT_BUCKET.get(r2Key);
        if (!obj) return new Response("Not Found", { status: 404 });
        const ct = filename.endsWith(".pdf") ? "application/pdf"
                 : filename.endsWith(".json") ? "application/json; charset=utf-8"
                 : "text/plain; charset=utf-8";
        return new Response(obj.body, {
          headers: {
            "Content-Type": ct,
            "Content-Disposition": `inline; filename="${filename}"`,
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*",
          }
        });
      } catch (e) {
        return new Response("Error: " + e.message, { status: 500 });
      }
    }

    const scriptDeleteMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/scripts\/([^/]+)$/);
    if (scriptDeleteMatch && request.method === "DELETE") {
      const gid = scriptDeleteMatch[1];
      const sid = decodeURIComponent(scriptDeleteMatch[2]);
      try {
        const kvKey = `group_scripts:${gid}`;
        const raw = await env.CHAT_HISTORY.get(kvKey);
        const data = raw ? JSON.parse(raw) : { scripts: [] };
        const meta = data.scripts.find(s => s.id === sid);
        if (meta) {
          await env.CONTENT_BUCKET.delete(`scripts/${gid}/${meta.filename}`);
          data.scripts = data.scripts.filter(s => s.id !== sid);
          await env.CHAT_HISTORY.put(kvKey, JSON.stringify(data));
        }
        return corsResponse(request, jsonResponse({ ok: true }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    if (scriptDeleteMatch && request.method === "PATCH") {
      const gid = scriptDeleteMatch[1];
      const sid = decodeURIComponent(scriptDeleteMatch[2]);
      try {
        const body = await request.json();
        const kvKey = `group_scripts:${gid}`;
        const raw = await env.CHAT_HISTORY.get(kvKey);
        const data = raw ? JSON.parse(raw) : { scripts: [] };
        const idx = data.scripts.findIndex(s => s.id === sid);
        if (idx < 0) return corsResponse(request, jsonResponse({ error: "Not found" }, 404));
        const allowed = ["title", "play", "perf_date", "perf_venue", "memo", "visibility"];
        for (const key of allowed) {
          if (body[key] !== undefined) data.scripts[idx][key] = body[key];
        }
        data.scripts[idx].updated_at = new Date().toISOString();
        await env.CHAT_HISTORY.put(kvKey, JSON.stringify(data));
        return corsResponse(request, jsonResponse({ ok: true, script: data.scripts[idx] }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    const scriptListApiMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/scripts$/);
    if (scriptListApiMatch) {
      const gid = scriptListApiMatch[1];
      try {
        const kvKey = `group_scripts:${gid}`;
        const raw = await env.CHAT_HISTORY.get(kvKey);
        const data = raw ? JSON.parse(raw) : { scripts: [] };
        const listed = await env.CONTENT_BUCKET.list({ prefix: `scripts/${gid}/` });
        const r2Only = (listed.objects || []).filter(o => {
          const fn = o.key.replace(`scripts/${gid}/`, "");
          return fn.endsWith(".json") && !data.scripts.some(s => s.filename === fn);
        }).map(o => {
          const fn = o.key.replace(`scripts/${gid}/`, "");
          const id = fn.replace(".json", "");
          return { id, title: id, filename: fn, type: "json", size: o.size || 0, visibility: "private", uploaded_at: "" };
        });
        return corsResponse(request, jsonResponse({ scripts: [...data.scripts, ...r2Only] }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ scripts: [], error: String(e) }, 500));
      }
    }

    // ★ 会場マスター
    if (path === "/api/venues") {
      const venues = [
        { id: "kabukiza",  name: "歌舞伎座",   group: "大歌舞伎" },
        { id: "shinbashi", name: "新橋演舞場", group: "大歌舞伎" },
        { id: "osaka",     name: "大阪松竹座", group: "大歌舞伎" },
        { id: "kyoto",     name: "南座",       group: "大歌舞伎" },
        { id: "nagoya",    name: "御園座",     group: "大歌舞伎" },
        { id: "hakataza",  name: "博多座",     group: "大歌舞伎" },
        { id: "kera",      name: "気良座",     group: "地歌舞伎" },
      ];
      return corsResponse(request, jsonResponse(venues));
    }

    if (path === "/api/enmoku/catalog") {
      try {
        if (!globalThis.__enhancedCatalogCache) {
          const catalog = await loadEnmokuCatalog(env);
          const enhanced = await Promise.all((catalog || []).map(async (entry) => {
            try {
              const data = await loadEnmokuJson(env, entry.id);
              if (!data) return entry;
              return {
                ...entry,
                aliases: data.aliases || [],
                cast_names: (data.cast || []).map(c => ({ name: c.name, id: c.id }))
              };
            } catch { return entry; }
          }));
          globalThis.__enhancedCatalogCache = enhanced;
        }
        return corsResponse(request, jsonResponse(globalThis.__enhancedCatalogCache));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    if (path.startsWith("/api/enmoku/")) {
      const rawId = path.replace("/api/enmoku/", "").split("?")[0].trim();
      const id = rawId ? decodeURIComponent(rawId) : "";
      if (id && id !== "catalog") {
        try {
          let data = await loadEnmokuJson(env, id);
          if (!data) {
            const aliasKey = ENMOKU_ALIAS[id];
            if (aliasKey) data = await loadEnmokuJson(env, aliasKey);
          }
          if (!data) {
            const catalog = await loadEnmokuCatalog(env);
            const entry = Array.isArray(catalog) && catalog.find(
              (c) => c.id === id || String(c.short || "") === String(id) || String(c.full || "") === String(id)
            );
            if (entry) {
              data = await loadEnmokuJson(env, entry.key) || await loadEnmokuJson(env, entry.short) || await loadEnmokuJson(env, entry.full);
            }
          }
          if (!data) return corsResponse(request, jsonResponse({ error: "not found" }, 404));
          return corsResponse(request, jsonResponse(data));
        } catch (e) {
          return corsResponse(request, jsonResponse({ error: String(e) }, 500));
        }
      }
    }

    if (path === "/api/actors") {
      try {
        if (!globalThis.__actorsCache) {
          const obj = await env.CONTENT_BUCKET.get("actors.json");
          if (!obj) return corsResponse(request, jsonResponse({ error: "not found" }, 404));
          globalThis.__actorsCache = await obj.json();
        }
        return corsResponse(request, jsonResponse(globalThis.__actorsCache));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    if (path === "/api/glossary") {
      try {
        const obj = await env.CONTENT_BUCKET.get("glossary.json");
        if (!obj) return corsResponse(request, jsonResponse({ error: "not found" }, 404));
        const data = await obj.json();
        return corsResponse(request, jsonResponse(data));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    if (path === "/api/recommend") {
      try {
        const obj = await env.CONTENT_BUCKET.get("recommend.json");
        if (!obj) return corsResponse(request, jsonResponse({ error: "not found" }, 404));
        const data = await obj.json();
        return corsResponse(request, jsonResponse(data));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    if (path === "/api/quiz") {
      try {
        const obj = await env.QUIZ_BUCKET.get("quizzes.json");
        if (!obj) return corsResponse(request, jsonResponse({ error: "not found" }, 404));
        const data = await obj.json();
        return corsResponse(request, jsonResponse(data));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    if (path === "/api/stories") {
      try {
        const obj = await env.CONTENT_BUCKET.get("stories.json");
        if (!obj) return corsResponse(request, jsonResponse({ error: "not found" }, 404));
        const data = await obj.json();
        return corsResponse(request, jsonResponse(data));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    if (path === "/api/talk") {
      try {
        const { topics, categories } = await loadTalkData(env);
        return corsResponse(request, jsonResponse({ topics: topics || [], categories: categories || [] }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    // ★ テスト用: 手動ニュース取得（初回データ投入用）
    if (path === "/api/news-fetch") {
      try {
        const articles = await fetchAndCacheNews(env);
        return corsResponse(request, jsonResponse({ ok: true, count: articles.length }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ ok: false, error: String(e) }, 500));
      }
    }

    // ★ 推し俳優の過去ニュース検索
    if (path === "/api/news-search") {
      try {
        const url = new URL(request.url);
        const actor = url.searchParams.get("actor");
        const months = parseInt(url.searchParams.get("months") || "6", 10);
        if (!actor) {
          return corsResponse(request, jsonResponse({ error: "actor parameter required" }, 400));
        }
        const articles = await searchActorNews(actor, months);
        return corsResponse(request, jsonResponse({ articles, actor, months }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ articles: [], error: String(e) }, 500));
      }
    }

    // ★ テスト用: 半年分バックフィル
    if (path === "/api/news-backfill") {
      try {
        const result = await backfillNews(env);
        return corsResponse(request, jsonResponse({ ok: true, ...result }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ ok: false, error: String(e) }, 500));
      }
    }

    /* =====================================================
       1) LINE webhook（署名検証あり）
    ===================================================== */
    if (path === "/line") {
      if (request.method !== "POST") return new Response("OK", { status: 200 });

      const bodyText = await request.text();

      // 署名検証
      const signature = request.headers.get("x-line-signature") || "";
      const ok = await verifyLineSignature(env.LINE_CHANNEL_SECRET, bodyText, signature);
      if (!ok) return new Response("Bad signature", { status: 401 });

      let body;
      try {
        body = JSON.parse(bodyText);
      } catch (e) {
        console.log("JSON parse error:", String(e));
        return new Response("Bad Request", { status: 400 });
      }

      const events = body.events || [];
      ctx.waitUntil(Promise.all(events.map(e => handleEvent(e, env, ctx))));

      return new Response("OK", { status: 200 });
    }

    /* =====================================================
       2) Web埋め込みAPI（署名検証なし）
    ===================================================== */
    if (path === "/web") {
      if (request.method !== "POST") {
        return corsResponse(request, new Response("OK", { status: 200 }));
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return corsResponse(request, jsonResponse({ error: "Bad JSON" }, 400));
      }

      const { message, session_id } = body || {};
      const text = (message || "").toString().trim();
      const sid = (session_id || "").toString().trim();

      if (!text) {
        return corsResponse(
          request,
          jsonResponse({ reply: "メッセージが空だよ🙂", session_id: sid || null })
        );
      }

      const sourceKey = sid ? `web:${sid}` : "web:anon";
      const modeKey = `mode:${sourceKey}`;
      let mode = await env.CHAT_HISTORY.get(modeKey);

      console.log("WEB IN:", { sourceKey, text, mode });

      // ===== Web postback（フロントからのボタンアクション）=====
      if (text.startsWith("postback:")) {
        const pbData = text.substring("postback:".length);
        const result = await handleWebPostback(env, sourceKey, pbData);
        return corsResponse(
          request,
          jsonResponse({ ...result, session_id: sid || null })
        );
      }

      // メニュー（"メニュー" / "menu"）
      if (isMenuCommand(text)) {
        await env.CHAT_HISTORY.delete(modeKey);
        await env.CHAT_HISTORY.delete(`enmoku:${sourceKey}`);
        await env.CHAT_HISTORY.delete(`laststep:${sourceKey}`);

        const trainingUrl = url.origin + "/training";
        return corsResponse(
          request,
          jsonResponse({ reply: menuText(), session_id: sid || null, ui: webMenuUI(trainingUrl) })
        );
      }

      // ナビホーム（"0" / "戻る"）
      if (isNaviHomeCommand(text)) {
        await env.CHAT_HISTORY.delete(`laststep:${sourceKey}`);
        const trainingUrl = url.origin + "/training";
        return corsResponse(
          request,
          jsonResponse({ ...naviHomeWeb(trainingUrl), session_id: sid || null })
        );
      }

      // ひとつ戻る（"9"）
      if (isBackCommand(text)) {
        const lastStep = await env.CHAT_HISTORY.get(`laststep:${sourceKey}`);
        const backPb = computeNavBack(lastStep);
        const bp = parsePostback(backPb);
        if (bp.step === "navi_home" || !bp.step) {
          await env.CHAT_HISTORY.delete(`laststep:${sourceKey}`);
          const trainingUrl2 = url.origin + "/training";
          return corsResponse(request, jsonResponse({ ...naviHomeWeb(trainingUrl2), session_id: sid || null }));
        }
        // 戻った先を laststep に更新
        await env.CHAT_HISTORY.put(`laststep:${sourceKey}`, backPb);
        const result = await handleWebPostback(env, sourceKey, backPb);
        return corsResponse(request, jsonResponse({ ...result, session_id: sid || null }));
      }

      // ニュース
      if (/ニュース/.test(text)) {
        const html = await newsWebHTML(env);
        return corsResponse(
          request,
          jsonResponse({
            reply: html, isHTML: true, session_id: sid || null,
            ui: { type: "nav_buttons", items: [{ label: "🧭 ナビ", action: "postback:step=navi_home" }] }
          })
        );
      }

      // mode未選択：数字で選ばせる
      if (!mode) {
        const selected = normalizeModeSelection(text);
        if (selected) {
          if (selected === "news") {
            const html = await newsWebHTML(env);
            return corsResponse(
              request,
              jsonResponse({ reply: html, isHTML: true, session_id: sid || null, ui: { type: "nav_buttons", items: [{ label: "🧭 ナビ", action: "postback:step=navi_home" }] } })
            );
          }
          mode = selected;
          await env.CHAT_HISTORY.put(modeKey, mode);

          const initResult = await getWebModeInit(env, mode, sourceKey);
          return corsResponse(
            request,
            jsonResponse({ ...initResult, session_id: sid || null, mode })
          );
        }
        const trainingUrl2 = url.origin + "/training";
        return corsResponse(
          request,
          jsonResponse({ reply: menuText(), session_id: sid || null, ui: webMenuUI(trainingUrl2) })
        );
      }

      // 例（ヘルプ）
      if (isHelpCommand(text)) {
        return corsResponse(
          request,
          jsonResponse({ reply: exampleTextForMode(mode), session_id: sid || null, mode })
        );
      }

      // ★ クイズ中は「モード切替」より先に処理
      if (mode === "quiz") {
        const t = toHalfWidthDigits(text).trim();
        if (t === "5") {
          return corsResponse(
            request,
            jsonResponse({ reply: quizIntroText(), session_id: sid || null, mode })
          );
        }

        const out = await handleQuizMessage(env, sourceKey, text, toHalfWidthDigits, { channel: "web" });

        if (typeof out === "string") {
          return corsResponse(request, jsonResponse({ reply: out, session_id: sid || null, mode }));
        }
        const judge = out?.judge || "OK🙂";
        return corsResponse(request, jsonResponse({ reply: judge, session_id: sid || null, mode }));
      }

      // モード切替（クイズ以外）
      const selectedAnytime = normalizeModeSelection(text);
      if (selectedAnytime) {
        if (selectedAnytime === "news") {
          const html = await newsWebHTML(env);
          return corsResponse(
            request,
            jsonResponse({ reply: html, isHTML: true, session_id: sid || null, ui: { type: "nav_buttons", items: [{ label: "🧭 ナビ", action: "postback:step=navi_home" }] } })
          );
        }
        mode = selectedAnytime;
        await env.CHAT_HISTORY.put(modeKey, mode);

        const initResult = await getWebModeInit(env, mode, sourceKey);
        return corsResponse(
          request,
          jsonResponse({ ...initResult, session_id: sid || null, mode })
        );
      }

      // 迷ってそうなら例を出す
      if (looksLost(text)) {
        if (mode === "kera") {
          return corsResponse(
            request,
            jsonResponse({
              reply: `気良歌舞伎ナビ🙂\nカテゴリから選んでね！`,
              session_id: sid || null,
              mode,
              ui: {
                type: "buttons",
                items: [
                  { label: "📁 カテゴリから選ぶ", action: "postback:step=talk_list" }
                ],
                footer: [{ label: "🧭 ナビ", action: "postback:step=navi_home" }]
              }
            })
          );
        }

        return corsResponse(
          request,
          jsonResponse({ reply: exampleTextForMode(mode), session_id: sid || null, mode })
        );
      }

      // ★ kera（FAQ）モード：R2 topics を検索 → miss ならローカルフォールバック
      if (mode === "kera") {
        const topics = await loadTalkTopics(env);
        const hit = findTalkTopic(topics, text);

        if (hit) {
          // WebはカードUIで返しつつ、カテゴリ/一覧へ戻れる導線
          const cat = String(hit.category || "").trim();
          return corsResponse(request, jsonResponse({
            reply: "",
            session_id: sid || null,
            mode,
            ui: {
              type: "card",
              title: hit.label || hit.question || "回答",
              subtitle: cat ? `📁 ${cat}` : "🎭 気良歌舞伎ナビ",
              body: hit.answer || "",
              items: [
                ...(cat ? [{ label: `${cat}に戻る`, action: `postback:step=talk_cat&cat=${encodeURIComponent(cat)}&page=1` }] : []),
                { label: "カテゴリ一覧", action: "postback:step=talk_list" },
                { label: "🧭 ナビ", action: "postback:step=navi_home" }
              ]
            }
          }));
        }

        // FAQ miss → ローカルフォールバック（NAVI/DOJOへ誘導）
        {
          const fallback = "その質問はまだカバーできていないよ🙏\n"
            + "NAVIで演目や用語を調べてみてね！\n"
            + "👉 https://kerakabuki.kerakabuki.workers.dev/navi";

          return corsResponse(request, jsonResponse({
            reply: fallback,
            session_id: sid || null,
            mode,
            ui: {
              type: "nav_buttons",
              items: [
                { label: "カテゴリ一覧", action: "postback:step=talk_list" },
                { label: "🧭 ナビ", action: "postback:step=navi_home" }
              ]
            }
          }));
        }
      }

      // 用語モード：R2から直接検索（Web版はテキストで返す）
      if (mode === "general") {
        const glossary = await loadGlossary(env);
        const results = searchGlossary(glossary, text);

        if (results.length > 0) {
          if (results.length === 1) {
            const top = results[0];
            return corsResponse(request, jsonResponse({
              reply: "",
              session_id: sid || null,
              mode,
              ui: {
                type: "card",
                title: top.term,
                subtitle: top.category,
                body: top.desc,
                items: [
                  { label: "カテゴリ一覧", action: "postback:step=glossary_cat" },
                  { label: "🧭 ナビ", action: "postback:step=navi_home" }
                ]
              }
            }));
          }

          return corsResponse(request, jsonResponse({
            reply: `「${text}」の検索結果（${results.length}件）`,
            session_id: sid || null,
            mode,
            ui: {
              type: "buttons",
              items: results.slice(0, 10).map(t => ({
                label: t.term,
                action: `postback:step=glossary_term&id=${encodeURIComponent(t.id)}`
              })),
              footer: [
                { label: "カテゴリ一覧", action: "postback:step=glossary_cat" },
                { label: "🧭 ナビ", action: "postback:step=navi_home" }
              ]
            }
          }));
        }

        return corsResponse(request, jsonResponse({
          reply: `「${text}」に該当する用語が見つからなかったよ🙏\n用語名やよみがなで検索してみてね。`,
          session_id: sid || null,
          mode,
          ui: {
            type: "nav_buttons",
            items: [
              { label: "カテゴリ一覧", action: "postback:step=glossary_cat" },
              { label: "🧭 ナビ", action: "postback:step=navi_home" }
            ]
          }
        }));
      }

      // おすすめモード：R2から直接検索（Web版はテキストで返す）
      if (mode === "recommend") {
        const recData = await loadRecommend(env);
        const results = searchRecommend(recData.faqs, text);

        if (results.length > 0) {
          const top = results[0];
          const reply = `Q: ${top.question}\n\n${top.answer}`;

          const vids = recData.videos || {};
          const links = (top.enmoku || []).filter(e => vids[e]).map(e => vids[e]);

          return corsResponse(request, jsonResponse({
            reply,
            session_id: sid || null,
            mode,
            ui: {
              type: "detail",
              videos: links.slice(0, 3).map(v => ({ title: v.title, url: v.url })),
              footer: [
                { label: "おすすめ一覧", action: "postback:step=recommend_list" },
                { label: "🧭 ナビ", action: "postback:step=navi_home" }
              ]
            }
          }));
        }

        return corsResponse(request, jsonResponse({
          reply: `おすすめの聞き方はこんな感じ🙂\n（例）\n・初心者におすすめは？\n・泣ける演目は？`,
          session_id: sid || null,
          mode,
          ui: {
            type: "nav_buttons",
            items: [
              { label: "おすすめ一覧", action: "postback:step=recommend_list" },
              { label: "🧭 ナビ", action: "postback:step=navi_home" }
            ]
          }
        }));
      }

      // ローカルフォールバック（R2データ外のテキスト → NAVIへ誘導）
      {
        const base = "その質問にはまだ対応できていないよ🙏\n"
          + "演目や用語はNAVIで調べてみてね！\n"
          + "👉 https://kerakabuki.kerakabuki.workers.dev/navi";

        const uiNav = (mode === "performance") ? {
          type: "nav_buttons",
          items: [
            { label: "演目一覧", action: "postback:step=enmoku_list" },
            { label: "🧭 ナビ", action: "postback:step=navi_home" }
          ]
        } : {
          type: "nav_buttons",
          items: [
            { label: "🧭 ナビ", action: "postback:step=navi_home" },
            { label: "🥋 DOJO", action: "uri:https://kerakabuki.kerakabuki.workers.dev/dojo" }
          ]
        };

        return corsResponse(
          request,
          jsonResponse({ reply: base, session_id: sid || null, mode, ui: uiNav })
        );
      }
    }

    /* =====================================================
       3) その他（ヘルスチェック）
    ===================================================== */
    return new Response("OK", { status: 200 });
  },

  // ── Cron Trigger: ニュース＋公演情報の自動取得 ──
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      Promise.all([
        fetchAndCacheNews(env),
        refreshPerformancesCache(env),
      ])
    );
  },
};

/* =========================================================
   CORS
========================================================= */
function corsResponse(request, res) {
  const h = new Headers(res.headers);
  const origin = request.headers.get("Origin") || "";

  const ALLOW = new Set([
    "https://kerakabuki.jimdofree.com",
    "https://cms.e.jimdo.com"
    // "http://localhost:5173"
  ]);

  if (ALLOW.has(origin)) {
    h.set("Access-Control-Allow-Origin", origin);
    h.set("Vary", "Origin");
  }

  h.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  h.set("Access-Control-Allow-Headers", "Content-Type");
  h.set("Access-Control-Max-Age", "86400");

  return new Response(res.body, { status: res.status, headers: h });
}

/* =========================================================
   JSON helper
========================================================= */
function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

/* =========================================================
   LINE handler
========================================================= */
async function handleEvent(event, env, ctx) {
  try {
    const replyToken = event.replyToken;
    const { sourceKey, userId, destId } = extractSource(event);
    if (!replyToken) return;

    const modeKey = `mode:${sourceKey}`;
    const enmokuKey = `enmoku:${sourceKey}`;
    let mode = await env.CHAT_HISTORY.get(modeKey);

    // -------------------------
    // ① postback を先に処理
    // -------------------------
    if (event.type === "postback") {
      const data = String(event.postback?.data ?? "").trim();
      const p = parsePostback(data);

      console.log("POSTBACK parsed:", JSON.stringify(p), "raw data:", JSON.stringify(data));

      // ガード: data が空または解析不能なときだけデフォルトでメニューを表示
      const hasKnownAction = p.step != null || p.mode != null || p.quiz != null || /^(mode|step|quiz)=/.test(data);
      if (!data || !hasKnownAction) {
        await respondLineMessages(env, replyToken, destId, [mainMenuFlex(env, env._origin)]);
        return;
      }

      // step=menu のみ：メニュー表示（明示的なメニュー戻り）
      if (p.step === "menu") {
        await env.CHAT_HISTORY.delete(modeKey);
        await env.CHAT_HISTORY.delete(enmokuKey);
        await env.CHAT_HISTORY.delete(`laststep:${sourceKey}`);
        await respondLineMessages(env, replyToken, destId, [mainMenuFlex(env, env._origin)]);
        return;
      }

      // step=navi_home：歌舞伎ナビホーム
      if (p.step === "navi_home") {
        await env.CHAT_HISTORY.delete(`laststep:${sourceKey}`);
        await respondLineMessages(env, replyToken, destId, [naviHomeFlex(env, env._origin)]);
        return;
      }

      // step=mypage：マイページ
      if (p.step === "mypage") {
        const log = await loadLog(env, sourceKey);
        const qst = await loadQuizState(env, userId || sourceKey);
        await respondLineMessages(env, replyToken, destId, [myPageFlex(log, qst)]);
        return;
      }

      // step=clip_toggle：クリップ ON/OFF
      if (p.step === "clip_toggle") {
        const clipType = (p.type || "").trim();
        const clipId = decodeURIComponent(p.id || "");
        const clipParent = decodeURIComponent(p.parent || "");
        const clipTitle = decodeURIComponent(p.title || "");
        if (clipType && clipId) {
          const { clipped } = await toggleClip(env, sourceKey, clipType, clipId, { parent: clipParent, title: clipTitle });
          const msg = clipped ? "⭐ クリップしたよ！" : "クリップを外したよ";
          await respondLine(env, replyToken, destId, msg);
        } else {
          await respondLine(env, replyToken, destId, "クリップ操作に失敗したよ🙏");
        }
        return;
      }

      // ★ 歌舞伎ログ: サブステップハンドラ（LINE）
      if (p.step === "log_recent_list") {
        const log = await loadLog(env, sourceKey);
        const page = parseInt(p.page || "1", 10) || 1;
        await respondLineMessages(env, replyToken, destId, [recentListFlex(log, page)]);
        return;
      }
      if (p.step === "log_recent_clear") {
        await clearRecent(env, sourceKey);
        await respondLine(env, replyToken, destId, "🗑 履歴をクリアしたよ！");
        return;
      }
      if (p.step === "log_clips_menu") {
        const log = await loadLog(env, sourceKey);
        await respondLineMessages(env, replyToken, destId, [clipsMenuFlex(log)]);
        return;
      }
      if (p.step === "log_clips_list") {
        const clipType = (p.type || "").trim();
        const log = await loadLog(env, sourceKey);
        const items = await resolveClipItems(env, log, clipType);
        const { name, icon } = clipTypeLabel(clipType);
        await respondLineMessages(env, replyToken, destId, [clipsListFlex(items, name, icon)]);
        return;
      }
      if (p.step === "log_quiz_review") {
        const qst = await loadQuizState(env, userId || sourceKey);
        await respondLineMessages(env, replyToken, destId, [quizReviewFlex(qst)]);
        return;
      }

      // laststep を保存（ナビゲーション用、menu/navi_home以外）
      if (p.step && p.step !== "menu" && p.step !== "navi_home") {
        await env.CHAT_HISTORY.put(`laststep:${sourceKey}`, data);
      }

      // step=news：歌舞伎ニュース
      if (p.step === "news") {
        const msg = await newsFlexMessage(env);
        await respondLineMessages(env, replyToken, destId, [msg]);
        return;
      }

      // mode= のみの postback（ナビ・おすすめ等）→ R2 専用 Flex を直接返す。
      const modeVal = (p.mode || (data.match(/mode=([^&]+)/) || [])[1] || "").trim();
      if (modeVal && !p.step) {
        try {
          await env.CHAT_HISTORY.put(modeKey, modeVal);
          console.log("LINE postback mode=", modeVal, "CONTENT_BUCKET?", !!env?.CONTENT_BUCKET, "ENMOKU_BUCKET?", !!env?.ENMOKU_BUCKET);

          if (modeVal === "kera") {
            const topics = await loadTalkTopics(env);
            console.log("kera topics loaded:", topics?.length || 0);
            await respondLineMessages(env, replyToken, destId, [talkMenuFlex(topics, 1)]);
            return;
          }
          if (modeVal === "recommend") {
            const recData = await loadRecommend(env);
            console.log("recommend loaded:", recData?.faqs?.length || 0);
            await respondLineMessages(env, replyToken, destId, [recommendListFlex(recData.faqs)]);
            return;
          }
          if (modeVal === "performance") {
            await respondLineMessages(env, replyToken, destId, [await enmokuListFlex(env)]);
            return;
          }
          if (modeVal === "general") {
            const glossary = await loadGlossary(env);
            console.log("glossary loaded:", glossary?.length || 0);
            await respondLineMessages(env, replyToken, destId, [glossaryCategoryFlex(glossary)]);
            return;
          }
          if (modeVal === "quiz") {
            const qst = await loadQuizState(env, userId || sourceKey);
            const introText = qst.answered_total > 0
              ? quizIntroText("line") + `\n\n📊 前回の成績：${qst.correct_total}/${qst.answered_total}問正解`
              : quizIntroText("line");
            await respondLineMessages(env, replyToken, destId, [
              { type: "text", text: introText, quickReply: startQuickReplyForMode("quiz", qst) }
            ]);
            return;
          }
          if (modeVal === "news") {
            const msg = await newsFlexMessage(env);
            await respondLineMessages(env, replyToken, destId, [msg]);
            return;
          }
          await respondLine(env, replyToken, destId, exampleTextForMode(modeVal, "line"));
          return;
        } catch (err) {
          console.error("LINE postback mode=" + modeVal + " error:", String(err?.stack || err));
          // エラー時もLINEに何か返す（無応答を防ぐ）
          await respondLine(env, replyToken, destId,
            `ごめん、${modeVal === "kera" ? "ナビ" : modeVal === "recommend" ? "おすすめ" : modeVal}の読み込みでエラーが起きたよ🙏\nもう一度試してみてね。`
          );
          return;
        }
      }

      // step がある場合（talk_*, recommend_*, glossary_*, enmoku 等）
      if (p.step) {

        // ★ 追加：talk（kera FAQ）
        if (p.step.startsWith("talk_")) {
          await env.CHAT_HISTORY.put(modeKey, "kera");
          const topics = await loadTalkTopics(env);

          // 1) カテゴリ一覧
          if (p.step === "talk_list") {
            await respondLineMessages(env, replyToken, destId, [talkMenuFlex(topics, 1)]);
            return;
          }

          // 2) カテゴリ内
          if (p.step === "talk_cat") {
            const cat = decodeURIComponent(p.cat || "");
            const page = parseInt(p.page || "1", 10) || 1;
            await respondLineMessages(env, replyToken, destId, [talkMenuFlex(topics, page, { cat })]);
            return;
          }

          // 3) 回答
          if (p.step === "talk_detail") {
            const id = decodeURIComponent(p.id || "");
            const topic = topics.find(t => t.id === id);
            if (topic) {
              await respondLineMessages(env, replyToken, destId, [talkAnswerFlex(topic)]);
            } else {
              await respondLineMessages(env, replyToken, destId, [
                { type: "text", text: "該当する項目が見つからなかったよ🙏" },
                talkMenuFlex(topics, 1)
              ]);
            }
            return;
          }
        }

        // おすすめ（recommend_*）
        if (p.step.startsWith("recommend_")) {
          const recData = await loadRecommend(env);
          let msg;
          if (p.step === "recommend_list") {
            msg = recommendListFlex(recData.faqs);
          } else if (p.step === "recommend_detail") {
            const id = decodeURIComponent(p.id || "");
            const faq = recData.faqs.find(f => f.id === id);
            msg = faq
              ? recommendDetailFlex(faq, recData)
              : { type: "text", text: "該当するおすすめが見つからなかったよ🙏" };
          }
          if (msg) await respondLineMessages(env, replyToken, destId, [msg]);
          return;
        }

        // 用語（glossary_*）
        if (p.step.startsWith("glossary_")) {
          const glossary = await loadGlossary(env);
          let msg;
          if (p.step === "glossary_cat") {
            msg = glossaryCategoryFlex(glossary);
          } else if (p.step === "glossary_list") {
            const cat = decodeURIComponent(p.cat || "");
            msg = glossaryTermListFlex(glossary, cat);
          } else if (p.step === "glossary_term") {
            const id = decodeURIComponent(p.id || "");
            const term = glossary.find(t => t.id === id);
            if (term) {
              // ★ 歌舞伎ログ: 用語閲覧を記録
              appendRecent(env, sourceKey, { type: "term", id, title: term.term }).catch(() => {});
            }
            msg = term
              ? glossaryTermDetailFlex(term)
              : { type: "text", text: "該当する用語が見つからなかったよ🙏" };
          }
          if (msg) await respondLineMessages(env, replyToken, destId, [msg]);
          return;
        }

        // 演目ガイド（既存）
        const out = await handleEnmokuGuidePostback(env, sourceKey, p);
        if (out?.messages?.length) {
          await respondLineMessages(env, replyToken, destId, out.messages);
        } else if (out?.text) {
          await respondLine(env, replyToken, destId, out.text);
        } else {
          await respondLine(env, replyToken, destId, "ごめん、うまく処理できなかったよ🙏");
        }
        return;
      }

      // mode=... を受け取る（ナビ・おすすめ等のボタン: p.mode または data から取得）
      const mm = data.match(/(?:^|&)mode=([^&]+)/);
      const pickedMode = p.mode || (mm && mm[1] ? decodeURIComponent(mm[1]) : null);

      // ★ クイズ用postback（Quick Reply）
      const qm = data.match(/(?:^|&)quiz=([^&]+)/);
      if (qm) {
        const quizInput = decodeURIComponent(qm[1]);

        // 0=メニュー
        if (quizInput === "0") {
          await env.CHAT_HISTORY.delete(modeKey);
          await respondLineMessages(env, replyToken, destId, [mainMenuFlex(env, env._origin)]);
          return;
        }

        const out = await handleQuizMessage(
          env,
          userId || sourceKey,
          quizInput,
          toHalfWidthDigits,
          { channel: "line" }
        );

        if (out?.messages && Array.isArray(out.messages)) {
          const msgs = [...out.messages];
          if (out.quickReply && msgs.length > 0) msgs[msgs.length - 1].quickReply = out.quickReply;
          await respondLineMessages(env, replyToken, destId, msgs);
          return;
        }

        if (out?.text && out?.quickReply) {
          await respondLineMessages(env, replyToken, destId, [{
            type: "text",
            text: out.text,
            quickReply: out.quickReply
          }]);
          return;
        }

        if (typeof out === "string") {
          await respondLine(env, replyToken, destId, out);
          return;
        }

        await respondLine(env, replyToken, destId, out?.judge || "OK🙂");
        return;
      }

      if (pickedMode) {
        const picked = typeof pickedMode === "string" ? pickedMode.trim() : "";

        if (picked === "news") {
          const msg = await newsFlexMessage(env);
          await respondLineMessages(env, replyToken, destId, [msg]);
          return;
        }

        mode = picked;
        await env.CHAT_HISTORY.put(modeKey, mode);

        // ★ kera は FAQメニューを返す
        if (mode === "kera") {
          const topics = await loadTalkTopics(env);
          await respondLineMessages(env, replyToken, destId, [talkMenuFlex(topics, 1)]);
          return;
        }

        if (mode === "performance") {
          await respondLineMessages(env, replyToken, destId, [await enmokuListFlex(env)]);
          return;
        }

        if (mode === "general") {
          const glossary = await loadGlossary(env);
          await respondLineMessages(env, replyToken, destId, [glossaryCategoryFlex(glossary)]);
          return;
        }

        if (mode === "recommend") {
          const recData = await loadRecommend(env);
          await respondLineMessages(env, replyToken, destId, [recommendListFlex(recData.faqs)]);
          return;
        }

        if (mode === "quiz") {
          const qst = await loadQuizState(env, userId || sourceKey);
          const introText = qst.answered_total > 0
            ? quizIntroText("line") + `\n\n📊 前回の成績：${qst.correct_total}/${qst.answered_total}問正解`
            : quizIntroText("line");
          await respondLineMessages(env, replyToken, destId, [
            { type: "text", text: introText, quickReply: startQuickReplyForMode("quiz", qst) }
          ]);
          return;
        }

        const reply = exampleTextForMode(mode, "line");
        await respondLine(env, replyToken, destId, reply);
        return;
      }

      // ここに到達した = 解析はできたがどの分岐にも一致しなかった → デフォルトでメニューのみ表示
      console.log("POSTBACK unhandled branch:", { sourceKey, data, p: JSON.stringify(p) });
      await respondLineMessages(env, replyToken, destId, [mainMenuFlex(env, env._origin)]);
      return;
    }

    // -------------------------
    // ② message(text)
    // -------------------------
    if (event.type !== "message") return;
    if (event.message?.type !== "text") return;

    const text = (event.message?.text || "").trim();
    console.log("IN:", { sourceKey, userId, destId, text, mode });

    // メニュー（"メニュー" / "menu"）
    if (isMenuCommand(text)) {
      await env.CHAT_HISTORY.delete(modeKey);
      await env.CHAT_HISTORY.delete(enmokuKey);
      await env.CHAT_HISTORY.delete(`laststep:${sourceKey}`);
      await respondLineMessages(env, replyToken, destId, [mainMenuFlex(env, env._origin)]);
      return;
    }

    // ナビホーム（"0" / "戻る"）
    if (isNaviHomeCommand(text)) {
      await env.CHAT_HISTORY.delete(`laststep:${sourceKey}`);
      await respondLineMessages(env, replyToken, destId, [naviHomeFlex(env, env._origin)]);
      return;
    }

    // ひとつ戻る（"9"）
    if (isBackCommand(text)) {
      await handleLineBack(env, sourceKey, userId, replyToken, destId);
      return;
    }

    // ニュース（テキスト「ニュース」でも反応）
    if (/ニュース/.test(text)) {
      const msg = await newsFlexMessage(env);
      await respondLineMessages(env, replyToken, destId, [msg]);
      return;
    }

    // mode未選択：数字で選ばせる
    if (!mode) {
      const selected = normalizeModeSelection(text);
      if (selected) {
        if (selected === "news") {
          const msg = await newsFlexMessage(env);
          await respondLineMessages(env, replyToken, destId, [msg]);
          return;
        }
        mode = selected;
        await env.CHAT_HISTORY.put(modeKey, mode);

        // ★ kera はFAQメニュー
        if (mode === "kera") {
          const topics = await loadTalkTopics(env);
          await respondLineMessages(env, replyToken, destId, [talkMenuFlex(topics, 1)]);
          return;
        }

        if (mode === "performance") {
          await respondLineMessages(env, replyToken, destId, [await enmokuListFlex(env)]);
          return;
        }
        if (mode === "general") {
          const glossary = await loadGlossary(env);
          await respondLineMessages(env, replyToken, destId, [glossaryCategoryFlex(glossary)]);
          return;
        }
        if (mode === "recommend") {
          const recData = await loadRecommend(env);
          await respondLineMessages(env, replyToken, destId, [recommendListFlex(recData.faqs)]);
          return;
        }
        if (mode === "quiz") {
          const qst = await loadQuizState(env, userId || sourceKey);
          const introText = qst.answered_total > 0
            ? quizIntroText("line") + `\n\n📊 前回の成績：${qst.correct_total}/${qst.answered_total}問正解`
            : quizIntroText("line");
          await respondLineMessages(env, replyToken, destId, [
            { type: "text", text: introText, quickReply: startQuickReplyForMode("quiz", qst) }
          ]);
          return;
        }

        await respondLine(env, replyToken, destId, exampleTextForMode(mode, "line"));
        return;
      }

      await respondLineMessages(env, replyToken, destId, [mainMenuFlex(env, env._origin)]);
      return;
    }

    // 例（ヘルプ）
    if (isHelpCommand(text)) {
      if (mode === "kera") {
        const topics = await loadTalkTopics(env);
        await respondLineMessages(env, replyToken, destId, [talkMenuFlex(topics, 1)]);
        return;
      }
      await respondLine(env, replyToken, destId, exampleTextForMode(mode, "line"));
      return;
    }

    // クイズ中
    if (mode === "quiz") {
      const t = toHalfWidthDigits(text).trim();
      if (t === "5") {
        const qst = await loadQuizState(env, userId || sourceKey);
        const introText = qst.answered_total > 0
          ? quizIntroText("line") + `\n\n📊 前回の成績：${qst.correct_total}/${qst.answered_total}問正解`
          : quizIntroText("line");
        await respondLineMessages(env, replyToken, destId, [
          { type: "text", text: introText, quickReply: startQuickReplyForMode("quiz", qst) }
        ]);
        return;
      }

      const out = await handleQuizMessage(env, userId || sourceKey, text, toHalfWidthDigits, { channel: "line" });

      if (out?.messages && Array.isArray(out.messages)) {
        const msgs = [...out.messages];
        if (out.quickReply && msgs.length > 0) msgs[msgs.length - 1].quickReply = out.quickReply;
        await respondLineMessages(env, replyToken, destId, msgs);
        return;
      }

      if (out?.text && out?.quickReply) {
        await respondLineMessages(env, replyToken, destId, [{
          type: "text",
          text: out.text,
          quickReply: out.quickReply
        }]);
        return;
      }

      if (typeof out === "string") {
        await respondLine(env, replyToken, destId, out);
        return;
      }

      await respondLine(env, replyToken, destId, out?.judge || "OK🙂");
      return;
    }

    // モード切替（クイズ以外）
    const selectedAnytime = normalizeModeSelection(text);
    if (selectedAnytime) {
      if (selectedAnytime === "news") {
        const msg = await newsFlexMessage(env);
        await respondLineMessages(env, replyToken, destId, [msg]);
        return;
      }
      mode = selectedAnytime;
      await env.CHAT_HISTORY.put(modeKey, mode);

      if (mode === "kera") {
        const topics = await loadTalkTopics(env);
        await respondLineMessages(env, replyToken, destId, [talkMenuFlex(topics, 1)]);
        return;
      }

      if (mode === "performance") {
        await respondLineMessages(env, replyToken, destId, [await enmokuListFlex(env)]);
        return;
      }
      if (mode === "general") {
        const glossary = await loadGlossary(env);
        await respondLineMessages(env, replyToken, destId, [glossaryCategoryFlex(glossary)]);
        return;
      }
      if (mode === "recommend") {
        const recData = await loadRecommend(env);
        await respondLineMessages(env, replyToken, destId, [recommendListFlex(recData.faqs)]);
        return;
      }
      if (mode === "quiz") {
        const qst = await loadQuizState(env, userId || sourceKey);
        const introText = qst.answered_total > 0
          ? quizIntroText("line") + `\n\n📊 前回の成績：${qst.correct_total}/${qst.answered_total}問正解`
          : quizIntroText("line");
        await respondLineMessages(env, replyToken, destId, [
          { type: "text", text: introText, quickReply: startQuickReplyForMode("quiz", qst) }
        ]);
        return;
      }

      await respondLine(env, replyToken, destId, exampleTextForMode(mode, "line"));
      return;
    }

    // 迷ってそうなら例を出す
    if (looksLost(text)) {
      if (mode === "kera") {
        const topics = await loadTalkTopics(env);
        await respondLineMessages(env, replyToken, destId, [talkMenuFlex(topics, 1)]);
      } else if (mode === "general") {
        const glossary = await loadGlossary(env);
        await respondLineMessages(env, replyToken, destId, [glossaryCategoryFlex(glossary)]);
      } else if (mode === "recommend") {
        const recData = await loadRecommend(env);
        await respondLineMessages(env, replyToken, destId, [recommendListFlex(recData.faqs)]);
      } else {
        await respondLine(env, replyToken, destId, exampleTextForMode(mode, "line"));
      }
      return;
    }

    // ★ kera（FAQ）モード：R2直検索 → miss ならローカルフォールバック
    if (mode === "kera") {
      const topics = await loadTalkTopics(env);
      const hit = findTalkTopic(topics, text);

      if (hit) {
        await respondLineMessages(env, replyToken, destId, [talkAnswerFlex(hit)]);
        return;
      }

      // FAQ miss → ローカルフォールバック（NAVIへ誘導）
      await respondLineMessages(env, replyToken, destId, [
        { type: "text", text: "その質問はまだカバーできていないよ🙏\nNAVIで演目や用語を調べてみてね！\n👉 https://kerakabuki.kerakabuki.workers.dev/navi" },
        talkMenuFlex(topics, 1)
      ]);
      return;
    }

    // 用語モード：R2直検索
    if (mode === "general") {
      const glossary = await loadGlossary(env);
      const results = searchGlossary(glossary, text);
      if (results.length > 0) {
        await respondLineMessages(env, replyToken, destId, [glossarySearchResultFlex(results, text)]);
      } else {
        await respondLineMessages(env, replyToken, destId, [{
          type: "text",
          text: `「${text}」に該当する用語が見つからなかったよ🙏\n用語名やよみがなで検索してみてね。`
        }, glossaryCategoryFlex(glossary)]);
      }
      return;
    }

    // おすすめモード：R2直検索
    if (mode === "recommend") {
      const recData = await loadRecommend(env);
      const results = searchRecommend(recData.faqs, text);
      if (results.length > 0) {
        await respondLineMessages(env, replyToken, destId, [recommendDetailFlex(results[0], recData)]);
      } else {
        await respondLineMessages(env, replyToken, destId, [recommendListFlex(recData.faqs)]);
      }
      return;
    }

    // ローカルフォールバック（R2データ外 → NAVIへ誘導）
    {
      const fallbackText = "その質問にはまだ対応できていないよ🙏\n"
        + "演目や用語はNAVIで調べてみてね！\n"
        + "👉 https://kerakabuki.kerakabuki.workers.dev/navi"
        + footerHint(mode, "line");
      await respondLine(env, replyToken, destId, fallbackText);
    }

  } catch (e) {
    console.error("handleEvent exception:", String(e?.stack || e));
    // 外側でキャッチ = どの分岐でも無応答を防ぐ
    try {
      const replyToken = event?.replyToken;
      const destId = (event?.source?.type === "user" ? event?.source?.userId : event?.source?.groupId) || null;
      if (replyToken || destId) {
        await respondLine(env, replyToken, destId, "エラーが発生したよ🙏 もう一度試してね。");
      }
    } catch (_) { /* 最終フォールバック: ここで更にエラーなら諦める */ }
  }
}

/* =========================================================
   Helpers
========================================================= */
function isMenuCommand(text) {
  const t = (text || "").trim();
  return t === "メニュー" || t.toLowerCase() === "menu";
}

function isNaviHomeCommand(text) {
  const t = toHalfWidthDigits((text || "").trim());
  return t === "0" || t === "戻る";
}

function isBackCommand(text) {
  const t = toHalfWidthDigits((text || "").trim());
  return t === "9";
}

function isHelpCommand(text) {
  const t = (text || "").trim();
  const tl = t.toLowerCase();
  return t === "?" || t === "？" || t === "例" || tl === "help";
}

function extractSource(event) {
  const s = event.source || {};
  if (s.type === "user") return { sourceKey: `user:${s.userId}`, userId: s.userId, destId: s.userId };
  if (s.type === "group") return { sourceKey: `group:${s.groupId}`, userId: s.userId || null, destId: s.groupId };
  if (s.type === "room") return { sourceKey: `room:${s.roomId}`, userId: s.userId || null, destId: s.roomId };
  return { sourceKey: "unknown", userId: null, destId: null };
}

function parsePostback(data) {
  const s = (data || "").trim();
  const params = new URLSearchParams(s.startsWith("?") ? s.slice(1) : s);
  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

function modeLabel(mode) {
  return {
    kera: "気良歌舞伎ナビ",
    performance: "演目・人物ガイド",
    general: "用語・演出",
    recommend: "おすすめ",
    quiz: "クイズ"
  }[mode] || "未選択";
}

function footerHint(mode, channel = "web") {
  if (channel === "line") return "";
  const now = modeLabel(mode);
  return mode === "quiz"
    ? `\n\n━━━━━━━━━━━━\nいま：${now}\n0：メニュー　7：次　8：復習　9：リセット`
    : `\n\n━━━━━━━━━━━━\nいま：${now}\n0：メニュー　1〜5：モード切替`;
}

function formatEnmokuSection(title, label, icon, body) {
  const head = `${icon} ${label}\n【${title}】\n━━━━━━━━━━━━\n`;
  return head + (body || "");
}

function menuText() {
  return `こんにちは、けらのすけだよ🙂
なにを知りたい？

1) 気良歌舞伎ナビ
2) 演目・人物ガイド
3) 歌舞伎用語のいろは
4) おすすめ演目
5) 挑戦！歌舞伎クイズ
6) 歌舞伎ニュース

数字（1〜6）で送ってね。
※ 0でいつでもこのメニューに戻れるよ`;
}

/** WEBウィジェット用メニューUI（ボタン付き） */
function webMenuUI(trainingUrl) {
  return {
    type: "menu",
    trainingUrl,
    items: [
      { label: "🏠 気良歌舞伎ナビ",   action: "1" },
      { label: "🎭 演目・人物ガイド",  action: "2" },
      { label: "📖 歌舞伎用語のいろは", action: "3" },
      { label: "⭐ おすすめ演目",       action: "4" },
      { label: "🧩 挑戦！歌舞伎クイズ", action: "5" },
      { label: "📣 お稽古モード",       action: "link:" + trainingUrl },
      { label: "📰 歌舞伎ニュース",     action: "postback:step=news" },
    ]
  };
}

/* =========================================================
   モード番号
========================================================= */
function normalizeModeSelection(text) {
  const t = toHalfWidthDigits(text);
  return t === "1" ? "kera"
    : t === "2" ? "performance"
    : t === "3" ? "general"
    : t === "4" ? "recommend"
    : t === "5" ? "quiz"
    : t === "6" ? "news"
    : null;
}

/* =========================================================
   ナビ: 戻る先の決定 + Web用ナビホーム
========================================================= */
function computeNavBack(lastStepRaw) {
  if (!lastStepRaw) return "step=navi_home";
  const params = new URLSearchParams(lastStepRaw);
  const step = params.get("step") || "";
  const map = {
    section: "step=section_menu",
    section_menu: "step=enmoku_list",
    cast: "step=section&section=cast",
    cast_list: "step=section&section=cast",
    enmoku: "step=enmoku_list",
    group: "step=enmoku_list",
    enmoku_list: "step=navi_home",
    glossary_term: "step=glossary_cat",
    glossary_list: "step=glossary_cat",
    glossary_cat: "step=navi_home",
    talk_detail: "step=talk_list",
    talk_cat: "step=talk_list",
    talk_list: "step=navi_home",
    recommend_detail: "step=recommend_list",
    recommend_list: "step=navi_home",
    news: "step=navi_home",
    navi_home: "step=navi_home",
    // ★ マイページ（歌舞伎ログ）
    mypage: "step=navi_home",
    log_recent_list: "step=mypage",
    log_recent_clear: "step=mypage",
    log_clips_menu: "step=mypage",
    log_clips_list: "step=log_clips_menu",
    log_quiz_review: "step=mypage",
  };
  return map[step] || "step=navi_home";
}

function naviHomeWeb(trainingUrl) {
  return {
    reply: "歌舞伎ナビ🧭\n気になるジャンルをえらんでね！",
    ui: {
      type: "buttons",
      items: [
        { label: "🏠 初心者FAQ", action: "postback:step=talk_list" },
        { label: "📜 演目を探す", action: "postback:step=enmoku_list" },
        { label: "📖 用語を調べる", action: "postback:step=glossary_cat" },
        { label: "🏮 おすすめ演目", action: "postback:step=recommend_list" },
        { label: "👺 歌舞伎クイズ", action: "5" },
        { label: "🎤 お稽古モード", action: "link:" + trainingUrl },
        { label: "📰 歌舞伎ニュース", action: "postback:step=news" },
        { label: "📋 マイページ", action: "postback:step=mypage" },
      ]
    }
  };
}

async function handleLineBack(env, sourceKey, userId, replyToken, destId) {
  const lastStep = await env.CHAT_HISTORY.get(`laststep:${sourceKey}`);
  const backPb = computeNavBack(lastStep);
  const bp = parsePostback(backPb);
  const enmokuKey = `enmoku:${sourceKey}`;

  // 戻った先を laststep に更新
  if (bp.step && bp.step !== "navi_home") {
    await env.CHAT_HISTORY.put(`laststep:${sourceKey}`, backPb);
  } else {
    await env.CHAT_HISTORY.delete(`laststep:${sourceKey}`);
  }

  if (bp.step === "navi_home" || !bp.step) {
    await respondLineMessages(env, replyToken, destId, [naviHomeFlex(env, env._origin)]);
    return;
  }
  if (bp.step === "enmoku_list") {
    await respondLineMessages(env, replyToken, destId, [await enmokuListFlex(env)]);
    return;
  }
  if (bp.step === "section_menu") {
    const enmokuId = await env.CHAT_HISTORY.get(enmokuKey);
    if (enmokuId) {
      const data = await loadEnmokuJson(env, enmokuId);
      if (data) {
        await respondLineMessages(env, replyToken, destId, [sectionMenuFlex(data.title_short || data.title)]);
        return;
      }
    }
    await respondLineMessages(env, replyToken, destId, [await enmokuListFlex(env)]);
    return;
  }
  if (bp.step === "section" && bp.section === "cast") {
    const enmokuId = await env.CHAT_HISTORY.get(enmokuKey);
    if (enmokuId) {
      const data = await loadEnmokuJson(env, enmokuId);
      if (data) {
        const cast = Array.isArray(data.cast) ? data.cast : [];
        await respondLineMessages(env, replyToken, destId, [castListFlex(data.title_short || data.title, cast, 1)]);
        return;
      }
    }
    await respondLineMessages(env, replyToken, destId, [await enmokuListFlex(env)]);
    return;
  }
  if (bp.step === "glossary_cat") {
    const glossary = await loadGlossary(env);
    await respondLineMessages(env, replyToken, destId, [glossaryCategoryFlex(glossary)]);
    return;
  }
  if (bp.step === "talk_list") {
    const topics = await loadTalkTopics(env);
    await respondLineMessages(env, replyToken, destId, [talkMenuFlex(topics, 1)]);
    return;
  }
  if (bp.step === "recommend_list") {
    const recData = await loadRecommend(env);
    await respondLineMessages(env, replyToken, destId, [recommendListFlex(recData.faqs)]);
    return;
  }
  // ★ マイページ系
  if (bp.step === "mypage") {
    const log = await loadLog(env, sourceKey);
    const qst = await loadQuizState(env, userId || sourceKey);
    await respondLineMessages(env, replyToken, destId, [myPageFlex(log, qst)]);
    return;
  }
  if (bp.step === "log_clips_menu") {
    const log = await loadLog(env, sourceKey);
    await respondLineMessages(env, replyToken, destId, [clipsMenuFlex(log)]);
    return;
  }
  // フォールバック
  await respondLineMessages(env, replyToken, destId, [naviHomeFlex(env, env._origin)]);
}

function looksLost(text) {
  const t = (text || "").trim();
  if (!t) return true;
  if (t.length <= 1) return true;
  if (/^[\?？!！。、.]+$/.test(t)) return true;
  return false;
}

function quizIntroText(channel = "web") {
  const base = `OK🙂

歌舞伎クイズに挑戦！🙂
ぜんぶで100問あるよ。
  
正解するごとに、どんどん昇進していくよ！

たくさん解いて、目指せ「名人」！

メニューに戻っても大丈夫。
リセットしない限り、つづきから再開できるよ。`;

  if (channel === "line") return base;

  return base + `

準備ができたら、下の「次へ」を押してね🙂`;
}

function exampleTextForMode(mode, channel = "web") {
  const isLine = channel === "line";
  const now = modeLabel(mode);

  const footer = isLine
    ? ""
    : mode === "quiz"
      ? `\n\n━━━━━━━━━━━━\nいま：${now}\n7：次　1/2/3：回答　8：復習　9：リセット　0：メニュー`
      : `\n\n━━━━━━━━━━━━\nいま：${now}\n0：メニュー　1〜5：モード切替`;

  switch (mode) {
    case "kera":
      return `どんなことが知りたい？🙂
（例）
・気良歌舞伎ってなに？
・地歌舞伎と大歌舞伎の違いは？
・気良座のアクセスを教えて${footer}`;

    case "performance":
      return `演目・人物ガイドだよ🙂
ボタンで演目をえらんでね！
テキストで質問してもOK。
（例）
・浜松屋のあらすじ
・稲瀬川勢揃いのみどころ${footer}`;

    case "general":
      return `歌舞伎の用語を聞いてみて🙂
（例）
・見得
・六方
・道行${footer}`;

    case "recommend":
      return `おすすめの聞き方はこんな感じ🙂
（例）
・初心者におすすめは？
・泣ける演目は？
・すっきりする演目は？
・子どもにおすすめは？${footer}`;

    case "quiz":
      if (isLine) return `クイズだね🙂\n下のボタンで操作してね！`;
      return `クイズだね🙂 つぎは「7」だよ！
（例）
・7（次の問題）
・1/2/3（回答）
・8（復習）
・9（リセット）
・0（メニュー）${footer}`;

    default:
      return menuText();
  }
}

function toHalfWidthDigits(s) {
  return (s || "").replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
}

/* =========================================================
   Quick Reply（モード開始用）
========================================================= */
function startQuickReplyForMode(mode, quizState) {
  if (mode === "quiz") {
    if (quizState && quizState.answered_total > 0) {
      return {
        items: [
          { type: "action", action: { type: "postback", label: "つづきから", data: "quiz=7", displayText: "つづきから" } },
          { type: "action", action: { type: "postback", label: "最初から", data: "quiz=9", displayText: "最初から" } },
          { type: "action", action: { type: "postback", label: "メニュー", data: "quiz=0", displayText: "メニュー" } }
        ]
      };
    }
    return {
      items: [
        { type: "action", action: { type: "postback", label: "はじめる", data: "quiz=7", displayText: "はじめる" } },
        { type: "action", action: { type: "postback", label: "メニュー", data: "quiz=0", displayText: "メニュー" } }
      ]
    };
  }

  const map = {
    kera: { label: "話しかける", text: "気良歌舞伎ってなに？" },
    general: { label: "用語を聞く", text: "見得ってなに？" },
    recommend: { label: "おすすめを聞く", text: "初心者におすすめは？" }
  };
  const a = map[mode] || { label: "はじめる", text: "0" };

  return {
    items: [
      { type: "action", action: { type: "message", label: a.label, text: a.text } },
      { type: "action", action: { type: "message", label: "メニュー", text: "0" } }
    ]
  };
}

/* =========================================================
   歌舞伎ログ: クリップ ID → 表示用アイテム解決
========================================================= */
function clipTypeLabel(type) {
  if (type === "enmoku") return { name: "演目", icon: "📜" };
  if (type === "person") return { name: "人物", icon: "🎭" };
  if (type === "term") return { name: "用語", icon: "📖" };
  return { name: type, icon: "📋" };
}

async function resolveClipItems(env, log, type) {
  const clips = log.clips || {};

  if (type === "enmoku") {
    const ids = clips.enmoku || [];
    if (ids.length === 0) return [];
    const catalog = await loadEnmokuCatalog(env);
    return ids.map(id => {
      const entry = catalog.find(c => c.id === id || c.key === id);
      return {
        id,
        title: entry ? (entry.short || entry.full || id) : id,
        action_data: `step=enmoku&enmoku=${encodeURIComponent(id)}`
      };
    });
  }

  if (type === "person") {
    const persons = clips.person || [];
    if (persons.length === 0) return [];
    // person clips: [{ id, parent, title? }]
    const items = [];
    for (const p of persons) {
      let title = p.title || p.id;
      // タイトルが無い場合、parent enmoku から解決を試みる
      if (!p.title && p.parent) {
        try {
          const data = await loadEnmokuJson(env, p.parent);
          if (data?.cast) {
            const c = data.cast.find(x => x.id === p.id);
            if (c) title = c.name || p.id;
          }
        } catch { /* 解決失敗は無視 */ }
      }
      items.push({
        id: p.id,
        title,
        action_data: `step=cast&person=${encodeURIComponent(p.id)}`
      });
    }
    return items;
  }

  if (type === "term") {
    const ids = clips.term || [];
    if (ids.length === 0) return [];
    const glossary = await loadGlossary(env);
    return ids.map(id => {
      const term = glossary.find(t => t.id === id);
      return {
        id,
        title: term ? (term.term || id) : id,
        action_data: `step=glossary_term&id=${encodeURIComponent(id)}`
      };
    });
  }

  return [];
}

/* =========================================================
   演目ガイド postback 本体（R2 + KV）
========================================================= */
async function handleEnmokuGuidePostback(env, sourceKey, p) {
  const modeKey = `mode:${sourceKey}`;
  const enmokuKey = `enmoku:${sourceKey}`;
  const step = p.step;

  if (step === "menu") {
    await env.CHAT_HISTORY.delete(modeKey);
    await env.CHAT_HISTORY.delete(enmokuKey);
    await env.CHAT_HISTORY.delete(`laststep:${sourceKey}`);
    return { messages: [mainMenuFlex(env, env._origin)] };
  }

  if (step === "navi_home") {
    await env.CHAT_HISTORY.delete(`laststep:${sourceKey}`);
    return { messages: [naviHomeFlex(env, env._origin)] };
  }

  if (step === "enmoku_list") {
    return { messages: [await enmokuListFlex(env)] };
  }

  if (step === "group") {
    const groupName = decodeURIComponent(p.group || "");
    if (!groupName) return { messages: [await enmokuListFlex(env)] };
    return { messages: [await groupSubMenuFlex(env, groupName)] };
  }

  if (step === "enmoku") {
    const enmokuId = (p.enmoku || "").trim();
    if (!enmokuId) return { messages: [await enmokuListFlex(env)] };

    await env.CHAT_HISTORY.put(modeKey, "performance");
    await env.CHAT_HISTORY.put(enmokuKey, enmokuId);

    const data = await loadEnmokuJson(env, enmokuId);
    if (!data) return { text: "ごめん、その演目データが見つからなかったよ🙏" };

    return { messages: [sectionMenuFlex(data.title_short || data.title)] };
  }

  if (step === "section_menu") {
    const enmokuId = await env.CHAT_HISTORY.get(enmokuKey);
    if (!enmokuId) return { messages: [await enmokuListFlex(env)] };

    const data = await loadEnmokuJson(env, enmokuId);
    if (!data) return { messages: [await enmokuListFlex(env)] };

    return { messages: [sectionMenuFlex(data.title_short || data.title)] };
  }

  if (step === "section") {
    const section = (p.section || "").trim();
    const enmokuId = await env.CHAT_HISTORY.get(enmokuKey);
    if (!enmokuId) return { messages: [await enmokuListFlex(env)] };

    const data = await loadEnmokuJson(env, enmokuId);
    if (!data) return { messages: [await enmokuListFlex(env)] };

    const shortTitle = data.title_short || data.title;

    // ★ Flexで綺麗に表示 → 最後に sectionNavMessage（Quick Reply）を付ける
    // ★ 歌舞伎ログ: 演目閲覧を記録
    appendRecent(env, sourceKey, { type: "enmoku", id: enmokuId, title: shortTitle }).catch(() => {});

    if (section === "synopsis") {
      return {
        messages: [
          enmokuSectionDetailFlex(shortTitle, "あらすじ", "📖", data.synopsis),
          sectionNavMessage("synopsis", enmokuId)
        ]
      };
    }
    if (section === "highlights") {
      return {
        messages: [
          enmokuSectionDetailFlex(shortTitle, "みどころ", "🌟", data.highlights),
          sectionNavMessage("highlights", enmokuId)
        ]
      };
    }
    if (section === "info") {
      return {
        messages: [
          enmokuSectionDetailFlex(shortTitle, "作品情報", "📝", data.info),
          sectionNavMessage("info", enmokuId)
        ]
      };
    }

    if (section === "cast") {
      const cast = Array.isArray(data.cast) ? data.cast : [];
      return { messages: [castListFlex(shortTitle, cast, 1)] };
    }

    return { messages: [sectionMenuFlex(shortTitle)] };
  }

  if (step === "cast_list") {
    const page = parseInt(p.page || "1", 10) || 1;
    const enmokuId = await env.CHAT_HISTORY.get(enmokuKey);
    if (!enmokuId) return { messages: [await enmokuListFlex(env)] };

    const data = await loadEnmokuJson(env, enmokuId);
    if (!data) return { messages: [await enmokuListFlex(env)] };

    const shortTitle = data.title_short || data.title;
    const castForList = Array.isArray(data.cast) ? data.cast : [];
    return { messages: [castListFlex(shortTitle, castForList, page)] };
  }

  if (step === "cast") {
    const personId = (p.person || "").trim();
    const enmokuId = await env.CHAT_HISTORY.get(enmokuKey);
    if (!enmokuId) return { messages: [await enmokuListFlex(env)] };

    const data = await loadEnmokuJson(env, enmokuId);
    if (!data) return { messages: [await enmokuListFlex(env)] };

    const shortTitle = data.title_short || data.title;
    const castArr = Array.isArray(data.cast) ? data.cast : [];
    const person = castArr.find(x => x.id === personId);
    if (!person) return { messages: [castListFlex(shortTitle, castArr, 1)] };

    // ★ 歌舞伎ログ: 人物閲覧を記録
    appendRecent(env, sourceKey, { type: "person", id: personId, title: person.name || personId, parent: enmokuId }).catch(() => {});

    return {
      messages: [
        castDetailFlex(shortTitle, person),
        castNavMessage(personId, enmokuId)
      ]
    };
  }

  return { messages: [await enmokuListFlex(env)] };
}

/* =========================================================
   Recommend / Glossary / Talk loaders (R2)
========================================================= */
let RECOMMEND_CACHE = null;
async function loadRecommend(env) {
  if (RECOMMEND_CACHE && RECOMMEND_CACHE.faqs?.length > 0) return RECOMMEND_CACHE;

  try {
    const obj = await env.CONTENT_BUCKET.get("recommend.json");
    if (!obj) return { faqs: [], videos: {} };
    const data = await obj.json();
    RECOMMEND_CACHE = { faqs: data.faqs || [], videos: data.videos || {} };
    return RECOMMEND_CACHE;
  } catch (e) {
    console.log("loadRecommend error:", e);
    return { faqs: [], videos: {} };
  }
}

let GLOSSARY_CACHE = null;
async function loadGlossary(env) {
  if (GLOSSARY_CACHE && GLOSSARY_CACHE.length > 0) return GLOSSARY_CACHE;

  try {
    const obj = await env.CONTENT_BUCKET.get("glossary.json");
    if (!obj) return [];
    const data = await obj.json();
    GLOSSARY_CACHE = data.terms || [];
    return GLOSSARY_CACHE;
  } catch (e) {
    console.log("loadGlossary error:", e);
    return [];
  }
}

// ★ talk_topics.json（topics + categories）
// - Web側の「カテゴリ→質問→回答」にも使う
let TALK_CACHE = null;
let TALK_CATS_CACHE = null;
let TALK_CACHE_AT = 0;
const TALK_CACHE_TTL_MS = 5 * 60 * 1000; // 5分（開発中の反映遅れ対策）

async function loadTalkData(env) {
  const now = Date.now();
  if (
    Array.isArray(TALK_CACHE) &&
    Array.isArray(TALK_CATS_CACHE) &&
    TALK_CACHE.length > 0 &&
    (now - TALK_CACHE_AT) < TALK_CACHE_TTL_MS
  ) {
    return { topics: TALK_CACHE, categories: TALK_CATS_CACHE };
  }

  try {
    const obj = await env.CONTENT_BUCKET.get("talk_topics.json");
    if (!obj) {
      TALK_CACHE = [];
      TALK_CATS_CACHE = [];
      TALK_CACHE_AT = now;
      return { topics: TALK_CACHE, categories: TALK_CATS_CACHE };
    }
    const data = await obj.json();
    TALK_CACHE = Array.isArray(data?.topics) ? data.topics : [];
    TALK_CATS_CACHE = Array.isArray(data?.categories) ? data.categories : [];
    TALK_CACHE_AT = now;
    return { topics: TALK_CACHE, categories: TALK_CATS_CACHE };
  } catch (e) {
    console.log("loadTalkData error:", e);
    TALK_CACHE = [];
    TALK_CATS_CACHE = [];
    TALK_CACHE_AT = Date.now();
    return { topics: TALK_CACHE, categories: TALK_CATS_CACHE };
  }
}

async function loadTalkTopics(env) {
  return (await loadTalkData(env)).topics;
}
async function loadTalkCategories(env) {
  return (await loadTalkData(env)).categories;
}

/* =========================================================
   Text search
========================================================= */
function searchRecommend(faqs, query) {
  const q = (query || "").toLowerCase().trim();
  if (!q) return [];
  return (faqs || []).filter(f =>
    (f.question || "").toLowerCase().includes(q) ||
    (f.answer || "").toLowerCase().includes(q) ||
    (f.label || "").toLowerCase().includes(q) ||
    (f.tags || []).some(t => String(t).toLowerCase().includes(q))
  );
}

function searchGlossary(terms, query) {
  const q = (query || "").toLowerCase().trim();
  if (!q) return [];

  const exact = (terms || []).filter(t =>
    String(t.term || "").split("（")[0].split("／")[0].toLowerCase() === q ||
    String(t.reading || "").toLowerCase() === q ||
    String(t.term || "").includes(`（${q}）`)
  );
  if (exact.length > 0) return exact;

  return (terms || []).filter(t =>
    String(t.term || "").toLowerCase().includes(q) ||
    String(t.reading || "").toLowerCase().includes(q) ||
    String(t.desc || "").toLowerCase().includes(q)
  );
}

/* =========================================================
   Web UI 初期表示/ポストバック処理
========================================================= */
async function getWebModeInit(env, mode, sourceKey) {
  // ★ kera：カテゴリ一覧（フォルダ）→ talk_cat へ
  if (mode === "kera") {
    const { topics, categories } = await loadTalkData(env);

    // categories があるならそれを優先。無い場合は topics から推定
    let cats = (categories || []).filter(c => c && c.key && c.key !== "メニュー");
    if (cats.length === 0) {
      const set = new Set((topics || []).map(t => String(t.category || "").trim()).filter(Boolean));
      set.delete("メニュー");
      cats = Array.from(set).map((k, i) => ({ key: k, icon: "📁", order: i + 1 }));
    }

    cats.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    return {
      reply: `気良歌舞伎ナビ🙂\nカテゴリをえらんでね！`,
      ui: {
        type: "buttons",
        items: cats.map(c => ({
          label: `${c.icon || "📁"} ${c.key}`,
          action: `postback:step=talk_cat&cat=${encodeURIComponent(c.key)}&page=1`
        })),
        footer: [{ label: "🧭 ナビ", action: "postback:step=navi_home" }]
      }
    };
  }

  if (mode === "performance") {
    const catalog = await loadEnmokuCatalog(env);

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

    const buttons = [];
    for (const g of groups) {
      if (g.label && g.items.length > 1) {
        buttons.push({
          label: `📁 ${g.label}（${g.items.length}演目）`,
          action: `postback:step=group&group=${encodeURIComponent(g.label)}`
        });
      } else {
        buttons.push({
          label: g.items[0].short,
          action: `postback:step=enmoku&enmoku=${encodeURIComponent(g.items[0].id)}`
        });
      }
    }

    return {
      reply: `演目をえらんでね🙂（全${catalog.length}演目）\nテキストで質問してもOKだよ！`,
      ui: { type: "buttons", items: buttons, footer: [{ label: "🧭 ナビ", action: "postback:step=navi_home" }] }
    };
  }

  if (mode === "general") {
    const glossary = await loadGlossary(env);
    const catCounts = {};
    glossary.forEach(t => { catCounts[t.category] = (catCounts[t.category] || 0) + 1; });

    const buttons = GLOSSARY_CAT_ORDER
      .filter(c => catCounts[c.key])
      .map(c => ({
        label: `${c.icon} ${c.key}（${catCounts[c.key]}語）`,
        action: `postback:step=glossary_list&cat=${encodeURIComponent(c.key)}`
      }));

    return {
      reply: `歌舞伎用語いろは（全${glossary.length}語）🙂\nカテゴリをえらんでね！用語を直接入力しても検索できるよ。`,
      ui: { type: "buttons", items: buttons, footer: [{ label: "🧭 ナビ", action: "postback:step=navi_home" }] }
    };
  }

  if (mode === "recommend") {
    const recData = await loadRecommend(env);
    const buttons = (recData.faqs || []).map(f => ({
      label: f.label,
      action: `postback:step=recommend_detail&id=${encodeURIComponent(f.id)}`
    }));

    return {
      reply: `おすすめ演目🙂\n気になる質問をタップしてね！テキストで聞いてもOK。`,
      ui: { type: "buttons", items: buttons, footer: [{ label: "🧭 ナビ", action: "postback:step=navi_home" }] }
    };
  }

  if (mode === "quiz") {
    return { reply: quizIntroText() };
  }

  if (mode === "news") {
    const html = await newsWebHTML(env);
    return {
      reply: html,
      isHTML: true,
      ui: { type: "nav_buttons", items: [{ label: "🧭 ナビ", action: "postback:step=navi_home" }] }
    };
  }

  return { reply: exampleTextForMode(mode) };
}

async function handleWebPostback(env, sourceKey, pbData) {
  const params = new URLSearchParams(pbData);
  const step = params.get("step");

  const modeKey = `mode:${sourceKey}`;
  const enmokuKey = `enmoku:${sourceKey}`;

  if (step === "menu") {
    await env.CHAT_HISTORY.delete(modeKey);
    await env.CHAT_HISTORY.delete(enmokuKey);
    await env.CHAT_HISTORY.delete(`laststep:${sourceKey}`);
    const trainingUrl = (env._origin || "") + "/training";
    return { reply: menuText(), ui: webMenuUI(trainingUrl) };
  }

  // step=navi_home：歌舞伎ナビホーム
  if (step === "navi_home") {
    await env.CHAT_HISTORY.delete(`laststep:${sourceKey}`);
    const trainingUrl = (env._origin || "") + "/training";
    return naviHomeWeb(trainingUrl);
  }

  // step=mypage：マイページ
  if (step === "mypage") {
    const log = await loadLog(env, sourceKey);
    const qst = await loadQuizState(env, sourceKey);
    return myPageWeb(log, qst);
  }

  // step=clip_toggle：クリップ ON/OFF
  if (step === "clip_toggle") {
    const clipType = params.get("type") || "";
    const clipId = decodeURIComponent(params.get("id") || "");
    const clipParent = decodeURIComponent(params.get("parent") || "");
    const clipTitle = decodeURIComponent(params.get("title") || "");
    if (clipType && clipId) {
      const { clipped } = await toggleClip(env, sourceKey, clipType, clipId, { parent: clipParent, title: clipTitle });
      return { reply: clipped ? "⭐ クリップしたよ！" : "クリップを外したよ" };
    }
    return { reply: "クリップ操作に失敗したよ🙏" };
  }

  // ★ 歌舞伎ログ: サブステップハンドラ（Web）
  if (step === "log_recent_list") {
    const log = await loadLog(env, sourceKey);
    const page = parseInt(params.get("page") || "1", 10) || 1;
    return recentListWeb(log, page);
  }
  if (step === "log_recent_clear") {
    await clearRecent(env, sourceKey);
    return { reply: "🗑 履歴をクリアしたよ！" };
  }
  if (step === "log_clips_menu") {
    const log = await loadLog(env, sourceKey);
    return clipsMenuWeb(log);
  }
  if (step === "log_clips_list") {
    const clipType = params.get("type") || "";
    const log = await loadLog(env, sourceKey);
    const items = await resolveClipItems(env, log, clipType);
    const { name, icon } = clipTypeLabel(clipType);
    return clipsListWeb(items, name, icon);
  }
  if (step === "log_quiz_review") {
    const qst = await loadQuizState(env, sourceKey);
    return quizReviewWeb(qst);
  }

  // laststep を保存（ナビゲーション用）
  if (step && step !== "menu" && step !== "navi_home") {
    await env.CHAT_HISTORY.put(`laststep:${sourceKey}`, pbData);
  }

  // news
  if (step === "news") {
    const html = await newsWebHTML(env);
    return {
      reply: html,
      isHTML: true,
      ui: { type: "nav_buttons", items: [{ label: "🧭 ナビ", action: "postback:step=navi_home" }] }
    };
  }

  // talk
  if (step === "talk_list") {
    await env.CHAT_HISTORY.put(modeKey, "kera");
    // talk_list = カテゴリ一覧として扱う
    return { ...(await getWebModeInit(env, "kera", sourceKey)), mode: "kera" };
  }

  // ★ 追加：カテゴリ内（Web版もフォルダ→中身）
  if (step === "talk_cat") {
    await env.CHAT_HISTORY.put(modeKey, "kera");

    const cat = decodeURIComponent(params.get("cat") || "");
    const page = parseInt(params.get("page") || "1", 10) || 1;

    const { topics, categories } = await loadTalkData(env);

    const catMeta = (categories || []).find(c => c.key === cat) || {};
    const icon = catMeta.icon || "📁";

    const faqs = (topics || []).filter(t =>
      String(t.category || "").trim() === cat &&
      String(t.id || "") !== "genre_menu" &&
      String(t.category || "") !== "メニュー"
    );

    const PER_PAGE = 7;
    const total = faqs.length;
    const maxPage = Math.max(1, Math.ceil(total / PER_PAGE));
    const cur = Math.min(Math.max(page, 1), maxPage);
    const slice = faqs.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);

    const items = slice.map(t => ({
      label: (t.label || t.question || "質問").slice(0, 22),
      action: `postback:step=talk_detail&id=${encodeURIComponent(t.id)}`
    }));

    const footer = [];
    if (cur > 1) footer.push({ label: "前へ", action: `postback:step=talk_cat&cat=${encodeURIComponent(cat)}&page=${cur - 1}` });
    if (cur < maxPage) footer.push({ label: "次へ", action: `postback:step=talk_cat&cat=${encodeURIComponent(cat)}&page=${cur + 1}` });
    footer.push({ label: "カテゴリ一覧", action: "postback:step=talk_list" });
    footer.push({ label: "🧭 ナビ", action: "postback:step=navi_home" });

    return {
      reply: `${icon} ${cat}（${cur}/${maxPage}）\n質問をえらんでね🙂`,
      mode: "kera",
      ui: { type: "buttons", items, footer }
    };
  }

  if (step === "talk_detail") {
    await env.CHAT_HISTORY.put(modeKey, "kera");
    const id = decodeURIComponent(params.get("id") || "");
    const { topics, categories } = await loadTalkData(env);

    const topic = (topics || []).find(t => t.id === id);
    if (!topic) {
      return {
        reply: "該当する項目が見つからなかったよ🙏",
        mode: "kera",
        ui: {
          type: "nav_buttons",
          items: [
            { label: "カテゴリ一覧", action: "postback:step=talk_list" },
            { label: "🧭 ナビ", action: "postback:step=navi_home" }
          ]
        }
      };
    }

    const cat = String(topic.category || "").trim();
    const catMeta = (categories || []).find(c => c.key === cat) || {};
    const icon = catMeta.icon || "📁";

    return {
      reply: "",
      mode: "kera",
      ui: {
        type: "card",
        title: topic.label,
        subtitle: `${icon} ${cat || "気良歌舞伎ナビ"}`,
        body: topic.answer,
        items: [
          ...(cat ? [{ label: `${cat}に戻る`, action: `postback:step=talk_cat&cat=${encodeURIComponent(cat)}&page=1` }] : []),
          { label: "カテゴリ一覧", action: "postback:step=talk_list" }
        ],
        footer: [{ label: "🧭 ナビ", action: "postback:step=navi_home" }]
      }
    };
  }

  if (step === "enmoku_list") {
    await env.CHAT_HISTORY.put(modeKey, "performance");
    return { ...(await getWebModeInit(env, "performance", sourceKey)), mode: "performance" };
  }

  if (step === "group") {
    const groupName = decodeURIComponent(params.get("group") || "");
    const catalog = await loadEnmokuCatalog(env);
    const items = catalog.filter(e => e.group === groupName);
    if (items.length === 0) return await getWebModeInit(env, "performance", sourceKey);

    return {
      reply: `${groupName}🙂 どの場面を見る？`,
      mode: "performance",
      ui: {
        type: "buttons",
        items: items.map(e => ({
          label: e.short,
          action: `postback:step=enmoku&enmoku=${encodeURIComponent(e.id)}`
        })),
        footer: [
          { label: "演目一覧", action: "postback:step=enmoku_list" },
          { label: "🧭 ナビ", action: "postback:step=navi_home" }
        ]
      }
    };
  }

  if (step === "enmoku") {
    const enmokuId = params.get("enmoku") || "";
    if (!enmokuId) return await getWebModeInit(env, "performance", sourceKey);

    await env.CHAT_HISTORY.put(modeKey, "performance");
    await env.CHAT_HISTORY.put(enmokuKey, enmokuId);

    const data = await loadEnmokuJson(env, enmokuId);
    if (!data) return { reply: "ごめん、その演目データが見つからなかったよ🙏", mode: "performance" };

    const title = data.title_short || data.title;
    return {
      reply: `「${title}」について🙂 知りたい項目をえらんでね！`,
      mode: "performance",
      ui: {
        type: "buttons",
        items: [
          { label: "📖 あらすじ", action: "postback:step=section&section=synopsis" },
          { label: "🌟 みどころ", action: "postback:step=section&section=highlights" },
          { label: "🎭 登場人物", action: "postback:step=section&section=cast" },
          { label: "📝 作品情報", action: "postback:step=section&section=info" }
        ],
        footer: [
          { label: "演目一覧", action: "postback:step=enmoku_list" },
          { label: "🧭 ナビ", action: "postback:step=navi_home" }
        ]
      }
    };
  }

  if (step === "section_menu") {
    const enmokuId = await env.CHAT_HISTORY.get(enmokuKey);
    if (!enmokuId) return await getWebModeInit(env, "performance", sourceKey);

    const data = await loadEnmokuJson(env, enmokuId);
    if (!data) return await getWebModeInit(env, "performance", sourceKey);

    const title = data.title_short || data.title;
    return {
      reply: `「${title}」について🙂`,
      mode: "performance",
      ui: {
        type: "buttons",
        items: [
          { label: "📖 あらすじ", action: "postback:step=section&section=synopsis" },
          { label: "🌟 みどころ", action: "postback:step=section&section=highlights" },
          { label: "🎭 登場人物", action: "postback:step=section&section=cast" },
          { label: "📝 作品情報", action: "postback:step=section&section=info" }
        ],
        footer: [
          { label: "演目一覧", action: "postback:step=enmoku_list" },
          { label: "🧭 ナビ", action: "postback:step=navi_home" }
        ]
      }
    };
  }

  if (step === "section") {
    const section = params.get("section") || "";

    const enmokuId = await env.CHAT_HISTORY.get(enmokuKey);
    if (!enmokuId) return await getWebModeInit(env, "performance", sourceKey);

    const data = await loadEnmokuJson(env, enmokuId);
    if (!data) return await getWebModeInit(env, "performance", sourceKey);

    const title = data.title_short || data.title;

    // ★ 歌舞伎ログ: 演目閲覧を記録
    appendRecent(env, sourceKey, { type: "enmoku", id: enmokuId, title }).catch(() => {});

    const navItems = [];
    if (section !== "synopsis") navItems.push({ label: "あらすじ", action: "postback:step=section&section=synopsis" });
    if (section !== "highlights") navItems.push({ label: "みどころ", action: "postback:step=section&section=highlights" });
    if (section !== "cast") navItems.push({ label: "登場人物", action: "postback:step=section&section=cast" });
    if (section !== "info") navItems.push({ label: "作品情報", action: "postback:step=section&section=info" });
    // ⭐ クリップ
    navItems.push({ label: "⭐ 保存", action: `postback:step=clip_toggle&type=enmoku&id=${encodeURIComponent(enmokuId)}` });

    const footer = [
      { label: "演目一覧", action: "postback:step=enmoku_list" },
      { label: "🧭 ナビ", action: "postback:step=navi_home" }
    ];

    // ★ Web側もカードUIで統一（LINE Flex風）
    if (section === "synopsis") {
      return {
        reply: "",
        mode: "performance",
        ui: { type: "card", title: title, subtitle: "📖 あらすじ", body: data.synopsis, items: navItems, footer }
      };
    }
    if (section === "highlights") {
      return {
        reply: "",
        mode: "performance",
        ui: { type: "card", title: title, subtitle: "🌟 みどころ", body: data.highlights, items: navItems, footer }
      };
    }
    if (section === "info") {
      return {
        reply: "",
        mode: "performance",
        ui: { type: "card", title: title, subtitle: "📝 作品情報", body: data.info, items: navItems, footer }
      };
    }

    if (section === "cast") {
      const cast = Array.isArray(data.cast) ? data.cast : [];
      return {
        reply: `【${title}｜登場人物】\n気になる人物をタップしてね🙂`,
        mode: "performance",
        ui: {
          type: "buttons",
          items: cast.map(c => ({
            label: (c.name || "").split("（")[0],
            action: `postback:step=cast&person=${encodeURIComponent(c.id)}`
          })),
          footer: [
            { label: "項目に戻る", action: "postback:step=section_menu" },
            ...footer
          ]
        }
      };
    }

    return { reply: `「${title}」`, mode: "performance" };
  }

  if (step === "cast") {
    const personId = params.get("person") || "";

    const enmokuId = await env.CHAT_HISTORY.get(enmokuKey);
    if (!enmokuId) return await getWebModeInit(env, "performance", sourceKey);

    const data = await loadEnmokuJson(env, enmokuId);
    if (!data) return await getWebModeInit(env, "performance", sourceKey);

    const title = data.title_short || data.title;
    const castArr = Array.isArray(data.cast) ? data.cast : [];
    const person = castArr.find(x => x.id === personId);
    if (!person) return { reply: "人物が見つからなかったよ🙏", mode: "performance" };

    // ★ 歌舞伎ログ: 人物閲覧を記録
    appendRecent(env, sourceKey, { type: "person", id: personId, title: person.name || personId, parent: enmokuId }).catch(() => {});

    return {
      reply: "",
      mode: "performance",
      ui: {
        type: "card",
        title: person.name,
        subtitle: `🎭 登場人物｜${title}`,
        body: person.desc,
        items: [
          { label: "人物一覧", action: "postback:step=section&section=cast" },
          { label: "項目に戻る", action: "postback:step=section_menu" },
          { label: "⭐ 保存", action: `postback:step=clip_toggle&type=person&id=${encodeURIComponent(personId)}&parent=${encodeURIComponent(enmokuId)}` }
        ],
        footer: [
          { label: "演目一覧", action: "postback:step=enmoku_list" },
          { label: "🧭 ナビ", action: "postback:step=navi_home" }
        ]
      }
    };
  }

  // glossary
  if (step === "glossary_cat") {
    await env.CHAT_HISTORY.put(modeKey, "general");
    return { ...(await getWebModeInit(env, "general", sourceKey)), mode: "general" };
  }

  if (step === "glossary_list") {
    const cat = decodeURIComponent(params.get("cat") || "");
    const glossary = await loadGlossary(env);
    const catTerms = glossary.filter(t => t.category === cat);
    if (catTerms.length === 0) return { reply: "該当する用語が見つからなかったよ🙏", mode: "general" };

    const catIcon = (GLOSSARY_CAT_ORDER.find(c => c.key === cat) || {}).icon || "📖";
    return {
      reply: `${catIcon} ${cat}（${catTerms.length}語）`,
      mode: "general",
      ui: {
        type: "buttons",
        items: catTerms.map(t => ({ label: t.term, action: `postback:step=glossary_term&id=${encodeURIComponent(t.id)}` })),
        footer: [
          { label: "カテゴリ一覧", action: "postback:step=glossary_cat" },
          { label: "🧭 ナビ", action: "postback:step=navi_home" }
        ]
      }
    };
  }

  if (step === "glossary_term") {
    const id = decodeURIComponent(params.get("id") || "");
    const glossary = await loadGlossary(env);
    const term = glossary.find(t => t.id === id);
    if (!term) return { reply: "該当する用語が見つからなかったよ🙏", mode: "general" };

    // ★ 歌舞伎ログ: 用語閲覧を記録
    appendRecent(env, sourceKey, { type: "term", id, title: term.term }).catch(() => {});

    return {
      reply: "",
      mode: "general",
      ui: {
        type: "card",
        title: term.term,
        subtitle: term.category,
        body: term.desc,
        items: [
          { label: `${term.category}に戻る`, action: `postback:step=glossary_list&cat=${encodeURIComponent(term.category)}` },
          { label: "カテゴリ一覧", action: "postback:step=glossary_cat" },
          { label: "⭐ 保存", action: `postback:step=clip_toggle&type=term&id=${encodeURIComponent(id)}` },
          { label: "🧭 ナビ", action: "postback:step=navi_home" }
        ]
      }
    };
  }

  // recommend
  if (step === "recommend_list") {
    await env.CHAT_HISTORY.put(modeKey, "recommend");
    return { ...(await getWebModeInit(env, "recommend", sourceKey)), mode: "recommend" };
  }

  if (step === "recommend_detail") {
    const id = decodeURIComponent(params.get("id") || "");
    const recData = await loadRecommend(env);
    const faq = recData.faqs.find(f => f.id === id);
    if (!faq) return { reply: "該当するおすすめが見つからなかったよ🙏", mode: "recommend" };

    const vids = recData.videos || {};
    const links = (faq.enmoku || []).filter(e => vids[e]).map(e => vids[e]);

    return {
      reply: `Q: ${faq.question}\n\n${faq.answer}`,
      mode: "recommend",
      ui: {
        type: "detail",
        videos: links.slice(0, 3).map(v => ({ title: v.title, url: v.url })),
        footer: [
          { label: "おすすめ一覧", action: "postback:step=recommend_list" },
          { label: "🧭 ナビ", action: "postback:step=navi_home" }
        ]
      }
    };
  }

  return { reply: "ごめん、うまく処理できなかったよ🙏" };
}

/* =========================================================
   LLM フォールバック（将来 Workers AI で置き換え予定）
   現在は Dify 依存を排除し、R2データ＋ローカル応答で完結。
========================================================= */

/* =========================================================
   LINE send helpers（LINE専用: Messaging API）
   env のシークレット: LINE_CHANNEL_ACCESS_TOKEN または LINE_ACCESS_TOKEN
========================================================= */
function getLineChannelAccessToken(env) {
  return env.LINE_CHANNEL_ACCESS_TOKEN || env.LINE_ACCESS_TOKEN || "";
}

async function respondLine(env, replyToken, destId, text) {
  const ok = await replyLine(env, replyToken, text);
  if (!ok && destId) await pushLine(env, destId, text);
}

async function replyLine(env, replyToken, text) {
  const token = getLineChannelAccessToken(env);
  if (!token) {
    console.error("LINE: Channel access token missing. Set LINE_CHANNEL_ACCESS_TOKEN or LINE_ACCESS_TOKEN in wrangler secret.");
    return false;
  }
  const res = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }]
    })
  });
  if (!res.ok) console.error("LINE reply error:", res.status, await res.text());
  return res.ok;
}

async function pushLine(env, userId, text) {
  const token = getLineChannelAccessToken(env);
  if (!token) {
    console.error("LINE: Channel access token missing. Set LINE_CHANNEL_ACCESS_TOKEN or LINE_ACCESS_TOKEN in wrangler secret.");
    return false;
  }
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      to: userId,
      messages: [{ type: "text", text }]
    })
  });
  if (!res.ok) console.error("LINE push error:", res.status, await res.text());
  return res.ok;
}

async function replyLineMessages(env, replyToken, messages) {
  const token = getLineChannelAccessToken(env);
  if (!token) {
    console.error("LINE: Channel access token missing. Set LINE_CHANNEL_ACCESS_TOKEN or LINE_ACCESS_TOKEN in wrangler secret.");
    return false;
  }
  const normalized = normalizeLineMessages(messages);
  const res = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ replyToken, messages: normalized })
  });
  if (!res.ok) console.error("LINE reply(messages) error:", res.status, await res.text());
  return res.ok;
}

async function pushLineMessages(env, to, messages) {
  const token = getLineChannelAccessToken(env);
  if (!token) {
    console.error("LINE: Channel access token missing. Set LINE_CHANNEL_ACCESS_TOKEN or LINE_ACCESS_TOKEN in wrangler secret.");
    return false;
  }
  const normalized = normalizeLineMessages(messages);
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ to, messages: normalized })
  });
  if (!res.ok) console.error("LINE push(messages) error:", res.status, await res.text());
  return res.ok;
}

/** LINE Messaging API 用にメッセージ配列を正規化（Flexは type/altText/contents 形式に） */
function normalizeLineMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.map(m => {
    if (!m || typeof m !== "object") return { type: "text", text: "" };
    if (m.type === "text") return m;
    if (m.type === "flex" && m.altText != null && m.contents) return m;
    if (m.contents && m.altText === undefined) return { type: "flex", altText: "メッセージ", contents: m.contents };
    return { type: "flex", altText: m.altText || "メッセージ", contents: m.contents || m };
  });
}

async function respondLineMessages(env, replyToken, destId, messages) {
  const ok = await replyLineMessages(env, replyToken, messages);
  if (!ok && destId) await pushLineMessages(env, destId, messages);
}

/* =========================================================
   LINE署名検証
========================================================= */
async function verifyLineSignature(secret, body, signature) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return btoa(String.fromCharCode(...new Uint8Array(mac))) === signature;
}
