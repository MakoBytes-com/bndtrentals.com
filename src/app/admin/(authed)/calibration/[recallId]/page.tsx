import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { RecallEditForm } from "./RecallEditForm";
import type { CalibrationRecall } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Recall detail",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function RecallDetailPage({
  params,
}: {
  params: Promise<{ recallId: string }>;
}) {
  const { recallId } = await params;

  const supa = getAdminSupabase();
  const { data, error } = await supa
    .from("calibration_recalls")
    .select("*")
    .eq("id", recallId)
    .maybeSingle();

  if (error || !data) notFound();
  const r = data as CalibrationRecall;

  return (
    <div>
      <Link
        href="/admin/calibration"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-brand"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        All recalls
      </Link>

      <div className="mt-4">
        <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
          Recall · created {fmtDate(r.created_at)}
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold">
          {r.customer_name || r.customer_email}
        </h1>
        <p className="mt-1 text-[14.5px] text-muted">
          {r.customer_company ? `${r.customer_company} · ` : ""}
          {r.equipment_label || r.equipment_ref}
          {r.serial_number ? ` · S/N ${r.serial_number}` : ""}
        </p>
      </div>

      <RecallEditForm initial={r} />

      <section className="mt-8 rounded-2xl border border-line bg-canvas-tint p-5 text-[12.5px] text-muted">
        <p>
          <strong className="text-ink">Reminders sent:</strong>{" "}
          {r.notification_count}
          {r.notification_sent_at &&
            ` (last ${fmtDate(r.notification_sent_at.slice(0, 10))})`}
        </p>
        {r.completed_at && (
          <p className="mt-1">
            <strong className="text-ink">Completed:</strong> {fmtDate(r.completed_at)}
          </p>
        )}
        <p className="mt-2 text-[11.5px] text-muted-soft">
          Recall ID: <code className="font-mono">{r.id}</code>
        </p>
      </section>
    </div>
  );
}
