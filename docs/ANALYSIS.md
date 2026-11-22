# Problem analysis

## The brief

"Design a smarter café experience powered by AI. Cafés are places to work, meet, connect and unwind. Create an application or AI agent that makes the café experience more personal, convenient and connected for both customers and café teams. Mandatory: use Google technology."

Suggested directions: smarter ordering, better waits, discovery, connecting people, understanding the room. "Think beyond these ideas."

## Who we are building for

| Persona | Situation | Pain today | What good looks like |
|---|---|---|---|
| **Riya, remote worker** | Three visits a week, laptop, oat milk, avoids caffeine after 3pm | Repeats the same order and the same "oat milk please" every time; never knows if the place is slammed before she walks over | Says "the usual" and it is right; knows the wait before leaving her desk |
| **Arjun, first-timer** | Walked in with a friend, vegetarian, nut allergy | Menu board is long, staff are busy, he defaults to a cappuccino | Three safe suggestions with a reason each, in under ten seconds |
| **Meera, meeting someone** | Arrived early, waiting | Scrolls her phone alone | Optionally finds out there is another chess player in the room |
| **Sam, barista on shift** | Two people on bar, lunch rush | Learns the room is unhappy from a one-star review two days later | Sees "music too loud, 3 notes in 20 minutes" while it can still be fixed |
| **Priya, owner** | Runs one site, no IT team | Cannot afford a custom build or a POS integration project | Something that runs for free in demo mode and costs pennies with Gemini |

## What we chose to build and why

We cover all five suggested directions because they share one data model (menu, orders, feedback, people) and reinforce each other: the ordering agent uses the recommender and the wait model; the wait model uses the live orders; the room dashboard uses the feedback classifier. The novelty is in how they are built, not in picking one.

### Design principles that drove decisions

1. **AI narrates, code decides.** Prices, totals, dietary safety, the order state machine and the wait estimate are computed deterministically. Gemini chooses among safe candidates, writes explanations and drives the conversation through tools. This is what makes it safe to put in front of a real nut-allergic customer.
2. **Degrade gracefully.** Every AI call has a deterministic fallback that produces the same shape of answer. The UI shows a "Gemini" or "Demo mode" badge so nobody is misled. The pilot cannot be derailed by quota or network.
3. **Privacy by default.** No accounts. Preferences stay in the browser. Feedback is anonymous. Connect is opt-in, nickname only, and self-destructs in two hours.
4. **Staff are users too.** The dashboard answers one question: what should we do in the next fifteen minutes? Not analytics for its own sake.
5. **Pilot-ready on day one.** Seed data, a PIN-gated staff view, a health endpoint, and a container that runs anywhere.

## Scope decisions

| Considered | Decision | Reason |
|---|---|---|
| Payments | Out | Pilot is pay-at-counter; adding a PSP adds compliance scope with no learning value |
| POS integration | Out, interface left open | `Store` abstraction and `MENU` seed let a POS adapter slot in later |
| Accounts and loyalty | Out | Local preferences deliver 80 percent of personalisation with zero PII |
| Push notifications for "order ready" | Out for now | Polling the tracker every 10 seconds is enough for a pilot; Firebase Cloud Messaging is the natural next step |
| Multi-language | Partial | Voice recognition follows the browser language; Gemini answers in the language it is spoken to. Full UI localisation is future work |
| Table-side ordering by QR | In, via `/order` | Same flow, the QR just deep-links |
| Agent memory across visits | In, device-local | Preferences and name persist in localStorage |

## Success metrics for the pilot

- Ordering: median turns to a placed order of 3 or fewer; at most one correction per order.
- Waits: mean absolute error between promised and actual pickup under 4 minutes.
- Discovery: first recommendation accepted in at least half of sessions.
- Room: staff take at least one action per shift that they attribute to the dashboard.
- Connect: at least one real conversation started per session of ten or more opt-ins.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Model hallucinates an item or price | Items validated against the menu; prices never come from the model; cart edits only via tools |
| Prompt injection via chat | Heuristic screen tags the turn, system prompt is told, nothing privileged is reachable from the chat anyway |
| Wait estimate wrong at peak | Confidence label; estimate anchored to real queue; pilot measures error and tunes `STATIONS` |
| Connect feels creepy | Opt-in, nickname only, no photos or DMs, expiry, one-click leave, icebreakers forbidden from mentioning appearance |
| Feedback misclassified | Staff see the raw text next to the label; urgent flag is a union of model and keyword rules |
| Single-instance state in memory | Firestore switch for production; rate limits documented as per-instance |
