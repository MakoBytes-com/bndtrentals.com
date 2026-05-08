"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth/session";

export async function resolveError(errorId: string) {
  const session = await getAdminSession();
  if (!session.userId) redirect("/admin/login");
  const supa = getAdminSupabase();
  await supa
    .from("error_events")
    .update({ resolved_at: new Date().toISOString(), resolved_by: session.userId })
    .eq("id", errorId);
  revalidatePath(`/admin/errors/${errorId}`);
  revalidatePath("/admin/errors");
}

export async function unresolveError(errorId: string) {
  const session = await getAdminSession();
  if (!session.userId) redirect("/admin/login");
  const supa = getAdminSupabase();
  await supa
    .from("error_events")
    .update({ resolved_at: null, resolved_by: null })
    .eq("id", errorId);
  revalidatePath(`/admin/errors/${errorId}`);
  revalidatePath("/admin/errors");
}
