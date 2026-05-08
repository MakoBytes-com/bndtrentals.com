import type { Metadata } from "next";
import Link from "next/link";
import { NewCustomerForm } from "./NewCustomerForm";

export const metadata: Metadata = {
  title: "New customer",
  robots: { index: false, follow: false },
};

export default function NewCustomerPage() {
  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-brand"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to customers
      </Link>

      <div className="mt-4">
        <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
          New customer
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold">Add a customer</h1>
        <p className="mt-2 text-[14.5px] text-muted">
          Email is the unique key. New quote-form submissions auto-add
          customers if a matching email doesn&apos;t already exist; this form
          is for adding them manually (cold outreach, imported list, etc.).
        </p>
      </div>

      <div className="mt-8">
        <NewCustomerForm />
      </div>
    </div>
  );
}
