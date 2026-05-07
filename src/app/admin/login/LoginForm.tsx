"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "./actions";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [needsTotp, setNeedsTotp] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      email: String(fd.get("email") ?? "").trim(),
      password: String(fd.get("password") ?? ""),
      totp: String(fd.get("totp") ?? "").trim(),
    };
    startTransition(async () => {
      const result = await loginAction(payload);
      if (result.ok) {
        router.replace(result.redirectTo);
        router.refresh();
        return;
      }
      setError(result.error);
      if (result.needsTotp) setNeedsTotp(true);
    });
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-canvas-tint px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted-soft/70 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="block text-[13px] font-semibold text-ink">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="username"
          className={`${inputClass} mt-1.5`}
        />
      </label>

      <label className="block">
        <span className="block text-[13px] font-semibold text-ink">Password</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className={`${inputClass} mt-1.5`}
        />
      </label>

      {needsTotp && (
        <label className="block">
          <span className="block text-[13px] font-semibold text-ink">
            Authenticator code
          </span>
          <input
            type="text"
            name="totp"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            placeholder="123 456"
            className={`${inputClass} mt-1.5 font-mono tracking-[0.4em]`}
            autoFocus
          />
          <span className="mt-1 block text-[12px] text-muted">
            6-digit code from your authenticator app.
          </span>
        </label>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-accent/40 bg-accent/5 p-3 text-[13.5px] text-accent"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-brand px-6 py-3 text-[15px] font-bold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
