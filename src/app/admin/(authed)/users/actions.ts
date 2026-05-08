"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import type { AdminUser } from "@/lib/supabase/types";

const createSchema = z.object({
  email: z.string().trim().email().max(254),
  full_name: z.string().trim().min(1).max(200),
  role: z.enum(["admin", "staff"]).default("admin"),
  // Optional override for the temp password. Leave blank for auto-generated.
  temp_password: z.string().min(12).max(128).optional().or(z.literal("")),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().min(1).max(200),
  role: z.enum(["admin", "staff"]),
});

export type CreateUserInput = z.input<typeof createSchema>;
export type UpdateUserInput = z.input<typeof updateSchema>;

export type CreateUserResult =
  | { ok: true; id: string; email: string; tempPassword: string }
  | { ok: false; error: string };

function generateTempPassword(): string {
  return randomBytes(16).toString("base64").replace(/[/+=]/g, "").slice(0, 18);
}

export async function createUser(input: CreateUserInput): Promise<CreateUserResult> {
  const session = await getAdminSession();
  if (!session.userId) return { ok: false, error: "Not signed in." };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const data = parsed.data;
  const tempPassword =
    data.temp_password && data.temp_password.length > 0
      ? data.temp_password
      : generateTempPassword();

  const supa = getAdminSupabase();
  const passwordHash = await hashPassword(tempPassword);

  const { data: row, error } = await supa
    .from("admin_users")
    .insert({
      email: data.email.toLowerCase(),
      full_name: data.full_name,
      password_hash: passwordHash,
      role: data.role,
      must_change_password: true,
    })
    .select("id, email")
    .single();

  if (error || !row) {
    if (error?.code === "23505") {
      return { ok: false, error: `An admin with email ${data.email} already exists.` };
    }
    return { ok: false, error: error?.message ?? "Insert failed." };
  }

  revalidatePath("/admin/users");
  return { ok: true, id: row.id, email: row.email, tempPassword };
}

export async function updateUser(input: UpdateUserInput) {
  const session = await getAdminSession();
  if (!session.userId) return { ok: false as const, error: "Not signed in." };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const data = parsed.data;

  const supa = getAdminSupabase();
  const update: Partial<AdminUser> = {
    full_name: data.full_name,
    role: data.role,
  };

  const { error } = await supa.from("admin_users").update(update).eq("id", data.id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/admin/users/${data.id}`);
  revalidatePath("/admin/users");
  return { ok: true as const };
}

export async function resetUserPassword(userId: string): Promise<
  | { ok: true; tempPassword: string }
  | { ok: false; error: string }
> {
  const session = await getAdminSession();
  if (!session.userId) return { ok: false, error: "Not signed in." };
  if (typeof userId !== "string" || userId.length < 10) {
    return { ok: false, error: "Invalid user id." };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const supa = getAdminSupabase();
  const { error } = await supa
    .from("admin_users")
    .update({
      password_hash: passwordHash,
      must_change_password: true,
    })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
  return { ok: true, tempPassword };
}

export async function disableUserTotp(userId: string) {
  const session = await getAdminSession();
  if (!session.userId) return { ok: false as const, error: "Not signed in." };
  if (typeof userId !== "string" || userId.length < 10) {
    return { ok: false as const, error: "Invalid user id." };
  }

  const supa = getAdminSupabase();
  const { error } = await supa
    .from("admin_users")
    .update({ totp_secret: null, totp_enrolled: false })
    .eq("id", userId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
  return { ok: true as const };
}

export async function deleteUser(userId: string) {
  const session = await getAdminSession();
  if (!session.userId) return { ok: false as const, error: "Not signed in." };
  if (typeof userId !== "string" || userId.length < 10) {
    return { ok: false as const, error: "Invalid user id." };
  }
  if (userId === session.userId) {
    return {
      ok: false as const,
      error: "You can't delete your own account. Have another admin do it.",
    };
  }

  // Refuse if this would leave zero admins.
  const supa = getAdminSupabase();
  const { count: adminCount } = await supa
    .from("admin_users")
    .select("*", { count: "exact", head: true })
    .eq("role", "admin");
  if ((adminCount ?? 0) <= 1) {
    return {
      ok: false as const,
      error: "Cannot delete the last admin. Promote another user first.",
    };
  }

  const { error } = await supa.from("admin_users").delete().eq("id", userId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/admin/users");
  return { ok: true as const };
}

export async function deleteUserAndRedirect(userId: string) {
  const result = await deleteUser(userId);
  if (result.ok) redirect("/admin/users");
  return result;
}
