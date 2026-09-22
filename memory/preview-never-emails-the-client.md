---
name: preview-never-emails-the-client
description: "How bndtrentals preview is stopped from emailing Burton or their customers, and the one secret deliberately left out of preview"
metadata: 
  node_type: memory
  type: project
  originSessionId: 4b47c505-c7c5-42d1-b031-0d2c595abe05
  modified: 2026-09-21T09:43:01.781Z
---

Preview on this project can send mail (CLOUDFLARE_ACCOUNT_ID and
CLOUDFLARE_EMAIL_TOKEN are both set there), so two paths could reach real people:
the contact and quote forms notify `information@bndtrentals.com`, and the
calibration recall job in `src/lib/email/recall-notification.ts` emails **each
customer's own address straight from the database**. Only the first was
overridable, and neither was gated on the environment.

Two things now stop it, set 2026-09-21:

1. `MAIL_NOTIFICATION_TO` = `rsailors@makologics.com` on **preview only**.
   Production does not set it and still defaults to `information@bndtrentals.com`.
2. `sendMail()` in `src/lib/email/mail.ts` redirects **every** recipient unless
   `process.env.VERCEL_ENV === "production"`. This covers the recall path and any
   future call site, and it also covers local `next dev`, where VERCEL_ENV is
   undefined. The redirected subject names the intended recipient so a test send
   is still legible. Production behavior is unchanged.

**`SUPABASE_SERVICE_ROLE_KEY` is deliberately NOT set on preview.** It bypasses RLS
on Burton's live database. Admin routes on preview therefore throw from
`getAdminSupabase()` at request time — that is the intended posture, not a bug to
fix. The build is unaffected because that throw is lazy. If preview admin is ever
genuinely needed, the decision to copy that key is Russell's, not a routine repair.

`TURNSTILE_SECRET_KEY` IS set on preview, even though the Turnstile widget only
allowlists `bndtrentals.com` and `bndt-showcase.vercel.app`, so preview captcha
fails closed. That is on purpose: `verifyTurnstile()` **fails OPEN when the secret
is unset**, which would leave admin login on preview with no bot check at all.

**Why:** preview deployments are also protected by Vercel SSO (an anonymous request
gets a 302 to `vercel.com/sso-api`), but that is Vercel's setting and could be turned
off; the guards above do not depend on it.

**How to apply:** never prove mail by submitting the real contact or quote form — see
[[cloudflare-email-token]] for the probe that tests the credential without emailing
Burton.
