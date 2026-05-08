import "server-only";

import { getResendClient, getResendFrom } from "./resend";
import { logError } from "@/lib/log";
import { SITE } from "@/lib/site";

export type RecallEmailPayload = {
  customerName: string | null;
  customerEmail: string;
  customerCompany: string | null;
  equipmentLabel: string | null;
  equipmentRef: string;
  serialNumber: string | null;
  dueDate: string; // YYYY-MM-DD
  daysUntilDue: number; // negative = overdue
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

function fmtDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function renderHtml(p: RecallEmailPayload): string {
  const equipName = p.equipmentLabel || p.equipmentRef;
  const overdue = p.daysUntilDue < 0;
  const headline = overdue
    ? `Calibration overdue by ${Math.abs(p.daysUntilDue)} day${Math.abs(p.daysUntilDue) === 1 ? "" : "s"}`
    : p.daysUntilDue === 0
      ? "Calibration due today"
      : `Calibration due in ${p.daysUntilDue} day${p.daysUntilDue === 1 ? "" : "s"}`;
  const accent = overdue ? "#dc2626" : "#ea580c";

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
          <p style="margin:0;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:${accent};font-weight:700">${overdue ? "Overdue calibration" : "Calibration reminder"}</p>
          <h1 style="margin:6px 0 0;font-size:22px;font-weight:700">${escapeHtml(SITE.name)}</h1>
        </td></tr>
        <tr><td style="padding:24px 28px">
          <p style="margin:0 0 6px;font-size:15px;color:#0b1220">Hi ${escapeHtml(p.customerName) || "there"},</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#0b1220">
            ${
              overdue
                ? `Records show <strong>${escapeHtml(equipName)}</strong> is now <strong style="color:${accent}">${escapeHtml(headline.toLowerCase())}</strong>. Sending equipment back for recalibration keeps your inspection results defensible and traceable.`
                : `This is a friendly reminder that <strong>${escapeHtml(equipName)}</strong> is <strong style="color:${accent}">${escapeHtml(headline.toLowerCase())}</strong>. We can have it picked up, calibrated, and returned without disrupting your operation.`
            }
          </p>
          <h3 style="margin:22px 0 6px;font-size:14px;color:#475569;text-transform:uppercase;letter-spacing:.1em">Equipment</h3>
          <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%">
            ${detail("Item", equipName)}
            ${detail("Serial number", p.serialNumber)}
            ${detail("Calibration due", fmtDate(p.dueDate))}
            ${detail("Customer", p.customerCompany || p.customerName)}
          </table>
          <p style="margin:24px 0 0">
            <a href="${SITE.url}/calibration" style="display:inline-block;background:${accent};color:#ffffff;padding:12px 22px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:700">Schedule calibration</a>
            <a href="tel:${SITE.primaryPhoneTel}" style="display:inline-block;margin-left:10px;color:#0b1220;padding:12px 22px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600;border:1px solid #cbd5e1">Call ${escapeHtml(SITE.primaryPhone)}</a>
          </p>
          <p style="margin:24px 0 0;font-size:13.5px;color:#475569;line-height:1.55">
            Just reply to this email or call us — we can pick up, ship, and return calibrated equipment without you having to coordinate freight separately.
          </p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:14px 28px;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#94a3b8">
          ${escapeHtml(SITE.name)} · ${escapeHtml(SITE.email)} · ${escapeHtml(SITE.primaryPhone)}<br/>
          You&apos;re receiving this because Burton has a calibration record for your equipment. <a href="mailto:${SITE.email}?subject=Unsubscribe%20calibration%20reminders" style="color:#94a3b8;text-decoration:underline">Reply &ldquo;stop&rdquo;</a> to opt out.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function renderText(p: RecallEmailPayload): string {
  const equipName = p.equipmentLabel || p.equipmentRef;
  const overdue = p.daysUntilDue < 0;
  const headline = overdue
    ? `OVERDUE BY ${Math.abs(p.daysUntilDue)} DAY${Math.abs(p.daysUntilDue) === 1 ? "" : "S"}`
    : p.daysUntilDue === 0
      ? "DUE TODAY"
      : `DUE IN ${p.daysUntilDue} DAYS`;
  const lines: string[] = [];
  lines.push(`${SITE.name} — Calibration Reminder`);
  lines.push("");
  lines.push(`Hi ${p.customerName || "there"},`);
  lines.push("");
  lines.push(`${equipName} is ${headline}.`);
  lines.push("");
  if (p.serialNumber) lines.push(`  Serial number: ${p.serialNumber}`);
  lines.push(`  Calibration due: ${fmtDate(p.dueDate)}`);
  if (p.customerCompany) lines.push(`  Customer: ${p.customerCompany}`);
  lines.push("");
  lines.push(`Schedule: ${SITE.url}/calibration`);
  lines.push(`Or call: ${SITE.primaryPhone}`);
  lines.push("");
  lines.push(`${SITE.name} · ${SITE.email}`);
  return lines.join("\n");
}

export async function sendRecallNotification(
  payload: RecallEmailPayload,
): Promise<{ sent: boolean; reason?: string }> {
  const resend = getResendClient();
  if (!resend) return { sent: false, reason: "no_api_key" };
  try {
    const equipName = payload.equipmentLabel || payload.equipmentRef;
    const subject =
      payload.daysUntilDue < 0
        ? `Calibration overdue: ${equipName}`
        : `Calibration due ${payload.daysUntilDue === 0 ? "today" : `in ${payload.daysUntilDue} days`}: ${equipName}`;
    const result = await resend.emails.send({
      from: getResendFrom(),
      to: payload.customerEmail,
      subject,
      html: renderHtml(payload),
      text: renderText(payload),
    });
    if (result.error) {
      logError("recall-email", result.error, {
        context: { customerEmail: payload.customerEmail, equipmentRef: payload.equipmentRef },
      });
      return { sent: false, reason: result.error.message ?? "resend_error" };
    }
    return { sent: true };
  } catch (err) {
    logError("recall-email", err, {
      context: { customerEmail: payload.customerEmail, equipmentRef: payload.equipmentRef },
    });
    return {
      sent: false,
      reason: err instanceof Error ? err.message : "unknown_error",
    };
  }
}
