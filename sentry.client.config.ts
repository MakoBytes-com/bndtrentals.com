// Client-side Sentry init. No-op until NEXT_PUBLIC_SENTRY_DSN is set in
// Vercel environment variables. PII scrubbing is on by default so quote-form
// content (names, emails, phones, free text) is redacted before transmission.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    sendDefaultPii: false,
    beforeSend(event) {
      // Scrub free-text fields that frequently leak through error messages.
      if (event.request?.data && typeof event.request.data === "object") {
        const sensitive = [
          "email",
          "phone",
          "orderedBy",
          "company",
          "shipping",
          "instructions",
          "poOrCc",
        ];
        const data = event.request.data as Record<string, unknown>;
        for (const key of sensitive) {
          if (key in data) data[key] = "[REDACTED]";
        }
      }
      return event;
    },
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications.",
    ],
  });
}
