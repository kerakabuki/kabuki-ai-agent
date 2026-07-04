---
name: deploy
description: 本番デプロイを一括実行する。対象を自動判定（またはmain/post365/all指定）し、型チェック→デプロイ→結果報告まで追加確認なしで行う。「デプロイ」「デプロイして」といった依頼で使用。
argument-hint: 対象（省略=自動判定 / main / post365 / all）
---

「$ARGUMENTS」を対象に本番デプロイを実行してください。省略時は `git status` と直近の変更ファイルから対象を自動判定する（worker.js / src/ / wrangler.toml → main、kabuki-post-365/ → post365、両方なら all）。

## main（メインWorker kerakabuki）

1. `node --check worker.js` で構文確認（エラー時は中断して報告）
2. リポジトリルートで `npx wrangler deploy`
3. 注: mainブランチへのpushでもGitHub Actionsが自動デプロイされる。push直後なら手動デプロイせず `gh api repos/kerakabuki/kabuki-ai-agent/actions/runs?per_page=1` でCIの結果を確認するだけでよい

## post365（kabuki-post-365）

1. `kabuki-post-365/` で `npx wrangler d1 migrations list kabuki-post-365-db --remote` を実行し、未適用マイグレーションを確認。あれば `npm run db:migrate:remote` を先に適用する
2. `npm run deploy`（tsc --noEmit → frontend build → wrangler deploy を一括実行。tsc失敗時は自動中断）

## 共通

- 完了後、デプロイされたバージョンIDとWorker URLを報告する
- エラーが出たら自分でログを読んで原因を特定し、修正可能なら修正して再実行、不可能なら状況を報告する
- デプロイ後の動作確認: main は `https://kabukiplus.com` の応答、post365 は `https://kabuki-post-365.kerakabuki.workers.dev` の応答を確認する
