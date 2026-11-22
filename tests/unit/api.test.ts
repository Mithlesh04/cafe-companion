import { describe, expect, it } from "vitest";
import { POST as chat } from "@/app/api/chat/route";
import { POST as connect } from "@/app/api/connect/route";
import { GET as feedbackGet, POST as feedbackPost } from "@/app/api/feedback/route";
import { GET as health } from "@/app/api/health/route";
import { GET as ordersGet, POST as ordersPost } from "@/app/api/orders/route";
import { GET as orderGet, PATCH as orderPatch } from "@/app/api/orders/[id]/route";
import { POST as seed } from "@/app/api/pilot/seed/route";
import { POST as recommend } from "@/app/api/recommend/route";
import { GET as waitsGet } from "@/app/api/waits/route";

const url = (p: string) => `http://localhost${p}`;
const post = (p: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request(url(p), { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
const staff = { "x-staff-pin": "2468" };

describe("API routes (demo mode, memory store)", () => {
  it("health reports demo mode and memory store", async () => {
    const res = await health();
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, mode: "demo", store: "memory" });
  });

  it("rejects malformed bodies with 400", async () => {
    const res = await chat(new Request(url("/api/chat"), { method: "POST", body: "nope" }));
    expect(res.status).toBe(400);
    const res2 = await chat(post("/api/chat", { message: "" }));
    expect(res2.status).toBe(400);
  });

  it("chat adds to cart and places an order end to end", async () => {
    const r1 = await chat(post("/api/chat", { message: "an oat latte please", customerName: "Dev" }));
    const b1 = await r1.json();
    expect(b1.cart).toHaveLength(1);
    const r2 = await chat(post("/api/chat", { message: "place it", cart: b1.cart, customerName: "Dev" }));
    const b2 = await r2.json();
    expect(b2.order.id).toMatch(/^ord_/);

    const r3 = await orderGet(new Request(url(`/api/orders/${b2.order.id}`)), { params: Promise.resolve({ id: b2.order.id }) });
    expect((await r3.json()).order.customerName).toBe("Dev");
  });

  it("web checkout re-prices on the server", async () => {
    const res = await ordersPost(post("/api/orders", { customerName: "Tamper", cart: [{ itemId: "espresso", name: "Free", qty: 1, unitPriceCents: 1 }] }));
    expect(res.status).toBe(201);
    const { order } = await res.json();
    expect(order.totalCents).toBe(18000);
    expect(order.lines[0].name).toBe("Espresso");
  });

  it("staff routes require the PIN and enforce the status machine", async () => {
    expect((await ordersGet(new Request(url("/api/orders")))).status).toBe(401);
    const created = await (await ordersPost(post("/api/orders", { customerName: "A", cart: [{ itemId: "espresso", name: "Espresso", qty: 1, unitPriceCents: 18000 }] }))).json();
    const id = created.order.id;
    const ctx = { params: Promise.resolve({ id }) };
    const bad = await orderPatch(new Request(url(`/api/orders/${id}`), { method: "PATCH", headers: staff, body: JSON.stringify({ status: "collected" }) }), ctx);
    expect(bad.status).toBe(409);
    const ok = await orderPatch(new Request(url(`/api/orders/${id}`), { method: "PATCH", headers: staff, body: JSON.stringify({ status: "preparing" }) }), ctx);
    expect((await ok.json()).order.status).toBe("preparing");
    const list = await (await ordersGet(new Request(url("/api/orders"), { headers: staff }))).json();
    expect(list.orders).toHaveLength(1);
  });

  it("feedback is analysed and rolled into room insights", async () => {
    await feedbackPost(post("/api/feedback", { text: "Music is way too loud today", rating: 2 }));
    await feedbackPost(post("/api/feedback", { text: "Lovely flat white, friendly staff", rating: 5 }));
    const res = await feedbackGet(new Request(url("/api/feedback?window=60"), { headers: staff }));
    const body = await res.json();
    expect(body.insights.sampleSize).toBe(2);
    expect(body.recent).toHaveLength(2);
    expect(body.insights.topTopics.map((t: { topic: string }) => t.topic)).toEqual(expect.arrayContaining(["noise", "staff"]));
  });

  it("recommend and waits respond in demo mode", async () => {
    const rec = await (await recommend(post("/api/recommend", { prefs: { dietary: ["vegan"], dislikes: [], favourites: [] }, limit: 2 }))).json();
    expect(rec.items).toHaveLength(2);
    const w = await (await waitsGet(new Request(url("/api/waits")))).json();
    expect(w.estimatedMinutes).toBeGreaterThanOrEqual(2);
  });

  it("connect returns matches against seeded people", async () => {
    expect((await seed(new Request(url("/api/pilot/seed"), { method: "POST" }))).status).toBe(401);
    await seed(new Request(url("/api/pilot/seed"), { method: "POST", headers: staff }));
    const res = await connect(post("/api/connect", { displayName: "Kai", interests: ["chess", "startups"], openTo: ["chat"] }));
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.roomCount).toBe(4);
    expect(body.matches[0].profile.displayName).toMatch(/Aarav|Dev/);
  });

  it("rate limits chatty clients", async () => {
    let last: Response | undefined;
    for (let i = 0; i < 31; i++) last = await chat(post("/api/chat", { message: "hi" }, { "x-forwarded-for": "9.9.9.9" }));
    expect(last?.status).toBe(429);
    expect(last?.headers.get("retry-after")).toBeTruthy();
  });
});
