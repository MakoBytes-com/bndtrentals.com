import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { headers } from "next/headers";
import { SITE, LOCATIONS } from "@/lib/site";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { QuoteCartProvider } from "@/components/QuoteCart";
import { CartDrawer } from "@/components/CartDrawer";
import { BackToTop } from "@/components/BackToTop";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    "NDT equipment rental",
    "non-destructive testing",
    "ultrasonic testing",
    "RVI rental",
    "PMI analyzer rental",
    "X-Ray inspection",
    "industrial inspection equipment",
    "calibration services",
    "Texas NDT",
    "Olympus Eddyfi Niton rental",
  ],
  authors: [{ name: SITE.name }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

const hq = LOCATIONS.find((l) => l.isHq) ?? LOCATIONS[0];

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE.url}#organization`,
  name: SITE.name,
  url: SITE.url,
  telephone: SITE.primaryPhone,
  email: SITE.email,
  description: SITE.description,
  foundingDate: `${SITE.llcFounded}`,
  areaServed: "United States",
  address: {
    "@type": "PostalAddress",
    streetAddress: hq.street,
    addressLocality: hq.city,
    addressRegion: hq.state,
    postalCode: hq.zip,
    addressCountry: "US",
  },
  // All 3 service locations as additional `location` entries so multi-location
  // queries surface every hub.
  location: LOCATIONS.map((l) => ({
    "@type": "Place",
    name: `${SITE.shortName} — ${l.region}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: l.street,
      addressLocality: l.city,
      addressRegion: l.state,
      postalCode: l.zip,
      addressCountry: "US",
    },
    telephone: l.phone,
  })),
  sameAs: ["https://www.linkedin.com/company/burton-ndt-rentals/"],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <QuoteCartProvider>
          <a href="#main" className="skip-link">Skip to content</a>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <CartDrawer />
          <BackToTop />
        </QuoteCartProvider>
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </body>
    </html>
  );
}
