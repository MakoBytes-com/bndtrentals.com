import "server-only";

import { getAdminSupabase } from "@/lib/supabase/admin";

// Distributed sliding-window rate limit, backed by the rate_limit_log
// Postgres table + the check_and_record_rate stored function. Replaces
// the previous in-memory token-bucket which couldn't share state across
// Vercel function instances.
//
// Burton's traffic profile makes the per-request DB round-trip cheap.
// If volume ever grows enough that this matters, swap in Upstash Redis —
// the call site stays the same.

export async function checkRate(
  key: string,
  windowMs: number,
  max: number,
): Promise<boolean> {
  try {
    // Made on first use, not when the file loads: a build loads every route
    // and has no database (and needs none). getAdminSupabase caches it.
    const supa = getAdminSupabase();
    const { data, error } = await supa.rpc("check_and_record_rate", {
      p_bucket_key: key,
      p_window_ms: windowMs,
      p_max: max,
    });
    if (error) {
      // Fail open on DB hiccup — better to accept a request than to 429
      // every visitor when Postgres is degraded. Rate limiter exists to
      // bound floods, not to gate normal traffic.
      console.warn("[rate-limit] rpc failed", error);
      return true;
    }
    return data === true;
  } catch (err) {
    console.warn("[rate-limit] threw", err);
    return true;
  }
}
