---
name: Burton Production Architecture
description: Locked architecture for taking bndtrentals.com to production. Burton has its own dedicated Supabase project, fully isolated from makoai-portal and from any other Mako client.
type: project
updated: 2026-05-07
originSessionId: 791416d6-c275-4ad6-85f2-a1719bff2664
---
## Decision (corrected 2026-05-07 evening)

Russell sold the Burton NDT engagement on 2026-05-07. Earlier in the same session I locked an incorrect architecture (shared makoai-portal Supabase with tenant_id + RLS). Russell pushed back firmly: **"ALL CLIENTS SHOULD HAVE THERE OWN DATABSE"** + **"That way if they ever desided to leave us they can"** + **"MAKE A rule never mix databases"**. Hard rule now lives at `~/.claude/memory/feedback_per_client_isolated_databases.md` and applies to every Makologics client project from this point forward.

## Correct architecture for Burton

**Burton gets its own dedicated Supabase project** (separate from makoai-portal, separate from every other client). Suggested project name: `bndt-prod` (or `burton-ndt-prod`).

```
┌─────────────────────────────┐    ┌─────────────────────────────┐
│  RUSSELL'S MSP WORLD        │    │  BURTON'S WORLD             │
│  portal.makoai.studio       │    │  bndtrentals.com            │
│  Supabase: mako-cp          │    │  Supabase: bndt-prod (NEW)  │
│  (unchanged — no Burton     │    │                             │
│   tables added here)        │    │  • quote_leads              │
│                             │    │  • catalog_categories       │
│  • Russell's MSP tickets    │    │  • catalog_products         │
│  • Vendor licenses          │    │  • calibration_recalls      │
│  • Prospect pipeline        │    │  • page_sections            │
│  • His fleet view           │    │  • Storage: catalog-pdfs    │
└─────────────────────────────┘    └─────────────────────────────┘
       Russell logs in                    Burton staff log in at
       at portal.makoai.studio            bndtrentals.com/admin
                  │
                  └─ optional one-way notification webhook
                     "new lead came in" / "site error spike" so
                     Russell can glance at fleet status. Headlines
                     only, NOT a copy of Burton's actual data.
```

## What still holds from the original plan

- **Same-repo /admin route group at bndtrentals.com/admin** — confirmed. Burton's admin UI lives in the same Next.js project as the public site, just under `app/admin/*`. Not a separate subdomain.
- **4 starter modules:** `/admin/leads`, `/admin/catalog`, `/admin/calibration`, `/admin/content`. Module-driven sidebar so Russell can add more apps later.
- **Auth pattern:** iron-session + bcryptjs + TOTP for Burton staff login (matches existing fleet pattern from bishopbend, makobytes, etc.). Burton's auth tables live in Burton's Supabase, not the portal's.

## What changes from the original plan

- **No new tables added to makoai-portal Supabase.** Drop `0013_burton_tenant.sql`. Don't touch the portal's DB.
- **No JWT signing keypair between Burton and portal** (no per-client CP registration in `client_endpoints`, no master signing key for Burton). The complex JWT bridge was only needed because we were treating portal as the data home — it isn't.
- **The portal's existing `client_endpoints` / `master_signing_keys` infrastructure is for a different purpose** (per-client CP read-back into Russell's fleet dashboard). It can stay as-is for future use; Burton just doesn't need to register against it for core admin work.
- **Optional fleet-view bridge** (Russell sees Burton's headline metrics in his portal): if/when wanted, this is a small one-way webhook from Burton's site → portal `/api/master/log` (which already exists). Headlines like "Burton received 3 quotes today" — never the actual lead data.

## Revised pre-launch sequence

1. **(DONE 2026-05-07) Phase 0 — Full Sweep audit + 7 fix commits** (db662a2 through 5f4e6b0). Site is in production-shape state.
2. **Phase 1 — Burton infrastructure:**
   - Create new Supabase project `bndt-prod` for Burton
   - Schema: `quote_leads`, `catalog_categories`, `catalog_products`, `calibration_recalls`, `page_sections`, plus iron-session/auth tables for Burton staff
   - Storage bucket: `catalog-pdfs/`
   - Set Vercel env vars on bndtrentals: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, plus `IRON_SESSION_PASSWORD`, etc.
3. **Phase 2 — bndtrentals integrations:** Replace mailto with server action → write to Burton's Supabase + Resend email; Cloudflare Turnstile; analytics (already wired in audit pass 7); Sentry DSN flip; equipment.ts → DB
4. **Phase 3 — Burton's per-client CP at /admin:** 4 modules built against Burton's own Supabase (leads, catalog, calibration, content)
5. **Phase 4 — Real email backend:** Resend with verified bndtrentals.com domain, branded templates, calibration recall cron (Vercel Cron triggers)
6. **Phase 5 — DNS cutover:** Flip SITE.url to bndtrentals.com via Vercel env, attach production domain, 301 redirects from old WP slugs

## Cross-references

- Hard rule: `~/.claude/memory/feedback_per_client_isolated_databases.md`
- bndtrentals catalog has 153 products in `src/lib/equipment.ts` (will migrate to `catalog_products` table in Phase 2)
- `SITE.url` in `src/lib/site.ts` is env-driven (NEXT_PUBLIC_SITE_URL); flip during DNS cutover phase
- All audit fix commits are pushed to GitHub `MakoBytes-com/bndtrentals.com` main; Vercel auto-deploys to bndt-showcase preview
