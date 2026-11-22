import { Type } from "@google/genai";
import { hasGemini } from "../env";
import { generateJson } from "../gemini";
import type { AiMode, ConnectProfile, Match } from "../types";
import { parseModelJson } from "../utils";

export const PROFILE_TTL_MINUTES = 120;

const norm = (s: string) => s.trim().toLowerCase();

export function sharedInterests(a: ConnectProfile, b: ConnectProfile): string[] {
  const set = new Set(a.interests.map(norm));
  return b.interests.filter((i) => set.has(norm(i)));
}

/** 0..1 similarity: Jaccard on interests, plus a bump for compatible intent. */
export function matchScore(a: ConnectProfile, b: ConnectProfile): number {
  const A = new Set(a.interests.map(norm));
  const B = new Set(b.interests.map(norm));
  const inter = Array.from(A).filter((x) => B.has(x)).length;
  const union = new Set([...A, ...B]).size || 1;
  const jaccard = inter / union;
  const intent = a.openTo.some((o) => b.openTo.includes(o)) ? 0.2 : 0;
  return Number(Math.min(1, jaccard + intent).toFixed(2));
}

function demoIcebreaker(me: ConnectProfile, other: ConnectProfile, shared: string[]): string {
  if (shared.length) return `You both listed ${shared[0]}. Ask ${other.displayName} what got them into it.`;
  if (other.blurb) return `${other.displayName} says: "${other.blurb}". That is an easy opener.`;
  const o = other.openTo[0];
  const intent: Record<string, string> = {
    chat: "is up for a chat",
    cowork: "is here to cowork",
    "coffee-buddy": "wants a coffee buddy",
    "language-exchange": "is keen on a language exchange",
  };
  return `${other.displayName} ${intent[o] ?? "is open to meeting people"}. Say hi.`;
}

export function matchDemo(me: ConnectProfile, others: ConnectProfile[], limit = 5): Match[] {
  return others
    .filter((o) => o.id !== me.id)
    .map((profile) => {
      const shared = sharedInterests(me, profile);
      return { profile, sharedInterests: shared, score: matchScore(me, profile), icebreaker: demoIcebreaker(me, profile, shared) };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function findMatches(
  me: ConnectProfile,
  others: ConnectProfile[],
  limit = 5,
): Promise<{ matches: Match[]; mode: AiMode }> {
  const demo = matchDemo(me, others, limit);
  if (!hasGemini() || demo.length === 0) return { matches: demo, mode: "demo" };
  try {
    const raw = await generateJson({
      system: "You write one-line, friendly, non-creepy icebreakers for two strangers in a café who opted in to meet people. Never mention appearance. Max 20 words each.",
      prompt: `Me: ${JSON.stringify({ interests: me.interests, openTo: me.openTo, blurb: me.blurb })}\nOthers:\n${demo
        .map((m) => `- id=${m.profile.id} name=${m.profile.displayName} shared=${m.sharedInterests.join("/") || "none"} interests=${m.profile.interests.join("/")} blurb=${m.profile.blurb ?? ""}`)
        .join("\n")}`,
      schema: {
        type: Type.OBJECT,
        properties: {
          icebreakers: {
            type: Type.ARRAY,
            items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["id", "text"] },
          },
        },
        required: ["icebreakers"],
      },
      temperature: 0.8,
    });
    const p = parseModelJson<{ icebreakers: Array<{ id: string; text: string }> }>(raw);
    const byId = new Map((p?.icebreakers ?? []).map((x) => [x.id, x.text]));
    return {
      matches: demo.map((m) => ({ ...m, icebreaker: (byId.get(m.profile.id) ?? m.icebreaker).slice(0, 160) })),
      mode: "gemini",
    };
  } catch (err) {
    console.warn("[connect] Gemini failed, using template icebreakers:", (err as Error).message);
    return { matches: demo, mode: "demo" };
  }
}
