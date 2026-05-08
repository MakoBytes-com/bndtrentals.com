import "server-only";

import { createHash } from "crypto";
import { getAdminSupabase } from "@/lib/supabase/admin";

// Server-side error logger. Writes structured error rows to the
// `error_events` table so the admin panel /admin/errors surface has
// something to show even when SENTRY_DSN isn't provisioned. Sentry still
// fires in parallel via instrumentation.ts when the DSN is set.
//
// The fingerprint is a stable hash of message + module — same error from
// 50 different requests collapses into one fingerprint, so the dashboard
// can roll them up by fingerprint instead of drowning in dupes.

export type LogContext = {
  path?: string | null;
  userAgent?: string | null;
  context?: Record<string, unknown>;
};

function fingerprintFor(module: string, message: string): string {
  return createHash("sha1")
    .update(`${module}::${message}`)
    .digest("hex")
    .slice(0, 16);
}

function stackOf(err: unknown): string | null {
  if (err instanceof Error && err.stack) return err.stack;
  return null;
}

function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message || err.name || "Unknown error";
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err).slice(0, 500);
  } catch {
    return "Unserializable error";
  }
}

async function persist(
  level: "error" | "warn",
  module: string,
  err: unknown,
  ctx?: LogContext,
): Promise<void> {
  const message = messageOf(err);
  const fingerprint = fingerprintFor(module, message);
  try {
    const supa = getAdminSupabase();
    await supa.from("error_events").insert({
      level,
      module,
      message: message.slice(0, 2000),
      fingerprint,
      stack: stackOf(err),
      path: ctx?.path ?? null,
      user_agent: ctx?.userAgent ?? null,
      context: ctx?.context ?? null,
    });
  } catch (writeErr) {
    // Never let logging itself crash a request. Console fallback so the
    // failure is at least visible in the runtime log.
    console.warn("[log] error_events insert failed", writeErr);
  }
}

export function logError(module: string, err: unknown, ctx?: LogContext): void {
  console.error(`[${module}]`, err);
  void persist("error", module, err, ctx);
}

export function logWarn(module: string, err: unknown, ctx?: LogContext): void {
  console.warn(`[${module}]`, err);
  void persist("warn", module, err, ctx);
}
