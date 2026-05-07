import "server-only";

import { getAdminSupabase } from "@/lib/supabase/admin";

// Sliding-window rate limit on login attempts. Read the last 15 minutes of
// failures for this email + IP and refuse if either is over the threshold.
//
// Thresholds match the makoai-portal pattern:
//   - 10 failures per email per 15 min  → email-level lock
//   - 30 failures per IP per 15 min     → IP-level lock (dampens spray)

const WINDOW_MINUTES = 15;
const EMAIL_LIMIT = 10;
const IP_LIMIT = 30;

export type RateLimitResult =
  | { ok: true }
  | { ok: false; reason: "email_locked" | "ip_locked"; retryAfterSeconds: number };

export async function checkLoginRateLimit(params: {
  email: string;
  ip: string | null;
}): Promise<RateLimitResult> {
  const supa = getAdminSupabase();
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  // Email-level
  const { count: emailCount, error: emailErr } = await supa
    .from("login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("email", params.email)
    .eq("success", false)
    .gte("created_at", since);
  if (emailErr) {
    // Fail open with logged warning — better to allow login than to lock
    // out everyone if Supabase has a hiccup.
    console.warn("[rate-limit] email check failed", emailErr);
    return { ok: true };
  }
  if ((emailCount ?? 0) >= EMAIL_LIMIT) {
    return {
      ok: false,
      reason: "email_locked",
      retryAfterSeconds: WINDOW_MINUTES * 60,
    };
  }

  // IP-level
  if (params.ip) {
    const { count: ipCount, error: ipErr } = await supa
      .from("login_attempts")
      .select("*", { count: "exact", head: true })
      .eq("ip", params.ip)
      .eq("success", false)
      .gte("created_at", since);
    if (ipErr) {
      console.warn("[rate-limit] ip check failed", ipErr);
      return { ok: true };
    }
    if ((ipCount ?? 0) >= IP_LIMIT) {
      return {
        ok: false,
        reason: "ip_locked",
        retryAfterSeconds: WINDOW_MINUTES * 60,
      };
    }
  }

  return { ok: true };
}

export async function recordLoginAttempt(params: {
  email: string | null;
  ip: string | null;
  userAgent: string | null;
  success: boolean;
  reason?: string;
}) {
  const supa = getAdminSupabase();
  const { error } = await supa.from("login_attempts").insert({
    email: params.email,
    ip: params.ip,
    user_agent: params.userAgent,
    success: params.success,
    reason: params.reason ?? null,
  });
  if (error) {
    console.warn("[rate-limit] record failed", error);
  }
}
