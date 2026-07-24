import { NextRequest, NextResponse } from "next/server";

// Per Next.js 16 docs (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md):
// proxy.ts replaces middleware.ts in Next 16.
//
// Two CSP variants, chosen per request:
//
// - Admin pages and draft-mode (visual editor) renders are always dynamic, so
//   they keep the strongest policy: per-request nonce + 'strict-dynamic'.
// - Public pages are statically cached (ISR). A per-request nonce can never
//   work there: middleware runs on cache hits too, so a fresh nonce header
//   would face cached HTML carrying the old nonce and every script would be
//   blocked. Those pages get a host-allowlist policy with 'unsafe-inline'
//   instead — the standard trade-off for CDN-cached HTML. Everything else
//   (frame-ancestors, object-src, base-uri, form-action…) stays identical.

const SCRIPT_HOSTS = "https://challenges.cloudflare.com https://makochat.app";

function buildCsp(scriptSrc: string): string {
  return [
    "default-src 'self'",
    scriptSrc,
    // Inline style ATTRIBUTES (style={{...}}) cannot carry a nonce, and a nonce
    // in style-src makes CSP3 browsers ignore 'unsafe-inline'. React and Recharts
    // (admin analytics) emit inline styles, so style-src uses 'unsafe-inline'.
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "media-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
    // Turnstile's challenge UI renders inside an iframe to
    // challenges.cloudflare.com; MakoChat's widget iframe comes from makochat.app.
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.google.com https://challenges.cloudflare.com https://makochat.app",
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
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isDev = process.env.NODE_ENV === "development";
  const dev = isDev ? " 'unsafe-eval'" : "";

  const requestHeaders = new Headers(request.headers);
  // Expose the path so server layouts can gate by route (e.g. the admin auth
  // gate must allow the TOTP-setup page through while forcing enrollment).
  requestHeaders.set("x-pathname", pathname);

  // __prerender_bypass is Next's draft-mode cookie — set by /api/cms/edit for
  // the visual editor, which renders per-request like the admin.
  const isDynamicSurface =
    pathname.startsWith("/admin") || request.cookies.has("__prerender_bypass");

  let csp: string;
  if (isDynamicSurface) {
    const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
    // With 'strict-dynamic', a script vouched for by a nonced script can fetch
    // additional scripts, but the initial loader URLs still need to be listed
    // explicitly when next/script doesn't get to nonce them.
    csp = buildCsp(
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${SCRIPT_HOSTS}${dev}`,
    );
    // The request header carries the policy so Next nonces its own scripts.
    requestHeaders.set("Content-Security-Policy", csp);
  } else {
    csp = buildCsp(`script-src 'self' 'unsafe-inline' ${SCRIPT_HOSTS}${dev}`);
  }

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
