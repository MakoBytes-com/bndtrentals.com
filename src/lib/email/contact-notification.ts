import "server-only";

import {
  getResendClient,
  getResendFrom,
  getResendNotificationTo,
} from "./resend";
import { logError } from "@/lib/log";

export type ContactEmailPayload = {
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
  sourceUrl: string | null;
  ip: string | null;
  userAgent: string | null;
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderText(p: ContactEmailPayload): string {
  return [
    "New contact message from bndtrentals.com",
    "",
    `Name:    ${p.name}`,
    `Email:   ${p.email}`,
    `Phone:   ${p.phone ?? "—"}`,
    `Company: ${p.company ?? "—"}`,
    "",
    "MESSAGE",
    p.message,
    "",
    `Source: ${p.sourceUrl ?? ""}`,
    `IP: ${p.ip ?? ""}`,
    "",
    "Reply directly to this email to respond to the sender.",
  ].join("\n");
}

function renderHtml(p: ContactEmailPayload): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#64748b;font-size:13px;white-space:nowrap">${label}</td><td style="padding:4px 0;font-size:14px;color:#0f172a">${value}</td></tr>`;
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px">
    <h2 style="margin:0 0 4px;color:#0f172a;font-size:18px">New contact message</h2>
    <p style="margin:0 0 16px;color:#64748b;font-size:13px">Submitted via bndtrentals.com contact form</p>
    <table style="border-collapse:collapse;margin-bottom:16px">
      ${row("Name", esc(p.name))}
      ${row("Email", `<a href="mailto:${esc(p.email)}" style="color:#1d4ed8">${esc(p.email)}</a>`)}
      ${row("Phone", p.phone ? esc(p.phone) : "&mdash;")}
      ${row("Company", p.company ? esc(p.company) : "&mdash;")}
    </table>
    <div style="border-top:1px solid #e2e8f0;padding-top:12px">
      <p style="margin:0 0 6px;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em">Message</p>
      <p style="margin:0;color:#0f172a;font-size:15px;line-height:1.6;white-space:pre-wrap">${esc(p.message)}</p>
    </div>
    <p style="margin:18px 0 0;color:#94a3b8;font-size:12px">Reply directly to this email to respond to ${esc(p.name)}.</p>
  </div>`;
}

export async function sendContactNotification(
  payload: ContactEmailPayload,
): Promise<{ sent: boolean; reason?: string }> {
  const resend = getResendClient();
  if (!resend) return { sent: false, reason: "no_api_key" };
  try {
    const subject = `New contact message — ${payload.name || payload.email}`;
    const result = await resend.emails.send({
      from: getResendFrom(),
      to: getResendNotificationTo(),
      replyTo: payload.email,
      subject,
      html: renderHtml(payload),
      text: renderText(payload),
    });
    if (result.error) {
      logError("contact-email", result.error);
      return { sent: false, reason: result.error.message ?? "resend_error" };
    }
    return { sent: true };
  } catch (err) {
    logError("contact-email", err);
    return { sent: false, reason: err instanceof Error ? err.message : "unknown_error" };
  }
}
