// src/annai_page.js
// =========================================================
// 気良歌舞伎 公演案内の受け取り方法 — /kerakabuki/annai
// 登録専用の恒久ページ。年号・演目を書かないこと（毎年使い回す）
// はがき・芳名帳・受付・SNS すべての登録導線をここに集約する
// スタンドアロン HTML・ダークテーマ・CSSプレフィックス: an-
// =========================================================

// トーク画面を開き、入力欄に「はがき」を自動で入れる。利用者は送信を押すだけ
const LINE_ADD_URL = "https://line.me/R/oaMessage/@117oizby/?" + encodeURIComponent("はがき");

export function annaiPageHTML() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>公演案内の受け取り方法 — 気良歌舞伎</title>
<meta name="description" content="気良歌舞伎の公演案内を、LINE・メール・郵送からお選びいただけます。登録・変更・停止はこのページから。">
<meta property="og:title" content="公演案内の受け取り方法 — 気良歌舞伎">
<meta property="og:description" content="LINE・メール・郵送からお選びいただけます。">
<meta property="og:image" content="https://kabukiplus.com/assets/ogp/ogp_kabukiplus_top.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="気良歌舞伎">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/kera-favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/kera-touch-icon.png">
<meta name="theme-color" content="#0a0a0f">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>${AN_CSS}</style>
</head>
<body>

<header class="an-hero">
  <a href="/kerakabuki" class="an-brand">気良歌舞伎</a>
  <h1 class="an-title">公演案内の<br>受け取り方法</h1>
  <p class="an-lead">
    気良歌舞伎は毎年<strong>9月第4土曜日</strong>に定期公演を行っています。<br>
    次回からのご案内を、受け取りやすい方法でお届けします。
  </p>
</header>

<main class="an-main">

  <!-- ① LINE ── いちばん簡単 -->
  <section class="an-opt an-opt-line">
    <div class="an-opt-head">
      <span class="an-badge">おすすめ</span>
      <h2 class="an-opt-title">LINEで受け取る</h2>
    </div>
    <p class="an-opt-desc">
      ボタンを押すと、メッセージが入力された状態でトークが開きます。<br>
      <strong>送信を押すだけ</strong>。文字の入力は要りません。
    </p>
    <a href="${LINE_ADD_URL}" target="_blank" rel="noopener" class="an-line-btn">
      <span class="an-line-icon">💬</span>
      <span>LINEで登録する</span>
    </a>
    <ol class="an-steps">
      <li>上のボタンを押す（未追加の方は友だち追加）</li>
      <li>入力済みのメッセージを <b>そのまま送信</b></li>
      <li>表示されたボタンを押して完了</li>
    </ol>
  </section>

  <!-- ② メール -->
  <section class="an-opt">
    <div class="an-opt-head"><h2 class="an-opt-title">メールで受け取る</h2></div>
    <p class="an-opt-desc">LINEをお使いでない方はこちら。</p>
    <form id="an-mail" class="an-form" novalidate>
      <label class="an-field">
        <span>お名前</span>
        <input type="text" name="name" autocomplete="name" placeholder="気良　太郎" required>
      </label>
      <label class="an-field">
        <span>メールアドレス</span>
        <input type="email" name="email" autocomplete="email" inputmode="email" placeholder="example@example.com" required>
      </label>
      <fieldset class="an-field an-radios">
        <legend>これからの郵送はどうしますか</legend>
        <label><input type="radio" name="postal" value="keep" checked> 郵送も続けてほしい</label>
        <label><input type="radio" name="postal" value="stop"> メールだけでよい（郵送を止める）</label>
      </fieldset>
      <button type="submit" class="an-submit">登録する</button>
      <p class="an-msg" id="an-mail-msg" role="status"></p>
    </form>
  </section>

  <!-- ③ 郵送 -->
  <section class="an-opt">
    <div class="an-opt-head"><h2 class="an-opt-title">郵送で受け取る</h2></div>
    <p class="an-opt-desc">
      すでにはがきが届いている方は<strong>お手続きは要りません。</strong>いままで通りお届けします。
    </p>
    <details class="an-details">
      <summary>はがきを新しく受け取りたい</summary>
      <form id="an-post" class="an-form" novalidate>
        <label class="an-field">
          <span>お名前</span>
          <input type="text" name="name" autocomplete="name" placeholder="気良　太郎" required>
        </label>
        <label class="an-field">
          <span>郵便番号</span>
          <input type="text" name="zip" autocomplete="postal-code" inputmode="numeric" placeholder="501-4303" required>
        </label>
        <label class="an-field">
          <span>ご住所</span>
          <input type="text" name="address" autocomplete="street-address" placeholder="岐阜県郡上市明宝気良154" required>
        </label>
        <button type="submit" class="an-submit">はがきの送付を申し込む</button>
        <p class="an-msg" id="an-post-msg" role="status"></p>
      </form>
    </details>
    <details class="an-details">
      <summary>郵送を止めてほしい</summary>
      <form id="an-stop" class="an-form" novalidate>
        <label class="an-field">
          <span>お名前（はがきの宛名）</span>
          <input type="text" name="name" autocomplete="name" placeholder="気良　太郎" required>
        </label>
        <button type="submit" class="an-submit an-submit-quiet">郵送の停止を申し込む</button>
        <p class="an-msg" id="an-stop-msg" role="status"></p>
      </form>
    </details>
  </section>

  <section class="an-privacy">
    <h2 class="an-privacy-title">お預かりする情報について</h2>
    <ul>
      <li>いただいたお名前・ご住所・連絡先は、<strong>気良歌舞伎の公演案内にのみ</strong>使用します</li>
      <li>他の目的への利用や、第三者への提供はいたしません</li>
      <li>配信の停止・変更は、このページからいつでも承ります</li>
      <li>LINEは、トーク画面で「郵送停止」と送っていただければ郵送のみ止められます</li>
    </ul>
  </section>

</main>

<footer class="an-footer">
  <p class="an-footer-name">気良歌舞伎一座</p>
  <p class="an-footer-addr">事務局 〒501-4303 岐阜県郡上市明宝気良2264</p>
  <nav class="an-footer-links">
    <a href="/kerakabuki">公式サイト</a>
    <a href="/kerakabuki/guide">はじめての方へ</a>
    <a href="https://www.instagram.com/kerakabuki_official/" target="_blank" rel="noopener">Instagram</a>
  </nav>
</footer>

<script>
(function(){
  function post(form, msgEl, extra){
    var fd = new FormData(form), body = { source: "annai" };
    fd.forEach(function(v,k){ body[k] = v; });
    Object.assign(body, extra || {});
    msgEl.textContent = "送信中…"; msgEl.className = "an-msg";
    return fetch("/api/kera/notify", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    }).then(function(r){ return r.json().then(function(j){ return { ok: r.ok, j: j }; }); })
      .then(function(res){
        if (res.ok && res.j.ok) {
          msgEl.textContent = "受け付けました。ありがとうございます。";
          msgEl.className = "an-msg an-ok";
          form.querySelector(".an-submit").disabled = true;
        } else {
          msgEl.textContent = (res.j && res.j.error) || "送信できませんでした。時間をおいてお試しください。";
          msgEl.className = "an-msg an-ng";
        }
      })
      .catch(function(){
        msgEl.textContent = "通信に失敗しました。電波の良い場所でお試しください。";
        msgEl.className = "an-msg an-ng";
      });
  }
  var m = document.getElementById("an-mail");
  if (m) m.addEventListener("submit", function(e){
    e.preventDefault();
    var msg = document.getElementById("an-mail-msg");
    if (!m.name.value.trim()) { msg.textContent = "お名前をご記入ください。"; msg.className = "an-msg an-ng"; return; }
    if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(m.email.value.trim())) { msg.textContent = "メールアドレスをご確認ください。"; msg.className = "an-msg an-ng"; return; }
    post(m, msg, { channel: "email" });
  });
  var p = document.getElementById("an-post");
  if (p) p.addEventListener("submit", function(e){
    e.preventDefault();
    var msg = document.getElementById("an-post-msg");
    if (!p.name.value.trim()) { msg.textContent = "お名前をご記入ください。"; msg.className = "an-msg an-ng"; return; }
    if (!/^\\d{3}-?\\d{4}$/.test(p.zip.value.trim())) { msg.textContent = "郵便番号を7桁でご記入ください。"; msg.className = "an-msg an-ng"; return; }
    if (!p.address.value.trim()) { msg.textContent = "ご住所をご記入ください。"; msg.className = "an-msg an-ng"; return; }
    post(p, msg, { channel: "postal", postal: "keep" });
  });
  var s = document.getElementById("an-stop");
  if (s) s.addEventListener("submit", function(e){
    e.preventDefault();
    var msg = document.getElementById("an-stop-msg");
    if (!s.name.value.trim()) { msg.textContent = "お名前をご記入ください。"; msg.className = "an-msg an-ng"; return; }
    post(s, msg, { channel: "postal_stop", postal: "stop" });
  });
})();
</script>

</body>
</html>`;
}

const AN_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif;
  background: #0a0a0f; color: #e8e4dc; line-height: 1.9;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; }

.an-hero {
  padding: 2.6rem 1.4rem 2.2rem; text-align: center;
  background: linear-gradient(180deg, #14121e 0%, #0a0a0f 100%);
  border-bottom: 1px solid rgba(197,162,85,0.18);
}
.an-brand {
  font-family: "Noto Serif JP", serif; font-size: 0.9rem;
  color: #c5a255; letter-spacing: 0.24em; text-decoration: none;
}
.an-title {
  font-family: "Noto Serif JP", serif;
  font-size: clamp(1.6rem, 8vw, 2.1rem); font-weight: 700;
  letter-spacing: 0.1em; line-height: 1.5; margin: 1.1rem 0 0.9rem;
  text-wrap: balance;
}
.an-lead { font-size: 0.9rem; color: #b8a88a; }

.an-main { max-width: 620px; margin: 0 auto; padding: 2rem 1.4rem 1rem; display: grid; gap: 1rem; }

.an-opt {
  background: rgba(18,18,28,0.75); border: 1px solid rgba(197,162,85,0.16);
  border-radius: 12px; padding: 1.3rem 1.3rem 1.4rem;
}
.an-opt-line { border-color: rgba(6,199,85,0.45); background: rgba(6,199,85,0.05); }
.an-opt-head { display: flex; align-items: center; gap: 0.7rem; flex-wrap: wrap; margin-bottom: 0.6rem; }
.an-opt-title { font-size: 1.1rem; font-weight: 700; letter-spacing: 0.06em; }
.an-badge {
  font-size: 0.68rem; font-weight: 700; letter-spacing: 0.12em;
  background: #06C755; color: #05240f; border-radius: 3px; padding: 0.15rem 0.5rem;
}
.an-opt-desc { font-size: 0.9rem; color: #b8a88a; margin-bottom: 1rem; }
.an-opt-desc strong, .an-lead strong { color: #e8c96a; }

.an-line-btn {
  display: flex; align-items: center; justify-content: center; gap: 0.6rem;
  background: #06C755; color: #fff; text-decoration: none; font-weight: 700;
  border-radius: 10px; padding: 0.95rem 1rem; font-size: 1.02rem;
  box-shadow: 0 4px 18px rgba(6,199,85,0.22);
}
.an-line-icon { font-size: 1.25rem; }
.an-steps { margin: 1rem 0 0 1.2rem; display: grid; gap: 0.3rem; }
.an-steps li { font-size: 0.86rem; color: #a99c86; }
.an-steps li::marker { color: #06C755; font-weight: 700; }
.an-steps b { color: #e8e4dc; }

.an-details { border-top: 1px solid rgba(197,162,85,0.14); margin-top: 0.9rem; }
.an-details summary {
  cursor: pointer; list-style: none; padding: 0.85rem 0 0.3rem;
  font-size: 0.9rem; color: #b8a88a;
  display: flex; justify-content: space-between; align-items: center;
}
.an-details summary::-webkit-details-marker { display: none; }
.an-details summary::after { content: "＋"; color: #c5a255; }
.an-details[open] summary::after { content: "−"; }

.an-form { display: grid; gap: 0.9rem; padding-top: 0.5rem; }
.an-field { display: grid; gap: 0.35rem; border: none; }
.an-field > span, .an-field legend { font-size: 0.82rem; color: #b8a88a; letter-spacing: 0.06em; }
.an-field input[type="text"], .an-field input[type="email"] {
  width: 100%; padding: 0.8rem 0.9rem; font-size: 1rem; font-family: inherit;
  background: #0a0a0f; color: #e8e4dc;
  border: 1px solid rgba(197,162,85,0.3); border-radius: 8px;
}
.an-field input:focus-visible { outline: 2px solid #c5a255; outline-offset: 1px; }
.an-radios { display: grid; gap: 0.45rem; }
.an-radios label { display: flex; align-items: center; gap: 0.55rem; font-size: 0.9rem; color: #cfc7b8; cursor: pointer; }
.an-submit {
  padding: 0.85rem 1rem; font-size: 1rem; font-weight: 600; font-family: inherit;
  background: #c5a255; color: #16130c; border: none; border-radius: 8px;
  cursor: pointer; letter-spacing: 0.08em;
}
.an-submit:disabled { opacity: 0.5; cursor: default; }
.an-submit-quiet { background: transparent; color: #b8a88a; border: 1px solid rgba(197,162,85,0.35); }
.an-msg { font-size: 0.86rem; min-height: 1.2em; }
.an-ok { color: #6fd08c; }
.an-ng { color: #e88b7d; }

.an-privacy {
  border: 1px dashed rgba(197,162,85,0.22); border-radius: 12px;
  padding: 1.1rem 1.3rem; margin-top: 0.4rem;
}
.an-privacy-title { font-size: 0.92rem; font-weight: 600; color: #c5a255; margin-bottom: 0.6rem; letter-spacing: 0.06em; }
.an-privacy ul { list-style: none; display: grid; gap: 0.4rem; }
.an-privacy li { font-size: 0.84rem; color: #a99c86; padding-left: 1rem; position: relative; }
.an-privacy li::before { content: "・"; position: absolute; left: 0; color: #8c7d64; }
.an-privacy strong { color: #cfc7b8; }

.an-footer {
  margin-top: 2.4rem; padding: 2rem 1.4rem 3rem; text-align: center;
  border-top: 1px solid rgba(197,162,85,0.16);
}
.an-footer-name { font-family: "Noto Serif JP", serif; font-size: 0.98rem; color: #c5a255; letter-spacing: 0.16em; }
.an-footer-addr { font-size: 0.8rem; color: #8c7d64; margin-top: 0.3rem; }
.an-footer-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; margin-top: 1.1rem; }
.an-footer-links a { font-size: 0.85rem; color: #b8a88a; text-decoration: none; }

@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
`;
