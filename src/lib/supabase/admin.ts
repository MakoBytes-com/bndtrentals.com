import "server-only";

// Service-role Supabase client. **Server-only.** Bypasses RLS entirely —
// any code with this client can read/write any row in any table. Reserve
// for trusted server actions and route handlers where the request has
// already been authenticated (via iron-session admin gate) or where the
// operation is intentionally public-write (anonymous quote-form INSERT).
//
// Never import this from a Client Component. The "server-only" import at
// the top will cause Next.js to throw a build-time error if you do.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let _admin: ReturnType<typeof createClient<Database>> | null = null;

export function getAdminSupabase() {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "[bndt admin supabase] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var",
    );
  }
  _admin = createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return _admin;
}
