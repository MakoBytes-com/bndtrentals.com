import "server-only";

// otplib v13+ functional API. Uses Noble crypto + Scure base32 plugins
// by default — no extra wiring needed.
import { generateSecret, generateURI, verifySync } from "otplib";
import qrcode from "qrcode";

const ISSUER = "Burton NDT Rentals";

export function generateTotpSecret(): string {
  return generateSecret();
}

/**
 * Build the otpauth:// URI used by authenticator apps.
 */
export function totpUri(email: string, secret: string): string {
  return generateURI({
    strategy: "totp",
    issuer: ISSUER,
    label: email,
    secret,
  });
}

export async function totpQrDataUrl(uri: string): Promise<string> {
  return qrcode.toDataURL(uri, {
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 6,
  });
}

export function verifyTotpCode(secret: string, code: string): boolean {
  if (!secret || !code) return false;
  const cleaned = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;
  try {
    // Tolerance ~1 step (30s) so a code entered right at a window boundary
    // still verifies. Increase if you see legitimate clock-drift failures.
    const result = verifySync({
      strategy: "totp",
      token: cleaned,
      secret,
      // 30s symmetric tolerance — accepts the previous or next time-step
      // window so a user typing during a boundary still gets in.
      epochTolerance: 30,
    });
    return result.valid;
  } catch {
    return false;
  }
}
