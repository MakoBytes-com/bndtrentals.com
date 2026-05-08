import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { CtaBanner } from "@/components/CtaBanner";
import { SITE, LOCATIONS } from "@/lib/site";
import { getCategories } from "@/lib/catalog";
import { LOCATION_CONTENT, locationContentBySlug } from "@/lib/location-content";
import { pageMetadata } from "@/lib/page-metadata";

export function generateStaticParams() {
  return Object.keys(LOCATION_CONTENT).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const content = locationContentBySlug(slug);
  if (!content) {
    return pageMetadata({
      title: "Location",
      description: "Burton NDT Rentals service hub.",
      path: `/locations/${slug}`,
    });
  }
  const loc = LOCATIONS.find((l) => l.city === content.cityKey);
  if (!loc) {
    return pageMetadata({
      title: content.cityKey,
      description: content.intro,
      path: `/locations/${slug}`,
    });
  }
  return pageMetadata({
    title: `${loc.cityState} Service Hub`,
    description: `${SITE.shortName} ${loc.cityState} — ${content.industries.join(", ")}. ${loc.street}, ${loc.cityState} ${loc.zip}. Call ${loc.phone}.`,
    path: `/locations/${slug}`,
  });
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = locationContentBySlug(slug);
  if (!content) notFound();
  const loc = LOCATIONS.find((l) => l.city === content.cityKey);
  if (!loc) notFound();
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  // Equipment categories that actually fit this hub's industries
  const allCategories = await getCategories();
  const featured = allCategories.filter((c) =>
    content.applicationsHighlight.includes(c.shortLabel),
  );

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE.url}/locations/${slug}#localbusiness`,
    name: `${SITE.shortName} — ${loc.region}`,
    parentOrganization: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
    },
    url: `${SITE.url}/locations/${slug}`,
    telephone: loc.phone,
    email: SITE.email,
    description: content.intro,
    address: {
      "@type": "PostalAddress",
      streetAddress: loc.street,
      addressLocality: loc.city,
      addressRegion: loc.state,
      postalCode: loc.zip,
      addressCountry: "US",
    },
    areaServed: content.serviceArea.map((a) => ({
      "@type": "Place",
      name: a,
    })),
    openingHours: content.hours,
  };

  return (
    <>
      <PageHero
        eyebrow={loc.region}
        title={`${loc.cityState} Service Hub`}
        description={content.intro}
      />

      {/* Address + hours card */}
      <section className="bg-canvas border-b border-line py-10 lg:py-12">
        <Container>
          <div className="grid gap-6 rounded-2xl border border-line bg-canvas-tint p-7 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-widest text-accent">Address</p>
              <p className="mt-2 text-[15px] font-semibold text-ink leading-snug">
                {loc.street}<br />
                {loc.cityState} {loc.zip}
              </p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(loc.mapsQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:text-brand-dark"
              >
                Open in Google Maps
                <span className="sr-only"> (opens in new tab)</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17L17 7"/><polyline points="7 7 17 7 17 17"/></svg>
              </a>
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-widest text-accent">Phone</p>
              <a
                href={`tel:${loc.phoneTel}`}
                className="mt-2 block text-[18px] font-bold text-brand hover:text-brand-dark"
              >
                {loc.phone}
              </a>
              <p className="mt-1 text-[13px] text-muted">Tap to call this hub directly.</p>
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-widest text-accent">Email</p>
              <a
                href={`mailto:${SITE.email}`}
                className="mt-2 block text-[15px] font-semibold text-brand hover:text-brand-dark break-all"
              >
                {SITE.email}
              </a>
              <p className="mt-1 text-[13px] text-muted">Quote requests reach all hubs.</p>
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-widest text-accent">Hours</p>
              <p className="mt-2 text-[15px] font-semibold text-ink leading-snug">
                {content.hours}
              </p>
              <p className="mt-1 text-[13px] text-muted">Same-day pickup most days.</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Why this hub */}
      <section className="bg-canvas-tint py-16 lg:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="eyebrow">Why {loc.city}</p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold leading-[1.1]">
                What we cover from this hub.
              </h2>
              <p className="mt-5 text-[16.5px] text-ink-soft leading-relaxed">
                {content.whyHere}
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-white p-5">
                <p className="text-[12px] font-bold uppercase tracking-widest text-accent">Industries served</p>
                <ul className="mt-3 space-y-2 text-[14.5px] text-ink-soft">
                  {content.industries.map((i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-line bg-white p-5">
                <p className="text-[12px] font-bold uppercase tracking-widest text-accent">Service area</p>
                <ul className="mt-3 space-y-1.5 text-[14.5px] text-ink-soft">
                  {content.serviceArea.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Featured equipment categories for this hub */}
      <section className="bg-canvas py-16 lg:py-20">
        <Container>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Stock for {loc.city}</p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold leading-[1.1]">
                What we stock here.
              </h2>
            </div>
            <Link
              href="/equipment"
              className="text-[14px] font-bold text-brand hover:text-brand-dark"
            >
              Full catalog →
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((c) => (
              <Link
                key={c.slug}
                href={`/equipment/${c.slug}`}
                className="group rounded-xl border border-line bg-white p-5 transition-all hover:border-brand hover:shadow-md"
              >
                <p className="text-[12px] font-bold uppercase tracking-widest text-accent">{c.shortLabel}</p>
                <p className="mt-2 text-[16px] font-semibold text-ink leading-snug">{c.name}</p>
                <p className="mt-2 text-[13.5px] text-muted leading-relaxed">{c.tagline}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <CtaBanner
        eyebrow={`${loc.cityState} customers`}
        title={`Need gear from our ${loc.region} hub?`}
        body={`Build your quote with the items you need; ${loc.cityState} stock ships same business day on most categories.`}
      />

      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
    </>
  );
}
