"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PrefsEditor } from "@/components/PrefsEditor";
import { Badge, Button, Card, Empty, ModeBadge, PageTitle, Spinner } from "@/components/ui";
import { post } from "@/lib/client/api";
import { useLocalState } from "@/lib/client/useLocalState";
import { formatPrice } from "@/lib/menu";
import type { CartLine, Preferences, Recommendation } from "@/lib/types";

const EMPTY: Preferences = { dietary: [], dislikes: [], favourites: [] };

export default function DiscoverPage() {
  const [prefs, setPrefs, ready] = useLocalState<Preferences>("cc.prefs", EMPTY);
  const [, setCart] = useLocalState<CartLine[]>("cc.cart", []);
  const [context, setContext] = useState("");
  const [data, setData] = useState<{ items: Recommendation[]; mode: "gemini" | "demo" } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      setData(await post("/api/recommend", { prefs, context: context || undefined, limit: 6 }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [prefs, context]);

  // First load once hydrated (prefs are read from localStorage). Later loads are explicit.
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  }, [load]);
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => void loadRef.current(), 0);
    return () => clearTimeout(t);
  }, [ready]);

  const add = (r: Recommendation) => {
    setCart((c) => {
      const ex = c.find((l) => l.itemId === r.item.id && !l.notes);
      if (ex) return c.map((l) => (l === ex ? { ...l, qty: Math.min(10, l.qty + 1) } : l));
      return [...c, { itemId: r.item.id, name: r.item.name, qty: 1, unitPriceCents: r.item.priceCents }];
    });
    setAdded(r.item.id);
    setTimeout(() => setAdded(null), 1200);
  };

  return (
    <div>
      <PageTitle eyebrow="Discovery" title="Picks for right now" blurb="Hard limits like allergies are enforced in code. Gemini only chooses from what is safe for you." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <h2 className="font-semibold mb-3">About you</h2>
          <PrefsEditor value={prefs} onChange={setPrefs} />
          <label className="mt-4 block text-sm">
            <span className="block text-xs font-semibold uppercase tracking-wide text-mocha mb-1">Anything else?</span>
            <input value={context} onChange={(e) => setContext(e.target.value.slice(0, 200))} placeholder="e.g. it is raining and I skipped lunch" className="w-full rounded-xl border border-espresso/15 bg-white px-3 py-2" />
          </label>
          <Button className="mt-4" onClick={load} disabled={busy}>
            {busy ? "Thinking" : "Refresh picks"}
          </Button>
        </Card>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Recommended</h2>
            <ModeBadge mode={data?.mode} />
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger mb-3">
              {error}
            </p>
          )}
          {busy && !data ? (
            <Spinner label="Finding your picks" />
          ) : data && data.items.length === 0 ? (
            <Empty>Nothing on the menu fits all of those limits. Loosen one and try again.</Empty>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {data?.items.map((r) => (
                <li key={r.item.id} className="card rise p-4 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{r.item.name}</p>
                      <p className="text-xs text-mocha">{r.item.description}</p>
                    </div>
                    <span className="font-medium tabular-nums">{formatPrice(r.item.priceCents)}</span>
                  </div>
                  <p className="mt-2 text-sm text-espresso-2">{r.reason}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {r.item.tags.filter((t) => !t.startsWith("contains")).map((t) => (
                      <Badge key={t}>{t}</Badge>
                    ))}
                    {r.item.caffeineMg === 0 && <Badge tone="good">no caffeine</Badge>}
                  </div>
                  <Button variant="secondary" className="mt-auto self-start mt-3" onClick={() => add(r)}>
                    <Plus size={14} aria-hidden /> {added === r.item.id ? "Added" : "Add to cart"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
