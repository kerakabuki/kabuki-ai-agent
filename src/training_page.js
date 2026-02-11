// =============================================================
// お稽古モード トップページ — /training
// =============================================================
export function trainingPageHTML() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>気良歌舞伎 お稽古モード</title>
<style>
  :root {
    --kuro: #1a1a1a;
    --aka: #C41E3A;
    --moegi: #6B8E23;
    --kin: #C5A55A;
    --shiro: #F5F0E8;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: "Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", serif;
    background: var(--kuro);
    color: var(--shiro);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* ── 定式幕ストライプ（細め） ── */
  .joshikimaku {
    height: 5px;
    background: repeating-linear-gradient(
      90deg,
      var(--kuro) 0%, var(--kuro) 33.33%,
      var(--moegi) 33.33%, var(--moegi) 66.66%,
      var(--aka) 66.66%, var(--aka) 100%
    );
    flex-shrink: 0;
  }

  /* ── ヘッダー（コンパクトに） ── */
  header {
    text-align: center;
    padding: 1.5rem 1rem 1rem;
    background: linear-gradient(180deg, rgba(26,26,26,1) 0%, rgba(40,20,20,0.95) 100%);
    border-bottom: 2px solid var(--kin);
  }
  header h1 {
    font-size: 1.6rem;
    letter-spacing: 0.3em;
    color: var(--kin);
    text-shadow: 0 2px 8px rgba(0,0,0,0.7);
  }
  header h1::before {
    content: "🎭 ";
    font-size: 1.3rem;
  }
  header p {
    margin-top: 0.3rem;
    font-size: 0.85rem;
    color: #999;
    letter-spacing: 0.1em;
  }

  /* ── メイン ── */
  main {
    max-width: 780px;
    margin: 0 auto;
    padding: 1.5rem 1rem 1.5rem;
    flex: 1;
    width: 100%;
  }

  .section-title {
    font-size: 1rem;
    color: var(--kin);
    border-left: 4px solid var(--aka);
    padding-left: 0.8rem;
    margin: 0 0 1rem;
    letter-spacing: 0.15em;
  }

  /* ── カードグリッド（大きく） ── */
  .card-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 540px) {
    .card-grid { grid-template-columns: 1fr; }
  }

  /* ── カード共通 ── */
  .card {
    background: linear-gradient(135deg, #2a2020 0%, #1e1e1e 100%);
    border: 2px solid #333;
    border-radius: 14px;
    padding: 1.5rem 1.3rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 200px;
  }
  .card::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--aka), var(--moegi));
  }

  /* バッジ右上 */
  .card .badge {
    position: absolute;
    top: 10px; right: 10px;
    font-size: 0.7rem;
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--aka);
    color: #fff;
    letter-spacing: 0.05em;
  }
  .card .badge.gray { background: #555; }

  .card .icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
  .card h3 {
    font-size: 1.15rem;
    color: var(--shiro);
    margin-bottom: 0.4rem;
    letter-spacing: 0.1em;
  }
  .card .catch {
    font-size: 0.95rem;
    color: var(--kin);
    margin-bottom: 0.3rem;
    font-weight: bold;
  }
  .card .desc {
    font-size: 0.8rem;
    color: #999;
    line-height: 1.5;
  }
  .card .spacer { flex: 1; }

  /* CTAボタン */
  .card .cta {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.8rem;
    padding: 0.5rem 1.2rem;
    border-radius: 8px;
    font-size: 0.95rem;
    font-family: inherit;
    letter-spacing: 0.1em;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }
  .cta-primary {
    background: linear-gradient(135deg, var(--aka) 0%, #8B0000 100%);
    color: #fff;
    border: 1px solid var(--kin) !important;
  }
  .cta-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(197,165,90,0.3);
  }
  .cta-disabled {
    background: #333;
    color: #777;
    cursor: not-allowed;
  }

  /* アクティブカード */
  .card-active {
    border-color: var(--kin);
    cursor: pointer;
  }
  .card-active:hover {
    border-color: var(--kin);
    transform: translateY(-4px);
    box-shadow: 0 8px 28px rgba(197,165,90,0.2);
  }

  /* 無効カード */
  .card-disabled {
    opacity: 0.55;
    filter: grayscale(0.2);
    cursor: not-allowed;
  }
  .card-disabled:hover {
    transform: none;
    box-shadow: none;
  }

  /* ── 舞台設営中（Coming Soon）看板 ── */
  .construction-panel {
    margin-bottom: 1.5rem;
    padding: 1.5rem 1.2rem;
    background: linear-gradient(145deg, #1f1814 0%, #2a2020 50%, #1a1512 100%);
    border: 2px solid rgba(197,165,90,0.4);
    border-radius: 14px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .construction-panel::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: repeating-linear-gradient(
      -35deg,
      transparent,
      transparent 8px,
      rgba(197,165,90,0.03) 8px,
      rgba(197,165,90,0.03) 10px
    );
    pointer-events: none;
  }
  .construction-panel .main-msg {
    font-size: 1.25rem;
    color: var(--kin);
    letter-spacing: 0.2em;
    margin-bottom: 0.25rem;
    position: relative;
  }
  .construction-panel .sub-msg {
    font-size: 0.85rem;
    color: #999;
    letter-spacing: 0.1em;
    margin-bottom: 1rem;
    position: relative;
  }
  .benten-quote {
    position: relative;
    display: inline-block;
    max-width: 320px;
    margin: 0 auto;
    padding: 0.9rem 1.4rem;
    background: linear-gradient(135deg, #2a1a1a 0%, #1a1512 100%);
    border-left: 4px solid var(--aka);
    border-radius: 0 12px 12px 0;
    text-align: left;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  }
  .benten-quote .text {
    font-size: 1.05rem;
    color: var(--shiro);
    font-style: italic;
    letter-spacing: 0.08em;
    line-height: 1.6;
  }
  .benten-quote .role {
    font-size: 0.7rem;
    color: var(--kin);
    margin-top: 0.5rem;
    letter-spacing: 0.15em;
  }
  .beta-recruit {
    margin-top: 1rem;
    padding: 0.8rem 1rem;
    background: rgba(107,142,35,0.12);
    border: 1px solid rgba(107,142,35,0.35);
    border-radius: 10px;
    font-size: 0.8rem;
    color: #b8c9a0;
    line-height: 1.6;
    text-align: center;
    position: relative;
  }
  .beta-recruit strong { color: var(--moegi); }

  /* ── バナー ── */
  .banner {
    margin-top: 1.5rem;
    background: linear-gradient(135deg, var(--aka) 0%, #8B0000 100%);
    border-radius: 14px;
    padding: 1.3rem 1.5rem;
    text-align: center;
    border: 1px solid rgba(197,165,90,0.3);
  }
  .banner h2 {
    font-size: 1.1rem;
    color: var(--kin);
    margin-bottom: 0.4rem;
  }
  .banner p {
    font-size: 0.85rem;
    color: rgba(255,255,255,0.85);
    line-height: 1.6;
  }
  .banner .banner-cta {
    display: inline-block;
    margin-top: 0.8rem;
    padding: 0.5rem 1.5rem;
    background: var(--kin);
    color: var(--kuro);
    font-size: 0.9rem;
    font-family: inherit;
    font-weight: bold;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    letter-spacing: 0.1em;
    transition: all 0.2s;
    text-decoration: none;
  }
  .banner .banner-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(197,165,90,0.4);
  }

  /* ── フッター ── */
  footer {
    text-align: center;
    padding: 1rem;
    font-size: 0.8rem;
    color: #555;
    border-top: 1px solid #333;
    flex-shrink: 0;
  }
  footer a { color: var(--kin); text-decoration: none; }
  footer a:hover { text-decoration: underline; }

  /* ── アニメーション ── */
  @keyframes fadeUp {
    from { opacity:0; transform: translateY(16px); }
    to   { opacity:1; transform: translateY(0); }
  }
  .card { animation: fadeUp 0.5s ease both; }
  .card:nth-child(2) { animation-delay: 0.1s; }
  .banner { animation: fadeUp 0.5s ease 0.2s both; }
  .construction-panel { animation: fadeUp 0.5s ease 0.05s both; }
</style>
</head>
<body>

<div class="joshikimaku"></div>

<header>
  <h1>お稽古モード</h1>
  <p>気良歌舞伎 ── 学びの間</p>
</header>

<main>
  <section class="construction-panel">
    <p class="main-msg">ただいま舞台設営中</p>
    <p class="sub-msg">お稽古の準備をしています</p>
    <div class="benten-quote">
      <p class="text">「ちょっと待ってな。いい舞台、見せてやるからさ。」</p>
      <p class="role">── 弁天小僧（予告）</p>
    </div>
    <div class="beta-recruit">
      <strong>🛠️ ベータテスター募集</strong><br>
      地歌舞伎役者の方で、開発中の修行モードを試してみたい方はDMください。
    </div>
  </section>

  <h2 class="section-title">稽古メニュー</h2>
  <div class="card-grid">

    <div class="card card-active" onclick="location.href='/training/kakegoe'">
      <span class="badge">NEW</span>
      <div class="icon">📣</div>
      <h3>大向こう稽古</h3>
      <div class="catch">掛け声と拍手のタイミングを体で覚える</div>
      <div class="desc">白浪五人男「稲瀬川勢揃い」</div>
      <div class="spacer"></div>
      <div><button class="cta cta-primary" onclick="location.href='/training/kakegoe'">始める →</button></div>
    </div>

    <div class="card card-disabled">
      <span class="badge gray">準備中</span>
      <div class="icon">🎙️</div>
      <h3>台詞道場</h3>
      <div class="catch">名台詞を声に出して稽古する</div>
      <div class="desc">弁天小僧「知らざぁ言って聞かせやしょう」</div>
      <div class="spacer"></div>
      <div><button class="cta cta-disabled" disabled>準備中</button></div>
    </div>

  </div>

  <div class="banner">
    <h2>🏯 次回公演に向けて</h2>
    <p>
      大向こうを練習して、本番の舞台をもっと楽しもう！<br>
      <strong style="color:var(--kin);">「知る」から「観る」へ ── そして「演る」へ。</strong>
    </p>
    <a href="/training/kakegoe" class="banner-cta">大向こう稽古を始める →</a>
  </div>
</main>

<div class="joshikimaku"></div>

<footer>
  <p>気良歌舞伎 AI ガイド「けらのすけ」 &copy; 2026</p>
  <p style="margin-top:4px;"><a href="/">トップへ戻る</a></p>
</footer>

</body>
</html>`;
}
