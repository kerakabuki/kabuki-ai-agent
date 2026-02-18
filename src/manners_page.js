// src/manners_page.js
// =========================================================
// 観劇マナーページ — /kabuki/navi/manners
// 歌舞伎観劇のマナー・楽しみ方ガイド
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
      "幕間（まくあい）の飲食はOK",
      "幕の内弁当は歌舞伎の文化（幕間に食べるのが本来）",
      "上演中は最小限に。音・匂いに配慮する",
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

const ENJOY_TIPS = [
  {
    icon: "👏",
    title: "拍手",
    body: `拍手は歓迎されます。幕開き、見得、見せ場、幕切れなどで自由に。<br>台詞の最中や静かな場面は控えめに。迷ったら周囲に合わせると安心です。`,
  },
  {
    icon: "🎭",
    title: "掛け声（大向こう）",
    body: `「成田屋！」「音羽屋！」など役者の屋号を呼ぶ、江戸以来の伝統です。ただ、タイミングや声量を誤ると周囲や舞台の邪魔になりやすく、トラブルのもとにもなります。まずは拍手で楽しみ、掛け声は無理にしないのがおすすめです。<br><small style="color:var(--text-tertiary);">大向こう（おおむこう）：2〜3階の後方席からかける掛け声のこと。</small>`,
  },
  {
    icon: "🔭",
    title: "イヤホンガイド",
    body: `多くの劇場で有料のイヤホンガイドを貸し出しています。舞台の進行に合わせてセリフの意味・見どころ・役者のことをリアルタイムで解説してくれます。初心者に特におすすめのサービスです。`,
  },
  {
    icon: "🎫",
    title: "幕見席（まくみせき）",
    body: `歌舞伎座など一部の劇場では、1幕（一演目）だけ観られる当日売りの「幕見席」があります。通し料金よりリーズナブルで、「まず1幕だけ試してみる」という入門的な楽しみ方ができます。`,
  },
];

const FAQ = [
  {
    q: "遅刻したら入場できますか？",
    a: "基本的に幕間（まくあい）まで入場できません。遅刻した場合はロビーでモニターを見ながら待ち、係員の案内で幕間に案内されます。大きな劇場ではモニター・音声でロビーでも観劇できることがあります。",
  },
  {
    q: "途中退場はできますか？",
    a: "幕間に退場するのがマナーです。緊急の場合はできるだけ早い幕間のタイミングで席を立ちましょう。上演中に席を立つと周囲の方の集中を妨げます。",
  },
  {
    q: "子ども連れでも観られますか？",
    a: "大丈夫です。ただし小さなお子さんが泣いたり騒いだりする場合はロビーへ出ましょう。「親子歌舞伎」「ファミリー向け公演」など子ども向けの特別公演もあります。",
  },
  {
    q: "字幕・解説サービスはありますか？",
    a: "歌舞伎座など主要劇場では、イヤホンガイド（有料）のほか、字幕サービスがある座席もあります。事前に劇場のウェブサイトで確認しておくと安心です。",
  },
  {
    q: "何を着て行けばいいですか？",
    a: "服装の決まりはありません。普段着でもフォーマルでも大丈夫です。和装（着物）で訪れる方も多く、それ自体が観劇を楽しむ演出になります。劇場内は冷暖房が効いているので、温度調節できる服装が便利です。",
  },
  {
    q: "オペラグラスは必要ですか？",
    a: "大きな劇場では2・3階席からだと役者の表情が見えにくいため、あると便利です。劇場の売店やロビーで貸し出しや販売をしていることもあります。",
  },
];

export function mannersPageHTML() {
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

  const tipsHTML = ENJOY_TIPS.map((t, i) => `
    <div class="manner-tip fade-up-d${i}">
      <div class="manner-tip-icon">${t.icon}</div>
      <div class="manner-tip-body">
        <h3 class="manner-tip-title">${t.title}</h3>
        <p class="manner-tip-text">${t.body}</p>
      </div>
    </div>
  `).join("\n");

  const faqHTML = FAQ.map((f, i) => `
    <details class="manner-faq-item fade-up-d${i % 4}">
      <summary class="manner-faq-q">${f.q}</summary>
      <p class="manner-faq-a">${f.a}</p>
    </details>
  `).join("\n");

  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span><a href="/kabuki/navi">KABUKI NAVI</a><span>›</span>観劇マナー
    </div>

    <section class="manner-intro fade-up">
      <p class="manner-lead">
        歌舞伎観劇をもっと楽しむために。<br>
        会場でのマナーと、知っておくと得する楽しみ方をご紹介します。
      </p>
    </section>

    <!-- ── 会場でのマナー ── -->
    <section class="manner-section">
      <h2 class="section-title">会場でのマナー</h2>
      <div class="manner-rules-grid">
        ${rulesHTML}
      </div>
    </section>

    <!-- ── 観劇の楽しみ方 ── -->
    <section class="manner-section">
      <h2 class="section-title">観劇の楽しみ方</h2>
      <div class="manner-tips-list">
        ${tipsHTML}
      </div>
    </section>

    <!-- ── よくある質問 ── -->
    <section class="manner-section">
      <h2 class="section-title">よくある質問</h2>
      <div class="manner-faq">
        ${faqHTML}
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
    headExtra: `<style>
      /* ── イントロ ── */
      .manner-intro {
        text-align: center;
        padding: 24px 16px 32px;
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

      /* ── 楽しみ方リスト ── */
      .manner-tips-list {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .manner-tip {
        display: flex;
        gap: 16px;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        padding: 16px 20px;
        box-shadow: var(--shadow-sm);
        align-items: flex-start;
      }
      .manner-tip-icon {
        font-size: 28px;
        flex-shrink: 0;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-subtle);
        border-radius: var(--radius-sm);
      }
      .manner-tip-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 15px;
        font-weight: 600;
        color: var(--gold-dark);
        margin: 0 0 6px;
      }
      .manner-tip-text {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.8;
        margin: 0;
      }

      /* ── FAQ アコーディオン ── */
      .manner-faq {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .manner-faq-item {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        overflow: hidden;
        box-shadow: var(--shadow-sm);
      }
      .manner-faq-item[open] {
        border-color: var(--gold);
      }
      .manner-faq-q {
        list-style: none;
        padding: 14px 18px;
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
        user-select: none;
        transition: background 0.15s;
      }
      .manner-faq-q::-webkit-details-marker { display: none; }
      .manner-faq-q::before {
        content: "Q";
        flex-shrink: 0;
        width: 22px;
        height: 22px;
        background: var(--gold);
        color: #fff;
        font-size: 12px;
        font-weight: 700;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Noto Serif JP', serif;
      }
      .manner-faq-q:hover { background: var(--gold-soft); }
      details[open] .manner-faq-q { background: var(--gold-soft); }
      .manner-faq-item::after {
        content: "";
        display: block;
      }
      .manner-faq-a {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.85;
        padding: 0 18px 14px 50px;
        margin: 0;
        border-top: 1px solid var(--border-light);
        padding-top: 12px;
      }

      /* ── フッター ── */
      .manner-footer {
        text-align: center;
        margin-top: 2.5rem;
        padding-bottom: 1.5rem;
      }

      @media (max-width: 480px) {
        .manner-rules-grid { grid-template-columns: 1fr; }
        .manner-tip { flex-direction: column; gap: 10px; }
        .manner-tip-icon { width: 36px; height: 36px; font-size: 22px; }
      }
    </style>`,
  });
}
