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

async function fetchRecentPageViews(): Promise<PvRow[]> {
  const since = isoDaysAgo(DAYS - 1).toISOString();
  const supa = getAdminSupabase();
  // 50k row ceiling per request — keep us safe even if traffic spikes.
  // Burton's typical 30-day volume is well under 5k.
  const { data, error } = await supa
    .from("page_views")
    .select("path, referrer, session_id, country, created_at")
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
};

async function fetchRecentEvents(): Promise<EvRow[]> {
  const since = isoDaysAgo(DAYS - 1).toISOString();
  const supa = getAdminSupabase();
  const { data, error } = await supa
    .from("analytics_events")
    .select("name, path, created_at")
    .gte("created_at", since)
    .limit(50000);
  if (error) {
    console.warn("[analytics] analytics_events fetch failed", error);
    return [];
  }
  return data ?? [];
}

export type Snapshot = {
  totals: { views: number; sessions: number; events: number };
  daily: DailyPoint[];
  topPages: PathCount[];
  topReferrers: { named: ReferrerCount[]; direct: number };
  topCountries: CountryCount[];
  topEvents: EventCount[];
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

  // Events
  const eventMap = new Map<string, number>();
  for (const r of evs) eventMap.set(r.name, (eventMap.get(r.name) ?? 0) + 1);
  const topEvents = [...eventMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totals,
    daily,
    topPages,
    topReferrers,
    topCountries,
    topEvents,
    hasAnyData: pvs.length > 0 || evs.length > 0,
  };
}
