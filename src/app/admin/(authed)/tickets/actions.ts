"use server";

// Files support tickets against the Mako master control plane. Any signed-in
// admin user (staff included) can file — asking Mako for help is day-to-day
// work. Rate-limited per user via the shared DB rate bucket.

import { z } from "zod";
import { getAdminSession } from "@/lib/auth/session";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { submitMasterTicket, type MasterTicket } from "@/lib/master-api";

const ticketSchema = z.object({
  title: z.string().trim().min(3, "Give the ticket a short title.").max(200),
  description: z
    .string()
    .trim()
    .min(10, "Describe the request in a sentence or two.")
    .max(5000),
  category: z.enum(["quick_change", "feature", "bug", "not_sure"]).default("not_sure"),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
});

export type SubmitTicketFormInput = z.input<typeof ticketSchema>;

export type SubmitTicketFormResult =
  | { ok: true; ticket: MasterTicket }
  | { ok: false; error: string };

export async function submitTicket(
  input: SubmitTicketFormInput,
): Promise<SubmitTicketFormResult> {
  const session = await getAdminSession();
  if (!session.userId) return { ok: false, error: "Not signed in." };

  const parsed = ticketSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  // 10 tickets / 15 min per user — same DB bucket the login limiter uses.
  try {
    const supa = getAdminSupabase();
    const { data: allowed } = await supa.rpc("check_and_record_rate", {
      p_bucket_key: `tickets:${session.userId}`,
      p_window_ms: 15 * 60_000,
      p_max: 10,
    });
    if (allowed === false) {
      return {
        ok: false,
        error: "That's a lot of tickets at once — wait a few minutes and try again.",
      };
    }
  } catch {
    // Rate check failing soft is fine; master still validates everything.
  }

  return submitMasterTicket({
    actorUserId: session.userId,
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category,
    priority: parsed.data.priority,
  });
}
