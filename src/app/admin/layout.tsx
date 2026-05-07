import type { Metadata } from "next";
import type { ReactNode } from "react";

// Top-level /admin layout — intentionally pass-through. Auth gating happens
// inside the (authed) route group. /admin/login, /admin/logout, and
// /admin/account/change-password are siblings of (authed) so they never run
// the auth gate.

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return children;
}
