"use client";

import { useState, useTransition } from "react";
import { updateRecall } from "../actions";
import type { CalibrationRecall, CalibrationRecallStatus } from "@/lib/supabase/types";

const STATUSES: Array<{ value: CalibrationRecallStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "reminded", label: "Reminded" },
  { value: "overdue", label: "Overdue" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function RecallEditForm({ initial }: { initial: CalibrationRecall }) {
  const [form, setForm] = useState({
    customer_email: initial.customer_email,
    customer_name: initial.customer_name ?? "",
    customer_company: initial.customer_company ?? "",
    equipment_ref: initial.equipment_ref,
    equipment_label: initial.equipment_label ?? "",
    serial_number: initial.serial_number ?? "",
    last_calibrated: initial.last_calibrated ?? "",
    due_date: initial.due_date,
    status: initial.status,
    internal_notes: initial.internal_notes ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateRecall({ id: initial.id, ...form });
      if (result.ok) setSavedAt(new Date());
      else setError(result.error);
    });
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-canvas-tint px-3.5 py-2.5 text-[14.5px] text-ink focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20";

  return (
    <div className="mt-8 space-y-6">
      <Section title="Customer">
        <Grid>
          <Field label="Email *">
            <input
              type="email"
              required
              value={form.customer_email}
              onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Name">
            <input
              type="text"
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              className={inputClass}
            />
          </Field>
        </Grid>
        <Field label="Company">
          <input
            type="text"
            value={form.customer_company}
            onChange={(e) => setForm({ ...form, customer_company: e.target.value })}
            className={inputClass}
          />
        </Field>
      </Section>

      <Section title="Equipment">
        <Grid>
          <Field label="Reference *">
            <input
              type="text"
              required
              value={form.equipment_ref}
              onChange={(e) => setForm({ ...form, equipment_ref: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Display label">
            <input
              type="text"
              value={form.equipment_label}
              onChange={(e) => setForm({ ...form, equipment_label: e.target.value })}
              className={inputClass}
            />
          </Field>
        </Grid>
        <Field label="Serial number">
          <input
            type="text"
            value={form.serial_number}
            onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
            className={inputClass}
          />
        </Field>
      </Section>

      <Section title="Schedule & status">
        <Grid>
          <Field label="Last calibrated">
            <input
              type="date"
              value={form.last_calibrated}
              onChange={(e) => setForm({ ...form, last_calibrated: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Due *">
            <input
              type="date"
              required
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className={inputClass}
            />
          </Field>
        </Grid>
        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as CalibrationRecallStatus })
            }
            aria-label="Recall status"
            className={inputClass}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      <Section title="Notes">
        <Field label="Internal notes">
          <textarea
            value={form.internal_notes}
            onChange={(e) => setForm({ ...form, internal_notes: e.target.value })}
            rows={4}
            className={`${inputClass} resize-y`}
            placeholder="Customer-invisible context."
          />
        </Field>
      </Section>

      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-lg">
        <div className="min-w-0 text-[13px] text-muted">
          {error ? (
            <span role="alert" className="font-semibold text-accent">
              {error}
            </span>
          ) : savedAt ? (
            <>Saved at {savedAt.toLocaleTimeString()}.</>
          ) : (
            <>Edits write to the live database immediately on save.</>
          )}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-full bg-ink px-6 py-2.5 text-[14px] font-bold text-white hover:bg-ink-soft disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-line bg-white p-6">
      <legend className="px-2 text-[11.5px] font-bold uppercase tracking-widest text-accent">
        {title}
      </legend>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
