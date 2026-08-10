"use client";

import { useEffect } from "react";
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";
import { track } from "@/lib/track";

// Captures Core Web Vitals from real visitor browsers and ships them to
// /api/event as `web-vital-{metric}` rows in analytics_events. CLS values
// are stored ×1000 so integer-ish aggregation in the dashboard query is
// clean — divide by 1000 on display. Web Vitals fire on page-hide, so
// you'll see entries appear after a visitor navigates away.
// Outlier guards (fleet pattern): INP > 60s is a backgrounded-tab
// artifact; LCP/FCP/TTFB > 20s is machine traffic — fleet field data
// shows real load metrics bulge 0-5s, thin to ~20s, then a flat
// crawler-queue plateau. Real distributions decay; bots don't.
const INP_OUTLIER_THRESHOLD_MS = 60_000;
const LOAD_OUTLIER_THRESHOLD_MS = 20_000;
const LOAD_METRICS = new Set(["LCP", "FCP", "TTFB"]);

// Navigation types whose "load" timings are not a page load at all. A bfcache
// restore reports single-digit milliseconds and a prerender reports near-zero,
// because nothing was fetched or painted on demand. Pooled with real loads they
// drag the median down while background tabs drag the 75th percentile up, and
// the spread stops describing anything.
const NON_LOAD_NAVIGATIONS = new Set([
  "back-forward-cache",
  "prerender",
  "restore",
]);

export default function WebVitals() {
  useEffect(() => {
    // 404 renders (flagged by not-found.tsx pre-hydration): dead legacy
    // URLs swept by bot fleets aren't field data — skip entirely.
    if (document.documentElement.dataset.notFound === "1") return;
    // Honest headless automation self-identifies here.
    if (navigator.webdriver) return;

    // The guard that was missing. A tab opened in the BACKGROUND — middle
    // click, "open in new tab", a link preview — is not painted until the user
    // brings it forward, so LCP and FCP end up measuring how long the tab sat
    // unread rather than how fast the site is. Those samples are not slow page
    // loads and must be dropped, not capped: every one of them already fell
    // under the 20s ceiling above, which is why the ceiling never helped.
    //
    // Record when the page was FIRST hidden; any load metric that fires after
    // that point is describing the user's attention, not our performance.
    let firstHiddenAt =
      document.visibilityState === "hidden" ? 0 : Number.POSITIVE_INFINITY;
    const markHidden = () => {
      firstHiddenAt = Math.min(firstHiddenAt, performance.now());
    };
    document.addEventListener("visibilitychange", markHidden, true);
    document.addEventListener("pagehide", markHidden, true);

    const send = (metric: Metric) => {
      // Drop non-load navigations and background-tab paints before anything
      // else, so the magnitude ceilings below are only ever a last-resort
      // backstop rather than the primary filter.
      if (LOAD_METRICS.has(metric.name)) {
        if (NON_LOAD_NAVIGATIONS.has(metric.navigationType)) return;
        if (firstHiddenAt < metric.value) return;
      }
      if (metric.name === "INP" && metric.value > INP_OUTLIER_THRESHOLD_MS) {
        return;
      }
      if (
        LOAD_METRICS.has(metric.name) &&
        metric.value > LOAD_OUTLIER_THRESHOLD_MS
      ) {
        return;
      }
      const value =
        metric.name === "CLS" ? Math.round(metric.value * 1000) : Math.round(metric.value);
      track(`web-vital-${metric.name.toLowerCase()}`, {
        value,
        rating: metric.rating,
        path: window.location.pathname,
        // Stamped so a future investigation can tell these apart without
        // guessing, and so the portal can prefer post-fix samples.
        nav: metric.navigationType,
        v: 2,
      });
    };
    onLCP(send);
    onINP(send);
    onCLS(send);
    onFCP(send);
    onTTFB(send);

    return () => {
      document.removeEventListener("visibilitychange", markHidden, true);
      document.removeEventListener("pagehide", markHidden, true);
    };
  }, []);

  return null;
}
