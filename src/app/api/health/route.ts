import { env, hasGemini } from "@/lib/env";
import { json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  return json({
    ok: true,
    service: "cafe-companion",
    mode: hasGemini() ? "gemini" : "demo",
    model: hasGemini() ? env().GEMINI_MODEL : null,
    store: env().FIRESTORE_ENABLED === "true" ? "firestore" : "memory",
    time: new Date().toISOString(),
  });
}
