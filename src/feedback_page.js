// src/feedback_page.js
// =========================================================
// 感想をきかせて — /feedback
// フォームURLは worker から feedbackPageHTML({ formUrl, backUrl }) で渡す
// =========================================================

export function feedbackPageHTML(opts = {}) {
  const {
    siteName = "KABUKI PLUS+",
    projectName = "気良歌舞伎×AIプロジェクト",
    formUrl = "https://example.com/feedback-form",
    backUrl = "/project",
  } = opts;

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>感想をきかせて | ${siteName}</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700&family=Noto+Serif+JP:wght@400;600;700;900&display=swap" rel="stylesheet">

  <style>
    :root {
      --bg-page: #FAF7F2;
      --bg-card: rgba(255,255,255,0.92);
      --bg-subtle: #F3EDE4;
      --text-primary: #3D3127;
      --text-secondary: #7A6F63;
      --text-tertiary: #A89E93;
      --gold: #C5A255;
      --gold-light: #E8D5A3;
      --gold-soft: #F5EDD8;
      --gold-dark: #A8873A;
      --accent-green: #6B9E78;
      --accent-green-soft: #E8F3EB;
      --accent-red: #D4614B;
      --accent-red-soft: #FCEAE6;
      --border-light: #EDE7DD;
      --border-medium: #DDD5C8;
      --shadow-sm: 0 1px 3px rgba(61,49,39,0.06);
      --shadow-md: 0 4px 16px rgba(61,49,39,0.08);
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --max: 720px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: var(--bg-page);
      color: var(--text-primary);
      font-family: 'Noto Sans JP', system-ui, sans-serif;
      font-size: 15px;
      line-height: 1.75;
      -webkit-font-smoothing: antialiased;
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

    a { color: var(--gold-dark); text-decoration: none; }
    a:hover { color: var(--gold); }

    /* ── ヘッダー ── */
    .topbar {
      max-width: var(--max);
      margin: 0 auto;
      padding: 20px 16px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .brand { display: flex; flex-direction: column; gap: 1px; }
    .brand .kicker {
      font-size: 10px;
      letter-spacing: 3px;
      color: var(--gold);
      font-weight: 600;
    }
    .brand .name {
      font-family: 'Noto Serif JP', serif;
      font-weight: 700;
      font-size: 15px;
      letter-spacing: 1px;
      color: var(--text-primary);
    }
    .nav { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      border: 1px solid var(--border-medium);
      background: var(--bg-card);
      border-radius: 20px;
      text-decoration: none;
      color: var(--text-secondary);
      font-size: 12px;
      font-weight: 500;
      transition: all 0.15s;
    }
    .chip:hover {
      border-color: var(--gold);
      color: var(--gold-dark);
      text-decoration: none;
    }

    /* ── メイン ── */
    .wrap {
      max-width: var(--max);
      margin: 0 auto;
      padding: 20px 16px 48px;
    }

    /* ── ヒーロー ── */
    .hero {
      background: var(--bg-card);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      padding: 32px 24px;
      box-shadow: var(--shadow-md);
      position: relative;
      overflow: hidden;
      margin-bottom: 8px;
    }
    .hero::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--gold), var(--gold-light), var(--gold));
    }
    .hero h1 {
      font-family: 'Noto Serif JP', serif;
      font-weight: 700;
      font-size: 22px;
      letter-spacing: 1px;
      line-height: 1.5;
      margin-bottom: 12px;
    }
    .lead {
      color: var(--text-secondary);
      font-size: 14px;
      line-height: 1.9;
      max-width: 55ch;
    }
    .actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 20px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 11px 20px;
      border-radius: var(--radius-sm);
      text-decoration: none;
      font-weight: 600;
      font-size: 13px;
      letter-spacing: 0.5px;
      border: 1px solid var(--border-medium);
      background: var(--bg-card);
      color: var(--text-primary);
      transition: all 0.15s;
    }
    .btn:hover {
      border-color: var(--gold);
      color: var(--gold-dark);
      text-decoration: none;
    }
    .btn.primary {
      background: var(--text-primary);
      border-color: var(--text-primary);
      color: #FAF7F2;
    }
    .btn.primary:hover {
      background: var(--gold-dark);
      border-color: var(--gold-dark);
      color: white;
    }

    /* ── セクション ── */
    .section { margin-top: 28px; }
    .section-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: 'Noto Serif JP', serif;
      font-weight: 700;
      font-size: 16px;
      letter-spacing: 1px;
      margin-bottom: 14px;
    }
    .section-title::before {
      content: '';
      width: 3px;
      height: 18px;
      background: var(--gold);
      border-radius: 2px;
      flex-shrink: 0;
    }

    /* ── こんな声を待っています ── */
    .voice-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    @media (max-width: 600px) {
      .voice-grid { grid-template-columns: 1fr; }
    }
    .voice-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: var(--bg-card);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-sm);
    }
    .voice-emoji {
      font-size: 20px;
      flex-shrink: 0;
    }
    .voice-text {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    /* ── details ── */
    details {
      background: var(--bg-card);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      padding: 14px 18px;
      box-shadow: var(--shadow-sm);
    }
    .section details,
    .hero details { margin-top: 16px; }
    summary {
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      color: var(--text-primary);
      list-style: none;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    summary::before {
      content: '＋';
      flex-shrink: 0;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      background: var(--bg-subtle);
      color: var(--text-tertiary);
      font-size: 13px;
      font-weight: 400;
      transition: all 0.2s;
    }
    details[open] summary::before {
      content: '−';
      background: var(--gold-soft);
      color: var(--gold-dark);
    }
    summary::-webkit-details-marker { display: none; }
    details p {
      color: var(--text-secondary);
      font-size: 13px;
      margin: 10px 0 0 32px;
      line-height: 1.8;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px;
      background: var(--bg-subtle);
      border: 1px solid var(--border-light);
      padding: 2px 6px;
      border-radius: 6px;
      color: var(--text-primary);
    }

    /* ── 装飾線 ── */
    .deco-line {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin: 16px auto;
      max-width: 160px;
    }
    .deco-line::before, .deco-line::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--gold-light), transparent);
    }
    .deco-line .diamond {
      width: 5px; height: 5px;
      background: var(--gold);
      transform: rotate(45deg);
    }

    /* ── フッター ── */
    footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid var(--border-light);
      color: var(--text-tertiary);
      font-size: 11px;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }
    footer a { color: var(--gold-dark); }

    /* ── アニメーション ── */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .fade-up { animation: fadeUp 0.4s ease both; }
    .fade-d1 { animation: fadeUp 0.4s ease 0.05s both; }
    .fade-d2 { animation: fadeUp 0.4s ease 0.1s both; }
  </style>
</head>

<body>
  <div class="topbar">
    <div class="brand">
      <div class="kicker">🎭 ${siteName}</div>
      <div class="name">${projectName}</div>
    </div>
    <div class="nav">
      <a class="chip" href="${backUrl}">← プロジェクト</a>
      <a class="chip" href="${formUrl}" target="_blank" rel="noopener">📝 フォームへ</a>
    </div>
  </div>

  <div class="wrap">

    <!-- ── ヒーロー ── -->
    <section class="hero fade-up">
      <h1>KABUKI PLUS+ に感想をきかせて</h1>
      <p class="lead">
        1分でOK・匿名OK。<br>
        「良かった」「分からなかった」「ここが惜しい」ぜんぶ歓迎。<br>
        いただいた声で、サービスはもっと良くなります。
      </p>
      <div class="actions">
        <a class="btn primary" href="${formUrl}" target="_blank" rel="noopener">フォームを開く →</a>
        <a class="btn" href="${backUrl}">プロジェクトへ戻る</a>
      </div>

      <details>
        <summary>できれば書いてほしいこと（例）</summary>
        <p>
          ① どこを使った？（NAVI / LIVE / DOJO / LINE / Web…）<br>
          ② 何をしようとした？（演目検索 / クイズ / 公演情報…）<br>
          ③ 困った点 or 良かった点<br>
          ④ 端末（iPhone / Android / PC）
        </p>
      </details>
    </section>

    <div class="deco-line"><span class="diamond"></span></div>

    <!-- ── どんな声でも ── -->
    <section class="section fade-d1">
      <h2 class="section-title">こんな声を待っています</h2>
      <div class="voice-grid">
        <div class="voice-item">
          <span class="voice-emoji">👍</span>
          <span class="voice-text">「この機能が良かった」「また使いたい」</span>
        </div>
        <div class="voice-item">
          <span class="voice-emoji">🤔</span>
          <span class="voice-text">「使い方が分からなかった」「迷った」</span>
        </div>
        <div class="voice-item">
          <span class="voice-emoji">🐛</span>
          <span class="voice-text">「表示がおかしい」「エラーが出た」</span>
        </div>
        <div class="voice-item">
          <span class="voice-emoji">💡</span>
          <span class="voice-text">「こうなったらもっと良い」「これがほしい」</span>
        </div>
      </div>

      <div class="actions" style="margin-top:20px; justify-content:center;">
        <a class="btn primary" href="${formUrl}" target="_blank" rel="noopener">フォームを開く →</a>
      </div>
    </section>

    <!-- ── フッター ── -->
    <footer class="fade-d2">
      <span>© ${new Date().getFullYear()} <a href="${backUrl}">${projectName}</a></span>
      <span style="font-style:italic; color:var(--gold);">"守るために、変わる。"</span>
    </footer>
  </div>
</body>
</html>`;
}
