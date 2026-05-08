import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { CtaBanner } from "@/components/CtaBanner";
import { AddToQuoteButton } from "@/components/AddToQuoteButton";
import { getCategories, getCategoryBySlug } from "@/lib/catalog";
import { pageMetadata } from "@/lib/page-metadata";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const cats = await getCategories();
  return cats.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const found = await getCategoryBySlug(slug);
  if (!found) {
    return pageMetadata({
      title: "Equipment",
      description: "Browse equipment.",
      path: "/equipment",
    });
  }
  return pageMetadata({
    title: `${found.category.name} Equipment`,
    description: found.category.description ?? found.category.tagline ?? `${found.category.name} equipment from Burton NDT.`,
    path: `/equipment/${found.category.slug}`,
  });
}

export default async function EquipmentCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = await getCategoryBySlug(slug);
  if (!found) notFound();
  const { category: cat, products, subcategories } = found;
  const productCount = products.length;

  return (
    <>
      <PageHero
        eyebrow={`${cat.shortLabel} · ${productCount} models`}
        title={cat.name}
        description={cat.description ?? cat.tagline ?? undefined}
      />

      {/* Subcategory nav (sticky on desktop) */}
      {subcategories.length > 1 && (
        <section className="sticky top-[108px] z-20 border-b border-line bg-white/95 backdrop-blur">
          <Container>
            <nav className="flex gap-x-6 gap-y-2 overflow-x-auto py-3 text-[13.5px]" aria-label="Subcategories">
              {subcategories.map((s) => (
                <a
                  key={s.name}
                  href={`#${slugify(s.name)}`}
                  className="whitespace-nowrap font-semibold text-muted hover:text-brand"
                >
                  {s.name}
                </a>
              ))}
            </nav>
          </Container>
        </section>
      )}

      {/* Subcategory product grids */}
      {subcategories.map((sub) => (
        <section
          key={sub.name}
          id={slugify(sub.name)}
          className="border-t border-line bg-canvas py-16 lg:py-20"
        >
          <Container>
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-2xl sm:text-3xl font-bold">{sub.name}</h2>
              <span className="text-[13px] uppercase tracking-widest text-muted">
                {sub.products.length} {sub.products.length === 1 ? "model" : "models"}
              </span>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sub.products.map((p) => (
                <article
                  key={p.slug}
                  className="group flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-line transition-all hover:ring-brand"
                >
                  <Link
                    href={`/equipment/${cat.slug}/${p.slug}`}
                    className="block aspect-[4/3] bg-canvas-tint p-5 flex items-center justify-center"
                  >
                    {p.image && (
                      <Image
                        src={`/images/${p.image}`}
                        alt={p.name}
                        width={400}
                        height={400}
                        className="max-h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                  </Link>
                  <div className="border-t border-line p-4 flex-1 flex flex-col">
                    {p.manufacturer && (
                      <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
                        {p.manufacturer}
                      </p>
                    )}
                    <Link
                      href={`/equipment/${cat.slug}/${p.slug}`}
                      className="mt-1 text-[15px] font-semibold text-ink leading-snug hover:text-brand"
                    >
                      {p.name}
                    </Link>
                    <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                      <AddToQuoteButton
                        productSlug={p.slug}
                        categorySlug={cat.slug}
                        productName={p.manufacturer ? `${p.manufacturer} ${p.name}` : p.name}
                        productImage={p.image ?? undefined}
                        size="sm"
                      />
                      {p.pdf && (
                        <a
                          href={`/pdfs/${p.pdf}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-semibold text-muted hover:text-brand"
                          title="Download spec sheet (PDF)"
                          aria-label={`Download ${p.name} spec sheet (PDF, opens in new tab)`}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/></svg>
                          PDF
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </Container>
        </section>
      ))}

      <CtaBanner
        eyebrow={`Renting ${cat.shortLabel}?`}
        title="Pick the model — we'll handle the rest."
        body="Same-day quote, calibrated and shipped from the closest hub. Add accessories and consumables in one order."
      />
    </>
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
