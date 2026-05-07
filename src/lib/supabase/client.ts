"use client";

// Browser-side Supabase client. Uses the anon key + RLS policies — never the
// service_role key. Read-only for public catalog data; cannot read leads,
// calibration recalls, admin users, etc. (RLS enforces this).

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function getBrowserSupabase() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
