import { z } from "zod";
import { json, readJson, requireStaff } from "@/lib/api";
import { getStore } from "@/lib/store";
import type { OrderStatus } from "@/lib/types";
import { nowIso } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const store = await getStore();
  const order = await store.getOrder(id);
  if (!order) return json({ error: "Not found" }, { status: 404 });
  return json({ order });
}

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  received: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["collected"],
  collected: [],
  cancelled: [],
};

const Body = z.object({ status: z.enum(["received", "preparing", "ready", "collected", "cancelled"]) });

/** Staff: advance an order through its lifecycle. */
export async function PATCH(req: Request, ctx: Ctx) {
  const denied = requireStaff(req);
  if (denied) return denied;
  const { id } = await ctx.params;
  const parsed = await readJson(req, Body);
  if ("error" in parsed) return parsed.error;
  const store = await getStore();
  const order = await store.getOrder(id);
  if (!order) return json({ error: "Not found" }, { status: 404 });
  if (!NEXT[order.status].includes(parsed.data.status)) {
    return json({ error: `Cannot move ${order.status} to ${parsed.data.status}` }, { status: 409 });
  }
  const updated = await store.putOrder({ ...order, status: parsed.data.status, updatedAt: nowIso() });
  return json({ order: updated });
}
