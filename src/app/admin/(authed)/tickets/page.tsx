import type { Metadata } from "next";
import { getAdminSession } from "@/lib/auth/session";
import { fetchMasterTickets } from "@/lib/master-api";
import { NewTicketForm } from "./NewTicketForm";

export const metadata: Metadata = {
  title: "Support tickets",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Portal ticket statuses → badge colors (mirrors the leads inbox pattern).
const STATUS_BADGE: Record<string, string> = {
  new: "bg-accent/10 text-accent ring-1 ring-accent/20",
  triaged: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  in_progress: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200",
  needs_estimate: "bg-violet-100 text-violet-700 ring-1 ring-violet-200",
  awaiting_approval: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  waiting_on_client: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  resolved: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  closed: "bg-slate-200 text-slate-700 ring-1 ring-slate-300",
};

const CATEGORY_LABEL: Record<string, string> = {
  quick_change: "Quick change",
  feature: "New feature",
  bug: "Something's broken",
  not_sure: "Not sure",
};

function fmtDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function TicketsPage() {
  const session = await getAdminSession();
  const result = await fetchMasterTickets({
    actorUserId: session.userId ?? "unknown",
    limit: 100,
  });

  return (
    <div>
      <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
        Mako support
      </p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-bold">Support tickets</h1>
      <p className="mt-2 max-w-2xl text-[14.5px] text-muted">
        Need a site change, spotted a problem, or want a new feature? File a
        ticket and the Mako team picks it up — you&apos;ll see the status change
        here as it&apos;s worked.
      </p>

      <div className="mt-6">
        <NewTicketForm />
      </div>

      <div className="mt-8">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">
          Your tickets
        </h2>

        {!result.ok ? (
          <div
            role="alert"
            className="mt-3 rounded-xl border border-accent/40 bg-accent/5 p-5"
          >
            <p className="font-bold text-accent">Couldn&apos;t load tickets.</p>
            <p className="mt-1 text-[13.5px] text-muted">{result.error}</p>
          </div>
        ) : result.tickets.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
            <p className="text-[15px] font-semibold">No tickets yet.</p>
            <p className="mt-2 text-[13.5px] text-muted">
              File the first one above — it lands directly with the Mako team.
            </p>
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {result.tickets.map((t) => (
              <li
                key={t.id}
                className="rounded-2xl border border-line bg-white p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-bold uppercase tracking-wider ${
                      STATUS_BADGE[t.status] ?? STATUS_BADGE.new
                    }`}
                  >
                    {t.status.replace(/_/g, " ")}
                  </span>
                  {t.priority === "high" && (
                    <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-[11.5px] font-bold uppercase tracking-wider text-rose-700 ring-1 ring-rose-200">
                      high priority
                    </span>
                  )}
                  <span className="text-[12px] text-muted-soft">
                    {CATEGORY_LABEL[t.category] ?? t.category}
                  </span>
                  <span className="ml-auto text-[12px] text-muted-soft">
                    {fmtDate(t.created_at)}
                  </span>
                </div>
                <p className="mt-2 text-[15.5px] font-bold text-ink">{t.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed text-muted">
                  {t.description}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
