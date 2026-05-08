import "server-only";
import { getAdminSupabase } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Weekly cleanup so the analytics + error + rate-limit tables don't grow
// forever. Retention windows match what the privacy policy promises:
//   - page_views & analytics_events: 180 days
//   - error_events (resolved): 90 days
//   - rate_limit_log:           24 hours

const PAGE_VIEW_DAYS = 180;
const EVENT_DAYS = 180;
const RESOLVED_ERROR_DAYS = 90;
const RATE_LIMIT_HOURS = 24;

function isAuthorized(req: Request): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET;
  if (expected && auth === `Bearer ${expected}`) return true;
  if (req.headers.get("x-vercel-cron") === "1") return true;
  return false;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const supa = getAdminSupabase();
  const now = Date.now();

  const pvCutoff = new Date(now - PAGE_VIEW_DAYS * 86400_000).toISOString();
  const evCutoff = new Date(now - EVENT_DAYS * 86400_000).toISOString();
  const errCutoff = new Date(now - RESOLVED_ERROR_DAYS * 86400_000).toISOString();
  const rlCutoff = new Date(now - RATE_LIMIT_HOURS * 3600_000).toISOString();

  const [pvDel, evDel, errDel, rlDel] = await Promise.all([
    supa.from("page_views").delete({ count: "exact" }).lt("created_at", pvCutoff),
    supa.from("analytics_events").delete({ count: "exact" }).lt("created_at", evCutoff),
    supa
      .from("error_events")
      .delete({ count: "exact" })
      .not("resolved_at", "is", null)
      .lt("resolved_at", errCutoff),
    supa.from("rate_limit_log").delete({ count: "exact" }).lt("occurred_at", rlCutoff),
  ]);

  return Response.json({
    ok: true,
    deleted: {
      page_views: pvDel.count ?? 0,
      analytics_events: evDel.count ?? 0,
      error_events_resolved: errDel.count ?? 0,
      rate_limit_log: rlDel.count ?? 0,
    },
    errors: {
      page_views: pvDel.error?.message ?? null,
      analytics_events: evDel.error?.message ?? null,
      error_events: errDel.error?.message ?? null,
      rate_limit_log: rlDel.error?.message ?? null,
    },
  });
}
