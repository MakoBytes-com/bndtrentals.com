// Next.js 16 instrumentation hook — picks up the right Sentry config per
// runtime AND mirrors errors into our own error_events table so the
// /admin/errors surface stays useful even before SENTRY_DSN is provisioned.

import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Mirror request-time errors into error_events too. The signature here
// tracks Sentry's `captureRequestError`; we pass the same args through to
// keep behavior identical.
export const onRequestError: typeof Sentry.captureRequestError = async (
  err,
  request,
  context,
) => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { logError } = await import("./src/lib/log");
      const headers = (request as { headers?: Record<string, string | string[] | undefined> })
        .headers;
      const ua = headers?.["user-agent"];
      const path = (request as { path?: string }).path ?? null;
      const method = (request as { method?: string }).method ?? null;
      logError(`request:${context.routePath}`, err, {
        path,
        userAgent: typeof ua === "string" ? ua : null,
        context: {
          method,
          routerKind: context.routerKind,
          routeType: context.routeType,
        },
      });
    } catch {
      // Never let our logger break Sentry's path.
    }
  }
  return Sentry.captureRequestError(err, request, context);
};
