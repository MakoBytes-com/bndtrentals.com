import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { LeadStatusForm } from "./LeadStatusForm";
import type { QuoteLead } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Lead detail",
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

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supa = getAdminSupabase();
  const { data: lead, error } = await supa
    .from("quote_leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !lead) notFound();

  const typedLead = lead as QuoteLead;
  const cart = Array.isArray(typedLead.cart) ? typedLead.cart : [];
  const rentals = cart.filter((i) => (i.kind ?? "rental") === "rental");
  const calibrations = cart.filter((i) => i.kind === "calibration");

  return (
    <div>
      <Link
        href="/admin/leads"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-brand"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        All leads
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
            Lead · {fmtDate(typedLead.created_at)}
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold">
            {typedLead.ordered_by || typedLead.email}
          </h1>
          <p className="mt-1 text-[14.5px] text-muted">
            {typedLead.company ? `${typedLead.company} · ` : ""}
            <a
              href={`mailto:${typedLead.email}`}
              className="text-brand hover:text-brand-dark"
            >
              {typedLead.email}
            </a>
            {typedLead.phone && (
              <>
                {" · "}
                <a
                  href={`tel:${typedLead.phone}`}
                  className="text-brand hover:text-brand-dark"
                >
                  {typedLead.phone}
                </a>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Cart items */}
          <section className="rounded-2xl border border-line bg-white p-6">
            <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">
              Items requested
            </h2>
            {cart.length === 0 ? (
              <p className="mt-3 text-[14px] text-muted">No cart items — see instructions below.</p>
            ) : (
              <div className="mt-4 space-y-5">
                {rentals.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
                      Equipment Rentals
                    </p>
                    <ul className="mt-2 divide-y divide-line">
                      {rentals.map((it, i) => (
                        <li key={`r-${i}`} className="flex items-center justify-between py-2.5 text-[14.5px]">
                          <span className="text-ink">{it.productName}</span>
                          <span className="font-bold tabular-nums text-muted">× {it.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {calibrations.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
                      Calibration Services
                    </p>
                    <ul className="mt-2 divide-y divide-line">
                      {calibrations.map((it, i) => (
                        <li key={`c-${i}`} className="flex items-center justify-between py-2.5 text-[14.5px]">
                          <span className="text-ink">{it.productName}</span>
                          <span className="font-bold tabular-nums text-muted">× {it.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Rental + shipping */}
          <section className="rounded-2xl border border-line bg-white p-6">
            <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">
              Rental & shipping
            </h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-[14px]">
              <Detail label="Date needed" value={typedLead.date_needed} />
              <Detail label="Duration" value={typedLead.duration} />
              <Detail label="ERPP" value={typedLead.erpp} />
              <Detail label="PO / CC" value={typedLead.po_or_cc} />
              <Detail label="Shipping account" value={typedLead.shipping_account} />
              <Detail label="Shipping" value={typedLead.shipping} multiline />
            </dl>
          </section>

          {typedLead.instructions && (
            <section className="rounded-2xl border border-line bg-white p-6">
              <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">
                Special instructions
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-[14.5px] text-ink-soft">
                {typedLead.instructions}
              </p>
            </section>
          )}

          {typedLead.interests.length > 0 && (
            <section className="rounded-2xl border border-line bg-white p-6">
              <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">
                Interested in
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2 text-[13px]">
                {typedLead.interests.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-canvas-tint px-3 py-1 text-ink-soft ring-1 ring-line"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-2xl border border-line bg-canvas-tint p-5 text-[12.5px] text-muted">
            <p>
              <strong className="text-ink">Source:</strong>{" "}
              {typedLead.source_url ?? "—"}
            </p>
            <p className="mt-1">
              <strong className="text-ink">IP:</strong> {typedLead.ip ?? "—"}
            </p>
            <p className="mt-1">
              <strong className="text-ink">User agent:</strong>{" "}
              {typedLead.user_agent ?? "—"}
            </p>
            <p className="mt-1">
              <strong className="text-ink">Bot check:</strong>{" "}
              {typedLead.turnstile_ok === true
                ? "✓ verified"
                : typedLead.turnstile_ok === false
                ? "✗ failed"
                : "skipped (not configured at submit time)"}
            </p>
          </section>
        </div>

        {/* Status sidebar */}
        <aside className="space-y-6">
          <LeadStatusForm
            id={typedLead.id}
            initialStatus={typedLead.status}
            initialNotes={typedLead.internal_notes ?? ""}
          />
          <a
            href={`mailto:${typedLead.email}?subject=${encodeURIComponent(`Re: your Burton NDT quote request`)}`}
            className="block w-full rounded-full bg-brand px-5 py-3 text-center text-[14px] font-bold text-white hover:bg-brand-dark"
          >
            Reply by email
          </a>
          {typedLead.phone && (
            <a
              href={`tel:${typedLead.phone}`}
              className="block w-full rounded-full border border-line bg-white px-5 py-3 text-center text-[14px] font-bold text-ink hover:bg-canvas-tint"
            >
              Call {typedLead.phone}
            </a>
          )}
          <p className="text-[11.5px] text-muted-soft">
            Lead ID: <code className="font-mono">{typedLead.id}</code>
          </p>
        </aside>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string | null;
  multiline?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11.5px] font-bold uppercase tracking-widest text-muted">
        {label}
      </dt>
      <dd
        className={`mt-1 text-ink ${multiline ? "whitespace-pre-wrap" : ""}`}
      >
        {value ?? <span className="text-muted-soft">—</span>}
      </dd>
    </div>
  );
}
