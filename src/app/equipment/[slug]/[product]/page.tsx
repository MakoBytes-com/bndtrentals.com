import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Container } from "@/components/Container";
import { CtaBanner } from "@/components/CtaBanner";
import { AddToQuoteButton } from "@/components/AddToQuoteButton";
import { CATEGORIES, findProduct } from "@/lib/equipment";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  const params: Array<{ slug: string; product: string }> = [];
  for (const cat of CATEGORIES) {
    for (const sub of cat.subcategories) {
      for (const p of sub.products) {
        params.push({ slug: cat.slug, product: p.slug });
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; product: string }>;
}): Promise<Metadata> {
  const { slug, product } = await params;
  const found = findProduct(slug, product);
  if (!found) return { title: "Equipment" };
  const { product: p, category } = found;
  const title = p.manufacturer ? `${p.manufacturer} ${p.name}` : p.name;
  return {
    title,
    description: p.description ?? `${p.name} — rental, sale, calibration, and repair from ${SITE.name}.`,
    openGraph: {
      title,
      description: p.description ?? `${p.name} — available for rent in the ${category.name} category.`,
      images: [`/images/${p.image}`],
    },
  };
}

export default async function ProductDetail({
  params,
}: {
  params: Promise<{ slug: string; product: string }>;
}) {
  const { slug, product } = await params;
  const found = findProduct(slug, product);
  if (!found) notFound();
  const { product: p, subcategory, category } = found;
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  // Related products from same subcategory
  const related = subcategory.products.filter((x) => x.slug !== p.slug).slice(0, 4);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.manufacturer ? `${p.manufacturer} ${p.name}` : p.name,
    image: `${SITE.url}/images/${p.image}`,
    description: p.description,
    brand: p.manufacturer
      ? { "@type": "Brand", name: p.manufacturer }
      : undefined,
    category: `${category.name} / ${subcategory.name}`,
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: SITE.name },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "Equipment", item: `${SITE.url}/equipment` },
      {
        "@type": "ListItem",
        position: 3,
        name: category.short,
        item: `${SITE.url}/equipment/${category.slug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: p.name,
        item: `${SITE.url}/equipment/${category.slug}/${p.slug}`,
      },
    ],
  };

  return (
    <>
      {/* Breadcrumb + hero */}
      <section className="bg-canvas-tint border-b border-line">
        <Container className="py-6">
          <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li><Link href="/" className="hover:text-brand">Home</Link></li>
              <li aria-hidden>/</li>
              <li><Link href="/equipment" className="hover:text-brand">Equipment</Link></li>
              <li aria-hidden>/</li>
              <li><Link href={`/equipment/${category.slug}`} className="hover:text-brand">{category.short}</Link></li>
              <li aria-hidden>/</li>
              <li className="text-ink font-medium">{p.name}</li>
            </ol>
          </nav>
        </Container>
      </section>

      <section className="bg-canvas py-10 lg:py-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            {/* Image */}
            <div className="lg:col-span-6">
              <div className="overflow-hidden rounded-2xl border border-line bg-canvas-tint">
                <div className="aspect-[4/3] flex items-center justify-center p-10">
                  <Image
                    src={`/images/${p.image}`}
                    alt={p.name}
                    width={900}
                    height={700}
                    priority
                    className="max-h-full w-auto object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Header / actions */}
            <div className="lg:col-span-6">
              <p className="text-[13px] font-bold uppercase tracking-widest text-accent">
                {subcategory.name}
              </p>
              {p.manufacturer && (
                <p className="mt-3 text-[15px] font-semibold text-muted">{p.manufacturer}</p>
              )}
              <h1 className="mt-1 text-3xl sm:text-4xl lg:text-[44px] leading-[1.1] font-bold">
                {p.name}
              </h1>
              {p.description && (
                <p className="mt-5 text-lg leading-relaxed text-ink-soft">{p.description}</p>
              )}

              {p.applications && p.applications.length > 0 && (
                <div className="mt-7">
                  <p className="text-[12px] font-bold uppercase tracking-widest text-muted">
                    Common applications
                  </p>
                  <ul className="mt-3 space-y-2 text-[15px] text-ink-soft">
                    {p.applications.map((a) => (
                      <li key={a} className="flex items-start gap-3">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <AddToQuoteButton
                  productSlug={p.slug}
                  categorySlug={category.slug}
                  productName={p.manufacturer ? `${p.manufacturer} ${p.name}` : p.name}
                  productImage={p.image}
                  size="lg"
                />
                {p.pdf && (
                  <a
                    href={`/pdfs/${p.pdf}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-6 py-4 text-[15px] font-bold text-ink hover:bg-canvas-tint"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="12" y1="18" x2="12" y2="12"/>
                      <polyline points="9 15 12 18 15 15"/>
                    </svg>
                    Download Spec Sheet (PDF)
                  </a>
                )}
                <a
                  href={`tel:${SITE.primaryPhoneTel}`}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-4 text-[15px] font-semibold text-muted hover:text-brand"
                >
                  Or call {SITE.primaryPhone}
                </a>
              </div>

              <div className="mt-8 rounded-xl border border-line bg-canvas-tint p-5 text-[14px] text-muted">
                <p>
                  <strong className="text-ink">Calibrated, in stock, ready to ship.</strong>{" "}
                  Most rentals leave the same business day. Add this unit to your quote and
                  build out the rest of the order — or call our warehouse directly.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-line bg-canvas-tint py-16 lg:py-20">
          <Container>
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-2xl sm:text-3xl font-bold">More in {subcategory.name}</h2>
              <Link
                href={`/equipment/${category.slug}`}
                className="inline-flex items-center gap-1.5 text-[14px] font-bold text-brand hover:text-brand-dark"
              >
                Full {category.short} catalog
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/equipment/${category.slug}/${r.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-line transition-all hover:ring-brand"
                >
                  <div className="aspect-[4/3] flex items-center justify-center bg-canvas-tint p-5">
                    <Image
                      src={`/images/${r.image}`}
                      alt={r.name}
                      width={400}
                      height={400}
                      className="max-h-full w-auto object-contain"
                    />
                  </div>
                  <div className="border-t border-line p-4">
                    {r.manufacturer && (
                      <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
                        {r.manufacturer}
                      </p>
                    )}
                    <p className="mt-1 text-[14.5px] font-semibold text-ink leading-snug">{r.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      <CtaBanner />

      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
