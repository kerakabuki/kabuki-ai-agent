// src/info_events_page.js
// =========================================================
// INFO — 公演カレンダー棚
// 気良歌舞伎のみ表示 + 全国は準備中 + GATE参加募集導線
// =========================================================
import { pageShell } from "./web_layout.js";

export function infoEventsPageHTML() {
  const bodyHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">トップ</a><span>›</span><a href="/jikabuki/info">INFO</a><span>›</span><span>公演カレンダー</span>
    </nav>

    <section class="ie-header fade-up">
      <h2 class="ie-title">公演カレンダー</h2>
      <p class="ie-subtitle">地歌舞伎の公演情報</p>
    </section>

    <!-- 気良歌舞伎 公演情報 -->
    <section class="ie-card ie-kera fade-up" id="ie-kera">
      <div class="ie-kera-header">
        <span class="ie-kera-icon">🎭</span>
        <div>
          <div class="ie-kera-label">気良歌舞伎</div>
          <div class="ie-kera-title" id="ie-kera-title">読み込み中…</div>
        </div>
      </div>
      <div class="ie-kera-details">
        <div class="ie-detail-row">
          <span class="ie-detail-label">日時</span>
          <span class="ie-detail-value" id="ie-kera-date">--</span>
        </div>
        <div class="ie-detail-row">
          <span class="ie-detail-label">会場</span>
          <span class="ie-detail-value" id="ie-kera-venue">--</span>
        </div>
        <div class="ie-detail-row" id="ie-kera-note-row" style="display:none">
          <span class="ie-detail-label">備考</span>
          <span class="ie-detail-value" id="ie-kera-note"></span>
        </div>
      </div>
      <div class="ie-kera-countdown" id="ie-kera-cd"></div>
      <a href="/jikabuki/gate/kera/performance" class="ie-kera-link">公演情報ページを見る →</a>
    </section>

    <!-- 全国の公演カレンダー（準備中） -->
    <section class="ie-card ie-coming fade-up">
      <div class="ie-coming-icon">📅</div>
      <h3 class="ie-coming-title">全国の地歌舞伎公演カレンダー</h3>
      <span class="ie-coming-badge">準備中</span>
      <p class="ie-coming-desc">
        全国の地歌舞伎団体の公演情報を集約するカレンダー機能は、現在準備中です。<br>
        GATEに参加いただいた団体の公演情報が自動的に掲載されます。
      </p>
      <a href="/jikabuki/base/onboarding" class="ie-coming-cta">
        GATEに参加する（団体向け） →
      </a>
    </section>

    <script>
    (function() {
      /* 日付パーサー：和暦（令和/平成/昭和）・西暦どちらも対応 */
      function parseJpDate(str) {
        if (!str) return null;
        var m;
        m = str.match(/令和\s*(\d+)\s*年\s*(\d+)\s*月\s*(\d+)\s*日/);
        if (m) return new Date(2018 + parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
        m = str.match(/平成\s*(\d+)\s*年\s*(\d+)\s*月\s*(\d+)\s*日/);
        if (m) return new Date(1988 + parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
        m = str.match(/昭和\s*(\d+)\s*年\s*(\d+)\s*月\s*(\d+)\s*日/);
        if (m) return new Date(1925 + parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
        m = str.match(/(\d{4})\s*年\s*(\d+)\s*月\s*(\d+)\s*日/);
        if (m) return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
        return null;
      }

      fetch('/api/groups/kera', { credentials: 'same-origin' })
        .then(function(r) { return r.json(); })
        .then(function(g) {
          var np = g && g.next_performance;
          if (!np) return;
          var titleEl = document.getElementById('ie-kera-title');
          var dateEl = document.getElementById('ie-kera-date');
          var venueEl = document.getElementById('ie-kera-venue');
          var noteRow = document.getElementById('ie-kera-note-row');
          var noteEl = document.getElementById('ie-kera-note');
          var cdEl = document.getElementById('ie-kera-cd');

          if (titleEl) titleEl.textContent = np.title || '次回公演';
          if (dateEl) dateEl.textContent = np.date || '未定';
          if (venueEl) venueEl.textContent = np.venue || '未定';
          if (np.note && noteEl) {
            noteEl.textContent = np.note;
            noteRow.style.display = '';
          }

          var target = parseJpDate(np.date || '');
          if (target && cdEl) {
            var now = new Date(); now.setHours(0, 0, 0, 0);
            var diff = Math.ceil((target - now) / 86400000);
            if (diff > 0) cdEl.textContent = '開演まであと ' + diff + ' 日';
            else if (diff === 0) cdEl.textContent = '本日開演！';
            else cdEl.textContent = '公演は終了しました';
          }
        })
        .catch(function() {});
    })();
    </script>
  `;

  const headExtra = `<style>
.ie-header { text-align: center; margin-bottom: 1rem; }
.ie-title { font-family: var(--ff-serif); font-size: 1.4rem; color: var(--heading); margin: 0 0 0.3rem; }
.ie-subtitle { color: var(--text-muted); font-size: 0.9rem; margin: 0; }

.ie-card {
  background: var(--bg-card); border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm); padding: 1.4rem 1.6rem;
  margin-bottom: 1rem;
}

/* 気良歌舞伎 */
.ie-kera { border-left: 4px solid #8b4513; }
.ie-kera-header { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1rem; }
.ie-kera-icon { font-size: 2rem; }
.ie-kera-label { font-size: 0.8rem; color: var(--text-muted); }
.ie-kera-title { font-weight: 600; font-size: 1.1rem; color: var(--heading); }
.ie-kera-details { margin-bottom: 0.8rem; }
.ie-detail-row { display: flex; gap: 0.6rem; padding: 6px 0; border-bottom: 1px solid var(--border-light, #ece7e0); font-size: 0.9rem; }
.ie-detail-row:last-child { border-bottom: none; }
.ie-detail-label { color: var(--text-muted); min-width: 3em; flex-shrink: 0; font-weight: 500; }
.ie-detail-value { color: var(--heading); }
.ie-kera-countdown {
  font-family: var(--ff-serif); font-size: 1.3rem; font-weight: 700;
  color: #8b4513; text-align: center; margin: 0.8rem 0;
}
.ie-kera-link {
  display: inline-block; font-size: 0.9rem; color: var(--accent);
  text-decoration: none; font-weight: 500;
}
.ie-kera-link:hover { text-decoration: underline; }

/* 準備中 */
.ie-coming { text-align: center; background: var(--bg-muted, #faf7f3); border: 1px dashed var(--border, #d5cec4); }
.ie-coming-icon { font-size: 2.4rem; margin-bottom: 0.5rem; }
.ie-coming-title { font-family: var(--ff-serif); font-size: 1.1rem; color: var(--heading); margin: 0 0 0.5rem; }
.ie-coming-badge {
  display: inline-block; background: var(--bg-card); color: var(--text-muted);
  font-size: 0.72rem; padding: 3px 10px; border-radius: 10px; font-weight: 600;
  margin-bottom: 0.8rem;
}
.ie-coming-desc { font-size: 0.88rem; color: var(--text-muted); margin: 0 0 1rem; line-height: 1.7; }
.ie-coming-cta {
  display: inline-block; padding: 10px 24px; border-radius: 22px;
  background: var(--accent); color: #fff; text-decoration: none;
  font-size: 0.88rem; font-weight: 500; transition: opacity 0.2s;
}
.ie-coming-cta:hover { opacity: 0.85; }
</style>`;

  const eventsJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "地歌舞伎 公演カレンダー",
    "description": "気良歌舞伎の次回公演情報とカウントダウン。全国の地歌舞伎公演カレンダーは準備中。GATEに参加いただいた団体の情報が順次掲載されます。",
    "url": "https://kabukiplus.com/jikabuki/info/events",
    "inLanguage": "ja",
    "publisher": { "@type": "Organization", "name": "JIKABUKI PLUS+", "url": "https://kabukiplus.com" },
  };
  const eventsHeadExtra = `
<script type="application/ld+json">${JSON.stringify(eventsJsonLd)}</script>
${headExtra}`;

  return pageShell({
    title: "公演カレンダー",
    subtitle: "地歌舞伎の公演情報",
    bodyHTML,
    headExtra: eventsHeadExtra,
    activeNav: "info",
    brand: "jikabuki",
    ogDesc: "気良歌舞伎の次回公演情報とカウントダウン。全国の地歌舞伎公演カレンダーは準備中。GATEに参加いただいた団体の情報が順次掲載されます。",
    ogUrl: "https://kabukiplus.com/jikabuki/info/events",
    canonicalUrl: "https://kabukiplus.com/jikabuki/info/events",
  });
}
