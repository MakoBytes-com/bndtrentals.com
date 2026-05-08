import type { Metadata } from "next";
import Link from "next/link";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { CustomerStatus } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Customers",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const STATUS_BADGE: Record<CustomerStatus, string> = {
  active: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  prospect: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  inactive: "bg-slate-200 text-slate-700 ring-1 ring-slate-300",
  do_not_contact: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
};

const STATUS_TABS: Array<{ key: CustomerStatus | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "prospect", label: "Prospect" },
  { key: "inactive", label: "Inactive" },
  { key: "do_not_contact", label: "Do not contact" },
];

function fmtRelative(iso: string | null): string {
  if (!iso) return "—";
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

type SearchParams = Promise<{ q?: string; status?: string; page?: string }>;

export default async function CustomersListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const search = (params.q ?? "").trim();
  const status = (params.status ?? "all") as CustomerStatus | "all";
  const pageNum = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const supa = getAdminSupabase();
  const from = (pageNum - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = supa
    .from("customers")
    .select(
      "id, email, full_name, company, phone, status, source, last_contact_at, created_at",
      { count: "exact" },
    )
    .order("last_contact_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status !== "all") q = q.eq("status", status);
  if (search) {
    q = q.or(
      `email.ilike.%${search}%,full_name.ilike.%${search}%,company.ilike.%${search}%,phone.ilike.%${search}%`,
    );
  }

  const { data: rows, error, count } = await q;
  if (error) {
    return (
      <div className="rounded-xl border border-accent/40 bg-accent/5 p-5">
        <p className="font-bold text-accent">Could not load customers.</p>
        <p className="mt-1 text-[13px] text-muted">{error.message}</p>
      </div>
    );
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showingFrom = total === 0 ? 0 : from + 1;
  const showingTo = Math.min(from + (rows?.length ?? 0), total);

  function pageUrl(p: number) {
    const sp = new URLSearchParams();
    if (status !== "all") sp.set("status", status);
    if (search) sp.set("q", search);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/admin/customers${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
            Customers
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold">People & companies</h1>
          <p className="mt-2 text-[14.5px] text-muted">
            {total > 0 ? (
              <>
                Showing <strong className="text-ink">{showingFrom}–{showingTo}</strong>{" "}
                of <strong className="text-ink">{total}</strong>. Click any row
                to view history and edit.
              </>
            ) : (
              <>No customers yet.</>
            )}
          </p>
        </div>
        <Link
          href="/admin/customers/new"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[14px] font-bold text-white hover:bg-accent-dark"
        >
          + New customer
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => {
          const href = t.key === "all" ? "/admin/customers" : `/admin/customers?status=${t.key}`;
          const active = status === t.key;
          return (
            <Link
              key={t.key}
              href={href}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                active
                  ? "bg-ink text-white"
                  : "bg-white text-muted hover:bg-canvas-tint hover:text-ink ring-1 ring-line"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <form action="/admin/customers" method="get" className="mt-4 flex gap-2 max-w-xl">
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <input
          type="search"
          name="q"
          placeholder="Search email / name / company / phone…"
          defaultValue={search}
          className="flex-1 rounded-lg border border-line bg-white px-3.5 py-2 text-[14px] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand px-4 py-2 text-[14px] font-semibold text-white hover:bg-brand-dark"
        >
          Search
        </button>
      </form>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
        {rows && rows.length > 0 ? (
          <table className="w-full text-[14px]">
            <thead className="bg-canvas-tint text-[12px] font-bold uppercase tracking-widest text-muted">
              <tr>
                <th className="px-5 py-3 text-left">Customer</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Source</th>
                <th className="px-5 py-3 text-right">Last contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-canvas-tint/50">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="block font-semibold text-ink hover:text-brand"
                    >
                      {c.full_name || c.email}
                    </Link>
                    <p className="text-[12.5px] text-muted-soft">
                      {c.company ? `${c.company} · ` : ""}
                      {c.email}
                      {c.phone ? ` · ${c.phone}` : ""}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-bold uppercase tracking-wider ${STATUS_BADGE[c.status as CustomerStatus]}`}
                    >
                      {c.status === "do_not_contact" ? "DNC" : c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[12.5px] text-muted">
                    {c.source ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right text-[12.5px] text-muted">
                    {fmtRelative(c.last_contact_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="text-[15px] font-semibold">No customers in this view.</p>
            <p className="mt-2 text-[13.5px] text-muted">
              Try a different status tab or clear the search.
            </p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-3 text-[13px]"
        >
          <p className="text-muted">
            Page <strong className="text-ink">{pageNum}</strong> of {totalPages}
          </p>
          <div className="flex gap-2">
            {pageNum > 1 ? (
              <Link
                href={pageUrl(pageNum - 1)}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-4 py-1.5 font-semibold text-ink hover:bg-canvas-tint"
              >
                ← Previous
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas-tint px-4 py-1.5 font-semibold text-muted-soft opacity-60">
                ← Previous
              </span>
            )}
            {pageNum < totalPages ? (
              <Link
                href={pageUrl(pageNum + 1)}
                className="inline-flex items-center gap-1 rounded-full bg-brand px-4 py-1.5 font-semibold text-white hover:bg-brand-dark"
              >
                Next →
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas-tint px-4 py-1.5 font-semibold text-muted-soft opacity-60">
                Next →
              </span>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
