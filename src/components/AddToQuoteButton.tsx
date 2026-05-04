"use client";

import { useQuoteCart, type CartItemKind } from "./QuoteCart";
import { cn } from "@/lib/cn";

type Props = {
  productSlug: string;
  categorySlug: string;
  productName: string;
  productImage?: string;
  kind?: CartItemKind;
  size?: "sm" | "lg";
  variant?: "primary" | "ghost";
  label?: string; // override default "Add to quote" / "Add calibration"
  className?: string;
};

export function AddToQuoteButton({
  productSlug,
  categorySlug,
  productName,
  productImage,
  kind = "rental",
  size = "sm",
  variant = "primary",
  label,
  className,
}: Props) {
  const { add, items, open } = useQuoteCart();
  const inCart = items.some((i) => i.productSlug === productSlug && (i.kind ?? "rental") === kind);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    add({ productSlug, categorySlug, productName, productImage, kind });
    if (size === "lg") open();
  }

  const base = "inline-flex items-center gap-2 rounded-full font-bold transition-colors";
  const sizes = {
    sm: "px-3.5 py-1.5 text-[12.5px]",
    lg: "px-6 py-4 text-[15px]",
  };
  const variants = {
    primary: inCart
      ? "bg-emerald-600 text-white hover:bg-emerald-700"
      : "bg-accent text-white hover:bg-accent-dark",
    ghost: inCart
      ? "border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
      : "border border-line text-ink hover:bg-canvas-tint",
  };

  const defaultAddLabel = kind === "calibration"
    ? (size === "lg" ? "Request calibration" : "Add calibration")
    : (size === "lg" ? "Add to Quote" : "Add to quote");
  const addedLabel = size === "lg" ? "Added — add another?" : "In quote";

  return (
    <button type="button" onClick={handleClick} className={cn(base, sizes[size], variants[variant], className)}>
      {inCart ? (
        <>
          <svg width={size === "lg" ? 18 : 14} height={size === "lg" ? 18 : 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          {addedLabel}
        </>
      ) : (
        <>
          <svg width={size === "lg" ? 18 : 14} height={size === "lg" ? 18 : 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {label ?? defaultAddLabel}
        </>
      )}
    </button>
  );
}
