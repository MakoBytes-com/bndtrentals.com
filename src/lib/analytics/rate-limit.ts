import "server-only";

// In-memory token bucket per IP. Lives in the serverless function's
// process memory — Vercel keeps a function warm long enough that this
// dampens floods within a single instance. A different invocation can
// see a fresh bucket, but `isbot` + UA gating already culls most spam,
// and even a 10× burst is bounded by Vercel's per-region concurrency.
// We intentionally don't write every request to Supabase to count it —
// that would create the very write storm we're trying to stop.

type Bucket = { tokens: number; last: number };
const buckets = new Map<string, Bucket>();

export function checkRate(
  key: string,
  windowMs: number,
  max: number,
): boolean {
  const now = Date.now();
  const refillPerMs = max / windowMs;

  const b = buckets.get(key);
  if (!b) {
    buckets.set(key, { tokens: max - 1, last: now });
    return true;
  }

  const elapsed = now - b.last;
  b.tokens = Math.min(max, b.tokens + elapsed * refillPerMs);
  b.last = now;

  if (b.tokens < 1) return false;
  b.tokens -= 1;
  return true;
}
