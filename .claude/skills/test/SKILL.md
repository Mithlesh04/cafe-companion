---
name: test
description: Run and extend the Café Companion test suite (Vitest unit/API tests, Playwright journeys, lint, typecheck). Use before committing or when asked to test, verify, or add coverage.
---

# Testing

## Everything to run before a push
```bash
pnpm check          # lint + typecheck + unit tests
pnpm build && pnpm test:e2e -- --trace off
```

## Layers
| Layer | Command | Where |
|---|---|---|
| Unit + API routes | `pnpm test:unit` | `tests/unit/*.test.ts` (node env) |
| Components | `pnpm test:unit` | `tests/unit/*.test.tsx` (jsdom) |
| Journeys + a11y | `pnpm test:e2e` | `tests/e2e/*.spec.ts` |
| Coverage | `pnpm test:unit --coverage` | thresholds in `vitest.config.ts` |

## Rules of the suite
- Tests run in **demo mode** (no Gemini key) so they are deterministic and free. `tests/unit/setup.ts` clears the key and resets the in-memory store before each test.
- API route handlers are called directly with a `Request`; no server needed.
- Every AI module must keep its demo fallback tested, because that is what runs if Gemini is down.
- Playwright starts `pnpm start` on port 3100 itself; build first.
- When adding a feature: one unit test for the pure logic, one API test for validation and auth, one e2e step if it changes a journey.

## Debugging a failing e2e test
```bash
pnpm test:e2e -- --trace on -g "name of test"
pnpm exec playwright show-report
```
