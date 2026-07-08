// Master CP errors-pull endpoint (scope=errors.read, GET only). Returns
// aggregated error_events grouped by fingerprint so master's per-client errors
// tab can render a Sentry-style summary without owning the raw rows.
//
// Read-only — NO mutations (no remote "resolve" action on this client).
//
// error_events already carries a `fingerprint` column, so no synthesis is
// needed. supabase-js can't GROUP BY in the query builder, so summary counts
// come from exact head-count queries (always accurate) and the per-fingerprint
// groups are aggregated in Node over the newest rows (bounded fetch; Burton's
// error volume is tiny). Rows are pulled occurred_at-desc, so the first row
// seen per fingerprint is its newest occurrence.

import { NextResponse, type NextRequest } from "next/server";

import { getAdminSupabase } from "@/lib/supabase/admin";
import { verifyMasterToken } from "@/lib/master-jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROW_CAP = 10000;

type GroupRow = {
  fingerprint: string;
  count: number;
  level: "error" | "warn";
  module: string;
  message: string;
  last_seen: string;
  first_seen: string;
  resolved: boolean;
};

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "missing bearer token" }, { status: 401 });
  }

  try {
    await verifyMasterToken(auth.slice("Bearer ".length).trim(), "errors.read");
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "verification failed" },
      { status: 401 },
    );
  }

  try {
    const supa = getAdminSupabase();
    const now = Date.now();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [totalAllRes, totalOpenRes, open24Res, open7Res, rowsRes] =
      await Promise.all([
        supa.from("error_events").select("*", { count: "exact", head: true }),
        supa
          .from("error_events")
          .select("*", { count: "exact", head: true })
          .is("resolved_at", null),
        supa
          .from("error_events")
          .select("*", { count: "exact", head: true })
          .is("resolved_at", null)
          .gte("occurred_at", dayAgo),
        supa
          .from("error_events")
          .select("*", { count: "exact", head: true })
          .is("resolved_at", null)
          .gte("occurred_at", weekAgo),
        supa
          .from("error_events")
          .select("fingerprint, level, module, message, occurred_at, resolved_at")
          .order("occurred_at", { ascending: false })
          .limit(ROW_CAP),
      ]);

    if (rowsRes.error) throw rowsRes.error;

    const summary = {
      open_24h: open24Res.count ?? 0,
      open_7d: open7Res.count ?? 0,
      total_open: totalOpenRes.count ?? 0,
      total_all: totalAllRes.count ?? 0,
    };

    // Group by fingerprint. Rows are occurred_at-desc, so the first row seen
    // for a fingerprint is its newest — use it for level/module/message.
    const map = new Map<string, GroupRow>();
    for (const r of rowsRes.data ?? []) {
      let g = map.get(r.fingerprint);
      if (!g) {
        g = {
          fingerprint: r.fingerprint,
          count: 0,
          level: r.level,
          module: r.module,
          message: r.message,
          last_seen: r.occurred_at,
          first_seen: r.occurred_at,
          resolved: true,
        };
        map.set(r.fingerprint, g);
      }
      g.count += 1;
      // ISO timestamps compare lexicographically.
      if (r.occurred_at > g.last_seen) g.last_seen = r.occurred_at;
      if (r.occurred_at < g.first_seen) g.first_seen = r.occurred_at;
      if (r.resolved_at === null) g.resolved = false;
    }

    const groups = [...map.values()]
      .sort((a, b) => b.last_seen.localeCompare(a.last_seen))
      .slice(0, 50);

    return NextResponse.json({
      ok: true,
      summary,
      groups,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "internal error" },
      { status: 500 },
    );
  }
}
