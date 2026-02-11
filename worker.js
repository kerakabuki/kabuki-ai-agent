// worker.js（ルート）
// =========================================================
// Imports
// =========================================================
import { handleQuizMessage, loadQuizState } from "./src/quiz.js";

import { mainMenuFlex } from "./src/flex_menu.js";

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

// ★ 追加：気良歌舞伎ナビ（FAQ）
import {
  talkMenuFlex,
  talkAnswerFlex,
  findTalkTopic
} from "./src/flex_talk.js";

/* =========================================================
   Utils
========================================================= */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

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

      // メニュー
      if (isMenuCommand(text)) {
        await env.CHAT_HISTORY.delete(modeKey);
        await env.CHAT_HISTORY.delete(`enmoku:${sourceKey}`);

        return corsResponse(
          request,
          jsonResponse({ reply: "", session_id: sid || null, ui: { type: "menu" } })
        );
      }

      // mode未選択：数字で選ばせる
      if (!mode) {
        const selected = normalizeModeSelection(text);
        if (selected) {
          if (selected === "comingsoon") {
            return corsResponse(
              request,
              jsonResponse({ reply: "6は準備中だよ🙂 もうちょっと待っててね！", session_id: sid || null })
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
        return corsResponse(
          request,
          jsonResponse({ reply: "", session_id: sid || null, ui: { type: "menu" } })
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
        if (selectedAnytime === "comingsoon") {
          return corsResponse(
            request,
            jsonResponse({ reply: "6は準備中だよ🙂 もうちょっと待っててね！", session_id: sid || null, mode })
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

      // 迷ってそうなら例を出す（Difyに投げない）
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
                footer: [{ label: "メニュー", action: "postback:step=menu" }]
              }
            })
          );
        }

        return corsResponse(
          request,
          jsonResponse({ reply: exampleTextForMode(mode), session_id: sid || null, mode })
        );
      }

      // ★ kera（FAQ）モード：R2 topics を検索 → miss なら Dify フォールバック
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
                { label: "メニュー", action: "postback:step=menu" }
              ]
            }
          }));
        }

        // FAQ miss → Dify フォールバック
        try {
          const data = await callDifyRaw(env, {
            userId: sourceKey,
            query: text,
            mode,
            channel: "web"
          });

          const answer = pickDifyAnswer(data) || "ごめん、うまく答えられなかったよ🙏";

          return corsResponse(request, jsonResponse({
            reply: answer,
            session_id: sid || null,
            mode,
            ui: {
              type: "nav_buttons",
              items: [
                { label: "カテゴリ一覧", action: "postback:step=talk_list" },
                { label: "メニュー", action: "postback:step=menu" }
              ]
            }
          }));
        } catch (e) {
          console.log("WEB kera Dify fallback error:", String(e?.stack || e));
          return corsResponse(request, jsonResponse({
            reply: "その言葉だと見つからなかったよ🙏\n下のボタンからカテゴリを選んでね🙂",
            session_id: sid || null,
            mode,
            ui: {
              type: "buttons",
              items: [
                { label: "📁 カテゴリ一覧", action: "postback:step=talk_list" }
              ],
              footer: [{ label: "メニュー", action: "postback:step=menu" }]
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
                  { label: "メニュー", action: "postback:step=menu" }
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
                { label: "メニュー", action: "postback:step=menu" }
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
              { label: "メニュー", action: "postback:step=menu" }
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
                { label: "メニュー", action: "postback:step=menu" }
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
              { label: "メニュー", action: "postback:step=menu" }
            ]
          }
        }));
      }

      // Dify（Web）- performance/kera以外など（keraは上でreturn済）
      try {
        const data = await callDifyRaw(env, {
          userId: sourceKey,
          query: text,
          mode,
          channel: "web"
        });

        const answer = pickDifyAnswer(data);
        const base = answer || "返答を取得できませんでした。";

        const uiNav = (mode === "performance") ? {
          type: "nav_buttons",
          items: [
            { label: "演目一覧", action: "postback:step=enmoku_list" },
            { label: "メニュー", action: "postback:step=menu" }
          ]
        } : undefined;

        return corsResponse(
          request,
          jsonResponse({ reply: base, session_id: sid || null, mode, ui: uiNav })
        );

      } catch (e) {
        console.log("WEB Dify error:", String(e?.stack || e));
        return corsResponse(
          request,
          jsonResponse({
            reply: "エラーが発生したよ🙏 もう一度試してね。",
            session_id: sid || null,
            mode
          })
        );
      }
    }

    /* =====================================================
       3) その他（ヘルスチェック）
    ===================================================== */
    return new Response("OK", { status: 200 });
  }
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

  h.set("Access-Control-Allow-Methods", "POST, OPTIONS");
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
      const data = event.postback?.data || "";
      const p = parsePostback(data);

      console.log("POSTBACK parsed:", JSON.stringify(p));

      // stepがある場合はここで完結（modeより優先）
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

      // mode=... を受け取る
      const mm = data.match(/(?:^|&)mode=([^&]+)/);

      // ★ クイズ用postback（Quick Reply）
      const qm = data.match(/(?:^|&)quiz=([^&]+)/);
      if (qm) {
        const quizInput = decodeURIComponent(qm[1]);

        // 0=メニュー
        if (quizInput === "0") {
          await env.CHAT_HISTORY.delete(modeKey);
          await respondLineMessages(env, replyToken, destId, [mainMenuFlex()]);
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

      if (mm) {
        const picked = decodeURIComponent(mm[1]);

        if (picked === "comingsoon") {
          await respondLine(env, replyToken, destId, "6は準備中だよ🙂 もうちょっと待っててね！");
          return;
        }

        mode = picked;
        await env.CHAT_HISTORY.put(modeKey, mode);

        // ★ kera は FAQメニューを返す（Difyに行かない）
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

      console.log("POSTBACK:", { sourceKey, data });
      return;
    }

    // -------------------------
    // ② message(text)
    // -------------------------
    if (event.type !== "message") return;
    if (event.message?.type !== "text") return;

    const text = (event.message?.text || "").trim();
    console.log("IN:", { sourceKey, userId, destId, text, mode });

    // メニュー（0/メニュー/戻る）
    if (isMenuCommand(text)) {
      await env.CHAT_HISTORY.delete(modeKey);
      await env.CHAT_HISTORY.delete(enmokuKey);
      await respondLineMessages(env, replyToken, destId, [mainMenuFlex()]);
      return;
    }

    // mode未選択：数字で選ばせる
    if (!mode) {
      const selected = normalizeModeSelection(text);
      if (selected) {
        if (selected === "comingsoon") {
          await respondLine(env, replyToken, destId, "6は準備中だよ🙂 もうちょっと待っててね！");
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

      await respondLineMessages(env, replyToken, destId, [mainMenuFlex()]);
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
      if (selectedAnytime === "comingsoon") {
        await respondLine(env, replyToken, destId, "6は準備中だよ🙂 もうちょっと待っててね！");
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

    // 迷ってそうなら例（Difyに投げない）
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

    // ★ kera（FAQ）モード：R2直検索 → miss なら Dify フォールバック
    if (mode === "kera") {
      const topics = await loadTalkTopics(env);
      const hit = findTalkTopic(topics, text);

      if (hit) {
        await respondLineMessages(env, replyToken, destId, [talkAnswerFlex(hit)]);
        return;
      }

      try {
        const data = await callDifyRaw(env, {
          userId: userId || sourceKey,
          query: text,
          mode,
          channel: "line"
        });

        const answer = pickDifyAnswer(data) || "ごめん、うまく答えられなかったよ🙏";

        await respondLineMessages(env, replyToken, destId, [
          { type: "text", text: answer },
          talkMenuFlex(topics, 1)
        ]);
      } catch (e) {
        console.log("LINE kera Dify fallback error:", String(e?.stack || e));
        await respondLineMessages(env, replyToken, destId, [
          { type: "text", text: "その言葉だと見つからなかったよ🙏\nボタンから選んでね🙂" },
          talkMenuFlex(topics, 1)
        ]);
      }
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

    // Dify呼び出し（performance等 kera以外）
    try {
      await replyLine(env, replyToken, "OK🙂 いま調べてるよ…");

      const data = await callDifyRaw(env, {
        userId: userId || sourceKey,
        query: text,
        mode,
        channel: "line"
      });

      const base = pickDifyAnswer(data) || "返答を取得できませんでした。";
      const outText = base + footerHint(mode, "line");

      if (destId) await pushLine(env, destId, outText);
      else await replyLine(env, replyToken, outText);

    } catch (e) {
      const errText = "エラーが発生したよ🙏 もう一度試してね。";
      if (destId) await pushLine(env, destId, errText);
      else await replyLine(env, replyToken, errText);
    }

  } catch (e) {
    console.log("handleEvent exception:", String(e?.stack || e));
  }
}

/* =========================================================
   Helpers
========================================================= */
function isMenuCommand(text) {
  const t = (text || "").trim();
  return t === "戻る" || t === "メニュー" || t.toLowerCase() === "menu" || t === "0";
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
6) 準備中

数字（1〜5）で送ってね。
※ 0でいつでもこのメニューに戻れるよ`;
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
    : t === "6" ? "comingsoon"
    : null;
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
   演目ガイド postback 本体（R2 + KV）
========================================================= */
async function handleEnmokuGuidePostback(env, sourceKey, p) {
  const modeKey = `mode:${sourceKey}`;
  const enmokuKey = `enmoku:${sourceKey}`;
  const step = p.step;

  if (step === "menu") {
    await env.CHAT_HISTORY.delete(modeKey);
    await env.CHAT_HISTORY.delete(enmokuKey);
    return { messages: [mainMenuFlex()] };
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
    if (section === "synopsis") {
      return {
        messages: [
          enmokuSectionDetailFlex(shortTitle, "あらすじ", "📖", data.synopsis),
          sectionNavMessage("synopsis")
        ]
      };
    }
    if (section === "highlights") {
      return {
        messages: [
          enmokuSectionDetailFlex(shortTitle, "みどころ", "🌟", data.highlights),
          sectionNavMessage("highlights")
        ]
      };
    }
    if (section === "info") {
      return {
        messages: [
          enmokuSectionDetailFlex(shortTitle, "作品情報", "📝", data.info),
          sectionNavMessage("info")
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

    return {
      messages: [
        castDetailFlex(shortTitle, person),
        castNavMessage()
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
        footer: [{ label: "メニュー", action: "postback:step=menu" }]
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
      ui: { type: "buttons", items: buttons, footer: [{ label: "メニュー", action: "postback:step=menu" }] }
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
      ui: { type: "buttons", items: buttons, footer: [{ label: "メニュー", action: "postback:step=menu" }] }
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
      ui: { type: "buttons", items: buttons, footer: [{ label: "メニュー", action: "postback:step=menu" }] }
    };
  }

  if (mode === "quiz") {
    return { reply: quizIntroText() };
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
    return { reply: "", ui: { type: "menu" } };
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
    footer.push({ label: "メニュー", action: "postback:step=menu" });

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
            { label: "メニュー", action: "postback:step=menu" }
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
        footer: [{ label: "メニュー", action: "postback:step=menu" }]
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
          { label: "メニュー", action: "postback:step=menu" }
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
          { label: "メニュー", action: "postback:step=menu" }
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
          { label: "メニュー", action: "postback:step=menu" }
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

    const navItems = [];
    if (section !== "synopsis") navItems.push({ label: "あらすじ", action: "postback:step=section&section=synopsis" });
    if (section !== "highlights") navItems.push({ label: "みどころ", action: "postback:step=section&section=highlights" });
    if (section !== "cast") navItems.push({ label: "登場人物", action: "postback:step=section&section=cast" });
    if (section !== "info") navItems.push({ label: "作品情報", action: "postback:step=section&section=info" });

    const footer = [
      { label: "演目一覧", action: "postback:step=enmoku_list" },
      { label: "メニュー", action: "postback:step=menu" }
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
          { label: "項目に戻る", action: "postback:step=section_menu" }
        ],
        footer: [
          { label: "演目一覧", action: "postback:step=enmoku_list" },
          { label: "メニュー", action: "postback:step=menu" }
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
          { label: "メニュー", action: "postback:step=menu" }
        ]
      }
    };
  }

  if (step === "glossary_term") {
    const id = decodeURIComponent(params.get("id") || "");
    const glossary = await loadGlossary(env);
    const term = glossary.find(t => t.id === id);
    if (!term) return { reply: "該当する用語が見つからなかったよ🙏", mode: "general" };

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
          { label: "メニュー", action: "postback:step=menu" }
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
          { label: "メニュー", action: "postback:step=menu" }
        ]
      }
    };
  }

  return { reply: "ごめん、うまく処理できなかったよ🙏" };
}

/* =========================================================
   Dify
========================================================= */
async function callDifyRaw(env, { userId, query, mode, channel }) {
  const res = await fetch(`${env.DIFY_BASE_URL}${env.DIFY_CHAT_ENDPOINT}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.DIFY_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: { mode, channel },
      query,
      response_mode: "blocking",
      user: userId
    })
  });
  return res.ok ? res.json() : {};
}

function pickDifyAnswer(data) {
  return data?.answer || data?.data?.answer || data?.message || data?.output_text || null;
}

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
