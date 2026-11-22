import { ArrowRight, Clock3, MessageSquareText, Radio, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { FeedbackForm } from "@/components/FeedbackForm";
import { WaitWidget } from "@/components/WaitWidget";
import { Card } from "@/components/ui";

const FEATURES = [
  { href: "/order", icon: MessageSquareText, title: "Order by chat or voice", blurb: "Tell the Companion what you feel like. It knows the menu, your preferences and the queue." },
  { href: "/discover", icon: Sparkles, title: "Personal picks", blurb: "Recommendations that respect your diet, caffeine limit and what you are here to do." },
  { href: "/waits", icon: Clock3, title: "Honest wait times", blurb: "A live estimate from the real queue, plus the quietest time to come back." },
  { href: "/connect", icon: Users, title: "Meet someone", blurb: "Opt in, share three interests, get an icebreaker. Nothing more, and it expires in two hours." },
  { href: "/staff", icon: Radio, title: "Read the room", blurb: "Staff see live mood, hot topics and three things to do in the next fifteen minutes." },
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="grid gap-6 pt-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        <div className="rise">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">The Café Companion</p>
          <h1 className="mt-2 text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
            A café that <span className="text-terracotta">remembers</span> how you take it.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-mocha">
            Order in plain language, get picks that fit your day, know exactly how long the queue is, and let the team feel the room in real time. Powered by Gemini.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/order" className="inline-flex items-center gap-2 rounded-full bg-espresso px-5 py-2.5 text-sm font-medium text-cream hover:bg-espresso-2">
              Start an order <ArrowRight size={16} aria-hidden />
            </Link>
            <Link href="/discover" className="inline-flex items-center gap-2 rounded-full bg-cream-2 px-5 py-2.5 text-sm font-medium text-espresso hover:bg-latte/60">
              What should I try?
            </Link>
          </div>
        </div>
        <Card className="rise">
          <WaitWidget />
        </Card>
      </section>

      <section aria-labelledby="features">
        <h2 id="features" className="sr-only">
          Features
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ href, icon: Icon, title, blurb }) => (
            <Link key={href} href={href} className="card group p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-cream-2 text-espresso group-hover:bg-espresso group-hover:text-cream transition">
                <Icon size={18} aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-mocha">{blurb}</p>
            </Link>
          ))}
          <Card>
            <h3 className="font-semibold">Thirty seconds of feedback</h3>
            <p className="mt-1 mb-3 text-sm text-mocha">Anonymous, read by Gemini, acted on by the team today.</p>
            <FeedbackForm compact />
          </Card>
        </div>
      </section>
    </div>
  );
}
