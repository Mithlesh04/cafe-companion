import { z } from "zod";
import { json, limited, readJson, requireStaff } from "@/lib/api";
import { analyzeFeedback, roomInsights } from "@/lib/ai/sentiment";
import { cleanText } from "@/lib/security/sanitize";
import { getStore } from "@/lib/store";
import type { Feedback } from "@/lib/types";
import { newId, nowIso } from "@/lib/utils";

export const dynamic = "force-dynamic";

const Body = z.object({
  text: z.string().min(2).max(500),
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
});

/** Customers: leave a quick note. Stored without any identity. */
export async function POST(req: Request) {
  const block = limited(req, "feedback", 10);
  if (block) return block;
  const parsed = await readJson(req, Body);
  if ("error" in parsed) return parsed.error;
  const text = cleanText(parsed.data.text, 500);
  const analysis = await analyzeFeedback(text, parsed.data.rating);
  const fb: Feedback = {
    id: newId("fb"),
    createdAt: nowIso(),
    text,
    rating: parsed.data.rating,
    sentiment: analysis.sentiment,
    score: analysis.score,
    topics: analysis.topics,
    urgent: analysis.urgent,
  };
  const store = await getStore();
  await store.putFeedback(fb);
  return json({ feedback: fb, mode: analysis.mode }, { status: 201 });
}

/** Staff: room insights plus the recent raw notes. */
export async function GET(req: Request) {
  const denied = requireStaff(req);
  if (denied) return denied;
  const store = await getStore();
  const all = await store.listFeedback(200);
  const url = new URL(req.url);
  const windowMinutes = Math.min(24 * 60, Math.max(15, Number(url.searchParams.get("window")) || 180));
  const insights = await roomInsights(all, { windowMinutes });
  return json({ insights, recent: all.slice(0, 30) });
}
