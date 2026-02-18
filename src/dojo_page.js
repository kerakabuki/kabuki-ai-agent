// src/dojo_page.js
// =========================================================
// KABUKI DOJO — /dojo
// やってみる：クイズ・台詞稽古・大向う道場
// =========================================================
import { pageShell } from "./web_layout.js";

export function dojoPageHTML() {
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
          <p>リズムに合わせて掛け声を練習。タイミングをマスターしよう。</p>
          <div class="dojo-card-stats" id="kakegoe-stats"></div>
        </div>
        <span class="dojo-card-arrow">→</span>
      </a>

      <!-- 台詞稽古チャレンジ -->
      <a href="/kabuki/dojo/training/serifu" class="dojo-card dojo-serifu fade-up-d3">
        <div class="dojo-card-icon">🎤</div>
        <div class="dojo-card-body">
          <h3>台詞稽古チャレンジ</h3>
          <p>名台詞をカラオケ感覚で体験。音声認識で発声をチェック。</p>
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
        var qs = JSON.parse(localStorage.getItem("kabuki_quiz_state") || "{}");
        if (qs.correct_total) {
          var titles = [
            [90,"歌舞伎博士"],[70,"歌舞伎通"],[50,"見巧者"],
            [30,"若旦那"],[10,"歌舞伎好き"],[0,"見習い"]
          ];
          var t = "見習い";
          for (var ti = 0; ti < titles.length; ti++) {
            if (qs.correct_total >= titles[ti][0]) { t = titles[ti][1]; break; }
          }
          document.getElementById("quiz-stats").innerHTML = '正答 ' + qs.correct_total + '/' + (qs.answered_total || 0) + ' ── ' + t;
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
        document.getElementById("stat-quiz").textContent = (qs.correct_total || 0);

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
        if ((qs.correct_total||0) >= 10) badges.push({e:"🎓",n:"入門者",d:"クイズ10問正解"});
        if ((qs.correct_total||0) >= 50) badges.push({e:"🏆",n:"見巧者",d:"クイズ50問正解"});
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
