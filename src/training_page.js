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
  }

  /* ── 定式幕ストライプ ── */
  .joshikimaku {
    height: 10px;
    background: repeating-linear-gradient(
      90deg,
      var(--kuro) 0%, var(--kuro) 33.33%,
      var(--moegi) 33.33%, var(--moegi) 66.66%,
      var(--aka) 66.66%, var(--aka) 100%
    );
  }

  /* ── ヘッダー ── */
  header {
    text-align: center;
    padding: 2.5rem 1rem 1.5rem;
    background: linear-gradient(180deg, rgba(26,26,26,1) 0%, rgba(40,20,20,0.95) 100%);
    border-bottom: 3px solid var(--kin);
    position: relative;
  }
  header::before {
    content: "🎭";
    font-size: 3rem;
    display: block;
    margin-bottom: 0.5rem;
    filter: drop-shadow(0 0 12px rgba(197,165,90,0.6));
  }
  header h1 {
    font-size: 1.8rem;
    letter-spacing: 0.3em;
    color: var(--kin);
    text-shadow: 0 2px 8px rgba(0,0,0,0.7);
  }
  header p {
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: #bbb;
    letter-spacing: 0.1em;
  }

  /* ── メインコンテンツ ── */
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 2rem 1.2rem 4rem;
  }

  .section-title {
    font-size: 1.1rem;
    color: var(--kin);
    border-left: 4px solid var(--aka);
    padding-left: 0.8rem;
    margin: 2rem 0 1rem;
    letter-spacing: 0.15em;
  }

  /* ── カード ── */
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
  .card {
    background: linear-gradient(135deg, #2a2020 0%, #1e1e1e 100%);
    border: 1px solid #333;
    border-radius: 12px;
    padding: 1.3rem;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  .card::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--aka), var(--moegi));
  }
  .card:hover {
    border-color: var(--kin);
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(197,165,90,0.15);
  }
  .card .icon { font-size: 2rem; margin-bottom: 0.6rem; }
  .card h3 {
    font-size: 1rem;
    color: var(--shiro);
    margin-bottom: 0.3rem;
  }
  .card p {
    font-size: 0.78rem;
    color: #999;
    line-height: 1.5;
  }
  .card .badge {
    display: inline-block;
    margin-top: 0.6rem;
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--aka);
    color: #fff;
  }
  .card .badge.green { background: var(--moegi); }

  /* ── 来たる公演バナー ── */
  .banner {
    margin-top: 2.5rem;
    background: linear-gradient(135deg, var(--aka) 0%, #8B0000 100%);
    border-radius: 14px;
    padding: 1.5rem;
    text-align: center;
    border: 1px solid rgba(197,165,90,0.3);
  }
  .banner h2 {
    font-size: 1.2rem;
    color: var(--kin);
    margin-bottom: 0.4rem;
  }
  .banner p {
    font-size: 0.85rem;
    color: rgba(255,255,255,0.85);
    line-height: 1.6;
  }

  /* ── フッター ── */
  footer {
    text-align: center;
    padding: 1.5rem;
    font-size: 0.75rem;
    color: #555;
    border-top: 1px solid #333;
  }
  footer a { color: var(--kin); text-decoration: none; }
  footer a:hover { text-decoration: underline; }

  /* ── アニメーション ── */
  @keyframes fadeUp {
    from { opacity:0; transform: translateY(20px); }
    to   { opacity:1; transform: translateY(0); }
  }
  .card, .banner {
    animation: fadeUp 0.5s ease both;
  }
  .card:nth-child(2) { animation-delay: 0.08s; }
  .card:nth-child(3) { animation-delay: 0.16s; }
  .card:nth-child(4) { animation-delay: 0.24s; }
  .card:nth-child(5) { animation-delay: 0.32s; }
  .card:nth-child(6) { animation-delay: 0.40s; }
</style>
</head>
<body>

<div class="joshikimaku"></div>

<header>
  <h1>お稽古モード</h1>
  <p>気良歌舞伎 ── 学びの間</p>
</header>

<div class="joshikimaku"></div>

<main>
  <h2 class="section-title">稽古メニュー</h2>
  <div class="card-grid">
    <div class="card" onclick="alert('演目ガイド：準備中だよ🙂')">
      <div class="icon">📖</div>
      <h3>演目を学ぶ</h3>
      <p>20演目のあらすじ・みどころ・登場人物を予習しよう</p>
      <span class="badge">20演目収録</span>
    </div>
    <div class="card" onclick="alert('用語いろは：準備中だよ🙂')">
      <div class="icon">📝</div>
      <h3>用語いろは</h3>
      <p>歌舞伎の専門用語を 8カテゴリ 126語で解説</p>
      <span class="badge green">126語</span>
    </div>
    <div class="card" onclick="alert('クイズ：準備中だよ🙂')">
      <div class="icon">🎯</div>
      <h3>歌舞伎クイズ</h3>
      <p>全100問の三択クイズ。目指せ「名人」昇進！</p>
      <span class="badge">100問</span>
    </div>
    <div class="card" onclick="alert('おすすめ：準備中だよ🙂')">
      <div class="icon">🌟</div>
      <h3>おすすめ演目</h3>
      <p>初心者向けやジャンル別に、気良歌舞伎の推し演目を紹介</p>
      <span class="badge green">厳選</span>
    </div>
    <div class="card" onclick="location.href='/training/kakegoe'">
      <div class="icon">📣</div>
      <h3>大向こう稽古</h3>
      <p>公演動画を見ながら掛け声のタイミングを練習しよう</p>
      <span class="badge">NEW</span>
    </div>
    <div class="card" onclick="alert('ナビ：準備中だよ🙂')">
      <div class="icon">💬</div>
      <h3>気良歌舞伎ナビ</h3>
      <p>公演・会場・アクセス・参加方法をAIがご案内</p>
      <span class="badge">FAQ</span>
    </div>
    <div class="card" onclick="alert('動画：準備中だよ🙂')">
      <div class="icon">🎬</div>
      <h3>公演動画</h3>
      <p>過去の公演映像で演目の雰囲気をつかもう</p>
      <span class="badge green">映像</span>
    </div>
  </div>

  <div class="banner">
    <h2>🏯 次回公演に向けて</h2>
    <p>
      お稽古モードで演目や用語を予習しておくと、<br>
      本番の舞台がもっと楽しくなるよ！<br>
      <strong style="color:var(--kin);">「知る」から「観る」へ ── そして「演る」へ。</strong>
    </p>
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
