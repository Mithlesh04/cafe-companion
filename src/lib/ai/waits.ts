import { Type } from "@google/genai";
import { hasGemini } from "../env";
import { generateJson } from "../gemini";
import { HOURLY_LOAD } from "../load";
import { MENU_BY_ID } from "../menu";
import type { AiMode, CartLine, Order, WaitPrediction } from "../types";
import { clamp, parseModelJson } from "../utils";

/** Parallel prep capacity. A small café usually runs two people on bar/kitchen. */
export const STATIONS = 2;
/** Fixed overhead per order: payment, handoff, calling the name. */
const BASE_MINUTES = 2;

export { HOURLY_LOAD };

export function prepMinutesForLines(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + (MENU_BY_ID[l.itemId]?.prepMinutes ?? 3) * l.qty, 0);
}

export function isActive(o: Order) {
  return o.status === "received" || o.status === "preparing";
}

/**
 * Deterministic queue model. Work remaining in the queue is spread across the
 * stations, then the new order's own prep time is added. Anchored, explainable,
 * and the thing Gemini narrates rather than invents.
 */
export function estimateMinutes(orders: Order[], newLines: CartLine[] = []): number {
  const queued = orders.filter(isActive).reduce((sum, o) => sum + prepMinutesForLines(o.lines), 0);
  const own = newLines.length ? prepMinutesForLines(newLines) : 3;
  return clamp(Math.round(BASE_MINUTES + queued / STATIONS + own), 2, 45);
}

export function bestTimeToVisit(now = new Date()): string {
  const h = now.getHours();
  const horizon = Array.from({ length: 6 }, (_, i) => (h + i) % 24).filter((x) => x >= 7 && x <= 21);
  if (horizon.length === 0) return "We open at 7am. Early mornings are the calmest.";
  const best = horizon.reduce((a, b) => (HOURLY_LOAD[b] < HOURLY_LOAD[a] ? b : a));
  if (best === h) return "Right now is a good time.";
  const label = `${((best + 11) % 12) + 1}${best < 12 ? "am" : "pm"}`;
  return `Around ${label} looks quieter.`;
}

function confidence(activeCount: number): WaitPrediction["confidence"] {
  if (activeCount === 0) return "high";
  if (activeCount < 6) return "medium";
  return "low";
}

function demoExplanation(p: Omit<WaitPrediction, "explanation" | "mode">, now: Date): string {
  const load = HOURLY_LOAD[now.getHours()];
  const busy = load > 0.7 ? "a peak hour" : load > 0.4 ? "a steady hour" : "a quiet hour";
  if (p.activeOrders === 0) return `No orders ahead of you and it is ${busy}, so expect about ${p.estimatedMinutes} minutes.`;
  return `${p.activeOrders} order${p.activeOrders === 1 ? "" : "s"} ahead during ${busy}. With ${STATIONS} stations working, roughly ${p.estimatedMinutes} minutes.`;
}

export async function predictWait(
  orders: Order[],
  opts: { lines?: CartLine[]; now?: Date } = {},
): Promise<WaitPrediction> {
  const now = opts.now ?? new Date();
  const active = orders.filter(isActive);
  const base = {
    queueLength: active.filter((o) => o.status === "received").length,
    activeOrders: active.length,
    estimatedMinutes: estimateMinutes(active, opts.lines),
    confidence: confidence(active.length),
    bestTimeToVisit: bestTimeToVisit(now),
  };
  const demo: WaitPrediction = { ...base, explanation: demoExplanation(base, now), mode: "demo" };
  if (!hasGemini()) return demo;

  try {
    const raw = await generateJson({
      system: "You explain café wait times to customers in one friendly, honest sentence. Use only the numbers given. No emojis.",
      prompt: `Numbers: ${JSON.stringify({ ...base, hour: now.getHours(), stations: STATIONS })}. Write the explanation.`,
      schema: { type: Type.OBJECT, properties: { explanation: { type: Type.STRING } }, required: ["explanation"] },
      temperature: 0.6,
    });
    const parsed = parseModelJson<{ explanation: string }>(raw);
    if (!parsed?.explanation) return demo;
    return { ...base, explanation: parsed.explanation.slice(0, 240), mode: "gemini" as AiMode };
  } catch (err) {
    console.warn("[waits] Gemini failed, using demo explanation:", (err as Error).message);
    return demo;
  }
}
