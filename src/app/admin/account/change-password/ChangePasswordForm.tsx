"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changePasswordAction } from "./actions";

export function ChangePasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      currentPassword: String(fd.get("currentPassword") ?? ""),
      newPassword: String(fd.get("newPassword") ?? ""),
      confirm: String(fd.get("confirm") ?? ""),
    };
    startTransition(async () => {
      const result = await changePasswordAction(payload);
      if (result.ok) {
        setSuccess(true);
        // Give the user a moment to see the success state, then go home.
        setTimeout(() => {
          router.replace("/admin");
          router.refresh();
        }, 800);
        return;
      }
      setError(result.error);
    });
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-canvas-tint px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted-soft/70 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20";

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-600 text-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <p className="mt-4 text-[15px] font-semibold text-ink">Password updated.</p>
        <p className="mt-1 text-[13px] text-muted">Redirecting to your dashboard…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="block text-[13px] font-semibold text-ink">Current password</span>
        <input type="password" name="currentPassword" required autoComplete="current-password" className={`${inputClass} mt-1.5`} />
      </label>

      <label className="block">
        <span className="block text-[13px] font-semibold text-ink">New password</span>
        <input type="password" name="newPassword" required minLength={12} autoComplete="new-password" className={`${inputClass} mt-1.5`} />
        <span className="mt-1 block text-[12px] text-muted">
          12+ characters, mix of upper / lower / numbers / symbols.
        </span>
      </label>

      <label className="block">
        <span className="block text-[13px] font-semibold text-ink">Confirm new password</span>
        <input type="password" name="confirm" required minLength={12} autoComplete="new-password" className={`${inputClass} mt-1.5`} />
      </label>

      {error && (
        <p role="alert" className="rounded-lg border border-accent/40 bg-accent/5 p-3 text-[13.5px] text-accent">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-brand px-6 py-3 text-[15px] font-bold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
