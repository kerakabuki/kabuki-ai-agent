// src/nft_guide_page.js
// =========================================================
// NFT購入ガイド — /nft-guide（Jimdo より移設）
// =========================================================
import { pageShell } from "./web_layout.js";

export function nftGuidePageHTML() {
  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span><a href="/jikabuki/gate/kera">JIKABUKI PLUS+</a><span>›</span>NFT購入ガイド
    </div>

    <section class="nft-intro fade-up">
      <h2 class="section-title">🪙 NFT購入ガイド</h2>
      <p class="nft-en-link">
        <a href="https://kerakabuki.jimdofree.com/kerakabuki-nft-english/" target="_blank" rel="noopener">🌐 English</a>
      </p>
    </section>

    <section class="nft-block fade-up">
      <h3 class="nft-h3">NFTとは？</h3>
      <p>NFTとは「非代替性トークン（Non-Fungible Token）」の略で、デジタル上で「本物」と「所有者」を証明できる技術です。</p>
      <p>気良歌舞伎NFTでは、舞台の役者や名場面のビジュアルを、世界に一つだけのアート作品として記録・保有できます。</p>
    </section>

    <section class="nft-block fade-up">
      <h3 class="nft-h3">必要な準備（購入前に）</h3>
      <ul class="nft-checklist">
        <li>✅ パソコン or スマートフォン</li>
        <li>✅ 仮想通貨ウォレット（MetaMask推奨）</li>
        <li>✅ Polygonチェーン上の通貨【WETH（Wrapped ETH）】</li>
      </ul>
      <p><a href="https://metamask.io/" target="_blank" rel="noopener">MetaMaskをインストール</a></p>
    </section>

    <section class="nft-block fade-up">
      <h3 class="nft-h3">MetaMaskで仮想通貨を購入する方法（クレジットカード対応）</h3>
      <p>MetaMaskでは、クレジットカードやApple Payを使って<strong>MATIC（Polygon用）</strong>を直接購入できます。</p>
      <p>このNFTはPolygonチェーン上で発行されており、購入には<strong>Wrapped ETH（WETH）</strong>が必要です。MATICを購入したら、MetaMaskの「スワップ」機能でWETHに交換（スワップ）することで、NFTを購入できます。</p>

      <h4 class="nft-h4">手順（MetaMaskアプリ／ブラウザ共通）</h4>
      <ol class="nft-steps">
        <li>MetaMaskを開く</li>
        <li>ホーム画面で「購入（Buy）」ボタンをクリック</li>
        <li>支払い方法に「クレジットカード」または「Apple Pay」を選択</li>
        <li>購入通貨に <strong>MATIC（Polygon）</strong> を選ぶ</li>
        <li>クレジットカードでMATICを購入（Polygonネットワークに直接届きます）</li>
        <li>購入後、MetaMaskの「Swap」機能で <strong>MATIC → WETH（Polygon）</strong> に交換</li>
        <li>これでNFTが購入可能に！</li>
      </ol>
      <p class="nft-tip">💡 MATICはガス代にもそのまま使えるので、無駄がありません。</p>

      <div class="nft-warning">
        <h4 class="nft-h4">⚠ ご注意：クレジットカード決済には最低購入金額があります</h4>
        <p>MetaMaskでクレジットカードを使ってMATICを購入する場合、決済代行サービス（例：Banxa、Transak）の規定により<strong>最低購入金額が約7,000〜8,000円程度</strong>に設定されています。少額だけ買いたい方には不向きな方法ですが、NFT購入・ガス代・WETHへのスワップなどにまとめて使えるため、ある程度の金額を一括で購入するのがおすすめです。</p>
      </div>

      <h4 class="nft-h4">📌 ポイント</h4>
      <ul class="nft-bullets">
        <li>本人確認（KYC：運転免許証など）が必要な場合があります</li>
        <li>一部のカード（JCB・銀行系）では使えない場合があります</li>
        <li>手数料は4〜8％程度かかりますが、<strong>最も手軽な方法</strong>として初心者におすすめです</li>
      </ul>
    </section>

    <section class="nft-block fade-up">
      <h3 class="nft-h3">OpenSeaでのNFT購入手順</h3>
      <ol class="nft-steps">
        <li>MetaMaskを接続</li>
        <li>KeraKabuki NFTコレクションページへアクセス</li>
        <li>購入したいNFTを選び「Buy now」をクリック</li>
        <li>MetaMaskで確認し、購入完了！</li>
      </ol>
      <p class="nft-cta">
        <a href="https://opensea.io/collection/kerakabuki-portrait-2024-collectors-edition" target="_blank" rel="noopener" class="nft-btn">KeraKabuki NFT コレクションを開く</a>
      </p>
    </section>

    <section class="nft-block fade-up nft-qa">
      <h3 class="nft-h3">よくある質問（Q&amp;A）</h3>

      <div class="nft-q-item">
        <p class="nft-q"><strong>Q. NFTを買うのに年齢制限はありますか？</strong></p>
        <p class="nft-a">A. 多くの取引所やウォレットサービスでは、18歳以上が利用条件となっています。</p>
      </div>

      <div class="nft-q-item">
        <p class="nft-q"><strong>Q. スマートフォンでもNFTを購入できますか？</strong></p>
        <p class="nft-a">A. はい、MetaMaskアプリを使えばスマホでも簡単に購入できます。ブラウザ内でOpenSeaにアクセスしてそのまま購入できます。</p>
      </div>

      <div class="nft-q-item">
        <p class="nft-q"><strong>Q. 購入したNFTはどこに保存されますか？</strong></p>
        <p class="nft-a">A. ご自身のMetaMaskウォレットに保存されます。OpenSeaのプロフィールからも確認できます。</p>
      </div>

      <div class="nft-q-item">
        <p class="nft-q"><strong>Q. 間違って買ってしまったNFTは返品できますか？</strong></p>
        <p class="nft-a">A. 原則としてNFTの購入はキャンセル・返品ができません。購入前にしっかり内容を確認しましょう。</p>
      </div>

      <div class="nft-q-item">
        <p class="nft-q"><strong>Q. NFTを転売することはできますか？</strong></p>
        <p class="nft-a">A. はい、OpenSeaなどで再度出品することで、他の人に販売することが可能です。</p>
      </div>
    </section>

    <p class="nft-footer-note">けらのすけに聞く</p>
  `;

  return pageShell({
    title: "NFT購入ガイド",
    subtitle: "気良歌舞伎NFT",
    bodyHTML,
    brand: "jikabuki",
    activeNav: "jikabuki",
    headExtra: `<style>
      .nft-intro { margin-bottom: 1.5rem; }
      .nft-en-link { font-size: 0.9rem; margin-top: 0.5rem; }
      .nft-en-link a { color: var(--kin); }
      .nft-block {
        background: var(--surface);
        border: 1px solid #333;
        border-radius: 12px;
        padding: 1.2rem 1.5rem;
        margin-bottom: 1.2rem;
      }
      .nft-h3 { font-size: 1.1rem; color: var(--kin); margin-bottom: 0.8rem; border-bottom: 1px solid #333; padding-bottom: 0.3rem; }
      .nft-h4 { font-size: 0.98rem; color: var(--shiro); margin: 1rem 0 0.5rem; }
      .nft-block p { margin: 0.5rem 0; font-size: 0.92rem; line-height: 1.7; color: #ccc; }
      .nft-checklist, .nft-bullets { margin: 0.5rem 0; padding-left: 1.5rem; color: #ccc; }
      .nft-steps { margin: 0.5rem 0; padding-left: 1.5rem; color: #ccc; }
      .nft-steps li { margin: 0.3rem 0; }
      .nft-tip { background: rgba(197,165,90,0.1); padding: 0.6rem; border-radius: 8px; border-left: 3px solid var(--kin); }
      .nft-warning { background: rgba(196,30,58,0.08); padding: 0.8rem; border-radius: 8px; border-left: 3px solid var(--aka); margin-top: 1rem; }
      .nft-cta { text-align: center; margin-top: 1rem; }
      .nft-btn {
        display: inline-block;
        background: var(--aka);
        color: #fff;
        padding: 0.7rem 1.5rem;
        border-radius: 8px;
        text-decoration: none;
        font-weight: bold;
        transition: opacity 0.2s;
      }
      .nft-btn:hover { opacity: 0.9; }
      .nft-qa .nft-q-item { margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #333; }
      .nft-qa .nft-q-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
      .nft-q { margin: 0 0 0.3rem; font-size: 0.9rem; color: var(--shiro); }
      .nft-a { margin: 0; font-size: 0.88rem; color: #aaa; }
      .nft-footer-note { text-align: center; font-size: 0.84rem; color: #666; margin-top: 2rem; }
    </style>`,
  });
}
