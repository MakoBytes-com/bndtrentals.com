import Link from "next/link";
import { Container } from "@/components/Container";

export default function NotFound() {
  return (
    <section className="bg-canvas py-24 lg:py-32">
      <Container size="narrow" className="text-center">
        <p className="font-display text-7xl font-bold text-brand/15">404</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold">We couldn&apos;t find that page.</h1>
        <p className="mt-4 text-[17px] text-muted-soft">
          The page you&apos;re looking for moved or doesn&apos;t exist anymore. Try one of these
          instead:
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-[14px] font-bold text-white hover:bg-brand-dark"
          >
            Home
          </Link>
          <Link
            href="/equipment"
            className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-[14px] font-semibold text-ink hover:bg-canvas-tint"
          >
            Equipment catalog
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-[14px] font-semibold text-ink hover:bg-canvas-tint"
          >
            Contact us
          </Link>
        </div>
      </Container>
    </section>
  );
}
