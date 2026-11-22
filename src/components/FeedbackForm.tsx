"use client";

import { useState } from "react";
import { post } from "@/lib/client/api";
import type { Feedback } from "@/lib/types";
import { Button, ModeBadge, Stars } from "./ui";

export function FeedbackForm({ compact = false }: { compact?: boolean }) {
  const [text, setText] = useState("");
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | undefined>();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ feedback: Feedback; mode: "gemini" | "demo" } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await post<{ feedback: Feedback; mode: "gemini" | "demo" }>("/api/feedback", { text, rating });
      setDone(res);
      setText("");
      setRating(undefined);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    const f = done.feedback;
    return (
      <div className="animate-rise space-y-2 text-sm" aria-live="polite">
        <p className="font-medium">Thank you. The team sees this straight away.</p>
        <p className="text-mocha">
          Read as <strong>{f.sentiment}</strong>
          {f.topics.length ? <> about {f.topics.join(", ")}</> : null}
          {f.urgent ? <> and flagged for a quick response</> : null}. <ModeBadge mode={done.mode} />
        </p>
        <Button variant="ghost" onClick={() => setDone(null)}>
          Leave another note
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {!compact && <Stars value={rating} onChange={setRating} />}
      <label className="block">
        <span className="sr-only">Your note</span>
        <textarea
          required
          minLength={2}
          maxLength={500}
          rows={compact ? 2 : 3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="How is it going today? Music, coffee, seats, anything."
          className="w-full rounded-2xl border border-espresso/15 bg-white px-3 py-2 text-sm"
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy || text.trim().length < 2}>
          {busy ? "Sending" : "Send to the team"}
        </Button>
        {compact && <Stars value={rating} onChange={setRating} />}
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <p className="text-xs text-mocha">Anonymous. No account, no cookies, no name.</p>
    </form>
  );
}
