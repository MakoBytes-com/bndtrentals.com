import type { Metadata } from "next";
import Link from "next/link";
import { NewSectionForm } from "./NewSectionForm";

export const metadata: Metadata = {
  title: "New section",
  robots: { index: false, follow: false },
};

export default function NewSectionPage() {
  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/content"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-brand"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to content
      </Link>

      <div className="mt-4">
        <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
          New page section
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold">
          Create an editable section
        </h1>
        <p className="mt-2 text-[14.5px] text-muted">
          Sections store reusable copy keyed by slug — about-mission,
          team-mark-burton, applications-ndt-intro, etc. Body accepts plain
          text or HTML.
        </p>
      </div>

      <div className="mt-8">
        <NewSectionForm />
      </div>
    </div>
  );
}
