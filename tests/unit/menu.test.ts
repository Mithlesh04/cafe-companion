import { describe, expect, it } from "vitest";
import { MENU, MENU_BY_ID, findMenuItem, formatPrice, menuForPrompt } from "@/lib/menu";

describe("menu", () => {
  it("has unique ids and sane prices", () => {
    const ids = MENU.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of MENU) {
      expect(m.priceCents).toBeGreaterThan(0);
      expect(m.prepMinutes).toBeGreaterThanOrEqual(0);
      expect(m.tags.length).toBeGreaterThan(0);
    }
  });

  it("never tags an item both nut-free and contains-nuts", () => {
    for (const m of MENU) {
      expect(m.tags.includes("nut-free") && m.tags.includes("contains-nuts")).toBe(false);
      expect(m.tags.includes("dairy-free") && m.tags.includes("contains-dairy")).toBe(false);
      expect(m.tags.includes("gluten-free") && m.tags.includes("contains-gluten")).toBe(false);
    }
  });

  it("finds items by id, exact name and partial name", () => {
    expect(findMenuItem("oat-latte")?.id).toBe("oat-latte");
    expect(findMenuItem("Flat White")?.id).toBe("flat-white");
    expect(findMenuItem("brownie")?.id).toBe("gf-brownie");
    expect(findMenuItem("")).toBeUndefined();
    expect(findMenuItem("pizza")).toBeUndefined();
  });

  it("formats rupees without decimals", () => {
    expect(formatPrice(26000)).toMatch(/260/);
    expect(formatPrice(26000)).not.toMatch(/\.00/);
  });

  it("renders a prompt-friendly menu with every item", () => {
    const text = menuForPrompt();
    for (const id of Object.keys(MENU_BY_ID)) expect(text).toContain(id);
  });
});
