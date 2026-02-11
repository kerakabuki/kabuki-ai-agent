// src/quiz.js
// クイズ関連（次へ(=7)／0でメニュー）
// ✅ 正答数（correct/answered）＋称号（昇進）表示
// ✅ 根本解決：phase導入（判定→次へ(7)）で誤判定を防止
// ✅ LINE/WEB出し分け：LINEはQuick Reply付き、WEBはテキストフッター

let QUIZ_CACHE = null;

// ---------------------
// KVキー
// ---------------------
export function quizStateKey(userKey) {
  return `quiz:user:${userKey}`;
}

// ---------------------
// 初期状態
// ---------------------
export function defaultQuizState() {
  return {
    answered_total: 0,
    correct_total: 0,
    answered: {}, // { [quiz_id]: true/false }
    wrong_ids: [], // 間違いの quiz_id 配列
    current: { quiz_id: null, mode: "normal" }, // mode: normal/review
    last_title: "名題下",
    phase: "awaiting_answer", // awaiting_answer | need_next
  };
}

export async function loadQuizState(env, userKey) {
  const raw = await env.CHAT_HISTORY.get(quizStateKey(userKey));
  if (!raw) return defaultQuizState();
  try {
    const st = JSON.parse(raw);
    if (!st.answered) st.answered = {};
    if (!Array.isArray(st.wrong_ids)) st.wrong_ids = [];
    if (!st.current) st.current = { quiz_id: null, mode: "normal" };
    if (!st.current.mode) st.current.mode = "normal";
    if (!st.last_title) st.last_title = "名題下";
    if (typeof st.answered_total !== "number") st.answered_total = 0;
    if (typeof st.correct_total !== "number") st.correct_total = 0;
    if (!st.phase) st.phase = "awaiting_answer";
    return st;
  } catch {
    return defaultQuizState();
  }
}

export async function saveQuizState(env, userKey, st) {
  await env.CHAT_HISTORY.put(quizStateKey(userKey), JSON.stringify(st));
}

// ---------------------
// R2からクイズ読み込み
// ---------------------
export async function loadQuizzesFromR2(env) {
  if (QUIZ_CACHE) return QUIZ_CACHE;

  const obj = await env.QUIZ_BUCKET.get("quizzes.json");
  if (!obj) return { list: [], map: {}, total: 0 };

  const text = await obj.text();
  let list = [];
  try {
    list = JSON.parse(text);
  } catch (e) {
    console.log("quizzes.json parse error:", String(e));
  }

  // quiz_id -> quiz
  const map = {};
  for (const q of list) {
    if (q && q.quiz_id != null) map[String(q.quiz_id)] = q;
  }

  QUIZ_CACHE = { list, map, total: list.length };
  return QUIZ_CACHE;
}

// ---------------------
// 表示系
// ---------------------
function formatQuizQuestion(q, st, opts = {}) {
  const n = st.current.mode === "review" ? "" : `第${st.answered_total + 1}問`;
  const prefix = st.current.mode === "review" ? "【復習】" : "【歌舞伎クイズ】";
  const remain = st.current.mode === "review" ? `（残り：${st.wrong_ids.length}）` : "";

  const c = q.choices || [];

  // ★LINEはフッターも選択肢テキストも無し（Flexボタンに任せる）
  if (opts?.showFooter === false) {
    return `${prefix}${n}${remain}

${q.question}`;
  }

  // WEB：選択肢＋操作説明（※「7」は見せずに「次へ」と表記）
  return `${prefix}${n}${remain}

${q.question}

1) ${c[0] ?? ""}
2) ${c[1] ?? ""}
3) ${c[2] ?? ""}

━━━━━━━━━━━━
💡 1/2/3で回答してね
次へ：次の問題
8：復習
9：リセット
0：メニュー`;
}

// ---------------------
// 称号（昇進）ロジック
// ---------------------
function getTitleRank(title) {
  const ranks = {
    国宝: 8,
    名人: 7,
    千両役者: 6,
    看板役者: 5,
    二枚目: 4,
    三枚目: 3,
    名題: 2,
    名題下: 1,
  };
  return ranks[title] || 0;
}

function calcTitle(correct, totalQuestions) {
  const total = totalQuestions || 100;
  const p = total > 0 ? correct / total : 0;

  if (p >= 1.0) return "国宝";
  if (p >= 0.9) return "名人";
  if (p >= 0.7) return "千両役者";
  if (p >= 0.5) return "看板役者";
  if (p >= 0.3) return "二枚目";
  if (p >= 0.15) return "三枚目";
  if (p >= 0.05) return "名題";
  return "名題下";
}

function getTitleUpMessage(newTitle) {
  const messages = {
    国宝: `🎊🎊🎊🎊🎊🎊🎊🎊

✨✨ 称号昇格！ ✨✨

【国宝】に到達！！！

完璧だよ！！！
歌舞伎マスターの証🏆

🎊🎊🎊🎊🎊🎊🎊🎊`,

    名人: `🎉🎉🎉🎉🎉🎉

✨ 称号昇格！ ✨

【名人】に昇格！！

素晴らしい！
歌舞伎通の域に達したね🌟

🎉🎉🎉🎉🎉🎉`,

    千両役者: `🎊🎊🎊🎊🎊

✨ 称号昇格！ ✨

【千両役者】に昇格！

すごいよ！
立派な歌舞伎ファンだね👏

🎊🎊🎊🎊🎊`,

    看板役者: `🎉🎉🎉🎉

✨ 称号昇格！ ✨

【看板役者】に昇格！

いい調子！
実力がついてきたね💪

🎉🎉🎉🎉`,

    二枚目: `🎊🎊🎊

✨ 称号昇格！ ✨

【二枚目】に昇格！

順調だよ！
もっと上を目指そう🔥

🎊🎊🎊`,

    三枚目: `🎉🎉

✨ 称号昇格！ ✨

【三枚目】に昇格！

よくやった！
着実に成長してるね📈

🎉🎉`,

    名題: `🎊

✨ 称号昇格！ ✨

【名題】に昇格！

おめでとう！
次の称号を目指そう⭐

🎊`,
  };

  return messages[newTitle] || "";
}

function formatJudgeResult(
  isCorrect,
  correctChoiceText,
  explanation,
  st,
  totalQuestions,
  titleChanged,
  newTitle,
  opts = {}
) {
  const mark = isCorrect ? "✅ 正解！" : "❌ 不正解";

  let result = `${mark}

正解：${correctChoiceText}
${explanation ? `\n${explanation}` : ""}

━━━━━━━━━━━━
📊 ${st.correct_total}/${st.answered_total}問正解（称号：${newTitle}）`;

  if (titleChanged) {
    result += "\n\n" + getTitleUpMessage(newTitle);
  }

  // ★WEBだけヒント表示（LINEはQuick Replyに任せる）
  if (opts?.showFooter !== false) {
    result += `

━━━━━━━━━━━━
つぎ：次へ　メニュー：0`;
  }

  return result;
}

// ---------------------
// LINE用 回答ボタン（Flex Message：大きくて押しやすい）
// ---------------------
function buildAnswerFlex(choices) {
  const c = choices || [];
  return {
    type: "flex",
    altText: "回答してね",
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: { type: "postback", label: `① ${c[0] || ""}`, data: "quiz=1", displayText: "①" },
          },
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: { type: "postback", label: `② ${c[1] || ""}`, data: "quiz=2", displayText: "②" },
          },
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: { type: "postback", label: `③ ${c[2] || ""}`, data: "quiz=3", displayText: "③" },
          },
        ],
      },
    },
  };
}

// ---------------------
// LINE用 ナビ Quick Reply（判定後・状態メッセージ用）
// ---------------------
function buildQuizNavQuickReply(opts = {}) {
  const items = [];
  const addPb = (label, value, displayText) => {
    items.push({
      type: "action",
      action: { type: "postback", label, data: `quiz=${value}`, displayText: displayText || label },
    });
  };

  if (opts.showNext !== false) addPb("次へ", "7", "次へ"); // 内部値は7のまま
  if (opts.showReview !== false) addPb("復習", "8", "復習");
  addPb("メニュー", "0", "メニュー");

  return { items };
}

// ---------------------
// LINE用 クイズ開始選択（つづきから / 最初から）
// ---------------------
function buildResumeQuickReply() {
  return {
    items: [
      { type: "action", action: { type: "postback", label: "つづきから", data: "quiz=7", displayText: "つづきから" } },
      { type: "action", action: { type: "postback", label: "最初から", data: "quiz=9", displayText: "最初から" } },
      { type: "action", action: { type: "postback", label: "メニュー", data: "quiz=0", displayText: "メニュー" } },
    ],
  };
}

// ---------------------
// 次の未回答問題を選ぶ
// ---------------------
function pickNextUnansweredId(list, answeredMap) {
  if (!list || list.length === 0) return null;
  for (const q of list) {
    const id = q?.quiz_id;
    if (id == null) continue;
    if (answeredMap[String(id)] === undefined) return id;
  }
  return null;
}

// ---------------------
// メイン処理
// ---------------------
export async function handleQuizMessage(env, userKey, textRaw, toHalfWidthDigits, opts = {}) {
  const channel = opts?.channel || "web";
  const isLine = channel === "line";

  const text = (textRaw || "").trim();
  const t = toHalfWidthDigits(text).trim();

  const st = await loadQuizState(env, userKey);
  const quizzes = await loadQuizzesFromR2(env);

  // ★ LINE向け：表示上の「7」案内を「次へ」案内へ
  const lineReplace = (txt) => {
    return txt
      .replace(/「7」で1問目を出すね。/g, "下の「はじめる」で1問目を出すね。")
      .replace(/「7」で続けよう。/g, "下の「次へ」で続けよう。")
      .replace(/「7」で出すよ🙂/g, "下の「次へ」で出すよ🙂")
      .replace(/つぎの問題は「7」で進むよ🙂（7を送ってね）/g, "つぎは下の「次へ」で進むよ🙂")
      .replace(/つぎの問題は「7」で進むよ🙂/g, "つぎは下の「次へ」で進むよ🙂")
      .replace(/まず「7」で問題を出すね🙂/g, "まず下の「はじめる」で問題を出すね🙂")
      .replace(/「7」で出し直すね🙂/g, "下の「次へ」で出し直すね🙂")
      .replace(/「7」で通常モードに戻るよ/g, "下の「次へ」で通常モードに戻るよ")
      .replace(/「7」で次へ🙂/g, "下の「次へ」で次へ🙂")
      .replace(/もう一度「7」/g, "もう一度「次へ」")
      .replace(/8：間違えた問題を復習\n9：もう一度挑戦\n0：メニューへ/g, "下のボタンで操作してね🙂");
  };

  // ★ wrap: LINE=オブジェクト、WEB=文字列
  // wrapOpts: { choices: [...], type: "question"|"judge"|"start"|"resume"|"nav" }
  const wrap = (textOut, wrapOpts = {}) => {
    if (!isLine) return textOut;

    const replaced = lineReplace(textOut);
    const wType = wrapOpts.type || "nav";

    // 出題時：本文 + 回答Flex、Quick Replyはメニューだけ
    if (wType === "question" && wrapOpts.choices) {
      return {
        messages: [{ type: "text", text: replaced }, buildAnswerFlex(wrapOpts.choices)],
        quickReply: buildQuizNavQuickReply({ showNext: false, showReview: false }),
      };
    }

    // 判定後：テキスト + Quick Reply（次へ/復習/メニュー）
    if (wType === "judge") {
      return { text: replaced, quickReply: buildQuizNavQuickReply() };
    }

    // リセット・初期状態：テキスト + Quick Reply（はじめる/メニュー）
    if (wType === "start") {
      return {
        text: replaced,
        quickReply: {
          items: [
            { type: "action", action: { type: "postback", label: "はじめる", data: "quiz=7", displayText: "はじめる" } },
            { type: "action", action: { type: "postback", label: "メニュー", data: "quiz=0", displayText: "メニュー" } },
          ],
        },
      };
    }

    // 再開選択：テキスト + Quick Reply（つづきから/最初から/メニュー）
    if (wType === "resume") {
      return { text: replaced, quickReply: buildResumeQuickReply() };
    }

    // その他：テキスト + Quick Reply（次へ/復習/メニュー）
    return { text: replaced, quickReply: buildQuizNavQuickReply() };
  };

  if (!quizzes.total) {
    return wrap("クイズデータが見つからないよ…（R2に quizzes.json があるか確認してね）");
  }

  // ─ リセット
  if (t === "9" || t === "リセット") {
    const fresh = defaultQuizState();
    await saveQuizState(env, userKey, fresh);

    return wrap(
      `🔄 リセット完了

最初からやり直すよ🙂
下の「次へ」（LINEは「はじめる」）を押してね🙂`,
      { type: "start" }
    );
  }

  // ─ 復習開始
  if (t === "8" || t === "復習" || t === "間違い" || t === "やり直し" || t === "間違いだけ") {
    if (st.wrong_ids.length === 0) {
      st.current.mode = "normal";
      st.current.quiz_id = null;
      st.phase = "awaiting_answer";
      await saveQuizState(env, userKey, st);
      return wrap(
        `✨ 間違いなし！

いまのところ全問正解だよ🙂
下の「次へ」で続けよう。`
      );
    }

    st.current.mode = "review";
    st.current.quiz_id = null;
    st.phase = "awaiting_answer";
    await saveQuizState(env, userKey, st);

    return wrap(
      `🔄 復習モード開始

間違えた問題：${st.wrong_ids.length}問
下の「次へ」を押してね🙂`
    );
  }

  // ─ 回答（1/2/3）
  if (t === "1" || t === "2" || t === "3") {
    // ★根本解決：判定直後(need_next)は回答を受け付けない
    if (st.phase === "need_next") {
      return wrap("下の「次へ」を押してね🙂");
    }

    const choiceIndex = Number(t) - 1;
    const quizId = st.current.quiz_id;

    if (quizId == null) return wrap("まず下の「次へ」で問題を出すね🙂");

    const q = quizzes.map[String(quizId)];
    if (!q) {
      st.current.quiz_id = null;
      st.phase = "awaiting_answer";
      await saveQuizState(env, userKey, st);
      return wrap("問題データが見つからなかった…下の「次へ」で出し直すね🙂");
    }

    const answerIndex = Number(q.answer_index);
    const isCorrect = choiceIndex === answerIndex;
    const correctChoiceText = q.choices?.[answerIndex] ?? "(不明)";

    const alreadyAnswered = st.answered[String(quizId)] !== undefined;

    // 昇格判定用（更新前の称号）
    const oldTitle = st.last_title || calcTitle(st.correct_total, quizzes.total);

    // --- スコア更新 ---
    if (st.current.mode === "normal") {
      if (!alreadyAnswered) {
        st.answered_total += 1;
        if (isCorrect) st.correct_total += 1;
      }
      st.answered[String(quizId)] = isCorrect;

      if (!isCorrect && !st.wrong_ids.includes(quizId)) {
        st.wrong_ids.push(quizId);
      }
    } else {
      // 復習モード：正解なら wrong から外す
      if (isCorrect) st.wrong_ids = st.wrong_ids.filter((id) => id !== quizId);
    }

    // 更新後の称号
    const newTitle = calcTitle(st.correct_total, quizzes.total);
    const titleChanged = getTitleRank(newTitle) > getTitleRank(oldTitle);
    st.last_title = newTitle;

    // ★回答後：次は「次へ」(=7) で出す
    st.current.quiz_id = null;

    // 復習が終わったら通常に戻す（次は7で通常出題）
    if (st.current.mode === "review" && st.wrong_ids.length === 0) {
      st.current.mode = "normal";
    }

    // ★判定直後フェーズへ（ここが根本解決）
    st.phase = "need_next";

    await saveQuizState(env, userKey, st);

    const judgeText = formatJudgeResult(
      isCorrect,
      correctChoiceText,
      q.explanation || "",
      st,
      quizzes.total,
      titleChanged,
      newTitle,
      { showFooter: !isLine }
    );

    return wrap(judgeText, { type: "judge" });
  }

  // ─ 出題（次へ=7）
  if (t === "7" || t === "次" || t === "次へ" || t.toLowerCase() === "next" || t === "n") {
    // 次へを押したら次に進めるので phase を戻す
    st.phase = "awaiting_answer";

    // 復習モード
    if (st.current.mode === "review") {
      if (st.wrong_ids.length === 0) {
        st.current.mode = "normal";
        st.current.quiz_id = null;
        await saveQuizState(env, userKey, st);
        return wrap(
          `✨ 復習完了！

間違えた問題を全部クリアしたね🙂
下の「次へ」で通常モードに戻るよ`
        );
      }

      // wrong_ids の先頭を出す
      const quizId = st.wrong_ids[0];
      const q = quizzes.map[String(quizId)];
      if (!q) {
        // ないIDは捨てて次へ
        st.wrong_ids = st.wrong_ids.slice(1);
        st.current.quiz_id = null;
        await saveQuizState(env, userKey, st);
        return wrap("復習データが見つからなかった…下の「次へ」で次へ🙂");
      }

      st.current.quiz_id = q.quiz_id;
      await saveQuizState(env, userKey, st);

      const qText = formatQuizQuestion(q, st, { showFooter: !isLine });
      return wrap(qText, { type: "question", choices: q.choices });
    }

    // 通常モード
    const nextId = pickNextUnansweredId(quizzes.list, st.answered);
    if (nextId == null) {
      const title = calcTitle(st.correct_total, quizzes.total);
      const denom = Math.max(st.answered_total, 1);
      const rate = Math.round((st.correct_total / denom) * 100);

      st.current.quiz_id = null;
      st.phase = "awaiting_answer";
      await saveQuizState(env, userKey, st);

      return wrap(
        `🎉 全${quizzes.total}問クリア！

最終成績：${st.correct_total}/${st.answered_total}問正解（${rate}%）
称号：【${title}】

━━━━━━━━━━━━
8：間違えた問題を復習
9：もう一度挑戦
0：メニューへ`
      );
    }

    const q = quizzes.map[String(nextId)];
    if (!q) {
      // 詰まり回避
      st.answered[String(nextId)] = false;
      st.current.quiz_id = null;
      await saveQuizState(env, userKey, st);
      return wrap("問題データの参照に失敗したよ…つぎに進むね🙂（もう一度「次へ」）");
    }

    st.current.mode = "normal";
    st.current.quiz_id = q.quiz_id;
    await saveQuizState(env, userKey, st);

    const qText = formatQuizQuestion(q, st, { showFooter: !isLine });
    return wrap(qText, { type: "question", choices: q.choices });
  }

  // ─ その他
  return wrap(
    `💡 使い方

次へ：問題を出す
1/2/3：回答
8：復習
9：リセット
0：メニュー`
  );
}
