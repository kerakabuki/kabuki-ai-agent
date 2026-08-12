# CLAUDE.md — kabuki-post-365

Fully automated daily SNS posting Worker. Hono + TypeScript backend, React/Vite SPA frontend (`frontend/`), D1 + R2 (`kabuki-post-365-images`) + KV. Admin UI is token-gated (API_TOKEN secret; Bearer auth on `/api/v1/*` except `/api/v1/navi/*`). Part of the kabuki-ai-agent repo — see the root CLAUDE.md for shared context (brand, environment notes, deploy conventions).

## Build & Deploy

```bash
npm run dev               # local dev (builds frontend + wrangler dev)
npm run deploy            # tsc --noEmit → frontend build → wrangler deploy (type check is bundled; a tsc failure aborts the deploy)
npm run db:migrate:remote # D1 migrations (production)
npx tsc --noEmit          # standalone type check
```

Before deploying code that ships a new migration, check `npx wrangler d1 migrations list kabuki-post-365-db --remote` and apply pending migrations first. eslint is configured in `frontend/` only (`npm run lint` there); the backend has no linter.

Production D1 can be queried directly:

```bash
npx wrangler d1 execute kabuki-post-365-db --remote --json --command "SELECT ..."
```

## 管理画面（`frontend/`, React Router）

| ルート | ページ | 用途 |
|---|---|---|
| `/` | `DashboardPage` | 当日状況・手動トリガ |
| `/quick` | `QuickPostPage` | **スマホ向けクイック投稿** — 撮影→AI分析→本文生成→即投稿を1画面で（下記） |
| `/calendar` | `CalendarPage` | 投稿カレンダー |
| `/posts/:id` | `PostEditPage` | 投稿1件の編集（画像差し替えは本文を自動クリア／後述） |
| `/images` | `ImagesPage` | 画像ライブラリ |
| `/verify` | `VerifyPage` | 写真チェック（`verified` フラグを立てる人手検品） |
| `/stories` | `StoryHistoryPage` | ストーリーズ投稿履歴とプール残数 |
| `/characters` `/quiz` `/export` `/settings` | — | キャラ／クイズ／CSV出力／設定（`settings` テーブル） |

**クイック投稿（`/quick`）の流れ:** 撮影 or 選択 → `images.analyze`（Gemini Vision で演目/場面/季節/キャラ候補を推定）→ `images.upload` → `posts.create` → `generate.single` で本文生成 → プラットフォームごとに `autoPost.postSingle`。日次パイプラインとは独立した即時経路で、`x` は対象外（実際の可否は `settings.disabled_platforms` で判定）。途中離脱時は未投稿の暫定 post を `posts.delete` で片付ける。

## Fully automated daily pipeline (rebuilt 2026-07)

Cron fires every 15 min in the JST 6:00–11:45 window (`*/15 21-23 * * *` + `*/15 0-2 * * *` UTC). `shouldRunNow()` in `src/lib/daily-run.ts` picks one pseudo-random slot per day (FNV hash of date) so the posting time varies daily — deliberate anti-bot-pattern measure. A KV flag `autopost_done:{date}` prevents double runs; the 11:45 slot is a catch-up fallback.

Pipeline order (all in `runDailyPipeline()`):

1. **Image auto-assign** (`src/lib/auto-image.ts`) — library rotation first (season-tag match, unused in last 60 days, lowest usage_count), Gemini image generation (`src/lib/image-gen.ts`) only as fallback. ~164 library images available (count grows; check the `images` table for the current number).
2. **Text generation** (`src/lib/claude.ts` — actually Gemini 2.5 Flash) — per-platform texts; only for posts where `instagram_text IS NULL`. **Character context comes from the attached image** (`images.character_id`), never from `posts.character_id` — a post whose image has no linked character must not name individual play characters (hallucination guard, 2026-07). All text-gen queries join `characters` via `images.character_id`; keep it that way. Only images with `verified=1` (human-confirmed via the 写真チェック admin tab) are passed as character context to text generation — the JOIN is `LEFT JOIN characters c ON c.id = i.character_id AND i.verified = 1`. Gemini Vision auto-classification always inserts images with `verified=0`, so a mis-identified character never reaches a post until a human confirms it.
3. **Auto-post** (`src/lib/auto-post.ts`) — Instagram/Facebook (Meta Graph API), Bluesky, X.
4. **Prepare-ahead** (`prepareAhead()` in `src/lib/daily-run.ts`) — after auto-post, runs `ensureImages` + `generateMissingTexts` for the next N days so 7 days of copy/images are always ready (lets the operator batch-schedule Facebook a week at a time in Meta Business Suite). N comes from `settings.prepare_days_ahead` (unset/invalid → 7; `0` or below disables it; clamped to a max of 30). Idempotent — relies on the `instagram_text IS NULL` filter and `ensureImages`' existing guards, so already-prepared days are no-ops. Failures are collected but never block the remaining days or the LINE notification.
5. **LINE notification** (`src/lib/line-notify.ts`) — summary + errors to admin; silently skipped unless secrets `LINE_CHANNEL_ACCESS_TOKEN` and `LINE_ADMIN_USER_ID` are set. A prepare-ahead line is added only when new copy was generated or an error occurred (no line on no-change days).

Manual triggers: `POST /api/v1/auto-post/daily-run` (full pipeline), `GET /api/v1/auto-post/schedule` (today/tomorrow slot times).

**Removed: nightly review email** — a signed-link review-email feature (review-reminder/review-link/routes/review + send_email binding + 20:00 JST cron) was built and fully removed on 2026-07-18 without ever being committed (operator's phone cannot open workers.dev links, so the emailed links were unusable). It is NOT in git history. The production secret `REVIEW_LINK_SECRET` may still exist but nothing reads it.

## Evening backstage Stories (夕方の舞台裏ストーリーズ, 2026-07)

Separate from the morning feed pipeline: a cron window `*/15 10 * * *` (UTC) = **19:00–19:45 JST** posts one backstage photo to **Instagram Stories** per day. `src/index.ts scheduled()` branches on `event.cron === '*/15 10 * * *'` and runs `runEveningStory()` in `src/lib/story-post.ts` instead of the morning `runDailyPipeline()`.

- **Slot pick:** `shouldRunStoryNow()` picks one of 19:00/19:15/19:30/19:45 via FNV hash of `{date}+'story'` (separate hash seed from the morning feed so the two don't correlate). KV flag `story_done:{date}` (TTL 48h) prevents double runs; the 19:45 slot is the catch-up fallback.
- **Image selection:** `images` where `verified=1` and `scene_type` LIKE any backstage keyword (楽屋/化粧/稽古/舞台裏/衣裳/衣装/準備/休憩/小道具/運営, or `backstage`). Real `scene_type` values are free-text mixes ("楽屋, 化粧, 衣裳", "楽屋/化粧"), so matching is partial LIKE. Order: `story_posted_at IS NULL` first → oldest `story_posted_at` → `RANDOM()`, LIMIT 1. Zero matches = log only, no post, no notification.
- **Rotation is independent:** uses `images.story_posted_at` (migration 0008), NOT the feed's `usage_count`, so Stories rotation never affects feed rotation.
- **Disable switch:** `settings.disabled_platforms` — `'instagram'` disables IG entirely (feed + story); add `'instagram_story'` to disable **only** the evening story while feed IG keeps running.
- **Notifications:** success sends **no** LINE notification (a nightly ping would be noise). **Failure only** sends `notifyAdmin` (`【kabuki-post-365】ストーリーズ投稿失敗: <error ≤80 chars>`). On failure the KV flag is NOT set so the 19:45 catch-up retries; a failure at the 19:45 slot does set the flag (no more retry slots that day).
- **API:** `postInstagramStory(config, imageUrl)` in `src/lib/sns/meta-api.ts` — same 2-step container→publish flow as `postToInstagram`, but `media_type: 'STORIES'` and no caption.
- **Admin view:** the 「ストーリーズ」tab (`/stories`, `StoryHistoryPage`) shows the pool remaining (対象/未投稿 counts) and the last 30 posted photos with thumbnails; backed by `GET /api/v1/images/story-history`, which reuses the exported `STORY_POOL_WHERE` constant from `story-post.ts` so pool conditions never diverge between the selector and the history view.

## Platform-specific rules (hard-won; do not regress)

- **X:** posts with URLs in the body get downranked — URLs and quiz answers go into an auto-reply instead. Japanese chars count double (110 char limit in prompt). X is currently **disabled** via settings (`disabled_platforms = 'x'`) because API credits are depleted (402 CreditsDepleted since 2026-03); re-enable only after buying credits. The live source of truth is the `settings` table in D1.
- **Bluesky:** 300 grapheme limit (truncation implemented). Image blob hard limit is 2MB; if the original exceeds ~950KB the code falls back to `sns/x` etc. R2 variants, and if still over ~1.9MB it posts text-only rather than failing. R2 variants exist only for images uploaded via `scripts/generate-variants.mjs` (manual, needs sharp + API token) — images put into R2 by other routes have no variants.
- **Instagram/Facebook:** no URLs in body ("プロフィールのリンクから" instead); image required for Instagram. Facebook does not generate hashtags (2026-07〜; FB has no hashtag discovery path and it just looks bot-posted) — text-gen sets `facebook_hashtags = ''`; if a hashtag string is entered manually in the admin UI, auto-post still appends it to the body as before. **Facebook API auto-posting is disabled from 2026-07-18** (`settings.disabled_platforms = 'x,facebook'`) — the operator schedules posts manually via Meta Business Suite's scheduling UI, while text/image are still auto-generated. Reason: verifying the operational observation that API posts don't get the regular engagement that manual posts do. Text generation is unaffected by `disabled_platforms` and keeps producing `facebook_text` for every post, so the generated copy is ready to paste into the scheduler. LINE notification carries each post's permalink (Instagram permalink is fetched best-effort; Facebook is `facebook.com/{post_id}`) so the admin can open the FB link and re-share from a personal account — page-only reach is near zero. For Facebook the notification also includes a `sharer.php?u=<permalink>` link that opens the official share dialog directly, so the admin just presses 投稿する (and can pick a group there). Note: the permalink + sharer.php link only fire when Facebook API auto-posting is re-enabled — while FB is in `disabled_platforms` no FB permalink is generated, so the notification carries no FB link.
- **文章のパターン化対策（`src/lib/post-style.ts`, 2026-08-12）:** トーン指示だけでは生成文が「この○○、〜ですよね✨ → 感想 → 私たち気良歌舞伎は…」の一本調子に収束した（1か月分の実測）。対策は3点セットで、どれか1つでは戻る。①**構成ローテーション** — 10種の構成型（一点凝視/ひとりごと/問いを立てる/情景描写/短文と余白/意外性の落差/客席目線 等）を `epochDay + hash(theme)` で決定的に選ぶので連続する日は必ず違う構成になる。構成型は文字数と絵文字の上限もセットで縛る（これが無いと全部800字＋✨連打に戻る）。`needsCharacter` / `needsVisual` フラグ付きの型は、検品済みキャラ・画像特徴がある投稿でしか選ばれない（**画像情報が無い日に「一点凝視」を選ぶと写真に写っていない細部を創作する** — 実際に起きた）。テーマ「クイズ」「機能紹介」は構成が決まっているので対象外。②**直近の書き出し回避** — 直近12件の1行目を毎回プロンプトに渡して「これと同じ入り方をするな」と指示。③**使い古された表現の禁止リスト**（`BANNED_PHRASE_RULES`）— ワクワク/鳥肌/奥が深い/思わず息をのむ等、実測で頻出した語を名指しで禁止。あわせて temperature 0.7→1.0。system prompt の【気良歌舞伎の活動について】(貸衣装・化粧は専門・大道具は手作り)は**事実確認用のガードレールであって毎回書く材料ではない**旨を明記した（明記前は12/24件で定型段落として貼られていた）。
- **All platforms:** generated text must not contain markdown (`#`, `##`, `**`, `-`) — enforced in prompts. Templated greeting openers (「皆さん、こんにちは！今日の投稿は…」) are banned in the トーン指針 (2026-07-18): post insights showed daily API posts with that fingerprint got **zero follower distribution** (12 views / 1 viewer / 0% followers over 10 days), while a person-published announcement reached 915 viewers (71% non-followers via 4 shares). Openers must vary and start from the photo/feeling.

## D1 semantics (gotchas)

- Tables: `posts` (seeded through 2027-03; since migration 0006 the UNIQUE constraint on `post_date` is removed — **multiple posts per day are allowed**), `images`, `characters`, `quiz_posts`, `post_log` (audit; timestamp column is `executed_at`, not `created_at`), `settings` (key/value).
- Auto-post processes posts with status `draft`, `approved`, AND `posted` — draft posts DO get posted. Per-platform `*_posted` flags prevent re-posting.
- `updatePostStatus` only flips status to `posted` when at least one platform actually posted (a past bug marked 108 never-posted rows as posted).
- `settings.disabled_platforms` — comma-separated platform names skipped by auto-post.
- **Image swap clears copy** (`PUT /api/v1/posts/:id`) — because copy is generated up to 7 days ahead, swapping a post's `image_id` in the admin UI while leaving the body text unedited auto-nulls all SNS texts/hashtags so the next morning's prepare-ahead regenerates them against the new image (hallucination guard: prevents the old image's character name shipping with a new image). If the operator also edits the body in the same save, that text is respected as-is.
