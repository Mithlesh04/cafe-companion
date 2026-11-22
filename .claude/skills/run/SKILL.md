---
name: run
description: Start the Café Companion locally (dev or production build) and verify it is healthy. Use when asked to run, start, preview, or screenshot the app.
---

# Run the app

## Dev server (hot reload)
```bash
pnpm dev            # http://localhost:3000
```

## Production build, like Cloud Run
```bash
pnpm build && pnpm start -p 3000
```

## Health check
```bash
curl -s http://localhost:3000/api/health
```
Expect `"mode":"gemini"` when `GEMINI_API_KEY` is set in `.env.local`, otherwise `"demo"`. Demo mode is fully functional and deterministic; use it for screenshots and tests.

## Useful pages
- `/` hub with live wait
- `/order` chat ordering (voice works in Chrome)
- `/discover`, `/waits`, `/connect`, `/feedback`
- `/staff` PIN is `STAFF_PIN` (default `2468`). Click "Load pilot data" to seed orders, feedback and people.

## Screenshots
Playwright is installed. For a quick capture:
```bash
node -e "const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:800},deviceScaleFactor:2});await p.goto('http://localhost:3000/');await p.screenshot({path:'docs/screens/home.png',fullPage:true});await b.close();})()"
```
