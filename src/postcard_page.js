// src/postcard_page.js
// =========================================================
// 気良歌舞伎 ポストカード着地ページ — /kerakabuki/pc
// はがきのQRから来た人が、迷わず全部確認できる1枚
// スタンドアロン HTML（pageShell 不使用）
// ダークテーマ・CSSプレフィックス: pc-
// =========================================================

const LINE_ADD_URL = "https://line.me/R/ti/p/@117oizby";

export function postcardPageHTML() {

  // ── 宿泊（気良・明宝エリア）──
  // TODO: 電話番号は座で確認のうえ tel を埋める（空文字なら電話ボタン非表示）
  // ※ 気良地区の宿は小規模。祭礼と重なるため、当年の案内では期待値を上げすぎないこと
  const STAYS = [
    { name: "料理旅館みずかみ", area: "気良",     note: "気良地区の料理旅館。小規模です", tel: "" },
    { name: "旅館くご",         area: "気良",     note: "気良地区の旅館。小規模です",     tel: "" },
    { name: "民宿しもだ",       area: "気良",     note: "気良地区の民宿。小規模です",     tel: "" },
    { name: "明宝温泉 湯星館",  area: "明宝",     note: "天然温泉。日帰り入浴もできます", tel: "" },
    { name: "郡上八幡エリア",   area: "車で30分", note: "ホテル・旅館が多く、部屋数に余裕があります", tel: "" },
    { name: "白鳥・高鷲エリア", area: "車で40分", note: "スキー場周辺に宿泊施設が多数",   tel: "" },
  ];

  const FAQ = [
    { q: "予約は必要ですか？",       a: "不要です。自由席・入場無料。そのまま会場へお越しください。" },
    { q: "席は取れますか？",         a: "自由席で椅子には限りがあります。17:00の開場に合わせてお越しいただくと安心です。座布団や敷物があるとより楽です。" },
    { q: "服装は？",                 a: "会場は靴を脱いで上がります。脱ぎやすい靴が便利です（靴袋は会場にあります）。秋の夜は外が冷える一方、場内は熱気で暑くなることも。脱ぎ着しやすい服装を。" },
    { q: "トイレはありますか？",     a: "隣接する明宝歴史民俗資料館のトイレをご利用ください。" },
    { q: "飲食はできますか？",       a: "常設の売店はありません。飲み物は持参をおすすめします。公演によっては屋外に軽食の出店が出ることがあります。" },
    { q: "子ども連れでも大丈夫？",   a: "大歓迎です。子役として出ているメンバーもいます。泣いてしまったら一時的に外に出ていただければ問題ありません。" },
    { q: "ご祝儀・おひねりとは？",   a: "ご祝儀は応援の気持ちとして受付でお預かりするものです。おひねりは小銭などを紙に包み、役者が見得を切ったタイミングで舞台に投げて応援します。どちらも必須ではありません。" },
    { q: "バリアフリーですか？",     a: "対応施設ではありません。入口で靴を脱いで上がる際に段差があります。荷物の預かりやロッカーはないため、お手荷物は最小限でお越しください。" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TheaterEvent",
    "name": "令和八年 気良歌舞伎公演「曽根崎心中」",
    "startDate": "2026-09-26T18:00+09:00",
    "endDate": "2026-09-26T21:00+09:00",
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place",
      "name": "気良座（旧明方小学校講堂）",
      "address": {
        "@type": "PostalAddress",
        "postalCode": "501-4303",
        "addressRegion": "岐阜県",
        "addressLocality": "郡上市明宝気良",
        "streetAddress": "154",
        "addressCountry": "JP"
      }
    },
    "organizer": { "@type": "Organization", "name": "気良歌舞伎一座", "url": "https://kabukiplus.com/kerakabuki" },
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY", "availability": "https://schema.org/InStock", "url": "https://kabukiplus.com/kerakabuki/pc" }
  };

  const stayCards = STAYS.map(s => `
    <div class="pc-stay pc-reveal">
      <div class="pc-stay-head">
        <span class="pc-stay-name">${s.name}</span>
        <span class="pc-stay-area">${s.area}</span>
      </div>
      <p class="pc-stay-note">${s.note}</p>
      ${s.tel ? `<a href="tel:${s.tel.replace(/[^0-9]/g, "")}" class="pc-stay-tel">📞 ${s.tel}</a>` : ""}
    </div>`).join("");

  const faqItems = FAQ.map(f => `
    <details class="pc-faq pc-reveal">
      <summary>${f.q}</summary>
      <p>${f.a}</p>
    </details>`).join("");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>ご来場ガイド — 令和八年 気良歌舞伎公演</title>
<meta name="description" content="令和八年 気良歌舞伎公演「曽根崎心中」9月26日（土）17:00開場 18:00開演。入場無料・予約不要。アクセス、駐車場、宿泊、観劇のしかたをまとめました。">
<meta property="og:title" content="ご来場ガイド — 令和八年 気良歌舞伎公演">
<meta property="og:description" content="9月26日（土）18:00開演「曽根崎心中」。アクセス・宿泊・観劇のしかた。">
<meta property="og:image" content="https://kabukiplus.com/assets/ogp/ogp_kabukiplus_top.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="気良歌舞伎">
<meta name="twitter:card" content="summary_large_image">
<meta name="robots" content="noindex">
<link rel="icon" href="/assets/kera-favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/kera-touch-icon.png">
<meta name="theme-color" content="#0a0a0f">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>${PC_CSS}</style>
</head>
<body>

<!-- ═══════ HERO ═══════ -->
<header class="pc-hero">
  <p class="pc-hero-kicker">令和八年　気良歌舞伎公演</p>
  <h1 class="pc-hero-title">曽根崎心中</h1>
  <p class="pc-hero-sub">この世のなごり、夜もなごり。</p>
  <div class="pc-hero-date">
    <span class="pc-hero-md">9.26</span>
    <span class="pc-hero-dow">土</span>
  </div>
  <p class="pc-hero-venue">気良座（旧明方小学校講堂）</p>
</header>

<!-- ═══════ ① 公演情報 ═══════ -->
<section class="pc-section" id="info">
  <h2 class="pc-h2">公演情報</h2>
  <dl class="pc-facts pc-reveal">
    <div><dt>開　場</dt><dd>17:00</dd></div>
    <div><dt>開　演</dt><dd>18:00</dd></div>
    <div><dt>終　演</dt><dd>21:00 ごろ</dd></div>
    <div><dt>会　場</dt><dd>気良座<br><span class="pc-dim">〒501-4303 岐阜県郡上市明宝気良154</span></dd></div>
    <div><dt>入　場</dt><dd>無料・予約不要<br><span class="pc-dim">自由席（椅子に限りがあります）</span></dd></div>
    <div><dt>演　目</dt><dd>曽根崎心中　全三場<br><span class="pc-dim">生玉社前ノ場・天満屋ノ場・天神森ノ場</span></dd></div>
  </dl>
  <p class="pc-note pc-reveal">
    <strong>席は自由席です。</strong>良いお席をご希望の方は、17:00の開場に合わせてお越しください。
  </p>
</section>

<!-- ═══════ ② お帰りの計画 ═══════ -->
<section class="pc-section pc-section-accent" id="stay">
  <h2 class="pc-h2">お帰りの計画</h2>
  <p class="pc-lead pc-reveal">
    終演は21時ごろです。<strong>終演後の路線バスはありません。</strong><br>
    ほとんどのお客さまは<strong>お車で日帰り</strong>されています。
  </p>

  <div class="pc-card pc-reveal" style="margin-bottom:1.2rem;">
    <h3 class="pc-card-title">🚗 日帰りの目安</h3>
    <ul>
      <li>気良座から東海北陸自動車道 <strong>郡上八幡IC まで約30分</strong></li>
      <li>21:00終演 → 21:30ごろIC → そのまま高速でお帰りいただけます</li>
      <li>夜間の山道になります。ライトと足元にお気をつけて</li>
    </ul>
  </div>

  <h3 class="pc-h3 pc-reveal">ゆっくりされたい方へ（宿泊）</h3>
  <p class="pc-dim pc-reveal" style="margin-bottom:0.8rem;font-size:0.86rem;">
    <strong style="color:#e8c96a;">気良地区の宿は小規模で、9月第4土曜は白山神社の祭礼とも重なります。</strong>
    満室のことが多いため、お早めにお問い合わせいただくか、部屋数に余裕のある郡上八幡エリアもあわせてご検討ください。
  </p>
  <div class="pc-stays">${stayCards}</div>

  <h3 class="pc-h3 pc-reveal">立ち寄る</h3>
  <ul class="pc-list pc-reveal">
    <li><strong>明宝温泉 湯星館</strong> — 日帰り入浴ができます。公演前のひと風呂もおすすめ</li>
    <li><strong>鶏ちゃん（けいちゃん）</strong> — 郡上の郷土料理。味噌や醤油で味付けした鶏肉を野菜と焼く</li>
    <li><strong>明宝ハム</strong> — 地元の豚肉を使った手作りハム。お土産にも</li>
    <li><strong>明宝トマトケチャップ</strong> — 完熟トマト100%</li>
  </ul>
  <p class="pc-dim pc-reveal" style="margin-top:0.8rem;font-size:0.82rem;">
    ※ 公演は18:00開演です。日中に立ち寄られると、ゆったりお過ごしいただけます。
  </p>
</section>

<!-- ═══════ ③ アクセス ═══════ -->
<section class="pc-section" id="access">
  <h2 class="pc-h2">アクセス</h2>

  <div class="pc-cards">
    <div class="pc-card pc-reveal">
      <h3 class="pc-card-title">🚗 車でお越しの方</h3>
      <ul>
        <li>東海北陸自動車道 <strong>郡上八幡IC</strong> から国道472号経由で<strong>約30分</strong></li>
        <li>カーナビは <strong>「明宝歴史民俗資料館」</strong> を目的地に設定してください</li>
        <li><strong>駐車場は無料</strong>です（台数に限りがあります）</li>
      </ul>
    </div>
    <div class="pc-card pc-reveal">
      <h3 class="pc-card-title">🚌 公共交通機関でお越しの方</h3>
      <ul>
        <li>長良川鉄道 <strong>郡上八幡駅</strong> から明宝線バスで「明宝庁舎前」下車、徒歩約10分</li>
        <li><strong>終演後のバスはありません。</strong>公共交通のみでの往復は難しいため、お車か近隣での宿泊をご計画ください</li>
      </ul>
    </div>
  </div>

  <div class="pc-map pc-reveal">
    <iframe
      src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d1600!2d137.030034!3d35.857015!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2z5bKQ6Zic55yM6YOh5LiK5biC5piO5a6d5rCX6Imv!5e0!3m2!1sja!2sjp"
      width="100%" height="320" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
      title="気良座の地図"></iframe>
  </div>
</section>

<!-- ═══════ ④ 観劇のしかた / FAQ ═══════ -->
<section class="pc-section" id="faq">
  <h2 class="pc-h2">よくあるご質問</h2>
  <div class="pc-faqs">${faqItems}</div>
  <p class="pc-more pc-reveal"><a href="/kerakabuki/guide">観劇ガイドをもっと見る →</a></p>
</section>

<!-- ═══════ ⑤ 次回からの案内 ═══════ -->
<section class="pc-section pc-section-optin" id="optin">
  <h2 class="pc-h2">次回からのご案内</h2>
  <p class="pc-lead pc-reveal">
    来年の公演案内を、<strong>受け取りやすい方法でお届け</strong>します。<br>
    今まで通り郵送をご希望の方は、そのままで結構です。
  </p>

  <a href="${LINE_ADD_URL}" target="_blank" rel="noopener" class="pc-line-btn pc-reveal" id="pc-line-btn">
    <span class="pc-line-icon">💬</span>
    <span class="pc-line-text">
      <strong>LINEで受け取る</strong>
      <small>タップして友だち追加 → 「はがき」と送信</small>
    </span>
  </a>

  <details class="pc-optin-alt pc-reveal">
    <summary>メールで受け取る</summary>
    <form id="pc-form" class="pc-form" novalidate>
      <label class="pc-field">
        <span>お名前</span>
        <input type="text" name="name" autocomplete="name" placeholder="気良　太郎" required>
      </label>
      <label class="pc-field">
        <span>メールアドレス</span>
        <input type="email" name="email" autocomplete="email" inputmode="email" placeholder="example@example.com" required>
      </label>
      <fieldset class="pc-field pc-radios">
        <legend>これからの郵送はどうしますか</legend>
        <label><input type="radio" name="postal" value="keep" checked> 郵送も続けてほしい</label>
        <label><input type="radio" name="postal" value="stop"> メールだけでよい（郵送を止める）</label>
      </fieldset>
      <button type="submit" class="pc-submit">登録する</button>
      <p class="pc-form-msg" id="pc-msg" role="status"></p>
      <p class="pc-dim" style="font-size:0.78rem;">
        いただいた連絡先は、気良歌舞伎の公演案内にのみ使用します。配信停止はいつでも承ります。
      </p>
    </form>
  </details>

  <details class="pc-optin-alt pc-reveal">
    <summary>郵送を止めてほしい</summary>
    <form id="pc-stop-form" class="pc-form" novalidate>
      <label class="pc-field">
        <span>お名前（はがきの宛名）</span>
        <input type="text" name="name" autocomplete="name" placeholder="気良　太郎" required>
      </label>
      <button type="submit" class="pc-submit pc-submit-quiet">郵送の停止を申し込む</button>
      <p class="pc-form-msg" id="pc-stop-msg" role="status"></p>
    </form>
  </details>
</section>

<!-- ═══════ FOOTER ═══════ -->
<footer class="pc-footer">
  <p class="pc-footer-name">気良歌舞伎一座</p>
  <p class="pc-footer-addr">〒501-4303 岐阜県郡上市明宝気良154</p>
  <nav class="pc-footer-links">
    <a href="/kerakabuki">公式サイト</a>
    <a href="/kerakabuki/guide">観劇ガイド</a>
    <a href="/kerakabuki/archive">公演アーカイブ</a>
    <a href="https://www.instagram.com/kerakabuki_official/" target="_blank" rel="noopener">Instagram</a>
  </nav>
  <p class="pc-footer-copy">© 気良歌舞伎</p>
</footer>

<script>
(function(){
  // ── reveal ──
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("pc-in"); io.unobserve(e.target); } });
  }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".pc-reveal").forEach(function(el){ io.observe(el); });

  // ── フォーム送信 ──
  function post(form, msgEl, payloadExtra){
    var fd = new FormData(form);
    var body = { source: "postcard2026" };
    fd.forEach(function(v,k){ body[k] = v; });
    Object.assign(body, payloadExtra || {});
    msgEl.textContent = "送信中…";
    msgEl.className = "pc-form-msg";
    return fetch("/api/kera/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(function(r){ return r.json().then(function(j){ return { ok: r.ok, j: j }; }); })
      .then(function(res){
        if (res.ok && res.j.ok) {
          msgEl.textContent = "受け付けました。ありがとうございます。";
          msgEl.className = "pc-form-msg pc-ok";
          form.querySelector(".pc-submit").disabled = true;
        } else {
          msgEl.textContent = (res.j && res.j.error) || "送信できませんでした。時間をおいてお試しください。";
          msgEl.className = "pc-form-msg pc-ng";
        }
      })
      .catch(function(){
        msgEl.textContent = "通信に失敗しました。電波の良い場所でお試しください。";
        msgEl.className = "pc-form-msg pc-ng";
      });
  }

  var f1 = document.getElementById("pc-form");
  if (f1) f1.addEventListener("submit", function(e){
    e.preventDefault();
    var name = f1.name.value.trim(), email = f1.email.value.trim();
    var msg = document.getElementById("pc-msg");
    if (!name) { msg.textContent = "お名前をご記入ください。"; msg.className = "pc-form-msg pc-ng"; return; }
    if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)) { msg.textContent = "メールアドレスをご確認ください。"; msg.className = "pc-form-msg pc-ng"; return; }
    post(f1, msg, { channel: "email" });
  });

  var f2 = document.getElementById("pc-stop-form");
  if (f2) f2.addEventListener("submit", function(e){
    e.preventDefault();
    var msg = document.getElementById("pc-stop-msg");
    if (!f2.name.value.trim()) { msg.textContent = "お名前をご記入ください。"; msg.className = "pc-form-msg pc-ng"; return; }
    post(f2, msg, { channel: "postal_stop", postal: "stop" });
  });
})();
</script>

</body>
</html>`;
}

const PC_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  font-family: "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif;
  background: #0a0a0f; color: #e8e4dc;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
  line-height: 1.85;
}
a { color: inherit; }
img { max-width: 100%; display: block; }

/* ── HERO ── */
.pc-hero {
  padding: 3.4rem 1.4rem 2.8rem;
  text-align: center;
  background: linear-gradient(180deg, #12101c 0%, #0a0a0f 100%);
  border-bottom: 1px solid rgba(197,162,85,0.18);
}
.pc-hero-kicker {
  font-size: 0.78rem; letter-spacing: 0.3em; color: #8c7d64;
  margin-bottom: 0.9rem;
}
.pc-hero-title {
  font-family: "Noto Serif JP", serif;
  font-size: clamp(2.2rem, 12vw, 3.2rem); font-weight: 700;
  color: #e8e4dc; letter-spacing: 0.14em; line-height: 1.3;
}
.pc-hero-sub {
  font-family: "Noto Serif JP", serif;
  font-size: 0.92rem; color: #b8a88a; margin-top: 0.7rem; letter-spacing: 0.08em;
}
.pc-hero-date {
  display: flex; align-items: baseline; justify-content: center; gap: 0.5rem;
  margin: 1.6rem 0 0.6rem;
}
.pc-hero-md {
  font-size: clamp(2.6rem, 15vw, 3.8rem); font-weight: 700;
  color: #c5a255; letter-spacing: 0.02em; line-height: 1;
}
.pc-hero-dow {
  display: inline-block; font-size: 0.9rem; font-weight: 600;
  background: #9e2b25; color: #fff;
  border-radius: 50%; width: 1.9rem; height: 1.9rem; line-height: 1.9rem;
}
.pc-hero-venue { font-size: 0.9rem; color: #b8a88a; letter-spacing: 0.06em; }

/* ── SECTION ── */
.pc-section { padding: 2.8rem 1.4rem; max-width: 720px; margin: 0 auto; }
.pc-section-accent { background: rgba(197,162,85,0.045); max-width: none; }
.pc-section-accent > * { max-width: 720px; margin-left: auto; margin-right: auto; }
.pc-section-optin { background: linear-gradient(180deg, #0a0a0f 0%, #14121e 100%); max-width: none; }
.pc-section-optin > * { max-width: 720px; margin-left: auto; margin-right: auto; }
.pc-h2 {
  font-family: "Noto Serif JP", serif;
  font-size: 1.28rem; font-weight: 600; color: #c5a255;
  letter-spacing: 0.12em; margin-bottom: 1.4rem;
  padding-left: 0.7rem; border-left: 3px solid #9e2b25;
}
.pc-h3 {
  font-size: 0.98rem; font-weight: 600; color: #e8c96a;
  letter-spacing: 0.08em; margin: 1.8rem 0 0.8rem;
}
.pc-lead { font-size: 0.95rem; color: #cfc7b8; margin-bottom: 1.2rem; }
.pc-dim { color: #8c7d64; font-size: 0.85rem; }
.pc-note {
  margin-top: 1.2rem; padding: 0.9rem 1.1rem;
  background: rgba(158,43,37,0.12); border-left: 3px solid #9e2b25;
  border-radius: 0 8px 8px 0; font-size: 0.9rem; color: #dcd4c6;
}

/* ── 公演情報 ── */
.pc-facts { display: grid; gap: 0.1rem; }
.pc-facts > div {
  display: grid; grid-template-columns: 5.2rem 1fr; gap: 0.9rem;
  padding: 0.75rem 0; border-bottom: 1px solid rgba(197,162,85,0.14);
}
.pc-facts dt { font-size: 0.84rem; color: #8c7d64; letter-spacing: 0.18em; }
.pc-facts dd { font-size: 0.98rem; color: #e8e4dc; }

/* ── 宿泊 ── */
.pc-stays { display: grid; gap: 0.7rem; }
.pc-stay {
  background: rgba(18,18,28,0.7); border: 1px solid rgba(197,162,85,0.16);
  border-radius: 10px; padding: 0.9rem 1.1rem;
}
.pc-stay-head { display: flex; align-items: center; gap: 0.7rem; flex-wrap: wrap; }
.pc-stay-name { font-size: 1rem; font-weight: 600; color: #e8e4dc; }
.pc-stay-area {
  font-size: 0.72rem; color: #c5a255; letter-spacing: 0.1em;
  border: 1px solid rgba(197,162,85,0.4); border-radius: 999px; padding: 0.1rem 0.6rem;
}
.pc-stay-note { font-size: 0.85rem; color: #a99c86; margin-top: 0.25rem; }
.pc-stay-tel {
  display: inline-block; margin-top: 0.5rem; font-size: 0.92rem;
  color: #e8c96a; text-decoration: none; font-weight: 600;
}

/* ── リスト・カード ── */
.pc-list { list-style: none; display: grid; gap: 0.55rem; }
.pc-list li {
  font-size: 0.9rem; color: #cfc7b8; padding-left: 1.1rem; position: relative;
}
.pc-list li::before { content: "―"; position: absolute; left: 0; color: #c5a255; }
.pc-cards { display: grid; gap: 0.9rem; }
.pc-card {
  background: rgba(18,18,28,0.7); border: 1px solid rgba(197,162,85,0.16);
  border-radius: 12px; padding: 1.1rem 1.2rem;
}
.pc-card-title { font-size: 0.98rem; font-weight: 600; color: #e8c96a; margin-bottom: 0.6rem; }
.pc-card ul { list-style: none; display: grid; gap: 0.45rem; }
.pc-card li {
  font-size: 0.88rem; color: #cfc7b8; padding-left: 1.1rem; position: relative;
}
.pc-card li::before { content: "・"; position: absolute; left: 0; color: #8c7d64; }
.pc-map { margin-top: 1rem; border-radius: 12px; overflow: hidden; border: 1px solid rgba(197,162,85,0.16); }

/* ── FAQ ── */
.pc-faqs { display: grid; gap: 0.5rem; }
.pc-faq {
  background: rgba(18,18,28,0.7); border: 1px solid rgba(197,162,85,0.14);
  border-radius: 10px; overflow: hidden;
}
.pc-faq summary {
  cursor: pointer; padding: 0.85rem 1.1rem; list-style: none;
  font-size: 0.93rem; font-weight: 500; color: #e8e4dc;
  display: flex; justify-content: space-between; align-items: center; gap: 0.8rem;
}
.pc-faq summary::-webkit-details-marker { display: none; }
.pc-faq summary::after { content: "＋"; color: #c5a255; flex-shrink: 0; }
.pc-faq[open] summary::after { content: "−"; }
.pc-faq p { padding: 0 1.1rem 0.95rem; font-size: 0.88rem; color: #b8ac97; }
.pc-more { margin-top: 1.1rem; font-size: 0.88rem; }
.pc-more a { color: #e8c96a; text-decoration: none; }

/* ── オプトイン ── */
.pc-line-btn {
  display: flex; align-items: center; gap: 0.9rem;
  background: #06C755; color: #fff; text-decoration: none;
  border-radius: 12px; padding: 1rem 1.2rem; margin-bottom: 0.9rem;
  box-shadow: 0 4px 18px rgba(6,199,85,0.22);
}
.pc-line-icon { font-size: 1.5rem; }
.pc-line-text strong { display: block; font-size: 1.02rem; font-weight: 700; }
.pc-line-text small { display: block; font-size: 0.78rem; opacity: 0.9; line-height: 1.6; }
.pc-optin-alt {
  background: rgba(18,18,28,0.7); border: 1px solid rgba(197,162,85,0.16);
  border-radius: 10px; margin-bottom: 0.6rem; overflow: hidden;
}
.pc-optin-alt summary {
  cursor: pointer; list-style: none; padding: 0.85rem 1.1rem;
  font-size: 0.93rem; color: #e8e4dc;
  display: flex; justify-content: space-between; align-items: center;
}
.pc-optin-alt summary::-webkit-details-marker { display: none; }
.pc-optin-alt summary::after { content: "＋"; color: #c5a255; }
.pc-optin-alt[open] summary::after { content: "−"; }

/* ── フォーム ── */
.pc-form { padding: 0 1.1rem 1.1rem; display: grid; gap: 0.9rem; }
.pc-field { display: grid; gap: 0.35rem; border: none; }
.pc-field > span, .pc-field legend {
  font-size: 0.82rem; color: #b8a88a; letter-spacing: 0.06em;
}
.pc-field input[type="text"], .pc-field input[type="email"] {
  width: 100%; padding: 0.75rem 0.9rem; font-size: 1rem;
  background: #0a0a0f; color: #e8e4dc;
  border: 1px solid rgba(197,162,85,0.3); border-radius: 8px;
  font-family: inherit;
}
.pc-field input:focus { outline: 2px solid #c5a255; outline-offset: 1px; }
.pc-radios { display: grid; gap: 0.45rem; }
.pc-radios label {
  display: flex; align-items: center; gap: 0.55rem;
  font-size: 0.9rem; color: #cfc7b8; cursor: pointer;
}
.pc-submit {
  padding: 0.85rem 1rem; font-size: 1rem; font-weight: 600;
  background: #c5a255; color: #16130c; border: none; border-radius: 8px;
  cursor: pointer; font-family: inherit; letter-spacing: 0.08em;
}
.pc-submit:disabled { opacity: 0.5; cursor: default; }
.pc-submit-quiet { background: transparent; color: #b8a88a; border: 1px solid rgba(197,162,85,0.35); }
.pc-form-msg { font-size: 0.86rem; min-height: 1.2em; }
.pc-ok { color: #6fd08c; }
.pc-ng { color: #e88b7d; }

/* ── FOOTER ── */
.pc-footer {
  padding: 2.4rem 1.4rem 3rem; text-align: center;
  border-top: 1px solid rgba(197,162,85,0.16);
}
.pc-footer-name {
  font-family: "Noto Serif JP", serif; font-size: 1rem;
  color: #c5a255; letter-spacing: 0.16em; margin-bottom: 0.4rem;
}
.pc-footer-addr { font-size: 0.82rem; color: #8c7d64; }
.pc-footer-links {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem;
  margin: 1.2rem 0 1rem;
}
.pc-footer-links a { font-size: 0.85rem; color: #b8a88a; text-decoration: none; }
.pc-footer-copy { font-size: 0.75rem; color: #5d5546; }

/* ── reveal ── */
.pc-reveal { opacity: 0; transform: translateY(14px); transition: opacity 0.6s ease, transform 0.6s ease; }
.pc-in { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  .pc-reveal { opacity: 1; transform: none; transition: none; }
  html { scroll-behavior: auto; }
}

@media (min-width: 600px) {
  .pc-cards { grid-template-columns: 1fr 1fr; }
  .pc-stays { grid-template-columns: 1fr 1fr; }
}
`;
