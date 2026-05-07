import "server-only";

// Iron-session config + helpers. Sessions are encrypted cookies — no DB row
// for the session itself. The admin_users.id is the source of truth; the
// cookie just carries that ID + a few cached fields so we don't hit the DB
// on every page load.

import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type AdminSessionData = {
  userId?: string;
  email?: string;
  fullName?: string;
  role?: "admin" | "staff";
  totpVerified?: boolean;
  // Set true if the user must change their password before doing anything
  // else (default for newly-seeded users).
  mustChangePassword?: boolean;
};

const SESSION_COOKIE_NAME = "bndt-admin-session";

export const sessionOptions: SessionOptions = {
  cookieName: SESSION_COOKIE_NAME,
  password: process.env.IRON_SESSION_PASSWORD ?? "",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // 8h sliding window — admin re-auths after a workday.
    maxAge: 60 * 60 * 8,
  },
};

if (
  process.env.NODE_ENV === "production" &&
  (!process.env.IRON_SESSION_PASSWORD ||
    process.env.IRON_SESSION_PASSWORD.length < 32)
) {
  throw new Error(
    "[bndt auth] IRON_SESSION_PASSWORD must be set to a 32+ character random string in production.",
  );
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return getIronSession<AdminSessionData>(cookieStore, sessionOptions);
}

/**
 * Require a logged-in admin. Use in /admin server components and route
 * handlers. Redirects to /admin/login if the session is empty.
 */
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session.userId) {
    redirect("/admin/login");
  }
  if (session.mustChangePassword) {
    redirect("/admin/account/change-password");
  }
  return session;
}

export async function destroyAdminSession() {
  const session = await getAdminSession();
  session.destroy();
}
