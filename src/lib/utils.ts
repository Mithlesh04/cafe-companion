import { randomUUID } from "node:crypto";

export const nowIso = () => new Date().toISOString();
export const newId = (prefix: string) => `${prefix}_${randomUUID().slice(0, 8)}`;

export type DayPart = "morning" | "afternoon" | "evening";

export function dayPart(date = new Date()): DayPart {
  const h = date.getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

/** Parse JSON from a model reply, tolerating code fences and surrounding prose. */
export function parseModelJson<T>(text: string): T | undefined {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}

export function uniq<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}
