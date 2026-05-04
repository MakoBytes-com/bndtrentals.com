import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { CtaBanner } from "@/components/CtaBanner";
import { PROJECTS } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Equipment in Action",
  description:
    "Watch Burton NDT Rentals equipment deployed in the field — robotic crawlers, ACFM scanners, FOSAR retrieval tools, and more.",
};

export default function ProjectsPage() {
  return (
    <>
      <PageHero
        eyebrow="Equipment in action"
        title="See it run before you rent it."
        description="A quick look at how some of our most-deployed equipment performs in real industrial environments — pipelines, tank floors, weld inspections, and confined-space work."
      />

      <section className="bg-canvas py-20 lg:py-28">
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            {PROJECTS.map((p) => (
              <Link
                key={p.slug}
                href={`/projects/${p.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-[0_30px_60px_-30px_rgba(15,23,42,0.25)]"
              >
                <div className="relative aspect-video overflow-hidden bg-canvas-deep">
                  <Image
                    src={`/images/${p.thumb}`}
                    alt={p.title}
                    width={1280}
                    height={720}
                    className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex size-20 items-center justify-center rounded-full bg-white/95 text-brand shadow-2xl">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>
                    </div>
                  </div>
                  <div className="absolute right-4 top-4 rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white">
                    {p.category}
                  </div>
                </div>
                <div className="flex flex-col p-7">
                  <h3 className="text-2xl font-bold text-ink">{p.title}</h3>
                  <p className="mt-3 text-[15px] text-muted leading-relaxed">{p.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}
