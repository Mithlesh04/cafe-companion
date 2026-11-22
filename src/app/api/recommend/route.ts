import { z } from "zod";
import { PrefsSchema, json, limited, readJson } from "@/lib/api";
import { recommend } from "@/lib/ai/recommend";
import { cleanText } from "@/lib/security/sanitize";

export const dynamic = "force-dynamic";

const Body = z.object({
  prefs: PrefsSchema.default({ dietary: [], dislikes: [], favourites: [] }),
  context: z.string().max(200).optional(),
  limit: z.number().int().min(1).max(8).optional(),
});

export async function POST(req: Request) {
  const block = limited(req, "recommend");
  if (block) return block;
  const parsed = await readJson(req, Body);
  if ("error" in parsed) return parsed.error;
  const { prefs, context, limit } = parsed.data;
  const res = await recommend(prefs, { limit, context: context ? cleanText(context, 200) : undefined });
  return json(res);
}
