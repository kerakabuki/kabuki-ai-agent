// worker.js（ルート）
// =========================================================
//
// ── Data Storage Rules ────────────────────────────────────
// KV (CHAT_HISTORY) = "状態"
//   session, wizard progress, membership, short-term cache,
//   account links, editor/join requests (with TTL)
// R2 = "資産"
//   enmoku guides, scripts, training packs, archives,
//   static content (kawaraban, stories, glossary, actors)
// Catalog pattern:
//   R2の一覧取得には *_catalog キー（e.g. catalog.json）を別途管理
// Size limits:
//   group_notes → 200 items max
//   userdata.theater_log.entries → 500 items max
// ──────────────────────────────────────────────────────────
//
// ── Permission Matrix (see src/auth.js for details) ───────
// master  → global : all operations, bypasses group checks
// editor  → global : enmoku content create/edit (any group)
// manager → group  : group admin (members, scripts, profile)
// member  → group  : read group content, upload scripts, notes
// ──────────────────────────────────────────────────────────
//
// Imports
// =========================================================
import { handleQuizMessage, loadQuizState, clearQuizCache } from "./src/quiz.js";

import { mainMenuFlex } from "./src/flex_menu.js";

import {
  loadEnmokuCatalog,
  loadEnmokuJson,
  clearEnmokuCatalogCache,
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
import { kakegoePageHTML } from "./src/kakegoe_page.js";
import { kakegoeEditorHTML } from "./src/kakegoe_editor.js";
import { serifuEditorHTML } from "./src/serifu_editor.js";
import { serifuPageHTML } from "./src/serifu_page.js";

// ★ 認証（LINE Login + Google Sign-In）
import {
  lineLoginRedirect, lineLoginCallback, verifyGoogleToken,
  getSession, destroySession, authMe,
  migrateUserData, getUserData, putUserData,
  requireEditor, requestEditorAccess,
  listEditorRequests, approveEditor, revokeEditor,
  checkIsMaster, requireGroupRole,
  loadGroupMembers, saveGroupMembers,
  requestGroupJoin, listGroupJoinRequests,
  approveGroupMember, changeGroupMemberRole, removeGroupMember,
  cleanupGroup,
} from "./src/auth.js";

// ★ ニュース（Google News RSS → KV）
import { fetchAndCacheNews, getCachedNews, backfillNews, searchActorNews } from "./src/news.js";
import { newsFlexMessage, newsWebHTML } from "./src/news_card.js";

// ★ 歌舞伎美人 公演情報（kabuki-bito.jp → KV）
import { refreshPerformancesCache, getPerformancesCached } from "./src/kabuki_bito.js";

// ★ 注目演目（LIVE×NAVI連携）
import { pickFeatured, saveMissedToKV, loadMissedFromKV, normalizeTitle } from "./src/featured_enmoku.js";

// ★ WEBページ（フルページ）
import { topPageHTML } from "./src/top_page.js";
import { aboutPageHTML } from "./src/about_page.js";
import { newsPageHTML } from "./src/news_page.js";
import { enmokuPageHTML } from "./src/enmoku_page.js";
import { glossaryPageHTML } from "./src/glossary_page.js";
import { recommendPageHTML } from "./src/recommend_page.js";
import { quizPageHTML } from "./src/quiz_page.js";
import { kawarabanPageHTML } from "./src/kawaraban_page.js";
import { nftGuidePageHTML } from "./src/nft_guide_page.js";
import { storyPageHTML } from "./src/story_page.js";
import { mypagePageHTML } from "./src/mypage_page.js";
import { naviPageHTML } from "./src/navi_page.js";
import { mannersPageHTML } from "./src/manners_page.js";
import { kangekinaviPageHTML } from "./src/kangekinavi_page.js";
import { livePageHTML } from "./src/live_page.js";
import { laboHubPageHTML } from "./src/labo_hub_page.js";
import { laboEnmokuPageHTML } from "./src/labo_page.js";
import { laboGlossaryPageHTML } from "./src/labo_glossary_page.js";
import { laboQuizPageHTML } from "./src/labo_quiz_page.js";
import { dojoPageHTML } from "./src/dojo_page.js";
import { groupMembersPageHTML } from "./src/group_members_page.js";
import { groupInvitePageHTML } from "./src/group_invite_page.js";
import { groupPerformancePageHTML } from "./src/group_performance_page.js";
import { groupRecordsPageHTML } from "./src/group_records_page.js";
import { groupEnmokuSelectPageHTML } from "./src/group_enmoku_select_page.js";
import { groupActorsPageHTML } from "./src/group_actors_page.js";
import { groupNotesPageHTML } from "./src/group_notes_page.js";
import { groupScriptListPageHTML, groupScriptViewerPageHTML, groupScriptTextViewerHTML, groupScriptPdfViewerHTML } from "./src/group_script_page.js";
import { groupTrainingPageHTML } from "./src/group_training_page.js";
import { groupSchedulePageHTML } from "./src/group_schedule_page.js";
import { groupOnboardingPageHTML } from "./src/group_onboarding_page.js";
import { groupDeleteRequestPageHTML } from "./src/group_delete_request_page.js";
import { sharedScriptsPageHTML } from "./src/shared_scripts_page.js";
import { infoHubPageHTML, infoTheatersPageHTML } from "./src/info_hub_page.js";
import { infoGroupsPageHTML } from "./src/info_groups_page.js";
import { infoEventsPageHTML } from "./src/info_events_page.js";
import { infoNewsPageHTML } from "./src/info_news_page.js";
import { gatePageHTML, gateTopPageHTML } from "./src/gate_page.js";
import { baseHubPageHTML } from "./src/base_hub_page.js";
import { gateEditorPageHTML, gateEditorListPageHTML } from "./src/gate_editor_page.js";
import { theaterEditorPageHTML } from "./src/theater_editor_page.js";
import { projectPageHTML } from "./src/project_page.js";
import { architecturePageHTML } from "./src/architecture_page.js";
import { joinPageHTML } from "./src/join_page.js";
import { feedbackPageHTML } from "./src/feedback_page.js";
import { pageShell } from "./src/web_layout.js";
import { kabukiHelpPageHTML } from "./src/kabuki_help_page.js";
import { jikabukiHelpPageHTML } from "./src/jikabuki_help_page.js";


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
    prefecture: "岐阜県",
    description: "岐阜県郡上市明宝気良。世帯数は130世帯ぐらいの小さな集落。\n2005年、地元の若者たちが集まり、地域の活性化のため、17年ぶりに歌舞伎を復活。\nそれから20年が過ぎ、メンバーは20代から50代まで約40名に。今では地域の毎年の恒例行事として皆に楽しみにしていただけるようになった。\n\n我々は歌舞伎保存会ではない。ただ「気良の人たちに元気になってもらいたい」そして「自分たちも楽しもう」──その思いだけでやってきた。",
    venue: {
      name: "気良座",
      address: "岐阜県郡上市明宝気良（旧明方小学校講堂）"
    },
    contact: {
      instagram: "https://www.instagram.com/kerakabuki_official/",
      website: "https://kerakabuki.jimdofree.com/",
      youtube: "https://www.youtube.com/@kerakabuki",
      x: "https://x.com/KeraKabuki",
      facebook: "https://www.facebook.com/kerakabuki/",
    },
    featured_video: "https://www.youtube.com/watch?v=E1FPzo1PORo",
    theater_id: "kera_za",
    faq: [
      { key: "about_what", category: "{団体名}について", q: "{団体名}とは？（どんな地歌舞伎？）", a: "岐阜県郡上市明宝（めいほう）気良（けら）地区に伝わる地歌舞伎です。地域の人たちが受け継いできた芝居文化として、昔ながらの歌舞伎の心を大切にしながら上演を続けています。正式名称は「気良歌舞伎一座（気良歌舞伎保存会）」です。" },
      { key: "about_history", category: "{団体名}について", q: "歴史・歩み（いつ頃から／特徴）", a: "江戸時代末期から明治時代にかけて成立したと考えられています。長い歴史の中で一度途絶えましたが、2005年（平成17年）に復活。以来、地域に根ざした活動を続けながら、時代に合わせた新しい取り組みも行っています。" },
      { key: "about_join", category: "{団体名}について", q: "参加したい／手伝いたい（演者・裏方・ボランティア）", a: "新しい仲間を随時募集しています。経験は問いません。稽古に参加できる方であれば歓迎します。" },
      { key: "about_support", category: "{団体名}について", q: "応援したい（ご祝儀・おひねり・寄付・スポンサー）", a: "観覧時のご祝儀・おひねりや公式SNSのフォローも大切な応援の形です。無理のない範囲でお楽しみください。" },
      { key: "viewing_ticket", category: "観劇の基本", q: "チケットは必要？料金は？予約は？", a: "気良座での定期公演は予約不要・自由席・無料です（ご祝儀・おひねり歓迎）。チケットも不要なので、そのまま会場にお越しください。※公演内容や運営方法は年によって変わることがあります。最新情報は公式サイトもご確認ください。" },
      { key: "viewing_photo", category: "観劇の基本", q: "写真・動画撮影はOK？（幕間のみ等ルール）", a: "撮影についてのルールは公演ごとに案内があります。当日のアナウンスや掲示を必ずご確認ください。" },
      { key: "viewing_clothing", category: "観劇の基本", q: "服装のおすすめ／持ち物（寒暖対策・座布団等）", a: "自由席です。椅子はありますが数に限りがあるため、座布団や敷物があると安心です。秋の公演は会場周辺が肌寒いこともある一方、会場内は熱気で暑くなることも。脱ぎ着しやすい服装がおすすめです。" },
      { key: "viewing_food", category: "観劇の基本", q: "飲食はできる？（持ち込み／売店）", a: "常設の飲食店・売店はありません。公演によっては屋外で軽食の出店（バザー）が出ることがあります。飲み物は持参がおすすめです（においの強いものは控えてください）。" },
      { key: "facility_toilet", category: "会場・設備", q: "トイレはある？", a: "明宝歴史民俗資料館のトイレをご利用ください。" },
      { key: "facility_barrier_free", category: "会場・設備", q: "バリアフリー対応（段差／車椅子／優先席）", a: "バリアフリー対応の施設ではありません。入口で靴を脱いで上がる際に段差があります。靴を入れるポリ袋は会場で用意しています。大きな荷物の預かりやロッカーはないため、できるだけ最小限の荷物でのご来場をおすすめします。" },
      { key: "access_directions", category: "アクセス・駐車場", q: "会場へのアクセスは？（住所／ナビ設定）", a: "【住所】岐阜県郡上市明宝気良154\n【車】郡上八幡ICから約30分。ナビは「明宝歴史民俗資料館」を目指してください。駐車場は無料です。\n【公共交通】郡上八幡駅から明宝線バスで明宝庁舎前下車、徒歩約10分。終演後はバスがないため、公共交通のみの往復は難しい場合があります。" },
      { category: "観劇の基本", q: "ご祝儀・おひねりってなに？", a: "ご祝儀は応援の気持ちとして受付でお預かりするものです。おひねりは主に小銭などを紙に包んだもので、役者が決めポーズ（見得など）をしたタイミングで舞台に向かって投げて応援します。どちらも必須ではありませんので、無理のない範囲でお楽しみください。" },
    ],
    next_performance: {
      title: "令和8年 気良歌舞伎公演（予定）",
      date: "令和8年9月26日（土） 17:00 開演",
      venue: "気良座（旧明方小学校講堂）",
      note: "詳細は決まり次第お知らせします。最新情報はInstagramでもご確認いただけます。"
    },
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2026-02-16T00:00:00Z"
  }
};

const GATE_GROUPS = [
  { id: "kera", name: "気良歌舞伎" },
];

async function loadGateGroups(env) {
  const raw = await env.CHAT_HISTORY.get("gate_registry");
  if (raw) return JSON.parse(raw);
  const seed = GATE_GROUPS.map(g => ({ ...g, addedAt: "2024-01-01T00:00:00Z" }));
  await env.CHAT_HISTORY.put("gate_registry", JSON.stringify(seed));
  return seed;
}

async function addToGateRegistry(env, groupId, groupName) {
  const list = await loadGateGroups(env);
  if (list.some(g => g.id === groupId)) return list;
  list.push({ id: groupId, name: groupName, addedAt: new Date().toISOString() });
  await env.CHAT_HISTORY.put("gate_registry", JSON.stringify(list));
  return list;
}

async function removeFromGateRegistry(env, groupId) {
  const list = await loadGateGroups(env);
  const filtered = list.filter(g => g.id !== groupId);
  if (filtered.length !== list.length) {
    await env.CHAT_HISTORY.put("gate_registry", JSON.stringify(filtered));
  }
  return filtered;
}

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
  const gateList = await loadGateGroups(env);
  const groups = [];
  for (const entry of gateList) {
    const g = await getGroup(env, entry.id);
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

    // www → ルートドメインへリダイレクト
    const reqUrl = new URL(request.url);
    if (reqUrl.hostname === "www.kabukiplus.com") {
      reqUrl.hostname = "kabukiplus.com";
      return Response.redirect(reqUrl.toString(), 301);
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
       0) Assets配信（R2 → 画像/JS/CSSを返す）
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
       0.2) PWA: manifest.json & Service Worker
    ===================================================== */
    if (path === "/manifest.json") {
      const manifest = {
        name: "KABUKI PLUS+",
        short_name: "KABUKI+",
        description: "歌舞伎をもっと面白く。演目ガイド・公演情報・観劇記録・団体運営をデジタルでサポート。",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#A8873A",
        background_color: "#FAF7F2",
        lang: "ja",
        categories: ["entertainment", "education"],
        icons: [
          { src: "/assets/icon-192.png",  sizes: "192x192",  type: "image/png", purpose: "any" },
          { src: "/assets/icon-512.png",  sizes: "512x512",  type: "image/png", purpose: "any" },
          { src: "/assets/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/assets/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
          { name: "NAVI — 演目ガイド", short_name: "NAVI", url: "/kabuki/navi", icons: [{ src: "/assets/icon-192.png", sizes: "192x192" }] },
          { name: "LIVE — 公演情報",   short_name: "LIVE", url: "/kabuki/live", icons: [{ src: "/assets/icon-192.png", sizes: "192x192" }] },
          { name: "BASE — 団体運営",   short_name: "BASE", url: "/jikabuki/base", icons: [{ src: "/assets/icon-192.png", sizes: "192x192" }] },
        ],
      };
      return new Response(JSON.stringify(manifest), {
        headers: {
          "Content-Type": "application/manifest+json; charset=utf-8",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    if (path === "/sw.js") {
      const swCode = `
// KABUKI PLUS+ Service Worker
const CACHE_VERSION = 'kp-v1';
const STATIC_CACHE = CACHE_VERSION + '-static';
const RUNTIME_CACHE = CACHE_VERSION + '-runtime';

// プリキャッシュ対象（シェル用最低限のアセット）
const PRECACHE_URLS = [
  '/',
];

// インストール: プリキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// アクティベート: 旧キャッシュ削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith('kp-') && key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// フェッチ戦略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 同一オリジンのみ処理
  if (url.origin !== self.location.origin) return;

  // API・認証はネットワーク直通（キャッシュしない）
  if (url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/auth/') ||
      url.pathname.startsWith('/line')) {
    return;
  }

  // 静的アセット: Cache-first
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTMLページ: Network-first（フォールバック: キャッシュ）
  if (request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || offlinePage()))
    );
    return;
  }
});

// オフラインフォールバックページ
function offlinePage() {
  var html = '<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
    + '<title>\\u30aa\\u30d5\\u30e9\\u30a4\\u30f3 | KABUKI PLUS+</title>'
    + '<meta name="theme-color" content="#A8873A">'
    + '<style>'
    + '*{margin:0;padding:0;box-sizing:border-box}'
    + 'body{font-family:"Noto Sans JP",sans-serif;background:#FAF7F2;color:#3D3127;'
    + 'display:flex;flex-direction:column;align-items:center;justify-content:center;'
    + 'min-height:100vh;text-align:center;padding:2rem;'
    + 'padding-top:env(safe-area-inset-top,0);padding-bottom:env(safe-area-inset-bottom,0)}'
    + '.brand{font-size:10px;letter-spacing:4px;color:#C5A255;margin-bottom:2rem}'
    + '.icon{font-size:4rem;margin-bottom:1.5rem;animation:pulse 2s ease infinite}'
    + '@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}'
    + 'h1{font-size:1.2rem;font-weight:700;margin-bottom:.5rem;letter-spacing:2px;color:#A8873A}'
    + 'p{font-size:.9rem;color:#7A6F63;line-height:1.7;margin-bottom:1.5rem}'
    + 'button{padding:.7rem 2rem;border:1px solid #C5A255;border-radius:8px;'
    + 'background:linear-gradient(135deg,#C5A255,#A8873A);color:#fff;'
    + 'font-size:.9rem;cursor:pointer;font-family:inherit;font-weight:600;letter-spacing:1px}'
    + 'button:hover{opacity:.9}'
    + '#cp{margin-top:2rem;text-align:left;width:100%;max-width:320px}'
    + '#cp h2{font-size:.8rem;color:#A89E93;margin-bottom:.5rem;letter-spacing:1px}'
    + '#cp a{display:block;padding:.5rem 0;color:#A8873A;text-decoration:none;'
    + 'border-bottom:1px solid #EDE7DD;font-size:.85rem}'
    + '#cp a:hover{color:#C5A255}'
    + '</style></head><body>'
    + '<div class="brand">KABUKI PLUS+</div>'
    + '<div class="icon">\\ud83c\\udfad</div>'
    + '<h1>\\u30aa\\u30d5\\u30e9\\u30a4\\u30f3\\u3067\\u3059</h1>'
    + '<p>\\u30a4\\u30f3\\u30bf\\u30fc\\u30cd\\u30c3\\u30c8\\u306b\\u63a5\\u7d9a\\u3067\\u304d\\u307e\\u305b\\u3093\\u3002<br>'
    + '\\u96fb\\u6ce2\\u306e\\u826f\\u3044\\u5834\\u6240\\u3067\\u518d\\u5ea6\\u304a\\u8a66\\u3057\\u304f\\u3060\\u3055\\u3044\\u3002</p>'
    + '<button onclick="location.reload()">\\u518d\\u8aad\\u307f\\u8fbc\\u307f</button>'
    + '<div id="cp"></div>'
    + '<script>'
    + '(async function(){'
    + 'try{var c=await caches.open("kp-v1-runtime");var k=await c.keys();'
    + 'var p=k.filter(function(r){return r.url.indexOf("/assets/")<0&&r.url.indexOf("/api/")<0;});'
    + 'if(!p.length)return;var el=document.getElementById("cp");'
    + 'var h="<h2>\\u95b2\\u89a7\\u6e08\\u307f\\u30da\\u30fc\\u30b8</h2>";'
    + 'p.slice(0,8).forEach(function(r){var u=new URL(r.url);'
    + 'var l=u.pathname==="/"?"\\u30c8\\u30c3\\u30d7":u.pathname.replace(/\\\\//g," / ").trim();'
    + 'h+="<a href=\\""+u.pathname+"\\">"+l+"</a>";});'
    + 'el.innerHTML=h;}catch(e){}'
    + '})();'
    + '<\\/script>'
    + '</body></html>';
  return new Response(html, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
`;
      return new Response(swCode.trim(), {
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "no-cache, max-age=0",
          "Service-Worker-Allowed": "/",
        },
      });
    }

    /* =====================================================
       0.3) WEBページ（フルページ）
    ===================================================== */
    const HTML_HEADERS = {
      "Content-Type": "text/html; charset=utf-8",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    };

    if (path === "/") {
      return new Response(topPageHTML(), { headers: HTML_HEADERS });
    }

    /* ─── 301: KABUKI PLUS+ 旧URL → /kabuki/* ─── */
    if (path === "/navi") return new Response(null, { status: 301, headers: { "Location": "/kabuki/navi" } });

    /* ─── KABUKI PLUS+ 新URL: /kabuki/* ─── */
    if (path === "/kabuki") return new Response(null, { status: 301, headers: { "Location": "/kabuki/navi" } });
    if (path === "/kabuki/help") return new Response(kabukiHelpPageHTML({ googleClientId: env.GOOGLE_CLIENT_ID || "" }), { headers: HTML_HEADERS });
    if (path === "/kabuki/navi") return new Response(naviPageHTML({ googleClientId: env.GOOGLE_CLIENT_ID || "" }), { headers: HTML_HEADERS });
    if (path === "/kabuki/navi/theater") return new Response(kangekinaviPageHTML({ googleClientId: env.GOOGLE_CLIENT_ID || "" }), { headers: HTML_HEADERS });
    if (path === "/kabuki/navi/manners") return new Response(mannersPageHTML({ googleClientId: env.GOOGLE_CLIENT_ID || "" }), { headers: HTML_HEADERS });
    if (path === "/kabuki/navi/enmoku" || path.startsWith("/kabuki/navi/enmoku/")) return new Response(enmokuPageHTML({ googleClientId: env.GOOGLE_CLIENT_ID || "" }), { headers: HTML_HEADERS });
    if (path === "/kabuki/navi/glossary" || path.startsWith("/kabuki/navi/glossary/")) return new Response(glossaryPageHTML({ googleClientId: env.GOOGLE_CLIENT_ID || "" }), { headers: HTML_HEADERS });
    if (path === "/kabuki/navi/recommend" || path.startsWith("/kabuki/navi/recommend/")) return new Response(recommendPageHTML({ googleClientId: env.GOOGLE_CLIENT_ID || "" }), { headers: HTML_HEADERS });
    if (path === "/kabuki/live") return new Response(await livePageHTML(env), { headers: HTML_HEADERS });
    if (path === "/kabuki/live/news") return new Response(newsPageHTML({ googleClientId: env.GOOGLE_CLIENT_ID || "" }), { headers: HTML_HEADERS });
    if (path === "/kabuki/reco") return new Response(mypagePageHTML({ googleClientId: env.GOOGLE_CLIENT_ID || "" }), { headers: HTML_HEADERS });
    if (path === "/kabuki/dojo") return new Response(dojoPageHTML({ googleClientId: env.GOOGLE_CLIENT_ID || "" }), { headers: HTML_HEADERS });
    if (path === "/kabuki/dojo/quiz") return new Response(quizPageHTML(), { headers: HTML_HEADERS });
    if (path === "/kabuki/dojo/training") return new Response(null, { status: 301, headers: { "Location": "/kabuki/dojo" } });
    if (path === "/kabuki/dojo/training/kakegoe") return new Response(kakegoePageHTML(), { headers: HTML_HEADERS });
    if (path === "/kabuki/dojo/training/kakegoe/editor") return new Response(kakegoeEditorHTML(), { headers: HTML_HEADERS });
    if (path === "/kabuki/dojo/training/serifu") return new Response(serifuPageHTML(), { headers: { ...HTML_HEADERS, "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate", "Pragma": "no-cache", "Expires": "0" } });
    if (path === "/kabuki/dojo/training/serifu/editor") return new Response(serifuEditorHTML(), { headers: HTML_HEADERS });

    /* ─── /kerakabuki/* 気良歌舞伎専用サブページ ─── */
    if (path === "/kerakabuki/about" || path === "/jikabuki/gate/kera/about") return new Response(aboutPageHTML(), { headers: HTML_HEADERS });
    if (path === "/kerakabuki/story" || path.startsWith("/kerakabuki/story/") || path === "/jikabuki/gate/kera/story" || path.startsWith("/jikabuki/gate/kera/story/")) return new Response(storyPageHTML(), { headers: HTML_HEADERS });
    if (path === "/kerakabuki/kawaraban" || path === "/jikabuki/gate/kera/kawaraban") return new Response(kawarabanPageHTML(), { headers: HTML_HEADERS });
    if (path === "/kerakabuki/nft" || path === "/jikabuki/gate/kera/nft") return new Response(nftGuidePageHTML(), { headers: HTML_HEADERS });
    if (path === "/jikabuki/gate/kera/performance") return new Response(null, { status: 302, headers: { "Location": "/jikabuki/gate/kera" } });
    const kwGateMatch = path.match(/^\/kerakabuki\/kawaraban\/pdf\/(\d{2})$/) || path.match(/^\/jikabuki\/gate\/kera\/kawaraban\/pdf\/(\d{2})$/);
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

    /* ─── JIKABUKI GATE トップ（団体一覧） ─── */
    if (path === "/jikabuki/gate") {
      const gateList = await loadGateGroups(env);
      const defaultGroupsMap = {};
      for (const entry of gateList) {
        const g = await getGroup(env, entry.id);
        if (g) defaultGroupsMap[entry.id] = g;
      }
      return new Response(gateTopPageHTML(gateList, defaultGroupsMap, { googleClientId: env.GOOGLE_CLIENT_ID || "" }), { headers: HTML_HEADERS });
    }

    /* ─── JIKABUKI GATE 各団体ページ ─── */
    {
      const gateMatch = path.match(/^\/jikabuki\/gate\/([a-zA-Z0-9_-]+)$/);
      if (gateMatch) {
        const gateId = gateMatch[1];
        try {
          const gateGroupsReg = await loadGateGroups(env);
          if (!gateGroupsReg.some(g => g.id === gateId)) {
            return new Response(pageShell({
              title: "GATE",
              subtitle: "団体が見つかりません",
              bodyHTML: `<div class="empty-state">指定された団体は登録されていません。</div>`,
              brand: "jikabuki",
              activeNav: "gate",
            }), { headers: HTML_HEADERS });
          }
          const group = await getGroup(env, gateId);
          let r2Links = {};
          let r2Pref = "";
          try {
            const r2Obj = await env.CONTENT_BUCKET.get("jikabuki_groups.json");
            if (r2Obj) {
              const r2Data = await r2Obj.json();
              const r2Group = (r2Data.groups || []).find(g => g.name === (group && group.name));
              if (r2Group) {
                r2Links = r2Group.links || {};
                r2Pref = r2Group.prefecture || "";
              }
            }
          } catch (_) {}
          const gateGroupsList = [];
          for (const gg of gateGroupsReg) {
            const gData = await getGroup(env, gg.id);
            gateGroupsList.push({ id: gg.id, name: gg.name, prefecture: gData ? (gData.prefecture || "") : "" });
          }
          const effectivePrefecture = (group && group.prefecture) || r2Pref;
          const html = gatePageHTML(group, {
            links: r2Links,
            prefecture: effectivePrefecture,
            gateGroups: gateGroupsList,
            currentGroupId: gateId,
            googleClientId: env.GOOGLE_CLIENT_ID || "",
          });
          return new Response(html, { headers: HTML_HEADERS });
        } catch (e) {
          return new Response("Error: " + e.message, { status: 500 });
        }
      }
    }

    /* ─── JIKABUKI INFO/BASE 新URL ─── */
    if (path === "/jikabuki/help") return new Response(jikabukiHelpPageHTML({ googleClientId: env.GOOGLE_CLIENT_ID || "" }), { headers: HTML_HEADERS });
    if (path === "/jikabuki/info/news") return new Response(infoNewsPageHTML(), { headers: HTML_HEADERS });
    if (path === "/jikabuki/info/groups") return new Response(infoGroupsPageHTML(), { headers: HTML_HEADERS });
    if (path === "/jikabuki/info/events" || path === "/jikabuki/info/calendar") return new Response(infoEventsPageHTML(), { headers: HTML_HEADERS });
    if (path === "/jikabuki/info/theaters") return new Response(infoTheatersPageHTML(), { headers: HTML_HEADERS });
    if (path === "/jikabuki/base/theaters") return new Response(theaterEditorPageHTML(), { headers: HTML_HEADERS });
    if (path === "/jikabuki/base/onboarding") return new Response(groupOnboardingPageHTML(), { headers: HTML_HEADERS });
    if (path === "/jikabuki/base/delete-request") {
      const gid = url.searchParams.get("group") || "";
      const group = gid ? await getGroup(env, gid) : null;
      return new Response(groupDeleteRequestPageHTML({
        groupId: gid,
        groupName: group ? (group.name || gid) : gid,
        googleClientId: env.GOOGLE_CLIENT_ID || "",
      }), { headers: HTML_HEADERS });
    }
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
    if (path === "/jikabuki/base/db") return new Response(null, { status: 302, headers: { "Location": "/jikabuki/base" } });

    if (path === "/project") {
      return new Response(projectPageHTML(), { headers: HTML_HEADERS });
    }

    if (path === "/join") {
      const contactUrl = env.JOIN_CONTACT_URL || "/jikabuki/gate/kera";
      const html = joinPageHTML({
        siteName: "KABUKI PLUS+",
        projectName: "気良歌舞伎×AIプロジェクト",
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
      return new Response(baseHubPageHTML({ googleClientId: env.GOOGLE_CLIENT_ID || "" }), { headers: HTML_HEADERS });
    }

    if (path === "/jikabuki/info") {
      return new Response(infoHubPageHTML(), { headers: HTML_HEADERS });
    }

    if (path === "/jikabuki/labo") {
      return new Response(laboHubPageHTML({ googleClientId: env.GOOGLE_CLIENT_ID || "" }), { headers: HTML_HEADERS });
    }
    if (path === "/jikabuki/labo/enmoku") {
      return new Response(laboEnmokuPageHTML({ googleClientId: env.GOOGLE_CLIENT_ID || "" }), { headers: HTML_HEADERS });
    }
    if (path === "/jikabuki/labo/glossary") {
      return new Response(laboGlossaryPageHTML({ googleClientId: env.GOOGLE_CLIENT_ID || "" }), { headers: HTML_HEADERS });
    }
    if (path === "/jikabuki/labo/quiz") {
      return new Response(laboQuizPageHTML({ googleClientId: env.GOOGLE_CLIENT_ID || "" }), { headers: HTML_HEADERS });
    }
    if (path === "/jikabuki/labo/gate") {
      return new Response(gateEditorListPageHTML(await loadGateGroups(env)), { headers: HTML_HEADERS });
    }
    {
      const laboGateMatch = path.match(/^\/jikabuki\/labo\/gate\/([a-zA-Z0-9_-]+)$/);
      if (laboGateMatch) {
        return new Response(gateEditorPageHTML(laboGateMatch[1], "labo"), { headers: HTML_HEADERS });
      }
    }

    if (path === "/jikabuki") {
      return new Response(null, { status: 302, headers: { "Location": "/?brand=jikabuki" } });
    }

    /* =====================================================
       0.5) 団体ページ（JIKABUKI PLUS+ マルチテナント）
    ===================================================== */
    if (path.startsWith("/groups/kira")) {
      const newPath = path.replace("/groups/kira", "/groups/kera");
      return new Response(null, { status: 301, headers: { "Location": newPath } });
    }

    const groupGateEditMatch = path.match(/^\/groups\/([a-zA-Z0-9_-]+)\/gate-edit$/);
    if (groupGateEditMatch) {
      return new Response(gateEditorPageHTML(groupGateEditMatch[1], "base"), { headers: HTML_HEADERS });
    }

    const groupPerfMatch = path.match(/^\/groups\/([a-zA-Z0-9_-]+)\/performances$/);
    if (groupPerfMatch) {
      const group = await getGroup(env, groupPerfMatch[1]);
      return new Response(groupPerformancePageHTML(group), { headers: HTML_HEADERS });
    }

    const groupRecordsMatch = path.match(/^\/groups\/([a-zA-Z0-9_-]+)\/records$/);
    if (groupRecordsMatch) {
      const group = await getGroup(env, groupRecordsMatch[1]);
      return new Response(groupRecordsPageHTML(group, env.GOOGLE_CLIENT_ID || ""), { headers: HTML_HEADERS });
    }

    const groupEnmokuSelectMatch = path.match(/^\/groups\/([a-zA-Z0-9_-]+)\/enmoku-select$/);
    if (groupEnmokuSelectMatch) {
      const group = await getGroup(env, groupEnmokuSelectMatch[1]);
      return new Response(groupEnmokuSelectPageHTML(group, env.GOOGLE_CLIENT_ID || ""), { headers: HTML_HEADERS });
    }

    const groupActorsMatch = path.match(/^\/groups\/([a-zA-Z0-9_-]+)\/actors$/);
    if (groupActorsMatch) {
      const group = await getGroup(env, groupActorsMatch[1]);
      return new Response(groupActorsPageHTML(group, env.GOOGLE_CLIENT_ID || ""), { headers: HTML_HEADERS });
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
      const group = gid === "labo"
        ? { group_id: "labo", name: "LABO 台本共有", tagline: "LABOエディターが管理する共有台本" }
        : await getGroup(env, gid);
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

    const groupScheduleMatch = path.match(/^\/groups\/([a-zA-Z0-9_-]+)\/schedule$/);
    if (groupScheduleMatch) {
      const group = await getGroup(env, groupScheduleMatch[1]);
      return new Response(groupSchedulePageHTML(group), { headers: HTML_HEADERS });
    }

    /* /groups/:groupId/invite/:token → 招待リンクランディングページ */
    const groupInviteMatch = path.match(/^\/groups\/([a-zA-Z0-9_-]+)\/invite\/([a-zA-Z0-9_-]+)$/);
    if (groupInviteMatch) {
      const invGid = groupInviteMatch[1];
      const invToken = groupInviteMatch[2];
      const group = await getGroup(env, invGid);

      if (!group || group.invite_token !== invToken) {
        return new Response(groupInvitePageHTML(group, invToken, "invalid"), { headers: HTML_HEADERS });
      }

      const session = await getSession(request, env);
      if (!session) {
        return new Response(groupInvitePageHTML(group, invToken, "login"), { headers: HTML_HEADERS });
      }

      // ログイン済み → 自動参加してBASEへリダイレクト
      const members = await loadGroupMembers(env, invGid);
      if (!members.some(m => m.userId === session.userId)) {
        await approveGroupMember(env, invGid, session.userId, session.displayName || "", session.pictureUrl || "");
      }
      return new Response(null, { status: 302, headers: { Location: "/jikabuki/base" } });
    }

    /* /groups/:groupId/members → メンバー管理専用ページ */
    const groupMembersMatch = path.match(/^\/groups\/([a-zA-Z0-9_-]+)\/members$/);
    if (groupMembersMatch) {
      const group = await getGroup(env, groupMembersMatch[1]);
      return new Response(groupMembersPageHTML(group), { headers: HTML_HEADERS });
    }

    /* /groups/:groupId → メンバーはBASEハブ、それ以外はGATEへ */
    const groupSiteMatch = path.match(/^\/groups\/([a-zA-Z0-9_-]+)\/?$/);
    if (groupSiteMatch) {
      const gsGid = groupSiteMatch[1];
      try {
        const session = await getSession(request, env);
        if (session) {
          const members = await loadGroupMembers(env, gsGid);
          const isMember = members.some(m => m.userId === session.userId);
          const isMaster = await checkIsMaster(env, session.userId);
          if (isMember || isMaster) {
            return new Response(null, { status: 302, headers: { Location: "/jikabuki/base" } });
          }
        }
      } catch (_) {}
      return new Response(null, { status: 302, headers: { Location: `/jikabuki/gate/${gsGid}` } });
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

    // エディター権限 API
    if (path === "/api/editor/request" && request.method === "POST") {
      const editorReqRes = await requestEditorAccess(request, env);
      const editorReqData = await editorReqRes.clone().json().catch(() => ({}));
      if (editorReqData.ok && editorReqData.status === "requested" && env.RESEND_API_KEY) {
        const displayName = editorReqData.displayName || "（名前未取得）";
        const email = editorReqData.email || "（メール未取得）";
        ctx.waitUntil(
          fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "onboarding@resend.dev",
              to: ["kerakabuki@gmail.com"],
              subject: `【JIKABUKI】エディター権限の申請が届きました — ${displayName}`,
              html: `
                <h2>エディター権限の申請が届きました</h2>
                <table style="border-collapse:collapse;font-size:14px;">
                  <tr><td style="padding:4px 12px 4px 0;color:#666;">申請者</td><td><strong>${displayName}</strong></td></tr>
                  <tr><td style="padding:4px 12px 4px 0;color:#666;">メール</td><td>${email}</td></tr>
                  <tr><td style="padding:4px 12px 4px 0;color:#666;">申請日時</td><td>${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</td></tr>
                </table>
                <p style="margin-top:16px;">
                  <a href="https://kabukiplus.com/jikabuki/labo" style="display:inline-block;padding:10px 20px;background:#c5a255;color:#fff;text-decoration:none;border-radius:6px;">申請を確認・承認する（LABOへ）</a>
                </p>
              `,
            }),
          }).then(r => r.json()).then(j => console.log("Resend editor request:", JSON.stringify(j))).catch(e => console.error("Resend editor request error:", e))
        );
      }
      return corsResponse(request, editorReqRes);
    }
    if (path === "/api/editor/list") {
      const session = await getSession(request, env);
      if (!session) return corsResponse(request, jsonResponse({ error: "Unauthorized" }, 401));
      const isMasterList = await checkIsMaster(env, session.userId);
      if (!isMasterList) return corsResponse(request, jsonResponse({ error: "マスター権限が必要です" }, 403));
      return corsResponse(request, await listEditorRequests(request, env));
    }
    if (path === "/api/editor/approve" && request.method === "POST") {
      const session = await getSession(request, env);
      if (!session) return corsResponse(request, jsonResponse({ error: "Unauthorized" }, 401));
      const isMasterApprove = await checkIsMaster(env, session.userId);
      if (!isMasterApprove) return corsResponse(request, jsonResponse({ error: "マスター権限が必要です" }, 403));
      return corsResponse(request, await approveEditor(request, env));
    }
    if (path === "/api/editor/revoke" && request.method === "POST") {
      const session = await getSession(request, env);
      if (!session) return corsResponse(request, jsonResponse({ error: "Unauthorized" }, 401));
      const isMasterRevoke = await checkIsMaster(env, session.userId);
      if (!isMasterRevoke) return corsResponse(request, jsonResponse({ error: "マスター権限が必要です" }, 403));
      return corsResponse(request, await revokeEditor(request, env));
    }
    if (path === "/api/editor/reject" && request.method === "POST") {
      const session = await getSession(request, env);
      if (!session) return corsResponse(request, jsonResponse({ error: "Unauthorized" }, 401));
      const isMasterReject = await checkIsMaster(env, session.userId);
      if (!isMasterReject) return corsResponse(request, jsonResponse({ error: "マスター権限が必要です" }, 403));
      try {
        const body = await request.json();
        if (!body.userId) return corsResponse(request, jsonResponse({ error: "userId is required" }, 400));
        await env.CHAT_HISTORY.delete(`editor_request:${body.userId}`);
        return corsResponse(request, jsonResponse({ ok: true }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    // ★ 団体作成申請 API（オンボーディング用 — ログイン必須、承認制）
    if (path === "/api/groups/request" && request.method === "POST") {
      const session = await getSession(request, env);
      if (!session) return corsResponse(request, jsonResponse({ error: "ログインが必要です" }, 401));
      try {
        const body = await request.json();
        if (!body.managerName || !body.contactEmail || !body.groupData || !body.groupData.name) {
          return corsResponse(request, jsonResponse({ error: "管理者氏名・連絡先メール・団体名は必須です" }, 400));
        }
        const requestId = "gcr_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const reqData = {
          requestId,
          userId: session.userId,
          displayName: session.displayName || "",
          managerName: body.managerName,
          contactEmail: body.contactEmail,
          contactPhone: body.contactPhone || "",
          groupData: body.groupData,
          requestedAt: new Date().toISOString(),
        };
        await env.CHAT_HISTORY.put(`group_create_request:${requestId}`, JSON.stringify(reqData));

        // マスターへメール通知（失敗しても申請自体は成功扱い）
        if (env.RESEND_API_KEY) {
          const gd = body.groupData;
          ctx.waitUntil(
            fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "onboarding@resend.dev",
                to: ["kerakabuki@gmail.com"],
                subject: `【JIKABUKI】団体登録申請が届きました — ${gd.name}`,
                html: `
                  <h2>団体登録申請が届きました</h2>
                  <table style="border-collapse:collapse;font-size:14px;">
                    <tr><td style="padding:6px 12px;font-weight:bold;color:#888;">団体名</td><td style="padding:6px 12px;">${gd.name}</td></tr>
                    <tr><td style="padding:6px 12px;font-weight:bold;color:#888;">都道府県</td><td style="padding:6px 12px;">${gd.prefecture || "—"}</td></tr>
                    <tr><td style="padding:6px 12px;font-weight:bold;color:#888;">管理者</td><td style="padding:6px 12px;">${body.managerName}</td></tr>
                    <tr><td style="padding:6px 12px;font-weight:bold;color:#888;">連絡先</td><td style="padding:6px 12px;">${body.contactEmail}</td></tr>
                    <tr><td style="padding:6px 12px;font-weight:bold;color:#888;">申請ID</td><td style="padding:6px 12px;">${requestId}</td></tr>
                  </table>
                  <p style="margin-top:20px;">
                    <a href="https://kabukiplus.com/jikabuki/labo" style="display:inline-block;padding:10px 20px;background:#c5a255;color:#fff;text-decoration:none;border-radius:6px;">申請を確認・承認する（LABOへ）</a>
                  </p>
                `,
              }),
            }).then(r => r.json()).then(j => console.log("Resend result:", JSON.stringify(j))).catch(e => console.error("Resend error:", e))
          );
        }

        return corsResponse(request, jsonResponse({ ok: true, requestId }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    // ★ 団体作成申請一覧（マスターのみ）
    if (path === "/api/groups/requests" && request.method === "GET") {
      const session = await getSession(request, env);
      if (!session) return corsResponse(request, jsonResponse({ error: "ログインが必要です" }, 401));
      const isMaster = await checkIsMaster(env, session.userId);
      if (!isMaster) return corsResponse(request, jsonResponse({ error: "マスター権限が必要です" }, 403));
      try {
        const list = await env.CHAT_HISTORY.list({ prefix: "group_create_request:" });
        const requests = [];
        for (const key of list.keys) {
          const raw = await env.CHAT_HISTORY.get(key.name);
          if (raw) requests.push(JSON.parse(raw));
        }
        requests.sort((a, b) => (a.requestedAt || "").localeCompare(b.requestedAt || ""));
        return corsResponse(request, jsonResponse({ ok: true, requests }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    // ★ 団体作成申請を承認（マスターのみ → 団体作成 + manager登録 + 申請削除）
    if (path === "/api/groups/requests/approve" && request.method === "POST") {
      const session = await getSession(request, env);
      if (!session) return corsResponse(request, jsonResponse({ error: "ログインが必要です" }, 401));
      const isMaster = await checkIsMaster(env, session.userId);
      if (!isMaster) return corsResponse(request, jsonResponse({ error: "マスター権限が必要です" }, 403));
      try {
        const body = await request.json();
        if (!body.requestId) return corsResponse(request, jsonResponse({ error: "requestId is required" }, 400));
        const raw = await env.CHAT_HISTORY.get(`group_create_request:${body.requestId}`);
        if (!raw) return corsResponse(request, jsonResponse({ error: "申請が見つかりません" }, 404));
        const reqData = JSON.parse(raw);

        const kanaToRomaji = (s) => {
          const map = {"あ":"a","い":"i","う":"u","え":"e","お":"o","か":"ka","き":"ki","く":"ku","け":"ke","こ":"ko","さ":"sa","し":"shi","す":"su","せ":"se","そ":"so","た":"ta","ち":"chi","つ":"tsu","て":"te","と":"to","な":"na","に":"ni","ぬ":"nu","ね":"ne","の":"no","は":"ha","ひ":"hi","ふ":"fu","へ":"he","ほ":"ho","ま":"ma","み":"mi","む":"mu","め":"me","も":"mo","や":"ya","ゆ":"yu","よ":"yo","ら":"ra","り":"ri","る":"ru","れ":"re","ろ":"ro","わ":"wa","を":"wo","ん":"n","が":"ga","ぎ":"gi","ぐ":"gu","げ":"ge","ご":"go","ざ":"za","じ":"ji","ず":"zu","ぜ":"ze","ぞ":"zo","だ":"da","ぢ":"di","づ":"du","で":"de","ど":"do","ば":"ba","び":"bi","ぶ":"bu","べ":"be","ぼ":"bo","ぱ":"pa","ぴ":"pi","ぷ":"pu","ぺ":"pe","ぽ":"po","きゃ":"kya","きゅ":"kyu","きょ":"kyo","しゃ":"sha","しゅ":"shu","しょ":"sho","ちゃ":"cha","ちゅ":"chu","ちょ":"cho","にゃ":"nya","にゅ":"nyu","にょ":"nyo","ひゃ":"hya","ひゅ":"hyu","ひょ":"hyo","みゃ":"mya","みゅ":"myu","みょ":"myo","りゃ":"rya","りゅ":"ryu","りょ":"ryo","ぎゃ":"gya","ぎゅ":"gyu","ぎょ":"gyo","じゃ":"ja","じゅ":"ju","じょ":"jo","びゃ":"bya","びゅ":"byu","びょ":"byo","ぴゃ":"pya","ぴゅ":"pyu","ぴょ":"pyo","ー":"","っ":"xtu"};
          let result = "";
          for (let i = 0; i < s.length; i++) {
            const two = s.substring(i, i + 2);
            if (map[two]) { result += map[two]; i++; }
            else if (map[s[i]]) { result += map[s[i]]; }
            else if (/[a-z0-9]/.test(s[i])) { result += s[i]; }
          }
          return result.replace(/xtu(.)/g, (m, c) => c + c);
        };

        const gd = reqData.groupData;
        let groupId = gd.name_kana
          ? kanaToRomaji(gd.name_kana.toLowerCase()).replace(/[^a-z0-9]/g, "").slice(0, 20)
          : (gd.name || "group").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
        if (!groupId) groupId = "g" + Date.now().toString(36);

        const existingCheck = await env.CHAT_HISTORY.get(`group:${groupId}`);
        if (existingCheck) {
          groupId = groupId + Date.now().toString(36).slice(-4);
        }

        const group = {
          ...gd,
          group_id: groupId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await env.CHAT_HISTORY.put(`group:${groupId}`, JSON.stringify(group));

        await saveGroupMembers(env, groupId, [{
          userId: reqData.userId,
          displayName: reqData.displayName || reqData.managerName,
          role: "manager",
          joinedAt: new Date().toISOString(),
        }]);

        await addToGateRegistry(env, groupId, gd.name);

        await env.CHAT_HISTORY.delete(`group_create_request:${body.requestId}`);
        return corsResponse(request, jsonResponse({ ok: true, groupId, group }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    // ★ 団体作成申請を却下（マスターのみ）
    if (path === "/api/groups/requests/reject" && request.method === "POST") {
      const session = await getSession(request, env);
      if (!session) return corsResponse(request, jsonResponse({ error: "ログインが必要です" }, 401));
      const isMaster = await checkIsMaster(env, session.userId);
      if (!isMaster) return corsResponse(request, jsonResponse({ error: "マスター権限が必要です" }, 403));
      try {
        const body = await request.json();
        if (!body.requestId) return corsResponse(request, jsonResponse({ error: "requestId is required" }, 400));
        const raw = await env.CHAT_HISTORY.get(`group_create_request:${body.requestId}`);
        if (!raw) return corsResponse(request, jsonResponse({ error: "申請が見つかりません" }, 404));
        await env.CHAT_HISTORY.delete(`group_create_request:${body.requestId}`);
        return corsResponse(request, jsonResponse({ ok: true }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    // ★ 団体削除申請（マネージャー）
    if (path === "/api/groups/requests/delete" && request.method === "POST") {
      const session = await getSession(request, env);
      if (!session) return corsResponse(request, jsonResponse({ error: "ログインが必要です" }, 401));
      try {
        const body = await request.json();
        if (!body.groupId || !body.reason) {
          return corsResponse(request, jsonResponse({ error: "groupId・削除理由は必須です" }, 400));
        }
        const authCheck = await requireGroupRole(request, env, body.groupId, "manager");
        if (!authCheck.ok) return corsResponse(request, jsonResponse({ error: "マネージャー権限が必要です" }, 403));
        const group = await getGroup(env, body.groupId);
        const requestId = "gdr_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const reqData = {
          requestId,
          groupId: body.groupId,
          groupName: group ? group.name : body.groupId,
          reason: body.reason,
          userId: session.userId,
          displayName: session.displayName || "",
          requestedAt: new Date().toISOString(),
        };
        await env.CHAT_HISTORY.put(`group_delete_request:${requestId}`, JSON.stringify(reqData));

        if (env.RESEND_API_KEY) {
          ctx.waitUntil(
            fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "onboarding@resend.dev",
                to: ["kerakabuki@gmail.com"],
                subject: `【JIKABUKI】団体削除申請が届きました — ${reqData.groupName}`,
                html: `
                  <h2>団体の削除申請が届きました</h2>
                  <table style="border-collapse:collapse;font-size:14px;">
                    <tr><td style="padding:4px 12px 4px 0;color:#666;">団体名</td><td><strong>${reqData.groupName}</strong></td></tr>
                    <tr><td style="padding:4px 12px 4px 0;color:#666;">申請者</td><td>${reqData.displayName || "（不明）"}</td></tr>
                    <tr><td style="padding:4px 12px 4px 0;color:#666;">削除理由</td><td>${reqData.reason}</td></tr>
                    <tr><td style="padding:4px 12px 4px 0;color:#666;">申請ID</td><td>${requestId}</td></tr>
                    <tr><td style="padding:4px 12px 4px 0;color:#666;">申請日時</td><td>${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</td></tr>
                  </table>
                  <p style="margin-top:16px;">
                    <a href="https://kabukiplus.com/jikabuki/labo" style="display:inline-block;padding:10px 20px;background:#c5a255;color:#fff;text-decoration:none;border-radius:6px;">LABOで確認・承認する</a>
                  </p>
                `,
              }),
            }).then(r => r.json()).then(j => console.log("Resend delete request:", JSON.stringify(j))).catch(e => console.error("Resend delete request error:", e))
          );
        }

        return corsResponse(request, jsonResponse({ ok: true, requestId }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    // ★ 団体削除申請一覧（マスターのみ）
    if (path === "/api/groups/requests/delete" && request.method === "GET") {
      const session = await getSession(request, env);
      if (!session) return corsResponse(request, jsonResponse({ error: "ログインが必要です" }, 401));
      const isMaster = await checkIsMaster(env, session.userId);
      if (!isMaster) return corsResponse(request, jsonResponse({ error: "マスター権限が必要です" }, 403));
      try {
        const list = await env.CHAT_HISTORY.list({ prefix: "group_delete_request:" });
        const requests = [];
        for (const key of list.keys) {
          const raw = await env.CHAT_HISTORY.get(key.name);
          if (raw) requests.push(JSON.parse(raw));
        }
        return corsResponse(request, jsonResponse({ requests }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    // ★ 団体削除申請を承認（マスターのみ → 団体削除 + GATE除外 + 申請削除）
    if (path === "/api/groups/requests/delete/approve" && request.method === "POST") {
      const session = await getSession(request, env);
      if (!session) return corsResponse(request, jsonResponse({ error: "ログインが必要です" }, 401));
      const isMaster = await checkIsMaster(env, session.userId);
      if (!isMaster) return corsResponse(request, jsonResponse({ error: "マスター権限が必要です" }, 403));
      try {
        const body = await request.json();
        if (!body.requestId) return corsResponse(request, jsonResponse({ error: "requestId is required" }, 400));
        const raw = await env.CHAT_HISTORY.get(`group_delete_request:${body.requestId}`);
        if (!raw) return corsResponse(request, jsonResponse({ error: "申請が見つかりません" }, 404));
        const reqData = JSON.parse(raw);
        const result = await cleanupGroup(env, reqData.groupId);
        await removeFromGateRegistry(env, reqData.groupId);
        await env.CHAT_HISTORY.delete(`group_delete_request:${body.requestId}`);
        return corsResponse(request, jsonResponse({ ok: true, groupId: reqData.groupId, cleanup: result }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    // ★ 団体削除申請を却下（マスターのみ）
    if (path === "/api/groups/requests/delete/reject" && request.method === "POST") {
      const session = await getSession(request, env);
      if (!session) return corsResponse(request, jsonResponse({ error: "ログインが必要です" }, 401));
      const isMaster = await checkIsMaster(env, session.userId);
      if (!isMaster) return corsResponse(request, jsonResponse({ error: "マスター権限が必要です" }, 403));
      try {
        const body = await request.json();
        if (!body.requestId) return corsResponse(request, jsonResponse({ error: "requestId is required" }, 400));
        const raw = await env.CHAT_HISTORY.get(`group_delete_request:${body.requestId}`);
        if (!raw) return corsResponse(request, jsonResponse({ error: "申請が見つかりません" }, 404));
        await env.CHAT_HISTORY.delete(`group_delete_request:${body.requestId}`);
        return corsResponse(request, jsonResponse({ ok: true }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    // ★ 団体直接作成 API（マスター限定）
    const groupCreateMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/create$/);
    if (groupCreateMatch && request.method === "POST") {
      const gid = groupCreateMatch[1];
      const session = await getSession(request, env);
      if (!session) return corsResponse(request, jsonResponse({ error: "ログインが必要です" }, 401));
      const isMaster = await checkIsMaster(env, session.userId);
      if (!isMaster) return corsResponse(request, jsonResponse({ error: "マスター権限が必要です" }, 403));
      try {
        const existing = await env.CHAT_HISTORY.get(`group:${gid}`);
        if (existing) return corsResponse(request, jsonResponse({ error: "この団体IDは既に使用されています" }, 409));
        const body = await request.json();
        const group = { ...body, group_id: gid, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        await env.CHAT_HISTORY.put(`group:${gid}`, JSON.stringify(group));
        await saveGroupMembers(env, gid, [{
          userId: session.userId,
          displayName: session.displayName || "",
          role: "manager",
          joinedAt: new Date().toISOString(),
        }]);
        return corsResponse(request, jsonResponse({ ok: true, group }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    // ★ 招待トークン生成 API
    const inviteTokenMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/invite-token$/);
    if (inviteTokenMatch) {
      const gid = inviteTokenMatch[1];
      if (request.method !== "POST") return corsResponse(request, jsonResponse({ error: "Method not allowed" }, 405));
      const authCheck = await requireGroupRole(request, env, gid, "manager");
      if (!authCheck.ok) return corsResponse(request, jsonResponse({ error: authCheck.error }, authCheck.status));
      try {
        const group = await getGroup(env, gid);
        if (!group) return corsResponse(request, jsonResponse({ error: "団体が見つかりません" }, 404));
        const token = crypto.randomUUID().replace(/-/g, "");
        group.invite_token = token;
        group.updated_at = new Date().toISOString();
        await env.CHAT_HISTORY.put(`group:${gid}`, JSON.stringify(group));
        return corsResponse(request, jsonResponse({ ok: true, token }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    // ★ 団体メンバー管理 API
    const memberApiMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/members(?:\/(.+))?$/);
    if (memberApiMatch) {
      const gid = memberApiMatch[1];
      const sub = memberApiMatch[2] || "";

      // POST /api/groups/:id/members/join — 参加申請（ログイン済みなら誰でも）
      if (sub === "join" && request.method === "POST") {
        const joinRes = await requestGroupJoin(request, env, gid);
        const joinData = await joinRes.clone().json().catch(() => ({}));
        if (joinData.ok && joinData.status === "requested" && env.RESEND_API_KEY) {
          const group = await getGroup(env, gid);
          const groupName = group ? group.name : gid;
          const displayName = joinData.displayName || "（名前未取得）";
          const email = joinData.email || "（メール未取得）";
          ctx.waitUntil(
            fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "onboarding@resend.dev",
                to: ["kerakabuki@gmail.com"],
                subject: `【JIKABUKI】団体参加申請が届きました — ${groupName}`,
                html: `
                  <h2>団体への参加申請が届きました</h2>
                  <table style="border-collapse:collapse;font-size:14px;">
                    <tr><td style="padding:4px 12px 4px 0;color:#666;">団体名</td><td><strong>${groupName}</strong></td></tr>
                    <tr><td style="padding:4px 12px 4px 0;color:#666;">申請者</td><td>${displayName}</td></tr>
                    <tr><td style="padding:4px 12px 4px 0;color:#666;">メール</td><td>${email}</td></tr>
                    <tr><td style="padding:4px 12px 4px 0;color:#666;">申請日時</td><td>${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</td></tr>
                  </table>
                  <p style="margin-top:16px;">
                    <a href="https://kabukiplus.com/groups/${gid}/members" style="display:inline-block;padding:10px 20px;background:#c5a255;color:#fff;text-decoration:none;border-radius:6px;">メンバー管理で確認・承認する</a>
                  </p>
                `,
              }),
            }).then(r => r.json()).then(j => console.log("Resend join request:", JSON.stringify(j))).catch(e => console.error("Resend join request error:", e))
          );
        }
        return corsResponse(request, joinRes);
      }

      // POST /api/groups/:id/members/approve — 承認（manager以上）
      if (sub === "approve" && request.method === "POST") {
        const authCheck = await requireGroupRole(request, env, gid, "manager");
        if (!authCheck.ok) return corsResponse(request, jsonResponse({ error: authCheck.error }, authCheck.status));
        try {
          const body = await request.json();
          if (!body.userId) return corsResponse(request, jsonResponse({ error: "userId is required" }, 400));
          // 申請レコードから pictureUrl を取得
          const reqRaw = await env.CHAT_HISTORY.get(`group_join_request:${gid}:${body.userId}`);
          const reqData = reqRaw ? JSON.parse(reqRaw) : {};
          const pictureUrl = body.pictureUrl || reqData.pictureUrl || "";
          const members = await approveGroupMember(env, gid, body.userId, body.displayName, pictureUrl);
          return corsResponse(request, jsonResponse({ ok: true, members }));
        } catch (e) {
          return corsResponse(request, jsonResponse({ error: String(e) }, 500));
        }
      }

      // POST /api/groups/:id/members/reject — 申請却下（manager以上）
      if (sub === "reject" && request.method === "POST") {
        const authCheck = await requireGroupRole(request, env, gid, "manager");
        if (!authCheck.ok) return corsResponse(request, jsonResponse({ error: authCheck.error }, authCheck.status));
        try {
          const body = await request.json();
          if (!body.userId) return corsResponse(request, jsonResponse({ error: "userId is required" }, 400));
          await env.CHAT_HISTORY.delete(`group_join_request:${gid}:${body.userId}`);
          return corsResponse(request, jsonResponse({ ok: true }));
        } catch (e) {
          return corsResponse(request, jsonResponse({ error: String(e) }, 500));
        }
      }

      // POST /api/groups/:id/members/role — 役割変更（manager以上）
      if (sub === "role" && request.method === "POST") {
        const authCheck = await requireGroupRole(request, env, gid, "manager");
        if (!authCheck.ok) return corsResponse(request, jsonResponse({ error: authCheck.error }, authCheck.status));
        try {
          const body = await request.json();
          if (!body.userId || !body.role) return corsResponse(request, jsonResponse({ error: "userId and role are required" }, 400));
          const members = await changeGroupMemberRole(env, gid, body.userId, body.role);
          if (!members) return corsResponse(request, jsonResponse({ error: "Member not found or invalid role" }, 404));
          return corsResponse(request, jsonResponse({ ok: true, members }));
        } catch (e) {
          return corsResponse(request, jsonResponse({ error: String(e) }, 500));
        }
      }

      // DELETE /api/groups/:id/members/:userId — 除名（manager以上）
      if (sub && sub !== "join" && sub !== "approve" && sub !== "reject" && sub !== "role" && request.method === "DELETE") {
        const authCheck = await requireGroupRole(request, env, gid, "manager");
        if (!authCheck.ok) return corsResponse(request, jsonResponse({ error: authCheck.error }, authCheck.status));
        try {
          const targetUserId = decodeURIComponent(sub);
          const members = await removeGroupMember(env, gid, targetUserId);
          return corsResponse(request, jsonResponse({ ok: true, members }));
        } catch (e) {
          return corsResponse(request, jsonResponse({ error: String(e) }, 500));
        }
      }

      // GET /api/groups/:id/members — メンバー一覧 + 申請一覧（member以上）
      if (!sub && request.method === "GET") {
        const authCheck = await requireGroupRole(request, env, gid, "member");
        if (!authCheck.ok) return corsResponse(request, jsonResponse({ error: authCheck.error }, authCheck.status));
        try {
          const members = await loadGroupMembers(env, gid);
          const isManager = authCheck.role === "manager" || authCheck.role === "master";
          const requests = isManager ? await listGroupJoinRequests(env, gid) : [];
          return corsResponse(request, jsonResponse({ members, requests }));
        } catch (e) {
          return corsResponse(request, jsonResponse({ error: String(e) }, 500));
        }
      }
    }

    // DELETE /api/groups/:id — グループ削除（master限定）
    const groupDeleteMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)$/);
    if (groupDeleteMatch && request.method === "DELETE") {
      const gid = groupDeleteMatch[1];
      const session = await getSession(request, env);
      if (!session) return corsResponse(request, jsonResponse({ error: "ログインが必要です" }, 401));
      const isMaster = await checkIsMaster(env, session.userId);
      if (!isMaster) return corsResponse(request, jsonResponse({ error: "マスター権限が必要です" }, 403));
      try {
        const result = await cleanupGroup(env, gid);
        await removeFromGateRegistry(env, gid);
        return corsResponse(request, jsonResponse(result));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    // ★ 稽古パック API（training_pack.json from R2）
    const trainingMatch = path.match(/^\/api\/training\/(kakegoe|serifu)\/([a-zA-Z0-9_-]+)$/);
    if (trainingMatch && request.method === "GET") {
      const tType = trainingMatch[1];
      const tId = trainingMatch[2];
      try {
        const r2Key = `training/${tType}/${tId}.json`;
        const obj = await env.CONTENT_BUCKET.get(r2Key);
        if (!obj) return corsResponse(request, jsonResponse({ error: "Not found" }, 404));
        const data = await obj.json();
        return corsResponse(request, new Response(JSON.stringify(data), {
          headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=3600" }
        }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    /* =====================================================
       0.5) JSON API（WEBページ用データ取得）
    ===================================================== */

    if (path === "/api/news") {
      try {
        const newsUrl = new URL(request.url);
        const feedKeyFilter = newsUrl.searchParams.get("feedKey") || null;
        // KV読み取りに5秒タイムアウト（ハング防止）
        const raw = await Promise.race([
          env.CHAT_HISTORY.get("news:latest"),
          new Promise((_, reject) => setTimeout(() => reject(new Error("KV timeout")), 5000)),
        ]);
        if (raw) {
          const data = JSON.parse(raw);
          if (feedKeyFilter && data.articles) {
            data.articles = data.articles.filter(a => a.feedKey === feedKeyFilter);
          }
          return corsResponse(request, jsonResponse(data));
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
        // サーバー側で period_text から month_key / start_date / end_date を付与
        // 例: "2026年2月1日（日）～26日（木）" / "2026年7月〜8月" / "2025年12月25日～2026年1月26日"
        const items = (data.items || []).map(p => {
          if (!p.period_text) return p;
          const ms = p.period_text.match(/(\d{4})年(\d{1,2})月(?:(\d{1,2})日)?/);
          if (!ms) return p;
          const y = +ms[1], mo = +ms[2], d = ms[3] ? +ms[3] : 1;
          const extra = {
            month_key: y * 100 + mo,
            start_date: `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`,
          };
          // 終了日: 〜 / ～ 以降を解析
          const endPart = p.period_text.split(/[〜～]/).slice(1).join('');
          if (endPart) {
            const ef = endPart.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/); // 年月日フル
            const em = endPart.match(/(\d{1,2})月(\d{1,2})日/);          // 月日のみ
            const ed = endPart.match(/^[^\d]*(\d{1,2})日/);              // 日のみ
            if (ef) extra.end_date = `${ef[1]}-${String(+ef[2]).padStart(2,'0')}-${String(+ef[3]).padStart(2,'0')}`;
            else if (em) extra.end_date = `${y}-${String(+em[1]).padStart(2,'0')}-${String(+em[2]).padStart(2,'0')}`;
            else if (ed) extra.end_date = `${y}-${String(mo).padStart(2,'0')}-${String(+ed[1]).padStart(2,'0')}`;
          }
          return { ...p, ...extra };
        });
        return corsResponse(request, jsonResponse({ ...data, items }));
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

    // ★ 注目演目 API（LIVE×NAVI連携）
    if (path === "/api/featured") {
      try {
        const perfData = await getPerformancesCached(env);
        const items = (perfData.items || []).map(p => {
          if (!p.period_text) return p;
          const ms = p.period_text.match(/(\d{4})年(\d{1,2})月(?:(\d{1,2})日)?/);
          if (!ms) return p;
          const y = +ms[1], mo = +ms[2], d = ms[3] ? +ms[3] : 1;
          const extra = { month_key: y * 100 + mo, start_date: `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}` };
          const endPart = p.period_text.split(/[〜～]/).slice(1).join('');
          if (endPart) {
            const ef = endPart.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
            const em = endPart.match(/(\d{1,2})月(\d{1,2})日/);
            const ed = endPart.match(/^[^\d]*(\d{1,2})日/);
            if (ef) extra.end_date = `${ef[1]}-${String(+ef[2]).padStart(2,'0')}-${String(+ef[3]).padStart(2,'0')}`;
            else if (em) extra.end_date = `${y}-${String(+em[1]).padStart(2,'0')}-${String(+em[2]).padStart(2,'0')}`;
            else if (ed) extra.end_date = `${y}-${String(mo).padStart(2,'0')}-${String(+ed[1]).padStart(2,'0')}`;
          }
          return { ...p, ...extra };
        });
        const featured = await pickFeatured(items, env);
        return corsResponse(request, jsonResponse(featured));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    // ★ LABO用: 未整備候補 API（リアルタイム計算）
    if (path === "/api/missed") {
      try {
        const perfData = await getPerformancesCached(env);
        const items = (perfData.items || []).map(p => {
          if (!p.period_text) return p;
          const ms = p.period_text.match(/(\d{4})年(\d{1,2})月(?:(\d{1,2})日)?/);
          if (!ms) return p;
          const y = +ms[1], mo = +ms[2], d = ms[3] ? +ms[3] : 1;
          const extra = { month_key: y * 100 + mo, start_date: `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}` };
          const endPart = p.period_text.split(/[〜～]/).slice(1).join('');
          if (endPart) {
            const ef = endPart.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
            const em = endPart.match(/(\d{1,2})月(\d{1,2})日/);
            const ed = endPart.match(/^[^\d]*(\d{1,2})日/);
            if (ef) extra.end_date = `${ef[1]}-${String(+ef[2]).padStart(2,'0')}-${String(+ef[3]).padStart(2,'0')}`;
            else if (em) extra.end_date = `${y}-${String(+em[1]).padStart(2,'0')}-${String(+em[2]).padStart(2,'0')}`;
            else if (ed) extra.end_date = `${y}-${String(mo).padStart(2,'0')}-${String(+ed[1]).padStart(2,'0')}`;
          }
          return { ...p, ...extra };
        });
        const featured = await pickFeatured(items, env);
        return corsResponse(request, jsonResponse({ missed: featured.missed || [] }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
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
        let authCheck = await requireGroupRole(request, env, groupId, "manager");
        if (!authCheck.ok) {
          authCheck = await requireEditor(request, env);
        }
        if (!authCheck.ok) return corsResponse(request, jsonResponse({ error: authCheck.error }, authCheck.status));
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
        const authCheck = await requireGroupRole(request, env, gid, "member");
        if (!authCheck.ok) return corsResponse(request, jsonResponse({ error: authCheck.error }, authCheck.status));
        try {
          const body = await request.json();
          const MAX_NOTES = 200;
          let notes = body.notes || [];
          if (notes.length > MAX_NOTES) notes = notes.slice(-MAX_NOTES);
          await env.CHAT_HISTORY.put(kvKey, JSON.stringify({ notes }));
          return corsResponse(request, jsonResponse({ ok: true }));
        } catch (e) {
          return corsResponse(request, jsonResponse({ error: String(e) }, 500));
        }
      }
      // GET: メンバー以上のみ
      const readCheck = await requireGroupRole(request, env, gid, "member");
      if (!readCheck.ok) return corsResponse(request, jsonResponse({ error: readCheck.error }, readCheck.status));
      try {
        const raw = await env.CHAT_HISTORY.get(kvKey);
        const data = raw ? JSON.parse(raw) : { notes: [] };
        return corsResponse(request, jsonResponse(data));
      } catch (e) {
        return corsResponse(request, jsonResponse({ notes: [], error: String(e) }, 500));
      }
    }

    // ★ 稽古スケジュール API
    const scheduleApiBase = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/schedule$/);
    const scheduleApiAttend = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/schedule\/([^/]+)\/attend$/);
    const scheduleApiItem = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/schedule\/([^/]+)$/);

    if (scheduleApiAttend) {
      // POST /api/groups/:id/schedule/:schedId/attend — 出欠回答
      const gid = scheduleApiAttend[1];
      const schedId = decodeURIComponent(scheduleApiAttend[2]);
      if (request.method !== "POST") return corsResponse(request, jsonResponse({ error: "Method not allowed" }, 405));
      const authCheck = await requireGroupRole(request, env, gid, "member");
      if (!authCheck.ok) return corsResponse(request, jsonResponse({ error: authCheck.error }, authCheck.status));
      const session = authCheck.session;
      try {
        const body = await request.json();
        const status = body.status;
        if (!["ok", "maybe", "ng"].includes(status)) {
          return corsResponse(request, jsonResponse({ error: "Invalid status" }, 400));
        }
        const kvKey = `group_schedule:${gid}`;
        const raw = await env.CHAT_HISTORY.get(kvKey);
        const data = raw ? JSON.parse(raw) : { schedules: [] };
        const scheds = data.schedules || [];
        const idx = scheds.findIndex(s => s.id === schedId);
        if (idx < 0) return corsResponse(request, jsonResponse({ error: "Schedule not found" }, 404));
        scheds[idx].attendance = scheds[idx].attendance || {};
        scheds[idx].attendance[session.userId] = { status, note: "" };
        await env.CHAT_HISTORY.put(kvKey, JSON.stringify({ schedules: scheds }));
        return corsResponse(request, jsonResponse({ ok: true }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    if (scheduleApiItem) {
      // DELETE /api/groups/:id/schedule/:schedId — 個別削除
      const gid = scheduleApiItem[1];
      const schedId = decodeURIComponent(scheduleApiItem[2]);
      if (request.method !== "DELETE") return corsResponse(request, jsonResponse({ error: "Method not allowed" }, 405));
      const authCheck = await requireGroupRole(request, env, gid, "member");
      if (!authCheck.ok) return corsResponse(request, jsonResponse({ error: authCheck.error }, authCheck.status));
      const session = authCheck.session;
      const isMaster = await checkIsMaster(env, session.userId);
      try {
        const kvKey = `group_schedule:${gid}`;
        const raw = await env.CHAT_HISTORY.get(kvKey);
        const data = raw ? JSON.parse(raw) : { schedules: [] };
        let scheds = data.schedules || [];
        const target = scheds.find(s => s.id === schedId);
        if (!target) return corsResponse(request, jsonResponse({ error: "Schedule not found" }, 404));
        // 削除可: 作成者 or マネージャー以上 or マスター
        const members = await loadGroupMembers(env, gid);
        const me = members.find(m => m.userId === session.userId);
        const myRole = me ? me.role : null;
        const canDel = isMaster || myRole === "manager" || target.created_by === session.userId;
        if (!canDel) return corsResponse(request, jsonResponse({ error: "権限がありません" }, 403));
        scheds = scheds.filter(s => s.id !== schedId);
        await env.CHAT_HISTORY.put(kvKey, JSON.stringify({ schedules: scheds }));
        return corsResponse(request, jsonResponse({ ok: true }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    if (scheduleApiBase) {
      const gid = scheduleApiBase[1];
      const kvKey = `group_schedule:${gid}`;

      if (request.method === "POST") {
        // POST /api/groups/:id/schedule — スケジュール追加・更新 or 公演目標保存
        const authCheck = await requireGroupRole(request, env, gid, "member");
        if (!authCheck.ok) return corsResponse(request, jsonResponse({ error: authCheck.error }, authCheck.status));
        try {
          const body = await request.json();
          const raw = await env.CHAT_HISTORY.get(kvKey);
          const data = raw ? JSON.parse(raw) : { schedules: [] };

          // 公演目標の保存 + GATE next_performance 自動同期
          if ("performance_goal" in body) {
            const goal = body.performance_goal || null;
            data.performance_goal = goal;
            await env.CHAT_HISTORY.put(kvKey, JSON.stringify(data));

            // 団体KVの next_performance を同期
            try {
              const group = await getGroup(env, gid);
              if (group) {
                if (goal) {
                  let dateStr = "";
                  if (goal.date) {
                    const parts = goal.date.split("-");
                    const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    const dayNames = ["日","月","火","水","木","金","土"];
                    dateStr = `${dt.getFullYear()}年${dt.getMonth()+1}月${dt.getDate()}日(${dayNames[dt.getDay()]})`;
                  }
                  const playsStr = (goal.plays && goal.plays.length) ? " / " + goal.plays.map(p => typeof p === "string" ? p : (p.name || "")).filter(Boolean).join("・") : "";
                  const dateLine = (dateStr + playsStr) || "";
                  group.next_performance = {
                    title: goal.title || "",
                    date: dateLine,
                    venue: goal.venue || "",
                    note: goal.note || "",
                    image: (group.next_performance && group.next_performance.image) || ""
                  };
                } else {
                  group.next_performance = null;
                }
                group.updated_at = new Date().toISOString();
                await env.CHAT_HISTORY.put(`group:${gid}`, JSON.stringify(group));
              }
            } catch (_) { /* 同期失敗してもスケジュール保存自体は成功扱い */ }

            return corsResponse(request, jsonResponse({ ok: true }));
          }

          // 師匠の一言の保存
          if ("shisho_hitokoto" in body) {
            data.shisho_hitokoto = body.shisho_hitokoto || null;
            await env.CHAT_HISTORY.put(kvKey, JSON.stringify(data));
            return corsResponse(request, jsonResponse({ ok: true }));
          }

          const entry = body.schedule;
          const isNew = !!body.isNew;
          if (!entry || !entry.id || !entry.title || !entry.date) {
            return corsResponse(request, jsonResponse({ error: "Invalid schedule data" }, 400));
          }
          const MAX_SCHEDULES = 500;
          let scheds = data.schedules || [];
          if (isNew) {
            if (scheds.length >= MAX_SCHEDULES) {
              return corsResponse(request, jsonResponse({ error: `スケジュール上限(${MAX_SCHEDULES}件)に達しました` }, 400));
            }
            scheds.push(entry);
            env && notifyScheduleToMembers(env, gid, entry).catch(() => {});
          } else {
            const idx = scheds.findIndex(s => s.id === entry.id);
            if (idx >= 0) scheds[idx] = entry; else scheds.push(entry);
          }
          data.schedules = scheds;
          await env.CHAT_HISTORY.put(kvKey, JSON.stringify(data));
          return corsResponse(request, jsonResponse({ ok: true }));
        } catch (e) {
          return corsResponse(request, jsonResponse({ error: String(e) }, 500));
        }
      }

      // GET /api/groups/:id/schedule — 一覧取得
      const readCheck = await requireGroupRole(request, env, gid, "member");
      if (!readCheck.ok) return corsResponse(request, jsonResponse({ error: readCheck.error }, readCheck.status));
      try {
        const raw = await env.CHAT_HISTORY.get(kvKey);
        const data = raw ? JSON.parse(raw) : { schedules: [] };
        return corsResponse(request, jsonResponse(data));
      } catch (e) {
        return corsResponse(request, jsonResponse({ schedules: [], error: String(e) }, 500));
      }
    }

    // ★ 公演記録詳細 API
    const recordsApiMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/records$/);
    if (recordsApiMatch) {
      const gid = recordsApiMatch[1];
      const kvKey = `group_records:${gid}`;
      if (request.method === "POST") {
        let authCheck = await requireGroupRole(request, env, gid, "manager");
        if (!authCheck.ok) authCheck = await requireEditor(request, env);
        if (!authCheck.ok) return corsResponse(request, jsonResponse({ error: authCheck.error }, authCheck.status));
        try {
          const body = await request.json();
          const records = body.records || [];
          if (records.length > 200) return corsResponse(request, jsonResponse({ error: "Too many records (max 200)" }, 400));
          await env.CHAT_HISTORY.put(kvKey, JSON.stringify({ records, updatedAt: new Date().toISOString() }));
          return corsResponse(request, jsonResponse({ ok: true }));
        } catch (e) {
          return corsResponse(request, jsonResponse({ error: String(e) }, 500));
        }
      }
      try {
        const raw = await env.CHAT_HISTORY.get(kvKey);
        return corsResponse(request, jsonResponse(raw ? JSON.parse(raw) : { records: [] }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ records: [], error: String(e) }, 500));
      }
    }

    // ★ 演目選定サポート: 候補一覧 API
    const enmokuSelectCandidatesMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/enmoku-select\/candidates$/);
    if (enmokuSelectCandidatesMatch) {
      const gid = enmokuSelectCandidatesMatch[1];
      try {
        const catalog = await loadEnmokuCatalog(env);
        const kvRaw = await env.CHAT_HISTORY.get(`group_records:${gid}`);
        const records = kvRaw ? JSON.parse(kvRaw).records || [] : [];

        // 過去公演から演目別の使用回数・キャスト数・時間・ジャンルを集計
        const pastCounts = {};
        const pastRecordsByNorm = {};
        const pastCastSizes = {};   // norm -> [cast_count, ...]
        const pastDurations = {};   // norm -> [duration_min, ...]
        const pastGenres = {};      // norm -> { genre: count }
        for (const rec of records) {
          for (const play of (rec.plays || [])) {
            const norm = normalizeTitle(play.title || "");
            if (!norm) continue;
            pastCounts[norm] = (pastCounts[norm] || 0) + 1;
            if (!pastRecordsByNorm[norm]) pastRecordsByNorm[norm] = [];
            pastRecordsByNorm[norm].push({ year: rec.year, date_display: rec.date_display, title: rec.title });
            // cast size
            const castLen = (play.cast || []).length;
            if (castLen > 0) {
              if (!pastCastSizes[norm]) pastCastSizes[norm] = [];
              pastCastSizes[norm].push(castLen);
            }
            // duration
            if (play.duration_min) {
              if (!pastDurations[norm]) pastDurations[norm] = [];
              pastDurations[norm].push(play.duration_min);
            }
            // genre
            if (play.genre) {
              if (!pastGenres[norm]) pastGenres[norm] = {};
              pastGenres[norm][play.genre] = (pastGenres[norm][play.genre] || 0) + 1;
            }
          }
        }

        // 全演目JSONを並列ロードしてジャンル・キャスト・時間を取得
        const catalogList = catalog || [];
        const enmokuJsons = await Promise.all(
          catalogList.map(entry => loadEnmokuJson(env, entry.id).catch(() => null))
        );

        // 子役を示すキーワード
        const KODOMO_KEYWORDS = ["子", "若君", "稚児", "姫", "幼", "童"];

        // enmoku JSON から各種データを抽出してマップ化
        const naviDataMap = {};
        for (let i = 0; i < catalogList.length; i++) {
          const data = enmokuJsons[i];
          if (!data) continue;
          const id = catalogList[i].id;

          // info フィールド（オブジェクト or 文字列）
          const info = data.info || (data.sections && data.sections.info);
          let gt = null, naviDuration = null;
          if (info && typeof info === "object") {
            gt = info["種別"] ? String(info["種別"]) : null;
            naviDuration = info["上演時間"] ? String(info["上演時間"]) : null;
          } else if (typeof info === "string") {
            const mg = info.match(/種別[：:]\s*([^\n]+)/);
            if (mg) gt = mg[1].trim();
            const md = info.match(/上演時間[：:]\s*([^\n]+)/);
            if (md) naviDuration = md[1].trim();
          }

          // 上演時間の文字列から数値をパース（"約90分" → 90）
          let naviDurationMin = null;
          if (naviDuration) {
            const mn = naviDuration.match(/(\d+)/);
            if (mn) naviDurationMin = parseInt(mn[1], 10);
          }

          // ジャンルコード
          const genre = gt
            ? (gt.includes("世話") ? "sewamono"
              : gt.includes("時代") ? "jidaimono"
              : (gt.includes("舞踊") || gt.includes("所作")) ? "shosagoto"
              : "other")
            : null;

          // キャスト（登場人物名のリスト）
          const castList = Array.isArray(data.cast) ? data.cast : [];
          const castNames = castList.map(c => (c.name || "").replace(/（[^）]*）/g, "").trim()).filter(Boolean);
          const naviCastSize = castList.length || null;

          // 子役検出（役名または人物名にキーワードが含まれる）
          const hasKodomo = castList.some(c => {
            const name = (c.name || "") + (c.desc || "");
            return KODOMO_KEYWORDS.some(k => name.includes(k));
          });

          naviDataMap[id] = { genre, naviDurationMin, castNames, naviCastSize, hasKodomo };
        }

        const candidates = catalogList.map(entry => {
          const norm = normalizeTitle(entry.short || entry.full || "");
          const navi = naviDataMap[entry.id] || {};

          // known_cast_size: 自団体記録の最大値 > NAVIキャスト数
          const castArr = pastCastSizes[norm] || [];
          const known_cast_size = castArr.length ? Math.max(...castArr)
            : (navi.naviCastSize != null ? navi.naviCastSize : null);
          const cast_source = castArr.length ? "own"
            : navi.naviCastSize != null ? "catalog" : null;

          // known_duration_min: 自団体記録の平均 > NAVIの上演時間
          const durArr = pastDurations[norm] || [];
          const known_duration_min = durArr.length
            ? Math.round(durArr.reduce((a, b) => a + b, 0) / durArr.length)
            : (navi.naviDurationMin != null ? navi.naviDurationMin : null);
          const duration_source = durArr.length ? "own"
            : navi.naviDurationMin != null ? "catalog" : null;

          // known_genre: 公演記録の最多ジャンル
          const genreMap = pastGenres[norm] || {};
          const known_genre = Object.keys(genreMap).sort((a, b) => genreMap[b] - genreMap[a])[0] || null;

          return {
            id: entry.id,
            title: entry.short || entry.full || entry.id,
            full_title: entry.full || "",
            naviId: entry.id,
            past_count: pastCounts[norm] || 0,
            past_records: (pastRecordsByNorm[norm] || []).slice(0, 3),
            known_cast_size,
            cast_source,
            cast_names: navi.castNames || [],
            known_duration_min,
            duration_source,
            has_kodomo: navi.hasKodomo || false,
            known_genre,
            catalog_genre: navi.genre || entry.genre || null,
          };
        });

        return corsResponse(request, jsonResponse({ candidates }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ candidates: [], error: String(e) }, 500));
      }
    }

    // ★ 演目選定サポート: 選定ログ 個別操作 API（PUT / DELETE）
    const enmokuSelectLogItemMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/enmoku-select\/log\/([a-zA-Z0-9_-]+)$/);
    if (enmokuSelectLogItemMatch) {
      const gid   = enmokuSelectLogItemMatch[1];
      const logId = decodeURIComponent(enmokuSelectLogItemMatch[2]);
      const kvKey = `group_enmoku_select_log:${gid}`;

      let authCheck = await requireGroupRole(request, env, gid, "member");
      if (!authCheck.ok) authCheck = await requireEditor(request, env);
      if (!authCheck.ok) return corsResponse(request, jsonResponse({ error: authCheck.error }, authCheck.status));

      try {
        const raw  = await env.CHAT_HISTORY.get(kvKey);
        const data = raw ? JSON.parse(raw) : { logs: [] };

        if (request.method === "PUT") {
          const body  = await request.json();
          const index = data.logs.findIndex(l => l.id === logId);
          if (index === -1) return corsResponse(request, jsonResponse({ error: "not found" }, 404));
          if (body.enmoku_title !== undefined) data.logs[index].enmoku_title = String(body.enmoku_title).slice(0, 200);
          if (body.reason  !== undefined) data.logs[index].reason  = String(body.reason).slice(0, 2000);
          if (body.person  !== undefined) data.logs[index].person  = String(body.person).slice(0, 100);
          data.logs[index].updated_at = new Date().toISOString();
          await env.CHAT_HISTORY.put(kvKey, JSON.stringify(data));
          return corsResponse(request, jsonResponse({ ok: true }));
        }

        if (request.method === "DELETE") {
          const before = data.logs.length;
          data.logs = data.logs.filter(l => l.id !== logId);
          if (data.logs.length === before) return corsResponse(request, jsonResponse({ error: "not found" }, 404));
          await env.CHAT_HISTORY.put(kvKey, JSON.stringify(data));
          return corsResponse(request, jsonResponse({ ok: true }));
        }

        return corsResponse(request, jsonResponse({ error: "method not allowed" }, 405));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    // ★ 演目選定サポート: 選定ログ API（GET / POST）
    const enmokuSelectLogMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/enmoku-select\/log$/);
    if (enmokuSelectLogMatch) {
      const gid = enmokuSelectLogMatch[1];
      const kvKey = `group_enmoku_select_log:${gid}`;

      if (request.method === "POST") {
        let authCheck = await requireGroupRole(request, env, gid, "member");
        if (!authCheck.ok) authCheck = await requireEditor(request, env);
        if (!authCheck.ok) return corsResponse(request, jsonResponse({ error: authCheck.error }, authCheck.status));
        try {
          const body = await request.json();
          if (!body.enmoku_title) return corsResponse(request, jsonResponse({ error: "enmoku_title required" }, 400));
          const raw = await env.CHAT_HISTORY.get(kvKey);
          const data = raw ? JSON.parse(raw) : { logs: [] };
          data.logs.unshift({
            id: `esl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            enmoku_title: String(body.enmoku_title).slice(0, 200),
            enmoku_navi_id: String(body.enmoku_navi_id || "").slice(0, 100),
            reason: String(body.reason || "").slice(0, 2000),
            person: String(body.person || "").slice(0, 100),
            conditions: body.conditions || {},
            created_at: new Date().toISOString(),
          });
          if (data.logs.length > 100) data.logs = data.logs.slice(0, 100);
          await env.CHAT_HISTORY.put(kvKey, JSON.stringify(data));
          return corsResponse(request, jsonResponse({ ok: true }));
        } catch (e) {
          return corsResponse(request, jsonResponse({ error: String(e) }, 500));
        }
      }

      // GET
      try {
        const raw = await env.CHAT_HISTORY.get(kvKey);
        return corsResponse(request, jsonResponse(raw ? JSON.parse(raw) : { logs: [] }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ logs: [], error: String(e) }, 500));
      }
    }

    // ★ 配役サポート: コンテキスト API
    const castingContextMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/casting\/context\/([a-zA-Z0-9_-]+)$/);
    if (castingContextMatch && request.method === "GET") {
      const gid = castingContextMatch[1];
      const enmokuId = castingContextMatch[2];
      try {
        const catalog = await loadEnmokuCatalog(env);
        const entry = (catalog || []).find(e => e.id === enmokuId);
        if (!entry) return corsResponse(request, jsonResponse({ error: "enmoku not found" }, 404));

        const kvRaw = await env.CHAT_HISTORY.get(`group_records:${gid}`);
        const records = kvRaw ? JSON.parse(kvRaw).records || [] : [];

        const targetNorm = normalizeTitle(entry.short || entry.full || "");
        const pastCasts = [];
        const actorMap = {};

        // 役者名の括弧注記（例: 太郎（代役）→太郎）を除去
        const stripParen = s => (s || "").replace(/[\(（][^)）]*[\)）]/g, "").replace(/\s+/g, " ").trim();

        for (const rec of records) {
          for (const play of (rec.plays || [])) {
            const playNorm = normalizeTitle(play.title || "");
            for (const c of (play.cast || [])) {
              const actor = stripParen(c.name);
              if (!actor) continue;
              if (!actorMap[actor]) actorMap[actor] = { count: 0, last_year: 0 };
              actorMap[actor].count++;
              if ((rec.year || 0) > actorMap[actor].last_year) actorMap[actor].last_year = rec.year || 0;
            }
            if (targetNorm && playNorm && (playNorm === targetNorm || playNorm.includes(targetNorm) || targetNorm.includes(playNorm))) {
              pastCasts.push({
                year: rec.year,
                date_display: rec.date_display || "",
                assignments: (play.cast || []).map(c => ({ role: c.role || "", actor: stripParen(c.name) }))
              });
            }
          }
        }

        pastCasts.sort((a, b) => (b.year || 0) - (a.year || 0));
        const actorPool = Object.entries(actorMap)
          .map(([name, info]) => ({ name, count: info.count, last_year: info.last_year }))
          .sort((a, b) => b.last_year - a.last_year || b.count - a.count);

        return corsResponse(request, jsonResponse({
          enmoku_id: enmokuId,
          title: entry.short || entry.full || "",
          full_title: entry.full || "",
          roles: entry.cast_names || [],
          past_casts: pastCasts,
          actor_pool: actorPool,
        }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    // ★ 配役サポート: プラン 個別削除 API
    const castingPlanItemMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/casting\/plans\/([a-zA-Z0-9_-]+)$/);
    if (castingPlanItemMatch && request.method === "DELETE") {
      const gid = castingPlanItemMatch[1];
      const planId = decodeURIComponent(castingPlanItemMatch[2]);
      const kvKey = `group_casting_plans:${gid}`;
      let authCheck = await requireGroupRole(request, env, gid, "member");
      if (!authCheck.ok) authCheck = await requireEditor(request, env);
      if (!authCheck.ok) return corsResponse(request, jsonResponse({ error: authCheck.error }, authCheck.status));
      try {
        const raw = await env.CHAT_HISTORY.get(kvKey);
        const data = raw ? JSON.parse(raw) : { plans: [] };
        const before = data.plans.length;
        data.plans = data.plans.filter(p => p.id !== planId);
        if (data.plans.length === before) return corsResponse(request, jsonResponse({ error: "not found" }, 404));
        await env.CHAT_HISTORY.put(kvKey, JSON.stringify(data));
        return corsResponse(request, jsonResponse({ ok: true }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    // ★ 配役サポート: プラン一覧取得 / 新規保存 API
    const castingPlansMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/casting\/plans$/);
    if (castingPlansMatch) {
      const gid = castingPlansMatch[1];
      const kvKey = `group_casting_plans:${gid}`;

      if (request.method === "POST") {
        let authCheck = await requireGroupRole(request, env, gid, "member");
        if (!authCheck.ok) authCheck = await requireEditor(request, env);
        if (!authCheck.ok) return corsResponse(request, jsonResponse({ error: authCheck.error }, authCheck.status));
        try {
          const body = await request.json();
          if (!body.enmoku_title) return corsResponse(request, jsonResponse({ error: "enmoku_title required" }, 400));
          const raw = await env.CHAT_HISTORY.get(kvKey);
          const data = raw ? JSON.parse(raw) : { plans: [] };
          data.plans.unshift({
            id: `cp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            enmoku_id: String(body.enmoku_id || "").slice(0, 100),
            enmoku_title: String(body.enmoku_title).slice(0, 200),
            assignments: (body.assignments || []).slice(0, 50).map(a => ({
              role: String(a.role || "").slice(0, 100),
              actor: String(a.actor || "").slice(0, 100),
            })),
            note: String(body.note || "").slice(0, 1000),
            created_at: new Date().toISOString(),
          });
          if (data.plans.length > 50) data.plans = data.plans.slice(0, 50);
          await env.CHAT_HISTORY.put(kvKey, JSON.stringify(data));
          return corsResponse(request, jsonResponse({ ok: true }));
        } catch (e) {
          return corsResponse(request, jsonResponse({ error: String(e) }, 500));
        }
      }

      try {
        const raw = await env.CHAT_HISTORY.get(kvKey);
        return corsResponse(request, jsonResponse(raw ? JSON.parse(raw) : { plans: [] }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ plans: [], error: String(e) }, 500));
      }
    }

    // ★ 画像 API（アップロード / 配信）
    const imageUploadMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/images$/);
    if (imageUploadMatch && request.method === "POST") {
      const gid = imageUploadMatch[1];
      let imgUploadAuth = await requireGroupRole(request, env, gid, "manager");
      if (!imgUploadAuth.ok) imgUploadAuth = await requireEditor(request, env);
      if (!imgUploadAuth.ok) return corsResponse(request, jsonResponse({ error: imgUploadAuth.error }, imgUploadAuth.status));
      try {
        const formData = await request.formData();
        const file = formData.get("file");
        const imgType = (formData.get("type") || "misc").replace(/[^a-z0-9_-]/g, "");
        if (!file || !file.name) {
          return corsResponse(request, jsonResponse({ error: "No file provided" }, 400));
        }
        if (file.size > 5 * 1024 * 1024) {
          return corsResponse(request, jsonResponse({ error: "File too large (max 5MB)" }, 400));
        }
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
          return corsResponse(request, jsonResponse({ error: "Unsupported file type. Allowed: jpeg, png, webp, gif" }, 400));
        }
        const extMap = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
        const ext = extMap[file.type] || "jpg";
        const filename = `${imgType}-${Date.now()}.${ext}`;
        const r2Key = `images/${gid}/${filename}`;
        const arrayBuffer = await file.arrayBuffer();
        await env.CONTENT_BUCKET.put(r2Key, arrayBuffer, {
          httpMetadata: { contentType: file.type }
        });
        const url = `/api/groups/${gid}/images/${filename}`;
        return corsResponse(request, jsonResponse({ url }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: e.message }, 500));
      }
    }

    const imageServeMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/images\/([a-zA-Z0-9_.\-]+)$/);
    if (imageServeMatch && request.method === "GET") {
      const gid = imageServeMatch[1];
      const filename = imageServeMatch[2];
      const r2Key = `images/${gid}/${filename}`;
      const obj = await env.CONTENT_BUCKET.get(r2Key);
      if (!obj) return new Response("Not Found", { status: 404 });
      const ext = (filename.match(/\.([a-z0-9]+)$/i) || [])[1] || "jpg";
      const ctMap = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };
      const ct = ctMap[ext.toLowerCase()] || "image/jpeg";
      return new Response(obj.body, {
        headers: {
          "Content-Type": ct,
          "Cache-Control": "public, max-age=31536000",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // ★ ユーザー画像 API（RECO 写真添付用）
    if (path === "/api/user/images" && request.method === "POST") {
      try {
        const formData = await request.formData();
        const file = formData.get("file");
        const userId = formData.get("user_id") || "anonymous";
        const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
        if (!file || !file.name) {
          return corsResponse(request, jsonResponse({ error: "No file provided" }, 400));
        }
        if (file.size > 3 * 1024 * 1024) {
          return corsResponse(request, jsonResponse({ error: "File too large (max 3MB)" }, 400));
        }
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
          return corsResponse(request, jsonResponse({ error: "Unsupported file type. Allowed: jpeg, png, webp" }, 400));
        }
        const extMap = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
        const ext = extMap[file.type] || "jpg";
        const filename = `reco-${Date.now()}.${ext}`;
        const r2Key = `user-images/${safeUserId}/${filename}`;
        const arrayBuffer = await file.arrayBuffer();
        await env.CONTENT_BUCKET.put(r2Key, arrayBuffer, {
          httpMetadata: { contentType: file.type }
        });
        const url = `/api/user/images/${safeUserId}/${filename}`;
        return corsResponse(request, jsonResponse({ url }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: e.message }, 500));
      }
    }

    const userImageServeMatch = path.match(/^\/api\/user\/images\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.\-]+)$/);
    if (userImageServeMatch && request.method === "GET") {
      const userId = userImageServeMatch[1];
      const filename = userImageServeMatch[2];
      const r2Key = `user-images/${userId}/${filename}`;
      const obj = await env.CONTENT_BUCKET.get(r2Key);
      if (!obj) return new Response("Not Found", { status: 404 });
      const ext = (filename.match(/\.([a-z0-9]+)$/i) || [])[1] || "jpg";
      const ctMap = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
      const ct = ctMap[ext.toLowerCase()] || "image/jpeg";
      return new Response(obj.body, {
        headers: {
          "Content-Type": ct,
          "Cache-Control": "public, max-age=31536000",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // ★ 台本 API（アップロード / 一覧 / rawダウンロード / 削除）
    const scriptUploadMatch = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/scripts\/upload$/);
    if (scriptUploadMatch && request.method === "POST") {
      const gid = scriptUploadMatch[1];
      const uploadAuth = gid === "labo"
        ? await requireEditor(request, env)
        : await requireGroupRole(request, env, gid, "manager");
      if (!uploadAuth.ok) return corsResponse(request, jsonResponse({ error: uploadAuth.error }, uploadAuth.status));
      try {
        const formData = await request.formData();
        const file = formData.get("file");
        const title = formData.get("title") || "";
        const play = formData.get("play") || "";
        const perfDate = formData.get("perf_date") || "";
        const perfVenue = formData.get("perf_venue") || "";
        const perfTag = formData.get("performance_tag") || "";
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
          performance_tag: perfTag,
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
      const rawAuth = gid === "labo"
        ? await requireEditor(request, env)
        : await requireGroupRole(request, env, gid, "member");
      if (!rawAuth.ok) return corsResponse(request, jsonResponse({ error: rawAuth.error }, rawAuth.status));
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
      const delAuth = gid === "labo"
        ? await requireEditor(request, env)
        : await requireGroupRole(request, env, gid, "manager");
      if (!delAuth.ok) return corsResponse(request, jsonResponse({ error: delAuth.error }, delAuth.status));
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
      const patchAuth = gid === "labo"
        ? await requireEditor(request, env)
        : await requireGroupRole(request, env, gid, "manager");
      if (!patchAuth.ok) return corsResponse(request, jsonResponse({ error: patchAuth.error }, patchAuth.status));
      const sid = decodeURIComponent(scriptDeleteMatch[2]);
      try {
        const body = await request.json();
        const kvKey = `group_scripts:${gid}`;
        const raw = await env.CHAT_HISTORY.get(kvKey);
        const data = raw ? JSON.parse(raw) : { scripts: [] };
        const idx = data.scripts.findIndex(s => s.id === sid);
        if (idx < 0) return corsResponse(request, jsonResponse({ error: "Not found" }, 404));
        const allowed = ["title", "play", "perf_date", "perf_venue", "performance_tag", "memo", "visibility"];
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
    if (scriptListApiMatch && request.method === "GET") {
      const gid = scriptListApiMatch[1];
      const listAuth = gid === "labo"
        ? await requireEditor(request, env)
        : await requireGroupRole(request, env, gid, "member");
      if (!listAuth.ok) return corsResponse(request, jsonResponse({ error: listAuth.error }, listAuth.status));
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

    // 演目タイトル一覧（軽量: catalog.json のみ。LIVE ページの NAVI 照合用）
    // 著者データ一括マイグレーション（マスターのみ）
    if (path === "/api/enmoku/migrate-authors" && request.method === "POST") {
      const session = await getSession(request, env);
      if (!session) return corsResponse(request, jsonResponse({ error: "ログインが必要です" }, 401));
      const isMaster = await checkIsMaster(env, session.userId);
      if (!isMaster) return corsResponse(request, jsonResponse({ error: "マスター権限が必要です" }, 403));
      try {
        const body = await request.json();
        const oldUserId = body.oldUserId || "keranosuke_system";
        const newUserId = body.newUserId || session.userId;
        const newDisplayName = body.displayName || "けらのすけ";
        const catalog = await loadEnmokuCatalog(env);
        let updated = 0;
        for (const entry of catalog) {
          const obj = await env.ENMOKU_BUCKET.get(`${entry.id}.json`);
          if (!obj) continue;
          const data = await obj.json();
          if (!data.authors || !data.authors.length) continue;
          let changed = false;
          data.authors = data.authors.map(a => {
            if (a.userId === oldUserId) {
              changed = true;
              return { ...a, userId: newUserId, displayName: newDisplayName };
            }
            if (a.userId === newUserId && a.displayName !== newDisplayName) {
              changed = true;
              return { ...a, displayName: newDisplayName };
            }
            return a;
          });
          if (changed) {
            await env.ENMOKU_BUCKET.put(`${entry.id}.json`, JSON.stringify(data, null, 2), {
              httpMetadata: { contentType: "application/json" },
            });
            updated++;
          }
        }
        return corsResponse(request, jsonResponse({ ok: true, updated, total: catalog.length }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    // ★ DEBUG: RAGコンテキスト確認エンドポイント（開発時のみ）
    if (path === "/api/debug/kera-context") {
      const q = new URL(request.url).searchParams.get("q") || "忠臣蔵ってどんな話？";
      try {
        const catalog = await loadEnmokuCatalog(env);
        const glossary = await loadGlossary(env);
        const topics = await loadTalkTopics(env);

        // gionichiriki の N-gram マッチを直接確認
        const qNorm = q.toLowerCase().replace(/[\s　]/g, "");
        const ngrams = [];
        for (let i = 0; i <= qNorm.length - 3; i++) ngrams.push(qNorm.slice(i, i + 3));

        const gioni = catalog.find(c => c.id === "gionichiriki");
        let gioniDebug = null;
        if (gioni) {
          const full  = (gioni.full  || "").toLowerCase().replace(/[\s　]/g, "");
          const short = (gioni.short || "").toLowerCase().replace(/[\s　]/g, "");
          const hay   = full + short;
          const matchedGrams = ngrams.filter(g => hay.includes(g));
          gioniDebug = {
            full_charcount: full.length,
            full_codes: Array.from(full).slice(0, 8).map(c => c.charCodeAt(0).toString(16)),
            short: gioni.short,
            matched_grams: matchedGrams.slice(0, 5),
            ngram_match: matchedGrams.length > 0,
          };
        }

        // buildKabukiContext をステップごとに手動でシミュレート
        const simParts = [];
        let simFirstMatch = null;
        let simData = null;
        let simDataErr = null;
        for (const item of catalog) {
          const full  = (item.full  || item.title       || "").toLowerCase().replace(/[\s　]/g, "");
          const short = (item.short || item.title_short || "").toLowerCase().replace(/[\s　]/g, "");
          const hay   = full + short;
          const anyMatch = ngrams.some(g => hay.includes(g));
          if (anyMatch) {
            simFirstMatch = item.id;
            try {
              simData = await loadEnmokuJson(env, item.id);
            } catch (e) {
              simDataErr = String(e);
            }
            const title = simData?.title || item.full || item.short || item.id;
            simParts.push(`【演目】${title}`);
            break;
          }
        }

        // buildKabukiContext の内部を完全に再現したインラインテスト
        const inlineParts = [];
        const qN2 = q.toLowerCase().replace(/[\s　]/g, "");
        const grams2 = [];
        for (let i = 0; i <= qN2.length - 3; i++) grams2.push(qN2.slice(i, i + 3));
        for (const item of catalog) {
          const full2  = (item.full  || "").toLowerCase().replace(/[\s　]/g, "");
          const short2 = (item.short || "").toLowerCase().replace(/[\s　]/g, "");
          const hay2   = full2 + short2;
          const m = grams2.some(g => hay2.includes(g));
          if (m) {
            inlineParts.push("[enmoku] " + (item.full || item.id));
            break;
          }
        }

        // buildKabukiContext を完全再現した詳細シミュレーション
        const fullSimParts = [];
        let fullSimMatchId = null, fullSimDataNull = true, fullSimErr = null;
        const qGramsFull = new Set();
        for (let i = 0; i <= qNorm.length - 3; i++) qGramsFull.add(qNorm.slice(i, i + 3));
        for (const item of catalog) {
          const full  = (item.full  || item.title || "").toLowerCase().replace(/[\s　]/g, "");
          const short = (item.short || item.title_short || "").toLowerCase().replace(/[\s　]/g, "");
          const hay   = full + short;
          let m = hay.includes(qNorm) || qNorm.includes(hay) ||
            (qGramsFull.size > 0 && [...qGramsFull].some(g => hay.includes(g)));
          if (!m && hay.length >= 3) {
            for (let i = 0; i <= hay.length - 3 && !m; i++) {
              if (qNorm.includes(hay.slice(i, i + 3))) m = true;
            }
          }
          if (m) {
            fullSimMatchId = item.id;
            try {
              const data = await loadEnmokuJson(env, item.id).catch(() => null);
              fullSimDataNull = data === null;
              let ctxLine = `【演目】${data?.title || item.full || item.short || item.id}`;
              if (data) {
                const details = [];
                if (data.synopsis) details.push(`あらすじ: ${String(data.synopsis).slice(0, 100)}`);
                const hiA = Array.isArray(data.highlights) ? data.highlights : (typeof data.highlights === "string" && data.highlights ? [data.highlights] : []);
                if (hiA.length) details.push(`見どころ: ${hiA.slice(0, 2).join("／")}`);
                try {
                  if (data.cast?.length) {
                    const cl = data.cast.slice(0, 3).map(c => `${(c && c.name)||""}（${(c && c.role)||""}）`).filter(s=>s!=="（）").join("、");
                    if (cl) details.push(`登場: ${cl}`);
                  }
                } catch (_) {}
                if (details.length) ctxLine += "\n" + details.join("\n");
              }
              fullSimParts.push(ctxLine.slice(0, 80));
            } catch (e2) { fullSimErr = String(e2); }
            break;
          }
        }

        const context = await buildKabukiContext(env, q);
        return corsResponse(request, jsonResponse({
          v: "2",
          qNorm_len: qNorm.length,
          grams_count: ngrams.length,
          catalog_count: catalog.length,
          gioni_ngram: gioniDebug?.ngram_match,
          sim_first_match: simFirstMatch,
          sim_parts: simParts.length,
          inline_parts: inlineParts.length,
          full_sim_match: fullSimMatchId,
          full_sim_parts: fullSimParts.length,
          full_sim_data_null: fullSimDataNull,
          full_sim_first: fullSimParts[0]?.slice(0, 60) || null,
          full_sim_err: fullSimErr,
          glossary_count: glossary.length,
          topics_count: topics.length,
          context_found: !!context,
          context_null: context === null,
          context_length: context != null ? context.length : -1,
        }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    if (path === "/api/enmoku/titles") {
      try {
        const catalog = await loadEnmokuCatalog(env);
        const titles = (catalog || []).map(e => ({ id: e.id, short: e.short || "", full: e.full || "" }));
        return corsResponse(request, jsonResponse(titles));
      } catch (e) {
        return corsResponse(request, jsonResponse([]));
      }
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

      // PUT: R2 への保存（LABO エディタ用・承認済みエディターのみ）
      if (id && id !== "catalog" && request.method === "PUT") {
        try {
          const editorCheck = await requireEditor(request, env);
          if (!editorCheck.ok) {
            return corsResponse(request, jsonResponse({ error: editorCheck.error }, editorCheck.status));
          }

          const body = await request.json();
          if (!body || !body.title) {
            return corsResponse(request, jsonResponse({ error: "title is required" }, 400));
          }

          // catalog用メタデータを分離して保存
          const catalogGroup = body._catalog_group || null;
          const catalogSortKey = body._catalog_sort_key || null;
          delete body._catalog_group;
          delete body._catalog_sort_key;

          // R2 に演目データを保存
          await env.ENMOKU_BUCKET.put(`${id}.json`, JSON.stringify(body, null, 2), {
            httpMetadata: { contentType: "application/json" },
          });

          // catalog.json を更新（無ければフォールバックカタログを元に新規作成）
          try {
            let catalog = [];
            const catObj = await env.ENMOKU_BUCKET.get("catalog.json");
            if (catObj) {
              catalog = await catObj.json();
            } else {
              catalog = (await loadEnmokuCatalog(env)).map(c => ({
                id: c.id, short: c.short, full: c.full,
                sort_key: c.sort_key || "", group: c.group || null,
              }));
            }

            const idx = catalog.findIndex(c => c.id === id);
            // info["種別"] からジャンルコードを生成
            const genreText = (body.info && body.info["種別"]) ? String(body.info["種別"]) : "";
            const genreCode = genreText.includes("世話") ? "sewamono"
              : genreText.includes("時代") ? "jidaimono"
              : genreText.includes("舞踊") || genreText.includes("所作") ? "shosagoto"
              : genreText ? "other" : null;
            const entry = {
              id,
              short: body.title_short || body.title,
              full: body.title,
              sort_key: catalogSortKey || "",
              group: catalogGroup,
              ...(genreCode ? { genre: genreCode } : {}),
              ...(body.duration_min != null ? { duration_min: body.duration_min } : {}),
            };
            if (idx >= 0) {
              catalog[idx] = { ...catalog[idx], ...entry };
            } else {
              catalog.push(entry);
            }
            catalog.sort((a, b) => (a.sort_key || a.short || "").localeCompare(b.sort_key || b.short || "", "ja"));

            await env.ENMOKU_BUCKET.put("catalog.json", JSON.stringify(catalog, null, 2), {
              httpMetadata: { contentType: "application/json" },
            });

            // キャッシュを無効化
            clearEnmokuCatalogCache();
            globalThis.__enhancedCatalogCache = null;
          } catch (catErr) {
            console.log("catalog.json update error:", String(catErr));
          }

          return corsResponse(request, jsonResponse({ ok: true, id }));
        } catch (e) {
          return corsResponse(request, jsonResponse({ error: String(e) }, 500));
        }
      }

      // GET: 演目データ取得
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

          // 編集用: catalog からグループ・ソートキーを付与
          if (request.method === "GET") {
            try {
              const catalog = await loadEnmokuCatalog(env);
              const catEntry = catalog.find(c => c.id === id);
              if (catEntry) {
                data._catalog_group = catEntry.group || null;
                data._catalog_sort_key = catEntry.sort_key || null;
              }
            } catch (_) {}
          }

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

    if (path === "/api/jikabuki/groups" && request.method === "GET") {
      try {
        const GATE_MAP = Object.fromEntries((await loadGateGroups(env)).map(g => [g.name, g.id]));
        const obj = await env.CONTENT_BUCKET.get("jikabuki_groups.json");
        if (!obj) return corsResponse(request, jsonResponse({ groups: [], count: 0 }));
        const data = await obj.json();
        const groups = (data.groups || []).map(g => ({
          name: g.name,
          prefecture: g.prefecture || "",
          venue: g.venue || "",
          gate_id: GATE_MAP[g.name] || "",
          links: g.links || {},
        }));
        return corsResponse(request, jsonResponse({ groups, count: groups.length }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    // ★ 芝居小屋 共有DB API
    if (path === "/api/theaters" && request.method === "GET") {
      try {
        const raw = await env.CHAT_HISTORY.get("theaters_registry");
        const data = raw ? JSON.parse(raw) : { theaters: [] };
        return corsResponse(request, jsonResponse(data));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }
    if (path === "/api/theaters" && request.method === "POST") {
      let authCheck = await requireEditor(request, env);
      if (!authCheck.ok) return corsResponse(request, jsonResponse({ error: authCheck.error }, authCheck.status));
      try {
        const body = await request.json();
        const t = body.theater;
        if (!t || !t.id || !t.name) return corsResponse(request, jsonResponse({ error: "id and name are required" }, 400));
        const raw = await env.CHAT_HISTORY.get("theaters_registry");
        const data = raw ? JSON.parse(raw) : { theaters: [] };
        const idx = data.theaters.findIndex(x => x.id === t.id);
        t.updated_at = new Date().toISOString();
        if (idx >= 0) { data.theaters[idx] = { ...data.theaters[idx], ...t }; } else { data.theaters.push(t); }
        await env.CHAT_HISTORY.put("theaters_registry", JSON.stringify(data));
        return corsResponse(request, jsonResponse({ ok: true, theater: t }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }
    {
      const theaterDeleteMatch = path.match(/^\/api\/theaters\/([a-zA-Z0-9_-]+)$/);
      if (theaterDeleteMatch && request.method === "DELETE") {
        let authCheck = await requireEditor(request, env);
        if (!authCheck.ok) return corsResponse(request, jsonResponse({ error: authCheck.error }, authCheck.status));
        try {
          const tid = theaterDeleteMatch[1];
          const raw = await env.CHAT_HISTORY.get("theaters_registry");
          const data = raw ? JSON.parse(raw) : { theaters: [] };
          data.theaters = data.theaters.filter(x => x.id !== tid);
          await env.CHAT_HISTORY.put("theaters_registry", JSON.stringify(data));
          return corsResponse(request, jsonResponse({ ok: true }));
        } catch (e) {
          return corsResponse(request, jsonResponse({ error: String(e) }, 500));
        }
      }
    }

    // ★ 芝居小屋 画像 API（アップロード / 配信）
    if (path === "/api/theaters/images" && request.method === "POST") {
      let authCheck = await requireEditor(request, env);
      if (!authCheck.ok) return corsResponse(request, jsonResponse({ error: authCheck.error }, authCheck.status));
      try {
        const formData = await request.formData();
        const file = formData.get("file");
        if (!file || !file.name) {
          return corsResponse(request, jsonResponse({ error: "No file provided" }, 400));
        }
        if (file.size > 5 * 1024 * 1024) {
          return corsResponse(request, jsonResponse({ error: "File too large (max 5MB)" }, 400));
        }
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
          return corsResponse(request, jsonResponse({ error: "Unsupported file type. Allowed: jpeg, png, webp, gif" }, 400));
        }
        const extMap = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
        const ext = extMap[file.type] || "jpg";
        const filename = `theater-${Date.now()}.${ext}`;
        const r2Key = `images/theaters/${filename}`;
        const arrayBuffer = await file.arrayBuffer();
        await env.CONTENT_BUCKET.put(r2Key, arrayBuffer, {
          httpMetadata: { contentType: file.type }
        });
        const url = `/api/theaters/images/${filename}`;
        return corsResponse(request, jsonResponse({ url }));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: e.message }, 500));
      }
    }
    {
      const theaterImageMatch = path.match(/^\/api\/theaters\/images\/([a-zA-Z0-9_.\-]+)$/);
      if (theaterImageMatch && request.method === "GET") {
        const filename = theaterImageMatch[1];
        const r2Key = `images/theaters/${filename}`;
        const obj = await env.CONTENT_BUCKET.get(r2Key);
        if (!obj) return new Response("Not Found", { status: 404 });
        const ext = (filename.match(/\.([a-z0-9]+)$/i) || [])[1] || "jpg";
        const ctMap = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };
        const ct = ctMap[ext.toLowerCase()] || "image/jpeg";
        return new Response(obj.body, {
          headers: {
            "Content-Type": ct,
            "Cache-Control": "public, max-age=31536000, immutable",
            "Access-Control-Allow-Origin": "*",
          }
        });
      }
    }

    // 旧互換: /api/jikabuki/theaters → /api/theaters にリダイレクト
    if (path === "/api/jikabuki/theaters" && request.method === "GET") {
      try {
        const raw = await env.CHAT_HISTORY.get("theaters_registry");
        const data = raw ? JSON.parse(raw) : { theaters: [] };
        return corsResponse(request, jsonResponse(data));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    if (path === "/api/jikabuki/fav-news" && request.method === "GET") {
      try {
        const url = new URL(request.url);
        const groupsParam = url.searchParams.get("groups");
        if (!groupsParam) return corsResponse(request, jsonResponse({ results: [] }));

        const groupNames = groupsParam.split(",").map(s => s.trim()).filter(Boolean).slice(0, 10);
        if (!groupNames.length) return corsResponse(request, jsonResponse({ results: [] }));

        const cacheKey = "jikabuki-fav-news:" + [...groupNames].sort().join(",");
        const cached = await env.CHAT_HISTORY.get(cacheKey);
        if (cached) return corsResponse(request, jsonResponse(JSON.parse(cached)));

        // jikabuki_groups.json から keywords を取得
        const groupsObj = await env.CONTENT_BUCKET.get("jikabuki_groups.json");
        const groupsData = groupsObj ? await groupsObj.json() : { groups: [] };
        const groupMeta = {};
        for (const g of (groupsData.groups || [])) {
          groupMeta[g.name] = g.keywords || [g.name];
        }

        // news:latest KV から全記事取得
        const newsRaw = await env.CHAT_HISTORY.get("news:latest");
        const allArticles = newsRaw ? (JSON.parse(newsRaw).articles || []) : [];

        const norm = s => (s || "").replace(/\s/g, "");

        const results = groupNames.map(name => {
          const keywords = groupMeta[name] || [name];
          const matched = allArticles.filter(a => {
            const t = norm(a.title || "");
            return keywords.some(k => t.includes(norm(k)));
          }).slice(0, 2).map(a => ({ title: a.title, link: a.link, pubTs: a.pubTs || null }));
          return { group: name, articles: matched };
        });

        const payload = { results, updatedAt: new Date().toISOString() };
        ctx.waitUntil(env.CHAT_HISTORY.put(cacheKey, JSON.stringify(payload), { expirationTtl: 1800 }));
        return corsResponse(request, jsonResponse(payload));
      } catch (e) {
        return corsResponse(request, jsonResponse({ results: [], error: String(e) }, 500));
      }
    }

    if (path === "/api/glossary" && request.method === "GET") {
      try {
        const obj = await env.CONTENT_BUCKET.get("glossary.json");
        if (!obj) return corsResponse(request, jsonResponse({ error: "not found" }, 404));
        const data = await obj.json();
        return corsResponse(request, jsonResponse(data));
      } catch (e) {
        return corsResponse(request, jsonResponse({ error: String(e) }, 500));
      }
    }

    if (path === "/api/glossary" && request.method === "PUT") {
      const editorCheck = await requireEditor(request, env);
      if (!editorCheck.ok) return corsResponse(request, jsonResponse({ error: editorCheck.error }, editorCheck.status));
      try {
        const body = await request.json();
        if (!body || !Array.isArray(body.terms)) {
          return corsResponse(request, jsonResponse({ error: "Invalid body: { terms: [] } required" }, 400));
        }
        const payload = JSON.stringify({ terms: body.terms });
        await env.CONTENT_BUCKET.put("glossary.json", payload, {
          httpMetadata: { contentType: "application/json; charset=utf-8" }
        });
        GLOSSARY_CACHE = null;
        return corsResponse(request, jsonResponse({ ok: true, count: body.terms.length }));
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

    if (path === "/api/quiz" && request.method === "PUT") {
      const editorCheck = await requireEditor(request, env);
      if (!editorCheck.ok) return corsResponse(request, jsonResponse({ error: editorCheck.error }, editorCheck.status));
      try {
        const body = await request.json();
        if (!Array.isArray(body)) {
          return corsResponse(request, jsonResponse({ error: "Invalid body: array required" }, 400));
        }
        await env.QUIZ_BUCKET.put("quizzes.json", JSON.stringify(body, null, 2), {
          httpMetadata: { contentType: "application/json; charset=utf-8" }
        });
        clearQuizCache();
        return corsResponse(request, jsonResponse({ ok: true, count: body.length }));
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

    // ★ 推し俳優ニュース一括取得（各俳優の直近1件を返す）
    if (path === "/api/oshi-news") {
      try {
        const url = new URL(request.url);
        const actorsParam = url.searchParams.get("actors");
        if (!actorsParam) {
          return corsResponse(request, jsonResponse({ error: "actors parameter required" }, 400));
        }
        const actors = actorsParam.split(",").map(s => s.trim()).filter(Boolean).slice(0, 5);
        if (!actors.length) {
          return corsResponse(request, jsonResponse({ results: [] }));
        }

        // KVキャッシュキー（俳優リストのハッシュ）
        const cacheKey = "oshi-news:" + actors.sort().join(",");
        const cached = await env.CHAT_HISTORY.get(cacheKey);
        if (cached) {
          return corsResponse(request, jsonResponse(JSON.parse(cached)));
        }

        // news:latest KV → キャッシュヒットした俳優はそのまま、未ヒットは外部 RSS で補完
        const norm = s => (s || "").replace(/\s/g, "");
        const newsRaw = await env.CHAT_HISTORY.get("news:latest");
        const allArticles = newsRaw ? (JSON.parse(newsRaw).articles || []) : [];

        const cacheResults = actors.map(actor => {
          const actorN = norm(actor);
          const article = allArticles.find(a => norm(a.title || "").includes(actorN)) || null;
          return { actor, article };
        });

        const needSearch = cacheResults.filter(r => !r.article).map(r => r.actor);

        let searchMap = {};
        if (needSearch.length) {
          const searchResults = await Promise.all(needSearch.map(async (actor) => {
            try {
              const arts = await searchActorNews(actor, 3);
              return { actor, article: arts.length ? arts[0] : null };
            } catch (e) {
              return { actor, article: null };
            }
          }));
          searchResults.forEach(r => { searchMap[r.actor] = r.article; });
        }

        const results = cacheResults.map(r =>
          r.article ? r : { actor: r.actor, article: searchMap[r.actor] || null }
        );
        const payload = { results, updatedAt: new Date().toISOString() };

        // 30分キャッシュ
        ctx.waitUntil(
          env.CHAT_HISTORY.put(cacheKey, JSON.stringify(payload), { expirationTtl: 1800 })
        );

        return corsResponse(request, jsonResponse(payload));
      } catch (e) {
        return corsResponse(request, jsonResponse({ results: [], error: String(e) }, 500));
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
       2) 404 Not Found
    ===================================================== */
    const notFoundHTML = pageShell({
      title: "ページが見つかりません",
      bodyHTML: `
        <div style="text-align:center;padding:60px 20px;">
          <div style="font-size:64px;margin-bottom:16px;">🎭</div>
          <h2 style="font-size:20px;color:var(--text-primary);margin-bottom:12px;">お探しのページは見つかりませんでした</h2>
          <p style="color:var(--text-tertiary);font-size:14px;line-height:1.8;margin-bottom:32px;">
            ページが移動・削除されたか、URLが間違っている可能性があります。
          </p>
          <a href="/" style="display:inline-block;padding:12px 32px;background:var(--gold);color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">トップページへ戻る</a>
        </div>`,
      activeNav: "",
    });
    return new Response(notFoundHTML, { status: 404, headers: HTML_HEADERS });
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
    "https://kabukiplus.com",
    "https://www.kabukiplus.com",
    "https://kerakabuki.jimdofree.com",
    "https://cms.e.jimdo.com"
    // "http://localhost:5173"
  ]);

  if (ALLOW.has(origin)) {
    h.set("Access-Control-Allow-Origin", origin);
    h.set("Vary", "Origin");
  }

  h.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
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
        const welcome = "やあ！けらのすけだよ\n歌舞伎のことなら何でも聞いてね。\n\n「歌舞伎座に初めて行く」\n「義経千本桜ってどんな話？」\nなんて気軽にどうぞ！";
        await respondLineMessages(env, replyToken, destId, [{
          type: "text", text: welcome,
          quickReply: { items: [
            { type: "action", action: { type: "uri", label: "KABUKI PLUS+", uri: env._origin + "/kabuki/navi" }},
          ]}
        }]);
        return;
      }

      // step=menu / step=navi_home → けらのすけ挨拶
      if (p.step === "menu" || p.step === "navi_home") {
        await env.CHAT_HISTORY.delete(modeKey);
        await env.CHAT_HISTORY.delete(enmokuKey);
        await env.CHAT_HISTORY.delete(`laststep:${sourceKey}`);
        await env.CHAT_HISTORY.delete(`conv:${sourceKey}`);
        const welcome = "やあ！けらのすけだよ\n歌舞伎のことなら何でも聞いてね。\n\n「歌舞伎座に初めて行く」\n「義経千本桜ってどんな話？」\nなんて気軽にどうぞ！";
        await respondLineMessages(env, replyToken, destId, [{
          type: "text", text: welcome,
          quickReply: { items: [
            { type: "action", action: { type: "uri", label: "KABUKI PLUS+", uri: env._origin + "/kabuki/navi" }},
          ]}
        }]);
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
            await respondLine(env, replyToken, destId,
              "クイズは KABUKI DOJO でできるよ！\n全100問に挑戦してみてね\n" + env._origin + "/kabuki/dojo");
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

      // ★ クイズ用postback → Web誘導
      const qm = data.match(/(?:^|&)quiz=([^&]+)/);
      if (qm) {
        await respondLine(env, replyToken, destId,
          "クイズは KABUKI DOJO でできるよ！\n全100問に挑戦してみてね\n" + env._origin + "/kabuki/dojo");
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
          await respondLine(env, replyToken, destId,
            "クイズは KABUKI DOJO でできるよ！\n全100問に挑戦してみてね\n" + env._origin + "/kabuki/dojo");
          return;
        }

        const reply = exampleTextForMode(mode, "line");
        await respondLine(env, replyToken, destId, reply);
        return;
      }

      // ここに到達した = 解析はできたがどの分岐にも一致しなかった
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

    // ★ BASE連携コマンド（LINEグループ専用）
    const baseLinkMatch = text.match(/^BASE連携\s+([a-zA-Z0-9_-]+)$/);
    const baseUnlink = /^BASE連携解除$/.test(text);
    if ((baseLinkMatch || baseUnlink) && event.source?.type === "group") {
      const lineGroupId = event.source.groupId;
      if (baseUnlink) {
        const allGroups = await listGroups(env);
        let unlinked = false;
        for (const g of allGroups) {
          const group = await getGroup(env, g.group_id);
          if (group && group.line_group_id === lineGroupId) {
            delete group.line_group_id;
            await env.CHAT_HISTORY.put(`group:${group.group_id}`, JSON.stringify(group));
            await respondLine(env, replyToken, destId, `✅ ${group.name} とのBASE連携を解除しました。`);
            unlinked = true;
            break;
          }
        }
        if (!unlinked) {
          await respondLine(env, replyToken, destId, "このLINEグループはどの団体とも連携されていません。");
        }
      } else {
        const kabukiGroupId = baseLinkMatch[1];
        const group = await getGroup(env, kabukiGroupId);
        if (!group) {
          await respondLine(env, replyToken, destId, `❌ 団体「${kabukiGroupId}」が見つかりません。IDを確認してください。`);
        } else {
          group.line_group_id = lineGroupId;
          await env.CHAT_HISTORY.put(`group:${group.group_id}`, JSON.stringify(group));
          await respondLine(env, replyToken, destId,
            `✅ ${group.name} とこのLINEグループを連携しました！\n稽古スケジュール登録時にこのグループへ通知されます。\n\n解除するには「BASE連携解除」と送信してください。`);
        }
      }
      return;
    }
    if ((baseLinkMatch || baseUnlink) && event.source?.type !== "group") {
      await respondLine(env, replyToken, destId, "BASE連携コマンドはLINEグループ内でのみ使えます。");
      return;
    }

    // メニュー / ナビホーム → Flex Menu
    if (isMenuCommand(text) || isNaviHomeCommand(text)) {
      await env.CHAT_HISTORY.delete(modeKey);
      await env.CHAT_HISTORY.delete(enmokuKey);
      await env.CHAT_HISTORY.delete(`laststep:${sourceKey}`);
      await env.CHAT_HISTORY.delete(`conv:${sourceKey}`);
      await respondLineMessages(env, replyToken, destId, [mainMenuFlex(env, env._origin)]);
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

    // クイズ → Web誘導
    if (/クイズ|quiz/i.test(text)) {
      await respondLine(env, replyToken, destId,
        "クイズは KABUKI DOJO でできるよ！\n全100問に挑戦してみてね\n" + env._origin + "/kabuki/dojo");
      return;
    }

    // フォールバック → Gemini v2（コンテキスト有無に関わらず回答を試みる）
    const aiContext = await buildKabukiContext(env, text).catch((e) => {
      console.error("buildKabukiContext error:", String(e));
      return null;
    });
    console.log("keraAIv2 context:", aiContext ? `${aiContext.length}chars` : "null", "| text:", text.slice(0, 40));
    const aiReply = await keraAIv2(env, sourceKey, text, aiContext);
    if (aiReply) {
      await respondLineMessages(env, replyToken, destId, [{
        type: "text",
        text: aiReply,
        quickReply: { items: [
          { type: "action", action: { type: "message", label: "メニュー",      text: "メニュー" } },
          { type: "action", action: { type: "uri",     label: "KABUKI PLUS+", uri: env._origin + "/kabuki/navi" } },
        ]},
      }]);
      return;
    }
    // 全失敗 → メニューを表示
    await respondLineMessages(env, replyToken, destId, [mainMenuFlex(env, env._origin)]);

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
    await respondLineMessages(env, replyToken, destId, [mainMenuFlex(env, env._origin)]);
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
  await respondLineMessages(env, replyToken, destId, [mainMenuFlex(env, env._origin)]);
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
    return { messages: [mainMenuFlex(env, env._origin)] };
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
   RAG-based AI（ハルシネーション防止）
   ─────────────────────────────────────────────────────────
   設計方針：
   1. ユーザーのテキストから演目・用語・FAQをキーワードマッチ
   2. ヒットしたデータのみをコンテキストとして AI に渡す
   3. コンテキストなし → AI を呼ばずメニューへフォールバック
   4. システムプロンプトで「参考データ外は答えるな」と厳命
   5. max_tokens 制限で短い回答を強制（長い回答ほど幻覚が増える）
========================================================= */

/**
 * ユーザーのテキストに関連するデータを R2 から収集してコンテキスト文字列を返す。
 * 何も見つからなければ null を返す（AI 呼び出しをスキップするシグナル）。
 */
async function buildKabukiContext(env, userText) {
  const q = (userText || "").toLowerCase();
  let qNorm = q.replace(/[\s　]/g, ""); // スペース・全角スペース除去

  // シノニム展開（ひらがな → 正式名称をクエリに追加）
  const KERA_SYNONYMS = {
    "かぶき": "歌舞伎", "よしつね": "義経", "べんけい": "弁慶",
    "ちゅうしんぐら": "忠臣蔵", "かんじんちょう": "勧進帳",
    "すしや": "鮨屋", "てらこや": "寺子屋", "くまがい": "熊谷",
    "もりつな": "盛綱", "まくあい": "幕間", "はなみち": "花道",
    "くろご": "黒衣", "おおむこう": "大向う", "みえ": "見得",
    "ろっぽう": "六方", "仮名手本": "忠臣蔵",
  };
  for (const [from, to] of Object.entries(KERA_SYNONYMS)) {
    if (qNorm.includes(from) && !qNorm.includes(to)) {
      qNorm += to;
    }
  }

  const parts = [];

  // クエリから 3-gram セットを事前生成（演目・用語・FAQ 共用）
  const qGrams = new Set();
  for (let i = 0; i <= qNorm.length - 3; i++) qGrams.add(qNorm.slice(i, i + 3));

  // ── 1. 演目マッチング（N-gram、双方向） ────────────────────
  // catalog エントリのフィールド: { id, short, full, sort_key, group }
  try {
    const catalog = await loadEnmokuCatalog(env);
    console.log("keraCtx catalog:", catalog.length, "| qNorm:", qNorm.slice(0, 20));
    for (const item of (catalog || [])) {
      const full  = (item.full  || item.title       || "").toLowerCase().replace(/[\s　]/g, "");
      const short = (item.short || item.title_short || "").toLowerCase().replace(/[\s　]/g, "");
      const hay   = full + short;

      // 方向1: クエリの3-gram がタイトルに含まれるか
      let matched = hay.includes(qNorm) || qNorm.includes(hay) ||
        (qGrams.size > 0 && [...qGrams].some(g => hay.includes(g)));
      // 方向2: タイトルの3-gram がクエリに含まれるか（逆方向）
      if (!matched && hay.length >= 3) {
        for (let i = 0; i <= hay.length - 3 && !matched; i++) {
          if (qNorm.includes(hay.slice(i, i + 3))) matched = true;
        }
      }

      if (matched) {
        console.log("keraCtx enmoku match:", item.id);
        // enmoku JSONが壊れていても catalog のタイトルだけでコンテキストを作る
        const data = await loadEnmokuJson(env, item.id).catch(() => null);
        let ctxLine = `【演目】${data?.title || item.full || item.short || item.id}`;
        if (data) {
          const details = [];
          if (data.synopsis) details.push(`あらすじ: ${String(data.synopsis).slice(0, 800)}`);
          const hiArr = Array.isArray(data.highlights) ? data.highlights : (typeof data.highlights === "string" && data.highlights ? [data.highlights] : []);
          if (hiArr.length) details.push(`見どころ: ${hiArr.slice(0, 3).join("／")}`);
          try {
            if (data.cast?.length) {
              const castLine = data.cast.slice(0, 8)
                .map(c => `${(c && c.name) || ""}（${(c && c.role) || ""}）`)
                .filter(s => s !== "（）").join("、");
              if (castLine) details.push(`主な登場人物: ${castLine}`);
            }
          } catch (_) {} // castデータが壊れていても synopsis/highlights は保持
          if (details.length) ctxLine += "\n" + details.join("\n");
        }
        console.log("keraCtx enmoku push:", item.id, "linelen:", ctxLine.length);
        parts.push(ctxLine); // 例外の外で必ず push
        break;
      }
    }
  } catch (e) { console.error("keraCtx enmoku err:", String(e)); }

  // ── 2. 用語マッチング ─────────────────────────────────────
  // 「クエリに用語名が含まれるか」方向でマッチ（旧実装の逆）
  // 例: "忠臣蔵ってどんな話？" → qNorm に "忠臣蔵" が含まれる → マッチ
  try {
    const glossary = await loadGlossary(env);
    console.log("keraCtx glossary:", glossary.length);
    const matched = (glossary || []).filter(t => {
      const term    = (t.term    || "").toLowerCase().replace(/[\s　]/g, "");
      const reading = (t.reading || "").toLowerCase().replace(/[\s　]/g, "");
      if (term.length < 2) return false;
      // クエリにterm名またはよみが含まれる
      if (qNorm.includes(term))                              return true;
      if (reading.length >= 2 && qNorm.includes(reading))   return true;
      // または term の3-gram がクエリの3-gram セットと重複
      if (term.length >= 3) {
        for (let i = 0; i <= term.length - 3; i++) {
          if (qGrams.has(term.slice(i, i + 3))) return true;
        }
      }
      return false;
    }).slice(0, 3);
    for (const t of matched) {
      const desc = (t.desc || t.description || "").slice(0, 500);
      if (desc) parts.push(`【用語】${t.term}（${t.reading || ""}）: ${desc}`);
    }
  } catch (e) { console.error("keraCtx gloss err:", String(e)); }

  // ── 3. FAQ マッチング（FAQ質問の3-gram → クエリ方向） ─────────
  // FAQ 質問の 3-gram がクエリに含まれる場合にマッチ（ノイズ語混入を防ぐ逆方向）
  try {
    const topics = await loadTalkTopics(env);
    console.log("keraCtx topics:", topics.length);
    for (const topic of (topics || [])) {
      const tq = (topic.q || "").toLowerCase().replace(/[\s　？。、！]/g, "");
      if (tq.length < 3) continue;
      // FAQ質問の3-gramがクエリに含まれる個数をカウント
      let matchCount = 0;
      for (let i = 0; i <= tq.length - 3; i++) {
        if (qNorm.includes(tq.slice(i, i + 3))) matchCount++;
      }
      // 短い質問は1gram一致でOK、長い質問は2gram以上必要
      const threshold = tq.length <= 6 ? 1 : 2;
      if (matchCount >= threshold) {
        parts.push(`【FAQ】Q: ${topic.q}\nA: ${String(topic.a || "").slice(0, 500)}`);
        if (parts.length >= 5) break;
      }
    }
  } catch (e) { console.error("keraCtx faq err:", String(e)); }

  // ── 4. 公演スケジュールコンテキスト ────────────────────────────
  const perfKeywords = /公演|スケジュール|予定|いつ|チケット|日程|今月|来月|上演|開催|歌舞伎座|国立劇場|南座|松竹座|御園座/;
  if (perfKeywords.test(userText)) {
    try {
      const perfData = await getPerformancesCached(env);
      if (perfData?.items?.length) {
        const perfLines = perfData.items.slice(0, 5).map(p => {
          const line = [`${p.theater || ""}`, p.title || ""];
          if (p.date_range) line.push(p.date_range);
          if (p.time) line.push(p.time);
          return line.filter(Boolean).join(" / ");
        });
        if (perfLines.length) {
          parts.push("【公演情報】\n" + perfLines.join("\n"));
        }
      }
    } catch (e) { console.error("keraCtx perf err:", String(e)); }
  }

  console.log("keraCtx parts:", parts.length, "| first50:", parts[0]?.slice(0, 50));
  if (parts.length === 0) return null;

  const result = parts.join("\n\n");
  console.log("keraCtx result len:", result.length);
  return result.slice(0, 8000);
}

/** Workers AI（無料枠）を使って歌舞伎 Q&A に回答する。
 *  ハルシネーション防止のコアルール：
 *  - 参考データにない情報は「わからない」と正直に答える
 *  - 俳優名・年号・史実を推測・創作しない
 *  - コンテキストなしでは呼ばない（呼び出し元で制御）
 */
async function keraAI(env, userText, context) {
  const systemPrompt = [
    "You are けらのすけ, a friendly kabuki assistant for 気良歌舞伎 in Gujo City, Japan.",
    "Answer in Japanese only. Keep answers under 150 characters.",
    "",
    "Rules:",
    "- Use ONLY the information in [DATA] below.",
    "- If [DATA] covers the topic partially, answer with what you know and say 「詳しくは演目ガイドを見てね🙏」",
    "- If [DATA] has no relevant info, say 「けらのすけには詳しい情報がないや🙏 演目ガイドで確認してみてね！」",
    "- Do NOT add facts, names, dates, or story details that are not in [DATA].",
    "- Be warm and friendly, like talking to a kabuki fan.",
    "",
    "[DATA]",
    context,
  ].join("\n");

  try {
    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userText },
      ],
      max_tokens: 350,
    });
    const reply = (result?.response || "").trim();
    return reply || null;
  } catch (e) {
    console.error("keraAI error:", String(e));
    return null;
  }
}

/* =========================================================
   Gemini 2.0 Flash — API 呼び出し基盤 + 会話履歴 + レート制限
========================================================= */

/**
 * Gemini API 呼び出し
 * @param {object} env - Worker env (GEMINI_API_KEY)
 * @param {string} systemPrompt - システムプロンプト
 * @param {Array} messages - [{role:"user"|"assistant", content:string}]
 * @param {Array|undefined} tools - Gemini function declarations
 * @returns {Promise<{type:"text",text:string}|{type:"function_call",functionCall:object}|null>}
 */
async function callGemini(env, systemPrompt, messages, tools) {
  if (!env.GEMINI_API_KEY) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`;
  const body = {
    contents: messages.map(m => ({
      role: m.role === "assistant" ? "model" : m.role,
      parts: [{ text: m.content }],
    })),
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { temperature: 0.7, maxOutputTokens: 500, topP: 0.9 },
  };
  if (tools && tools.length > 0) body.tools = tools;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error("callGemini HTTP error:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const json = await res.json();
    const candidate = json.candidates?.[0]?.content;
    if (!candidate?.parts?.length) return null;

    // function call があれば優先
    const fcPart = candidate.parts.find(p => p.functionCall);
    if (fcPart) {
      return { type: "function_call", functionCall: fcPart.functionCall };
    }
    // テキスト
    const textPart = candidate.parts.find(p => p.text);
    if (textPart) {
      return { type: "text", text: textPart.text.trim() };
    }
    return null;
  } catch (e) {
    console.error("callGemini error:", String(e));
    return null;
  }
}

// ── 会話履歴（KV: conv:{sourceKey}） ──────────────────────────

async function loadConversationHistory(env, sourceKey) {
  try {
    const raw = await env.CHAT_HISTORY.get(`conv:${sourceKey}`);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function saveConversationHistory(env, sourceKey, userText, reply) {
  try {
    const history = await loadConversationHistory(env, sourceKey);
    history.push({ role: "user", content: userText });
    history.push({ role: "assistant", content: reply });
    // スライディングウィンドウ: 直近20メッセージ（10ターン）
    const trimmed = history.slice(-20);
    await env.CHAT_HISTORY.put(`conv:${sourceKey}`, JSON.stringify(trimmed), { expirationTtl: 3600 });
  } catch (e) {
    console.error("saveConversationHistory error:", String(e));
  }
}

// ── レート制限（KV: gemini_rpm:{minute}） ─────────────────────

async function checkGeminiRateLimit(env) {
  try {
    const minute = Math.floor(Date.now() / 60000);
    const key = `gemini_rpm:${minute}`;
    const count = parseInt(await env.CHAT_HISTORY.get(key) || "0", 10);
    return count < 14; // 15 RPM 上限に余裕
  } catch {
    return true; // KVエラー時はリミット解放
  }
}

async function incrementGeminiCounter(env) {
  try {
    const minute = Math.floor(Date.now() / 60000);
    const key = `gemini_rpm:${minute}`;
    const count = parseInt(await env.CHAT_HISTORY.get(key) || "0", 10);
    await env.CHAT_HISTORY.put(key, String(count + 1), { expirationTtl: 120 });
  } catch (e) {
    console.error("incrementGeminiCounter error:", String(e));
  }
}

/* =========================================================
   けらのすけ v2 — システムプロンプト + オーケストレーター + Function Calling
========================================================= */

/**
 * けらのすけのシステムプロンプトを構築
 * @param {string|null} context - buildKabukiContext() の結果
 * @returns {string}
 */
function buildKeraSystemPrompt(context) {
  const persona = [
    "あなたは「けらのすけ」。歌舞伎の魅力を伝えるAIアシスタントだよ。",
    "一人称は「けらのすけ」。親しみやすい口調で、歌舞伎初心者にもわかりやすく答えてね。",
    "回答は200文字以内を目安にしてね。長くなりすぎないように。",
    "歌舞伎に関係ない質問には「けらのすけは歌舞伎のことなら何でも聞いてほしいな！」と答えてね。",
    "",
    "会話の流れ:",
    "- 前の会話の文脈を踏まえて自然に回答してね。",
    "- 「それ」「あれ」などの指示語は直前の話題を参照してね。",
  ];

  if (context) {
    persona.push(
      "",
      "以下の[DATA]を参考にして回答してね。",
      "- [DATA]にある情報だけを使って答えてね。",
      "- [DATA]にない俳優名・年号・史実は推測や創作しないでね。",
      "- [DATA]で部分的にしかカバーできない場合は、わかる範囲で答えて「詳しくは演目ガイドを見てね🙏」と伝えてね。",
      "- [DATA]に全く関連情報がない場合は「けらのすけには詳しい情報がないや🙏 演目ガイドで確認してみてね！」と答えてね。",
      "",
      "[DATA]",
      context,
    );
  } else {
    persona.push(
      "",
      "参考データが手元にないよ。ツール（search_performances, search_news, lookup_glossary, lookup_enmoku, get_group_info）を使って情報を探してみてね。",
      "ツールで見つからない場合は「けらのすけには詳しい情報がないや🙏」と正直に答えてね。",
    );
  }

  return persona.join("\n");
}

/**
 * Gemini に渡すツール定義
 */
function getKeraTools() {
  return [{
    functionDeclarations: [
      {
        name: "search_performances",
        description: "歌舞伎の公演スケジュールを検索する。劇場名、月、キーワードで絞り込み可能。",
        parameters: {
          type: "object",
          properties: {
            theater: { type: "string", description: "劇場名（例: 歌舞伎座、国立劇場）" },
            month: { type: "string", description: "月（例: 2024-03）" },
            query: { type: "string", description: "検索キーワード" },
          },
        },
      },
      {
        name: "search_news",
        description: "歌舞伎関連のニュースを検索する。",
        parameters: {
          type: "object",
          properties: {
            category: { type: "string", description: "カテゴリ（kabuki, jikabuki）" },
            query: { type: "string", description: "検索キーワード" },
          },
        },
      },
      {
        name: "lookup_glossary",
        description: "歌舞伎用語を検索して意味を調べる。",
        parameters: {
          type: "object",
          properties: {
            term: { type: "string", description: "調べたい用語（例: 花道、見得、六方）" },
          },
          required: ["term"],
        },
      },
      {
        name: "lookup_enmoku",
        description: "歌舞伎の演目の詳細情報（あらすじ、見どころ、登場人物など）を取得する。",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "演目名（例: 義経千本桜、勧進帳）" },
          },
          required: ["title"],
        },
      },
      {
        name: "get_group_info",
        description: "地歌舞伎団体の情報を取得する。",
        parameters: {
          type: "object",
          properties: {
            group_id: { type: "string", description: "団体ID" },
          },
        },
      },
    ],
  }];
}

/**
 * ツール実行
 * @returns {Promise<string>} ツール実行結果（JSON文字列）
 */
async function executeKeraFunction(env, name, args) {
  try {
    switch (name) {
      case "search_performances": {
        const data = await getPerformancesCached(env);
        let items = data?.items || [];
        if (args?.theater) {
          const t = args.theater.toLowerCase();
          items = items.filter(p => (p.theater || "").toLowerCase().includes(t));
        }
        if (args?.month) {
          items = items.filter(p => (p.date_range || "").includes(args.month));
        }
        if (args?.query) {
          const q = args.query.toLowerCase();
          items = items.filter(p =>
            (p.title || "").toLowerCase().includes(q) ||
            (p.theater || "").toLowerCase().includes(q)
          );
        }
        const result = items.slice(0, 8).map(p => ({
          theater: p.theater, title: p.title, date_range: p.date_range, time: p.time,
        }));
        return JSON.stringify({ performances: result, count: items.length });
      }

      case "search_news": {
        const newsData = await getCachedNews(env);
        if (!newsData) return JSON.stringify({ articles: [], message: "ニュースデータなし" });
        let articles = newsData.articles || newsData.items || [];
        if (args?.category) {
          articles = articles.filter(a => (a.category || a.key || "").includes(args.category));
        }
        if (args?.query) {
          const q = args.query.toLowerCase();
          articles = articles.filter(a => (a.title || "").toLowerCase().includes(q));
        }
        const result = articles.slice(0, 5).map(a => ({
          title: a.title, source: a.source, date: a.date || a.pubDate,
        }));
        return JSON.stringify({ articles: result, count: articles.length });
      }

      case "lookup_glossary": {
        const glossary = await loadGlossary(env);
        const term = (args?.term || "").toLowerCase().replace(/[\s　]/g, "");
        const found = (glossary || []).filter(t => {
          const tn = (t.term || "").toLowerCase().replace(/[\s　]/g, "");
          const rn = (t.reading || "").toLowerCase().replace(/[\s　]/g, "");
          return tn.includes(term) || term.includes(tn) || rn.includes(term) || term.includes(rn);
        }).slice(0, 3);
        if (!found.length) return JSON.stringify({ message: "該当する用語が見つかりませんでした" });
        return JSON.stringify({ terms: found.map(t => ({ term: t.term, reading: t.reading, description: (t.desc || t.description || "").slice(0, 500) })) });
      }

      case "lookup_enmoku": {
        const catalog = await loadEnmokuCatalog(env);
        const title = (args?.title || "").toLowerCase().replace(/[\s　]/g, "");
        const item = (catalog || []).find(c => {
          const full = (c.full || c.title || "").toLowerCase().replace(/[\s　]/g, "");
          const short = (c.short || c.title_short || "").toLowerCase().replace(/[\s　]/g, "");
          return full.includes(title) || title.includes(full) || short.includes(title) || title.includes(short);
        });
        if (!item) return JSON.stringify({ message: "該当する演目が見つかりませんでした" });
        const data = await loadEnmokuJson(env, item.id).catch(() => null);
        if (!data) return JSON.stringify({ title: item.full || item.short, message: "詳細データなし" });
        return JSON.stringify({
          title: data.title,
          synopsis: (data.synopsis || "").slice(0, 800),
          highlights: Array.isArray(data.highlights) ? data.highlights.slice(0, 5) : [],
          cast: (data.cast || []).slice(0, 8).map(c => ({ name: c?.name, role: c?.role })),
        });
      }

      case "get_group_info": {
        const obj = await env.CONTENT_BUCKET.get("jikabuki_groups.json");
        if (!obj) return JSON.stringify({ message: "団体データなし" });
        const groups = await obj.json().catch(() => []);
        if (args?.group_id) {
          const g = (Array.isArray(groups) ? groups : groups.groups || []).find(g => g.id === args.group_id);
          return JSON.stringify(g || { message: "該当団体なし" });
        }
        const list = (Array.isArray(groups) ? groups : groups.groups || []).slice(0, 10).map(g => ({ id: g.id, name: g.name, prefecture: g.prefecture }));
        return JSON.stringify({ groups: list });
      }

      default:
        return JSON.stringify({ error: "unknown function" });
    }
  } catch (e) {
    console.error("executeKeraFunction error:", name, String(e));
    return JSON.stringify({ error: String(e) });
  }
}

/**
 * Function call の結果を Gemini に返して最終回答を生成
 */
async function handleFunctionCall(env, functionCall, systemPrompt, messages) {
  const result = await executeKeraFunction(env, functionCall.name, functionCall.args);
  console.log("keraFnCall:", functionCall.name, "result len:", result.length);

  // Gemini function calling プロトコル: functionResponse で結果を返す
  const followUpContents = [
    ...messages.map(m => ({
      role: m.role === "assistant" ? "model" : m.role,
      parts: [{ text: m.content }],
    })),
    {
      role: "model",
      parts: [{ functionCall: { name: functionCall.name, args: functionCall.args } }],
    },
    {
      role: "user",
      parts: [{ functionResponse: { name: functionCall.name, response: { content: result } } }],
    },
  ];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: followUpContents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.7, maxOutputTokens: 500, topP: 0.9 },
      }),
    });
    if (!res.ok) {
      console.error("handleFunctionCall HTTP error:", res.status);
      return null;
    }
    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
    return text ? text.trim() : null;
  } catch (e) {
    console.error("handleFunctionCall error:", String(e));
    return null;
  }
}

/**
 * けらのすけ v2 メインオーケストレーター
 * Gemini 2.0 Flash で回答し、失敗時は既存 Workers AI にフォールバック
 */
async function keraAIv2(env, sourceKey, userText, context) {
  // 1. レート確認
  const withinLimit = await checkGeminiRateLimit(env);
  if (!withinLimit || !env.GEMINI_API_KEY) {
    console.log("keraAIv2: rate limit exceeded or no API key, falling back");
    return context ? await keraAI(env, userText, context) : null;
  }

  // 2. 履歴取得
  const history = await loadConversationHistory(env, sourceKey);

  // 3. プロンプト構築
  const systemPrompt = buildKeraSystemPrompt(context);

  // 4. メッセージ組み立て（履歴 + 今回の発言）
  const messages = [...history, { role: "user", content: userText }];

  // 5. Gemini 呼び出し（ツール付き）
  await incrementGeminiCounter(env);
  const tools = context ? undefined : getKeraTools(); // コンテキストありならツール不要
  const geminiResult = await callGemini(env, systemPrompt, messages, tools);

  if (!geminiResult) {
    console.log("keraAIv2: Gemini returned null, falling back");
    return context ? await keraAI(env, userText, context) : null;
  }

  // 6. Function call 処理
  if (geminiResult.type === "function_call") {
    console.log("keraAIv2: function_call:", geminiResult.functionCall.name);
    await incrementGeminiCounter(env);
    const fnResult = await handleFunctionCall(env, geminiResult.functionCall, systemPrompt, messages);
    if (fnResult) {
      await saveConversationHistory(env, sourceKey, userText, fnResult);
      return fnResult;
    }
    // function call 失敗→フォールバック
    console.log("keraAIv2: function call failed, falling back");
    return context ? await keraAI(env, userText, context) : null;
  }

  // 7. テキスト回答
  if (geminiResult.type === "text" && geminiResult.text) {
    await saveConversationHistory(env, sourceKey, userText, geminiResult.text);
    return geminiResult.text;
  }

  // 全失敗→フォールバック
  return context ? await keraAI(env, userText, context) : null;
}

/* (getWebModeInit / handleWebPostback は Web ウィジェット廃止に伴い削除) */

/* handleWebPostback 関数はウィジェット廃止により削除
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
handleWebPostback 関数ここまで */

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
   稽古スケジュール LINE通知
========================================================= */
async function notifyScheduleToMembers(env, groupId, schedule) {
  const group = await getGroup(env, groupId);
  if (!group || !group.line_group_id) return;

  const days = ["日","月","火","水","木","金","土"];
  function dateLabel(d) {
    if (!d) return "";
    const parts = d.split("-");
    const dt = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
    return `${dt.getMonth()+1}月${dt.getDate()}日(${days[dt.getDay()]})`;
  }

  const datePart = dateLabel(schedule.date);
  const timePart = schedule.time_start
    ? (schedule.time_end ? `${schedule.time_start}〜${schedule.time_end}` : schedule.time_start)
    : "";
  const locPart = schedule.location ? `📍 ${schedule.location}` : "";
  const lines = [
    `【稽古スケジュール登録】`,
    `${datePart}${timePart ? " " + timePart : ""}`,
    schedule.title,
    locPart,
    schedule.note ? schedule.note : "",
    ``,
    `出欠回答はこちら 👇`,
    `https://kabukiplus.com/groups/${groupId}/schedule`
  ].filter(l => l !== undefined && l !== null && !(l === "" && !locPart && !schedule.note)).join("\n").trim();

  await pushLine(env, group.line_group_id, lines);
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
