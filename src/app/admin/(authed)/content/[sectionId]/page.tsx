import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { SectionEditForm } from "./SectionEditForm";
import type { PageSection } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Edit section",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function SectionEditPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;

  const supa = getAdminSupabase();
  const { data, error } = await supa
    .from("page_sections")
    .select("*")
    .eq("id", sectionId)
    .maybeSingle();
  if (error || !data) notFound();
  const s = data as PageSection;

  return (
    <div>
      <Link
        href="/admin/content"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-brand"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        All sections
      </Link>

      <div className="mt-4">
        <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
          Section · v{s.version}
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold">{s.title}</h1>
        <p className="mt-1 text-[12.5px] text-muted-soft">
          slug: <code className="font-mono">{s.slug}</code>
          {" · "}updated: {fmtDate(s.updated_at)}
          {s.published_at ? ` · first published: ${fmtDate(s.published_at)}` : ""}
        </p>
      </div>

      <SectionEditForm initial={s} />
    </div>
  );
}
