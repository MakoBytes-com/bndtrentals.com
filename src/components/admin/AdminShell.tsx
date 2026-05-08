import Link from "next/link";
import { type ReactNode } from "react";
import { SITE } from "@/lib/site";
import { AdminLogoutButton } from "./AdminLogoutButton";
import { AdminSelfExclude } from "./AdminSelfExclude";

type AdminSessionLike = {
  fullName?: string;
  email?: string;
  role?: "admin" | "staff";
};

type AdminBadges = {
  errors?: number;
};

type NavItem = { href: string; label: string; icon: ReactNode };

const BURTON_NAV: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/admin/leads",
    label: "Quote leads",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 4h16v12H5.17L4 17.17V4z" />
        <line x1="8" y1="9" x2="16" y2="9" />
        <line x1="8" y1="13" x2="13" y2="13" />
      </svg>
    ),
  },
  {
    href: "/admin/customers",
    label: "Customers",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 11l-3-3-3 3" />
        <line x1="19" y1="8" x2="19" y2="16" />
      </svg>
    ),
  },
  {
    href: "/admin/catalog",
    label: "Catalog",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    href: "/admin/calibration",
    label: "Calibration recalls",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

const WEB_NAV: NavItem[] = [
  {
    href: "/admin/content",
    label: "Site content",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="12" y1="20" x2="12" y2="10" />
        <line x1="18" y1="20" x2="18" y2="4" />
        <line x1="6" y1="20" x2="6" y2="16" />
      </svg>
    ),
  },
  {
    href: "/admin/errors",
    label: "Errors",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
];

const ACCOUNT: Array<{ href: string; label: string }> = [
  { href: "/admin/account/change-password", label: "Change password" },
  { href: "/admin/account/totp-setup", label: "Two-factor (TOTP)" },
  { href: "/admin/users", label: "Users" },
];

export function AdminShell({
  session,
  badges,
  children,
}: {
  session: AdminSessionLike;
  badges?: AdminBadges;
  children: ReactNode;
}) {
  const errorCount = badges?.errors ?? 0;
  const initials = (session.fullName ?? session.email ?? "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-canvas-tint text-ink">
      <AdminSelfExclude />
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-line bg-[#0b1220] text-white">
          <Link
            href="/"
            className="block px-5 py-6 border-b border-white/10 hover:bg-white/5 transition-colors"
            aria-label="Back to the public site"
          >
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">
              Admin
            </p>
            <p className="mt-1 text-[15px] font-bold">{SITE.shortName}</p>
            <p className="mt-0.5 text-[12px] text-white/60 group-hover:text-white">
              ← bndtrentals.com
            </p>
          </Link>

          <nav className="flex-1 overflow-y-auto py-4" aria-label="Admin">
            <p className="px-5 text-[10px] font-bold uppercase tracking-widest text-white/40">
              Burton sales work
            </p>
            <ul className="mt-2 space-y-1 px-2">
              {BURTON_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] text-white/80 hover:bg-white/5 hover:text-white"
                  >
                    <span className="text-white/50">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-6 px-5 text-[10px] font-bold uppercase tracking-widest text-white/40">
              Web work
            </p>
            <ul className="mt-2 space-y-1 px-2">
              {WEB_NAV.map((item) => {
                const showBadge = item.href === "/admin/errors" && errorCount > 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] text-white/80 hover:bg-white/5 hover:text-white"
                    >
                      <span className="text-white/50">{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {showBadge && (
                        <span
                          className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] font-bold text-white"
                          aria-label={`${errorCount} unresolved error${errorCount === 1 ? "" : "s"}`}
                        >
                          {errorCount > 99 ? "99+" : errorCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <p className="mt-6 px-5 text-[10px] font-bold uppercase tracking-widest text-white/40">
              Account
            </p>
            <ul className="mt-2 space-y-1 px-2">
              {ACCOUNT.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] text-white/70 hover:bg-white/5 hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-[13px] font-bold">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-white">
                  {session.fullName ?? "Admin"}
                </p>
                <p className="truncate text-[11.5px] text-white/55">
                  {session.email}
                </p>
              </div>
            </div>
            <AdminLogoutButton />
          </div>
        </aside>

        {/* Main */}
        <main id="main" className="flex-1 min-w-0">
          {/* Mobile top bar */}
          <div className="lg:hidden border-b border-line bg-white px-5 py-3 flex items-center justify-between">
            <Link
              href="/"
              className="text-[14px] font-bold text-ink hover:text-brand"
              aria-label="Back to the public site"
            >
              ← {SITE.shortName} admin
            </Link>
            <AdminLogoutButton compact />
          </div>

          <div className="px-5 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
