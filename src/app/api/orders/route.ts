import { z } from "zod";
import { CartLineSchema, json, limited, readJson, requireStaff } from "@/lib/api";
import { placeOrder } from "@/lib/ai/ordering";
import { MENU_BY_ID } from "@/lib/menu";
import { cleanText } from "@/lib/security/sanitize";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Staff: full order list. Customers use /api/orders/[id]. */
export async function GET(req: Request) {
  const denied = requireStaff(req);
  if (denied) return denied;
  const store = await getStore();
  return json({ orders: await store.listOrders(100) });
}

const Body = z.object({
  cart: z.array(CartLineSchema).min(1).max(20),
  customerName: z.string().min(1).max(40),
});

export async function POST(req: Request) {
  const block = limited(req, "orders", 20);
  if (block) return block;
  const parsed = await readJson(req, Body);
  if ("error" in parsed) return parsed.error;
  // Re-price server side so the client cannot tamper with totals.
  const cart = parsed.data.cart
    .filter((l) => MENU_BY_ID[l.itemId])
    .map((l) => ({ ...l, name: MENU_BY_ID[l.itemId].name, unitPriceCents: MENU_BY_ID[l.itemId].priceCents, notes: l.notes ? cleanText(l.notes, 60) : undefined }));
  if (cart.length === 0) return json({ error: "No valid items" }, { status: 400 });
  const store = await getStore();
  const order = await placeOrder(store, cart, cleanText(parsed.data.customerName, 40), "web");
  return json({ order }, { status: 201 });
}
