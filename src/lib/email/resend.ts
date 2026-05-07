import "server-only";

import { Resend } from "resend";

// Resend client. RESEND_API_KEY can be a "send-only" or "full access" key —
// we only use sending here. If the key isn't set, the helper returns null
// and callers should treat that as "email skipped, log only."
//
// Phase 4 will set RESEND_FROM to "Burton NDT Rentals <quotes@bndtrentals.com>"
// once the bndtrentals.com domain is verified in Russell's Resend account.
// Until then, RESEND_FROM should point at an already-verified domain (e.g.
// quotes@makoai.studio) so internal notification emails actually deliver.

let _client: Resend | null = null;

export function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (_client) return _client;
  _client = new Resend(key);
  return _client;
}

export function getResendFrom(): string {
  return (
    process.env.RESEND_FROM ??
    "Burton NDT Rentals <onboarding@resend.dev>"
  );
}

export function getResendNotificationTo(): string {
  // Where the quote-form notifications land. Defaults to information@
  // (Burton's published address) but can be overridden in Vercel env if a
  // different inbox triages quotes.
  return (
    process.env.RESEND_NOTIFICATION_TO ?? "information@bndtrentals.com"
  );
}
