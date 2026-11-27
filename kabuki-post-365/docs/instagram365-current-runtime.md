# Instagram 365 現行の定時投稿（2026-11-04 整理）

配備対象は `wrangler.toml` の `src/instagram365/index.ts`。2026-10-30 に稼働開始した36枠の実装を配備元へ取り込み、公開処理・本文・写真・承認条件は維持した。旧 `src/index.ts` の9時パイプラインを現在の定時起動と混同しない。

## 現在の予定と記録

- 対象期間：2026-10-30〜2026-11-30、朝8時32件、夕19時4件（11/11・12・25・26）。計36件、11月分は34件。
- UTC cron：`*/15 23 * * *` と `*/15 10-12 * * *`。期間内の割当済み8時・19時枠だけを選ぶ。20時・21時や未割当の夕枠では公開しない。
- 11月30日終了後は新しい自動投稿を作成せず、旧日次処理へ戻らない。12月以降の新規計画は今回の対象外。
- 計画は `src/instagram365/lib/policies.ts`、実績は D1 `manual_announcements`。従来の `posts` の未投稿・下書き表示は、この36枠の実行成否を表さない。
- 認証済み GET `/api/v1/instagram-schedule-20261029/summary?date=YYYY-MM-DD` と `?from=YYYY-MM-DD&to=YYYY-MM-DD` は表示専用。SELECTのみで、投稿・照合処理・外部API呼び出しを起こさない。最大31日の差まで。
- `/` と `/calendar` は上記実績を表示し、保存済み公開URLへリンクする。未確認は未確認として表示し、自動的に成功や再送へ変えない。記録表示自体はInstagramの投稿を毎回再取得する機能ではない。
- APIの `/plan`、`/health`、各日 `/status`、`/readiness` は既存経路を維持。`/publish` や旧手動実行APIは監査・表示確認で呼び出さない。

## 実装の境界

`src/instagram365/index.ts` が定時起動を担当する。通常の管理APIは `src/runtime/existing365.js` に委譲する。このファイルは稼働中だった既存管理APIの固定バンドルで、SHA256は `be5c24723c72b8cb247ee3cc80ae1f4a423c8593f7d93c7dc488ed997d4d9d1a`。由来は `2026-10-30/sns/work/instagram-cta-fixed/release/existing365.js`。

旧 `src/lib`・`src/routes` は管理APIの将来のソース復元・比較に必要なものを含む。現在の固定バンドルに変更を加えるには、別途ソースとの照合が必要。旧ファイルを編集しただけで現在の管理APIへ反映されるとは限らない。固定バンドルを推測で再生成・削除しない。

写真の許可、ハッシュ、公式アカウント、14日間隔、時間枠、同枠重複防止、結果不明の自動再送禁止を維持。他媒体の operations、Reels の外部workflow、Codexの確認用automationは今回変更していない。

## 保管した旧ソース

`archive/2026-11-04-unused-source/manifest.json` に原位置・ハッシュ・確認範囲を記録。旧 `frontend/src/pages/DashboardPage.tsx` と未mountの `src/routes/generate.ts` のみを移動した。実際のトップ画面は `App.tsx` が `InstagramTodayPage` を別名 DashboardPage でimportしている。その他は動的参照・外部起動を否定できないため残した。保管はバンドルサイズ削減を意味しない。

## 検証と配備

`tsc --noEmit`、`frontend` の `npm run build`、オフライン39項目（36枠・重複・14日・結果不明・終了日・表示のSELECT専用性）を実施。検証一式と前後証跡は `C:/Users/NAO/Documents/Codex/2026-10-06/task-6/instagram365-cleanup-20261104/` に保存。

今回の反映は版本をuploadしてから、既存19bindings・runtime・36枠を比較し、現行バージョンが変わっていないことを確認して100%へ切り替える。DB migration、設定の書換、実行台帳の更新、投稿や過去枠の再実行は行わない。今後も旧entryを誤って配備しないよう、この文書と `wrangler.toml` を確認する。

配備前の版本は `e3b6cac9-c2ed-47a0-a458-8ac64364ba57`（11/04当時の記録。**今戻すと11/19以降の予約内容が消えるので使わない**）。2026-11-27 に作業フォルダーを git へ入れて `npm run deploy` で上げ直した。その直前の版本 `d4866b06-e720-4fa9-8301-804c83d6b4e2` が現在の戻し先。問題時はその版本を100%へ戻す。DBや公開済み投稿の履歴は巻き戻さない。ローカル差分は上記フォルダー `before/` と保管manifestから復元できる。作業前からある他の編集を上書きしない。
