"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth/session";
import type { CalibrationRecall } from "@/lib/supabase/types";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const createSchema = z.object({
  customer_email: z.string().trim().email().max(254),
  customer_name: z.string().trim().max(200).optional().or(z.literal("")),
  customer_company: z.string().trim().max(200).optional().or(z.literal("")),
  equipment_ref: z.string().trim().min(1).max(200),
  equipment_label: z.string().trim().max(300).optional().or(z.literal("")),
  serial_number: z.string().trim().max(120).optional().or(z.literal("")),
  last_calibrated: dateString.optional().or(z.literal("")),
  due_date: dateString,
  internal_notes: z.string().trim().max(5000).optional().or(z.literal("")),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  customer_email: z.string().trim().email().max(254),
  customer_name: z.string().trim().max(200).optional().or(z.literal("")),
  customer_company: z.string().trim().max(200).optional().or(z.literal("")),
  equipment_ref: z.string().trim().min(1).max(200),
  equipment_label: z.string().trim().max(300).optional().or(z.literal("")),
  serial_number: z.string().trim().max(120).optional().or(z.literal("")),
  last_calibrated: dateString.optional().or(z.literal("")),
  due_date: dateString,
  status: z.enum(["pending", "reminded", "overdue", "completed", "cancelled"]),
  internal_notes: z.string().trim().max(5000).optional().or(z.literal("")),
});

export type CreateRecallInput = z.input<typeof createSchema>;
export type UpdateRecallInput = z.input<typeof updateSchema>;

function blank(s: string | undefined): string | null {
  if (!s) return null;
  const t = s.trim();
  return t.length === 0 ? null : t;
}

export async function createRecall(input: CreateRecallInput) {
  const session = await getAdminSession();
  if (!session.userId) return { ok: false as const, error: "Not signed in." };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const data = parsed.data;

  const supa = getAdminSupabase();
  const { data: row, error } = await supa
    .from("calibration_recalls")
    .insert({
      customer_email: data.customer_email.toLowerCase(),
      customer_name: blank(data.customer_name),
      customer_company: blank(data.customer_company),
      equipment_ref: data.equipment_ref,
      equipment_label: blank(data.equipment_label),
      serial_number: blank(data.serial_number),
      last_calibrated: blank(data.last_calibrated),
      due_date: data.due_date,
      internal_notes: blank(data.internal_notes),
      assigned_to: session.userId,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !row) {
    return { ok: false as const, error: error?.message ?? "Insert failed." };
  }

  revalidatePath("/admin/calibration");
  revalidatePath("/admin");
  return { ok: true as const, id: row.id };
}

export async function createRecallAndRedirect(input: CreateRecallInput) {
  const result = await createRecall(input);
  if (result.ok) {
    redirect(`/admin/calibration/${result.id}`);
  }
  return result;
}

export async function updateRecall(input: UpdateRecallInput) {
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
  const update: Partial<CalibrationRecall> = {
    customer_email: data.customer_email.toLowerCase(),
    customer_name: blank(data.customer_name),
    customer_company: blank(data.customer_company),
    equipment_ref: data.equipment_ref,
    equipment_label: blank(data.equipment_label),
    serial_number: blank(data.serial_number),
    last_calibrated: blank(data.last_calibrated),
    due_date: data.due_date,
    status: data.status,
    internal_notes: blank(data.internal_notes),
    assigned_to: session.userId,
  };
  if (data.status === "completed") {
    update.completed_at = new Date().toISOString();
  }

  const { error } = await supa
    .from("calibration_recalls")
    .update(update)
    .eq("id", data.id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/admin/calibration/${data.id}`);
  revalidatePath("/admin/calibration");
  revalidatePath("/admin");
  return { ok: true as const };
}
