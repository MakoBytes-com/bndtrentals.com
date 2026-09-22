# bndtrentals.com — Build Progress

**Project:** Burton NDT Rentals (La Porte, TX) — B2B NDT equipment rental catalog site.
**Stack:** Next.js + Tailwind + Vercel. Supabase project `bndt-prod` (Burton's own).
Auth: iron-session + bcryptjs + otplib (TOTP). Email: Resend. Captcha: Cloudflare Turnstile.
Analytics: in-house `page_views` / `analytics_events` + Vercel Analytics/Speed Insights. Errors: Sentry.

## State as of 2026-07-23 EOD — 🟢 LIVE, fast, full client workflow

### Shipped 2026-07-23 evening (see session_summary.md for full detail)
- **Fleet ticketing:** /admin/tickets on BNDT (staff can file; portal-connected via
  tenant JWT kid=y7ci33NV); root-caused + fixed fleet-wide Cloudflare 403
  (portal.makoai.studio now DNS-only); AAA + Bulldog verified, Bishopbend
  provisioned (kid=xGF54at1); portal dash: open-tickets feed + 30s auto-refresh.
  GOTCHA: multiline secrets → Vercel env MUST go via bash, never PowerShell (BOM).
- **Staff role system:** staff = day-to-day (full catalog, leads, customers,
  recalls, tickets); admin-only = site pages, users, analytics, errors, deletes.
- **Burton fleet refresh executed** (their emailed list): SciAps PMI lineup
  (Z-200/902/903 added, X-550 updated, Nitons+Delta unpublished), NEW GPR category
  (Mala added, GSSI moved; in nav dropdown+footer via NAV_EQUIPMENT — HARDCODED
  list, update it for any future category), IPLEX G Lite added, Cygnus→1EX,
  Inuktun + Tank Floor Scanner unpublished, homepage featured + applications pages
  + meta keywords updated, calibration card renamed "Burton NDT Calibration List".
- **Email drafted for Russell → Burton:** all changes + upgrades + ask-list
  (AD3 info, in-stock borescope list, calibration PDF, repair rates, application +
  cal-block photos, missing spec sheets, Z-Series keep/remove question) + meeting
  request (walkthrough + create employee accounts). Russell sends it himself.

### Next actions
- Russell sends Burton email; on reply: create staff accounts (Admin → Users →
  New user, role Staff), execute remaining items when materials arrive.
- Russell sends Burton portal invite himself (portal → client → Users tab).
- Speed Insights will go green over days as new field data accumulates.
- Carry-overs: Google Search Console submission; contact-form live test;
  old WP host decommission decision; deferred lint cleanup (10 pre-existing);
  Woodlands ticketing when they become a paying client.

### Shipped 2026-07-23 morning (see session_summary.md for detail)
- **2FA reset for Russell** (was locked out; enrollment forced fresh on next login)
- **PERF: public pages now CDN-cached (ISR)** — fixed P75 FCP 7.1s / LCP 9.4s.
  All public routes prerender (catalog 5m revalidate, content 1h); visual CMS
  moved from ?edit=1 to Next draft mode (/api/cms/edit + /exit); CSP split:
  admin/editor keep nonce+strict-dynamic, cached public pages use allowlist
  ('unsafe-inline' script-src). Catalog admin mutations revalidatePublicCatalog().
  Speed Insights should go green as new field data accumulates (give it days).
- **Security:** next 16.2.11 (middleware-bypass + cache-confusion + SSRF CVEs),
  sharp ^0.35.3 via override, npm audit 0, GitHub alerts 0. ESLint back to ^9
  (v10 unsupported by eslint-config-next; dependabot ignores eslint majors now).
- **Product photo galleries:** new catalog_product_images table (RLS anon-read
  published only; 95 covers backfilled). Admin: multi-upload, delete w/ confirm,
  make-cover; storage cleanup on delete/replace/product-delete. Public product
  page: gallery w/ thumbnails; JSON-LD image array.
- **Spec sheets:** View/Remove + replace cleans old upload.
- **Leads inbox:** per-row Spam/Not-spam + Delete. **Customers list:** per-row Delete.
- Commits: ad9dd46 (security), 95ecffa (perf/ISR), 5e4c356 (features). All deployed
  (manual `vercel --prod`), browser-audited 0 CSP violations, error_events empty.

### Open / discussion
- **Employee users with special rights** — Russell wants staff accounts with
  limited permissions; he said "we can discuss when you're ready". admin_users
  already has role admin|staff but nothing gates on role yet. Needs a
  permissions design proposal.
- Lint: 10 pre-existing errors (new react-hooks v6 strictness: Date.now in
  server components = false positives; QuoteCart/QuoteForm setState-in-effect;
  Editable.tsx refs) — build unaffected; clean up in a maintenance pass.
- Dependabot PRs #15 (@types/node 26 major) + #18 (11-pkg minor group, will
  rebase after today's lockfile changes) still open.
- .env.local recreated locally from secrets file (now gitignored via .env*.local).

## State as of 2026-06-18 — 🟢 LIVE (historical)

Site is **LIVE** at https://bndtrentals.com (DNS cut over from the old WordPress on 2026-06-17).
www 308→apex. SSL issued. MS365 mail intact. npm audit = 0 vulns. ~163 routable URLs.

### Shipped
- Initial production build (Burton NDT, La Porte TX) — 2026-05-03
- 7-pass audit (2026-05-07): cutover-safe URL + strict CSP via proxy.ts; WCAG 2.1 AA;
  SEO metadata + sitemap + llms.txt/llms-full.txt; local-SEO landing pages (La Porte,
  Groves, Marietta); privacy/terms rewrite; perf (next/image hero, dynamic drawer);
  observability (Vercel Analytics + Speed Insights + Sentry).
- Phase 1: Burton's own Supabase + auth scaffold
- Phase 2: server action + 95 products migrated to bndt-prod
- Phase 3 (A–G): full admin panel — leads inbox, catalog CRUD + PDF upload, calibration
  recalls, page_sections content editor, TOTP enroll/disable, user mgmt, customers module,
  analytics dashboard (Recharts), errors module
- Phase 4 (partial): Turnstile live, Resend domain registered
- Hardening sweep: distributed rate limit + audit log + cleanup cron + privacy
- Polish sweep: branded 404 + favicon set + quote-form honeypot
- 2026-05-12: Dependabot weekly + patch auto-merge enabled; minor-and-patch bump (#2);
  postcss override to clear transitive CVE

### Shipped 2026-06-17/18 (GO-LIVE session — see session_summary.md for full detail)
- **GO LIVE:** DNS cutover at Network Solutions (worldnic, authoritative — NOT host10/makologics);
  set NEXT_PUBLIC_SITE_URL; deploys were MANUAL `vercel --prod` at the time.
  **CORRECTED 2026-09-21: git auto-deploy IS wired now, for BOTH targets.** The project is
  linked to github/MakoBytes-com/bndtrentals.com with productionBranch `main`. Verified by
  doing it: pushing a branch built a preview unprompted, and pushing `main` deployed straight
  to production (commit 3a61416) with no `vercel --prod`. **A push to main ships the live
  client site** — treat it as a deploy, not a save.
- **Security:** moved proxy.ts → src/proxy.ts (CSP was dead); CSP now ENFORCING (style-src 'unsafe-inline',
  script-src nonce+strict-dynamic), browser-audited 0 violations; captcha on admin login; MANDATORY 2FA.
- **Admin:** password reset (only admin = rsailors@makologics.com); users module already existed;
  product IMAGE upload (catalog-images bucket + /images/uploads rewrite); PDF upload fixed (/pdfs/uploads rewrite);
  deleted dead "Site content" module.
- **Visual CMS:** edit text/images in place on all 11 pages (?edit=1 + admin session). PageHero/CtaBanner CMS-aware.
  Content in page_sections row cms:<page> (JSONB metadata). /admin/pages launcher ("Edit visually" opens new tab).
- **Contact form** on /contact (Turnstile + honeypot + stores in quote_leads + emails).
- **Resend:** bndtrentals.com VERIFIED (3 records at NetSol on send.* subdomain + DKIM); From now quotes@bndtrentals.com.
- **MakoChat:** Burton client provisioned (slug bndt, Retell brain + KB of 71 PDFs, leads→information@); widget on public pages.
- **Deps:** Dependabot #13 merged + npm audit fix → 0 vulns. Product-title dedupe (productDisplayName helper).
- **SEO:** robots allows all major AI bots (CCBot blocked); sitemap 123; llms.txt; rich JSON-LD. AI-crawler ready.

## Open / Next
- **Google Search Console** — submit site + sitemap to index the fresh cutover (needs Russell's Google login). HIGHEST impact, NOT done.
- **Contact form live test** — Russell to submit one real message, confirm it hits information@bndtrentals.com.
- Old WordPress host (host10 / 72.52.251.108) still running as ROLLBACK SAFETY — don't cancel yet.
- Optional: CMS depth per-page (name a page); "Replace background" control for hero bg images.

## Notes / gotchas
- Public site reads catalog live from bndt-prod; admin edits go live instantly.
- Admin route group `admin/(authed)` — do NOT header-sniff (redirect loop). 2FA gate uses proxy x-pathname.
- Local builds need env: create .env.local from the bndt-prod-credentials.txt secrets file + a dummy IRON_SESSION_PASSWORD.
- Vercel service-role + Resend keys are "Sensitive" (vercel env pull returns empty) — use the secrets file / fleet Resend key on disk.
- bndt-prod Supabase creds: ~/.claude/projects/...OneDrive-Desktop...bndtrentals-com/secrets/bndt-prod-credentials.txt
