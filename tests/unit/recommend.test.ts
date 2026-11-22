import { describe, expect, it } from "vitest";
import { EMPTY_PREFS, passesDietary, recommend, recommendDemo } from "@/lib/ai/recommend";
import { MENU_BY_ID } from "@/lib/menu";

describe("recommendations (demo scorer)", () => {
  it("never suggests nuts to a nut-free customer", () => {
    const recs = recommendDemo({ ...EMPTY_PREFS, dietary: ["nut-free"] }, "afternoon", 20);
    expect(recs.length).toBeGreaterThan(0);
    for (const r of recs) expect(r.item.tags).not.toContain("contains-nuts");
  });

  it("vegan plus gluten-free still finds something", () => {
    const recs = recommendDemo({ ...EMPTY_PREFS, dietary: ["vegan", "gluten-free"] }, "morning", 10);
    expect(recs.length).toBeGreaterThan(0);
    for (const r of recs) {
      expect(r.item.tags).toContain("vegan");
      expect(r.item.tags).toContain("gluten-free");
    }
  });

  it("respects caffeine none", () => {
    const recs = recommendDemo({ ...EMPTY_PREFS, caffeine: "none" }, "evening", 10);
    for (const r of recs) expect(r.item.caffeineMg).toBeLessThanOrEqual(5);
  });

  it("respects budget and dislikes", () => {
    const recs = recommendDemo({ ...EMPTY_PREFS, budgetCents: 16000, dislikes: ["chai"] }, "afternoon", 10);
    for (const r of recs) {
      expect(r.item.priceCents).toBeLessThanOrEqual(16000);
      expect(r.item.name.toLowerCase()).not.toContain("chai");
    }
  });

  it("boosts favourites to the top", () => {
    const recs = recommendDemo({ ...EMPTY_PREFS, favourites: ["matcha"] }, "afternoon", 3);
    expect(recs[0].item.id).toBe("matcha-latte");
    expect(recs[0].reason).toMatch(/favourite/i);
  });

  it("passesDietary handles vegetarian including vegan items", () => {
    expect(passesDietary(MENU_BY_ID["avocado-toast"], { ...EMPTY_PREFS, dietary: ["vegetarian"] })).toBe(true);
    expect(passesDietary(MENU_BY_ID["almond-croissant"], { ...EMPTY_PREFS, dietary: ["nut-free"] })).toBe(false);
  });

  it("recommend() falls back to demo mode without a key", async () => {
    const res = await recommend(EMPTY_PREFS, { limit: 3 });
    expect(res.mode).toBe("demo");
    expect(res.items).toHaveLength(3);
  });
});
