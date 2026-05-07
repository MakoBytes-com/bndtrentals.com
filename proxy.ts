import { NextRequest, NextResponse } from "next/server";

// Per Next.js 16 docs (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md):
// proxy.ts replaces middleware.ts in Next 16. We emit a strict CSP with a per-request
// nonce so we can keep inline JSON-LD without 'unsafe-inline'.
//
// Trade-off: nonces force dynamic rendering of all matched pages. For a low-traffic
// B2B catalog this is acceptable; the security guarantee is worth the per-render cost.

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // 'unsafe-inline' is ignored by browsers when a nonce is present (CSP3) —
    // we keep it ONLY in dev because Next dev injects unhashed inline styles
    // for HMR. Production gets nonce-only.
    `style-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-inline'" : ""}`,
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "media-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.google.com",
    "connect-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: [
    {
      // Run on every page request, but skip static assets, image optimizer,
      // and route prefetches (which don't render HTML).
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|images/|pdfs/|robots.txt|sitemap.xml|llms.txt).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
