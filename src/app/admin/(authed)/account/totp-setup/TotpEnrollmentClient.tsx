"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startEnrollment, verifyEnrollment } from "./actions";

export function TotpEnrollmentClient() {
  const router = useRouter();
  const [bootstrap, setBootstrap] = useState<
    | { secret: string; uri: string; qrDataUrl: string }
    | null
  >(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;
    startEnrollment().then((result) => {
      if (!mounted) return;
      if (result.ok) {
        setBootstrap({
          secret: result.secret,
          uri: result.uri,
          qrDataUrl: result.qrDataUrl,
        });
      } else {
        setBootError(result.error);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setVerifyError(null);
    const fd = new FormData(e.currentTarget);
    const value = String(fd.get("code") ?? "").replace(/\s/g, "");
    startTransition(async () => {
      const result = await verifyEnrollment({ code: value });
      if (result.ok) {
        router.refresh();
        return;
      }
      setVerifyError(result.error);
    });
  }

  if (bootError) {
    return (
      <div className="rounded-2xl border border-accent/40 bg-accent/5 p-5">
        <p className="font-semibold text-accent">{bootError}</p>
      </div>
    );
  }

  if (!bootstrap) {
    return (
      <div className="rounded-2xl border border-line bg-white p-6 text-[14.5px] text-muted">
        Generating your enrollment QR…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">
          1. Scan with your authenticator app
        </h2>
        <div className="mt-5 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
          <div className="rounded-xl border border-line bg-white p-2">
            <Image
              src={bootstrap.qrDataUrl}
              alt="Two-factor QR code"
              width={224}
              height={224}
              unoptimized
            />
          </div>
          <div className="text-[13.5px] text-ink-soft">
            <p>
              Open your authenticator app and tap the &ldquo;+&rdquo; / &ldquo;Add
              account&rdquo; button. Choose <strong>Scan QR code</strong> and
              point your phone at the image on the left.
            </p>
            <p className="mt-3">
              Can&rsquo;t scan? Enter this secret manually:
            </p>
            <p className="mt-2 break-all rounded-lg bg-canvas-tint px-3 py-2 font-mono text-[13px] text-ink">
              {bootstrap.secret}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">
          2. Confirm with the first code
        </h2>
        <form onSubmit={handleVerify} className="mt-4">
          <label className="block">
            <span className="block text-[13px] font-semibold text-ink">
              6-digit code from your authenticator
            </span>
            <input
              type="text"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line bg-canvas-tint px-3.5 py-2.5 text-[18px] text-ink font-mono tracking-[0.4em] focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
              placeholder="000000"
            />
          </label>

          {verifyError && (
            <p role="alert" className="mt-3 rounded-lg bg-accent/5 p-2.5 text-[13px] text-accent">
              {verifyError}
            </p>
          )}

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={pending || code.length !== 6}
              className="rounded-full bg-ink px-6 py-2.5 text-[14px] font-bold text-white hover:bg-ink-soft disabled:opacity-60"
            >
              {pending ? "Verifying…" : "Verify and turn on"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
