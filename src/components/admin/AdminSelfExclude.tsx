"use client";

import { useEffect } from "react";

// Sets `mako_no_track=1` in localStorage on mount so admin browsers never
// land in the public-traffic numbers. Persists forever in that browser
// until cleared. Robust across IP changes, VPNs, mobile hotspots.
export function AdminSelfExclude() {
  useEffect(() => {
    try {
      if (localStorage.getItem("mako_no_track") !== "1") {
        localStorage.setItem("mako_no_track", "1");
      }
    } catch {
      // Private mode / blocked storage — fall through silently.
    }
  }, []);
  return null;
}
