// Client-side analytics helpers. Posts to our own /api/* routes — no
// third-party SDK. Bots are filtered server-side via the `isbot`
// package; this file just has to ship the payload.
//
// Self-exclusion: any browser that has `mako_no_track=1` in localStorage
// silently drops every page view and event. The flag is set the moment
// an authenticated admin loads /admin, so Burton staff (and anyone else
// who can log in) never contaminate their own traffic numbers. Persists
// forever in that browser until cleared.

const SESSION_KEY = "bndt_pv_session";
const NO_TRACK_KEY = "mako_no_track";

function isSelfExcluded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(NO_TRACK_KEY) === "1";
  } catch {
    return false;
  }
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function post(url: string, payload: Record<string, unknown>): void {
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    }
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // Never block user flows on telemetry failure.
  }
}

export function trackPageView(path: string, referrer: string | null): void {
  if (typeof window === "undefined") return;
  if (isSelfExcluded()) return;
  post("/api/pv", {
    path,
    referrer: referrer || null,
    sessionId: getSessionId(),
  });
}

export function track(
  eventName: string,
  data?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  if (isSelfExcluded()) return;
  post("/api/event", {
    name: eventName,
    path: window.location.pathname,
    sessionId: getSessionId(),
    data: data ?? null,
  });
}
