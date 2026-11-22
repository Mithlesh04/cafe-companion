---
name: security-check
description: Run the Café Companion security checklist (deps audit, secrets scan, input validation, auth on staff routes, headers, prompt-injection posture). Use before a release or when asked to review security or privacy.
---

# Security check

Work through every item; report each as pass, fail, or not applicable with evidence.

## 1. Dependencies and secrets
```bash
pnpm audit --prod --audit-level=high
git grep -nE "AIza[0-9A-Za-z_-]{30,}|-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY" -- . ':!pnpm-lock.yaml' || echo "no keys committed"
git check-ignore -q .env.local && echo ".env.local ignored"
```

## 2. Input validation
Every route under `src/app/api` must: parse the body with a zod schema from `src/lib/api.ts` or local, cap string lengths, and pass free text through `cleanText` before it reaches a prompt or storage. Grep:
```bash
grep -L "readJson\|requireStaff" src/app/api/**/route.ts
```
(Only `health` and `menu` GET-only routes may appear.)

## 3. Authorisation
Staff-only: `GET /api/orders`, `PATCH /api/orders/[id]`, `GET /api/feedback`, `POST /api/pilot/seed`. Each must call `requireStaff` first. PIN compare uses `safeEqual`. Confirm `STAFF_PIN` is not the default in production.

## 4. Abuse controls
`limited()` on every public POST. Chat is 30/min, feedback 10/min, connect 10/min. Cart quantity is capped at 10 per line and 20 lines. Order totals are re-priced server side in `POST /api/orders`.

## 5. Prompt safety
- System prompts forbid price changes and off-topic replies.
- `looksLikeInjection` tags suspicious turns; the model is told the message looks adversarial.
- Model output is parsed as JSON against a schema and item ids are validated against the menu; nothing from the model is executed or trusted for pricing.
- Dietary constraints are enforced in code (`passesDietary`) before and after the model picks.

## 6. Headers and transport
`next.config.ts` sets CSP, `frame-ancestors 'none'`, nosniff, referrer policy, HSTS, and disables `x-powered-by`. The e2e test "security headers are present" guards this.

## 7. Privacy
- No accounts, no cookies, no analytics. Preferences live in the browser's localStorage only.
- Feedback is stored without identity. Connect profiles expire after 120 minutes and can be deleted by their owner.
- Logs never print env values or request bodies.

## 8. Report
Write findings to `docs/SECURITY-REVIEW-<date>.md` with severity, file:line, and fix. Open issues for anything not fixed in the same change.
