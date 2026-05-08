import type { Metadata } from "next";
import Link from "next/link";
import { getAdminSupabase } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Categories",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CategoriesListPage() {
  const supa = getAdminSupabase();

  const { data: categories, error } = await supa
    .from("catalog_categories")
    .select("id, slug, name, short, tagline, sort_order, is_published")
    .order("sort_order", { ascending: true });

  if (error) {
    return (
      <div className="rounded-xl border border-accent/40 bg-accent/5 p-5">
        <p className="font-bold text-accent">Could not load categories.</p>
        <p className="mt-1 text-[13px] text-muted">{error.message}</p>
      </div>
    );
  }

  // Get product counts in one round-trip-ish query.
  const counts = new Map<string, number>();
  if (categories && categories.length > 0) {
    const { data: rows } = await supa
      .from("catalog_products")
      .select("category_id");
    for (const r of rows ?? []) {
      counts.set(r.category_id, (counts.get(r.category_id) ?? 0) + 1);
    }
  }

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
        Back to catalog
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
            Catalog
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold">Categories</h1>
          <p className="mt-2 text-[14.5px] text-muted">
            {categories?.length ?? 0} categor{categories?.length === 1 ? "y" : "ies"}.
            Sort order controls display order on the public catalog.
          </p>
        </div>
        <Link
          href="/admin/catalog/categories/new"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[14px] font-bold text-white hover:bg-accent-dark"
        >
          + New category
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
        {categories && categories.length > 0 ? (
          <table className="w-full text-[14px]">
            <thead className="bg-canvas-tint text-[12px] font-bold uppercase tracking-widest text-muted">
              <tr>
                <th className="px-5 py-3 text-left">Category</th>
                <th className="px-5 py-3 text-left">Short</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Products</th>
                <th className="px-5 py-3 text-right">Sort</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-canvas-tint/50">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/admin/catalog/categories/${c.id}`}
                      className="block font-semibold text-ink hover:text-brand"
                    >
                      {c.name}
                    </Link>
                    <p className="text-[12.5px] text-muted-soft">
                      <code className="font-mono">{c.slug}</code>
                      {c.tagline ? ` · ${c.tagline}` : ""}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-muted">{c.short ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-bold uppercase tracking-wider ${
                        c.is_published
                          ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                          : "bg-slate-200 text-slate-700 ring-1 ring-slate-300"
                      }`}
                    >
                      {c.is_published ? "Published" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-muted">
                    {counts.get(c.id) ?? 0}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-muted">
                    {c.sort_order}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="text-[15px] font-semibold">No categories yet.</p>
            <p className="mt-2 text-[13.5px] text-muted">
              Click <strong>New category</strong> to add the first one.
            </p>
          </div>
        )}
      </div>

      <p className="mt-6 text-[12.5px] text-muted-soft">
        Note: a category can only be deleted when it has zero products. If a
        category has products, move them first or unpublish the category.
      </p>
    </div>
  );
}
