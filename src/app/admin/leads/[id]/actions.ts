"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth/session";
import type { QuoteLead } from "@/lib/supabase/types";

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "in_progress", "quoted", "won", "lost", "spam"]),
  internalNotes: z.string().max(10000).optional().or(z.literal("")),
});

export type UpdateLeadInput = z.input<typeof updateSchema>;

export async function updateLead(input: UpdateLeadInput) {
  const session = await getAdminSession();
  if (!session.userId) return { ok: false as const, error: "Not signed in." };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid input." };
  }
  const { id, status, internalNotes } = parsed.data;

  const supa = getAdminSupabase();
  const update: Partial<QuoteLead> = {
    status,
    assigned_to: session.userId,
    internal_notes: internalNotes ?? null,
  };
  if (status === "won" || status === "lost") {
    update.resolved_at = new Date().toISOString();
  }
  const { error } = await supa.from("quote_leads").update(update).eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  return { ok: true as const };
}
