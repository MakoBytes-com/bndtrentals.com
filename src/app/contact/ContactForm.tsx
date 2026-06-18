"use client";

import { useState, useTransition } from "react";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { submitContact } from "./actions";

const inputClass =
  "w-full rounded-lg border border-line bg-canvas-tint px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted-soft/70 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20";

export function ContactForm() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim(),
      company: String(fd.get("company") ?? "").trim(),
      message: String(fd.get("message") ?? "").trim(),
      website: String(fd.get("website") ?? ""),
      turnstileToken: captchaToken ?? "",
      sourceUrl: typeof window !== "undefined" ? window.location.href : "",
    };
    startTransition(async () => {
      const r = await submitContact(payload);
      if (r.ok) {
        setDone(true);
        return;
      }
      setError(r.error);
      if (r.fieldErrors) setFieldErrors(r.fieldErrors);
      setCaptchaToken(null);
      setCaptchaKey((k) => k + 1);
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-7 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-600 text-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h3 className="mt-4 text-xl font-bold text-emerald-900">Message sent — thank you.</h3>
        <p className="mt-2 text-[15px] text-emerald-900/80">
          We&apos;ll get back to you within one business hour. Need something now?
          Call <a href="tel:281-941-4311" className="font-bold underline">281-941-4311</a>.
        </p>
      </div>
    );
  }

  const err = (k: string) =>
    fieldErrors[k] ? (
      <p className="mt-1 text-[12.5px] font-semibold text-accent">{fieldErrors[k]}</p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="block text-[13px] font-semibold text-ink">Name *</span>
          <input name="name" required autoComplete="name" className={`${inputClass} mt-1.5`} />
          {err("name")}
        </label>
        <label className="block">
          <span className="block text-[13px] font-semibold text-ink">Email *</span>
          <input type="email" name="email" required autoComplete="email" className={`${inputClass} mt-1.5`} />
          {err("email")}
        </label>
        <label className="block">
          <span className="block text-[13px] font-semibold text-ink">Phone</span>
          <input type="tel" name="phone" autoComplete="tel" className={`${inputClass} mt-1.5`} />
          {err("phone")}
        </label>
        <label className="block">
          <span className="block text-[13px] font-semibold text-ink">Company</span>
          <input name="company" autoComplete="organization" className={`${inputClass} mt-1.5`} />
          {err("company")}
        </label>
      </div>

      <label className="block">
        <span className="block text-[13px] font-semibold text-ink">How can we help? *</span>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="Tell us what you're inspecting, the equipment you need, dates, or any questions."
          className={`${inputClass} mt-1.5 resize-y`}
        />
        {err("message")}
      </label>

      {/* Honeypot — hidden from real users; bots fill it and get silently dropped. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <TurnstileWidget key={captchaKey} onToken={setCaptchaToken} className="flex justify-start" />

      {error && (
        <p role="alert" className="rounded-lg border border-accent/40 bg-accent/5 p-3 text-[13.5px] text-accent">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-[15px] font-bold text-white hover:bg-accent-dark disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send message"}
        {!pending && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
        )}
      </button>
    </form>
  );
}
