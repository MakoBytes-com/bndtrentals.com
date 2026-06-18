import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  },
  // CSP intentionally omitted here — emitted dynamically per-request via middleware.ts
  // so we can include a per-request nonce for inline JSON-LD without using 'unsafe-inline'.
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  turbopack: { root: __dirname },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async rewrites() {
    // Admin-uploaded product images live in the Supabase Storage bucket
    // "catalog-images". Serving them under the existing /images/ path (via this
    // rewrite) means every existing `/images/${product.image}` render — public
    // pages, cart, OG tags, JSON-LD — keeps working unchanged; the stored value
    // is just `uploads/<productId>/<file>`. Legacy bundled images in
    // /public/images/ still win for any non-uploads/* path.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return [];
    return [
      {
        source: "/images/uploads/:path*",
        destination: `${supabaseUrl}/storage/v1/object/public/catalog-images/:path*`,
      },
      {
        // Admin-uploaded spec-sheet PDFs live in the catalog-pdfs bucket and are
        // stored as "uploads/<productId>/<file>.pdf", so /pdfs/uploads/* resolves
        // to the bucket while legacy flat /public/pdfs/<file>.pdf still serve.
        source: "/pdfs/uploads/:path*",
        destination: `${supabaseUrl}/storage/v1/object/public/catalog-pdfs/:path*`,
      },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/pdfs/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Page routes — nonces force per-request rendering, but the response
        // body is identical across users while a cache entry is hot. We let
        // the CDN keep responses for an hour with a 1-day stale-while-revalidate
        // window. Static immutable assets (/_next/static) are handled by Next
        // itself with `immutable` semantics — don't override them.
        source: "/((?!api|_next|images|pdfs).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
