import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/AdminShell";

// Layout for /admin/(authed)/* — the route group that holds the dashboard
// and all data-managing modules. Login + change-password live OUTSIDE this
// group, so the auth gate here can't possibly redirect to itself.
//
// Order of redirects:
//   1. No session            → /admin/login
//   2. must_change_password  → /admin/account/change-password (outside this group)
//   3. 2FA not enrolled      → /admin/account/totp-setup (mandatory; allowed through
//      so the setup page itself doesn't redirect to itself)
//   4. otherwise             → render in AdminShell

// /admin/account/totp-setup lives INSIDE this group, so the gate must let it
// (and logout) render while forcing enrollment, or it would redirect to itself.
const TOTP_SETUP_PATH = "/admin/account/totp-setup";
const LOGOUT_PATH = "/admin/logout";

export default async function AuthedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getAdminSession();

  if (!session.userId) {
    redirect("/admin/login");
  }

  if (session.mustChangePassword) {
    redirect("/admin/account/change-password");
  }

  // Mandatory 2FA: an admin without TOTP enrolled is funnelled into enrollment
  // before they can reach any data-managing page. session.totpVerified is set
  // at login (= user.totp_enrolled) and flipped true by the enrollment action.
  if (!session.totpVerified) {
    const pathname = (await headers()).get("x-pathname") ?? "";
    const onAllowedPath =
      pathname.startsWith(TOTP_SETUP_PATH) || pathname.startsWith(LOGOUT_PATH);
    if (!onAllowedPath) {
      redirect(TOTP_SETUP_PATH);
    }
  }

  // Sidebar shows an "unresolved errors" pill when error_events has rows
  // not yet marked resolved. Fail soft on DB hiccup — we never block the
  // panel from rendering on a count query.
  let unresolvedErrors = 0;
  try {
    const supa = getAdminSupabase();
    const { count } = await supa
      .from("error_events")
      .select("*", { count: "exact", head: true })
      .is("resolved_at", null);
    unresolvedErrors = count ?? 0;
  } catch {
    // ignore
  }

  return (
    <AdminShell
      session={{
        fullName: session.fullName,
        email: session.email,
        role: session.role,
      }}
      badges={{ errors: unresolvedErrors }}
    >
      {children}
    </AdminShell>
  );
}
