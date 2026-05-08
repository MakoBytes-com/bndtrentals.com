import type { Metadata } from "next";
import Link from "next/link";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getAnalyticsSnapshot } from "@/lib/analytics/queries";
import { TrafficChart } from "./AnalyticsCharts";
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

  // In-house web analytics (page_views + analytics_events) over the last
  // 30 days. Same fleet pattern used on bishopbend / makobot.
  const traffic = await getAnalyticsSnapshot();
  const refMax =
    traffic.topReferrers.named[0]?.count ??
    Math.max(traffic.topReferrers.direct, 1);
  const pageMax = traffic.topPages[0]?.count ?? 1;

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

      {/* Web traffic — in-house */}
      <section className="mt-10">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">
          Web traffic — last 30 days
        </h2>
        <p className="mt-2 text-[13px] text-muted-soft">
          Pulled live from Burton&apos;s own page_views + analytics_events
          tables. Bots are filtered server-side via the isbot package; admin
          browsers self-exclude via localStorage. /admin/* paths are dropped
          from public-traffic numbers.
        </p>

        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Tile label="Page views" value={traffic.totals.views} />
          <Tile label="Unique sessions" value={traffic.totals.sessions} />
          <Tile label="Tracked events" value={traffic.totals.events} />
          <Tile
            label="Top referrer"
            value={traffic.topReferrers.named[0]?.count ?? 0}
            suffix={traffic.topReferrers.named[0]?.source ?? "—"}
          />
        </div>

        {/* Daily traffic — Recharts line chart, fleet-standard.
            Always render the chart frame (even with all-zero days) so the
            dashboard looks the same before and after traffic lands. */}
        <div className="mt-6 rounded-2xl border border-line bg-white p-5">
          <h3 className="mb-1 text-[14px] font-semibold text-ink">
            Site traffic — last 30 days
          </h3>
          {!traffic.hasAnyData && (
            <p className="mb-4 text-[12.5px] text-muted">
              Collecting data. Open{" "}
              <a
                href="https://bndt-showcase.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand underline-offset-2 hover:underline"
              >
                the public site
              </a>{" "}
              in a different browser (or incognito) — your admin browser
              auto-excludes itself via the <code className="font-mono">mako_no_track</code>{" "}
              localStorage flag. First row should appear within seconds.
            </p>
          )}
          <TrafficChart data={traffic.daily} />
        </div>

        {traffic.hasAnyData && (
          <>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {/* Top pages */}
              <div className="rounded-2xl border border-line bg-white p-5">
                <p className="text-[11.5px] font-bold uppercase tracking-widest text-muted">
                  Top pages
                </p>
                {traffic.topPages.length === 0 ? (
                  <p className="mt-4 text-[13.5px] text-muted">No pageviews yet.</p>
                ) : (
                  <ul className="mt-4 space-y-2.5">
                    {traffic.topPages.map((p) => {
                      const pct = (p.count / pageMax) * 100;
                      return (
                        <li key={p.path} className="text-[13px]">
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate font-mono text-[12.5px] text-ink">
                              {p.path}
                            </span>
                            <span className="tabular-nums text-muted shrink-0">
                              {p.count}
                            </span>
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

              {/* Top referrers */}
              <div className="rounded-2xl border border-line bg-white p-5">
                <p className="text-[11.5px] font-bold uppercase tracking-widest text-muted">
                  Top referrers
                </p>
                {traffic.topReferrers.named.length === 0 &&
                traffic.topReferrers.direct === 0 ? (
                  <p className="mt-4 text-[13.5px] text-muted">No referrers tracked yet.</p>
                ) : (
                  <ul className="mt-4 space-y-2.5">
                    {traffic.topReferrers.named.map((r) => {
                      const pct = (r.count / refMax) * 100;
                      return (
                        <li key={r.source} className="text-[13px]">
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate font-semibold text-ink">{r.source}</span>
                            <span className="tabular-nums text-muted shrink-0">{r.count}</span>
                          </div>
                          <div className="mt-1 h-2 rounded-full bg-canvas-tint overflow-hidden">
                            <div
                              className="h-full rounded-full bg-accent"
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                    {traffic.topReferrers.direct > 0 && (
                      <li className="text-[13px] pt-2 border-t border-line">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-muted">Direct / unknown</span>
                          <span className="tabular-nums text-muted shrink-0">
                            {traffic.topReferrers.direct}
                          </span>
                        </div>
                      </li>
                    )}
                  </ul>
                )}
              </div>

              {/* Top countries */}
              <div className="rounded-2xl border border-line bg-white p-5">
                <p className="text-[11.5px] font-bold uppercase tracking-widest text-muted">
                  Top countries
                </p>
                {traffic.topCountries.length === 0 ? (
                  <p className="mt-4 text-[13.5px] text-muted">
                    Country data populates in production once Vercel routes through edge.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {traffic.topCountries.map((c) => (
                      <li
                        key={c.code}
                        className="flex items-center justify-between text-[13.5px]"
                      >
                        <span className="font-semibold text-ink">{c.name}</span>
                        <span className="tabular-nums text-muted">{c.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Top events */}
              <div className="rounded-2xl border border-line bg-white p-5">
                <p className="text-[11.5px] font-bold uppercase tracking-widest text-muted">
                  Top events
                </p>
                {traffic.topEvents.length === 0 ? (
                  <p className="mt-4 text-[13.5px] text-muted">
                    No tracked events yet. Wire <code className="font-mono">track()</code>{" "}
                    calls into CTA buttons to see conversions here.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {traffic.topEvents.map((e) => (
                      <li
                        key={e.name}
                        className="flex items-center justify-between text-[13.5px]"
                      >
                        <span className="truncate font-semibold text-ink">{e.name}</span>
                        <span className="tabular-nums text-muted shrink-0">{e.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Tile({
  label,
  value,
  accent,
  suffix,
}: {
  label: string;
  value: number;
  accent?: boolean;
  suffix?: string;
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
      {suffix && (
        <p className="mt-1 truncate text-[12.5px] text-muted-soft">{suffix}</p>
      )}
    </div>
  );
}
