// src/kera_official_page.js
// =========================================================
// 気良歌舞伎 公式ランディングページ — /kerakabuki
// スタンドアロン HTML（pageShell 不使用）
// フルスクロール型ダークテーマLP
// =========================================================

export function keraOfficialPageHTML() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>気良歌舞伎 — 岐阜県郡上市明宝気良の地歌舞伎</title>
<meta name="description" content="岐阜県郡上市明宝気良。人口400人の山里で、毎年9月第4土曜日に幕が開く地歌舞伎。2005年の復活から20年、約40名が常設芝居小屋「気良座」で演じ続ける。入場無料。">
<meta property="og:title" content="気良歌舞伎 — 岐阜県郡上市明宝気良の地歌舞伎">
<meta property="og:description" content="岐阜県郡上市明宝気良。人口400人の山里で、毎年秋に幕が開く地歌舞伎。2005年の復活から20年。">
<meta property="og:image" content="https://kabukiplus.com/assets/ogp/ogp_kabukiplus_top.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="気良歌舞伎">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="気良歌舞伎 — 岐阜県郡上市明宝気良の地歌舞伎">
<meta name="twitter:description" content="岐阜県郡上市明宝気良。人口400人の山里で、毎年秋に幕が開く地歌舞伎。2005年の復活から20年。">
<meta name="twitter:image" content="https://kabukiplus.com/assets/ogp/ogp_kabukiplus_top.png">
<link rel="icon" href="/assets/kera-favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/kera-touch-icon.png">
<meta name="theme-color" content="#0a0a0f">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>${KERA_LP_CSS}</style>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "PerformingGroup",
  "name": "気良歌舞伎",
  "alternateName": ["Kera Kabuki", "KeraKabuki"],
  "url": "https://kabukiplus.com/kerakabuki",
  "logo": "https://kabukiplus.com/assets/ogp/ogp_kabukiplus_top.png",
  "description": "岐阜県郡上市明宝気良の地歌舞伎団体。2005年に17年ぶりに復活し、約40名のメンバーが毎年秋に気良座で定期公演を行う。",
  "foundingDate": "2005",
  "location": {
    "@type": "PerformingArtsTheater",
    "name": "気良座",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "明宝気良2264",
      "addressLocality": "郡上市",
      "addressRegion": "岐阜県",
      "postalCode": "501-4303",
      "addressCountry": "JP"
    }
  },
  "memberOf": {
    "@type": "Organization",
    "name": "岐阜県地歌舞伎保存振興協議会"
  },
  "sameAs": [
    "https://www.instagram.com/kerakabuki_official/",
    "https://x.com/KeraKabuki",
    "https://www.facebook.com/kerakabuki/",
    "https://www.youtube.com/@kerakabuki"
  ]
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "TheaterEvent",
  "name": "気良歌舞伎 令和8年定期公演",
  "startDate": "2026-09-26",
  "location": {
    "@type": "PerformingArtsTheater",
    "name": "気良座",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "明宝気良2264",
      "addressLocality": "郡上市",
      "addressRegion": "岐阜県",
      "postalCode": "501-4303",
      "addressCountry": "JP"
    }
  },
  "organizer": {
    "@type": "PerformingGroup",
    "name": "気良歌舞伎",
    "url": "https://kabukiplus.com/kerakabuki"
  },
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "isAccessibleForFree": true,
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "JPY",
    "availability": "https://schema.org/InStock"
  }
}
</script>
</head>
<body>

<!-- ═══════ SITE NAV ═══════ -->
<nav class="kl-nav" id="kl-nav">
  <a href="#hero" class="kl-nav-brand">気良歌舞伎</a>
  <button class="kl-nav-toggle" id="kl-nav-toggle" aria-label="メニュー"><span></span><span></span><span></span></button>
  <div class="kl-nav-links" id="kl-nav-links">
    <a href="#about">紹介</a>
    <a href="#next">公演</a>
    <a href="/kerakabuki/guide">ガイド</a>
    <a href="#stories">物語</a>
    <a href="#timeline">沿革</a>
    <a href="/kerakabuki/archive">アーカイブ</a>
    <a href="#gallery">映像</a>
    <a href="#sns">SNS</a>
  </div>
</nav>

<!-- ═══════ §1 HERO ═══════ -->
<section class="kl-hero" id="hero">
  <div class="kl-hero-bg" aria-hidden="true"></div>
  <div class="kl-hero-inner">
    <h1 class="kl-hero-title" aria-label="気良歌舞伎">
      <span class="kl-char" style="--i:0">気</span><span class="kl-char" style="--i:1">良</span><span class="kl-char" style="--i:2">歌</span><span class="kl-char" style="--i:3">舞</span><span class="kl-char" style="--i:4">伎</span>
    </h1>
    <p class="kl-hero-tagline">山里に灯る、もうひとつの舞台。</p>
    <p class="kl-hero-place">岐阜県郡上市明宝気良</p>
  </div>
  <div class="kl-scroll-hint" aria-hidden="true">
    <span class="kl-scroll-arrow"></span>
  </div>
</section>

<!-- ═══════ §NEXT 次回公演 ═══════ -->
<section class="kl-next" id="next">
  <div class="kl-next-inner">
    <p class="kl-next-label">NEXT PERFORMANCE</p>
    <h2 class="kl-next-title">令和8年 定期公演</h2>
    <div class="kl-next-info">
      <div class="kl-next-date">
        <span class="kl-next-icon">📅</span>
        <div>
          <strong>2026年9月26日（土）</strong>
          <span>毎年9月第4土曜日</span>
        </div>
      </div>
      <div class="kl-next-venue">
        <span class="kl-next-icon">📍</span>
        <div>
          <strong>気良座</strong>
          <span>岐阜県郡上市明宝気良</span>
        </div>
      </div>
      <div class="kl-next-fee">
        <span class="kl-next-icon">🎫</span>
        <div>
          <strong>入場無料</strong>
          <span>予約不要・どなたでも</span>
        </div>
      </div>
    </div>
    <a href="/kerakabuki/guide" class="kl-next-btn">観劇ガイド・アクセスを見る →</a>
  </div>
</section>

<!-- ═══════ §2 ABOUT ═══════ -->
<section class="kl-section" id="about">
  <h2 class="kl-section-title kl-reveal">気良歌舞伎とは</h2>
  <div class="kl-about-body">
    <p class="kl-reveal">人口400人に満たない山あいの集落に、<br>毎年秋、芝居小屋の灯りがともる。</p>
    <p class="kl-reveal">平日はそれぞれの暮らしがある。<br>でもこの季節だけは、白塗りの顔に別の人生を重ね、<br>板の上で声を張る。</p>
    <figure class="kl-about-photo kl-reveal"><img src="/assets/photos/about-kesho.webp" alt="子どもの化粧 — 世代を超えた継承" loading="lazy"></figure>
    <p class="kl-reveal">客席と舞台の距離は、わずか数メートル。<br>掛け声、笑い声、拍手——<br>演じる者と観る者の境界が溶けていく夜がある。</p>
    <p class="kl-reveal kl-accent">この土地でしか生まれない歌舞伎がある。</p>
  </div>
  <div class="kl-about-story kl-reveal">
    <p>岐阜県郡上市明宝気良。世帯数およそ130、山と川に囲まれた小さな集落。</p>
    <p>かつて白山神社の祭礼には歌舞伎が奉納されていた。しかし時代の流れとともに途絶え、舞台は長い眠りについた。</p>
    <p>2005年。「もう一度、この地域を盛り上げたい」。地元の若者たちが声をかけ合い、17年ぶりに幕が開いた。</p>
    <figure class="kl-about-photo kl-reveal"><img src="/assets/photos/about-kuroko.webp" alt="黒衣の笑顔 — 裏方が支える舞台" loading="lazy"></figure>
    <p>それから20年。メンバーは20代から50代まで約40名に広がった。毎年秋の定期公演は、気良の一年で最も熱い夜になった。</p>
    <figure class="kl-about-photo kl-reveal"><img src="/assets/photos/about-butaiura.webp" alt="舞台裏 — 出番を待つ役者たち" loading="lazy"></figure>
    <p class="kl-accent">守るために、変わる。</p>
    <p><strong>「地域の人たちに元気になってほしい」</strong>、そして<strong>「自分たちも一緒に楽しみたい」</strong>。原点はいつもそこにある。</p>
    <p>子どもたちが「僕も出たい」と言い、都会に出た若者が秋になると帰ってくる。そんな小さな循環が、この芝居を支えている。</p>
    <figure class="kl-about-photo kl-reveal"><img src="/assets/photos/about-enmoku.webp" alt="気良歌舞伎の演目風景 — 花道と紙吹雪" loading="lazy"></figure>
    <p class="kl-accent">「今年もよかったよ」——その一言がある限り、続けていく。</p>
  </div>
  <div class="kl-info-grid kl-reveal">
    <div class="kl-info-item"><span class="kl-info-label">定期公演</span><span>毎年9月第4土曜日（白山神社祭礼）</span></div>
    <div class="kl-info-item"><span class="kl-info-label">メンバー</span><span>20代〜50代 約40名</span></div>
    <div class="kl-info-item"><span class="kl-info-label">加盟</span><span>岐阜県地歌舞伎保存振興協議会（2017年〜）</span></div>
    <div class="kl-info-item"><span class="kl-info-label">会場</span><span>気良座（旧明方小学校木造講堂、2024年開場）</span></div>
  </div>
</section>

<!-- ═══════ §3 STORIES ═══════ -->
<section class="kl-section" id="stories">
  <h2 class="kl-section-title kl-reveal">ストーリー</h2>
  <p class="kl-section-sub kl-reveal">復活から20年。一座の歩みを、全10話で辿る。</p>
  <div class="kl-stories-track" id="kl-stories-track">
    <div class="kl-stories-loading">読み込み中…</div>
  </div>
  <div class="kl-stories-nav">
    <button class="kl-stories-btn" id="kl-stories-prev" aria-label="前へ">&larr;</button>
    <button class="kl-stories-btn" id="kl-stories-next" aria-label="次へ">&rarr;</button>
  </div>
</section>

<!-- ═══════ §4 TIMELINE (highlights) ═══════ -->
<section class="kl-section" id="timeline">
  <h2 class="kl-section-title kl-reveal">あゆみ</h2>
  <div class="kl-timeline">
    <div class="kl-tl-item kl-reveal"><span class="kl-tl-year">2005</span><div class="kl-tl-dot"></div><div class="kl-tl-body"><strong>気良歌舞伎復活</strong><br>17年ぶりに白山神社祭礼での歌舞伎奉納を再開</div></div>
    <div class="kl-tl-item kl-reveal"><span class="kl-tl-year">2024</span><div class="kl-tl-dot"></div><div class="kl-tl-body"><strong>気良座こけら落とし</strong><br>旧明方小学校の木造講堂が芝居小屋として生まれ変わる</div></div>
    <div class="kl-tl-item kl-reveal"><span class="kl-tl-year">2025</span><div class="kl-tl-dot"></div><div class="kl-tl-body"><strong>五代目座長 林克彦</strong><br>襲名披露公演・ぎふ清流座公演</div></div>
    <div class="kl-tl-item kl-tl-current kl-reveal"><span class="kl-tl-year">2026</span><div class="kl-tl-dot"></div><div class="kl-tl-body"><strong>令和8年公演（予定）</strong></div></div>
  </div>
  <p class="kl-tl-more kl-reveal"><a href="/kerakabuki/press#timeline">沿革の全年表を見る</a>　<a href="/kerakabuki/archive">公演アーカイブ →</a></p>
</section>

<!-- ═══════ §5 GALLERY ═══════ -->
<section class="kl-section" id="gallery">
  <h2 class="kl-section-title kl-reveal">映像・写真</h2>
  <div class="kl-video">
    <div class="kl-video-wrap">
      <iframe src="https://www.youtube.com/embed/E_oFBbmxlOc" title="気良歌舞伎" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>
    <a href="https://www.youtube.com/@kerakabuki" target="_blank" rel="noopener" class="kl-yt-link">YouTube チャンネルを見る</a>
  </div>
  <p class="kl-section-sub kl-reveal">2025年 五代目座長襲名披露公演より</p>
  <div class="kl-gallery-grid kl-reveal" id="kl-gallery-grid">
    <img class="kl-gallery-thumb" src="/assets/photos/2025-soga-mie.webp" alt="寿曽我対面 — 曽我兄弟の見得" loading="lazy">
    <img class="kl-gallery-thumb" src="/assets/photos/2025-fuuingin.webp" alt="恋飛脚大和往来 封印切 — 忠兵衛と梅川" loading="lazy">
    <img class="kl-gallery-thumb" src="/assets/photos/2025-shiranami.webp" alt="白浪五人男 — フィナーレ" loading="lazy">
    <img class="kl-gallery-thumb" src="/assets/photos/2025-gakuya.webp" alt="気良座入口 — 役者と観客の交流" loading="lazy">
    <img class="kl-gallery-thumb" src="/assets/photos/2025-portrait.webp" alt="出番を待つ役者" loading="lazy">
    <img class="kl-gallery-thumb" src="/assets/photos/about-butaiura.webp" alt="舞台裏 — 出番前の緊張" loading="lazy">
  </div>
  <div class="kl-lightbox" id="kl-lightbox" role="dialog" aria-modal="true" aria-label="画像拡大" style="display:none">
    <button class="kl-lb-close" aria-label="閉じる">&times;</button>
    <img class="kl-lb-img" id="kl-lb-img" src="" alt="">
  </div>
</section>

<!-- ═══════ §6 SNS ═══════ -->
<section class="kl-section" id="sns">
  <h2 class="kl-section-title kl-reveal">つながる</h2>
  <div class="kl-sns-grid">
    <a href="https://www.instagram.com/kerakabuki_official/" target="_blank" rel="noopener" class="kl-sns-card kl-reveal">
      <span class="kl-sns-icon">📷</span>
      <span class="kl-sns-name">Instagram</span>
      <span class="kl-sns-id">@kerakabuki_official</span>
    </a>
    <a href="https://x.com/KeraKabuki" target="_blank" rel="noopener" class="kl-sns-card kl-reveal">
      <span class="kl-sns-icon">𝕏</span>
      <span class="kl-sns-name">X（Twitter）</span>
      <span class="kl-sns-id">@KeraKabuki</span>
    </a>
    <a href="https://www.facebook.com/kerakabuki/" target="_blank" rel="noopener" class="kl-sns-card kl-reveal">
      <span class="kl-sns-icon">📘</span>
      <span class="kl-sns-name">Facebook</span>
      <span class="kl-sns-id">kerakabuki</span>
    </a>
    <a href="https://www.youtube.com/@kerakabuki" target="_blank" rel="noopener" class="kl-sns-card kl-reveal">
      <span class="kl-sns-icon">▶</span>
      <span class="kl-sns-name">YouTube</span>
      <span class="kl-sns-id">@kerakabuki</span>
    </a>
  </div>
  <div class="kl-contact kl-reveal">
    <p>会場：気良座（旧明方小学校木造講堂）&mdash; 岐阜県郡上市明宝気良</p>
  </div>
</section>

<!-- ═══════ けらのすけ FAB ═══════ -->
<div class="kl-fab-wrap" id="kl-fab-wrap">
  <div class="kl-fab-panel" id="kl-fab-panel" aria-hidden="true">
    <div class="kl-fab-header">
      <div class="kl-fab-header-left">
        <img src="https://kabukiplus.com/assets/keranosukelogo.png" class="kl-fab-avatar-lg" alt="けらのすけ">
        <div>
          <div class="kl-fab-name">けらのすけ</div>
          <div class="kl-fab-sub">気良歌舞伎のことなら何でも聞いてね</div>
        </div>
      </div>
      <button class="kl-fab-close" id="kl-fab-close" aria-label="閉じる">&times;</button>
    </div>
    <div class="kl-fab-body" id="kl-fab-body"></div>
  </div>
  <button class="kl-fab-btn" id="kl-fab-btn">
    <img src="https://kabukiplus.com/assets/keranosukelogo.png" class="kl-fab-avatar-sm" alt="">
    <span class="kl-fab-label">けらのすけに聞く</span>
  </button>
</div>

<!-- ═══════ FOOTER ═══════ -->
<footer class="kl-footer">
  <div class="kl-footer-inner">
    <p class="kl-footer-name">気良歌舞伎</p>
    <p class="kl-footer-addr">岐阜県郡上市明宝気良 &mdash; 気良座</p>
    <div class="kl-footer-links">
      <a href="/kerakabuki/press#kawaraban">かわら版</a>
      <a href="/kerakabuki/story/1">ストーリー全文</a>
      <a href="/kerakabuki/press">PRESS / お知らせ</a>
      <a href="/kerakabuki/archive">公演アーカイブ</a>
      <a href="/kerakabuki/guide">はじめての方へ</a>
      <a href="#about">気良歌舞伎とは</a>
    </div>
    <p class="kl-footer-copy">&copy; 気良歌舞伎</p>
  </div>
</footer>

<!-- ═══════ CLIENT JS ═══════ -->
<script>
(function(){
  /* ── Mobile nav toggle ── */
  var toggle = document.getElementById("kl-nav-toggle");
  var links = document.getElementById("kl-nav-links");
  toggle.addEventListener("click", function(){ links.classList.toggle("kl-nav-open"); toggle.classList.toggle("kl-nav-active"); });
  links.addEventListener("click", function(e){ if (e.target.tagName === "A") { links.classList.remove("kl-nav-open"); toggle.classList.remove("kl-nav-active"); } });

  /* ── Sticky nav background on scroll ── */
  var nav = document.getElementById("kl-nav");
  var scrolled = false;
  function checkScroll(){
    var s = window.scrollY > 60;
    if (s !== scrolled) { scrolled = s; nav.classList.toggle("kl-nav-scrolled", s); }
  }
  window.addEventListener("scroll", checkScroll, { passive: true });
  checkScroll();

  /* ── IntersectionObserver: scroll reveal ── */
  var io;
  var revealEls = document.querySelectorAll(".kl-reveal");
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting) { e.target.classList.add("kl-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add("kl-visible"); });
  }

  /* ── Timeline dot activation ── */
  var tlDots = document.querySelectorAll(".kl-tl-dot");
  if ("IntersectionObserver" in window && tlDots.length) {
    var tlIo = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting) { e.target.classList.add("kl-tl-lit"); tlIo.unobserve(e.target); }
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

  /* ── Stories: fetch & horizontal scroll ── */
  var track = document.getElementById("kl-stories-track");
  fetch("/api/stories")
    .then(function(r){ return r.json(); })
    .then(function(data){
      var list = data.stories || data || [];
      if (!list.length) { track.innerHTML = '<div class="kl-empty">ストーリーはまだありません。</div>'; return; }
      var html = "";
      list.forEach(function(s){
        var d = s.ja || {};
        var id = s.id;
        html += '<a href="/kerakabuki/story/' + id + '" class="kl-story-card">';
        html += '<span class="kl-story-num">' + (id === "summary" ? "まとめ" : "#" + id) + '</span>';
        html += '<span class="kl-story-title">' + esc(d.title || "") + '</span>';
        html += '<span class="kl-story-excerpt">' + esc(d.excerpt || "") + '</span>';
        html += '</a>';
      });
      track.innerHTML = html;
    })
    .catch(function(){ track.innerHTML = '<div class="kl-empty">読み込みに失敗しました。</div>'; });

  document.getElementById("kl-stories-prev").addEventListener("click", function(){ track.scrollBy({ left: -280, behavior: "smooth" }); });
  document.getElementById("kl-stories-next").addEventListener("click", function(){ track.scrollBy({ left: 280, behavior: "smooth" }); });

  /* ── けらのすけ FAB widget ── */
  var fabOpen = false;
  var fabInited = false;
  var fabBtn = document.getElementById("kl-fab-btn");
  var fabPanel = document.getElementById("kl-fab-panel");
  var fabClose = document.getElementById("kl-fab-close");
  var fabBody = document.getElementById("kl-fab-body");

  function fabToggle() {
    fabOpen = !fabOpen;
    if (fabOpen) {
      fabInit();
      fabPanel.style.display = "flex";
      fabPanel.setAttribute("aria-hidden", "false");
      fabBtn.classList.add("kl-fab-open");
    } else {
      fabPanel.style.display = "none";
      fabPanel.setAttribute("aria-hidden", "true");
      fabBtn.classList.remove("kl-fab-open");
    }
  }
  fabBtn.addEventListener("click", fabToggle);
  fabClose.addEventListener("click", fabToggle);

  var CAT_ORDER = [
    { key: "気良歌舞伎", title: "気良歌舞伎について" },
    { key: "公演の基本", title: "公演の基本" },
    { key: "観劇ガイド", title: "観劇ガイド" },
    { key: "会場・設備", title: "会場・設備" },
    { key: "アクセス・周辺", title: "アクセス・周辺" },
    { key: "参加・ボランティア", title: "参加・ボランティア" }
  ];
  var faqData = null;

  function fabInit() {
    if (fabInited) return;
    fabInited = true;
    fabBody.innerHTML = '<div class="kl-fab-loading">読み込み中…</div>';
    fetch("/api/talk")
      .then(function(r){ return r.json(); })
      .then(function(data){
        var topics = [];
        if (data && Array.isArray(data.topics)) topics = data.topics;
        else if (Array.isArray(data)) topics = data;
        topics = topics.filter(function(t){
          var cat = (t.category || "").trim();
          return cat && cat !== "メニュー" && cat !== "meta";
        });
        if (!topics.length) { fabBody.innerHTML = '<div class="kl-fab-loading">まだ情報がありません</div>'; return; }
        faqData = {};
        var orderedCats = [];
        topics.forEach(function(t){ var c = (t.category || "その他").trim(); if (!faqData[c]) faqData[c] = []; faqData[c].push(t); });
        CAT_ORDER.forEach(function(c){ if (faqData[c.key]) orderedCats.push(c); });
        for (var k in faqData) { if (!CAT_ORDER.find(function(c){ return c.key === k; })) orderedCats.push({ key: k, title: k }); }
        fabShowCats(orderedCats);
      })
      .catch(function(){ fabBody.innerHTML = '<div class="kl-fab-loading">読み込みに失敗しました</div>'; });
  }

  function fabShowCats(cats) {
    fabBody.innerHTML = cats.map(function(c){
      return '<button class="kl-fab-cat" data-cat="' + esc(c.key) + '">'
        + '<span>' + esc(c.title) + '</span><span class="kl-fab-arrow">&rsaquo;</span></button>';
    }).join("");
    fabBody.onclick = function(e){
      var btn = e.target.closest(".kl-fab-cat");
      if (btn) fabShowQA(btn.dataset.cat, cats);
    };
  }

  function fabShowQA(cat, cats) {
    var items = faqData[cat] || [];
    var html = '<button class="kl-fab-back" id="kl-fab-back">&lsaquo; カテゴリに戻る</button>';
    items.forEach(function(t){
      html += '<details class="kl-fab-item">';
      html += '<summary class="kl-fab-q">' + esc(t.label || t.question || "") + '</summary>';
      html += '<div class="kl-fab-a">' + fmtAns(t.answer || t.desc || "") + '</div>';
      html += '</details>';
    });
    fabBody.innerHTML = html;
    fabBody.onclick = function(e){
      if (e.target.closest("#kl-fab-back")) fabShowCats(cats);
    };
  }

  /* ── Lightbox ── */
  var lb = document.getElementById("kl-lightbox");
  var lbImg = document.getElementById("kl-lb-img");
  document.getElementById("kl-gallery-grid").addEventListener("click", function(e){
    var img = e.target.closest(".kl-gallery-thumb");
    if (!img) return;
    lbImg.src = img.src; lbImg.alt = img.alt || "";
    lb.style.display = "flex"; document.body.style.overflow = "hidden";
  });
  lb.addEventListener("click", function(e){ if (e.target === lb || e.target.classList.contains("kl-lb-close")) closeLb(); });
  document.addEventListener("keydown", function(e){ if (e.key === "Escape" && lb.style.display === "flex") closeLb(); });
  function closeLb(){ lb.style.display = "none"; lbImg.src = ""; document.body.style.overflow = ""; }

  function esc(s){ if (!s) return ""; var el = document.createElement("span"); el.textContent = s; return el.innerHTML; }
  function fmtAns(s){ return esc(s).replace(/(https?:\\/\\/[^\\s<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\\n/g,"<br>"); }
})();
</script>
</body>
</html>`;
}

/* ════════════════════════════════════════
   CSS
   ════════════════════════════════════════ */
const KERA_LP_CSS = `
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
.kl-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 1.5rem; height: 56px;
  transition: background 0.3s, box-shadow 0.3s;
}
.kl-nav-scrolled {
  background: rgba(10,10,15,0.92);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 1px 8px rgba(0,0,0,0.5);
}
.kl-nav-brand {
  font-family: "Noto Serif JP", serif;
  font-size: 1.05rem; font-weight: 700;
  color: #c5a255; text-decoration: none;
  letter-spacing: 0.15em;
}
.kl-nav-links {
  display: flex; gap: 1.5rem;
}
.kl-nav-links a {
  font-size: 0.8rem; color: #b8a88a;
  text-decoration: none; letter-spacing: 0.08em;
  transition: color 0.2s;
}
.kl-nav-links a:hover { color: #e8c96a; }
.kl-nav-toggle {
  display: none; background: none; border: none;
  cursor: pointer; width: 28px; height: 20px;
  position: relative; flex-direction: column; justify-content: space-between;
}
.kl-nav-toggle span {
  display: block; width: 100%; height: 2px;
  background: #c5a255; border-radius: 1px;
  transition: all 0.25s;
}
.kl-nav-active span:nth-child(1) { transform: translateY(9px) rotate(45deg); }
.kl-nav-active span:nth-child(2) { opacity: 0; }
.kl-nav-active span:nth-child(3) { transform: translateY(-9px) rotate(-45deg); }

@media (max-width: 640px) {
  .kl-nav-toggle { display: flex; }
  .kl-nav-links {
    display: none; position: absolute;
    top: 56px; left: 0; right: 0;
    flex-direction: column; gap: 0;
    background: rgba(10,10,15,0.96);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(197,162,85,0.14);
  }
  .kl-nav-open { display: flex; }
  .kl-nav-links a {
    padding: 0.9rem 1.5rem; font-size: 0.88rem;
    border-bottom: 1px solid rgba(197,162,85,0.08);
  }
}

/* ── Hero ── */
.kl-hero {
  min-height: 100vh;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center;
  background: #0a0a0f;
  position: relative; overflow: hidden;
}
.kl-hero-bg {
  position: absolute; inset: 0;
  background: url('/assets/photos/hero-kiraza.webp') center/cover no-repeat;
  opacity: 0.35;
  transform: scale(1.05);
  animation: klHeroBgZoom 20s ease-in-out infinite alternate;
}
@keyframes klHeroBgZoom {
  0% { transform: scale(1.05); }
  100% { transform: scale(1.12); }
}
.kl-hero-inner { padding: 2rem 1rem; position: relative; z-index: 1; }
.kl-hero-title {
  font-family: "Noto Serif JP", serif;
  font-size: clamp(2.6rem, 9vw, 5rem);
  letter-spacing: 0.35em;
  color: #c5a255;
  margin: 0;
  display: flex; gap: 0.1em; justify-content: center;
}
.kl-char {
  display: inline-block;
  opacity: 0; transform: translateY(24px);
  animation: klCharReveal 0.7s ease forwards;
  animation-delay: calc(var(--i) * 0.15s + 0.3s);
}
@keyframes klCharReveal {
  to { opacity: 1; transform: translateY(0); }
}
.kl-hero-tagline {
  margin: 1.4rem 0 0.6rem;
  font-family: "Noto Serif JP", serif;
  font-size: clamp(0.82rem, 2.5vw, 1.05rem);
  color: #b8a88a;
  letter-spacing: 0.12em;
  line-height: 1.8;
}
.kl-hero-place {
  font-size: 0.78rem; color: #6a5d4a;
  letter-spacing: 0.2em;
}
.kl-scroll-hint {
  position: absolute; bottom: 2.5rem; left: 50%;
  transform: translateX(-50%);
}
.kl-scroll-arrow {
  display: block; width: 22px; height: 22px;
  border-right: 2px solid #c5a255; border-bottom: 2px solid #c5a255;
  transform: rotate(45deg);
  animation: klBounce 2s infinite;
}
@keyframes klBounce {
  0%,100% { transform: rotate(45deg) translateY(0); opacity: 0.5; }
  50% { transform: rotate(45deg) translateY(8px); opacity: 1; }
}

/* ── Next Performance ── */
.kl-next {
  padding: 3rem 1.2rem;
  text-align: center;
  background: linear-gradient(180deg, #0a0a0f 0%, #12101c 50%, #0a0a0f 100%);
}
.kl-next-inner {
  max-width: 640px;
  margin: 0 auto;
  background: rgba(18,18,28,0.7);
  border: 1px solid rgba(197,162,85,0.2);
  border-radius: 16px;
  padding: 2.5rem 2rem;
}
.kl-next-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #6a5d4a;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  margin-bottom: 0.6rem;
}
.kl-next-title {
  font-family: "Noto Serif JP", serif;
  font-size: 1.4rem;
  color: #c5a255;
  letter-spacing: 0.15em;
  margin-bottom: 1.5rem;
}
.kl-next-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: left;
  margin-bottom: 1.5rem;
}
.kl-next-date, .kl-next-venue, .kl-next-fee {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
.kl-next-icon {
  font-size: 1.2rem;
  width: 2rem;
  text-align: center;
  flex-shrink: 0;
}
.kl-next-info strong {
  display: block;
  color: #e8e4dc;
  font-size: 0.95rem;
}
.kl-next-info span {
  font-size: 0.78rem;
  color: #b8a88a;
}
.kl-next-btn {
  display: inline-block;
  padding: 0.7rem 1.8rem;
  border: 1px solid #c5a255;
  border-radius: 30px;
  color: #c5a255;
  text-decoration: none;
  font-size: 0.85rem;
  letter-spacing: 0.06em;
  transition: background 0.2s, color 0.2s;
}
.kl-next-btn:hover {
  background: #c5a255;
  color: #0a0a0f;
}
@media (max-width: 600px) {
  .kl-next-inner { padding: 1.8rem 1.2rem; }
  .kl-next-title { font-size: 1.2rem; }
}

/* ── Sections ── */
.kl-section {
  max-width: 900px; margin: 0 auto;
  padding: 5rem 1.2rem;
}
.kl-section-title {
  font-family: "Noto Serif JP", serif;
  font-size: 1.5rem; color: #c5a255;
  letter-spacing: 0.25em; text-align: center;
  margin-bottom: 0.5rem;
  position: relative; padding-bottom: 0.8rem;
}
.kl-section-title::after {
  content: ""; display: block;
  width: 40px; height: 2px;
  background: linear-gradient(90deg, #c5a255, #e8c96a);
  margin: 0.6rem auto 0;
}
.kl-section-sub {
  text-align: center; font-size: 0.88rem;
  color: #6a5d4a; margin-bottom: 2rem;
}

/* ── Scroll reveal ── */
.kl-reveal {
  opacity: 0; transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.kl-visible { opacity: 1; transform: translateY(0); }
@media (prefers-reduced-motion: reduce) {
  .kl-reveal { opacity: 1; transform: none; transition: none; }
  .kl-char { opacity: 1; transform: none; animation: none; }
  .kl-scroll-arrow { animation: none; }
  .kl-hero-bg { animation: none; transform: scale(1.05); }
}

/* ── About ── */
.kl-about-body {
  max-width: 640px; margin: 0 auto 2.5rem;
  text-align: center;
}
.kl-about-body p, .kl-about-story p {
  font-size: 0.92rem; color: #b8a88a;
  line-height: 2; margin-bottom: 0.8rem;
}
.kl-about-story {
  max-width: 700px; margin: 0 auto 2.5rem;
  border-top: 1px solid rgba(197,162,85,0.14);
  padding-top: 2rem;
}
.kl-about-story strong { color: #e8c96a; }
.kl-about-photo {
  margin: 1.5rem auto; max-width: 600px;
  border-radius: 12px; overflow: hidden;
  border: 1px solid rgba(197,162,85,0.14);
}
.kl-about-photo img {
  width: 100%; height: auto; display: block;
  transition: transform 0.6s ease;
}
.kl-about-photo:hover img { transform: scale(1.03); }
.kl-accent {
  font-size: 1rem !important; color: #e8e4dc !important;
  font-weight: bold; text-align: center;
  margin: 1.2rem 0 !important;
}
.kl-info-grid {
  max-width: 600px; margin: 0 auto;
  background: rgba(18,18,28,0.92);
  border: 1px solid rgba(197,162,85,0.14);
  border-radius: 12px; padding: 1rem 1.2rem;
}
.kl-info-item {
  display: flex; gap: 0.8rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid rgba(197,162,85,0.08);
  font-size: 0.88rem; color: #b8a88a;
}
.kl-info-item:last-child { border-bottom: none; }
.kl-info-label {
  flex-shrink: 0; min-width: 80px;
  font-weight: bold; color: #c5a255;
  font-size: 0.82rem;
}

/* ── Stories: horizontal scroll ── */
.kl-stories-track {
  display: flex; gap: 1rem;
  overflow-x: auto; scroll-snap-type: x mandatory;
  padding: 0.5rem 0 1rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(197,162,85,0.3) transparent;
}
.kl-stories-track::-webkit-scrollbar { height: 4px; }
.kl-stories-track::-webkit-scrollbar-thumb { background: rgba(197,162,85,0.3); border-radius: 2px; }
.kl-story-card {
  flex: 0 0 260px; scroll-snap-align: start;
  display: flex; flex-direction: column; gap: 0.4rem;
  padding: 1.2rem;
  background: rgba(18,18,28,0.92);
  border: 1px solid rgba(197,162,85,0.14);
  border-radius: 12px;
  text-decoration: none;
  transition: border-color 0.2s, transform 0.2s;
  position: relative; overflow: hidden;
}
.kl-story-card::before {
  content: ""; position: absolute;
  left: 0; top: 0; bottom: 0; width: 3px;
  background: #c83030;
}
.kl-story-card:hover { border-color: #c5a255; transform: translateY(-2px); text-decoration: none; }
.kl-story-num { font-size: 0.72rem; font-weight: bold; color: #c83030; letter-spacing: 0.1em; }
.kl-story-title { font-size: 0.94rem; color: #e8e4dc; font-weight: 600; }
.kl-story-excerpt { font-size: 0.8rem; color: #6a5d4a; line-height: 1.5; }
.kl-stories-nav {
  display: flex; justify-content: center; gap: 1rem; margin-top: 0.5rem;
}
.kl-stories-btn {
  width: 40px; height: 40px;
  border: 1px solid rgba(197,162,85,0.26);
  border-radius: 50%; background: transparent;
  color: #c5a255; font-size: 1.1rem;
  cursor: pointer; transition: all 0.2s;
}
.kl-stories-btn:hover { background: rgba(197,162,85,0.13); border-color: #c5a255; }

/* ── Timeline ── */
.kl-timeline {
  position: relative;
  max-width: 700px; margin: 0 auto;
  padding-left: 2rem;
}
.kl-timeline::before {
  content: ""; position: absolute;
  left: 0.55rem; top: 0; bottom: 0;
  width: 2px; background: rgba(197,162,85,0.18);
}
.kl-tl-item {
  position: relative;
  padding: 0.6rem 0 1rem 1.2rem;
}
.kl-tl-dot {
  position: absolute;
  left: -1.55rem; top: 0.85rem;
  width: 10px; height: 10px; border-radius: 50%;
  background: #6a5d4a;
  border: 2px solid rgba(197,162,85,0.26);
  transition: all 0.4s ease;
}
.kl-tl-lit { background: #c5a255 !important; border-color: #c5a255 !important; box-shadow: 0 0 8px rgba(197,162,85,0.5); }
.kl-tl-current .kl-tl-dot {
  background: #e8c96a; border-color: #e8c96a;
  animation: klPulse 2s infinite;
}
@keyframes klPulse {
  0%,100% { box-shadow: 0 0 4px rgba(232,201,106,0.4); }
  50% { box-shadow: 0 0 14px rgba(232,201,106,0.8); }
}
.kl-tl-year {
  font-family: "Noto Serif JP", serif;
  font-size: 0.82rem; font-weight: bold;
  color: #c5a255; letter-spacing: 0.05em;
}
.kl-tl-body {
  font-size: 0.88rem; color: #b8a88a;
  line-height: 1.65; margin-top: 0.15rem;
}
.kl-tl-body strong { color: #e8e4dc; }
.kl-tl-more {
  text-align: center; margin-top: 1.5rem;
  font-size: 0.85rem;
}
.kl-tl-more a {
  color: #c5a255; text-decoration: none;
  border-bottom: 1px solid rgba(197,162,85,0.3);
  padding-bottom: 2px;
  transition: color 0.2s, border-color 0.2s;
}
.kl-tl-more a:hover { color: #e8c96a; border-color: #e8c96a; }

/* Desktop: centered alternating timeline */
@media (min-width: 768px) {
  .kl-timeline { padding-left: 0; }
  .kl-timeline::before { left: 50%; transform: translateX(-50%); }
  .kl-tl-item { width: 50%; padding: 0.6rem 2rem 1rem; }
  .kl-tl-item:nth-child(odd) { margin-left: 0; text-align: right; }
  .kl-tl-item:nth-child(even) { margin-left: 50%; }
  .kl-tl-item:nth-child(odd) .kl-tl-dot { left: auto; right: -7px; }
  .kl-tl-item:nth-child(even) .kl-tl-dot { left: -7px; }
}

/* ── Gallery ── */
.kl-video { max-width: 700px; margin: 0 auto 2rem; text-align: center; }
.kl-video-wrap {
  position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;
  border-radius: 12px; border: 1px solid rgba(197,162,85,0.14);
}
.kl-video-wrap iframe {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
}
.kl-yt-link {
  display: inline-block; margin-top: 0.8rem;
  font-size: 0.88rem; color: #c5a255;
  text-decoration: none; transition: color 0.2s;
}
.kl-yt-link:hover { color: #e8c96a; text-decoration: none; }
.kl-gallery-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.6rem; margin-top: 1rem;
}
.kl-gallery-thumb {
  width: 100%; aspect-ratio: 1;
  object-fit: cover; border-radius: 8px;
  border: 1px solid rgba(197,162,85,0.14);
  cursor: pointer; transition: transform 0.2s, border-color 0.2s;
}
.kl-gallery-thumb:hover { transform: scale(1.03); border-color: #c5a255; }

/* ── Lightbox ── */
.kl-lightbox {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,0.92);
  display: flex; align-items: center; justify-content: center;
}
.kl-lb-close {
  position: absolute; top: 1rem; right: 1.2rem;
  font-size: 2rem; color: #e8e4dc; background: none;
  border: none; cursor: pointer; line-height: 1;
}
.kl-lb-img {
  max-width: 90vw; max-height: 85vh;
  border-radius: 8px; object-fit: contain;
}

/* ── SNS ── */
.kl-sns-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem; max-width: 700px; margin: 1.5rem auto 0;
}
.kl-sns-card {
  display: flex; flex-direction: column;
  align-items: center; gap: 0.3rem;
  padding: 1.4rem 1rem;
  background: rgba(18,18,28,0.7);
  border: 1px solid rgba(197,162,85,0.14);
  border-radius: 14px;
  text-decoration: none;
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  transition: border-color 0.2s, transform 0.2s;
}
.kl-sns-card:hover { border-color: #c5a255; transform: translateY(-2px); text-decoration: none; }
.kl-sns-icon { font-size: 1.6rem; }
.kl-sns-name { font-size: 0.92rem; color: #e8e4dc; font-weight: 600; }
.kl-sns-id { font-size: 0.78rem; color: #6a5d4a; }
.kl-contact {
  max-width: 600px; margin: 2rem auto 0;
  text-align: center; font-size: 0.88rem; color: #b8a88a;
}
.kl-contact a { color: #c5a255; text-decoration: none; }
.kl-contact a:hover { color: #e8c96a; text-decoration: underline; }

/* ── けらのすけ FAB ── */
.kl-fab-wrap {
  position: fixed; bottom: 20px; right: 16px; z-index: 9999;
  display: flex; flex-direction: column; align-items: flex-end; gap: 8px;
}
.kl-fab-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 18px; border-radius: 28px;
  background: linear-gradient(135deg, #14121e, #1c1828);
  border: 2px solid #c5a255; cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  transition: transform 0.2s, box-shadow 0.2s;
  font-family: inherit;
}
.kl-fab-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 22px rgba(0,0,0,0.5); }
.kl-fab-open { opacity: 0.5; }
.kl-fab-avatar-sm { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
.kl-fab-label { font-size: 0.88rem; font-weight: 700; color: #e8c96a; white-space: nowrap; }
.kl-fab-panel {
  display: none; flex-direction: column;
  width: 320px; max-height: 65vh;
  background: #12101c; border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  border: 1px solid rgba(197,162,85,0.25);
  overflow: hidden;
}
.kl-fab-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px;
  background: linear-gradient(135deg, #14121e, #1c1828);
  border-bottom: 1px solid rgba(197,162,85,0.2);
  flex-shrink: 0;
}
.kl-fab-header-left { display: flex; align-items: center; gap: 10px; }
.kl-fab-avatar-lg { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid #c5a255; }
.kl-fab-name { font-size: 0.88rem; font-weight: 700; color: #e8c96a; }
.kl-fab-sub { font-size: 0.7rem; color: #6a5d4a; margin-top: 1px; }
.kl-fab-close {
  background: none; border: none; cursor: pointer;
  color: #6a5d4a; font-size: 1.4rem; line-height: 1;
  padding: 2px 6px; transition: color 0.15s;
}
.kl-fab-close:hover { color: #e8e4dc; }
.kl-fab-body {
  padding: 8px; overflow-y: auto; flex: 1;
  display: flex; flex-direction: column; gap: 5px;
  scrollbar-width: thin; scrollbar-color: rgba(197,162,85,0.2) transparent;
}
.kl-fab-loading { padding: 2rem; text-align: center; font-size: 0.82rem; color: #6a5d4a; }
.kl-fab-cat {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; padding: 11px 14px;
  background: rgba(18,18,28,0.92); border: 1px solid rgba(197,162,85,0.14);
  border-radius: 8px; cursor: pointer; text-align: left;
  transition: border-color 0.18s; font-family: inherit;
  font-size: 0.85rem; font-weight: 600; color: #e8e4dc;
}
.kl-fab-cat:hover { border-color: #c5a255; }
.kl-fab-arrow { font-size: 1.1rem; color: #c5a255; line-height: 1; }
.kl-fab-back {
  display: flex; align-items: center; gap: 4px;
  background: none; border: none; cursor: pointer;
  font-size: 0.82rem; color: #c5a255; font-weight: 600;
  padding: 4px 2px 8px; font-family: inherit;
}
.kl-fab-back:hover { color: #e8c96a; }
.kl-fab-item {
  background: rgba(18,18,28,0.92); border: 1px solid rgba(197,162,85,0.14);
  border-radius: 8px; overflow: hidden; transition: border-color 0.2s;
}
.kl-fab-item[open] { border-color: rgba(197,162,85,0.3); }
.kl-fab-q {
  padding: 10px 12px; cursor: pointer;
  font-size: 0.84rem; font-weight: 600; color: #e8e4dc;
  list-style: none; display: flex; align-items: flex-start; gap: 6px; line-height: 1.45;
}
.kl-fab-q::-webkit-details-marker { display: none; }
.kl-fab-q::before {
  content: "▶"; font-size: 0.5rem; color: #c5a255;
  flex-shrink: 0; margin-top: 4px; transition: transform 0.2s;
}
.kl-fab-item[open] .kl-fab-q::before { transform: rotate(90deg); }
.kl-fab-a {
  padding: 8px 12px 10px; font-size: 0.82rem;
  color: #b8a88a; line-height: 1.7;
  border-top: 1px solid rgba(197,162,85,0.1);
}
.kl-fab-a a { color: #c5a255; word-break: break-all; }
@media (max-width: 400px) {
  .kl-fab-panel { width: calc(100vw - 32px); }
}

/* ── Footer ── */
.kl-footer {
  border-top: 1px solid rgba(197,162,85,0.12);
  padding: 3rem 1.2rem 2.5rem;
  text-align: center;
}
.kl-footer-inner { max-width: 600px; margin: 0 auto; }
.kl-footer-name {
  font-family: "Noto Serif JP", serif;
  font-size: 1.1rem; color: #c5a255;
  letter-spacing: 0.2em; margin-bottom: 0.4rem;
}
.kl-footer-addr {
  font-size: 0.8rem; color: #6a5d4a;
  margin-bottom: 1.2rem;
}
.kl-footer-links {
  display: flex; justify-content: center;
  gap: 1.5rem; flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
.kl-footer-links a {
  font-size: 0.82rem; color: #b8a88a;
  text-decoration: none; transition: color 0.2s;
}
.kl-footer-links a:hover { color: #e8c96a; }
.kl-footer-copy {
  font-size: 0.72rem; color: #3a3530;
}

/* ── Utility ── */
.kl-loading, .kl-empty {
  text-align: center; padding: 2rem;
  font-size: 0.88rem; color: #6a5d4a;
}
.kl-stories-loading { padding: 2rem; color: #6a5d4a; font-size: 0.88rem; }

/* ── Mobile ── */
@media (max-width: 600px) {
  .kl-section { padding: 3rem 1rem; }
  .kl-section-title { font-size: 1.25rem; }
  .kl-hero-title { letter-spacing: 0.2em; }
  .kl-info-item { flex-direction: column; gap: 0.2rem; }
  .kl-story-card { flex: 0 0 220px; }
  .kl-sns-grid { grid-template-columns: 1fr 1fr; gap: 0.7rem; }
  .kl-sns-card { padding: 1rem 0.6rem; }
}
`;
