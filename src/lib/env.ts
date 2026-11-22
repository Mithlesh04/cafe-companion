import { z } from "zod";

const schema = z.object({
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().default("gemini-3.8-flash"),
  GOOGLE_CLOUD_PROJECT: z.string().optional(),
  FIRESTORE_ENABLED: z.enum(["true", "false"]).default("false"),
  /** Service account JSON (raw or base64) for serverless hosts such as Vercel. */
  FIREBASE_SERVICE_ACCOUNT: z.string().optional(),
  STAFF_PIN: z.string().min(4).default("2468"),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(60),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Parsed, validated environment. Never log the values. */
export function env(): Env {
  if (!cached) cached = schema.parse(process.env);
  return cached;
}

/** True when a Gemini key is present and the app can call the live model. */
export function hasGemini(): boolean {
  return Boolean(env().GEMINI_API_KEY);
}

/** Test hook: forget the cached environment. */
export function resetEnvCache() {
  cached = undefined;
}
