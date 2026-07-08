// Master CP health-pull endpoint. Master signs a JWT with scope=health.read
// and fetches this so the fleet dashboard can render this client's "last
// seen" + schema-drift tile. Read-only: a single admin_users count doubles as
// a DB ping — if it fails we return 500 so master flags this client unhealthy.

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
    await verifyMasterToken(auth.slice("Bearer ".length).trim(), "health.read");
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "verification failed" },
      { status: 401 },
    );
  }

  try {
    const supa = getAdminSupabase();
    const { count, error } = await supa
      .from("admin_users")
      .select("*", { count: "exact", head: true });
    if (error) throw error;

    return NextResponse.json({
      ok: true,
      schema_rev: 1,
      plugin_versions: { admin: "1.0.0" },
      user_count: count ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "internal error" },
      { status: 500 },
    );
  }
}
