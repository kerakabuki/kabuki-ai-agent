// src/join_page.js
// =========================================================
// 一緒につくる — /join（仲間募集ページ）
// フォームURLは worker から joinPageHTML({ formUrl, contactUrl }) で渡す
// =========================================================

export function joinPageHTML(opts = {}) {
  const {
    siteName = "KABUKI PLUS+",
    projectName = "気良歌舞伎×AIプロジェクト",
    formUrl = "https://example.com/your-form",
    contactUrl = "/jikabuki/gate/kera",
  } = opts;

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>一緒につくる | ${projectName}</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700&family=Noto+Serif+JP:wght@400;600;700;900&display=swap" rel="stylesheet">

  <style>
    :root {
      --bg-page: #FAF7F2;
      --bg-card: rgba(255,255,255,0.92);
      --bg-subtle: #F3EDE4;
      --bg-warm: #FFF8ED;
      --text-primary: #3D3127;
      --text-secondary: #7A6F63;
      --text-tertiary: #A89E93;
      --gold: #C5A255;
      --gold-light: #E8D5A3;
      --gold-soft: #F5EDD8;
      --gold-dark: #A8873A;
      --gold-deep: #8B7230;
      --accent-red: #D4614B;
      --accent-red-soft: #FCEAE6;
      --accent-blue: #6B8FAD;
      --accent-blue-soft: #E6EFF6;
      --accent-green: #6B9E78;
      --accent-green-soft: #E8F3EB;
      --accent-purple: #8B72A8;
      --accent-purple-soft: #F0EAF5;
      --border-light: #EDE7DD;
      --border-medium: #DDD5C8;
      --shadow-sm: 0 1px 3px rgba(61,49,39,0.06);
      --shadow-md: 0 4px 16px rgba(61,49,39,0.08);
      --shadow-lg: 0 8px 28px rgba(61,49,39,0.10);
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
    .brand {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
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
    .nav {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
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
      top: 0;
      left: 0;
      right: 0;
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
      color: var(--text-primary);
    }
    .hero p {
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
    .section { margin-top: 32px; }
    .section-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: 'Noto Serif JP', serif;
      font-weight: 700;
      font-size: 16px;
      letter-spacing: 1px;
      margin-bottom: 14px;
      color: var(--text-primary);
    }
    .section-title::before {
      content: '';
      width: 3px;
      height: 18px;
      background: var(--gold);
      border-radius: 2px;
      flex-shrink: 0;
    }

    /* ── 4つの入口カード ── */
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    @media (max-width: 600px) {
      .grid { grid-template-columns: 1fr; }
    }
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      padding: 20px;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
    }
    .card-accent-1 { border-top: 3px solid var(--accent-red); }
    .card-accent-2 { border-top: 3px solid var(--accent-blue); }
    .card-accent-3 { border-top: 3px solid var(--accent-green); }
    .card-accent-4 { border-top: 3px solid var(--accent-purple); }

    .tag {
      display: inline-flex;
      align-items: center;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 2px;
      margin-bottom: 6px;
    }
    .card-accent-1 .tag { color: var(--accent-red); }
    .card-accent-2 .tag { color: var(--accent-blue); }
    .card-accent-3 .tag { color: var(--accent-green); }
    .card-accent-4 .tag { color: var(--accent-purple); }

    .card h3 {
      font-family: 'Noto Serif JP', serif;
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }
    .card ul {
      margin: 0 0 12px;
      padding-left: 18px;
      color: var(--text-secondary);
      font-size: 13px;
      line-height: 1.8;
    }
    .card ul li + li { margin-top: 2px; }
    .meta {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-top: auto;
      padding-top: 10px;
    }
    .mini {
      font-size: 11px;
      font-weight: 500;
      padding: 4px 10px;
      border-radius: 20px;
      background: var(--bg-subtle);
      color: var(--text-secondary);
    }

    /* ── いま特にほしい力 ── */
    .need {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
    }
    @media (max-width: 600px) {
      .need { grid-template-columns: 1fr; }
    }
    .need .item {
      background: var(--bg-card);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      padding: 18px 16px;
      box-shadow: var(--shadow-sm);
    }
    .need .item b {
      font-family: 'Noto Serif JP', serif;
      font-size: 14px;
      font-weight: 700;
      display: block;
      margin-bottom: 6px;
      color: var(--text-primary);
    }
    .need .item span {
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.7;
    }
    .need-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 6px;
      background: var(--gold-soft);
      color: var(--gold-dark);
      font-size: 11px;
      font-weight: 700;
      margin-right: 6px;
    }

    /* ── 参加の流れ ── */
    .flow {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
    }
    @media (max-width: 600px) {
      .flow { grid-template-columns: 1fr; }
    }
    .step {
      background: var(--bg-card);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      padding: 18px 16px;
      box-shadow: var(--shadow-sm);
      font-size: 14px;
    }
    .num {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
      border: 1px solid var(--gold-light);
      background: var(--gold-soft);
      color: var(--gold-dark);
      margin-bottom: 10px;
    }
    .step .step-sub {
      font-size: 12px;
      color: var(--text-tertiary);
      margin-top: 2px;
    }

    /* ── FAQ ── */
    .faq { display: grid; gap: 8px; }
    details {
      background: var(--bg-card);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      padding: 14px 18px;
      box-shadow: var(--shadow-sm);
    }
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

    /* ── アニメーション ── */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .fade-up { animation: fadeUp 0.4s ease both; }
    .fade-d1 { animation: fadeUp 0.4s ease 0.05s both; }
    .fade-d2 { animation: fadeUp 0.4s ease 0.1s both; }
    .fade-d3 { animation: fadeUp 0.4s ease 0.15s both; }
    .fade-d4 { animation: fadeUp 0.4s ease 0.2s both; }
    .fade-d5 { animation: fadeUp 0.4s ease 0.25s both; }
  </style>
</head>

<body>
  <div class="topbar">
    <div class="brand">
      <div class="kicker">🎭 ${siteName}</div>
      <div class="name">KABUKI PLUS+ / JIKABUKI PLUS+</div>
    </div>
    <div class="nav">
      <a class="chip" href="/">トップ</a>
      <a class="chip" href="/project">プロジェクト</a>
      <a class="chip" href="/jikabuki/labo">📝 エディター申請</a>
    </div>
  </div>

  <div class="wrap">

    <!-- ── ヒーロー ── -->
    <section class="hero fade-up">
      <h1>一緒につくる ──<br>KABUKI PLUS+ の仲間募集</h1>
      <p>
        歌舞伎ファン向けの <strong>KABUKI PLUS+</strong> と、地歌舞伎団体の運営を支える <strong>JIKABUKI PLUS+</strong>。<br>
        2ブランド・8モジュールのプラットフォームを、一緒に育てていきませんか。<br>
        できることからでOK。週1時間でも歓迎。遠隔でも参加できます。
      </p>
      <div class="actions">
        <a class="btn primary" href="/jikabuki/labo">エディター権限を申請する →</a>
        <a class="btn" href="${contactUrl}">まずは話を聞く</a>
      </div>
    </section>

    <div class="deco-line"><span class="diamond"></span></div>

    <!-- ── 関わり方（4つの入口） ── -->
    <section class="section fade-d1">
      <h2 class="section-title">関わり方（4つの入口）</h2>
      <div class="grid">

        <div class="card card-accent-1">
          <div class="tag">つたえる</div>
          <h3>広報・発信</h3>
          <ul>
            <li>SNS投稿、note記事、ニュース共有</li>
            <li>写真/動画、チラシ・バナー作成</li>
            <li>プロジェクト紹介・気良歌舞伎の魅力発信</li>
          </ul>
          <div class="meta">
            <span class="mini">文章 / デザイン / 撮影</span>
            <span class="mini">週1h〜OK</span>
          </div>
        </div>

        <div class="card card-accent-2">
          <div class="tag">つくる</div>
          <h3>開発・UI</h3>
          <ul>
            <li>Cloudflare Workers / Webウィジェット改善</li>
            <li>GATE・BASE・LABO 各モジュールの機能追加・UX改善</li>
            <li>LINEメニュー / Flex メッセージの改善</li>
          </ul>
          <div class="meta">
            <span class="mini">JS / HTML / CSS</span>
            <span class="mini">部分参加OK</span>
          </div>
        </div>

        <div class="card card-accent-3">
          <div class="tag">そだてる</div>
          <h3>データ・監修</h3>
          <ul>
            <li>演目/人物/用語の整理、誤字脱字チェック</li>
            <li>FAQ整備、クイズ問題の作成・レビュー</li>
            <li>地歌舞伎の記録・アーカイブの手伝い</li>
          </ul>
          <div class="meta">
            <span class="mini">歌舞伎好き歓迎</span>
            <span class="mini">調べ物が得意</span>
          </div>
        </div>

        <div class="card card-accent-4">
          <div class="tag">つなぐ</div>
          <h3>団体連携</h3>
          <ul>
            <li>他の地歌舞伎団体紹介、コラボ提案</li>
            <li>学校/地域連携、取材や案内の窓口</li>
          </ul>
          <div class="meta">
            <span class="mini">地域ネットワーク</span>
          </div>
        </div>

      </div>
    </section>

    <!-- ── いま、特にほしい力 ── -->
    <section class="section fade-d2">
      <h2 class="section-title">いま、特にほしい力</h2>
      <div class="need">
        <div class="item">
          <b><span class="need-num">1</span>UI / UX 改善</b>
          <span>8モジュール全体の回遊・導線・ボタン文言・表示崩れなどの改善提案や実装</span>
        </div>
        <div class="item">
          <b><span class="need-num">2</span>コンテンツ充実</b>
          <span>LABO モジュールの演目ガイド・用語辞典・クイズの作成・品質向上・監修</span>
        </div>
        <div class="item">
          <b><span class="need-num">3</span>団体連携</b>
          <span>JIKABUKI PLUS+ の横展開に向けた地歌舞伎団体の紹介・コーディネート</span>
        </div>
      </div>
    </section>

    <!-- ── 参加の流れ ── -->
    <section class="section fade-d3">
      <h2 class="section-title">参加の流れ</h2>
      <div class="flow">
        <div class="step">
          <div class="num">1</div>
          <strong>エディター申請</strong>（1分）
          <div class="step-sub">ログインしてLABOで申請</div>
        </div>
        <div class="step">
          <div class="num">2</div>
          <strong>こちらから連絡</strong>
          <div class="step-sub">できる範囲・温度感をすり合わせ</div>
        </div>
        <div class="step">
          <div class="num">3</div>
          <strong>小さなタスクから開始</strong>
          <div class="step-sub">単発でも歓迎、継続は任意</div>
        </div>
      </div>
      <div class="actions" style="margin-top:16px">
        <a class="btn primary" href="/jikabuki/labo">エディター権限を申請する →</a>
        <a class="btn" href="/project">プロジェクトへ戻る</a>
      </div>
    </section>

    <!-- ── よくある質問 ── -->
    <section class="section fade-d4">
      <h2 class="section-title">よくある質問</h2>
      <div class="faq">
        <details>
          <summary>どれくらい時間が必要？</summary>
          <p>週1時間からでOK。短い時間でも継続できる形を一緒に作ります。</p>
        </details>
        <details>
          <summary>遠隔でも参加できる？</summary>
          <p>はい。活動はすべて遠隔で進めます。現場での活動はありません。</p>
        </details>
        <details>
          <summary>報酬はありますか？</summary>
          <p>基本はボランティア想定です。交通費の支給はありません。</p>
        </details>
      </div>
    </section>

    <!-- ── フッター ── -->
    <footer class="fade-d5">
      <span>© ${new Date().getFullYear()} <a href="/project">気良歌舞伎 × KABUKI PLUS+</a></span>
      <span style="font-style:italic; color:var(--gold);">"守るために、変わる。"</span>
    </footer>
  </div>
</body>
</html>`;
}
