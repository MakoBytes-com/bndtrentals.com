"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUser } from "../actions";

export function NewUserForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    role: "admin" as "admin" | "staff",
    temp_password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState<{
    email: string;
    tempPassword: string;
    id: string;
  } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createUser(form);
      if (result.ok) {
        setSuccess({
          email: result.email,
          tempPassword: result.tempPassword,
          id: result.id,
        });
        return;
      }
      setError(result.error);
    });
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-canvas-tint px-3.5 py-2.5 text-[14.5px] text-ink focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20";

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-start gap-4">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-emerald-900">
              User created
            </p>
            <p className="mt-1 text-[14px] text-emerald-900/80">
              Send <strong>{success.email}</strong> these credentials securely
              (1Password share, encrypted message — not over Slack DM):
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-white p-4 ring-1 ring-emerald-200">
          <dl className="space-y-2 text-[13.5px]">
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <dt className="font-bold uppercase tracking-widest text-[11px] text-muted">
                Sign-in URL
              </dt>
              <dd className="font-mono text-ink">
                {typeof window !== "undefined" ? window.location.origin : ""}/admin/login
              </dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <dt className="font-bold uppercase tracking-widest text-[11px] text-muted">
                Email
              </dt>
              <dd className="font-mono text-ink">{success.email}</dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <dt className="font-bold uppercase tracking-widest text-[11px] text-muted">
                Temp password
              </dt>
              <dd className="font-mono text-ink select-all break-all">
                {success.tempPassword}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-[12px] text-muted">
            They&apos;ll be forced to change this password on first sign-in.
            This is the only place you&apos;ll see the temp password — copy it now.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/admin/users/${success.id}`}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[14px] font-bold text-white hover:bg-ink-soft"
          >
            View / edit this user
          </Link>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-[14px] font-bold text-ink hover:bg-canvas-tint"
          >
            Back to users
          </Link>
          <button
            type="button"
            onClick={() => {
              setSuccess(null);
              setForm({ email: "", full_name: "", role: "admin", temp_password: "" });
              router.refresh();
            }}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-[14px] font-bold text-ink hover:bg-canvas-tint"
          >
            + Invite another
          </button>
        </div>
      </div>
    );
  }

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
              placeholder="someone@bndtrentals.com"
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
              Full name *
            </span>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className={`${inputClass} mt-1.5`}
              placeholder="Jane Doe"
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-line bg-white p-6">
        <legend className="px-2 text-[11.5px] font-bold uppercase tracking-widest text-accent">
          Access
        </legend>
        <label className="block">
          <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
            Role
          </span>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "staff" })}
            aria-label="Role"
            className={`${inputClass} mt-1.5`}
          >
            <option value="admin">Admin (full access)</option>
            <option value="staff">Staff (read-only access — placeholder; matches admin until role-gating is wired)</option>
          </select>
        </label>
      </fieldset>

      <fieldset className="rounded-2xl border border-line bg-white p-6">
        <legend className="px-2 text-[11.5px] font-bold uppercase tracking-widest text-accent">
          Temporary password
        </legend>
        <label className="block">
          <span className="block text-[12.5px] font-bold uppercase tracking-widest text-muted">
            Override (optional)
          </span>
          <input
            type="text"
            value={form.temp_password}
            onChange={(e) => setForm({ ...form, temp_password: e.target.value })}
            className={`${inputClass} mt-1.5 font-mono`}
            placeholder="Leave blank to auto-generate (recommended)"
            autoComplete="off"
            minLength={12}
            maxLength={128}
          />
          <span className="mt-1 block text-[12px] text-muted-soft">
            12+ characters. Skip this and we&apos;ll generate a strong one and
            show it to you on the next screen — only place you&apos;ll see it.
          </span>
        </label>
      </fieldset>

      {error && (
        <p role="alert" className="rounded-lg border border-accent/40 bg-accent/5 p-3 text-[13.5px] text-accent">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={pending || !form.email || !form.full_name}
          className="rounded-full bg-ink px-6 py-2.5 text-[14px] font-bold text-white hover:bg-ink-soft disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create user"}
        </button>
      </div>
    </form>
  );
}
