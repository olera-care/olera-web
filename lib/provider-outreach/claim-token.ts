/**
 * Provider Outreach Claim Token — generates claim URLs for cold outreach emails.
 *
 * Used by the provider_claim email sequence (Provider Outreach → SmartLead).
 * When an unclaimed provider clicks the "Claim your profile" link in a cold
 * email, this token auto-authenticates them into the claim flow.
 *
 * Token format is compatible with lib/claim-tokens.ts so we can reuse the
 * existing /provider/{slug}/onboard flow and /api/claim/validate-token route.
 * Key differences from regular claim tokens:
 *   - 30-day TTL (vs 72-hour default) — matches the cadence length
 *   - Includes tracking_id for attribution analytics
 *   - Includes city for email personalization
 *
 * The existing validate-token route ignores extra fields, so tracking_id/city
 * pass through safely. Attribution tracking happens when we record the visit.
 */

import { createHmac } from "crypto";

const TOKEN_SECRET =
  process.env.CLAIM_TOKEN_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "fallback-secret";

/** TTL for outreach claim tokens: 30 days (matches cadence length). */
export const CLAIM_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Outreach-specific payload with attribution fields. */
interface OutreachTokenPayload {
  /** provider_id from olera-providers (UUID). */
  providerId: string;
  /** Lower-cased recipient email. */
  email: string;
  /** Unix-ms expiration timestamp. */
  expiresAt: number;
  /** City for email personalization (e.g., "Families in {city}"). */
  city?: string;
  /** Links to provider_outreach_tracking.id for attribution. */
  trackingId?: string | null;
}

interface OutreachTokenData extends OutreachTokenPayload {
  signature: string;
}

/**
 * Generate signature using the same algorithm as lib/claim-tokens.ts.
 * The signature covers providerId:email:expiresAt — same as the main lib.
 */
function generateSignature(payload: OutreachTokenPayload): string {
  const data = `${payload.providerId}:${payload.email}:${payload.expiresAt}`;
  return createHmac("sha256", TOKEN_SECRET).update(data).digest("hex").slice(0, 32);
}

/**
 * Generate a claim token for cold outreach emails.
 * Compatible with lib/claim-tokens.ts format but with extended fields.
 */
export function generateOutreachToken(
  providerId: string,
  email: string,
  options?: {
    city?: string;
    trackingId?: string | null;
  },
): string {
  const expiresAt = Date.now() + CLAIM_TOKEN_TTL_MS;

  const payload: OutreachTokenPayload = {
    providerId,
    email: email.trim().toLowerCase(),
    expiresAt,
    city: options?.city,
    trackingId: options?.trackingId ?? null,
  };
  const signature = generateSignature(payload);

  const tokenData: OutreachTokenData = { ...payload, signature };
  const jsonString = JSON.stringify(tokenData);

  // Base64url encode (same format as lib/claim-tokens.ts).
  return Buffer.from(jsonString)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Validate and decode an outreach claim token.
 * This is the full validation including outreach-specific fields.
 * For basic validation that reuses the existing flow, the token also
 * works with lib/claim-tokens.ts validateClaimToken().
 */
export function validateOutreachToken(
  token: string,
):
  | { valid: true; providerId: string; email: string; city?: string; trackingId?: string | null }
  | { valid: false; error: string } {
  try {
    // Base64url decode.
    const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const jsonString = Buffer.from(base64, "base64").toString("utf-8");
    const tokenData: OutreachTokenData = JSON.parse(jsonString);

    const { providerId, email, expiresAt, signature, city, trackingId } = tokenData;

    // Check required fields.
    if (!providerId || !email || !expiresAt || !signature) {
      return { valid: false, error: "Invalid token format" };
    }

    // Check expiry.
    if (Date.now() > expiresAt) {
      return { valid: false, error: "Token has expired" };
    }

    // Verify signature.
    const expectedSignature = generateSignature({ providerId, email, expiresAt });
    if (signature !== expectedSignature) {
      return { valid: false, error: "Invalid token signature" };
    }

    return { valid: true, providerId, email, city, trackingId };
  } catch {
    return { valid: false, error: "Failed to parse token" };
  }
}

/**
 * Build the claim URL for a cold outreach email.
 *
 * Routes to the existing onboard flow at /provider/{slug}/onboard with
 * action=outreach, signaling this is a cold-outreach click for analytics.
 * The token is passed as `otk` and validated by the existing claim flow.
 */
export function buildClaimUrl(params: {
  provider_id: string;
  provider_slug: string;
  email: string;
  city: string;
  tracking_id?: string | null;
  site_url?: string;
}): string {
  const siteUrl = (
    params.site_url ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://olera.care"
  ).replace(/\/+$/, "");

  const token = generateOutreachToken(params.provider_id, params.email, {
    city: params.city,
    trackingId: params.tracking_id,
  });

  // Route to the onboard page with action=outreach for attribution tracking.
  const url = new URL(`${siteUrl}/provider/${params.provider_slug}/onboard`);
  url.searchParams.set("action", "outreach");
  url.searchParams.set("otk", token);
  return url.toString();
}

/**
 * Extract tracking data from a token for attribution logging.
 * Use this when recording outreach visits for analytics.
 */
export function extractTrackingData(token: string): {
  trackingId?: string | null;
  city?: string;
  providerId?: string;
} | null {
  const result = validateOutreachToken(token);
  if (!result.valid) return null;
  return {
    trackingId: result.trackingId,
    city: result.city,
    providerId: result.providerId,
  };
}
