"use server";

import { z } from "zod";
import { getAdminSession } from "@/lib/auth/session";
import { getAdminSupabase } from "@/lib/supabase/admin";
import {
  hashPassword,
  passwordPolicyError,
  verifyPassword,
} from "@/lib/auth/password";

const schema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z.string().min(12).max(200),
    confirm: z.string().min(1).max(200),
  })
  .refine((d) => d.newPassword === d.confirm, {
    message: "New password and confirmation don't match.",
    path: ["confirm"],
  });

export type ChangePasswordInput = z.input<typeof schema>;
export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: string };

export async function changePasswordAction(
  input: ChangePasswordInput,
): Promise<ChangePasswordResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Please fill in all fields. New password must be at least 12 characters.",
    };
  }
  const { currentPassword, newPassword } = parsed.data;

  const policyErr = passwordPolicyError(newPassword);
  if (policyErr) {
    return { ok: false, error: policyErr };
  }

  const session = await getAdminSession();
  if (!session.userId) {
    return { ok: false, error: "You're not signed in." };
  }

  const supa = getAdminSupabase();
  const { data: user, error } = await supa
    .from("admin_users")
    .select("*")
    .eq("id", session.userId)
    .maybeSingle();
  if (error || !user) {
    return { ok: false, error: "Account not found." };
  }

  const ok = await verifyPassword(currentPassword, user.password_hash);
  if (!ok) {
    return { ok: false, error: "Current password didn't match." };
  }
  if (await verifyPassword(newPassword, user.password_hash)) {
    return { ok: false, error: "New password must be different from the current one." };
  }

  const newHash = await hashPassword(newPassword);
  const { error: updErr } = await supa
    .from("admin_users")
    .update({
      password_hash: newHash,
      must_change_password: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.userId);
  if (updErr) {
    return { ok: false, error: "Could not save the new password. Please try again." };
  }

  // Reflect in session so the layout's must-change redirect stops firing.
  session.mustChangePassword = false;
  await session.save();

  return { ok: true };
}
