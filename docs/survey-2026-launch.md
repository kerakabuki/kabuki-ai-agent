# 令和八年公演 ご来場者アンケート 公開作業の手順書（Codex向け）

AIエージェント（Codex）に公開作業を任せるための指示書。上から順に実行し、各手順の「確認」を満たしてから次へ進む。「止まる条件」に当たったら、その時点で作業を止めて、状況をユーザーに報告する。判断に迷ったら、実行せずにユーザーに聞く。

## 目的

PR #3（https://github.com/kerakabuki/kabuki-ai-agent/pull/3 、ブランチ `ccr-438aa1b3-kh9g0a`）の「ご来場者アンケート」を本番に公開し、動くことを確かめる。

- 回答画面：https://kabukiplus.com/kerakabuki/survey/2026
- 回答期限：2026年10月31日（土）23:59。期限を過ぎると受付が自動で終わるので、それまでに公開する
- 中身と運用の説明：`docs/survey-2026.md` と PR #3 の説明

SNSでの告知はユーザーが自分で行う。Codexは投稿しない。

## 前提

- 作業場所：ユーザーのPC（Windows・PowerShell）にある kabuki-ai-agent リポジトリ
- Node.js 22以降。wrangler は、気良歌舞伎の Cloudflare アカウント（kerakabuki@gmail.com）でログインしていること。GitHub へ push とマージができること。`gh`（GitHub CLI）があれば使う
- **main へのマージは、そのまま本番デプロイになる**（GitHub Actions の `.github/workflows/deploy.yml`。`worker.js`・`src/`・`wrangler.toml` の変更で走る）
- PowerShell の注意
  - `curl` は Invoke-WebRequest の別名で、`-s` を付けると止まる。使うなら `curl.exe`。HTTPの確認は、この手順書では `node scripts/survey-smoke.mjs` で行う
  - 出力の整形に `Select-Object` を使うと何も出ないことがある。そのときは `ForEach-Object { "$($_.Name)" }` のように文字列にする

## やってはいけないこと

- コードや設定ファイルを直さない。問題を見つけたら止まって報告する
- main に直接コミット・push しない。マージは PR #3 から行う
- 本番のDBで、手順7のテスト回答以外の行を消したり書き換えたりしない。受付の表（`reception_entries`・`reception_audit`）には触れない
- `npx wrangler deploy` を手で実行しない。デプロイは GitHub Actions に任せる（例外は手順5の最後）
- SNS（Instagram・Facebook・Bluesky・X）への投稿や、`kabuki-post-365` の操作はしない
- APIトークンなどの秘密の値を、出力・ファイル・コミットに残さない

## 手順

### 1. ブランチを取得して中身を確かめる

```powershell
git fetch origin
git switch ccr-438aa1b3-kh9g0a
git pull --ff-only
git log --oneline -5
git status --short
```

ローカルにブランチがなければ、`git switch -c ccr-438aa1b3-kh9g0a --track origin/ccr-438aa1b3-kh9g0a` で作る。

確認：
- 次の4つのコミットが入っている（これより新しいコミットが上にあってもよい）
  - `アンケート: SNS告知画像（Instagramフィード・ストーリーズ）を追加する`
  - `アンケート: SNSでの告知文と投稿の段取りを用意する`
  - `アンケート: レビューの指摘を反映する（古い端末・再送・送信制限・テストの期限依存）`
  - `令和8年公演のご来場者アンケートを追加する`
- `git status --short` が何も出さない

止まる条件：ブランチがない。作業ツリーに未コミットの変更がある（ユーザーの作業かもしれないので、消したり退避したりしない）。

### 2. 構文チェックとテスト（ローカルだけ・本番には触れない）

```powershell
node --check worker.js
Get-ChildItem src\*.js | ForEach-Object { node --check $_.FullName; if ($LASTEXITCODE) { "NG: $($_.Name)" } }
```

テストは `kabuki-post-365` にインストールされた miniflare と esbuild を使う。`kabuki-post-365\node_modules` がなければ、先に `npm ci` を実行する。

```powershell
Push-Location kabuki-post-365; npm ci; Pop-Location   # node_modules がないときだけ
node scripts/survey-test.mjs
node scripts/reception-test.mjs
```

確認：
- `node --check` のあと「NG:」が1行も出ない
- `survey-test` の最後に `"passed": 80`、`reception-test` の最後に `"passed": 65` が出て、どちらも終了コードが0
- `survey-test` の途中に出る `survey_request_failed` のログ1行は想定どおり（DBの表がない状態を再現するテストが出している）
- テストで作られる `.reception-build/` と `test-results.json` は `.gitignore` 済みなので、コミットしない

止まる条件：構文エラー、またはテストの失敗。

### 3. 本番DBに表を追加する（migration 0003）

このブランチを取り出した状態で、リポジトリ直下（`wrangler.toml` のある場所）から実行する。

```powershell
npx wrangler whoami
npx wrangler d1 migrations list kerakabuki-reception --remote
```

確認：
- `whoami` のアカウントが kerakabuki@gmail.com
- 未適用の一覧に `0003_survey.sql` だけが出る。すでに適用済みで何も出なければ、次の apply は飛ばしてよい

```powershell
npx wrangler d1 migrations apply kerakabuki-reception --remote
npx wrangler d1 migrations list kerakabuki-reception --remote
npx wrangler d1 execute kerakabuki-reception --remote --command "SELECT COUNT(*) AS n FROM survey_responses"
```

`apply` で「Ok to proceed?」と聞かれたら y で進める。

確認：未適用の migration がなくなり、最後のコマンドが `n` = 0 を返す。

`0003_survey.sql` は、表 `survey_responses` とその索引を足すだけ（`CREATE TABLE IF NOT EXISTS`・`CREATE INDEX IF NOT EXISTS`）で、既存の表には触れない。

止まる条件：
- アカウントが違う、またはログインが切れている
- 未適用の一覧に `0001_reception.sql` か `0002_proxy.sql` が出る（受付の表は本番にすでにあるはずなので、想定外）
- `apply` が失敗する

### 4. PR #3 をマージする

```powershell
gh pr view 3 --json state,mergeable,headRefOid
git rev-parse HEAD
```

確認：`state` が `OPEN`、`mergeable` が `MERGEABLE`、`headRefOid` が `git rev-parse HEAD`（手順1で確かめたブランチの先頭）と同じ。

```powershell
gh pr merge 3 --squash --subject "令和8年公演のご来場者アンケートを追加する (#3)"
```

- 1機能を1コミットにする運用なので、「Squash and merge」でまとめる。ブランチは消さない（ブランチの削除を聞かれたら No）
- `gh` が使えない場合は、ユーザーに GitHub の PR #3 の画面で「Squash and merge」を押してもらう。押したことを確かめてから次へ進む

止まる条件：`mergeable` が `CONFLICTING`、PR が閉じている、先頭のコミットが手順1と違う。

### 5. 本番デプロイの完了を待つ

```powershell
gh run list --workflow deploy.yml --branch main --limit 3
gh run watch <最新の run の ID> --exit-status
```

確認：マージのコミットで走った「Deploy to Cloudflare Workers」が success。

失敗したとき：
- `gh run view <ID> --log-failed` でログを見て、ユーザーに報告する
- 「Syntax check」の失敗はコードの問題なので、そこで止まる
- 認証切れやネットワークなど一時的な失敗なら、ユーザーの了承を得てから `gh run rerun <ID>` を1回だけ実行する
- GitHub Actions がどうしても使えない場合に限り、ユーザーの了承を得てから、最新の main を取り出したリポジトリ直下で `npx wrangler deploy` を実行する

### 6. 本番で動くことを確かめる（読み取りのみ・何も保存しない）

```powershell
git switch main
git pull --ff-only
node scripts/survey-smoke.mjs https://kabukiplus.com
```

確認：最後に「すべてOK（11項目）」が出る。確かめている項目は次のとおり。
- 回答画面が表示され、フォームがある
- 回答画面にキャッシュ・検索除外のヘッダーが付いている
- 公式トップにアンケートへのリンクがある
- 既存の受付ページ・案内ページが表示される
- 未ログインでは集計画面・集計API・CSVが開けない
- 他サイトからの送信を断る

うまくいかないとき：
- デプロイ直後は反映に少し時間がかかることがある。NGがあれば1分待って1回だけやり直す
- 「フォームがある」だけがNG → 回答画面が「準備中」になっている。手順3の migration が効いていないので、止まって報告する
- 本番の主要ページ（ https://kabukiplus.com/ 、https://kabukiplus.com/kerakabuki 、https://kabukiplus.com/kerakabuki/reception/2026 ）が500などで表示されない → すぐユーザーに報告する。了承を得てから `npx wrangler rollback` で直前の版に戻す

`/kerakabuki/pc` は、はがきQRの訪問数を数えているページなので、確認のために開かない。

### 7. 送信を試して、テスト回答を消す

```powershell
node scripts/survey-smoke.mjs https://kabukiplus.com --send
```

確認：「テスト回答を送信できる」がOKになり、`TEST_REQUEST_ID=…` が表示される。

表示されたIDで、本番のテスト回答を1件だけ消す（`<ID>` を置き換える）。

```powershell
npx wrangler d1 execute kerakabuki-reception --remote --json --command "DELETE FROM survey_responses WHERE survey_id='2026' AND request_id='<ID>'"
npx wrangler d1 execute kerakabuki-reception --remote --json --command "SELECT COUNT(*) AS n FROM survey_responses WHERE request_id='<ID>'"
```

確認：DELETE の結果（JSON の `meta.changes`）が 1、最後の SELECT が `n` = 0。

DELETE の条件には必ず `request_id` を入れる。ほかの行は消さない。

### 8. 報告する

次の内容をまとめて、ユーザーに報告する。
- 手順2のテスト結果（件数）
- 手順3の migration の結果（今回適用したのか、すでに適用済みだったのか）
- マージのコミット（SHA）と、デプロイの run の結果と URL
- 手順6・7の結果（OK/NGの一覧）と、テスト回答を消したこと（changes の値）
- 途中で止まった場合は、止まった手順・理由・出力の要点

## 公開後にユーザーが行うこと（参考。Codexはしない）

- KABUKI PLUS+ にログインした状態で、担当者画面 https://kabukiplus.com/kerakabuki/survey/2026/admin が開けることを確かめる
- SNSで告知する。文面は `docs/pr/sns-survey-2026.md`、画像は `assets/sns/survey-2026-feed.jpg`（フィード用）と `assets/sns/survey-2026-story.jpg`（ストーリーズ用）
- 10月24日ごろにリマインドを投稿する。10月31日の締切を過ぎたら、Linktree（Instagram のプロフィールのリンク）からアンケートのリンクを外し、固定表示も外す
