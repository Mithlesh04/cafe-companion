import { describe, expect, it } from "vitest";
import { analyzeDemo, analyzeFeedback, detectTopics, roomInsights } from "@/lib/ai/sentiment";
import type { Feedback } from "@/lib/types";

describe("sentiment (lexicon)", () => {
  it("reads obvious praise as positive", () => {
    const r = analyzeDemo("Loved the oat latte, staff were so friendly", 5);
    expect(r.sentiment).toBe("positive");
    expect(r.topics).toEqual(expect.arrayContaining(["coffee", "staff"]));
    expect(r.urgent).toBe(false);
  });

  it("reads complaints as negative and finds the topic", () => {
    const r = analyzeDemo("Music is too loud and my coffee was cold", 2);
    expect(r.sentiment).toBe("negative");
    expect(r.topics).toEqual(expect.arrayContaining(["noise", "coffee", "temperature"]));
  });

  it("handles simple negation", () => {
    expect(analyzeDemo("not good at all").score).toBeLessThan(0);
    expect(analyzeDemo("never slow here, always quick").score).toBeGreaterThan(0);
  });

  it("flags safety words as urgent", () => {
    expect(analyzeDemo("I think I had an allergic reaction to the brownie").urgent).toBe(true);
    expect(analyzeDemo("Nice place").urgent).toBe(false);
  });

  it("blends star rating into the score", () => {
    expect(analyzeDemo("ok", 5).score).toBeGreaterThan(analyzeDemo("ok", 1).score);
  });

  it("detectTopics returns an empty list for unrelated text", () => {
    expect(detectTopics("hello there")).toEqual([]);
  });

  it("analyzeFeedback runs in demo mode without a key", async () => {
    const r = await analyzeFeedback("great coffee");
    expect(r.mode).toBe("demo");
    expect(r.sentiment).toBe("positive");
  });
});

describe("room insights", () => {
  const fb = (text: string, score: number, topics: string[], minutesAgo = 5, urgent = false): Feedback => ({
    id: `fb_${Math.random()}`,
    createdAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    text,
    sentiment: score > 0.15 ? "positive" : score < -0.15 ? "negative" : "neutral",
    score,
    topics,
    urgent,
  });

  it("aggregates only the recent window", async () => {
    const r = await roomInsights([fb("a", 1, ["coffee"]), fb("b", -1, ["wait"], 600)], { windowMinutes: 180 });
    expect(r.sampleSize).toBe(1);
    expect(r.moodLabel).toBe("great");
    expect(r.topTopics[0]).toEqual({ topic: "coffee", count: 1, sentiment: 1 });
  });

  it("surfaces urgent notes and a topic-specific suggestion", async () => {
    const r = await roomInsights([fb("loud", -0.8, ["noise"], 2, true), fb("slow", -0.5, ["wait"])]);
    expect(r.urgentCount).toBe(1);
    expect(r.moodLabel).toBe("tense");
    expect(r.suggestions[0]).toMatch(/urgent/);
    expect(r.suggestions.join(" ")).toMatch(/music|ETAs/);
  });

  it("is calm when there is nothing to fix", async () => {
    const r = await roomInsights([]);
    expect(r.sampleSize).toBe(0);
    expect(r.suggestions[0]).toMatch(/good place/);
  });
});
