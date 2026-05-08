"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/track";

// One page-view insert per navigation. Skips a re-fire when StrictMode
// double-mounts. document.referrer is read on the first view only — once
// the SPA starts router-transitioning, document.referrer stays stuck on
// the external origin so we set it to null for subsequent views to keep
// top-referrers honest. /admin/* is tracked too, but the AdminShell sets
// `mako_no_track=1` on mount so admins never pollute public traffic.
export default function PageViewTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);
  const firstFire = useRef(true);

  useEffect(() => {
    if (!pathname) return;
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;

    const referrer = firstFire.current ? document.referrer || null : null;
    firstFire.current = false;
    trackPageView(pathname, referrer);
  }, [pathname]);

  return null;
}
