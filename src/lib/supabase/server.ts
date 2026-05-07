// Server-side Supabase client for Server Components / Route Handlers /
// Server Actions. Uses the anon key (RLS still applies). Cookie store is
// piped through so Supabase Auth (if we ever turn it on for end-customers)
// can read/write auth cookies. We use iron-session for admin auth, so
// these cookies are mostly idle for now — but the wiring is correct.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Server Components can't mutate cookies; this is a no-op outside
          // route handlers / server actions. Supabase SSR handles that
          // gracefully and falls back to read-only on the request.
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component context — read-only cookies. Safe to ignore.
          }
        },
      },
    },
  );
}
