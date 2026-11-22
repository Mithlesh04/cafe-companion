import { z } from "zod";
import { json, limited, readJson } from "@/lib/api";
import { PROFILE_TTL_MINUTES, findMatches } from "@/lib/ai/connect";
import { cleanText } from "@/lib/security/sanitize";
import { getStore } from "@/lib/store";
import type { ConnectProfile } from "@/lib/types";
import { newId, nowIso, uniq } from "@/lib/utils";

export const dynamic = "force-dynamic";

const Body = z.object({
  displayName: z.string().min(1).max(24),
  interests: z.array(z.string().min(1).max(24)).min(1).max(8),
  openTo: z.array(z.enum(["chat", "cowork", "coffee-buddy", "language-exchange"])).min(1).max(4),
  blurb: z.string().max(120).optional(),
});

/**
 * Opt-in only. Profiles are first-name-or-nickname plus interests, expire
 * after two hours, and can be deleted by the owner at any time.
 */
export async function POST(req: Request) {
  const block = limited(req, "connect", 10);
  if (block) return block;
  const parsed = await readJson(req, Body);
  if ("error" in parsed) return parsed.error;
  const b = parsed.data;
  const now = Date.now();
  const me: ConnectProfile = {
    id: newId("ppl"),
    createdAt: nowIso(),
    displayName: cleanText(b.displayName, 24),
    interests: uniq(b.interests.map((i) => cleanText(i, 24).toLowerCase()).filter(Boolean)),
    openTo: uniq(b.openTo),
    blurb: b.blurb ? cleanText(b.blurb, 120) : undefined,
    expiresAt: new Date(now + PROFILE_TTL_MINUTES * 60_000).toISOString(),
  };
  const store = await getStore();
  await store.putProfile(me);
  const others = (await store.listProfiles()).filter((p) => p.id !== me.id);
  const { matches, mode } = await findMatches(me, others);
  return json({ me, matches, mode, roomCount: others.length }, { status: 201 });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  if (!/^ppl_[a-f0-9-]{8}$/.test(id)) return json({ error: "Invalid id" }, { status: 400 });
  const store = await getStore();
  await store.deleteProfile(id);
  return json({ ok: true });
}
