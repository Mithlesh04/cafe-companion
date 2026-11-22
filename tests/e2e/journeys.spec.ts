import { expect, test } from "@playwright/test";

test.describe("customer journeys", () => {
  test("home shows the live wait and feature links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("remembers");
    await expect(page.getByText("Estimated wait")).toBeVisible();
    await expect(page.getByRole("link", { name: /Start an order/ })).toBeVisible();
  });

  test("order by chat, then place it", async ({ page }) => {
    await page.goto("/order");
    await page.getByPlaceholder("for the cup").fill("Playwright");
    await page.getByPlaceholder(/Type your order/).fill("two oat lattes and a croissant");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByRole("log")).toContainText("Added");
    await expect(page.getByText("Oat Latte", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Place order", exact: true }).click();
    await expect(page.getByText(/Order ord_\w+ placed for Playwright/)).toBeVisible();
    await page.getByRole("link", { name: "Track it live" }).click();
    await expect(page).toHaveURL(/\/waits\?order=ord_/);
    await expect(page.getByText("received")).toBeVisible();
  });

  test("discover respects dietary chips", async ({ page }) => {
    await page.goto("/discover");
    await page.getByRole("button", { name: "Vegan" }).click();
    await page.getByRole("button", { name: "None" }).click();
    await page.getByRole("button", { name: "Refresh picks" }).click();
    const cards = page.getByRole("listitem");
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toContainText("vegan");
      await expect(cards.nth(i)).toContainText("no caffeine");
    }
  });

  test("feedback is acknowledged with a sentiment read", async ({ page }) => {
    await page.goto("/feedback");
    await page.getByLabel("4 stars").click();
    await page.getByPlaceholder(/How is it going/).fill("Great coffee but the music is a bit loud");
    await page.getByRole("button", { name: "Send to the team" }).click();
    await expect(page.getByText("Thank you")).toBeVisible();
    await expect(page.getByText(/about .*noise/)).toBeVisible();
  });

  test("connect joins the room and can leave", async ({ page }) => {
    await page.goto("/connect");
    await page.getByLabel("Name or nickname").fill("E2E");
    await page.getByRole("button", { name: "chess", exact: true }).click();
    await page.getByRole("button", { name: "Join the room" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("You are in the room, E2E");
    await page.getByRole("button", { name: "Leave the room" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Meet someone");
  });
});

test.describe("staff", () => {
  test("PIN gate, seed data, advance an order, read the room", async ({ page }) => {
    await page.goto("/staff");
    await page.getByLabel("PIN").fill("0000");
    await page.getByRole("button", { name: "Open shift view" }).click();
    await expect(page.getByText("Staff PIN required")).toBeVisible();

    await page.getByLabel("PIN").fill("2468");
    await page.getByRole("button", { name: "Open shift view" }).click();
    await page.getByRole("button", { name: "Load pilot data" }).click();
    await expect(page.getByText("Live orders (3)")).toBeVisible();
    await page.getByRole("button", { name: "Start" }).first().click();
    await expect(page.getByText("preparing").first()).toBeVisible();
    await expect(page.getByText("Mood, last 3 hours")).toBeVisible();
    await expect(page.getByText("Next 15 minutes")).toBeVisible();
  });
});

test("security headers are present", async ({ request }) => {
  const res = await request.get("/");
  expect(res.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(res.headers()["x-content-type-options"]).toBe("nosniff");
  expect(res.headers()["x-powered-by"]).toBeUndefined();
});
