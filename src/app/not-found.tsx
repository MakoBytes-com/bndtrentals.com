import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { SITE, NAV_EQUIPMENT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Page not found",
  description:
    "The page you're looking for moved or doesn't exist. Browse our equipment catalog or call us for a quote.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <section className="bg-canvas-deep text-white">
        <Container className="py-20 lg:py-28 text-center">
          <p className="font-display text-[120px] sm:text-[160px] font-bold leading-none text-white/10">
            404
          </p>
          <p className="-mt-8 text-[12px] font-bold uppercase tracking-widest text-accent">
            Page not found
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold">
            We couldn&apos;t find that page.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[16.5px] leading-relaxed text-white/75">
            The page moved or never existed. Most visitors land here while
            searching for a specific instrument — try the catalog below, or
            call us at{" "}
            <a
              href={`tel:${SITE.primaryPhoneTel}`}
              className="font-semibold text-white underline-offset-4 hover:underline"
            >
              {SITE.primaryPhone}
            </a>{" "}
            and we&apos;ll point you the right way.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/equipment"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-[14px] font-bold text-white hover:bg-accent-dark"
            >
              Browse the catalog
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <Link
              href="/quote"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-5 py-3 text-[14px] font-semibold text-white hover:bg-white/10"
            >
              Request a quote
            </Link>
            <a
              href={`tel:${SITE.primaryPhoneTel}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-5 py-3 text-[14px] font-semibold text-white hover:bg-white/10"
            >
              Call {SITE.primaryPhone}
            </a>
          </div>
        </Container>
      </section>

      <section className="bg-canvas py-16 lg:py-20">
        <Container size="narrow">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-accent">
            Popular categories
          </h2>
          <p className="mt-2 text-[15px] text-muted">
            Most searches end up in one of these.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {NAV_EQUIPMENT.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between rounded-xl border border-line bg-white px-5 py-4 text-[14.5px] font-semibold text-ink hover:border-brand hover:text-brand"
                >
                  <span>{item.label}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-soft" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-12 rounded-2xl border border-line bg-canvas-tint p-6 text-center">
            <p className="text-[14.5px] text-ink-soft">
              Still can&apos;t find it? Email{" "}
              <a
                href={`mailto:${SITE.email}`}
                className="font-semibold text-brand hover:text-brand-dark"
              >
                {SITE.email}
              </a>{" "}
              with the equipment name or part number — we&apos;ll send a quote
              the same business day.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
