# 令和八年 気良歌舞伎公演 ご来場者アンケート

本番用URL：https://kabukiplus.com/kerakabuki/survey/2026

担当者URL：https://kabukiplus.com/kerakabuki/survey/2026/admin

## 目的

公演後に、ご来場の方からWebで無記名の回答をいただく。「曽根崎心中」の感想（総合評価・心に残った場面・配役リレー・映像演出・筋のわかりやすさ）と、来場回数・お住まい・年代・知ったきっかけ・映画『国宝』の影響・再来場の意向・会場の改善点の基準値を取る。どれも当日の記帳（`docs/reception-2026.md`）では聞いていない項目で、来年以降の比較の起点にする。

## 回答期限・設問の直し方

回答期限は `src/survey_2026.js` の `closesAt`（判定に使う日時）と `closesLabel`（画面の表示）の2か所を合わせて直す。期限を過ぎると回答画面は「受付は終了しました」と次回公演の案内だけになり、送信APIは410を返す。公式トップと /pc の導線も自動で消える。

設問の文言・選択肢は `src/survey_2026.js` だけを直す。表示名は公開後も変えてよいが、選択肢の値（英字）はDBに保存されるので変えない。選択肢を足すのは可（既存の回答はその選択肢0件として集計される）。翌年は同じ形の定義ファイルを作り、`src/survey.js` の `SURVEYS` に登録する。

## 保存と個人情報

無記名。氏名・連絡先はうかがわず、IPアドレス・ブラウザー情報も保存しない（送信制限の判定にだけIPを使う）。回答は受付と同じD1 `kerakabuki-reception`（`RECEPTION_DB`）の `survey_responses` に、正規化したJSONで保存する。受付と同じく送信番号（UUID）とハッシュで二重送信を防ぐ。ご感想の欄には「お名前やご連絡先は書かないでください」と案内している。

送信制限はアンケート専用の `SURVEY_LIMITER`（`wrangler.toml`）で、1IPあたり10回/60秒。無記名の公開フォームの連投対策で、受付の `RECEPTION_LIMITER`（120回/60秒）とは別に数える。同じ回答の再送は制限の対象外（送信番号で重複を判定してから数える）。

ご感想を公式サイトやSNSで紹介するのは、回答者が「紹介してよい」を選んだものに限り、担当者が判断する。「地域と年代を添える」を許可された場合も、明宝・郡上市内の方は「郡上市」とまとめるなど、狭い地域と年代の組み合わせで人が特定されないよう注意する。

## 担当者

既存のKABUKI PLUS+にログインし、担当者URLを開く。`kera` の管理者または `master` 権限が必要（受付と同じ）。

- 数値タイル：回答数（集計対象）・ご感想あり・紹介してよいご感想・集計から除外
- 設問ごとの集計：件数と、回答者数を分母にした割合。複数回答は件数の多い順
- 回答一覧：初期表示は「ご感想のある回答だけ」。紹介の可否と「その他」の記入も表示する
- 「集計から除外する」：テスト回答やいたずらを集計から外す（削除はしない。「集計に戻す」で戻せる）
- 「CSVを書き出す」：全回答（除外分も「除外」と明記）を表示名で出力する。数式注入は無効化済み

紙で回収した分は、担当者が回答画面から1枚ずつ入力できる。1枚入力したら「別の方の回答をする」で次へ進む。

## 導線

期間中だけ、公式トップ（/kerakabuki）の終演御礼とはがき着地ページ（/kerakabuki/pc）の帯にアンケートへのリンクを出す。SNSの投稿やYouTubeの概要欄には本番用URLを載せる。noindexの一時ページなので、sitemapやllms.txtには載せない。

## 公開手順

1. **mainへマージする前に** migrationを適用する。リポジトリ直下（`wrangler.toml` のある場所）で実行する：
   ```powershell
   npx wrangler d1 migrations apply kerakabuki-reception --remote
   npx wrangler d1 migrations list kerakabuki-reception --remote
   ```
   2つ目のコマンドで `0003_survey.sql` が適用済み（未適用の一覧に出ない）ことを確かめる。未適用のまま公開すると、回答画面は「アンケートの準備中です」表示になる（回答者が全問答えてから送信で失敗することはない）。
2. mainへのpushで既存のGitHub Actionsがデプロイする。
3. 公開後、回答画面の表示と送信を確かめる。未ログインで担当者URL・CSVが開けないことも確認する。`node scripts/survey-smoke.mjs https://kabukiplus.com` で画面・導線・権限をまとめて確かめられる（何も保存しない）。`--send` を付けるとテスト回答を1件送り、後片付け用の送信番号を表示する。

AIエージェント（Codex など）に公開作業を任せるときは、手順書 `docs/survey-2026-launch.md` を渡す。

## テスト回答・荒らしの片付け

公開後のテスト回答は、担当者画面の「集計から除外」で足りる。CSVや除外件数にも残したくなければ、集計画面の回答番号（No.）を確かめて、リポジトリ直下で削除する：

```powershell
npx wrangler d1 execute kerakabuki-reception --remote --command "DELETE FROM survey_responses WHERE survey_id='2026' AND id=番号"
```

連投・荒らしがあった場合は、時刻の範囲でまとめて集計から除外する（削除はしないので、必要なら画面の「集計に戻す」で個別に戻せる）。`created_at` はUTCのISO文字列（例：日本時間 10月2日 21:00 は `2026-10-02T12:00:00.000Z`）なので、日本時間から9時間引いて指定する：

```powershell
npx wrangler d1 execute kerakabuki-reception --remote --command "UPDATE survey_responses SET excluded=1, updated_at='2026-10-03T00:00:00.000Z', updated_by='wrangler' WHERE survey_id='2026' AND created_at BETWEEN '2026-10-02T12:00:00.000Z' AND '2026-10-02T12:30:00.000Z'"
```

## 開発・検証

```powershell
node scripts/survey-test.mjs
node scripts/reception-test.mjs
node scripts/reception-preview.mjs
```

依存が別の場所にある場合は `RECEPTION_DEPS` にminiflare・esbuildを含むpackage.jsonの絶対パスを指定する。テストは一時D1・KVを使い、migrationを自動で適用する。締切の判定に使う現在時刻は、ローカル環境（`RECEPTION_PREVIEW=1`）に限り `SURVEY_NOW` で固定しているので、実行日に左右されない（本番には影響しない）。

プレビューは `http://127.0.0.1:8789/kerakabuki/survey/2026`。集計画面は `/preview-admin` で架空の担当者としてログインしたあと、`/kerakabuki/survey/2026/admin` を開く。ローカルDB・KVを本番へ取り込まない。
