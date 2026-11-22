# Architecture

## Overview

```
 Browser (Next.js App Router, React 19, Tailwind 4)
 ├── /order /discover /waits /connect /feedback /staff      client pages
 └── fetch → /api/*                                         JSON over HTTPS
                     │
 Next.js server (Node 24, standalone, Cloud Run container)
 ├── src/lib/api.ts         zod schemas, rate limit, staff PIN, JSON helpers
 ├── src/lib/ai/*           ordering agent, recommend, waits, sentiment, connect
 │     └── src/lib/gemini.ts  thin wrapper: JSON mode + function calling, 20s timeout
 ├── src/lib/store/*        Store interface → MemoryStore | FirestoreStore
 └── src/lib/security/*     rate limiter, text hygiene, injection screen
                     │                         │
              Gemini API (Google AI)      Firestore (Google Cloud)
```

## Request flow: a chat turn

1. `POST /api/chat` validates body (message ≤ 600 chars, history ≤ 30, cart ≤ 20 lines, prefs enum-checked), applies a 30/min per-IP limit, and cleans text.
2. `chatTurn()` picks the Gemini path if a key is present, else the demo path.
3. Gemini path: system prompt includes the menu, the cart, dietary constraints, time of day and guardrails. Up to five tool rounds: `search_menu`, `add_to_cart`, `remove_from_cart`, `get_recommendations`, `get_wait_time`, `place_order`. Tools mutate a server-side copy of the cart; `place_order` writes through `placeOrder()` which re-prices and computes ETA from the live queue.
4. Response returns `reply`, the authoritative `cart`, an `order` if placed, `mode`, and `flagged`.
5. If Gemini throws or times out, the demo path answers the same request so the customer never sees an error.

## AI modules

| Module | Gemini feature | Deterministic core | Fallback |
|---|---|---|---|
| `ordering.ts` | Function calling, multi-turn | Cart math, re-pricing, state machine | Regex intent parser |
| `recommend.ts` | JSON schema output | `passesDietary` hard filter, `scoreItem` ranking | Scorer with templated reasons |
| `waits.ts` | JSON schema output (one sentence) | Queue model: base 2 min + queued prep / 2 stations + own prep, capped 2..45 | Templated sentence |
| `sentiment.ts` | JSON schema classification | Lexicon with negation, topic keywords, urgent keywords | Same lexicon |
| `connect.ts` | JSON schema icebreakers | Jaccard on interests + intent overlap | Templated icebreakers |

All model output is parsed with `parseModelJson`, then validated: item ids must exist in the menu, dietary filter re-applied after the model picks, strings length-capped. The model never sets a price, total, or order status.

## Data model

See `src/lib/types.ts`. Key entities: `MenuItem`, `Preferences` (client only), `CartLine`, `Order` with `OrderStatus` state machine (`received → preparing → ready → collected`, cancel from the first two), `Feedback` (anonymous), `ConnectProfile` (expires), plus response shapes `WaitPrediction`, `RoomInsights`, `Recommendation`.

## Persistence

`Store` interface in `src/lib/store/types.ts`. `MemoryStore` is default; `FirestoreStore` activates with `FIRESTORE_ENABLED=true` and uses Application Default Credentials (no key file on Cloud Run). Collections are prefixed `cafe_` so a pilot and production can share a project. The store is a `globalThis` singleton to survive dev hot reloads.

## Security controls

- Validation: zod on every body, enums for anything that reaches a prompt as a category.
- Authorisation: `x-staff-pin` header, constant-time compare, required on order listing, status changes, feedback insights and seeding.
- Abuse: fixed-window per-IP limiter (per instance), tighter on chat, feedback and connect. Cart capped at 10 per line.
- Headers: CSP with `frame-ancestors 'none'`, nosniff, referrer policy, HSTS, `x-powered-by` off.
- Prompt safety: guardrailed system prompts, injection heuristic flag, tool-only side effects, schema-validated output.
- Secrets: env only, parsed once by zod, never logged. `.env*` ignored.

## Scaling notes

- Cloud Run 0..4 instances, 512 MiB, concurrency 80 is plenty for a café. Gemini calls dominate latency (1 to 3 s); the UI shows typing indicators.
- For multi-instance correctness move the rate limiter to Memorystore and add a Firestore transaction around order id generation (ids are random 8-hex today, collision risk negligible at café scale).
- Menu is a seed file; the obvious next step is a `cafe_menu` collection and a staff editor.

## Why Next.js and not a separate backend

One deployable, one language, server-only code stays on the server (API routes), client bundle excludes the Gemini SDK (`HOURLY_LOAD` lives in a dependency-free module for that reason). For a hackathon and a pilot, the smallest surface wins.
