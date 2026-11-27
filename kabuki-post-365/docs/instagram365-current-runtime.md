# Instagram 365 現行の定時投稿（2026-11-04 整理）

配備対象は `wrangler.toml` の `src/instagram365/index.ts`。2026-10-30 に稼働開始した36枠の実装を配備元へ取り込み、公開処理・本文・写真・承認条件は維持した。旧 `src/index.ts` の9時パイプラインを現在の定時起動と混同しない。

## 現在の予定と記録

- 対象期間：2026-10-30〜2026-12-31。11月までは朝8時32件・夕19時4件（11/11・12・25・26）の36件、12月は朝8時31件（2026-11-27 承認、下記）。計67件。
- UTC cron：`*/15 23 * * *` と `*/15 10-12 * * *`。期間内の割当済み8時・19時枠だけを選ぶ。20時・21時や未割当の夕枠では公開しない。
- 12月31日終了後は新しい自動投稿を作成せず、旧日次処理へ戻らない。2027年1月以降の計画は未設定。
- 計画は `src/instagram365/lib/policies.ts`、実績は D1 `manual_announcements`。従来の `posts` の未投稿・下書き表示は、この36枠の実行成否を表さない。
- 認証済み GET `/api/v1/instagram-schedule-20261029/summary?date=YYYY-MM-DD` と `?from=YYYY-MM-DD&to=YYYY-MM-DD` は表示専用。SELECTのみで、投稿・照合処理・外部API呼び出しを起こさない。最大31日の差まで。
- `/` と `/calendar` は上記実績を表示し、保存済み公開URLへリンクする。未確認は未確認として表示し、自動的に成功や再送へ変えない。記録表示自体はInstagramの投稿を毎回再取得する機能ではない。
- APIの `/plan`、`/health`、各日 `/status`、`/readiness` は既存経路を維持。`/publish` や旧手動実行APIは監査・表示確認で呼び出さない。

## 2026年12月の朝8時31枠（2026-11-27 追加）

- 正本はユーザー承認済みの `気良歌舞伎事務/SNS投稿/2026-11-27_12月朝の写真予約/12月朝_予約案.json`（第4版。曽根崎心中の撮影者表記を足した第5版の写しは `.cache/dec-2026/source/12月朝_予約案.v5.json`）。本文は `text + "\n\n" + plays[play].credit + "\n\n" + cta_text + "\n" + plays[play].tags` の固定文（撮影者表記がある枠は credit の後に `"\n" + requiredCredit`）（`fixedCaption: true`、`youtubeRules: []`、`youtubeCta` は `cta_text`）。12月に夕方枠は無い（夕方19:35のリールは Meta 側の予約で、この Worker は触らない）。
- 撮影者表記は『曽根崎心中』の6枠（12/26〜31）だけ（2026-11-27 ユーザー決定）。本番 `settings.image_required_credits` の文字列（#245・#268「撮影:篠田重規 様」、#284・#295・#298・#300「撮影：カヤバデザイン」）を `requiredCredit` に入れ、本文では credit の文の次の行に置く（11月の与三「撮影：山田浩二」と同じ形）。投稿前の照合（`required_photo_credit_changed`）は本文の行（前後の空白を除く）に設定の文字列と完全一致する行があるかを見る。ほかの25枠（2023年の与三の役者写真を含む）は表記なし（`requiredCredit` 空）。
- requestId は `instagram-scheduled-20261029:2026-12-DD:morning`、承認参照は `instagram-december-20261127:<requestId>:<deliverySha256>:<captionSha256>`。既存36件は1バイトも変えず、`policies.ts` の末尾に足した。`index.ts` の `END` と `summary.ts` の `endDate` は 2026-12-31。
- 同じ写真は14日以上あける（11月末の #306・#324・#326・#330 の使用を含め、最短14日）。
- Instagram の縦横比の下限（4:5）を下回る縦長写真（既存 #137 と、2023年『切られ与三』の役者写真3枚）は 4:5 に切った配信画像を新しい D1 写真として登録して使う（#137 の R2 原本は変えない）。登録前の `policies.ts` ではこの5枠の imageId が仮の負の値で、そのまま配備しても投稿前の照合で止まる。
- 作業一式は `kabuki-post-365/.cache/dec-2026/`（gitignore）。`read-state.mjs`（本番の読み取り）→ `prepare-photos.py`（配信画像）→ `build.mjs`（policies.ts）→ `test.mjs`（オフライン検証）、本番への書き込みは `register-and-upload.mjs --execute` だけ（既定は dry-run）。手順と結果は同フォルダの `result.md`。

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
