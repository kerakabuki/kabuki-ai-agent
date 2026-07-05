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

## Fully automated daily pipeline (rebuilt 2026-07)

Cron fires every 15 min in the JST 6:00–11:45 window (`*/15 21-23 * * *` + `*/15 0-2 * * *` UTC). `shouldRunNow()` in `src/lib/daily-run.ts` picks one pseudo-random slot per day (FNV hash of date) so the posting time varies daily — deliberate anti-bot-pattern measure. A KV flag `autopost_done:{date}` prevents double runs; the 11:45 slot is a catch-up fallback.

Pipeline order (all in `runDailyPipeline()`):

1. **Image auto-assign** (`src/lib/auto-image.ts`) — library rotation first (season-tag match, unused in last 60 days, lowest usage_count), Gemini image generation (`src/lib/image-gen.ts`) only as fallback. ~164 library images available (count grows; check the `images` table for the current number).
2. **Text generation** (`src/lib/claude.ts` — actually Gemini 2.5 Flash) — per-platform texts; only for posts where `instagram_text IS NULL`.
3. **Auto-post** (`src/lib/auto-post.ts`) — Instagram/Facebook (Meta Graph API), Bluesky, X.
4. **LINE notification** (`src/lib/line-notify.ts`) — summary + errors to admin; silently skipped unless secrets `LINE_CHANNEL_ACCESS_TOKEN` and `LINE_ADMIN_USER_ID` are set.

Manual triggers: `POST /api/v1/auto-post/daily-run` (full pipeline), `GET /api/v1/auto-post/schedule` (today/tomorrow slot times).

## Platform-specific rules (hard-won; do not regress)

- **X:** posts with URLs in the body get downranked — URLs and quiz answers go into an auto-reply instead. Japanese chars count double (110 char limit in prompt). X is currently **disabled** via settings (`disabled_platforms = 'x'`) because API credits are depleted (402 CreditsDepleted since 2026-03); re-enable only after buying credits. The live source of truth is the `settings` table in D1.
- **Bluesky:** 300 grapheme limit (truncation implemented). Image blob hard limit is 2MB; if the original exceeds ~950KB the code falls back to `sns/x` etc. R2 variants, and if still over ~1.9MB it posts text-only rather than failing. R2 variants exist only for images uploaded via `scripts/generate-variants.mjs` (manual, needs sharp + API token) — images put into R2 by other routes have no variants.
- **Instagram/Facebook:** no URLs in body ("プロフィールのリンクから" instead); image required for Instagram.
- **All platforms:** generated text must not contain markdown (`#`, `##`, `**`, `-`) — enforced in prompts.

## D1 semantics (gotchas)

- Tables: `posts` (seeded through 2027-03; since migration 0006 the UNIQUE constraint on `post_date` is removed — **multiple posts per day are allowed**), `images`, `characters`, `quiz_posts`, `post_log` (audit; timestamp column is `executed_at`, not `created_at`), `settings` (key/value).
- Auto-post processes posts with status `draft`, `approved`, AND `posted` — draft posts DO get posted. Per-platform `*_posted` flags prevent re-posting.
- `updatePostStatus` only flips status to `posted` when at least one platform actually posted (a past bug marked 108 never-posted rows as posted).
- `settings.disabled_platforms` — comma-separated platform names skipped by auto-post.
