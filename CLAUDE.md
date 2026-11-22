# Café Companion, working notes for Claude Code

Next.js 16 App Router, TypeScript strict, Tailwind 4, pnpm. Gemini via `@google/genai`. Node 24.

## Commands
- `pnpm dev` dev server; `pnpm check` = lint + typecheck + unit tests; `pnpm build && pnpm test:e2e -- --trace off` for journeys.
- Tests run in demo mode (no key). Do not add tests that need a live Gemini key.

## Non-negotiables
- **AI narrates, code decides.** Prices, totals, dietary safety, order status and wait minutes are computed in `src/lib`, never taken from model output. Validate every id the model returns against `MENU_BY_ID`.
- Every AI function returns `mode: "gemini" | "demo"` and has a deterministic fallback that is unit tested.
- Every API route: zod-validate, `cleanText` free text, `limited()` on public POSTs, `requireStaff()` on staff routes.
- No new personal data. No cookies, no accounts, no analytics.
- Keep the Gemini SDK out of client bundles: client components import from `src/lib/menu`, `src/lib/load`, `src/lib/types` only.

## Conventions
- React Compiler lint is on: no setState directly inside effects. Use `usePolling` or `useStoredState`.
- Copy: short sentences, no emojis, barista voice. See `docs/UX.md`.
- Add a unit test with any change to `src/lib/ai/*`; add an e2e step if a journey changes.

## Skills
`run`, `test`, `deploy`, `security-check`, `pilot-report` in `.claude/skills`.
