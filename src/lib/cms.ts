import "server-only";

// Visual CMS — content store + edit-mode detection.
//
// Each page's editable content is a flat key->string map stored in the
// existing `page_sections` table, in one row per page: slug = `cms:<page>`,
// values held in the JSONB `metadata` column. No schema change required, and
// the anon RLS read policy (is_published = true) lets public pages read it.
//
// Pages render `content[key] ?? "<default copy>"`, so the live site is
// identical to today until an admin actually edits something.

import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { getAdminSession } from "@/lib/auth/session";
import type { Database } from "./supabase/types";

export type PageContent = Record<string, string>;

let _client: ReturnType<typeof createClient<Database>> | null = null;
function getReadClient() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("[cms] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  _client = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _client;
}

export const CMS_SLUG_PREFIX = "cms:";

// Per-request cached read of a page's content map. Fails soft (empty map) so a
// DB hiccup can never blank out a page — defaults in the JSX still render.
export const getPageContent = cache(async (page: string): Promise<PageContent> => {
  try {
    const supa = getReadClient();
    const { data } = await supa
      .from("page_sections")
      .select("metadata")
      .eq("slug", `${CMS_SLUG_PREFIX}${page}`)
      .maybeSingle();
    const md = (data?.metadata ?? {}) as Record<string, unknown>;
    const out: PageContent = {};
    for (const [k, v] of Object.entries(md)) {
      if (typeof v === "string") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
});

// Edit mode is on only when ?edit=1 AND the request carries an authenticated
// admin session. Random visitors appending ?edit=1 get the normal page.
export async function getEditMode(
  searchParams?: Record<string, string | string[] | undefined>,
): Promise<boolean> {
  const raw = searchParams?.edit;
  const edit = Array.isArray(raw) ? raw[0] : raw;
  if (edit !== "1") return false;
  try {
    const session = await getAdminSession();
    return Boolean(session.userId);
  } catch {
    return false;
  }
}

// Pages exposed in the visual editor. label/path drive the /admin/pages list.
export const CMS_PAGES: { page: string; label: string; path: string }[] = [
  { page: "home", label: "Home", path: "/" },
  { page: "about", label: "About", path: "/about" },
  { page: "equipment", label: "Equipment", path: "/equipment" },
  { page: "applications", label: "Applications", path: "/applications" },
  { page: "calibration", label: "Calibration", path: "/calibration" },
  { page: "locations", label: "Locations", path: "/locations" },
  { page: "projects", label: "Projects", path: "/projects" },
  { page: "contact", label: "Contact", path: "/contact" },
  { page: "quote", label: "Request a Quote", path: "/quote" },
  { page: "privacy", label: "Privacy Policy", path: "/privacy" },
  { page: "terms", label: "Terms & Conditions", path: "/terms" },
];
