import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for renting and purchasing equipment from Burton NDT Rentals.",
};

const SECTIONS = [
  {
    title: "1. Equipment Rental",
    body:
      "All equipment is rented in calibrated, working condition. Calibration certificates are issued at time of shipment unless waived in writing by the customer. Customer assumes responsibility for the equipment from the moment it is signed for at the receiving address until it is returned to a Burton NDT Rentals hub.",
  },
  {
    title: "2. Equipment Rental Protection Plan (ERPP)",
    body:
      "Customers may add the optional Equipment Rental Protection Plan (ERPP) at 15% of the rental rate. ERPP covers normal field damage but does not cover loss, theft, willful misuse, abuse, exposure to incompatible chemicals, or damage caused by failure to follow operating instructions.",
  },
  {
    title: "3. Evergreen Rental Program",
    body:
      "Rentals booked for six (6) months or longer qualify for the Evergreen Rental Program, which provides reduced monthly rates and priority calibration windows. Contact your account manager for current Evergreen pricing.",
  },
  {
    title: "4. Calibration & Recalibration",
    body:
      "Equipment is calibrated prior to shipment. Customer is responsible for following manufacturer recalibration intervals during long-term rentals. Recalibration during the rental term may be performed by Burton NDT Rentals or by a customer-designated calibration lab; recalibration costs are billed in addition to the rental rate.",
  },
  {
    title: "5. Shipping & Returns",
    body:
      "Customer is responsible for outbound and return freight, including insurance. Shipping account numbers may be provided to bill freight directly to the customer's carrier. Equipment must be returned in the same case and configuration in which it was shipped, with all accessories included.",
  },
  {
    title: "6. Payment & Credit Terms",
    body:
      "Payment terms are Net 30 from invoice date for established accounts. New customers may be required to provide a credit card or pay a deposit prior to shipment. Interest of 1.5% per month accrues on past-due balances.",
  },
  {
    title: "7. Liability",
    body:
      "Burton NDT Rentals' liability is limited to the rental cost of the equipment. Burton NDT Rentals is not liable for incidental, consequential, or special damages arising from the use, misuse, or failure of any equipment, including but not limited to loss of revenue, downtime, or third-party claims.",
  },
  {
    title: "8. Damage, Loss & Replacement",
    body:
      "Customer is liable for the full replacement cost of equipment damaged beyond repair, lost, or not returned. Repair costs for damage not covered by ERPP will be billed at cost plus 15%.",
  },
  {
    title: "9. Governing Law",
    body:
      "These terms are governed by the laws of the State of Texas. Any dispute arising from a rental, sale, calibration, or repair shall be resolved in a court of competent jurisdiction in Harris County, Texas.",
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms & Conditions"
        description="Standard terms governing equipment rental, calibration, repair, and sales by Burton NDT Rentals."
      />

      <section className="bg-canvas py-16 lg:py-20">
        <Container size="narrow">
          <div className="flex flex-col gap-5 rounded-2xl border border-line bg-canvas-tint p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-accent">Canonical document</p>
                <p className="mt-0.5 text-[15px] font-semibold text-ink">Burton NDT Rentals — Signed Terms &amp; Conditions PDF</p>
                <p className="mt-1 text-[13.5px] text-muted">
                  The summary below is for reference. The signed PDF is the binding version sent with every rental.
                </p>
              </div>
            </div>
            <a
              href="/pdfs/Terms-and-Conditions.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-[14px] font-bold text-white hover:bg-accent-dark"
            >
              Download PDF
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
            </a>
          </div>

          <div className="mt-10 space-y-10">
            {SECTIONS.map((s) => (
              <article key={s.title}>
                <h2 className="text-xl font-bold text-ink">{s.title}</h2>
                <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">{s.body}</p>
              </article>
            ))}
          </div>

          <p className="mt-12 text-[13px] text-muted-soft">
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.
            These terms may be updated at any time. The terms in effect at the time of your rental,
            sale, calibration, or repair are the controlling terms.
          </p>
        </Container>
      </section>
    </>
  );
}
