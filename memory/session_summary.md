# bndtrentals.com — Session Summary Log

## 2026-09-21 (later) — PREVIEW ENV REPAIRED: 8 ciphertext blobs + 3 never-copied secrets
Preview (NOT production) held Vercel ciphertext stored as plaintext in 8 of its vars.
Confirmed independently by pulling preview to a temp path outside the repo: CLIENT_ID,
MASTER_API_URL, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL,
NEXT_PUBLIC_TURNSTILE_SITE_KEY, TENANT_PRIVATE_KEY, TENANT_PUBLIC_KEY_KID all began
`eyJ2IjoidjIi`. Production pulled 38/38 clean and was never touched (diffed before/after:
only VERCEL_OIDC_TOKEN differs, and that is regenerated on every pull).

CAUSE (see [[vercel-env-api-returns-ciphertext]]): all 9 preview entries were created in a
3-second window, 2026-07-28 09:09:38–09:09:40Z — a script, not hand-editing. The Vercel REST
API returns `encrypted` values as ciphertext and **ignores `?decrypt=true`** (reproduced by
hand today), and returns nothing at all for `sensitive` ones. So the same single read
corrupted the 8 encrypted vars AND silently skipped the 3 sensitive ones
(IRON_SESSION_PASSWORD, SUPABASE_SERVICE_ROLE_KEY, TURNSTILE_SECRET_KEY, which were simply
absent from preview). MASTER_PUBLIC_KEY was corrupted in the same batch but is clean because
a rotation rewrote it on 2026-07-31.

FIX (env only, all writes preview-scoped — verified 11 writes, 0 duplicates, production and
development untouched): restored the 7 environment-neutral values from a `vercel env pull` of
production (never from an API read); set NEXT_PUBLIC_SITE_URL to the preview alias
`https://bndtrentals-com-git-main-makoai-studio.vercel.app` so a preview build cannot claim
the client's canonical; added MAIL_NOTIFICATION_TO=rsailors@makologics.com; added a FRESH
random IRON_SESSION_PASSWORD (deliberately not production's) and TURNSTILE_SECRET_KEY pulled
from Cloudflare. **SUPABASE_SERVICE_ROLE_KEY deliberately left out of preview** — see
[[preview-never-emails-the-client]].

PROOF: re-pulled preview — 14 real values, 0 ciphertext, 0 empty. Verified the key material
rather than eyeballing it: TENANT_PRIVATE_KEY parses as a 2048-bit RSA key, signs and verifies,
and is byte-identical to production's; the Supabase anon JWT's `ref` claim matches its URL.
Then proved it end-to-end — the first preview build since the corruption FAILED on the missing
IRON_SESSION_PASSWORD, and after adding it the redeploy reached READY. Live production
re-checked: HTTP 200, full security-header baseline, correct canonical.

CODE (branch `guard/no-client-email-from-preview`, commit e9591de — pushed, NOT merged or
deployed): `sendMail()` now redirects every recipient unless VERCEL_ENV === "production".
MAIL_NOTIFICATION_TO alone did not cover the calibration recall job, which emails each
customer's own address from the database. Also fixed the bounce/suppression check, which
compared Cloudflare's reply against the requested address instead of the one actually sent to.
Typecheck and eslint clean; production behavior unchanged.

THEN RUSSELL SAID "Fix them" AND IT WAS ALL CLOSED OUT:
- Local `npm run build` clean → merged `guard/no-client-email-from-preview` into main
  (merge 3a61416) → pushed. **Discovered git auto-deploy IS wired for production too** —
  the push deployed the live client site by itself, no `vercel --prod`. Reached READY on
  3a61416; live site re-verified: HTTP 200, full security-header baseline, correct canonical,
  /quote /contact /equipment all 200. build_progress.md corrected — it wrongly said deploys
  were manual, which would have made a future session treat a push to main as a save.
- Global `~/.claude/CLAUDE.md` gained a HARD RULE: never read an env VALUE from the Vercel
  REST API; `vercel env pull` is the only thing that decrypts; `?decrypt=true` is ignored;
  check for MISSING vars too, since `sensitive` ones are skipped rather than corrupted.
- Turnstile secret on preview verified FUNCTIONALLY, not just "not ciphertext": POSTed it to
  challenges.cloudflare.com/turnstile/v0/siteverify with a junk token — `invalid-input-response`
  means the secret was accepted and only the dummy token rejected. (Method from the
  localaibox-site session.) No side effects, never touches the live form.
- bishopbend was already repaired by its own session the same morning (its memory note
  reference_vercel_preview_env_ciphertext_corruption.md, 09:37Z); localaibox-site and
  makobytes were handled in their own tabs, both briefed with the cause and the safe method.
  localaibox confirmed the same run and pinned its start at 09:09:32.426Z.

NOTHING LEFT OPEN on this project from this incident.

## 2026-09-21 — OUTBOUND EMAIL RESTORED: dedicated Cloudflare token (no code change)
A shared fleet Cloudflare API token was rotated 2026-09-20 23:10Z and never replaced in
most projects' Vercel env; 17 projects shared the dead value. BNDT was fixed first (real
client). Confirmed dead myself: production's stored token returned 401 / code 1000
"Invalid API Token" at /user/tokens/verify.
FIX (no commit — env only): minted a project-dedicated token "email-send-bndtrentals",
id 95b2ba754d74f116f70bbdf033cfe478, ONE policy = Email Sending Write
(5df633d6b41c42bcaf5b4a62b9d14b64) on account b471d392... and nothing else. Set as
CLOUDFLARE_EMAIL_TOKEN in Production + Preview + Development (the old dead record spanned
all three), then `vercel redeploy` of the live deployment — env changes do nothing until
a redeploy. Live domain now served by dpl_3Jj1owTBzeN1DKzZL8LL1e4uP5bg.
PROOF: re-pulled prod AND preview after writing and re-verified each value at Cloudflare —
/user/tokens/verify returns the token's ID, so the returned id matching the minted id is a
positive identification, not an inference. Then POSTed the real send endpoint with
production's own stored token + the real sender (Burton NDT Rentals <quotes@bndtrentals.com>)
to mail-probe@zz-probe-nonexistent.bndtrentals.com (no MX, no A, no wildcard → reaches no
mailbox): HTTP 200, success:true, message_id issued @bndtrentals.com. That proves the
credential authenticates AND the sending domain is still onboarded. It does NOT prove
delivery into information@bndtrentals.com — untested, because testing it would email the
client (see the Bishopbend password-reset escalation).
IMPACT = NONE: both forms insert into quote_leads BEFORE mailing and email failure never
fails the submission, so nothing could be lost. Verified 0 leads since 2026-09-20 23:10Z
(last lead 2026-09-17), 0 active calibration_recalls, error_events empty. No customer
missed anything.
GOTCHAS WORTH KEEPING:
- `vercel env add NAME preview` SILENTLY FAILS from stdin: returns JSON action_required /
  git_branch_required and waits for a branch; `--value --yes` (its own suggested fix)
  fails the same way on CLI 50.41.0. Workaround that works: POST
  api.vercel.com/v10/projects/<id>/env?teamId=<team>&upsert=true with target ["preview"],
  using the CLI's own creds at AppData\Roaming\com.vercel.cli\Data\auth.json.
  ALWAYS re-check `vercel env ls` after any env write — do not trust the CLI's output.
- A var that pulls back EMPTY can be EITHER Vercel's write-only `sensitive` type or a
  genuinely empty value — check `type` via GET api.vercel.com/v9/projects/<id>/env before
  concluding. Here SUPABASE_SERVICE_ROLE_KEY / TURNSTILE_SECRET_KEY / IRON_SESSION_PASSWORD
  are sensitive (empty pull is normal); CLOUDFLARE_* are `encrypted` and readable, which is
  the only reason this fix could be verified by pulling. Counter-example same day:
  bdsgovservices.com had NO sensitive vars and its empty token was real breakage.
- Never reuse one Cloudflare token across projects — that sharing is what caused this
  17-project outage.

## 2026-07-23 (evening) — Burton fleet-refresh email executed (commits cc62072, baf1aae)
Burton emailed a numbered change list (excerpt: items 4-24 w/ gaps = internal items);
assets in C:\Users\Russell.Sailors\OneDrive\Desktop\BNDT. Reading: they refreshed
their rental fleet; site showed retired gear. Russell approved "fix it all".
SHIPPED (DB via one-shot script + 2 code commits, deployed + live-verified):
- PMI → SciAps lineup: added Z-200 / Z-902 / Z-903 LIBS (photos+specs, product ids
  d612f640/ffe26310/3c160df8); X-550 new photo+alloy spec (e18308ae); UNPUBLISHED
  (recoverable) Niton XL5/XL3t/XL2, Olympus Delta. Generic "SciAps Z-Series LIBS"
  listing left published (overlaps new specifics — flag to Burton).
- NEW "Ground Penetrating Radar (GPR)" category (slug gpr, sort 3; later cats
  bumped): added Mala Easy Locator Core (ffc25459); MOVED GSSI MINI XT from
  ndt/3D Laser Scanners (was miscategorized; its URL changed to /equipment/gpr/...).
- RVI: added Olympus IPLEX G Lite (81834186, photo only — no spec sheet yet);
  IPLEX LX + MX II LEFT PUBLISHED pending Burton's in-stock borescope list.
- Cygnus renamed "1EX Intrinsically Safe Thickness Gauge" + new photo + spec (f54e034d).
- Unpublished Inuktun Versatrax 150 + Tank Floor Scanner.
- Homepage FEATURED swapped: Niton XL5→X-550, IPLEX MX II→G Lite, Inuktun→Pearpoint
  flexitrax P550C. Applications pages: PMI list = 4 SciAps units; RVI: G Lite in,
  Inuktun out. Meta keywords Niton→SciAps. Calibration card renamed "Burton NDT
  Calibration List" (PDF itself still the old price list — needs Burton's new file).
STILL NEEDED FROM BURTON (ask-list): AD3 photo+info (item 11 — unknown unit);
in-stock borescope list (5/22); updated calibration list PDF (16); repair hourly
rate + evaluation fee numbers (19); application photos (17); calibration block
photos (24); spec sheets missing: SciAps X-903, GSSI MINI XT, IPLEX G Lite,
Tank & Vessel Inspection Camera (also has placeholder pic + no mfr); ~10 products
still on old placeholder photos (pro*.jpg/png).
Q&A: form emails go to information@bndtrentals.com (RESEND_NOTIFICATION_TO override
possible; from quotes@bndtrentals.com, reply-to = customer).
FOLLOW-UP (commit d03f31d): Russell caught GPR missing from the header dropdown —
NAV_EQUIPMENT in lib/site.ts is HARDCODED (drives header dropdown + mobile menu +
footer). Any future new category needs a NAV_EQUIPMENT entry too. Fixed + verified
(3 gpr links on homepage).

## 2026-07-23 (later) — Staff role system shipped (commit 2a937d0)
Russell picked via question flow: staff get FULL CATALOG (incl. add/delete products),
NO permanent deletes of leads/customers; admin-only: site pages editor, users,
analytics, errors. Implementation: session.ts isFullAdmin()/requireFullAdminPage()/
ADMIN_ONLY_ERROR; role gates server-side in users actions (all 5), errors actions,
cms-actions (save/upload), /api/cms/edit route, deleteLead, deleteCustomer;
getEditMode() also requires admin role (defense in depth). Pages gated: /admin/pages,
users (list/edit/new), analytics, errors (list/detail) → staff redirect to /admin.
UI: AdminShell hides "Web work" section + "Users" link for staff; delete buttons
hidden for staff (LeadRowActions canDelete prop, customers list Actions column,
CustomerEditForm danger zone). Role rides session cookie → changes apply next
sign-in (8h max). Deployed + verified live. Creating employees: Admin → Users →
New user, role Staff; forced password change + TOTP enrollment already built.
GOTCHA: PS 5.1 mangles embedded double quotes in git -m here-strings → use -F file.

## 2026-07-23 (latest) — FLEET TICKETING: root cause fixed + all paying clients wired
Russell corrected course: tickets belong IN each client's admin (AAA model), visible
in his portal dash; paying clients = AAA, Bulldog, Bishopbend, BNDT (Woodlands NOT
paying yet — excluded). He sends the Burton portal invite himself.
ROOT CAUSE (AAA "tickets 403" in its errors dash): portal.makoai.studio was
Cloudflare-proxied; free-plan Bot Fight Mode challenged Vercel-datacenter
server-to-server calls (tickets + activity-log forwards) with 403 HTML. The old
Mako-Fleet UA spoof never durably worked. FIX: flipped portal.makoai.studio DNS to
DNS-only (proxied=false, CF token from BNDT secrets works on the makoai.studio zone;
record id d76fb0b3..., reversible). Verified: Server: Vercel, /api/tickets returns
clean JSON. NOTE: CF token cannot manage Bot Fight Mode (no bot-mgmt scope).
- AAA: NO code change needed; keys/env were always right. E2E 200 with AAA creds.
- Bulldog: pattern origin; verified 200 with its creds. No changes.
- Bishopbend: had tickets code + EMPTY placeholder env (memory's "keys needed" was
  right). Registered keypair kid=xGF54at1 (portal client 966eb97b-a644-4dac-83cf-
  a0b03e4a1196), filled .env.local + added TENANT_* to Vercel prod, redeployed,
  E2E 200. register-bishopbend.mjs committed in portal (1594ccf).
- BNDT (commit f852585): full build — signTenantToken added to master-jwt.ts,
  master-api.ts (friendly error copy), /admin/tickets (list + collapsible form,
  rate limit 10/15min via check_and_record_rate), sidebar "Support tickets" for ALL
  roles (staff file tickets too; external portal link removed). Keypair kid=y7ci33NV
  (register-bndtrentals.mjs); TENANT_*/MASTER_API_URL added to Vercel prod +
  .env.local (MASTER_PUBLIC_KEY/CLIENT_ID were already there from July 8). E2E 200.
- Portal (commits f9baf6f, db938a3, 1594ccf): /admin dash got open-tickets feed
  (high-priority first, top 8, links to client ticket queues) + 30s AutoRefresh
  (pauses when tab hidden); next 16.2.6→16.2.11 + sharp override → 0 vulns; portal
  deploys = manual vercel --prod from its folder (git push does NOT deploy; had to
  rebase over a Dependabot commit mid-session — portal repo also gets remote merges).
- E2E test pattern saved: scratchpad test-aaa-tickets.mjs (signs real tenant JWT from
  a client's .env.local, GETs /api/tickets). Works for any client by domain swap.
- Registration output files (PRIVATE KEYS): scratchpad bndt-registration.txt +
  bishop-registration.txt — session-scoped scratchpad, keys also live in Vercel env.
STILL OPEN: AAA's errors dash has the old "tickets 403" entry — will stop recurring;
Russell can mark resolved. Woodlands gets ticketing when they become paying.

POST-DEPLOY BUG + FIX (same day): Bishop showed "Could not sign tenant token", BNDT
tickets page hit its error boundary. Cause: I had piped the PEM env values into
`vercel env add` via POWERSHELL, which prepended a UTF-8 BOM and turned newlines
into literal \r\n text → importPKCS8 failed at runtime (local e2e tests passed
because they used .env.local, not Vercel's stored values). FIX: re-added
TENANT_PRIVATE_KEY / TENANT_PUBLIC_KEY_KID (+ BNDT MASTER_API_URL) through BASH
(clean byte pipes), proved the stored values parse (vercel env pull + node
createPrivateKey — note: pull FILES encode real newlines as literal \n, which is
correct, don't be fooled twice), redeployed both sites.
HARD LESSON (fleet-wide): NEVER pipe multiline secrets into CLIs from PowerShell —
BOM + newline mangling. Always use bash (`vercel env add NAME production < file`).
Also: Vercel env changes require a REDEPLOY to take effect.

## 2026-07-23 (later) — BNDT wired into portal.makoai.studio ticketing (commit 783bb58)
Russell: BNDT is a paying customer; add ticketing + link like the others.
FINDINGS (scout of makoai-portal, now at ...Mako Studio\...\Web Projects\makoai-portal;
portal DB = Supabase mako-cp ref wwckrquypoyqbvhngbvy; creds in portal .env.local,
no separate secrets folder): BNDT clients row ALREADY existed (id faa35fd5-4894-4720-
9cae-9699476144e0, created by 2026-07-08 fleet-monitor seed, tickets page already
rendered but record had primary_email null, no client_users). Tickets = `requests`
table (+ request_messages/attachments/estimates). Locked fleet decision keeps BNDT
"master-only" (NO per-client CP / tenant JWT — that's AAA Awning + Bulldog only).
DONE: (1) completed the EXISTING portal clients row via service role — name
"Burton NDT Rentals" (was "BND Trentals"), primary_email information@bndtrentals.com,
phone 281-941-4311, address 832 S. Broadway St., La Porte, TX 77571 — did NOT create
a new row (dedup check is email-only; a new row would split the fleet monitor).
(2) BNDT AdminShell: "Support tickets ↗" link (admin-only; staff never see it) to
the portal tickets URL. Deployed + verified.
HELD FOR RUSSELL: inviting a Burton contact as a portal login (client_users) sends
a magic-link EMAIL to information@ — external action, needs his go. Until then only
Russell (portal admin) sees/files BNDT tickets.

## 2026-07-23 — 2FA rescue, 9.4s→CDN perf fix, CVE patches, admin feature batch
- **2FA lockout fixed:** Russell couldn't log in ("authenticator I never set up" — he
  enrolled June 17 go-live night, entry lost). Cleared totp_enrolled+totp_secret on
  rsailors@makologics.com via service role; next login forces fresh QR enrollment.
- **PERF ROOT CAUSE + FIX (commit 95ecffa):** Speed Insights P75 FCP 7.10s / LCP 9.43s.
  Cause: June 17 CMS rollout made ALL public pages force-dynamic (searchParams edit-mode
  + per-request CSP nonce) → no CDN cache, no-store, every visit = cold serverless render
  (low traffic ⇒ nearly always cold; Sentry boot weight). Fix: ISR everywhere public
  (5m catalog / 1h content revalidate; admin+API stay dynamic); edit mode via draftMode()
  (enter /api/cms/edit?path=… admin-gated → __prerender_bypass cookie; exit
  /api/cms/edit/exit; EditBar "Done" exits; /admin/pages launcher updated; while editing,
  EVERY page admin visits is editable until Done). getEditMode() = draftMode + session
  (no searchParams). JSON-LD nonce reads (headers()) removed from layout/product/locations
  — data blocks need no nonce. CSP split in src/proxy.ts: /admin/* + draft-cookie requests
  keep nonce+strict-dynamic; cached public pages get allowlist policy w/ 'unsafe-inline'
  script-src (nonce can't match cached HTML). next.config manual page Cache-Control block
  removed (ISR owns it). Privacy policy copy updated (no more "per-request nonces" claim).
  cms-actions already revalidatePath'd; catalog admin actions now call
  revalidatePublicCatalog() (src/lib/revalidate-catalog.ts) so edits go live instantly.
  VERIFIED live: X-Vercel-Cache HIT, TTFB 0.2-0.3s, 12-page Puppeteer audit 0 CSP
  violations 0 console errors, Turnstile + MakoChat load, www 308, 404 cached, admin
  login nonce CSP intact, anon ?edit=1 inert. Speed Insights will trend green over days.
- **Security (commit ad9dd46):** npm audit had 4 HIGH incl. next middleware/proxy bypass
  + cache-confusion CVEs → next 16.2.9→16.2.11; sharp CVEs → override "sharp": "^0.35.3"
  (next pins ^0.34.5; npm's only "fix" was downgrade to next 14 — override instead);
  fast-uri/brace-expansion cleared. npm audit 0; GitHub Dependabot alerts 0. ESLint 10
  was BROKEN with eslint-config-next (plugin peer caps at 9, crashed every run since the
  May Dependabot major bump) → eslint ^9 restored + dependabot.yml ignores eslint majors.
  Lint now runs: 10 pre-existing errors (react-hooks v6 purity false-positives on server
  components + QuoteCart/QuoteForm setState-in-effect + Editable refs) — deferred.
- **Product photo galleries (commit 5e4c356):** DDL via direct Postgres (db password in
  secrets folder works; scratchpad node+postgres script — psql absent, Supabase mgmt token
  still expired): catalog_product_images (id, product_id FK cascade, path, sort_order,
  created_at; RLS anon SELECT only for published products; 95 existing covers backfilled).
  products.image stays cover (listings/cart/OG/JSON-LD). Admin ProductEditForm: "Photos"
  grid (cover badge, Make cover, 2-step Delete), multi-file "Add photos" (≤12/batch,
  10MB each), auto-cover on first upload, cover reassigns on cover-delete; storage objects
  removed on delete/replace; deleteProduct now purges both buckets' <productId>/ folders.
  Public product page: ProductGallery client component (main + thumbnail strip only when
  >1 photo; single-photo renders identical to before); JSON-LD Product.image = array.
- **Spec sheets:** current PDF row w/ View + Remove (removeProductPdf clears pointer +
  deletes uploaded object; legacy /public/pdfs untouched); replace deletes old upload.
- **Leads inbox:** setLeadSpam(id, bool) + deleteLead(id) actions; LeadRowActions
  (Spam/Not-spam toggle + 2-step Delete) in new Actions column. Detail page unchanged
  (status dropdown already had spam).
- **Customers:** deleteCustomer existed but only on edit page — added CustomerRowActions
  per-row Delete to the list.
- **QUEUED (Russell, mid-session): employee users with special rights** — "we can discuss
  when you're ready". Bring a permissions proposal next session (role column exists,
  nothing gates on it).
- Env note: .env.local recreated from secrets file for local builds; .gitignore now has
  .env*.local (was missing!). Old ?edit=1 bookmarks now serve the normal cached page.

## 2026-06-18 — www→apex redirect RE-ADDED (cutover loop risk over)
DNS fully propagated (apex=76.76.21.21 on Google/Cloudflare/Quad9/authoritative/local; apex serves Vercel,
old WP gone). Re-added Vercel domain redirect www.bndtrentals.com → bndtrentals.com (308) via API. Verified:
www→308→apex→200, path preserved, apex 0 redirects (no loop). SUPERSEDES the earlier "do NOT re-add www→apex"
note — it's safe now and is back. SEO: robots allows all major AI bots (GPTBot/ClaudeBot/Perplexity/Google-Extended/
Applebot), CCBot blocked; sitemap 123 urls; llms.txt present; per-page meta+canonical(→apex)+index,follow; rich
JSON-LD (LocalBusiness sitewide, Product/Offer/Brand/Breadcrumb on products). Open SEO TODO: submit to Google Search
Console (needs Russell's Google acct — highest-impact for the new cutover); minor product-title dedupe ("Olympus Olympus").

## 2026-06-18 — MakoChat added to bndtrentals (commit a686a00)
Provisioned Burton in MakoChat (makochat.app product, separate project ...Web Projects/makochat.app; its .env.local
has RETELL_API_KEY, SUPABASE_URL [not NEXT_PUBLIC_], SUPABASE_SERVICE_ROLE_KEY). MakoChat provisioning model:
lib/retell.ts (createKnowledgeBase{name,urls}, provisionBrain{tenantName,description,knowledgeBaseId}, buildPrompt),
tenants table cols: name/slug/greeting/brand_color/lead_email/status/plan/billing_status/business_info/kb_id/
retell_llm_id/retell_agent_id. Embed contract: <script src="https://makochat.app/embed.js" data-makochat="<slug>" defer>.
Created tenant: id 4a34ac52-d4e1-4ee5-8651-db588782af2f, slug "bndt", status active, plan starter, billing manual,
lead_email information@bndtrentals.com, brand #0f3a8a. KB knowledge_base_4535f52657ebb165 (9 site pages + 71 PDFs).
Brain: llm_37ad6914fa9890c44b613aaae665 / agent_aeee0575e3d575e3aa93ea6012 (claude-4.5-haiku). Verified: brain answers
accurate Burton facts + captures leads. (Provisioned via one-off script, since removed.)
Site embed: src/components/MakoChatWidget.tsx (path-aware, injects embed.js data-makochat=bndt, skips /admin, cleans up
on admin nav), added to src/app/layout.tsx; proxy.ts CSP += https://makochat.app on script-src + frame-src. Verified live:
bubble + iframe(makochat.app/widget/bndt) load, 0 CSP violations. KB indexes async (Retell auto-refresh 12h).
To change greeting/brand/training later: MakoChat admin → clients → bndt (or re-run provisioning pattern).

## 2026-06-18 — Cleanup batch: PDF fix, deps to 0 vulns, dead module removed
- Product PDF uploads now resolve publicly: uploadProductPdf stores pdf="uploads/<id>/<file>.pdf";
  next.config rewrite /pdfs/uploads/:path* → catalog-pdfs bucket (public). Legacy /public/pdfs/ flat files
  still work. No existing uploaded PDFs needed migration (all current pdf values are legacy filenames). commit ccf0144.
- Deleted dead admin "Site content" module (src/app/admin/(authed)/content/*) — edited a table the site never
  read, already de-linked. Only ref was a stale comment in AdminPlaceholder.tsx (left it). /admin/content now 404.
- Dependabot: #11 went stale/conflicting, superseded by #13 (15-pkg minor/patch group) — merged #13, #11 auto-closed.
  npm audit fix cleared remaining @babel/core low advisory → **0 vulnerabilities**. Build green (129 pages), deployed (8aa3c94).
- All pages smoke-tested 200 post-bump.
STILL OPEN (offered, not done — open-ended): deepen CMS per-page body content (needs Russell to name a page);
hero-background "Replace background" control (homepage hero bg sits behind content, click-to-replace awkward).
Old WP host (host10/72.52.251.108) still running as rollback safety — don't cancel yet.

## 2026-06-18 — Contact form on /contact (commit 877c3fa)
Built a real contact form (was none — page only had cards + map). ContactForm.tsx (name/email/phone/company/message)
→ submitContact action (src/app/contact/actions.ts): Zod + honeypot + Turnstile, stores in quote_leads marked
interests=["Contact form"] (shows in admin Leads inbox, non-fatal), emails via lib/email/contact-notification.ts
to information@bndtrentals.com reply-to=sender. Heading is CMS-editable (form_eyebrow/form_title/form_intro).
Verified live: /contact 200, all fields + Turnstile + button render. Happy-path submit needs a real browser
(Turnstile blocks headless) — Russell to do a live test. Email path already proven (Resend domain verified).

## 2026-06-18 — Resend: bndtrentals.com verified, From flipped to domain
DNS for bndtrentals.com is authoritative at Network Solutions (worldnic ns77/78) — confirmed via SOA
(primary=NS77.WORLDNIC.com). host10.makologics.com (=ns1/ns2.makologics.com = 72.52.251.108, the OLD WP
host) runs makologics.com DNS but is NOT authoritative for bndtrentals.com — DNS edits MUST be at Network Solutions.
Russell added 3 Resend records at NetSol (DKIM TXT resend._domainkey; MX send→feedback-smtp.us-east-1.amazonses.com pri10;
TXT send→v=spf1 include:amazonses.com ~all). Verified correct via Resend API → domain VERIFIED.
Resend domain id 4d8f94ed-dbdc-41a4-95e7-d6aca925340b. Fleet Resend API key works (found on disk; 200 on /domains).
Flipped Vercel RESEND_FROM → "Burton NDT Rentals <quotes@bndtrentals.com>", redeployed. Live test send
quotes@bndtrentals.com → information@bndtrentals.com = last_event: delivered.
MS365 mail VERIFIED INTACT: apex MX (outlook), apex SPF (include:spf.protection.outlook.com), ms= verification all unchanged;
Resend records isolated to send.* subdomain + DKIM selector. The unused "localaibox.com failed" + others are separate.
NOTE: code comment in lib/email/resend.ts still references the old makoai.studio fallback — harmless (env overrides).

## 2026-06-17 — VISUAL CMS (engine + homepage shipped; rest of pages PENDING)
Russell chose: editable-fields/fixed-design, visual in-place editing, all pages. Approved "go".
ENGINE (commit 3939b7b, cache fix 3b5049d): inline visual CMS.
- Storage: page_sections row slug="cms:<page>", content in JSONB metadata (NO new table — can't run DDL:
  Supabase mgmt token expired, no DB password; service role can't DDL). RLS public-read needs is_published=true (set on save).
- lib/cms.ts: getPageContent(page) [anon read, cached, fails soft], getEditMode(searchParams) [?edit=1 AND admin session], CMS_PAGES list.
- lib/cms-actions.ts: savePageField(page,key,value), uploadPageImage(fd) → catalog-images bucket as uploads/pages/...
- components/cms/Editable (contentEditable, content set via ref once so React won't clobber; saves on blur),
  EditableImage (click image → file picker → upload → swap; Fragment sibling input = no layout change), EditBar (floating toolbar).
- lib/image-src.ts imageSrc() resolver (http→as-is, uploads/legacy→/images/...).
- proxy.ts sets x-pathname (for 2FA gate) AND no-store on ?edit=1.
- /admin/pages launcher (lists CMS_PAGES, "Edit visually" → <path>?edit=1). Nav "Site content"→"Edit pages".
- Pattern: pages load getPageContent+getEditMode, wrap text in <Editable value={c.key ?? "default"}>, images in <EditableImage>.
  Defaults = current copy, so site unchanged until edited. Pages must be force-dynamic.
ROLLED OUT TO ALL PAGES (commit fccae30 + new-window fix). Russell confirmed homepage editing "working".
- PageHero + CtaBanner are now CMS-aware (cms={{page,editable}} prop → hero eyebrow/title/description and
  cta eyebrow/title/body become Editable). This made every page's hero+CTA editable cheaply.
- All 11 CMS pages wired (home, about, equipment, applications, calibration, locations, projects, contact,
  quote, privacy, terms): load getPageContent+getEditMode, EditBar, hero via PageHero cms, CTA via CtaBanner cms,
  plus per-page section headings (about: story/values/press/team; contact: hubs; home: pillars/featured).
  Legal bodies (privacy/terms) intentionally left static (AI-reviewed, rarely edited) — only their heros are editable.
- /admin/pages "Edit visually" opens in a NEW TAB (Russell's request).
- Verified live: all 11 pages 200, /about?edit=1 anon shows no edit controls (gated), hero text intact.
DEPTH NOTE: heros, CTAs, and main section headings/intros are editable everywhere; deep per-paragraph/list-item
and product/category images (catalog admin) are NOT all wired — extend per-page on request. Hero BACKGROUND images
are EditableImage but sit behind content (-z-10) so click-to-replace is awkward; needs a dedicated "replace background"
control (future). Old /admin/content module still exists, de-linked from nav — safe to delete later.

## 2026-06-17 — admin: reset, force-2FA, edit-users, product image upload
- Admin password reset: only admin is rsailors@makologics.com (full_name "Russell Sailors", id
  fd28952c-3a45-4843-a77b-9bb83c1b5672). Creds for bndt-prod Supabase are in
  ~/.claude/projects/...OneDrive-Desktop...bndtrentals-com/secrets/bndt-prod-credentials.txt
  (NEXT_PUBLIC_SUPABASE_URL + anon + SERVICE_ROLE_KEY). Vercel marks the service key Sensitive so
  `vercel env pull` returns it empty; the ~/.supabase access-token is EXPIRED (mgmt API 401). Use the
  secrets file for DB admin tasks. Login URL for Russell while his apex DNS is stale: www.bndtrentals.com/admin/login.
- FORCE 2FA (commit e240b50): mandatory TOTP. (authed) layout gates on session.totpVerified, allowing
  only /admin/account/totp-setup + /admin/logout through; proxy sets x-pathname for this. Login redirect:
  change-password → enroll 2FA → dashboard. Disable button reworded to "Reset authenticator" (can't turn
  off, only re-enroll new device). First login after this forces enrollment.
- EDIT USERS: already existed at /admin/users (list, edit name/role, reset password, /admin/users/new). No build needed.
- PRODUCT IMAGE UPLOAD (commit 70dc1be): new uploadProductImage action → Supabase Storage bucket
  "catalog-images" (public, created this session; jpg/png/webp/avif, 10MB). Stored as "uploads/<id>/<file>";
  next.config rewrite maps /images/uploads/:path* → bucket public URL, so ALL existing /images/${image}
  renders (public pages, cart, OG, JSON-LD) work unchanged. Upload UI + preview in ProductEditForm.
  Verified live: raw path 200, next/image optimizer 200, legacy images still 200.
- KNOWN PRE-EXISTING ISSUE (not fixed, not asked): product PDF upload writes to Supabase catalog-pdfs but
  public page links to /pdfs/${p.pdf} (local /public/pdfs) — mismatch, likely broken on public side. Flag to Russell.

## 2026-06-17 — post-launch hardening (CSP enforce, admin login captcha, DNS loop fix)
- CSP flipped Report-Only → ENFORCING (commit 567c61e). style-src dropped the nonce for
  'unsafe-inline' (inline style attrs can't be nonced; nonce makes browsers ignore unsafe-inline;
  React/Recharts need it). script-src stays nonce + strict-dynamic. Verified via headless-Chrome
  audit (csp-audit/audit-bndt2.mjs): 12 public pages, 0 violations, Turnstile loads on /quote.
- Admin login (commit b03b67c): added Cloudflare Turnstile captcha (form + server action, verify
  after rate-limit before DB, widget remounts per failed attempt). Replaced personal email with
  support@makologics.com. Scrubbed personal name from 2 code comments. Login already had rate-limit
  + audit log + anti-enumeration + bcrypt + TOTP.
- DNS REDIRECT LOOP (root-caused, fixed): /admin/login looped in browsers (ERR_TOO_MANY_REDIRECTS)
  while curl got 200. Cause = cutover DNS propagation: local/router resolver still cached OLD apex IP
  72.52.251.108 (WordPress) while www already resolved to Vercel. apex→(WP 301 to www)→www→(my
  Vercel 308 to apex)→loop. NOT a code/config bug. FIX: removed the Vercel www→apex 308 redirect
  (both domains now serve directly; canonical tag still consolidates SEO to apex). Loop gone.
  NOTE: do NOT re-add www→apex until apex DNS has fully propagated everywhere, or the loop returns
  for any resolver still holding old-apex+new-www. Tooling: csp-audit/trace.mjs traces redirect chains.
- KNOWN: Russell's own machine/router still serves stale apex (old WP) — he may see the OLD site on
  the bare apex until his local/router DNS TTL (~2h) expires; www shows the new site. Global resolvers
  (Google 8.8.8.8, authoritative ns77) already serve the correct Vercel apex.

## 2026-06-17 — 🎉 LIVE
DNS published after ~50 min (Network Solutions slow, not user error — Russell's records were correct).
Apex + www now resolve to 76.76.21.21. Verified live: all 16 key pages 200, custom 404, Vercel serving,
Let's Encrypt SSL issued (valid→Sep 16), www→apex 308, security headers + CSP Report-Only + canonical apex,
MS365 mail MX intact. Vercel dashboard shows cosmetic "not configured" nag because we're on legacy-but-
supported IP 76.76.21.21 (Vercel now recommends 216.150.1.1 + per-domain CNAME for www; old IPs "continue
to work" per Vercel) — harmless, SSL already issued.
DEFERRED (deliberately, to avoid stacking changes on a freshly-live client site):
- CSP enforce flip: still Report-Only (safe). Needs style-src 'unsafe-inline' (Recharts/admin) + browser
  console audit before flipping response header to enforcing. Do as a planned hardening pass.
- Dependabot #11 (16-pkg bump, clears last 1 low audit): hold for a maintenance window, not launch night.
- Optional: switch DNS to Vercel's new recommended records (216.150.1.1 / CNAME) to clear dashboard nag.

## 2026-06-17 — GO LIVE prep (client ready to launch)
Decisions: canonical = apex (www 308→apex); DNS at Network Solutions (worldnic), Russell has login;
DO NOT TOUCH MS365 mail (MX = bndtrentals-com.mail.protection.outlook.com). Resend left as-is.
Done (all behind still-live WordPress DNS — zero public impact):
- Set NEXT_PUBLIC_SITE_URL=https://bndtrentals.com in Vercel prod (was missing → canonical/sitemap now correct).
- Merged Dependabot #12 (sentry/otel) → npm audit 7→1 low. #11 (16-pkg bump) held for post-launch.
- FOUND + FIXED latent security bug: proxy.ts was at repo ROOT but project uses src/ dir, so Next 16
  silently ignored it → strict CSP never applied since May audit. Moved to src/proxy.ts, shipped
  Report-Only (request header stays enforcing so Next nonces its scripts; response Report-Only) to
  avoid breaking live site (Recharts inline styles would break a nonce-only style-src). Commit 830e27c.
- Vercel: manual `vercel --prod` deploys verified Ready; build green (137 pages). Git auto-deploy is NOT
  wired — production deploys are manual CLI only.
- Attached bndtrentals.com + www to project bndt-showcase; configured www→apex 308 redirect via API.
NEXT (Russell's action): change 2 A records at Network Solutions @ + www: 72.52.251.108 → 76.76.21.21.
Leave ALL mail/MX/TXT/CNAME untouched. Then verify SSL + post-cutover smoke; run Puppeteer CSP audit
and flip CSP to enforce (tune style-src for Recharts first).

## 2026-06-17 — Recover
- Ran full Recover protocol. Read brain.md, project context.md, notes.md, claude-sessions.md,
  knowledge/, latest transcript, git state, open PRs.
- Seeded this project's previously-empty local memory folder (MEMORY.md, build_progress.md,
  session_summary.md).
- Found 2 open Dependabot PRs (#11, #12) pending review/merge. No other open work.
- No code changes made. Awaiting direction.
