import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  // If already signed in, send them on.
  const session = await getAdminSession();
  if (session.userId) {
    redirect(session.mustChangePassword ? "/admin/account/change-password" : "/admin");
  }

  return (
    <main className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white text-ink p-8 shadow-2xl">
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
            Burton NDT Rentals
          </p>
          <h1 className="mt-2 text-2xl font-bold">Admin sign in</h1>
          <p className="mt-2 text-[14px] text-muted">
            Authorized personnel only. Activity is logged.
          </p>

          <div className="mt-6">
            <LoginForm />
          </div>
        </div>
        <p className="mt-6 text-center text-[12px] text-white/55">
          Need access? Email{" "}
          <a href="mailto:rsailors@makologics.com" className="text-white/85 hover:text-white">
            rsailors@makologics.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}
