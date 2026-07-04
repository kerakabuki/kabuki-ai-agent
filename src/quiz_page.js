// src/quiz_page.js
// =========================================================
// クイズページ — /quiz
// localStorage でスコア管理、API からクイズデータ取得
// 10ステージ固定制 + 1日10問制限（グローバル）
// =========================================================
import { pageShell } from "./web_layout.js";
import { t, langPrefix } from "./i18n.js";

export function quizPageHTML({ lang = "ja" } = {}) {
  const isEn = lang === "en";
  const lp = langPrefix(lang);

  // UI strings
  const UI = isEn ? {
    breadcrumb_top: "Top", breadcrumb_dojo: "KABUKI DOJO", breadcrumb_quiz: "Kabuki Quiz",
    loading: "Loading quiz data...", load_error: "Failed to load quiz data.",
    hero_title: "Kabuki Quiz", hero_sub: "Clear 10 stages and earn promotions!",
    title_label: "Rank", stages_cleared: " Stages Cleared",
    daily_done: "Today's 10 questions are done! Come back tomorrow.",
    daily_pre: "", daily_remain: " questions left today",
    accuracy: "Accuracy", correct_label: "correct", review_label: "Review",
    challenge: "Challenge", daily_limit: "Daily limit reached",
    accuracy_low: "Accuracy too low (review to improve)",
    review_btn: "Review", back_menu: "Back to Menu", back_dojo: "← KABUKI DOJO",
    reset: "Reset", reset_confirm: "Reset all quiz progress?",
    q_review: "Review", q_stage: "Stage", q_remaining: "remaining",
    q_of: "/", correct_ans: "Correct!", wrong_ans: "Wrong...",
    next: "Next →", see_result: "See Results →",
    stage_clear: " Clear!", all_clear: "All stages complete! Congratulations!",
    you_are: "You are ", promoted: "Promoted! ", unlocked: " is now unlocked!",
    accuracy_score: "Accuracy ", rank_label: "Rank: ",
    next_stage: "Next Stage →", daily_done_stage: "Done for today! Continue tomorrow.",
    stage_done: " Complete", need70: "Need 70%+ accuracy to advance (currently ",
    review_improve: "Review to improve your score!",
    review_complete: "Review complete! All mistakes corrected.",
    cleared70: " accuracy is now 70%+!",
    review_again: "Review Again",
    title: "Kabuki Quiz", subtitle: "Learn kabuki through fun trivia!",
    stage_names: ["Act I","Act II","Act III","Act IV","Act V","Act VI","Act VII","Act VIII","Act IX","Act X"],
    title_ranks: ["Apprentice","Supporting","Comic","Romantic Lead","Rising Star","Billboard Star","Marquee Star","Troupe Leader","Master","Living Treasure","World Heritage"],
  } : {
    breadcrumb_top: "トップ", breadcrumb_dojo: "KABUKI DOJO", breadcrumb_quiz: "歌舞伎クイズ",
    loading: "クイズデータを読み込み中…", load_error: "クイズデータの読み込みに失敗しました。",
    hero_title: "歌舞伎クイズ", hero_sub: "10ステージをクリアして昇進しよう",
    title_label: "称号", stages_cleared: " ステージクリア",
    daily_done: "今日の10問は終了！明日また挑戦しよう",
    daily_pre: "今日あと", daily_remain: "問",
    accuracy: "正答率", correct_label: "正解", review_label: "復習",
    challenge: "挑戦する", daily_limit: "今日の分は終了",
    accuracy_low: "正答率不足（復習しよう）",
    review_btn: "復習", back_menu: "メニューに戻る", back_dojo: "← KABUKI DOJO",
    reset: "リセット", reset_confirm: "クイズの記録をリセットしますか？",
    q_review: "【復習】", q_stage: "【", q_remaining: "残り",
    q_of: "/", correct_ans: "正解！", wrong_ans: "不正解…",
    next: "次の問題 →", see_result: "結果を見る →",
    stage_clear: " クリア！", all_clear: "全ステージ制覇！おめでとう！",
    you_are: "あなたは「", promoted: "昇進！「", unlocked: " が解放されました！",
    accuracy_score: "正答率 ", rank_label: "称号：",
    next_stage: "次のステージへ →", daily_done_stage: "今日の分は終了！明日から次のステージに挑戦しよう",
    stage_done: " 終了", need70: "正答率70%以上で次へ進めます（現在 ",
    review_improve: "復習で正答率を上げよう！",
    review_complete: "復習完了！間違いをすべて復習したよ",
    cleared70: " の正答率が70%以上になりました！",
    review_again: "もう一度復習",
    title: "歌舞伎クイズ", subtitle: "三択クイズで楽しく学ぼう",
    stage_names: ["第一幕","第二幕","第三幕","第四幕","第五幕","第六幕","第七幕","第八幕","第九幕","第十幕"],
    title_ranks: ["見習い","名題下","三枚目","二枚目","花形","看板役者","千両役者","座頭","名人","人間国宝","世界遺産"],
  };

  const bodyHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="${lp}/">${UI.breadcrumb_top}</a><span>›</span><a href="${lp}/kabuki/dojo">${UI.breadcrumb_dojo}</a><span>›</span>${UI.breadcrumb_quiz}
    </nav>
    <div id="app">
      <div class="loading">${UI.loading}</div>
    </div>

    <script>
    (function(){
      var app = document.getElementById("app");
      var quizList = [];
      var quizMap = {};
      var UI = ${JSON.stringify(UI)};
      var LP = ${JSON.stringify(lp)};

      // ── 定数 ──
      var STAGE_COUNT = 10;
      var DAILY_LIMIT = 10;
      var STAGE_NAMES = UI.stage_names;
      var TITLE_RANKS = UI.title_ranks;
      var LEVEL_ORDER = { beginner: 0, intermediate: 1, advanced: 2 };

      // ── ローカルステート ──
      var STATE_KEY = "keranosuke_quiz_state";
      var state = loadState();

      function loadState() {
        try {
          var raw = localStorage.getItem(STATE_KEY);
          if (raw) return JSON.parse(raw);
        } catch(e){}
        return defaultState();
      }
      function defaultState() {
        var stages = {};
        for (var i = 0; i < STAGE_COUNT; i++) {
          stages[i] = { answered: {}, wrong_ids: [] };
        }
        return {
          version: 3,
          stages: stages,
          daily: { date: "", count: 0 },
          current_stage: null,
          current_id: null,
          mode: "normal",
          phase: "idle"
        };
      }
      function saveState() {
        try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch(e){}
      }

      // ── V1/V2 → V3 マイグレーション ──
      function migrateToV3(old) {
        var ns = defaultState();
        if (!old) return ns;
        var allAnswered = {};
        var allWrong = [];
        if (old.version === 2 && old.levels) {
          var lvls = ["beginner", "intermediate", "advanced"];
          for (var li = 0; li < lvls.length; li++) {
            var ld = old.levels[lvls[li]];
            if (!ld) continue;
            if (ld.answered) {
              var akeys = Object.keys(ld.answered);
              for (var a = 0; a < akeys.length; a++) {
                allAnswered[akeys[a]] = ld.answered[akeys[a]];
              }
            }
            if (ld.wrong_ids) {
              for (var w = 0; w < ld.wrong_ids.length; w++) {
                if (allWrong.indexOf(ld.wrong_ids[w]) < 0) {
                  allWrong.push(ld.wrong_ids[w]);
                }
              }
            }
          }
        } else if (old.answered) {
          allAnswered = old.answered;
          allWrong = old.wrong_ids || [];
        }
        var answeredKeys = Object.keys(allAnswered);
        for (var i = 0; i < answeredKeys.length; i++) {
          var qid = answeredKeys[i];
          var stageIdx = getQuizStageIndex(qid);
          if (stageIdx < 0) continue;
          ns.stages[stageIdx].answered[qid] = allAnswered[qid];
        }
        for (var j = 0; j < allWrong.length; j++) {
          var wid = String(allWrong[j]);
          var wStage = getQuizStageIndex(wid);
          if (wStage < 0) continue;
          if (ns.stages[wStage].wrong_ids.indexOf(allWrong[j]) < 0) {
            ns.stages[wStage].wrong_ids.push(allWrong[j]);
          }
        }
        if (old.daily && old.daily.date) {
          var totalCount = 0;
          if (old.daily.counts) {
            var ckeys = Object.keys(old.daily.counts);
            for (var c = 0; c < ckeys.length; c++) {
              totalCount += old.daily.counts[ckeys[c]] || 0;
            }
          } else if (typeof old.daily.count === "number") {
            totalCount = old.daily.count;
          }
          ns.daily = { date: old.daily.date, count: totalCount };
        }
        return ns;
      }

      var _sortedQuizzes = null;
      function getAllQuizzesSorted() {
        if (_sortedQuizzes) return _sortedQuizzes;
        _sortedQuizzes = quizList.slice().sort(function(a, b) {
          var la = LEVEL_ORDER[a.level] || 0;
          var lb = LEVEL_ORDER[b.level] || 0;
          if (la !== lb) return la - lb;
          return Number(a.quiz_id) - Number(b.quiz_id);
        });
        return _sortedQuizzes;
      }

      function getStageQuizzes(idx) {
        var all = getAllQuizzesSorted();
        var total = all.length;
        var base = Math.floor(total / STAGE_COUNT);
        var extra = total % STAGE_COUNT;
        var start = 0;
        for (var i = 0; i < idx; i++) {
          start += (i < extra) ? base + 1 : base;
        }
        var size = (idx < extra) ? base + 1 : base;
        return all.slice(start, start + size);
      }

      function getQuizStageIndex(quizId) {
        var all = getAllQuizzesSorted();
        var qidStr = String(quizId);
        var pos = -1;
        for (var i = 0; i < all.length; i++) {
          if (String(all[i].quiz_id) === qidStr) { pos = i; break; }
        }
        if (pos < 0) return -1;
        var total = all.length;
        var base = Math.floor(total / STAGE_COUNT);
        var extra = total % STAGE_COUNT;
        var cumul = 0;
        for (var s = 0; s < STAGE_COUNT; s++) {
          var size = (s < extra) ? base + 1 : base;
          if (pos < cumul + size) return s;
          cumul += size;
        }
        return STAGE_COUNT - 1;
      }

      function getStageStats(idx) {
        var quizzes = getStageQuizzes(idx);
        var sd = state.stages[idx] || { answered: {}, wrong_ids: [] };
        var answeredCount = 0, correctCount = 0;
        for (var i = 0; i < quizzes.length; i++) {
          var qid = String(quizzes[i].quiz_id);
          if (sd.answered[qid] !== undefined) {
            answeredCount++;
            if (sd.answered[qid] === true) correctCount++;
          }
        }
        var total = quizzes.length;
        var remaining = total - answeredCount;
        var rate = answeredCount > 0 ? correctCount / answeredCount : 0;
        var cleared = remaining <= 0 && answeredCount > 0 && rate >= 0.7;
        return {
          answered: answeredCount, correct: correctCount, total: total,
          remaining: remaining < 0 ? 0 : remaining, rate: rate, cleared: cleared,
          wrong_count: (sd.wrong_ids || []).length
        };
      }

      function isStageUnlocked(idx) {
        if (idx === 0) return true;
        return getStageStats(idx - 1).cleared;
      }
      function getCurrentStage() {
        for (var i = 0; i < STAGE_COUNT; i++) {
          if (!getStageStats(i).cleared) return i;
        }
        return STAGE_COUNT;
      }
      function getClearedCount() {
        for (var i = 0; i < STAGE_COUNT; i++) {
          if (!getStageStats(i).cleared) return i;
        }
        return STAGE_COUNT;
      }
      function getTitle() { return TITLE_RANKS[getClearedCount()]; }

      function addQuizXP() {
        try {
          var LOG_KEY = "keranosuke_log_v1";
          var raw = localStorage.getItem(LOG_KEY);
          var log = raw ? JSON.parse(raw) : {};
          if (typeof log.xp !== 'number') log.xp = 0;
          log.xp += 3;
          var today = new Date();
          var todayKey = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
          if (!log.daily_log) log.daily_log = {};
          if (!log.daily_log[todayKey]) log.daily_log[todayKey] = { views:0, clips:0, quiz:0, keiko:0, theater:0 };
          log.daily_log[todayKey].quiz++;
          log.updated_at = Math.floor(Date.now()/1000);
          localStorage.setItem(LOG_KEY, JSON.stringify(log));
        } catch(e){}
      }

      function ensureDailyReset() {
        var today = new Date();
        var todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
        if (!state.daily || state.daily.date !== todayStr) {
          state.daily = { date: todayStr, count: 0 };
          saveState();
        }
      }
      function getDailyRemaining() { ensureDailyReset(); return DAILY_LIMIT - (state.daily.count || 0); }
      function incrementDaily() { ensureDailyReset(); state.daily.count = (state.daily.count || 0) + 1; saveState(); }

      // ── データ読み込み ──
      fetch("/api/quiz?lang=${lang}")
        .then(function(r){ return r.json(); })
        .then(function(data){
          if (Array.isArray(data)) { quizList = data; }
          else if (data && Array.isArray(data.list)) { quizList = data.list; }
          else { quizList = []; }
          quizList.forEach(function(q){
            if (q && q.quiz_id != null) quizMap[String(q.quiz_id)] = q;
            if (!q.level) q.level = "beginner";
          });
          _sortedQuizzes = null;
          getAllQuizzesSorted();
          if (!state.version || state.version < 3) {
            state = migrateToV3(state);
            saveState();
          }
          ensureDailyReset();
          showStageSelect();
        })
        .catch(function(){
          app.innerHTML = '<div class="empty-state">' + UI.load_error + '</div>';
        });

      function showStageSelect() {
        var title = getTitle();
        var cleared = getClearedCount();
        var dailyRem = getDailyRemaining();
        var currentStage = getCurrentStage();

        var html = '<div class="quiz-menu fade-up">';
        html += '<div class="quiz-hero">';
        html += '<div class="quiz-hero-icon">👺</div>';
        html += '<h2 class="quiz-hero-title">' + UI.hero_title + '</h2>';
        html += '<p class="quiz-hero-sub">' + UI.hero_sub + '</p>';
        html += '</div>';

        html += '<div class="quiz-overall-title">';
        html += '<span class="quiz-overall-label">' + UI.title_label + '</span>';
        html += '<span class="quiz-overall-name">' + esc(title) + '</span>';
        html += '</div>';

        var overallPct = Math.round((cleared / STAGE_COUNT) * 100);
        html += '<div class="quiz-overall-progress">';
        html += '<div class="quiz-progress-bar"><div class="quiz-progress-fill' + (cleared === STAGE_COUNT ? ' fill-cleared' : '') + '" style="width:' + overallPct + '%"></div></div>';
        html += '<span class="quiz-progress-text">' + cleared + '/' + STAGE_COUNT + UI.stages_cleared + '</span>';
        html += '</div>';

        if (dailyRem <= 0) {
          html += '<div class="quiz-daily-done" style="text-align:center;margin-bottom:1rem;">' + UI.daily_done + '</div>';
        } else {
          html += '<div class="quiz-daily-info" style="text-align:center;margin-bottom:1rem;">' + UI.daily_pre + dailyRem + UI.daily_remain + '</div>';
        }

        html += '<div class="quiz-stage-list">';
        for (var si = 0; si < STAGE_COUNT; si++) {
          var sst = getStageStats(si);
          var unlocked = isStageUnlocked(si);
          var isCleared = sst.cleared;
          var isCurrent = (si === currentStage && !isCleared);
          var itemClass = 'quiz-stage-item';
          if (isCleared) itemClass += ' cleared';
          else if (isCurrent) itemClass += ' current';
          else if (!unlocked) itemClass += ' locked';

          html += '<div class="' + itemClass + '">';
          html += '<div class="quiz-stage-header" onclick="toggleStage(' + si + ')">';
          html += '<span class="quiz-stage-num">' + (si + 1) + '</span>';
          html += '<span class="quiz-stage-name">' + STAGE_NAMES[si] + '</span>';
          if (isCleared) {
            html += '<span class="quiz-stage-badge cleared-badge">CLEAR</span>';
          } else if (!unlocked) {
            html += '<span class="quiz-stage-badge locked-badge">🔒</span>';
          } else {
            html += '<span class="quiz-stage-badge current-badge">' + sst.answered + '/' + sst.total + '</span>';
          }
          html += '</div>';

          if (isCurrent && unlocked) {
            html += '<div class="quiz-stage-body">';
            var stagePct = sst.total > 0 ? Math.round((sst.answered / sst.total) * 100) : 0;
            html += '<div class="quiz-level-progress">';
            html += '<div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:' + stagePct + '%"></div></div>';
            html += '<span class="quiz-progress-text">' + sst.answered + '/' + sst.total + '</span>';
            html += '</div>';
            if (sst.answered > 0) {
              var sratePct = Math.round(sst.rate * 100);
              html += '<div class="quiz-level-detail">' + UI.accuracy + ' ' + sratePct + '%（' + sst.correct + '/' + sst.answered + ' ' + UI.correct_label + '）';
              if (sst.wrong_count > 0) html += '　' + UI.review_label + ' ' + sst.wrong_count;
              html += '</div>';
            }
            html += '<div class="quiz-level-actions">';
            if (sst.remaining > 0 && dailyRem > 0) {
              html += '<button class="btn btn-primary quiz-level-btn" onclick="startStage(' + si + ',\\'normal\\')">' + UI.challenge + '</button>';
            } else if (sst.remaining > 0 && dailyRem <= 0) {
              html += '<button class="btn btn-primary quiz-level-btn" disabled>' + UI.daily_limit + '</button>';
            } else if (sst.remaining === 0 && !isCleared) {
              html += '<button class="btn btn-primary quiz-level-btn" disabled>' + UI.accuracy_low + '</button>';
            }
            if (sst.wrong_count > 0) {
              html += '<button class="btn btn-secondary quiz-level-btn" onclick="startStage(' + si + ',\\'review\\')">' + UI.review_btn + '（' + sst.wrong_count + '）</button>';
            }
            html += '</div></div>';
          } else if (isCleared) {
            html += '<div class="quiz-stage-body collapsed" id="stage-body-' + si + '">';
            var cRatePct = Math.round(sst.rate * 100);
            html += '<div class="quiz-level-detail">' + UI.accuracy + ' ' + cRatePct + '%（' + sst.correct + '/' + sst.total + ' ' + UI.correct_label + '）';
            if (sst.wrong_count > 0) html += '　' + UI.review_label + ' ' + sst.wrong_count;
            html += '</div>';
            html += '<div class="quiz-level-actions">';
            if (sst.wrong_count > 0) {
              html += '<button class="btn btn-secondary quiz-level-btn" onclick="startStage(' + si + ',\\'review\\')">' + UI.review_btn + '（' + sst.wrong_count + '）</button>';
            }
            html += '</div></div>';
          }
          html += '</div>';
        }
        html += '</div>';

        html += '<div class="quiz-menu-footer">';
        var anyAnswered = false;
        for (var fi = 0; fi < STAGE_COUNT; fi++) {
          if (getStageStats(fi).answered > 0) { anyAnswered = true; break; }
        }
        if (anyAnswered) {
          html += '<button class="btn btn-secondary quiz-btn" onclick="resetQuiz()">' + UI.reset + '</button>';
        }
        html += '<a href="' + LP + '/kabuki/dojo" class="btn btn-secondary quiz-btn" style="display:inline-block;text-align:center;text-decoration:none;">' + UI.back_dojo + '</a>';
        html += '</div></div>';
        app.innerHTML = html;
      }

      window.toggleStage = function(idx) {
        var body = document.getElementById("stage-body-" + idx);
        if (body) body.classList.toggle("collapsed");
      };

      window.startStage = function(stageIdx, mode) {
        state.current_stage = stageIdx;
        state.mode = mode;
        state.current_id = null;
        state.phase = "question";
        saveState();
        nextQuestion();
      };

      function nextQuestion() {
        var idx = state.current_stage;
        var sd = state.stages[idx];
        if (state.mode === "review") {
          if (sd.wrong_ids.length === 0) {
            state.phase = "idle"; saveState();
            showComplete(UI.review_complete);
            return;
          }
          var qid = sd.wrong_ids[0];
          state.current_id = qid; saveState();
          showQuestion(quizMap[String(qid)]);
          return;
        }
        if (state.current_id != null) {
          var sst = getStageStats(idx);
          if (sst.remaining === 0) {
            state.current_id = null; state.phase = "idle"; saveState();
            showStageComplete(idx);
            return;
          }
        }
        ensureDailyReset();
        if (getDailyRemaining() <= 0) {
          state.phase = "idle"; saveState();
          showDailyComplete();
          return;
        }
        var stageQuizzes = getStageQuizzes(idx);
        var unanswered = stageQuizzes.filter(function(q){ return sd.answered[String(q.quiz_id)] === undefined; });
        if (unanswered.length === 0) {
          state.phase = "idle"; saveState();
          showStageComplete(idx);
          return;
        }
        var pick = unanswered[Math.floor(Math.random() * unanswered.length)];
        state.current_id = pick.quiz_id; saveState();
        showQuestion(quizMap[String(pick.quiz_id)]);
      }

      function showQuestion(q) {
        if (!q) { showStageSelect(); return; }
        var idx = state.current_stage;
        var sd = state.stages[idx];
        var sst = getStageStats(idx);
        var stageName = STAGE_NAMES[idx];
        var numLabel;
        if (state.mode === "review") {
          numLabel = UI.q_review + stageName + '（' + UI.q_remaining + sd.wrong_ids.length + '）';
        } else {
          numLabel = ${isEn ? "'Stage ' + (idx+1) + ': ' + (sst.answered + 1) + '/' + sst.total" : "UI.q_stage + stageName + '】' + (sst.answered + 1) + '/' + sst.total + '問目'"};
        }
        var html = '<div class="quiz-question fade-up">';
        html += '<div class="quiz-q-header"><span class="quiz-q-mode">' + numLabel + '</span></div>';
        html += '<h2 class="quiz-q-text">' + esc(q.question) + '</h2>';
        html += '<div class="quiz-choices">';
        var labels = ["①", "②", "③"];
        (q.choices || []).forEach(function(c, i) {
          html += '<button class="quiz-choice" onclick="answer(\\'' + q.quiz_id + '\\',' + i + ')">';
          html += '<span class="quiz-choice-label">' + labels[i] + '</span>';
          html += '<span class="quiz-choice-text">' + esc(c) + '</span>';
          html += '</button>';
        });
        html += '</div></div>';
        html += '<div style="margin-top:1rem;text-align:center;">';
        html += '<button class="btn btn-secondary" onclick="backToMenu()">' + UI.back_menu + '</button>';
        html += '</div>';
        app.innerHTML = html;
      }

      window.answer = function(qid, choice) {
        var q = quizMap[String(qid)];
        if (!q) return;
        var correct = q.answer_index != null ? q.answer_index : (q.correct != null ? q.correct : q.answer);
        var isCorrect = (Number(choice) === Number(correct));
        var idx = state.current_stage;
        var sd = state.stages[idx];
        if (state.mode !== "review") {
          sd.answered[String(qid)] = isCorrect;
          incrementDaily();
          if (isCorrect) addQuizXP();
          if (!isCorrect && sd.wrong_ids.indexOf(qid) < 0) sd.wrong_ids.push(qid);
          if (isCorrect) sd.wrong_ids = sd.wrong_ids.filter(function(id){ return id !== qid; });
        } else {
          if (isCorrect) {
            sd.wrong_ids = sd.wrong_ids.filter(function(id){ return id !== qid; });
            sd.answered[String(qid)] = true;
            addQuizXP();
          }
        }
        saveState();
        showResult(q, choice, isCorrect);
      };

      function showResult(q, choice, isCorrect) {
        var idx = state.current_stage;
        var sst = getStageStats(idx);
        var stageName = STAGE_NAMES[idx];
        var correctIdx = q.answer_index != null ? q.answer_index : ((q.correct || q.answer) - 1);
        var headerLabel = state.mode === "review" ? "" : stageName + " " + sst.answered + "/" + sst.total;

        var html = '<div class="quiz-result fade-up">';
        if (headerLabel) html += '<div class="quiz-batch-info" style="text-align:center;margin-bottom:0.5rem;">' + headerLabel + '</div>';
        html += isCorrect
          ? '<div class="quiz-result-icon correct">⭕</div><h2 class="quiz-result-text correct-text">' + UI.correct_ans + '</h2>'
          : '<div class="quiz-result-icon wrong">❌</div><h2 class="quiz-result-text wrong-text">' + UI.wrong_ans + '</h2>';
        html += '<div class="quiz-result-q">' + esc(q.question) + '</div>';
        var labels = ["①", "②", "③"];
        html += '<div class="quiz-result-choices">';
        (q.choices || []).forEach(function(c, i) {
          var cls = "quiz-result-choice";
          if (i === correctIdx) cls += " result-correct";
          else if (i === choice && !isCorrect) cls += " result-wrong";
          html += '<div class="' + cls + '">' + labels[i] + ' ' + esc(c) + '</div>';
        });
        html += '</div>';
        if (q.explanation) html += '<div class="quiz-explanation">' + esc(q.explanation) + '</div>';
        var ratePct = sst.answered > 0 ? Math.round(sst.rate * 100) : 0;
        html += '<div class="quiz-mini-score">';
        html += stageName + '：' + sst.correct + '/' + sst.answered + ' ' + UI.correct_label + '（' + ratePct + '%）';
        html += '　' + UI.rank_label + esc(getTitle());
        html += '</div></div>';

        html += '<div class="quiz-result-actions">';
        if (state.mode === "review") {
          html += '<button class="btn btn-primary" onclick="nextQuestion()">' + UI.next + '</button>';
        } else {
          var dailyRem = getDailyRemaining();
          if (sst.remaining <= 0) {
            html += '<button class="btn btn-primary" onclick="nextQuestion()">' + UI.see_result + '</button>';
          } else if (dailyRem <= 0) {
            html += '<button class="btn btn-primary" onclick="nextQuestion()">' + UI.daily_limit + '</button>';
          } else {
            html += '<button class="btn btn-primary" onclick="nextQuestion()">' + UI.next + '</button>';
          }
        }
        html += '<button class="btn btn-secondary" onclick="backToMenu()">' + UI.back_menu + '</button>';
        html += '</div>';
        app.innerHTML = html;
      }

      function showStageComplete(stageIdx) {
        var sst = getStageStats(stageIdx);
        var ratePct = Math.round(sst.rate * 100);
        var title = getTitle();
        var cleared = sst.cleared;
        var stageName = STAGE_NAMES[stageIdx];
        var dailyRem = getDailyRemaining();
        var isLast = stageIdx >= STAGE_COUNT - 1;
        var allCleared = getClearedCount() === STAGE_COUNT;

        var html = '<div class="quiz-complete fade-up">';
        if (cleared) {
          html += '<div class="quiz-hero-icon">🎊</div>';
          html += '<h2 class="quiz-complete-msg">' + stageName + UI.stage_clear + '</h2>';
          if (allCleared) {
            html += '<div class="quiz-unlock-msg">' + UI.all_clear + (${isEn} ? UI.you_are + esc(title) + '!' : UI.you_are + esc(title) + '」です！') + '</div>';
          } else {
            var newTitle = getTitle();
            var prevTitle = TITLE_RANKS[getClearedCount() - 1];
            if (prevTitle !== newTitle) {
              html += '<div class="quiz-unlock-msg">' + (${isEn} ? UI.promoted + esc(prevTitle) + ' → ' + esc(newTitle) : UI.promoted + esc(prevTitle) + '」→「' + esc(newTitle) + '」') + '</div>';
            }
            html += '<div class="quiz-unlock-msg" style="background:rgba(33,150,243,0.1);color:#1976D2;">' + STAGE_NAMES[stageIdx + 1] + UI.unlocked + '</div>';
          }
          html += '<div class="quiz-mini-score">' + UI.accuracy_score + ratePct + '%（' + sst.correct + '/' + sst.answered + ' ' + UI.correct_label + '）　' + UI.rank_label + esc(title) + '</div>';
          html += '<div class="quiz-complete-actions">';
          if (!allCleared && dailyRem > 0) {
            html += '<button class="btn btn-primary" onclick="startStage(' + (stageIdx + 1) + ',\\'normal\\')">' + UI.next_stage + '</button>';
          } else if (!allCleared && dailyRem <= 0) {
            html += '<div class="quiz-daily-done">' + UI.daily_done_stage + '</div>';
          }
        } else {
          html += '<div class="quiz-hero-icon">📝</div>';
          html += '<h2 class="quiz-complete-msg">' + stageName + UI.stage_done + '</h2>';
          html += '<div class="quiz-retry-msg">' + UI.need70 + ratePct + '%）<br>' + UI.review_improve + '</div>';
          html += '<div class="quiz-mini-score">' + sst.correct + '/' + sst.answered + ' ' + UI.correct_label + '（' + ratePct + '%）　' + UI.rank_label + esc(title) + '</div>';
          html += '<div class="quiz-complete-actions">';
        }
        if (sst.wrong_count > 0) {
          html += '<button class="btn btn-primary" onclick="startStage(' + stageIdx + ',\\'review\\')">' + UI.review_btn + '（' + sst.wrong_count + '）</button>';
        }
        html += '<button class="btn btn-secondary" onclick="backToMenu()">' + UI.back_menu + '</button>';
        html += '<a href="' + LP + '/kabuki/dojo" class="btn btn-secondary" style="display:inline-block;text-align:center;text-decoration:none;">' + UI.back_dojo + '</a>';
        html += '</div></div>';
        app.innerHTML = html;
      }

      function showDailyComplete() {
        var title = getTitle();
        var html = '<div class="quiz-complete fade-up">';
        html += '<div class="quiz-hero-icon">🌙</div>';
        html += '<h2 class="quiz-complete-msg">' + UI.daily_done + '</h2>';
        html += '<div class="quiz-mini-score">' + UI.rank_label + esc(title) + '</div>';
        html += '<div class="quiz-complete-actions">';
        var reviewStage = -1;
        for (var i = 0; i < STAGE_COUNT; i++) {
          if (getStageStats(i).wrong_count > 0 && isStageUnlocked(i)) { reviewStage = i; break; }
        }
        if (reviewStage >= 0) {
          html += '<button class="btn btn-primary" onclick="startStage(' + reviewStage + ',\\'review\\')">' + UI.review_btn + '</button>';
        }
        html += '<button class="btn btn-secondary" onclick="backToMenu()">' + UI.back_menu + '</button>';
        html += '<a href="' + LP + '/kabuki/dojo" class="btn btn-secondary" style="display:inline-block;text-align:center;text-decoration:none;">' + UI.back_dojo + '</a>';
        html += '</div></div>';
        app.innerHTML = html;
      }

      function showComplete(msg) {
        var idx = state.current_stage;
        var sst = getStageStats(idx);
        var ratePct = sst.answered > 0 ? Math.round(sst.rate * 100) : 0;
        var title = getTitle();
        var stageName = STAGE_NAMES[idx];
        var html = '<div class="quiz-complete fade-up">';
        html += '<div class="quiz-hero-icon">🎊</div>';
        html += '<h2 class="quiz-complete-msg">' + esc(msg) + '</h2>';
        if (sst.cleared) {
          html += '<div class="quiz-unlock-msg">' + stageName + UI.cleared70 + '</div>';
        }
        html += '<div class="quiz-mini-score">' + sst.correct + '/' + sst.answered + ' ' + UI.correct_label + '（' + ratePct + '%）　' + UI.rank_label + esc(title) + '</div>';
        html += '<div class="quiz-complete-actions">';
        if (sst.wrong_count > 0) {
          html += '<button class="btn btn-primary" onclick="startStage(' + idx + ',\\'review\\')">' + UI.review_again + '（' + sst.wrong_count + '）</button>';
        }
        html += '<button class="btn btn-secondary" onclick="backToMenu()">' + UI.back_menu + '</button>';
        html += '<a href="' + LP + '/kabuki/dojo" class="btn btn-secondary" style="display:inline-block;text-align:center;text-decoration:none;">' + UI.back_dojo + '</a>';
        html += '</div></div>';
        app.innerHTML = html;
      }

      window.resetQuiz = function() {
        if (!confirm(UI.reset_confirm)) return;
        state = defaultState();
        saveState();
        showStageSelect();
      };
      window.backToMenu = function() {
        state.phase = "idle"; state.current_stage = null; state.current_id = null;
        saveState();
        showStageSelect();
      };
      window.nextQuestion = nextQuestion;

      function esc(s) {
        if (!s) return "";
        var el = document.createElement("span");
        el.textContent = s;
        return el.innerHTML;
      }
    })();
    </script>
  `;

  return pageShell({
    lang,
    title: UI.title,
    subtitle: UI.subtitle,
    bodyHTML,
    activeNav: "dojo",
    currentPath: "/kabuki/dojo/quiz",
    i18nReady: true,
    ogDesc: lang === "en"
      ? "Test your kabuki knowledge! Beginner to advanced quizzes covering plays, actors, history and terminology."
      : "歌舞伎クイズに挑戦！初級・中級・上級の3段階で演目・俳優・歴史・用語の知識を試そう",
    headExtra: `
<script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Quiz",
  "name": UI.hero_title,
  "description": lang === "en"
    ? "Test your kabuki knowledge! Beginner to advanced quizzes covering plays, actors, history and terminology."
    : "歌舞伎クイズに挑戦！初級・中級・上級の3段階で演目・俳優・歴史・用語の知識を試そう",
  "url": `https://kabukiplus.com${lp}/kabuki/dojo/quiz`,
  "inLanguage": lang === "en" ? "en" : "ja",
  "educationalLevel": lang === "en" ? "Beginner to Advanced" : "初級〜上級",
  "about": { "@type": "Thing", "name": lang === "en" ? "Kabuki theater" : "歌舞伎" },
  "provider": { "@type": "Organization", "name": "KABUKI PLUS+", "url": "https://kabukiplus.com" },
})}</script>
<style>
      .quiz-menu, .quiz-question, .quiz-result, .quiz-complete { max-width: 600px; margin: 0 auto; }
      .quiz-hero { text-align: center; padding: 1.5rem 0 1rem; }
      .quiz-hero-icon { font-size: 3rem; margin-bottom: 0.3rem; }
      .quiz-hero-title { font-size: 1.4rem; color: var(--kin); letter-spacing: 0.15em; }
      .quiz-hero-sub { font-size: 0.85rem; color: var(--text-tertiary); margin-top: 0.2rem; }
      .quiz-overall-title { text-align: center; margin-bottom: 0.8rem; padding: 0.6rem 1rem; background: var(--bg-subtle); border: 1px solid var(--border-light); border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 0.8rem; }
      .quiz-overall-label { font-size: 0.8rem; color: var(--text-tertiary); }
      .quiz-overall-name { font-size: 1.1rem; font-weight: bold; color: var(--kin); letter-spacing: 0.1em; }
      .quiz-overall-progress { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.8rem; }
      .quiz-overall-progress .quiz-progress-text { min-width: auto; white-space: nowrap; font-size: 0.78rem; }
      .quiz-stage-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.2rem; }
      .quiz-stage-item { background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 12px; overflow: hidden; transition: border-color 0.2s, box-shadow 0.2s; }
      .quiz-stage-item.current { border-color: var(--kin); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
      .quiz-stage-item.cleared { border-color: #4CAF50; background: rgba(76,175,80,0.04); }
      .quiz-stage-item.locked { opacity: 0.5; }
      .quiz-stage-header { display: flex; align-items: center; gap: 0.6rem; padding: 0.7rem 1rem; cursor: pointer; user-select: none; }
      .quiz-stage-item.locked .quiz-stage-header { cursor: default; }
      .quiz-stage-num { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; flex-shrink: 0; background: var(--bg-subtle); color: var(--text-tertiary); border: 2px solid var(--border-light); }
      .quiz-stage-item.current .quiz-stage-num { background: var(--kin); color: #fff; border-color: var(--kin); }
      .quiz-stage-item.cleared .quiz-stage-num { background: #4CAF50; color: #fff; border-color: #4CAF50; }
      .quiz-stage-name { flex: 1; font-size: 0.95rem; font-weight: 600; color: var(--text-primary); }
      .quiz-stage-item.locked .quiz-stage-name { color: var(--text-tertiary); }
      .quiz-stage-badge { font-size: 0.75rem; font-weight: 700; padding: 2px 10px; border-radius: 20px; }
      .cleared-badge { background: rgba(76,175,80,0.15); color: #388E3C; }
      .locked-badge { font-size: 1rem; }
      .current-badge { background: rgba(184,134,11,0.12); color: var(--kin); font-size: 0.75rem; }
      .quiz-stage-body { padding: 0 1rem 0.8rem; }
      .quiz-stage-body.collapsed { display: none; }
      .quiz-level-progress { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.4rem; }
      .quiz-progress-bar { flex: 1; height: 8px; background: var(--bg-subtle); border-radius: 4px; overflow: hidden; border: 1px solid var(--border-light); }
      .quiz-progress-fill { height: 100%; background: var(--kin); border-radius: 4px; transition: width 0.4s ease; }
      .quiz-progress-fill.fill-cleared { background: #4CAF50; }
      .quiz-progress-text { font-size: 0.8rem; color: var(--text-tertiary); white-space: nowrap; min-width: 3.5rem; text-align: right; }
      .quiz-level-detail { font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: 0.5rem; }
      .quiz-level-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
      .quiz-level-btn { padding: 0.5rem 1rem; font-size: 0.85rem; }
      .quiz-batch-info { font-size: 0.8rem; color: var(--kin); font-weight: 600; margin-bottom: 0.3rem; padding: 0.2rem 0; }
      .quiz-daily-info { font-size: 0.78rem; color: var(--text-tertiary); margin-bottom: 0.4rem; padding: 0.2rem 0.6rem; background: rgba(33,150,243,0.08); border-radius: 8px; display: inline-block; }
      .quiz-daily-done { font-size: 0.82rem; color: #e6860e; font-weight: 600; margin-bottom: 0.4rem; padding: 0.4rem 0.8rem; background: rgba(255,183,77,0.12); border-radius: 8px; }
      .quiz-daily-done-sub { font-size: 0.9rem; color: var(--text-tertiary); margin: 0.3rem 0 0.8rem; }
      .quiz-menu-footer { display: flex; flex-direction: column; gap: 0.5rem; align-items: center; }
      .quiz-btn { width: 100%; justify-content: center; padding: 0.7rem; font-size: 0.9rem; }
      .quiz-q-header { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.8rem; flex-wrap: wrap; }
      .quiz-q-mode { font-size: 0.85rem; color: var(--kin); font-weight: 600; }
      .quiz-q-text { font-size: 1.1rem; color: var(--text-primary); line-height: 1.7; margin-bottom: 1.2rem; }
      .quiz-choices { display: flex; flex-direction: column; gap: 0.6rem; }
      .quiz-choice { display: flex; align-items: center; gap: 0.8rem; width: 100%; padding: 1rem 1.2rem; background: var(--bg-subtle); border: 2px solid var(--border-medium); border-radius: 12px; color: var(--text-primary); font-size: 0.95rem; font-family: inherit; cursor: pointer; transition: all 0.2s; text-align: left; }
      .quiz-choice:hover { border-color: var(--kin); transform: translateX(4px); }
      .quiz-choice-label { font-size: 1.1rem; font-weight: bold; color: var(--kin); flex-shrink: 0; }
      .quiz-result { text-align: center; }
      .quiz-result-icon { font-size: 3rem; margin: 1rem 0 0.3rem; }
      .quiz-result-text { font-size: 1.3rem; margin-bottom: 1rem; }
      .correct-text { color: #4CAF50; }
      .wrong-text { color: var(--aka); }
      .quiz-result-q { font-size: 0.95rem; color: var(--text-tertiary); margin-bottom: 0.8rem; text-align: left; padding: 0.8rem; background: var(--bg-subtle); border-radius: 10px; }
      .quiz-result-choices { text-align: left; margin-bottom: 0.8rem; }
      .quiz-result-choice { padding: 0.5rem 0.8rem; margin-bottom: 0.3rem; border-radius: 8px; font-size: 0.9rem; color: var(--text-tertiary); }
      .result-correct { background: rgba(76,175,80,0.15); color: #4CAF50; font-weight: bold; }
      .result-wrong { background: rgba(196,56,56,0.15); color: var(--aka); }
      .quiz-explanation { text-align: left; font-size: 0.88rem; color: var(--text-tertiary); background: var(--bg-card); border-radius: 10px; padding: 0.8rem 1rem; margin-bottom: 0.8rem; line-height: 1.6; }
      .quiz-mini-score { font-size: 0.85rem; color: var(--text-tertiary); margin: 0.5rem 0; }
      .quiz-result-actions { display: flex; gap: 0.6rem; justify-content: center; margin-top: 1rem; flex-wrap: wrap; }
      .quiz-complete { text-align: center; }
      .quiz-complete-msg { color: var(--kin); margin: 0.5rem 0; font-size: 1.1rem; }
      .quiz-unlock-msg { font-size: 1rem; font-weight: 700; color: #388E3C; background: rgba(76,175,80,0.1); border-radius: 10px; padding: 0.8rem 1rem; margin: 0.8rem 0; }
      .quiz-retry-msg { font-size: 0.9rem; color: var(--text-secondary); background: var(--bg-subtle); border-radius: 10px; padding: 0.8rem 1rem; margin: 0.8rem 0; line-height: 1.7; }
      .quiz-complete-actions { display: flex; flex-direction: column; gap: 0.5rem; align-items: center; margin-top: 1rem; }
    </style>`,
  });
}
