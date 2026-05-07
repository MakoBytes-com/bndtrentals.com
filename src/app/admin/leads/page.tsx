import type { Metadata } from "next";
import Link from "next/link";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { QuoteLeadStatus } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Quote leads",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_TABS: Array<{ key: QuoteLeadStatus | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "in_progress", label: "In progress" },
  { key: "quoted", label: "Quoted" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
  { key: "spam", label: "Spam" },
];

const STATUS_BADGE: Record<QuoteLeadStatus, string> = {
  new: "bg-accent/10 text-accent ring-1 ring-accent/20",
  in_progress: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  quoted: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200",
  won: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  lost: "bg-slate-200 text-slate-700 ring-1 ring-slate-300",
  spam: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
};

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

type SearchParams = Promise<{ status?: string; q?: string }>;

export default async function LeadsListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status = (params.status ?? "all") as QuoteLeadStatus | "all";
  const search = (params.q ?? "").trim();

  const supa = getAdminSupabase();
  let q = supa
    .from("quote_leads")
    .select("id,ordered_by,company,email,phone,status,cart,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status !== "all") q = q.eq("status", status);
  if (search) {
    // Simple ilike across the most useful columns.
    q = q.or(
      `email.ilike.%${search}%,company.ilike.%${search}%,ordered_by.ilike.%${search}%`,
    );
  }

  const { data: leads, error } = await q;
  if (error) {
    return (
      <div className="rounded-xl border border-accent/40 bg-accent/5 p-5">
        <p className="font-bold text-accent">Could not load leads.</p>
        <p className="mt-1 text-[13px] text-muted">{error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
        Quote leads
      </p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-bold">Inbox</h1>
      <p className="mt-2 text-[14.5px] text-muted">
        Showing the most recent {leads?.length ?? 0} request{leads?.length === 1 ? "" : "s"}.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => {
          const href = t.key === "all" ? "/admin/leads" : `/admin/leads?status=${t.key}`;
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

      <form action="/admin/leads" method="get" className="mt-4 flex gap-2 max-w-md">
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <input
          type="search"
          name="q"
          placeholder="Search email / company / name…"
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
        {leads && leads.length > 0 ? (
          <table className="w-full text-[14px]">
            <thead className="bg-canvas-tint text-[12px] font-bold uppercase tracking-widest text-muted">
              <tr>
                <th className="px-5 py-3 text-left">Contact</th>
                <th className="px-5 py-3 text-left">Items</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {leads.map((lead) => {
                const cartArr = Array.isArray(lead.cart) ? lead.cart : [];
                const totalUnits = cartArr.reduce(
                  (n, i) => n + (typeof i.quantity === "number" ? i.quantity : 0),
                  0,
                );
                return (
                  <tr key={lead.id} className="hover:bg-canvas-tint/50">
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="block font-semibold text-ink hover:text-brand"
                      >
                        {lead.ordered_by || lead.email}
                      </Link>
                      <p className="text-[12.5px] text-muted">
                        {lead.company ? `${lead.company} · ` : ""}
                        {lead.email}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {cartArr.length === 0
                        ? "—"
                        : `${cartArr.length} item${cartArr.length === 1 ? "" : "s"} / ${totalUnits} unit${totalUnits === 1 ? "" : "s"}`}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-bold uppercase tracking-wider ${STATUS_BADGE[lead.status as QuoteLeadStatus]}`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-[12.5px] text-muted">
                      {formatRelative(lead.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="text-[15px] font-semibold">No leads in this view.</p>
            <p className="mt-2 text-[13.5px] text-muted">
              {status === "all"
                ? "Submissions from the public quote form land here automatically."
                : "Try a different status tab."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
