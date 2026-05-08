"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useQuoteCart } from "./QuoteCart";

export function CartDrawer() {
  const pathname = usePathname();
  const { items, count, isOpen, close, setQuantity, remove, clear, flash } = useQuoteCart();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  // Lock body scroll while open
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.overflow = isOpen ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [isOpen]);

  // Escape to close + initial focus on close button + focus restore on close
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement;
    closeButtonRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // restore focus to the element that was focused before drawer opened
      const prev = previousFocusRef.current;
      if (prev instanceof HTMLElement) prev.focus();
    };
  }, [isOpen, close]);

  // Hide on /admin/* — the cart belongs to the public quote-form flow.
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <FloatingCartPill />

      {/* FLASH TOAST */}
      {flash && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 top-[120px] z-[60] -translate-x-1/2 rounded-full bg-emerald-600 px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-lg shadow-emerald-900/20 animate-in fade-in slide-in-from-top-2"
        >
          ✓ {flash}
        </div>
      )}

      {/* DRAWER OVERLAY */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[55] bg-ink/40 backdrop-blur-sm"
          onClick={close}
          aria-hidden
        />
      )}

      {/* DRAWER PANEL */}
      <aside
        className={`fixed right-0 top-0 z-[56] flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-heading"
        aria-hidden={!isOpen ? "true" : "false"}
      >
        <header className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-widest text-accent">Quote Builder</p>
            <h2 id="cart-drawer-heading" className="mt-0.5 text-xl font-bold">Your selected items</h2>
          </div>
          <button
            type="button"
            onClick={close}
            ref={closeButtonRef}
            className="inline-flex size-11 items-center justify-center rounded-lg border border-line text-ink hover:bg-canvas-tint"
            aria-label="Close cart"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-canvas-tint text-muted">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              </div>
              <h3 className="mt-4 text-lg font-bold">Your quote is empty</h3>
              <p className="mt-2 text-[14px] text-muted">
                Browse the catalog and tap <strong>Add to Quote</strong> on each unit you need.
                Build the full order, then submit it all in one form.
              </p>
              <Link
                href="/equipment"
                onClick={close}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-[14px] font-bold text-white hover:bg-brand-dark"
              >
                Browse equipment
              </Link>
            </div>
          ) : (
            <div>
              {(["rental", "calibration"] as const).map((kind) => {
                const group = items.filter((i) => (i.kind ?? "rental") === kind);
                if (group.length === 0) return null;
                const label = kind === "rental" ? "Equipment Rentals" : "Calibration Services";
                return (
                  <section key={kind}>
                    <h3 className="border-b border-line bg-canvas-tint px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-muted">
                      {label}
                    </h3>
                    <ul className="divide-y divide-line">
                      {group.map((it) => (
                        <li key={`${kind}-${it.productSlug}`} className="flex gap-4 p-5">
                          {it.productImage ? (
                            <Link
                              href={`/equipment/${it.categorySlug}/${it.productSlug}`}
                              onClick={close}
                              className="block size-20 shrink-0 overflow-hidden rounded-lg border border-line bg-canvas-tint p-2"
                            >
                              <Image
                                src={`/images/${it.productImage}`}
                                alt={it.productName}
                                width={120}
                                height={120}
                                className="h-full w-full object-contain"
                              />
                            </Link>
                          ) : (
                            <div className="flex size-20 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas-tint text-brand">
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M9 11l3 3 8-8M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            {it.productImage ? (
                              <Link
                                href={`/equipment/${it.categorySlug}/${it.productSlug}`}
                                onClick={close}
                                className="block text-[14.5px] font-semibold text-ink hover:text-brand"
                              >
                                {it.productName}
                              </Link>
                            ) : (
                              <p className="block text-[14.5px] font-semibold text-ink">
                                {it.productName}
                              </p>
                            )}
                            <div className="mt-2.5 flex items-center gap-3">
                              <div className="flex items-center rounded-full border border-line">
                                <button
                                  type="button"
                                  onClick={() => setQuantity(it.productSlug, it.quantity - 1)}
                                  className="flex size-8 items-center justify-center text-muted hover:text-ink"
                                  aria-label="Decrease quantity"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                </button>
                                <span className="w-8 text-center text-[14px] font-bold tabular-nums">{it.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => setQuantity(it.productSlug, it.quantity + 1)}
                                  className="flex size-8 items-center justify-center text-muted hover:text-ink"
                                  aria-label="Increase quantity"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => remove(it.productSlug)}
                                className="text-[12px] font-semibold text-muted hover:text-accent"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-line bg-canvas-tint p-5">
            <div className="flex items-center justify-between text-[14px]">
              <span className="font-semibold text-ink">{count} {count === 1 ? "item" : "items"} in your quote</span>
              <button
                type="button"
                onClick={clear}
                className="text-[12px] font-semibold text-muted hover:text-accent"
              >
                Clear all
              </button>
            </div>
            <Link
              href="/quote"
              onClick={close}
              className="mt-4 flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-[15px] font-bold text-white hover:bg-accent-dark"
            >
              Continue to quote form
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
            <p className="mt-2 text-center text-[12px] text-muted-soft">
              You'll add dates, shipping, and contact info on the next page.
            </p>
          </footer>
        )}
      </aside>
    </>
  );
}

function FloatingCartPill() {
  const { count, isOpen, open } = useQuoteCart();
  if (count === 0 || isOpen) return null;
  return (
    <button
      type="button"
      onClick={open}
      className="fixed bottom-[80px] right-6 z-[54] flex items-center gap-3 rounded-full bg-ink px-5 py-3.5 text-white shadow-2xl shadow-ink/30 hover:bg-ink-soft"
      aria-label={`Open quote cart with ${count} items`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      <span className="text-[13px] font-bold uppercase tracking-wider">Quote</span>
      <span className="flex size-7 items-center justify-center rounded-full bg-accent text-[13px] font-bold tabular-nums">
        {count}
      </span>
    </button>
  );
}
