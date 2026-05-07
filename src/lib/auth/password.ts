import "server-only";

import bcrypt from "bcryptjs";

// bcrypt rounds. 12 is the modern sane default — ~250ms hash on a typical
// server, fast enough for login but slow enough to make brute-force expensive.
const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  if (plain.length < 12) {
    throw new Error("Password must be at least 12 characters");
  }
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}

/**
 * Lightweight strength check used at sign-up / change-password time. Not a
 * full password-policy enforcer — we just block obvious low-entropy strings.
 */
export function passwordPolicyError(plain: string): string | null {
  if (!plain) return "Password is required.";
  if (plain.length < 12) return "Password must be at least 12 characters.";
  if (/^[a-zA-Z]+$/.test(plain)) return "Mix in numbers or symbols.";
  if (/^[0-9]+$/.test(plain)) return "Mix in letters or symbols.";
  if (plain.toLowerCase() === plain || plain.toUpperCase() === plain) {
    return "Mix upper and lower case.";
  }
  return null;
}
