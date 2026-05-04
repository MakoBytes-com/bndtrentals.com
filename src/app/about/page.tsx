import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { CtaBanner } from "@/components/CtaBanner";
import { TEAM } from "@/lib/team";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Burton NDT Rentals — 35+ years of industrial inspection equipment rental, sales, calibration, and repair. La Porte TX, Groves TX, and Marietta GA.",
};

// Verbatim from the original Burton NDT Rentals About page — preserved word-for-word.
const VALUES = [
  {
    title: "Customer knowledge first",
    body: "We provide superior performance and customer service through in-depth customer knowledge, and best in class technology.",
  },
  {
    title: "Exceptional value, every account",
    body: "We consistently deliver exceptional value for each customer through efficient account management.",
  },
  {
    title: "Continuous improvement",
    body: "We regularly seek customer, employee and vendor feedback concerning our customer-service, equipment quality, technical support and on-time performance and use this information to relentlessly pursue continuous improvement.",
  },
];

const BIC_ARTICLES = [
  { label: "BIC Magazine — May/June 2022, p.110", file: "BIC-May-June-22_110.pdf" },
  { label: "BIC Magazine — January/February 2022, p.104", file: "BIC-Jan.Feb-2022-104.pdf" },
  { label: "BIC Magazine — September/October 2021, p.101", file: "BIC-Sept.Oct-2021-101.pdf" },
  { label: "BIC Magazine — May/June 2021, p.27", file: "BIC-May.June-2021-27.pdf" },
];

const SERVICES = [
  { label: "Non-Destructive Testing (NDT)", href: "/equipment/ndt" },
  { label: "Remote Visual Inspection (RVI)", href: "/equipment/rvi" },
  { label: "Positive Material Identification (PMI)", href: "/equipment/pmi" },
  { label: "X-Ray Fluorescence (XRF)", href: "/equipment/pmi" },
  { label: "Ground Penetrating Radar (GPR)", href: "/equipment/ndt" },
  { label: "Industrial X-Ray Radiography", href: "/equipment/x-ray" },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Who we are"
        title="Industrial inspection equipment, run by people who've done the field work."
        description={`Founded in 2019 by Mark Burton, Burton NDT Rentals brings ${SITE.yearsInBusiness}+ years of inspection-industry experience to every rental, sale, calibration, and repair we ship.`}
      />

      {/* STORY */}
      <section className="bg-canvas py-20 lg:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <span className="eyebrow">Our story</span>
              <h2 className="mt-2 text-3xl sm:text-4xl lg:text-[40px] leading-[1.1] font-bold">
                {SITE.yearsInBusiness}+ years and counting in industrial inspection.
              </h2>
              <div className="mt-6 space-y-5 text-[17px] leading-relaxed text-ink-soft">
                <p>
                  Burton NDT Rentals is a professional equipment rental and sales company
                  specializing in industrial inspection solutions. With over {SITE.yearsInBusiness} years
                  of inspection-industry experience and the newest inventory in the field, we help
                  industry partners maintain smooth operations, ensure workplace safety, and protect
                  equipment reliability and integrity.
                </p>
                <p>
                  Based out of La Porte, Texas, Burton NDT Rentals serves diverse clients across
                  oil &amp; gas, pipelines, pharmaceutical facilities, chemical plants, and power
                  generation. We deliver unparalleled equipment solutions and inspection expertise
                  in NDT, RVI, GPR, PMI, and X-Ray fluorescence.
                </p>
                <p>
                  We carry portable, easy-to-use RVI equipment — videoscopes, fiberscopes, pipe
                  cameras, and video crawler systems in a range of diameters and lengths — alongside
                  eddy-current testing, phased-array ultrasonics, ultrasonic flaw detection, infrared
                  imaging, and hardness testers. Whatever the turnaround, shutdown, or emergency
                  outage demands, we have the calibrated tool ready to ship.
                </p>
              </div>
            </div>

            <aside className="lg:col-span-5">
              <div className="rounded-2xl border border-line bg-canvas-tint p-7">
                <span className="eyebrow">What we cover</span>
                <h3 className="mt-2 text-xl font-bold">Inspection disciplines</h3>
                <ul className="mt-5 space-y-2.5 text-[15px]">
                  {SERVICES.map((s) => (
                    <li key={s.label} className="flex items-start gap-3">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                      <a href={s.href} className="text-ink-soft hover:text-brand">
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      {/* VALUES */}
      <section className="bg-canvas-tint py-20 lg:py-28">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <span className="eyebrow">Why choose Burton NDT</span>
            <h2 className="mt-2 text-3xl sm:text-4xl lg:text-[40px] leading-[1.1] font-bold">
              The principles that earn us repeat work.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {VALUES.map((v, i) => (
              <div key={v.title} className="rounded-xl bg-white p-7 ring-1 ring-line">
                <p className="font-display text-5xl font-bold text-brand/15">0{i + 1}</p>
                <h3 className="mt-2 text-xl font-bold">{v.title}</h3>
                <p className="mt-3 text-[15px] text-muted leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* BIC ARTICLES */}
      <section className="border-t border-line bg-canvas py-16 lg:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <span className="eyebrow">In the press</span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold">BIC Magazine articles</h2>
              <p className="mt-4 text-[16px] text-muted-soft leading-relaxed">
                Burton NDT featured in <em>BIC Magazine</em>, the Gulf Coast industrial publication
                serving the petrochem, refining, and pipeline sectors.
              </p>
            </div>
            <ul className="lg:col-span-8 grid gap-3 sm:grid-cols-2">
              {BIC_ARTICLES.map((a) => (
                <li key={a.file}>
                  <a
                    href={`/pdfs/${a.file}`}
                    target="_blank"
                    rel="noopener"
                    className="flex items-start gap-4 rounded-xl border border-line bg-canvas-tint p-4 hover:border-brand hover:bg-white"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="12" y1="18" x2="12" y2="12"/>
                        <polyline points="9 15 12 18 15 15"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold uppercase tracking-widest text-accent">PDF</p>
                      <p className="mt-0.5 text-[15px] font-semibold text-ink leading-snug">{a.label}</p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* LEADERSHIP */}
      <section className="bg-canvas py-20 lg:py-28">
        <Container>
          <div className="max-w-2xl">
            <span className="eyebrow">Leadership</span>
            <h2 className="mt-2 text-3xl sm:text-4xl lg:text-[40px] leading-[1.1] font-bold">
              The team behind every shipment.
            </h2>
            <p className="mt-4 text-lg text-muted-soft">
              Burton NDT is led by inspection-industry veterans with combined experience spanning
              military operations, Fortune 500 industrial sales, and decades of field-deployed
              testing.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {TEAM.map((m) => (
              <article
                key={m.name}
                className="rounded-2xl border border-line bg-canvas-tint p-7"
              >
                <div className="flex items-start gap-5">
                  <div
                    aria-hidden
                    className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand font-display text-xl font-bold"
                  >
                    {m.initials}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-ink">{m.name}</h3>
                    <p className="text-[14px] font-semibold uppercase tracking-wider text-accent">
                      {m.title}
                    </p>
                  </div>
                </div>
                <p className="mt-5 text-[15px] leading-relaxed text-muted">{m.bio}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <CtaBanner
        eyebrow="Ready to work together?"
        title="Let's get the right tool on your job site."
        body="Tell us what you're inspecting and we'll match you to the right equipment, handle the calibration paperwork, and ship it before the shift change."
      />
    </>
  );
}
