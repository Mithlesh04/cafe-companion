import { describe, expect, it } from "vitest";
import { findMatches, matchDemo, matchScore, sharedInterests } from "@/lib/ai/connect";
import type { ConnectProfile } from "@/lib/types";

const p = (id: string, interests: string[], openTo: ConnectProfile["openTo"] = ["chat"], blurb?: string): ConnectProfile => ({
  id,
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  displayName: id,
  interests,
  openTo,
  blurb,
});

describe("connect matching", () => {
  it("finds shared interests case-insensitively", () => {
    expect(sharedInterests(p("a", ["Chess", "books"]), p("b", ["chess", "film"]))).toEqual(["chess"]);
  });

  it("scores overlap plus intent", () => {
    const me = p("me", ["chess", "startups"], ["cowork"]);
    expect(matchScore(me, p("x", ["chess", "startups"], ["cowork"]))).toBe(1);
    expect(matchScore(me, p("y", ["film"], ["chat"]))).toBe(0);
    expect(matchScore(me, p("z", ["film"], ["cowork"]))).toBe(0.2);
  });

  it("ranks matches and excludes self and zero-score people", () => {
    const me = p("me", ["chess", "running"], ["chat"]);
    const matches = matchDemo(me, [me, p("a", ["chess", "running"]), p("b", ["chess"], ["cowork"]), p("c", ["film"], ["cowork"])]);
    expect(matches.map((m) => m.profile.id)).toEqual(["a", "b"]);
    expect(matches[0].icebreaker).toMatch(/chess/);
  });

  it("uses the blurb or intent when nothing is shared", () => {
    const me = p("me", ["chess"], ["chat"]);
    const [m] = matchDemo(me, [p("a", ["film"], ["chat"], "Reading today")]);
    expect(m.icebreaker).toMatch(/Reading today/);
  });

  it("findMatches is demo mode without a key", async () => {
    const r = await findMatches(p("me", ["chess"]), [p("a", ["chess"])]);
    expect(r.mode).toBe("demo");
    expect(r.matches).toHaveLength(1);
  });
});
