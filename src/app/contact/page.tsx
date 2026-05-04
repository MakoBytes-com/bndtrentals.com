import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { LOCATIONS, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Reach Burton NDT Rentals — three U.S. service hubs in La Porte TX, Groves TX, and Marietta GA. Call 281-941-4311 or email information@bndtrentals.com.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Get in touch"
        title="Three hubs. One number. Real techs."
        description="Get in touch for equipment availability, custom quotes, calibration scheduling, or technical questions about an inspection job. Pick the closest hub or call HQ — we route on the back end."
      />

      {/* QUICK CONTACT */}
      <section className="bg-canvas py-16 lg:py-20">
        <Container>
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-line bg-canvas-tint p-7">
              <div className="flex size-11 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <h3 className="mt-4 text-lg font-bold">Call us</h3>
              <a
                href={`tel:${SITE.primaryPhoneTel}`}
                className="mt-1 block text-2xl font-bold text-brand hover:text-brand-dark"
              >
                {SITE.primaryPhone}
              </a>
              <p className="mt-2 text-[14px] text-muted">Mon–Fri, business hours CT</p>
            </div>

            <div className="rounded-2xl border border-line bg-canvas-tint p-7">
              <div className="flex size-11 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>
              </div>
              <h3 className="mt-4 text-lg font-bold">Email</h3>
              <a
                href={`mailto:${SITE.email}`}
                className="mt-1 block text-[18px] font-semibold text-brand hover:text-brand-dark break-all"
              >
                {SITE.email}
              </a>
              <p className="mt-2 text-[14px] text-muted">Replies within 1 business hour</p>
            </div>

            <div className="rounded-2xl border border-line bg-canvas-tint p-7">
              <div className="flex size-11 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <h3 className="mt-4 text-lg font-bold">Quote / Reservation</h3>
              <p className="mt-1 text-[15px] text-muted-soft">Tell us what you need and when — we&apos;ll come back with availability and ship dates.</p>
              <Link
                href="/quote"
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[13px] font-bold text-white hover:bg-accent-dark"
              >
                Open the form
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* LOCATIONS */}
      <section className="border-t border-line bg-canvas-tint py-20 lg:py-24">
        <Container>
          <div className="max-w-2xl">
            <span className="eyebrow">Service hubs</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Three U.S. locations.</h2>
            <p className="mt-4 text-[17px] text-muted-soft">
              Each hub stocks calibrated inventory for the surrounding region. Walk-ins by appointment;
              shipments leave the same business day for orders before 4 p.m. CT.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {LOCATIONS.map((loc) => (
              <article
                key={loc.city}
                className="overflow-hidden rounded-2xl bg-white ring-1 ring-line"
              >
                <iframe
                  title={`Map of ${loc.cityState} office`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(loc.mapsQuery)}&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-56 w-full border-0"
                />
                <div className="p-7">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
                        {loc.region}
                      </p>
                      <h3 className="mt-1 text-2xl font-bold">{loc.cityState}</h3>
                    </div>
                    {loc.isHq && (
                      <span className="rounded bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-brand">
                        HQ
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
                    {loc.street}<br />
                    {loc.cityState} {loc.zip}
                  </p>
                  <a
                    href={`tel:${loc.phoneTel}`}
                    className="mt-4 inline-flex items-center gap-2 text-[16px] font-bold text-brand hover:text-brand-dark"
                  >
                    {loc.phone}
                  </a>
                  <div className="mt-3">
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(loc.mapsQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted-soft hover:text-brand"
                    >
                      Open in Google Maps
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7"/><polyline points="7 7 17 7 17 17"/></svg>
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
