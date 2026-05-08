"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { verifyTurnstile } from "@/lib/turnstile";
import { sendQuoteNotification } from "@/lib/email/quote-notification";

// Server action that backs the QuoteForm submission. Replaces the old mailto
// flow. Validates with Zod, verifies Turnstile (fail-open until configured),
// inserts into quote_leads via the service-role client (bypasses RLS), then
// fires off a Resend notification email. Returns a structured result so the
// client can render success / error toasts.

const cartLineSchema = z.object({
  productSlug: z.string().min(1).max(200),
  categorySlug: z.string().min(1).max(200),
  productName: z.string().min(1).max(300),
  productImage: z.string().max(500).optional(),
  quantity: z.number().int().positive().max(999),
  kind: z.enum(["rental", "calibration"]).optional(),
});

const submitSchema = z.object({
  orderedBy: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(40),
  company: z.string().trim().max(200).optional().or(z.literal("")),
  dateNeeded: z.string().trim().max(40).optional().or(z.literal("")),
  duration: z.string().trim().max(120).optional().or(z.literal("")),
  erpp: z.string().trim().max(40).optional().or(z.literal("")),
  poOrCc: z.string().trim().max(120).optional().or(z.literal("")),
  shippingAccount: z.string().trim().max(120).optional().or(z.literal("")),
  shipping: z.string().trim().max(2000).optional().or(z.literal("")),
  instructions: z.string().trim().max(5000).optional().or(z.literal("")),
  interests: z.array(z.string().max(120)).max(20).default([]),
  cart: z.array(cartLineSchema).max(200).default([]),
  turnstileToken: z.string().max(2048).optional().or(z.literal("")),
  sourceUrl: z.string().max(2000).optional().or(z.literal("")),
  // Honeypot: hidden input that real users never see. Bots that auto-fill
  // every field will populate it. Server silently accepts (200 OK) but
  // does NOT insert/send so the bot doesn't learn it was rejected.
  website: z.string().max(2000).optional().or(z.literal("")),
});

export type QuoteSubmitInput = z.input<typeof submitSchema>;

export type QuoteSubmitResult =
  | { ok: true; leadId: string; emailSent: boolean }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function blank(s: string | null | undefined): string | null {
  if (!s) return null;
  const trimmed = s.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export async function submitQuote(
  input: QuoteSubmitInput,
): Promise<QuoteSubmitResult> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return {
      ok: false,
      error: "Some fields look wrong. Please check the highlighted entries.",
      fieldErrors,
    };
  }
  const data = parsed.data;

  // Honeypot — if the hidden `website` field has anything in it, the
  // submission is from a bot. Pretend success so the bot doesn't learn
  // it was caught and doesn't bother adapting its scraper. Burton sees
  // nothing in their inbox.
  if (data.website && data.website.trim().length > 0) {
    return { ok: true, leadId: "honeypot", emailSent: false };
  }

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    null;
  const userAgent = hdrs.get("user-agent") ?? null;

  // Bot check (fails open until TURNSTILE_SECRET_KEY is configured).
  const turnstile = await verifyTurnstile(data.turnstileToken, ip);
  if (!turnstile.ok) {
    return {
      ok: false,
      error:
        "Anti-spam check failed. Please refresh the page and try again, or call 281-941-4311.",
    };
  }

  // Insert into quote_leads via service-role client (bypasses RLS by design).
  const supa = getAdminSupabase();
  const { data: row, error } = await supa
    .from("quote_leads")
    .insert({
      ordered_by: blank(data.orderedBy),
      company: blank(data.company),
      email: data.email.toLowerCase(),
      phone: blank(data.phone),
      shipping: blank(data.shipping),
      date_needed: blank(data.dateNeeded),
      duration: blank(data.duration),
      erpp: blank(data.erpp),
      po_or_cc: blank(data.poOrCc),
      shipping_account: blank(data.shippingAccount),
      instructions: blank(data.instructions),
      interests: data.interests,
      cart: data.cart,
      source_url: blank(data.sourceUrl),
      user_agent: userAgent,
      ip,
      turnstile_ok: turnstile.configured ? true : null,
      status: "new",
    })
    .select("id")
    .single();

  if (error || !row) {
    console.error("[quote.submit] insert failed", error);
    return {
      ok: false,
      error:
        "Could not save your request. Please call us at 281-941-4311 and we'll handle it directly.",
    };
  }

  // Notification email — failure here doesn't fail the submission. The lead
  // is already saved; staff can also see it in the admin panel (Phase 3).
  const emailResult = await sendQuoteNotification({
    leadId: row.id,
    orderedBy: blank(data.orderedBy),
    company: blank(data.company),
    email: data.email,
    phone: blank(data.phone),
    shipping: blank(data.shipping),
    dateNeeded: blank(data.dateNeeded),
    duration: blank(data.duration),
    erpp: blank(data.erpp),
    poOrCc: blank(data.poOrCc),
    shippingAccount: blank(data.shippingAccount),
    instructions: blank(data.instructions),
    interests: data.interests,
    cart: data.cart,
    sourceUrl: blank(data.sourceUrl),
    ip,
    userAgent,
  });

  if (!emailResult.sent) {
    console.warn("[quote.submit] email skipped", emailResult.reason);
  }

  return { ok: true, leadId: row.id, emailSent: emailResult.sent };
}
