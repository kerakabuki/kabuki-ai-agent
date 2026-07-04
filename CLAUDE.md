# CLAUDE.md

This file provides guidance to AI coding agents working with this repository.

## Project Overview

KABUKI PLUS+ / JIKABUKI PLUS+ — a Cloudflare Worker application serving as an AI-powered kabuki information platform. Dual-channel: LINE Bot (primary) and Web UI (PWA at kabukiplus.com). The AI assistant character is "けらのすけ" (Keranosuke). Operated from the Cloudflare account kerakabuki@gmail.com.

Two independent Workers live in this repo:

1. **kerakabuki** (main) — repo root, `worker.js` + `src/`
2. **kabuki-post-365** — `kabuki-post-365/`, fully automated daily SNS posting

## Build & Deploy

```bash
# Main worker (kerakabuki) — repo root
npx wrangler deploy

# kabuki-post-365 (run inside kabuki-post-365/)
npm run dev               # local dev (builds frontend + wrangler dev)
npm run deploy            # frontend build + wrangler deploy
npm run db:migrate:remote # D1 migrations (production)
npx tsc --noEmit          # type check (run before every deploy)
```

No test suite exists. No linter configured. Verify changes with `npx tsc --noEmit` (kabuki-post-365 only; worker.js is plain JS).

Production D1 can be queried directly:

```bash
npx wrangler d1 execute kabuki-post-365-db --remote --json --command "SELECT ..."
```

## Environment Notes (Windows / PowerShell)

- `curl` is a PowerShell alias that hangs on `-s`; always use `curl.exe`.
- Piping objects like `Select-Object Name` may print nothing; format to strings with `ForEach-Object { "$($_.Name)" }`.

## Architecture — Main Worker

### `worker.js` (~7,100 lines, single entry point)

All routing lives here — LINE webhook, Web SSR pages, REST APIs, cron triggers. Locate key functions by grep (line numbers rot):

- `buildKabukiContext()` — RAG context builder for AI (enmoku data, glossary, synonyms; 8000 char limit)
- `keraAIv2()` — main AI orchestrator: rate limiting → conversation history → Gemini → function calling → Workers AI fallback
- `callGemini()` / `callGeminiVision()` — Gemini 2.5 Flash API calls
- `getKeraTools()` — 5 function-calling tools (search_performances, search_news, lookup_glossary, lookup_enmoku, get_group_info)

### Modular Pages (`src/`, ~75 JS files)

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

## Architecture — kabuki-post-365

Hono + TypeScript backend, React/Vite SPA frontend (`frontend/`), D1 + R2 (`kabuki-post-365-images`) + KV. Admin UI is token-gated (API_TOKEN secret; Bearer auth on `/api/v1/*` except `/api/v1/navi/*`).

### Fully automated daily pipeline (rebuilt 2026-07)

Cron fires every 15 min in the JST 6:00–11:45 window (`*/15 21-23 * * *` + `*/15 0-2 * * *` UTC). `shouldRunNow()` in `src/lib/daily-run.ts` picks one pseudo-random slot per day (FNV hash of date) so the posting time varies daily — deliberate anti-bot-pattern measure. A KV flag `autopost_done:{date}` prevents double runs; the 11:45 slot is a catch-up fallback.

Pipeline order (all in `runDailyPipeline()`):

1. **Image auto-assign** (`src/lib/auto-image.ts`) — library rotation first (season-tag match, unused in last 60 days, lowest usage_count), Gemini image generation (`src/lib/image-gen.ts`) only as fallback. ~164 library images available.
2. **Text generation** (`src/lib/claude.ts` — actually Gemini 2.5 Flash) — per-platform texts; only for posts where `instagram_text IS NULL`.
3. **Auto-post** (`src/lib/auto-post.ts`) — Instagram/Facebook (Meta Graph API), Bluesky, X.
4. **LINE notification** (`src/lib/line-notify.ts`) — summary + errors to admin; silently skipped unless secrets `LINE_CHANNEL_ACCESS_TOKEN` and `LINE_ADMIN_USER_ID` are set.

Manual triggers: `POST /api/v1/auto-post/daily-run` (full pipeline), `GET /api/v1/auto-post/schedule` (today/tomorrow slot times).

### Platform-specific rules (hard-won; do not regress)

- **X:** posts with URLs in the body get downranked — URLs and quiz answers go into an auto-reply instead. Japanese chars count double (110 char limit in prompt). X is currently **disabled** via settings (`disabled_platforms = 'x'`) because API credits are depleted (402 CreditsDepleted since 2026-03); re-enable only after buying credits.
- **Bluesky:** 300 grapheme limit (truncation implemented), image blob ≤ ~950KB (falls back to `sns/x` etc. R2 variants).
- **Instagram/Facebook:** no URLs in body ("プロフィールのリンクから" instead); image required for Instagram.
- **All platforms:** generated text must not contain markdown (`#`, `##`, `**`, `-`) — enforced in prompts.

### D1 semantics (gotchas)

- Tables: `posts` (one row per day, seeded through 2027-03), `images`, `characters`, `quiz_posts`, `post_log` (audit; timestamp column is `executed_at`, not `created_at`), `settings` (key/value).
- Auto-post processes posts with status `draft`, `approved`, AND `posted` — draft posts DO get posted. Per-platform `*_posted` flags prevent re-posting.
- `updatePostStatus` only flips status to `posted` when at least one platform actually posted (a past bug marked 108 never-posted rows as posted).
- `settings.disabled_platforms` — comma-separated platform names skipped by auto-post.

## Language

All comments, variable names in domain logic, and UI strings are in Japanese. Code structure and function signatures follow standard JS/TS conventions. Respond to the operator in Japanese.
