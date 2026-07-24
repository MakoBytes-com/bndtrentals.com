import { isbot } from "isbot";

const blockedIps = new Set(
  (process.env.ANALYTICS_IP_BLOCKLIST || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

export type RequestMeta = {
  userAgent: string;
  ip: string | null;
  country: string | null;
  referrer: string | null;
};

export function readMeta(req: Request): RequestMeta {
  const h = req.headers;
  const ip =
    h.get("x-real-ip") ||
    (h.get("x-forwarded-for") || "").split(",")[0].trim() ||
    null;

  return {
    userAgent: h.get("user-agent") || "",
    ip: ip || null,
    country: h.get("x-vercel-ip-country") || null,
    referrer: h.get("referer") || null,
  };
}

export function shouldAccept(meta: RequestMeta): boolean {
  if (!meta.userAgent) return false;
  if (isbot(meta.userAgent)) return false;
  if (meta.ip && blockedIps.has(meta.ip)) return false;
  return true;
}

/**
 * Referrer-spoofing bot fleets that isbot() can't catch — they send
 * ordinary browser UAs with a faked search-engine referrer. Observed
 * June 2026 on the fleet: ~1,200 IPs, all "X11; Linux" desktop Chrome,
 * referrer "https://www.google.com/", exactly one page per session,
 * pages hit in a flat sitemap-sweep distribution. Real Linux-desktop
 * searchers are a sliver of traffic, and this only fires on the
 * Linux+search-referrer combination, so false positives stay negligible.
 *
 * `pageReferrer` is the client-reported document.referrer (what lands in
 * page_views.referrer), NOT the API request's Referer header. Rows
 * matching this are flagged is_bot=true at insert — kept in the table,
 * excluded from dashboard aggregates. Ported from makologics.com.
 */
export function isSuspectedBot(
  userAgent: string,
  pageReferrer: string | null,
): boolean {
  if (!pageReferrer) return false;
  if (!userAgent.includes("X11; Linux")) return false;
  return /^https?:\/\/(www\.)?(google|bing|duckduckgo)\./i.test(pageReferrer);
}
