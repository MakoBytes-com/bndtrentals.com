import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const metadata: Metadata = {
  title: "Change password",
  robots: { index: false, follow: false },
};

export default async function ChangePasswordPage() {
  // Lives outside the (authed) layout so the must-change-password redirect
  // doesn't loop on itself. We still need to confirm the user is signed in.
  const session = await getAdminSession();
  if (!session.userId) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white text-ink p-8 shadow-2xl">
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
            Account
          </p>
          <h1 className="mt-2 text-2xl font-bold">Change your password</h1>
          <p className="mt-3 text-[14.5px] text-muted">
            Pick a strong password — minimum 12 characters, mix of upper,
            lower, numbers, or symbols.
          </p>

          <div className="mt-6">
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </main>
  );
}
