import "server-only";

import {
  getResendClient,
  getResendFrom,
  getResendNotificationTo,
} from "./resend";
import { logError } from "@/lib/log";

export type QuoteCartLine = {
  productName: string;
  quantity: number;
  kind?: "rental" | "calibration";
};

export type QuoteEmailPayload = {
  leadId: string;
  orderedBy: string | null;
  company: string | null;
  email: string;
  phone: string | null;
  shipping: string | null;
  dateNeeded: string | null;
  duration: string | null;
  erpp: string | null;
  poOrCc: string | null;
  shippingAccount: string | null;
  instructions: string | null;
  interests: string[];
  cart: QuoteCartLine[];
  sourceUrl: string | null;
  ip: string | null;
  userAgent: string | null;
};

function escapeHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderHtml(p: QuoteEmailPayload): string {
  const rentals = p.cart.filter((i) => (i.kind ?? "rental") === "rental");
  const calibrations = p.cart.filter((i) => i.kind === "calibration");
  const cartSection = (label: string, items: QuoteCartLine[]) =>
    items.length === 0
      ? ""
      : `<h3 style="margin:18px 0 6px;font-size:14px;color:#475569;text-transform:uppercase;letter-spacing:.1em">${label}</h3>
         <ol style="margin:0;padding-left:20px;font-size:15px;color:#0b1220">${items
           .map(
             (i) =>
               `<li><strong>${escapeHtml(i.productName)}</strong> &times; ${
                 i.quantity
               }</li>`,
           )
           .join("")}</ol>`;

  const detail = (label: string, value: string | null | undefined) =>
    !value
      ? ""
      : `<tr><td style="padding:6px 12px 6px 0;color:#475569;font-size:13.5px;vertical-align:top;width:160px">${label}</td><td style="padding:6px 0;font-size:14.5px;color:#0b1220">${escapeHtml(value)}</td></tr>`;

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:24px 0">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,0.05)">
        <tr><td style="background:#0b1220;padding:20px 28px;color:#ffffff">
          <p style="margin:0;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#ea580c;font-weight:700">New quote request</p>
          <h1 style="margin:6px 0 0;font-size:22px;font-weight:700">Burton NDT Rentals</h1>
        </td></tr>
        <tr><td style="padding:24px 28px">
          <p style="margin:0 0 6px;font-size:13px;color:#475569">Lead ID</p>
          <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;color:#0b1220">${escapeHtml(p.leadId)}</p>
          ${cartSection("Equipment Rentals", rentals)}
          ${cartSection("Calibration Services", calibrations)}
          ${
            p.cart.length === 0
              ? `<p style="margin:14px 0 0;color:#475569;font-size:14px;font-style:italic">No items in cart — details in instructions below.</p>`
              : ""
          }
          <h3 style="margin:22px 0 6px;font-size:14px;color:#475569;text-transform:uppercase;letter-spacing:.1em">Contact</h3>
          <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%">
            ${detail("Ordered by", p.orderedBy)}
            ${detail("Company", p.company)}
            ${detail("Email", p.email)}
            ${detail("Phone", p.phone)}
          </table>
          <h3 style="margin:22px 0 6px;font-size:14px;color:#475569;text-transform:uppercase;letter-spacing:.1em">Rental & shipping</h3>
          <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%">
            ${detail("Date needed", p.dateNeeded)}
            ${detail("Duration", p.duration)}
            ${detail("ERPP", p.erpp)}
            ${detail("PO / CC", p.poOrCc)}
            ${detail("Shipping account", p.shippingAccount)}
            ${detail("Shipping address", p.shipping)}
          </table>
          ${
            p.instructions
              ? `<h3 style="margin:22px 0 6px;font-size:14px;color:#475569;text-transform:uppercase;letter-spacing:.1em">Special instructions</h3>
                 <p style="margin:0;font-size:14.5px;color:#0b1220;white-space:pre-wrap">${escapeHtml(p.instructions)}</p>`
              : ""
          }
          ${
            p.interests.length > 0
              ? `<h3 style="margin:22px 0 6px;font-size:14px;color:#475569;text-transform:uppercase;letter-spacing:.1em">Interested in</h3>
                 <p style="margin:0;font-size:14.5px;color:#0b1220">${p.interests.map(escapeHtml).join(", ")}</p>`
              : ""
          }
          <p style="margin:28px 0 0;padding:14px;background:#f8fafc;border-radius:8px;font-size:12px;color:#64748b">
            Source: ${escapeHtml(p.sourceUrl)}<br/>
            IP: ${escapeHtml(p.ip)}<br/>
            UA: ${escapeHtml(p.userAgent)}
          </p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:14px 28px;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#94a3b8">
          Sent from bndtrentals.com quote form. Reply directly to this email to respond to the customer.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function renderText(p: QuoteEmailPayload): string {
  const lines: string[] = [];
  lines.push(`NEW QUOTE REQUEST — Burton NDT Rentals`);
  lines.push(`Lead ID: ${p.leadId}`);
  lines.push("");
  const rentals = p.cart.filter((i) => (i.kind ?? "rental") === "rental");
  const calibrations = p.cart.filter((i) => i.kind === "calibration");
  if (rentals.length) {
    lines.push("EQUIPMENT RENTALS");
    rentals.forEach((i, idx) => lines.push(`  ${idx + 1}. ${i.productName} x ${i.quantity}`));
    lines.push("");
  }
  if (calibrations.length) {
    lines.push("CALIBRATION SERVICES");
    calibrations.forEach((i, idx) => lines.push(`  ${idx + 1}. ${i.productName} x ${i.quantity}`));
    lines.push("");
  }
  lines.push("CONTACT");
  if (p.orderedBy) lines.push(`  Ordered by: ${p.orderedBy}`);
  if (p.company) lines.push(`  Company: ${p.company}`);
  lines.push(`  Email: ${p.email}`);
  if (p.phone) lines.push(`  Phone: ${p.phone}`);
  lines.push("");
  lines.push("RENTAL & SHIPPING");
  if (p.dateNeeded) lines.push(`  Date needed: ${p.dateNeeded}`);
  if (p.duration) lines.push(`  Duration: ${p.duration}`);
  if (p.erpp) lines.push(`  ERPP: ${p.erpp}`);
  if (p.poOrCc) lines.push(`  PO / CC: ${p.poOrCc}`);
  if (p.shippingAccount) lines.push(`  Shipping account: ${p.shippingAccount}`);
  if (p.shipping) lines.push(`  Shipping: ${p.shipping}`);
  if (p.instructions) {
    lines.push("");
    lines.push("SPECIAL INSTRUCTIONS");
    lines.push(p.instructions);
  }
  if (p.interests.length) {
    lines.push("");
    lines.push(`Interested in: ${p.interests.join(", ")}`);
  }
  lines.push("");
  lines.push(`Source: ${p.sourceUrl ?? ""}`);
  lines.push(`IP: ${p.ip ?? ""}`);
  return lines.join("\n");
}

export async function sendQuoteNotification(
  payload: QuoteEmailPayload,
): Promise<{ sent: boolean; reason?: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { sent: false, reason: "no_api_key" };
  }
  try {
    const subject = `New quote request — ${payload.orderedBy ?? payload.company ?? payload.email}`;
    const result = await resend.emails.send({
      from: getResendFrom(),
      to: getResendNotificationTo(),
      replyTo: payload.email,
      subject,
      html: renderHtml(payload),
      text: renderText(payload),
    });
    if (result.error) {
      logError("quote-email", result.error, { context: { leadId: payload.leadId } });
      return { sent: false, reason: result.error.message ?? "resend_error" };
    }
    return { sent: true };
  } catch (err) {
    logError("quote-email", err, { context: { leadId: payload.leadId } });
    return { sent: false, reason: err instanceof Error ? err.message : "unknown_error" };
  }
}
