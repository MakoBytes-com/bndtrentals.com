import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { CtaBanner } from "@/components/CtaBanner";
import { CATEGORIES, totalProductCount } from "@/lib/equipment";

export const metadata: Metadata = {
  title: "Equipment Catalog",
  description:
    "Industrial inspection equipment available for rent, sale, calibration, and repair from Burton NDT Rentals — NDT, RVI, PMI, X-Ray, Environmental, Accessories, and Consumables.",
};

const PILLAR_IMAGES: Record<string, string> = {
  ndt: "ndt-img.jpg",
  rvi: "rvi-img.jpg",
  pmi: "pmi-img.jpg",
  "x-ray": "CRxFlex-image.jpg",
  environmental: "Honeywell_BW_Microclip_XL.jpg",
  accessories: "U.T_THICKNESS_BLOCK_-_5-STEP_BLOCK.jpg",
  consumables: "Magnaflux-Products.png",
};

export default function EquipmentPage() {
  const total = totalProductCount();
  return (
    <>
      <PageHero
        eyebrow="Equipment catalog"
        title="The full fleet — calibrated, in stock, ready to ship."
        description={`${total}+ equipment models across NDT, RVI, PMI, X-Ray, environmental monitoring, accessories, and consumables. From Olympus and Eddyfi to Magnaflux and SciAps.`}
      />

      <section className="bg-canvas py-20 lg:py-28">
        <Container>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c) => {
              const productCount = c.subcategories.reduce(
                (n, s) => n + s.products.length,
                0
              );
              return (
                <Link
                  key={c.slug}
                  href={`/equipment/${c.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-[0_30px_60px_-30px_rgba(15,23,42,0.25)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-canvas-tint">
                    <Image
                      src={`/images/${PILLAR_IMAGES[c.slug] ?? "ndt-img.jpg"}`}
                      alt={c.name}
                      width={800}
                      height={600}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-ink">
                      {productCount} models
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
                      {c.short}
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-ink">{c.name}</h3>
                    <p className="mt-3 text-[15px] text-muted leading-relaxed flex-1">
                      {c.tagline}
                    </p>
                    <p className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand">
                      Browse {c.short.toLowerCase()}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}
