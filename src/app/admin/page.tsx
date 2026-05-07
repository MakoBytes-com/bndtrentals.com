import type { Metadata } from "next";
import Link from "next/link";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

async function getDashboardCounts() {
  const supa = getAdminSupabase();
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [leadsAll, leadsNew, leadsRecent, productsCount, recallsDue, recallsOverdue] =
    await Promise.all([
      supa.from("quote_leads").select("*", { count: "exact", head: true }),
      supa
        .from("quote_leads")
        .select("*", { count: "exact", head: true })
        .eq("status", "new"),
      supa
        .from("quote_leads")
        .select("*", { count: "exact", head: true })
        .gte("created_at", since30),
      supa.from("catalog_products").select("*", { count: "exact", head: true }),
      supa
        .from("calibration_recalls")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "reminded"])
        .lte(
          "due_date",
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        ),
      supa
        .from("calibration_recalls")
        .select("*", { count: "exact", head: true })
        .eq("status", "overdue"),
    ]);

  return {
    leadsAll: leadsAll.count ?? 0,
    leadsNew: leadsNew.count ?? 0,
    leadsRecent: leadsRecent.count ?? 0,
    productsCount: productsCount.count ?? 0,
    recallsDue: recallsDue.count ?? 0,
    recallsOverdue: recallsOverdue.count ?? 0,
  };
}

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  const counts = await getDashboardCounts();

  const tiles: Array<{
    href: string;
    label: string;
    value: number;
    sub: string;
    accent?: boolean;
  }> = [
    {
      href: "/admin/leads",
      label: "New quote leads",
      value: counts.leadsNew,
      sub: `${counts.leadsRecent} in the last 30 days`,
      accent: counts.leadsNew > 0,
    },
    {
      href: "/admin/leads",
      label: "All quote leads",
      value: counts.leadsAll,
      sub: "All time",
    },
    {
      href: "/admin/calibration",
      label: "Recalls due ≤ 30 days",
      value: counts.recallsDue,
      sub: `${counts.recallsOverdue} overdue`,
      accent: counts.recallsOverdue > 0,
    },
    {
      href: "/admin/catalog",
      label: "Catalog products",
      value: counts.productsCount,
      sub: "Across 7 categories",
    },
  ];

  const firstName = (session.fullName ?? "").split(" ")[0];

  return (
    <div>
      <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
        Dashboard
      </p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-bold">
        {firstName ? `Welcome back, ${firstName}.` : "Welcome back."}
      </h1>
      <p className="mt-2 text-[14.5px] text-muted">
        Quick view of what needs attention. Open any tile for the full list.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <Link
            key={t.label + t.href}
            href={t.href}
            className={`group block rounded-2xl border bg-white p-5 transition-all hover:shadow-md ${
              t.accent
                ? "border-accent/40 ring-1 ring-accent/20 hover:border-accent"
                : "border-line hover:border-brand"
            }`}
          >
            <p className="text-[12px] font-bold uppercase tracking-widest text-muted">
              {t.label}
            </p>
            <p className={`mt-2 text-4xl font-bold tabular-nums ${t.accent ? "text-accent" : "text-ink"}`}>
              {t.value}
            </p>
            <p className="mt-1 text-[13px] text-muted-soft">{t.sub}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-line bg-white p-6">
        <h2 className="text-lg font-bold">Getting started</h2>
        <ul className="mt-4 space-y-3 text-[14.5px] text-ink-soft">
          <li className="flex items-start gap-3">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
            New quote leads land in <Link href="/admin/leads" className="font-semibold text-brand hover:text-brand-dark">Quote leads</Link> automatically — both customer-facing email confirmation and your inbox notification go out, but the lead is durable here even if email fails.
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
            Calibration recalls feed scheduled email reminders to customers (Phase 4 — Vercel Cron).
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
            Catalog edits write directly to the live database; the public site reads the same rows.
          </li>
        </ul>
      </div>
    </div>
  );
}
