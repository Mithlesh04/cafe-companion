import { Type } from "@google/genai";
import { hasGemini } from "../env";
import { generateJson } from "../gemini";
import { MENU, MENU_BY_ID, formatPrice } from "../menu";
import type { AiMode, MenuItem, Preferences, Recommendation } from "../types";
import { dayPart, parseModelJson, type DayPart } from "../utils";

export const EMPTY_PREFS: Preferences = { dietary: [], dislikes: [], favourites: [] };

/** Hard constraints: never recommend something a customer cannot eat. */
export function passesDietary(item: MenuItem, prefs: Preferences): boolean {
  const d = new Set(prefs.dietary);
  if (d.has("vegan") && !item.tags.includes("vegan")) return false;
  if (d.has("vegetarian") && !(item.tags.includes("vegetarian") || item.tags.includes("vegan"))) return false;
  if (d.has("gluten-free") && !item.tags.includes("gluten-free")) return false;
  if (d.has("dairy-free") && item.tags.includes("contains-dairy")) return false;
  if (d.has("nut-free") && item.tags.includes("contains-nuts")) return false;
  if (prefs.caffeine === "none" && item.caffeineMg > 5) return false;
  if (prefs.caffeine === "low" && item.caffeineMg > 70) return false;
  if (prefs.budgetCents && item.priceCents > prefs.budgetCents) return false;
  const name = item.name.toLowerCase();
  if (prefs.dislikes.some((x) => x && name.includes(x.toLowerCase()))) return false;
  return true;
}

/** Deterministic scorer, also used as the Gemini fallback. */
export function scoreItem(item: MenuItem, prefs: Preferences, part: DayPart): number {
  let s = 0;
  if (item.popular) s += 1;
  if (item.bestFor.includes(part)) s += 2;
  if (prefs.mood && item.bestFor.includes(prefs.mood)) s += 2;
  if (prefs.favourites.some((f) => item.name.toLowerCase().includes(f.toLowerCase()))) s += 3;
  if (prefs.milk === "oat" && item.id === "oat-latte") s += 2;
  if (prefs.caffeine === "low" && item.caffeineMg > 0 && item.caffeineMg <= 70) s += 1;
  return s;
}

function demoReason(item: MenuItem, prefs: Preferences, part: DayPart): string {
  const bits: string[] = [];
  if (prefs.favourites.some((f) => item.name.toLowerCase().includes(f.toLowerCase()))) bits.push("one of your favourites");
  if (item.bestFor.includes(part)) bits.push(`a ${part} classic here`);
  if (prefs.dietary.includes("vegan") && item.tags.includes("vegan")) bits.push("fully vegan");
  if (prefs.dietary.includes("gluten-free") && item.tags.includes("gluten-free")) bits.push("gluten-free");
  if (prefs.caffeine === "none" && item.caffeineMg === 0) bits.push("caffeine-free");
  if (item.popular) bits.push("a crowd favourite");
  if (bits.length === 0) bits.push(item.description.toLowerCase().replace(/\.$/, ""));
  return bits.slice(0, 2).join(", ").replace(/^./, (c) => c.toUpperCase()) + ".";
}

export function recommendDemo(prefs: Preferences, part: DayPart, limit = 4): Recommendation[] {
  return MENU.filter((m) => passesDietary(m, prefs))
    .map((item) => ({ item, score: scoreItem(item, prefs, part), reason: demoReason(item, prefs, part) }))
    .sort((a, b) => b.score - a.score || a.item.priceCents - b.item.priceCents)
    .slice(0, limit);
}

const SYSTEM = `You are the Café Companion, a warm, concise barista at an independent café in India.
Pick the best items for this customer from the CANDIDATES list only. Never invent items.
Each reason must be one short sentence, specific to the customer and the time of day, no emojis.`;

export async function recommend(
  prefs: Preferences,
  opts: { limit?: number; now?: Date; context?: string } = {},
): Promise<{ items: Recommendation[]; mode: AiMode }> {
  const limit = opts.limit ?? 4;
  const part = dayPart(opts.now);
  const candidates = MENU.filter((m) => passesDietary(m, prefs));
  const fallback = () => ({ items: recommendDemo(prefs, part, limit), mode: "demo" as const });

  if (!hasGemini() || candidates.length === 0) return fallback();

  try {
    const prompt = [
      `Time of day: ${part}.`,
      `Customer preferences: ${JSON.stringify(prefs)}.`,
      opts.context ? `Extra context: ${opts.context}` : "",
      `CANDIDATES:`,
      ...candidates.map((m) => `- ${m.id} | ${m.name} | ${formatPrice(m.priceCents)} | ${m.description} | best for ${m.bestFor.join("/")}`),
      `Return the top ${limit} as JSON.`,
    ].join("\n");

    const raw = await generateJson({
      system: SYSTEM,
      prompt,
      schema: {
        type: Type.OBJECT,
        properties: {
          picks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { id: { type: Type.STRING }, reason: { type: Type.STRING } },
              required: ["id", "reason"],
            },
          },
        },
        required: ["picks"],
      },
    });
    const parsed = parseModelJson<{ picks: Array<{ id: string; reason: string }> }>(raw);
    const items: Recommendation[] = [];
    for (const p of parsed?.picks ?? []) {
      const item = MENU_BY_ID[p.id];
      if (item && passesDietary(item, prefs) && !items.some((x) => x.item.id === item.id)) {
        items.push({ item, reason: p.reason.slice(0, 160), score: scoreItem(item, prefs, part) });
      }
      if (items.length >= limit) break;
    }
    if (items.length === 0) return fallback();
    return { items, mode: "gemini" };
  } catch (err) {
    console.warn("[recommend] Gemini failed, using demo scorer:", (err as Error).message);
    return fallback();
  }
}
