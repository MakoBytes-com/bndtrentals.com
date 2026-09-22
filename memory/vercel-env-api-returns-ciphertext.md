---
name: vercel-env-api-returns-ciphertext
description: The Vercel REST API never returns readable env values — reading with it and writing back is what corrupted preview on four projects
metadata: 
  node_type: memory
  type: reference
  originSessionId: 4b47c505-c7c5-42d1-b031-0d2c595abe05
  modified: 2026-09-21T09:50:37.848Z
---

**Never read an environment variable's value from the Vercel REST API. It does not
return the value.** `GET https://api.vercel.com/v9/projects/<id>/env` returns each
`encrypted` var's `value` as a ciphertext envelope that begins `eyJ2IjoidjIiLCJjIjoi`
(base64 for `{"v":"v2","c":"..."`). **`?decrypt=true` does NOT help** — verified by hand
on 2026-09-21 with the CLI's own OAuth token: production values still came back as
ciphertext. A `sensitive` var returns no value at all.

**The only thing that decrypts is `vercel env pull <file>`.** Treat that as the sole
source of truth for reading a value.

**What this caused.** On 2026-07-28 09:09:38–09:09:40Z a script copied production →
preview on this project. All nine preview entries were created inside that three-second
window. It read via the REST API, so it copied ciphertext *as if it were plaintext* into
eight vars (CLIENT_ID, MASTER_API_URL, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_TURNSTILE_SITE_KEY, TENANT_PRIVATE_KEY,
TENANT_PUBLIC_KEY_KID) and silently skipped the three `sensitive` ones
(IRON_SESSION_PASSWORD, SUPABASE_SERVICE_ROLE_KEY, TURNSTILE_SECRET_KEY) because those
read back as nothing. **One mechanism explains both the corrupted values and the missing
ones** — that pairing is the fingerprint of this bug. The same pattern hit bishopbend,
localaibox-site and makobytes. Repaired here 2026-09-21.

The ninth var, MASTER_PUBLIC_KEY, was corrupted in the same batch but is clean today
because a key rotation rewrote it on 2026-07-31 09:39:25. A later correct write is the
only thing that heals one of these; nothing detects it on its own.

**Why it went unnoticed for two months:** a broken value only bites when something builds
with it, and this project had had exactly one preview deployment ever (2026-05-03, before
the corruption). Production was never touched and never at risk.

**Dating an incident like this.** Env-entry `createdAt`/`updatedAt` from the API is the
reliable clock — it is what proved a script did this, and it never expires. Do NOT reach
for Vercel runtime logs: `/v1/deployments/<id>/runtime-logs` 404s within hours. What
survives long enough to reconstruct a window is Turnstile analytics (GraphQL
`turnstileAdaptiveGroups`, ~1 week retention, one event per real form submission) and
Cloudflare's `GET /user/tokens`, which carries `issued_on` and `last_used_on` per token.
Credit to the localaibox-site session, which used those to prove no enquiry was lost
during a 9h54m revoked-token window.

**Verify a restored Turnstile secret functionally, not just "not ciphertext."** POST the
stored secret to `challenges.cloudflare.com/turnstile/v0/siteverify` with a deliberately
junk `response`. `invalid-input-response` means the SECRET was accepted and only the dummy
token was rejected — that is the pass. `invalid-input-secret` means it is still wrong. One
request, no side effects, never touches the live form.

**How to apply.** To copy env between environments, `vercel env pull` each side and copy
from the pulled file — never from an API read. After any write, re-pull and confirm no
value starts with `eyJ2IjoidjIi`. Verify key material properly rather than eyeballing it:
`crypto.createPrivateKey(pem)` must parse and sign, and a Supabase anon key's `ref` claim
must equal its URL's subdomain. See [[vercel-env-gotchas]] for the write-side traps
(preview cannot be written by `vercel env add`; PowerShell stdin adds a BOM).
