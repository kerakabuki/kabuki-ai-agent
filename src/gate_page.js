// src/gate_page.js
// =========================================================
// GATE 汎用テンプレート — /jikabuki/gate/:groupId
// 団体情報をセクション単位で条件表示する公開ページ
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";

// ── テーマ定義（CSSカスタムプロパティのオーバーライドセット）──
export const GATE_THEMES = {
  // ── 暖色系（明るい）──
  classic: {
    label: 'クラシック',
    desc: '白地×金（デフォルト）',
    preview: { bg: '#faf7f2', card: '#ffffff', accent: '#c5a255', text: '#1a1208' },
    css: '',
  },
  warm: {
    label: 'ウォーム',
    desc: '暖色・和紙風',
    preview: { bg: '#fdf6eb', card: '#fff9f0', accent: '#c5803a', text: '#2c1a08' },
    css: '--bg-page:#fdf6eb;--bg-card:#fff9f0;--bg-subtle:#f5ead5;--text-primary:#2c1a08;--text-secondary:#7c5a30;--text-tertiary:#a08060;--border-light:#e8d5b5;--border-medium:#d4b896;--gold:#c5803a;--gold-dark:#a05020;--gold-light:#e8a060;--gold-soft:#f5e5c0;',
  },
  sakura: {
    label: '桜',
    desc: '淡いピンク×深紅',
    preview: { bg: '#fdf5f8', card: '#fff9fb', accent: '#c8405a', text: '#2a0818' },
    css: '--bg-page:#fdf5f8;--bg-card:#fff9fb;--bg-subtle:#f5e5ec;--text-primary:#2a0818;--text-secondary:#a05070;--text-tertiary:#c090a8;--border-light:#f0c8d8;--border-medium:#e0a0b8;--gold:#c8405a;--gold-dark:#a82840;--gold-light:#e87090;--gold-soft:#fce0ea;',
  },
  verdant: {
    label: 'ヴェルダント',
    desc: '深緑・自然',
    preview: { bg: '#f0f5f0', card: '#f8faf8', accent: '#4a7838', text: '#1a3020' },
    css: '--bg-page:#f0f5f0;--bg-card:#f8faf8;--bg-subtle:#e2eee2;--text-primary:#1a3020;--text-secondary:#4a6850;--text-tertiary:#7a9880;--border-light:#c0d8c0;--border-medium:#a0c0a0;--gold:#6a9850;--gold-dark:#4a7838;--gold-light:#8ab870;--gold-soft:#d0eac0;',
  },
  // ── ダーク系 ──
  dark: {
    label: 'ダーク',
    desc: '暗め和モダン',
    preview: { bg: '#0f0e18', card: '#1a1826', accent: '#e0b84a', text: '#f0e6c8' },
    css: '--bg-page:#0f0e18;--bg-card:#1a1826;--bg-subtle:#1e1c2e;--text-primary:#f0e6c8;--text-secondary:#b8a88a;--text-tertiary:#6a5d4a;--border-light:rgba(197,162,85,0.14);--border-medium:rgba(197,162,85,0.26);--gold:#c5a255;--gold-dark:#e0b84a;--gold-light:#f0d070;--gold-soft:rgba(197,162,85,0.13);--shadow-sm:0 1px 4px rgba(0,0,0,0.45);--shadow-md:0 4px 16px rgba(0,0,0,0.55);',
  },
  kurenai: {
    label: '紅',
    desc: '歌舞伎の隈取・緋色',
    preview: { bg: '#12040a', card: '#1e0810', accent: '#e8305a', text: '#ffeef4' },
    css: '--bg-page:#12040a;--bg-card:#1e0810;--bg-subtle:#2a1020;--text-primary:#ffeef4;--text-secondary:#ffb8cc;--text-tertiary:#c07080;--border-light:rgba(232,48,90,0.18);--border-medium:rgba(232,48,90,0.35);--gold:#e8305a;--gold-dark:#ff5577;--gold-light:#ff88aa;--gold-soft:rgba(232,48,90,0.15);--shadow-sm:0 1px 4px rgba(0,0,0,0.55);--shadow-md:0 4px 20px rgba(0,0,0,0.65);',
  },
  ai: {
    label: '藍',
    desc: '深夜の藍・江戸紺',
    preview: { bg: '#050c1a', card: '#0a1628', accent: '#5a9fff', text: '#d0e8ff' },
    css: '--bg-page:#050c1a;--bg-card:#0a1628;--bg-subtle:#101e34;--text-primary:#d0e8ff;--text-secondary:#90b8e8;--text-tertiary:#506888;--border-light:rgba(90,159,255,0.16);--border-medium:rgba(90,159,255,0.30);--gold:#5a9fff;--gold-dark:#80b8ff;--gold-light:#b0d4ff;--gold-soft:rgba(90,159,255,0.14);--shadow-sm:0 1px 4px rgba(0,0,0,0.55);--shadow-md:0 4px 20px rgba(0,0,0,0.65);',
  },
  yozakura: {
    label: '夜桜',
    desc: '闇に咲く桜・桜紫',
    preview: { bg: '#0d0812', card: '#180f1e', accent: '#ff6699', text: '#ffe0f0' },
    css: '--bg-page:#0d0812;--bg-card:#180f1e;--bg-subtle:#221530;--text-primary:#ffe0f0;--text-secondary:#e0a0c0;--text-tertiary:#906080;--border-light:rgba(255,102,153,0.16);--border-medium:rgba(255,102,153,0.30);--gold:#ff6699;--gold-dark:#ff88bb;--gold-light:#ffaad0;--gold-soft:rgba(255,102,153,0.14);--shadow-sm:0 1px 4px rgba(0,0,0,0.55);--shadow-md:0 4px 20px rgba(0,0,0,0.65);',
  },
};

export function gatePageHTML(group, extraData = {}) {
  const {
    links = {},
    prefecture = "",
    gateGroups = [],
    currentGroupId = "",
    googleClientId = "",
  } = extraData;

  if (!group) {
    return pageShell({
      title: "GATE",
      subtitle: "団体が見つかりません",
      bodyHTML: `<div class="empty-state">指定された団体は登録されていません。</div>`,
      brand: "jikabuki",
      activeNav: "gate",
    });
  }

  const g = group;
  const name = escHTML(g.name || "");
  const gid = escHTML(g.group_id || currentGroupId);
  const tagline = escHTML(g.tagline || "");
  const desc = (g.description || "").replace(/\n/g, "<br>");
  const prefDisplay = escHTML(prefecture);

  // --- 更新日 / 情報鮮度 ---
  const updatedAt = g.updated_at ? new Date(g.updated_at) : null;
  const daysSinceUpdate = (updatedAt && !isNaN(updatedAt))
    ? Math.floor((Date.now() - updatedAt.getTime()) / 86400000)
    : null;
  let updatedAtText = "";
  if (updatedAt && !isNaN(updatedAt)) {
    const y = updatedAt.getFullYear();
    const m = updatedAt.getMonth() + 1;
    const d = updatedAt.getDate();
    updatedAtText = `${y}年${m}月${d}日`;
  }

  // --- Dropdown ---
  const dropdownOptions = gateGroups.map(gg => {
    const sel = gg.id === currentGroupId ? " selected" : "";
    return `<option value="${escHTML(gg.id)}"${sel}>${escHTML(gg.name)}${gg.prefecture ? "（" + escHTML(gg.prefecture) + "）" : ""}</option>`;
  }).join("");

  const dropdownHTML = gateGroups.length > 1 ? `
    <div class="gate-selector fade-up">
      <label for="gate-group-select" class="gate-selector-label">GATE 登録団体</label>
      <select id="gate-group-select" class="gate-selector-select" onchange="if(this.value)location.href='/jikabuki/gate/'+this.value">
        ${dropdownOptions}
      </select>
    </div>` : "";

  // --- 1. Hero + Description + Next Performance (統合ブロック) ---
  const heroBg = g.hero_image ? ` style="background-image:url('${escHTML(g.hero_image)}');background-size:cover;background-position:center;"` : "";
  const np = g.next_performance;

  let perfInner = "";
  if (np && np.date) {
    perfInner = `
      <h3 class="section-title">次回公演</h3>
      <div class="gate-perf-card" id="gate-next-perf">
        ${np.image ? `<div class="gate-perf-img"><img src="${escHTML(np.image)}" alt="${np.title ? escHTML(np.title) : "公演告知"}" loading="lazy"></div>` : ""}
        ${np.title ? `<div class="gate-perf-title">${escHTML(np.title)}</div>` : ""}
        <div class="gate-perf-meta">
          <span>📅 ${escHTML(np.date)}</span>
          ${np.venue ? `<span>📍 ${escHTML(np.venue)}</span>` : ""}
        </div>
        <div class="gate-perf-badge" id="gate-perf-badge"></div>
        ${np.note ? `<p class="gate-perf-note">${escHTML(np.note)}</p>` : ""}
      </div>`;
  } else {
    perfInner = `
      <h3 class="section-title">次回公演</h3>
      <div class="gate-perf-card gate-perf-card-empty">
        <p class="gate-perf-na">次回公演情報は未登録です</p>
        <p class="gate-perf-cta">情報をお持ちの方は<a href="/jikabuki/base/onboarding">新規団体登録</a>からお知らせください。</p>
      </div>`;
  }

  const heroBlockHTML = `
    <div class="gate-hero-block fade-up">
      <section class="gate-hero${g.hero_image ? " gate-hero-has-bg" : ""}"${heroBg}>
        ${g.hero_image ? `<div class="gate-hero-overlay"></div>` : ""}
        <div class="gate-hero-content">
          <h2 class="gate-hero-name">${name}</h2>
          ${prefDisplay ? `<span class="gate-hero-pref">${prefDisplay}</span>` : ""}
          ${tagline ? `<p class="gate-hero-tagline">${tagline}</p>` : ""}
        </div>
      </section>
      ${desc ? `<div class="gate-desc-inline">${desc}</div>` : ""}
      ${updatedAtText ? `<p class="gate-updated-at">最終更新: ${updatedAtText}</p>` : ""}
      <div class="gate-perf-block">
        ${perfInner}
      </div>
    </div>`;

  // --- 3. Featured Video ---
  const videoUrl = g.featured_video || "";
  let videoHTML = "";
  if (videoUrl) {
    const vidId = extractYouTubeId(videoUrl);
    if (vidId) {
      videoHTML = `
    <section class="gate-section fade-up">
      <h3 class="section-title">おすすめ動画</h3>
      <div class="gate-video-wrap">
        <iframe src="https://www.youtube.com/embed/${escHTML(vidId)}" frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen loading="lazy"></iframe>
      </div>
    </section>`;
    }
  }

  // --- 3.5. 会場・芝居小屋 (client-side for theater_id, server-side for venue) ---
  let venueHTML = "";
  if (g.theater_id) {
    venueHTML = `
    <section class="gate-section fade-up" id="gate-venue-section" style="display:none;">
      <h3 class="section-title">会場・芝居小屋</h3>
      <div id="gate-venue-content"><span class="gate-loading">読み込み中…</span></div>
    </section>`;
  } else if (g.venue && (g.venue.name || g.venue.address)) {
    venueHTML = `
    <section class="gate-section fade-up">
      <h3 class="section-title">会場</h3>
      <div class="gate-venue-card">
        <div class="gate-venue-name">📍 ${escHTML(g.venue.name || "")}</div>
        ${g.venue.address ? `<div class="gate-venue-addr">${escHTML(g.venue.address)}</div>` : ""}
      </div>
    </section>`;
  }

  // --- 3.7. 沿革・公演実績 (History + Past Performances 統合) ---
  let historyInner = "";
  if (g.history && g.history.length) {
    const sortedHistory = g.history.slice().sort((a, b) => (parseInt(a.year) || 0) - (parseInt(b.year) || 0));
    historyInner = `
      <h4 class="gate-sub-title">略歴</h4>
      <div class="gate-hist-list">${sortedHistory.map(h => `
        <div class="gate-hist-item">
          <div class="gate-hist-year">${escHTML(h.year || "")}</div>
          <div class="gate-hist-text">${escHTML(h.text || "")}</div>
        </div>`).join("")}
      </div>`;
  }

  const historyRecordsHTML = `
    <section class="gate-section fade-up">
      <h3 class="section-title">沿革・公演実績</h3>
      ${historyInner}
      ${historyInner ? '<div class="gate-section-divider"></div>' : ""}
      <h4 class="gate-sub-title">公演実績</h4>
      <div id="gate-past"><span class="gate-loading">読み込み中…</span></div>
    </section>`;

  // --- 5. News (client-side) ---
  const newsHTML = `
    <section class="gate-section fade-up">
      <h3 class="section-title">最新ニュース</h3>
      <div id="gate-news"><span class="gate-loading">読み込み中…</span></div>
    </section>`;

  // --- 6. SNS / Links ---
  const allLinks = mergeLinks(g.contact || {}, links);
  let snsHTML = "";
  if (Object.keys(allLinks).length) {
    const linkItems = [];
    if (allLinks.website) linkItems.push({ icon: "🌐", label: "公式サイト", url: allLinks.website });
    if (allLinks.youtube) linkItems.push({ icon: "▶️", label: "YouTube", url: allLinks.youtube });
    if (allLinks.instagram) linkItems.push({ icon: "📷", label: "Instagram", url: allLinks.instagram });
    if (allLinks.x) linkItems.push({ icon: "𝕏", label: "X (Twitter)", url: allLinks.x });
    if (allLinks.facebook) linkItems.push({ icon: "📘", label: "Facebook", url: allLinks.facebook });
    if (allLinks.tiktok) linkItems.push({ icon: "🎵", label: "TikTok", url: allLinks.tiktok });
    if (allLinks.email) linkItems.push({ icon: "📧", label: "メール", url: "mailto:" + allLinks.email });

    if (linkItems.length) {
      const btns = linkItems.map(l =>
        `<a href="${escHTML(l.url)}" target="_blank" rel="noopener" class="gate-sns-btn">${l.icon} ${escHTML(l.label)}</a>`
      ).join("");
      snsHTML = `
    <section class="gate-section fade-up">
      <h3 class="section-title">SNS・リンク</h3>
      <div class="gate-sns-list">${btns}</div>
    </section>`;
    }
  }


  // --- 8. FAQ ---
  const faqTplReplace = (s) => (s || "")
    .replace(/\{団体名\}/g, g.name || "")
    .replace(/\{会場名\}/g, (g.venue && g.venue.name) || "")
    .replace(/\{会場住所\}/g, (g.venue && g.venue.address) || "");

  const answered = g.faq ? g.faq.filter(f => f.a && f.a.trim()) : [];
  let faqHTML = "";
  if (answered.length) {
    {
      const groups = [];
      const groupMap = {};
      answered.forEach(f => {
        const cat = faqTplReplace(f.category || "");
        if (!groupMap[cat]) {
          groupMap[cat] = [];
          groups.push({ cat, items: groupMap[cat] });
        }
        groupMap[cat].push(f);
      });

      const groupsHTML = groups.map(({ cat, items }) => {
        const itemsHTML = items.map(f => `
          <details class="gate-faq-item">
            <summary class="gate-faq-q">${escHTML(faqTplReplace(f.q))}</summary>
            <div class="gate-faq-a">${escHTML(faqTplReplace(f.a)).replace(/\n/g, "<br>")}</div>
          </details>
        `).join("");
        return cat
          ? `<div class="gate-faq-group">
              <h4 class="gate-faq-category">${escHTML(cat)}</h4>
              <div class="gate-faq-list">${itemsHTML}</div>
             </div>`
          : `<div class="gate-faq-list">${itemsHTML}</div>`;
      }).join("");

      faqHTML = `
      <section class="gate-section fade-up">
        <details class="gate-faq-wrap">
          <summary class="section-title gate-faq-summary">よくある質問（${answered.length}件）</summary>
          <div class="gate-faq-groups">${groupsHTML}</div>
        </details>
      </section>`;
    }
  }

  // --- E: けらのすけ FAQウィジェット ---
  const keraFaqData = answered.map(f => ({
    q: faqTplReplace(f.q),
    a: faqTplReplace(f.a),
    cat: faqTplReplace(f.category || ""),
  }));
  const botName = (g.bot_mode === "custom" && g.bot_name) ? escHTML(g.bot_name) : "けらのすけ";
  const botIcon = (g.bot_mode === "custom" && g.bot_icon) ? escHTML(g.bot_icon) : "https://kabukiplus.com/assets/keranosukelogo.png";
  const keraFaqWidgetHTML = answered.length ? `
    <div id="kera-fab-wrap" class="kera-fab-wrap">
      <div id="kera-faq-panel" class="kera-faq-panel" aria-hidden="true">
        <div class="kera-faq-header">
          <div class="kera-faq-header-left">
            <img src="${botIcon}" class="kera-avatar" alt="${botName}">
            <div>
              <div class="kera-faq-name">${botName}</div>
              <div class="kera-faq-sub">よくある質問にお答えします</div>
            </div>
          </div>
          <button class="kera-close-btn" onclick="KeraFaq.toggle()" aria-label="閉じる">×</button>
        </div>
        <div class="kera-faq-body" id="kera-faq-list"></div>
      </div>
      <button class="kera-fab-btn" id="kera-fab-btn" onclick="KeraFaq.toggle()">
        <img src="${botIcon}" class="kera-fab-avatar" alt="${botName}">
        <span class="kera-fab-label">${botName}に聞く</span>
      </button>
    </div>` : "";

  // --- D: 参加申請 ---
  const joinHTML = `
    <section class="gate-section gate-join fade-up" id="gate-join">
      <div id="gate-join-content"></div>
    </section>`;

  // --- E: 掲載申請 ---
  const applyHTML = `
    <section class="gate-section gate-apply fade-up" id="gate-apply">
      <p class="gate-apply-title">団体の方へ</p>
      <p class="gate-apply-text">
        公式サイト（GATE）の作成・稽古スケジュール管理・台本共有などのBASE機能をご利用いただけます。
      </p>
      <a href="/jikabuki/base/onboarding" class="gate-apply-btn">新規団体登録はこちら →</a>
    </section>`;

  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>&rsaquo;</span><a href="/jikabuki/gate">GATE</a><span>&rsaquo;</span>${name}
    </div>
    ${dropdownHTML}
    ${heroBlockHTML}
    ${newsHTML}
    ${videoHTML}
    ${venueHTML}
    ${historyRecordsHTML}
    ${snsHTML}
    ${faqHTML}
    ${joinHTML}
    ${applyHTML}

    <script>
    (function() {
      function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
      var groupName = ${JSON.stringify(g.name || "")};
      var perfDateStr = ${JSON.stringify((np && np.date) || "")};

      /* カウントダウン */
      function parseJpDate(str) {
        if (!str) return null;
        var m;
        m = str.match(/令和\\s*(\\d+)\\s*年\\s*(\\d+)\\s*月\\s*(\\d+)\\s*日/);
        if (m) return new Date(2018 + parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
        m = str.match(/平成\\s*(\\d+)\\s*年\\s*(\\d+)\\s*月\\s*(\\d+)\\s*日/);
        if (m) return new Date(1988 + parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
        m = str.match(/昭和\\s*(\\d+)\\s*年\\s*(\\d+)\\s*月\\s*(\\d+)\\s*日/);
        if (m) return new Date(1925 + parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
        m = str.match(/(\\d{4})\\s*年\\s*(\\d+)\\s*月\\s*(\\d+)\\s*日/);
        if (m) return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
        m = str.match(/(\\d{4})-(\\d{1,2})-(\\d{1,2})/);
        if (m) return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
        return null;
      }

      if (perfDateStr) {
        var target = parseJpDate(perfDateStr);
        var badgeEl = document.getElementById('gate-perf-badge');
        if (target && badgeEl) {
          var now = new Date(); now.setHours(0,0,0,0);
          var diff = Math.ceil((target - now) / 86400000);
          if (diff > 0) {
            badgeEl.innerHTML = '<div class="gate-countdown-card">'
              + '<span class="gate-countdown-num">' + diff + '</span>'
              + '<span class="gate-countdown-label">日後に開幕</span>'
              + '</div>';
          } else if (diff === 0) {
            badgeEl.innerHTML = '<div class="gate-countdown-today">🎭 本日開演！</div>';
          } else {
            badgeEl.innerHTML = '<span class="perf-badge badge-ended">公演終了（次回準備中）</span>';
          }
        }
      }

      /* 公演実績 (group_records) */
      var gid = ${JSON.stringify(gid)};
      fetch('/api/groups/' + gid + '/records')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          var records = (data.records || []).sort(function(a, b) {
            return (parseInt(b.year) || 0) - (parseInt(a.year) || 0);
          });
          var el = document.getElementById('gate-past');
          if (!el) return;
          if (!records.length) {
            el.innerHTML = '<p class="gate-news-empty">公演実績はまだ登録されていません</p>';
            return;
          }
          function renderPerfItem(rec) {
            var year = rec.year || '';
            var datePart = rec.date_display || '';
            var venuePart = rec.venue || '';
            var titlePart = rec.title || '';
            var plays = (rec.plays || []).map(function(p) {
              return '<span class="gate-play">' + esc(p.title || '') + '</span>';
            }).join('');
            var ytBtn = '';
            if (rec.youtube_url) {
              ytBtn = '<a href="' + esc(rec.youtube_url) + '" target="_blank" rel="noopener" class="gate-yt-btn">▶ 動画を見る</a>';
            }
            return '<div class="gate-past-item">'
              + '<div class="gate-past-year">' + esc(String(year)) + '</div>'
              + '<div class="gate-past-body">'
              + '<div class="gate-past-meta">'
              + (datePart ? '<span>📅 ' + esc(datePart) + '</span>' : '')
              + (venuePart ? '<span>📍 ' + esc(venuePart) + '</span>' : '')
              + '</div>'
              + (titlePart ? '<div class="gate-past-title-line">' + esc(titlePart) + '</div>' : '')
              + (plays ? '<div class="gate-past-plays">' + plays + '</div>' : '')
              + ytBtn
              + '</div>'
              + '</div>';
          }
          var recent = records.slice(0, 5);
          var older  = records.slice(5);
          var out = '<div class="gate-past-list">' + recent.map(renderPerfItem).join('') + '</div>';
          if (older.length) {
            out += '<details class="gate-past-more"><summary>過去の公演をもっと見る（' + older.length + '件）</summary>'
              + '<div class="gate-past-list">' + older.map(renderPerfItem).join('') + '</div></details>';
          }
          el.innerHTML = out;
        })
        .catch(function() {
          var el = document.getElementById('gate-past');
          if (el) el.innerHTML = '<p class="gate-news-empty">公演実績の取得に失敗しました</p>';
        });

      /* ニュース */
      fetch('/api/news?feedKey=jikabuki')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          var articles = (data.articles || []).filter(function(a) {
            return (a.title || '').indexOf(groupName) !== -1;
          }).slice(0, 5);
          var el = document.getElementById('gate-news');
          if (!el) return;
          if (!articles.length) {
            el.innerHTML = '<p class="gate-news-empty">関連ニュースはありません</p>';
            return;
          }
          el.innerHTML = articles.map(function(a) {
            var d = a.pubTs ? new Date(a.pubTs) : null;
            var date = d ? d.getFullYear() + '/' + (d.getMonth()+1) + '/' + d.getDate() : '';
            return '<a href="' + esc(a.link||'#') + '" target="_blank" rel="noopener" class="gate-news-item">'
              + '<span class="gate-news-title">' + esc(a.title||'') + '</span>'
              + '<span class="gate-news-meta">'
              + (date ? '<time>' + esc(date) + '</time>' : '')
              + (a.source ? '<span>' + esc(a.source) + '</span>' : '')
              + '</span>'
              + '</a>';
          }).join('');
        })
        .catch(function() {
          var el = document.getElementById('gate-news');
          if (el) el.innerHTML = '<p class="gate-news-empty">ニュースの取得に失敗しました</p>';
        });

      /* 芝居小屋 (theater_id) */
      var theaterId = ${JSON.stringify(g.theater_id || "")};
      if (theaterId) {
        fetch('/api/theaters')
          .then(function(r) { return r.json(); })
          .then(function(data) {
            var theaters = data.theaters || [];
            var t = theaters.find(function(x) { return x.id === theaterId; });
            var section = document.getElementById('gate-venue-section');
            var content = document.getElementById('gate-venue-content');
            if (!t || !section || !content) return;
            section.style.display = '';
            var badges = [];
            if (t.has_hanamichi) badges.push('花道あり');
            if (t.visitable) badges.push('見学可');
            if (t.cultural_property) badges.push(esc(t.cultural_property));
            if (t.capacity) badges.push('収容 ' + t.capacity + ' 名');
            content.innerHTML = '<div class="gate-theater-card">'
              + (t.photo_url ? '<div class="gate-theater-photo"><img src="' + esc(t.photo_url) + '" alt="' + esc(t.name) + '" loading="lazy"></div>' : '')
              + '<div class="gate-theater-info">'
              + '<div class="gate-theater-name">' + esc(t.name) + '</div>'
              + (t.location ? '<div class="gate-theater-location">' + esc(t.location) + '</div>' : '')
              + (badges.length ? '<div class="gate-theater-badges">' + badges.map(function(b) { return '<span class="gate-theater-badge">' + b + '</span>'; }).join('') + '</div>' : '')
              + (t.description ? '<p class="gate-theater-desc">' + esc(t.description) + '</p>' : '')
              + '</div></div>';
          });
      }

      /* けらのすけ FAQウィジェット */
      var KERA_FAQ = ${JSON.stringify(keraFaqData)};
      if (KERA_FAQ.length) {
        var keraOpen = false;
        var keraInited = false;
        function keraInit() {
          if (keraInited) return;
          keraInited = true;
          var list = document.getElementById('kera-faq-list');
          if (!list) return;

          /* カテゴリ別にグループ化 */
          var catMap = {};
          var catOrder = [];
          KERA_FAQ.forEach(function(f) {
            var cat = f.cat || '';
            if (!catMap[cat]) { catMap[cat] = []; catOrder.push(cat); }
            catMap[cat].push(f);
          });

          var hasMultipleCats = catOrder.length > 1;
          if (hasMultipleCats) {
            /* カテゴリボタン → data-cat属性でカテゴリ名を渡す */
            list.innerHTML = '<div class="kera-cat-list" id="kera-cat-list">'
              + catOrder.map(function(cat) {
                  return '<button class="kera-cat-btn" data-cat="' + esc(cat) + '">'
                    + '<span class="kera-cat-label">' + esc(cat || 'よくある質問') + '</span>'
                    + '<span class="kera-cat-arrow">›</span>'
                    + '</button>';
                }).join('')
              + '</div>'
              + '<div class="kera-qa-list" id="kera-qa-list" style="display:none;">'
              + '<button class="kera-back-btn" id="kera-back-btn">‹ カテゴリに戻る</button>'
              + '<div id="kera-qa-items"></div>'
              + '</div>';

            /* イベント委譲でボタンクリックを処理 */
            list.addEventListener('click', function(e) {
              var catBtn = e.target.closest('.kera-cat-btn');
              var backBtn = e.target.closest('.kera-back-btn');
              if (catBtn) KeraFaq.showCat(catBtn.dataset.cat);
              if (backBtn) KeraFaq.showCats();
            });
          } else {
            /* カテゴリが1つ以下 → フラット表示 */
            list.innerHTML = KERA_FAQ.map(function(f, i) {
              return '<details class="kera-item" id="kera-item-' + i + '">'
                + '<summary class="kera-q">' + esc(f.q) + '</summary>'
                + '<div class="kera-a">' + esc(f.a).replace(/\\n/g, '<br>') + '</div>'
                + '</details>';
            }).join('');
          }

          window.KeraFaq.showCat = function(cat) {
            var items = catMap[cat] || [];
            var qaItems = document.getElementById('kera-qa-items');
            if (qaItems) {
              qaItems.innerHTML = items.map(function(f, i) {
                return '<details class="kera-item">'
                  + '<summary class="kera-q">' + esc(f.q) + '</summary>'
                  + '<div class="kera-a">' + esc(f.a).replace(/\\n/g, '<br>') + '</div>'
                  + '</details>';
              }).join('');
            }
            var catList = document.getElementById('kera-cat-list');
            var qaList = document.getElementById('kera-qa-list');
            if (catList) catList.style.display = 'none';
            if (qaList) qaList.style.display = 'block';
          };
          window.KeraFaq.showCats = function() {
            var catList = document.getElementById('kera-cat-list');
            var qaList = document.getElementById('kera-qa-list');
            if (catList) catList.style.display = '';
            if (qaList) qaList.style.display = 'none';
          };
        }
        window.KeraFaq = {
          toggle: function() {
            keraOpen = !keraOpen;
            var panel = document.getElementById('kera-faq-panel');
            var fab = document.getElementById('kera-fab-btn');
            if (!panel) return;
            if (keraOpen) {
              keraInit();
              panel.style.display = 'block';
              panel.setAttribute('aria-hidden', 'false');
              if (fab) fab.classList.add('kera-fab-open');
            } else {
              panel.style.display = 'none';
              panel.setAttribute('aria-hidden', 'true');
              if (fab) fab.classList.remove('kera-fab-open');
            }
          }
        };
      }

      /* ── 参加申請ウィジェット ── */
      (function() {
        var JOIN_GID = ${JSON.stringify(gid)};
        var JOIN_GROUP_NAME = ${JSON.stringify(g.name || "")};
        var SS_KEY = 'gate_join_requested:' + JOIN_GID;

        function renderJoin(state, extra) {
          var el = document.getElementById('gate-join-content');
          if (!el) return;
          var html = '';
          if (state === 'member') {
            html = '<div class="gate-join-member">'
              + '<span class="gate-join-member-icon">✓</span>'
              + '<div>'
              + '<div class="gate-join-member-text">' + esc(JOIN_GROUP_NAME) + ' のメンバーです</div>'
              + '<a href="/jikabuki/base" class="gate-join-base-link">BASE で活動する →</a>'
              + '</div>'
              + '</div>';
          } else if (state === 'requested') {
            html = '<div class="gate-join-status">'
              + '<span class="gate-join-status-icon">⏳</span>'
              + '<span>参加申請済み（承認待ち）</span>'
              + '</div>';
          } else if (state === 'can-join') {
            html = '<div class="gate-join-prompt">'
              + '<p class="gate-join-prompt-text">' + esc(JOIN_GROUP_NAME) + ' に参加して、稽古・台本・スケジュール管理を利用しませんか？</p>'
              + '<button class="gate-join-btn" id="gate-join-btn" onclick="window.__gateJoin()">この団体に参加申請する</button>'
              + '</div>';
          } else if (state === 'not-logged-in') {
            html = '<div class="gate-join-prompt">'
              + '<p class="gate-join-prompt-text">' + esc(JOIN_GROUP_NAME) + ' に参加して、稽古・台本・スケジュール管理を利用しませんか？</p>'
              + '<button class="gate-join-btn" onclick="openLoginModal()">ログインして参加申請する</button>'
              + '</div>';
          } else if (state === 'success') {
            html = '<div class="gate-join-status gate-join-status-ok">'
              + '<span class="gate-join-status-icon">✓</span>'
              + '<span>参加申請を送りました。マネージャーの承認をお待ちください。</span>'
              + '</div>';
          } else if (state === 'error') {
            html = '<div class="gate-join-status gate-join-status-err">'
              + '<span>申請に失敗しました。しばらくしてから再度お試しください。</span>'
              + '</div>';
          }
          el.innerHTML = html;
        }

        window.__gateJoin = function() {
          var btn = document.getElementById('gate-join-btn');
          if (btn) { btn.disabled = true; btn.textContent = '送信中…'; }
          fetch('/api/groups/' + JOIN_GID + '/members/join', { method: 'POST', credentials: 'same-origin' })
            .then(function(r) { return r.json(); })
            .then(function(data) {
              if (data.status === 'already_member') {
                renderJoin('member');
              } else if (data.status === 'already_requested') {
                sessionStorage.setItem(SS_KEY, '1');
                renderJoin('requested');
              } else if (data.ok) {
                sessionStorage.setItem(SS_KEY, '1');
                renderJoin('success');
              } else {
                renderJoin('error');
              }
            })
            .catch(function() { renderJoin('error'); });
        };

        fetch('/api/auth/me', { credentials: 'same-origin' })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (!data.loggedIn || !data.user) {
              renderJoin('not-logged-in');
              return;
            }
            var groups = data.user.groups || [];
            var isMember = groups.some(function(g) { return g.groupId === JOIN_GID; });
            if (isMember) {
              renderJoin('member');
              return;
            }
            if (sessionStorage.getItem(SS_KEY)) {
              renderJoin('requested');
              return;
            }
            renderJoin('can-join');
          })
          .catch(function() { renderJoin('not-logged-in'); });
      })();
    })();
    </script>
  `;

  const themeId = g.theme_id || 'classic';
  const themeCSS = (GATE_THEMES[themeId] || GATE_THEMES.classic).css;
  // headExtra より後に BASE_CSS の :root が来るため、テーマCSSは bodyHTML の先頭に挿入して優先させる
  const themeCSSTag = themeCSS ? `<style>:root{${themeCSS}}</style>` : '';

  return pageShell({
    title: name,
    subtitle: "GATE",
    bodyHTML: themeCSSTag + bodyHTML,
    overlayHTML: keraFaqWidgetHTML,
    activeNav: "gate",
    brand: "jikabuki",
    googleClientId,
    ogTitle: name + " | GATE | JIKABUKI PLUS+",
    ogDesc: tagline || (name + "の公式ページ。次回公演・ニュース・SNS・アクセス情報をまとめています。"),
    headExtra: `<style>${GATE_CSS}</style>`,
  });
}

function extractYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function mergeLinks(contact, r2Links) {
  const merged = {};
  if (contact.website) merged.website = contact.website;
  if (contact.youtube) merged.youtube = contact.youtube;
  if (contact.instagram) merged.instagram = contact.instagram;
  if (contact.email) merged.email = contact.email;
  if (contact.x) merged.x = contact.x;
  if (contact.facebook) merged.facebook = contact.facebook;
  if (contact.tiktok) merged.tiktok = contact.tiktok;

  if (r2Links.website && !merged.website) merged.website = r2Links.website;
  if (r2Links.youtube && !merged.youtube) merged.youtube = r2Links.youtube;
  if (r2Links.instagram && !merged.instagram) merged.instagram = r2Links.instagram;
  if (r2Links.x && !merged.x) merged.x = r2Links.x;
  if (r2Links.facebook && !merged.facebook) merged.facebook = r2Links.facebook;
  if (r2Links.tiktok && !merged.tiktok) merged.tiktok = r2Links.tiktok;

  return merged;
}

const GATE_CSS = `
/* ── GATE Selector ── */
.gate-selector {
  display: flex; align-items: center; gap: 0.7rem;
  margin-bottom: 1.2rem; flex-wrap: wrap;
}
.gate-selector-label {
  font-size: 0.82rem; font-weight: 600;
  color: var(--gold-dark); letter-spacing: 1px; white-space: nowrap;
}
.gate-selector-select {
  flex: 1; min-width: 180px; max-width: 360px;
  padding: 8px 12px; border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm); font-size: 0.92rem;
  font-family: inherit; background: var(--bg-card);
  color: var(--text-primary); cursor: pointer;
  transition: border-color 0.2s;
}
.gate-selector-select:focus {
  outline: none; border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(197,162,85,0.1);
}

/* ── Hero Block (統合) ── */
.gate-hero-block {
  margin-bottom: 2rem;
}
.gate-hero {
  text-align: center; padding: 1.5rem 1rem 1.8rem;
  border-bottom: 1px solid var(--border-light);
  position: relative; overflow: hidden;
}
.gate-hero-has-bg {
  min-height: 280px;
  padding: 2.5rem 1rem 3rem;
  border-bottom: none;
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
}
@media(min-width:600px){ .gate-hero-has-bg { min-height: 340px; } }
.gate-desc-inline {
  font-size: 0.93rem; line-height: 2;
  color: var(--text-secondary); padding: 1rem 0.3rem 0;
}
.gate-perf-block { margin-top: 1.2rem; }
.gate-hero-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.6));
  z-index: 0;
}
.gate-hero-content { position: relative; z-index: 1; }
.gate-hero-has-bg .gate-hero-name { color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,0.5); }
.gate-hero-has-bg .gate-hero-pref { background: rgba(255,255,255,0.2); color: rgba(255,255,255,0.9); }
.gate-hero-has-bg .gate-hero-tagline { color: rgba(255,255,255,0.85); }
.gate-hero-name {
  font-family: 'Noto Serif JP', serif;
  font-size: clamp(1.4rem, 5vw, 1.8rem); font-weight: 700;
  color: var(--text-primary); letter-spacing: 0.12em;
}
.gate-hero-pref {
  display: inline-block; margin-top: 0.4rem;
  font-size: 0.78rem; padding: 2px 10px;
  border-radius: 10px; background: var(--bg-subtle);
  color: var(--text-secondary); letter-spacing: 0.5px;
}
.gate-hero-tagline {
  margin-top: 0.6rem; font-size: 0.95rem;
  color: var(--text-secondary); letter-spacing: 0.06em;
}

/* ── Section ── */
.gate-section { margin-bottom: 2rem; }
.gate-sub-title {
  font-size: 0.82rem; font-weight: 700; letter-spacing: 0.06em;
  color: var(--gold-dark); margin: 0 0 0.6rem;
}
.gate-section-divider {
  border: none; border-top: 1px solid var(--border-light);
  margin: 1.2rem 0;
}

/* ── Next Performance ── */
.gate-perf-card {
  background: var(--bg-card); border: 1px solid var(--border-light);
  border-radius: var(--radius-md); overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.gate-perf-img img {
  width: 100%; max-height: 260px; object-fit: cover; display: block;
}
.gate-perf-card .gate-perf-title,
.gate-perf-card .gate-perf-meta,
.gate-perf-card .gate-perf-badge,
.gate-perf-card .gate-perf-note,
.gate-perf-card .gate-perf-na,
.gate-perf-card .gate-perf-cta { padding-left: 1.4rem; padding-right: 1.4rem; }
.gate-perf-card .gate-perf-title { padding-top: 1.1rem; }
.gate-perf-card .gate-perf-badge:last-child,
.gate-perf-card .gate-perf-meta:last-child,
.gate-perf-card .gate-perf-cta:last-child { padding-bottom: 1.2rem; }
.gate-perf-card-empty { text-align: center; padding: 1.2rem 1.4rem; }
.gate-perf-title {
  font-family: 'Noto Serif JP', serif;
  font-size: 1.05rem; font-weight: 700; margin-bottom: 0.5rem;
}
.gate-perf-meta {
  display: flex; flex-wrap: wrap; gap: 0.4rem 1rem;
  font-size: 0.9rem; color: var(--text-secondary);
}
.gate-perf-badge { margin-top: 0.5rem; }
.gate-countdown-card {
  display: flex; align-items: baseline; gap: 0.5rem;
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%);
  border: 1px solid #a5d6a7; border-radius: var(--radius-md);
  padding: 0.85rem 1rem; box-shadow: 0 2px 8px rgba(46,125,50,0.08);
}
.gate-countdown-num {
  font-family: 'Noto Serif JP', serif;
  font-size: clamp(2rem, 7vw, 2.8rem);
  font-weight: 700; color: #2e7d32;
  line-height: 1; letter-spacing: -0.02em;
}
.gate-countdown-label {
  font-size: 1rem; font-weight: 600;
  color: #388e3c; letter-spacing: 0.06em;
}
.gate-countdown-today {
  background: #fff3e0; color: #e65100;
  border: 1px solid #ffcc80; border-radius: var(--radius-md);
  padding: 0.85rem 1rem; font-size: 1.05rem; font-weight: 700;
  text-align: center; letter-spacing: 0.06em;
  box-shadow: 0 2px 8px rgba(230,81,0,0.08);
}
.gate-perf-note {
  margin-top: 0.7rem; font-size: 0.85rem;
  color: var(--text-secondary); line-height: 1.7;
}
.gate-perf-na { color: var(--text-tertiary); font-size: 0.9rem; margin: 0 0 0.3rem; }
.gate-perf-cta { font-size: 0.82rem; color: var(--text-tertiary); margin: 0; }
.gate-perf-cta a { color: var(--gold-dark); }

.perf-badge {
  display: inline-block; font-size: 0.72rem; font-weight: 700;
  padding: 3px 10px; border-radius: 10px;
}
.badge-upcoming { background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; }
.badge-today    { background: #fff3e0; color: #e65100; border: 1px solid #ffcc80; }
.badge-ended    { background: #f3f3f3; color: #777; border: 1px solid #ccc; }

/* ── Featured Video ── */
.gate-video-wrap {
  position: relative; width: 100%; padding-bottom: 56.25%;
  border-radius: var(--radius-md); overflow: hidden;
  background: #000; box-shadow: var(--shadow-md);
}
.gate-video-wrap iframe {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%; border: 0;
}

/* ── Theater (芝居小屋) ── */
.gate-theater-card {
  background: var(--bg-card); border: 1px solid var(--border-light);
  border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-sm);
}
.gate-theater-photo {
  width: 100%; max-height: 280px; overflow: hidden;
}
.gate-theater-photo img {
  width: 100%; height: 100%; object-fit: cover; display: block;
}
.gate-theater-info { padding: 1.2rem 1.4rem; }
.gate-theater-name {
  font-family: 'Noto Serif JP', serif;
  font-size: 1.1rem; font-weight: 700; margin-bottom: 0.3rem;
}
.gate-theater-location {
  font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;
}
.gate-theater-badges {
  display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.6rem;
}
.gate-theater-badge {
  display: inline-block; font-size: 0.72rem; font-weight: 600;
  padding: 3px 10px; border-radius: 10px;
  background: var(--bg-subtle); color: var(--gold-dark);
  border: 1px solid var(--border-light);
}
.gate-theater-desc {
  font-size: 0.9rem; line-height: 1.8; color: var(--text-secondary); margin: 0;
}

/* ── Venue (手入力会場) ── */
.gate-venue-card {
  background: var(--bg-card); border: 1px solid var(--border-light);
  border-radius: var(--radius-md); padding: 16px 20px;
  box-shadow: var(--shadow-sm);
}
.gate-venue-name {
  font-family: 'Noto Serif JP', serif;
  font-size: 0.95rem; font-weight: 600; margin-bottom: 4px;
}
.gate-venue-addr {
  font-size: 0.85rem; color: var(--text-secondary);
}

/* ── History (略歴) ── */
.gate-hist-list { display: flex; flex-direction: column; gap: 0; }
.gate-hist-item {
  display: flex; gap: 0.8rem; padding: 0.55rem 0;
  border-bottom: 1px solid var(--border-light);
}
.gate-hist-item:last-child { border-bottom: none; }
.gate-hist-year {
  flex-shrink: 0; width: 3rem; text-align: center;
  font-family: 'Noto Serif JP', serif; font-size: 0.9rem;
  font-weight: 700; color: var(--gold-dark);
}
.gate-hist-text { font-size: 0.88rem; color: var(--text-primary); }

/* ── Past Performances ── */
.gate-past-list { display: flex; flex-direction: column; gap: 0; }
.gate-past-item {
  display: flex; gap: 0.8rem; padding: 0.7rem 0;
  border-bottom: 1px solid var(--border-light);
}
.gate-past-item:last-child { border-bottom: none; }
.gate-past-year {
  flex-shrink: 0; width: 3rem; text-align: center;
  font-family: 'Noto Serif JP', serif; font-size: 0.95rem;
  font-weight: 700; color: var(--gold-dark);
  padding-top: 2px;
}
.gate-past-body { flex: 1; min-width: 0; }
.gate-past-meta {
  display: flex; flex-wrap: wrap; gap: 0.2rem 0.8rem;
  font-size: 0.82rem; color: var(--text-secondary);
}
.gate-past-title-text { font-weight: 600; }
.gate-past-title-line {
  font-size: 0.85rem; font-weight: 600; margin-top: 0.2rem;
  color: var(--text-primary);
}
.gate-past-plays {
  margin-top: 0.3rem; display: flex; flex-wrap: wrap; gap: 0.3rem;
}
.gate-play {
  display: inline-block; font-size: 0.78rem;
  padding: 2px 8px; border-radius: 6px;
  background: var(--bg-subtle); color: var(--text-secondary);
}
.gate-yt-btn {
  display: inline-block; margin-top: 0.4rem;
  font-size: 0.78rem; padding: 3px 10px; border-radius: 6px;
  background: #c0392b; color: #fff; text-decoration: none;
  transition: opacity .2s;
}
.gate-yt-btn:hover { opacity: 0.85; }
.gate-past-more { margin-top: 0.5rem; }
.gate-past-more summary {
  cursor: pointer; font-size: 0.85rem; color: var(--gold-dark);
  padding: 0.4rem 0; user-select: none;
}
.gate-past-more summary:hover { text-decoration: underline; }
.gate-past-more .gate-past-list { margin-top: 0.3rem; }

/* ── News ── */
.gate-loading { font-size: 0.85rem; color: var(--text-tertiary); }
.gate-news-empty { font-size: 0.85rem; color: var(--text-tertiary); margin: 0; }
.gate-news-item {
  display: flex; flex-direction: column; gap: 0.15rem;
  padding: 0.6rem 0; border-bottom: 1px solid var(--border-light);
  text-decoration: none; color: inherit; transition: opacity 0.15s;
}
.gate-news-item:last-child { border-bottom: none; }
.gate-news-item:hover { opacity: 0.7; }
.gate-news-title {
  font-size: 0.9rem; color: var(--text-primary); line-height: 1.5;
}
.gate-news-meta {
  display: flex; gap: 0.6rem; font-size: 0.75rem;
  color: var(--text-tertiary);
}

/* ── SNS ── */
.gate-sns-list {
  display: flex; flex-wrap: wrap; gap: 0.5rem;
}
.gate-sns-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: var(--radius-sm);
  background: var(--bg-card); border: 1px solid var(--border-light);
  font-size: 0.88rem; color: var(--text-primary);
  text-decoration: none; transition: all 0.15s;
  box-shadow: var(--shadow-sm);
}
.gate-sns-btn:hover {
  border-color: var(--gold); box-shadow: var(--shadow-md);
  text-decoration: none; transform: translateY(-1px);
}

/* ── FAQ ── */
.gate-faq-wrap { }
.gate-faq-summary {
  cursor: pointer; user-select: none;
  list-style: none; display: flex; align-items: center; gap: 0.5rem;
}
.gate-faq-summary::-webkit-details-marker { display: none; }
.gate-faq-summary::before {
  content: '▶'; font-size: 0.6rem; color: var(--gold-dark);
  transition: transform 0.2s; flex-shrink: 0;
}
.gate-faq-wrap[open] .gate-faq-summary::before { transform: rotate(90deg); }
.gate-faq-wrap .gate-faq-groups { margin-top: 1rem; }
.gate-faq-groups { display: flex; flex-direction: column; gap: 1.5rem; }
.gate-faq-group {}
.gate-faq-category {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--gold-dark);
  text-transform: uppercase;
  margin: 0 0 0.5rem;
  padding: 4px 10px;
  background: var(--gold-soft, #f5edd8);
  border-left: 3px solid var(--gold);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}
.gate-faq-list { display: flex; flex-direction: column; gap: 0.5rem; }
.gate-faq-item {
  background: var(--bg-card); border: 1px solid var(--border-light);
  border-radius: var(--radius-md); overflow: hidden;
  box-shadow: var(--shadow-sm); transition: border-color 0.2s;
}
.gate-faq-item[open] { border-color: var(--gold-light); }
.gate-faq-q {
  padding: 14px 16px; cursor: pointer;
  font-size: 0.92rem; font-weight: 600; color: var(--text-primary);
  list-style: none; display: flex; align-items: center; gap: 0.5rem;
}
.gate-faq-q::-webkit-details-marker { display: none; }
.gate-faq-q::before {
  content: '▶'; font-size: 0.55rem; color: var(--gold-dark);
  transition: transform 0.2s; flex-shrink: 0;
}
.gate-faq-item[open] .gate-faq-q::before { transform: rotate(90deg); }
.gate-faq-a {
  padding: 0 16px 14px; font-size: 0.88rem;
  color: var(--text-secondary); line-height: 1.8;
}

/* ── Subpages ── */
.gate-subpages { display: flex; flex-direction: column; gap: 0.5rem; }
.gate-subpage-card {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; background: var(--bg-card);
  border: 1px solid var(--border-light); border-radius: var(--radius-md);
  text-decoration: none; color: var(--text-primary);
  transition: all 0.15s; box-shadow: var(--shadow-sm);
}
.gate-subpage-card:hover {
  border-color: var(--gold); box-shadow: var(--shadow-md);
  text-decoration: none; transform: translateY(-1px);
}
.gate-subpage-icon { font-size: 1.2rem; flex-shrink: 0; }
.gate-subpage-title { font-size: 0.92rem; font-weight: 600; }
.gate-subpage-desc { font-size: 0.78rem; color: var(--text-tertiary); margin-top: 2px; }
.gate-subpage-arrow {
  color: var(--text-tertiary); margin-left: auto; font-size: 1rem; flex-shrink: 0;
}
.gate-subpage-card:hover .gate-subpage-arrow { color: var(--gold); }

/* ── Join (参加申請) ── */
.gate-join {
  padding: 1.2rem 1.4rem;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
}
.gate-join-prompt-text {
  margin: 0 0 0.75rem; font-size: 0.9rem;
  color: var(--text-secondary); line-height: 1.65;
}
.gate-join-btn {
  display: inline-block; padding: 9px 24px; border-radius: 20px;
  background: var(--gold-dark); color: #fff;
  border: none; font-size: 0.9rem; font-weight: 600;
  font-family: inherit; cursor: pointer; transition: opacity 0.2s;
}
.gate-join-btn:hover { opacity: 0.85; }
.gate-join-btn:disabled { opacity: 0.5; cursor: default; }
.gate-join-status {
  display: flex; align-items: center; gap: 8px;
  font-size: 0.9rem; color: var(--text-secondary);
}
.gate-join-status-ok { color: #27ae60; }
.gate-join-status-err { color: #c0392b; }
.gate-join-status-icon { font-size: 1.1rem; flex-shrink: 0; }
.gate-join-member {
  display: flex; align-items: center; gap: 12px;
}
.gate-join-member-icon {
  font-size: 1.4rem; color: #27ae60; flex-shrink: 0;
  width: 36px; height: 36px; border-radius: 50%;
  background: #eafaf1; display: flex; align-items: center; justify-content: center;
}
.gate-join-member-text {
  font-size: 0.9rem; font-weight: 700; color: var(--text-primary);
}
.gate-join-base-link {
  display: inline-block; margin-top: 4px;
  font-size: 0.85rem; color: var(--gold-dark);
  text-decoration: none; font-weight: 600;
}
.gate-join-base-link:hover { text-decoration: underline; }

/* ── Apply (掲載申請) ── */
.gate-apply {
  text-align: center; padding: 1.2rem 1.4rem;
  background: var(--bg-subtle); border: 1px dashed var(--border-medium);
  border-radius: var(--radius-md);
}
.gate-apply-title {
  font-weight: 700; font-size: 0.9rem;
  color: var(--text-primary); margin: 0 0 0.3rem;
}
.gate-apply-text {
  margin: 0 0 0.75rem; font-size: 0.85rem;
  color: var(--text-secondary); line-height: 1.65;
}
.gate-apply-btn {
  display: inline-block; padding: 8px 22px; border-radius: 20px;
  background: var(--gold-dark); color: #fff; text-decoration: none;
  font-size: 0.88rem; font-weight: 600; transition: opacity 0.2s;
}
.gate-apply-btn:hover { opacity: 0.85; text-decoration: none; color: #fff; }

/* ── けらのすけ FAQウィジェット ── */
.kera-fab-wrap {
  position: fixed; bottom: calc(64px + env(safe-area-inset-bottom, 0px)); right: 16px; z-index: 9999;
  display: flex; flex-direction: column; align-items: flex-end; gap: 8px;
}
.kera-faq-panel {
  display: none;
  width: 300px; max-height: 60vh; overflow-y: auto;
  background: #fff; border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.20);
  border: 1px solid rgba(197,162,85,0.35);
}
.kera-faq-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px;
  background: linear-gradient(135deg, #1a1a2e 0%, #252028 100%);
  border-radius: 14px 14px 0 0;
  border-bottom: 1px solid rgba(197,162,85,0.3);
  position: sticky; top: 0;
}
.kera-faq-header-left { display: flex; align-items: center; gap: 10px; }
.kera-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid #c5a255; flex-shrink: 0; }
.kera-faq-name { font-size: 0.88rem; font-weight: 700; color: #e0b84a; }
.kera-faq-sub { font-size: 0.72rem; color: rgba(255,255,255,0.65); margin-top: 1px; }
.kera-close-btn {
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,0.55); font-size: 1.3rem; line-height: 1;
  padding: 2px 6px; border-radius: 4px; transition: color 0.15s;
}
.kera-close-btn:hover { color: #fff; }
.kera-faq-body { padding: 8px; display: flex; flex-direction: column; gap: 5px; }
.kera-cat-list { display: flex; flex-direction: column; gap: 5px; }
.kera-cat-btn {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; padding: 11px 14px;
  background: #fafaf8; border: 1px solid #ede7d3; border-radius: 8px;
  cursor: pointer; text-align: left; transition: border-color 0.18s, background 0.18s;
  font-family: inherit;
}
.kera-cat-btn:hover { border-color: #c5a255; background: #fdf8ef; }
.kera-cat-label { font-size: 0.85rem; font-weight: 600; color: #2c2c2c; }
.kera-cat-arrow { font-size: 1.1rem; color: #c5a255; line-height: 1; }
.kera-back-btn {
  display: flex; align-items: center; gap: 4px;
  background: none; border: none; cursor: pointer;
  font-size: 0.82rem; color: #c5a255; font-weight: 600;
  padding: 4px 2px 8px; font-family: inherit;
}
.kera-back-btn:hover { color: #a07a2a; }
.kera-qa-list { display: flex; flex-direction: column; }
.kera-item {
  background: #fafaf8; border: 1px solid #ede7d3;
  border-radius: 8px; overflow: hidden; transition: border-color 0.2s;
}
.kera-item[open] { border-color: #c5a255; }
.kera-q {
  padding: 10px 12px; cursor: pointer;
  font-size: 0.84rem; font-weight: 600; color: #2c2c2c;
  list-style: none; display: flex; align-items: flex-start; gap: 6px; line-height: 1.45;
}
.kera-q::-webkit-details-marker { display: none; }
.kera-q::before {
  content: '▶'; font-size: 0.5rem; color: #c5a255;
  flex-shrink: 0; margin-top: 4px; transition: transform 0.2s;
}
.kera-item[open] .kera-q::before { transform: rotate(90deg); }
.kera-a {
  padding: 8px 12px 10px; font-size: 0.82rem;
  color: #555; line-height: 1.7;
  border-top: 1px solid #f0e8cc;
}
.kera-fab-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 18px; border-radius: 28px;
  background: linear-gradient(135deg, #1a1a2e, #252028);
  border: 2px solid #c5a255; cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,0.28);
  transition: transform 0.2s, box-shadow 0.2s;
  font-family: inherit;
}
.kera-fab-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 22px rgba(0,0,0,0.35); }
.kera-fab-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.kera-fab-label { font-size: 0.88rem; font-weight: 700; color: #e0b84a; white-space: nowrap; }
@media (max-width: 400px) {
  .kera-faq-panel { width: calc(100vw - 32px); }
}

/* ── GATE Top ── */
.gate-top-hero {
  text-align: center; padding: 1.8rem 1rem 1.5rem;
  border-bottom: 1px solid var(--border-light); margin-bottom: 1.5rem;
}
.gate-top-title {
  font-family: 'Noto Serif JP', serif;
  font-size: clamp(1.3rem, 4vw, 1.7rem); font-weight: 700;
  color: var(--text-primary); letter-spacing: 0.12em;
}
.gate-top-lead {
  margin-top: 0.5rem; font-size: 0.92rem;
  color: var(--text-secondary); line-height: 1.7;
}
.gate-top-grid {
  display: flex; flex-direction: column; gap: 1rem;
  margin-bottom: 2rem;
}
.gate-top-card {
  display: block; text-decoration: none; color: inherit;
  background: var(--bg-card); border: 1px solid var(--border-light);
  border-radius: var(--radius-md); padding: 1.2rem 1.4rem;
  box-shadow: var(--shadow-sm); transition: all 0.2s;
}
.gate-top-card:hover {
  border-color: var(--gold); box-shadow: var(--shadow-md);
  transform: translateY(-2px); text-decoration: none;
}
.gate-top-card-name {
  font-family: 'Noto Serif JP', serif;
  font-size: 1.1rem; font-weight: 700;
  color: var(--text-primary); letter-spacing: 0.08em;
}
.gate-top-card-pref {
  display: inline-block; margin-top: 0.3rem;
  font-size: 0.75rem; padding: 2px 10px;
  border-radius: 10px; background: var(--bg-subtle);
  color: var(--text-secondary);
}
.gate-top-card-tagline {
  margin-top: 0.5rem; font-size: 0.88rem;
  color: var(--text-secondary); line-height: 1.6;
}
.gate-top-card-arrow {
  display: block; margin-top: 0.6rem;
  font-size: 0.82rem; color: var(--gold-dark); font-weight: 600;
}
.gate-top-empty {
  text-align: center; padding: 2rem 1rem;
  font-size: 0.9rem; color: var(--text-tertiary);
}
`;

// =========================================================
// GATE トップページ — /jikabuki/gate
// =========================================================
export function gateTopPageHTML(gateGroups = [], defaultGroups = {}, { googleClientId = "" } = {}) {
  const cards = gateGroups.map(gg => {
    const d = defaultGroups[gg.id] || {};
    const name = escHTML(d.name || gg.name || gg.id);
    const pref = escHTML(d.prefecture || "");
    const tagline = escHTML(d.tagline || "");
    return `
      <a href="/jikabuki/gate/${escHTML(gg.id)}" class="gate-top-card fade-up">
        <div class="gate-top-card-name">${name}</div>
        ${pref ? `<span class="gate-top-card-pref">${pref}</span>` : ""}
        ${tagline ? `<div class="gate-top-card-tagline">${tagline}</div>` : ""}
        <span class="gate-top-card-arrow">詳細を見る &rarr;</span>
      </a>`;
  }).join("");

  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>&rsaquo;</span>GATE
    </div>

    <section class="gate-top-hero">
      <div class="gate-top-title">GATE</div>
      <p class="gate-top-lead">GATE登録団体の公式ページ一覧です。<br>団体の公演情報・ニュース・SNSをまとめてご覧いただけます。</p>
    </section>

    ${cards || `<div class="gate-top-empty">現在登録されている団体はありません。</div>`}

    <div class="gate-top-grid">
      <div class="gate-apply">
        <p class="gate-apply-title">団体の方へ</p>
        <p class="gate-apply-text">公式サイト（GATE）の作成・稽古スケジュール管理・台本共有などのBASE機能をご利用いただけます。</p>
        <a href="/jikabuki/base/onboarding" class="gate-apply-btn">新規団体登録はこちら &rarr;</a>
      </div>
    </div>
  `;

  return pageShell({
    title: "GATE",
    subtitle: "ぶたい",
    bodyHTML,
    activeNav: "gate",
    brand: "jikabuki",
    googleClientId,
    ogTitle: "GATE | JIKABUKI PLUS+",
    ogDesc: "GATE登録団体の公式ページ一覧。公演情報・ニュース・SNS・アクセス情報をまとめてご覧いただけます。",
    ogImage: "https://kabukiplus.com/assets/ogp/ogp_gate.png",
    headExtra: `<style>${GATE_CSS}</style>`,
  });
}
