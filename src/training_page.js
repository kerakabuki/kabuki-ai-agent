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
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg-page: #FAF7F2;
    --bg-card: rgba(255,255,255,0.90);
    --bg-subtle: #F3EDE4;
    --text-primary: #3D3127;
    --text-secondary: #7A6F63;
    --text-tertiary: #A89E93;
    --gold: #C5A255;
    --gold-dark: #A8873A;
    --gold-soft: #F5EDD8;
    --accent-1: #D4614B;
    --accent-3: #6B9E78;
    --border-light: #EDE7DD;
    --border-medium: #DDD5C8;
    --shadow-sm: 0 1px 3px rgba(61,49,39,0.06);
    --shadow-md: 0 4px 12px rgba(61,49,39,0.08);
    --radius-md: 12px;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: 'Noto Sans JP', sans-serif;
    background: var(--bg-page);
    color: var(--text-primary);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23A8873A' stroke-width='1.2'%3E%3Cpath d='M0 20 L20 20 L20 0'/%3E%3Cpath d='M20 20 L20 40 L40 40'/%3E%3Cpath d='M40 40 L40 20 L60 20'/%3E%3Cpath d='M60 20 L60 0'/%3E%3Cpath d='M40 40 L40 60 L20 60'/%3E%3Cpath d='M20 60 L20 80'/%3E%3Cpath d='M60 20 L60 40 L80 40'/%3E%3Cpath d='M0 60 L20 60'/%3E%3Cpath d='M60 40 L60 60 L80 60'/%3E%3Cpath d='M40 60 L60 60 L60 80'/%3E%3Cpath d='M0 40 L20 40'/%3E%3Cpath d='M40 0 L40 20'/%3E%3Cpath d='M80 0 L80 20'/%3E%3Cpath d='M80 60 L80 80'/%3E%3Cpath d='M40 80 L40 60'/%3E%3Cpath d='M0 0 L0 20'/%3E%3Cpath d='M0 60 L0 80'/%3E%3C/g%3E%3C/svg%3E");
    background-size: 80px 80px;
  }
  body > * { position: relative; z-index: 1; }

  /* ── ヘッダー（コンパクトに） ── */
  header {
    text-align: center;
    padding: 1.5rem 1rem 1rem;
    background: var(--bg-card);
    border-bottom: 1px solid var(--border-light);
  }
  header h1 {
    font-size: 1.6rem;
    letter-spacing: 5px;
    color: var(--text-primary);
    font-family: 'Noto Serif JP', serif;
  }
  header h1::before {
    content: "🎭 ";
    font-size: 1.3rem;
  }
  header p {
    margin-top: 0.3rem;
    font-size: 0.85rem;
    color: var(--text-tertiary);
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
    color: var(--text-primary);
    border-left: 4px solid var(--gold);
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
    background: var(--bg-card);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: 1.5rem 1.3rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 200px;
    box-shadow: var(--shadow-sm);
  }
  .card::before {
    display: none;
  }

  /* バッジ右上 */
  .card .badge {
    position: absolute;
    top: 10px; right: 10px;
    font-size: 0.7rem;
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--accent-1);
    color: #fff;
    letter-spacing: 0.05em;
  }
  .card .badge.gray { background: var(--text-tertiary); }

  .card .icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
  .card h3 {
    font-size: 1.15rem;
    color: var(--text-primary);
    margin-bottom: 0.4rem;
    letter-spacing: 0.1em;
  }
  .card .catch {
    font-size: 0.95rem;
    color: var(--gold-dark);
    margin-bottom: 0.3rem;
    font-weight: bold;
  }
  .card .desc {
    font-size: 0.8rem;
    color: var(--text-secondary);
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
    background: linear-gradient(135deg, var(--gold), var(--gold-dark));
    color: white;
    border: none !important;
  }
  .cta-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(197,165,90,0.3);
  }
  .cta-disabled {
    background: var(--bg-subtle);
    color: var(--text-tertiary);
    cursor: not-allowed;
  }

  /* アクティブカード */
  .card-active {
    border-color: var(--gold);
    cursor: pointer;
  }
  .card-active:hover {
    box-shadow: var(--shadow-md);
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

  .beta-recruit {
    margin-top: 1rem;
    padding: 0.8rem 1rem;
    background: rgba(107,158,120,0.1);
    border: 1px solid rgba(107,158,120,0.3);
    border-radius: 10px;
    font-size: 0.8rem;
    color: var(--text-secondary);
    line-height: 1.6;
    text-align: center;
    position: relative;
  }
  .beta-recruit strong { color: var(--accent-3); }

  /* ── バナー ── */
  .banner {
    margin-top: 1.5rem;
    background: linear-gradient(135deg, var(--gold), var(--gold-dark));
    border-radius: 14px;
    padding: 1.3rem 1.5rem;
    text-align: center;
    border: 1px solid var(--gold-dark);
  }
  .banner h2 {
    font-size: 1.1rem;
    color: white;
    margin-bottom: 0.4rem;
  }
  .banner p {
    font-size: 0.85rem;
    color: rgba(255,255,255,0.9);
    line-height: 1.6;
  }
  .banner .banner-cta {
    display: inline-block;
    margin-top: 0.8rem;
    padding: 0.5rem 1.5rem;
    background: white;
    color: var(--gold-dark);
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
    color: var(--text-tertiary);
    border-top: 1px solid var(--border-light);
    background: var(--bg-subtle);
    flex-shrink: 0;
  }
  footer a { color: var(--gold-dark); text-decoration: none; }
  footer a:hover { text-decoration: underline; }

  /* ── アニメーション ── */
  @keyframes fadeUp {
    from { opacity:0; transform: translateY(16px); }
    to   { opacity:1; transform: translateY(0); }
  }
  .card { animation: fadeUp 0.5s ease both; }
  .card:nth-child(2) { animation-delay: 0.1s; }
  .banner { animation: fadeUp 0.5s ease 0.2s both; }

</style>
</head>
<body>

<header>
  <h1>お稽古モード</h1>
  <p>気良歌舞伎 ── 学びの間</p>
</header>

<main>
  <h2 class="section-title">稽古メニュー</h2>
  <div class="card-grid">

    <div class="card card-active" onclick="location.href='/kabuki/dojo/training/kakegoe'">
      <span class="badge">NEW</span>
      <div class="icon">📣</div>
      <h3>大向こう稽古</h3>
      <div class="catch">掛け声と拍手のタイミングを体で覚える</div>
      <div class="desc">白浪五人男「稲瀬川勢揃い」</div>
      <div class="spacer"></div>
      <div><button class="cta cta-primary" onclick="location.href='/kabuki/dojo/training/kakegoe'">始める →</button></div>
    </div>

    <div class="card">
      <span class="badge">NEW</span>
      <div class="icon">🎙️</div>
      <h3>台詞道場</h3>
      <div class="catch">名台詞を声に出して稽古する</div>
      <div class="desc">弁天小僧「知らざぁ言って聞かせやしょう」</div>
      <div class="spacer"></div>
      <div><button class="cta cta-primary" onclick="location.href='/kabuki/dojo/training/serifu'">始める →</button></div>
    </div>

  </div>

  <div class="banner">
    <h2>🏯 次回公演に向けて</h2>
    <p>
      大向こうを練習して、本番の舞台をもっと楽しもう！<br>
      <strong style="color:white;">「知る」から「観る」へ ── そして「演る」へ。</strong>
    </p>
    <a href="/kabuki/dojo/training/kakegoe" class="banner-cta">大向こう稽古を始める →</a>
  </div>
</main>

<footer>
  <p>気良歌舞伎 AI ガイド「けらのすけ」 &copy; 2026</p>
  <p style="margin-top:4px;"><a href="/">トップへ戻る</a></p>
</footer>

</body>
</html>`;
}
