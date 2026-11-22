"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CartPanel } from "@/components/CartPanel";
import { Chat } from "@/components/Chat";
import { PrefsEditor } from "@/components/PrefsEditor";
import { Button, Card, PageTitle } from "@/components/ui";
import { post } from "@/lib/client/api";
import { useLocalState } from "@/lib/client/useLocalState";
import { formatPrice } from "@/lib/menu";
import type { CartLine, Order, Preferences } from "@/lib/types";

const EMPTY: Preferences = { dietary: [], dislikes: [], favourites: [] };

export default function OrderPage() {
  const [prefs, setPrefs] = useLocalState<Preferences>("cc.prefs", EMPTY);
  const [name, setName] = useLocalState<string>("cc.name", "");
  const [cart, setCart] = useLocalState<CartLine[]>("cc.cart", []);
  const [order, setOrder] = useState<Order | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placed = (o: Order) => {
    setOrder(o);
    setCart([]);
  };

  const checkout = async () => {
    if (!cart.length) return;
    setPlacing(true);
    setError(null);
    try {
      const res = await post<{ order: Order }>("/api/orders", { cart, customerName: name || "Guest" });
      placed(res.order);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div>
      <PageTitle eyebrow="Smarter ordering" title="Just say what you want" blurb="Chat or speak. The Companion handles the menu, your preferences, and tells you the wait before you commit." />
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <Chat cart={cart} prefs={prefs} customerName={name} onCart={setCart} onOrder={placed} />
        </Card>

        <div className="space-y-6">
          {order && (
            <Card className="rise border-sage/40 bg-sage-2/60">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-sage shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold">Order {order.id} placed for {order.customerName}</p>
                  <p className="text-espresso-2">
                    {formatPrice(order.totalCents)} · ready in about {order.etaMinutes} min
                  </p>
                  <Link href={`/waits?order=${order.id}`} className="mt-2 inline-block underline">
                    Track it live
                  </Link>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Your cart</h2>
              <label className="text-xs text-mocha">
                Name{" "}
                <input value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} placeholder="for the cup" className="ml-1 w-28 rounded-lg border border-espresso/15 bg-white px-2 py-1 text-sm text-espresso" />
              </label>
            </div>
            <div className="mt-3">
              <CartPanel cart={cart} onChange={setCart} />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={checkout} disabled={!cart.length || placing}>
                {placing ? "Placing" : "Place order"}
              </Button>
              {cart.length > 0 && (
                <Button variant="ghost" onClick={() => setCart([])}>
                  Clear
                </Button>
              )}
            </div>
            {error && (
              <p role="alert" className="mt-2 text-sm text-danger">
                {error}
              </p>
            )}
          </Card>

          <Card>
            <h2 className="font-semibold mb-3">Preferences</h2>
            <PrefsEditor value={prefs} onChange={setPrefs} compact />
            <p className="mt-3 text-xs text-mocha">Saved on this device only. The Companion respects these in every suggestion.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
