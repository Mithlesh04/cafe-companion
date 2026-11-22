"use client";

import { Sparkles, Star } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { AiMode } from "@/lib/types";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function PageTitle({ eyebrow, title, blurb }: { eyebrow: string; title: string; blurb?: string }) {
  return (
    <div className="pt-8 pb-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">{eyebrow}</p>
      <h1 className="mt-1 text-3xl sm:text-4xl font-semibold tracking-tight text-espresso">{title}</h1>
      {blurb && <p className="mt-2 max-w-2xl text-mocha">{blurb}</p>}
    </div>
  );
}

type Variant = "primary" | "secondary" | "ghost" | "danger";
const styles: Record<Variant, string> = {
  primary: "bg-espresso text-cream hover:bg-espresso-2 disabled:bg-espresso/40",
  secondary: "bg-cream-2 text-espresso hover:bg-latte/60",
  ghost: "bg-transparent text-espresso-2 hover:bg-cream-2",
  danger: "bg-danger text-white hover:opacity-90",
};

export function Button({ variant = "primary", className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    />
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" | "brand" }) {
  const t = {
    neutral: "bg-cream-2 text-espresso-2",
    good: "bg-sage-2 text-sage",
    warn: "bg-amber-100 text-amber-800",
    bad: "bg-red-100 text-red-800",
    brand: "bg-terracotta/10 text-terracotta-2",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${t}`}>{children}</span>;
}

export function ModeBadge({ mode }: { mode?: AiMode }) {
  if (!mode) return null;
  return mode === "gemini" ? (
    <Badge tone="brand">
      <Sparkles size={11} aria-hidden /> Gemini
    </Badge>
  ) : (
    <Badge>Demo mode</Badge>
  );
}

export function Stars({ value, onChange }: { value?: number; onChange?: (n: 1 | 2 | 3 | 4 | 5) => void }) {
  return (
    <div role={onChange ? "radiogroup" : undefined} aria-label="Rating" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const on = (value ?? 0) >= n;
        const common = `h-7 w-7 ${on ? "fill-gold text-gold" : "text-latte"}`;
        return onChange ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => onChange(n as 1 | 2 | 3 | 4 | 5)}
            className="rounded-full p-0.5 hover:scale-110 transition"
          >
            <Star className={common} />
          </button>
        ) : (
          <Star key={n} className={common} aria-hidden />
        );
      })}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span role="status" aria-live="polite" className="inline-flex items-center gap-2 text-sm text-mocha">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-latte border-t-espresso" aria-hidden />
      {label}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-espresso/15 p-6 text-center text-sm text-mocha">{children}</p>;
}
