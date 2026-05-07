#!/usr/bin/env node
// One-time admin-user seeder.
//
// Usage:
//   node scripts/seed-admin.mjs <email> <full name> [tempPasswordOverride]
//
// Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local. Generates
// a 18-character temporary password unless one is supplied. Inserts the
// row with must_change_password=true so the first login forces a real
// password on the user.
//
// Idempotent: if the email already exists, the script tells you and exits
// without overwriting.

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Manual .env.local load (since dotenv/config reads .env, not .env.local).
try {
  const envText = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  // proceed; values may already be in process.env
}

const [, , emailArg, nameArg, passOverride] = process.argv;
if (!emailArg || !nameArg) {
  console.error("Usage: node scripts/seed-admin.mjs <email> <\"Full Name\"> [tempPassword]");
  process.exit(2);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env or .env.local");
  process.exit(2);
}

const supa = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 18-char URL-safe random password if none supplied.
function generateTempPassword() {
  return randomBytes(16)
    .toString("base64")
    .replace(/[/+=]/g, "")
    .slice(0, 18);
}

const tempPassword = passOverride ?? generateTempPassword();
const passwordHash = await bcrypt.hash(tempPassword, 12);

// Idempotency check
const { data: existing, error: checkErr } = await supa
  .from("admin_users")
  .select("id, email")
  .ilike("email", emailArg)
  .maybeSingle();
if (checkErr) {
  console.error("Lookup failed:", checkErr.message);
  process.exit(1);
}
if (existing) {
  console.error(`Admin already exists for ${emailArg} (id=${existing.id}). Refusing to overwrite.`);
  console.error(`If you need to reset the password, do it through the admin UI or write a separate reset script.`);
  process.exit(0);
}

const { data, error } = await supa
  .from("admin_users")
  .insert({
    email: emailArg,
    full_name: nameArg,
    password_hash: passwordHash,
    role: "admin",
    must_change_password: true,
  })
  .select("id, email, full_name, role")
  .single();

if (error) {
  console.error("Insert failed:", error.message);
  process.exit(1);
}

console.log("");
console.log("===========================================");
console.log("  ADMIN USER SEEDED");
console.log("===========================================");
console.log("  ID:        ", data.id);
console.log("  Email:     ", data.email);
console.log("  Full name: ", data.full_name);
console.log("  Role:      ", data.role);
console.log("  Temporary password: ", tempPassword);
console.log("===========================================");
console.log("");
console.log("Save the temporary password somewhere safe (a password manager).");
console.log("First login will force a password change.");
console.log("");
