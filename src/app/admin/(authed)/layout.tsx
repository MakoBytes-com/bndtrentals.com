import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/AdminShell";

// Layout for /admin/(authed)/* — the route group that holds the dashboard
// and all data-managing modules. Login + change-password live OUTSIDE this
// group, so the auth gate here can't possibly redirect to itself.
//
// Order of redirects:
//   1. No session   → /admin/login
//   2. must_change_password → /admin/account/change-password
//      (this page is also outside (authed), so the redirect lands cleanly)
//   3. otherwise    → render in AdminShell

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
