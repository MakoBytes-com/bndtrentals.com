import type { Metadata } from "next";
import Link from "next/link";
import { getAdminSupabase } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Catalog",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ category?: string; q?: string; show?: string }>;

export default async function CatalogListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const categoryFilter = (params.category ?? "").trim();
  const search = (params.q ?? "").trim();
  const show = (params.show ?? "all") as "all" | "published" | "unpublished";

  const supa = getAdminSupabase();

  // Categories drive the filter dropdown.
  const { data: categories } = await supa
    .from("catalog_categories")
    .select("id, slug, name, short")
    .order("sort_order", { ascending: true });

  // Products query.
  let q = supa
    .from("catalog_products")
    .select(
      "id, slug, name, manufacturer, subcategory, image, pdf, is_published, sort_order, category_id, updated_at",
    )
    .order("name", { ascending: true })
    .limit(500);

  if (categoryFilter) {
    const cat = (categories ?? []).find((c) => c.slug === categoryFilter);
    if (cat) q = q.eq("category_id", cat.id);
  }
  if (show === "published") q = q.eq("is_published", true);
  if (show === "unpublished") q = q.eq("is_published", false);
  if (search) {
    q = q.or(
      `name.ilike.%${search}%,manufacturer.ilike.%${search}%,slug.ilike.%${search}%`,
    );
  }

  const { data: products, error } = await q;
  if (error) {
    return (
      <div className="rounded-xl border border-accent/40 bg-accent/5 p-5">
        <p className="font-bold text-accent">Could not load catalog.</p>
        <p className="mt-1 text-[13px] text-muted">{error.message}</p>
      </div>
    );
  }

  const catById = new Map((categories ?? []).map((c) => [c.id, c]));

  return (
    <div>
      <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
        Catalog
      </p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-bold">Products</h1>
      <p className="mt-2 text-[14.5px] text-muted">
        {products?.length ?? 0} of{" "}
        {(categories ?? []).reduce((n) => n, 0) || products?.length || 0}{" "}
        products visible. Click any row to edit.
      </p>

      <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <form action="/admin/catalog" method="get" className="flex flex-wrap gap-2">
          <select
            name="category"
            defaultValue={categoryFilter}
            aria-label="Filter by category"
            className="rounded-lg border border-line bg-white px-3 py-2 text-[14px] text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            <option value="">All categories</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            name="show"
            defaultValue={show}
            aria-label="Filter by publish status"
            className="rounded-lg border border-line bg-white px-3 py-2 text-[14px] text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            <option value="all">All status</option>
            <option value="published">Published only</option>
            <option value="unpublished">Hidden only</option>
          </select>
          <input
            type="search"
            name="q"
            placeholder="Search name / manufacturer / slug…"
            defaultValue={search}
            className="flex-1 min-w-[200px] rounded-lg border border-line bg-white px-3.5 py-2 text-[14px] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand px-4 py-2 text-[14px] font-semibold text-white hover:bg-brand-dark"
          >
            Apply
          </button>
        </form>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
        {products && products.length > 0 ? (
          <table className="w-full text-[14px]">
            <thead className="bg-canvas-tint text-[12px] font-bold uppercase tracking-widest text-muted">
              <tr>
                <th className="px-5 py-3 text-left">Product</th>
                <th className="px-5 py-3 text-left">Category</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => {
                const cat = catById.get(p.category_id);
                return (
                  <tr key={p.id} className="hover:bg-canvas-tint/50">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/catalog/${p.id}`}
                        className="block font-semibold text-ink hover:text-brand"
                      >
                        {p.manufacturer ? `${p.manufacturer} ` : ""}
                        {p.name}
                      </Link>
                      <p className="text-[12.5px] text-muted-soft">
                        {p.slug}
                        {p.subcategory ? ` · ${p.subcategory}` : ""}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {cat ? cat.short ?? cat.name : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-bold uppercase tracking-wider ${
                          p.is_published
                            ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-slate-200 text-slate-700 ring-1 ring-slate-300"
                        }`}
                      >
                        {p.is_published ? "Published" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[12.5px] text-muted">
                      {p.pdf ? (
                        <span title={p.pdf} className="truncate inline-block max-w-[200px]">
                          ✓ {p.pdf}
                        </span>
                      ) : (
                        <span className="text-muted-soft">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="text-[15px] font-semibold">No products in this view.</p>
            <p className="mt-2 text-[13.5px] text-muted">
              Try a different category or clearing the search filter.
            </p>
          </div>
        )}
      </div>

      <p className="mt-6 text-[12.5px] text-muted-soft">
        Note: edits here write to the bndt-prod database. The public site
        currently reads from <code className="font-mono">src/lib/equipment.ts</code>{" "}
        (static), so admin edits won&apos;t appear on the public site until that
        is swapped over (Phase 3-B-2).
      </p>
    </div>
  );
}
