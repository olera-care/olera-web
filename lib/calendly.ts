/**
 * Minimal Calendly API client — just enough to register the meeting webhook
 * from the admin "Connect Calendly" button. Everything is normalized into a
 * { ok, ... } result and never throws, mirroring lib/smartlead.ts.
 *
 * Auth: a Calendly personal access token (Bearer). The org URI is resolved
 * from the token via /users/me, so the admin only pastes the token.
 *
 * Verify payload shapes against Calendly's current API before go-live.
 */

const CALENDLY_BASE = "https://api.calendly.com";

export interface CalendlyResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  status?: number;
}

async function calendlyRequest<T>(
  method: "GET" | "POST",
  path: string,
  token: string,
  body?: unknown,
): Promise<CalendlyResult<T>> {
  if (!token) return { ok: false, error: "Calendly token required" };
  try {
    const res = await fetch(`${CALENDLY_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let parsed: unknown = null;
    const text = await res.text();
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }
    if (!res.ok) {
      const message =
        (parsed && typeof parsed === "object" && "message" in parsed
          ? String((parsed as { message: unknown }).message)
          : typeof parsed === "string"
            ? parsed
            : `HTTP ${res.status}`) || `HTTP ${res.status}`;
      return { ok: false, error: message, status: res.status };
    }
    return { ok: true, data: parsed as T, status: res.status };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Resolve the token's current organization URI (needed to scope the webhook). */
export async function calendlyCurrentOrg(
  token: string,
): Promise<CalendlyResult<{ orgUri: string }>> {
  const res = await calendlyRequest<{ resource?: { current_organization?: string } }>(
    "GET",
    "/users/me",
    token,
  );
  if (!res.ok) return { ok: false, error: res.error, status: res.status };
  const orgUri = res.data?.resource?.current_organization;
  if (!orgUri) return { ok: false, error: "Could not read current organization from token" };
  return { ok: true, data: { orgUri } };
}

/**
 * Create an organization-scoped webhook subscription for invitee.created +
 * invitee.canceled, signed with `signingKey` (the same value set as
 * CALENDLY_WEBHOOK_SECRET on the edge function so it can verify signatures).
 */
export async function calendlyCreateWebhook(input: {
  token: string;
  url: string;
  orgUri: string;
  signingKey: string;
  events?: string[];
}): Promise<CalendlyResult<{ uri?: string }>> {
  const res = await calendlyRequest<{ resource?: { uri?: string } }>(
    "POST",
    "/webhook_subscriptions",
    input.token,
    {
      url: input.url,
      events: input.events ?? ["invitee.created", "invitee.canceled"],
      organization: input.orgUri,
      scope: "organization",
      signing_key: input.signingKey,
    },
  );
  if (!res.ok) return { ok: false, error: res.error, status: res.status };
  return { ok: true, data: { uri: res.data?.resource?.uri } };
}
