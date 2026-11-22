"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import { usePolling } from "@/lib/client/usePolling";
import { WaitWidget } from "@/components/WaitWidget";
import { Badge, Button, Card, PageTitle } from "@/components/ui";
import { HOURLY_LOAD } from "@/lib/load";
import { api } from "@/lib/client/api";
import type { Order } from "@/lib/types";

const STATUS_TONE: Record<Order["status"], "neutral" | "good" | "warn" | "bad"> = {
  received: "neutral",
  preparing: "warn",
  ready: "good",
  collected: "good",
  cancelled: "bad",
};

function Tracker() {
  const params = useSearchParams();
  const [id, setId] = useState(params.get("order") ?? "");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (orderId: string) => {
    if (!orderId) return;
    try {
      const res = await api<{ order: Order }>(`/api/orders/${encodeURIComponent(orderId)}`);
      setOrder(res.order);
      setError(null);
    } catch (e) {
      setOrder(null);
      setError((e as Error).message);
    }
  }, []);

  usePolling(() => load(id), 10_000, Boolean(id));

  return (
    <Card>
      <h2 className="font-semibold">Track an order</h2>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void load(id);
        }}
      >
        <label className="flex-1">
          <span className="sr-only">Order id</span>
          <input value={id} onChange={(e) => setId(e.target.value.trim())} placeholder="ord_xxxxxxxx" className="w-full rounded-xl border border-espresso/15 bg-white px-3 py-2 text-sm font-mono" />
        </label>
        <Button type="submit" variant="secondary">
          Check
        </Button>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
      {order && (
        <div className="animate-rise mt-4 space-y-2 text-sm" aria-live="polite">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{order.customerName}</p>
            <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
          </div>
          <ul className="text-mocha">
            {order.lines.map((l) => (
              <li key={l.itemId + (l.notes ?? "")}>
                {l.qty} x {l.name}
              </li>
            ))}
          </ul>
          <p>
            {order.status === "ready" ? "Ready. Come and grab it." : order.status === "collected" ? "Enjoy." : `Placed with an estimate of ${order.etaMinutes} minutes.`}
          </p>
        </div>
      )}
    </Card>
  );
}

function LoadChart() {
  const hours = HOURLY_LOAD.map((v, h) => ({ h, v })).filter((x) => x.h >= 7 && x.h <= 21);
  const now = new Date().getHours();
  return (
    <Card>
      <h2 className="font-semibold">Typical busyness</h2>
      <p className="text-xs text-mocha mb-4">From this café&apos;s footfall. Shorter bar, shorter wait.</p>
      <div className="flex h-36 items-end gap-1" role="img" aria-label="Bar chart of typical busyness by hour from 7am to 9pm">
        {hours.map(({ h, v }) => (
          <div key={h} className="flex h-full flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-1 items-end">
              <div className={`w-full rounded-t-md transition ${h === now ? "bg-terracotta" : "bg-latte"}`} style={{ height: `${Math.max(6, v * 100)}%` }} title={`${h}:00`} />
            </div>
            <span className={`h-4 text-[10px] ${h === now ? "font-semibold text-terracotta" : "text-mocha"}`}>{h % 3 === 0 ? `${((h + 11) % 12) + 1}${h < 12 ? "a" : "p"}` : ""}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function WaitsPage() {
  return (
    <div>
      <PageTitle eyebrow="Better waits" title="Know before you queue" blurb="The estimate comes from the live order queue and the prep time of each item, not a guess. Gemini just puts it into words." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <WaitWidget refreshMs={15_000} />
        </Card>
        <LoadChart />
        <Suspense fallback={null}>
          <Tracker />
        </Suspense>
      </div>
    </div>
  );
}
