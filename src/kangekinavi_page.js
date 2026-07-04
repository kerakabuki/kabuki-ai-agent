// src/kangekinavi_page.js
// =========================================================
// 観劇ナビ ～はじめての歌舞伎座～ — /kabuki/navi/theater
// はじめての歌舞伎観劇をステップ形式でガイド
// =========================================================
import { pageShell } from "./web_layout.js";
import { t, langPrefix } from "./i18n.js";

export function kangekinaviPageHTML({ googleClientId = "", lang = "ja" } = {}) {
  const lp = langPrefix(lang);
  const bodyHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="${lp}/">${t("common.breadcrumb_top", lang)}</a><span>›</span><a href="${lp}/kabuki/navi">KABUKI NAVI</a><span>›</span>${t("theater.breadcrumb", lang)}
    </nav>

    <div class="kn-intro-card fade-up">
      <div class="kn-intro-icon">🧭</div>
      <h2>${t("theater.intro_heading", lang)}</h2>
      <p>
        ${t("theater.intro_text", lang)}
      </p>
    </div>

    <div class="kn-progress-bar fade-up-d1" id="kn-progress-bar">
      <div class="kn-progress-dot active" data-step="1"><span class="kn-dot-num">1</span> ${t("theater.step_label_1", lang)}</div>
      <div class="kn-progress-dot" data-step="2"><span class="kn-dot-num">2</span> ${t("theater.step_label_2", lang)}</div>
      <div class="kn-progress-dot" data-step="3"><span class="kn-dot-num">3</span> ${t("theater.step_label_3", lang)}</div>
      <div class="kn-progress-dot" data-step="4"><span class="kn-dot-num">4</span> ${t("theater.step_label_4", lang)}</div>
      <div class="kn-progress-dot" data-step="5"><span class="kn-dot-num">5</span> ${t("theater.step_label_5", lang)}</div>
      <div class="kn-progress-dot" data-step="6"><span class="kn-dot-num">6</span> ${t("theater.step_label_6", lang)}</div>
    </div>

    <div class="kn-timeline">

      <!-- STEP 1 -->
      <div class="kn-step-card open fade-up-d1" id="kn-step-1">
        <div class="kn-step-header" onclick="knToggleStep(1)">
          <div class="kn-step-number">1</div>
          <div class="kn-step-title-area">
            <div class="kn-step-title">${t("theater.s1_title", lang)}</div>
            <div class="kn-step-timing">${t("theater.s1_timing", lang)}</div>
          </div>
          <div class="kn-step-toggle">▼</div>
        </div>
        <div class="kn-step-body">
          <div class="kn-highlight-box">
            <span class="kn-highlight-label">${t("theater.s1_highlight_label", lang)}</span>
            ${t("theater.s1_highlight", lang)}
          </div>

          <h4>${t("theater.s1_how_to_buy", lang)}</h4>
          <ul>
            <li>${t("theater.s1_buy1", lang)}</li>
            <li>${t("theater.s1_buy2", lang)}</li>
            <li>${t("theater.s1_buy3", lang)}</li>
            <li>${t("theater.s1_buy4", lang)}</li>
          </ul>

          <h4>${t("theater.s1_seats_title", lang)}</h4>
          <p>${t("theater.s1_seats_note", lang)}</p>
          <ul>
            <li>${t("theater.s1_seat1", lang)}</li>
            <li>${t("theater.s1_seat2", lang)}</li>
            <li>${t("theater.s1_seat3", lang)}</li>
            <li>${t("theater.s1_seat4", lang)}</li>
            <li>${t("theater.s1_seat5", lang)}</li>
            <li>${t("theater.s1_seat6", lang)}</li>
            <li>${t("theater.s1_seat7", lang)}</li>
          </ul>

          <div class="kn-info-box">
            <span class="kn-info-label">${t("theater.s1_first_timer_label", lang)}</span>
            ${t("theater.s1_first_timer", lang)}
          </div>

          <h4>${t("theater.s1_hitomakumi_title", lang)}</h4>
          <ul>
            <li>${t("theater.s1_hitomakumi1", lang)}</li>
            <li>${t("theater.s1_hitomakumi2", lang)}</li>
            <li>${t("theater.s1_hitomakumi3", lang)}</li>
            <li>${t("theater.s1_hitomakumi4", lang)}</li>
          </ul>

          <div class="kn-info-box">
            <span class="kn-info-label">${t("theater.s1_u25_label", lang)}</span>
            ${t("theater.s1_u25", lang)}
          </div>

          <div class="kn-tip-box">
            ${t("theater.s1_tip", lang)}
          </div>
        </div>
      </div>

      <!-- STEP 2 -->
      <div class="kn-step-card" id="kn-step-2">
        <div class="kn-step-header" onclick="knToggleStep(2)">
          <div class="kn-step-number">2</div>
          <div class="kn-step-title-area">
            <div class="kn-step-title">${t("theater.s2_title", lang)}</div>
            <div class="kn-step-timing">${t("theater.s2_timing", lang)}</div>
          </div>
          <div class="kn-step-toggle">▼</div>
        </div>
        <div class="kn-step-body">
          <h4>${t("theater.s2_access_title", lang)}</h4>
          <ul>
            <li>${t("theater.s2_access1", lang)}</li>
            <li>${t("theater.s2_access2", lang)}</li>
          </ul>
          <p>${t("theater.s2_address", lang)}</p>

          <h4>${t("theater.s2_arrival_title", lang)}</h4>
          <p>${t("theater.s2_arrival", lang)}</p>

          <h4>${t("theater.s2_schedule_title", lang)}</h4>
          <ul>
            <li>${t("theater.s2_schedule1", lang)}</li>
            <li>${t("theater.s2_schedule2", lang)}</li>
            <li>${t("theater.s2_schedule3", lang)}</li>
            <li>${t("theater.s2_schedule4", lang)}</li>
          </ul>

          <h4>${t("theater.s2_dress_title", lang)}</h4>
          <p>${t("theater.s2_dress", lang)}</p>

          <div class="kn-tip-box">
            ${t("theater.s2_tip", lang)}
          </div>
        </div>
      </div>

      <!-- STEP 3 -->
      <div class="kn-step-card" id="kn-step-3">
        <div class="kn-step-header" onclick="knToggleStep(3)">
          <div class="kn-step-number">3</div>
          <div class="kn-step-title-area">
            <div class="kn-step-title">${t("theater.s3_title", lang)}</div>
            <div class="kn-step-timing">${t("theater.s3_timing", lang)}</div>
          </div>
          <div class="kn-step-toggle">▼</div>
        </div>
        <div class="kn-step-body">
          <h4>${t("theater.s3_earphone_title", lang)}</h4>
          <p>${t("theater.s3_earphone_desc", lang)}</p>
          <div class="kn-info-box">
            <span class="kn-info-label">${t("theater.s3_price_floor13_label", lang)}</span>
            ${t("theater.s3_price_floor13", lang)}
          </div>
          <div class="kn-info-box">
            <span class="kn-info-label">${t("theater.s3_price_floor4_label", lang)}</span>
            ${t("theater.s3_price_floor4", lang)}
          </div>
          <p>${t("theater.s3_earphone_where", lang)}</p>

          <h4>${t("theater.s3_subtitle_title", lang)}</h4>
          <p>${t("theater.s3_subtitle_desc", lang)}</p>
          <div class="kn-info-box">
            <span class="kn-info-label">${t("theater.s3_subtitle_price_label", lang)}</span>
            ${t("theater.s3_subtitle_price", lang)}
          </div>

          <h4>${t("theater.s3_program_title", lang)}</h4>
          <p>${t("theater.s3_program_desc", lang)}</p>
          <div class="kn-info-box">
            <span class="kn-info-label">${t("theater.s3_program_price_label", lang)}</span>
            ${t("theater.s3_program_price", lang)}
          </div>

          <h4>${t("theater.s3_seat_title", lang)}</h4>
          <p>${t("theater.s3_seat_desc", lang)}</p>

          <div class="kn-tip-box">
            ${t("theater.s3_tip", lang)}
          </div>
        </div>
      </div>

      <!-- STEP 4 -->
      <div class="kn-step-card" id="kn-step-4">
        <div class="kn-step-header" onclick="knToggleStep(4)">
          <div class="kn-step-number">4</div>
          <div class="kn-step-title-area">
            <div class="kn-step-title">${t("theater.s4_title", lang)}</div>
            <div class="kn-step-timing">${t("theater.s4_timing", lang)}</div>
          </div>
          <div class="kn-step-toggle">▼</div>
        </div>
        <div class="kn-step-body">
          <h4>${t("theater.s4_applause_title", lang)}</h4>
          <p>${t("theater.s4_applause", lang)}</p>

          <h4>${t("theater.s4_kakegoe_title", lang)}</h4>
          <p>${t("theater.s4_kakegoe", lang)}</p>

          <div class="kn-info-box">
            <span class="kn-info-label">${t("theater.s4_trivia_label", lang)}</span>
            ${t("theater.s4_trivia", lang)}
          </div>

          <h4>${t("theater.s4_rules_title", lang)}</h4>
          <ul>
            <li>${t("theater.s4_rule1", lang)}</li>
            <li>${t("theater.s4_rule2", lang)}</li>
            <li>${t("theater.s4_rule3", lang)}</li>
          </ul>
          <a href="${lp}/kabuki/navi/manners" class="kn-link-btn">${t("theater.s4_manners_link", lang)}</a>
        </div>
      </div>

      <!-- STEP 5 -->
      <div class="kn-step-card" id="kn-step-5">
        <div class="kn-step-header" onclick="knToggleStep(5)">
          <div class="kn-step-number">5</div>
          <div class="kn-step-title-area">
            <div class="kn-step-title">${t("theater.s5_title", lang)}</div>
            <div class="kn-step-timing">${t("theater.s5_timing", lang)}</div>
          </div>
          <div class="kn-step-toggle">▼</div>
        </div>
        <div class="kn-step-body">
          <h4>${t("theater.s5_what_title", lang)}</h4>
          <p>${t("theater.s5_what_desc", lang)}</p>

          <h4>${t("theater.s5_bento_title", lang)}</h4>
          <ul>
            <li>${t("theater.s5_bento1", lang)}</li>
            <li>${t("theater.s5_bento2", lang)}</li>
            <li>${t("theater.s5_bento3", lang)}</li>
            <li>${t("theater.s5_bento4", lang)}</li>
            <li>${t("theater.s5_bento5", lang)}</li>
          </ul>

          <h4>${t("theater.s5_lobby_title", lang)}</h4>
          <ul>
            <li>${t("theater.s5_lobby1", lang)}</li>
            <li>${t("theater.s5_lobby2", lang)}</li>
            <li>${t("theater.s5_lobby3", lang)}</li>
            <li>${t("theater.s5_lobby4", lang)}</li>
          </ul>

          <div class="kn-tip-box">
            ${t("theater.s5_tip", lang)}
          </div>
        </div>
      </div>

      <!-- STEP 6 -->
      <div class="kn-step-card" id="kn-step-6">
        <div class="kn-step-header" onclick="knToggleStep(6)">
          <div class="kn-step-number">6</div>
          <div class="kn-step-title-area">
            <div class="kn-step-title">${t("theater.s6_title", lang)}</div>
            <div class="kn-step-timing">${t("theater.s6_timing", lang)}</div>
          </div>
          <div class="kn-step-toggle">▼</div>
        </div>
        <div class="kn-step-body">
          <h4>${t("theater.s6_return_title", lang)}</h4>
          <p>${t("theater.s6_return_desc", lang)}</p>

          <h4>${t("theater.s6_log_title", lang)}</h4>
          <p>${t("theater.s6_log_desc", lang)}</p>
          <a href="${lp}/kabuki/reco" class="kn-link-btn kn-link-btn-primary">${t("theater.s6_reco_link", lang)}</a>

          <h4>${t("theater.s6_next_title", lang)}</h4>
          <p>${t("theater.s6_next_desc", lang)}</p>
          <a href="${lp}/kabuki/navi/recommend" class="kn-link-btn">${t("theater.s6_recommend_link", lang)}</a>
        </div>
      </div>

    </div><!-- /kn-timeline -->

    <!-- マナーページリンク -->
    <a href="${lp}/kabuki/navi/manners" class="kn-manner-banner">
      <div class="kn-banner-icon">📋</div>
      <div class="kn-banner-text">
        <div class="kn-banner-title">${t("theater.manners_banner_title", lang)}</div>
        <div class="kn-banner-sub">${t("theater.manners_banner_sub", lang)}</div>
      </div>
      <div class="kn-banner-arrow">›</div>
    </a>

    <!-- 地歌舞伎への橋渡し -->
    <div class="kn-bridge-card">
      <h3>${t("theater.bridge_heading", lang)}</h3>
      <p>${t("theater.bridge_text", lang)}</p>
      <a href="/jikabuki/gate/kera" class="kn-bridge-btn">${t("theater.bridge_link", lang)}</a>
    </div>

    <a href="${lp}/kabuki/navi" class="kn-back-link">${t("theater.back_navi", lang)}</a>

<script>
function knStickyOffset() {
  var bar = document.getElementById('kn-progress-bar');
  return bar ? bar.offsetHeight + 8 : 8;
}
function knScrollTo(el) {
  var top = el.getBoundingClientRect().top + window.pageYOffset - knStickyOffset();
  window.scrollTo({ top: top, behavior: 'smooth' });
}
function knOpenStep(n) {
  var card = document.getElementById('kn-step-' + n);
  if (card && !card.classList.contains('open')) card.classList.add('open');
  knUpdateProgressDots();
  setTimeout(function() { knScrollTo(card); }, 50);
}
function knToggleStep(n) {
  for (var i = 1; i <= 6; i++) {
    var c = document.getElementById('kn-step-' + i);
    if (!c) continue;
    if (i === n) { c.classList.toggle('open'); }
    else { c.classList.remove('open'); }
  }
  knUpdateProgressDots();
}
function knUpdateProgressDots() {
  document.querySelectorAll('.kn-progress-dot').forEach(function(dot) {
    var card = document.getElementById('kn-step-' + dot.dataset.step);
    if (card && card.classList.contains('open')) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}
document.querySelectorAll('.kn-progress-dot').forEach(function(dot) {
  dot.addEventListener('click', function() {
    var n = parseInt(dot.dataset.step, 10);
    for (var i = 1; i <= 6; i++) {
      var c = document.getElementById('kn-step-' + i);
      if (!c) continue;
      if (i === n) { c.classList.add('open'); }
      else { c.classList.remove('open'); }
    }
    knUpdateProgressDots();
    var target = document.getElementById('kn-step-' + n);
    if (target) setTimeout(function() { knScrollTo(target); }, 420);
  });
});

window.addEventListener('scroll', function() {
  var active = null;
  for (var i = 1; i <= 6; i++) {
    var el = document.getElementById('kn-step-' + i);
    if (el && el.classList.contains('open')) {
      var rect = el.getBoundingClientRect();
      if (rect.top <= 120) active = i;
    }
  }
  if (active === null) return;
  document.querySelectorAll('.kn-progress-dot').forEach(function(dot) {
    if (parseInt(dot.dataset.step, 10) === active) dot.classList.add('active');
    else dot.classList.remove('active');
  });
}, { passive: true });
</script>
  `;

  const pageUrl = `https://kabukiplus.com${lp}/kabuki/navi/theater`;
  const ogDesc = t("theater.og_desc", lang);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": t("theater.jsonld_name", lang),
    "description": ogDesc,
    "url": pageUrl,
    "step": [
      { "@type": "HowToStep", "name": t("theater.jsonld_step1", lang), "position": 1 },
      { "@type": "HowToStep", "name": t("theater.jsonld_step2", lang), "position": 2 },
      { "@type": "HowToStep", "name": t("theater.jsonld_step3", lang), "position": 3 },
      { "@type": "HowToStep", "name": t("theater.jsonld_step4", lang), "position": 4 },
      { "@type": "HowToStep", "name": t("theater.jsonld_step5", lang), "position": 5 },
      { "@type": "HowToStep", "name": t("theater.jsonld_step6", lang), "position": 6 },
    ],
    "publisher": { "@type": "Organization", "name": "KABUKI PLUS+", "url": "https://kabukiplus.com" },
  };

  return pageShell({
    lang,
    title: t("theater.page_title", lang),
    subtitle: t("theater.page_subtitle", lang),
    bodyHTML,
    activeNav: "navi",
    currentPath: "/kabuki/navi/theater",
    i18nReady: true,
    googleClientId,
    ogDesc,
    ogUrl: pageUrl,
    canonicalUrl: pageUrl,
    headExtra: `
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>
  /* ── 観劇ナビ固有スタイル ── */
  .kn-intro-card {
    background: var(--bg-card);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    padding: 24px 20px;
    margin-bottom: 20px;
    border: 1px solid var(--border-light);
    text-align: center;
  }
  .kn-intro-icon { font-size: 36px; margin-bottom: 8px; }
  .kn-intro-card h2 {
    font-family: 'Noto Serif JP', serif;
    font-size: 18px; font-weight: 700;
    margin-bottom: 12px; color: var(--text-primary);
    line-height: 1.55; letter-spacing: 0.04em;
  }
  .kn-intro-card p { font-size: 13.5px; color: var(--text-secondary); line-height: 2.0; }

  /* ── プログレスバー（sticky固定） ── */
  .kn-progress-bar {
    display: flex; justify-content: center; gap: 6px;
    margin-bottom: 20px; flex-wrap: wrap;
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--bg-page);
    padding: 10px 8px;
    border-bottom: 1px solid var(--border-light);
    margin-left: -16px; margin-right: -16px;
    padding-left: 16px; padding-right: 16px;
  }
  .kn-progress-dot {
    display: flex; align-items: center; gap: 4px;
    font-size: 10.5px; color: var(--text-tertiary);
    background: var(--bg-card); border: 1px solid var(--border-light);
    border-radius: 20px; padding: 4px 10px;
    cursor: pointer; transition: all 0.2s;
    -webkit-tap-highlight-color: transparent;
  }
  .kn-progress-dot:hover, .kn-progress-dot.active {
    background: var(--gold); color: #fff; border-color: var(--gold);
  }
  .kn-dot-num { font-weight: 600; }

  /* ── ハイライトボックス（STEP1冒頭） ── */
  .kn-highlight-box {
    background: linear-gradient(135deg, var(--gold-soft), #fffbf0);
    border: 1.5px solid var(--gold-light);
    border-radius: var(--radius-sm);
    padding: 14px 16px;
    margin-bottom: 18px;
    font-size: 13.5px;
    color: var(--text-primary);
    line-height: 1.8;
  }
  .kn-highlight-label {
    display: inline-block;
    font-size: 10px; font-weight: 700;
    color: var(--gold-dark);
    background: var(--gold-soft);
    border: 1px solid var(--gold-light);
    border-radius: 4px;
    padding: 1px 7px;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }

  .kn-step-card {
    background: var(--bg-card);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-light);
    margin-bottom: 16px; overflow: hidden;
    transition: box-shadow 0.2s;
  }
  .kn-step-header {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 18px;
    background: var(--bg-subtle);
    border-bottom: 1px solid var(--border-light);
    cursor: pointer; user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  .kn-step-number {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 50%;
    background: var(--gold); color: #fff;
    font-family: 'Noto Serif JP', serif;
    font-size: 13px; font-weight: 600; flex-shrink: 0;
  }
  .kn-step-title-area { flex: 1; }
  .kn-step-title {
    font-family: 'Noto Serif JP', serif;
    font-size: 14.5px; font-weight: 600; color: var(--text-primary);
    line-height: 1.3;
  }
  .kn-step-timing {
    font-size: 10.5px; color: var(--text-tertiary);
    margin-top: 2px; letter-spacing: 0.03em;
  }
  .kn-step-toggle { font-size: 16px; color: var(--text-tertiary); transition: transform 0.3s; flex-shrink: 0; }
  .kn-step-card.open .kn-step-toggle { transform: rotate(180deg); }

  .kn-step-body {
    padding: 0 18px; max-height: 0; overflow: hidden;
    transition: max-height 0.4s ease, padding 0.3s ease;
  }
  .kn-step-card.open .kn-step-body { padding: 18px 18px 20px; max-height: 3000px; }

  .kn-step-body h4 {
    font-family: 'Noto Serif JP', serif;
    font-size: 13.5px; font-weight: 600; color: var(--gold-dark);
    margin: 16px 0 8px; padding-bottom: 4px;
    border-bottom: 1px dashed var(--border-light);
  }
  .kn-step-body h4:first-child { margin-top: 0; }
  .kn-step-body p { font-size: 13.5px; color: var(--text-secondary); line-height: 1.9; margin-bottom: 8px; }
  .kn-step-body ul { list-style: none; padding: 0; margin-bottom: 10px; }
  .kn-step-body ul li {
    font-size: 13.5px; color: var(--text-secondary);
    line-height: 1.9; padding-left: 16px; position: relative;
  }
  .kn-step-body ul li::before {
    content: '・'; position: absolute; left: 0; color: var(--gold);
  }

  .kn-info-box {
    background: var(--bg-accent-soft);
    border-radius: var(--radius-sm); padding: 12px 14px;
    margin: 12px 0; font-size: 13px; color: var(--text-secondary);
    line-height: 1.8; border-left: 3px solid var(--gold);
  }
  .kn-info-label {
    font-weight: 600; color: var(--gold-dark);
    font-size: 12px; display: block; margin-bottom: 2px;
  }
  .kn-tip-box {
    background: var(--bg-subtle);
    border-radius: var(--radius-sm); padding: 12px 14px;
    margin: 12px 0; font-size: 13px; color: var(--text-secondary);
    line-height: 1.8; border: 1px solid var(--border-light);
  }
  .kn-tip-box::before { content: '💡 '; }

  .kn-link-btn {
    display: inline-block; font-size: 13px; font-weight: 500;
    color: var(--gold-dark); text-decoration: none;
    background: var(--bg-accent-soft);
    border: 1px solid var(--gold-light);
    border-radius: 20px; padding: 8px 18px; margin-top: 8px;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
  }
  .kn-link-btn:hover {
    background: var(--gold-soft); border-color: var(--gold);
    text-decoration: none; transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(197,162,85,0.2);
  }
  .kn-link-btn-primary {
    display: block; text-align: center;
    background: var(--gold); color: #fff; border-color: var(--gold);
    padding: 11px 20px; border-radius: var(--radius-sm); margin-top: 12px;
    font-size: 13.5px;
  }
  .kn-link-btn-primary:hover {
    background: var(--gold-dark); border-color: var(--gold-dark);
    color: #fff; transform: translateY(-1px);
  }

  .kn-manner-banner {
    display: flex; align-items: center; gap: 10px;
    background: var(--bg-card); border: 1px solid var(--border-light);
    border-radius: var(--radius-sm); padding: 14px 16px;
    margin-top: 20px; text-decoration: none; color: var(--text-primary);
    transition: box-shadow 0.2s;
  }
  .kn-manner-banner:hover { box-shadow: var(--shadow-md); text-decoration: none; }
  .kn-banner-icon { font-size: 24px; }
  .kn-banner-text { flex: 1; }
  .kn-banner-title { font-size: 13.5px; font-weight: 500; }
  .kn-banner-sub { font-size: 11.5px; color: var(--text-tertiary); }
  .kn-banner-arrow { color: var(--text-tertiary); font-size: 20px; }

  .kn-bridge-card {
    background: linear-gradient(135deg, var(--bg-subtle) 0%, var(--gold-soft) 100%);
    border-radius: var(--radius-md); padding: 24px 20px;
    margin-top: 24px; text-align: center; border: 1px solid var(--border-light);
  }
  .kn-bridge-card h3 {
    font-family: 'Noto Serif JP', serif; font-size: 15px; font-weight: 600;
    margin-bottom: 10px;
  }
  .kn-bridge-card p { font-size: 13px; color: var(--text-secondary); line-height: 1.8; margin-bottom: 14px; }
  .kn-bridge-btn {
    display: inline-block; background: var(--gold); color: #fff;
    text-decoration: none; font-size: 13px; font-weight: 500;
    padding: 10px 24px; border-radius: 24px; transition: background 0.2s;
  }
  .kn-bridge-btn:hover { background: var(--gold-dark); text-decoration: none; color: #fff; }

  .kn-back-link {
    display: block; text-align: center; margin-top: 20px;
    font-size: 13px; color: var(--gold-dark); text-decoration: none;
    padding: 12px; border: 1px solid var(--border-light);
    border-radius: var(--radius-sm); background: var(--bg-card);
    transition: background 0.2s;
  }
  .kn-back-link:hover { background: var(--bg-subtle); text-decoration: none; }
</style>`
  });
}
