import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { CtaBanner } from "@/components/CtaBanner";
import { APP_HUB } from "@/lib/applications";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Applications",
  description:
    "NDT, RVI, and PMI inspection methods explained — when to use which technique, and what equipment you need.",
  path: "/applications",
});

export default function ApplicationsHub() {
  return (
    <>
      <PageHero
        eyebrow="Inspection methodologies"
        title="Pick the right technique. Then pick the right tool."
        description="A short primer on the three inspection disciplines we cover — what each method detects, where it shines, and which equipment we rent for it."
      />

      <section className="bg-canvas py-20 lg:py-28">
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            {APP_HUB.map((a) => (
              <Link
                key={a.slug}
                href={a.href}
                className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-[0_30px_60px_-30px_rgba(15,23,42,0.25)]"
              >
                <div className="aspect-[4/3] overflow-hidden bg-canvas-tint">
                  <Image
                    src={`/images/${a.image}`}
                    alt={a.name}
                    width={800}
                    height={600}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
                    {a.abbr}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-ink">{a.name}</h3>
                  <p className="mt-3 text-[15px] text-muted leading-relaxed flex-1">
                    {a.blurb}
                  </p>
                  <p className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand">
                    Read more
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <CtaBanner
        eyebrow="Not sure which method fits?"
        title="Tell us what you're inspecting and we'll match the technique."
        body="Our techs have specified inspection equipment for refineries, pipelines, chemical plants, and turbines. Drop us a line and we'll talk through it."
      />
    </>
  );
}
