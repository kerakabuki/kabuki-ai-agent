// src/press_page.js
// =========================================================
// PRESS / お知らせページ — /kerakabuki/press
// スタンドアロン HTML（pageShell 不使用）
// ダークテーマ、kera_official_page.js と同系統デザイン
// =========================================================

export function pressPageHTML() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>PRESS / お知らせ — 気良歌舞伎</title>
<meta name="description" content="気良歌舞伎のプレスキット・団体情報・お知らせ一覧。取材・メディア掲載のお問い合わせもこちらから。">
<meta property="og:title" content="PRESS / お知らせ — 気良歌舞伎">
<meta property="og:description" content="気良歌舞伎のプレスキット・団体情報・お知らせ一覧。">
<meta property="og:image" content="https://kabukiplus.com/assets/ogp/ogp_kabukiplus_top.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="気良歌舞伎">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="PRESS / お知らせ — 気良歌舞伎">
<meta name="twitter:description" content="気良歌舞伎のプレスキット・団体情報・お知らせ一覧。">
<meta name="twitter:image" content="https://kabukiplus.com/assets/ogp/ogp_kabukiplus_top.png">
<link rel="icon" href="/assets/kera-favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/kera-touch-icon.png">
<meta name="theme-color" content="#0a0a0f">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>${PRESS_CSS}</style>
<link rel="canonical" href="https://kabukiplus.com/kerakabuki/press">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "気良歌舞伎",
  "alternateName": ["Kera Kabuki", "KeraKabuki", "気良歌舞伎保存会"],
  "url": "https://kabukiplus.com/kerakabuki",
  "logo": "https://kabukiplus.com/assets/ogp/ogp_kabukiplus_top.png",
  "description": "岐阜県郡上市明宝気良の地歌舞伎団体。2005年に17年ぶりに復活し、約40名のメンバーが毎年秋に気良座で定期公演を行う。",
  "foundingDate": "2005",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "明宝気良2264",
    "addressLocality": "郡上市",
    "addressRegion": "岐阜県",
    "postalCode": "501-4303",
    "addressCountry": "JP"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "kerakabuki@gmail.com",
    "contactType": "general"
  },
  "memberOf": {
    "@type": "Organization",
    "name": "岐阜県地歌舞伎保存振興協議会"
  },
  "sameAs": [
    "https://www.instagram.com/kerakabuki_official/",
    "https://x.com/KeraKabuki",
    "https://www.youtube.com/@kerakabuki",
    "https://www.facebook.com/kerakabuki/",
    "https://note.com/kerakabuki",
    "https://medium.com/@kerakabuki"
  ]
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "PRESS / お知らせ — 気良歌舞伎",
  "description": "気良歌舞伎のプレスキット・団体情報・お知らせ一覧。",
  "url": "https://kabukiplus.com/kerakabuki/press",
  "publisher": {
    "@type": "Organization",
    "name": "気良歌舞伎"
  },
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "気良歌舞伎",
        "item": "https://kabukiplus.com/kerakabuki"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "PRESS / お知らせ"
      }
    ]
  }
}
</script>
</head>
<body>

<!-- ═══════ SITE NAV ═══════ -->
<nav class="kp-nav" id="kp-nav">
  <a href="/kerakabuki" class="kp-nav-brand">気良歌舞伎</a>
  <button class="kp-nav-toggle" id="kp-nav-toggle" aria-label="メニュー"><span></span><span></span><span></span></button>
  <div class="kp-nav-links" id="kp-nav-links">
    <a href="#stats">数字で見る</a>
    <a href="#overview">団体概要</a>
    <a href="#timeline">沿革</a>
    <a href="#sns">SNS</a>
    <a href="#kawaraban">かわら版</a>
    <a href="#news">お知らせ</a>
    <a href="/kerakabuki/archive">アーカイブ</a>
    <a href="/kerakabuki/guide">ガイド</a>
  </div>
</nav>

<!-- ═══════ §1 HERO ═══════ -->
<section class="kp-hero" id="hero">
  <div class="kp-hero-inner">
    <p class="kp-hero-label">KERAKABUKI</p>
    <h1 class="kp-hero-title">PRESS / お知らせ</h1>
    <p class="kp-hero-sub">気良歌舞伎の団体情報・プレスキット・最新のお知らせ</p>
  </div>
  <div class="kp-scroll-hint" aria-hidden="true"><span class="kp-scroll-arrow"></span></div>
</section>

<!-- ═══════ §2 数字で見る気良歌舞伎 ═══════ -->
<section class="kp-section" id="stats">
  <h2 class="kp-section-title kp-reveal">数字で見る気良歌舞伎</h2>
  <div class="kp-stats-grid">
    <div class="kp-stat-card kp-reveal">
      <span class="kp-stat-num">2005</span>
      <span class="kp-stat-label">復活の年</span>
      <span class="kp-stat-desc">17年ぶりに地歌舞伎を復活</span>
    </div>
    <div class="kp-stat-card kp-reveal">
      <span class="kp-stat-num">20<small>年+</small></span>
      <span class="kp-stat-label">活動年数</span>
      <span class="kp-stat-desc">復活以来、毎年公演を継続</span>
    </div>
    <div class="kp-stat-card kp-reveal">
      <span class="kp-stat-num">~40<small>名</small></span>
      <span class="kp-stat-label">メンバー数</span>
      <span class="kp-stat-desc">20代〜50代の地域住民</span>
    </div>
    <div class="kp-stat-card kp-reveal">
      <span class="kp-stat-num">130<small>世帯</small></span>
      <span class="kp-stat-label">気良の規模</span>
      <span class="kp-stat-desc">人口400人に満たない山里</span>
    </div>
    <div class="kp-stat-card kp-reveal">
      <span class="kp-stat-num">毎年9月</span>
      <span class="kp-stat-label">定期公演</span>
      <span class="kp-stat-desc">白山神社祭礼にて奉納上演</span>
    </div>
    <div class="kp-stat-card kp-reveal">
      <span class="kp-stat-num">2024</span>
      <span class="kp-stat-label">気良座開場</span>
      <span class="kp-stat-desc">旧明方小学校木造講堂を改修</span>
    </div>
  </div>
</section>

<!-- ═══════ §3 団体概要 ═══════ -->
<section class="kp-section" id="overview">
  <h2 class="kp-section-title kp-reveal">団体概要</h2>
  <div class="kp-overview-body">
    <div class="kp-mission kp-reveal">
      <p>岐阜県郡上市明宝気良。世帯数およそ130、山と川に囲まれた小さな集落で、<br>毎年秋に幕が開く地歌舞伎——それが<strong>気良歌舞伎</strong>です。</p>
      <p>「地域の人たちに元気になってほしい」「自分たちも一緒に楽しみたい」。<br>
      その想いで2005年に17年ぶりの復活を遂げて以来、途切れることなく公演を続けています。</p>
    </div>
    <div class="kp-philosophy kp-reveal">
      <blockquote class="kp-quote">守るために、変わる。</blockquote>
      <blockquote class="kp-quote">「今年もよかったよ」——その一言がある限り、続けていく。</blockquote>
    </div>
    <div class="kp-info-grid kp-reveal">
      <div class="kp-info-item"><span class="kp-info-label">団体名</span><span>気良歌舞伎</span></div>
      <div class="kp-info-item"><span class="kp-info-label">所在地</span><span>岐阜県郡上市明宝気良</span></div>
      <div class="kp-info-item"><span class="kp-info-label">会場</span><span>気良座（旧明方小学校木造講堂、2024年開場）</span></div>
      <div class="kp-info-item"><span class="kp-info-label">定期公演</span><span>毎年9月第4土曜日（白山神社祭礼）</span></div>
      <div class="kp-info-item"><span class="kp-info-label">メンバー</span><span>20代〜50代 約40名（地域住民中心）</span></div>
      <div class="kp-info-item"><span class="kp-info-label">加盟</span><span>岐阜県地歌舞伎保存振興協議会（2017年〜）</span></div>
    </div>
  </div>
</section>

<!-- ═══════ §4 沿革タイムライン ═══════ -->
<section class="kp-section" id="timeline">
  <h2 class="kp-section-title kp-reveal">沿革</h2>
  <div class="kp-timeline">
    <div class="kp-tl-item kp-reveal"><span class="kp-tl-year">2005</span><div class="kp-tl-dot"></div><div class="kp-tl-body"><strong>気良歌舞伎復活</strong><br>初代座長 鈴木雅敏。17年ぶりに白山神社祭礼での歌舞伎奉納を再開。以降、毎年定期公演</div></div>
    <div class="kp-tl-item kp-reveal"><span class="kp-tl-year">2010</span><div class="kp-tl-dot"></div><div class="kp-tl-body">二代目座長 奥村将典</div></div>
    <div class="kp-tl-item kp-reveal"><span class="kp-tl-year">2014</span><div class="kp-tl-dot"></div><div class="kp-tl-body">気良歌舞伎復活10周年記念公演（子ども歌舞伎に初挑戦）</div></div>
    <div class="kp-tl-item kp-reveal"><span class="kp-tl-year">2015</span><div class="kp-tl-dot"></div><div class="kp-tl-body">三代目座長 髙田新一郎<br>高雄・気良青年歌舞伎公演開催（2015年〜2017年）</div></div>
    <div class="kp-tl-item kp-reveal"><span class="kp-tl-year">2017</span><div class="kp-tl-dot"></div><div class="kp-tl-body">岐阜県地歌舞伎保存振興協議会に県内30団体目として加盟</div></div>
    <div class="kp-tl-item kp-reveal"><span class="kp-tl-year">2019</span><div class="kp-tl-dot"></div><div class="kp-tl-body">改元記念 清流の国ぎふ 地歌舞伎勢揃い公演出演<br>復活15周年記念公演</div></div>
    <div class="kp-tl-item kp-reveal"><span class="kp-tl-year">2020</span><div class="kp-tl-dot"></div><div class="kp-tl-body">四代目座長 佐藤真哉<br>「おうちで歌舞伎！」地芝居映像配信プロジェクト</div></div>
    <div class="kp-tl-item kp-reveal"><span class="kp-tl-year">2021</span><div class="kp-tl-dot"></div><div class="kp-tl-body">清流の国ぎふ 地歌舞伎勢揃い公演出演<br>「通し上演仮名手本忠臣蔵」映像配信プロジェクト</div></div>
    <div class="kp-tl-item kp-reveal"><span class="kp-tl-year">2022</span><div class="kp-tl-dot"></div><div class="kp-tl-body">飛騨美濃歌舞伎大会ぐじょう2022出演</div></div>
    <div class="kp-tl-item kp-reveal"><span class="kp-tl-year">2023</span><div class="kp-tl-dot"></div><div class="kp-tl-body">清流の国ぎふ 地歌舞伎勢揃い公演・秋 出演</div></div>
    <div class="kp-tl-item kp-reveal"><span class="kp-tl-year">2024</span><div class="kp-tl-dot"></div><div class="kp-tl-body"><strong>気良座こけら落とし公演</strong>（旧明方小学校木造講堂を「気良座」として開場）</div></div>
    <div class="kp-tl-item kp-reveal"><span class="kp-tl-year">2025</span><div class="kp-tl-dot"></div><div class="kp-tl-body"><strong>五代目座長 林克彦</strong><br>座長襲名披露公演<br>ぎふ清流座公演（10月）<br>岐阜大学留学生の歌舞伎体験受入（11月）</div></div>
    <div class="kp-tl-item kp-tl-current kp-reveal"><span class="kp-tl-year">2026</span><div class="kp-tl-dot"></div><div class="kp-tl-body"><strong>令和8年公演（予定）</strong></div></div>
  </div>
</section>

<!-- ═══════ §5 SNS・メディアリンク ═══════ -->
<section class="kp-section" id="sns">
  <h2 class="kp-section-title kp-reveal">SNS・メディアリンク</h2>
  <div class="kp-sns-grid">
    <a href="https://www.instagram.com/kerakabuki_official/" target="_blank" rel="noopener" class="kp-sns-card kp-reveal">
      <span class="kp-sns-icon">📷</span>
      <span class="kp-sns-name">Instagram</span>
      <span class="kp-sns-id">@kerakabuki_official</span>
    </a>
    <a href="https://x.com/KeraKabuki" target="_blank" rel="noopener" class="kp-sns-card kp-reveal">
      <span class="kp-sns-icon">𝕏</span>
      <span class="kp-sns-name">X（Twitter）</span>
      <span class="kp-sns-id">@KeraKabuki</span>
    </a>
    <a href="https://www.youtube.com/@kerakabuki" target="_blank" rel="noopener" class="kp-sns-card kp-reveal">
      <span class="kp-sns-icon">▶</span>
      <span class="kp-sns-name">YouTube</span>
      <span class="kp-sns-id">@kerakabuki</span>
    </a>
    <a href="https://www.facebook.com/kerakabuki/" target="_blank" rel="noopener" class="kp-sns-card kp-reveal">
      <span class="kp-sns-icon">📘</span>
      <span class="kp-sns-name">Facebook</span>
      <span class="kp-sns-id">kerakabuki</span>
    </a>
    <a href="https://note.com/kerakabuki" target="_blank" rel="noopener" class="kp-sns-card kp-reveal">
      <span class="kp-sns-icon">📝</span>
      <span class="kp-sns-name">Note</span>
      <span class="kp-sns-id">kerakabuki</span>
    </a>
    <a href="https://medium.com/@kerakabuki" target="_blank" rel="noopener" class="kp-sns-card kp-reveal">
      <span class="kp-sns-icon">M</span>
      <span class="kp-sns-name">Medium</span>
      <span class="kp-sns-id">@kerakabuki</span>
    </a>
  </div>
</section>

<!-- ═══════ §6 刊行物アーカイブ ═══════ -->
<section class="kp-section" id="kawaraban">
  <h2 class="kp-section-title kp-reveal">刊行物アーカイブ</h2>
  <p class="kp-archive-intro kp-reveal">高雄歌舞伎保存会・気良歌舞伎が2016年〜2021年に共同発行した「地歌舞伎かわら版」全11号。</p>
  <div class="kp-archive-timeline">
    <div class="kp-archive-year kp-reveal">
      <span class="kp-ay-label">2021</span>
      <div class="kp-ay-items">
        <a href="/kerakabuki/kawaraban/pdf/11" target="_blank" class="kp-ay-item">第十一号</a>
      </div>
    </div>
    <div class="kp-archive-year kp-reveal">
      <span class="kp-ay-label">2020</span>
      <div class="kp-ay-items">
        <a href="/kerakabuki/kawaraban/pdf/10" target="_blank" class="kp-ay-item">第十号</a>
      </div>
    </div>
    <div class="kp-archive-year kp-reveal">
      <span class="kp-ay-label">2017</span>
      <div class="kp-ay-items">
        <a href="/kerakabuki/kawaraban/pdf/09" target="_blank" class="kp-ay-item">第九号<span class="kp-ay-date">12月</span></a>
        <a href="/kerakabuki/kawaraban/pdf/08" target="_blank" class="kp-ay-item">第八号<span class="kp-ay-date">10月</span></a>
        <a href="/kerakabuki/kawaraban/pdf/07" target="_blank" class="kp-ay-item">第七号<span class="kp-ay-date">8月</span></a>
        <a href="/kerakabuki/kawaraban/pdf/06" target="_blank" class="kp-ay-item">第六号<span class="kp-ay-date">7月</span></a>
        <a href="/kerakabuki/kawaraban/pdf/05" target="_blank" class="kp-ay-item">第五号<span class="kp-ay-date">5月</span></a>
      </div>
    </div>
    <div class="kp-archive-year kp-reveal">
      <span class="kp-ay-label">2016</span>
      <div class="kp-ay-items">
        <a href="/kerakabuki/kawaraban/pdf/04" target="_blank" class="kp-ay-item">第四号<span class="kp-ay-date">11月</span></a>
        <a href="/kerakabuki/kawaraban/pdf/03" target="_blank" class="kp-ay-item">第参号<span class="kp-ay-date">8月</span></a>
        <a href="/kerakabuki/kawaraban/pdf/02" target="_blank" class="kp-ay-item">第弐号<span class="kp-ay-date">7月</span></a>
        <a href="/kerakabuki/kawaraban/pdf/01" target="_blank" class="kp-ay-item">創刊号<span class="kp-ay-date">5月</span></a>
      </div>
    </div>
  </div>
</section>

<!-- ═══════ §7 お問い合わせ ═══════ -->
<section class="kp-section kp-contact-section" id="contact">
  <h2 class="kp-section-title kp-reveal">お問い合わせ</h2>
  <div class="kp-contact kp-reveal">
    <div class="kp-contact-item">
      <span class="kp-contact-label">メール</span>
      <a href="mailto:kerakabuki@gmail.com">kerakabuki@gmail.com</a>
    </div>
    <div class="kp-contact-item">
      <span class="kp-contact-label">所在地</span>
      <span>〒501-4303 岐阜県郡上市明宝気良気良2264（気良歌舞伎事務局）</span>
    </div>
    <p class="kp-contact-note">取材・メディア掲載に関するお問い合わせは、メールにてお気軽にご連絡ください。</p>
  </div>
</section>

<!-- ═══════ §7 お知らせ一覧 ═══════ -->
<section class="kp-section" id="news">
  <h2 class="kp-section-title kp-reveal">お知らせ</h2>
  <div class="kp-news-filters kp-reveal" id="kp-news-filters">
    <button class="kp-filter-btn kp-filter-active" data-cat="all">すべて</button>
    <button class="kp-filter-btn" data-cat="お知らせ">お知らせ</button>
    <button class="kp-filter-btn" data-cat="プレスリリース">プレスリリース</button>
    <button class="kp-filter-btn" data-cat="メディア掲載">メディア掲載</button>
    <button class="kp-filter-btn" data-cat="イベント">イベント</button>
  </div>
  <div class="kp-news-list" id="kp-news-list">
    <article class="kp-news-item kp-reveal" data-cat="プレスリリース">
      <div class="kp-news-meta">
        <time class="kp-news-date">2026.03</time>
        <span class="kp-news-cat kp-cat-press">プレスリリース</span>
      </div>
      <h3 class="kp-news-title">総合プラットフォーム「KABUKI PLUS+ / JIKABUKI PLUS+」公開</h3>
      <p class="kp-news-desc">歌舞伎の総合プラットフォームを公開。演目データベース・用語集・観劇記録・公演情報など、歌舞伎をより身近にする機能を搭載。</p>
    </article>
    <article class="kp-news-item kp-reveal" data-cat="プレスリリース">
      <div class="kp-news-meta">
        <time class="kp-news-date">2026.02</time>
        <span class="kp-news-cat kp-cat-press">プレスリリース</span>
      </div>
      <h3 class="kp-news-title">AIアシスタント「けらのすけ」チャット開発</h3>
      <p class="kp-news-desc">気良歌舞伎の情報に特化したAIアシスタント「けらのすけ」を開発。歌舞伎の演目・用語・公演情報などについてチャット形式で回答。</p>
    </article>
    <article class="kp-news-item kp-reveal" data-cat="メディア掲載">
      <div class="kp-news-meta">
        <time class="kp-news-date">2025.11</time>
        <span class="kp-news-cat kp-cat-media">メディア掲載</span>
      </div>
      <h3 class="kp-news-title">中日新聞掲載：留学生、気良歌舞伎を体験</h3>
      <p class="kp-news-desc">岐阜大学の留学生10人が気良座を訪問し、「白浪五人男」を鑑賞。ツケ打ち体験や浴衣姿での名乗り体験など、地域の伝統文化への理解を深めた。</p>
    </article>
    <article class="kp-news-item kp-reveal" data-cat="イベント">
      <div class="kp-news-meta">
        <time class="kp-news-date">2025.10</time>
        <span class="kp-news-cat kp-cat-event">イベント</span>
      </div>
      <h3 class="kp-news-title">ぎふ清流座公演</h3>
      <p class="kp-news-desc">ぎふ清流座にて公演を実施。</p>
    </article>
    <article class="kp-news-item kp-reveal" data-cat="メディア掲載">
      <div class="kp-news-meta">
        <time class="kp-news-date">2025.09</time>
        <span class="kp-news-cat kp-cat-media">メディア掲載</span>
      </div>
      <h3 class="kp-news-title">中日新聞掲載：襲名口上披露に観客喝采　郡上で気良歌舞伎公演</h3>
      <p class="kp-news-desc">9月27日の定期公演を中日新聞が報道。五代目座長 林克彦の襲名口上や、「封印切」での明宝ハムなど地元題材を取り入れた演出が紹介された。</p>
    </article>
    <article class="kp-news-item kp-reveal" data-cat="イベント">
      <div class="kp-news-meta">
        <time class="kp-news-date">2025.09</time>
        <span class="kp-news-cat kp-cat-event">イベント</span>
      </div>
      <h3 class="kp-news-title">五代目座長 林克彦 襲名披露公演</h3>
      <p class="kp-news-desc">9月27日、気良座にて公演。「寿曽我対面」「封印切」「白浪五人男」の3幕を上演。新座長 林克彦が襲名口上を披露し、観客から喝采を浴びた。</p>
    </article>
    <article class="kp-news-item kp-reveal" data-cat="プレスリリース">
      <div class="kp-news-meta">
        <time class="kp-news-date">2025.05</time>
        <span class="kp-news-cat kp-cat-press">プレスリリース</span>
      </div>
      <h3 class="kp-news-title">NFT作品制作・販売開始</h3>
      <p class="kp-news-desc">役者や公演の写真をNFTとして制作・販売する取り組みを開始。「絵本太功記」「仮名手本忠臣蔵」「白浪五人男」等の演目写真をブロマイド風に20種類展開。地歌舞伎の魅力を世界に発信。</p>
    </article>
    <article class="kp-news-item kp-reveal" data-cat="メディア掲載">
      <div class="kp-news-meta">
        <time class="kp-news-date">2025.05</time>
        <span class="kp-news-cat kp-cat-media">メディア掲載</span>
      </div>
      <h3 class="kp-news-title">中日新聞掲載：役者や公演の画像いかが　気良歌舞伎、NFTで販売</h3>
      <p class="kp-news-desc">役者と公演写真をNFTとして販売する取り組みを中日新聞が報道。20種類のブロマイド風NFTで地歌舞伎の魅力を世界に発信。</p>
    </article>
    <article class="kp-news-item kp-reveal" data-cat="イベント">
      <div class="kp-news-meta">
        <time class="kp-news-date">2024.09</time>
        <span class="kp-news-cat kp-cat-event">イベント</span>
      </div>
      <h3 class="kp-news-title">気良座こけら落とし公演</h3>
      <p class="kp-news-desc">旧明方小学校の木造講堂を改修した「気良座」が開場。こけら落とし公演にて地域の新たな拠点が誕生。</p>
    </article>
    <article class="kp-news-item kp-reveal" data-cat="お知らせ">
      <div class="kp-news-meta">
        <time class="kp-news-date">2023.11</time>
        <span class="kp-news-cat kp-cat-info">お知らせ</span>
      </div>
      <h3 class="kp-news-title">清流の国ぎふ 地歌舞伎勢揃い公演・秋 出演</h3>
      <p class="kp-news-desc">岐阜県主催の地歌舞伎勢揃い公演（秋の部）に出演。県内の地歌舞伎団体と共に舞台を披露。</p>
    </article>
    <article class="kp-news-item kp-reveal" data-cat="メディア掲載">
      <div class="kp-news-meta">
        <time class="kp-news-date">2023.09</time>
        <span class="kp-news-cat kp-cat-media">メディア掲載</span>
      </div>
      <h3 class="kp-news-title">中日新聞掲載：芝居小屋を開設へ　廃校活用し念願の常設舞台</h3>
      <p class="kp-news-desc">旧明方小学校講堂を活用した常設芝居小屋「気良座」の開設計画を中日新聞が報道。飲食・温泉・宿泊施設との連携による地域の新たな誘客拠点として期待。</p>
    </article>
    <article class="kp-news-item kp-reveal" data-cat="メディア掲載">
      <div class="kp-news-meta">
        <time class="kp-news-date">2022.10</time>
        <span class="kp-news-cat kp-cat-media">メディア掲載</span>
      </div>
      <h3 class="kp-news-title">飛騨美濃歌舞伎大会ぐじょう2022出演</h3>
      <p class="kp-news-desc">郡上市で開催された飛騨美濃歌舞伎大会に出演。地域を超えた地芝居の交流の場に参加。</p>
    </article>
    <article class="kp-news-item kp-reveal" data-cat="お知らせ">
      <div class="kp-news-meta">
        <time class="kp-news-date">2021</time>
        <span class="kp-news-cat kp-cat-info">お知らせ</span>
      </div>
      <h3 class="kp-news-title">「通し上演 仮名手本忠臣蔵」映像配信プロジェクト</h3>
      <p class="kp-news-desc">コロナ禍2年目、全段通し上演という挑戦的な映像作品を制作・配信。地歌舞伎団体によるオンライン公演の先駆的な取り組みとして全国的に注目を集めた。</p>
    </article>
    <article class="kp-news-item kp-reveal" data-cat="お知らせ">
      <div class="kp-news-meta">
        <time class="kp-news-date">2020</time>
        <span class="kp-news-cat kp-cat-info">お知らせ</span>
      </div>
      <h3 class="kp-news-title">「おうちで歌舞伎！」地芝居映像配信プロジェクト</h3>
      <p class="kp-news-desc">コロナ禍で公演中止を余儀なくされる中、いち早く映像配信に挑戦。地歌舞伎をオンラインで届ける取り組みは全国的にも注目され、新たな観客層の開拓に繋がった。</p>
    </article>
  </div>
</section>

<!-- ═══════ FOOTER ═══════ -->
<footer class="kp-footer">
  <div class="kp-footer-inner">
    <p class="kp-footer-name">気良歌舞伎</p>
    <p class="kp-footer-addr">岐阜県郡上市明宝気良 &mdash; 気良座</p>
    <div class="kp-footer-links">
      <a href="/kerakabuki">公式ページ</a>
      <a href="/kerakabuki/guide">はじめての方へ</a>
      <a href="/kerakabuki/archive">公演アーカイブ</a>
      <a href="/kerakabuki/kawaraban">かわら版</a>
      <a href="/kerakabuki/story/1">ストーリー全文</a>
    </div>
    <p class="kp-footer-copy">&copy; 気良歌舞伎</p>
  </div>
</footer>

<!-- ═══════ CLIENT JS ═══════ -->
<script>
(function(){
  /* ── Mobile nav toggle ── */
  var toggle = document.getElementById("kp-nav-toggle");
  var links = document.getElementById("kp-nav-links");
  toggle.addEventListener("click", function(){ links.classList.toggle("kp-nav-open"); toggle.classList.toggle("kp-nav-active"); });
  links.addEventListener("click", function(e){ if (e.target.tagName === "A") { links.classList.remove("kp-nav-open"); toggle.classList.remove("kp-nav-active"); } });

  /* ── Sticky nav background on scroll ── */
  var nav = document.getElementById("kp-nav");
  var scrolled = false;
  function checkScroll(){
    var s = window.scrollY > 60;
    if (s !== scrolled) { scrolled = s; nav.classList.toggle("kp-nav-scrolled", s); }
  }
  window.addEventListener("scroll", checkScroll, { passive: true });
  checkScroll();

  /* ── IntersectionObserver: scroll reveal ── */
  var revealEls = document.querySelectorAll(".kp-reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting) { e.target.classList.add("kp-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add("kp-visible"); });
  }

  /* ── Timeline dot activation ── */
  var tlDots = document.querySelectorAll(".kp-tl-dot");
  if ("IntersectionObserver" in window && tlDots.length) {
    var tlIo = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting) { e.target.classList.add("kp-tl-lit"); tlIo.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    tlDots.forEach(function(d){ tlIo.observe(d); });
  }

  /* ── Smooth scroll for hash links ── */
  document.addEventListener("click", function(e){
    var a = e.target.closest("a[href^='#']");
    if (!a) return;
    var target = document.getElementById(a.getAttribute("href").slice(1));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: "smooth" }); }
  });

  /* ── News category filter ── */
  var filterBtns = document.querySelectorAll(".kp-filter-btn");
  var newsItems = document.querySelectorAll(".kp-news-item");
  filterBtns.forEach(function(btn){
    btn.addEventListener("click", function(){
      var cat = btn.dataset.cat;
      filterBtns.forEach(function(b){ b.classList.remove("kp-filter-active"); });
      btn.classList.add("kp-filter-active");
      newsItems.forEach(function(item){
        if (cat === "all" || item.dataset.cat === cat) {
          item.style.display = "";
        } else {
          item.style.display = "none";
        }
      });
    });
  });
})();
</script>
</body>
</html>`;
}

/* ════════════════════════════════════════
   CSS
   ════════════════════════════════════════ */
const PRESS_CSS = `
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
.kp-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 1.5rem; height: 56px;
  transition: background 0.3s, box-shadow 0.3s;
}
.kp-nav-scrolled {
  background: rgba(10,10,15,0.92);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 1px 8px rgba(0,0,0,0.5);
}
.kp-nav-brand {
  font-family: "Noto Serif JP", serif;
  font-size: 1.05rem; font-weight: 700;
  color: #c5a255; text-decoration: none;
  letter-spacing: 0.15em;
}
.kp-nav-links { display: flex; gap: 1.5rem; }
.kp-nav-links a {
  font-size: 0.8rem; color: #b8a88a;
  text-decoration: none; letter-spacing: 0.08em;
  transition: color 0.2s;
}
.kp-nav-links a:hover { color: #e8c96a; }
.kp-nav-toggle {
  display: none; background: none; border: none;
  cursor: pointer; width: 28px; height: 20px;
  position: relative; flex-direction: column; justify-content: space-between;
}
.kp-nav-toggle span {
  display: block; width: 100%; height: 2px;
  background: #c5a255; border-radius: 1px;
  transition: all 0.25s;
}
.kp-nav-active span:nth-child(1) { transform: translateY(9px) rotate(45deg); }
.kp-nav-active span:nth-child(2) { opacity: 0; }
.kp-nav-active span:nth-child(3) { transform: translateY(-9px) rotate(-45deg); }

@media (max-width: 640px) {
  .kp-nav-toggle { display: flex; }
  .kp-nav-links {
    display: none; position: absolute;
    top: 56px; left: 0; right: 0;
    flex-direction: column; gap: 0;
    background: rgba(10,10,15,0.96);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(197,162,85,0.14);
  }
  .kp-nav-open { display: flex; }
  .kp-nav-links a {
    padding: 0.9rem 1.5rem; font-size: 0.88rem;
    border-bottom: 1px solid rgba(197,162,85,0.08);
  }
}

/* ── Hero (50vh) ── */
.kp-hero {
  min-height: 50vh;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center;
  background: linear-gradient(180deg, #0a0a0f 0%, #12101c 50%, #0a0a0f 100%);
  position: relative;
  padding-top: 56px;
}
.kp-hero-inner { padding: 2rem 1rem; }
.kp-hero-label {
  font-family: "Noto Sans JP", sans-serif;
  font-size: 0.72rem; font-weight: 600;
  color: #6a5d4a; letter-spacing: 0.35em;
  text-transform: uppercase;
  margin-bottom: 0.8rem;
}
.kp-hero-title {
  font-family: "Noto Serif JP", serif;
  font-size: clamp(1.6rem, 5vw, 2.6rem);
  letter-spacing: 0.15em;
  color: #c5a255;
  margin: 0;
}
.kp-hero-sub {
  margin-top: 1rem;
  font-size: clamp(0.78rem, 2vw, 0.92rem);
  color: #b8a88a;
  letter-spacing: 0.08em;
  line-height: 1.8;
}
.kp-scroll-hint {
  position: absolute; bottom: 1.5rem; left: 50%;
  transform: translateX(-50%);
}
.kp-scroll-arrow {
  display: block; width: 18px; height: 18px;
  border-right: 2px solid #c5a255; border-bottom: 2px solid #c5a255;
  transform: rotate(45deg);
  animation: kpBounce 2s infinite;
}
@keyframes kpBounce {
  0%,100% { transform: rotate(45deg) translateY(0); opacity: 0.5; }
  50% { transform: rotate(45deg) translateY(8px); opacity: 1; }
}

/* ── Sections ── */
.kp-section {
  max-width: 900px; margin: 0 auto;
  padding: 5rem 1.2rem;
}
.kp-section-title {
  font-family: "Noto Serif JP", serif;
  font-size: 1.5rem; color: #c5a255;
  letter-spacing: 0.25em; text-align: center;
  margin-bottom: 0.5rem;
  position: relative; padding-bottom: 0.8rem;
}
.kp-section-title::after {
  content: ""; display: block;
  width: 40px; height: 2px;
  background: linear-gradient(90deg, #c5a255, #e8c96a);
  margin: 0.6rem auto 0;
}

/* ── Scroll reveal ── */
.kp-reveal {
  opacity: 0; transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.kp-visible { opacity: 1; transform: translateY(0); }
@media (prefers-reduced-motion: reduce) {
  .kp-reveal { opacity: 1; transform: none; transition: none; }
  .kp-scroll-arrow { animation: none; }
}

/* ── Stats Grid ── */
.kp-stats-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 1rem; margin-top: 2rem;
}
.kp-stat-card {
  display: flex; flex-direction: column;
  align-items: center; gap: 0.3rem;
  padding: 1.5rem 1rem;
  background: rgba(18,18,28,0.7);
  border: 1px solid rgba(197,162,85,0.14);
  border-radius: 14px;
  text-align: center;
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  transition: border-color 0.2s, transform 0.2s;
}
.kp-stat-card:hover { border-color: #c5a255; transform: translateY(-2px); }
.kp-stat-num {
  font-family: "Noto Serif JP", serif;
  font-size: 1.8rem; font-weight: 700;
  color: #c5a255; letter-spacing: 0.05em;
  line-height: 1.2;
}
.kp-stat-num small {
  font-size: 0.7em; font-weight: 400;
}
.kp-stat-label {
  font-size: 0.78rem; font-weight: 600;
  color: #e8e4dc; letter-spacing: 0.05em;
}
.kp-stat-desc {
  font-size: 0.72rem; color: #6a5d4a;
  line-height: 1.4;
}

@media (max-width: 600px) {
  .kp-stats-grid { grid-template-columns: repeat(2, 1fr); }
}

/* ── Overview ── */
.kp-overview-body {
  max-width: 700px; margin: 2rem auto 0;
}
.kp-mission {
  text-align: center; margin-bottom: 2rem;
}
.kp-mission p {
  font-size: 0.92rem; color: #b8a88a;
  line-height: 2; margin-bottom: 0.8rem;
}
.kp-mission strong { color: #e8e4dc; }
.kp-philosophy {
  margin-bottom: 2rem;
  text-align: center;
}
.kp-quote {
  font-family: "Noto Serif JP", serif;
  font-size: 1.05rem; color: #e8e4dc;
  font-style: normal; font-weight: 600;
  border: none; padding: 0.5rem 0;
  letter-spacing: 0.08em;
  margin-bottom: 0.6rem;
}
.kp-quote::before { content: "\\201C "; color: #c5a255; }
.kp-quote::after { content: " \\201D"; color: #c5a255; }
.kp-info-grid {
  background: rgba(18,18,28,0.92);
  border: 1px solid rgba(197,162,85,0.14);
  border-radius: 12px; padding: 1rem 1.2rem;
}
.kp-info-item {
  display: flex; gap: 0.8rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid rgba(197,162,85,0.08);
  font-size: 0.88rem; color: #b8a88a;
}
.kp-info-item:last-child { border-bottom: none; }
.kp-info-label {
  flex-shrink: 0; min-width: 80px;
  font-weight: bold; color: #c5a255;
  font-size: 0.82rem;
}

/* ── Timeline ── */
.kp-timeline {
  position: relative;
  max-width: 700px; margin: 2rem auto 0;
  padding-left: 2rem;
}
.kp-timeline::before {
  content: ""; position: absolute;
  left: 0.55rem; top: 0; bottom: 0;
  width: 2px; background: rgba(197,162,85,0.18);
}
.kp-tl-item {
  position: relative;
  padding: 0.6rem 0 1rem 1.2rem;
}
.kp-tl-dot {
  position: absolute;
  left: -1.55rem; top: 0.85rem;
  width: 10px; height: 10px; border-radius: 50%;
  background: #6a5d4a;
  border: 2px solid rgba(197,162,85,0.26);
  transition: all 0.4s ease;
}
.kp-tl-lit { background: #c5a255 !important; border-color: #c5a255 !important; box-shadow: 0 0 8px rgba(197,162,85,0.5); }
.kp-tl-current .kp-tl-dot {
  background: #e8c96a; border-color: #e8c96a;
  animation: kpPulse 2s infinite;
}
@keyframes kpPulse {
  0%,100% { box-shadow: 0 0 4px rgba(232,201,106,0.4); }
  50% { box-shadow: 0 0 14px rgba(232,201,106,0.8); }
}
.kp-tl-year {
  font-family: "Noto Serif JP", serif;
  font-size: 0.82rem; font-weight: bold;
  color: #c5a255; letter-spacing: 0.05em;
}
.kp-tl-body {
  font-size: 0.88rem; color: #b8a88a;
  line-height: 1.65; margin-top: 0.15rem;
}
.kp-tl-body strong { color: #e8e4dc; }

/* Desktop: centered alternating timeline */
@media (min-width: 768px) {
  .kp-timeline { padding-left: 0; }
  .kp-timeline::before { left: 50%; transform: translateX(-50%); }
  .kp-tl-item { width: 50%; padding: 0.6rem 2rem 1rem; }
  .kp-tl-item:nth-child(odd) { margin-left: 0; text-align: right; }
  .kp-tl-item:nth-child(even) { margin-left: 50%; }
  .kp-tl-item:nth-child(odd) .kp-tl-dot { left: auto; right: -7px; }
  .kp-tl-item:nth-child(even) .kp-tl-dot { left: -7px; }
}

/* ── SNS Grid ── */
.kp-sns-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem; max-width: 700px; margin: 1.5rem auto 0;
}
.kp-sns-card {
  display: flex; flex-direction: column;
  align-items: center; gap: 0.3rem;
  padding: 1.2rem 0.8rem;
  background: rgba(18,18,28,0.7);
  border: 1px solid rgba(197,162,85,0.14);
  border-radius: 14px;
  text-decoration: none;
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  transition: border-color 0.2s, transform 0.2s;
}
.kp-sns-card:hover { border-color: #c5a255; transform: translateY(-2px); text-decoration: none; }
.kp-sns-icon { font-size: 1.4rem; }
.kp-sns-name { font-size: 0.88rem; color: #e8e4dc; font-weight: 600; }
.kp-sns-id { font-size: 0.72rem; color: #6a5d4a; }

/* ── Contact ── */
.kp-contact-section { padding-bottom: 3rem; }
.kp-contact {
  max-width: 600px; margin: 2rem auto 0;
  background: rgba(18,18,28,0.92);
  border: 1px solid rgba(197,162,85,0.14);
  border-radius: 12px; padding: 1.5rem;
  text-align: center;
}
.kp-contact-item {
  display: flex; justify-content: center; gap: 0.8rem;
  padding: 0.5rem 0; font-size: 0.9rem; color: #b8a88a;
  flex-wrap: wrap;
}
.kp-contact-label {
  font-weight: bold; color: #c5a255;
  font-size: 0.82rem; min-width: 60px;
}
.kp-contact a { color: #c5a255; text-decoration: none; }
.kp-contact a:hover { color: #e8c96a; text-decoration: underline; }
.kp-contact-note {
  margin-top: 1rem; font-size: 0.78rem;
  color: #6a5d4a; line-height: 1.6;
}

/* ── Archive ── */
.kp-archive-intro {
  text-align: center; font-size: 0.88rem;
  color: #b8a88a; line-height: 1.8;
  margin: 1.5rem 0 2rem;
}
.kp-archive-timeline {
  max-width: 600px; margin: 0 auto;
  display: flex; flex-direction: column; gap: 1.5rem;
}
.kp-archive-year {
  display: flex; gap: 1.2rem; align-items: flex-start;
}
.kp-ay-label {
  flex-shrink: 0; width: 52px;
  font-family: "Noto Serif JP", serif;
  font-size: 0.88rem; font-weight: 700;
  color: #c5a255; padding-top: 0.5rem;
  letter-spacing: 0.05em;
}
.kp-ay-items {
  flex: 1; display: flex; flex-wrap: wrap; gap: 0.5rem;
}
.kp-ay-item {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  background: rgba(18,18,28,0.7);
  border: 1px solid rgba(197,162,85,0.14);
  border-radius: 8px;
  font-size: 0.82rem; color: #e8e4dc;
  text-decoration: none;
  transition: border-color 0.2s, transform 0.2s;
}
.kp-ay-item:hover {
  border-color: #c5a255; transform: translateY(-1px);
  text-decoration: none;
}
.kp-ay-date {
  font-size: 0.68rem; color: #6a5d4a;
}

@media (max-width: 480px) {
  .kp-archive-year { flex-direction: column; gap: 0.4rem; }
  .kp-ay-label { width: auto; padding-top: 0; }
}

/* ── News ── */
.kp-news-filters {
  display: flex; flex-wrap: wrap;
  justify-content: center; gap: 0.5rem;
  margin: 2rem 0 1.5rem;
}
.kp-filter-btn {
  padding: 0.45rem 1rem;
  border: 1px solid rgba(197,162,85,0.26);
  border-radius: 20px;
  background: transparent;
  color: #b8a88a; font-size: 0.8rem;
  font-family: inherit;
  cursor: pointer; transition: all 0.2s;
}
.kp-filter-btn:hover { border-color: #c5a255; color: #e8c96a; }
.kp-filter-active {
  background: rgba(197,162,85,0.15);
  border-color: #c5a255; color: #c5a255;
  font-weight: 600;
}

.kp-news-list {
  display: flex; flex-direction: column;
  gap: 1rem;
}
.kp-news-item {
  padding: 1.2rem 1.4rem;
  background: rgba(18,18,28,0.7);
  border: 1px solid rgba(197,162,85,0.14);
  border-radius: 12px;
  transition: border-color 0.2s;
}
.kp-news-item:hover { border-color: rgba(197,162,85,0.35); }
.kp-news-meta {
  display: flex; align-items: center; gap: 0.8rem;
  margin-bottom: 0.5rem;
}
.kp-news-date {
  font-size: 0.78rem; color: #6a5d4a;
  font-weight: 500; letter-spacing: 0.05em;
}
.kp-news-cat {
  font-size: 0.68rem; font-weight: 600;
  padding: 0.15rem 0.6rem;
  border-radius: 10px;
  letter-spacing: 0.04em;
}
.kp-cat-info { background: rgba(197,162,85,0.15); color: #c5a255; }
.kp-cat-press { background: rgba(100,180,255,0.12); color: #7ab8f5; }
.kp-cat-media { background: rgba(160,120,220,0.12); color: #b89ee0; }
.kp-cat-event { background: rgba(200,80,80,0.12); color: #e08080; }
.kp-news-title {
  font-size: 1rem; font-weight: 600;
  color: #e8e4dc; margin-bottom: 0.35rem;
  line-height: 1.4;
}
.kp-news-desc {
  font-size: 0.82rem; color: #b8a88a;
  line-height: 1.65;
}

/* ── Footer ── */
.kp-footer {
  border-top: 1px solid rgba(197,162,85,0.12);
  padding: 3rem 1.2rem 2.5rem;
  text-align: center;
}
.kp-footer-inner { max-width: 600px; margin: 0 auto; }
.kp-footer-name {
  font-family: "Noto Serif JP", serif;
  font-size: 1.1rem; color: #c5a255;
  letter-spacing: 0.2em; margin-bottom: 0.4rem;
}
.kp-footer-addr {
  font-size: 0.8rem; color: #6a5d4a;
  margin-bottom: 1.2rem;
}
.kp-footer-links {
  display: flex; justify-content: center;
  gap: 1.5rem; flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
.kp-footer-links a {
  font-size: 0.82rem; color: #b8a88a;
  text-decoration: none; transition: color 0.2s;
}
.kp-footer-links a:hover { color: #e8c96a; }
.kp-footer-copy {
  font-size: 0.72rem; color: #3a3530;
}

/* ── Mobile ── */
@media (max-width: 600px) {
  .kp-section { padding: 3rem 1rem; }
  .kp-section-title { font-size: 1.25rem; }
  .kp-info-item { flex-direction: column; gap: 0.2rem; }
  .kp-sns-grid { grid-template-columns: 1fr 1fr; gap: 0.7rem; }
  .kp-sns-card { padding: 1rem 0.6rem; }
  .kp-contact-item { flex-direction: column; gap: 0.2rem; }
}
`;
