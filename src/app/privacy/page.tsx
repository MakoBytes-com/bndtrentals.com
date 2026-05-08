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

const LAST_UPDATED = "May 8, 2026";

const PROCESSORS: { name: string; purpose: string; data: string; link?: string }[] = [
  {
    name: "Vercel (hosting & CDN)",
    purpose:
      "Hosts the website infrastructure and serves pages from edge locations.",
    data: "Standard request logs (IP, user-agent, requested URL, timestamp, response status). Retained for limited periods per Vercel's terms.",
    link: "https://vercel.com/legal/privacy-policy",
  },
  {
    name: "Vercel Analytics & Speed Insights",
    purpose:
      "Aggregate page views and Core Web Vitals (LCP, INP, CLS) to monitor site performance.",
    data: "Hashed visitor identifiers, page paths, referrer, country-level location, device type. No personally-identifying data, no behavioral profile, no cross-site tracking.",
    link: "https://vercel.com/legal/privacy-policy",
  },
  {
    name: "Sentry (error tracking)",
    purpose:
      "Captures unhandled JavaScript and server-side errors so we can fix bugs.",
    data: "Stack trace, page URL, browser, anonymized session context. Email addresses, phone numbers, and free-text form fields are scrubbed before transmission.",
    link: "https://sentry.io/privacy/",
  },
  {
    name: "Burton NDT first-party analytics",
    purpose:
      "Page-view counts, top pages, top referrers, top countries, and Core Web Vitals stored in our own database (not a third-party analytics SaaS) to understand how visitors find and use the site.",
    data: "Path, referrer (when sent by your browser), a per-tab anonymous session id (sessionStorage UUID, expires when the tab closes), country code (from edge headers), browser user-agent, and IP. Performance metrics (LCP, INP, CLS, FCP, TTFB) when your browser supports them. We never write these rows for known bots; admin browsers self-exclude via a `mako_no_track` localStorage flag.",
  },
  {
    name: "Burton NDT first-party error log",
    purpose:
      "An in-house duplicate of Sentry's data, stored in our own database so the admin team can triage errors directly from the panel.",
    data: "Same fields as Sentry — message, module, stack, route, user-agent, sanitized context. Resolved errors are auto-deleted after 90 days; raw page-view and event rows are auto-deleted after 180 days.",
  },
  {
    name: "Resend (transactional email)",
    purpose:
      "Delivers quote-confirmation and customer-service emails on our behalf.",
    data: "Recipient email address, message body, delivery status. Used only for the email you actually send or receive.",
    link: "https://resend.com/legal/privacy-policy",
  },
  {
    name: "Cloudflare Turnstile (bot protection)",
    purpose:
      "Confirms you are a human before accepting form submissions, without using CAPTCHA puzzles or third-party tracking cookies.",
    data: "An anonymized challenge token. Cloudflare may inspect IP and browser characteristics during the challenge.",
    link: "https://www.cloudflare.com/privacypolicy/",
  },
  {
    name: "Google Maps (embedded location previews)",
    purpose:
      "Embeds map previews on the contact and location pages.",
    data: "Google may set its own cookies and collect interaction data once you click into the embed. We do not load the embed for you proactively.",
    link: "https://policies.google.com/privacy",
  },
  {
    name: "YouTube (embedded equipment-in-action videos)",
    purpose:
      "Embeds video demonstrations on the projects pages.",
    data: "We use the privacy-enhanced YouTube embed (youtube-nocookie.com) to minimize tracking before playback. YouTube/Google may still set cookies and collect data when you press play.",
    link: "https://policies.google.com/privacy",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        description="What we collect, how we use it, and what we don't do with it."
      />

      <section className="bg-canvas py-16 lg:py-20">
        <Container size="narrow">
          <div className="space-y-10 text-[16px] leading-relaxed text-ink-soft">
            <p className="text-[13px] text-muted-soft">
              Last updated: {LAST_UPDATED}.
            </p>

            <article>
              <h2 className="text-xl font-bold text-ink">Who we are</h2>
              <p className="mt-3">
                {SITE.name} (operating entity: Burton NDT LLC) is the data
                controller for this site. Our headquarters is at 832 S.
                Broadway St., La Porte, TX 77571. Contact us at{" "}
                <Link
                  href={`mailto:${SITE.email}`}
                  className="font-semibold text-brand hover:text-brand-dark"
                >
                  {SITE.email}
                </Link>{" "}
                or {SITE.primaryPhone} with any privacy question.
              </p>
            </article>

            <article>
              <h2 className="text-xl font-bold text-ink">What we collect</h2>
              <p className="mt-3">
                <strong className="text-ink">Information you give us directly</strong>
                {" "}— name, company, email, phone, shipping details, dates, and any
                free-text instructions you submit through our quote/reservation
                form, contact form, or direct email/phone correspondence. The
                quote builder also stores the items you add to your cart in your
                browser&apos;s localStorage (under <code className="font-mono">bndt-quote-cart-v1</code>) so
                your cart survives page navigation. That data stays on your
                device until you submit the form or clear it.
              </p>
              <p className="mt-3">
                <strong className="text-ink">Technical information we collect automatically</strong>
                {" "}— IP address, browser user-agent, referring page, requested
                URL, country code (derived from your IP at the network edge),
                and timestamps. We use this for security (rate-limiting form
                submissions and blocking abuse), performance monitoring (page-
                load times, Core Web Vitals like LCP / INP / CLS), and error
                diagnostics (capturing JavaScript exceptions to fix bugs).
                Most of these signals are stored in our own database (the
                &ldquo;Burton NDT first-party analytics&rdquo; processor below)
                rather than handed to a third-party analytics SaaS.
              </p>
              <p className="mt-3">
                <strong className="text-ink">Per-tab session id</strong>
                {" "}— when you load a page, our analytics tracker writes a
                random UUID to your browser&apos;s <code className="font-mono">sessionStorage</code>{" "}
                (key <code className="font-mono">bndt_pv_session</code>). This
                lets us count distinct sessions and measure how long visitors
                spend on each page. The id is wiped automatically when you
                close the tab — it is not a persistent fingerprint.
              </p>
              <p className="mt-3">
                <strong className="text-ink">How long we keep it</strong>
                {" "}— page-view and event rows are auto-deleted after 180 days.
                Resolved errors are auto-deleted after 90 days. Quote-form
                submissions and customer profiles stay until you ask us to
                delete them.
              </p>
              <p className="mt-3">
                <strong className="text-ink">What we do NOT collect</strong>
                {" "}— we do not run third-party advertising trackers, build
                behavioral profiles across other websites, sell data to data
                brokers, or share form submissions with marketing partners.
                We do not use cookies for tracking — only standard session
                cookies for the admin login.
              </p>
            </article>

            <article>
              <h2 className="text-xl font-bold text-ink">How we use it</h2>
              <p className="mt-3">
                Form and email submissions are used solely to respond to your
                request — sending a quote, scheduling a calibration, processing
                a rental or sale, and following up on the engagement. Technical
                logs are used to keep the site running and secure. We do not
                sell or share your information with third parties for marketing
                purposes.
              </p>
            </article>

            <article>
              <h2 className="text-xl font-bold text-ink">
                Service providers we share data with
              </h2>
              <p className="mt-3">
                We use the following processors to run the site and our
                business. Each is bound by its own privacy commitments and
                processes data only on our instructions for the purposes below.
              </p>
              <div className="mt-5 space-y-4">
                {PROCESSORS.map((p) => (
                  <div
                    key={p.name}
                    className="rounded-xl border border-line bg-canvas-tint p-5"
                  >
                    <p className="text-[15px] font-bold text-ink">{p.name}</p>
                    <p className="mt-1.5 text-[14.5px] text-ink-soft">
                      <span className="text-muted">Purpose: </span>
                      {p.purpose}
                    </p>
                    <p className="mt-1.5 text-[14.5px] text-ink-soft">
                      <span className="text-muted">Data: </span>
                      {p.data}
                    </p>
                    {p.link && (
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:text-brand-dark"
                      >
                        Their privacy policy
                        <span className="sr-only"> (opens in new tab)</span>
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M7 17L17 7" />
                          <polyline points="7 7 17 7 17 17" />
                        </svg>
                      </a>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-4">
                We also share data when required by law (court order, subpoena)
                or to protect our legal rights and the safety of our team and
                customers.
              </p>
            </article>

            <article>
              <h2 className="text-xl font-bold text-ink">How long we keep it</h2>
              <p className="mt-3">
                Active customer records are retained for the duration of the
                business relationship plus seven years for tax and accounting
                purposes. Quote requests that don&apos;t convert are retained
                for 24 months and then deleted. Server access logs are typically
                retained 30–90 days. Error reports and analytics aggregates are
                retained according to each processor&apos;s default retention
                policy (Vercel, Sentry).
              </p>
            </article>

            <article>
              <h2 className="text-xl font-bold text-ink">Your rights</h2>
              <p className="mt-3">
                Wherever you live, you can email us at{" "}
                <Link
                  href={`mailto:${SITE.email}`}
                  className="font-semibold text-brand hover:text-brand-dark"
                >
                  {SITE.email}
                </Link>{" "}
                to ask what data we hold about you, correct inaccurate data, or
                request deletion. We&apos;ll respond within 30 days.
              </p>
              <p className="mt-3">
                <strong className="text-ink">If you are in the EU/UK (GDPR):</strong>
                {" "}you have the right to access, correct, delete, or port your
                data; restrict or object to certain processing; withdraw
                consent; and lodge a complaint with your data-protection
                authority. We are a U.S. business that primarily serves U.S.
                industrial customers; if you submit a request from the EU/UK,
                we honor it but the site is not specifically directed at EU/UK
                consumers.
              </p>
              <p className="mt-3">
                <strong className="text-ink">If you are a California resident (CCPA / CPRA):</strong>
                {" "}you have the right to know what personal information we
                collect, the categories of sources and recipients, and the
                business purposes for collection; the right to delete your
                personal information; the right to correct inaccurate
                information; and the right to opt out of any &quot;sale&quot; or
                &quot;sharing&quot; of personal information. We do not sell or
                share personal information for cross-context behavioral
                advertising — but you can still send us a request and we will
                confirm in writing.
              </p>
            </article>

            <article>
              <h2 className="text-xl font-bold text-ink">Children</h2>
              <p className="mt-3">
                This site is a B2B industrial-equipment service. It is not
                directed at children under 13, and we do not knowingly collect
                personal information from children. If you believe a child has
                provided us with personal information, contact us and we will
                delete it.
              </p>
            </article>

            <article>
              <h2 className="text-xl font-bold text-ink">Cookies & similar technologies</h2>
              <p className="mt-3">
                We do not set advertising cookies. The browser&apos;s
                localStorage is used by the quote-builder cart and by the error
                buffer described above; you can clear both at any time via your
                browser&apos;s site-data controls. Vercel Analytics may set a
                first-party cookie for hashed visitor identification. Embedded
                Google Maps and YouTube content may set their own cookies once
                you interact with them.
              </p>
            </article>

            <article>
              <h2 className="text-xl font-bold text-ink">Security</h2>
              <p className="mt-3">
                The site enforces HTTPS with HSTS preload, a strict
                Content-Security-Policy with per-request nonces, and modern
                security headers. Form submissions are protected by Cloudflare
                Turnstile and rate-limited at the server. We do not store
                payment-card data on our infrastructure — those flows go
                through trusted payment processors directly.
              </p>
            </article>

            <article>
              <h2 className="text-xl font-bold text-ink">Changes to this policy</h2>
              <p className="mt-3">
                We may update this policy as our processors or practices change.
                When we do, we&apos;ll bump the date at the top. Material
                changes will be highlighted in a banner on the site for at least
                30 days.
              </p>
            </article>

            <article>
              <h2 className="text-xl font-bold text-ink">Contact</h2>
              <p className="mt-3">
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
