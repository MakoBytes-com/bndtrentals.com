import type { Metadata } from "next";
import Link from "next/link";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { QuoteLead } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  in_progress: "In progress",
  quoted: "Quoted",
  won: "Won",
  lost: "Lost",
  spam: "Spam",
};

export default async function AnalyticsPage() {
  const supa = getAdminSupabase();

  const sevenAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const thirtyAgo = new Date(Date.now() - 30 * 86400_000).toISOString();
  const ninetyAgo = new Date(Date.now() - 90 * 86400_000).toISOString();
  const todayDate = new Date().toISOString().slice(0, 10);
  const in30Date = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);

  // Lead funnel + counts.
  const [
    leadsTotal,
    leads7,
    leads30,
    leads90,
    leadsByStatusRows,
    recentLeads,
    cartLeads,
  ] = await Promise.all([
    supa.from("quote_leads").select("*", { count: "exact", head: true }),
    supa
      .from("quote_leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenAgo),
    supa
      .from("quote_leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyAgo),
    supa
      .from("quote_leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", ninetyAgo),
    supa
      .from("quote_leads")
      .select("status")
      .gte("created_at", ninetyAgo),
    supa
      .from("quote_leads")
      .select("id, ordered_by, company, email, status, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    // Pull all 90-day leads with cart for the top-products tally.
    supa
      .from("quote_leads")
      .select("cart, status")
      .gte("created_at", ninetyAgo),
  ]);

  // Lead status distribution over the last 90 days.
  const statusCounts = new Map<string, number>();
  for (const r of leadsByStatusRows.data ?? []) {
    statusCounts.set(r.status, (statusCounts.get(r.status) ?? 0) + 1);
  }
  const totalForFunnel =
    Array.from(statusCounts.values()).reduce((n, v) => n + v, 0) || 1;
  const conversionWon =
    statusCounts.get("won") ?? 0;
  const wonPct = ((conversionWon / totalForFunnel) * 100).toFixed(1);

  // Top requested products (by appearance in cart JSON across last 90 days).
  const productHits = new Map<string, { name: string; qty: number }>();
  for (const row of cartLeads.data ?? []) {
    if (row.status === "spam") continue;
    const cart = (row as Pick<QuoteLead, "cart">).cart ?? [];
    for (const item of cart) {
      const key = item.productSlug;
      if (!key) continue;
      const prev = productHits.get(key);
      if (prev) {
        prev.qty += item.quantity ?? 1;
      } else {
        productHits.set(key, {
          name: item.productName ?? key,
          qty: item.quantity ?? 1,
        });
      }
    }
  }
  const topProducts = Array.from(productHits.entries())
    .map(([slug, v]) => ({ slug, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);
  const topMax = topProducts[0]?.qty ?? 1;

  // Calibration pipeline.
  const [recallsTotal, recallsDue30, recallsOverdue, recallsDone30] =
    await Promise.all([
      supa
        .from("calibration_recalls")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "reminded"]),
      supa
        .from("calibration_recalls")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "reminded"])
        .lte("due_date", in30Date)
        .gte("due_date", todayDate),
      supa
        .from("calibration_recalls")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "reminded", "overdue"])
        .lt("due_date", todayDate),
      supa
        .from("calibration_recalls")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed")
        .gte("completed_at", thirtyAgo),
    ]);

  // Catalog overview.
  const [catalogProductsAll, catalogProductsPub, catalogCats] = await Promise.all([
    supa.from("catalog_products").select("*", { count: "exact", head: true }),
    supa
      .from("catalog_products")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true),
    supa.from("catalog_categories").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div>
      <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
        Analytics
      </p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-bold">Operations dashboard</h1>
      <p className="mt-2 text-[14.5px] text-muted">
        Pulled live from bndt-prod. Visitor traffic + Core Web Vitals are in
        the Vercel Analytics dashboard (linked at the bottom).
      </p>

      {/* Lead activity */}
      <section className="mt-8">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">
          Quote leads
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Tile label="Total all-time" value={leadsTotal.count ?? 0} />
          <Tile label="Last 7 days" value={leads7.count ?? 0} accent={(leads7.count ?? 0) > 0} />
          <Tile label="Last 30 days" value={leads30.count ?? 0} />
          <Tile label="Last 90 days" value={leads90.count ?? 0} />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {/* Funnel by status */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="text-[11.5px] font-bold uppercase tracking-widest text-muted">
              Lead status — last 90 days
            </p>
            <ul className="mt-4 space-y-3">
              {(["new", "in_progress", "quoted", "won", "lost", "spam"] as const).map(
                (s) => {
                  const count = statusCounts.get(s) ?? 0;
                  const pct = (count / totalForFunnel) * 100;
                  const color =
                    s === "won"
                      ? "bg-emerald-500"
                      : s === "lost"
                        ? "bg-slate-400"
                        : s === "spam"
                          ? "bg-rose-400"
                          : s === "quoted"
                            ? "bg-indigo-400"
                            : s === "in_progress"
                              ? "bg-blue-400"
                              : "bg-accent";
                  return (
                    <li key={s} className="text-[13px]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-ink">{STATUS_LABEL[s]}</span>
                        <span className="tabular-nums text-muted">
                          {count} <span className="text-muted-soft">({pct.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-canvas-tint overflow-hidden">
                        <div
                          className={`h-full rounded-full ${color}`}
                          style={{ width: `${Math.max(pct, count > 0 ? 2 : 0)}%` }}
                        />
                      </div>
                    </li>
                  );
                },
              )}
            </ul>
            <p className="mt-5 text-[12.5px] text-muted-soft">
              <strong className="text-ink">Conversion to won:</strong> {wonPct}% over
              the last 90 days.
            </p>
          </div>

          {/* Top products */}
          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="text-[11.5px] font-bold uppercase tracking-widest text-muted">
              Top requested products — last 90 days
            </p>
            {topProducts.length === 0 ? (
              <p className="mt-4 text-[13.5px] text-muted">
                No cart items in any leads yet.
              </p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {topProducts.map((p, i) => {
                  const pct = (p.qty / topMax) * 100;
                  return (
                    <li key={p.slug} className="text-[13px]">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="w-5 text-right tabular-nums text-muted-soft">
                            {i + 1}.
                          </span>
                          <span className="truncate font-semibold text-ink">{p.name}</span>
                        </span>
                        <span className="tabular-nums text-muted shrink-0">{p.qty}×</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-canvas-tint overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Calibration */}
      <section className="mt-10">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">
          Calibration pipeline
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Tile label="Active recalls" value={recallsTotal.count ?? 0} />
          <Tile
            label="Due in 30 days"
            value={recallsDue30.count ?? 0}
            accent={(recallsDue30.count ?? 0) > 0}
          />
          <Tile
            label="Overdue"
            value={recallsOverdue.count ?? 0}
            accent={(recallsOverdue.count ?? 0) > 0}
          />
          <Tile
            label="Completed last 30 days"
            value={recallsDone30.count ?? 0}
          />
        </div>
      </section>

      {/* Catalog */}
      <section className="mt-10">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">
          Catalog
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Tile label="Products total" value={catalogProductsAll.count ?? 0} />
          <Tile label="Published" value={catalogProductsPub.count ?? 0} />
          <Tile
            label="Hidden"
            value={(catalogProductsAll.count ?? 0) - (catalogProductsPub.count ?? 0)}
          />
          <Tile label="Categories" value={catalogCats.count ?? 0} />
        </div>
      </section>

      {/* Recent leads */}
      <section className="mt-10">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">
          Recent leads
        </h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-white">
          {recentLeads.data && recentLeads.data.length > 0 ? (
            <table className="w-full text-[14px]">
              <thead className="bg-canvas-tint text-[12px] font-bold uppercase tracking-widest text-muted">
                <tr>
                  <th className="px-5 py-3 text-left">Contact</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentLeads.data.map((l) => (
                  <tr key={l.id}>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/leads/${l.id}`}
                        className="block font-semibold text-ink hover:text-brand"
                      >
                        {l.ordered_by || l.email}
                      </Link>
                      <p className="text-[12px] text-muted-soft">
                        {l.company ? `${l.company} · ` : ""}
                        {l.email}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-[12.5px] text-muted">
                      {STATUS_LABEL[l.status] ?? l.status}
                    </td>
                    <td className="px-5 py-3.5 text-right text-[12.5px] text-muted">
                      {fmtRelative(l.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-10 text-center text-[14px] text-muted">
              No leads yet.
            </div>
          )}
        </div>
      </section>

      {/* Out-link to Vercel */}
      <section className="mt-10 rounded-2xl border border-line bg-canvas-tint p-6">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">
          Traffic & Core Web Vitals
        </h2>
        <p className="mt-3 text-[14.5px] text-ink-soft">
          Visitor counts, page views, referrers, top countries, and Core Web
          Vitals (LCP / INP / CLS) live in Vercel&apos;s dashboard for the
          bndt-showcase project. They&apos;re measured client-side via{" "}
          <code className="font-mono">@vercel/analytics</code> and{" "}
          <code className="font-mono">@vercel/speed-insights</code> — already
          wired into every page since Phase 0.
        </p>
        <a
          href="https://vercel.com/mako-studi/bndt-showcase/analytics"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[14px] font-bold text-white hover:bg-ink-soft"
        >
          Open Vercel Analytics
          <span className="sr-only"> (opens in new tab)</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 17L17 7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </a>
      </section>
    </div>
  );
}

function Tile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 ${
        accent
          ? "border-accent/40 ring-1 ring-accent/20"
          : "border-line"
      }`}
    >
      <p className="text-[12px] font-bold uppercase tracking-widest text-muted">
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-bold tabular-nums ${
          accent ? "text-accent" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
