// src/kabuki_help_page.js
// =========================================================
// KABUKI PLUS+ ユーザーズガイド — /kabuki/help
// =========================================================
import { pageShell } from "./web_layout.js";

export function kabukiHelpPageHTML({ googleClientId = "" } = {}) {
  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span>ヘルプ
    </div>

    <!-- はじめに -->
    <section class="help-intro fade-up">
      <div class="help-intro-icon">🎭</div>
      <h2 class="help-intro-title">KABUKI PLUS+ とは</h2>
      <p class="help-intro-desc">
        歌舞伎をもっと楽しむためのオールインワン・ガイドアプリです。<br>
        演目の解説・公演情報・観劇記録・学習コンテンツを一か所に集め、<br>
        初心者からベテランまで幅広い歌舞伎ファンをサポートします。
      </p>
    </section>

    <!-- NAVI -->
    <section class="help-section fade-up-d1">
      <div class="help-section-header help-header-navi">
        <span class="help-section-icon">🧭</span>
        <div>
          <h2 class="help-section-title">NAVI の使い方</h2>
          <p class="help-section-subtitle">歌舞伎羅針盤 — 演目・用語・おすすめ・観劇ナビ</p>
        </div>
        <a href="/kabuki/navi" class="help-section-link">開く →</a>
      </div>
      <div class="help-card-grid">
        <div class="help-card help-card-accent-1">
          <div class="help-card-head">
            <span class="help-card-icon">📖</span>
            <h3>演目ガイド</h3>
          </div>
          <p class="help-card-desc">人気演目のあらすじ・見どころ・登場人物を解説。知識ゼロでも舞台を10倍楽しめます。</p>
          <a href="/kabuki/navi/enmoku" class="help-card-link">演目ガイドへ →</a>
        </div>
        <div class="help-card help-card-accent-2">
          <div class="help-card-head">
            <span class="help-card-icon">📚</span>
            <h3>用語辞典</h3>
          </div>
          <p class="help-card-desc">「見得」「花道」「大向う」など、歌舞伎特有の用語をカテゴリ別に検索できます。</p>
          <a href="/kabuki/navi/glossary" class="help-card-link">用語辞典へ →</a>
        </div>
        <div class="help-card help-card-accent-3">
          <div class="help-card-head">
            <span class="help-card-icon">⭐</span>
            <h3>おすすめ演目</h3>
          </div>
          <p class="help-card-desc">初心者向けや人気の高い演目をピックアップ。「はじめての歌舞伎」にぴったりの作品を紹介。</p>
          <a href="/kabuki/navi/recommend" class="help-card-link">おすすめへ →</a>
        </div>
        <div class="help-card help-card-accent-gold">
          <div class="help-card-head">
            <span class="help-card-icon">🗺️</span>
            <h3>観劇ナビ</h3>
          </div>
          <p class="help-card-desc">劇場の選び方・座席の見方・当日の流れなど、観劇の基礎知識をステップ形式でガイドします。</p>
          <a href="/kabuki/navi/theater" class="help-card-link">観劇ナビへ →</a>
        </div>
      </div>
    </section>

    <!-- LIVE -->
    <section class="help-section fade-up-d2">
      <div class="help-section-header help-header-live">
        <span class="help-section-icon">📡</span>
        <div>
          <h2 class="help-section-title">LIVE の使い方</h2>
          <p class="help-section-subtitle">公演スケジュール・ニュース</p>
        </div>
        <a href="/kabuki/live" class="help-section-link">開く →</a>
      </div>
      <div class="help-card-grid">
        <div class="help-card help-card-accent-2">
          <div class="help-card-head">
            <span class="help-card-icon">🎪</span>
            <h3>公演スケジュール</h3>
          </div>
          <p class="help-card-desc">歌舞伎美人（kabuki-bito.jp）から最新の公演情報を取得。現在開催中・近日開幕の舞台を一覧表示します。</p>
        </div>
        <div class="help-card help-card-accent-3">
          <div class="help-card-head">
            <span class="help-card-icon">📰</span>
            <h3>ニュース</h3>
          </div>
          <p class="help-card-desc">歌舞伎関連の最新ニュースを自動収集。俳優・演目に関する話題をまとめて確認できます。</p>
          <a href="/kabuki/live/news" class="help-card-link">ニュースへ →</a>
        </div>
      </div>
    </section>

    <!-- RECO -->
    <section class="help-section fade-up-d2">
      <div class="help-section-header help-header-reco">
        <span class="help-section-icon">📝</span>
        <div>
          <h2 class="help-section-title">RECO の使い方</h2>
          <p class="help-section-subtitle">観劇ログ・推し俳優</p>
        </div>
        <a href="/kabuki/reco" class="help-section-link">開く →</a>
      </div>
      <div class="help-card-grid">
        <div class="help-card help-card-accent-1">
          <div class="help-card-head">
            <span class="help-card-icon">📋</span>
            <h3>観劇ログ</h3>
          </div>
          <p class="help-card-desc">観た演目や劇場を記録しておける鑑賞ノート。ログインすると記録が保存されます。</p>
        </div>
        <div class="help-card help-card-accent-gold">
          <div class="help-card-head">
            <span class="help-card-icon">❤️</span>
            <h3>推し俳優</h3>
          </div>
          <p class="help-card-desc">お気に入りの俳優を登録すると、その俳優の最新ニュースや公演情報がまとめて表示されます。</p>
        </div>
      </div>
      <div class="help-note">
        <span class="help-note-icon">💡</span>
        RECO 機能を使うには LINE または Google アカウントでのログインが必要です。
      </div>
    </section>

    <!-- DOJO -->
    <section class="help-section fade-up-d3">
      <div class="help-section-header help-header-dojo">
        <span class="help-section-icon">🥋</span>
        <div>
          <h2 class="help-section-title">DOJO の使い方</h2>
          <p class="help-section-subtitle">知識クイズ・台詞稽古・大向う道場</p>
        </div>
        <a href="/kabuki/dojo" class="help-section-link">開く →</a>
      </div>
      <div class="help-card-grid">
        <div class="help-card help-card-accent-1">
          <div class="help-card-head">
            <span class="help-card-icon">🧠</span>
            <h3>知識クイズ</h3>
          </div>
          <p class="help-card-desc">演目・俳優・歴史に関するクイズで歌舞伎知識を試そう。回答履歴から苦手分野を把握できます。</p>
          <a href="/kabuki/dojo/quiz" class="help-card-link">クイズへ →</a>
        </div>
        <div class="help-card help-card-accent-3">
          <div class="help-card-head">
            <span class="help-card-icon">🎤</span>
            <h3>台詞稽古</h3>
          </div>
          <p class="help-card-desc">名台詞のピッチ（音程）を視覚化。歌舞伎特有の発声やイントネーションを耳と目で学べます。</p>
          <a href="/kabuki/dojo/training/serifu" class="help-card-link">台詞稽古へ →</a>
        </div>
        <div class="help-card help-card-accent-2">
          <div class="help-card-head">
            <span class="help-card-icon">📣</span>
            <h3>大向う道場</h3>
          </div>
          <p class="help-card-desc">「成田屋！」などの大向うの声のかけ方を練習。タイミング・屋号・ルールをマスターしよう。</p>
          <a href="/kabuki/dojo/training/kakegoe" class="help-card-link">大向う道場へ →</a>
        </div>
      </div>
    </section>

    <!-- けらのすけ -->
    <section class="help-section fade-up-d3">
      <div class="help-section-header help-header-ai">
        <span class="help-section-icon">🤖</span>
        <div>
          <h2 class="help-section-title">けらのすけ の使い方</h2>
          <p class="help-section-subtitle">AIアシスタント（LINE・Web）</p>
        </div>
      </div>
      <div class="help-kera-box">
        <div class="help-kera-desc">
          <p>「けらのすけ」は、KABUKI PLUS+ の AI アシスタントです。LINE で友達追加するか、Web 版で話しかけると、歌舞伎に関するさまざまな質問に答えてくれます。</p>
          <ul class="help-kera-list">
            <li>演目のあらすじ・見どころを教えて</li>
            <li>○○という用語の意味は？</li>
            <li>初心者におすすめの演目は？</li>
            <li>クイズを出して！</li>
            <li>大向うの練習をしたい</li>
          </ul>
        </div>
        <div class="help-kera-cta">
          <a href="/auth/line" class="help-kera-btn-line">💬 LINE で話す</a>
          <p class="help-kera-cta-note">LINE 友達追加で、いつでもどこでもけらのすけと会話できます</p>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="help-section fade-up-d4">
      <h2 class="section-title">よくある質問</h2>
      <div class="help-faq-list">
        <details class="help-faq-item">
          <summary class="help-faq-q">ログインは必須ですか？</summary>
          <p class="help-faq-a">ほとんどの機能はログインなしで利用できます。ログインすると観劇ログの保存・推し俳優の登録などの個人データが使えるようになります。</p>
        </details>
        <details class="help-faq-item">
          <summary class="help-faq-q">対応しているログイン方法は？</summary>
          <p class="help-faq-a">LINE アカウントと Google アカウントに対応しています。画面右上の「ログイン」ボタンから選択できます。</p>
        </details>
        <details class="help-faq-item">
          <summary class="help-faq-q">スマートフォンから利用できますか？</summary>
          <p class="help-faq-a">はい。スマートフォン・タブレット・PC すべてに対応したレスポンシブデザインです。</p>
        </details>
        <details class="help-faq-item">
          <summary class="help-faq-q">公演情報はリアルタイムで更新されますか？</summary>
          <p class="help-faq-a">歌舞伎美人（kabuki-bito.jp）から定期的に情報を取得しています。最新情報は公式サイトもあわせてご確認ください。</p>
        </details>
        <details class="help-faq-item">
          <summary class="help-faq-q">地歌舞伎団体向けの機能はありますか？</summary>
          <p class="help-faq-a">はい。JIKABUKI PLUS+ として、地歌舞伎団体向けの機能（GATE・BASE・LABO など）を別ブランドで提供しています。ナビの切替ボタンから移動できます。</p>
        </details>
      </div>
    </section>

    <div class="help-footer fade-up-d4">
      <a href="/" class="btn btn-secondary">← トップへ戻る</a>
    </div>
  `;

  return pageShell({
    title: "ヘルプ",
    subtitle: "KABUKI PLUS+ ユーザーズガイド",
    bodyHTML,
    activeNav: "home",
    brand: "kabuki",
    googleClientId,
    headExtra: `<style>
      /* ── はじめにセクション ── */
      .help-intro {
        text-align: center;
        padding: 24px 16px 32px;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 32px;
      }
      .help-intro-icon {
        font-size: 40px;
        margin-bottom: 12px;
      }
      .help-intro-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 18px;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 12px;
        letter-spacing: 1px;
      }
      .help-intro-desc {
        font-size: 13.5px;
        color: var(--text-secondary);
        line-height: 2;
        max-width: 560px;
        margin: 0 auto;
      }

      /* ── セクション ── */
      .help-section {
        margin-bottom: 36px;
      }
      .help-section-header {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 18px;
        border-radius: var(--radius-md);
        margin-bottom: 14px;
        border: 1px solid var(--border-light);
      }
      .help-section-icon {
        font-size: 28px;
        flex-shrink: 0;
      }
      .help-section-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 15px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 2px;
        letter-spacing: 0.5px;
      }
      .help-section-subtitle {
        font-size: 11px;
        color: var(--text-tertiary);
        margin: 0;
      }
      .help-section-link {
        margin-left: auto;
        flex-shrink: 0;
        font-size: 12px;
        font-weight: 600;
        color: var(--gold-dark);
        text-decoration: none;
        white-space: nowrap;
        padding: 5px 12px;
        border: 1px solid var(--gold-light);
        border-radius: 20px;
        transition: background 0.15s;
      }
      .help-section-link:hover {
        background: var(--gold-soft);
        text-decoration: none;
      }

      /* セクションヘッダーカラー */
      .help-header-navi { background: rgba(197,162,85,0.06); border-left: 3px solid var(--gold); }
      .help-header-live { background: rgba(107,143,173,0.06); border-left: 3px solid var(--accent-2); }
      .help-header-reco { background: rgba(212,97,75,0.06);  border-left: 3px solid var(--accent-1); }
      .help-header-dojo { background: rgba(107,158,120,0.06); border-left: 3px solid var(--accent-3); }
      .help-header-ai   { background: rgba(176,136,200,0.06); border-left: 3px solid #B088C8; }

      /* ── カードグリッド ── */
      .help-card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 12px;
      }
      .help-card {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        padding: 14px 16px;
        box-shadow: var(--shadow-sm);
      }
      .help-card-head {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }
      .help-card-icon {
        font-size: 20px;
        flex-shrink: 0;
      }
      .help-card h3 {
        font-family: 'Noto Serif JP', serif;
        font-size: 13.5px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
      }
      .help-card-desc {
        font-size: 12px;
        color: var(--text-secondary);
        line-height: 1.7;
        margin-bottom: 8px;
      }
      .help-card-link {
        font-size: 11.5px;
        color: var(--gold-dark);
        text-decoration: none;
        font-weight: 500;
      }
      .help-card-link:hover { text-decoration: underline; }

      /* カード左ボーダー */
      .help-card-accent-1    { border-left: 3px solid var(--accent-1); }
      .help-card-accent-2    { border-left: 3px solid var(--accent-2); }
      .help-card-accent-3    { border-left: 3px solid var(--accent-3); }
      .help-card-accent-gold { border-left: 3px solid var(--gold); }

      /* ── 注意書き ── */
      .help-note {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-top: 10px;
        padding: 10px 14px;
        background: var(--gold-soft);
        border: 1px solid var(--gold-light);
        border-radius: var(--radius-sm);
        font-size: 12px;
        color: var(--gold-dark);
        line-height: 1.6;
      }
      .help-note-icon { flex-shrink: 0; font-size: 14px; }

      /* ── けらのすけボックス ── */
      .help-kera-box {
        display: flex;
        gap: 20px;
        align-items: flex-start;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        padding: 20px;
        box-shadow: var(--shadow-sm);
        border-left: 3px solid #B088C8;
      }
      .help-kera-desc {
        flex: 1;
      }
      .help-kera-desc p {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.8;
        margin-bottom: 10px;
      }
      .help-kera-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .help-kera-list li {
        font-size: 12px;
        color: var(--text-secondary);
        padding-left: 16px;
        position: relative;
      }
      .help-kera-list li::before {
        content: "・";
        position: absolute;
        left: 0;
        color: #B088C8;
      }
      .help-kera-cta {
        flex-shrink: 0;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      .help-kera-btn-line {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 20px;
        background: #06C755;
        color: #fff;
        border-radius: 24px;
        font-size: 13px;
        font-weight: 600;
        text-decoration: none;
        white-space: nowrap;
        transition: opacity 0.15s;
      }
      .help-kera-btn-line:hover { opacity: 0.85; color: #fff; text-decoration: none; }
      .help-kera-cta-note {
        font-size: 11px;
        color: var(--text-tertiary);
        line-height: 1.5;
        max-width: 160px;
        margin: 0;
      }

      /* ── FAQ ── */
      .help-faq-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .help-faq-item {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-sm);
        box-shadow: var(--shadow-sm);
        overflow: hidden;
      }
      .help-faq-q {
        font-size: 13px;
        font-weight: 500;
        color: var(--text-primary);
        padding: 12px 16px;
        cursor: pointer;
        list-style: none;
        display: flex;
        align-items: center;
        gap: 8px;
        user-select: none;
      }
      .help-faq-q::-webkit-details-marker { display: none; }
      .help-faq-q::before {
        content: "▶";
        font-size: 10px;
        color: var(--gold);
        transition: transform 0.2s;
        flex-shrink: 0;
      }
      details[open] .help-faq-q::before {
        transform: rotate(90deg);
      }
      .help-faq-a {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.8;
        padding: 0 16px 14px 36px;
        margin: 0;
      }

      /* ── フッター ── */
      .help-footer {
        text-align: center;
        margin-top: 2rem;
        padding-bottom: 1.5rem;
      }

      @media (max-width: 480px) {
        .help-card-grid { grid-template-columns: 1fr; }
        .help-kera-box { flex-direction: column; }
        .help-kera-cta { align-self: stretch; }
        .help-kera-btn-line { justify-content: center; }
        .help-kera-cta-note { max-width: none; }
        .help-section-link { display: none; }
      }
    </style>`,
  });
}
