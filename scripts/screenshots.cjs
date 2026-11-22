/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Capture documentation screenshots against a running server.
 *   STAFF_PIN=2468 pnpm start -p 3200 &
 *   BASE=http://localhost:3200 node scripts/screenshots.cjs
 */
const { chromium, devices } = require("@playwright/test");
const fs = require("node:fs");

const BASE = process.env.BASE ?? "http://localhost:3200";
const PIN = process.env.STAFF_PIN ?? "2468";
const OUT = "docs/screens";

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  await page.request.post(`${BASE}/api/pilot/seed`, { headers: { "x-staff-pin": PIN } });

  await page.goto(`${BASE}/`);
  await page.waitForSelector("text=Estimated wait");
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/home.png`, fullPage: true });

  await page.goto(`${BASE}/order`);
  await page.fill('input[placeholder="for the cup"]', "Riya");
  await page.fill('input[placeholder*="Type your order"]', "two oat lattes and a croissant");
  await page.click("button[aria-label=Send]");
  await page.waitForSelector("text=Added");
  await page.fill('input[placeholder*="Type your order"]', "how long is the wait?");
  await page.click("button[aria-label=Send]");
  await page.waitForSelector("text=minutes right now");
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/order.png`, fullPage: true });

  await page.goto(`${BASE}/discover`);
  await page.click('button:has-text("Vegan")');
  await page.click('button:has-text("Refresh picks")');
  await page.waitForSelector("text=Add to cart");
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/discover.png`, fullPage: true });

  await page.goto(`${BASE}/waits`);
  await page.waitForSelector("text=Estimated wait");
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/waits.png`, fullPage: true });

  await page.goto(`${BASE}/staff`);
  await page.fill("input[type=password]", PIN);
  await page.click('button:has-text("Open shift view")');
  await page.waitForSelector("text=Next 15 minutes");
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/staff.png`, fullPage: true });

  const mobile = await browser.newContext({ ...devices["Pixel 7"] });
  const mp = await mobile.newPage();
  await mp.goto(`${BASE}/order`);
  await mp.waitForTimeout(600);
  await mp.screenshot({ path: `${OUT}/order-mobile.png` });

  await browser.close();
  console.log("screenshots written to", OUT);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
