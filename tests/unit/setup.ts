import { beforeEach } from "vitest";
import { resetEnvCache } from "@/lib/env";
import { resetRateLimits } from "@/lib/security/rateLimit";
import { MemoryStore } from "@/lib/store/memory";
import { setStore } from "@/lib/store";

// Unit tests always run in demo mode with a fresh in-memory store.
beforeEach(() => {
  delete process.env.GEMINI_API_KEY;
  process.env.FIRESTORE_ENABLED = "false";
  process.env.STAFF_PIN = "2468";
  resetEnvCache();
  resetRateLimits();
  setStore(new MemoryStore());
});
