import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { CategoryEditForm } from "./CategoryEditForm";
import type { CatalogCategory } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Edit category",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CategoryEditPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;

  const supa = getAdminSupabase();
  const { data, error } = await supa
    .from("catalog_categories")
    .select("*")
    .eq("id", categoryId)
    .maybeSingle();
  if (error || !data) notFound();
  const c = data as CatalogCategory;

  // Product count for the danger-zone copy.
  const { count: productCount } = await supa
    .from("catalog_products")
    .select("*", { count: "exact", head: true })
    .eq("category_id", c.id);

  return (
    <div>
      <Link
        href="/admin/catalog/categories"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-brand"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        All categories
      </Link>

      <div className="mt-4">
        <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
          Category
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold">{c.name}</h1>
        <p className="mt-1 text-[12.5px] text-muted-soft">
          slug: <code className="font-mono">{c.slug}</code> · {productCount ?? 0} product
          {productCount === 1 ? "" : "s"}
        </p>
      </div>

      <CategoryEditForm initial={c} productCount={productCount ?? 0} />
    </div>
  );
}
