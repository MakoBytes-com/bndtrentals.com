"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth/session";
import {
  generateTotpSecret,
  totpUri,
  totpQrDataUrl,
  verifyTotpCode,
} from "@/lib/auth/totp";

export type EnrollmentBootstrap =
  | { ok: true; secret: string; uri: string; qrDataUrl: string }
  | { ok: false; error: string };

export async function startEnrollment(): Promise<EnrollmentBootstrap> {
  const session = await getAdminSession();
  if (!session.userId || !session.email) {
    return { ok: false, error: "Not signed in." };
  }

  const supa = getAdminSupabase();
  // Reuse existing pending (unverified) secret if one already exists for this
  // user, so refreshing the page doesn't invalidate the QR they already
  // scanned. If they've finished enrollment, return that fact.
  const { data: row, error: getErr } = await supa
    .from("admin_users")
    .select("totp_secret, totp_enrolled")
    .eq("id", session.userId)
    .maybeSingle();
  if (getErr || !row) {
    return { ok: false, error: "Account not found." };
  }
  if (row.totp_enrolled) {
    return { ok: false, error: "Already enrolled. Disable first to re-enroll." };
  }

  const secret = row.totp_secret ?? generateTotpSecret();
  if (!row.totp_secret) {
    const { error: updErr } = await supa
      .from("admin_users")
      .update({ totp_secret: secret })
      .eq("id", session.userId);
    if (updErr) return { ok: false, error: updErr.message };
  }

  const uri = totpUri(session.email, secret);
  const qrDataUrl = await totpQrDataUrl(uri);
  return { ok: true, secret, uri, qrDataUrl };
}

const verifySchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter a 6-digit code."),
});

export async function verifyEnrollment(input: z.input<typeof verifySchema>) {
  const session = await getAdminSession();
  if (!session.userId) return { ok: false as const, error: "Not signed in." };

  const parsed = verifySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid code.",
    };
  }
  const { code } = parsed.data;

  const supa = getAdminSupabase();
  const { data: row, error: getErr } = await supa
    .from("admin_users")
    .select("totp_secret, totp_enrolled")
    .eq("id", session.userId)
    .maybeSingle();
  if (getErr || !row || !row.totp_secret) {
    return { ok: false as const, error: "Start enrollment first." };
  }
  if (row.totp_enrolled) {
    return { ok: false as const, error: "Already enrolled." };
  }

  if (!verifyTotpCode(row.totp_secret, code)) {
    return {
      ok: false as const,
      error: "That code didn't match. Try the next one (codes rotate every 30 seconds).",
    };
  }

  const { error: updErr } = await supa
    .from("admin_users")
    .update({ totp_enrolled: true })
    .eq("id", session.userId);
  if (updErr) return { ok: false as const, error: updErr.message };

  // Update session so login flow knows TOTP is now active.
  session.totpVerified = true;
  await session.save();

  revalidatePath("/admin/account/totp-setup");
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function disableTotp() {
  const session = await getAdminSession();
  if (!session.userId) return { ok: false as const, error: "Not signed in." };

  const supa = getAdminSupabase();
  const { error } = await supa
    .from("admin_users")
    .update({ totp_secret: null, totp_enrolled: false })
    .eq("id", session.userId);
  if (error) return { ok: false as const, error: error.message };

  session.totpVerified = false;
  await session.save();

  revalidatePath("/admin/account/totp-setup");
  revalidatePath("/admin");
  return { ok: true as const };
}
