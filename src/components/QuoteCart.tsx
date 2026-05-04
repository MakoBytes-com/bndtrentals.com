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
const CartContext = createContext<CartContextValue | null>(null);

export function QuoteCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {}
    setHydrated(true);
  }, []);

  // Persist on change.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
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
