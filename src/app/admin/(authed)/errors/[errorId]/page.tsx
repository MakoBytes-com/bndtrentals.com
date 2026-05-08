import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { ErrorEvent } from "@/lib/supabase/types";
import { resolveError, unresolveError } from "../actions";

export const metadata: Metadata = {
  title: "Error detail",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function ErrorDetailPage({
  params,
}: {
  params: Promise<{ errorId: string }>;
}) {
  const { errorId } = await params;
  const supa = getAdminSupabase();
  const { data, error } = await supa
    .from("error_events")
    .select("*")
    .eq("id", errorId)
    .maybeSingle();
  if (error || !data) notFound();
  const e = data as ErrorEvent;

  // Pull other occurrences sharing this fingerprint, last 50.
  const { data: relatedData } = await supa
    .from("error_events")
    .select("id, occurred_at, path, level")
    .eq("fingerprint", e.fingerprint)
    .neq("id", e.id)
    .order("occurred_at", { ascending: false })
    .limit(50);
  const related = relatedData ?? [];

  return (
    <div>
      <Link
        href="/admin/errors"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-brand"
      >
        ← All errors
      </Link>

      <div className="mt-4">
        <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
          {e.level === "error" ? "Error" : "Warning"} · fingerprint{" "}
          <code className="font-mono">{e.fingerprint}</code>
        </p>
        <h1 className="mt-2 text-xl sm:text-2xl font-bold font-mono break-words">
          {e.module}
        </h1>
        <p className="mt-2 text-[14.5px] text-ink">{e.message}</p>
        <p className="mt-1 text-[12.5px] text-muted-soft">
          First seen here: {fmtDate(e.occurred_at)}
          {e.path && (
            <>
              {" · path "}
              <code className="font-mono">{e.path}</code>
            </>
          )}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {e.resolved_at ? (
          <>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[12.5px] font-bold text-emerald-700 ring-1 ring-emerald-200">
              Resolved {fmtDate(e.resolved_at)}
            </span>
            <form action={unresolveError.bind(null, e.id)}>
              <button
                type="submit"
                className="rounded-full border border-line bg-white px-4 py-1.5 text-[13px] font-semibold text-muted hover:bg-canvas-tint"
              >
                Mark unresolved
              </button>
            </form>
          </>
        ) : (
          <form action={resolveError.bind(null, e.id)}>
            <button
              type="submit"
              className="rounded-full bg-emerald-600 px-5 py-2 text-[13.5px] font-bold text-white hover:bg-emerald-700"
            >
              Mark resolved
            </button>
          </form>
        )}
      </div>

      {e.stack && (
        <section className="mt-8 rounded-2xl border border-line bg-white p-5">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">
            Stack trace
          </h2>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-canvas-tint p-4 text-[12.5px] font-mono text-ink whitespace-pre">
            {e.stack}
          </pre>
        </section>
      )}

      {e.context && (
        <section className="mt-4 rounded-2xl border border-line bg-white p-5">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">
            Context
          </h2>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-canvas-tint p-4 text-[12.5px] font-mono text-ink whitespace-pre">
            {JSON.stringify(e.context, null, 2)}
          </pre>
        </section>
      )}

      {e.user_agent && (
        <section className="mt-4 rounded-2xl border border-line bg-white p-5">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">
            User agent
          </h2>
          <p className="mt-3 text-[13px] font-mono text-ink break-all">{e.user_agent}</p>
        </section>
      )}

      <section className="mt-4 rounded-2xl border border-line bg-white p-5">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">
          Other occurrences ({related.length})
        </h2>
        {related.length === 0 ? (
          <p className="mt-3 text-[13.5px] text-muted">
            This is the only occurrence of this fingerprint.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {related.map((r) => (
              <li key={r.id} className="py-2 text-[13px]">
                <Link
                  href={`/admin/errors/${r.id}`}
                  className="flex items-center justify-between text-ink hover:text-brand"
                >
                  <span className="font-mono text-[12.5px]">{r.path ?? "—"}</span>
                  <span className="text-[12px] text-muted-soft">
                    {fmtDate(r.occurred_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
