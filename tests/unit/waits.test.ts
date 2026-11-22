import { describe, expect, it } from "vitest";
import { bestTimeToVisit, estimateMinutes, predictWait, prepMinutesForLines } from "@/lib/ai/waits";
import type { Order } from "@/lib/types";

const order = (status: Order["status"], lines: Order["lines"]): Order => ({
  id: "ord_test",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  customerName: "T",
  lines,
  totalCents: 0,
  status,
  etaMinutes: 0,
  channel: "web",
});

const latte = { itemId: "flat-white", name: "Flat White", qty: 1, unitPriceCents: 26000 };
const toast = { itemId: "avocado-toast", name: "Avocado Toast", qty: 1, unitPriceCents: 32000 };

describe("wait prediction", () => {
  it("sums prep minutes by quantity", () => {
    expect(prepMinutesForLines([{ ...latte, qty: 2 }])).toBe(8);
    expect(prepMinutesForLines([{ ...latte, itemId: "unknown" }])).toBe(3);
  });

  it("empty queue gives the floor estimate", () => {
    expect(estimateMinutes([], [latte])).toBe(2 + 4);
  });

  it("grows with queue depth and ignores finished orders", () => {
    const active = [order("received", [toast]), order("preparing", [toast, latte])];
    const done = [order("collected", [toast]), order("cancelled", [toast])];
    const quiet = estimateMinutes([], [latte]);
    const busy = estimateMinutes([...active, ...done], [latte]);
    expect(busy).toBeGreaterThan(quiet);
    expect(busy).toBe(estimateMinutes(active, [latte]));
  });

  it("caps at 45 minutes", () => {
    const flood = Array.from({ length: 40 }, () => order("received", [toast, toast]));
    expect(estimateMinutes(flood, [latte])).toBe(45);
  });

  it("suggests a quieter time within the next hours", () => {
    const peak = new Date();
    peak.setHours(13, 0, 0, 0);
    expect(bestTimeToVisit(peak)).toMatch(/Around \d+(am|pm) looks quieter/);
    const night = new Date();
    night.setHours(23, 0, 0, 0);
    expect(bestTimeToVisit(night)).toMatch(/open at 7am/);
  });

  it("predictWait returns a demo explanation without a key", async () => {
    const p = await predictWait([order("received", [latte])], { lines: [toast] });
    expect(p.mode).toBe("demo");
    expect(p.activeOrders).toBe(1);
    expect(p.explanation).toContain("1 order ahead");
    expect(["low", "medium", "high"]).toContain(p.confidence);
  });
});
