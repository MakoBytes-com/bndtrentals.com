---
name: vercel-env-gotchas
description: Two Vercel env traps that make a credential fix look done when it is not
metadata: 
  node_type: memory
  type: reference
  originSessionId: 4b47c505-c7c5-42d1-b031-0d2c595abe05
  modified: 2026-09-21T09:43:05.459Z
---

Hit for real on 2026-09-21 while replacing this project's Cloudflare email token.

1. **`vercel env add NAME preview` fails silently from stdin.** On CLI 50.41.0 it returns
   JSON `action_required` / `git_branch_required` and writes nothing; its own suggested
   fix (`--value <value> --yes`) fails identically. Production and Development via stdin
   worked fine — only Preview is affected. Workaround that does work: POST
   `https://api.vercel.com/v10/projects/<projectId>/env?teamId=<orgId>&upsert=true` with
   `{key, value, type:"encrypted", target:["preview"]}`, authenticating with the CLI's own
   token from `%APPDATA%\com.vercel.cli\Data\auth.json`.

2. **A variable that pulls back EMPTY means CHECK THE TYPE — it can go either way.**
   Vercel's `sensitive` type is write-only: `vercel env pull` returns nothing for it by
   design. On this project `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY` and
   `IRON_SESSION_PASSWORD` are sensitive in production, so their empty pulls are normal.
   But an empty pull can also be a genuinely empty value: on 2026-09-21 bdsgovservices.com
   pulled an empty CLOUDFLARE_EMAIL_TOKEN while other secrets in the SAME pull came back
   populated, and `GET api.vercel.com/v9/projects/<id>/env` showed it had no sensitive-typed
   variables at all — that site really could not send. Decide with two checks, never by
   assumption: read `type` from that endpoint, and see whether other secrets in the same
   pull are populated (if a service-role key comes back but your token does not, the token
   is the problem). Verified write-only, leave it alone; `encrypted` and empty, it is broken.
   Corollary: a `sensitive` credential cannot be verified by pulling it, so pull-and-verify
   reports a FALSE FAILURE on one — makobytes.com's KV_* vars are sensitive on this fleet.

**Why:** both traps produce a confident "fixed" report over a site that is still broken.

**How to apply:** after ANY env write, re-run `vercel env ls` and re-pull the value, and
where the credential is verifiable (Cloudflare's `/user/tokens/verify` returns the token's
id) confirm the id matches what you intended. Then redeploy — a stored env var does
nothing until the deployment is rebuilt, and the running site keeps serving the old value.
See [[cloudflare-email-token]].

3. **Reading a value from the REST API returns ciphertext, not the value** — the trap on
   the other side of the same wall, and the one that actually corrupted preview here.
   See [[vercel-env-api-returns-ciphertext]].
