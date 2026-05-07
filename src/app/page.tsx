import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/Container";
import { CATEGORIES, totalProductCount } from "@/lib/equipment";
import { LOCATIONS, SITE } from "@/lib/site";

const STATS = [
  { value: "35+", label: "Years in business" },
  { value: "3", label: "U.S. service hubs" },
  { value: `${totalProductCount()}+`, label: "Equipment models" },
  { value: "24h", label: "Most rentals shipped within" },
];

const FEATURED = [
  { name: "Olympus 38DL Plus", category: "Ultrasonic Thickness Gauge", image: "olympus-38DL.jpg", href: "/equipment/ndt/olympus-38dl-plus" },
  { name: "Thermo Niton XL5", category: "PMI Analyzer", image: "NITON-XL5-PIC.jpg", href: "/equipment/pmi/thermo-niton-xl5" },
  { name: "Eddyfi Reddy", category: "Eddy Current Flaw Detector", image: "eddyfireddy.png", href: "/equipment/ndt/eddyfi-reddy" },
  { name: "Olympus IPLEX MX II", category: "Videoscope", image: "Olympus_IPLEX_MX_II.jpg", href: "/equipment/rvi/olympus-iplex-mx-ii" },
  { name: "Inuktun Versatrax 150", category: "Pipe Crawler", image: "Inuktun-VT-150.png", href: "/equipment/rvi/eddyfi-inuktun-versatrax-150" },
  { name: "Honeywell BW MicroClip XL", category: "Multi-gas Monitor", image: "Honeywell_BW_Microclip_XL.jpg", href: "/equipment/environmental/honeywell-bw-microclip-xl" },
];

const INDUSTRIES = [
  "Oil & Gas",
  "Pipelines",
  "Chemical",
  "Petroleum Refining",
  "Manufacturing",
  "Aviation",
  "Pulp & Paper",
  "Power Generation",
  "Pharmaceutical",
  "Mining",
];

const PILLARS = CATEGORIES.slice(0, 3).map((c) => ({
  ...c,
  pillarImage:
    c.slug === "ndt"
      ? "ndt-img.jpg"
      : c.slug === "rvi"
        ? "rvi-img.jpg"
        : "pmi-img.jpg",
}));

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-canvas-deep text-white">
        <Image
          src="/images/slider-img.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-10 object-cover opacity-40"
          aria-hidden
        />
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(120deg, rgba(11,18,32,0.96) 0%, rgba(11,18,32,0.85) 45%, rgba(15,58,138,0.55) 100%)",
          }}
          aria-hidden
        />

        <Container className="py-20 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <span className="eyebrow">Burton NDT Rentals · Est. 1990</span>
              <h1 className="mt-4 text-[40px] sm:text-5xl lg:text-[64px] leading-[1.05] font-bold text-white">
                Industrial inspection equipment,{" "}
                <span className="text-[var(--color-accent)]">ready when you are.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-white/75">
                NDT, RVI, PMI, X-Ray, and environmental monitoring — rented, sold, calibrated, and
                repaired by a team that&apos;s been doing this for {SITE.yearsInBusiness}+ years.
                Three U.S. hubs, calibrated inventory in stock, and turnaround support that doesn&apos;t
                clock out at 5 p.m.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/quote"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-6 py-3.5 text-[15px] font-bold text-white hover:bg-[var(--color-accent-dark)]"
                >
                  Request a Quote
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
                <Link
                  href="/equipment"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-white/15 backdrop-blur"
                >
                  Browse equipment
                </Link>
                <a
                  href={`tel:${SITE.primaryPhoneTel}`}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-3.5 text-[15px] font-semibold text-white/85 hover:text-white"
                >
                  or call {SITE.primaryPhone}
                </a>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10">
                {STATS.map((s) => (
                  <div key={s.label} className="bg-[var(--color-canvas-deep)]/85 p-6 backdrop-blur">
                    <p className="font-display text-4xl font-bold text-white">{s.value}</p>
                    <p className="mt-1 text-[13px] text-white/65 leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>

        <div className="border-t border-white/10 bg-black/30">
          <Container className="flex flex-wrap items-center gap-x-10 gap-y-3 py-5 text-[12px] uppercase tracking-[0.2em] text-white/55">
            <span className="text-white/80 font-bold">Trusted brands in our fleet</span>
            <span>Olympus</span>
            <span>Eddyfi</span>
            <span>Thermo Scientific</span>
            <span>Sonatest</span>
            <span>SciAps</span>
            <span>Honeywell</span>
            <span>FARO</span>
            <span>Wohler</span>
            <span>Magnaflux</span>
          </Container>
        </div>
      </section>

      {/* THREE PILLARS */}
      <section className="bg-canvas py-20 lg:py-28">
        <Container>
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <span className="eyebrow">What we rent</span>
              <h2 className="mt-2 text-3xl sm:text-4xl lg:text-[44px] leading-[1.1] font-bold">
                Three pillars. One inspection partner.
              </h2>
              <p className="mt-4 text-lg text-muted-soft">
                Every category in our catalog is calibrated, test-fired, and shipped with the
                accessories your tech actually needs in the field.
              </p>
            </div>
            <Link
              href="/equipment"
              className="inline-flex items-center gap-2 text-[14px] font-bold text-brand hover:text-brand-dark"
            >
              See all equipment
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PILLARS.map((p) => (
              <Link
                key={p.slug}
                href={`/equipment/${p.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-[0_30px_60px_-30px_rgba(15,23,42,0.25)]"
              >
                <div className="aspect-[4/3] overflow-hidden bg-canvas-tint">
                  <Image
                    src={`/images/${p.pillarImage}`}
                    alt={`${p.name} equipment`}
                    width={800}
                    height={600}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
                    {p.short}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-ink">{p.name}</h3>
                  <p className="mt-3 text-[15px] text-muted leading-relaxed">{p.tagline}</p>
                  <p className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand">
                    Browse {p.short.toLowerCase()} fleet
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* FEATURED EQUIPMENT */}
      <section className="bg-canvas-tint py-20 lg:py-28">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <span className="eyebrow">In the fleet</span>
              <h2 className="mt-2 text-3xl sm:text-4xl lg:text-[44px] leading-[1.1] font-bold">
                A few of the workhorses.
              </h2>
              <p className="mt-4 text-lg text-muted-soft">
                Our most-rented units across NDT, RVI, PMI, and gas monitoring. The full catalog
                lives over in <Link href="/equipment" className="text-brand font-semibold hover:underline">Equipment</Link>.
              </p>
            </div>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED.map((p) => (
              <Link
                key={p.name}
                href={p.href}
                className="group flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-line transition-all hover:ring-brand hover:shadow-[0_20px_40px_-24px_rgba(15,58,138,0.4)]"
              >
                <div className="aspect-[4/3] overflow-hidden bg-canvas-tint p-6 flex items-center justify-center">
                  <Image
                    src={`/images/${p.image}`}
                    alt={p.name}
                    width={500}
                    height={500}
                    className="h-full w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="border-t border-line p-5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
                    {p.category}
                  </p>
                  <p className="mt-1.5 text-[16px] font-semibold text-ink">{p.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* MISSION STATEMENT */}
      <section className="bg-canvas-tint border-t border-line py-16 lg:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <span className="eyebrow">Our mission</span>
              <h2 className="mt-2 text-3xl sm:text-4xl lg:text-[40px] leading-[1.1] font-bold">
                Advanced technology and superior equipment for Non-Destructive Testing.
              </h2>
            </div>
            <div className="lg:col-span-7">
              <p className="text-[18px] leading-relaxed text-ink-soft">
                To be known by our customers in the markets we serve as the leader in creating
                recognizable value through exceptional customer service, unprecedented quality,
                and the best in class equipment for NDT, RVI, and PMI rental solutions.
              </p>
              <p className="mt-5 text-[16px] leading-relaxed text-muted">
                Along with our in-depth industry knowledge and best in class technology, our
                testing equipment helps you achieve operational excellence, monitor environmental
                conditions, and promote industrial safety.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* WHY US */}
      <section className="bg-canvas py-20 lg:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <span className="eyebrow">Why Burton NDT</span>
              <h2 className="mt-2 text-3xl sm:text-4xl lg:text-[44px] leading-[1.1] font-bold">
                Built for shutdowns, turnarounds, and the calls that come at 4:47 p.m.
              </h2>
              <p className="mt-5 text-lg text-muted-soft">
                We&apos;re a rental house run by people who&apos;ve done the field work. That means
                tools that ship calibrated, ship fast, and don&apos;t come back broken.
              </p>
              <Link
                href="/about"
                className="mt-7 inline-flex items-center gap-2 text-[14px] font-bold text-brand hover:text-brand-dark"
              >
                Read our story
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
            </div>
            <div className="lg:col-span-7 grid gap-5 sm:grid-cols-2">
              {[
                {
                  title: "Late-day shipping",
                  body:
                    "Order before 4 p.m. CT and most rentals leave the same day. Hot-shot delivery available for Gulf Coast emergencies.",
                  iconPath: "M3 3h18v4H3zM5 7v13h14V7M9 11h6M9 15h6",
                },
                {
                  title: "In-house calibration",
                  body:
                    "Every unit is bench-tested and calibrated before it leaves us. Calibration certificates included; recall management on request.",
                  iconPath: "M9 11l3 3 8-8M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
                },
                {
                  title: "Inspection-tech support",
                  body:
                    "Real techs answer the phone — not a script. We'll talk you through setup, calibration, and field troubleshooting.",
                  iconPath: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
                },
                {
                  title: "Evergreen Rental Program",
                  body:
                    "Under the Evergreen Rental Program, Burton NDT retains ownership of the equipment but the customer takes possession for a stated period — minimum 6 months. Locks in lower rates and priority calibration windows; pairs with our 15% Equipment Rental Protection Plan (ERPP) for damage cover.",
                  iconPath: "M12 2v6m0 0l-3-3m3 3l3-3M5 12h14M5 12l3 3m-3-3l3-3M12 16v6m0 0l3-3m-3 3l-3-3",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-line bg-canvas-tint p-6"
                >
                  <div className="flex size-11 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={f.iconPath} />
                    </svg>
                  </div>
                  <h3 className="mt-5 text-xl font-bold">{f.title}</h3>
                  <p className="mt-2 text-[15px] text-muted leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* FIELD GALLERY */}
      <section className="bg-canvas-tint py-16 lg:py-20">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <span className="eyebrow">From the field</span>
              <h2 className="mt-2 text-3xl sm:text-4xl lg:text-[40px] leading-[1.1] font-bold">
                Burton NDT equipment in the wild.
              </h2>
              <p className="mt-4 text-[17px] text-muted-soft">
                Tank floor scanners, robotic crawlers, vacuum boxes, and gas monitors at work
                across refineries, pipelines, and process plants.
              </p>
            </div>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-[14px] font-bold text-brand hover:text-brand-dark"
            >
              See video case studies
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[
              { src: "Tank_Floor_Inspection_0-600x400.jpg", alt: "Tank floor inspection in progress" },
              { src: "IMG_0022-1-scaled-1-600x400.jpg", alt: "Field inspection equipment in use" },
              { src: "IMG_0101-scaled-1-600x400.jpg", alt: "Industrial inspection on site" },
              { src: "IMG_0309-scaled-1-600x400.jpg", alt: "Equipment deployed at job site" },
              { src: "02-600x400.jpg", alt: "Equipment in field deployment" },
              { src: "MicrosoftTeams-imag.jpeg", alt: "Crew using thermal imaging on site" },
              { src: "MicrosoftTeams-image-.jpeg", alt: "Equipment in service" },
              { src: "MicrosoftTeams-image-1.jpeg", alt: "Field inspection in progress" },
            ].map((g) => (
              <div key={g.src} className="aspect-[3/2] overflow-hidden rounded-lg ring-1 ring-line bg-canvas-deep">
                <Image
                  src={`/images/${g.src}`}
                  alt={g.alt}
                  width={600}
                  height={400}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* INDUSTRIES STRIP */}
      <section className="bg-canvas-deep py-16 text-white">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-4">
              <span className="eyebrow">Industries we serve</span>
              <h2 className="mt-2 text-3xl font-bold">Wherever inspection happens.</h2>
            </div>
            <div className="lg:col-span-8">
              <ul className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 text-[15px]">
                {INDUSTRIES.map((i) => (
                  <li key={i} className="flex items-center gap-2 text-white/85">
                    <span className="size-1.5 rounded-full bg-accent" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* LOCATIONS */}
      <section className="bg-canvas py-20 lg:py-28">
        <Container>
          <div className="text-center">
            <span className="eyebrow">3 U.S. hubs</span>
            <h2 className="mt-2 text-3xl sm:text-4xl lg:text-[44px] leading-[1.1] font-bold">
              Within a day&apos;s ship of every refinery on the Gulf and Southeast.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-soft">
              Three operating hubs put us inside next-day ground for Texas, Louisiana, Mississippi,
              Alabama, Georgia, the Carolinas, Florida, and Tennessee.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {LOCATIONS.map((loc) => (
              <div
                key={loc.city}
                className="rounded-2xl border border-line bg-canvas-tint p-7"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
                    {loc.region}
                  </p>
                  {loc.isHq && (
                    <span className="rounded bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-brand">
                      HQ
                    </span>
                  )}
                </div>
                <h3 className="mt-2 text-2xl font-bold text-ink">{loc.cityState}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">
                  {loc.street}<br />
                  {loc.cityState} {loc.zip}
                </p>
                <a
                  href={`tel:${loc.phoneTel}`}
                  className="mt-4 inline-flex items-center gap-2 text-[16px] font-bold text-brand hover:text-brand-dark"
                >
                  {loc.phone}
                </a>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a285f] via-[#0f3a8a] to-[#1d4ed8] py-20 text-white">
        <Container className="relative">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-8">
              <span className="eyebrow text-[var(--color-accent)]">Need it tomorrow?</span>
              <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold">
                We probably have it on the shelf — calibrated and ready to ship.
              </h2>
              <p className="mt-4 max-w-xl text-lg text-white/80">
                Call the warehouse directly or send a quote request and we&apos;ll come back with
                pricing and ship dates same-day.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-3 lg:items-end">
              <Link
                href="/quote"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-7 py-4 text-base font-bold text-white hover:bg-[var(--color-accent-dark)]"
              >
                Request a Quote
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
              <a
                href={`tel:${SITE.primaryPhoneTel}`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-7 py-4 text-base font-semibold text-white hover:bg-white/15 backdrop-blur"
              >
                Call {SITE.primaryPhone}
              </a>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
