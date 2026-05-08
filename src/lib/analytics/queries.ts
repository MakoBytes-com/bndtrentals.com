import "server-only";
import { getAdminSupabase } from "@/lib/supabase/admin";

// All time-windowed to the last 30 days. Aggregation is done in Node
// after pulling rows because Burton's B2B catalog runs at low traffic
// volume (a few thousand views / month tops). Pulling rows is simpler
// than maintaining DB views or stored functions, and the dashboard
// renders in well under a second at this scale.
//
// /admin/* paths are excluded from public-traffic queries — admins are
// also self-excluded client-side via mako_no_track, but legacy rows from
// before that flag shipped (or admins on private-mode browsers) shouldn't
// inflate the public numbers.

const DAYS = 30;

export type DailyPoint = { date: string; views: number; sessions: number };
export type PathCount = { path: string; count: number };
export type ReferrerCount = { source: string; count: number };
export type EventCount = { name: string; count: number };
export type CountryCount = { code: string; name: string; count: number };
export type TimeOnPage = { path: string; avgSeconds: number; sampleSize: number };
export type CtaPlacement = { location: string; phone: number; quote: number };

export type WebVitalMetric = "lcp" | "inp" | "cls" | "fcp" | "ttfb";
export type WebVitalStat = {
  metric: WebVitalMetric;
  /** P75 — same threshold Google uses for Core Web Vitals assessment. */
  p75: number;
  samples: number;
  good: number;
  needsImprovement: number;
  poor: number;
};

function isoDaysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function formatShortDate(d: Date): string {
  return d.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  });
}

function normalizeReferrer(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (!host) return null;
    if (host === "localhost") return null;
    if (host.endsWith("bndtrentals.com")) return null;
    if (host.endsWith("bndt-showcase.vercel.app")) return null;
    return host;
  } catch {
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed.slice(0, 120) : null;
  }
}

function isAdminPath(p: string): boolean {
  return p.startsWith("/admin");
}

type PvRow = {
  path: string;
  referrer: string | null;
  session_id: string;
  country: string | null;
  created_at: string;
};

type WebVitalEvRow = {
  name: string; // "web-vital-lcp" etc.
  data: Record<string, unknown> | null;
};

async function fetchRecentPageViews(): Promise<PvRow[]> {
  const since = isoDaysAgo(DAYS - 1).toISOString();
  const supa = getAdminSupabase();
  // 50k row ceiling per request — keep us safe even if traffic spikes.
  // Burton's typical 30-day volume is well under 5k.
  const { data, error } = await supa
    .from("page_views")
    .select("path, referrer, session_id, country, created_at")
    .order("created_at", { ascending: true }) // ordered ascending for time-on-page LEAD math
    .gte("created_at", since)
    .limit(50000);
  if (error) {
    console.warn("[analytics] page_views fetch failed", error);
    return [];
  }
  return (data ?? []).filter((r) => !isAdminPath(r.path));
}

type EvRow = {
  name: string;
  path: string;
  created_at: string;
  data: Record<string, unknown> | null;
};

async function fetchRecentEvents(): Promise<EvRow[]> {
  const since = isoDaysAgo(DAYS - 1).toISOString();
  const supa = getAdminSupabase();
  const { data, error } = await supa
    .from("analytics_events")
    .select("name, path, created_at, data")
    .gte("created_at", since)
    .limit(50000);
  if (error) {
    console.warn("[analytics] analytics_events fetch failed", error);
    return [];
  }
  return (data ?? []) as EvRow[];
}

export type Snapshot = {
  totals: { views: number; sessions: number; events: number };
  daily: DailyPoint[];
  topPages: PathCount[];
  topReferrers: { named: ReferrerCount[]; direct: number };
  topCountries: CountryCount[];
  topEvents: EventCount[];
  timeOnPage: TimeOnPage[];
  ctaByPlacement: CtaPlacement[];
  webVitals: WebVitalStat[];
  hasAnyData: boolean;
};

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  MX: "Mexico",
  GB: "United Kingdom",
  IE: "Ireland",
  DE: "Germany",
  FR: "France",
  NL: "Netherlands",
  AU: "Australia",
  IN: "India",
  JP: "Japan",
  BR: "Brazil",
};

export async function getAnalyticsSnapshot(): Promise<Snapshot> {
  const [pvs, evs] = await Promise.all([fetchRecentPageViews(), fetchRecentEvents()]);

  // Daily totals
  const dayBuckets = new Map<string, { views: number; sessions: Set<string> }>();
  for (const r of pvs) {
    const day = r.created_at.slice(0, 10);
    const b =
      dayBuckets.get(day) ?? { views: 0, sessions: new Set<string>() };
    b.views += 1;
    b.sessions.add(r.session_id);
    dayBuckets.set(day, b);
  }
  const daily: DailyPoint[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = isoDaysAgo(i);
    const key = d.toISOString().slice(0, 10);
    const b = dayBuckets.get(key);
    daily.push({
      date: formatShortDate(d),
      views: b?.views ?? 0,
      sessions: b?.sessions.size ?? 0,
    });
  }

  // Totals
  const sessionSet = new Set<string>();
  for (const r of pvs) sessionSet.add(r.session_id);
  const totals = { views: pvs.length, sessions: sessionSet.size, events: evs.length };

  // Top pages
  const pathMap = new Map<string, number>();
  for (const r of pvs) pathMap.set(r.path, (pathMap.get(r.path) ?? 0) + 1);
  const topPages = [...pathMap.entries()]
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Referrers
  const refMap = new Map<string, number>();
  let direct = 0;
  for (const r of pvs) {
    if (!r.referrer) {
      direct += 1;
      continue;
    }
    const norm = normalizeReferrer(r.referrer);
    if (!norm) {
      direct += 1; // self-referral or unparseable
      continue;
    }
    refMap.set(norm, (refMap.get(norm) ?? 0) + 1);
  }
  const topReferrers = {
    named: [...refMap.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    direct,
  };

  // Countries
  const countryMap = new Map<string, number>();
  for (const r of pvs) {
    if (!r.country) continue;
    countryMap.set(r.country, (countryMap.get(r.country) ?? 0) + 1);
  }
  const topCountries = [...countryMap.entries()]
    .map(([code, count]) => ({
      code,
      name: COUNTRY_NAMES[code] ?? code,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Events — exclude internal web-vital-* (those are in the web vitals card)
  const eventMap = new Map<string, number>();
  for (const r of evs) {
    if (r.name.startsWith("web-vital-")) continue;
    eventMap.set(r.name, (eventMap.get(r.name) ?? 0) + 1);
  }
  const topEvents = [...eventMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Time on page — subtract consecutive pageview timestamps within the same
  // session. Last view of a session has no successor and contributes nothing.
  // Outlier clamp: < 2s is back-nav/prefetch, > 30min is "walked away."
  const bySession = new Map<string, PvRow[]>();
  for (const r of pvs) {
    const list = bySession.get(r.session_id) ?? [];
    list.push(r);
    bySession.set(r.session_id, list);
  }
  const timeBuckets = new Map<string, { totalSec: number; samples: number }>();
  for (const list of bySession.values()) {
    for (let i = 0; i < list.length - 1; i++) {
      const cur = list[i];
      const next = list[i + 1];
      const sec =
        (new Date(next.created_at).getTime() - new Date(cur.created_at).getTime()) /
        1000;
      if (sec < 2 || sec > 1800) continue;
      const b = timeBuckets.get(cur.path) ?? { totalSec: 0, samples: 0 };
      b.totalSec += sec;
      b.samples += 1;
      timeBuckets.set(cur.path, b);
    }
  }
  const timeOnPage: TimeOnPage[] = [...timeBuckets.entries()]
    .filter(([, b]) => b.samples >= 2)
    .map(([path, b]) => ({
      path,
      avgSeconds: Math.round(b.totalSec / b.samples),
      sampleSize: b.samples,
    }))
    .sort((a, b) => b.avgSeconds - a.avgSeconds)
    .slice(0, 10);

  // CTA placement breakdown — events with the "— Location" suffix.
  // "Phone Call — Header" / "Quote CTA — Footer" / "Phone Call — Mobile Drawer"
  const ctaMap = new Map<string, { phone: number; quote: number }>();
  for (const r of evs) {
    const idx = r.name.indexOf(" — ");
    if (idx < 0) continue;
    const kind = r.name.slice(0, idx);
    const location = r.name.slice(idx + 3);
    const isPhone = kind.startsWith("Phone Call");
    const isQuote = kind.startsWith("Quote CTA");
    if (!isPhone && !isQuote) continue;
    const entry = ctaMap.get(location) ?? { phone: 0, quote: 0 };
    if (isPhone) entry.phone += 1;
    else entry.quote += 1;
    ctaMap.set(location, entry);
  }
  const ctaByPlacement: CtaPlacement[] = [...ctaMap.entries()]
    .map(([location, v]) => ({ location, phone: v.phone, quote: v.quote }))
    .sort((a, b) => b.phone + b.quote - (a.phone + a.quote));

  // Web Vitals — aggregate `web-vital-{metric}` events into P75 + bucket counts.
  const vitalMetrics: WebVitalMetric[] = ["lcp", "inp", "cls", "fcp", "ttfb"];
  const vitalThresholds: Record<WebVitalMetric, { good: number; poor: number }> = {
    lcp: { good: 2500, poor: 4000 },
    inp: { good: 200, poor: 500 },
    cls: { good: 100, poor: 250 }, // ×1000 scale
    fcp: { good: 1800, poor: 3000 },
    ttfb: { good: 800, poor: 1800 },
  };
  const vitalBuckets = new Map<WebVitalMetric, number[]>();
  const vitalRatings = new Map<
    WebVitalMetric,
    { good: number; ni: number; poor: number }
  >();
  for (const r of evs as WebVitalEvRow[]) {
    if (!r.name.startsWith("web-vital-")) continue;
    const metric = r.name.slice("web-vital-".length) as WebVitalMetric;
    if (!vitalMetrics.includes(metric)) continue;
    const value = Number(r.data?.value);
    const rating = String(r.data?.rating ?? "");
    if (!Number.isFinite(value)) continue;
    const arr = vitalBuckets.get(metric) ?? [];
    arr.push(value);
    vitalBuckets.set(metric, arr);
    const buckets = vitalRatings.get(metric) ?? { good: 0, ni: 0, poor: 0 };
    if (rating === "good") buckets.good += 1;
    else if (rating === "needs-improvement") buckets.ni += 1;
    else if (rating === "poor") buckets.poor += 1;
    vitalRatings.set(metric, buckets);
  }
  const webVitals: WebVitalStat[] = vitalMetrics.map((m) => {
    const arr = vitalBuckets.get(m) ?? [];
    const buckets = vitalRatings.get(m) ?? { good: 0, ni: 0, poor: 0 };
    if (arr.length === 0) {
      return { metric: m, p75: 0, samples: 0, good: 0, needsImprovement: 0, poor: 0 };
    }
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.75));
    return {
      metric: m,
      p75: sorted[idx],
      samples: arr.length,
      good: buckets.good,
      needsImprovement: buckets.ni,
      poor: buckets.poor,
    };
  });

  return {
    totals,
    daily,
    topPages,
    topReferrers,
    topCountries,
    topEvents,
    timeOnPage,
    ctaByPlacement,
    webVitals,
    hasAnyData: pvs.length > 0 || evs.length > 0,
  };
}

// Threshold helper exposed for the dashboard's WebVitalTile color logic.
export function rateWebVital(
  metric: WebVitalMetric,
  p75: number,
): "good" | "needs-improvement" | "poor" | "empty" {
  const t: Record<WebVitalMetric, { good: number; poor: number }> = {
    lcp: { good: 2500, poor: 4000 },
    inp: { good: 200, poor: 500 },
    cls: { good: 100, poor: 250 },
    fcp: { good: 1800, poor: 3000 },
    ttfb: { good: 800, poor: 1800 },
  };
  if (p75 === 0) return "empty";
  return p75 <= t[metric].good ? "good" : p75 <= t[metric].poor ? "needs-improvement" : "poor";
}
