# Pilot test plan

## Goal

Learn, in one real café over two sessions, whether the Companion makes ordering faster, waits more predictable, and gives staff something they act on. Not a launch.

## Setup

| Item | Choice |
|---|---|
| Venue | One independent café, two staff on bar, 20 to 40 seats |
| Duration | Two sessions of 90 minutes: one weekday morning peak, one weekend afternoon |
| Participants | 8 to 12 customers per session recruited at the door, 2 staff |
| Deployment | Cloud Run with Gemini key and Firestore, or a laptop running `pnpm start` on the café Wi-Fi in demo mode as a fallback |
| Devices | Customers use their own phones via QR; one staff tablet on `/staff` |
| Consent | Verbal, plus a card explaining that feedback is anonymous and Connect is opt-in |

## Session script

1. **Prep (facilitator, 10 min):** health check, change PIN, load pilot data, place QR codes: `/order` at the counter, `/feedback` on tables, `/connect` on the noticeboard.
2. **Task A, order (every participant):** "Order what you actually want using the chat or the mic." Record time to placed order, number of turns, corrections, and whether voice was used.
3. **Task B, discovery (half the participants):** "Tell it one dietary limit and pick from what it suggests." Record whether the first suggestion was accepted.
4. **Task C, waits (everyone):** Note the promised ETA at order time and the real time the name is called. Record the difference.
5. **Task D, feedback (everyone, after pickup):** "Leave one honest note." Afterwards ask: did the sentiment it read back match what you meant?
6. **Task E, connect (optional):** Observe whether any matched pair talks.
7. **Staff debrief (10 min):** Which suggestion from "Next 15 minutes" did you act on? What was noise? What did you want that was missing?

## Metrics and targets

| Metric | Target | Source |
|---|---|---|
| Median turns to placed order | ≤ 3 | chat logs, facilitator sheet |
| Orders needing a correction | ≤ 1 in 4 | facilitator sheet |
| ETA mean absolute error | < 4 min | promised vs actual |
| First recommendation accepted | ≥ 50% | facilitator sheet |
| Sentiment agreement | ≥ 80% | participant confirmation |
| Staff actions attributed to dashboard | ≥ 1 per session | debrief |
| Task completion without help | ≥ 90% | facilitator sheet |

## Data handling

- No names beyond what customers type for the cup. No emails, no phone numbers.
- Connect profiles expire after two hours; facilitator clears the store after each session via "Load pilot data" (which resets) or a redeploy.
- Facilitator sheets are paper or a private sheet; they are not committed to the repo.

## Rollback and safety

- If Gemini misbehaves, remove the key and restart; demo mode keeps the session going.
- If the wait estimate is wildly off at peak, tell staff to quote verbally and treat the model as a learning input; adjust `STATIONS` after the session.
- Allergy-sensitive participants are told the app filters but the barista confirms, as with any menu.

## After the pilot

Write `docs/pilot/<date>.md` using the template in `.claude/skills/pilot-report/SKILL.md`, then open issues for the top three changes. Decide: second pilot, or build the POS adapter and order-ready notifications.
