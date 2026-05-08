import type { Metadata } from "next";
import Link from "next/link";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { CalibrationRecallStatus } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Calibration recalls",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type ViewKey =
  | "all"
  | "active"
  | "due-30"
  | "overdue"
  | "completed"
  | "cancelled";

const TABS: Array<{ key: ViewKey; label: string }> = [
  { key: "active", label: "Active" },
  { key: "due-30", label: "Due ≤ 30d" },
  { key: "overdue", label: "Overdue" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All" },
];

const STATUS_BADGE: Record<CalibrationRecallStatus, string> = {
  pending: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  reminded: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200",
  overdue: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
  completed: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  cancelled: "bg-slate-200 text-slate-700 ring-1 ring-slate-300",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function daysFromToday(iso: string): number {
  const due = new Date(iso + "T00:00:00").getTime();
  const today = new Date().setHours(0, 0, 0, 0);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

type SearchParams = Promise<{ view?: string; q?: string }>;

export default async function CalibrationListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const view = (params.view ?? "active") as ViewKey;
  const search = (params.q ?? "").trim();

  const supa = getAdminSupabase();
  let q = supa
    .from("calibration_recalls")
    .select(
      "id,customer_email,customer_name,customer_company,equipment_ref,equipment_label,serial_number,due_date,last_calibrated,status,notification_count,notification_sent_at,created_at",
    )
    .order("due_date", { ascending: true })
    .limit(200);

  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  if (view === "active") {
    q = q.in("status", ["pending", "reminded", "overdue"]);
  } else if (view === "due-30") {
    q = q.in("status", ["pending", "reminded"]).lte("due_date", in30);
  } else if (view === "overdue") {
    q = q.eq("status", "overdue").or(`status.eq.pending,status.eq.reminded`).lt("due_date", today);
  } else if (view === "completed") {
    q = q.eq("status", "completed");
  } else if (view === "cancelled") {
    q = q.eq("status", "cancelled");
  }
  if (search) {
    q = q.or(
      `customer_email.ilike.%${search}%,customer_name.ilike.%${search}%,customer_company.ilike.%${search}%,equipment_ref.ilike.%${search}%,equipment_label.ilike.%${search}%,serial_number.ilike.%${search}%`,
    );
  }

  const { data: rows, error } = await q;
  if (error) {
    return (
      <div className="rounded-xl border border-accent/40 bg-accent/5 p-5">
        <p className="font-bold text-accent">Could not load recalls.</p>
        <p className="mt-1 text-[13px] text-muted">{error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
            Calibration
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold">Recalls</h1>
          <p className="mt-2 text-[14.5px] text-muted">
            {rows?.length ?? 0} record{rows?.length === 1 ? "" : "s"} in this view.
          </p>
        </div>
        <Link
          href="/admin/calibration/new"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[14px] font-bold text-white hover:bg-accent-dark"
        >
          + New recall
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const href =
            t.key === "active" ? "/admin/calibration" : `/admin/calibration?view=${t.key}`;
          const active = view === t.key;
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

      <form action="/admin/calibration" method="get" className="mt-4 flex gap-2 max-w-xl">
        {view !== "active" && <input type="hidden" name="view" value={view} />}
        <input
          type="search"
          name="q"
          placeholder="Search customer / equipment / serial…"
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
                <th className="px-5 py-3 text-left">Customer / Equipment</th>
                <th className="px-5 py-3 text-left">Due</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Reminders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const d = daysFromToday(r.due_date);
                const dueColor =
                  d < 0 ? "text-rose-700" : d <= 7 ? "text-amber-700" : d <= 30 ? "text-ink" : "text-muted";
                return (
                  <tr key={r.id} className="hover:bg-canvas-tint/50">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/calibration/${r.id}`}
                        className="block font-semibold text-ink hover:text-brand"
                      >
                        {r.customer_name || r.customer_email}
                      </Link>
                      <p className="text-[12.5px] text-muted">
                        {r.customer_company ? `${r.customer_company} · ` : ""}
                        {r.equipment_label || r.equipment_ref}
                        {r.serial_number ? ` · S/N ${r.serial_number}` : ""}
                      </p>
                    </td>
                    <td className={`px-5 py-3.5 ${dueColor}`}>
                      <p className="font-semibold tabular-nums">{fmtDate(r.due_date)}</p>
                      <p className="text-[12.5px]">
                        {d === 0
                          ? "today"
                          : d > 0
                          ? `in ${d}d`
                          : `${Math.abs(d)}d overdue`}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-bold uppercase tracking-wider ${STATUS_BADGE[r.status as CalibrationRecallStatus]}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[12.5px] text-muted">
                      {r.notification_count > 0 ? (
                        <>
                          {r.notification_count} sent
                          {r.notification_sent_at && (
                            <p className="text-muted-soft">
                              last {fmtDate(r.notification_sent_at.slice(0, 10))}
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-soft">none yet</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="text-[15px] font-semibold">No recalls in this view.</p>
            <p className="mt-2 text-[13.5px] text-muted">
              {view === "active"
                ? "Use the New recall button to add one."
                : "Try a different filter or clear search."}
            </p>
          </div>
        )}
      </div>

      <p className="mt-6 text-[12.5px] text-muted-soft">
        Note: customer email reminders ship in Phase 4-B (Vercel Cron + Resend
        templates). Until then this list is the source of truth, and recalls
        are surfaced on the dashboard.
      </p>
    </div>
  );
}
