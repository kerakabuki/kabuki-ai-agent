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
- 結果は依頼書で指定されたファイルに書く（Antigravity・Gemini は `.gemini-handoff/`、Codex は `.codex-handoff/runs/`、Claude は `.claude-handoff/runs/` の記録に従う）。

## 司令塔を引き継ぐとき（Codex・Antigravity が司令塔になる場合）

ユーザーが「司令塔として動いて」と頼んだときは、Claude の代わりに次の役を持つ。ふだんの司令塔は Claude で、Claude の使用枠が足りないときなどの交代を想定している。

- **役目:** 企画・依頼書づくり・結果の確かめ・ユーザーへの報告。実装や量の多い作業は下の担当へ回し、結果は必ず実物（差分・画像・秒数・ビルド結果）で確かめてから報告する。
- **依頼の入口（どれもリポジトリのルートから）:**

  | 頼む相手 | 何を | コマンド |
  |---|---|---|
  | Claude | 原稿・日本語の長文・最終レビュー | `node scripts/claude/ask.mjs run --task <依頼書.md> [--model opus\|sonnet] [--edit]`（既定は読み取りだけ。結果は `.claude-handoff/runs/<日時>/result.md`） |
  | Codex | 実装・加工・検証 | `node "C:/Users/NAO/.claude/skills/codex-build/scripts/run.mjs" run --project "C:/Users/NAO/github/kabuki-ai-agent" --task <依頼書.md> [--kind analysis]` |
  | Gemini API | 映像・資料の分析 | `node scripts/gemini/ask.mjs run --task <依頼書.md> --media <ファイル> [--json]` |
  | Antigravity | 量の多い読み込み・調べもの | `node scripts/antigravity/agent.mjs new --task <依頼書.md>`（入出力は `.gemini-handoff/antigravity/` に置く） |

  自分自身に頼まない（Codex が司令塔なら Codex へは頼まず自分でやる。Antigravity も同じ）。
- **依頼書:** 目的・確定事項・読む場所・成果物と完成条件・変えてよい範囲・検証・未決事項を書く。ひな形は `C:\Users\NAO\.claude\skills\codex-build\assets\handoff-template.md`。
- **手順書:** 定型作業の手順は `.claude/commands/`（`deploy.md`・`note-article.md`・`import-column.md`）にある。Claude のスラッシュコマンド用だが、中身はそのまま手順として読める。
- **ユーザーの好み・進行中の案件:** Claude の記録 `C:\Users\NAO\.claude\projects\C--Users-NAO-github-kabuki-ai-agent\memory\`（`MEMORY.md` が目次）を必要に応じて読む。書き換えはしない。
- **使い分け:** どの作業をどこへ回すかは CLAUDE.md の「外部AIとの分担」の使い分けの表に従う。
- **残りの確認:** 重い作業の前に `node scripts/ai-models/plans.mjs` で各AIの枠の残りを見る。
- **push・デプロイ:** 司令塔を引き継いでいても、本番に出す操作（main への push、`npm run deploy`、本番データへの書き込み）は、ユーザーがその場で頼んだときだけ行い、前に必ず Claude（`scripts/claude/ask.mjs`）にレビューさせる。

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
