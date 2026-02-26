// src/quiz_page.js
// =========================================================
// クイズページ — /quiz
// localStorage でスコア管理、API からクイズデータ取得
// 難易度モード（段階解放式）: 初級→中級→上級
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

      // ── レベル定義 ──
      var LEVELS = ["beginner", "intermediate", "advanced"];
      var LEVEL_LABELS = { beginner: "初級", intermediate: "中級", advanced: "上級" };
      var LEVEL_ICONS = { beginner: "🟢", intermediate: "🟡", advanced: "🔴" };

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
        return {
          version: 2,
          levels: {
            beginner:     { answered: {}, wrong_ids: [] },
            intermediate: { answered: {}, wrong_ids: [] },
            advanced:     { answered: {}, wrong_ids: [] }
          },
          current_level: null,
          current_id: null,
          mode: "normal",
          phase: "idle"
        };
      }
      function saveState() {
        try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch(e){}
      }

      // ── V1→V2 マイグレーション ──
      function migrateV1toV2(old) {
        var ns = defaultState();
        if (!old || !old.answered) return ns;
        var keys = Object.keys(old.answered);
        for (var i = 0; i < keys.length; i++) {
          var qid = keys[i];
          var q = quizMap[qid];
          var lvl = (q && q.level) ? q.level : "beginner";
          if (!ns.levels[lvl]) lvl = "beginner";
          ns.levels[lvl].answered[qid] = old.answered[qid];
        }
        var oldWrong = old.wrong_ids || [];
        for (var j = 0; j < oldWrong.length; j++) {
          var wid = String(oldWrong[j]);
          var wq = quizMap[wid];
          var wlvl = (wq && wq.level) ? wq.level : "beginner";
          if (!ns.levels[wlvl]) wlvl = "beginner";
          if (ns.levels[wlvl].wrong_ids.indexOf(oldWrong[j]) < 0) {
            ns.levels[wlvl].wrong_ids.push(oldWrong[j]);
          }
        }
        return ns;
      }

      // ── ヘルパー関数 ──
      function getLevelStats(level) {
        var ld = state.levels[level] || { answered: {}, wrong_ids: [] };
        var answered = ld.answered || {};
        var keys = Object.keys(answered);
        var answered_total = keys.length;
        var correct_total = 0;
        for (var i = 0; i < keys.length; i++) {
          if (answered[keys[i]] === true) correct_total++;
        }
        var total = quizList.filter(function(q){ return q.level === level; }).length;
        var remaining = total - answered_total;
        var rate = answered_total > 0 ? correct_total / answered_total : 0;
        var cleared = remaining <= 0 && answered_total > 0 && rate >= 0.7;
        return {
          answered_total: answered_total,
          correct_total: correct_total,
          total: total,
          remaining: remaining < 0 ? 0 : remaining,
          rate: rate,
          cleared: cleared,
          wrong_count: (ld.wrong_ids || []).length
        };
      }

      function isLevelUnlocked(level) {
        if (level === "beginner") return true;
        if (level === "intermediate") return getLevelStats("beginner").cleared;
        if (level === "advanced") return getLevelStats("intermediate").cleared;
        return false;
      }

      function getOverallTitle() {
        var adv = getLevelStats("advanced");
        var mid = getLevelStats("intermediate");
        var beg = getLevelStats("beginner");

        if (adv.cleared && adv.rate >= 0.9) return "国宝";
        if (adv.cleared) return "名人";
        if (adv.answered_total > 0) return "千両役者";
        if (mid.cleared) return "看板役者";
        if (mid.answered_total > 0) return "二枚目";
        if (beg.cleared) return "三枚目";
        if (beg.answered_total > 0) return "名題下";
        return "見習い";
      }

      function getTotalCorrect() {
        var total = 0;
        for (var i = 0; i < LEVELS.length; i++) {
          total += getLevelStats(LEVELS[i]).correct_total;
        }
        return total;
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
          // V1→V2 マイグレーション
          if (!state.version || state.version < 2) {
            state = migrateV1toV2(state);
            saveState();
          }
          showLevelSelect();
        })
        .catch(function(){
          app.innerHTML = '<div class="empty-state">クイズデータの読み込みに失敗しました。</div>';
        });

      // ── レベル選択画面 ──
      function showLevelSelect() {
        var title = getOverallTitle();
        var html = '<div class="quiz-menu fade-up">';
        html += '<div class="quiz-hero">';
        html += '<div class="quiz-hero-icon">👺</div>';
        html += '<h2 class="quiz-hero-title">歌舞伎クイズ</h2>';
        html += '<p class="quiz-hero-sub">段階をクリアして称号を上げよう</p>';
        html += '</div>';

        // 総合称号
        html += '<div class="quiz-overall-title">';
        html += '<span class="quiz-overall-label">称号</span>';
        html += '<span class="quiz-overall-name">' + esc(title) + '</span>';
        html += '</div>';

        // レベルカード
        html += '<div class="quiz-level-cards">';
        for (var li = 0; li < LEVELS.length; li++) {
          var lvl = LEVELS[li];
          var st = getLevelStats(lvl);
          var unlocked = isLevelUnlocked(lvl);
          var label = LEVEL_LABELS[lvl];
          var icon = LEVEL_ICONS[lvl];

          html += '<div class="quiz-level-card' + (unlocked ? '' : ' locked') + (st.cleared ? ' cleared' : '') + '">';
          html += '<div class="quiz-level-header">';
          html += '<span class="quiz-level-icon">' + icon + '</span>';
          html += '<span class="quiz-level-name">' + label + '</span>';
          if (st.cleared) {
            html += '<span class="quiz-level-badge cleared-badge">CLEAR</span>';
          } else if (!unlocked) {
            html += '<span class="quiz-level-badge locked-badge">🔒</span>';
          }
          html += '</div>';

          if (unlocked) {
            // 進捗バー
            var pct = st.total > 0 ? Math.round((st.answered_total / st.total) * 100) : 0;
            html += '<div class="quiz-level-progress">';
            html += '<div class="quiz-progress-bar"><div class="quiz-progress-fill' + (st.cleared ? ' fill-cleared' : '') + '" style="width:' + pct + '%"></div></div>';
            html += '<span class="quiz-progress-text">' + st.answered_total + '/' + st.total + '</span>';
            html += '</div>';
            // 正答率
            if (st.answered_total > 0) {
              var ratePct = Math.round(st.rate * 100);
              html += '<div class="quiz-level-detail">正答 ' + st.correct_total + '問（' + ratePct + '%）';
              if (st.wrong_count > 0) html += '　復習 ' + st.wrong_count + '問';
              html += '</div>';
            }
            // ボタン
            html += '<div class="quiz-level-actions">';
            if (st.remaining > 0) {
              html += '<button class="btn btn-primary quiz-level-btn" onclick="startLevel(\\'' + lvl + '\\',\\'normal\\')">挑戦する</button>';
            } else {
              html += '<button class="btn btn-primary quiz-level-btn" disabled>全問回答済み</button>';
            }
            if (st.wrong_count > 0) {
              html += '<button class="btn btn-secondary quiz-level-btn" onclick="startLevel(\\'' + lvl + '\\',\\'review\\')">復習（' + st.wrong_count + '問）</button>';
            }
            html += '</div>';
          } else {
            // 未解放
            var prev = lvl === "intermediate" ? "初級" : "中級";
            html += '<div class="quiz-level-locked-msg">' + prev + 'をクリア（正答率70%以上）で解放</div>';
          }

          html += '</div>';
        }
        html += '</div>';

        // フッター
        html += '<div class="quiz-menu-footer">';
        var anyAnswered = getLevelStats("beginner").answered_total + getLevelStats("intermediate").answered_total + getLevelStats("advanced").answered_total;
        if (anyAnswered > 0) {
          html += '<button class="btn btn-secondary quiz-btn" onclick="resetQuiz()">リセット</button>';
        }
        html += '<a href="/kabuki/dojo" class="btn btn-secondary quiz-btn" style="display:inline-block;text-align:center;text-decoration:none;">← KABUKI DOJO</a>';
        html += '</div>';

        html += '</div>';
        app.innerHTML = html;
      }

      // ── レベル開始 ──
      window.startLevel = function(level, mode) {
        state.current_level = level;
        state.mode = mode;
        state.phase = "question";
        saveState();
        nextQuestion();
      };

      function nextQuestion() {
        var lvl = state.current_level;
        var ld = state.levels[lvl];
        var qid;

        if (state.mode === "review") {
          if (ld.wrong_ids.length === 0) {
            state.phase = "idle";
            saveState();
            showComplete(lvl, "復習完了！間違いをすべて復習したよ");
            return;
          }
          qid = ld.wrong_ids[0];
        } else {
          var levelQuizzes = quizList.filter(function(q){ return q.level === lvl; });
          var unanswered = levelQuizzes.filter(function(q){ return !ld.answered[String(q.quiz_id)]; });
          if (unanswered.length === 0) {
            state.phase = "idle";
            saveState();
            showComplete(lvl, LEVEL_LABELS[lvl] + " 全問回答完了！");
            return;
          }
          var pick = unanswered[Math.floor(Math.random() * unanswered.length)];
          qid = pick.quiz_id;
        }
        state.current_id = qid;
        saveState();
        showQuestion(quizMap[String(qid)]);
      }

      // ── 問題表示 ──
      function showQuestion(q) {
        if (!q) { showLevelSelect(); return; }
        var lvl = state.current_level;
        var ld = state.levels[lvl];
        var st = getLevelStats(lvl);
        var levelLabel = LEVEL_LABELS[lvl];
        var modeLabel = state.mode === "review" ? "【復習】" : "";
        var numLabel = state.mode === "review"
          ? "（残り" + ld.wrong_ids.length + "問）"
          : "第" + (st.answered_total + 1) + "問 / " + st.total + "問";

        var html = '<div class="quiz-question fade-up">';
        html += '<div class="quiz-q-header">';
        html += '<span class="quiz-q-level-tag level-' + lvl + '">【' + levelLabel + '】</span>';
        html += '<span class="quiz-q-mode">' + modeLabel + numLabel + '</span>';
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
        var lvl = state.current_level;
        var ld = state.levels[lvl];

        if (state.mode !== "review") {
          ld.answered[String(qid)] = isCorrect;
          if (isCorrect) {
            addQuizXP();
          }
          if (!isCorrect && ld.wrong_ids.indexOf(qid) < 0) {
            ld.wrong_ids.push(qid);
          }
          if (isCorrect) {
            ld.wrong_ids = ld.wrong_ids.filter(function(id){ return id !== qid; });
          }
        } else {
          // 復習モード: 正解なら wrong_ids から除去し answered を更新
          if (isCorrect) {
            ld.wrong_ids = ld.wrong_ids.filter(function(id){ return id !== qid; });
            ld.answered[String(qid)] = true;
            addQuizXP();
          }
        }
        saveState();
        showResult(q, choice, isCorrect);
      };

      // ── 結果表示 ──
      function showResult(q, choice, isCorrect) {
        var lvl = state.current_level;
        var st = getLevelStats(lvl);
        var correctIdx = q.answer_index != null ? q.answer_index : ((q.correct || q.answer) - 1);
        var html = '<div class="quiz-result fade-up">';
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

        // レベル内スコア
        var ratePct = st.answered_total > 0 ? Math.round(st.rate * 100) : 0;
        html += '<div class="quiz-mini-score">';
        html += LEVEL_LABELS[lvl] + '：' + st.correct_total + '/' + st.answered_total + '正解（' + ratePct + '%）';
        html += '　称号：' + esc(getOverallTitle());
        html += '</div>';

        html += '</div>';

        html += '<div class="quiz-result-actions">';
        html += '<button class="btn btn-primary" onclick="nextQuestion()">次の問題 →</button>';
        html += '<button class="btn btn-secondary" onclick="backToMenu()">メニューに戻る</button>';
        html += '</div>';
        app.innerHTML = html;
      }

      // ── 完了画面 ──
      function showComplete(level, msg) {
        var st = getLevelStats(level);
        var ratePct = st.answered_total > 0 ? Math.round(st.rate * 100) : 0;
        var title = getOverallTitle();
        var nextLevel = level === "beginner" ? "intermediate" : (level === "intermediate" ? "advanced" : null);

        var html = '<div class="quiz-complete fade-up">';

        if (st.cleared && nextLevel) {
          // レベルクリア + 次レベル解放
          html += '<div class="quiz-hero-icon">🎊</div>';
          html += '<h2 class="quiz-complete-msg">' + esc(msg) + '</h2>';
          html += '<div class="quiz-unlock-msg">' + LEVEL_LABELS[nextLevel] + ' が解放されました！</div>';
        } else if (st.remaining <= 0 && !st.cleared) {
          // 全問回答済みだが正答率不足
          html += '<div class="quiz-hero-icon">📝</div>';
          html += '<h2 class="quiz-complete-msg">' + esc(msg) + '</h2>';
          html += '<div class="quiz-retry-msg">正答率70%以上で次のレベルが解放されます（現在 ' + ratePct + '%）<br>復習で正答率を上げよう！</div>';
        } else {
          html += '<div class="quiz-hero-icon">🎊</div>';
          html += '<h2 class="quiz-complete-msg">' + esc(msg) + '</h2>';
        }

        html += '<div class="quiz-mini-score">' + st.correct_total + '/' + st.answered_total + '正解（' + ratePct + '%）　称号：' + esc(title) + '</div>';

        html += '<div class="quiz-complete-actions">';
        if (st.wrong_count > 0) {
          html += '<button class="btn btn-primary" onclick="startLevel(\\'' + level + '\\',\\'review\\')">復習する（' + st.wrong_count + '問）</button>';
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
        showLevelSelect();
      };

      window.backToMenu = function() {
        state.phase = "idle";
        state.current_level = null;
        saveState();
        showLevelSelect();
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
        margin-bottom: 1.2rem;
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

      /* ── レベルカード ── */
      .quiz-level-cards {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        margin-bottom: 1.2rem;
      }
      .quiz-level-card {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: 14px;
        padding: 1rem 1.2rem;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .quiz-level-card:not(.locked):hover {
        border-color: var(--kin);
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      }
      .quiz-level-card.locked {
        opacity: 0.55;
      }
      .quiz-level-card.cleared {
        border-color: #4CAF50;
        background: rgba(76,175,80,0.04);
      }
      .quiz-level-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.6rem;
      }
      .quiz-level-icon {
        font-size: 1.1rem;
      }
      .quiz-level-name {
        font-size: 1rem;
        font-weight: 700;
        color: var(--text-primary);
        flex: 1;
      }
      .quiz-level-badge {
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
      .quiz-level-locked-msg {
        font-size: 0.8rem;
        color: var(--text-tertiary);
        padding: 0.3rem 0;
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
      .quiz-q-level-tag {
        font-size: 0.8rem;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 6px;
      }
      .level-beginner { background: rgba(76,175,80,0.12); color: #388E3C; }
      .level-intermediate { background: rgba(255,183,77,0.2); color: #e6860e; }
      .level-advanced { background: rgba(229,57,53,0.12); color: #C62828; }
      .quiz-q-mode {
        font-size: 0.8rem;
        color: var(--kin);
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
