// Master CP analytics-pull endpoint (scope=analytics.read). Returns the
// CANONICAL fleet analytics shape (matching bulldogsecurityservice.com's
// /api/master/analytics), which master's fleet-refresh cron caches and its
// per-client analytics tab renders from.
//
// Read-only. All figures are 30-day-windowed and exclude /admin/* paths.
// Priority fields (must be accurate): `totals` + `traffic` (daily). The rest
// are best-effort and fall back to empty on any failure.
//
// The bulk of the work reuses getAnalyticsSnapshot() — the same tested,
// low-traffic-tuned aggregator that already backs the live /admin/analytics
// dashboard (pulls rows and aggregates in Node; well under 8s at Burton's
// volume). We remap its output to the fleet-canonical field names:
//   snapshot.totals.events  -> totals.conversions  (mirrors Bulldog: total
//                                                    analytics_events as the
//                                                    conversions proxy; 0 when
//                                                    there are none)
//   snapshot.daily          -> traffic
//   snapshot.topEvents      -> events
//   snapshot.ctaByPlacement -> ctaByLocation  (BNDT's 2nd CTA is "Quote"; its
//                                              count is placed in the fleet's
//                                              `schedule` slot)
// `webVitalsByPath` has no snapshot equivalent, so it's computed here as a
// best-effort extra (returns [] on any error).

import { NextResponse, type NextRequest } from "next/server";

import { getAnalyticsSnapshot } from "@/lib/analytics/queries";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { verifyMasterToken } from "@/lib/master-jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WEB_VITAL_METRICS = ["lcp", "inp", "cls", "fcp", "ttfb"] as const;
type WebVitalMetric = (typeof WEB_VITAL_METRICS)[number];

type WebVitalPageRow = {
  path: string;
  totalSamples: number;
  metrics: Record<WebVitalMetric, { p75: number | null; samples: number }>;
};

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function p75(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.75));
  return sorted[idx];
}

// Per-path Core Web Vitals P75 over 30 days — mirrors Bulldog's
// getWebVitalsByPath. Best-effort: any failure yields []. Excludes /admin/*.
async function getWebVitalsByPath(
  limit = 15,
  minSamples = 3,
): Promise<WebVitalPageRow[]> {
  try {
    const since = isoDaysAgo(30 - 1);
    const supa = getAdminSupabase();
    const { data, error } = await supa
      .from("analytics_events")
      .select("path, name, data")
      .gte("created_at", since)
      .like("name", "web-vital-%")
      .limit(50000);
    if (error || !data) return [];

    // Collect raw values per (path, metric).
    const byPath = new Map<string, Map<WebVitalMetric, number[]>>();
    for (const r of data) {
      const path = r.path;
      if (typeof path !== "string" || path.startsWith("/admin")) continue;
      const metric = r.name.slice("web-vital-".length) as WebVitalMetric;
      if (!WEB_VITAL_METRICS.includes(metric)) continue;
      const value = Number((r.data as Record<string, unknown> | null)?.value);
      if (!Number.isFinite(value)) continue;
      let metrics = byPath.get(path);
      if (!metrics) {
        metrics = new Map();
        byPath.set(path, metrics);
      }
      const arr = metrics.get(metric) ?? [];
      arr.push(value);
      metrics.set(metric, arr);
    }

    const rows: WebVitalPageRow[] = [];
    for (const [path, metrics] of byPath) {
      const metricOut = Object.fromEntries(
        WEB_VITAL_METRICS.map((m) => [m, { p75: null, samples: 0 }]),
      ) as WebVitalPageRow["metrics"];
      let totalSamples = 0;
      for (const m of WEB_VITAL_METRICS) {
        const vals = metrics.get(m) ?? [];
        metricOut[m] = { p75: p75(vals), samples: vals.length };
        totalSamples += vals.length;
      }
      rows.push({ path, totalSamples, metrics: metricOut });
    }

    return rows
      .filter((r) => r.totalSamples >= minSamples)
      .sort((a, b) => b.totalSamples - a.totalSamples)
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "missing bearer token" }, { status: 401 });
  }

  try {
    await verifyMasterToken(auth.slice("Bearer ".length).trim(), "analytics.read");
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "verification failed" },
      { status: 401 },
    );
  }

  try {
    const [snap, webVitalsByPath] = await Promise.all([
      getAnalyticsSnapshot(),
      getWebVitalsByPath(),
    ]);

    return NextResponse.json({
      ok: true,
      totals: {
        views: snap.totals.views,
        sessions: snap.totals.sessions,
        conversions: snap.totals.events,
      },
      traffic: snap.daily,
      topPages: snap.topPages,
      topReferrers: snap.topReferrers,
      topCountries: snap.topCountries,
      timeOnPage: snap.timeOnPage,
      events: snap.topEvents,
      ctaByLocation: snap.ctaByPlacement.map((c) => ({
        location: c.location,
        phone: c.phone,
        schedule: c.quote,
      })),
      webVitals: snap.webVitals,
      webVitalsByPath,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "internal error" },
      { status: 500 },
    );
  }
}
