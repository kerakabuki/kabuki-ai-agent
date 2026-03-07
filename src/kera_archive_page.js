// src/kera_archive_page.js
// =========================================================
// 気良歌舞伎 公演アーカイブ — /kerakabuki/archive
// スタンドアロン HTML（pageShell 不使用）
// ダークテーマ・CSSプレフィックス: ka-
// =========================================================

export function keraArchivePageHTML() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>公演アーカイブ — 気良歌舞伎</title>
<meta name="description" content="気良歌舞伎の2005年復活以降の全公演記録。年度別の演目一覧と映像アーカイブ。">
<meta property="og:title" content="公演アーカイブ — 気良歌舞伎">
<meta property="og:description" content="気良歌舞伎の2005年復活以降の全公演記録。年度別の演目一覧と映像アーカイブ。">
<meta property="og:image" content="https://kabukiplus.com/assets/ogp/ogp_kabukiplus_top.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="気良歌舞伎">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="公演アーカイブ — 気良歌舞伎">
<meta name="twitter:description" content="気良歌舞伎の2005年復活以降の全公演記録。年度別の演目一覧と映像アーカイブ。">
<meta name="twitter:image" content="https://kabukiplus.com/assets/ogp/ogp_kabukiplus_top.png">
<link rel="icon" href="/assets/kera-favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/kera-touch-icon.png">
<meta name="theme-color" content="#0a0a0f">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>${KA_CSS}</style>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "公演アーカイブ — 気良歌舞伎",
  "description": "気良歌舞伎の2005年復活以降の全公演記録。年度別の演目一覧と映像アーカイブ。",
  "url": "https://kabukiplus.com/kerakabuki/archive",
  "isPartOf": {
    "@type": "WebSite",
    "name": "気良歌舞伎",
    "url": "https://kabukiplus.com/kerakabuki"
  }
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "気良歌舞伎", "item": "https://kabukiplus.com/kerakabuki" },
    { "@type": "ListItem", "position": 2, "name": "公演アーカイブ", "item": "https://kabukiplus.com/kerakabuki/archive" }
  ]
}
</script>
</head>
<body>

<!-- ═══════ SITE NAV ═══════ -->
<nav class="ka-nav" id="ka-nav">
  <a href="/kerakabuki" class="ka-nav-brand">気良歌舞伎</a>
  <button class="ka-nav-toggle" id="ka-nav-toggle" aria-label="メニュー"><span></span><span></span><span></span></button>
  <div class="ka-nav-links" id="ka-nav-links">
    <a href="#highlight">映像</a>
    <a href="#archive">公演一覧</a>
    <a href="#project">配信企画</a>
    <a href="/kerakabuki">トップ</a>
    <a href="/kerakabuki/guide">ガイド</a>
  </div>
</nav>

<!-- ═══════ §1 HERO ═══════ -->
<section class="ka-hero" id="hero">
  <p class="ka-hero-label">ARCHIVE</p>
  <h1 class="ka-hero-title">公演の記録</h1>
  <p class="ka-hero-sub">2005年の復活から続く、全公演の歩み</p>
</section>

<!-- ═══════ §2 ハイライト動画 ═══════ -->
<section class="ka-section" id="highlight">
  <h2 class="ka-section-title ka-reveal">ハイライト</h2>
  <div class="ka-video">
    <div class="ka-video-wrap">
      <iframe src="https://www.youtube.com/embed/E_oFBbmxlOc" title="気良歌舞伎 ハイライト" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
    </div>
    <a href="https://www.youtube.com/@kerakabuki" target="_blank" rel="noopener" class="ka-yt-link">YouTube チャンネルを見る</a>
  </div>
</section>

<!-- ═══════ §3 年度別アーカイブ ═══════ -->
<section class="ka-section" id="archive">
  <h2 class="ka-section-title ka-reveal">年度別アーカイブ</h2>
  <p class="ka-section-sub ka-reveal">各年度の公演記録。動画のある演目はサムネイルをタップすると再生できます。</p>
  <div class="ka-year-list" id="ka-year-list"></div>
</section>

<!-- ═══════ §4 映像配信プロジェクト ═══════ -->
<section class="ka-section" id="project">
  <h2 class="ka-section-title ka-reveal">映像配信プロジェクト</h2>
  <div class="ka-project-grid">
    <div class="ka-project-card ka-reveal">
      <span class="ka-project-year">2020</span>
      <h3 class="ka-project-name">おうちで歌舞伎！</h3>
      <p class="ka-project-desc">コロナ禍で公演が中止となる中、過去の公演映像を配信。地芝居映像配信プロジェクトとして、自宅で気良歌舞伎を楽しめる取り組みを実施。</p>
    </div>
    <div class="ka-project-card ka-reveal">
      <span class="ka-project-year">2021</span>
      <h3 class="ka-project-name">通し上演 仮名手本忠臣蔵</h3>
      <p class="ka-project-desc">全11段のうち5段を映像化。地歌舞伎では異例の大作に挑み、映像配信プロジェクトとして公開。</p>
    </div>
  </div>
</section>

<!-- ═══════ FOOTER ═══════ -->
<footer class="ka-footer">
  <div class="ka-footer-inner">
    <p class="ka-footer-name">気良歌舞伎</p>
    <p class="ka-footer-addr">岐阜県郡上市明宝気良 &mdash; 気良座</p>
    <div class="ka-footer-links">
      <a href="/kerakabuki">公式ページ</a>
      <a href="/kerakabuki/guide">はじめての方へ</a>
      <a href="/kerakabuki/press">PRESS / お知らせ</a>
      <a href="/kerakabuki/story/1">ストーリー全文</a>
    </div>
    <p class="ka-footer-copy">&copy; 気良歌舞伎</p>
  </div>
</footer>

<!-- ═══════ CLIENT JS ═══════ -->
<script>
(function(){
  /* ── Performance data (plays: {name, ytId?}[]) ── */
  /* Sources: kerakabuki.jimdofree.com + YouTube @kerakabuki */
  var PERFORMANCES = [
    {
      year: 2025,
      events: [
        {
          title: "五代目座長 林克彦 襲名披露公演",
          date: "9月28日（日）",
          venue: "気良座",
          ytId: "E_oFBbmxlOc",
          plays: [
            { name: "寿曽我対面「工藤館」", ytId: "kIPC0XPA7Yo", note: "座長襲名劇中口上" },
            { name: "恋飛脚大和往来「封印切」", ytId: "Fqu5IHukm3Y" },
            { name: "白浪五人男「稲瀬川勢揃い」", ytId: "ByCvTRs9qzA" }
          ],
          note: "五代目座長 林克彦 襲名口上"
        },
        {
          title: "ぎふ清流座公演",
          date: "10月",
          venue: "ぎふ清流座",
          plays: [
            { name: "恋飛脚大和往来「封印切」", ytId: "z7ztOFG3C_Q" }
          ]
        },
        { title: "岐阜大学留学生 歌舞伎体験受入", date: "11月" }
      ]
    },
    {
      year: 2024,
      events: [{
        title: "気良座こけら落とし公演",
        date: "9月28日（土）",
        venue: "気良座",
        plays: [
          { name: "白浪五人男「稲瀬川勢揃い」", ytId: "vooLkvjv188" },
          { name: "絵本太功記十段目「尼崎閑居」", ytId: "SaXBlptsPQg" },
          { name: "仮名手本忠臣蔵七段目「祇園一力茶屋」", ytId: "WcndUbfkLmY" }
        ],
        note: "旧明方小学校木造講堂を芝居小屋「気良座」として開場"
      }]
    },
    {
      year: 2023,
      events: [
        {
          title: "気良白山神社祭礼公演",
          date: "9月23日（土）",
          venue: "気良座",
          plays: [
            { name: "白浪五人男「稲瀬川勢揃い」", ytId: "MSh24PPKC_k" },
            { name: "与話情浮名横櫛「切られ与三」", ytId: "y_DLyjhdsqs" }
          ]
        },
        {
          title: "清流の国ぎふ 地歌舞伎勢揃い公演・秋",
          date: "11月12日",
          venue: "ぎふ清流文化プラザ",
          plays: [
            { name: "菅原伝授手習鑑「寺子屋」", ytId: "_eGlfDq2FoM" }
          ]
        }
      ]
    },
    {
      year: 2022,
      events: [{
        title: "第29回 飛騨・美濃歌舞伎大会ぐじょう2022",
        date: "11月13日",
        plays: [
          { name: "義経千本桜「すし屋」", ytId: "ONkH5uc3klA" }
        ]
      }]
    },
    {
      year: 2021,
      events: [
        {
          title: "清流の国ぎふ 2020地歌舞伎勢揃い公演",
          date: "6月27日",
          venue: "ぎふ清流文化プラザ",
          plays: [
            { name: "仮名手本忠臣蔵五段目「鉄砲渡し」「二つ玉」" },
            { name: "仮名手本忠臣蔵六段目「勘平腹切」" }
          ]
        },
        {
          title: "映像配信プロジェクト「通し上演 仮名手本忠臣蔵」",
          venue: "旧明方小学校講堂",
          plays: [
            { name: "三段目「門前進物」「松の間」", ytId: "ko7QYxHhzq0" },
            { name: "五段目・六段目「勘平腹切」", ytId: "2lIlz_Ghf_U" },
            { name: "七段目「祇園一力茶屋」", ytId: "QBFiAAuMA3I" },
            { name: "九段目「山科閑居」", ytId: "eHGZaYzObZ8" }
          ],
          note: "全11段のうち5段を映像化"
        }
      ]
    },
    {
      year: 2020,
      events: [
        { title: "四代目座長 佐藤真哉 就任", note: "座長交代" },
        {
          title: "「おうちで歌舞伎！」地芝居映像配信プロジェクト",
          venue: "旧明方小学校講堂",
          plays: [
            { name: "弁天娘女男白浪「浜松屋」", ytId: "aLqekhOWpvs" },
            { name: "弁天娘女男白浪「稲瀬川勢揃い」", ytId: "V8DpkbjYMgw" }
          ]
        }
      ]
    },
    {
      year: 2019,
      events: [
        {
          title: "改元記念 清流の国ぎふ 夏の地歌舞伎公演2019",
          date: "7月14日",
          venue: "ぎふ清流文化プラザ",
          plays: [
            { name: "伊勢音頭恋寝刃", ytId: "ggPLUSdBsZ0" }
          ]
        },
        {
          title: "気良白山神社祭礼公演",
          date: "9月21日（土）",
          venue: "明宝コミュニティセンター",
          plays: [
            { name: "伊勢音頭恋寝刃" },
            { name: "絵本太功記十段目「尼崎閑居」" }
          ],
          note: "復活15周年記念公演"
        }
      ]
    },
    {
      year: 2018,
      events: [{
        title: "気良白山神社祭礼公演",
        date: "9月15日（土）",
        venue: "明宝コミュニティセンター",
        plays: [
          { name: "子ども歌舞伎 白浪五人男「稲瀬川勢揃い」", ytId: "LMKKcKDc7yw" },
          { name: "一谷嫩軍記「熊谷陣屋」", ytId: "X4m500eyvcs" }
        ]
      }]
    },
    {
      year: 2017,
      events: [
        {
          title: "気良白山神社祭礼公演",
          date: "9月16日（土）",
          venue: "明宝コミュニティセンター",
          plays: [
            { name: "伽羅先代萩「竹の間」", ytId: "THxF7y3bVLw" },
            { name: "伽羅先代萩「御殿」「床下」", ytId: "XvsXURp1UR8" }
          ]
        },
        {
          title: "高雄・気良青年歌舞伎公演",
          date: "11月19日",
          venue: "郡上市総合文化センター",
          plays: [
            { name: "伽羅先代萩「竹の間」" },
            { name: "伽羅先代萩「御殿」" }
          ]
        },
        { title: "岐阜県地歌舞伎保存振興協議会に加盟", note: "県内30団体目" }
      ]
    },
    {
      year: 2016,
      events: [
        {
          title: "気良白山神社祭礼公演",
          date: "9月17日（土）",
          venue: "明宝コミュニティセンター",
          plays: [
            { name: "菅原伝授手習鑑「寺子屋」", ytId: "JuPBhVYniNI", note: "郡上市長特別出演" }
          ]
        },
        {
          title: "高雄・気良青年歌舞伎公演",
          date: "11月20日",
          venue: "郡上市総合文化センター",
          plays: [
            { name: "菅原伝授手習鑑「寺子屋」" }
          ]
        }
      ]
    },
    {
      year: 2015,
      events: [
        { title: "三代目座長 髙田新一郎 就任", note: "座長交代" },
        {
          title: "気良白山神社祭礼公演",
          date: "9月19日（土）",
          venue: "明宝コミュニティセンター",
          plays: [
            { name: "子ども歌舞伎 白浪五人男「稲瀬川勢揃い」", ytId: "woiuFSKIJ5k" },
            { name: "箱根霊験記誓仇討「瀧場」", ytId: "nPyZh_QAQl4" }
          ]
        },
        {
          title: "高雄・気良青年歌舞伎公演",
          date: "10月25日",
          venue: "郡上市総合文化センター",
          plays: [
            { name: "箱根霊験記誓仇討「瀧場」", ytId: "nQ5ee5XwFsg" }
          ]
        }
      ]
    },
    {
      year: 2014,
      events: [{
        title: "気良白山神社祭礼公演",
        date: "9月20日（土）",
        venue: "明宝コミュニティセンター",
        plays: [
          { name: "子ども歌舞伎 白浪五人男「稲瀬川勢揃い」" },
          { name: "仮名手本忠臣蔵七段目「祇園一力茶屋」", ytId: "Uv8f6HNDGys" },
          { name: "絵本太功記十段目「尼崎閑居」" }
        ],
        note: "復活10周年記念公演・子ども歌舞伎に初挑戦"
      }]
    },
    {
      year: 2013,
      events: [{
        title: "気良白山神社祭礼公演",
        date: "9月21日（土）",
        venue: "明宝コミュニティセンター",
        plays: [
          { name: "近江源氏先陣館「盛綱陣屋」", ytId: "_UYjJkNjhAE" }
        ]
      }]
    },
    {
      year: 2012,
      events: [{
        title: "気良白山神社祭礼公演",
        date: "9月22日（土）",
        venue: "明宝コミュニティセンター",
        plays: [
          { name: "寿曽我対面" },
          { name: "与話情浮名横櫛「切られ与三」", ytId: "kMERYgoNDxw" }
        ]
      }]
    },
    {
      year: 2011,
      events: [{
        title: "気良白山神社祭礼公演",
        date: "9月24日（土）",
        venue: "明宝コミュニティセンター",
        plays: [
          { name: "恋飛脚大和往来「封印切」" },
          { name: "奥州安達原三段目「袖萩祭文」" }
        ]
      }]
    },
    {
      year: 2010,
      events: [
        { title: "二代目座長 奥村将典 就任", note: "座長交代" },
        {
          title: "気良白山神社祭礼公演",
          date: "9月22日（水）",
          venue: "明宝コミュニティセンター",
          plays: [
            { name: "一谷嫩軍記「熊谷陣屋」" },
            { name: "白浪五人男「稲瀬川勢揃い」" }
          ]
        }
      ]
    },
    {
      year: 2009,
      events: [{
        title: "気良白山神社祭礼公演",
        date: "9月22日（火）",
        venue: "明宝コミュニティセンター",
        plays: [
          { name: "伊勢音頭恋寝刃", ytId: "nTolqkpWg-k" },
          { name: "絵本太功記十段目「尼崎閑居」" }
        ]
      }]
    },
    {
      year: 2008,
      events: [{
        title: "気良白山神社祭礼公演",
        date: "9月22日（月）",
        venue: "明宝コミュニティセンター",
        plays: [
          { name: "義経千本桜「すし屋」", ytId: "A2bGi4O8fYQ" },
          { name: "新版歌祭文「野崎村」" }
        ]
      }]
    },
    {
      year: 2007,
      events: [{
        title: "気良白山神社祭礼公演",
        date: "9月22日（土）",
        venue: "明宝コミュニティセンター",
        plays: [
          { name: "仮名手本忠臣蔵五段目「鉄砲渡し」「二つ玉」" },
          { name: "仮名手本忠臣蔵六段目「勘平腹切」", ytId: "UNWbbf1S-cs" },
          { name: "奥州安達原三段目「袖萩祭文」" }
        ]
      }]
    },
    {
      year: 2006,
      events: [{
        title: "気良白山神社祭礼公演",
        date: "9月22日（金）",
        venue: "明宝コミュニティセンター",
        plays: [
          { name: "寿曽我対面" },
          { name: "仮名手本忠臣蔵七段目「祇園一力茶屋」", ytId: "qwrhXc_BS7I" }
        ]
      }]
    },
    {
      year: 2005,
      events: [{
        title: "気良歌舞伎復活公演",
        date: "9月22日（木）",
        venue: "明宝コミュニティセンター",
        plays: [
          { name: "白浪五人男「稲瀬川勢揃い」" },
          { name: "絵本太功記十段目「尼崎閑居」", ytId: "X3gkwMfvr5k" }
        ],
        note: "初代座長 鈴木雅敏。17年ぶりに白山神社祭礼での歌舞伎奉納を再開"
      }]
    },
    {
      year: 1986,
      events: [{
        title: "白山神社祭礼公演",
        venue: "明宝",
        plays: [
          { name: "熊谷陣屋 / 曽我対面", ytId: "v-8ecKB_voI" }
        ],
        note: "昭和61年。復活前の貴重な映像記録"
      }]
    }
  ];

  /* ── Escape HTML ── */
  function esc(s) { if (!s) return ""; var el = document.createElement("span"); el.textContent = s; return el.innerHTML; }

  /* ── Build year cards ── */
  var yearList = document.getElementById("ka-year-list");

  function renderYears() {
    var html = "";
    PERFORMANCES.forEach(function(p) {
      html += '<div class="ka-year-card ka-reveal" id="y' + p.year + '">';
      html += '<div class="ka-year-header"><span class="ka-year-num">' + p.year + '</span></div>';
      html += '<div class="ka-year-events">';
      p.events.forEach(function(ev) {
        html += '<div class="ka-event">';
        html += '<h3 class="ka-event-title">' + esc(ev.title) + '</h3>';
        if (ev.date) html += '<p class="ka-event-meta"><span class="ka-event-icon">📅</span>' + esc(ev.date) + '</p>';
        if (ev.venue) html += '<p class="ka-event-meta"><span class="ka-event-icon">📍</span>' + esc(ev.venue) + '</p>';
        if (ev.plays && ev.plays.length) {
          html += '<div class="ka-plays">';
          ev.plays.forEach(function(play) {
            html += '<div class="ka-play">';
            if (play.ytId) {
              html += '<div class="ka-thumb-wrap" data-ytid="' + esc(play.ytId) + '">';
              html += '<img class="ka-thumb" src="https://img.youtube.com/vi/' + esc(play.ytId) + '/mqdefault.jpg" alt="' + esc(play.name) + '" loading="lazy">';
              html += '<span class="ka-play-btn" aria-label="再生">▶</span>';
              html += '</div>';
            }
            html += '<span class="ka-play-name">' + esc(play.name) + (play.note ? ' <small class="ka-play-note">' + esc(play.note) + '</small>' : '') + '</span>';
            html += '</div>';
          });
          html += '</div>';
        }
        if (ev.note) html += '<p class="ka-event-note">' + esc(ev.note) + '</p>';
        html += '</div>';
      });
      html += '</div></div>';
    });
    yearList.innerHTML = html;
    observeReveals();
  }

  renderYears();

  /* ── Click-to-play YouTube inline ── */
  yearList.addEventListener("click", function(e) {
    var wrap = e.target.closest(".ka-thumb-wrap");
    if (!wrap) return;
    var ytid = wrap.dataset.ytid;
    if (!ytid) return;
    wrap.innerHTML = '<iframe src="https://www.youtube.com/embed/' + ytid + '?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe>';
    wrap.classList.add("ka-thumb-playing");
  });

  /* ── Mobile nav toggle ── */
  var toggle = document.getElementById("ka-nav-toggle");
  var links = document.getElementById("ka-nav-links");
  toggle.addEventListener("click", function() { links.classList.toggle("ka-nav-open"); toggle.classList.toggle("ka-nav-active"); });
  links.addEventListener("click", function(e) { if (e.target.tagName === "A") { links.classList.remove("ka-nav-open"); toggle.classList.remove("ka-nav-active"); } });

  /* ── Sticky nav background on scroll ── */
  var nav = document.getElementById("ka-nav");
  var scrolled = false;
  function checkScroll() {
    var s = window.scrollY > 60;
    if (s !== scrolled) { scrolled = s; nav.classList.toggle("ka-nav-scrolled", s); }
  }
  window.addEventListener("scroll", checkScroll, { passive: true });
  checkScroll();

  /* ── IntersectionObserver: scroll reveal ── */
  function observeReveals() {
    var revealEls = document.querySelectorAll(".ka-reveal:not(.ka-visible)");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
          if (e.isIntersecting) { e.target.classList.add("ka-visible"); io.unobserve(e.target); }
        });
      }, { threshold: 0.08 });
      revealEls.forEach(function(el) { io.observe(el); });
    } else {
      revealEls.forEach(function(el) { el.classList.add("ka-visible"); });
    }
  }
  observeReveals();

  /* ── Thumbnail fallback ── */
  document.addEventListener("error", function(e) {
    if (e.target.tagName === "IMG" && e.target.classList.contains("ka-thumb")) {
      var src = e.target.src;
      if (src.indexOf("/mqdefault.jpg") !== -1) {
        e.target.src = src.replace("/mqdefault.jpg", "/hqdefault.jpg");
      }
    }
  }, true);

  /* ── Smooth scroll for hash links ── */
  document.addEventListener("click", function(e) {
    var a = e.target.closest("a[href^='#']");
    if (!a) return;
    var target = document.getElementById(a.getAttribute("href").slice(1));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: "smooth" }); }
  });
})();
</script>
</body>
</html>`;
}

/* ════════════════════════════════════════
   CSS
   ════════════════════════════════════════ */
const KA_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  font-family: "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif;
  background: #0a0a0f; color: #e8e4dc;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
a { color: inherit; }
img { max-width: 100%; display: block; }

/* ── Site Nav ── */
.ka-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 1.5rem; height: 56px;
  transition: background 0.3s, box-shadow 0.3s;
}
.ka-nav-scrolled {
  background: rgba(10,10,15,0.92);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 1px 8px rgba(0,0,0,0.5);
}
.ka-nav-brand {
  font-family: "Noto Serif JP", serif;
  font-size: 1.05rem; font-weight: 700;
  color: #c5a255; text-decoration: none;
  letter-spacing: 0.15em;
}
.ka-nav-links { display: flex; gap: 1.5rem; }
.ka-nav-links a {
  font-size: 0.8rem; color: #b8a88a;
  text-decoration: none; letter-spacing: 0.08em;
  transition: color 0.2s;
}
.ka-nav-links a:hover { color: #e8c96a; }
.ka-nav-toggle {
  display: none; background: none; border: none;
  cursor: pointer; width: 28px; height: 20px;
  position: relative; flex-direction: column; justify-content: space-between;
}
.ka-nav-toggle span {
  display: block; width: 100%; height: 2px;
  background: #c5a255; border-radius: 1px;
  transition: all 0.25s;
}
.ka-nav-active span:nth-child(1) { transform: translateY(9px) rotate(45deg); }
.ka-nav-active span:nth-child(2) { opacity: 0; }
.ka-nav-active span:nth-child(3) { transform: translateY(-9px) rotate(-45deg); }

@media (max-width: 640px) {
  .ka-nav-toggle { display: flex; }
  .ka-nav-links {
    display: none; position: absolute;
    top: 56px; left: 0; right: 0;
    flex-direction: column; gap: 0;
    background: rgba(10,10,15,0.96);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(197,162,85,0.14);
  }
  .ka-nav-open { display: flex; }
  .ka-nav-links a {
    padding: 0.9rem 1.5rem; font-size: 0.88rem;
    border-bottom: 1px solid rgba(197,162,85,0.08);
  }
}

/* ── Hero ── */
.ka-hero {
  min-height: 40vh;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center;
  padding: 6rem 1rem 3rem;
  background: linear-gradient(180deg, #0a0a0f 0%, #12101c 100%);
}
.ka-hero-label {
  font-size: 0.7rem; font-weight: 600;
  color: #6a5d4a; letter-spacing: 0.35em;
  text-transform: uppercase; margin-bottom: 0.6rem;
}
.ka-hero-title {
  font-family: "Noto Serif JP", serif;
  font-size: clamp(1.6rem, 5vw, 2.4rem);
  color: #c5a255; letter-spacing: 0.2em;
  margin-bottom: 0.6rem;
}
.ka-hero-sub {
  font-size: 0.88rem; color: #b8a88a;
  letter-spacing: 0.06em;
}

/* ── Sections ── */
.ka-section {
  max-width: 900px; margin: 0 auto;
  padding: 4rem 1.2rem;
}
.ka-section-title {
  font-family: "Noto Serif JP", serif;
  font-size: 1.5rem; color: #c5a255;
  letter-spacing: 0.25em; text-align: center;
  margin-bottom: 0.5rem;
  position: relative; padding-bottom: 0.8rem;
}
.ka-section-title::after {
  content: ""; display: block;
  width: 40px; height: 2px;
  background: linear-gradient(90deg, #c5a255, #e8c96a);
  margin: 0.6rem auto 0;
}
.ka-section-sub {
  text-align: center; font-size: 0.88rem;
  color: #6a5d4a; margin-bottom: 2rem;
}

/* ── Scroll reveal ── */
.ka-reveal {
  opacity: 0; transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.ka-visible { opacity: 1; transform: translateY(0); }
@media (prefers-reduced-motion: reduce) {
  .ka-reveal { opacity: 1; transform: none; transition: none; }
}

/* ── Video embed ── */
.ka-video { max-width: 700px; margin: 0 auto 1rem; text-align: center; }
.ka-video-wrap {
  position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;
  border-radius: 12px; border: 1px solid rgba(197,162,85,0.14);
}
.ka-video-wrap iframe {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
}
.ka-yt-link {
  display: inline-block; margin-top: 0.8rem;
  font-size: 0.88rem; color: #c5a255;
  text-decoration: none; transition: color 0.2s;
}
.ka-yt-link:hover { color: #e8c96a; }

/* ── Year cards ── */
.ka-year-list {
  display: flex; flex-direction: column; gap: 2rem;
}
.ka-year-card {
  background: rgba(18,18,28,0.7);
  border: 1px solid rgba(197,162,85,0.14);
  border-radius: 16px;
  overflow: hidden;
  transition: border-color 0.3s;
}
.ka-year-card:hover { border-color: rgba(197,162,85,0.3); }
.ka-year-header {
  padding: 1.2rem 1.5rem 0.8rem;
  border-bottom: 1px solid rgba(197,162,85,0.1);
}
.ka-year-num {
  font-family: "Noto Serif JP", serif;
  font-size: 1.8rem; font-weight: 700;
  color: #c5a255; letter-spacing: 0.08em;
}
.ka-year-events { padding: 1rem 1.5rem 1.5rem; }
.ka-event { margin-bottom: 1.2rem; }
.ka-event:last-child { margin-bottom: 0; }
.ka-event-title {
  font-size: 1rem; font-weight: 600;
  color: #e8e4dc; margin-bottom: 0.3rem;
}
.ka-event-meta {
  font-size: 0.82rem; color: #b8a88a;
  display: flex; align-items: center; gap: 0.4rem;
  margin-bottom: 0.2rem;
}
.ka-event-icon { font-size: 0.9rem; flex-shrink: 0; }
.ka-event-note {
  font-size: 0.82rem; color: #e8c96a;
  margin-top: 0.4rem;
  padding-left: 0.8rem;
  border-left: 2px solid rgba(197,162,85,0.3);
}

/* ── Plays with thumbnails ── */
.ka-plays {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.8rem; margin-top: 0.6rem;
}
.ka-play {
  display: flex; flex-direction: column; gap: 0.3rem;
}
.ka-play-name {
  font-size: 0.85rem; color: #b8a88a;
}
.ka-play-note {
  font-size: 0.75rem; color: #e8c96a;
  display: inline;
}
.ka-thumb-wrap {
  position: relative; padding-bottom: 56.25%; height: 0;
  border-radius: 8px; overflow: hidden;
  cursor: pointer; border: 1px solid rgba(197,162,85,0.14);
  transition: border-color 0.2s;
}
.ka-thumb-wrap:hover { border-color: #c5a255; }
.ka-thumb {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%; object-fit: cover;
}
.ka-play-btn {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 44px; height: 44px;
  background: rgba(10,10,15,0.7);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem; color: #c5a255;
  pointer-events: none;
  transition: background 0.2s;
}
.ka-thumb-wrap:hover .ka-play-btn { background: rgba(197,162,85,0.3); }
.ka-thumb-playing {
  padding-bottom: 56.25%;
  cursor: default;
}

/* ── Projects ── */
.ka-project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.2rem;
}
.ka-project-card {
  background: rgba(18,18,28,0.7);
  border: 1px solid rgba(197,162,85,0.14);
  border-radius: 14px;
  padding: 1.5rem;
  transition: border-color 0.2s;
}
.ka-project-card:hover { border-color: rgba(197,162,85,0.3); }
.ka-project-year {
  font-family: "Noto Serif JP", serif;
  font-size: 0.82rem; font-weight: 700;
  color: #c5a255; letter-spacing: 0.08em;
}
.ka-project-name {
  font-size: 1.05rem; font-weight: 600;
  color: #e8e4dc; margin: 0.4rem 0;
}
.ka-project-desc {
  font-size: 0.85rem; color: #b8a88a;
  line-height: 1.7;
}

/* ── Footer ── */
.ka-footer {
  border-top: 1px solid rgba(197,162,85,0.12);
  padding: 3rem 1.2rem 2.5rem;
  text-align: center;
}
.ka-footer-inner { max-width: 600px; margin: 0 auto; }
.ka-footer-name {
  font-family: "Noto Serif JP", serif;
  font-size: 1.1rem; color: #c5a255;
  letter-spacing: 0.2em; margin-bottom: 0.4rem;
}
.ka-footer-addr {
  font-size: 0.8rem; color: #6a5d4a;
  margin-bottom: 1.2rem;
}
.ka-footer-links {
  display: flex; justify-content: center;
  gap: 1.5rem; flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
.ka-footer-links a {
  font-size: 0.82rem; color: #b8a88a;
  text-decoration: none; transition: color 0.2s;
}
.ka-footer-links a:hover { color: #e8c96a; }
.ka-footer-copy {
  font-size: 0.72rem; color: #3a3530;
}

/* ── Mobile ── */
@media (max-width: 600px) {
  .ka-section { padding: 3rem 1rem; }
  .ka-section-title { font-size: 1.25rem; }
  .ka-year-header { padding: 1rem 1.2rem 0.6rem; }
  .ka-year-num { font-size: 1.5rem; }
  .ka-year-events { padding: 0.8rem 1.2rem 1.2rem; }
  .ka-plays { grid-template-columns: 1fr; }
  .ka-project-grid { grid-template-columns: 1fr; }
}
`;
