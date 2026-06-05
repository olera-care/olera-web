/**
 * Claim Token Utilities
 *
 * Generates and validates signed tokens for email campaign claim links.
 * Tokens are self-validating using HMAC-SHA256 signatures.
 *
 * Token format: base64url({ providerId, email, expiresAt, signature })
 */

import { createHmac } from "crypto";

const TOKEN_SECRET = process.env.CLAIM_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback-secret";
const TOKEN_EXPIRY_HOURS = 72; // 3 days for email campaign links

interface TokenPayload {
  providerId: string;
  email: string;
  expiresAt: number;
}

interface TokenData extends TokenPayload {
  signature: string;
}

/**
 * Generate signature for token payload
 */
function generateSignature(payload: TokenPayload): string {
  const data = `${payload.providerId}:${payload.email}:${payload.expiresAt}`;
  return createHmac("sha256", TOKEN_SECRET).update(data).digest("hex").slice(0, 32);
}

/**
 * Generate a claim token for email campaigns
 */
export function generateClaimToken(providerId: string, email: string): string {
  const expiresAt = Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;

  const payload: TokenPayload = { providerId, email, expiresAt };
  const signature = generateSignature(payload);

  const tokenData: TokenData = { ...payload, signature };
  const jsonString = JSON.stringify(tokenData);

  // Base64url encode
  return Buffer.from(jsonString)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Validate and decode a claim token
 *
 * Returns partial data (providerId, email) even when validation fails,
 * allowing callers to redirect to appropriate fallback pages.
 */
export function validateClaimToken(
  token: string
):
  | { valid: true; providerId: string; email: string }
  | { valid: false; error: string; providerId?: string; email?: string } {
  try {
    // Base64url decode
    const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const jsonString = Buffer.from(base64, "base64").toString("utf-8");
    const tokenData: TokenData = JSON.parse(jsonString);

    const { providerId, email, expiresAt, signature } = tokenData;

    // Check required fields
    if (!providerId || !email || !expiresAt || !signature) {
      return { valid: false, error: "Invalid token format", providerId, email };
    }

    // Check expiry - still return providerId/email for fallback redirects
    if (Date.now() > expiresAt) {
      return { valid: false, error: "Token has expired", providerId, email };
    }

    // Verify signature - still return providerId/email for fallback redirects
    const expectedSignature = generateSignature({ providerId, email, expiresAt });
    if (signature !== expectedSignature) {
      return { valid: false, error: "Invalid token signature", providerId, email };
    }

    return { valid: true, providerId, email };
  } catch {
    return { valid: false, error: "Failed to parse token" };
  }
}

/**
 * Generate a claim URL for email campaigns
 * Routes to the provider onboard page which handles the full claim flow
 */
export function generateClaimUrl(
  providerId: string,
  providerSlug: string,
  email: string,
  baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || "https://olera.care",
  options?: {
    headline?: string;
    message?: string;
  }
): string {
  const token = generateClaimToken(providerId, email);
  const url = new URL(`${baseUrl}/provider/${providerSlug}/onboard`);
  url.searchParams.set("action", "campaign");
  url.searchParams.set("otk", token);
  if (options?.headline) {
    url.searchParams.set("headline", options.headline);
  }
  if (options?.message) {
    url.searchParams.set("message", options.message);
  }
  return url.toString();
}

/**
 * Generate a notification URL with embedded claim token.
 * Used for lead/question/review email links — enables one-click access.
 */
export function generateNotificationUrl(
  providerSlug: string,
  email: string,
  action: "lead" | "question" | "review",
  actionId: string,
  baseUrl: string = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care"
): string {
  const token = generateClaimToken(providerSlug, email);
  const url = new URL(`${baseUrl}/provider/${providerSlug}/onboard`);
  url.searchParams.set("action", action);
  url.searchParams.set("actionId", actionId);
  url.searchParams.set("otk", token);
  return url.toString();
}

/**
 * Generate a provider portal URL with embedded claim token.
 * Used for email footer links (manage listing, settings) — enables one-click sign-in.
 *
 * @param providerSlug - Provider's slug or ID
 * @param email - Provider's email for token generation
 * @param destination - Portal destination: "manage" (dashboard) or "settings"
 * @param baseUrl - Base URL (defaults to NEXT_PUBLIC_SITE_URL)
 */
export function generateProviderPortalUrl(
  providerSlug: string,
  email: string,
  destination: "manage" | "settings",
  baseUrl: string = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care"
): string {
  const token = generateClaimToken(providerSlug, email);
  const url = new URL(`${baseUrl}/provider/${providerSlug}/onboard`);
  url.searchParams.set("action", destination);
  url.searchParams.set("otk", token);
  return url.toString();
}

/**
 * Generate a MedJobs notification URL with embedded claim token.
 * Used for interview email links — routes to the one-click claim handler
 * which authenticates the provider and redirects to their calendar in a
 * single server response (no client-side auth race).
 *
 * Note: `providerSlug` is kept in the API surface for backward compatibility
 * with existing callers; it's included in the token payload but the
 * destination route is the same for all MedJobs interview links.
 */
export function generateMedJobsNotificationUrl(
  providerSlug: string,
  email: string,
  action: "interview",
  actionId: string,
  baseUrl: string = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care"
): string {
  const token = generateClaimToken(providerSlug, email);
  const url = new URL(`${baseUrl}/api/medjobs/claim-${action}`);
  url.searchParams.set("interviewId", actionId);
  url.searchParams.set("otk", token);
  return url.toString();
}

/**
 * Generate a lead claim URL with embedded claim token.
 * Routes to /api/claim-lead which handles server-side authentication
 * and redirects directly to /provider/connections.
 *
 * This is the preferred method for lead notification emails as it:
 * - Skips the onboard page entirely
 * - Authenticates server-side (no client-side auth race)
 * - Redirects directly to the leads page
 * - Reduces friction → higher view rates
 *
 * @param providerSlug - Provider's slug or ID (used for token + profile lookup)
 * @param email - Provider's email for token generation
 * @param connectionId - Optional. If provided, redirects to that specific lead.
 *                       If omitted, redirects to the connections list view.
 * @param baseUrl - Base URL (defaults to NEXT_PUBLIC_SITE_URL)
 */
export function generateLeadClaimUrl(
  providerSlug: string,
  email: string,
  connectionId?: string | null,
  baseUrl: string = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care"
): string {
  const token = generateClaimToken(providerSlug, email);
  const url = new URL(`${baseUrl}/api/claim-lead`);
  url.searchParams.set("otk", token);
  if (connectionId) {
    url.searchParams.set("connectionId", connectionId);
  }
  return url.toString();
}
