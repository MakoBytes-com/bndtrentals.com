---
name: cloudflare-email-token
description: bndtrentals.com has its own dedicated Cloudflare email token; how to verify it without emailing the client
metadata:
  type: project
---

bndtrentals.com sends mail through Cloudflare Email Service (`src/lib/email/mail.ts`,
reads `MAIL_FROM` and `CLOUDFLARE_EMAIL_TOKEN`). Since 2026-09-21 it uses its OWN token,
"email-send-bndtrentals", id `95b2ba754d74f116f70bbdf033cfe478`, scoped to exactly one
permission — Email Sending Write — on account `b471d392a9c59820ee9139076366be7f`. It is
set in Production, Preview and Development.

**Why:** the previous value was a token shared across 17 projects. It was rotated on
2026-09-20 23:10Z and not replaced, so every one of those sites silently stopped sending.
One token per project means a future rotation can only ever break one site.

**How to apply:** to check this site's mail credential WITHOUT emailing Burton, POST
`accounts/<id>/email/sending/send` with the real sender and a recipient at a subdomain
that has no DNS (e.g. `mail-probe@zz-probe-nonexistent.bndtrentals.com` — confirmed no
wildcard record exists). HTTP 200 proves the credential authenticates and that
bndtrentals.com is still an onboarded sending domain, and it reaches no mailbox. Never
prove mail by submitting the real contact or quote form: both notify
`information@bndtrentals.com`, a live Microsoft 365 mailbox at the client. Actual
delivery into that mailbox has never been tested and cannot be without emailing them —
ask Russell first. See [[vercel-env-gotchas]].
