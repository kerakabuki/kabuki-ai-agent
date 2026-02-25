// src/jikabuki_help_page.js
// =========================================================
// JIKABUKI PLUS+ ユーザーズガイド — /jikabuki/help
// =========================================================
import { pageShell } from "./web_layout.js";

export function jikabukiHelpPageHTML({ googleClientId = "" } = {}) {
  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span>ヘルプ
    </div>

    <!-- はじめに -->
    <section class="jhelp-intro fade-up">
      <div class="jhelp-intro-icon">🏯</div>
      <h2 class="jhelp-intro-title">JIKABUKI PLUS+ とは</h2>
      <p class="jhelp-intro-desc">
        地歌舞伎の演者・運営者のためのデジタル楽屋です。<br>
        団体サイト自動生成・稽古管理・台本共有・コンテンツ制作を一か所にまとめ、<br>
        地域に根ざした歌舞伎文化の継承・発信をサポートします。
      </p>
      <div class="jhelp-target-chips">
        <span class="jhelp-chip">🎭 演者</span>
        <span class="jhelp-chip">🏛️ 団体運営者</span>
        <span class="jhelp-chip">✍️ 脚本・演出担当</span>
        <span class="jhelp-chip">📢 広報担当</span>
      </div>
    </section>

    <!-- GATE -->
    <section class="jhelp-section fade-up-d1">
      <div class="jhelp-section-header jhelp-header-gate">
        <span class="jhelp-section-icon">🏯</span>
        <div>
          <h2 class="jhelp-section-title">GATE の使い方</h2>
          <p class="jhelp-section-subtitle">団体サイト自動生成・テーマ設定</p>
        </div>
        <a href="/jikabuki/gate" class="jhelp-section-link">開く →</a>
      </div>
      <div class="jhelp-card-grid">
        <div class="jhelp-card jhelp-card-accent-gold">
          <div class="jhelp-card-head">
            <span class="jhelp-card-icon">🌐</span>
            <h3>団体サイト自動生成</h3>
          </div>
          <p class="jhelp-card-desc">団体情報を登録するだけで、専用の団体紹介ページが自動生成されます。公演情報・SNSリンク・紹介文を一括管理できます。</p>
        </div>
        <div class="jhelp-card jhelp-card-accent-2">
          <div class="jhelp-card-head">
            <span class="jhelp-card-icon">🎨</span>
            <h3>テーマ・デザイン設定</h3>
          </div>
          <p class="jhelp-card-desc">団体のブランドカラーやロゴを設定して、オリジナリティのあるページを作成。GATE 編集者権限を持つメンバーが編集できます。</p>
        </div>
        <div class="jhelp-card jhelp-card-accent-1">
          <div class="jhelp-card-head">
            <span class="jhelp-card-icon">📋</span>
            <h3>団体一覧ディレクトリ</h3>
          </div>
          <p class="jhelp-card-desc">全国の地歌舞伎団体がブラウズできるディレクトリ。他の団体との交流・ネットワーク形成にも活用できます。</p>
          <a href="/jikabuki/gate" class="jhelp-card-link">団体一覧を見る →</a>
        </div>
      </div>
    </section>

    <!-- INFO -->
    <section class="jhelp-section fade-up-d1">
      <div class="jhelp-section-header jhelp-header-info">
        <span class="jhelp-section-icon">📡</span>
        <div>
          <h2 class="jhelp-section-title">INFO の使い方</h2>
          <p class="jhelp-section-subtitle">全国団体ディレクトリ・公演カレンダー</p>
        </div>
        <a href="/jikabuki/info/groups" class="jhelp-section-link">開く →</a>
      </div>
      <div class="jhelp-card-grid">
        <div class="jhelp-card jhelp-card-accent-3">
          <div class="jhelp-card-head">
            <span class="jhelp-card-icon">🗺️</span>
            <h3>全国団体マップ</h3>
          </div>
          <p class="jhelp-card-desc">全国の地歌舞伎団体を都道府県別に検索。活動地域・公演頻度・特徴を一覧表示します。</p>
          <a href="/jikabuki/info/groups" class="jhelp-card-link">団体マップへ →</a>
        </div>
        <div class="jhelp-card jhelp-card-accent-2">
          <div class="jhelp-card-head">
            <span class="jhelp-card-icon">📅</span>
            <h3>公演カレンダー</h3>
          </div>
          <p class="jhelp-card-desc">全国の地歌舞伎公演スケジュールをカレンダー形式で確認。観劇の計画立てに役立ちます。</p>
          <a href="/jikabuki/info/events" class="jhelp-card-link">カレンダーへ →</a>
        </div>
        <div class="jhelp-card jhelp-card-accent-1">
          <div class="jhelp-card-head">
            <span class="jhelp-card-icon">📰</span>
            <h3>地歌舞伎ニュース</h3>
          </div>
          <p class="jhelp-card-desc">地歌舞伎に関するニュース・イベント情報を自動収集。最新の動向をまとめて把握できます。</p>
          <a href="/jikabuki/info/news" class="jhelp-card-link">ニュースへ →</a>
        </div>
      </div>
    </section>

    <!-- BASE -->
    <section class="jhelp-section fade-up-d2">
      <div class="jhelp-section-header jhelp-header-base">
        <span class="jhelp-section-icon">🔧</span>
        <div>
          <h2 class="jhelp-section-title">BASE の使い方</h2>
          <p class="jhelp-section-subtitle">稽古管理・台本・メンバー管理</p>
        </div>
      </div>
      <div class="jhelp-card-grid">
        <div class="jhelp-card jhelp-card-accent-2">
          <div class="jhelp-card-head">
            <span class="jhelp-card-icon">👥</span>
            <h3>メンバー管理</h3>
          </div>
          <p class="jhelp-card-desc">団体メンバーの一覧・役割（manager / member）を管理。参加申請の承認・役割変更もここで行います。</p>
        </div>
        <div class="jhelp-card jhelp-card-accent-3">
          <div class="jhelp-card-head">
            <span class="jhelp-card-icon">📜</span>
            <h3>台本管理</h3>
          </div>
          <p class="jhelp-card-desc">台本を PDF・テキスト形式でアップロード・共有。メンバーが手軽に閲覧できます。共有範囲（グループ内 / 全体公開）を設定可能。</p>
        </div>
        <div class="jhelp-card jhelp-card-accent-1">
          <div class="jhelp-card-head">
            <span class="jhelp-card-icon">📓</span>
            <h3>稽古ノート</h3>
          </div>
          <p class="jhelp-card-desc">稽古の記録・連絡事項をグループ内で共有。最大200件まで蓄積できます。</p>
        </div>
        <div class="jhelp-card jhelp-card-accent-gold">
          <div class="jhelp-card-head">
            <span class="jhelp-card-icon">📆</span>
            <h3>スケジュール管理</h3>
          </div>
          <p class="jhelp-card-desc">稽古・公演・会議などのスケジュールをグループ内で共有・管理できます。</p>
        </div>
      </div>
      <div class="jhelp-note">
        <span class="jhelp-note-icon">💡</span>
        BASE 機能を使うにはログインと、いずれかの団体への参加（member 以上）が必要です。
      </div>
    </section>

    <!-- LABO -->
    <section class="jhelp-section fade-up-d3">
      <div class="jhelp-section-header jhelp-header-labo">
        <span class="jhelp-section-icon">🧪</span>
        <div>
          <h2 class="jhelp-section-title">LABO の使い方</h2>
          <p class="jhelp-section-subtitle">コンテンツ制作・演目ガイド・クイズ</p>
        </div>
        <a href="/jikabuki/labo" class="jhelp-section-link">開く →</a>
      </div>
      <div class="jhelp-card-grid">
        <div class="jhelp-card jhelp-card-accent-3">
          <div class="jhelp-card-head">
            <span class="jhelp-card-icon">📖</span>
            <h3>演目ガイド制作</h3>
          </div>
          <p class="jhelp-card-desc">自団体の演目をガイド形式で公開できます。登録した演目ガイドは KABUKI NAVI にも連携されます。</p>
          <a href="/jikabuki/labo/enmoku" class="jhelp-card-link">演目ガイドへ →</a>
        </div>
        <div class="jhelp-card jhelp-card-accent-2">
          <div class="jhelp-card-head">
            <span class="jhelp-card-icon">📚</span>
            <h3>用語辞典</h3>
          </div>
          <p class="jhelp-card-desc">歌舞伎用語の解説コンテンツを閲覧・学習。地歌舞伎特有の用語も収録しています。</p>
          <a href="/jikabuki/labo/glossary" class="jhelp-card-link">用語辞典へ →</a>
        </div>
        <div class="jhelp-card jhelp-card-accent-1">
          <div class="jhelp-card-head">
            <span class="jhelp-card-icon">🧠</span>
            <h3>知識クイズ</h3>
          </div>
          <p class="jhelp-card-desc">メンバーの歌舞伎知識向上に役立つクイズ。稽古の合間に楽しみながら学べます。</p>
          <a href="/jikabuki/labo/quiz" class="jhelp-card-link">クイズへ →</a>
        </div>
      </div>
    </section>

    <!-- 権限と役割 -->
    <section class="jhelp-section fade-up-d3">
      <h2 class="section-title">権限と役割</h2>
      <div class="jhelp-role-grid">
        <div class="jhelp-role-card jhelp-role-master">
          <div class="jhelp-role-badge">master</div>
          <h3 class="jhelp-role-title">マスター</h3>
          <p class="jhelp-role-desc">全機能・全団体へのアクセス権。システム全体の管理者。editor 権限の付与も可能。</p>
        </div>
        <div class="jhelp-role-card jhelp-role-editor">
          <div class="jhelp-role-badge jhelp-badge-editor">editor</div>
          <h3 class="jhelp-role-title">エディター</h3>
          <p class="jhelp-role-desc">演目コンテンツの作成・編集（全団体対象）。GATE ページの編集権限を持ちます。</p>
        </div>
        <div class="jhelp-role-card jhelp-role-manager">
          <div class="jhelp-role-badge jhelp-badge-manager">manager</div>
          <h3 class="jhelp-role-title">マネージャー</h3>
          <p class="jhelp-role-desc">所属グループの管理者。メンバー承認・役割変更・グループ情報の編集が可能。</p>
        </div>
        <div class="jhelp-role-card jhelp-role-member">
          <div class="jhelp-role-badge jhelp-badge-member">member</div>
          <h3 class="jhelp-role-title">メンバー</h3>
          <p class="jhelp-role-desc">グループ内コンテンツの閲覧・稽古ノートへの投稿・台本のアップロードができます。</p>
        </div>
      </div>
      <div class="jhelp-note">
        <span class="jhelp-note-icon">ℹ️</span>
        グループへの参加は「参加申請」を送り、manager または master に承認してもらうと有効になります。
      </div>
    </section>

    <!-- FAQ -->
    <section class="jhelp-section fade-up-d4">
      <h2 class="section-title">よくある質問</h2>
      <div class="jhelp-faq-list">
        <details class="jhelp-faq-item">
          <summary class="jhelp-faq-q">団体を新規登録するにはどうすればいいですか？</summary>
          <p class="jhelp-faq-a">まず LINE または Google でログインし、「団体参加申請」フォームから申請してください。master による審査後、団体ページが作成されます。</p>
        </details>
        <details class="jhelp-faq-item">
          <summary class="jhelp-faq-q">既存の団体に参加するには？</summary>
          <p class="jhelp-faq-a">ログイン後、参加したい団体の GATE ページから「参加申請」を行ってください。団体の manager または master が承認すると参加できます。</p>
        </details>
        <details class="jhelp-faq-item">
          <summary class="jhelp-faq-q">台本データの形式は何に対応していますか？</summary>
          <p class="jhelp-faq-a">PDF・テキスト（.txt）形式に対応しています。JSON 形式でのアップロードも可能です（台詞稽古機能との連携に使用）。</p>
        </details>
        <details class="jhelp-faq-item">
          <summary class="jhelp-faq-q">KABUKI PLUS+ との違いは？</summary>
          <p class="jhelp-faq-a">KABUKI PLUS+ は歌舞伎ファン・鑑賞者向け、JIKABUKI PLUS+ は地歌舞伎の演者・運営者向けです。ナビの「KABUKI / JIKABUKI」切替ボタンで行き来できます。</p>
        </details>
        <details class="jhelp-faq-item">
          <summary class="jhelp-faq-q">グループを削除したい場合は？</summary>
          <p class="jhelp-faq-a">BASE メニューの「削除申請」フォームから申請してください。master による確認後、データが削除されます。</p>
        </details>
      </div>
    </section>

    <div class="jhelp-footer fade-up-d4">
      <a href="/" class="btn btn-secondary">← トップへ戻る</a>
    </div>
  `;

  return pageShell({
    title: "ヘルプ",
    subtitle: "JIKABUKI PLUS+ ユーザーズガイド",
    bodyHTML,
    activeNav: "home",
    brand: "jikabuki",
    googleClientId,
    headExtra: `<style>
      /* ── はじめにセクション ── */
      .jhelp-intro {
        text-align: center;
        padding: 24px 16px 32px;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 32px;
      }
      .jhelp-intro-icon {
        font-size: 40px;
        margin-bottom: 12px;
      }
      .jhelp-intro-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 18px;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 12px;
        letter-spacing: 1px;
      }
      .jhelp-intro-desc {
        font-size: 13.5px;
        color: var(--text-secondary);
        line-height: 2;
        max-width: 560px;
        margin: 0 auto 16px;
      }
      .jhelp-target-chips {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 8px;
        margin-top: 4px;
      }
      .jhelp-chip {
        padding: 4px 12px;
        background: var(--bg-subtle);
        border: 1px solid var(--border-light);
        border-radius: 20px;
        font-size: 12px;
        color: var(--text-secondary);
      }

      /* ── セクション ── */
      .jhelp-section {
        margin-bottom: 36px;
      }
      .jhelp-section-header {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 18px;
        border-radius: var(--radius-md);
        margin-bottom: 14px;
        border: 1px solid var(--border-light);
      }
      .jhelp-section-icon {
        font-size: 28px;
        flex-shrink: 0;
      }
      .jhelp-section-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 15px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 2px;
        letter-spacing: 0.5px;
      }
      .jhelp-section-subtitle {
        font-size: 11px;
        color: var(--text-tertiary);
        margin: 0;
      }
      .jhelp-section-link {
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
      .jhelp-section-link:hover {
        background: var(--gold-soft);
        text-decoration: none;
      }

      /* セクションヘッダーカラー */
      .jhelp-header-gate { background: rgba(197,162,85,0.06); border-left: 3px solid var(--gold); }
      .jhelp-header-info { background: rgba(107,143,173,0.06); border-left: 3px solid var(--accent-2); }
      .jhelp-header-base { background: rgba(107,158,120,0.06); border-left: 3px solid var(--accent-3); }
      .jhelp-header-labo { background: rgba(212,97,75,0.06);  border-left: 3px solid var(--accent-1); }

      /* ── カードグリッド ── */
      .jhelp-card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 12px;
      }
      .jhelp-card {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        padding: 14px 16px;
        box-shadow: var(--shadow-sm);
      }
      .jhelp-card-head {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }
      .jhelp-card-icon {
        font-size: 20px;
        flex-shrink: 0;
      }
      .jhelp-card h3 {
        font-family: 'Noto Serif JP', serif;
        font-size: 13.5px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
      }
      .jhelp-card-desc {
        font-size: 12px;
        color: var(--text-secondary);
        line-height: 1.7;
        margin-bottom: 8px;
      }
      .jhelp-card-link {
        font-size: 11.5px;
        color: var(--gold-dark);
        text-decoration: none;
        font-weight: 500;
      }
      .jhelp-card-link:hover { text-decoration: underline; }

      /* カード左ボーダー */
      .jhelp-card-accent-1    { border-left: 3px solid var(--accent-1); }
      .jhelp-card-accent-2    { border-left: 3px solid var(--accent-2); }
      .jhelp-card-accent-3    { border-left: 3px solid var(--accent-3); }
      .jhelp-card-accent-gold { border-left: 3px solid var(--gold); }

      /* ── 注意書き ── */
      .jhelp-note {
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
      .jhelp-note-icon { flex-shrink: 0; font-size: 14px; }

      /* ── 役割グリッド ── */
      .jhelp-role-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px;
        margin-bottom: 12px;
      }
      .jhelp-role-card {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        padding: 14px 16px;
        box-shadow: var(--shadow-sm);
      }
      .jhelp-role-badge {
        display: inline-block;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 1px;
        padding: 2px 8px;
        border-radius: 4px;
        margin-bottom: 8px;
        background: var(--gold-dark);
        color: #fff;
        text-transform: uppercase;
      }
      .jhelp-badge-editor  { background: var(--accent-2); }
      .jhelp-badge-manager { background: var(--accent-3); }
      .jhelp-badge-member  { background: var(--text-tertiary); }
      .jhelp-role-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 6px;
      }
      .jhelp-role-desc {
        font-size: 12px;
        color: var(--text-secondary);
        line-height: 1.65;
        margin: 0;
      }

      /* ── FAQ ── */
      .jhelp-faq-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .jhelp-faq-item {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-sm);
        box-shadow: var(--shadow-sm);
        overflow: hidden;
      }
      .jhelp-faq-q {
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
      .jhelp-faq-q::-webkit-details-marker { display: none; }
      .jhelp-faq-q::before {
        content: "▶";
        font-size: 10px;
        color: var(--gold);
        transition: transform 0.2s;
        flex-shrink: 0;
      }
      details[open] .jhelp-faq-q::before {
        transform: rotate(90deg);
      }
      .jhelp-faq-a {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.8;
        padding: 0 16px 14px 36px;
        margin: 0;
      }

      /* ── フッター ── */
      .jhelp-footer {
        text-align: center;
        margin-top: 2rem;
        padding-bottom: 1.5rem;
      }

      @media (max-width: 480px) {
        .jhelp-card-grid { grid-template-columns: 1fr; }
        .jhelp-role-grid { grid-template-columns: 1fr; }
        .jhelp-section-link { display: none; }
        .jhelp-target-chips { gap: 6px; }
      }
    </style>`,
  });
}
