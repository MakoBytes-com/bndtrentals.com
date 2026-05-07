import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { QuoteForm } from "./QuoteForm";
import { SITE, LOCATIONS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Request a Quote",
  description:
    "Request a rental quote or reservation for industrial inspection equipment from Burton NDT Rentals. Same-day pricing, calibrated stock.",
};

export default function QuotePage() {
  return (
    <>
      <PageHero
        eyebrow="Quote / Reservation"
        title="Tell us what you need."
        description="Fill out as much as you can. The faster we know your dates and item, the faster we can confirm availability — usually within the business hour."
      />

      <section className="bg-canvas py-16 lg:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <QuoteForm />
            </div>

            <aside className="lg:col-span-4">
              <div className="sticky top-32 space-y-5">
                <div className="rounded-xl border border-line bg-canvas-tint p-6">
                  <h3 className="text-lg font-bold">In a hurry?</h3>
                  <p className="mt-2 text-[15px] text-muted">
                    Skip the form and call the warehouse directly.
                  </p>
                  <a
                    href={`tel:${SITE.primaryPhoneTel}`}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-[14px] font-bold text-white hover:bg-accent-dark"
                  >
                    {SITE.primaryPhone}
                  </a>
                </div>

                <div className="rounded-xl border border-line bg-white p-6">
                  <h3 className="text-lg font-bold">All hubs</h3>
                  <ul className="mt-4 space-y-4 text-[14px]">
                    {LOCATIONS.map((loc) => (
                      <li key={loc.city}>
                        <p className="font-semibold text-ink">
                          {loc.cityState}{loc.isHq && " (HQ)"}
                        </p>
                        <a
                          href={`tel:${loc.phoneTel}`}
                          className="text-brand hover:text-brand-dark"
                        >
                          {loc.phone}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-line bg-white p-6">
                  <h3 className="text-lg font-bold">Program documents</h3>
                  <p className="mt-1 text-[13px] text-muted">Download the canonical program sheets.</p>
                  <ul className="mt-4 space-y-2 text-[14px]">
                    {[
                      { label: "Evergreen Rental Program (PDF)", file: "EVERGREEN-RENTAL-PROGRAM_April_2022.pdf" },
                      { label: "Evergreen Program Sheet (DOCX)", file: "Updated-ERP-Sheet-ERGREEN-RENTAL-PROGRAM.docx" },
                      { label: "Equipment Rental Protection Plan (DOCX)", file: "Updated-ERPP.docx" },
                      { label: "Terms & Conditions (PDF)", file: "Terms-and-Conditions.pdf" },
                    ].map((d) => (
                      <li key={d.file}>
                        <a
                          href={`/pdfs/${d.file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-line p-2.5 hover:border-brand hover:bg-canvas-tint"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          <span className="text-[13px] font-semibold text-ink">{d.label}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}
