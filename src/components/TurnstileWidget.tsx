"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";

// Cloudflare Turnstile widget. Renders an invisible-or-checkbox bot challenge
// next to the submit button on the quote form. When verified, writes the
// resulting token into a hidden `cf-turnstile-response` field on the form
// (Turnstile's default behavior with implicit render).
//
// Falls back to a no-op visual placeholder if NEXT_PUBLIC_TURNSTILE_SITE_KEY
// is not set, so dev environments without Turnstile config still render the
// form. The server-side verifier (lib/turnstile.ts) is similarly fail-open.

declare global {
  interface Window {
    turnstile?: {
      render: (
        target: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
          appearance?: "always" | "execute" | "interaction-only";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

type TurnstileWidgetProps = {
  onToken?: (token: string | null) => void;
  className?: string;
};

export function TurnstileWidget({ onToken, className }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const handleToken = useCallback(
    (token: string | null) => {
      if (onToken) onToken(token);
    },
    [onToken],
  );

  useEffect(() => {
    if (!siteKey) return;
    let mounted = true;

    const render = () => {
      if (!mounted) return;
      const node = containerRef.current;
      const turnstile = window.turnstile;
      if (!node || !turnstile) return;
      // Avoid double-render in StrictMode.
      if (widgetIdRef.current) return;
      widgetIdRef.current = turnstile.render(node, {
        sitekey: siteKey,
        appearance: "interaction-only",
        theme: "auto",
        callback: (token: string) => handleToken(token),
        "expired-callback": () => handleToken(null),
        "error-callback": () => handleToken(null),
      });
    };

    if (window.turnstile) {
      render();
    } else {
      // Wait for the script tag (loaded via next/script below) to attach
      // window.turnstile. Poll briefly; the script normally beats this.
      const start = Date.now();
      const id = window.setInterval(() => {
        if (window.turnstile) {
          window.clearInterval(id);
          render();
        } else if (Date.now() - start > 8000) {
          window.clearInterval(id);
          if (process.env.NODE_ENV !== "production") {
            console.warn("[turnstile] script never loaded; bot check skipped client-side");
          }
        }
      }, 200);
      return () => {
        window.clearInterval(id);
        mounted = false;
      };
    }

    return () => {
      mounted = false;
      const turnstile = window.turnstile;
      if (turnstile && widgetIdRef.current) {
        try {
          turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, handleToken]);

  // No site key configured — render nothing visible. Form still submits;
  // server-side verifier fails open (logs warning) until env is set.
  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />
      <div ref={containerRef} className={className} aria-hidden="false" />
    </>
  );
}
