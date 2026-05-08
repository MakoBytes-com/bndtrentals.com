import type { Metadata } from "next";
import Link from "next/link";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { ErrorEvent } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Errors",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

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

type SearchParams = Promise<{ filter?: string; page?: string }>;

export default async function ErrorsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const filter = params.filter ?? "unresolved";
  const pageNum = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const supa = getAdminSupabase();
  const from = (pageNum - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = supa
    .from("error_events")
    .select("*", { count: "exact" })
    .order("occurred_at", { ascending: false })
    .range(from, to);
  if (filter === "unresolved") q = q.is("resolved_at", null);
  if (filter === "resolved") q = q.not("resolved_at", "is", null);

  const { data, error, count } = await q;
  if (error) {
    return (
      <div className="rounded-xl border border-accent/40 bg-accent/5 p-5">
        <p className="font-bold text-accent">Could not load error events.</p>
        <p className="mt-1 text-[13px] text-muted">{error.message}</p>
      </div>
    );
  }
  const rows = (data ?? []) as ErrorEvent[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Group by fingerprint to show occurrences alongside latest.
  const groups = new Map<
    string,
    { latest: ErrorEvent; occurrences: number }
  >();
  for (const r of rows) {
    const g = groups.get(r.fingerprint);
    if (!g) groups.set(r.fingerprint, { latest: r, occurrences: 1 });
    else g.occurrences += 1;
  }
  const grouped = [...groups.values()].sort(
    (a, b) =>
      new Date(b.latest.occurred_at).getTime() -
      new Date(a.latest.occurred_at).getTime(),
  );

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
            Errors
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold">Runtime errors</h1>
          <p className="mt-2 text-[14.5px] text-muted">
            Server-side exceptions, email send failures, and React error
            boundary catches. Grouped by fingerprint so the same error from
            many requests collapses into one row. Sentry mirrors these too if
            <code className="font-mono mx-1">SENTRY_DSN</code>is set.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            { key: "unresolved", label: "Unresolved" },
            { key: "all", label: "All" },
            { key: "resolved", label: "Resolved" },
          ] as const
        ).map((t) => {
          const active = filter === t.key;
          const href = t.key === "unresolved" ? "/admin/errors" : `/admin/errors?filter=${t.key}`;
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

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
        {grouped.length > 0 ? (
          <table className="w-full text-[14px]">
            <thead className="bg-canvas-tint text-[12px] font-bold uppercase tracking-widest text-muted">
              <tr>
                <th className="px-5 py-3 text-left">Module / message</th>
                <th className="px-5 py-3 text-left">Level</th>
                <th className="px-5 py-3 text-right">Occurrences</th>
                <th className="px-5 py-3 text-right">Last seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {grouped.map(({ latest, occurrences }) => (
                <tr key={latest.id} className="hover:bg-canvas-tint/50">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/admin/errors/${latest.id}`}
                      className="block font-mono text-[12.5px] text-ink hover:text-brand"
                    >
                      {latest.module}
                    </Link>
                    <p className="mt-1 text-[13px] text-muted truncate max-w-xl">
                      {latest.message}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-bold uppercase tracking-wider ${
                        latest.level === "error"
                          ? "bg-rose-100 text-rose-700 ring-1 ring-rose-200"
                          : "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
                      }`}
                    >
                      {latest.level}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-ink">
                    {occurrences}
                  </td>
                  <td className="px-5 py-3.5 text-right text-[12.5px] text-muted">
                    {fmtRelative(latest.occurred_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="text-[15px] font-semibold">No errors in this view.</p>
            <p className="mt-2 text-[13.5px] text-muted">
              {filter === "unresolved"
                ? "Nothing to triage. Either everything's fine or no errors have been logged yet."
                : "Try a different filter."}
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
                href={`/admin/errors?filter=${filter}&page=${pageNum - 1}`}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-4 py-1.5 font-semibold text-ink hover:bg-canvas-tint"
              >
                ← Previous
              </Link>
            ) : null}
            {pageNum < totalPages ? (
              <Link
                href={`/admin/errors?filter=${filter}&page=${pageNum + 1}`}
                className="inline-flex items-center gap-1 rounded-full bg-brand px-4 py-1.5 font-semibold text-white hover:bg-brand-dark"
              >
                Next →
              </Link>
            ) : null}
          </div>
        </nav>
      )}
    </div>
  );
}
