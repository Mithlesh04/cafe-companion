/**
 * Fixed-window, per-key rate limiter kept in process memory.
 * Good enough for a single Cloud Run instance / pilot. For multi-instance
 * production, back this with Memorystore or Firestore counters.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, now = Date.now()): RateLimitResult {
  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, b);
  }
  b.count += 1;
  const remaining = Math.max(0, limit - b.count);
  const retryAfterSeconds = Math.ceil((b.resetAt - now) / 1000);
  // Opportunistic cleanup to keep the map bounded.
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  }
  return { ok: b.count <= limit, remaining, retryAfterSeconds };
}

export function resetRateLimits() {
  buckets.clear();
}

/** Best-effort client identity for rate limiting behind Cloud Run / load balancers. */
export function clientKey(headers: Headers, scope: string): string {
  const fwd = headers.get("x-forwarded-for");
  const ip = (fwd ? fwd.split(",")[0] : headers.get("x-real-ip")) ?? "anon";
  return `${scope}:${ip.trim()}`;
}
