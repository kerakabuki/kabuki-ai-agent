// src/dojo_page.js
// =========================================================
// KABUKI DOJO — /dojo
// やってみる：クイズ・台詞稽古・大向う道場
// =========================================================
import { pageShell } from "./web_layout.js";

export function dojoPageHTML({ googleClientId = "" } = {}) {
  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span>KABUKI DOJO
    </div>

    <section class="dojo-intro fade-up">
      <p class="dojo-lead">
        知識の腕試し、台詞の練習、掛け声の修行。<br>
        歌舞伎を「体験」しよう。
      </p>
    </section>

    <div class="dojo-grid">
      <!-- クイズ -->
      <a href="/kabuki/dojo/quiz" class="dojo-card dojo-quiz fade-up-d1">
        <div class="dojo-card-icon">👺</div>
        <div class="dojo-card-body">
          <h3>歌舞伎クイズ</h3>
          <p>全100問の三択で楽しく学ぼう。正解数に応じて称号が変わる！</p>
          <div class="dojo-card-stats" id="quiz-stats"></div>
        </div>
        <span class="dojo-card-arrow">→</span>
      </a>

      <!-- 大向う道場 -->
      <a href="/kabuki/dojo/training/kakegoe" class="dojo-card dojo-kakegoe fade-up-d2">
        <div class="dojo-card-icon">📣</div>
        <div class="dojo-card-body">
          <h3>大向う道場</h3>
          <p>「白浪五人男」の動画で掛け声と拍手のタイミングを練習しよう。</p>
          <div class="dojo-card-stats" id="kakegoe-stats"></div>
        </div>
        <span class="dojo-card-arrow">→</span>
      </a>

      <!-- 台詞稽古チャレンジ -->
      <a href="/kabuki/dojo/training/serifu" class="dojo-card dojo-serifu fade-up-d3">
        <div class="dojo-card-icon">🎤</div>
        <div class="dojo-card-body">
          <h3>台詞稽古チャレンジ</h3>
          <p>弁天小僧の名台詞「知らざぁ言って聞かせやしょう」をカラオケ感覚で体験。</p>
          <div class="dojo-card-stats" id="serifu-stats"></div>
        </div>
        <span class="dojo-card-arrow">→</span>
      </a>
    </div>

    <!-- ── 学習進捗 ── -->
    <section class="dojo-progress fade-up-d4" id="dojo-progress">
      <h2 class="section-title">学習進捗</h2>
      <div class="dojo-stats-grid" id="dojo-stats-grid">
        <div class="dojo-stat">
          <div class="dojo-stat-icon">📋</div>
          <div class="dojo-stat-num" id="stat-clips">0</div>
          <div class="dojo-stat-label">クリップ</div>
        </div>
        <div class="dojo-stat">
          <div class="dojo-stat-icon">👁️</div>
          <div class="dojo-stat-num" id="stat-recent">0</div>
          <div class="dojo-stat-label">閲覧履歴</div>
        </div>
        <div class="dojo-stat">
          <div class="dojo-stat-icon">❓</div>
          <div class="dojo-stat-num" id="stat-quiz">0</div>
          <div class="dojo-stat-label">クイズ正答</div>
        </div>
      </div>
      <div class="dojo-badge-area" id="dojo-badges"></div>
    </section>

    <div class="dojo-footer fade-up-d5">
      <p>学んだ知識は<a href="/kabuki/navi">KABUKI NAVI</a>でさらに深めよう。<br>
      観劇の記録は<a href="/kabuki/reco">KABUKI RECO</a>で。</p>
    </div>

    <script>
    (function(){
      try {
        /* クイズ進捗 */
        var qs = JSON.parse(localStorage.getItem("keranosuke_quiz_state") || "{}");
        var quizCorrectTotal = 0;
        var LEVEL_LABELS = { beginner: "初級", intermediate: "中級", advanced: "上級" };
        if (qs.version === 2 && qs.levels) {
          // V2: レベル別進捗
          var parts = [];
          var levels = ["beginner", "intermediate", "advanced"];
          for (var li = 0; li < levels.length; li++) {
            var lvl = levels[li];
            var ld = qs.levels[lvl] || { answered: {}, wrong_ids: [] };
            var ans = ld.answered || {};
            var keys = Object.keys(ans);
            var cnt = keys.length;
            var cor = 0;
            for (var ki = 0; ki < keys.length; ki++) { if (ans[keys[ki]] === true) cor++; }
            quizCorrectTotal += cor;
            var rate = cnt > 0 ? Math.round((cor / cnt) * 100) : 0;
            var cleared = cnt > 0 && rate >= 70;
            // 前レベルクリア判定
            var prevCleared = true;
            if (lvl === "intermediate") {
              var bAns = qs.levels.beginner ? qs.levels.beginner.answered || {} : {};
              var bKeys = Object.keys(bAns);
              var bCor = 0; for (var bi = 0; bi < bKeys.length; bi++) { if (bAns[bKeys[bi]] === true) bCor++; }
              prevCleared = bKeys.length > 0 && (bCor / bKeys.length) >= 0.7;
            } else if (lvl === "advanced") {
              var mAns = qs.levels.intermediate ? qs.levels.intermediate.answered || {} : {};
              var mKeys = Object.keys(mAns);
              var mCor = 0; for (var mi = 0; mi < mKeys.length; mi++) { if (mAns[mKeys[mi]] === true) mCor++; }
              prevCleared = mKeys.length > 0 && (mCor / mKeys.length) >= 0.7;
            }
            if (lvl === "beginner" || prevCleared) {
              var icon = cleared ? "✅" : "🔓";
              parts.push(LEVEL_LABELS[lvl] + ' ' + icon + ' ' + cor + '/' + cnt + (cnt > 0 ? ' (' + rate + '%)' : ''));
            } else {
              parts.push(LEVEL_LABELS[lvl] + ' 🔒');
            }
          }
          // 称号計算
          var advD = qs.levels.advanced || { answered: {} };
          var advKeys = Object.keys(advD.answered || {});
          var advCor = 0; for (var ai = 0; ai < advKeys.length; ai++) { if ((advD.answered || {})[advKeys[ai]] === true) advCor++; }
          var advRate = advKeys.length > 0 ? advCor / advKeys.length : 0;
          var midD = qs.levels.intermediate || { answered: {} };
          var midKeys = Object.keys(midD.answered || {});
          var midCor = 0; for (var mii = 0; mii < midKeys.length; mii++) { if ((midD.answered || {})[midKeys[mii]] === true) midCor++; }
          var begD = qs.levels.beginner || { answered: {} };
          var begKeys = Object.keys(begD.answered || {});
          var begCor = 0; for (var bii = 0; bii < begKeys.length; bii++) { if ((begD.answered || {})[begKeys[bii]] === true) begCor++; }
          var advCleared = advKeys.length > 0 && advRate >= 0.7;
          var midCleared = midKeys.length > 0 && (midCor / midKeys.length) >= 0.7;
          var begCleared = begKeys.length > 0 && (begCor / begKeys.length) >= 0.7;
          var qTitle = "見習い";
          if (advCleared && advRate >= 0.9) qTitle = "国宝";
          else if (advCleared) qTitle = "名人";
          else if (advKeys.length > 0) qTitle = "千両役者";
          else if (midCleared) qTitle = "看板役者";
          else if (midKeys.length > 0) qTitle = "二枚目";
          else if (begCleared) qTitle = "三枚目";
          else if (begKeys.length > 0) qTitle = "名題下";
          document.getElementById("quiz-stats").innerHTML = parts.join(' | ') + '<br>称号: ' + qTitle;
        } else if (qs.correct_total) {
          // V1 フォールバック
          quizCorrectTotal = qs.correct_total;
          document.getElementById("quiz-stats").innerHTML = '正答 ' + qs.correct_total + '/' + (qs.answered_total || 0);
        }
        /* 学習ログ進捗 */
        var log = JSON.parse(localStorage.getItem("keranosuke_log_v1") || "{}");
        var clips = log.clips || {};
        var ec = (clips.enmoku || []).length;
        var pc = (clips.person || []).length;
        var tc = (clips.term || []).length;
        var rc = (log.recent || []).length;
        document.getElementById("stat-clips").textContent = (ec + pc + tc);
        document.getElementById("stat-recent").textContent = rc;
        document.getElementById("stat-quiz").textContent = quizCorrectTotal;

        /* 稽古進捗 */
        var practice = log.practice || {};
        if (practice.kakegoe && practice.kakegoe.sessions > 0) {
          document.getElementById("kakegoe-stats").innerHTML = '稽古回数: ' + practice.kakegoe.sessions + '回';
        }
        var serifuDone = Object.keys(practice.serifu_v2 || {}).length;
        if (serifuDone > 0) {
          document.getElementById("serifu-stats").innerHTML = serifuDone + ' 演目完了';
        }

        /* バッジ表示 */
        var badges = [];
        if (rc >= 1) badges.push({e:"📖",n:"初めの一歩",d:"最初のコンテンツを閲覧"});
        if ((ec+pc+tc) >= 5) badges.push({e:"⭐",n:"目利き",d:"5件以上クリップ"});
        if ((ec+pc+tc) >= 20) badges.push({e:"🌟",n:"コレクター",d:"20件以上クリップ"});
        if (quizCorrectTotal >= 10) badges.push({e:"🎓",n:"入門者",d:"クイズ10問正解"});
        if (quizCorrectTotal >= 50) badges.push({e:"🏆",n:"見巧者",d:"クイズ50問正解"});
        if ((practice.kakegoe||{}).sessions >= 1) badges.push({e:"📣",n:"初大向う",d:"大向う道場1回完了"});
        if (serifuDone >= 1) badges.push({e:"🎤",n:"初台詞",d:"台詞稽古1演目完了"});
        if (badges.length > 0) {
          var bh = '<div class="dojo-badges-title">🏆 獲得バッジ</div><div class="dojo-badges-grid">';
          for (var bi = 0; bi < badges.length; bi++) {
            bh += '<div class="dojo-badge-card"><span class="dojo-badge-emoji">' + badges[bi].e + '</span><span class="dojo-badge-name">' + badges[bi].n + '</span></div>';
          }
          bh += '</div>';
          document.getElementById("dojo-badges").innerHTML = bh;
        }
      } catch(e) {}
    })();
    </script>
  `;

  return pageShell({
    title: "KABUKI DOJO",
    subtitle: "歌舞伎道場",
    bodyHTML,
    activeNav: "dojo",
    googleClientId,
    ogImage: "https://kabukiplus.com/assets/ogp/ogp_dojo.png",
    headExtra: `<style>
      .dojo-intro {
        text-align: center;
        padding: 24px 16px 32px;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 24px;
      }
      .dojo-lead {
        font-size: 14px;
        line-height: 2;
        color: var(--text-secondary);
        letter-spacing: 0.08em;
      }
      .dojo-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 2rem;
      }
      .dojo-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        text-decoration: none;
        color: var(--text-primary);
        transition: transform 0.15s, box-shadow 0.15s;
        box-shadow: var(--shadow-sm);
      }
      .dojo-quiz    { border-left: 3px solid var(--accent-1); }
      .dojo-kakegoe { border-left: 3px solid var(--accent-3); }
      .dojo-serifu  { border-left: 3px solid var(--accent-2); }
      .dojo-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
        text-decoration: none;
      }
      .dojo-card-icon {
        width: 48px; height: 48px;
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        flex-shrink: 0;
        background: var(--bg-subtle);
      }
      .dojo-card-body { flex: 1; min-width: 0; }
      .dojo-card-body h3 {
        font-family: 'Noto Serif JP', serif;
        font-size: 15px;
        font-weight: 600;
        letter-spacing: 1px;
        margin-bottom: 4px;
      }
      .dojo-card-body p {
        font-size: 12px;
        color: var(--text-secondary);
        line-height: 1.5;
      }
      .dojo-card-stats {
        font-size: 11px;
        color: var(--gold-dark);
        font-weight: 600;
        margin-top: 4px;
      }
      .dojo-card-arrow {
        color: var(--text-tertiary);
        font-size: 18px;
        flex-shrink: 0;
        transition: transform 0.15s;
      }
      .dojo-card:hover .dojo-card-arrow {
        transform: translateX(3px);
        color: var(--gold);
      }

      /* ── 学習進捗 ── */
      .dojo-progress { margin-bottom: 2rem; }
      .dojo-stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-bottom: 1rem;
      }
      .dojo-stat {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        padding: 20px 12px;
        text-align: center;
        box-shadow: var(--shadow-sm);
      }
      .dojo-stat-icon { font-size: 20px; margin-bottom: 4px; }
      .dojo-stat-num {
        font-size: 28px;
        font-weight: 700;
        color: var(--gold-dark);
        line-height: 1.2;
      }
      .dojo-stat-label {
        font-size: 11px;
        color: var(--text-secondary);
        margin-top: 4px;
        letter-spacing: 1px;
      }
      .dojo-badges-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 10px;
      }
      .dojo-badges-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .dojo-badge-card {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: var(--gold-soft);
        border: 1px solid var(--gold-light);
        border-radius: 20px;
        font-size: 12px;
        color: var(--gold-dark);
      }
      .dojo-badge-emoji { font-size: 16px; }

      /* ── フッター ── */
      .dojo-footer {
        text-align: center;
        padding: 24px 16px;
        border-top: 1px solid var(--border-light);
        color: var(--text-tertiary);
        font-size: 13px;
        line-height: 1.8;
      }
    </style>`
  });
}
