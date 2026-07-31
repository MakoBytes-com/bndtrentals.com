// Verify inbound master-CP JWTs. The master control plane
// (portal.makoai.studio) signs short-lived RS256 tokens with a per-client
// audience (CLIENT_ID) and a scope (e.g. "analytics.read"), then pulls the
// read-only /api/master/* fleet-reporting endpoints. We verify against the
// master's PUBLIC key (MASTER_PUBLIC_KEY) — this app never holds the master's
// private key. Fails closed: any missing env, bad signature, wrong audience,
// or scope mismatch throws, and every caller turns a throw into a 401.

import { importPKCS8, importSPKI, jwtVerify, SignJWT, type JWTPayload } from "jose";
export type VerifiedMasterToken = JWTPayload & { scope: string; client_id?: string };

// MASTER_PUBLIC_KEY normally holds one PEM. During a master signing-key
// rotation it holds TWO, concatenated — the outgoing key and the incoming
// one. There is no JWKS endpoint here and the master signs with exactly one
// key at a time, so listing both is what lets the master flip over without a
// window where every token we receive fails. A single PEM behaves exactly as
// it always has.
//
// Vercel env vars routinely store PEMs with literal "\n" sequences (and stray
// surrounding whitespace), so normalize before splitting.
function masterPublicKeyPems(): string[] {
  const raw = process.env.MASTER_PUBLIC_KEY;
  if (!raw) {
    throw new Error("MASTER_PUBLIC_KEY env var is not set");
  }
  const normalized = raw.replace(/\\n/g, "\n").trim();
  const blocks = normalized.match(
    /-----BEGIN PUBLIC KEY-----[\s\S]*?-----END PUBLIC KEY-----/g,
  );
  // No recognizable block: hand the raw value to importSPKI exactly as before
  // rather than inventing a new failure mode.
  return blocks && blocks.length > 0 ? blocks.map((b) => b.trim()) : [normalized];
}

export async function verifyMasterToken(token: string, requiredScope?: string): Promise<VerifiedMasterToken> {
  const aud = (process.env.CLIENT_ID ?? "").trim();
  if (!aud) throw new Error("CLIENT_ID env var is not set");
  let payload: JWTPayload | undefined;
  let lastErr: unknown;
  for (const pem of masterPublicKeyPems()) {
    let key: Awaited<ReturnType<typeof importSPKI>>;
    try {
      key = await importSPKI(pem, "RS256");
    } catch (err) {
      lastErr = err; // malformed block — try the next one
      continue;
    }
    try {
      ({ payload } = await jwtVerify(token, key, { audience: aud, algorithms: ["RS256"] }));
      break;
    } catch (err) {
      // ONLY a signature mismatch means "wrong key, try the next". Expiry,
      // audience and algorithm failures are real rejections and must not
      // be masked by retrying against another key.
      if ((err as { code?: string })?.code === "ERR_JWS_SIGNATURE_VERIFICATION_FAILED") {
        lastErr = err;
        continue;
      }
      throw err;
    }
  }
  if (!payload) {
    throw (
      lastErr ??
      new Error("master token did not verify against any configured MASTER_PUBLIC_KEY")
    );
  }
  const verified = payload as VerifiedMasterToken;
  if (requiredScope && verified.scope !== requiredScope) throw new Error("scope mismatch");
  return verified;
}

// ---------------------------------------------------------------------------
// Outbound: sign tenant JWTs for BNDT→master calls (ticket filing). Master
// verifies against the public key registered in its client_endpoints table
// (kid TENANT_PUBLIC_KEY_KID). Mirrors the AAA/Bulldog per-client CP pattern.

function getMasterAudience(): string {
  return (process.env.MASTER_API_URL ?? "https://portal.makoai.studio").trim();
}

export type SignTenantTokenInput = {
  scope: string; // e.g. "tickets.read"
  actorUserId: string;
  ttlSeconds?: number;
};

export async function signTenantToken(
  input: SignTenantTokenInput,
): Promise<string> {
  const pem = process.env.TENANT_PRIVATE_KEY;
  const kid = process.env.TENANT_PUBLIC_KEY_KID;
  const tenantId = process.env.CLIENT_ID;
  if (!pem || !kid || !tenantId) {
    throw new Error(
      "TENANT_PRIVATE_KEY / TENANT_PUBLIC_KEY_KID / CLIENT_ID not set",
    );
  }
  const key = await importPKCS8(pem.replace(/\\n/g, "\n").trim(), "RS256");
  const now = Math.floor(Date.now() / 1000);
  const ttl = input.ttlSeconds ?? 60;
  return new SignJWT({ scope: input.scope })
    .setProtectedHeader({ alg: "RS256", kid })
    .setIssuer(tenantId)
    .setAudience(getMasterAudience())
    .setSubject(input.actorUserId)
    .setIssuedAt(now)
    .setExpirationTime(now + ttl)
    .setJti(crypto.randomUUID())
    .sign(key);
}
