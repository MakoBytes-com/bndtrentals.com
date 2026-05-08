import type { Metadata } from "next";
import Link from "next/link";
import { NewCategoryForm } from "./NewCategoryForm";

export const metadata: Metadata = {
  title: "New category",
  robots: { index: false, follow: false },
};

export default function NewCategoryPage() {
  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/catalog/categories"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-brand"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to categories
      </Link>

      <div className="mt-4">
        <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
          New category
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold">Add a category</h1>
        <p className="mt-2 text-[14.5px] text-muted">
          Categories group products on the public catalog. Slug becomes the
          URL segment (e.g. /equipment/<strong>ndt</strong>).
        </p>
      </div>

      <div className="mt-8">
        <NewCategoryForm />
      </div>
    </div>
  );
}
