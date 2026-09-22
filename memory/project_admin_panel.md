---
name: Admin Control Panel Integration
description: All new Mako sites integrate with the new admin control panel — likely portal.makoai.studio
type: project
updated: 2026-05-03
originSessionId: e2082f7d-a147-441c-b6d0-88007f6206d0
---
Russell said on 2026-05-03: "We will be using the new admin control panel for all new sites."

**Why:** Russell wants centralized management/visibility across all Mako-built sites instead of bespoke per-site backends.

**How to apply:**
- bndtrentals.com (this project, currently a spec/demo) — quote form submission should go to the admin panel API instead of mailto. Same for any future contact/intake forms.
- Likely also: error logging, analytics events, lead notifications all flow through the panel.
- Treat mailto / Formspree / Resend as TEMPORARY scaffolding; the real backend is the admin panel.

**Open questions to confirm with Russell before integrating:**
- What is the admin panel's API endpoint and auth model? (Likely makoai-portal at portal.makoai.studio — confirm)
- What surfaces does it cover for new sites: forms only? Or also content, products, error tracking, analytics?
- Per-site keys / project IDs — how does bndtrentals identify itself when posting?
- Local development — does the panel have a dev/sandbox mode or do we hit live?

**Cross-reference:** makoai-portal Vercel project exists at portal.makoai.studio. Likely the same thing he's referencing. Check the makoai-portal project memory for current API surface.
