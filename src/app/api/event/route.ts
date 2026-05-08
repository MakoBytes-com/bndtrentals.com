import { getAdminSupabase } from "@/lib/supabase/admin";
import { readMeta, shouldAccept } from "@/lib/analytics/gatekeep";
import { checkRate } from "@/lib/analytics/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EventBody = {
  name?: unknown;
  path?: unknown;
  sessionId?: unknown;
  data?: unknown;
};

const MAX_NAME = 128;
const MAX_PATH = 512;
const MAX_SESSION = 64;

function clamp(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) : s;
}

function asStr(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

export async function POST(req: Request) {
  const meta = readMeta(req);
  if (!shouldAccept(meta)) {
    return new Response(null, { status: 204 });
  }

  const ip = meta.ip || "unknown";
  if (!(await checkRate(`event:${ip}`, 60_000, 60))) {
    return new Response(null, { status: 429 });
  }

  let body: EventBody;
  try {
    body = (await req.json()) as EventBody;
  } catch {
    return new Response(null, { status: 400 });
  }

  const name = asStr(body.name);
  const path = asStr(body.path);
  const sessionId = asStr(body.sessionId);
  if (!name || !path || !sessionId) {
    return new Response(null, { status: 400 });
  }

  const data =
    body.data && typeof body.data === "object" && !Array.isArray(body.data)
      ? (body.data as Record<string, unknown>)
      : null;

  try {
    const supa = getAdminSupabase();
    await supa.from("analytics_events").insert({
      name: clamp(name, MAX_NAME),
      path: clamp(path, MAX_PATH),
      session_id: clamp(sessionId, MAX_SESSION),
      data,
    });
  } catch (err) {
    console.warn("[event] insert failed", err);
  }

  return new Response(null, { status: 204 });
}
