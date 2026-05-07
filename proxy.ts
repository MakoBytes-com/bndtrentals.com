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
    // Turnstile loads its API script from challenges.cloudflare.com. With
    // 'strict-dynamic', a script vouched for by a nonced script can fetch
    // additional scripts, but the initial loader URL still needs to be
    // listed explicitly when next/script doesn't get to nonce it.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ""}`,
    // 'unsafe-inline' is ignored by browsers when a nonce is present (CSP3) —
    // we keep it ONLY in dev because Next dev injects unhashed inline styles
    // for HMR. Production gets nonce-only.
    `style-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-inline'" : ""}`,
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "media-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
    // Turnstile's challenge UI renders inside an iframe to
    // challenges.cloudflare.com.
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.google.com https://challenges.cloudflare.com",
    // Vercel Analytics + Speed Insights post to /_vercel/insights/* (same
    // origin, allowed by 'self'). Sentry posts to its own ingest endpoint
    // only when SENTRY_DSN is set; allowing it here means flipping the env
    // var requires no further code change. Turnstile siteverify happens
    // server-side, not from the browser.
    "connect-src 'self' https://*.ingest.sentry.io https://*.sentry.io https://challenges.cloudflare.com",
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
