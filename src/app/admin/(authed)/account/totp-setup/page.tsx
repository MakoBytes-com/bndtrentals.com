import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { TotpEnrollmentClient } from "./TotpEnrollmentClient";
import { TotpEnrolledClient } from "./TotpEnrolledClient";

export const metadata: Metadata = {
  title: "Two-factor setup",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function TotpSetupPage() {
  const session = await getAdminSession();
  if (!session.userId) redirect("/admin/login");

  const supa = getAdminSupabase();
  const { data, error } = await supa
    .from("admin_users")
    .select("totp_enrolled")
    .eq("id", session.userId)
    .maybeSingle();
  if (error || !data) redirect("/admin/login");

  const enrolled = !!data.totp_enrolled;

  return (
    <div className="max-w-2xl">
      <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
        Account · two-factor
      </p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-bold">
        {enrolled ? "Two-factor is on" : "Set up two-factor"}
      </h1>
      <p className="mt-2 text-[14.5px] text-muted">
        {enrolled
          ? "Your account requires a 6-digit authenticator code on every sign-in."
          : "Add a 6-digit code from an authenticator app (1Password, Authy, Google Authenticator, etc.) on top of your password. Strongly recommended for admin accounts."}
      </p>

      <div className="mt-8">
        {enrolled ? <TotpEnrolledClient /> : <TotpEnrollmentClient />}
      </div>
    </div>
  );
}
