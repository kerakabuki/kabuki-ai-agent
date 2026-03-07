// src/kangekinavi_page.js
// =========================================================
// 観劇ナビ ～はじめての歌舞伎座～ — /kabuki/navi/theater
// はじめての歌舞伎観劇をステップ形式でガイド
// =========================================================
import { pageShell } from "./web_layout.js";

export function kangekinaviPageHTML({ googleClientId = "" } = {}) {
  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span><a href="/kabuki/navi">KABUKI NAVI</a><span>›</span>観劇ナビ
    </div>

    <div class="kn-intro-card fade-up">
      <div class="kn-intro-icon">🧭</div>
      <h2>はじめての歌舞伎座、<br>これ一本で大丈夫。</h2>
      <p>
        チケットの買い方から、劇場の楽しみ方、終演後まで。<br>
        6つのステップで、はじめての観劇をナビします。
      </p>
    </div>

    <div class="kn-progress-bar fade-up-d1" id="kn-progress-bar">
      <div class="kn-progress-dot active" data-step="1"><span class="kn-dot-num">1</span> チケット</div>
      <div class="kn-progress-dot" data-step="2"><span class="kn-dot-num">2</span> 移動</div>
      <div class="kn-progress-dot" data-step="3"><span class="kn-dot-num">3</span> 入場</div>
      <div class="kn-progress-dot" data-step="4"><span class="kn-dot-num">4</span> 開演</div>
      <div class="kn-progress-dot" data-step="5"><span class="kn-dot-num">5</span> 幕間</div>
      <div class="kn-progress-dot" data-step="6"><span class="kn-dot-num">6</span> 終演後</div>
    </div>

    <div class="kn-timeline">

      <!-- STEP 1 -->
      <div class="kn-step-card open fade-up-d1" id="kn-step-1">
        <div class="kn-step-header" onclick="knToggleStep(1)">
          <div class="kn-step-number">1</div>
          <div class="kn-step-title-area">
            <div class="kn-step-title">チケットを手に入れる</div>
            <div class="kn-step-timing">観劇の1〜2週間前</div>
          </div>
          <div class="kn-step-toggle">▼</div>
        </div>
        <div class="kn-step-body">
          <div class="kn-highlight-box">
            <span class="kn-highlight-label">まずはここだけ</span>
            チケットWeb松竹で<strong>3階A席（6,000円）</strong>を購入 ＆ 開演<strong>30分前</strong>に到着するだけで、はじめての観劇は十分楽しめます。
          </div>

          <h4>購入方法</h4>
          <ul>
            <li><strong>チケットWeb松竹</strong>（オンライン）― 最も一般的。会員登録で購入可能</li>
            <li><strong>チケットホン松竹</strong>（電話）― 10:00〜17:00 受付</li>
            <li><strong>劇場窓口</strong> ― 地下2階・木挽町広場の切符売場。当日券は残席がある場合のみ</li>
            <li><strong>一幕見席</strong> ― 4階席。1幕だけ観られるお手軽チケット</li>
          </ul>

          <h4>座席と価格の目安</h4>
          <p>※2025年7月より座席区分が変更されています</p>
          <ul>
            <li>1階桟敷席：20,000円（掘りごたつ式テーブル付きの特別席）</li>
            <li>特等席：20,000円（1階前方の中央エリア）</li>
            <li>1等席：18,000円</li>
            <li>2等席：14,000円</li>
            <li>3階A席：6,000円</li>
            <li>3階B席：5,000円</li>
            <li>一幕見席（4階）：1,000〜2,000円程度（演目により異なる）</li>
          </ul>

          <div class="kn-info-box">
            <span class="kn-info-label">🔰 はじめてなら</span>
            3階A席・B席（5,000〜6,000円）がおすすめ。舞台全体が見渡せて、歌舞伎通の常連さんも多い活気あるエリアです。お試しなら一幕見席で1幕だけ観るのも◎。
          </div>

          <h4>一幕見席について</h4>
          <ul>
            <li>4階の約90席（指定席約70席＋自由席約20席）</li>
            <li>指定席は<strong>前日12:00からオンライン予約</strong>可能（クレジットカード決済＋手数料110円）</li>
            <li>自由席は<strong>当日窓口で現金購入</strong>（劇場正面向かって左側の専用入口）</li>
            <li>1階〜3階のロビー・売店は利用不可（4階のみ）</li>
          </ul>

          <div class="kn-info-box">
            <span class="kn-info-label">🎓 U25当日半額チケット</span>
            25歳以下の方は、歌舞伎座切符売場（地下2階）限定で当日半額チケットを購入できます。
          </div>

          <div class="kn-tip-box">
            人気公演は発売日に完売することも。チケットWeb松竹で発売スケジュールをチェックしておきましょう。松竹歌舞伎会に入会すると先行販売を利用できます。
          </div>
        </div>
      </div>

      <!-- STEP 2 -->
      <div class="kn-step-card" id="kn-step-2">
        <div class="kn-step-header" onclick="knToggleStep(2)">
          <div class="kn-step-number">2</div>
          <div class="kn-step-title-area">
            <div class="kn-step-title">劇場へ向かう</div>
            <div class="kn-step-timing">当日・出発前に確認</div>
          </div>
          <div class="kn-step-toggle">▼</div>
        </div>
        <div class="kn-step-body">
          <h4>歌舞伎座へのアクセス</h4>
          <ul>
            <li><strong>東京メトロ日比谷線・都営浅草線「東銀座」駅</strong> ― 3番出口直結（地下から濡れずに入れます）</li>
            <li><strong>東京メトロ銀座線・丸ノ内線・日比谷線「銀座」駅</strong> ― A7出口より徒歩5分</li>
          </ul>
          <p>住所：東京都中央区銀座四丁目12番15号</p>

          <h4>到着時間の目安</h4>
          <p>開演の<strong>30分前</strong>を目安に到着すると安心です。イヤホンガイドの受取やお弁当の購入など、開演前にやりたいことは意外と多いです。</p>

          <h4>公演スケジュール</h4>
          <ul>
            <li>毎月約25日間公演（月初〜月末）</li>
            <li><strong>昼の部</strong>と<strong>夜の部</strong>に分かれ、それぞれ別の演目を上演</li>
            <li>昼の部：11:00開演が多い ／ 夜の部：16:30開演が多い</li>
            <li>チケットは昼・夜それぞれ別購入</li>
          </ul>

          <h4>服装</h4>
          <p>ドレスコードはありません。<strong>普段着でOK</strong>です。着物の方もいますが、ジーンズやスニーカーの方も多いので気負わずどうぞ。</p>

          <div class="kn-tip-box">
            地下2階「木挽町広場」は東銀座駅から直結。ここにチケット売場やお土産店、屋台があり、開演前から楽しめます。
          </div>
        </div>
      </div>

      <!-- STEP 3 -->
      <div class="kn-step-card" id="kn-step-3">
        <div class="kn-step-header" onclick="knToggleStep(3)">
          <div class="kn-step-number">3</div>
          <div class="kn-step-title-area">
            <div class="kn-step-title">劇場に入ったら</div>
            <div class="kn-step-timing">開演の30分前に到着</div>
          </div>
          <div class="kn-step-toggle">▼</div>
        </div>
        <div class="kn-step-body">
          <h4>イヤホンガイドを借りよう</h4>
          <p>あらすじや見どころを、上演に合わせてリアルタイムで解説してくれる音声ガイドです。役者の屋号や衣装の解説、場面の背景まで教えてくれるので、<strong>初心者には必須アイテム</strong>。</p>
          <div class="kn-info-box">
            <span class="kn-info-label">料金（1階〜3階席）</span>
            当日：800円（税込）／ 事前予約（耳寄屋）：700円（税込＋手数料2%）<br>
            ※保証金なし。終演後、各出口手前の返却BOXに返却
          </div>
          <div class="kn-info-box">
            <span class="kn-info-label">料金（4階・一幕見席）</span>
            500円（税込）・当日現金決済のみ<br>
            ※4階案内所で貸出し。事前予約不可
          </div>
          <p>貸出場所は劇場外の東側カウンター（開演45分前〜）と、劇場内1階ロビー（開場時間〜）。事前にオンラインストア「耳寄屋」で予約するとスムーズでお得です。</p>

          <h4>字幕ガイド（ポータブル字幕）</h4>
          <p>タブレット端末にセリフや解説が文字で表示されるサービスです。義太夫や長唄の詞章も文字で確認できるので、「何を言っているかわからない」という不安が解消されます。</p>
          <div class="kn-info-box">
            <span class="kn-info-label">料金</span>
            1階〜3階席：1,000円（税込）／ 一幕見席：500円（税込）＋保証金1,000円（返却時返金）<br>
            ※当日・現金決済のみ。1階字幕ガイドカウンターにて
          </div>

          <h4>筋書（パンフレット）を買おう</h4>
          <p>配役・あらすじ・舞台写真が載った公演プログラムです。読みながら観ると理解度が格段に上がります。観劇の記念にもなります。</p>
          <div class="kn-info-box">
            <span class="kn-info-label">料金</span>
            1,200〜1,500円程度。1階ロビーの売店で購入できます。
          </div>

          <h4>座席を見つける</h4>
          <p>チケットに記載の席番号を確認し、場内の案内係に聞けば親切に教えてくれます。大きな荷物は1階のコインロッカーへ。</p>

          <div class="kn-tip-box">
            イヤホンガイドと字幕ガイドは別サービス。どちらか一方でも十分楽しめますが、初めてなら音声解説の<strong>イヤホンガイド</strong>がおすすめです。
          </div>
        </div>
      </div>

      <!-- STEP 4 -->
      <div class="kn-step-card" id="kn-step-4">
        <div class="kn-step-header" onclick="knToggleStep(4)">
          <div class="kn-step-number">4</div>
          <div class="kn-step-title-area">
            <div class="kn-step-title">いよいよ開演</div>
            <div class="kn-step-timing">開演〜幕間まで</div>
          </div>
          <div class="kn-step-toggle">▼</div>
        </div>
        <div class="kn-step-body">
          <h4>拍手</h4>
          <p>拍手は歓迎されます。幕開き、見得（みえ）、幕切れなど、感動したら自然に拍手してOK。台詞の最中や静かな場面では控えめに。</p>

          <h4>掛け声（大向こう）</h4>
          <p>「成田屋！」「播磨屋！」など、役者の屋号を声をかける伝統的な応援です。江戸以来の文化ですが、タイミングや声量を誤ると周囲の迷惑になるおそれがあるため、<strong>まずは拍手で楽しみましょう</strong>。</p>

          <div class="kn-info-box">
            <span class="kn-info-label">📝 豆知識</span>
            初心者のうちは周囲の常連さんの掛け声に耳を傾けるのがおすすめです。
          </div>

          <h4>上演中のお約束</h4>
          <ul>
            <li>スマートフォンは電源OFF（マナーモードも不可）</li>
            <li>撮影・録音は禁止</li>
            <li>飲食は幕間のみ</li>
          </ul>
          <a href="/kabuki/navi/manners" class="kn-link-btn">→ 観劇マナーをもっと見る</a>
        </div>
      </div>

      <!-- STEP 5 -->
      <div class="kn-step-card" id="kn-step-5">
        <div class="kn-step-header" onclick="knToggleStep(5)">
          <div class="kn-step-number">5</div>
          <div class="kn-step-title-area">
            <div class="kn-step-title">幕間を楽しむ</div>
            <div class="kn-step-timing">15〜30分の休憩時間</div>
          </div>
          <div class="kn-step-toggle">▼</div>
        </div>
        <div class="kn-step-body">
          <h4>幕間（まくあい）って？</h4>
          <p>幕と幕の間の休憩時間です。通常<strong>15〜30分</strong>。この間にお弁当を食べたり、売店を覗いたりできます。</p>

          <h4>お弁当・食事</h4>
          <ul>
            <li>歌舞伎座内の売店で幕の内弁当が購入可能（事前にオンライン予約も可）</li>
            <li>3階の食事処「花篭」で食事もできます（要予約）</li>
            <li>座席で折詰弁当を届けてもらうサービスあり（30分以上の幕間に限る）</li>
            <li>外で購入して持ち込んでもOK</li>
            <li>座席での飲食は幕間のみ（上演中は不可）</li>
          </ul>

          <h4>ロビー・施設を楽しむ</h4>
          <ul>
            <li>1階お土産処「木挽町」 ― 歌舞伎グッズ、和菓子、限定品</li>
            <li>地下2階「木挽町広場」 ― 屋台、売店（東銀座駅直結）</li>
            <li>5階「歌舞伎座ギャラリー」 ― 歌舞伎の歴史を感じる回廊</li>
            <li>屋上庭園 ― 銀座を見下ろす穴場スポット</li>
          </ul>

          <div class="kn-tip-box">
            幕間の時間は限られています。お弁当は開演前に購入しておくとスムーズ。人気の弁当は売り切れることもあります。
          </div>
        </div>
      </div>

      <!-- STEP 6 -->
      <div class="kn-step-card" id="kn-step-6">
        <div class="kn-step-header" onclick="knToggleStep(6)">
          <div class="kn-step-number">6</div>
          <div class="kn-step-title-area">
            <div class="kn-step-title">終演後の楽しみ方</div>
            <div class="kn-step-timing">余韻をもっと深める</div>
          </div>
          <div class="kn-step-toggle">▼</div>
        </div>
        <div class="kn-step-body">
          <h4>イヤホンガイド・字幕ガイドを返却</h4>
          <p>イヤホンガイドは各出口手前の返却BOXへ。字幕ガイドは1階カウンターまたは返却場所へ。一幕見席の字幕ガイドは保証金1,000円が返却時に戻ります。</p>

          <h4>観劇ログをつけてみよう</h4>
          <p>日付・演目・印象に残った場面・好きな役者…。記録を残すと、次の観劇がもっと楽しくなります。筋書の余白にメモを書き込むのも通の楽しみ方です。</p>
          <a href="/kabuki/reco" class="kn-link-btn kn-link-btn-primary">📓 KABUKI RECO で観劇記録をつける →</a>

          <h4>次はどれを観る？</h4>
          <p>一度観ると「次も観たい」が始まります。演目の世界を広げてみましょう。</p>
          <a href="/kabuki/navi/recommend" class="kn-link-btn">→ おすすめ演目を見る</a>
        </div>
      </div>

    </div><!-- /kn-timeline -->

    <!-- マナーページリンク -->
    <a href="/kabuki/navi/manners" class="kn-manner-banner">
      <div class="kn-banner-icon">📋</div>
      <div class="kn-banner-text">
        <div class="kn-banner-title">観劇マナー</div>
        <div class="kn-banner-sub">会場でのルールをまとめてチェック</div>
      </div>
      <div class="kn-banner-arrow">›</div>
    </a>

    <!-- 地歌舞伎への橋渡し -->
    <div class="kn-bridge-card">
      <h3>🌿 歌舞伎座の感動を、地元でも。</h3>
      <p>今日観た演目が、実は全国のお祭りや神社で<br>地域の人々の手によって上演されています。<br>プロとはまた違う熱さがある「地歌舞伎」の世界へ。</p>
      <a href="/jikabuki/gate/kera" class="kn-bridge-btn">地歌舞伎を知る →</a>
    </div>

    <a href="/kabuki/navi" class="kn-back-link">← KABUKI NAVI に戻る</a>

<script>
function knStickyOffset() {
  var bar = document.getElementById('kn-progress-bar');
  return bar ? bar.offsetHeight + 8 : 8;
}
function knScrollTo(el) {
  var top = el.getBoundingClientRect().top + window.pageYOffset - knStickyOffset();
  window.scrollTo({ top: top, behavior: 'smooth' });
}
function knOpenStep(n) {
  var card = document.getElementById('kn-step-' + n);
  if (card && !card.classList.contains('open')) card.classList.add('open');
  knUpdateProgressDots();
  setTimeout(function() { knScrollTo(card); }, 50);
}
function knToggleStep(n) {
  for (var i = 1; i <= 6; i++) {
    var c = document.getElementById('kn-step-' + i);
    if (!c) continue;
    if (i === n) { c.classList.toggle('open'); }
    else { c.classList.remove('open'); }
  }
  knUpdateProgressDots();
}
function knUpdateProgressDots() {
  document.querySelectorAll('.kn-progress-dot').forEach(function(dot) {
    var card = document.getElementById('kn-step-' + dot.dataset.step);
    if (card && card.classList.contains('open')) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}
document.querySelectorAll('.kn-progress-dot').forEach(function(dot) {
  dot.addEventListener('click', function() {
    var n = parseInt(dot.dataset.step, 10);
    for (var i = 1; i <= 6; i++) {
      var c = document.getElementById('kn-step-' + i);
      if (!c) continue;
      if (i === n) { c.classList.add('open'); }
      else { c.classList.remove('open'); }
    }
    knUpdateProgressDots();
    /* CSS transition (max-height 0.4s) が完了してから正しい位置にスクロール */
    var target = document.getElementById('kn-step-' + n);
    if (target) setTimeout(function() { knScrollTo(target); }, 420);
  });
});

/* スクロール位置に応じてアクティブドットを更新 */
window.addEventListener('scroll', function() {
  var active = null;
  for (var i = 1; i <= 6; i++) {
    var el = document.getElementById('kn-step-' + i);
    if (el && el.classList.contains('open')) {
      var rect = el.getBoundingClientRect();
      if (rect.top <= 120) active = i;
    }
  }
  if (active === null) return; /* 条件を満たすステップがなければ更新しない */
  document.querySelectorAll('.kn-progress-dot').forEach(function(dot) {
    if (parseInt(dot.dataset.step, 10) === active) dot.classList.add('active');
    else dot.classList.remove('active');
  });
}, { passive: true });
</script>
  `;

  const pageUrl = "https://kabukiplus.com/kabuki/navi/theater";
  const ogDesc = "はじめての歌舞伎座を6ステップでガイド。チケットの買い方、座席の選び方、イヤホンガイド、幕間の過ごし方まで丸わかり。";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "はじめての歌舞伎座ガイド",
    "description": ogDesc,
    "url": pageUrl,
    "step": [
      { "@type": "HowToStep", "name": "チケットを手に入れる", "position": 1 },
      { "@type": "HowToStep", "name": "劇場へ向かう", "position": 2 },
      { "@type": "HowToStep", "name": "劇場に入ったら", "position": 3 },
      { "@type": "HowToStep", "name": "いよいよ開演", "position": 4 },
      { "@type": "HowToStep", "name": "幕間を楽しむ", "position": 5 },
      { "@type": "HowToStep", "name": "終演後の楽しみ方", "position": 6 },
    ],
    "publisher": { "@type": "Organization", "name": "KABUKI PLUS+", "url": "https://kabukiplus.com" },
  };

  return pageShell({
    title: "観劇ナビ — はじめての歌舞伎座ガイド",
    subtitle: "はじめての歌舞伎座ガイド",
    bodyHTML,
    activeNav: "navi",
    googleClientId,
    ogDesc,
    ogUrl: pageUrl,
    canonicalUrl: pageUrl,
    headExtra: `
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>
  /* ── 観劇ナビ固有スタイル ── */
  .kn-intro-card {
    background: var(--bg-card);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    padding: 24px 20px;
    margin-bottom: 20px;
    border: 1px solid var(--border-light);
    text-align: center;
  }
  .kn-intro-icon { font-size: 36px; margin-bottom: 8px; }
  .kn-intro-card h2 {
    font-family: 'Noto Serif JP', serif;
    font-size: 18px; font-weight: 700;
    margin-bottom: 12px; color: var(--text-primary);
    line-height: 1.55; letter-spacing: 0.04em;
  }
  .kn-intro-card p { font-size: 13.5px; color: var(--text-secondary); line-height: 2.0; }

  /* ── プログレスバー（sticky固定） ── */
  .kn-progress-bar {
    display: flex; justify-content: center; gap: 6px;
    margin-bottom: 20px; flex-wrap: wrap;
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--bg-page);
    padding: 10px 8px;
    border-bottom: 1px solid var(--border-light);
    margin-left: -16px; margin-right: -16px;
    padding-left: 16px; padding-right: 16px;
  }
  .kn-progress-dot {
    display: flex; align-items: center; gap: 4px;
    font-size: 10.5px; color: var(--text-tertiary);
    background: var(--bg-card); border: 1px solid var(--border-light);
    border-radius: 20px; padding: 4px 10px;
    cursor: pointer; transition: all 0.2s;
    -webkit-tap-highlight-color: transparent;
  }
  .kn-progress-dot:hover, .kn-progress-dot.active {
    background: var(--gold); color: #fff; border-color: var(--gold);
  }
  .kn-dot-num { font-weight: 600; }

  /* ── ハイライトボックス（STEP1冒頭） ── */
  .kn-highlight-box {
    background: linear-gradient(135deg, var(--gold-soft), #fffbf0);
    border: 1.5px solid var(--gold-light);
    border-radius: var(--radius-sm);
    padding: 14px 16px;
    margin-bottom: 18px;
    font-size: 13.5px;
    color: var(--text-primary);
    line-height: 1.8;
  }
  .kn-highlight-label {
    display: inline-block;
    font-size: 10px; font-weight: 700;
    color: var(--gold-dark);
    background: var(--gold-soft);
    border: 1px solid var(--gold-light);
    border-radius: 4px;
    padding: 1px 7px;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }

  .kn-step-card {
    background: var(--bg-card);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-light);
    margin-bottom: 16px; overflow: hidden;
    transition: box-shadow 0.2s;
  }
  .kn-step-header {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 18px;
    background: var(--bg-subtle);
    border-bottom: 1px solid var(--border-light);
    cursor: pointer; user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  .kn-step-number {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 50%;
    background: var(--gold); color: #fff;
    font-family: 'Noto Serif JP', serif;
    font-size: 13px; font-weight: 600; flex-shrink: 0;
  }
  .kn-step-title-area { flex: 1; }
  .kn-step-title {
    font-family: 'Noto Serif JP', serif;
    font-size: 14.5px; font-weight: 600; color: var(--text-primary);
    line-height: 1.3;
  }
  .kn-step-timing {
    font-size: 10.5px; color: var(--text-tertiary);
    margin-top: 2px; letter-spacing: 0.03em;
  }
  .kn-step-toggle { font-size: 16px; color: var(--text-tertiary); transition: transform 0.3s; flex-shrink: 0; }
  .kn-step-card.open .kn-step-toggle { transform: rotate(180deg); }

  .kn-step-body {
    padding: 0 18px; max-height: 0; overflow: hidden;
    transition: max-height 0.4s ease, padding 0.3s ease;
  }
  .kn-step-card.open .kn-step-body { padding: 18px 18px 20px; max-height: 3000px; }

  .kn-step-body h4 {
    font-family: 'Noto Serif JP', serif;
    font-size: 13.5px; font-weight: 600; color: var(--gold-dark);
    margin: 16px 0 8px; padding-bottom: 4px;
    border-bottom: 1px dashed var(--border-light);
  }
  .kn-step-body h4:first-child { margin-top: 0; }
  .kn-step-body p { font-size: 13.5px; color: var(--text-secondary); line-height: 1.9; margin-bottom: 8px; }
  .kn-step-body ul { list-style: none; padding: 0; margin-bottom: 10px; }
  .kn-step-body ul li {
    font-size: 13.5px; color: var(--text-secondary);
    line-height: 1.9; padding-left: 16px; position: relative;
  }
  .kn-step-body ul li::before {
    content: '・'; position: absolute; left: 0; color: var(--gold);
  }

  .kn-info-box {
    background: var(--bg-accent-soft);
    border-radius: var(--radius-sm); padding: 12px 14px;
    margin: 12px 0; font-size: 13px; color: var(--text-secondary);
    line-height: 1.8; border-left: 3px solid var(--gold);
  }
  .kn-info-label {
    font-weight: 600; color: var(--gold-dark);
    font-size: 12px; display: block; margin-bottom: 2px;
  }
  .kn-tip-box {
    background: var(--bg-subtle);
    border-radius: var(--radius-sm); padding: 12px 14px;
    margin: 12px 0; font-size: 13px; color: var(--text-secondary);
    line-height: 1.8; border: 1px solid var(--border-light);
  }
  .kn-tip-box::before { content: '💡 '; }

  .kn-link-btn {
    display: inline-block; font-size: 13px; font-weight: 500;
    color: var(--gold-dark); text-decoration: none;
    background: var(--bg-accent-soft);
    border: 1px solid var(--gold-light);
    border-radius: 20px; padding: 8px 18px; margin-top: 8px;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
  }
  .kn-link-btn:hover {
    background: var(--gold-soft); border-color: var(--gold);
    text-decoration: none; transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(197,162,85,0.2);
  }
  .kn-link-btn-primary {
    display: block; text-align: center;
    background: var(--gold); color: #fff; border-color: var(--gold);
    padding: 11px 20px; border-radius: var(--radius-sm); margin-top: 12px;
    font-size: 13.5px;
  }
  .kn-link-btn-primary:hover {
    background: var(--gold-dark); border-color: var(--gold-dark);
    color: #fff; transform: translateY(-1px);
  }

  .kn-manner-banner {
    display: flex; align-items: center; gap: 10px;
    background: var(--bg-card); border: 1px solid var(--border-light);
    border-radius: var(--radius-sm); padding: 14px 16px;
    margin-top: 20px; text-decoration: none; color: var(--text-primary);
    transition: box-shadow 0.2s;
  }
  .kn-manner-banner:hover { box-shadow: var(--shadow-md); text-decoration: none; }
  .kn-banner-icon { font-size: 24px; }
  .kn-banner-text { flex: 1; }
  .kn-banner-title { font-size: 13.5px; font-weight: 500; }
  .kn-banner-sub { font-size: 11.5px; color: var(--text-tertiary); }
  .kn-banner-arrow { color: var(--text-tertiary); font-size: 20px; }

  .kn-bridge-card {
    background: linear-gradient(135deg, var(--bg-subtle) 0%, var(--gold-soft) 100%);
    border-radius: var(--radius-md); padding: 24px 20px;
    margin-top: 24px; text-align: center; border: 1px solid var(--border-light);
  }
  .kn-bridge-card h3 {
    font-family: 'Noto Serif JP', serif; font-size: 15px; font-weight: 600;
    margin-bottom: 10px;
  }
  .kn-bridge-card p { font-size: 13px; color: var(--text-secondary); line-height: 1.8; margin-bottom: 14px; }
  .kn-bridge-btn {
    display: inline-block; background: var(--gold); color: #fff;
    text-decoration: none; font-size: 13px; font-weight: 500;
    padding: 10px 24px; border-radius: 24px; transition: background 0.2s;
  }
  .kn-bridge-btn:hover { background: var(--gold-dark); text-decoration: none; color: #fff; }

  .kn-back-link {
    display: block; text-align: center; margin-top: 20px;
    font-size: 13px; color: var(--gold-dark); text-decoration: none;
    padding: 12px; border: 1px solid var(--border-light);
    border-radius: var(--radius-sm); background: var(--bg-card);
    transition: background 0.2s;
  }
  .kn-back-link:hover { background: var(--bg-subtle); text-decoration: none; }
</style>`
  });
}
