import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
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

  return (
    <AdminShell
      session={{
        fullName: session.fullName,
        email: session.email,
        role: session.role,
      }}
    >
      {children}
    </AdminShell>
  );
}
