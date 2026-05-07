import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Layout for /admin/*. Login + change-password pages bypass the shell + auth
// gate by checking the path; everything else requires a signed-in admin.
//
// Path-based bypass keeps the auth flow self-contained: /admin/login is
// reachable to unauth'd visitors, /admin/account/change-password is reachable
// to signed-in users who must change their password (the requireAdmin helper
// would normally redirect them in a loop).

const PUBLIC_PATHS = ["/admin/login", "/admin/logout"];
const POST_LOGIN_BYPASS = ["/admin/account/change-password"];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const hdrs = await headers();
  // x-invoke-path is set by Next.js' server runtime; fall back to referer
  // header for edge cases.
  const path =
    hdrs.get("x-invoke-path") ??
    hdrs.get("next-url") ??
    hdrs.get("x-pathname") ??
    "";

  // Login + logout pages: render children without the shell.
  if (PUBLIC_PATHS.some((p) => path.startsWith(p))) {
    return children;
  }

  const session = await getAdminSession();

  if (!session.userId) {
    redirect("/admin/login");
  }

  // Force change-password before any other admin work (bypass for the
  // change-password page itself).
  if (
    session.mustChangePassword &&
    !POST_LOGIN_BYPASS.some((p) => path.startsWith(p))
  ) {
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
