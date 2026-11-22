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
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 h-14">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-espresso">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-espresso text-cream">
            <Coffee size={16} aria-hidden />
          </span>
          <span>Café Companion</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1 overflow-x-auto">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = path === href || path.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${
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
