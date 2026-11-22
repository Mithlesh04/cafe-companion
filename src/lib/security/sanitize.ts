/**
 * Input hygiene for anything that ends up inside a prompt or is shown back to
 * other users. We keep text, but strip control characters, collapse whitespace
 * and cap length so a single request cannot blow the token budget.
 */
export function cleanText(input: unknown, maxLen = 1000): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

/**
 * Heuristic prompt-injection screen. We do not block on it (false positives
 * hurt real customers); we tag it so the system prompt can be stricter and
 * so staff can review flagged sessions.
 */
const INJECTION_PATTERNS = [
  /ignore (all|any|the|previous|above) (previous |prior )?(instructions|rules|prompts?)/i,
  /you are now (a|an|the) /i,
  /system prompt/i,
  /reveal (your|the) (instructions|prompt|rules)/i,
  /\bDAN\b/,
  /developer mode/i,
];

export function looksLikeInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((re) => re.test(text));
}

/** Constant-time string compare for PINs/tokens. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
