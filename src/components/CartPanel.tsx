"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/menu";
import type { CartLine } from "@/lib/types";

export function CartPanel({ cart, onChange }: { cart: CartLine[]; onChange?: (c: CartLine[]) => void }) {
  const total = cart.reduce((s, l) => s + l.qty * l.unitPriceCents, 0);
  const setQty = (i: number, qty: number) => {
    if (!onChange) return;
    const next = cart.map((l, idx) => (idx === i ? { ...l, qty } : l)).filter((l) => l.qty > 0);
    onChange(next);
  };
  if (cart.length === 0) return <p className="text-sm text-mocha">Nothing yet. Ask for something or tap a recommendation.</p>;
  return (
    <ul className="divide-y divide-espresso/10">
      {cart.map((l, i) => (
        <li key={`${l.itemId}-${l.notes ?? ""}`} className="flex items-center gap-3 py-2 text-sm">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{l.name}</p>
            {l.notes && <p className="text-xs text-mocha truncate">{l.notes}</p>}
          </div>
          {onChange ? (
            <div className="flex items-center gap-1">
              <button aria-label={`Fewer ${l.name}`} className="rounded-full p-1 hover:bg-cream-2" onClick={() => setQty(i, l.qty - 1)}>
                {l.qty === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
              </button>
              <span className="w-5 text-center tabular-nums">{l.qty}</span>
              <button aria-label={`More ${l.name}`} className="rounded-full p-1 hover:bg-cream-2 disabled:opacity-40" disabled={l.qty >= 10} onClick={() => setQty(i, l.qty + 1)}>
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <span className="tabular-nums">x{l.qty}</span>
          )}
          <span className="w-16 text-right tabular-nums">{formatPrice(l.qty * l.unitPriceCents)}</span>
        </li>
      ))}
      <li className="flex justify-between pt-3 font-semibold">
        <span>Total</span>
        <span className="tabular-nums">{formatPrice(total)}</span>
      </li>
    </ul>
  );
}
