import Link from "next/link";
import Image from "next/image";
import { Container } from "./Container";
import { LOCATIONS, NAV_EQUIPMENT, NAV_PRIMARY, SITE } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-canvas-deep text-white/80">
      <Container className="py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block" aria-label={`${SITE.name} home`}>
              <Image
                src="/images/logo-2.png"
                alt={SITE.name}
                width={200}
                height={56}
                className="h-12 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/65">
              {SITE.yearsInBusiness}+ years renting, selling, calibrating, and repairing
              industrial inspection equipment for NDT, RVI, PMI, X-Ray, and environmental
              monitoring across the U.S.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/quote"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[13px] font-bold text-white hover:bg-accent-dark"
              >
                Request a Quote
              </Link>
              <a
                href={`tel:${SITE.primaryPhoneTel}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-[13px] font-semibold text-white hover:bg-white/5"
              >
                {SITE.primaryPhone}
              </a>
              <a
                href="https://www.linkedin.com/company/burton-ndt-rentals/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Burton NDT Rentals on LinkedIn"
                className="inline-flex size-10 items-center justify-center rounded-full border border-white/20 text-white hover:bg-white/5"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-[12px] font-bold uppercase tracking-widest text-accent">Equipment</h4>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              {NAV_EQUIPMENT.map((it) => (
                <li key={it.href}>
                  <Link href={it.href} className="text-white/70 hover:text-white">{it.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-[12px] font-bold uppercase tracking-widest text-accent">Company</h4>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              {NAV_PRIMARY.filter((n) => n.href !== "/equipment").map((it) => (
                <li key={it.href}>
                  <Link href={it.href} className="text-white/70 hover:text-white">{it.label}</Link>
                </li>
              ))}
              <li><Link href="/quote" className="text-white/70 hover:text-white">Quote Request</Link></li>
              <li><Link href="/projects" className="text-white/70 hover:text-white">Projects</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h4 className="text-[12px] font-bold uppercase tracking-widest text-accent">Locations</h4>
            <ul className="mt-4 grid gap-4 text-[13.5px] leading-relaxed">
              {LOCATIONS.map((loc) => (
                <li key={loc.city} className="">
                  <p className="text-white font-semibold">
                    {loc.cityState}
                    {loc.isHq && <span className="ml-2 rounded bg-accent/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-accent">HQ</span>}
                  </p>
                  <p className="text-white/65">{loc.street}</p>
                  <p className="text-white/65">{loc.cityState} {loc.zip}</p>
                  <a href={`tel:${loc.phoneTel}`} className="mt-1 inline-block text-white/85 hover:text-white font-medium">
                    {loc.phone}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="hairline mt-12" />

        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between text-[13px] text-white/55">
          <p>© {year} {SITE.name}. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/terms" className="hover:text-white">Terms & Conditions</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <a
              href="https://makoai.studio"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              Built &amp; maintained by Makologics
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
