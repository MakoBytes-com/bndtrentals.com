import type { Metadata } from "next";
import Link from "next/link";
import { getAdminSupabase } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Site content",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type SearchParams = Promise<{ q?: string; show?: string }>;

export default async function ContentListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const search = (params.q ?? "").trim();
  const show = (params.show ?? "all") as "all" | "published" | "draft";

  const supa = getAdminSupabase();
  let q = supa
    .from("page_sections")
    .select("id, slug, title, version, is_published, updated_at, published_at")
    .order("slug", { ascending: true })
    .limit(500);
  if (show === "published") q = q.eq("is_published", true);
  if (show === "draft") q = q.eq("is_published", false);
  if (search) q = q.or(`slug.ilike.%${search}%,title.ilike.%${search}%`);

  const { data, error } = await q;
  if (error) {
    return (
      <div className="rounded-xl border border-accent/40 bg-accent/5 p-5">
        <p className="font-bold text-accent">Could not load content sections.</p>
        <p className="mt-1 text-[13px] text-muted">{error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
            Content
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold">Page sections</h1>
          <p className="mt-2 text-[14.5px] text-muted">
            {data?.length ?? 0} section{data?.length === 1 ? "" : "s"} in this view.
          </p>
        </div>
        <Link
          href="/admin/content/new"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[14px] font-bold text-white hover:bg-accent-dark"
        >
          + New section
        </Link>
      </div>

      <form action="/admin/content" method="get" className="mt-6 flex flex-wrap gap-2">
        <select
          name="show"
          defaultValue={show}
          aria-label="Filter by publish status"
          className="rounded-lg border border-line bg-white px-3 py-2 text-[14px] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        >
          <option value="all">All status</option>
          <option value="published">Published only</option>
          <option value="draft">Drafts only</option>
        </select>
        <input
          type="search"
          name="q"
          placeholder="Search slug or title…"
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

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
        {data && data.length > 0 ? (
          <table className="w-full text-[14px]">
            <thead className="bg-canvas-tint text-[12px] font-bold uppercase tracking-widest text-muted">
              <tr>
                <th className="px-5 py-3 text-left">Section</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Version</th>
                <th className="px-5 py-3 text-right">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((s) => (
                <tr key={s.id} className="hover:bg-canvas-tint/50">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/admin/content/${s.id}`}
                      className="block font-semibold text-ink hover:text-brand"
                    >
                      {s.title}
                    </Link>
                    <p className="text-[12.5px] text-muted-soft">
                      <code className="font-mono">{s.slug}</code>
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-bold uppercase tracking-wider ${
                        s.is_published
                          ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                          : "bg-slate-200 text-slate-700 ring-1 ring-slate-300"
                      }`}
                    >
                      {s.is_published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 tabular-nums text-muted">v{s.version}</td>
                  <td className="px-5 py-3.5 text-right text-[12.5px] text-muted">
                    {fmtDate(s.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="text-[15px] font-semibold">No sections in this view.</p>
            <p className="mt-2 text-[13.5px] text-muted">
              Use the New section button to add one.
            </p>
          </div>
        )}
      </div>

      <p className="mt-6 text-[12.5px] text-muted-soft">
        Note: section rows are stored in the database now. Wiring specific
        public pages (about, team, applications) to render body_html from
        these rows still ships in a follow-up — Phase 3-D-2.
      </p>
    </div>
  );
}
