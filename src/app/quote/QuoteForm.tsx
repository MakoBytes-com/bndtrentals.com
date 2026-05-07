"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { SITE } from "@/lib/site";
import { useQuoteCart } from "@/components/QuoteCart";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { submitQuote, type QuoteSubmitInput } from "./actions";

const INTERESTS = [
  "Evergreen Rental Program",
  "Calibration services",
  "Portable Generators",
  "Equipment Rental Protection Plan (ERPP)",
  "H2S single-gas / 4-gas monitors",
  "Consumables",
];

type FieldErrors = Record<string, string>;

export function QuoteForm() {
  const { items, count, setQuantity, remove, clear } = useQuoteCart();
  const [submitted, setSubmitted] = useState(false);
  const [prefillNote, setPrefillNote] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Legacy ?item= deep link support — surface it as a note since cart is the new flow.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const item = params.get("item");
    if (item) setPrefillNote(item);
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});
    const fd = new FormData(e.currentTarget);

    const interests = fd.getAll("interests").map((v) => String(v));
    const sourceUrl = typeof window !== "undefined" ? window.location.href : "";

    const payload: QuoteSubmitInput = {
      orderedBy: String(fd.get("orderedBy") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim(),
      company: String(fd.get("company") ?? "").trim(),
      dateNeeded: String(fd.get("dateNeeded") ?? "").trim(),
      duration: String(fd.get("duration") ?? "").trim(),
      erpp: String(fd.get("erpp") ?? "").trim(),
      poOrCc: String(fd.get("poOrCc") ?? "").trim(),
      shippingAccount: String(fd.get("shippingAccount") ?? "").trim(),
      shipping: String(fd.get("shipping") ?? "").trim(),
      instructions: String(fd.get("instructions") ?? "").trim(),
      interests,
      cart: items.map((it) => ({
        productSlug: it.productSlug,
        categorySlug: it.categorySlug,
        productName: it.productName,
        productImage: it.productImage,
        quantity: it.quantity,
        kind: it.kind,
      })),
      // Token is empty in dev / when NEXT_PUBLIC_TURNSTILE_SITE_KEY is not
      // set. Server-side verifier fails open in that case.
      turnstileToken,
      sourceUrl,
    };

    startTransition(async () => {
      const result = await submitQuote(payload);
      if (result.ok) {
        setSubmitted(true);
        clear();
      } else {
        setErrorMessage(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  }

  if (submitted) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-line bg-canvas-tint p-10 text-center"
      >
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand text-white">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 className="mt-5 text-2xl font-bold">Thanks — we got your request.</h2>
        <p className="mt-3 text-[16px] text-muted">
          A team member will follow up at your email or phone within the
          business hour. If you need it faster, call{" "}
          <a href={`tel:${SITE.primaryPhoneTel}`} className="font-semibold text-brand hover:text-brand-dark">
            {SITE.primaryPhone}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* CART ITEMS */}
      <fieldset className="rounded-2xl border border-line bg-white p-6 sm:p-8">
        <legend className="px-3 text-[12px] font-bold uppercase tracking-widest text-accent">
          Items in this quote
        </legend>
        {items.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-line bg-canvas-tint p-6 text-center">
            <p className="text-[15px] text-muted">
              Your quote cart is empty.{" "}
              <Link href="/equipment" className="font-semibold text-brand hover:text-brand-dark">
                Browse equipment
              </Link>{" "}
              or{" "}
              <Link href="/calibration" className="font-semibold text-brand hover:text-brand-dark">
                add calibration services
              </Link>
              , then come back here to finish your request.
            </p>
            {prefillNote && (
              <p className="mt-3 text-[13px] text-muted-soft">
                You arrived from a link for: <span className="font-semibold text-ink">{prefillNote}</span>
              </p>
            )}
          </div>
        ) : (
          <div className="mt-3 space-y-5">
            {(["rental", "calibration"] as const).map((kind) => {
              const group = items.filter((i) => (i.kind ?? "rental") === kind);
              if (group.length === 0) return null;
              const label = kind === "rental" ? "Equipment Rentals" : "Calibration Services";
              return (
                <div key={kind}>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted">{label}</p>
                  <ul className="mt-2 divide-y divide-line">
                    {group.map((it, idx) => (
                      <li key={`${kind}-${it.productSlug}`} className="flex items-center gap-4 py-3">
                        <span className="w-6 text-[12px] font-bold text-muted-soft tabular-nums">
                          {idx + 1}.
                        </span>
                        {it.productImage ? (
                          <Link
                            href={`/equipment/${it.categorySlug}/${it.productSlug}`}
                            className="block size-14 shrink-0 overflow-hidden rounded-lg border border-line bg-canvas-tint p-1.5"
                          >
                            <Image
                              src={`/images/${it.productImage}`}
                              alt=""
                              width={80}
                              height={80}
                              className="h-full w-full object-contain"
                            />
                          </Link>
                        ) : (
                          <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas-tint text-brand">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M9 11l3 3 8-8M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                            </svg>
                          </div>
                        )}
                        {it.productImage ? (
                          <Link
                            href={`/equipment/${it.categorySlug}/${it.productSlug}`}
                            className="flex-1 min-w-0 text-[15px] font-semibold text-ink hover:text-brand"
                          >
                            {it.productName}
                          </Link>
                        ) : (
                          <p className="flex-1 min-w-0 text-[15px] font-semibold text-ink">
                            {it.productName}
                          </p>
                        )}
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
                          className="text-[12px] font-semibold text-muted-soft hover:text-accent"
                          aria-label={`Remove ${it.productName}`}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
        {items.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-[13px]">
            <p className="text-muted">{count} {count === 1 ? "unit" : "units"} total across {items.length} item{items.length === 1 ? "" : "s"}</p>
            <button
              type="button"
              onClick={clear}
              className="font-semibold text-muted-soft hover:text-accent"
            >
              Clear cart
            </button>
          </div>
        )}
      </fieldset>

      <Section title="Rental dates & program">
        <Grid cols={2}>
          <Field label="Date needed" name="dateNeeded" type="date" required />
          <Field label="Rental duration" name="duration" placeholder="e.g. 7 days, 1 month, evergreen" />
        </Grid>
        <Fieldset legend="Equipment Rental Protection Plan (ERPP)">
          <RadioRow name="erpp" options={["15% ERPP", "No ERPP"]} default="15% ERPP" />
        </Fieldset>
      </Section>

      <Section title="Ordering & shipping">
        <Grid cols={2}>
          <Field label="Ordered by" name="orderedBy" placeholder="Your name" required />
          <Field label="Company" name="company" placeholder="Company name" />
        </Grid>
        <Grid cols={2}>
          <Field label="PO Number or Credit Card" name="poOrCc" placeholder="PO# or last 4 of CC" />
          <Field label="Shipping Account #" name="shippingAccount" placeholder="FedEx / UPS account" />
        </Grid>
        <Grid cols={2}>
          <Field label="Email" name="email" type="email" required placeholder="you@company.com" />
          <Field label="Phone" name="phone" type="tel" required placeholder="(555) 555-5555" />
        </Grid>
        <Field label="Shipping method / address" name="shipping" textarea placeholder="Carrier preference + ship-to address" />
        <Field
          label="Special instructions"
          name="instructions"
          textarea
          placeholder="Hold for pickup, deliver to gate, schedule with site contact…"
          defaultValue={prefillNote && items.length === 0 ? `Need: ${prefillNote}` : undefined}
        />
      </Section>

      <Section title="Can we interest you in…">
        <div className="grid gap-3 sm:grid-cols-2">
          {INTERESTS.map((i) => (
            <label key={i} className="flex items-start gap-3 rounded-lg border border-line bg-white p-3.5 hover:bg-canvas-tint">
              <input
                type="checkbox"
                name="interests"
                value={i}
                className="mt-1 size-4 accent-[var(--color-brand)]"
              />
              <span className="text-[14.5px] text-ink-soft">{i}</span>
            </label>
          ))}
        </div>
      </Section>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-accent/40 bg-accent/5 p-4 text-[14.5px] text-ink"
        >
          <p className="font-semibold text-accent">{errorMessage}</p>
          {Object.keys(fieldErrors).length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-[13.5px] text-muted">
              {Object.entries(fieldErrors).map(([field, msg]) => (
                <li key={field}>
                  <strong className="text-ink">{field}:</strong> {msg}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <TurnstileWidget
        onToken={(token) => setTurnstileToken(token ?? "")}
        className="flex justify-end"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-muted-soft">
          We&apos;ll reply within the business hour. By submitting you agree to
          be contacted at the email or phone you provided.
        </p>
        <button
          type="submit"
          disabled={isPending}
          {...(isPending ? { "aria-disabled": "true" as const } : {})}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-4 text-base font-bold text-white hover:bg-accent-dark disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "Sending…" : "Send quote request"}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </div>
    </form>
  );
}

// ---- Helpers ----
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-line bg-white p-6 sm:p-8">
      <legend className="px-3 text-[12px] font-bold uppercase tracking-widest text-accent">
        {title}
      </legend>
      <div className="mt-3 space-y-5">{children}</div>
    </fieldset>
  );
}

function Grid({ cols, children }: { cols: 2 | 3; children: React.ReactNode }) {
  return (
    <div className={`grid gap-5 ${cols === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
      {children}
    </div>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  textarea?: boolean;
  defaultValue?: string | number;
  min?: number;
};

function Field({ label, name, type = "text", required, placeholder, textarea, defaultValue, min }: FieldProps) {
  const inputClasses =
    "w-full rounded-lg border border-line bg-canvas-tint px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted-soft/70 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20";
  return (
    <label className="block">
      <span className="block text-[13px] font-semibold text-ink">
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="ml-1 text-accent">*</span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </span>
      {textarea ? (
        <textarea
          name={name}
          required={required}
          {...(required ? { "aria-required": "true" as const } : {})}
          placeholder={placeholder}
          rows={3}
          defaultValue={defaultValue as string | undefined}
          className={`${inputClasses} mt-1.5 resize-y`}
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          {...(required ? { "aria-required": "true" as const } : {})}
          placeholder={placeholder}
          defaultValue={defaultValue}
          min={min}
          className={`${inputClasses} mt-1.5`}
        />
      )}
    </label>
  );
}

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-ink">{legend}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function RadioRow({ name, options, default: defaultValue }: { name: string; options: string[]; default: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-[14px] hover:bg-canvas-tint cursor-pointer">
          <input
            type="radio"
            name={name}
            value={opt}
            defaultChecked={opt === defaultValue}
            className="accent-[var(--color-brand)]"
          />
          {opt}
        </label>
      ))}
    </div>
  );
}
