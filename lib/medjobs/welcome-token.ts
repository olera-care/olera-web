/**
 * Magic-link welcome token — HMAC-SHA256 signed compact token used in the
 * cold-provider outreach CTA URLs. Phase 2+3 Bullet 1 (2026-06-04).
 *
 * Format: `<headerB64>.<payloadB64>.<sigB64>`
 *   - headerB64 = base64url("v1")  // versioning hook for future algo changes
 *   - payloadB64 = base64url(JSON.stringify({ outreach_id, email, expires_at, jti }))
 *   - sigB64 = base64url(HMAC-SHA256(secret, "<headerB64>.<payloadB64>"))
 *
 * We hand-roll the format (rather than pulling in jsonwebtoken/jose) because
 * we control both ends + don't need asymmetric algorithms. Smaller bundle,
 * no third-party dependency to keep in sync, easier to audit.
 *
 * Security model:
 *   - Single shared secret in `MEDJOBS_MAGIC_LINK_SECRET`. Rotation = revoke
 *     all outstanding tokens (rare but possible).
 *   - 30-day TTL per Q5 decision.
 *   - One-shot redemption via the JTI ledger (see Bullet 3 route handler) —
 *     a touchpoint `note_added(reason: "platform_visited", payload: { jti })`
 *     marks a JTI as consumed. Second click → "this link was already used."
 *   - Email is part of the signed payload, so a token can't be reused with a
 *     different email even by an attacker who learns the JTI.
 */

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

/** Payload claims. Kept narrow on purpose — anything we'd want in the
 *  payload is already accessible from `outreach_id` via the DB lookup. */
export interface WelcomePayload {
  outreach_id: string;
  /** Lower-cased recipient email. Cross-checked against the outreach row
   *  in the landing route as defense in depth. */
  email: string;
  /** Unix-ms timestamp. 30 days from sign time. */
  expires_at: number;
  /** Random UUID per token; one-shot redemption guard. */
  jti: string;
}

const HEADER = "v1";
const HEADER_B64 = base64UrlEncode(Buffer.from(HEADER, "utf8"));

export function freshJti(): string {
  return randomUUID();
}

export function signWelcomeToken(
  payload: WelcomePayload,
  secret: string,
): string {
  if (!secret) {
    throw new Error("signWelcomeToken: secret is required");
  }
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(Buffer.from(payloadJson, "utf8"));
  const signingInput = `${HEADER_B64}.${payloadB64}`;
  const sig = createHmac("sha256", secret).update(signingInput).digest();
  const sigB64 = base64UrlEncode(sig);
  return `${signingInput}.${sigB64}`;
}

export type VerifyResult =
  | { ok: true; payload: WelcomePayload }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" | "bad_payload" };

export function verifyWelcomeToken(token: string, secret: string): VerifyResult {
  if (!secret) {
    throw new Error("verifyWelcomeToken: secret is required");
  }
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };
  const [headerB64, payloadB64, sigB64] = parts;
  if (headerB64 !== HEADER_B64) return { ok: false, reason: "malformed" };

  // Recompute the expected signature; constant-time compare via Node's
  // timingSafeEqual after byte-length normalization.
  const expectedSig = createHmac("sha256", secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest();
  let providedSig: Buffer;
  try {
    providedSig = base64UrlDecode(sigB64);
  } catch {
    return { ok: false, reason: "bad_signature" };
  }
  if (providedSig.length !== expectedSig.length) {
    return { ok: false, reason: "bad_signature" };
  }
  if (!timingSafeEqual(providedSig, expectedSig)) {
    return { ok: false, reason: "bad_signature" };
  }

  // Signature good — decode payload.
  let payload: WelcomePayload;
  try {
    const payloadJson = base64UrlDecode(payloadB64).toString("utf8");
    payload = JSON.parse(payloadJson) as WelcomePayload;
  } catch {
    return { ok: false, reason: "bad_payload" };
  }

  // Shape check + expiry.
  if (
    typeof payload.outreach_id !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.expires_at !== "number" ||
    typeof payload.jti !== "string"
  ) {
    return { ok: false, reason: "bad_payload" };
  }
  if (payload.expires_at <= Date.now()) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, payload };
}

/** Build the cold-provider landing URL. Token TTL = 30 days from now (Q5). */
export function buildWelcomeUrl(
  params: {
    outreach_id: string;
    email: string;
    site_url?: string;
    /** Activation-cadence links: append ?a=1 so the landing route carries
     *  activate=1 to the board and the Terms modal auto-opens. */
    activate?: boolean;
  },
  secret: string,
): string {
  const siteUrl = (params.site_url ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://olera.care").replace(/\/+$/, "");
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const payload: WelcomePayload = {
    outreach_id: params.outreach_id,
    email: params.email.trim().toLowerCase(),
    expires_at: expiresAt,
    jti: freshJti(),
  };
  const token = signWelcomeToken(payload, secret);
  const base = `${siteUrl}/medjobs/m/${encodeURIComponent(token)}`;
  return params.activate ? `${base}?a=1` : base;
}

/** Build the Recruitment Partner Portal URL (Chunk 3.1). Same signed token as
 *  the provider welcome link, but the token IS the access credential for the
 *  portal — partners are stakeholder rows with no business_profile/account, so
 *  we don't route them through the provider auth/session flow. 30-day TTL. */
export function buildPartnerPortalUrl(
  params: { outreach_id: string; email: string; site_url?: string },
  secret: string,
): string {
  const siteUrl = (params.site_url ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://olera.care").replace(/\/+$/, "");
  const payload: WelcomePayload = {
    outreach_id: params.outreach_id,
    email: params.email.trim().toLowerCase(),
    expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000,
    jti: freshJti(),
  };
  const token = signWelcomeToken(payload, secret);
  return `${siteUrl}/medjobs/partner/${encodeURIComponent(token)}`;
}

// ── Base64url helpers ───────────────────────────────────────────────────

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(s: string): Buffer {
  // Restore padding for atob compatibility.
  const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
  const padded = s + "=".repeat(pad);
  const normalized = padded.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64");
}
