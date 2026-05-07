"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") {
      console.error("[bndt global-error]", error);
    }
    try {
      const key = "bndt-error-buffer-v1";
      const buf = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown[];
      buf.push({
        scope: "global",
        message: error.message,
        digest: error.digest,
        stack: error.stack,
        url: window.location.href,
        ts: new Date().toISOString(),
      });
      localStorage.setItem(key, JSON.stringify(buf.slice(-25)));
    } catch {
      // ignore
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          background: "#0a0e1a",
          color: "#e8edf3",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: 560, textAlign: "center" }}>
          <p
            style={{
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#f59e0b",
              fontWeight: 700,
              margin: 0,
            }}
          >
            Application error
          </p>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              margin: "12px 0 16px",
              lineHeight: 1.2,
            }}
          >
            Something broke at the page level.
          </h1>
          <p style={{ fontSize: 15, color: "#9aa4b2", margin: "0 0 28px" }}>
            We&apos;ve recorded the error. Please retry, or call Burton NDT at{" "}
            <a
              href="tel:+12819414311"
              style={{ color: "#60a5fa", textDecoration: "underline" }}
            >
              281-941-4311
            </a>
            .
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: 0,
              borderRadius: 999,
              background: "#f59e0b",
              color: "#0a0e1a",
              fontWeight: 700,
              padding: "10px 22px",
              fontSize: 14.5,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest ? (
            <p
              style={{
                marginTop: 24,
                fontSize: 12,
                color: "#5e6772",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}
            >
              Ref: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
