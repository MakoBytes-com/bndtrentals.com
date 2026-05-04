import Link from "next/link";
import { Container } from "./Container";
import { SITE } from "@/lib/site";

export function CtaBanner({
  eyebrow = "Need it tomorrow?",
  title = "We probably have it on the shelf — calibrated and ready to ship.",
  body = "Call the warehouse directly or send us a quote request and we'll come back same-day with pricing and ship dates.",
}: {
  eyebrow?: string;
  title?: string;
  body?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0a285f] via-[#0f3a8a] to-[#1d4ed8] py-16 text-white">
      <Container className="relative">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8">
            <span className="eyebrow text-[var(--color-accent)]">{eyebrow}</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold">{title}</h2>
            <p className="mt-3 max-w-xl text-[17px] text-white/80">{body}</p>
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
  );
}
