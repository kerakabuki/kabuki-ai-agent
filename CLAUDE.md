# CLAUDE.md

This file provides guidance to AI coding agents working with this repository.

## Project Overview

KABUKI PLUS+ / JIKABUKI PLUS+ — a Cloudflare Worker application serving as an AI-powered kabuki information platform. Dual-channel: LINE Bot (primary) and Web UI (PWA at kabukiplus.com). The AI assistant character is "けらのすけ" (Keranosuke). Operated from the Cloudflare account kerakabuki@gmail.com.

This repo is **not only the Workers** — it also holds the operator's kabuki research corpus, note article drafts, and the YouTube video production toolchain. See the repo map before exploring.

## Repo Map

| Path | What it is | Deployed? |
|---|---|---|
| `worker.js` + `src/` | **kerakabuki** (main Worker) — LINE Bot + SSR web. Documented below. | ✅ push=本番 |
| `kabuki-post-365/` | 2nd Worker — automated daily SNS posting. **See `kabuki-post-365/CLAUDE.md`** (architecture, pipeline, platform rules, D1 gotchas). | ✅ `npm run deploy` |
| `studio/` | 「超訳！歌舞伎ナビ」動画制作のローカルWebアプリ（`start_studio.cmd` で起動、Node製ローカルサーバ）。エピソード定義は `studio/episodes/*.json`。 | ローカル専用 |
| `scripts/video/` | 動画制作（`build_sonezaki_video.mjs`＝ffmpeg自動組み立て、ElevenLabsナレーション／BGM／画像生成）。 | ローカル専用 |
| `scripts/research/` | 論文・書籍収集と分析（CiNii/J-STAGE/NDL）。出力先は `research/jishibai/`。`joruri_extract/` は浄瑠璃音源の書き起こし処理。 | ローカル専用 |
| `scripts/content/` | KABUKI PLUS+ のコンテンツデータ整備（用語集・演目カタログ・配役・劇場・名鑑スクレイプ）。 | ローカル専用 |
| `scripts/assets/` | 画像処理（アイコン切り出し・余白調整・PWAアイコン・R2投入前処理）。 | ローカル専用 |
| `serifu-viz/` | 台詞可視化ツール（Vite）。 | ローカル専用 |
| `research/jishibai/` | 地芝居研究プロジェクト。`*.json` が収集データ（論文1,295件＋NDL書籍573冊）、`analysis/` に分類・ギャップ分析、`newspapers/` に新聞見出しの事例研究。 | 資料 |
| `research/sonezaki/` | 曽根崎心中の一次資料。近松全集の翻刻・地/詞仕分け・台本比較・先行研究PDF（`papers/`）。 | 資料 |
| `note-articles/` | note記事の原稿。演目記事は直下（`/note-article` の出力先）、連載は `sonezaki-series/` `seichi-series/`。 | 資料 |
| `docs/` | 開発ドキュメント（`architecture-v2.md` 等）。`pr/` に公演PR企画・台本ドラフト、`youtube/` に動画台本とTTS/画像プロンプト。 | 資料 |
| `assets/` | アイコン・OGP・R2投入用画像の原本。 | R2へ手動投入 |
| `data/` | R2 CONTENT_BUCKET に置くJSONのローカル原本（`glossary.json` `jikabuki_groups.json` `stories.json`）と、スクレイプ出力（名鑑）。**ファイル名＝R2オブジェクトキー**なので改名しない。 | R2へ手動投入 |
| `_scratch/` | 下書き・作業メモの退避先（gitignore済み）。**残す価値のあるものはここに置かない**。 | — |

**外部の作業場所:** 曽根崎心中の台本・映像素材の本拠地は `D:\気良歌舞伎\` 配下（`studio/paths.mjs` の `ROOT` 参照）。リポジトリ側にあるのはスクリプトと設定JSONだけで、素材そのものは入っていない。

**スクリプトは必ずリポジトリルートから実行する** — データの読み書きパス（`research/jishibai/*.json` 等）はすべて cwd 相対のため、`scripts/research/` に降りて実行すると壊れる。例: `node scripts/research/merge_all_papers.mjs`

## 作業の入口

定型作業はスラッシュコマンドが正本（`.claude/commands/`）。手順を再発明しない:

| やること | 入口 |
|---|---|
| デプロイ | `/deploy`（対象自動判定 → 型チェック → デプロイ → 報告まで一括） |
| note記事を書く | `/note-article {演目ID}` |
| コラムをKABUKI PLUS+に載せる | `/import-column` |

メインセッションは設計・判断・統括に徹し、作業は役割別サブエージェント（`.claude/agents/`）に委譲する:

| Agent | Model | 役割 | 権限 |
|---|---|---|---|
| `builder` | Opus | 仕様確定済みの実装（コード） | 読み書き＋実行 |
| `writer` | Opus | note記事・台本・告知文（日本語長文） | 読み書き |
| `runner` | Sonnet | デプロイ・wrangler操作・定型実行 | 読み書き＋実行 |
| `reviewer` | Fable | **push前レビュー（push=本番デプロイのため、自明でない変更は必須ゲート）** | 読み取り専用 |
| `triager` | Haiku | 要約・分類・カウント・下処理 | 読み取り専用 |
| `researcher` | Sonnet | Web調査・文献収集・公演情報の裏取り | 読み取り＋Web |

## Build & Deploy

```bash
node --check worker.js     # main worker の唯一の検証手段（テストもリンタも無い）
npx wrangler deploy        # main worker を手動デプロイ（repo root）
cd kabuki-post-365 && npm run deploy   # tsc --noEmit → frontend build → deploy
```

**Pushing to main auto-deploys the main worker to production** via GitHub Actions (`.github/workflows/deploy.yml`, gated by `node --check`, triggered only by worker.js / src/ / wrangler.toml changes). kabuki-post-365 は自動デプロイ対象外（`npm run deploy` が必要）。

No test suite exists. worker.js is plain JS (no linter; eslint exists only in `kabuki-post-365/frontend`).

## Commit / Push 規約

- **1コミット1機能。push = 本番デプロイ**。まとめてpushしない。
- コミットメッセージ接頭辞: `post-365:` / `Studio:` / 接頭辞なし（main worker・資料）。本文は日本語可。
- **資料とコードを同じコミットに混ぜない** — `research/` や `note-articles/` の更新は worker のコードと分ける（push トリガの誤爆と、レビュー範囲の肥大を防ぐ）。
- `research/_*.txt` `note-articles/_*.txt` のような下線始まりは作業メモ。コミットしない。
- 秘密値は `wrangler secret put` でユーザーがターミナルから直接投入する。ファイルにもチャットにも書かない。

## Environment Notes (Windows / PowerShell)

- `curl` is a PowerShell alias that hangs on `-s`; always use `curl.exe`.
- Piping objects like `Select-Object Name` may print nothing; format to strings with `ForEach-Object { "$($_.Name)" }`.
- 日本語パスが多い（`D:\気良歌舞伎\...`）。パスは常にクォートする。

## Architecture — Main Worker

### `worker.js` (~7.7k lines, single entry point)

All routing lives here — LINE webhook, Web SSR pages, REST APIs, cron triggers. Locate key functions by grep (line numbers rot):

- `buildKabukiContext()` — RAG context builder for AI (enmoku data, glossary, synonyms; 8000 char limit)
- `keraAIv2()` — main AI orchestrator: rate limiting → conversation history → Gemini → function calling → Workers AI fallback
- `callGemini()` / `callGeminiVision()` — Gemini 2.5 Flash API calls
- `getKeraTools()` — 5 function-calling tools (search_performances, search_news, lookup_glossary, lookup_enmoku, get_group_info)

### Modular Pages (`src/`, ~74 JS files)

Each `*_page.js` exports an HTML generator for SSR, using `web_layout.js` as the shared shell. Pattern: `export function fooPageHTML(env, lang, ...) → string`.

Key non-page modules: `auth.js` (LINE Login + Google Sign-In, roles master/editor/manager/member), `news.js` (Google News RSS + KV cache), `kabuki_bito.js` (schedule scraping + KV cache), `quiz.js`, `i18n.js` (multilingual), `user_log.js` (KABUKI RECO), `flex_*.js` (LINE Flex Messages).

### Storage (main worker)

| Binding | Type | Purpose |
|---------|------|---------|
| `CHAT_HISTORY` | KV | Sessions, conversation history, membership, caches |
| `ASSETS_BUCKET` | R2 | Menu icons, avatars, static assets |
| `CONTENT_BUCKET` | R2 | Columns, glossary, kawaraban content |
| `ENMOKU_BUCKET` | R2 | Play (enmoku) guide data (22 plays) |
| `QUIZ_BUCKET` | R2 | Quiz question data |
| `AI` | Workers AI | Llama 3.1 8B fallback when Gemini unavailable |

### Important Patterns (main worker)

- **AI fallback chain:** Gemini 2.5 Flash (GEMINI_API_KEY secret) → Workers AI Llama 3.1 8B
- **Rate limiting:** Gemini capped at 14 RPM via KV counter `gemini_rpm:{minute}`
- **Conversation history:** KV `conv:{sourceKey}`, 20 messages max, 1h TTL
- **Hallucination prevention:** code-level immediate responses for known patterns (performances→LIVE, recommendations→NAVI, actors→名鑑) rather than prompt engineering
- **Brand separation:** `kabuki-plus` vs `jikabuki-plus` persona switching by context
- **R2 catalog pattern:** list via `*_catalog` JSON files, not the R2 list API
- **Cron:** news RSS refresh 07:00/19:00 JST
- **Group data:** `getGroup()` reads KV `group:{id}` first; `DEFAULT_GROUPS` in worker.js is only the initial seed. Production group info is edited via the GATE editor UI.

## Language

All comments, variable names in domain logic, and UI strings are in Japanese. Code structure and function signatures follow standard JS/TS conventions. Respond to the operator in Japanese.
