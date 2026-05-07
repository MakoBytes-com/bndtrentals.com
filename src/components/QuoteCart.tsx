"use client";

// Quote builder cart — persistent across navigation via localStorage.
// Used by Add-to-Quote buttons and the floating cart pill, then read by the Quote form.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartItemKind = "rental" | "calibration";

export type CartItem = {
  productSlug: string;
  categorySlug: string;
  productName: string;
  productImage?: string;
  quantity: number;
  kind?: CartItemKind; // default "rental" — older cart entries lack this field
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  add: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  setQuantity: (productSlug: string, qty: number) => void;
  remove: (productSlug: string) => void;
  clear: () => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  flash: string | null;
};

const STORAGE_KEY = "bndt-quote-cart-v1";
const ERROR_BUFFER_KEY = "bndt-error-buffer-v1";
const CartContext = createContext<CartContextValue | null>(null);

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.productSlug === "string" &&
    typeof v.categorySlug === "string" &&
    typeof v.productName === "string" &&
    typeof v.quantity === "number" &&
    Number.isFinite(v.quantity) &&
    v.quantity > 0 &&
    (v.productImage === undefined || typeof v.productImage === "string") &&
    (v.kind === undefined || v.kind === "rental" || v.kind === "calibration")
  );
}

// Same buffer the error boundaries write to. Phase 2 swaps this for Sentry
// + portal error_events ingestion; until then we keep the last 25 events
// in localStorage so we have something to forward when the pipeline lands.
function bufferClientError(scope: string, err: unknown) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(ERROR_BUFFER_KEY);
    const buf = raw ? (JSON.parse(raw) as unknown[]) : [];
    buf.push({
      scope,
      message: err instanceof Error ? err.message : String(err),
      name: err instanceof Error ? err.name : undefined,
      ts: new Date().toISOString(),
    });
    window.localStorage.setItem(
      ERROR_BUFFER_KEY,
      JSON.stringify(buf.slice(-25)),
    );
  } catch {
    // intentionally swallow — if even the error buffer is unwriteable
    // there's nothing else we can do client-side at this layer
  }
}

export function QuoteCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  // Hydrate from localStorage on mount.
  // Validate shape so a malformed entry doesn't crash the app or smuggle in
  // unexpected fields. If hydration fails, log the failure and fall back to
  // an empty cart rather than throwing.
  useEffect(() => {
    if (typeof window === "undefined") {
      setHydrated(true);
      return;
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(isCartItem);
          if (valid.length !== parsed.length) {
            // Some entries were malformed; rewrite the storage with the
            // sanitized list so we don't repeatedly re-validate them.
            console.warn(
              `[bndt cart] discarded ${parsed.length - valid.length} malformed item(s) during hydrate`,
            );
            try {
              window.localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
            } catch {
              // ignore — same handling as the persist effect below
            }
          }
          setItems(valid);
        }
      }
    } catch (err) {
      // Corrupted JSON or storage access blocked. Surface to the same buffer
      // error.tsx writes to so it becomes visible in Phase 2 observability.
      console.warn("[bndt cart] hydrate failed; starting empty", err);
      bufferClientError("cart-hydrate", err);
      // Wipe the bad entry so we don't trip the same parse on every visit.
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    setHydrated(true);
  }, []);

  // Persist on change. The interesting failure case is QuotaExceededError —
  // localStorage is small (~5MB per origin) and a runaway cart could fill it.
  // If we hit quota, flash a user-visible notice and drop the persistence (the
  // in-memory cart still works for this session).
  useEffect(() => {
    if (!hydrated) return;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      const isQuota =
        err instanceof DOMException &&
        (err.name === "QuotaExceededError" || err.code === 22);
      if (isQuota) {
        setFlash("Browser storage full — your cart won't persist. Submit your quote to keep it.");
      } else {
        console.warn("[bndt cart] persist failed", err);
      }
      bufferClientError(isQuota ? "cart-quota" : "cart-persist", err);
    }
  }, [items, hydrated]);

  // Flash auto-clear.
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 2200);
    return () => clearTimeout(t);
  }, [flash]);

  const add = useCallback<CartContextValue["add"]>((item) => {
    setItems((prev) => {
      // Same product can appear as both rental + calibration → key by slug+kind.
      const kind = item.kind ?? "rental";
      const existing = prev.find((p) => p.productSlug === item.productSlug && (p.kind ?? "rental") === kind);
      const qty = item.quantity ?? 1;
      if (existing) {
        return prev.map((p) =>
          p === existing ? { ...p, quantity: p.quantity + qty } : p
        );
      }
      return [
        ...prev,
        {
          productSlug: item.productSlug,
          categorySlug: item.categorySlug,
          productName: item.productName,
          productImage: item.productImage,
          quantity: qty,
          kind,
        },
      ];
    });
    setFlash(`Added ${item.productName} to your quote`);
  }, []);

  const setQuantity = useCallback((productSlug: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((p) => p.productSlug !== productSlug)
        : prev.map((p) => (p.productSlug === productSlug ? { ...p, quantity: qty } : p))
    );
  }, []);

  const remove = useCallback((productSlug: string) => {
    setItems((prev) => prev.filter((p) => p.productSlug !== productSlug));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((n, i) => n + i.quantity, 0), [items]);

  const value: CartContextValue = {
    items,
    count,
    add,
    setQuantity,
    remove,
    clear,
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((v) => !v),
    flash,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useQuoteCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useQuoteCart must be used inside QuoteCartProvider");
  return ctx;
}
