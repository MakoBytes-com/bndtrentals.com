"use client";

import { useEffect } from "react";
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";
import { track } from "@/lib/track";

// Captures Core Web Vitals from real visitor browsers and ships them to
// /api/event as `web-vital-{metric}` rows in analytics_events. CLS values
// are stored ×1000 so integer-ish aggregation in the dashboard query is
// clean — divide by 1000 on display. Web Vitals fire on page-hide, so
// you'll see entries appear after a visitor navigates away.
export default function WebVitals() {
  useEffect(() => {
    const send = (metric: Metric) => {
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
