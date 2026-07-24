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

export default function WebVitals() {
  useEffect(() => {
    // 404 renders (flagged by not-found.tsx pre-hydration): dead legacy
    // URLs swept by bot fleets aren't field data — skip entirely.
    if (document.documentElement.dataset.notFound === "1") return;
    // Honest headless automation self-identifies here.
    if (navigator.webdriver) return;

    const send = (metric: Metric) => {
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
      });
    };
    onLCP(send);
    onINP(send);
    onCLS(send);
    onFCP(send);
    onTTFB(send);
  }, []);

  return null;
}
