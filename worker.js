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
       0.5) お稽古モード（/training）
    ===================================================== */
    if (path === "/training") {
      return new Response(trainingPageHTML(), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (path === "/training/ookawa") {
      return new Response(ookawaPageHTML(), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (path === "/training/ookawa/editor") {
      return new Response(ookawaCueEditorHTML(), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
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
      const data = String(event.postback?.data ?? "").trim();
      const p = parsePostback(data);

      console.log("POSTBACK parsed:", JSON.stringify(p), "raw data:", JSON.stringify(data));

      // ガード: data が空または解析不能なときだけデフォルトでメニューを表示
      const hasKnownAction = p.step != null || p.mode != null || p.quiz != null || /^(mode|step|quiz)=/.test(data);
      if (!data || !hasKnownAction) {
        await respondLineMessages(env, replyToken, destId, [mainMenuFlex(env)]);
        return;
      }

      // step=menu のみ：メニュー表示（明示的なメニュー戻り）
      if (p.step === "menu") {
        await env.CHAT_HISTORY.delete(modeKey);
        await env.CHAT_HISTORY.delete(enmokuKey);
        await respondLineMessages(env, replyToken, destId, [mainMenuFlex(env)]);
        return;
      }

      // mode= のみの postback（ナビ・おすすめ等）→ R2 専用 Flex を直接返す。Dify には行かない。
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
          if (modeVal === "comingsoon") {
            await respondLine(env, replyToken, destId, "6は準備中だよ🙂 もうちょっと待っててね！");
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
          await respondLineMessages(env, replyToken, destId, [mainMenuFlex(env)]);
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

      // ここに到達した = 解析はできたがどの分岐にも一致しなかった → デフォルトでメニューのみ表示
      console.log("POSTBACK unhandled branch:", { sourceKey, data, p: JSON.stringify(p) });
      await respondLineMessages(env, replyToken, destId, [mainMenuFlex(env)]);
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
      await respondLineMessages(env, replyToken, destId, [mainMenuFlex(env)]);
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

      await respondLineMessages(env, replyToken, destId, [mainMenuFlex(env)]);
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

    // Dify呼び出し（performance等 kera以外）→ 演目カードと同じ respondLine で返信
    try {
      await respondLine(env, replyToken, destId, "OK🙂 いま調べてるよ…");

      const data = await callDifyRaw(env, {
        userId: userId || sourceKey,
        query: text,
        mode,
        channel: "line"
      });

      const base = pickDifyAnswer(data) || "返答を取得できませんでした。";
      const outText = base + footerHint(mode, "line");

      await respondLine(env, replyToken, destId, outText);

    } catch (e) {
      console.log("LINE Dify error:", String(e?.stack || e));
      const errText = "エラーが発生したよ🙏 もう一度試してね。";
      await respondLine(env, replyToken, destId, errText);
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
    return { messages: [mainMenuFlex(env)] };
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
   Dify（env を明示的に参照・演目カード経路と同じ扱い）
========================================================= */
async function callDifyRaw(env, { userId, query, mode, channel }) {
  const baseUrl = env?.DIFY_BASE_URL ?? "";
  const endpoint = env?.DIFY_CHAT_ENDPOINT ?? "";
  const apiKey = env?.DIFY_API_KEY ?? "";
  if (!apiKey || !baseUrl || !endpoint) {
    console.error("Dify config missing. Set DIFY_API_KEY, DIFY_BASE_URL, DIFY_CHAT_ENDPOINT in wrangler secret.");
    return {};
  }
  const url = `${baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: { mode, channel },
        query,
        response_mode: "blocking",
        user: userId
      })
    });
    const data = res.ok ? await res.json().catch(() => ({})) : {};
    return data;
  } catch (e) {
    console.error("Dify request error:", String(e?.stack || e));
    return {};
  }
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

/* =========================================================
   お稽古モード HTML（/training）
   定式幕カラー: 黒 #1a1a1a / 赤 #C41E3A / 緑(萌黄) #6B8E23
========================================================= */
function trainingPageHTML() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>気良歌舞伎 お稽古モード</title>
<style>
  :root {
    --kuro: #1a1a1a;
    --aka: #C41E3A;
    --moegi: #6B8E23;
    --kin: #C5A55A;
    --shiro: #F5F0E8;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: "Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", serif;
    background: var(--kuro);
    color: var(--shiro);
    min-height: 100vh;
  }

  /* ── 定式幕ストライプ ── */
  .joshikimaku {
    height: 10px;
    background: repeating-linear-gradient(
      90deg,
      var(--kuro) 0%, var(--kuro) 33.33%,
      var(--moegi) 33.33%, var(--moegi) 66.66%,
      var(--aka) 66.66%, var(--aka) 100%
    );
  }

  /* ── ヘッダー ── */
  header {
    text-align: center;
    padding: 2.5rem 1rem 1.5rem;
    background: linear-gradient(180deg, rgba(26,26,26,1) 0%, rgba(40,20,20,0.95) 100%);
    border-bottom: 3px solid var(--kin);
    position: relative;
  }
  header::before {
    content: "🎭";
    font-size: 3rem;
    display: block;
    margin-bottom: 0.5rem;
    filter: drop-shadow(0 0 12px rgba(197,165,90,0.6));
  }
  header h1 {
    font-size: 1.8rem;
    letter-spacing: 0.3em;
    color: var(--kin);
    text-shadow: 0 2px 8px rgba(0,0,0,0.7);
  }
  header p {
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: #bbb;
    letter-spacing: 0.1em;
  }

  /* ── メインコンテンツ ── */
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 2rem 1.2rem 4rem;
  }

  .section-title {
    font-size: 1.1rem;
    color: var(--kin);
    border-left: 4px solid var(--aka);
    padding-left: 0.8rem;
    margin: 2rem 0 1rem;
    letter-spacing: 0.15em;
  }

  /* ── カード ── */
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
  .card {
    background: linear-gradient(135deg, #2a2020 0%, #1e1e1e 100%);
    border: 1px solid #333;
    border-radius: 12px;
    padding: 1.3rem;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  .card::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--aka), var(--moegi));
  }
  .card:hover {
    border-color: var(--kin);
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(197,165,90,0.15);
  }
  .card .icon { font-size: 2rem; margin-bottom: 0.6rem; }
  .card h3 {
    font-size: 1rem;
    color: var(--shiro);
    margin-bottom: 0.3rem;
  }
  .card p {
    font-size: 0.78rem;
    color: #999;
    line-height: 1.5;
  }
  .card .badge {
    display: inline-block;
    margin-top: 0.6rem;
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--aka);
    color: #fff;
  }
  .card .badge.green { background: var(--moegi); }

  /* ── 来たる公演バナー ── */
  .banner {
    margin-top: 2.5rem;
    background: linear-gradient(135deg, var(--aka) 0%, #8B0000 100%);
    border-radius: 14px;
    padding: 1.5rem;
    text-align: center;
    border: 1px solid rgba(197,165,90,0.3);
  }
  .banner h2 {
    font-size: 1.2rem;
    color: var(--kin);
    margin-bottom: 0.4rem;
  }
  .banner p {
    font-size: 0.85rem;
    color: rgba(255,255,255,0.85);
    line-height: 1.6;
  }

  /* ── フッター ── */
  footer {
    text-align: center;
    padding: 1.5rem;
    font-size: 0.75rem;
    color: #555;
    border-top: 1px solid #333;
  }
  footer a { color: var(--kin); text-decoration: none; }
  footer a:hover { text-decoration: underline; }

  /* ── アニメーション ── */
  @keyframes fadeUp {
    from { opacity:0; transform: translateY(20px); }
    to   { opacity:1; transform: translateY(0); }
  }
  .card, .banner {
    animation: fadeUp 0.5s ease both;
  }
  .card:nth-child(2) { animation-delay: 0.08s; }
  .card:nth-child(3) { animation-delay: 0.16s; }
  .card:nth-child(4) { animation-delay: 0.24s; }
  .card:nth-child(5) { animation-delay: 0.32s; }
  .card:nth-child(6) { animation-delay: 0.40s; }
</style>
</head>
<body>

<div class="joshikimaku"></div>

<header>
  <h1>お稽古モード</h1>
  <p>気良歌舞伎 ── 学びの間</p>
</header>

<div class="joshikimaku"></div>

<main>
  <h2 class="section-title">稽古メニュー</h2>
  <div class="card-grid">
    <div class="card" onclick="alert('演目ガイド：準備中だよ🙂')">
      <div class="icon">📖</div>
      <h3>演目を学ぶ</h3>
      <p>20演目のあらすじ・みどころ・登場人物を予習しよう</p>
      <span class="badge">20演目収録</span>
    </div>
    <div class="card" onclick="alert('用語いろは：準備中だよ🙂')">
      <div class="icon">📝</div>
      <h3>用語いろは</h3>
      <p>歌舞伎の専門用語を 8カテゴリ 126語で解説</p>
      <span class="badge green">126語</span>
    </div>
    <div class="card" onclick="alert('クイズ：準備中だよ🙂')">
      <div class="icon">🎯</div>
      <h3>歌舞伎クイズ</h3>
      <p>全100問の三択クイズ。目指せ「名人」昇進！</p>
      <span class="badge">100問</span>
    </div>
    <div class="card" onclick="alert('おすすめ：準備中だよ🙂')">
      <div class="icon">🌟</div>
      <h3>おすすめ演目</h3>
      <p>初心者向けやジャンル別に、気良歌舞伎の推し演目を紹介</p>
      <span class="badge green">厳選</span>
    </div>
    <div class="card" onclick="location.href='/training/ookawa'">
      <div class="icon">📣</div>
      <h3>大向こう稽古</h3>
      <p>公演動画を見ながら掛け声のタイミングを練習しよう</p>
      <span class="badge">NEW</span>
    </div>
    <div class="card" onclick="alert('ナビ：準備中だよ🙂')">
      <div class="icon">💬</div>
      <h3>気良歌舞伎ナビ</h3>
      <p>公演・会場・アクセス・参加方法をAIがご案内</p>
      <span class="badge">FAQ</span>
    </div>
    <div class="card" onclick="alert('動画：準備中だよ🙂')">
      <div class="icon">🎬</div>
      <h3>公演動画</h3>
      <p>過去の公演映像で演目の雰囲気をつかもう</p>
      <span class="badge green">映像</span>
    </div>
  </div>

  <div class="banner">
    <h2>🏯 次回公演に向けて</h2>
    <p>
      お稽古モードで演目や用語を予習しておくと、<br>
      本番の舞台がもっと楽しくなるよ！<br>
      <strong style="color:var(--kin);">「知る」から「観る」へ ── そして「演る」へ。</strong>
    </p>
  </div>
</main>

<div class="joshikimaku"></div>

<footer>
  <p>気良歌舞伎 AI ガイド「けらのすけ」 &copy; 2026</p>
  <p style="margin-top:4px;"><a href="/">トップへ戻る</a></p>
</footer>

</body>
</html>`;
}

/* =========================================================
   大向こう稽古 HTML（/training/ookawa）
   YouTube動画を再生しながら掛け声タイミングでタップ！
========================================================= */
// =============================================================
// タイミング記録エディタ — /training/ookawa/editor
// =============================================================
function ookawaCueEditorHTML() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>大向こう キュー編集 - 気良歌舞伎</title>
<style>
  :root{--kuro:#1a1a1a;--aka:#C41E3A;--moegi:#6B8E23;--kin:#C5A55A;--shiro:#F5F0E8;}
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:"Noto Sans JP","Hiragino Sans",sans-serif;
    background:var(--kuro);color:var(--shiro);min-height:100vh;}
  .bar{height:6px;background:repeating-linear-gradient(90deg,
    var(--kuro) 0%,var(--kuro) 33.33%,
    var(--moegi) 33.33%,var(--moegi) 66.66%,
    var(--aka) 66.66%,var(--aka) 100%);}
  header{text-align:center;padding:1rem;border-bottom:2px solid var(--kin);}
  header h1{font-size:1.2rem;color:var(--kin);letter-spacing:0.15em;}
  header p{font-size:0.75rem;color:#999;margin-top:0.3rem;}

  /* ── 入力エリア ── */
  .input-row{max-width:760px;margin:1rem auto;padding:0 1rem;display:flex;gap:0.5rem;flex-wrap:wrap;}
  .input-row input{flex:1;min-width:200px;padding:0.5rem 0.8rem;border:1px solid #555;
    border-radius:6px;background:#222;color:var(--shiro);font-size:0.9rem;font-family:inherit;}
  .input-row button{padding:0.5rem 1.2rem;border:none;border-radius:6px;
    font-size:0.9rem;font-family:inherit;cursor:pointer;}
  #btn-load{background:var(--kin);color:var(--kuro);font-weight:bold;}

  /* ── 動画エリア ── */
  #stage{max-width:760px;margin:0 auto;position:relative;display:none;}
  #player-wrap{position:relative;width:100%;padding-top:56.25%;background:#000;}
  #player-wrap iframe{position:absolute;top:0;left:0;width:100%;height:100%;}

  /* ── 現在時間 ── */
  #time-display{text-align:center;font-size:1.4rem;color:var(--kin);
    font-variant-numeric:tabular-nums;padding:0.5rem 0;font-weight:bold;}

  /* ── タップボタン ── */
  .tap-row{max-width:760px;margin:0 auto;padding:0 1rem;
    display:none;gap:0.6rem;}
  .tap-row button{flex:1;padding:1rem;border-radius:12px;font-size:1.1rem;
    font-family:inherit;cursor:pointer;border:2px solid;transition:transform 0.1s;}
  .tap-row button:active{transform:scale(0.95);}
  #btn-kakegoe{background:#3a1515;color:var(--shiro);border-color:var(--aka);}
  #btn-kakegoe:active{background:var(--aka);}
  #btn-hakushu{background:#1a2a1a;color:var(--shiro);border-color:var(--moegi);}
  #btn-hakushu:active{background:var(--moegi);}

  /* ── キューリスト ── */
  #cue-list-wrap{max-width:760px;margin:1rem auto;padding:0 1rem;}
  #cue-list-wrap h2{font-size:0.95rem;color:var(--kin);margin-bottom:0.5rem;
    border-left:3px solid var(--aka);padding-left:0.6rem;}
  table{width:100%;border-collapse:collapse;font-size:0.8rem;}
  th{text-align:left;color:#999;padding:0.3rem 0.4rem;border-bottom:1px solid #333;}
  td{padding:0.3rem 0.4rem;border-bottom:1px solid #222;vertical-align:middle;}
  .time-cell{color:var(--kin);font-variant-numeric:tabular-nums;white-space:nowrap;font-weight:bold;}
  .type-kakegoe{color:var(--aka);} .type-hakushu{color:var(--moegi);}
  td input,td select{background:#222;color:var(--shiro);border:1px solid #444;
    border-radius:4px;padding:0.25rem 0.4rem;font-size:0.8rem;font-family:inherit;width:100%;}
  td select{width:auto;}
  .del-btn{background:none;border:none;color:#666;cursor:pointer;font-size:1rem;}
  .del-btn:hover{color:var(--aka);}

  /* ── エクスポート ── */
  #export-area{max-width:760px;margin:1rem auto;padding:0 1rem;}
  #export-area h2{font-size:0.95rem;color:var(--kin);margin-bottom:0.5rem;
    border-left:3px solid var(--moegi);padding-left:0.6rem;}
  #export-box{width:100%;min-height:120px;background:#111;color:#ccc;
    border:1px solid #333;border-radius:6px;padding:0.6rem;font-family:"Consolas","Courier New",monospace;
    font-size:0.75rem;resize:vertical;}
  .export-btns{margin-top:0.5rem;display:flex;gap:0.5rem;}
  .export-btns button{padding:0.4rem 1rem;border:none;border-radius:6px;
    cursor:pointer;font-size:0.85rem;font-family:inherit;}
  #btn-export{background:var(--kin);color:var(--kuro);font-weight:bold;}
  #btn-copy{background:var(--moegi);color:#fff;font-weight:bold;}
  #copy-msg{color:var(--moegi);font-size:0.8rem;margin-left:0.5rem;opacity:0;transition:opacity 0.3s;}

  footer{text-align:center;padding:1rem;font-size:0.75rem;color:#555;
    border-top:1px solid #333;margin-top:2rem;}
  footer a{color:var(--kin);text-decoration:none;}
</style>
</head>
<body>

<div class="bar"></div>
<header>
  <h1>大向こう キュー編集ツール</h1>
  <p>動画を再生しながらタップ → タイミングを自動記録</p>
</header>
<div class="bar"></div>

<div class="input-row">
  <input id="video-id" placeholder="YouTube動画ID（例: I5QncXeoIm0）" value="I5QncXeoIm0">
  <button id="btn-load">動画を読み込む</button>
</div>

<div id="stage">
  <div id="player-wrap"><div id="player"></div></div>
</div>
<div id="time-display">0:00.0</div>

<div class="tap-row" id="tap-row">
  <button id="btn-kakegoe">🎤 掛け声</button>
  <button id="btn-hakushu">👏 拍手</button>
</div>

<div id="cue-list-wrap">
  <h2>記録されたキュー (<span id="cue-count">0</span>)</h2>
  <table>
    <thead><tr><th>時間</th><th>種類</th><th>テキスト</th><th>ヒント</th><th></th></tr></thead>
    <tbody id="cue-tbody"></tbody>
  </table>
</div>

<div id="export-area">
  <h2>エクスポート</h2>
  <textarea id="export-box" readonly></textarea>
  <div class="export-btns">
    <button id="btn-export">生成</button>
    <button id="btn-copy">📋 コピー</button>
    <span id="copy-msg">コピーしました！</span>
  </div>
</div>

<footer><a href="/training/ookawa">大向こう稽古へ戻る</a></footer>

<script>
// ── state ──
let player = null;
let cueData = []; // { time, type, text, hint }
let ticker = null;

const kakegoeTexts = ["待ってました！","たっぷりと！","よっ！","日本一！","大統領！"];
const defaultKakegoe = "待ってました！";

// ── YouTube API ──
const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);
window.onYouTubeIframeAPIReady = () => console.log("YT API ready");

// ── 動画読み込み ──
document.getElementById("btn-load").onclick = () => {
  const vid = document.getElementById("video-id").value.trim();
  if (!vid) return;
  document.getElementById("stage").style.display = "block";
  document.getElementById("tap-row").style.display = "flex";
  if (player) player.destroy();
  player = new YT.Player("player", {
    videoId: vid,
    playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
    events: { onReady: () => startTicker() }
  });
};

function startTicker() {
  if (ticker) clearInterval(ticker);
  ticker = setInterval(() => {
    if (!player || typeof player.getCurrentTime !== "function") return;
    const t = player.getCurrentTime();
    document.getElementById("time-display").textContent = fmtTime(t);
  }, 100);
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m + ":" + sec.toFixed(1).padStart(4, "0");
}

function fmtTimeShort(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ":" + String(sec).padStart(2, "0");
}

// ── タップ記録 ──
function recordCue(type) {
  if (!player || typeof player.getCurrentTime !== "function") return;
  const t = parseFloat(player.getCurrentTime().toFixed(1));
  const entry = {
    time: t,
    type: type,
    text: type === "kakegoe" ? defaultKakegoe : "",
    hint: ""
  };
  cueData.push(entry);
  cueData.sort((a, b) => a.time - b.time);
  renderTable();
}

document.getElementById("btn-kakegoe").onclick = () => recordCue("kakegoe");
document.getElementById("btn-hakushu").onclick = () => recordCue("hakushu");

// ── キーボードショートカット ──
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
  if (e.key === "k" || e.key === "K") recordCue("kakegoe");
  if (e.key === "h" || e.key === "H") recordCue("hakushu");
});

// ── テーブル描画 ──
function renderTable() {
  const tbody = document.getElementById("cue-tbody");
  document.getElementById("cue-count").textContent = cueData.length;
  tbody.innerHTML = "";
  cueData.forEach((c, i) => {
    const tr = document.createElement("tr");

    // 時間
    const tdTime = document.createElement("td");
    tdTime.className = "time-cell";
    tdTime.textContent = fmtTimeShort(c.time) + " (" + c.time + "s)";
    tr.appendChild(tdTime);

    // 種類
    const tdType = document.createElement("td");
    const sel = document.createElement("select");
    ["kakegoe","hakushu"].forEach(v => {
      const opt = document.createElement("option");
      opt.value = v; opt.textContent = v === "kakegoe" ? "🎤 掛け声" : "👏 拍手";
      if (v === c.type) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.onchange = () => { c.type = sel.value; if (c.type === "hakushu") c.text = ""; renderTable(); };
    tdType.appendChild(sel);
    tr.appendChild(tdType);

    // テキスト
    const tdText = document.createElement("td");
    if (c.type === "kakegoe") {
      const selT = document.createElement("select");
      kakegoeTexts.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t; opt.textContent = t;
        if (t === c.text) opt.selected = true;
        selT.appendChild(opt);
      });
      selT.onchange = () => { c.text = selT.value; };
      tdText.appendChild(selT);
    } else {
      tdText.innerHTML = "<span style='color:#666'>（拍手）</span>";
    }
    tr.appendChild(tdText);

    // ヒント
    const tdHint = document.createElement("td");
    const inp = document.createElement("input");
    inp.value = c.hint; inp.placeholder = "例: 弁天小僧 登場";
    inp.oninput = () => { c.hint = inp.value; };
    tdHint.appendChild(inp);
    tr.appendChild(tdHint);

    // 削除
    const tdDel = document.createElement("td");
    const btnDel = document.createElement("button");
    btnDel.className = "del-btn"; btnDel.textContent = "✕";
    btnDel.onclick = () => { cueData.splice(i, 1); renderTable(); };
    tdDel.appendChild(btnDel);
    tr.appendChild(tdDel);

    tbody.appendChild(tr);
  });
}

// ── エクスポート ──
document.getElementById("btn-export").onclick = () => {
  const lines = cueData.map(c => {
    if (c.type === "kakegoe") {
      return '      { time: ' + c.time + ', type: "kakegoe", text: "' + c.text + '", hint: "' + c.hint + '" }';
    } else {
      return '      { time: ' + c.time + ', type: "hakushu", hint: "' + c.hint + '" }';
    }
  });
  const vid = document.getElementById("video-id").value.trim();
  const out = "cues: [\\n" + lines.join(",\\n") + "\\n    ]";
  document.getElementById("export-box").value = out;
};

document.getElementById("btn-copy").onclick = () => {
  const box = document.getElementById("export-box");
  navigator.clipboard.writeText(box.value).then(() => {
    const msg = document.getElementById("copy-msg");
    msg.style.opacity = "1";
    setTimeout(() => { msg.style.opacity = "0"; }, 2000);
  });
};

renderTable();
<\/script>
</body>
</html>`;
}

// =============================================================
// 大向こう稽古 — /training/ookawa
// =============================================================
function ookawaPageHTML() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>大向こう稽古 - 気良歌舞伎</title>
<style>
  :root {
    --kuro:#1a1a1a; --aka:#C41E3A; --moegi:#6B8E23;
    --kin:#C5A55A; --shiro:#F5F0E8;
  }
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:"Noto Serif JP","Yu Mincho","Hiragino Mincho ProN",serif;
    background:var(--kuro);color:var(--shiro);min-height:100vh;
    overflow-x:hidden;}

  .joshikimaku{height:8px;background:repeating-linear-gradient(90deg,
    var(--kuro) 0%,var(--kuro) 33.33%,
    var(--moegi) 33.33%,var(--moegi) 66.66%,
    var(--aka) 66.66%,var(--aka) 100%);}

  header{text-align:center;padding:1.2rem 1rem;
    border-bottom:2px solid var(--kin);}
  header h1{font-size:1.3rem;letter-spacing:0.2em;color:var(--kin);}
  header p{font-size:0.8rem;color:#999;margin-top:0.3rem;}

  /* ── 動画セレクタ ── */
  #scene-select{max-width:720px;margin:1rem auto;padding:0 1rem;}
  #scene-select h2{font-size:1rem;color:var(--kin);margin-bottom:0.6rem;
    border-left:3px solid var(--aka);padding-left:0.6rem;}
  .scene-list{display:flex;flex-wrap:wrap;gap:0.5rem;}
  .scene-btn{background:#2a2020;border:1px solid #444;color:var(--shiro);
    padding:0.5rem 1rem;border-radius:8px;cursor:pointer;font-size:0.85rem;
    font-family:inherit;transition:all 0.2s;}
  .scene-btn:hover,.scene-btn.active{border-color:var(--kin);
    background:#3a2a1a;color:var(--kin);}

  /* ── 動画エリア ── */
  #stage{max-width:720px;margin:0 auto;position:relative;
    display:none;}
  #player-wrap{position:relative;width:100%;padding-top:56.25%;background:#000;}
  #player-wrap iframe{position:absolute;top:0;left:0;width:100%;height:100%;}

  /* ── 掛け声オーバーレイ ── */
  #kakegoe-overlay{position:absolute;top:0;left:0;right:0;bottom:0;
    pointer-events:none;display:flex;align-items:center;justify-content:center;
    z-index:10;}
  #kakegoe-text{font-size:3rem;font-weight:bold;color:#fff;
    text-shadow:0 0 20px var(--aka),0 0 40px var(--aka),
      0 4px 8px rgba(0,0,0,0.8);
    opacity:0;transform:scale(0.3);transition:all 0.3s ease-out;
    letter-spacing:0.15em;white-space:nowrap;}
  #kakegoe-text.show{opacity:1;transform:scale(1);}
  #kakegoe-text.fade{opacity:0;transform:scale(1.3);transition:all 0.8s ease-in;}

  /* ── タップエリア ── */
  #tap-zone{max-width:720px;margin:0.8rem auto;padding:0 1rem;
    display:none;}
  .tap-buttons{display:flex;gap:0.6rem;}
  .tap-btn{flex:1;padding:1.2rem;border-radius:14px;
    color:var(--shiro);font-size:1.2rem;font-family:inherit;
    cursor:pointer;letter-spacing:0.15em;transition:all 0.15s;
    text-align:center;position:relative;overflow:hidden;border-width:3px;border-style:solid;}
  #btn-kakegoe-play{background:linear-gradient(135deg,#3a1515 0%,#1e1e1e 100%);
    border-color:var(--aka);}
  #btn-kakegoe-play:active{background:var(--aka);transform:scale(0.97);}
  #btn-hakushu-play{background:linear-gradient(135deg,#1a2a1a 0%,#1e1e1e 100%);
    border-color:var(--moegi);}
  #btn-hakushu-play:active{background:var(--moegi);transform:scale(0.97);}
  .tap-btn .sub{display:block;font-size:0.65rem;color:#999;margin-top:0.3rem;
    letter-spacing:0.05em;}

  /* ── 次の掛け声ヒント ── */
  #next-hint{max-width:720px;margin:0 auto;padding:0.5rem 1rem;
    text-align:center;font-size:0.85rem;color:#777;display:none;
    min-height:2rem;}
  #next-hint .hint-text{color:var(--kin);}

  /* ── タイムライン ── */
  #timeline{max-width:720px;margin:0.5rem auto;padding:0 1rem;display:none;}
  #timeline-bar{height:6px;background:#333;border-radius:3px;
    position:relative;overflow:visible;}
  #timeline-progress{height:100%;background:linear-gradient(90deg,var(--moegi),var(--aka));
    border-radius:3px;width:0%;transition:width 0.3s linear;}
  .cue-marker{position:absolute;top:-4px;width:14px;height:14px;
    background:var(--kin);border-radius:50%;transform:translateX(-50%);
    border:2px solid var(--kuro);z-index:2;}
  .cue-marker.hakushu-marker{background:var(--moegi);}
  .cue-marker.hit{box-shadow:0 0 8px var(--moegi);filter:brightness(1.3);}
  .cue-marker.missed{background:#555;box-shadow:none;filter:none;}

  /* ── スコア ── */
  #score-bar{max-width:720px;margin:0 auto;padding:0.6rem 1rem;
    display:none;text-align:center;}
  #score-bar span{font-size:0.9rem;margin:0 0.8rem;}
  .s-label{color:#999;} .s-val{color:var(--kin);font-weight:bold;}
  .s-great{color:var(--moegi)!important;} .s-good{color:var(--kin)!important;}
  .s-miss{color:var(--aka)!important;}

  /* ── 結果画面 ── */
  #result{max-width:720px;margin:2rem auto;padding:2rem;text-align:center;
    display:none;background:#2a2020;border-radius:14px;border:1px solid var(--kin);}
  #result h2{color:var(--kin);font-size:1.5rem;margin-bottom:1rem;}
  #result .big-score{font-size:3rem;color:var(--kin);}
  #result .detail{margin-top:1rem;font-size:0.9rem;color:#bbb;line-height:1.8;}
  #result button{margin-top:1.5rem;padding:0.7rem 2rem;background:var(--aka);
    color:#fff;border:none;border-radius:8px;font-size:1rem;cursor:pointer;
    font-family:inherit;}

  footer{text-align:center;padding:1.2rem;font-size:0.75rem;color:#555;
    border-top:1px solid #333;margin-top:2rem;}
  footer a{color:var(--kin);text-decoration:none;}

  /* ── リップル ── */
  @keyframes ripple{
    0%{transform:scale(0);opacity:0.6;}
    100%{transform:scale(4);opacity:0;}
  }
  .ripple{position:absolute;border-radius:50%;background:rgba(197,165,90,0.4);
    width:60px;height:60px;pointer-events:none;animation:ripple 0.6s ease-out forwards;}
</style>
</head>
<body>

<div class="joshikimaku"></div>
<header>
  <h1>大向こう稽古</h1>
  <p>動画に合わせて掛け声のタイミングを練習しよう</p>
</header>
<div class="joshikimaku"></div>

<div id="scene-select">
  <h2>演目をえらぶ</h2>
  <div class="scene-list" id="scene-list"></div>
</div>

<div id="stage">
  <div id="player-wrap">
    <div id="player"></div>
    <div id="kakegoe-overlay">
      <div id="kakegoe-text"></div>
    </div>
  </div>
</div>

<div id="timeline">
  <div id="timeline-bar">
    <div id="timeline-progress"></div>
  </div>
</div>

<div id="next-hint"></div>

<div id="tap-zone">
  <div class="tap-buttons">
    <button class="tap-btn" id="btn-kakegoe-play">
      🎤 掛け声！
      <span class="sub">声を掛けるタイミングで</span>
    </button>
    <button class="tap-btn" id="btn-hakushu-play">
      👏 拍手！
      <span class="sub">一区切りのタイミングで</span>
    </button>
  </div>
</div>

<div id="score-bar">
  <span><span class="s-label">大当たり </span><span class="s-val s-great" id="s-great">0</span></span>
  <span><span class="s-label">良し </span><span class="s-val s-good" id="s-good">0</span></span>
  <span><span class="s-label">空振り </span><span class="s-val s-miss" id="s-miss">0</span></span>
</div>

<div id="result">
  <h2>お稽古おつかれさま！</h2>
  <div class="big-score" id="result-score"></div>
  <div class="detail" id="result-detail"></div>
  <button onclick="location.reload()">もう一度えらぶ</button>
</div>

<footer>
  <a href="/training">お稽古メニューへ戻る</a>
</footer>

<!-- YouTube IFrame API -->
<script>
// =========================================================
// 演目データ（YouTube動画ID + 掛け声タイミング）
// ★ ここに実際の動画IDとタイミングを追加していく
// =========================================================
const SCENES = [
  {
    id: "shiranami",
    title: "白浪五人男「稲瀬川勢揃い」",
    videoId: "I5QncXeoIm0",
    duration: 780,  // 約13分
    cues: [
      // ===== 花道 ─ 一人ずつ登場 =====
      { time: 20,  type: "kakegoe", text: "待ってました！", hint: "弁天小僧 登場" },
      { time: 59,  type: "kakegoe", text: "待ってました！", hint: "忠信利平 登場" },
      { time: 81,  type: "kakegoe", text: "待ってました！", hint: "赤星十三郎 登場" },
      { time: 106, type: "kakegoe", text: "待ってました！", hint: "南郷力丸 登場" },
      { time: 132, type: "kakegoe", text: "待ってました！", hint: "日本駄右衛門 登場" },

      // 勢揃い（03:53）── 五人が並んでの見得
      { time: 233, type: "kakegoe", text: "日本一！",       hint: "五人勢揃いの見得" },

      // ===== つらね ─ 名乗りの開始と終わり =====
      // 日本駄右衛門（05:26〜）
      { time: 326, type: "kakegoe", text: "待ってました！", hint: "日本駄右衛門のつらね" },
      { time: 395, type: "hakushu",                         hint: "駄右衛門のつらね終わり" },

      // 弁天小僧菊之助（06:41〜）
      { time: 401, type: "kakegoe", text: "待ってました！", hint: "弁天小僧のつらね" },
      { time: 457, type: "hakushu",                         hint: "弁天小僧のつらね終わり" },

      // 忠信利平（07:43〜）
      { time: 463, type: "kakegoe", text: "待ってました！", hint: "忠信利平のつらね" },
      { time: 528, type: "hakushu",                         hint: "忠信利平のつらね終わり" },

      // 赤星十三郎（08:54〜）
      { time: 534, type: "kakegoe", text: "待ってました！", hint: "赤星十三郎のつらね" },
      { time: 604, type: "hakushu",                         hint: "赤星十三郎のつらね終わり" },

      // 南郷力丸（10:10〜）
      { time: 610, type: "kakegoe", text: "待ってました！", hint: "南郷力丸のつらね" },
      { time: 668, type: "hakushu",                         hint: "南郷力丸のつらね終わり" },

      // ===== クライマックス =====
      { time: 674, type: "kakegoe", text: "日本一！",       hint: "五人揃いの大見得" },

      // 立ち回り → 幕切れ
      { time: 760, type: "hakushu",                         hint: "幕切れ" },
    ]
  }
  // ★ 他の演目を追加するには、同じ形式で SCENES に追加してね
  // { id: "kanjincho", title: "勧進帳", videoId: "...", duration: ..., cues: [...] }
];

// =========================================================
// グローバル変数
// =========================================================
let player = null;
let currentScene = null;
let cues = [];
let cueIndex = 0;
let score = { great: 0, good: 0, miss: 0 };
let ticker = null;
const WINDOW_GREAT = 1.0; // ±1秒以内 = 大当たり
const WINDOW_GOOD  = 2.5; // ±2.5秒以内 = 良し

// =========================================================
// シーン選択ボタンを生成
// =========================================================
(function buildSceneList() {
  const list = document.getElementById("scene-list");
  SCENES.forEach(s => {
    const btn = document.createElement("button");
    btn.className = "scene-btn";
    btn.textContent = s.title;
    btn.onclick = () => startScene(s);
    list.appendChild(btn);
  });
})();

// =========================================================
// YouTube IFrame API 読み込み
// =========================================================
const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);

window.onYouTubeIframeAPIReady = function() {
  console.log("YouTube API ready");
};

// =========================================================
// シーン開始
// =========================================================
function startScene(scene) {
  currentScene = scene;
  cues = scene.cues.map(c => ({ ...c, result: null }));
  cueIndex = 0;
  score = { great: 0, good: 0, miss: 0 };
  updateScoreUI();

  // UI切替
  document.getElementById("scene-select").style.display = "none";
  document.getElementById("stage").style.display = "block";
  document.getElementById("tap-zone").style.display = "block";
  document.getElementById("next-hint").style.display = "block";
  document.getElementById("timeline").style.display = "block";
  document.getElementById("score-bar").style.display = "block";
  document.getElementById("result").style.display = "none";

  // タイムラインマーカー
  buildTimeline(scene);

  // YouTube プレイヤー生成
  if (player) player.destroy();
  player = new YT.Player("player", {
    videoId: scene.videoId,
    playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1 },
    events: {
      onReady: () => { player.playVideo(); startTicker(); },
      onStateChange: onPlayerState
    }
  });
}

// =========================================================
// タイムラインを構築
// =========================================================
function buildTimeline(scene) {
  const bar = document.getElementById("timeline-bar");
  // 既存マーカー除去
  bar.querySelectorAll(".cue-marker").forEach(el => el.remove());
  const dur = scene.duration || 120;
  cues.forEach((c, i) => {
    const m = document.createElement("div");
    m.className = "cue-marker" + (c.type === "hakushu" ? " hakushu-marker" : "");
    m.id = "marker-" + i;
    m.style.left = ((c.time / dur) * 100) + "%";
    m.title = (c.type === "hakushu" ? "👏 " : "🎤 ") + (c.hint || c.text || "");
    bar.appendChild(m);
  });
  document.getElementById("timeline-progress").style.width = "0%";
}

// =========================================================
// 毎フレーム更新
// =========================================================
function startTicker() {
  if (ticker) clearInterval(ticker);
  ticker = setInterval(tick, 200);
}

function tick() {
  if (!player || typeof player.getCurrentTime !== "function") return;
  const t = player.getCurrentTime();
  const dur = currentScene.duration || 120;

  // タイムライン進捗
  document.getElementById("timeline-progress").style.width =
    Math.min(100, (t / dur) * 100) + "%";

  // 次のヒント表示
  updateHint(t);

  // 過ぎた掛け声を miss 判定
  while (cueIndex < cues.length && cues[cueIndex].result === null &&
         t > cues[cueIndex].time + WINDOW_GOOD) {
    cues[cueIndex].result = "miss";
    score.miss++;
    markCue(cueIndex, "missed");
    cueIndex++;
    updateScoreUI();
  }
}

function updateHint(t) {
  const el = document.getElementById("next-hint");
  const next = cues.find(c => c.result === null);
  if (!next) {
    el.innerHTML = "もうキューはないよ！おつかれさま！";
    return;
  }
  const isKake = next.type !== "hakushu";
  const icon = isKake ? "🎤" : "👏";
  const label = isKake ? ("「" + (next.text || "掛け声") + "」") : "拍手";
  const diff = next.time - t;
  if (diff > 10) {
    el.innerHTML = "次は… " + icon + " <span class='hint-text'>" + next.hint + "</span>";
  } else if (diff > 3) {
    el.innerHTML = "もうすぐ！ " + icon + " <span class='hint-text'>" + label + "</span>";
  } else if (diff > 0) {
    el.innerHTML = "<span style='color:var(--aka);font-size:1.1rem;font-weight:bold;'>くるよ…！ " + icon + "</span>";
  } else {
    el.innerHTML = "<span style='color:var(--kin);font-size:1.1rem;font-weight:bold;'>今だ！！ " + icon + "</span>";
  }
}

// =========================================================
// タップ処理
// =========================================================
function handleTap(tapType, e, btn) {
  // リップル演出
  const rect = btn.getBoundingClientRect();
  const rip = document.createElement("div");
  rip.className = "ripple";
  rip.style.left = (e.clientX - rect.left - 30) + "px";
  rip.style.top = (e.clientY - rect.top - 30) + "px";
  btn.appendChild(rip);
  setTimeout(() => rip.remove(), 600);

  if (!player || typeof player.getCurrentTime !== "function") return;
  const t = player.getCurrentTime();

  // 最も近い未判定キューを探す（同じタイプ優先）
  let bestIdx = -1;
  let bestDiff = Infinity;
  for (let i = 0; i < cues.length; i++) {
    if (cues[i].result !== null) continue;
    const d = Math.abs(t - cues[i].time);
    if (d < bestDiff) { bestDiff = d; bestIdx = i; }
  }

  if (bestIdx < 0) return;

  const cue = cues[bestIdx];
  const cueType = cue.type || "kakegoe";
  const typeMatch = (tapType === cueType);

  if (bestDiff <= WINDOW_GREAT && typeMatch) {
    cue.result = "great";
    score.great++;
    showKakegoe(cueType === "kakegoe" ? cue.text : "👏", "var(--kin)");
    markCue(bestIdx, "hit");
  } else if (bestDiff <= WINDOW_GOOD && typeMatch) {
    cue.result = "good";
    score.good++;
    showKakegoe(cueType === "kakegoe" ? cue.text : "👏", "var(--moegi)");
    markCue(bestIdx, "hit");
  } else if (bestDiff <= WINDOW_GOOD && !typeMatch) {
    // タイミングは合ってるが種類が違う
    showKakegoe("種類が違うよ！", "var(--aka)");
    return;
  } else {
    showKakegoe("…", "#555");
    return;
  }

  while (cueIndex < cues.length && cues[cueIndex].result !== null) cueIndex++;
  updateScoreUI();
}

document.getElementById("btn-kakegoe-play").addEventListener("click", function(e) {
  handleTap("kakegoe", e, this);
});
document.getElementById("btn-hakushu-play").addEventListener("click", function(e) {
  handleTap("hakushu", e, this);
});

// =========================================================
// 掛け声テキスト演出
// =========================================================
function showKakegoe(text, color) {
  const el = document.getElementById("kakegoe-text");
  el.textContent = text;
  el.style.color = color || "#fff";
  el.className = "show";
  setTimeout(() => { el.className = "fade"; }, 1200);
  setTimeout(() => { el.className = ""; }, 2000);
}

// =========================================================
// スコア / マーカー更新
// =========================================================
function updateScoreUI() {
  document.getElementById("s-great").textContent = score.great;
  document.getElementById("s-good").textContent = score.good;
  document.getElementById("s-miss").textContent = score.miss;
}

function markCue(idx, cls) {
  const m = document.getElementById("marker-" + idx);
  if (m) m.classList.add(cls);
}

// =========================================================
// 動画終了 → 結果表示
// =========================================================
function onPlayerState(e) {
  if (e.data === YT.PlayerState.ENDED) {
    if (ticker) clearInterval(ticker);
    // 残りを miss
    cues.forEach((c, i) => {
      if (c.result === null) { c.result = "miss"; score.miss++; markCue(i, "missed"); }
    });
    updateScoreUI();
    showResult();
  }
}

function showResult() {
  document.getElementById("tap-zone").style.display = "none";
  document.getElementById("next-hint").style.display = "none";
  const total = cues.length;
  const pct = total > 0 ? Math.round(((score.great * 1.0 + score.good * 0.5) / total) * 100) : 0;

  let rank = "前座";
  if (pct >= 90) rank = "大名人 🏆";
  else if (pct >= 70) rank = "名人";
  else if (pct >= 50) rank = "上手";
  else if (pct >= 30) rank = "稽古中";

  document.getElementById("result-score").textContent = pct + "点（" + rank + "）";
  document.getElementById("result-detail").innerHTML =
    "大当たり: " + score.great + " / 良し: " + score.good + " / 空振り: " + score.miss +
    "<br>全" + total + "回の掛け声";
  document.getElementById("result").style.display = "block";
}
<\/script>

</body>
</html>`;
}
