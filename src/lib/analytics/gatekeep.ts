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
