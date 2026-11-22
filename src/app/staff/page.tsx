"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useCallback, useState } from "react";
import { usePolling } from "@/lib/client/usePolling";
import { useStoredState } from "@/lib/client/useLocalState";
import { Badge, Button, Card, Empty, ModeBadge, PageTitle, Spinner } from "@/components/ui";
import { api, post } from "@/lib/client/api";
import { formatPrice } from "@/lib/menu";
import type { Feedback, Order, OrderStatus, RoomInsights } from "@/lib/types";

const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  received: { to: "preparing", label: "Start" },
  preparing: { to: "ready", label: "Ready" },
  ready: { to: "collected", label: "Collected" },
};

export default function StaffPage() {
  const [pin, savePin] = useStoredState<string>("cc.pin", "", "session");
  const [draft, setDraft] = useState("");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [room, setRoom] = useState<{ insights: RoomInsights; recent: Feedback[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!pin) return;
    try {
      const [o, r] = await Promise.all([
        api<{ orders: Order[] }>("/api/orders", { staffPin: pin }),
        api<{ insights: RoomInsights; recent: Feedback[] }>("/api/feedback", { staffPin: pin }),
      ]);
      setOrders(o.orders);
      setRoom(r);
      setError(null);
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      if (/PIN/i.test(msg)) savePin("");
    }
  }, [pin, savePin]);

  usePolling(load, 15_000, Boolean(pin));

  const advance = async (o: Order) => {
    const n = NEXT[o.status];
    if (!n) return;
    await api(`/api/orders/${o.id}`, { method: "PATCH", body: JSON.stringify({ status: n.to }), staffPin: pin });
    void load();
  };

  const seed = async () => {
    setBusy(true);
    try {
      await post("/api/pilot/seed", {}, pin);
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!pin) {
    return (
      <div>
        <PageTitle eyebrow="Staff" title="Shift view" blurb="Enter the staff PIN to see live orders and the room read." />
        <Card className="max-w-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              savePin(draft);
            }}
            className="space-y-3"
          >
            <label className="block text-sm">
              <span className="block text-xs font-semibold uppercase tracking-wide text-mocha mb-1">PIN</span>
              <input type="password" inputMode="numeric" autoComplete="off" value={draft} onChange={(e) => setDraft(e.target.value)} className="w-full rounded-xl border border-espresso/15 bg-white px-3 py-2 font-mono" />
            </label>
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
            <Button type="submit" disabled={draft.length < 4}>
              Open shift view
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  const active = (orders ?? []).filter((o) => o.status === "received" || o.status === "preparing" || o.status === "ready");
  const ins = room?.insights;
  const moodTone = ins ? ({ great: "good", good: "good", mixed: "warn", tense: "bad" } as const)[ins.moodLabel] : "neutral";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageTitle eyebrow="Staff" title="Shift view" />
        <div className="flex gap-2 pb-6">
          <Button variant="secondary" onClick={load}>
            <RefreshCw size={14} aria-hidden /> Refresh
          </Button>
          <Button variant="ghost" onClick={seed} disabled={busy}>
            {busy ? "Seeding" : "Load pilot data"}
          </Button>
          <Button variant="ghost" onClick={() => savePin("")}>
            Lock
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mb-4 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section aria-labelledby="orders-h">
          <h2 id="orders-h" className="font-semibold mb-3">
            Live orders <span className="text-mocha font-normal">({active.length})</span>
          </h2>
          {!orders ? (
            <Spinner />
          ) : active.length === 0 ? (
            <Empty>Queue is clear. Use &quot;Load pilot data&quot; to simulate a rush.</Empty>
          ) : (
            <ul className="space-y-3">
              {active.map((o) => (
                <li key={o.id} className="card p-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{o.customerName}</p>
                      <Badge tone={o.status === "ready" ? "good" : o.status === "preparing" ? "warn" : "neutral"}>{o.status}</Badge>
                      <span className="text-xs text-mocha font-mono">{o.id}</span>
                    </div>
                    <p className="text-sm text-espresso-2 mt-1">
                      {o.lines.map((l) => `${l.qty} x ${l.name}${l.notes ? ` (${l.notes})` : ""}`).join(", ")}
                    </p>
                    <p className="text-xs text-mocha mt-1">
                      {formatPrice(o.totalCents)} · promised {o.etaMinutes} min · {new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {NEXT[o.status] && <Button onClick={() => advance(o)}>{NEXT[o.status]!.label}</Button>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="room-h" className="space-y-4">
          <h2 id="room-h" className="font-semibold">
            The room
          </h2>
          {!ins ? (
            <Spinner />
          ) : (
            <>
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-mocha">Mood, last 3 hours</p>
                    <p className="text-3xl font-semibold capitalize">{ins.moodLabel}</p>
                  </div>
                  <div className="text-right">
                    <Badge tone={moodTone}>{ins.moodScore > 0 ? "+" : ""}{ins.moodScore}</Badge>
                    <p className="text-xs text-mocha mt-1">{ins.sampleSize} notes</p>
                  </div>
                </div>
                {ins.urgentCount > 0 && (
                  <p className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
                    <AlertTriangle size={16} aria-hidden /> {ins.urgentCount} note{ins.urgentCount > 1 ? "s" : ""} need a person now
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {ins.topTopics.map((t) => (
                    <Badge key={t.topic} tone={t.sentiment > 0.15 ? "good" : t.sentiment < -0.15 ? "bad" : "neutral"}>
                      {t.topic} · {t.count}
                    </Badge>
                  ))}
                </div>
              </Card>
              <Card>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Next 15 minutes</h3>
                  <ModeBadge mode={ins.mode} />
                </div>
                <ol className="list-decimal space-y-1.5 pl-5 text-sm text-espresso-2">
                  {ins.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              </Card>
              <Card>
                <h3 className="font-semibold mb-2">Recent notes</h3>
                {room!.recent.length === 0 ? (
                  <p className="text-sm text-mocha">No notes yet.</p>
                ) : (
                  <ul className="space-y-2 text-sm max-h-72 overflow-y-auto pr-1">
                    {room!.recent.map((f) => (
                      <li key={f.id} className="flex gap-2">
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${f.sentiment === "positive" ? "bg-sage" : f.sentiment === "negative" ? "bg-danger" : "bg-latte"}`} aria-hidden />
                        <span>
                          {f.text}
                          {f.urgent && (
                            <>
                              {" "}
                              <Badge tone="bad">urgent</Badge>
                            </>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
