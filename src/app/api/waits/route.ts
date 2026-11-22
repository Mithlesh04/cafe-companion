import { z } from "zod";
import { CartLineSchema, json, limited, readJson } from "@/lib/api";
import { predictWait } from "@/lib/ai/waits";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const block = limited(req, "waits");
  if (block) return block;
  const store = await getStore();
  const orders = await store.listOrders(200);
  return json(await predictWait(orders));
}

const Body = z.object({ cart: z.array(CartLineSchema).max(20).default([]) });

export async function POST(req: Request) {
  const block = limited(req, "waits");
  if (block) return block;
  const parsed = await readJson(req, Body);
  if ("error" in parsed) return parsed.error;
  const store = await getStore();
  const orders = await store.listOrders(200);
  return json(await predictWait(orders, { lines: parsed.data.cart }));
}
