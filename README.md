# 🎭 気良歌舞伎 AIエージェント開発プロジェクト

[cite_start]「守るために、変わる」——伝統とデジタルの融合を目指す気良歌舞伎のデジタル戦略プロジェクトです。 [cite: 545]

## 🎯 プロジェクトの目的
- [cite_start]地歌舞伎「気良歌舞伎」の魅力を世界へ発信 [cite: 530]
- AIエージェント「けらのすけ」による稽古体験の提供
- [cite_start]2024年に完成した常設舞台「気良座」をデジタルでも拡張 [cite: 542]

## 🎭 アイコン

- **メニュー（オリジナル画像）**: 次のファイルを R2 バケット `assets-keranosuke` にアップロードすると、WEBウィジェット・LINE のメニューで絵文字の代わりに表示されます。
  - `menu-icon-kera.png`（気良 … 扇）
  - `menu-icon-enmoku.png`（演目 … 巻き紙）
  - `menu-icon-recommend.png`（おすすめ … 提灯）
  - `menu-icon-glossary.png`（用語いろは … いろは本）
  - `menu-icon-quiz.png`（クイズ … 問答）
  - `menu-icon-news.png`（ニュース … 高札）
  - `menu-icon-training.png`（お稽古 … 稽古）
  - **反映手順**: `python scripts/prepare_menu_icons_for_r2.py` で `assets/menu-icons-for-r2/` に 7 ファイルを用意 → [Cloudflare ダッシュボード](https://dash.cloudflare.com) → R2 → バケット **assets-keranosuke** → **Upload** でアップロード。**重要**: R2 のオブジェクトキーは **ファイル名だけ**（`menu-icon-kera.png` など）にすること。フォルダ付き（例: `menu-icons-for-r2/menu-icon-kera.png`）だと 404 になります。アップロード後、`npx wrangler deploy` でデプロイし、ウィジェットは強制再読み込み（Ctrl+Shift+R）、LINE はメニューを開き直してください。
- **アバター**: `assets/keranosuke-icon-kabuki.png` を R2 に `keranosuke-icon-kabuki.png` でアップロードすると、FAB・ヘッダー・吹き出しのアバターに反映されます。
- **LINE Bot プロフィール**: LINE Developers → チャネル → 基本設定 → 「Bot プロフィール画像」でトーク画面のアイコンを変更できます。
