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
import { draftMode } from "next/headers";
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

// Edit mode rides on Next draft mode so public pages can stay statically
// cached: without the draft cookie, draftMode().isEnabled is false during
// prerender and the session cookie is never touched. With it (set by
// /api/cms/edit for signed-in admins only), the page renders per-request and
// the edit affordances appear. A visitor who somehow gets the bypass cookie
// without an admin session still sees the normal page.
export async function getEditMode(): Promise<boolean> {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return false;
  try {
    const session = await getAdminSession();
    // Page editing is admin-only — staff never see edit affordances even if
    // a draft cookie is somehow present.
    return Boolean(session.userId) && session.role === "admin";
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
