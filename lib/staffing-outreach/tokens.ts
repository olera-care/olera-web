/**
 * Magic-link tokens for the Staffing Outreach pilot.
 *
 * Format: base64url(payload).hex(hmac-sha256(payload, secret))
 *
 * Payload fields (signed):
 *   - oid: outreach row id
 *   - cid: contact row id
 *   - pid: provider id (text)
 *   - exp: unix seconds expiry
 *
 * Signed here in PR 2 (used in Step 1 email links). Verified in PR 4
 * by the magic-link route handler that mints a Supabase session.
 *
 * Secret env var: STAFFING_PILOT_TOKEN_SECRET
 */

import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.STAFFING_PILOT_TOKEN_SECRET ?? "";
const DEFAULT_TTL_DAYS = 60;

export interface StaffingPilotTokenPayload {
  oid: string;
  cid: string;
  pid: string;
  exp: number; // unix seconds
}

function toBase64Url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromBase64Url(s: string): Buffer {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 ? 4 - (padded.length % 4) : 0;
  return Buffer.from(padded + "=".repeat(pad), "base64");
}

export function signStaffingPilotToken(
  payload: Omit<StaffingPilotTokenPayload, "exp">,
  ttlDays: number = DEFAULT_TTL_DAYS,
): string {
  if (!SECRET) {
    throw new Error("STAFFING_PILOT_TOKEN_SECRET is not configured");
  }
  const exp = Math.floor(Date.now() / 1000) + ttlDays * 86400;
  const full: StaffingPilotTokenPayload = { ...payload, exp };
  const body = toBase64Url(Buffer.from(JSON.stringify(full)));
  const sig = createHmac("sha256", SECRET).update(body).digest("hex");
  return `${body}.${sig}`;
}

export function verifyStaffingPilotToken(
  token: string,
): StaffingPilotTokenPayload | null {
  if (!SECRET) return null;
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", SECRET).update(body).digest("hex");
  if (
    expected.length !== sig.length ||
    !timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(sig, "hex"))
  ) {
    return null;
  }
  let payload: StaffingPilotTokenPayload;
  try {
    payload = JSON.parse(fromBase64Url(body).toString("utf-8"));
  } catch {
    return null;
  }
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

/**
 * Build the activation URL for the Step 1 email and follow-ups. The
 * route handler at this path is shipped in PR 4; until then the URL
 * 404s but the link format is final.
 */
export function buildStaffingPilotActivationUrl(
  payload: Omit<StaffingPilotTokenPayload, "exp">,
  baseUrl: string,
): string {
  const token = signStaffingPilotToken(payload);
  return `${baseUrl}/api/medjobs/staffing-pilot?token=${encodeURIComponent(token)}`;
}
