---
name: Phase 1 Complete
description: Burton's isolated Supabase project + auth scaffold landed. Commit b3a92bf. Ready for Phase 2.
type: project
updated: 2026-05-07
originSessionId: 791416d6-c275-4ad6-85f2-a1719bff2664
---
## Phase 1 status: COMPLETE (2026-05-07)

Committed as `b3a92bf` on bndtrentals.com main, pushed to GitHub.

## What got built

**bndt-prod Supabase project** (Burton's own, fully isolated)
- Project ref: `zgevzjlavbaxpirpautf`
- URL: https://zgevzjlavbaxpirpautf.supabase.co
- Region: us-east-1
- Org: grfmpihjnzfspngyndzo (Mako Logics)

**Schema (live in bndt-prod):**
- `admin_users` — auth source of truth (id, email, password_hash, role, totp_secret, must_change_password)
- `login_attempts` — rate-limit telemetry (15-min sliding window)
- `catalog_categories` + `catalog_products` — public catalog (RLS: anon read published rows)
- `quote_leads` — public quote form intake (RLS: anon insert, admin read via service_role)
- `calibration_recalls` — Burton's customer recall scheduler
- `page_sections` — editable copy for /about, /team, etc. (RLS: anon read published)
- Storage bucket `catalog-pdfs` (public read, 20MB cap, application/pdf only)

**Vercel env vars on bndt-showcase (production + development):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (sensitive, prod-only)
- `IRON_SESSION_PASSWORD` (sensitive, prod / dev)

**Code added:**
- `src/lib/supabase/{types,client,server,admin}.ts` — typed Supabase clients with strict server-only guard on the service-role one
- `src/lib/auth/{session,password,totp,rate-limit}.ts` — iron-session + bcryptjs + otplib v13 functional API + sliding-window rate limit
- `scripts/seed-admin.mjs` — idempotent admin seeder
- `supabase/migrations/0001_init.sql` — full schema, RLS, storage bucket, triggers

**First admin user seeded:**
- ID: fd28952c-3a45-4843-a77b-9bb83c1b5672
- Email: rsailors@makologics.com
- Full name: Russell Sailors
- Role: admin
- must_change_password: true
- Temp password: stored in `~/.claude/projects/.../secrets/admin-temp-password.txt` (mode 600, gitignored)

## Secrets stored locally (NEVER in chat or repo)

Path: `~/.claude/projects/c--Users-Russell-Sailors-OneDrive-Desktop-Mako-AI-Projects-Web-Projects-bndtrentals-com/secrets/`

- `bndt-prod-db-password.txt` — Postgres root password (32 chars, generated, only needed for emergency console access)
- `bndt-prod-credentials.txt` — Supabase URL + anon + service_role keys
- `iron-session-password.txt` — 48-char encryption key for the admin session cookie
- `admin-temp-password.txt` — Russell's first-login password (must change on first use)

The `.env.local` in bndtrentals.com (gitignored) has the operational subset Russell needs to run `npm run dev` or run scripts locally.

## Phase 2 next

- Replace mailto in QuoteForm with a server action: insert into quote_leads + send Resend email + verify Cloudflare Turnstile
- Install Resend / verify domain
- Migrate `src/lib/equipment.ts` (153 products) into `catalog_products` and `catalog_categories` (one-time data migration script)
- Add Cloudflare Turnstile widget to the form
- Wire onError handlers on next/image components (deferred from audit batch 9)
