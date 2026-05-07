import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { CtaBanner } from "@/components/CtaBanner";
import { SITE, LOCATIONS } from "@/lib/site";
import { LOCATION_CONTENT, locationContentBySlug } from "@/lib/location-content";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Service Hubs",
  description: `${SITE.name} operates ${LOCATIONS.length} U.S. service hubs — La Porte TX (HQ, Gulf Coast), Groves TX (East Texas), and Marietta GA (Southeast). Find the closest hub to your project.`,
  path: "/locations",
});

export default function LocationsHubPage() {
  return (
    <>
      <PageHero
        eyebrow="Service hubs"
        title="Three hubs. One fleet."
        description={`We run ${LOCATIONS.length} regional warehouses so the gear you need is closer than a Houston-only operation could keep it. Pick the hub closest to your project.`}
      />

      <section className="bg-canvas py-16 lg:py-20">
        <Container>
          <div className="grid gap-6 lg:grid-cols-3">
            {LOCATIONS.map((loc) => {
              const slug = Object.values(LOCATION_CONTENT).find(
                (c) => c.cityKey === loc.city,
              )?.slug;
              const content = slug ? locationContentBySlug(slug) : undefined;
              return (
                <article
                  key={loc.city}
                  className="flex flex-col rounded-2xl border border-line bg-canvas-tint p-7"
                >
                  <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
                    {loc.region}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">{loc.cityState}</h2>
                  {loc.isHq && (
                    <p className="mt-1 text-[12.5px] font-bold uppercase tracking-widest text-brand">
                      Headquarters
                    </p>
                  )}
                  <p className="mt-3 text-[14.5px] text-muted leading-relaxed">
                    {content?.intro ?? ""}
                  </p>
                  <div className="mt-5 space-y-1 text-[14px] text-ink-soft">
                    <p>
                      <span className="text-muted">Address: </span>
                      {loc.street}, {loc.cityState} {loc.zip}
                    </p>
                    <p>
                      <span className="text-muted">Phone: </span>
                      <a href={`tel:${loc.phoneTel}`} className="font-semibold text-brand hover:text-brand-dark">
                        {loc.phone}
                      </a>
                    </p>
                    {content?.hours && (
                      <p>
                        <span className="text-muted">Hours: </span>
                        {content.hours}
                      </p>
                    )}
                  </div>
                  {slug && (
                    <Link
                      href={`/locations/${slug}`}
                      className="mt-6 inline-flex items-center gap-2 self-start rounded-full bg-brand px-5 py-2.5 text-[13.5px] font-bold text-white hover:bg-brand-dark"
                    >
                      About this hub
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}
