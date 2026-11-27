# AGENTS.md

このリポジトリで作業する AI エージェント（Codex・Antigravity・Gemini など）向けの要点。詳しい設計と手順は [CLAUDE.md](CLAUDE.md) が正本で、食い違ったら CLAUDE.md に従う。返答・コメント・UI の文言は日本語。

## このリポジトリは何か

気良歌舞伎（岐阜県郡上市の地芝居）の発信基盤。歌舞伎情報サイト KABUKI PLUS+（kabukiplus.com・LINE Bot「けらのすけ」）の Cloudflare Worker に加えて、Instagram 自動投稿 Worker、動画制作の道具、研究資料、note 記事の原稿が同居している。

| 場所 | 中身 |
|---|---|
| `worker.js` + `src/` | メイン Worker（LINE Bot と Web の SSR）。**main に push すると本番に自動デプロイされる** |
| `kabuki-post-365/` | Instagram 毎朝投稿の Worker。`kabuki-post-365/CLAUDE.md` と `docs/instagram365-current-runtime.md` を先に読む |
| `studio/` `scripts/` `serifu-viz/` | 手元で使う道具（動画・研究・コンテンツ整備）。本番には出ない |
| `research/` `note-articles/` `docs/` | 資料・記事原稿・台本 |
| `data/` | R2 に置く JSON の原本。**ファイル名＝R2 のキーなので改名しない** |

## 分担

- ユーザーは作りたいものと条件だけを伝える。Claude Code が司令塔として企画・原稿・最終レビューを持ち、各エージェントに依頼書を渡す。
- 依頼を受けたエージェントは、**依頼書に書かれた範囲だけ**を行う。目的や必須条件を変える判断が要るときは、勝手に決めずに結果にそう書いて戻す。
- 結果は依頼書で指定されたファイルに書く（Antigravity・Gemini は `.gemini-handoff/`、Codex は `.codex-handoff/runs/` の記録に従う）。

## やってはいけないこと

- git の commit・push、本番デプロイ（`wrangler deploy` / `npm run deploy`）、本番の D1・R2・KV への書き込み。これらは依頼書で明示されない限り行わず、Claude 側が行う。
- 秘密値（API キー・トークン）をファイル・ログ・出力に書くこと。キーは `.gemini_api_key`・`.dev.vars`・wrangler の secret にあり、値を表示しない。
- 依頼書にない既存の未コミット変更を書き換えること。原本の写真・動画（`D:\気良歌舞伎\` 配下など）を変更・削除すること。
- `kabuki-post-365/src/runtime/existing365.js`（固定バンドル）を推測で作り直すこと。

## 作業の約束

- スクリプトはリポジトリのルートから実行する（読み書きのパスが cwd 相対）。例: `node scripts/research/merge_all_papers.mjs`
- メイン Worker の検証は `node --check worker.js` と `src/*.js` の `node --check`（テストもリンタも無い）。post-365 は `npx tsc --noEmit` と `cd frontend && npm run build`。
- 環境は Windows 11。PowerShell の `curl` は別物なので `curl.exe` を使う。日本語・全角を含むパスが多いので、パスは必ずクォートする。
- 写真を SNS に出す処理では、`verified = 1 AND privacy_excluded = 0` の写真だけを使う。
- 芝居は「エンタメ」の立場で書く。役者は屋号で呼ぶ。台詞や事実は床本・資料で裏を取ってから書き、推測で断定しない。
