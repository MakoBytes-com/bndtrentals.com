import "server-only";

import { getAdminSupabase } from "@/lib/supabase/admin";
import type { CustomerAuditAction } from "@/lib/supabase/types";

// Append-only audit trail for customer mutations. Failures are logged
// but never bubble — the audit log is observability, not a hard
// dependency on the mutation succeeding.

export async function recordCustomerAudit(params: {
  customerId: string;
  actorUserId: string | null;
  actorEmail: string | null;
  action: CustomerAuditAction;
  changes: Record<string, unknown> | null;
}): Promise<void> {
  try {
    const supa = getAdminSupabase();
    const { error } = await supa.from("customer_audit_log").insert({
      customer_id: params.customerId,
      actor_user_id: params.actorUserId,
      actor_email: params.actorEmail,
      action: params.action,
      changes: params.changes,
    });
    if (error) {
      console.warn("[audit] customer log insert failed", error);
    }
  } catch (err) {
    console.warn("[audit] customer log threw", err);
  }
}

// Compute a flat field-level diff between an old row and the new row.
// Only fields present in `next` are compared, so callers can pass just
// the columns the action actually touches.
export function diffRows<T extends Record<string, unknown>>(
  prev: T | null,
  next: Partial<T>,
): Record<string, { from: unknown; to: unknown }> | null {
  if (!prev) {
    // No prior state — treat the whole row as "to" for create paths.
    const out: Record<string, { from: unknown; to: unknown }> = {};
    for (const [k, v] of Object.entries(next)) {
      out[k] = { from: null, to: v };
    }
    return Object.keys(out).length === 0 ? null : out;
  }
  const out: Record<string, { from: unknown; to: unknown }> = {};
  for (const k of Object.keys(next)) {
    const a = (prev as Record<string, unknown>)[k];
    const b = (next as Record<string, unknown>)[k];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      out[k] = { from: a ?? null, to: b ?? null };
    }
  }
  return Object.keys(out).length === 0 ? null : out;
}
