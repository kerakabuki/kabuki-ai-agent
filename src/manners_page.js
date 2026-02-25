// src/manners_page.js
// =========================================================
// 観劇マナーページ — /kabuki/navi/manners
// 会場でのNG集（やっちゃダメなこと）に特化したシンプル構成
// =========================================================
import { pageShell } from "./web_layout.js";

const MANNER_RULES = [
  {
    icon: "📱",
    title: "スマートフォン",
    accent: "accent-1",
    items: [
      "開演中はマナーモードにするか電源を切る",
      "着信音・バイブは厳禁",
      "画面の明かりも周囲の迷惑になるため消す",
      "メール・SNSは幕間に",
    ],
  },
  {
    icon: "📸",
    title: "写真・動画撮影",
    accent: "accent-2",
    items: [
      "上演中の撮影・録音・録画は禁止（著作権・肖像権）",
      "客席内は、開演前・幕間・終演後も撮影禁止の劇場／公演があります。基本は客席では撮らず、当日の場内案内に従ってください",
      "フラッシュ・ライトは場所を問わず厳禁",
    ],
  },
  {
    icon: "🍱",
    title: "飲食",
    accent: "accent-3",
    items: [
      "上演中は飲食をやめ、幕間（まくあい）に楽しむ",
      "幕の内弁当は歌舞伎の文化（幕間に食べるのが本来）",
      "ドリンクはこぼれないよう注意",
    ],
  },
  {
    icon: "🚶",
    title: "入退場",
    accent: "accent-gold",
    items: [
      "遅刻した場合はロビーで待機し、係員の案内に従って入場（案内のタイミングは劇場判断）",
      "途中退場はできるだけ幕間に。緊急時は係員へ",
    ],
  },
  {
    icon: "🔇",
    title: "私語・音",
    accent: "accent-1",
    items: [
      "上演中の会話・ヒソヒソ話は控える",
      "プログラム（筋書き）をめくる音も気になるので幕間に",
      "咳やくしゃみはハンカチで口元を覆う",
    ],
  },
  {
    icon: "🎒",
    title: "荷物・服装",
    accent: "accent-2",
    items: [
      "大きな荷物はコインロッカーへ（多くの劇場にあり）",
      "コートは膝の上にたたんで置く",
      "服装の規定は特になし。普段着でもフォーマルでもOK",
      "和装（着物）で訪れる人も多い。ヒールの高い靴は足音に注意",
    ],
  },
];

export function mannersPageHTML({ googleClientId = "" } = {}) {
  const rulesHTML = MANNER_RULES.map((r) => `
    <div class="manner-rule-card fade-up">
      <div class="manner-rule-header manner-${r.accent}">
        <span class="manner-rule-icon">${r.icon}</span>
        <h3 class="manner-rule-title">${r.title}</h3>
      </div>
      <ul class="manner-rule-list">
        ${r.items.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    </div>
  `).join("\n");

  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span><a href="/kabuki/navi">KABUKI NAVI</a><span>›</span>観劇マナー
    </div>

    <!-- 観劇ナビへの導線バナー -->
    <a href="/kabuki/navi/theater" class="manner-navi-banner fade-up">
      <span class="manner-navi-banner-icon">🧭</span>
      <span class="manner-navi-banner-text">はじめての方は<strong>観劇ナビ</strong>もチェック</span>
      <span class="manner-navi-banner-arrow">→</span>
    </a>

    <section class="manner-intro fade-up">
      <p class="manner-lead">
        歌舞伎観劇で「やっちゃいけないこと」を確認しておこう。<br>
        これさえ守れば、安心して舞台を楽しめます。
      </p>
    </section>

    <!-- ── 会場でのマナー ── -->
    <section class="manner-section">
      <h2 class="section-title">会場でのマナー</h2>
      <div class="manner-rules-grid">
        ${rulesHTML}
      </div>
    </section>

    <div class="manner-footer fade-up">
      <a href="/kabuki/navi" class="btn btn-secondary">← KABUKI NAVI に戻る</a>
    </div>
  `;

  return pageShell({
    title: "観劇マナー",
    subtitle: "歌舞伎羅針盤",
    bodyHTML,
    activeNav: "navi",
    googleClientId,
    headExtra: `<style>
      /* ── 観劇ナビ導線バナー ── */
      .manner-navi-banner {
        display: flex;
        align-items: center;
        gap: 10px;
        background: var(--gold-soft);
        border: 1px solid var(--gold-light);
        border-radius: var(--radius-sm);
        padding: 12px 16px;
        margin-bottom: 20px;
        text-decoration: none;
        color: var(--gold-dark);
        font-size: 13.5px;
        transition: background 0.15s;
      }
      .manner-navi-banner:hover {
        background: var(--gold-light);
        text-decoration: none;
        color: var(--gold-dark);
      }
      .manner-navi-banner-icon { font-size: 18px; flex-shrink: 0; }
      .manner-navi-banner-text { flex: 1; }
      .manner-navi-banner-text strong { font-weight: 600; }
      .manner-navi-banner-arrow { flex-shrink: 0; font-size: 16px; }

      /* ── イントロ ── */
      .manner-intro {
        text-align: center;
        padding: 20px 16px 28px;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 28px;
      }
      .manner-lead {
        font-size: 14px;
        line-height: 2;
        color: var(--text-secondary);
        letter-spacing: 0.08em;
      }

      /* ── セクション ── */
      .manner-section {
        margin-bottom: 2.5rem;
      }

      /* ── 会場マナーグリッド ── */
      .manner-rules-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 14px;
      }
      .manner-rule-card {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        overflow: hidden;
        box-shadow: var(--shadow-sm);
      }
      .manner-rule-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-light);
      }
      .manner-accent-1   { background: rgba(212,97,75,0.08);  border-left: 3px solid var(--accent-1); }
      .manner-accent-2   { background: rgba(107,143,173,0.08); border-left: 3px solid var(--accent-2); }
      .manner-accent-3   { background: rgba(107,158,120,0.08); border-left: 3px solid var(--accent-3); }
      .manner-accent-gold { background: rgba(197,162,85,0.08);  border-left: 3px solid var(--gold); }
      .manner-rule-icon {
        font-size: 22px;
        flex-shrink: 0;
      }
      .manner-rule-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
      }
      .manner-rule-list {
        list-style: none;
        margin: 0;
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .manner-rule-list li {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.6;
        padding-left: 14px;
        position: relative;
      }
      .manner-rule-list li::before {
        content: "・";
        position: absolute;
        left: 0;
        color: var(--gold);
      }

      /* ── フッター ── */
      .manner-footer {
        text-align: center;
        margin-top: 2.5rem;
        padding-bottom: 1.5rem;
      }

      @media (max-width: 480px) {
        .manner-rules-grid { grid-template-columns: 1fr; }
      }
    </style>`,
  });
}
