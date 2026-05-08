import "server-only";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { sendRecallNotification } from "@/lib/email/recall-notification";
import type { CalibrationRecall } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Daily cron: walk every recall whose due_date is within the next 30 days
// (or already past), skip ones that were reminded in the last 7 days, send
// the email, mark notification_sent_at + bump notification_count, and flip
// pending → reminded / overdue accordingly.
//
// Cooldown is 7 days: if the cron runs daily and a recall is 30 days out,
// the customer would get 30 separate emails without it. The pattern most
// fleet sites use: one reminder when entering the 30-day window, one as
// it transitions to overdue, and one weekly afterwards until completed.

const REMIND_WINDOW_DAYS = 30;
const COOLDOWN_DAYS = 7;

// Vercel Cron sends this header so we can authenticate the call without
// shipping a secret. CRON_SECRET (any string) lets manual curls work too.
function isAuthorized(req: Request): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET;
  if (expected && auth === `Bearer ${expected}`) return true;
  // Vercel cron always sets this header; trust it on Vercel deployments.
  if (req.headers.get("x-vercel-cron") === "1") return true;
  return false;
}

function daysBetween(due: string, today: Date): number {
  const dueDate = new Date(due + "T00:00:00Z");
  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  return Math.round((dueDate.getTime() - todayUtc.getTime()) / 86400000);
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const supa = getAdminSupabase();
  const now = new Date();
  const horizon = new Date(now.getTime() + REMIND_WINDOW_DAYS * 86400000);
  const horizonDate = horizon.toISOString().slice(0, 10);
  const cooldownCutoff = new Date(
    now.getTime() - COOLDOWN_DAYS * 86400000,
  ).toISOString();

  // Pull every active recall due on or before horizon.
  const { data, error } = await supa
    .from("calibration_recalls")
    .select("*")
    .in("status", ["pending", "reminded", "overdue"])
    .lte("due_date", horizonDate)
    .order("due_date", { ascending: true });
  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
  const rows = (data ?? []) as CalibrationRecall[];

  const sent: string[] = [];
  const skipped: Array<{ id: string; reason: string }> = [];

  for (const r of rows) {
    if (r.notification_sent_at && r.notification_sent_at > cooldownCutoff) {
      skipped.push({ id: r.id, reason: "cooldown" });
      continue;
    }
    const daysUntilDue = daysBetween(r.due_date, now);
    const result = await sendRecallNotification({
      customerName: r.customer_name,
      customerEmail: r.customer_email,
      customerCompany: r.customer_company,
      equipmentLabel: r.equipment_label,
      equipmentRef: r.equipment_ref,
      serialNumber: r.serial_number,
      dueDate: r.due_date,
      daysUntilDue,
    });
    if (!result.sent) {
      skipped.push({ id: r.id, reason: result.reason ?? "send_failed" });
      continue;
    }

    const newStatus =
      daysUntilDue < 0 ? "overdue" : r.status === "pending" ? "reminded" : r.status;
    const { error: updErr } = await supa
      .from("calibration_recalls")
      .update({
        notification_sent_at: now.toISOString(),
        notification_count: (r.notification_count ?? 0) + 1,
        status: newStatus,
      })
      .eq("id", r.id);
    if (updErr) {
      skipped.push({ id: r.id, reason: `update_failed: ${updErr.message}` });
      continue;
    }
    sent.push(r.id);
  }

  return Response.json({
    ok: true,
    scanned: rows.length,
    sent: sent.length,
    skipped: skipped.length,
    skippedDetail: skipped,
    sentIds: sent,
  });
}
