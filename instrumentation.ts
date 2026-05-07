// Next.js 16 instrumentation hook — picks up the right Sentry config per
// runtime. Without SENTRY_DSN the inits short-circuit, so this file is safe
// to ship before the Vercel env var is provisioned.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export { captureRequestError as onRequestError } from "@sentry/nextjs";
