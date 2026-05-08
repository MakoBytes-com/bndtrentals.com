"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { disableTotp } from "./actions";

export function TotpEnrolledClient() {
  const router = useRouter();
  const [confirmStep, setConfirmStep] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDisable() {
    setError(null);
    startTransition(async () => {
      const result = await disableTotp();
      if (result.ok) {
        router.refresh();
        return;
      }
      setError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-start gap-4">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-emerald-900">
              Two-factor authentication is on
            </p>
            <p className="mt-1 text-[14px] text-emerald-900/80">
              Your authenticator app generates a 6-digit code every 30 seconds.
              You&apos;ll be asked for it on every sign-in after your password.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">
          Lost your authenticator?
        </h2>
        <p className="mt-3 text-[14px] text-ink-soft">
          Disabling here removes the requirement so you can re-enroll with a
          new device. Anyone with your password alone could sign in until you
          re-enable two-factor — only do this if you can re-enroll right
          away.
        </p>

        {!confirmStep ? (
          <button
            type="button"
            onClick={() => setConfirmStep(true)}
            className="mt-5 rounded-full border border-line bg-white px-5 py-2.5 text-[13.5px] font-bold text-ink hover:bg-canvas-tint"
          >
            Disable two-factor
          </button>
        ) : (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="text-[13.5px] font-semibold text-accent">
              Sure? This removes your TOTP requirement.
            </span>
            <button
              type="button"
              onClick={handleDisable}
              disabled={pending}
              className="rounded-full bg-accent px-5 py-2.5 text-[13.5px] font-bold text-white hover:bg-accent-dark disabled:opacity-60"
            >
              {pending ? "Disabling…" : "Yes, disable"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmStep(false)}
              className="rounded-full border border-line bg-white px-5 py-2.5 text-[13.5px] font-semibold text-muted hover:bg-canvas-tint"
            >
              Cancel
            </button>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-accent/5 p-2.5 text-[13px] text-accent">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
