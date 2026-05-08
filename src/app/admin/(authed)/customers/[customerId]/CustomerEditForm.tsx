"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCustomer, deleteCustomer } from "../actions";
import type { Customer, CustomerStatus } from "@/lib/supabase/types";

const STATUSES: Array<{ value: CustomerStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "prospect", label: "Prospect" },
  { value: "inactive", label: "Inactive" },
  { value: "do_not_contact", label: "Do not contact" },
];

export function CustomerEditForm({ initial }: { initial: Customer }) {
  const router = useRouter();
  const [form, setForm] = useState({
    email: initial.email,
    full_name: initial.full_name ?? "",
    company: initial.company ?? "",
    phone: initial.phone ?? "",
    shipping_address: initial.shipping_address ?? "",
    internal_notes: initial.internal_notes ?? "",
    status: initial.status,
  });
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [pending, startTransition] = useTransition();

  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateCustomer({ id: initial.id, ...form });
      if (result.ok) setSavedAt(new Date());
      else setError(result.error);
    });
  }

  function handleDelete() {
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteCustomer(initial.id);
      if (result.ok) {
        router.replace("/admin/customers");
        router.refresh();
        return;
      }
      setDeleteError(result.error);
      setDeleteConfirming(false);
    });
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-canvas-tint px-3.5 py-2.5 text-[14.5px] text-ink focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20";

  return (
    <div className="space-y-6">
      <fieldset className="rounded-2xl border border-line bg-white p-6">
        <legend className="px-2 text-[11.5px] font-bold uppercase tracking-widest text-accent">
          Identity
        </legend>
        <div className="space-y-4">
          <label className="block">
            <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
              Email *
            </span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`${inputClass} mt-1.5`}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
                Full name
              </span>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className={`${inputClass} mt-1.5`}
              />
            </label>
            <label className="block">
              <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
                Phone
              </span>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={`${inputClass} mt-1.5`}
              />
            </label>
          </div>
          <label className="block">
            <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
              Company
            </span>
            <input
              type="text"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className={`${inputClass} mt-1.5`}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-line bg-white p-6">
        <legend className="px-2 text-[11.5px] font-bold uppercase tracking-widest text-accent">
          Shipping & notes
        </legend>
        <div className="space-y-4">
          <label className="block">
            <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
              Shipping address
            </span>
            <textarea
              value={form.shipping_address}
              onChange={(e) =>
                setForm({ ...form, shipping_address: e.target.value })
              }
              rows={3}
              className={`${inputClass} mt-1.5 resize-y`}
            />
          </label>
          <label className="block">
            <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
              Internal notes
            </span>
            <textarea
              value={form.internal_notes}
              onChange={(e) =>
                setForm({ ...form, internal_notes: e.target.value })
              }
              rows={4}
              className={`${inputClass} mt-1.5 resize-y`}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-line bg-white p-6">
        <legend className="px-2 text-[11.5px] font-bold uppercase tracking-widest text-accent">
          Status
        </legend>
        <select
          value={form.status}
          onChange={(e) =>
            setForm({ ...form, status: e.target.value as CustomerStatus })
          }
          aria-label="Customer status"
          className={inputClass}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </fieldset>

      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-rose-700">
          Danger zone
        </h2>
        <p className="mt-3 text-[14px] text-rose-900">
          Deleting removes the customer record. Past quote leads and
          calibration recalls keep their email-linked data; deletion just
          removes the consolidated profile here.
        </p>
        {!deleteConfirming ? (
          <button
            type="button"
            onClick={() => setDeleteConfirming(true)}
            className="mt-4 rounded-full border border-rose-300 bg-white px-5 py-2.5 text-[13.5px] font-bold text-rose-700 hover:bg-rose-100"
          >
            Delete this customer
          </button>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-[13.5px] font-semibold text-rose-800">Sure?</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deletePending}
              className="rounded-full bg-rose-600 px-5 py-2.5 text-[13.5px] font-bold text-white hover:bg-rose-700 disabled:opacity-60"
            >
              {deletePending ? "Deleting…" : "Yes, delete"}
            </button>
            <button
              type="button"
              onClick={() => setDeleteConfirming(false)}
              className="rounded-full border border-line bg-white px-5 py-2.5 text-[13.5px] font-semibold text-muted hover:bg-canvas-tint"
            >
              Cancel
            </button>
          </div>
        )}
        {deleteError && (
          <p
            role="alert"
            className="mt-3 rounded-lg bg-white p-2.5 text-[13px] font-semibold text-rose-700 ring-1 ring-rose-200"
          >
            {deleteError}
          </p>
        )}
      </section>

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
