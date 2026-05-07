"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import {
  checkLoginRateLimit,
  recordLoginAttempt,
} from "@/lib/auth/rate-limit";
import { verifyTotpCode } from "@/lib/auth/totp";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(200),
  totp: z.string().trim().max(10).optional().or(z.literal("")),
});

export type LoginInput = z.input<typeof loginSchema>;

export type LoginResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string; needsTotp?: boolean };

export async function loginAction(input: LoginInput): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Email or password format is invalid." };
  }
  const { email, password, totp } = parsed.data;

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    null;
  const userAgent = hdrs.get("user-agent") ?? null;

  // Rate-limit FIRST so attackers can't get the "is this email known" signal.
  const limit = await checkLoginRateLimit({ email, ip });
  if (!limit.ok) {
    await recordLoginAttempt({ email, ip, userAgent, success: false, reason: "rate_limited" });
    return {
      ok: false,
      error:
        "Too many sign-in attempts. Wait 15 minutes and try again, or call support.",
    };
  }

  const supa = getAdminSupabase();
  const { data: user, error } = await supa
    .from("admin_users")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  // Generic message + constant-ish path even when user doesn't exist.
  if (error || !user) {
    await recordLoginAttempt({ email, ip, userAgent, success: false, reason: "no_user" });
    return { ok: false, error: "Email or password didn't match." };
  }

  const passOk = await verifyPassword(password, user.password_hash);
  if (!passOk) {
    await recordLoginAttempt({ email, ip, userAgent, success: false, reason: "bad_password" });
    return { ok: false, error: "Email or password didn't match." };
  }

  // TOTP gate (only after password is correct so we don't reveal enrollment status).
  if (user.totp_enrolled) {
    if (!totp || totp.trim().length === 0) {
      // Don't record this as a failure — it's just the prompt.
      return { ok: false, error: "Enter the 6-digit code from your authenticator.", needsTotp: true };
    }
    if (!user.totp_secret) {
      // Defensive: enrolled but no secret stored. Treat as misconfiguration.
      await recordLoginAttempt({ email, ip, userAgent, success: false, reason: "totp_misconfigured" });
      return { ok: false, error: "Two-factor isn't fully configured on your account. Contact support." };
    }
    if (!verifyTotpCode(user.totp_secret, totp)) {
      await recordLoginAttempt({ email, ip, userAgent, success: false, reason: "totp_failed" });
      return { ok: false, error: "That code didn't match. Try the next one.", needsTotp: true };
    }
  }

  // Success — write session, update last_login_at.
  const session = await getAdminSession();
  session.userId = user.id;
  session.email = user.email;
  session.fullName = user.full_name;
  session.role = user.role;
  session.totpVerified = user.totp_enrolled;
  session.mustChangePassword = user.must_change_password;
  await session.save();

  await supa
    .from("admin_users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", user.id);
  await recordLoginAttempt({ email, ip, userAgent, success: true });

  return {
    ok: true,
    redirectTo: user.must_change_password ? "/admin/account/change-password" : "/admin",
  };
}

export async function loginAndRedirect(input: LoginInput) {
  const result = await loginAction(input);
  if (result.ok) {
    redirect(result.redirectTo);
  }
  // Returning a result for the client to render the error.
  return result;
}
