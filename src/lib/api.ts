import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "./env";
import { clientKey, rateLimit } from "./security/rateLimit";
import { safeEqual } from "./security/sanitize";

export const PrefsSchema = z.object({
  dietary: z.array(z.enum(["vegan", "vegetarian", "gluten-free", "dairy-free", "nut-free"])).max(5).default([]),
  dislikes: z.array(z.string().max(30)).max(10).default([]),
  favourites: z.array(z.string().max(30)).max(10).default([]),
  milk: z.enum(["dairy", "oat", "almond", "soy", "none"]).optional(),
  caffeine: z.enum(["any", "low", "none"]).optional(),
  budgetCents: z.number().int().positive().max(1_000_000).optional(),
  mood: z.enum(["morning", "afternoon", "evening", "work", "meeting", "unwind"]).optional(),
});

export const CartLineSchema = z.object({
  itemId: z.string().max(40),
  name: z.string().max(60),
  qty: z.number().int().min(1).max(10),
  notes: z.string().max(60).optional(),
  unitPriceCents: z.number().int().nonnegative(),
});

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function badRequest(message: string, issues?: unknown) {
  return NextResponse.json({ error: message, issues }, { status: 400 });
}

/** Apply the per-IP rate limit for a route scope. Returns a response when blocked. */
export function limited(req: Request, scope: string, perMinute = env().RATE_LIMIT_PER_MINUTE) {
  const r = rateLimit(clientKey(req.headers, scope), perMinute);
  if (r.ok) return undefined;
  return NextResponse.json(
    { error: "Too many requests. Please slow down." },
    { status: 429, headers: { "Retry-After": String(r.retryAfterSeconds) } },
  );
}

/** Staff-only routes send the PIN in a header; compared in constant time. */
export function requireStaff(req: Request) {
  const pin = req.headers.get("x-staff-pin") ?? "";
  if (!safeEqual(pin, env().STAFF_PIN)) {
    return NextResponse.json({ error: "Staff PIN required" }, { status: 401 });
  }
  return undefined;
}

export async function readJson<T>(req: Request, schema: z.ZodType<T>): Promise<{ data: T } | { error: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { error: badRequest("Body must be JSON") };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return { error: badRequest("Invalid request", parsed.error.flatten()) };
  return { data: parsed.data };
}
