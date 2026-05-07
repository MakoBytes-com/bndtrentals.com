import "server-only";

// Cloudflare Turnstile server-side verification.
// Phase 4 wires a real site key + secret key into Vercel env vars; until then
// this verifier fails OPEN (allows the request) so Phase 2 can ship the
// server action without bothering Russell for Cloudflare credentials yet.
//
// Once TURNSTILE_SECRET_KEY is set, the verifier flips to enforce mode and
// rejects requests with missing or invalid tokens.

type TurnstileResult =
  | { ok: true; configured: boolean }
  | { ok: false; reason: string };

export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp: string | null,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Fail open. Log once per request so the gap is visible.
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[turnstile] TURNSTILE_SECRET_KEY not set; allowing request. Set the env var to enforce.",
      );
    }
    return { ok: true, configured: false };
  }

  if (!token) {
    return { ok: false, reason: "missing_token" };
  }

  const body = new URLSearchParams();
  body.append("secret", secret);
  body.append("response", token);
  if (remoteIp) body.append("remoteip", remoteIp);

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body,
        // Cloudflare wants form-encoded
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );
    const json = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (json.success) return { ok: true, configured: true };
    return { ok: false, reason: (json["error-codes"] ?? ["verify_failed"]).join(",") };
  } catch (err) {
    console.warn("[turnstile] verify fetch failed", err);
    // Network error verifying — fail closed in production, open in dev.
    if (process.env.NODE_ENV === "production") {
      return { ok: false, reason: "verify_unreachable" };
    }
    return { ok: true, configured: true };
  }
}
