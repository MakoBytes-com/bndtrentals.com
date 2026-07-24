// Outbound calls FROM BNDT TO the master control plane
// (portal.makoai.studio). Each call signs a fresh tenant JWT (RS256, kid from
// TENANT_PUBLIC_KEY_KID, ttl 60s, jti per-call) and presents it as a Bearer
// token. Master verifies via the public key it has on file in
// client_endpoints.public_key_pem.
//
// Server-only — these helpers reach for TENANT_PRIVATE_KEY which must never
// leak to the client bundle.

import "server-only";

import { signTenantToken } from "@/lib/master-jwt";
import { logError } from "@/lib/log";

const MASTER_API_URL =
  process.env.MASTER_API_URL ?? "https://portal.makoai.studio";

const FETCH_TIMEOUT_MS = 10_000;

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms: number,
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export type MasterTicket = {
  id: string;
  client_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  updated_at: string;
};

export type FetchTicketsResult =
  | { ok: true; tickets: MasterTicket[] }
  | { ok: false; error: string };

export type SubmitTicketInput = {
  actorUserId: string;
  title: string;
  description: string;
  category?: "quick_change" | "feature" | "bug" | "not_sure";
  priority?: "low" | "normal" | "high";
};

export type SubmitTicketResult =
  | { ok: true; ticket: MasterTicket }
  | { ok: false; error: string };

// Boundary allow-list: even if a future master regression re-leaks an
// operator-only field (internal_notes etc.), it never reaches this CP.
function pickTicket(row: Record<string, unknown>): MasterTicket {
  return {
    id: String(row.id ?? ""),
    client_id: String(row.client_id ?? ""),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    status: String(row.status ?? ""),
    priority: String(row.priority ?? ""),
    category: String(row.category ?? ""),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

const COMMON_HEADERS = {
  // Identify as a Mako-fleet server-to-server call (fleet convention).
  "user-agent": "Mako-Fleet/1.0 (+https://portal.makoai.studio)",
  accept: "application/json",
};

/**
 * Fetch this client's tickets from master. `actorUserId` rides as the JWT
 * subject so master's audit log can attribute the call to a specific admin
 * user rather than just the CP itself.
 */
export async function fetchMasterTickets(opts: {
  actorUserId: string;
  limit?: number;
  since?: string;
}): Promise<FetchTicketsResult> {
  let token: string;
  try {
    token = await signTenantToken({
      scope: "tickets.read",
      actorUserId: opts.actorUserId,
      ttlSeconds: 60,
    });
  } catch (e) {
    logError("master-api", e);
    return {
      ok: false,
      error:
        "Support connection isn't configured yet (missing tenant keys). Mako has been notified.",
    };
  }

  const url = new URL("/api/tickets", MASTER_API_URL);
  if (opts.limit) url.searchParams.set("limit", String(opts.limit));
  if (opts.since) url.searchParams.set("since", opts.since);

  try {
    const res = await fetchWithTimeout(
      url.toString(),
      {
        headers: { ...COMMON_HEADERS, authorization: `Bearer ${token}` },
        cache: "no-store",
      },
      FETCH_TIMEOUT_MS,
    );
    if (!res.ok) {
      const body = await res.text();
      logError("master-api", `tickets ${res.status}: ${body.slice(0, 200)}`);
      return {
        ok: false,
        error: "Couldn't reach Mako support right now — try again in a minute.",
      };
    }
    const data = (await res.json()) as {
      ok?: boolean;
      tickets?: Array<Record<string, unknown>>;
    };
    return { ok: true, tickets: (data.tickets ?? []).map(pickTicket) };
  } catch (e) {
    logError("master-api", e);
    return {
      ok: false,
      error: "Couldn't reach Mako support right now — try again in a minute.",
    };
  }
}

/**
 * File a new ticket. Master scopes the ticket to the client_id from the JWT
 * issuer, so this CP can never file tickets for another client. Status is
 * always "new" at insert time; Mako triages master-side.
 */
export async function submitMasterTicket(
  input: SubmitTicketInput,
): Promise<SubmitTicketResult> {
  let token: string;
  try {
    token = await signTenantToken({
      scope: "tickets.write",
      actorUserId: input.actorUserId,
      ttlSeconds: 60,
    });
  } catch (e) {
    logError("master-api", e);
    return {
      ok: false,
      error:
        "Support connection isn't configured yet (missing tenant keys). Mako has been notified.",
    };
  }

  try {
    const res = await fetchWithTimeout(
      `${MASTER_API_URL}/api/tickets`,
      {
        method: "POST",
        headers: {
          ...COMMON_HEADERS,
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: input.title,
          description: input.description,
          category: input.category ?? "not_sure",
          priority: input.priority ?? "normal",
        }),
        cache: "no-store",
      },
      FETCH_TIMEOUT_MS,
    );
    if (!res.ok) {
      const body = await res.text();
      logError("master-api", `ticket POST ${res.status}: ${body.slice(0, 200)}`);
      return {
        ok: false,
        error: "Couldn't send the ticket — try again in a minute.",
      };
    }
    const data = (await res.json()) as {
      ok?: boolean;
      ticket?: Record<string, unknown>;
    };
    if (!data.ticket) {
      return { ok: false, error: "Sent, but no confirmation came back — refresh to check." };
    }
    return { ok: true, ticket: pickTicket(data.ticket) };
  } catch (e) {
    logError("master-api", e);
    return {
      ok: false,
      error: "Couldn't send the ticket — try again in a minute.",
    };
  }
}
