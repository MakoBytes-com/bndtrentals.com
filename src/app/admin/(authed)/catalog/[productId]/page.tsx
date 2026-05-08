import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { ProductEditForm } from "./ProductEditForm";
import type { CatalogCategory, CatalogProduct } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Edit product",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  const supa = getAdminSupabase();
  const { data: product, error } = await supa
    .from("catalog_products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  if (error || !product) notFound();
  const typedProduct = product as CatalogProduct;

  const { data: category } = await supa
    .from("catalog_categories")
    .select("id, slug, name")
    .eq("id", typedProduct.category_id)
    .maybeSingle();
  const typedCategory = category as Pick<CatalogCategory, "id" | "slug" | "name"> | null;

  return (
    <div>
      <Link
        href="/admin/catalog"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-brand"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        All products
      </Link>

      <div className="mt-4">
        <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
          {typedCategory ? `${typedCategory.name} · ${typedProduct.subcategory ?? "—"}` : "Catalog"}
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold">
          {typedProduct.manufacturer ? `${typedProduct.manufacturer} ` : ""}
          {typedProduct.name}
        </h1>
        <p className="mt-1 text-[12.5px] text-muted-soft">
          slug: <code className="font-mono">{typedProduct.slug}</code>
          {" · "}id: <code className="font-mono">{typedProduct.id}</code>
        </p>
      </div>

      <ProductEditForm
        initial={{
          id: typedProduct.id,
          name: typedProduct.name,
          manufacturer: typedProduct.manufacturer ?? "",
          subcategory: typedProduct.subcategory ?? "",
          description: typedProduct.description ?? "",
          applications: typedProduct.applications,
          image: typedProduct.image ?? "",
          pdf: typedProduct.pdf ?? "",
          sort_order: typedProduct.sort_order,
          is_published: typedProduct.is_published,
        }}
        categoryName={typedCategory?.name ?? null}
      />
    </div>
  );
}
