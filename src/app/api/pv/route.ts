import { getAdminSupabase } from "@/lib/supabase/admin";
import { readMeta, shouldAccept } from "@/lib/analytics/gatekeep";
import { checkRate } from "@/lib/analytics/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PvBody = {
  path?: unknown;
  referrer?: unknown;
  sessionId?: unknown;
};

const MAX_PATH = 512;
const MAX_REFERRER = 2048;
const MAX_UA = 2048;
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
  if (!checkRate(`pv:${ip}`, 60_000, 120)) {
    return new Response(null, { status: 429 });
  }

  let body: PvBody;
  try {
    body = (await req.json()) as PvBody;
  } catch {
    return new Response(null, { status: 400 });
  }

  const path = asStr(body.path);
  const sessionId = asStr(body.sessionId);
  if (!path || !sessionId) {
    return new Response(null, { status: 400 });
  }

  const referrer = asStr(body.referrer);

  try {
    const supa = getAdminSupabase();
    await supa.from("page_views").insert({
      path: clamp(path, MAX_PATH),
      referrer: referrer ? clamp(referrer, MAX_REFERRER) : null,
      user_agent: meta.userAgent ? clamp(meta.userAgent, MAX_UA) : null,
      session_id: clamp(sessionId, MAX_SESSION),
      ip: meta.ip,
      country: meta.country,
    });
  } catch (err) {
    console.warn("[pv] insert failed", err);
  }

  return new Response(null, { status: 204 });
}
