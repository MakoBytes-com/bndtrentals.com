"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth/session";
import type { Customer } from "@/lib/supabase/types";

const createSchema = z.object({
  email: z.string().trim().email().max(254),
  full_name: z.string().trim().max(200).optional().or(z.literal("")),
  company: z.string().trim().max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  shipping_address: z.string().trim().max(2000).optional().or(z.literal("")),
  internal_notes: z.string().trim().max(5000).optional().or(z.literal("")),
  status: z
    .enum(["active", "prospect", "inactive", "do_not_contact"])
    .default("active"),
});

const updateSchema = createSchema.extend({
  id: z.string().uuid(),
});

export type CreateCustomerInput = z.input<typeof createSchema>;
export type UpdateCustomerInput = z.input<typeof updateSchema>;

function blank(s: string | undefined): string | null {
  if (!s) return null;
  const t = s.trim();
  return t.length === 0 ? null : t;
}

export async function createCustomer(input: CreateCustomerInput) {
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
    .from("customers")
    .insert({
      email: data.email.toLowerCase(),
      full_name: blank(data.full_name),
      company: blank(data.company),
      phone: blank(data.phone),
      shipping_address: blank(data.shipping_address),
      internal_notes: blank(data.internal_notes),
      status: data.status,
      source: "manual",
    })
    .select("id")
    .single();
  if (error || !row) {
    if (error?.code === "23505") {
      return {
        ok: false as const,
        error: `A customer with email ${data.email} already exists.`,
      };
    }
    return { ok: false as const, error: error?.message ?? "Insert failed." };
  }

  revalidatePath("/admin/customers");
  return { ok: true as const, id: row.id };
}

export async function createCustomerAndRedirect(input: CreateCustomerInput) {
  const result = await createCustomer(input);
  if (result.ok) redirect(`/admin/customers/${result.id}`);
  return result;
}

export async function updateCustomer(input: UpdateCustomerInput) {
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
  const update: Partial<Customer> = {
    email: data.email.toLowerCase(),
    full_name: blank(data.full_name),
    company: blank(data.company),
    phone: blank(data.phone),
    shipping_address: blank(data.shipping_address),
    internal_notes: blank(data.internal_notes),
    status: data.status,
  };
  const { error } = await supa.from("customers").update(update).eq("id", data.id);
  if (error) {
    if (error.code === "23505") {
      return {
        ok: false as const,
        error: `Email already in use by another customer.`,
      };
    }
    return { ok: false as const, error: error.message };
  }

  revalidatePath(`/admin/customers/${data.id}`);
  revalidatePath("/admin/customers");
  return { ok: true as const };
}

export async function deleteCustomer(customerId: string) {
  const session = await getAdminSession();
  if (!session.userId) return { ok: false as const, error: "Not signed in." };
  if (typeof customerId !== "string" || customerId.length < 10) {
    return { ok: false as const, error: "Invalid customer id." };
  }
  const supa = getAdminSupabase();
  const { error } = await supa.from("customers").delete().eq("id", customerId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/customers");
  return { ok: true as const };
}

export async function deleteCustomerAndRedirect(customerId: string) {
  const result = await deleteCustomer(customerId);
  if (result.ok) redirect("/admin/customers");
  return result;
}
