# UX and UI

## Principles

1. **Say it like a barista.** Short sentences, no emojis, no exclamation marks. The agent asks one question at a time and confirms before it places anything.
2. **One screen, one job.** Each route answers a single question: what do I want, what should I try, how long, who is here, how is the room. The QR on the table goes straight to `/feedback`.
3. **Show the work.** Every AI answer carries a Gemini or Demo badge; wait estimates show the number of orders ahead and a confidence label; recommendations give a reason; feedback gets a sentiment and topic read back.
4. **Nothing is lost.** Cart, name and preferences persist on the device. Voice input falls back to typing. Gemini falls back to demo mode.
5. **Staff first at the counter.** The shift view is a glanceable kanban with one button per order and a "next 15 minutes" list, designed for a tablet propped by the grinder.

## Visual system

- Palette: cream background, espresso text, terracotta accent, sage for good states, gold for stars. Defined as CSS variables in `globals.css` and exposed to Tailwind via `@theme`.
- Type: Geist Sans and Geist Mono via `next/font` (self-hosted, no layout shift).
- Shape: 20px cards, pill buttons and chips, soft shadows. Light theme only for legibility in bright cafés.
- Motion: 240 ms rise on new content, typing dots, pulsing mic. All disabled under `prefers-reduced-motion`.

## Accessibility

- Semantic landmarks: header nav with `aria-label`, `main#main`, skip link as first focusable element.
- Chat log is `role="log"` with `aria-live="polite"`; wait numbers and feedback acknowledgements are live regions.
- Chips are real buttons with `aria-pressed`; star rating is a `radiogroup`; icon-only buttons have `aria-label`.
- Visible focus ring on all interactive elements (3px terracotta at 35 percent).
- Colour is never the only signal: sentiment dots are paired with text, status badges carry words.
- Tested on desktop Chrome and a Pixel 7 profile in Playwright; `tests/e2e/a11y.spec.ts` enforces one h1 per page, named buttons, the lang attribute and the skip link.

## Responsive behaviour

- Nav collapses to icons under 640px with screen-reader labels.
- Order page stacks chat above cart on mobile; chat keeps a 70vh height so the composer stays reachable.
- Staff view stacks orders above the room read; order cards keep the action button on the right.

## Copy guidelines for the agent

- Greet once. Do not re-introduce yourself.
- Prefer "Added. 2 x Oat Latte. Total ₹580. Anything else?" over paragraphs.
- Dietary refusals are plain: "That has nuts. The vegan banana bread is nut-free, want that instead?"
- Never promise a time the wait model did not produce.

## Known gaps

- No dark theme yet.
- Voice ordering depends on Chrome's Web Speech API; Safari users type.
- The staff view is English only.
