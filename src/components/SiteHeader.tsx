"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Container } from "./Container";
import { NAV_PRIMARY, NAV_EQUIPMENT, SITE } from "@/lib/site";
import { cn } from "@/lib/cn";

export function SiteHeader() {
  // Public-site chrome — hide on /admin/* so the admin panel doesn't render
  // the customer-facing nav stacked on top of its own AdminShell.
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [eqOpen, setEqOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const eqWrapRef = useRef<HTMLDivElement>(null);

  if (pathname?.startsWith("/admin")) return null;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);

  // Equipment dropdown: close on Escape, close on click outside.
  useEffect(() => {
    if (!eqOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setEqOpen(false);
    }
    function onPointerDown(e: PointerEvent) {
      const wrap = eqWrapRef.current;
      if (wrap && !wrap.contains(e.target as Node)) setEqOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [eqOpen]);

  return (
    <header className="sticky top-0 z-40">
      {/* Utility bar */}
      <div className="bg-[var(--color-canvas-deep)] text-white/90 text-[13px]">
        <Container className="flex h-9 items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <a href={`tel:${SITE.primaryPhoneTel}`} className="flex items-center gap-2 hover:text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span className="font-semibold">{SITE.primaryPhone}</span>
            </a>
            <a href={`mailto:${SITE.email}`} className="hidden sm:flex items-center gap-2 hover:text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m2 7 10 6 10-6"/>
              </svg>
              <span>{SITE.email}</span>
            </a>
          </div>
          <div className="hidden md:flex items-center gap-4 text-white/70">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span>3 U.S. service hubs · TX & GA</span>
            </span>
          </div>
        </Container>
      </div>

      {/* Main bar */}
      <div className={cn(
        "border-b border-line bg-white/95 backdrop-blur transition-shadow",
        scrolled && "shadow-[0_1px_0_rgba(15,23,42,0.06),0_8px_24px_-12px_rgba(15,23,42,0.18)]"
      )}>
        <Container className="flex h-[72px] items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3" aria-label={`${SITE.name} home`}>
            <div className="relative h-14 w-[230px]">
              <Image
                src="/images/logo-2.png"
                alt={SITE.name}
                fill
                priority
                sizes="230px"
                className="object-contain object-left brightness-0"
              />
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Primary">
            <div
              ref={eqWrapRef}
              className="relative"
              onMouseEnter={() => setEqOpen(true)}
              onMouseLeave={() => setEqOpen(false)}
            >
              {/*
                Two-element pattern: a Link to /equipment for direct navigation,
                plus a separate disclosure button for the submenu. This keeps
                the link target clickable while exposing keyboard / aria-expanded
                semantics for the dropdown.
              */}
              <div className="flex items-center">
                <Link
                  href="/equipment"
                  className="text-[15px] font-semibold text-ink hover:text-brand transition-colors"
                >
                  Equipment
                </Link>
                <button
                  type="button"
                  onClick={() => setEqOpen((v) => !v)}
                  aria-expanded={eqOpen ? "true" : "false"}
                  aria-controls="equipment-submenu"
                  aria-label={eqOpen ? "Close equipment categories" : "Open equipment categories"}
                  className="ml-1 inline-flex size-6 items-center justify-center rounded text-ink hover:text-brand"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={cn("transition-transform", eqOpen && "rotate-180")}
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
              </div>
              {eqOpen && (
                <div
                  id="equipment-submenu"
                  className="absolute left-1/2 top-full -translate-x-1/2 pt-3 w-[260px]"
                >
                  {/* Simple disclosure pattern — not a true ARIA menu (no arrow-key
                      navigation), so we don't claim role="menu". Standard links
                      work fine for keyboard users via Tab. */}
                  <ul className="rounded-xl border border-line bg-white p-2 shadow-lg shadow-ink/10">
                    {NAV_EQUIPMENT.map((it) => (
                      <li key={it.href}>
                        <Link
                          href={it.href}
                          onClick={() => setEqOpen(false)}
                          className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[14px] font-medium text-ink-soft hover:bg-canvas-tint hover:text-brand"
                        >
                          <span>{it.label}</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {NAV_PRIMARY.filter((n) => n.href !== "/equipment").map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[15px] font-semibold text-ink hover:text-brand transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/quote"
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[14px] font-bold text-white hover:bg-accent-dark transition-colors"
            >
              Request a Quote
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden inline-flex size-11 items-center justify-center rounded-lg border border-line text-ink hover:bg-canvas-tint"
              aria-label="Toggle menu"
              aria-expanded={open ? "true" : "false"}
            >
              {open ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              )}
            </button>
          </div>
        </Container>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 top-[calc(36px+72px)] bg-white z-30 overflow-y-auto">
          <Container className="py-6">
            <div className="space-y-1">
              <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-widest text-muted">Equipment</p>
              {NAV_EQUIPMENT.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink hover:bg-canvas-tint"
                >
                  {it.label}
                </Link>
              ))}
              <div className="my-3 h-px bg-line" />
              <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-widest text-muted">Company</p>
              {NAV_PRIMARY.filter((n) => n.href !== "/equipment").map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-[16px] font-semibold text-ink hover:bg-canvas-tint"
                >
                  {item.label}
                </Link>
              ))}
              <div className="my-3 h-px bg-line" />
              <Link
                href="/quote"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-3.5 text-[15px] font-bold text-white hover:bg-accent-dark"
              >
                Request a Quote
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
              <a
                href={`tel:${SITE.primaryPhoneTel}`}
                className="mt-3 flex items-center justify-center gap-2 rounded-full border border-line px-5 py-3 text-[15px] font-semibold text-ink hover:bg-canvas-tint"
              >
                Call {SITE.primaryPhone}
              </a>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
