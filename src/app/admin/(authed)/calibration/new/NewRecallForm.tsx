"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRecall } from "../actions";

export function NewRecallForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      customer_email: String(fd.get("customer_email") ?? "").trim(),
      customer_name: String(fd.get("customer_name") ?? "").trim(),
      customer_company: String(fd.get("customer_company") ?? "").trim(),
      equipment_ref: String(fd.get("equipment_ref") ?? "").trim(),
      equipment_label: String(fd.get("equipment_label") ?? "").trim(),
      serial_number: String(fd.get("serial_number") ?? "").trim(),
      last_calibrated: String(fd.get("last_calibrated") ?? "").trim(),
      due_date: String(fd.get("due_date") ?? "").trim(),
      internal_notes: String(fd.get("internal_notes") ?? "").trim(),
    };
    startTransition(async () => {
      const result = await createRecall(payload);
      if (result.ok) {
        router.replace(`/admin/calibration/${result.id}`);
        router.refresh();
        return;
      }
      setError(result.error);
    });
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-canvas-tint px-3.5 py-2.5 text-[14.5px] text-ink placeholder:text-muted-soft/70 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Customer">
        <Grid>
          <Field label="Email *">
            <input type="email" name="customer_email" required className={inputClass} />
          </Field>
          <Field label="Name">
            <input type="text" name="customer_name" className={inputClass} />
          </Field>
        </Grid>
        <Field label="Company">
          <input type="text" name="customer_company" className={inputClass} />
        </Field>
      </Section>

      <Section title="Equipment">
        <Grid>
          <Field label="Reference *">
            <input
              type="text"
              name="equipment_ref"
              required
              className={inputClass}
              placeholder="olympus-38dl-plus or free-text label"
            />
          </Field>
          <Field label="Display label">
            <input
              type="text"
              name="equipment_label"
              className={inputClass}
              placeholder="Olympus 38DL Plus"
            />
          </Field>
        </Grid>
        <Field label="Serial number">
          <input type="text" name="serial_number" className={inputClass} />
        </Field>
      </Section>

      <Section title="Schedule">
        <Grid>
          <Field label="Last calibrated">
            <input type="date" name="last_calibrated" className={inputClass} />
          </Field>
          <Field label="Due *">
            <input type="date" name="due_date" required className={inputClass} />
          </Field>
        </Grid>
      </Section>

      <Section title="Notes">
        <Field label="Internal notes">
          <textarea
            name="internal_notes"
            rows={4}
            className={`${inputClass} resize-y`}
            placeholder="Customer-invisible context, prior history, etc."
          />
        </Field>
      </Section>

      {error && (
        <p role="alert" className="rounded-lg border border-accent/40 bg-accent/5 p-3 text-[13.5px] text-accent">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-ink px-6 py-2.5 text-[14px] font-bold text-white hover:bg-ink-soft disabled:opacity-60"
        >
          {pending ? "Saving…" : "Schedule recall"}
        </button>
      </div>
    </form>
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
