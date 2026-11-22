---
name: pilot-report
description: Prepare, run, or write up a Café Companion pilot session (seed data, scripted walkthrough, metrics to capture, feedback synthesis). Use when asked about the pilot, a demo run, or a pilot report.
---

# Pilot playbook

See `docs/PILOT.md` for the full plan. This skill is the operational checklist.

## Before the session (10 min)
1. Deploy or run the app; confirm `/api/health` shows the intended mode.
2. Change `STAFF_PIN` from the default.
3. Open `/staff`, enter the PIN, click **Load pilot data**.
4. Print or display QR codes for `/order` (counter), `/feedback` (tables), `/connect` (noticeboard).
5. Put one staff device on `/staff` where the barista can see it.

## During (60 to 90 min)
Capture, per participant, in `docs/pilot/sessions/<date>.md`:
- Task 1: order two items by chat or voice. Time to complete, number of turns, any correction needed.
- Task 2: find something that fits a stated dietary need. Was the first pick acceptable?
- Task 3: check the wait, then compare to actual pickup time (minutes off).
- Task 4: leave feedback. Did the sentiment read match what they meant?
- Optional: join Connect. Did anyone actually talk?
- Staff: did the "Next 15 minutes" list lead to an action? Which?

## Metrics to pull after
```bash
# with the PIN in $PIN and base URL in $URL
curl -s -H "x-staff-pin: $PIN" $URL/api/orders    | jq '.orders | length, (map(.channel) | group_by(.) | map({k:.[0],n:length}))'
curl -s -H "x-staff-pin: $PIN" "$URL/api/feedback?window=1440" | jq '.insights'
```

## Write-up template
```
# Pilot <date> at <café>
Participants: N customers, M staff
Mode: gemini | demo
## What worked
## What confused people
## ETA accuracy: mean abs error X min over Y orders
## Sentiment agreement: X of Y notes
## Top 3 changes before next pilot
```
Add the write-up to `docs/pilot/` and link it from `docs/PILOT.md`.
