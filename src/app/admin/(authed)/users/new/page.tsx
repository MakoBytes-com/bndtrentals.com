import type { Metadata } from "next";
import Link from "next/link";
import { NewUserForm } from "./NewUserForm";

export const metadata: Metadata = {
  title: "Invite user",
  robots: { index: false, follow: false },
};

export default function NewUserPage() {
  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-brand"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to users
      </Link>

      <div className="mt-4">
        <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
          New user
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold">Invite an admin</h1>
        <p className="mt-2 text-[14.5px] text-muted">
          Set up a colleague&apos;s admin account. They&apos;ll get a temporary
          password and be forced to change it on first sign-in. Two-factor is
          enrolled separately by them on their own device.
        </p>
      </div>

      <div className="mt-8">
        <NewUserForm />
      </div>
    </div>
  );
}
