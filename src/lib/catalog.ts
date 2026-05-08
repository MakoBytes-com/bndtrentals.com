import "server-only";

// Server-only catalog data layer. Reads published rows from bndt-prod via the
// anon-key Supabase client (RLS lets anon SELECT where is_published = true).
// All public-site catalog pages route through this; admin edits show up on
// the next request without a redeploy.
//
// Note: the legacy src/lib/equipment.ts is no longer imported by anything in
// the public site once Phase 3-B-2 is complete. Kept around as a paper trail
// of the original copy and as a fallback should we need to re-seed.

import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import type {
  CatalogCategory,
  CatalogProduct,
  Database,
} from "./supabase/types";

// Read-only client (anon key — RLS enforced). Cached as a singleton across a
// request because @supabase/supabase-js create returns a new instance each
// time and we don't want to re-build connection pools per call.
let _client: ReturnType<typeof createClient<Database>> | null = null;

function getReadClient() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "[catalog] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  _client = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _client;
}

// Public-shape category. We give it `short` (computed) so consumers can
// always render it without worrying about nulls.
export type PublicCategory = CatalogCategory & {
  shortLabel: string; // never null — falls back to name
};

// Subcategory grouping helper for the category detail page.
export type SubcategoryBucket = {
  name: string; // free-text subcategory label
  products: CatalogProduct[];
};

function publicizeCategory(c: CatalogCategory): PublicCategory {
  return { ...c, shortLabel: c.short ?? c.name };
}

/** All published categories, ordered by sort_order ASC then name ASC. */
export const getCategories = cache(async (): Promise<PublicCategory[]> => {
  const supa = getReadClient();
  const { data, error } = await supa
    .from("catalog_categories")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) {
    console.error("[catalog] getCategories failed", error);
    return [];
  }
  return (data ?? []).map(publicizeCategory);
});

/**
 * Fetch one category by its slug AND all published products in it. Products
 * are grouped into subcategory buckets ordered by first appearance, matching
 * the prior equipment.ts layout. Returns null when the category isn't found
 * or isn't published.
 */
export const getCategoryBySlug = cache(
  async (
    slug: string,
  ): Promise<{
    category: PublicCategory;
    products: CatalogProduct[];
    subcategories: SubcategoryBucket[];
  } | null> => {
    const supa = getReadClient();

    const { data: catRow, error: catErr } = await supa
      .from("catalog_categories")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (catErr || !catRow) return null;

    const { data: products, error: prodErr } = await supa
      .from("catalog_products")
      .select("*")
      .eq("category_id", catRow.id)
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (prodErr) {
      console.error(`[catalog] getCategoryBySlug ${slug} products failed`, prodErr);
      return null;
    }

    // Bucket by subcategory string, preserving sort_order/name order.
    const buckets = new Map<string, CatalogProduct[]>();
    for (const p of products ?? []) {
      const key = p.subcategory ?? "Other";
      const arr = buckets.get(key);
      if (arr) arr.push(p);
      else buckets.set(key, [p]);
    }

    return {
      category: publicizeCategory(catRow),
      products: products ?? [],
      subcategories: Array.from(buckets.entries()).map(([name, products]) => ({
        name,
        products,
      })),
    };
  },
);

/**
 * Fetch one product by its category-slug + product-slug. Returns the product
 * + its parent category, or null when either lookup fails or the product
 * isn't published.
 */
export const getProduct = cache(
  async (
    categorySlug: string,
    productSlug: string,
  ): Promise<{
    product: CatalogProduct;
    category: PublicCategory;
    subcategoryName: string;
  } | null> => {
    const found = await getCategoryBySlug(categorySlug);
    if (!found) return null;
    const product = found.products.find((p) => p.slug === productSlug);
    if (!product) return null;
    return {
      product,
      category: found.category,
      subcategoryName: product.subcategory ?? "Other",
    };
  },
);

/**
 * Every published (category, product) pair — for sitemap / llms.txt /
 * generateStaticParams.
 */
export const getAllPublishedProducts = cache(
  async (): Promise<
    Array<{ category: PublicCategory; product: CatalogProduct }>
  > => {
    const cats = await getCategories();
    const supa = getReadClient();
    const { data: products, error } = await supa
      .from("catalog_products")
      .select("*")
      .eq("is_published", true)
      .order("name", { ascending: true });
    if (error) {
      console.error("[catalog] getAllPublishedProducts failed", error);
      return [];
    }
    const catById = new Map(cats.map((c) => [c.id, c]));
    const out: Array<{ category: PublicCategory; product: CatalogProduct }> = [];
    for (const p of products ?? []) {
      const cat = catById.get(p.category_id);
      if (cat) out.push({ category: cat, product: p });
    }
    return out;
  },
);

/** Total count of published products across all categories. */
export const getTotalProductCount = cache(async (): Promise<number> => {
  const supa = getReadClient();
  const { count, error } = await supa
    .from("catalog_products")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true);
  if (error) {
    console.error("[catalog] getTotalProductCount failed", error);
    return 0;
  }
  return count ?? 0;
});
