import { z } from "zod";
import { CartLineSchema, PrefsSchema, json, limited, readJson } from "@/lib/api";
import { chatTurn } from "@/lib/ai/ordering";
import { cleanText } from "@/lib/security/sanitize";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

const Body = z.object({
  message: z.string().min(1).max(600),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) })).max(30).default([]),
  cart: z.array(CartLineSchema).max(20).default([]),
  prefs: PrefsSchema.default({ dietary: [], dislikes: [], favourites: [] }),
  customerName: z.string().max(40).optional(),
});

export async function POST(req: Request) {
  const block = limited(req, "chat", 30);
  if (block) return block;
  const parsed = await readJson(req, Body);
  if ("error" in parsed) return parsed.error;
  const b = parsed.data;
  const store = await getStore();
  const res = await chatTurn(
    {
      message: cleanText(b.message, 600),
      history: b.history.map((m) => ({ role: m.role, content: cleanText(m.content, 2000) })),
      cart: b.cart,
      prefs: b.prefs,
      customerName: b.customerName ? cleanText(b.customerName, 40) : undefined,
    },
    store,
  );
  return json(res);
}
