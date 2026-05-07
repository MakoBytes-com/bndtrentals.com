import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { CtaBanner } from "@/components/CtaBanner";
import { APPLICATIONS } from "@/lib/applications";
import { pageMetadata } from "@/lib/page-metadata";

export function generateStaticParams() {
  return Object.keys(APPLICATIONS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const app = APPLICATIONS[slug];
  if (!app) return pageMetadata({ title: "Applications", description: "Inspection methodologies.", path: "/applications" });
  return pageMetadata({
    title: app.name,
    description: app.blurb,
    path: `/applications/${slug}`,
  });
}

export default async function ApplicationDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const app = APPLICATIONS[slug];
  if (!app) notFound();

  return (
    <>
      <PageHero
        eyebrow={`${app.abbr} · Application`}
        title={app.fullName ?? app.name}
        description={app.blurb}
      />

      {/* Long description */}
      <section className="bg-canvas py-16 lg:py-20">
        <Container>
          <div className="max-w-3xl">
            <p className="text-[18px] leading-relaxed text-ink-soft">
              {app.longDescription}
            </p>
          </div>
        </Container>
      </section>

      {/* Techniques */}
      {app.techniques && app.techniques.length > 0 && (
        <section className="border-t border-line bg-canvas-tint py-16 lg:py-20">
          <Container>
            <span className="eyebrow">Techniques</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold">
              Methods used in {app.abbr}
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {app.techniques.map((t) => (
                <article
                  key={t.code}
                  className="rounded-xl bg-white p-7 ring-1 ring-line"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-3xl font-bold text-brand">
                      {t.code}
                    </span>
                    <h3 className="text-xl font-semibold text-ink">{t.name}</h3>
                  </div>
                  <ul className="mt-5 space-y-2.5 text-[15px] text-ink-soft">
                    {t.applications.map((a) => (
                      <li key={a} className="flex items-start gap-3">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Equipment */}
      {app.equipment && app.equipment.length > 0 && (
        <section className="border-t border-line bg-canvas py-16 lg:py-20">
          <Container>
            <div className="flex items-end justify-between">
              <div>
                <span className="eyebrow">Equipment</span>
                <h2 className="mt-2 text-3xl sm:text-4xl font-bold">
                  Tools we deploy for {app.abbr}
                </h2>
              </div>
              <Link
                href={`/equipment/${slug}`}
                className="inline-flex items-center gap-2 text-[14px] font-bold text-brand hover:text-brand-dark"
              >
                Full {app.abbr} catalog
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {app.equipment.map((e) => (
                <article
                  key={e.name}
                  className="flex flex-col overflow-hidden rounded-xl bg-canvas-tint ring-1 ring-line"
                >
                  {e.image && (
                    <div className="aspect-[4/3] flex items-center justify-center p-5">
                      <Image
                        src={`/images/${e.image}`}
                        alt={e.name}
                        width={400}
                        height={400}
                        className="max-h-full w-auto object-contain"
                      />
                    </div>
                  )}
                  <div className="border-t border-line bg-white p-4">
                    {e.manufacturer && (
                      <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
                        {e.manufacturer}
                      </p>
                    )}
                    <p className="mt-1 text-[15px] font-semibold text-ink">{e.name}</p>
                  </div>
                </article>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Application bullets (when not covered in techniques) */}
      {app.applications && (!app.techniques || app.techniques.length === 0) && (
        <section className="border-t border-line bg-canvas-tint py-16 lg:py-20">
          <Container>
            <span className="eyebrow">{app.abbr} applications</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Where it's used</h2>
            <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-[15.5px]">
              {app.applications.map((a) => (
                <li key={a} className="flex items-start gap-3 rounded-lg bg-white p-4 ring-1 ring-line">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                  {a}
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {app.sectors && (
        <section className="border-t border-line bg-canvas-deep py-12 text-white">
          <Container>
            <div className="grid items-center gap-6 lg:grid-cols-12">
              <div className="lg:col-span-3">
                <span className="eyebrow">Sectors</span>
                <h3 className="mt-2 text-xl font-bold">Industries served</h3>
              </div>
              <div className="lg:col-span-9">
                <ul className="flex flex-wrap gap-2">
                  {app.sectors.map((s) => (
                    <li
                      key={s}
                      className="rounded-full border border-white/15 px-3.5 py-1.5 text-[13.5px] text-white/80"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </section>
      )}

      <CtaBanner />
    </>
  );
}
