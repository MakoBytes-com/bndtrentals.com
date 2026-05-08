import type { Metadata } from "next";
import Link from "next/link";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { NewProductForm } from "./NewProductForm";

export const metadata: Metadata = {
  title: "New product",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const supa = getAdminSupabase();
  const { data: categories } = await supa
    .from("catalog_categories")
    .select("id, name, short, slug")
    .order("sort_order", { ascending: true });

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/catalog"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-brand"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to catalog
      </Link>

      <div className="mt-4">
        <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
          New product
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold">Add a product</h1>
        <p className="mt-2 text-[14.5px] text-muted">
          Pick a category, give it a slug + name. You can fill in the
          description, applications, and PDF spec sheet on the next screen.
        </p>
      </div>

      <div className="mt-8">
        <NewProductForm
          categories={(categories ?? []).map((c) => ({
            id: c.id,
            name: c.name,
            short: c.short,
          }))}
        />
      </div>
    </div>
  );
}
