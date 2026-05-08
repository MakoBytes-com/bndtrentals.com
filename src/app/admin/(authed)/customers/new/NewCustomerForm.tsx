"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCustomer } from "../actions";
import type { CustomerStatus } from "@/lib/supabase/types";

const STATUSES: Array<{ value: CustomerStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "prospect", label: "Prospect" },
  { value: "inactive", label: "Inactive" },
  { value: "do_not_contact", label: "Do not contact" },
];

export function NewCustomerForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    company: "",
    phone: "",
    shipping_address: "",
    internal_notes: "",
    status: "active" as CustomerStatus,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createCustomer(form);
      if (result.ok) {
        router.replace(`/admin/customers/${result.id}`);
        router.refresh();
        return;
      }
      setError(result.error);
    });
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-canvas-tint px-3.5 py-2.5 text-[14.5px] text-ink focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
              placeholder="someone@company.com"
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
              placeholder="Customer-invisible notes."
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-line bg-white p-6">
        <legend className="px-2 text-[11.5px] font-bold uppercase tracking-widest text-accent">
          Status
        </legend>
        <label className="block">
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
        </label>
      </fieldset>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-accent/40 bg-accent/5 p-3 text-[13.5px] text-accent"
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={pending || !form.email}
          className="rounded-full bg-ink px-6 py-2.5 text-[14px] font-bold text-white hover:bg-ink-soft disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create customer"}
        </button>
      </div>
    </form>
  );
}
