"use client";

import { useState } from "react";
import { Badge, Button, Card, Empty, ModeBadge, PageTitle } from "@/components/ui";
import { api, post } from "@/lib/client/api";
import type { ConnectProfile, Match, OpenTo } from "@/lib/types";

const INTEREST_IDEAS = ["startups", "chess", "books", "photography", "running", "machine learning", "travel", "design", "music", "hindi", "cycling", "film"];
const OPEN: Array<{ id: OpenTo; label: string }> = [
  { id: "chat", label: "A quick chat" },
  { id: "cowork", label: "Coworking" },
  { id: "coffee-buddy", label: "Coffee buddy" },
  { id: "language-exchange", label: "Language exchange" },
];

export default function ConnectPage() {
  const [name, setName] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [openTo, setOpenTo] = useState<OpenTo[]>(["chat"]);
  const [blurb, setBlurb] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ me: ConnectProfile; matches: Match[]; mode: "gemini" | "demo"; roomCount: number } | null>(null);

  const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setResult(await post("/api/connect", { displayName: name, interests, openTo, blurb: blurb || undefined }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    if (!result) return;
    await api(`/api/connect?id=${encodeURIComponent(result.me.id)}`, { method: "DELETE" });
    setResult(null);
  };

  if (result) {
    return (
      <div>
        <PageTitle eyebrow="Connect people" title={`You are in the room, ${result.me.displayName}`} blurb={`${result.roomCount} other ${result.roomCount === 1 ? "person has" : "people have"} opted in right now. Your card disappears in two hours or when you leave.`} />
        <div className="mb-4 flex items-center gap-3">
          <ModeBadge mode={result.mode} />
          <Button variant="ghost" onClick={leave}>
            Leave the room
          </Button>
        </div>
        {result.matches.length === 0 ? (
          <Empty>No overlap yet. Stay in the room and check back; new people join all the time.</Empty>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {result.matches.map((m) => (
              <li key={m.profile.id} className="card animate-rise p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{m.profile.displayName}</p>
                  <Badge tone="brand">{Math.round(m.score * 100)}% overlap</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.profile.interests.map((i) => (
                    <Badge key={i} tone={m.sharedInterests.includes(i) ? "good" : "neutral"}>
                      {i}
                    </Badge>
                  ))}
                </div>
                <p className="mt-3 text-sm text-espresso-2">{m.icebreaker}</p>
                <p className="mt-2 text-xs text-mocha">Open to: {m.profile.openTo.join(", ")}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageTitle eyebrow="Connect people" title="Meet someone over coffee" blurb="Strictly opt in. First name or nickname, a few interests, and what you are open to. No photos, no messaging, no tracking." />
      <Card className="max-w-2xl">
        <form onSubmit={submit} className="space-y-5">
          <label className="block text-sm">
            <span className="block text-xs font-semibold uppercase tracking-wide text-mocha mb-1">Name or nickname</span>
            <input required maxLength={24} value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-espresso/15 bg-white px-3 py-2" />
          </label>

          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wide text-mocha mb-2">Interests (pick up to 8)</legend>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set([...INTEREST_IDEAS, ...interests])).map((i) => (
                <button key={i} type="button" className="chip" aria-pressed={interests.includes(i)} onClick={() => setInterests((xs) => (xs.includes(i) || xs.length < 8 ? toggle(xs, i) : xs))}>
                  {i}
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input value={custom} onChange={(e) => setCustom(e.target.value.slice(0, 24))} placeholder="Add your own" className="rounded-xl border border-espresso/15 bg-white px-3 py-1.5 text-sm" />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const v = custom.trim().toLowerCase();
                  if (v && interests.length < 8 && !interests.includes(v)) setInterests([...interests, v]);
                  setCustom("");
                }}
              >
                Add
              </Button>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wide text-mocha mb-2">Open to</legend>
            <div className="flex flex-wrap gap-2">
              {OPEN.map((o) => (
                <button key={o.id} type="button" className="chip" aria-pressed={openTo.includes(o.id)} onClick={() => setOpenTo((xs) => toggle(xs, o.id))}>
                  {o.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block text-sm">
            <span className="block text-xs font-semibold uppercase tracking-wide text-mocha mb-1">One line about today (optional)</span>
            <input maxLength={120} value={blurb} onChange={(e) => setBlurb(e.target.value)} placeholder="e.g. prepping for a hackathon pitch" className="w-full rounded-xl border border-espresso/15 bg-white px-3 py-2" />
          </label>

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy || !name.trim() || interests.length === 0 || openTo.length === 0}>
            {busy ? "Finding people" : "Join the room"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
