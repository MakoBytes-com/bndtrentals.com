// Master CP user-summary pull endpoint. Verifies an inbound master JWT
// (scope=users.read) and returns per-role account counts the fleet dashboard
// rolls up. Read-only (SELECT count only).
//
// Fleet-shape mapping for this client:
//   - BNDT's admin table is `admin_users` and has NO `disabled_at` column, so
//     every account is active → `active` == `total`.
//   - BNDT's roles are 'admin' | 'staff'. The fleet-canonical shape exposes an
//     `editors` slot; BNDT's non-admin role ('staff') is mapped into it so the
//     master renderer stays consistent across the fleet.

import { NextResponse, type NextRequest } from "next/server";

import { getAdminSupabase } from "@/lib/supabase/admin";
import { verifyMasterToken } from "@/lib/master-jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "missing bearer token" }, { status: 401 });
  }

  try {
    await verifyMasterToken(auth.slice("Bearer ".length).trim(), "users.read");
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "verification failed" },
      { status: 401 },
    );
  }

  try {
    const supa = getAdminSupabase();
    const [totalRes, adminRes, staffRes] = await Promise.all([
      supa.from("admin_users").select("*", { count: "exact", head: true }),
      supa
        .from("admin_users")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin"),
      supa
        .from("admin_users")
        .select("*", { count: "exact", head: true })
        .eq("role", "staff"),
    ]);
    if (totalRes.error) throw totalRes.error;
    if (adminRes.error) throw adminRes.error;
    if (staffRes.error) throw staffRes.error;

    const total = totalRes.count ?? 0;

    return NextResponse.json({
      ok: true,
      counts: {
        total,
        active: total, // no disabled_at column — all accounts are active
        admins: adminRes.count ?? 0,
        editors: staffRes.count ?? 0, // 'staff' mapped into the fleet 'editors' slot
      },
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "internal error" },
      { status: 500 },
    );
  }
}
