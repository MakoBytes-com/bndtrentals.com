import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { CustomerEditForm } from "./CustomerEditForm";
import type {
  Customer,
  CustomerAuditLog,
  QuoteLeadStatus,
  CalibrationRecallStatus,
} from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Customer detail",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function fmtDay(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const supa = getAdminSupabase();

  const { data, error } = await supa
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .maybeSingle();
  if (error || !data) notFound();
  const c = data as Customer;

  // Pull related leads + recalls by email match + audit history.
  const [leadsRes, recallsRes, auditRes] = await Promise.all([
    supa
      .from("quote_leads")
      .select("id, status, ordered_by, created_at")
      .ilike("email", c.email)
      .order("created_at", { ascending: false })
      .limit(50),
    supa
      .from("calibration_recalls")
      .select("id, equipment_label, equipment_ref, due_date, status, serial_number")
      .ilike("customer_email", c.email)
      .order("due_date", { ascending: true })
      .limit(50),
    supa
      .from("customer_audit_log")
      .select("*")
      .eq("customer_id", customerId)
      .order("occurred_at", { ascending: false })
      .limit(30),
  ]);

  const leads = leadsRes.data ?? [];
  const recalls = recallsRes.data ?? [];
  const audit = (auditRes.data ?? []) as CustomerAuditLog[];

  return (
    <div>
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-brand"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        All customers
      </Link>

      <div className="mt-4">
        <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
          Customer · {c.source ? `from ${c.source}` : "manual"}
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold">
          {c.full_name || c.email}
        </h1>
        <p className="mt-1 text-[14.5px] text-muted">
          {c.company ? `${c.company} · ` : ""}
          <a
            href={`mailto:${c.email}`}
            className="text-brand hover:text-brand-dark"
          >
            {c.email}
          </a>
          {c.phone && (
            <>
              {" · "}
              <a
                href={`tel:${c.phone}`}
                className="text-brand hover:text-brand-dark"
              >
                {c.phone}
              </a>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <CustomerEditForm initial={c} />

          {/* Linked quote leads */}
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">
              Quote leads ({leads.length})
            </h2>
            {leads.length === 0 ? (
              <p className="mt-3 text-[13.5px] text-muted">No leads from this email.</p>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {leads.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-3 text-[13.5px]">
                    <Link
                      href={`/admin/leads/${l.id}`}
                      className="flex-1 min-w-0 text-ink hover:text-brand"
                    >
                      <p className="font-semibold truncate">
                        {l.ordered_by || "(no name)"}
                      </p>
                      <p className="text-[12px] text-muted-soft">
                        {fmtDate(l.created_at)}
                      </p>
                    </Link>
                    <span className="rounded-full bg-canvas-tint px-2.5 py-0.5 text-[11.5px] font-bold uppercase tracking-wider text-muted ring-1 ring-line">
                      {l.status as QuoteLeadStatus}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Activity log */}
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">
              Activity ({audit.length})
            </h2>
            {audit.length === 0 ? (
              <p className="mt-3 text-[13.5px] text-muted">
                No edits recorded yet. New changes will appear here.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {audit.map((row) => (
                  <li key={row.id} className="py-3 text-[13.5px]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider ${
                            row.action === "create"
                              ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                              : row.action === "delete"
                                ? "bg-rose-100 text-rose-700 ring-1 ring-rose-200"
                                : "bg-blue-100 text-blue-700 ring-1 ring-blue-200"
                          }`}
                        >
                          {row.action}
                        </span>
                        <span className="font-semibold text-ink">
                          {row.actor_email ?? "system"}
                        </span>
                      </span>
                      <span className="text-[12px] text-muted-soft">
                        {fmtDate(row.occurred_at)}
                      </span>
                    </div>
                    {row.action === "update" && row.changes && (
                      <ul className="mt-2 ml-6 space-y-1 text-[12.5px] text-muted">
                        {Object.entries(
                          row.changes as Record<string, { from: unknown; to: unknown }>,
                        ).map(([field, diff]) => (
                          <li key={field} className="font-mono">
                            <span className="text-ink">{field}</span>:{" "}
                            <span className="text-rose-700/80">
                              {diff?.from === null || diff?.from === undefined
                                ? "—"
                                : String(diff.from)}
                            </span>{" "}
                            →{" "}
                            <span className="text-emerald-700/80">
                              {diff?.to === null || diff?.to === undefined
                                ? "—"
                                : String(diff.to)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Linked calibration recalls */}
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">
              Calibration recalls ({recalls.length})
            </h2>
            {recalls.length === 0 ? (
              <p className="mt-3 text-[13.5px] text-muted">No recalls scheduled for this customer.</p>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {recalls.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-[13.5px]">
                    <Link
                      href={`/admin/calibration/${r.id}`}
                      className="flex-1 min-w-0 text-ink hover:text-brand"
                    >
                      <p className="font-semibold truncate">
                        {r.equipment_label || r.equipment_ref}
                      </p>
                      <p className="text-[12px] text-muted-soft">
                        Due {fmtDay(r.due_date)}
                        {r.serial_number ? ` · S/N ${r.serial_number}` : ""}
                      </p>
                    </Link>
                    <span className="rounded-full bg-canvas-tint px-2.5 py-0.5 text-[11.5px] font-bold uppercase tracking-wider text-muted ring-1 ring-line">
                      {r.status as CalibrationRecallStatus}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-3">
          <a
            href={`mailto:${c.email}`}
            className="block w-full rounded-full bg-brand px-5 py-3 text-center text-[14px] font-bold text-white hover:bg-brand-dark"
          >
            Send email
          </a>
          {c.phone && (
            <a
              href={`tel:${c.phone}`}
              className="block w-full rounded-full border border-line bg-white px-5 py-3 text-center text-[14px] font-bold text-ink hover:bg-canvas-tint"
            >
              Call {c.phone}
            </a>
          )}
          <p className="text-[11.5px] text-muted-soft">
            Customer ID: <code className="font-mono">{c.id}</code>
          </p>
          <p className="text-[11.5px] text-muted-soft">
            Created {fmtDate(c.created_at)} · last contact {fmtDate(c.last_contact_at)}
          </p>
        </aside>
      </div>
    </div>
  );
}
