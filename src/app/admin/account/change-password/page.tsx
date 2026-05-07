import type { Metadata } from "next";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const metadata: Metadata = {
  title: "Change password",
  robots: { index: false, follow: false },
};

export default function ChangePasswordPage() {
  return (
    <div className="max-w-md">
      <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
        Account
      </p>
      <h1 className="mt-2 text-2xl font-bold">Change your password</h1>
      <p className="mt-3 text-[14.5px] text-muted">
        Pick a strong password — minimum 12 characters, mix of upper, lower,
        numbers, or symbols.
      </p>

      <div className="mt-6 rounded-2xl border border-line bg-white p-6">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
