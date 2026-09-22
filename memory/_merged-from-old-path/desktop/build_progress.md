---
name: Build Progress
description: Running log of completed tasks and blockers
type: project
updated: 2026-05-07
originSessionId: 791416d6-c275-4ad6-85f2-a1719bff2664
---
## bndtrentals.com — Build Progress

**Status:** v1.4 fully audited. Burton NDT engagement closed 2026-05-07. Production prep — Phase 0 (Full Sweep audit) complete, all 63 findings shipped across 7 commits, all CRITICAL + HIGH items closed. Ready to start Phase 1 (portal backend + tenant signing keys).

### Stack
- Next.js 16.2.4 + React 19.2.4 + TypeScript + Tailwind v4 (App Router, Turbopack)
- next/font: Inter (body) + Sora (display) self-hosted
- Vercel hosting, project bndt-showcase under mako-studi team
- proxy.ts (Next 16's middleware replacement) emits strict per-request nonce CSP
- @vercel/analytics + @vercel/speed-insights mounted in root layout (zero-config)
- @sentry/nextjs scaffolded as no-op until SENTRY_DSN env var is set

### Real business
**Burton NDT Rentals** — 35+ year industrial inspection equipment rental, sales, calibration & repair.
- La Porte, TX (HQ) — 832 S. Broadway St., 281-941-4311
- Groves, TX — 2929 W Parkway St., 409-433-8158
- Marietta, GA — 1710 Cumberland Point Suite 10, 470-633-0212
- Email: information@bndtrentals.com
- LinkedIn: https://www.linkedin.com/company/burton-ndt-rentals/
- **Burton NDT LLC since 2020** (Russell corrected 2026-05-07; was misremembered as 2019)
- Brand legacy: 35+ years through prior entities (since 1990)
- Leadership: Mark Burton (Founder/President), Eric L. Williams (Gulf Coast Ops Mgr), Mark Eddy (Southeast Regional Ops Mgr), Tyler Burton (Customer Service Mgr)

### Done — 2026-05-07 audit session

Architecture decisions locked first (see `architecture_decision.md`):
- Tier 1: portal.makoai.studio/admin (Russell, fleet-wide)
- Tier 2: bndtrentals.com/admin (Burton staff, same-repo CP)
- Schema: Pattern A (per-purpose tables in makoai-portal Supabase, client_id + RLS)

Then 7 audit-fix commits shipped:

1. `db662a2` Audit pass 1 — cutover-safe SITE.url env var, strict CSP via proxy.ts with nonces, error.tsx + global-error.tsx, multi-location LocalBusiness schema, BreadcrumbList JSON-LD on product pages, founding model correction, file hygiene (.JPG.jpg renames, orphan logo deletes, calibration PDF rename), .env.example seeded

2. `6a377f6` Audit pass 2 — cart aria-modal + Escape + focus management, QuoteForm aria-required + sr-only, SiteHeader Equipment dropdown converted to keyboard-accessible disclosure, prefers-reduced-motion, sr-only utility, all target=_blank get noreferrer, equipment PDF aria-label announces "(PDF, opens in new tab)"

3. `485c1f5` Audit pass 3 — pageMetadata() helper centralizes OG + Twitter + canonical across 13 pages, llms-full.txt route handler, QuoteCart hydrate validates each entry + handles QuotaExceededError, errors fed to shared bndt-error-buffer-v1 localStorage

4. `003ab40` Audit pass 4 — /locations hub + 3 location landing pages (/locations/la-porte, /locations/groves, /locations/marietta) with per-hub LocalBusiness JSON-LD, src/lib/location-content.ts with hours + service area + industries

5. `384d7d0` Audit pass 5 — /privacy rewritten with full processor enumeration (Vercel + Sentry + Resend + Turnstile + Maps + YouTube), GDPR/CCPA/CPRA blocks, COPPA, retention; /terms section 1a clarifies signed-PDF acceptance; founding-date copy fixed to 2020 across about page + team.ts Mark Burton bio

6. `bea0053` Audit pass 6 — Home hero + PageHero converted from CSS background-image to next/image (fill + priority + sizes=100vw); CartDrawer + BackToTop → next/dynamic post-hydration

7. `5f4e6b0` Audit pass 7 — @vercel/analytics + @vercel/speed-insights mounted, @sentry/nextjs scaffolded with PII scrubbing, instrumentation.ts (Next 16 hook), CSP connect-src extended for sentry.io ingest

### In Progress / Next Up
- Phase 1: makoai-portal backend foundation (new tables, signing keys, lead intake API, storage bucket)
- Phase 2-5: bndtrentals integrations → admin CP → email → DNS cutover

### Blocked / Waiting On
- Russell's go on starting Phase 1
- Burton input on calibration 2022 pricing currency, LinkedIn URL verification
- Sentry account creation + DSN (when ready to flip on observability)
- Vercel production env var NEXT_PUBLIC_SITE_URL (set at DNS cutover)

### Files of note (current state)
- `proxy.ts` — Next 16 middleware replacement, per-request CSP with nonces, sentry.io connect-src allowed
- `instrumentation.ts` + `sentry.{client,server,edge}.config.ts` — Sentry scaffold, no-op without DSN
- `src/app/error.tsx` + `src/app/global-error.tsx` — error boundaries with localStorage buffer
- `src/lib/page-metadata.ts` — central OG/Twitter/canonical helper
- `src/lib/location-content.ts` — per-hub copy for location landing pages
- `src/lib/site.ts` — SITE.url env-driven, brandSince=1990, llcFounded=2020
- `src/lib/equipment.ts` — 153 products across 7 categories
- `src/components/CartDrawer.tsx` — aria-modal + Escape + focus restore
- `src/components/SiteHeader.tsx` — Equipment dropdown is now a proper disclosure
- `src/components/QuoteCart.tsx` — validates entries on hydrate, handles quota exceeded
- `src/components/PageHero.tsx` — next/image with fill + priority
- `src/app/layout.tsx` — Analytics + SpeedInsights mounted, dynamic CartDrawer + BackToTop
- `src/app/locations/page.tsx` + `src/app/locations/[slug]/page.tsx` — local-SEO landing pages
- `src/app/llms.txt/route.ts` + `src/app/llms-full.txt/route.ts` — AI-crawler reference docs
- `src/app/privacy/page.tsx` — full processor enumeration with GDPR/CCPA blocks
- `src/app/terms/page.tsx` — signed-PDF acceptance clarification (section 1a)
- `next.config.ts` — security headers + cache headers for /images, /pdfs, page routes

### Notes
- All 130 pages dynamically rendered (expected with nonce-based CSP)
- 2 moderate PostCSS CVEs remain via transitive Next.js dep — fix is wait for Next 16.3 patch (npm audit fix --force would wrongly downgrade to Next 9.3.3)
- Phase 0 (audit) complete; Russell's "I want everything fixed please" satisfied
- Domain bndtrentals.com NOT yet pointing at this build (preview-only at bndt-showcase.vercel.app)
