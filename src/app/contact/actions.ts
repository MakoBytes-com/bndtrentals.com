"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { verifyTurnstile } from "@/lib/turnstile";
import { sendContactNotification } from "@/lib/email/contact-notification";

// Backs the ContactForm. Same defenses as the quote form: Zod validation,
// honeypot, Turnstile. Contact messages are stored in quote_leads (marked
// "Contact form") so they show in the admin Leads inbox, and emailed to the
// notification address with reply-to = sender. Storage failure is non-fatal —
// the email is the primary channel for a contact message.

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(200),
  email: z.string().trim().email("Enter a valid email.").max(254),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  company: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Please enter a message.").max(5000),
  turnstileToken: z.string().max(2048).optional().or(z.literal("")),
  sourceUrl: z.string().max(2000).optional().or(z.literal("")),
  // Honeypot — hidden field; real users leave it empty.
  website: z.string().max(2000).optional().or(z.literal("")),
});

export type ContactSubmitInput = z.input<typeof schema>;
export type ContactSubmitResult =
  | { ok: true; emailSent: boolean }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function blank(s: string | null | undefined): string | null {
  if (!s) return null;
  const t = s.trim();
  return t.length === 0 ? null : t;
}

export async function submitContact(
  input: ContactSubmitInput,
): Promise<ContactSubmitResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
  }
  const data = parsed.data;

  // Honeypot — pretend success so the bot doesn't adapt; nothing is sent.
  if (data.website && data.website.trim().length > 0) {
    return { ok: true, emailSent: false };
  }

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    null;
  const userAgent = hdrs.get("user-agent") ?? null;

  const turnstile = await verifyTurnstile(data.turnstileToken, ip);
  if (!turnstile.ok) {
    return {
      ok: false,
      error:
        "Anti-spam check failed. Please refresh the page and try again, or call 281-941-4311.",
    };
  }

  // Store in quote_leads (marked) so it lands in the admin Leads inbox.
  // Non-fatal: a contact message's primary channel is email.
  try {
    const supa = getAdminSupabase();
    await supa.from("quote_leads").insert({
      ordered_by: blank(data.name),
      company: blank(data.company),
      email: data.email.toLowerCase(),
      phone: blank(data.phone),
      instructions: blank(data.message),
      interests: ["Contact form"],
      cart: [],
      source_url: blank(data.sourceUrl),
      user_agent: userAgent,
      ip,
      turnstile_ok: turnstile.configured ? true : null,
      status: "new",
    });
  } catch (e) {
    console.warn("[contact.submit] store skipped", e);
  }

  const emailResult = await sendContactNotification({
    name: data.name,
    email: data.email,
    phone: blank(data.phone),
    company: blank(data.company),
    message: data.message,
    sourceUrl: blank(data.sourceUrl),
    ip,
    userAgent,
  });

  if (!emailResult.sent) {
    console.warn("[contact.submit] email skipped", emailResult.reason);
  }

  return { ok: true, emailSent: emailResult.sent };
}
