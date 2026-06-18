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
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com https://makochat.app${isDev ? " 'unsafe-eval'" : ""}`,
    // Inline style ATTRIBUTES (style={{...}}) cannot carry a nonce, and a nonce
    // in style-src makes CSP3 browsers ignore 'unsafe-inline'. React and Recharts
    // (admin analytics) emit inline styles, so style-src uses 'unsafe-inline' and
    // drops the nonce. Style injection is low-severity; script-src stays strict.
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "media-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
    // Turnstile's challenge UI renders inside an iframe to
    // challenges.cloudflare.com.
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

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Expose the path so server layouts can gate by route (e.g. the admin auth
  // gate must allow the TOTP-setup page through while forcing enrollment).
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  // Enforcing. script-src is strict (nonce + 'strict-dynamic'); style-src allows
  // 'unsafe-inline' so React/Recharts inline styles render. The request header
  // above carries the same policy so Next nonces its own scripts.
  response.headers.set("Content-Security-Policy", csp);

  // CMS edit mode (?edit=1) is admin-specific and must always be fresh — never
  // let the CDN share-cache an edit-mode render (it carries edit affordances and
  // would otherwise mask just-saved changes). Overrides the s-maxage page rule.
  if (request.nextUrl.searchParams.get("edit") === "1") {
    response.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  }

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
