import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { CtaBanner } from "@/components/CtaBanner";
import { AddToQuoteButton } from "@/components/AddToQuoteButton";
import { getCategories, getCategoryBySlug } from "@/lib/catalog";
import { SITE } from "@/lib/site";
import { pageMetadata } from "@/lib/page-metadata";

export const dynamic = "force-dynamic";

function calSlug(s: string) {
  return "cal-" + s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export const metadata: Metadata = pageMetadata({
  title: "Calibration & Repair",
  description:
    "In-house calibration and repair services for NDT, RVI, PMI, and environmental monitoring equipment. Calibration certificates included; recall management on request.",
  path: "/calibration",
});

const STEPS = [
  {
    n: "01",
    title: "Send your equipment",
    body: "Drop it off at any of our hubs or ship it to La Porte. We'll send a return shipping label if you need one.",
  },
  {
    n: "02",
    title: "Bench test & calibrate",
    body: "Inspection, function testing, then calibration to manufacturer or applicable standard. Failed components are flagged.",
  },
  {
    n: "03",
    title: "Documentation & return",
    body: "Cal certificate (and as-found / as-left data when applicable) delivered with the unit. Return shipped or ready for pickup.",
  },
];

export default async function CalibrationPage() {
  const categories = await getCategories();
  const categoriesWithSubs = await Promise.all(
    categories.map(async (c) => {
      const detail = await getCategoryBySlug(c.slug);
      return {
        category: c,
        subcategories: detail?.subcategories ?? [],
      };
    }),
  );
  return (
    <>
      <PageHero
        eyebrow="Calibration & Repair"
        title="In-house calibration. Real certificates. Fast turnaround."
        description="Send us your equipment and we'll bench-test, calibrate, and certify it — across our full rental fleet's worth of inspection categories."
      />

      {/* CALIBRATION PRICE LIST */}
      <section className="bg-canvas border-b border-line py-10 lg:py-12">
        <Container>
          <div className="flex flex-col gap-5 rounded-2xl border border-line bg-canvas-tint p-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <polyline points="9 15 12 18 15 15"/>
                </svg>
              </div>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-widest text-accent">Reference</p>
                <h2 className="mt-1 text-xl font-bold">Burton NDT Calibration Price List</h2>
                <p className="mt-1 text-[14.5px] text-muted">
                  Full bench-rate price list for our calibration services — published reference; final quotes confirmed by phone.
                </p>
              </div>
            </div>
            <a
              href="/pdfs/Burton-NDT-Rentals-Calibration-Price-List.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-[14.5px] font-bold text-white hover:bg-accent-dark"
            >
              Download PDF (281 KB)
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
            </a>
          </div>
        </Container>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-canvas py-20 lg:py-28">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <span className="eyebrow">How it works</span>
            <h2 className="mt-2 text-3xl sm:text-4xl lg:text-[40px] leading-[1.1] font-bold">
              Three steps, one document trail.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-xl border border-line bg-canvas-tint p-7">
                <p className="font-display text-5xl font-bold text-brand/15">{s.n}</p>
                <h3 className="mt-2 text-xl font-bold">{s.title}</h3>
                <p className="mt-3 text-[15px] text-muted leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CAPABILITIES */}
      <section className="bg-canvas-tint py-20 lg:py-28">
        <Container>
          <div className="max-w-2xl">
            <span className="eyebrow">Calibration capabilities</span>
            <h2 className="mt-2 text-3xl sm:text-4xl lg:text-[40px] leading-[1.1] font-bold">
              Equipment we calibrate.
            </h2>
            <p className="mt-4 text-[17px] text-muted-soft leading-relaxed">
              Pick any category that needs calibration and add it to your quote — bundle multiple
              units in one request. If your equipment isn&apos;t listed, give us a call at{" "}
              <a
                href={`tel:${SITE.primaryPhoneTel}`}
                className="font-semibold text-brand hover:text-brand-dark"
              >
                {SITE.primaryPhone}
              </a>{" "}
              and we&apos;ll let you know.
            </p>
          </div>

          {categoriesWithSubs.map(({ category: cat, subcategories }) => (
            <div key={cat.slug} className="mt-12">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-xl font-bold text-ink">{cat.name}</h3>
                <Link
                  href={`/equipment/${cat.slug}`}
                  className="text-[13px] font-semibold text-muted hover:text-brand"
                >
                  View {cat.shortLabel} catalog →
                </Link>
              </div>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {subcategories.map((sub) => (
                  <li
                    key={sub.name}
                    className="flex items-center justify-between gap-3 rounded-lg bg-white p-4 ring-1 ring-line"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-accent">
                        {cat.shortLabel}
                      </p>
                      <p className="mt-0.5 text-[14.5px] font-semibold text-ink leading-snug">
                        {sub.name}
                      </p>
                    </div>
                    <AddToQuoteButton
                      productSlug={calSlug(`${cat.slug}-${sub.name}`)}
                      categorySlug="calibration"
                      productName={`Calibration — ${sub.name} (${cat.shortLabel})`}
                      kind="calibration"
                      size="sm"
                      variant="ghost"
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Container>
      </section>

      <CtaBanner
        eyebrow="Calibration paperwork due?"
        title="Get your unit on the bench this week."
        body="Drop your model number and required standard in the form, and we'll send back a turn-around date within the business day."
      />
    </>
  );
}
