"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      url: window.location.href,
      ts: new Date().toISOString(),
    };
    if (process.env.NODE_ENV !== "production") {
      console.error("[bndt error boundary]", payload);
    }
    // Phase 2 will replace this with Sentry + portal error_events ingestion.
    // Until then, surface visibly so we don't lose data.
    try {
      const key = "bndt-error-buffer-v1";
      const buf = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown[];
      buf.push(payload);
      localStorage.setItem(key, JSON.stringify(buf.slice(-25)));
    } catch {
      // localStorage may be full or unavailable; intentionally drop
    }
  }, [error]);

  return (
    <main className="bg-canvas text-ink py-24 lg:py-32 min-h-[60vh]">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
          Something went wrong
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold leading-tight">
          We hit a problem loading this page.
        </h1>
        <p className="mt-4 text-[16px] text-muted leading-relaxed">
          The error has been logged. You can retry, head back home, or contact us
          directly and we&apos;ll handle it the old-fashioned way.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-[14.5px] font-bold text-white hover:bg-accent-dark"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-line bg-canvas-tint px-6 py-3 text-[14.5px] font-bold text-ink hover:bg-canvas"
          >
            Back to home
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full border border-line bg-canvas-tint px-6 py-3 text-[14.5px] font-bold text-ink hover:bg-canvas"
          >
            Contact us
          </Link>
        </div>
        {error.digest ? (
          <p className="mt-6 text-[12px] text-muted-soft">
            Reference: <code className="font-mono">{error.digest}</code>
          </p>
        ) : null}
      </div>
    </main>
  );
}
