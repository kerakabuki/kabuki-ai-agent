# CLAUDE.md

This file provides guidance to AI coding agents working with this repository.

## Project Overview

KABUKI PLUS+ / JIKABUKI PLUS+ — a Cloudflare Worker application serving as an AI-powered kabuki information platform. Dual-channel: LINE Bot (primary) and Web UI (PWA at kabukiplus.com). The AI assistant character is "けらのすけ" (Keranosuke). Operated from the Cloudflare account kerakabuki@gmail.com.

Two independent Workers live in this repo:

1. **kerakabuki** (main) — repo root, `worker.js` + `src/`. Documented in this file.
2. **kabuki-post-365** — `kabuki-post-365/`, fully automated daily SNS posting. **See `kabuki-post-365/CLAUDE.md`** for its architecture, pipeline, platform rules, and D1 gotchas.

## Build & Deploy

```bash
# Main worker (kerakabuki) — repo root
npx wrangler deploy

# kabuki-post-365 — run inside kabuki-post-365/ (deploy script bundles tsc + frontend build)
npm run deploy
```

**Pushing to main auto-deploys the main worker to production** via GitHub Actions (`.github/workflows/deploy.yml`, gated by `node --check`, triggered only by worker.js / src/ / wrangler.toml changes). Commit one feature per commit — push = production deploy. The `/deploy` command bundles check → deploy → report for both workers.

No test suite exists. worker.js is plain JS (no linter; eslint exists only in kabuki-post-365/frontend). Verify main-worker changes with `node --check worker.js`.

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
- **Group data:** `getGroup()` reads KV `group:{id}` first; `DEFAULT_GROUPS` in worker.js is only the initial seed. Production group info is edited via the GATE editor UI.

## Language

All comments, variable names in domain logic, and UI strings are in Japanese. Code structure and function signatures follow standard JS/TS conventions. Respond to the operator in Japanese.
