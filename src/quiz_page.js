// src/quiz_page.js
// =========================================================
// クイズページ — /quiz
// localStorage でスコア管理、API からクイズデータ取得
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
          answered_total: 0,
          correct_total: 0,
          answered: {},
          wrong_ids: [],
          current_id: null,
          mode: "normal",
          phase: "idle"
        };
      }
      function saveState() {
        try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch(e){}
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

      // ── 称号 ──
      function calcTitle(correct, total) {
        var t = total || 100;
        var p = t > 0 ? correct / t : 0;
        if (p >= 1.0) return "国宝";
        if (p >= 0.9) return "名人";
        if (p >= 0.7) return "千両役者";
        if (p >= 0.5) return "看板役者";
        if (p >= 0.3) return "二枚目";
        if (p >= 0.15) return "三枚目";
        if (p >= 0.05) return "名題";
        return "名題下";
      }

      // ── データ読み込み ──
      fetch("/api/quiz")
        .then(function(r){ return r.json(); })
        .then(function(data){
          if (Array.isArray(data)) { quizList = data; }
          else if (data && Array.isArray(data.list)) { quizList = data.list; }
          else { quizList = []; }
          quizList.forEach(function(q){
            if (q && q.quiz_id != null) quizMap[String(q.quiz_id)] = q;
          });
          showMenu();
        })
        .catch(function(){
          app.innerHTML = '<div class="empty-state">クイズデータの読み込みに失敗しました。</div>';
        });

      // ── メニュー画面 ──
      function showMenu() {
        var title = calcTitle(state.correct_total, quizList.length);
        var answered = state.answered_total;
        var correct = state.correct_total;
        var total = quizList.length;
        var remaining = total - Object.keys(state.answered).length;
        var wrongCount = state.wrong_ids.length;

        var html = '<div class="quiz-menu fade-up">';
        html += '<div class="quiz-hero">';
        html += '<div class="quiz-hero-icon">👺</div>';
        html += '<h2 class="quiz-hero-title">歌舞伎クイズ</h2>';
        html += '<p class="quiz-hero-sub">全' + total + '問の三択クイズで楽しく学ぼう</p>';
        html += '</div>';

        // スコアボード
        html += '<div class="quiz-score">';
        html += '<div class="quiz-score-item"><span class="quiz-score-num">' + answered + '</span><span class="quiz-score-label">回答数</span></div>';
        html += '<div class="quiz-score-item"><span class="quiz-score-num">' + correct + '</span><span class="quiz-score-label">正解数</span></div>';
        html += '<div class="quiz-score-item"><span class="quiz-score-num">' + remaining + '</span><span class="quiz-score-label">残り</span></div>';
        html += '<div class="quiz-score-item"><span class="quiz-score-num quiz-title-rank">' + esc(title) + '</span><span class="quiz-score-label">称号</span></div>';
        html += '</div>';

        // ボタン
        html += '<div class="quiz-actions">';
        if (remaining > 0) {
          html += '<button class="btn btn-primary quiz-btn" onclick="startQuiz(\\'normal\\')">🎯 クイズに挑戦</button>';
        } else {
          html += '<button class="btn btn-primary quiz-btn" disabled>全問回答済み！</button>';
        }
        if (wrongCount > 0) {
          html += '<button class="btn btn-secondary quiz-btn" onclick="startQuiz(\\'review\\')">🔄 間違い復習（' + wrongCount + '問）</button>';
        }
        if (answered > 0) {
          html += '<button class="btn btn-secondary quiz-btn" onclick="resetQuiz()">🗑 リセット</button>';
        }
        html += '<a href="/kabuki/dojo" class="btn btn-secondary quiz-btn" style="display:inline-block;text-align:center;text-decoration:none;margin-top:4px;">← KABUKI DOJO</a>';
        html += '</div>';
        html += '</div>';
        app.innerHTML = html;
      }

      // ── クイズ開始 ──
      window.startQuiz = function(mode) {
        state.mode = mode;
        state.phase = "question";
        nextQuestion();
      };

      function nextQuestion() {
        var qid;
        if (state.mode === "review") {
          if (state.wrong_ids.length === 0) {
            state.phase = "idle";
            saveState();
            showComplete("復習完了！間違いをすべて復習したよ 🎉");
            return;
          }
          qid = state.wrong_ids[0];
        } else {
          // 未回答からランダム
          var unanswered = quizList.filter(function(q){ return !state.answered[String(q.quiz_id)]; });
          if (unanswered.length === 0) {
            state.phase = "idle";
            saveState();
            showComplete("全問回答済み！おめでとう 🎉");
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
        if (!q) { showMenu(); return; }
        var modeLabel = state.mode === "review" ? "【復習】" : "";
        var numLabel = state.mode === "review"
          ? "（残り" + state.wrong_ids.length + "問）"
          : "第" + (state.answered_total + 1) + "問";

        var html = '<div class="quiz-question fade-up">';
        html += '<div class="quiz-q-header">';
        html += '<span class="quiz-q-mode">' + modeLabel + '歌舞伎クイズ ' + numLabel + '</span>';
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

        if (state.mode !== "review") {
          state.answered_total++;
          if (isCorrect) {
            state.correct_total++;
            addQuizXP();
          }
          state.answered[String(qid)] = isCorrect;
          if (!isCorrect && state.wrong_ids.indexOf(qid) < 0) {
            state.wrong_ids.push(qid);
          }
          if (isCorrect) {
            state.wrong_ids = state.wrong_ids.filter(function(id){ return id !== qid; });
          }
        } else {
          // 復習モード
          if (isCorrect) {
            state.wrong_ids = state.wrong_ids.filter(function(id){ return id !== qid; });
            addQuizXP();
          }
        }
        saveState();
        showResult(q, choice, isCorrect);
      };

      // ── 結果表示 ──
      function showResult(q, choice, isCorrect) {
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
          html += '<div class="quiz-explanation">💡 ' + esc(q.explanation) + '</div>';
        }

        // スコア
        var title = calcTitle(state.correct_total, quizList.length);
        html += '<div class="quiz-mini-score">' + state.correct_total + '/' + state.answered_total + '正解　称号：' + esc(title) + '</div>';

        html += '</div>';

        html += '<div class="quiz-result-actions">';
        html += '<button class="btn btn-primary" onclick="nextQuestion()">次の問題 →</button>';
        html += '<button class="btn btn-secondary" onclick="backToMenu()">メニューに戻る</button>';
        html += '<a href="/kabuki/dojo" class="btn btn-secondary" style="display:inline-block;text-align:center;text-decoration:none;">← KABUKI DOJO</a>';
        html += '</div>';
        app.innerHTML = html;
      }

      // ── 完了画面 ──
      function showComplete(msg) {
        var title = calcTitle(state.correct_total, quizList.length);
        var html = '<div class="quiz-complete fade-up">';
        html += '<div class="quiz-hero-icon">🎊</div>';
        html += '<h2 style="color:var(--kin);margin:0.5rem 0;">' + esc(msg) + '</h2>';
        html += '<div class="quiz-mini-score">' + state.correct_total + '/' + state.answered_total + '正解　称号：' + esc(title) + '</div>';
        html += '<div style="margin-top:1rem;display:flex;flex-direction:column;gap:8px;align-items:center;">';
        html += '<button class="btn btn-primary" onclick="backToMenu()">メニューに戻る</button>';
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
        showMenu();
      };

      window.backToMenu = function() {
        state.phase = "idle";
        saveState();
        showMenu();
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
        padding: 1.5rem 0;
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

      /* ── スコアボード ── */
      .quiz-score {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.5rem;
        margin-bottom: 1.5rem;
      }
      .quiz-score-item {
        background: var(--bg-subtle);
        border: 1px solid var(--border-light);
        border-radius: 12px;
        padding: 0.8rem 0.5rem;
        text-align: center;
      }
      .quiz-score-num {
        display: block;
        font-size: 1.3rem;
        font-weight: bold;
        color: var(--kin);
      }
      .quiz-score-label {
        display: block;
        font-size: 0.7rem;
        color: var(--text-tertiary);
        margin-top: 0.2rem;
      }
      .quiz-title-rank {
        font-size: 0.85rem !important;
      }

      /* ── ボタン群 ── */
      .quiz-actions {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }
      .quiz-btn {
        width: 100%;
        justify-content: center;
        padding: 0.8rem;
        font-size: 1rem;
      }

      /* ── 問題 ── */
      .quiz-q-header {
        margin-bottom: 0.8rem;
      }
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
    </style>`,
  });
}
