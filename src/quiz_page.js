// src/quiz_page.js
// =========================================================
// クイズページ — /quiz
// localStorage でスコア管理、API からクイズデータ取得
// 10ステージ固定制 + 1日10問制限（グローバル）
// =========================================================
import { pageShell } from "./web_layout.js";

export function quizPageHTML() {
  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span><a href="/kabuki/dojo">KABUKI DOJO</a><span>›</span>歌舞伎クイズ
    </div>
    <div id="app">
      <div class="loading">クイズデータを読み込み中…</div>
    </div>

    <script>
    (function(){
      var app = document.getElementById("app");
      var quizList = [];
      var quizMap = {};

      // ── 定数 ──
      var STAGE_COUNT = 10;
      var DAILY_LIMIT = 10;
      var STAGE_NAMES = ["第一幕","第二幕","第三幕","第四幕","第五幕","第六幕","第七幕","第八幕","第九幕","第十幕"];
      var TITLE_RANKS = ["見習い","名題下","三枚目","二枚目","花形","看板役者","千両役者","座頭","名人","人間国宝","世界遺産"];
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

        // V1: flat answered/wrong_ids
        // V2: levels.beginner/intermediate/advanced { answered, wrong_ids }
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
          // V1
          allAnswered = old.answered;
          allWrong = old.wrong_ids || [];
        }

        // quiz_id → ステージに振り分け
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

        // daily: V2 per-level counts → V3 global count
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

      // ── クイズ分配ヘルパー ──
      // 全クイズを level優先(beginner→intermediate→advanced) + quiz_id昇順 でソート
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

      // ステージ idx のクイズ配列を返す（均等分配）
      function getStageQuizzes(idx) {
        var all = getAllQuizzesSorted();
        var total = all.length;
        var base = Math.floor(total / STAGE_COUNT);
        var extra = total % STAGE_COUNT;
        // stages 0..extra-1 get base+1, stages extra..9 get base
        var start = 0;
        for (var i = 0; i < idx; i++) {
          start += (i < extra) ? base + 1 : base;
        }
        var size = (idx < extra) ? base + 1 : base;
        return all.slice(start, start + size);
      }

      // quiz_id → ステージ番号
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

      // ステージ統計
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
          answered: answeredCount,
          correct: correctCount,
          total: total,
          remaining: remaining < 0 ? 0 : remaining,
          rate: rate,
          cleared: cleared,
          wrong_count: (sd.wrong_ids || []).length
        };
      }

      function isStageUnlocked(idx) {
        if (idx === 0) return true;
        return getStageStats(idx - 1).cleared;
      }

      // 最初の未クリアステージ
      function getCurrentStage() {
        for (var i = 0; i < STAGE_COUNT; i++) {
          if (!getStageStats(i).cleared) return i;
        }
        return STAGE_COUNT; // 全クリア
      }

      // クリア済みステージ数（先頭から連続）
      function getClearedCount() {
        for (var i = 0; i < STAGE_COUNT; i++) {
          if (!getStageStats(i).cleared) return i;
        }
        return STAGE_COUNT;
      }

      // 称号
      function getTitle() {
        return TITLE_RANKS[getClearedCount()];
      }

      /* XP加算ヘルパー */
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

      // ── 日次制限（グローバル）──
      function ensureDailyReset() {
        var today = new Date();
        var todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
        if (!state.daily || state.daily.date !== todayStr) {
          state.daily = { date: todayStr, count: 0 };
          saveState();
        }
      }

      function getDailyRemaining() {
        ensureDailyReset();
        return DAILY_LIMIT - (state.daily.count || 0);
      }

      function incrementDaily() {
        ensureDailyReset();
        state.daily.count = (state.daily.count || 0) + 1;
        saveState();
      }

      // ── データ読み込み ──
      fetch("/api/quiz")
        .then(function(r){ return r.json(); })
        .then(function(data){
          if (Array.isArray(data)) { quizList = data; }
          else if (data && Array.isArray(data.list)) { quizList = data.list; }
          else { quizList = []; }
          // level が無いクイズは beginner にフォールバック
          quizList.forEach(function(q){
            if (q && q.quiz_id != null) quizMap[String(q.quiz_id)] = q;
            if (!q.level) q.level = "beginner";
          });
          // ソートキャッシュ初期化
          _sortedQuizzes = null;
          getAllQuizzesSorted();
          // V1/V2 → V3 マイグレーション
          if (!state.version || state.version < 3) {
            state = migrateToV3(state);
            saveState();
          }
          ensureDailyReset();
          showStageSelect();
        })
        .catch(function(){
          app.innerHTML = '<div class="empty-state">クイズデータの読み込みに失敗しました。</div>';
        });

      // ── ステージ選択画面 ──
      function showStageSelect() {
        var title = getTitle();
        var cleared = getClearedCount();
        var dailyRem = getDailyRemaining();
        var currentStage = getCurrentStage();

        var html = '<div class="quiz-menu fade-up">';

        // ヒーロー
        html += '<div class="quiz-hero">';
        html += '<div class="quiz-hero-icon">👺</div>';
        html += '<h2 class="quiz-hero-title">歌舞伎クイズ</h2>';
        html += '<p class="quiz-hero-sub">10ステージをクリアして昇進しよう</p>';
        html += '</div>';

        // 称号 + 全体進捗バー
        html += '<div class="quiz-overall-title">';
        html += '<span class="quiz-overall-label">称号</span>';
        html += '<span class="quiz-overall-name">' + esc(title) + '</span>';
        html += '</div>';

        var overallPct = Math.round((cleared / STAGE_COUNT) * 100);
        html += '<div class="quiz-overall-progress">';
        html += '<div class="quiz-progress-bar"><div class="quiz-progress-fill' + (cleared === STAGE_COUNT ? ' fill-cleared' : '') + '" style="width:' + overallPct + '%"></div></div>';
        html += '<span class="quiz-progress-text">' + cleared + '/' + STAGE_COUNT + ' ステージクリア</span>';
        html += '</div>';

        // 日次残り
        if (dailyRem <= 0) {
          html += '<div class="quiz-daily-done" style="text-align:center;margin-bottom:1rem;">今日の10問は終了！明日また挑戦しよう</div>';
        } else {
          html += '<div class="quiz-daily-info" style="text-align:center;margin-bottom:1rem;">今日あと ' + dailyRem + ' 問</div>';
        }

        // ステージリスト
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

          // ヘッダー
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

          // ボディ（展開エリア）
          if (isCurrent && unlocked) {
            // 現在ステージ: 常に展開
            html += '<div class="quiz-stage-body">';
            var stagePct = sst.total > 0 ? Math.round((sst.answered / sst.total) * 100) : 0;
            html += '<div class="quiz-level-progress">';
            html += '<div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:' + stagePct + '%"></div></div>';
            html += '<span class="quiz-progress-text">' + sst.answered + '/' + sst.total + '</span>';
            html += '</div>';
            if (sst.answered > 0) {
              var sratePct = Math.round(sst.rate * 100);
              html += '<div class="quiz-level-detail">正答率 ' + sratePct + '%（' + sst.correct + '/' + sst.answered + '正解）';
              if (sst.wrong_count > 0) html += '　復習 ' + sst.wrong_count + '問';
              html += '</div>';
            }

            html += '<div class="quiz-level-actions">';
            if (sst.remaining > 0 && dailyRem > 0) {
              html += '<button class="btn btn-primary quiz-level-btn" onclick="startStage(' + si + ',\\'normal\\')">挑戦する</button>';
            } else if (sst.remaining > 0 && dailyRem <= 0) {
              html += '<button class="btn btn-primary quiz-level-btn" disabled>今日の分は終了</button>';
            } else if (sst.remaining === 0 && !isCleared) {
              html += '<button class="btn btn-primary quiz-level-btn" disabled>正答率不足（復習しよう）</button>';
            }
            if (sst.wrong_count > 0) {
              html += '<button class="btn btn-secondary quiz-level-btn" onclick="startStage(' + si + ',\\'review\\')">復習（' + sst.wrong_count + '問）</button>';
            }
            html += '</div>';
            html += '</div>';
          } else if (isCleared) {
            // クリア済み: 折りたたみ、復習ボタンあり
            html += '<div class="quiz-stage-body collapsed" id="stage-body-' + si + '">';
            var cRatePct = Math.round(sst.rate * 100);
            html += '<div class="quiz-level-detail">正答率 ' + cRatePct + '%（' + sst.correct + '/' + sst.total + '正解）';
            if (sst.wrong_count > 0) html += '　復習 ' + sst.wrong_count + '問';
            html += '</div>';
            html += '<div class="quiz-level-actions">';
            if (sst.wrong_count > 0) {
              html += '<button class="btn btn-secondary quiz-level-btn" onclick="startStage(' + si + ',\\'review\\')">復習（' + sst.wrong_count + '問）</button>';
            }
            html += '</div>';
            html += '</div>';
          }
          // ロック: ボディなし

          html += '</div>';
        }
        html += '</div>';

        // フッター
        html += '<div class="quiz-menu-footer">';
        var anyAnswered = false;
        for (var fi = 0; fi < STAGE_COUNT; fi++) {
          if (getStageStats(fi).answered > 0) { anyAnswered = true; break; }
        }
        if (anyAnswered) {
          html += '<button class="btn btn-secondary quiz-btn" onclick="resetQuiz()">リセット</button>';
        }
        html += '<a href="/kabuki/dojo" class="btn btn-secondary quiz-btn" style="display:inline-block;text-align:center;text-decoration:none;">← KABUKI DOJO</a>';
        html += '</div>';

        html += '</div>';
        app.innerHTML = html;
      }

      // ステージ折りたたみ切替
      window.toggleStage = function(idx) {
        var body = document.getElementById("stage-body-" + idx);
        if (body) {
          body.classList.toggle("collapsed");
        }
      };

      // ── ステージ開始 ──
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
            state.phase = "idle";
            saveState();
            showComplete("復習完了！間違いをすべて復習したよ");
            return;
          }
          var qid = sd.wrong_ids[0];
          state.current_id = qid;
          saveState();
          showQuestion(quizMap[String(qid)]);
          return;
        }

        // ステージ完了チェック（前回の問題のステージが全問回答済みか）
        if (state.current_id != null) {
          var sst = getStageStats(idx);
          if (sst.remaining === 0) {
            state.current_id = null;
            state.phase = "idle";
            saveState();
            showStageComplete(idx);
            return;
          }
        }

        // 日次上限チェック（グローバル）
        ensureDailyReset();
        if (getDailyRemaining() <= 0) {
          state.phase = "idle";
          saveState();
          showDailyComplete();
          return;
        }

        // 未回答をランダム出題
        var stageQuizzes = getStageQuizzes(idx);
        var unanswered = stageQuizzes.filter(function(q){
          return sd.answered[String(q.quiz_id)] === undefined;
        });
        if (unanswered.length === 0) {
          state.phase = "idle";
          saveState();
          showStageComplete(idx);
          return;
        }
        var pick = unanswered[Math.floor(Math.random() * unanswered.length)];
        state.current_id = pick.quiz_id;
        saveState();
        showQuestion(quizMap[String(pick.quiz_id)]);
      }

      // ── 問題表示 ──
      function showQuestion(q) {
        if (!q) { showStageSelect(); return; }
        var idx = state.current_stage;
        var sd = state.stages[idx];
        var sst = getStageStats(idx);
        var stageName = STAGE_NAMES[idx];

        var numLabel;
        if (state.mode === "review") {
          numLabel = "【復習】" + stageName + "（残り" + sd.wrong_ids.length + "問）";
        } else {
          numLabel = "【" + stageName + "】" + (sst.answered + 1) + "/" + sst.total + "問目";
        }

        var html = '<div class="quiz-question fade-up">';
        html += '<div class="quiz-q-header">';
        html += '<span class="quiz-q-mode">' + numLabel + '</span>';
        html += '</div>';
        html += '<h2 class="quiz-q-text">' + esc(q.question) + '</h2>';
        html += '<div class="quiz-choices">';
        var labels = ["①", "②", "③"];
        (q.choices || []).forEach(function(c, i) {
          html += '<button class="quiz-choice" onclick="answer(\\'' + q.quiz_id + '\\',' + i + ')">';
          html += '<span class="quiz-choice-label">' + labels[i] + '</span>';
          html += '<span class="quiz-choice-text">' + esc(c) + '</span>';
          html += '</button>';
        });
        html += '</div>';
        html += '</div>';

        html += '<div style="margin-top:1rem;text-align:center;">';
        html += '<button class="btn btn-secondary" onclick="backToMenu()">メニューに戻る</button>';
        html += '</div>';
        app.innerHTML = html;
      }

      // ── 回答判定 ──
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
          if (isCorrect) {
            addQuizXP();
          }
          if (!isCorrect && sd.wrong_ids.indexOf(qid) < 0) {
            sd.wrong_ids.push(qid);
          }
          if (isCorrect) {
            sd.wrong_ids = sd.wrong_ids.filter(function(id){ return id !== qid; });
          }
        } else {
          // 復習モード: 正解なら wrong_ids から除去し answered を更新
          if (isCorrect) {
            sd.wrong_ids = sd.wrong_ids.filter(function(id){ return id !== qid; });
            sd.answered[String(qid)] = true;
            addQuizXP();
          }
        }
        saveState();
        showResult(q, choice, isCorrect);
      };

      // ── 結果表示 ──
      function showResult(q, choice, isCorrect) {
        var idx = state.current_stage;
        var sst = getStageStats(idx);
        var stageName = STAGE_NAMES[idx];
        var correctIdx = q.answer_index != null ? q.answer_index : ((q.correct || q.answer) - 1);

        var headerLabel;
        if (state.mode === "review") {
          headerLabel = "";
        } else {
          headerLabel = stageName + " " + sst.answered + "/" + sst.total + "問目";
        }

        var html = '<div class="quiz-result fade-up">';

        if (headerLabel) {
          html += '<div class="quiz-batch-info" style="text-align:center;margin-bottom:0.5rem;">' + headerLabel + '</div>';
        }

        html += isCorrect
          ? '<div class="quiz-result-icon correct">⭕</div><h2 class="quiz-result-text correct-text">正解！</h2>'
          : '<div class="quiz-result-icon wrong">❌</div><h2 class="quiz-result-text wrong-text">不正解…</h2>';

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

        if (q.explanation) {
          html += '<div class="quiz-explanation">' + esc(q.explanation) + '</div>';
        }

        // ステージ内スコア
        var ratePct = sst.answered > 0 ? Math.round(sst.rate * 100) : 0;
        html += '<div class="quiz-mini-score">';
        html += stageName + '：' + sst.correct + '/' + sst.answered + '正解（' + ratePct + '%）';
        html += '　称号：' + esc(getTitle());
        html += '</div>';

        html += '</div>';

        // ボタン
        html += '<div class="quiz-result-actions">';
        if (state.mode === "review") {
          html += '<button class="btn btn-primary" onclick="nextQuestion()">次の問題 →</button>';
        } else {
          var dailyRem = getDailyRemaining();
          if (sst.remaining <= 0) {
            html += '<button class="btn btn-primary" onclick="nextQuestion()">結果を見る →</button>';
          } else if (dailyRem <= 0) {
            html += '<button class="btn btn-primary" onclick="nextQuestion()">今日の分は終了</button>';
          } else {
            html += '<button class="btn btn-primary" onclick="nextQuestion()">次の問題 →</button>';
          }
        }
        html += '<button class="btn btn-secondary" onclick="backToMenu()">メニューに戻る</button>';
        html += '</div>';
        app.innerHTML = html;
      }

      // ── ステージ完了画面 ──
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
          html += '<h2 class="quiz-complete-msg">' + stageName + ' クリア！</h2>';

          if (allCleared) {
            html += '<div class="quiz-unlock-msg">全ステージ制覇！おめでとう！<br>あなたは「' + esc(title) + '」です！</div>';
          } else {
            var newTitle = getTitle();
            var prevTitle = TITLE_RANKS[getClearedCount() - 1];
            if (prevTitle !== newTitle) {
              html += '<div class="quiz-unlock-msg">昇進！「' + esc(prevTitle) + '」→「' + esc(newTitle) + '」</div>';
            }
            html += '<div class="quiz-unlock-msg" style="background:rgba(33,150,243,0.1);color:#1976D2;">' + STAGE_NAMES[stageIdx + 1] + ' が解放されました！</div>';
          }

          html += '<div class="quiz-mini-score">正答率 ' + ratePct + '%（' + sst.correct + '/' + sst.answered + '正解）　称号：' + esc(title) + '</div>';

          html += '<div class="quiz-complete-actions">';
          if (!allCleared && dailyRem > 0) {
            html += '<button class="btn btn-primary" onclick="startStage(' + (stageIdx + 1) + ',\\'normal\\')">次のステージへ →</button>';
          } else if (!allCleared && dailyRem <= 0) {
            html += '<div class="quiz-daily-done">今日の分は終了！明日から次のステージに挑戦しよう</div>';
          }
        } else {
          html += '<div class="quiz-hero-icon">📝</div>';
          html += '<h2 class="quiz-complete-msg">' + stageName + ' 終了</h2>';
          html += '<div class="quiz-retry-msg">正答率70%以上で次へ進めます（現在 ' + ratePct + '%）<br>復習で正答率を上げよう！</div>';
          html += '<div class="quiz-mini-score">' + sst.correct + '/' + sst.answered + '正解（' + ratePct + '%）　称号：' + esc(title) + '</div>';
          html += '<div class="quiz-complete-actions">';
        }

        if (sst.wrong_count > 0) {
          html += '<button class="btn btn-primary" onclick="startStage(' + stageIdx + ',\\'review\\')">復習する（' + sst.wrong_count + '問）</button>';
        }
        html += '<button class="btn btn-secondary" onclick="backToMenu()">メニューに戻る</button>';
        html += '<a href="/kabuki/dojo" class="btn btn-secondary" style="display:inline-block;text-align:center;text-decoration:none;">← KABUKI DOJO</a>';
        html += '</div>';
        html += '</div>';
        app.innerHTML = html;
      }

      // ── 日次上限到達画面 ──
      function showDailyComplete() {
        var title = getTitle();

        var html = '<div class="quiz-complete fade-up">';
        html += '<div class="quiz-hero-icon">🌙</div>';
        html += '<h2 class="quiz-complete-msg">今日の10問は終了！</h2>';
        html += '<p class="quiz-daily-done-sub">明日また挑戦しよう</p>';
        html += '<div class="quiz-mini-score">称号：' + esc(title) + '</div>';

        html += '<div class="quiz-complete-actions">';
        // 復習可能なステージがあればボタン表示
        var reviewStage = -1;
        for (var i = 0; i < STAGE_COUNT; i++) {
          if (getStageStats(i).wrong_count > 0 && isStageUnlocked(i)) {
            reviewStage = i;
            break;
          }
        }
        if (reviewStage >= 0) {
          html += '<button class="btn btn-primary" onclick="startStage(' + reviewStage + ',\\'review\\')">復習する（無制限）</button>';
        }
        html += '<button class="btn btn-secondary" onclick="backToMenu()">メニューに戻る</button>';
        html += '<a href="/kabuki/dojo" class="btn btn-secondary" style="display:inline-block;text-align:center;text-decoration:none;">← KABUKI DOJO</a>';
        html += '</div>';
        html += '</div>';
        app.innerHTML = html;
      }

      // ── 復習完了画面 ──
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
          html += '<div class="quiz-unlock-msg">' + stageName + ' の正答率が70%以上になりました！</div>';
        }

        html += '<div class="quiz-mini-score">' + sst.correct + '/' + sst.answered + '正解（' + ratePct + '%）　称号：' + esc(title) + '</div>';

        html += '<div class="quiz-complete-actions">';
        if (sst.wrong_count > 0) {
          html += '<button class="btn btn-primary" onclick="startStage(' + idx + ',\\'review\\')">もう一度復習（' + sst.wrong_count + '問）</button>';
        }
        html += '<button class="btn btn-secondary" onclick="backToMenu()">メニューに戻る</button>';
        html += '<a href="/kabuki/dojo" class="btn btn-secondary" style="display:inline-block;text-align:center;text-decoration:none;">← KABUKI DOJO</a>';
        html += '</div>';
        html += '</div>';
        app.innerHTML = html;
      }

      // ── リセット ──
      window.resetQuiz = function() {
        if (!confirm("クイズの記録をリセットしますか？")) return;
        state = defaultState();
        saveState();
        showStageSelect();
      };

      window.backToMenu = function() {
        state.phase = "idle";
        state.current_stage = null;
        state.current_id = null;
        saveState();
        showStageSelect();
      };

      // グローバル公開
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
    title: "歌舞伎クイズ",
    subtitle: "三択クイズで楽しく学ぼう",
    bodyHTML,
    activeNav: "dojo",
    headExtra: `<style>
      .quiz-menu, .quiz-question, .quiz-result, .quiz-complete {
        max-width: 600px;
        margin: 0 auto;
      }

      /* ── ヒーロー ── */
      .quiz-hero {
        text-align: center;
        padding: 1.5rem 0 1rem;
      }
      .quiz-hero-icon {
        font-size: 3rem;
        margin-bottom: 0.3rem;
      }
      .quiz-hero-title {
        font-size: 1.4rem;
        color: var(--kin);
        letter-spacing: 0.15em;
      }
      .quiz-hero-sub {
        font-size: 0.85rem;
        color: var(--text-tertiary);
        margin-top: 0.2rem;
      }

      /* ── 総合称号 ── */
      .quiz-overall-title {
        text-align: center;
        margin-bottom: 0.8rem;
        padding: 0.6rem 1rem;
        background: var(--bg-subtle);
        border: 1px solid var(--border-light);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.8rem;
      }
      .quiz-overall-label {
        font-size: 0.8rem;
        color: var(--text-tertiary);
      }
      .quiz-overall-name {
        font-size: 1.1rem;
        font-weight: bold;
        color: var(--kin);
        letter-spacing: 0.1em;
      }

      /* ── 全体進捗 ── */
      .quiz-overall-progress {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 0.8rem;
      }
      .quiz-overall-progress .quiz-progress-text {
        min-width: auto;
        white-space: nowrap;
        font-size: 0.78rem;
      }

      /* ── ステージリスト ── */
      .quiz-stage-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1.2rem;
      }
      .quiz-stage-item {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: 12px;
        overflow: hidden;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .quiz-stage-item.current {
        border-color: var(--kin);
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      }
      .quiz-stage-item.cleared {
        border-color: #4CAF50;
        background: rgba(76,175,80,0.04);
      }
      .quiz-stage-item.locked {
        opacity: 0.5;
      }

      /* ── ステージヘッダー ── */
      .quiz-stage-header {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.7rem 1rem;
        cursor: pointer;
        user-select: none;
      }
      .quiz-stage-item.locked .quiz-stage-header {
        cursor: default;
      }
      .quiz-stage-num {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: 700;
        flex-shrink: 0;
        background: var(--bg-subtle);
        color: var(--text-tertiary);
        border: 2px solid var(--border-light);
      }
      .quiz-stage-item.current .quiz-stage-num {
        background: var(--kin);
        color: #fff;
        border-color: var(--kin);
      }
      .quiz-stage-item.cleared .quiz-stage-num {
        background: #4CAF50;
        color: #fff;
        border-color: #4CAF50;
      }
      .quiz-stage-name {
        flex: 1;
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--text-primary);
      }
      .quiz-stage-item.locked .quiz-stage-name {
        color: var(--text-tertiary);
      }
      .quiz-stage-badge {
        font-size: 0.75rem;
        font-weight: 700;
        padding: 2px 10px;
        border-radius: 20px;
      }
      .cleared-badge {
        background: rgba(76,175,80,0.15);
        color: #388E3C;
      }
      .locked-badge {
        font-size: 1rem;
      }
      .current-badge {
        background: rgba(184,134,11,0.12);
        color: var(--kin);
        font-size: 0.75rem;
      }

      /* ── ステージボディ ── */
      .quiz-stage-body {
        padding: 0 1rem 0.8rem;
      }
      .quiz-stage-body.collapsed {
        display: none;
      }

      /* ── 進捗バー ── */
      .quiz-level-progress {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 0.4rem;
      }
      .quiz-progress-bar {
        flex: 1;
        height: 8px;
        background: var(--bg-subtle);
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid var(--border-light);
      }
      .quiz-progress-fill {
        height: 100%;
        background: var(--kin);
        border-radius: 4px;
        transition: width 0.4s ease;
      }
      .quiz-progress-fill.fill-cleared {
        background: #4CAF50;
      }
      .quiz-progress-text {
        font-size: 0.8rem;
        color: var(--text-tertiary);
        white-space: nowrap;
        min-width: 3.5rem;
        text-align: right;
      }

      /* ── レベル詳細 ── */
      .quiz-level-detail {
        font-size: 0.8rem;
        color: var(--text-tertiary);
        margin-bottom: 0.5rem;
      }
      .quiz-level-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .quiz-level-btn {
        padding: 0.5rem 1rem;
        font-size: 0.85rem;
      }

      /* ── バッチ情報 ── */
      .quiz-batch-info {
        font-size: 0.8rem;
        color: var(--kin);
        font-weight: 600;
        margin-bottom: 0.3rem;
        padding: 0.2rem 0;
      }

      /* ── 日次残り ── */
      .quiz-daily-info {
        font-size: 0.78rem;
        color: var(--text-tertiary);
        margin-bottom: 0.4rem;
        padding: 0.2rem 0.6rem;
        background: rgba(33,150,243,0.08);
        border-radius: 8px;
        display: inline-block;
      }

      /* ── 日次終了メッセージ ── */
      .quiz-daily-done {
        font-size: 0.82rem;
        color: #e6860e;
        font-weight: 600;
        margin-bottom: 0.4rem;
        padding: 0.4rem 0.8rem;
        background: rgba(255,183,77,0.12);
        border-radius: 8px;
      }
      .quiz-daily-done-sub {
        font-size: 0.9rem;
        color: var(--text-tertiary);
        margin: 0.3rem 0 0.8rem;
      }

      /* ── メニューフッター ── */
      .quiz-menu-footer {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        align-items: center;
      }
      .quiz-btn {
        width: 100%;
        justify-content: center;
        padding: 0.7rem;
        font-size: 0.9rem;
      }

      /* ── 問題 ── */
      .quiz-q-header {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 0.8rem;
        flex-wrap: wrap;
      }
      .quiz-q-mode {
        font-size: 0.85rem;
        color: var(--kin);
        font-weight: 600;
      }
      .quiz-q-text {
        font-size: 1.1rem;
        color: var(--text-primary);
        line-height: 1.7;
        margin-bottom: 1.2rem;
      }

      /* ── 選択肢ボタン ── */
      .quiz-choices {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }
      .quiz-choice {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        width: 100%;
        padding: 1rem 1.2rem;
        background: var(--bg-subtle);
        border: 2px solid var(--border-medium);
        border-radius: 12px;
        color: var(--text-primary);
        font-size: 0.95rem;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
      }
      .quiz-choice:hover {
        border-color: var(--kin);
        transform: translateX(4px);
      }
      .quiz-choice-label {
        font-size: 1.1rem;
        font-weight: bold;
        color: var(--kin);
        flex-shrink: 0;
      }

      /* ── 結果 ── */
      .quiz-result { text-align: center; }
      .quiz-result-icon { font-size: 3rem; margin: 1rem 0 0.3rem; }
      .quiz-result-text { font-size: 1.3rem; margin-bottom: 1rem; }
      .correct-text { color: #4CAF50; }
      .wrong-text { color: var(--aka); }
      .quiz-result-q {
        font-size: 0.95rem;
        color: var(--text-tertiary);
        margin-bottom: 0.8rem;
        text-align: left;
        padding: 0.8rem;
        background: var(--bg-subtle);
        border-radius: 10px;
      }
      .quiz-result-choices { text-align: left; margin-bottom: 0.8rem; }
      .quiz-result-choice {
        padding: 0.5rem 0.8rem;
        margin-bottom: 0.3rem;
        border-radius: 8px;
        font-size: 0.9rem;
        color: var(--text-tertiary);
      }
      .result-correct {
        background: rgba(76,175,80,0.15);
        color: #4CAF50;
        font-weight: bold;
      }
      .result-wrong {
        background: rgba(196,56,56,0.15);
        color: var(--aka);
      }
      .quiz-explanation {
        text-align: left;
        font-size: 0.88rem;
        color: var(--text-tertiary);
        background: var(--bg-card);
        border-radius: 10px;
        padding: 0.8rem 1rem;
        margin-bottom: 0.8rem;
        line-height: 1.6;
      }
      .quiz-mini-score {
        font-size: 0.85rem;
        color: var(--text-tertiary);
        margin: 0.5rem 0;
      }
      .quiz-result-actions {
        display: flex;
        gap: 0.6rem;
        justify-content: center;
        margin-top: 1rem;
        flex-wrap: wrap;
      }

      /* ── 完了画面 ── */
      .quiz-complete { text-align: center; }
      .quiz-complete-msg {
        color: var(--kin);
        margin: 0.5rem 0;
        font-size: 1.1rem;
      }
      .quiz-unlock-msg {
        font-size: 1rem;
        font-weight: 700;
        color: #388E3C;
        background: rgba(76,175,80,0.1);
        border-radius: 10px;
        padding: 0.8rem 1rem;
        margin: 0.8rem 0;
      }
      .quiz-retry-msg {
        font-size: 0.9rem;
        color: var(--text-secondary);
        background: var(--bg-subtle);
        border-radius: 10px;
        padding: 0.8rem 1rem;
        margin: 0.8rem 0;
        line-height: 1.7;
      }
      .quiz-complete-actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        align-items: center;
        margin-top: 1rem;
      }
    </style>`,
  });
}
