# Security and privacy

## Reporting

Email the maintainer listed in the repository profile with "cafe-companion security" in the subject. Please do not open a public issue for vulnerabilities. We aim to acknowledge within 72 hours.

## Threat model

Public web app in a café: anonymous customers on shared Wi-Fi, one staff device, an LLM in the loop, a small cloud footprint. Assets: order integrity, the Gemini key, the staff PIN, customer feedback text, Connect profiles.

## Controls

| Area | Control | Where |
|---|---|---|
| Input validation | zod schemas on every API body, enums for categorical fields, length caps on all strings | `src/lib/api.ts`, each route |
| Text hygiene | control characters stripped, whitespace collapsed, capped before prompts or storage | `src/lib/security/sanitize.ts` |
| Pricing integrity | server re-prices cart lines from the menu, model cannot set prices or totals | `POST /api/orders`, `placeOrder` |
| Order lifecycle | explicit state machine, staff-only transitions | `PATCH /api/orders/[id]` |
| Staff auth | `x-staff-pin` header, constant-time compare, min length 4, stored in sessionStorage only | `requireStaff`, `/staff` |
| Abuse limits | fixed-window per-IP rate limits, tighter on chat (30/min), feedback and connect (10/min) | `src/lib/security/rateLimit.ts` |
| Prompt safety | guardrailed system prompts, injection heuristic flag passed to the model, side effects only via typed tools, schema-validated JSON output, menu id validation, dietary filter re-applied post-model | `src/lib/ai/*` |
| Headers | CSP (self only, no third-party scripts), `frame-ancestors 'none'`, nosniff, referrer policy, HSTS, `x-powered-by` removed | `next.config.ts` |
| Secrets | env only, validated once, never logged, `.env*` git-ignored, hosting env vars in production | `src/lib/env.ts` |
| Supply chain | lockfile, `pnpm audit --prod` run locally before a release (no GitHub Actions in this repo) | `package.json` |
| Container | multi-stage build, non-root user, standalone output, healthcheck | `Dockerfile` |

## Privacy

- No accounts, cookies, analytics or third-party scripts.
- Preferences and the cup name live in the browser's localStorage and are sent only with the request that needs them.
- Feedback is stored without any identifier. Staff see text, sentiment, topics and a timestamp.
- Connect profiles contain a nickname, interests, intent and an optional one-liner. They expire after 120 minutes and the owner can delete them immediately. Icebreakers are instructed never to reference appearance.
- Chat transcripts are not persisted; only the resulting order is.
- Logs contain module-level warnings only; never request bodies, prompts or env values.

## Known limitations

- Rate limits are per instance. Behind multiple Cloud Run instances a determined client gets N times the limit. Move to Memorystore for production scale.
- The staff PIN is a shared secret suitable for a pilot. Production should use Identity-Aware Proxy or Firebase Auth with a staff claim.
- The injection screen is heuristic; the real defence is that the chat can only reach the six whitelisted tools.
- Firestore security rules are not needed for server-side access, but if a client SDK is ever added, rules must be written first.

## Review log

Run the `security-check` skill before each release and record the result in `docs/SECURITY-REVIEW-<date>.md`.
