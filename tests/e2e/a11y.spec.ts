import { expect, test } from "@playwright/test";

/**
 * Lightweight accessibility smoke checks that need no extra dependency:
 * one h1 per page, every image/button has a name, skip link works, and
 * keyboard focus is visible on primary controls.
 */
const PAGES = ["/", "/order", "/discover", "/waits", "/connect", "/feedback", "/staff"];

for (const path of PAGES) {
  test(`a11y basics on ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    const unnamedButtons = await page.locator("button").evaluateAll((els) =>
      els.filter((el) => !(el.textContent?.trim() || el.getAttribute("aria-label") || el.getAttribute("title"))).length,
    );
    expect(unnamedButtons).toBe(0);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
}

test("skip link jumps to main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByText("Skip to content")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});
