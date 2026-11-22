# The Café Companion — submission brief

**Live demo:** https://cafe-companion-swart.vercel.app
**Source code:** https://github.com/Mithlesh04/cafe-companion
**Staff view:** https://cafe-companion-swart.vercel.app/staff (PIN `2468`, then click "Load pilot data")

## One line

A café that remembers how you take it: order by chat or voice, get picks that respect your diet, see an honest wait time from the real queue, meet someone over coffee, and give the team a live read of the room. Powered by Gemini.

## What it does

| Brief theme | Our feature |
|---|---|
| Smarter Ordering | A Gemini agent with function calling that searches the menu, edits the cart, checks the wait and places the order. Voice input in Chrome. Preferences and name are remembered on the device. |
| Better Waits | Wait time computed from the live order queue and per-item prep time across two stations, narrated by Gemini, plus the quietest time to come back and live order tracking. |
| Discovery | Recommendations that enforce allergies, caffeine limits and budget in code; Gemini only chooses from safe items and explains each pick for the time of day and the customer's mood. |
| Connect People | Opt-in, nickname-only cards with interests that expire in two hours. Interest matching plus Gemini-written icebreakers that never mention appearance. |
| Understand the Room | Anonymous 30-second feedback classified for sentiment, topic and urgency. Staff see mood, hot topics, urgent flags and three actions for the next fifteen minutes. |
| Beyond the brief | Every AI feature has a deterministic fallback, so the café never shows an error when the model is slow or rate limited, and every answer carries a "Gemini" or "Demo" badge so nobody is misled. |

## Google technology

Gemini API (`gemini-3.8-flash`, free tier) for conversation with tool calling, structured JSON output, classification and copywriting. Firestore for persistence. Cloud Run container and Firebase App Hosting config included. Chrome Web Speech API for voice.

## Principles

1. AI narrates, code decides: prices, totals, dietary safety, order status and wait minutes are never taken from the model.
2. Privacy by default: no accounts, no cookies, anonymous feedback, self-expiring connect profiles.
3. Staff are users too: one glanceable shift view that answers "what should we do in the next fifteen minutes?"
4. Pilot-ready: seed data, PIN-gated staff view, health endpoint, pilot plan with success metrics.

## Quality

Next.js 16, TypeScript, Tailwind 4. 61 unit and API tests, 30 Playwright journeys on desktop and a Pixel 7 profile, accessibility checks, zod validation on every route, rate limiting, CSP headers, prompt-injection screening. Docs cover analysis, architecture, UX, testing, security, deployment and the pilot plan.

## Team

Mithlesh Kumar
