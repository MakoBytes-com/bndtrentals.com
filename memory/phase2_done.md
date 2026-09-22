---
name: Phase 2 Complete
description: Quote form now writes to bndt-prod and emails via Resend. 95 catalog products migrated. Commit 20769cf.
type: project
updated: 2026-05-07
originSessionId: 791416d6-c275-4ad6-85f2-a1719bff2664
---
## Phase 2 status: COMPLETE (2026-05-07)

Commit `20769cf` on bndtrentals.com main, pushed to GitHub.

## What got built

**Server action — `src/app/quote/actions.ts`**
- `"use server"` `submitQuote(input)`
- Zod validation with structured `fieldErrors` returned to client
- IP + user-agent gathered from request headers
- Turnstile verification via `lib/turnstile.ts` (fails open until configured)
- Inserts into `quote_leads` via service-role client (bypasses RLS by design)
- Fires Resend notification email (non-fatal — lead is durable even if email fails)

**Turnstile + Resend libs**
- `src/lib/turnstile.ts` — server-side siteverify; missing TURNSTILE_SECRET_KEY = fail-open with warn (pre-Phase-4)
- `src/lib/email/resend.ts` — getResendClient / getResendFrom / getResendNotificationTo
- `src/lib/email/quote-notification.ts` — branded HTML + text email template, HTML-escaped, Reply-To = customer email

**QuoteForm rewired**
- Dropped mailto:; calls `submitQuote()` via `useTransition`
- Surfaces field-level Zod errors in an `role="alert"` region
- Disables submit while pending, clears cart on success
- Success copy updated from "your email client just opened" to "we got your request" (accurate now)

**Catalog data migration**
- `scripts/migrate-equipment-to-db.ts`
- 7 catalog_categories + **95 catalog_products** upserted to bndt-prod (live, verified)
- Idempotent via unique slug constraints
- Note: earlier audit-agent claim of "153 products" was wrong; actual catalog has 95

## Phase 4 dependencies waiting on Russell

For full Phase 4, Russell needs to provide:

1. **Resend Full Access API key** (5 min, one-time):
   - https://resend.com/api-keys → "Create API Key"
   - Permission: **Full access** (the makoai-portal key is "send-only" and can't add new domains)
   - Paste back to me as a single line
2. **Cloudflare API token** (5 min, one-time, then never asked again across the fleet):
   - https://dash.cloudflare.com/profile/api-tokens → "Create Token" → "Custom token"
   - Permissions:
     - Account → Cloudflare Turnstile → Edit
     - Zone → DNS → Edit (scoped to "All zones from an account" or specifically the bndtrentals.com zone if it's already in his CF account)
   - Paste back to me

Once those land I will:
- Add bndtrentals.com to Resend → get DNS records
- Create a Turnstile site for bndtrentals.com → get site/secret keys
- Push DNS records (Resend SPF/DKIM + later Vercel domain TXT) to Cloudflare DNS via API
- Set `RESEND_FROM=quotes@bndtrentals.com`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` on Vercel
- Wire the Turnstile widget into QuoteForm
- Build branded HTML email templates
- Wire Vercel Cron for calibration recall reminders

## Phase 3 (next, biggest build)

Burton's per-client admin CP at `/admin/*`. Modules planned:
1. `/admin/login` + `/admin/account/change-password` (forced on first login) + `/admin/account/totp-setup` (QR enrollment)
2. `/admin/leads` — list, detail, status updates, internal notes, assign to staff
3. `/admin/catalog` — categories + products CRUD with PDF/image upload to catalog-pdfs bucket
4. `/admin/calibration` — recall scheduler, "due in 30 days" view, mark complete
5. `/admin/content` — page_sections WYSIWYG (or markdown — pick at build time) for editable copy

Existing in `src/lib/auth/`: session, password, totp, rate-limit modules ready to wire into the login route handler.
