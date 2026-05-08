"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateUser,
  resetUserPassword,
  disableUserTotp,
  deleteUser,
} from "../actions";
import type { AdminUser } from "@/lib/supabase/types";

export function UserEditForm({
  initial,
  isSelf,
}: {
  initial: AdminUser;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: initial.full_name,
    role: initial.role,
  });
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [pending, startTransition] = useTransition();

  const [resetResult, setResetResult] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetPending, startResetTransition] = useTransition();

  const [totpDisabling, startTotpTransition] = useTransition();
  const [totpError, setTotpError] = useState<string | null>(null);

  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateUser({ id: initial.id, ...form });
      if (result.ok) {
        setSavedAt(new Date());
      } else {
        setError(result.error);
      }
    });
  }

  function handleReset() {
    setResetError(null);
    setResetResult(null);
    startResetTransition(async () => {
      const result = await resetUserPassword(initial.id);
      if (result.ok) {
        setResetResult(result.tempPassword);
      } else {
        setResetError(result.error);
      }
    });
  }

  function handleDisableTotp() {
    setTotpError(null);
    startTotpTransition(async () => {
      const result = await disableUserTotp(initial.id);
      if (!result.ok) setTotpError(result.error);
      else router.refresh();
    });
  }

  function handleDelete() {
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteUser(initial.id);
      if (result.ok) {
        router.replace("/admin/users");
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
    <div className="mt-8 space-y-6">
      <fieldset className="rounded-2xl border border-line bg-white p-6">
        <legend className="px-2 text-[11.5px] font-bold uppercase tracking-widest text-accent">
          Identity
        </legend>
        <div className="space-y-4">
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
              Email <span className="text-muted-soft normal-case font-normal">(read-only)</span>
            </span>
            <input
              type="email"
              value={initial.email}
              disabled
              className={`${inputClass} mt-1.5 cursor-not-allowed bg-canvas-tint/60`}
            />
          </label>
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
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-line bg-white p-6">
        <legend className="px-2 text-[11.5px] font-bold uppercase tracking-widest text-accent">
          Password
        </legend>
        <p className="text-[14px] text-ink-soft">
          Reset generates a new temp password and forces this user to change
          it on next sign-in.
          {isSelf && " (You can change your own password without resetting it.)"}
        </p>
        {!resetResult ? (
          <button
            type="button"
            onClick={handleReset}
            disabled={resetPending}
            className="mt-4 rounded-full border border-line bg-white px-5 py-2.5 text-[13.5px] font-bold text-ink hover:bg-canvas-tint disabled:opacity-60"
          >
            {resetPending ? "Resetting…" : "Reset password"}
          </button>
        ) : (
          <div className="mt-4 rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
            <p className="text-[13px] font-bold text-emerald-900">
              New temporary password — copy now, only shown once
            </p>
            <p className="mt-2 font-mono text-[14px] text-ink select-all break-all bg-white rounded p-2 ring-1 ring-emerald-200">
              {resetResult}
            </p>
          </div>
        )}
        {resetError && (
          <p role="alert" className="mt-3 rounded-lg bg-accent/5 p-2.5 text-[13px] text-accent">
            {resetError}
          </p>
        )}
      </fieldset>

      <fieldset className="rounded-2xl border border-line bg-white p-6">
        <legend className="px-2 text-[11.5px] font-bold uppercase tracking-widest text-accent">
          Two-factor
        </legend>
        <p className="text-[14px] text-ink-soft">
          {initial.totp_enrolled
            ? "User has TOTP enrolled. If they lost their authenticator, disable here so they can re-enroll on a new device."
            : "User hasn't enrolled TOTP yet. They can do that themselves from /admin/account/totp-setup after signing in."}
        </p>
        {initial.totp_enrolled && (
          <button
            type="button"
            onClick={handleDisableTotp}
            disabled={totpDisabling}
            className="mt-4 rounded-full border border-line bg-white px-5 py-2.5 text-[13.5px] font-bold text-ink hover:bg-canvas-tint disabled:opacity-60"
          >
            {totpDisabling ? "Disabling…" : "Disable two-factor"}
          </button>
        )}
        {totpError && (
          <p role="alert" className="mt-3 rounded-lg bg-accent/5 p-2.5 text-[13px] text-accent">
            {totpError}
          </p>
        )}
      </fieldset>

      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-rose-700">
          Danger zone
        </h2>
        {isSelf ? (
          <p className="mt-3 text-[14px] text-rose-900">
            You can&apos;t delete your own account. Have another admin do it,
            or sign out and ask support to remove the account.
          </p>
        ) : (
          <>
            <p className="mt-3 text-[14px] text-rose-900">
              Deleting permanently removes this admin&apos;s access. Their
              past actions (assigned leads, recalls) become unassigned. The
              system refuses if removing them would leave zero admins.
            </p>
            {!deleteConfirming ? (
              <button
                type="button"
                onClick={() => setDeleteConfirming(true)}
                className="mt-4 rounded-full border border-rose-300 bg-white px-5 py-2.5 text-[13.5px] font-bold text-rose-700 hover:bg-rose-100"
              >
                Delete this user
              </button>
            ) : (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-[13.5px] font-semibold text-rose-800">
                  Sure?
                </span>
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
              <p role="alert" className="mt-3 rounded-lg bg-white p-2.5 text-[13px] font-semibold text-rose-700 ring-1 ring-rose-200">
                {deleteError}
              </p>
            )}
          </>
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
