// Verify inbound master-CP JWTs. The master control plane
// (portal.makoai.studio) signs short-lived RS256 tokens with a per-client
// audience (CLIENT_ID) and a scope (e.g. "analytics.read"), then pulls the
// read-only /api/master/* fleet-reporting endpoints. We verify against the
// master's PUBLIC key (MASTER_PUBLIC_KEY) — this app never holds the master's
// private key. Fails closed: any missing env, bad signature, wrong audience,
// or scope mismatch throws, and every caller turns a throw into a 401.

import { importSPKI, jwtVerify, type JWTPayload } from "jose";
export type VerifiedMasterToken = JWTPayload & { scope: string; client_id?: string };
export async function verifyMasterToken(token: string, requiredScope?: string): Promise<VerifiedMasterToken> {
  const pemRaw = process.env.MASTER_PUBLIC_KEY;
  if (!pemRaw) throw new Error("MASTER_PUBLIC_KEY env var is not set");
  const pem = pemRaw.replace(/\\n/g, "\n").trim();
  const aud = (process.env.CLIENT_ID ?? "").trim();
  if (!aud) throw new Error("CLIENT_ID env var is not set");
  const key = await importSPKI(pem, "RS256");
  const { payload } = await jwtVerify(token, key, { audience: aud, algorithms: ["RS256"] });
  const verified = payload as VerifiedMasterToken;
  if (requiredScope && verified.scope !== requiredScope) throw new Error("scope mismatch");
  return verified;
}
