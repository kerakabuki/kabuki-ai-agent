# CLAUDE.md — kabuki-post-365

Daily **Instagram** auto-posting Worker. Since the 2026-09 Instagram migration the Worker publishes **only to Instagram** (feed photo or Reel, plus evening Stories); Facebook and X are cross-posted by Codex on the operator's PC (see below). Hono + TypeScript backend, React/Vite SPA frontend (`frontend/`), D1 + R2 (`kabuki-post-365-images`) + KV. Admin UI is token-gated (API_TOKEN secret; Bearer auth on `/api/v1/*` except the public `/api/v1/navi/*`, and `/api/v1/reels/jobs/*`, which also accepts a GitHub Actions OIDC token). Part of the kabuki-ai-agent repo — see the root CLAUDE.md for shared context (brand, environment notes, deploy conventions).

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
| `/` | `InstagramTodayPage` | 今日のInstagram（写真／リールの公開状態、Facebook・X の転記状況）。`App.tsx` はこれを `DashboardPage` という名前で import している。**`pages/DashboardPage.tsx` は旧画面で未使用** |
| `/quick` | `QuickPostPage` | **スマホ向けクイック投稿** — 撮影→AI分析→本文生成→即投稿を1画面で（下記） |
| `/calendar` | `CalendarPage` | 投稿カレンダー |
| `/posts/:id` | `PostEditPage` | 投稿1件の編集（画像差し替えは本文を自動クリア／後述） |
| `/images` | `ImagesPage` | 画像ライブラリ |
| `/verify` | `VerifyPage` | 写真チェック（`verified` フラグを立てる人手検品） |
| `/stories` | `StoryHistoryPage` | ストーリーズ投稿履歴とプール残数 |
| `/characters` `/quiz` `/export` `/settings` | — | キャラ／クイズ／CSV出力／設定（`settings` テーブル） |

**クイック投稿（`/quick`）の流れ:** 撮影 or 選択 → `images.analyze`（Gemini Vision で演目/場面/季節/キャラ候補を推定）→ `images.upload` → `posts.create` → `generate.single` で本文生成 → `autoPost.postSingle`（投稿先は Instagram のみ。サーバ側の `postSinglePlatform()` も Instagram 以外を拒否する）。日次パイプラインとは独立した即時経路。途中離脱時は未投稿の暫定 post を `posts.delete` で片付ける。

## Daily pipeline (Instagram only, since 2026-09)

Cron fires every 15 min in the JST 9:00–11:45 window (`*/15 0-2 * * *` UTC). The feed post goes out at a **fixed 09:00 JST** — `pickSlotForDate()` in `src/lib/daily-run.ts` always returns 9:00 and later ticks are processing retries. (The 2026-07 randomized 6:00–11:45 slot and its `*/15 21-23` cron were dropped in the Instagram migration.) The KV flag `autopost_done:{date}` (TTL 48h) is set only after Instagram confirms a publication (`scheduled()` in `src/index.ts`); until then **every** tick in the window re-runs the whole pipeline, LINE notification included. The "fallback" branch at the end of `shouldRunNow()` is unreachable — the 9–12 window check returns first.

Pipeline order (all in `runDailyPipeline()`):

1. **Image auto-assign** (`src/lib/auto-image.ts`) — library rotation first (season-tag match, unused in last 60 days, lowest usage_count), Gemini image generation (`src/lib/image-gen.ts`) only as fallback. Candidates must be `verified = 1 AND privacy_excluded = 0` (see Photo privacy). 白浪五人男 photos (`image-priority.ts`: play_name contains 稲瀬川 / 白浪五人男 / 青砥稿花紅彩画) are a preferred pool that may be reused after 14 days. ~164 library images available (count grows; check the `images` table for the current number).
2. **Text generation** (`src/lib/claude.ts` — actually Gemini; the model comes from `GEMINI_TEXT_MODEL` in `wrangler.toml` `[vars]`, with `GEMINI_VISION_MODEL` / `GEMINI_IMAGE_MODEL` alongside; token usage is logged via `gemini-usage.ts`) — **only `instagram_text` / `instagram_hashtags` are generated**, on every path (`claude.ts` fixes `platforms = ['instagram']`; the mounted `/api/v1/generate` is `routes/instagram-generate.ts`, which rejects other platforms — `routes/generate.ts` is an unmounted leftover), and only for posts where `instagram_text IS NULL`. **Character context comes from the attached image** (`images.character_id`), never from `posts.character_id` — a post whose image has no linked character must not name individual play characters (hallucination guard, 2026-07). All text-gen queries join `characters` via `images.character_id`; keep it that way. Only images with `verified=1` (human-confirmed via the 写真チェック admin tab) are passed as character context to text generation — the JOIN is `LEFT JOIN characters c ON c.id = i.character_id AND i.verified = 1`. Gemini Vision auto-classification always inserts images with `verified=0`, so a mis-identified character never reaches a post until a human confirms it.
3. **Instagram publish** (`executeAutoPost()` in `src/lib/instagram-auto-post.ts` → `publishInstagram()` in `src/lib/instagram-publish.ts`) — at most one post per day, only `auto_publish = 1`. Publishes the rendered Reel when `content_type = 'reel'`, `settings.reels_enabled = '1'` and the render job is `ready`; otherwise the photo. On success it queues the Facebook/X cross-posts (`ensureCrossposts()`). The old multi-platform `src/lib/auto-post.ts` (X / Bluesky / Facebook API) is **not on any live path** — `story-post.ts` still imports its helpers (`getDisabledPlatforms` etc.). Nothing posts to Bluesky anymore.
4. **Prepare-ahead** (`prepareAhead()` in `src/lib/daily-run.ts`) — after publishing, runs `ensureImages` + `generateMissingTexts` for the next N days so 7 days of copy/images are always ready (the Reel renderer also works 7 days ahead and needs the copy). N comes from `settings.prepare_days_ahead` (unset/invalid → 7; `0` or below disables it; clamped to a max of 30). Idempotent — relies on the `instagram_text IS NULL` filter and `ensureImages`' existing guards, so already-prepared days are no-ops. Failures are collected but never block the remaining days or the LINE notification.
5. **Reel queue** (`prepareReels()` in `src/lib/reels.ts`) — only when `reels_enabled = '1'` and `reel_bgm_key` is set: queues render jobs for today through 7 days ahead.
6. **LINE notification** (`src/lib/line-notify.ts`) — summary + errors to admin; silently skipped unless secrets `LINE_CHANNEL_ACCESS_TOKEN` and `LINE_ADMIN_USER_ID` are set. A prepare-ahead line is added only when new copy was generated or an error occurred (no line on no-change days).

Manual triggers: `POST /api/v1/auto-post/daily-run` (full pipeline), `GET /api/v1/auto-post/schedule` (today/tomorrow slot times).

**Removed: nightly review email** — a signed-link review-email feature (review-reminder/review-link/routes/review + send_email binding + 20:00 JST cron) was built and fully removed on 2026-07-18 without ever being committed (operator's phone cannot open workers.dev links, so the emailed links were unusable). It is NOT in git history. The production secret `REVIEW_LINK_SECRET` may still exist but nothing reads it.

### Instagram publish safety (`instagram-publish.ts`) — do not regress

- `posts.publish_state`: `idle → creating → processing → publishing → published`. `failed` is retryable (a media container alone is not a publication).
- **Never re-send while `publishing` or `uncertain`.** The outcome is reconciled by matching the caption against recent media; re-sending risks a duplicate post.
- Unknown privacy status counts as excluded (`COALESCE(i.privacy_excluded, 1)`). Automatic publishing also requires `verified = 1` and today's `post_date`.

### Reels (`src/lib/reels.ts`, migration 0011 — off until `reels_enabled = '1'`)

- `.github/workflows/instagram-reels.yml` (00:35 / 12:35 JST) runs `scripts/render-reel.mjs` (ffmpeg) and claims jobs through `/api/v1/reels/jobs/*` (`reel_jobs`: 15-min lease, max 3 attempts).
- That path authenticates with a GitHub OIDC token (`src/lib/render-auth.ts`) accepted **only from `instagram-reels.yml` running on `refs/heads/main`** — runs from any other branch are rejected.
- A Reel's supporting photos must be the same verified play and scene — never mix unrelated scenes (`makeManifest()`).
- Settings: `reels_enabled`, `reel_bgm_key`, `reels_start_date`.

### Facebook / X cross-posting (Codex, outside this Worker)

- When an Instagram post is published, `ensureCrossposts()` adds `crossposts` rows (`facebook`, `x`) for posts on/after `settings.crosspost_start_date`.
- Codex on the operator's PC works the `/api/v1/crossposts` queue — oldest first, at most one post per platform per day. The Worker itself calls no Facebook/X API. Codex's schedule lives outside this repo, and the repo disagrees with itself: the admin UI says hourly 9–23 JST, the LINE notification (`daily-run.ts`) says 20:00.

## Photo privacy (`images.privacy_excluded`, migration 0009) — do not regress

- Photos with `privacy_excluded = 1` must never reach SNS. **Every query that picks photos for posting must include `verified = 1 AND privacy_excluded = 0`.** The condition is inlined per file (`auto-image.ts`, `calendar-engine.ts`, `story-post.ts` `STORY_POOL_WHERE`, `reels.ts`, `routes/images.ts`), not centralized — add it to any new query.
- Exclusion is set per photo by the operator in 写真チェック (with a reason). Migration 0009 first excluded every `scene_type LIKE '%化粧%'` photo (reason `performer_makeup`); 0010 reverted that — photos taken during makeup are OK for SNS.
- Creating a post with, or swapping a post to, an excluded photo is rejected in `routes/posts.ts`.
- The public NAVI endpoints (`/api/v1/navi/*`) filter by `navi_visible` (a separate manual flag), not by `privacy_excluded`.

## Evening backstage Stories (夕方の舞台裏ストーリーズ, 2026-07)

Separate from the morning feed pipeline: a cron window `*/15 10 * * *` (UTC) = **19:00–19:45 JST** posts one backstage photo to **Instagram Stories** per day. `src/index.ts scheduled()` branches on `event.cron === '*/15 10 * * *'` and runs `runEveningStory()` in `src/lib/story-post.ts` instead of the morning `runDailyPipeline()`.

- **Slot pick:** `shouldRunStoryNow()` picks one of 19:00/19:15/19:30/19:45 via FNV hash of `{date}+'story'` (separate hash seed from the morning feed so the two don't correlate). KV flag `story_done:{date}` (TTL 48h) prevents double runs; the 19:45 slot is the catch-up fallback.
- **Image selection:** `images` where `verified=1`, `privacy_excluded=0`, and `scene_type` LIKE any backstage keyword (楽屋/化粧/稽古/舞台裏/衣裳/衣装/準備/休憩/小道具/運営, or `backstage`). Real `scene_type` values are free-text mixes ("楽屋, 化粧, 衣裳", "楽屋/化粧"), so matching is partial LIKE. Order: `story_posted_at IS NULL` first → oldest `story_posted_at` → `RANDOM()`, LIMIT 1. Zero matches = log only, no post, no notification.
- **Rotation is independent:** uses `images.story_posted_at` (migration 0008), NOT the feed's `usage_count`, so Stories rotation never affects feed rotation.
- **Disable switch:** `settings.disabled_platforms` — `'instagram'` disables IG entirely (feed + story); add `'instagram_story'` to disable **only** the evening story while feed IG keeps running.
- **Notifications:** success sends **no** LINE notification (a nightly ping would be noise). **Failure only** sends `notifyAdmin` (`【kabuki-post-365】ストーリーズ投稿失敗: <error ≤80 chars>`). On failure the KV flag is NOT set so the 19:45 catch-up retries; a failure at the 19:45 slot does set the flag (no more retry slots that day).
- **API:** `postInstagramStory(config, imageUrl)` in `src/lib/sns/meta-api.ts` — same 2-step container→publish flow as `postToInstagram`, but `media_type: 'STORIES'` and no caption.
- **Admin view:** the 「ストーリーズ」tab (`/stories`, `StoryHistoryPage`) shows the pool remaining (対象/未投稿 counts) and the last 30 posted photos with thumbnails; backed by `GET /api/v1/images/story-history`, which reuses the exported `STORY_POOL_WHERE` constant from `story-post.ts` so pool conditions never diverge between the selector and the history view.

## Copy rules (hard-won; do not regress)

- **Instagram:** no URLs in body ("プロフィールのリンクから" instead); image required.
- **文章のパターン化対策（`src/lib/post-style.ts`, 2026-08-12）:** トーン指示だけでは生成文が「この○○、〜ですよね✨ → 感想 → 私たち気良歌舞伎は…」の一本調子に収束した（1か月分の実測）。対策は3点セットで、どれか1つでは戻る。①**構成ローテーション** — 10種の構成型（一点凝視/ひとりごと/問いを立てる/情景描写/短文と余白/意外性の落差/客席目線 等）を `epochDay + hash(theme)` で決定的に選ぶので連続する日は必ず違う構成になる。構成型は文字数と絵文字の上限もセットで縛る（これが無いと全部800字＋✨連打に戻る）。`needsCharacter` / `needsVisual` フラグ付きの型は、検品済みキャラ・画像特徴がある投稿でしか選ばれない（**画像情報が無い日に「一点凝視」を選ぶと写真に写っていない細部を創作する** — 実際に起きた）。テーマ「クイズ」「機能紹介」は構成が決まっているので対象外。②**直近の書き出し回避** — 直近12件の1行目を毎回プロンプトに渡して「これと同じ入り方をするな」と指示。③**使い古された表現の禁止リスト**（`BANNED_PHRASE_RULES`）— ワクワク/鳥肌/奥が深い/思わず息をのむ等、実測で頻出した語を名指しで禁止。あわせて temperature 0.7→1.0。system prompt の【気良歌舞伎の活動について】(貸衣装・化粧は専門・大道具は手作り)は**事実確認用のガードレールであって毎回書く材料ではない**旨を明記した（明記前は12/24件で定型段落として貼られていた）。
- **All platforms:** generated text must not contain markdown (`#`, `##`, `**`, `-`) — enforced in prompts. Templated greeting openers (「皆さん、こんにちは！今日の投稿は…」) are banned in the トーン指針 (2026-07-18): post insights showed daily API posts with that fingerprint got **zero follower distribution** (12 views / 1 viewer / 0% followers over 10 days), while a person-published announcement reached 915 viewers (71% non-followers via 4 shares). Openers must vary and start from the photo/feeling.

### Legacy API-posting rules (old `auto-post.ts`; not on a live path)

Kept in case direct API posting is ever revived:

- **X:** URLs in the body get downranked — URLs and quiz answers go into an auto-reply. Japanese chars count double (110-char limit in the prompt). API credits depleted since 2026-03 (402 CreditsDepleted).
- **Bluesky:** 300 graphemes (truncation implemented). Image blob hard limit 2MB; over ~950KB it falls back to R2 variants (`sns/x` etc., which exist only for images processed by `scripts/generate-variants.mjs`), and over ~1.9MB it posts text-only.
- **Facebook:** API posting stopped 2026-07-18 (daily API posts got zero follower distribution). No generated hashtags (`facebook_hashtags = ''`).

## D1 semantics (gotchas)

- Tables: `posts` (seeded through 2027-03; since migration 0006 the UNIQUE constraint on `post_date` is removed — **multiple posts per day are allowed**), `images`, `characters`, `quiz_posts`, `post_log` (audit; timestamp column is `executed_at`, not `created_at`), `settings` (key/value), `reel_jobs` and `crossposts` (0011). `posts` gained the publish columns in 0011 (`auto_publish`, `content_type`, `publish_state`, `ig_media_id`, `ig_permalink`, …); `images` gained `story_posted_at` (0008) and `privacy_excluded` / `privacy_exclusion_reason` (0009; 0010 undid 0009's blanket exclusion of makeup photos).
- Instagram auto-publish picks today's `auto_publish = 1` post; `draft` posts DO get posted (automatic publishing accepts `draft` and `approved`). `instagram_posted` + `publish_state` prevent re-posting.
- Status becomes `posted` only in `finished()` (`instagram-publish.ts`) after Instagram confirms the publication (the legacy path once marked 108 never-posted rows as posted).
- `settings.disabled_platforms` — comma-separated. `instagram` stops Instagram publishing (feed and story); `instagram_story` stops only the evening story. Other names matter only to the legacy path.
- **Image swap clears copy** (`PUT /api/v1/posts/:id`) — because copy is generated up to 7 days ahead, swapping a post's `image_id` in the admin UI while leaving the body text unedited auto-nulls all SNS texts/hashtags so the next morning's prepare-ahead regenerates them against the new image (hallucination guard: prevents the old image's character name shipping with a new image). If the operator also edits the body in the same save, that text is respected as-is.
