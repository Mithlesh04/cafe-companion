"use client";

import { Clock3, Coffee, MessageSquareText, ShieldCheck, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/order", label: "Order", icon: MessageSquareText },
  { href: "/discover", label: "Discover", icon: Sparkles },
  { href: "/waits", label: "Waits", icon: Clock3 },
  { href: "/connect", label: "Connect", icon: Users },
  { href: "/staff", label: "Staff", icon: ShieldCheck },
];

export function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-espresso/10 bg-cream/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap font-semibold tracking-tight text-espresso">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-espresso text-cream">
            <Coffee size={16} aria-hidden />
          </span>
          <span className="hidden min-[400px]:inline">Café Companion</span>
          <span className="sr-only min-[400px]:hidden">Café Companion home</span>
        </Link>
        <nav aria-label="Primary" className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = path === href || path.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm transition sm:px-3 ${
                  active ? "bg-espresso text-cream" : "text-espresso-2 hover:bg-cream-2"
                }`}
              >
                <Icon size={15} aria-hidden />
                <span className="hidden sm:inline">{label}</span>
                <span className="sr-only sm:hidden">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
