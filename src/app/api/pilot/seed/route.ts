import { json, requireStaff } from "@/lib/api";
import { analyzeDemo } from "@/lib/ai/sentiment";
import { placeOrder } from "@/lib/ai/ordering";
import { getStore } from "@/lib/store";
import type { ConnectProfile, Feedback } from "@/lib/types";
import { newId, nowIso } from "@/lib/utils";

export const dynamic = "force-dynamic";

const NOTES: Array<[string, 1 | 2 | 3 | 4 | 5]> = [
  ["Oat latte was perfect, barista was lovely", 5],
  ["Waited 15 minutes for a cold brew, a bit slow today", 2],
  ["Music is way too loud to work", 2],
  ["Avocado toast is the best in town", 5],
  ["Wifi keeps dropping near the window", 3],
  ["Cosy and warm, great place to unwind", 5],
  ["My cappuccino was lukewarm", 2],
  ["Tables near the door were sticky", 2],
];

const PEOPLE: Array<Omit<ConnectProfile, "id" | "createdAt" | "expiresAt">> = [
  { displayName: "Aarav", interests: ["startups", "chess", "cycling"], openTo: ["chat", "cowork"], blurb: "Building a fintech MVP" },
  { displayName: "Meera", interests: ["photography", "hindi", "travel"], openTo: ["language-exchange", "coffee-buddy"] },
  { displayName: "Dev", interests: ["machine learning", "chess", "running"], openTo: ["cowork", "chat"], blurb: "Prepping for a hackathon" },
  { displayName: "Sana", interests: ["books", "travel", "design"], openTo: ["chat"], blurb: "Reading Murakami today" },
];

/** Staff/pilot helper: fill the store with realistic data for a demo or a test session. */
export async function POST(req: Request) {
  const denied = requireStaff(req);
  if (denied) return denied;
  const store = await getStore();
  await store.clear();

  const orders = [
    [{ itemId: "flat-white", name: "Flat White", qty: 1, unitPriceCents: 26000 }],
    [{ itemId: "avocado-toast", name: "Avocado Toast", qty: 1, unitPriceCents: 32000 }, { itemId: "cold-brew", name: "Cold Brew", qty: 2, unitPriceCents: 28000 }],
    [{ itemId: "masala-chai", name: "Masala Chai", qty: 2, unitPriceCents: 14000 }],
  ];
  const names = ["Priya", "Rohan", "Lee"];
  for (let i = 0; i < orders.length; i++) await placeOrder(store, orders[i], names[i], "web");

  const now = Date.now();
  for (let i = 0; i < NOTES.length; i++) {
    const [text, rating] = NOTES[i];
    const a = analyzeDemo(text, rating);
    const fb: Feedback = { id: newId("fb"), createdAt: new Date(now - i * 9 * 60_000).toISOString(), text, rating, ...a };
    await store.putFeedback(fb);
  }
  for (const p of PEOPLE) {
    await store.putProfile({ ...p, id: newId("ppl"), createdAt: nowIso(), expiresAt: new Date(now + 2 * 3600_000).toISOString() });
  }
  return json({ ok: true, orders: orders.length, feedback: NOTES.length, profiles: PEOPLE.length });
}
