import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { SITE } from "@/lib/site";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How Burton NDT Rentals handles your contact information, quote-form submissions, analytics, and error tracking.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Policy" description="What we collect, how we use it, and what we don't do with it." />
      <section className="bg-canvas py-16 lg:py-20">
        <Container size="narrow">
          <div className="prose-styles space-y-8 text-[16px] leading-relaxed text-ink-soft">
            <article>
              <h2 className="text-xl font-bold text-ink">What we collect</h2>
              <p className="mt-2">
                We collect the information you give us through our quote/reservation form
                (name, company, contact information, item description, dates, and shipping
                details) and through direct email or phone correspondence. We don&apos;t use
                tracking cookies, behavioral advertising, or third-party analytics that build a
                profile on you.
              </p>
            </article>
            <article>
              <h2 className="text-xl font-bold text-ink">How we use it</h2>
              <p className="mt-2">
                Form and email submissions are used solely to respond to your request — sending a
                quote, scheduling a calibration, processing a rental or sale, and following up on
                the engagement. We do not sell or share your information with third parties for
                marketing purposes.
              </p>
            </article>
            <article>
              <h2 className="text-xl font-bold text-ink">How long we keep it</h2>
              <p className="mt-2">
                Active customer records are retained for the duration of the business relationship
                plus seven years for tax and accounting purposes. Quote requests that don&apos;t
                convert are retained for 24 months and then deleted.
              </p>
            </article>
            <article>
              <h2 className="text-xl font-bold text-ink">Embedded content</h2>
              <p className="mt-2">
                Pages on this site may embed Google Maps for location previews and YouTube videos
                for equipment demonstrations. Both services may set their own cookies and collect
                their own usage data when you interact with the embed. We use the privacy-enhanced
                YouTube embed mode to minimize tracking before playback.
              </p>
            </article>
            <article>
              <h2 className="text-xl font-bold text-ink">Contact</h2>
              <p className="mt-2">
                Questions about your data?{" "}
                <Link
                  href={`mailto:${SITE.email}`}
                  className="font-semibold text-brand hover:text-brand-dark"
                >
                  {SITE.email}
                </Link>{" "}
                or call {SITE.primaryPhone}.
              </p>
            </article>
          </div>
        </Container>
      </section>
    </>
  );
}
