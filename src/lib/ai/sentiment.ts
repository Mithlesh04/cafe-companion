import { Type } from "@google/genai";
import { hasGemini } from "../env";
import { generateJson } from "../gemini";
import type { AiMode, Feedback, RoomInsights, Sentiment } from "../types";
import { clamp, nowIso, parseModelJson } from "../utils";

const POSITIVE = ["love", "loved", "great", "amazing", "perfect", "delicious", "friendly", "fast", "quick", "cozy", "cosy", "best", "excellent", "wonderful", "nice", "good", "warm", "happy", "thanks", "thank"];
const NEGATIVE = ["slow", "cold", "rude", "dirty", "loud", "noisy", "expensive", "wrong", "late", "bad", "terrible", "awful", "worst", "burnt", "bitter", "stale", "waiting", "crowded", "broken", "disappointed"];
const URGENT = ["allergic", "allergy", "sick", "ill", "spill", "spilled", "burn", "burned", "emergency", "fell", "glass", "blood", "choking", "rude", "harass"];

export const TOPIC_KEYWORDS: Record<string, string[]> = {
  wait: ["wait", "slow", "queue", "line", "late", "quick", "fast"],
  coffee: ["coffee", "latte", "espresso", "cappuccino", "brew", "chai", "tea", "matcha", "drink"],
  food: ["food", "toast", "croissant", "wrap", "bowl", "soup", "brownie", "bread", "sandwich", "pastry"],
  staff: ["staff", "barista", "server", "friendly", "rude", "service", "team"],
  noise: ["loud", "noisy", "noise", "music", "quiet"],
  wifi: ["wifi", "wi-fi", "internet", "plug", "socket", "charger", "laptop"],
  cleanliness: ["dirty", "clean", "toilet", "restroom", "sticky", "mess"],
  price: ["expensive", "price", "cheap", "value", "cost", "pricey"],
  seating: ["seat", "table", "chair", "crowded", "space", "sofa"],
  temperature: ["cold", "hot", "warm", "ac", "air con", "draft", "heater"],
};

export function detectTopics(text: string): string[] {
  const t = text.toLowerCase();
  return Object.entries(TOPIC_KEYWORDS)
    .filter(([, words]) => words.some((w) => t.includes(w)))
    .map(([topic]) => topic);
}

/** Lexicon scorer, used in demo mode and as the fallback. */
export function analyzeDemo(text: string, rating?: number): Pick<Feedback, "sentiment" | "score" | "topics" | "urgent"> {
  const words = text.toLowerCase().split(/[^a-z']+/).filter(Boolean);
  let s = 0;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const negated = i > 0 && ["not", "never", "no", "isn't", "wasn't", "don't"].includes(words[i - 1]);
    if (POSITIVE.includes(w)) s += negated ? -1 : 1;
    if (NEGATIVE.includes(w)) s += negated ? 1 : -1;
  }
  let score = clamp(s / 3, -1, 1);
  if (rating) score = clamp(score * 0.5 + ((rating - 3) / 2) * 0.5, -1, 1);
  const sentiment: Sentiment = score > 0.15 ? "positive" : score < -0.15 ? "negative" : "neutral";
  const urgent = URGENT.some((u) => text.toLowerCase().includes(u)) || score <= -0.7;
  return { sentiment, score: Number(score.toFixed(2)), topics: detectTopics(text), urgent };
}

export async function analyzeFeedback(
  text: string,
  rating?: number,
): Promise<Pick<Feedback, "sentiment" | "score" | "topics" | "urgent"> & { mode: AiMode }> {
  const demo = { ...analyzeDemo(text, rating), mode: "demo" as const };
  if (!hasGemini()) return demo;
  try {
    const raw = await generateJson({
      system: `You classify café customer feedback. Topics must come from: ${Object.keys(TOPIC_KEYWORDS).join(", ")}, other. "urgent" is true only for safety, allergy, harassment or a customer about to leave angry.`,
      prompt: `Feedback: """${text}"""${rating ? ` Star rating: ${rating}/5.` : ""}`,
      schema: {
        type: Type.OBJECT,
        properties: {
          sentiment: { type: Type.STRING, enum: ["positive", "neutral", "negative"] },
          score: { type: Type.NUMBER, description: "-1 to 1" },
          topics: { type: Type.ARRAY, items: { type: Type.STRING } },
          urgent: { type: Type.BOOLEAN },
        },
        required: ["sentiment", "score", "topics", "urgent"],
      },
      temperature: 0.1,
    });
    const p = parseModelJson<{ sentiment: Sentiment; score: number; topics: string[]; urgent: boolean }>(raw);
    if (!p) return demo;
    return {
      sentiment: p.sentiment,
      score: clamp(Number(p.score) || 0, -1, 1),
      topics: (p.topics ?? []).slice(0, 5).map((t) => String(t).toLowerCase()),
      urgent: Boolean(p.urgent) || demo.urgent,
      mode: "gemini",
    };
  } catch (err) {
    console.warn("[sentiment] Gemini failed, using lexicon:", (err as Error).message);
    return demo;
  }
}

function moodLabel(score: number): RoomInsights["moodLabel"] {
  if (score > 0.4) return "great";
  if (score > 0.1) return "good";
  if (score > -0.2) return "mixed";
  return "tense";
}

function demoSuggestions(topics: RoomInsights["topTopics"], urgent: number): string[] {
  const out: string[] = [];
  if (urgent > 0) out.push(`Check the ${urgent} urgent note${urgent > 1 ? "s" : ""} first and speak to those guests in person.`);
  for (const t of topics) {
    if (t.sentiment >= 0) continue;
    const tip: Record<string, string> = {
      wait: "Open a second till or call out ETAs so waiting feels shorter.",
      coffee: "Dial in the espresso and taste a shot; grind may have drifted.",
      food: "Check hold times on pastries and the toast station temperature.",
      staff: "A quick huddle on greeting and eye contact goes a long way.",
      noise: "Drop the music a notch and seat laptop guests away from the bar.",
      wifi: "Restart the router and put the Wi-Fi password on the menu board.",
      cleanliness: "Do a tables-and-toilet sweep now, not at the end of shift.",
      price: "Highlight the value combos on the board.",
      seating: "Clear finished tables faster and free up sofa seats.",
      temperature: "Adjust the AC a degree or two; several guests feel it.",
    };
    if (tip[t.topic]) out.push(tip[t.topic]);
  }
  if (out.length === 0) out.push("The room is in a good place. Keep doing what you are doing and thank the team.");
  return out.slice(0, 4);
}

/** Aggregate recent feedback into a staff-facing room read. */
export async function roomInsights(feedback: Feedback[], opts: { windowMinutes?: number; now?: Date } = {}): Promise<RoomInsights> {
  const now = opts.now ?? new Date();
  const cutoff = now.getTime() - (opts.windowMinutes ?? 180) * 60_000;
  const recent = feedback.filter((f) => Date.parse(f.createdAt) >= cutoff);
  const sample = recent.length;
  const moodScore = sample ? Number((recent.reduce((s, f) => s + f.score, 0) / sample).toFixed(2)) : 0;
  const topicMap = new Map<string, { count: number; total: number }>();
  for (const f of recent) for (const t of f.topics) {
    const cur = topicMap.get(t) ?? { count: 0, total: 0 };
    cur.count += 1;
    cur.total += f.score;
    topicMap.set(t, cur);
  }
  const topTopics = Array.from(topicMap.entries())
    .map(([topic, v]) => ({ topic, count: v.count, sentiment: Number((v.total / v.count).toFixed(2)) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const urgentCount = recent.filter((f) => f.urgent).length;
  const base: RoomInsights = {
    generatedAt: nowIso(),
    sampleSize: sample,
    moodScore,
    moodLabel: moodLabel(moodScore),
    topTopics,
    urgentCount,
    suggestions: demoSuggestions(topTopics, urgentCount),
    mode: "demo",
  };
  if (!hasGemini() || sample === 0) return base;
  try {
    const raw = await generateJson({
      system: "You are a calm shift-lead coach for a café. Give 2 to 4 concrete actions the team can take in the next 15 minutes. Each action is one sentence. No emojis.",
      prompt: `Room summary: ${JSON.stringify({ moodScore, topTopics, urgentCount, sample })}\nRecent comments:\n${recent.slice(0, 20).map((f) => `- (${f.sentiment}) ${f.text}`).join("\n")}`,
      schema: { type: Type.OBJECT, properties: { suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["suggestions"] },
      temperature: 0.5,
    });
    const p = parseModelJson<{ suggestions: string[] }>(raw);
    if (!p?.suggestions?.length) return base;
    return { ...base, suggestions: p.suggestions.slice(0, 4).map((s) => String(s).slice(0, 200)), mode: "gemini" };
  } catch (err) {
    console.warn("[room] Gemini failed, using rule suggestions:", (err as Error).message);
    return base;
  }
}
