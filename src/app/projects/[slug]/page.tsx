import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { CtaBanner } from "@/components/CtaBanner";
import { PROJECTS, PROJECT_BY_SLUG } from "@/lib/projects";
import { pageMetadata } from "@/lib/page-metadata";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = PROJECT_BY_SLUG[slug];
  if (!p) return pageMetadata({ title: "Project", description: "Equipment in action.", path: "/projects" });
  return pageMetadata({
    title: p.title,
    description: p.blurb,
    path: `/projects/${slug}`,
  });
}

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = PROJECT_BY_SLUG[slug];
  if (!p) notFound();

  return (
    <>
      <PageHero eyebrow={p.category} title={p.title} description={p.blurb} />

      <section className="bg-canvas py-16 lg:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="overflow-hidden rounded-2xl border border-line bg-canvas-deep aspect-video">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${p.youtubeId}?rel=0&modestbranding=1`}
                  title={p.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>

            <aside className="lg:col-span-4">
              <div className="rounded-xl border border-line bg-canvas-tint p-6">
                <h3 className="text-lg font-bold">About the equipment</h3>
                <p className="mt-3 text-[15px] text-muted leading-relaxed">{p.blurb}</p>
                {p.related && (
                  <Link
                    href={p.related}
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-[14px] font-bold text-white hover:bg-brand-dark"
                  >
                    Browse related equipment
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </Link>
                )}
              </div>
              <div className="mt-5 rounded-xl border border-line bg-white p-6">
                <h3 className="text-lg font-bold">Other demos</h3>
                <ul className="mt-3 space-y-2 text-[14px]">
                  {PROJECTS.filter((x) => x.slug !== p.slug).map((x) => (
                    <li key={x.slug}>
                      <Link
                        href={`/projects/${x.slug}`}
                        className="text-ink-soft hover:text-brand"
                      >
                        {x.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}
