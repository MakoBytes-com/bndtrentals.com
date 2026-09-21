import "server-only";

// Outbound email through Cloudflare Email Service. bndtrentals.com is
// onboarded as a sending domain on the Cloudflare account, so every From
// address used here must be @bndtrentals.com or Cloudflare will refuse the
// send. Migrated from Resend — call sites and behavior are unchanged, only
// the transport moved.
//
// Never throws. A caller that expects a mail to go out gets `ok: false` and
// a plain-English reason, so it can decide whether the user needs to know.
//
// SERVER ONLY.

/** Default From, overridable per deployment with MAIL_FROM. Matches the
 *  address bndtrentals.com sent quote notifications from under Resend. */
export function getMailFrom(): string {
  return process.env.MAIL_FROM ?? "Burton NDT Rentals <quotes@bndtrentals.com>";
}

/** Where quote/contact form notifications land. Defaults to Burton's
 *  published information@ address; overridable with MAIL_NOTIFICATION_TO. */
export function getMailNotificationTo(): string {
  return process.env.MAIL_NOTIFICATION_TO ?? "information@bndtrentals.com";
}

/** Last-resort recipient for a non-production deployment, used only if
 *  MAIL_NOTIFICATION_TO is not set on it. Never a client address. */
const SAFE_NON_PRODUCTION_RECIPIENT = "rsailors@makologics.com";

/** Only a real production deployment may send to a real address. Vercel sets
 *  VERCEL_ENV to production | preview | development; it is undefined during
 *  local `next dev`. Anything that is not explicitly "production" is treated
 *  as unsafe, so a preview build or a laptop cannot email Burton or — via the
 *  calibration recall job, which addresses customers directly — their
 *  customers. Production behavior is unchanged. */
function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === "production";
}

function redirectRecipient(to: string): {
  to: string;
  redirectedFrom?: string;
} {
  if (isProductionDeployment()) return { to };
  const safe = process.env.MAIL_NOTIFICATION_TO ?? SAFE_NON_PRODUCTION_RECIPIENT;
  if (safe === to) return { to };
  return { to: safe, redirectedFrom: to };
}

export function mailEnabled(): boolean {
  return Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_EMAIL_TOKEN,
  );
}

export interface MailResult {
  ok: boolean;
  error?: string;
  /** Cloudflare's message id. */
  id?: string;
}

interface SendResponse {
  success?: boolean;
  errors?: { code?: number; message?: string }[];
  result?: {
    message_id?: string;
    delivered?: string[];
    queued?: string[];
    permanent_bounces?: string[];
    suppressed_recipients?: string[];
  };
}

export async function sendMail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  /** Defaults to getMailFrom(). */
  from?: string;
  /** Only sent when provided — some call sites (recall reminders) never set
   *  a reply-to, matching the previous Resend behavior exactly. */
  replyTo?: string;
}): Promise<MailResult> {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_EMAIL_TOKEN;
  if (!account || !token) {
    console.error(
      "[mail] CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_EMAIL_TOKEN missing. Mail NOT sent:",
      input.subject,
    );
    return { ok: false, error: "Email is not configured on this deployment." };
  }

  const { to, redirectedFrom } = redirectRecipient(input.to);
  if (redirectedFrom) {
    console.warn(
      `[mail] non-production deployment (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"}): recipient redirected to ${to}. Original recipient NOT emailed.`,
    );
  }
  const subject = redirectedFrom
    ? `[${process.env.VERCEL_ENV ?? "local"} — would have gone to ${redirectedFrom}] ${input.subject}`
    : input.subject;

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${account}/email/sending/send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: input.from ?? getMailFrom(),
          to,
          ...(input.replyTo ? { reply_to: input.replyTo } : {}),
          subject,
          text: input.text,
          ...(input.html ? { html: input.html } : {}),
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      },
    );

    const json = (await res.json().catch(() => ({}))) as SendResponse;
    if (!res.ok || !json.success) {
      const why =
        json.errors?.map((e) => e.message).filter(Boolean).join("; ") ||
        `HTTP ${res.status}`;
      console.error("[mail] Cloudflare rejected the message:", why);
      return { ok: false, error: why };
    }

    const bounced = json.result?.permanent_bounces ?? [];
    const suppressed = json.result?.suppressed_recipients ?? [];
    if (bounced.includes(to) || suppressed.includes(to)) {
      const why = bounced.includes(to)
        ? "That address bounced permanently."
        : "That address is on the suppression list.";
      console.error("[mail] not deliverable:", to, why);
      return { ok: false, error: why };
    }

    return { ok: true, id: json.result?.message_id };
  } catch (err) {
    console.error("[mail] send failed:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "send failed",
    };
  }
}
