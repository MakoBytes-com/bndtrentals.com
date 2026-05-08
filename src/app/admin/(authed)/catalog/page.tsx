import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAdminSupabase } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Catalog",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type SearchParams = Promise<{
  category?: string;
  q?: string;
  show?: string;
  page?: string;
}>;

export default async function CatalogListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const categoryFilter = (params.category ?? "").trim();
  const search = (params.q ?? "").trim();
  const show = (params.show ?? "all") as "all" | "published" | "unpublished";
  const pageNum = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const supa = getAdminSupabase();

  // Categories drive the filter dropdown.
  const { data: categories } = await supa
    .from("catalog_categories")
    .select("id, slug, name, short")
    .order("sort_order", { ascending: true });

  // Build the products query, then apply pagination range.
  // We request the count alongside the rows so we can render "Showing N–M
  // of TOTAL" + paginate correctly even after filters narrow the set.
  const from = (pageNum - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = supa
    .from("catalog_products")
    .select(
      "id, slug, name, manufacturer, subcategory, image, pdf, is_published, sort_order, category_id, updated_at",
      { count: "exact" },
    )
    .order("name", { ascending: true })
    .range(from, to);

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

  const { data: products, error, count } = await q;
  if (error) {
    return (
      <div className="rounded-xl border border-accent/40 bg-accent/5 p-5">
        <p className="font-bold text-accent">Could not load catalog.</p>
        <p className="mt-1 text-[13px] text-muted">{error.message}</p>
      </div>
    );
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showingFrom = total === 0 ? 0 : from + 1;
  const showingTo = Math.min(from + (products?.length ?? 0), total);

  // Helper to build the URL for a given page while preserving filters.
  function pageUrl(p: number) {
    const sp = new URLSearchParams();
    if (categoryFilter) sp.set("category", categoryFilter);
    if (show !== "all") sp.set("show", show);
    if (search) sp.set("q", search);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/admin/catalog${qs ? `?${qs}` : ""}`;
  }

  const catById = new Map((categories ?? []).map((c) => [c.id, c]));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
            Catalog
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold">Products</h1>
          <p className="mt-2 text-[14.5px] text-muted">
            {total > 0 ? (
              <>
                Showing <strong className="text-ink">{showingFrom}–{showingTo}</strong>{" "}
                of <strong className="text-ink">{total}</strong> product
                {total === 1 ? "" : "s"}. Click any row to edit.
              </>
            ) : (
              <>No products in this view.</>
            )}
          </p>
        </div>
        <Link
          href="/admin/catalog/new"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[14px] font-bold text-white hover:bg-accent-dark"
        >
          + New product
        </Link>
      </div>

      <div className="mt-6">
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
            <colgroup>
              <col className="w-[76px]" />
              <col />
              <col />
              <col />
              <col />
            </colgroup>
            <thead className="bg-canvas-tint text-[12px] font-bold uppercase tracking-widest text-muted">
              <tr>
                <th className="px-3 py-3 text-left">Image</th>
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
                    <td className="px-3 py-3 align-middle">
                      <Link
                        href={`/admin/catalog/${p.id}`}
                        className="flex size-14 items-center justify-center overflow-hidden rounded-lg border border-line bg-white p-1"
                        aria-label={`Edit ${p.name}`}
                      >
                        {p.image ? (
                          <Image
                            src={`/images/${p.image}`}
                            alt=""
                            width={96}
                            height={96}
                            className="max-h-full max-w-full object-contain"
                            unoptimized
                          />
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-soft">
                            no img
                          </span>
                        )}
                      </Link>
                    </td>
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

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-3 text-[13px]"
        >
          <p className="text-muted">
            Page <strong className="text-ink">{pageNum}</strong> of {totalPages}
          </p>
          <div className="flex gap-2">
            {pageNum > 1 ? (
              <Link
                href={pageUrl(pageNum - 1)}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-4 py-1.5 font-semibold text-ink hover:bg-canvas-tint"
              >
                ← Previous
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas-tint px-4 py-1.5 font-semibold text-muted-soft opacity-60"
              >
                ← Previous
              </span>
            )}
            {pageNum < totalPages ? (
              <Link
                href={pageUrl(pageNum + 1)}
                className="inline-flex items-center gap-1 rounded-full bg-brand px-4 py-1.5 font-semibold text-white hover:bg-brand-dark"
              >
                Next →
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas-tint px-4 py-1.5 font-semibold text-muted-soft opacity-60"
              >
                Next →
              </span>
            )}
          </div>
        </nav>
      )}

      <p className="mt-6 text-[12.5px] text-muted-soft">
        Note: edits here write to the bndt-prod database. The public site
        currently reads from <code className="font-mono">src/lib/equipment.ts</code>{" "}
        (static), so admin edits won&apos;t appear on the public site until that
        is swapped over (Phase 3-B-2).
      </p>
    </div>
  );
}
