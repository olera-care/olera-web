/**
 * Pre-send email verification — the proactive complement to the reactive
 * bounce/complaint suppression in lib/email.ts.
 *
 * Flow:
 *   1. A batch (scripts/verify-emails.js) calls verifyAndCache() for each
 *      address ahead of a send, hitting an external provider (ZeroBounce) and
 *      writing the verdict to the email_verifications table.
 *   2. sendEmail() calls isUndeliverable() — a cache-only read — and skips
 *      addresses already known to be 'invalid'. The send path never calls the
 *      provider API, so it stays fast and cheap.
 *
 * Everything fails OPEN: with no API key, a provider error, or a missing cache
 * table, the helpers return 'unknown' / false so mail is never silently
 * blocked. The feature is a no-op until ZEROBOUNCE_API_KEY is set AND a
 * verification batch has populated the cache.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type VerificationStatus = "valid" | "invalid" | "risky" | "unknown";

export interface VerificationResult {
  email: string;
  status: VerificationStatus;
  subStatus: string | null;
  provider: string;
}

function getServiceDb(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Map a ZeroBounce `status` to our normalized verdict.
 * Definitely-bad outcomes (mailbox not found, spamtrap, abuse, do-not-mail)
 * collapse to 'invalid'. 'catch-all' is 'risky' — deliverable often enough
 * that blocking it would lose real leads. Anything unrecognized → 'unknown'.
 */
function normalizeZeroBounceStatus(status: string): VerificationStatus {
  switch (status) {
    case "valid":
      return "valid";
    case "invalid":
    case "spamtrap":
    case "abuse":
    case "do_not_mail":
      return "invalid";
    case "catch-all":
      return "risky";
    default:
      // 'unknown', and any future status we don't recognize
      return "unknown";
  }
}

/**
 * Call the configured verification provider. Returns 'unknown' (fail open) when
 * no key is configured or the request errors — never throws.
 */
export async function verifyEmailAddress(email: string): Promise<VerificationResult> {
  const normalized = normalizeEmail(email);
  const provider = process.env.EMAIL_VERIFY_PROVIDER || "zerobounce";
  const apiKey = process.env.ZEROBOUNCE_API_KEY;

  if (!apiKey || provider !== "zerobounce") {
    return { email: normalized, status: "unknown", subStatus: null, provider };
  }

  try {
    const url = `https://api.zerobounce.net/v2/validate?api_key=${encodeURIComponent(
      apiKey
    )}&email=${encodeURIComponent(normalized)}`;
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      console.error(`[email-verify] ZeroBounce HTTP ${res.status} for ${normalized}`);
      return { email: normalized, status: "unknown", subStatus: null, provider };
    }
    const data = (await res.json()) as { status?: string; sub_status?: string };
    return {
      email: normalized,
      status: normalizeZeroBounceStatus(data.status ?? ""),
      subStatus: data.sub_status || data.status || null,
      provider,
    };
  } catch (err) {
    console.error(`[email-verify] verification failed for ${normalized} (treating as unknown):`, err);
    return { email: normalized, status: "unknown", subStatus: null, provider };
  }
}

/** Read a cached verdict. Returns null if none, the table is missing, or on error. */
export async function getCachedVerification(
  email: string
): Promise<{ status: VerificationStatus; checkedAt: string } | null> {
  try {
    const db = getServiceDb();
    if (!db) return null;
    const { data } = await db
      .from("email_verifications")
      .select("status, checked_at")
      .eq("email", normalizeEmail(email))
      .maybeSingle();
    if (!data) return null;
    return { status: data.status as VerificationStatus, checkedAt: data.checked_at };
  } catch {
    return null;
  }
}

/** Upsert a verdict into the cache. Best-effort; never throws. */
export async function cacheVerification(result: VerificationResult): Promise<void> {
  try {
    const db = getServiceDb();
    if (!db) return;
    await db.from("email_verifications").upsert(
      {
        email: result.email,
        status: result.status,
        sub_status: result.subStatus,
        provider: result.provider,
        checked_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );
  } catch (err) {
    console.error("[email-verify] cache write failed:", err);
  }
}

/**
 * Return a cached verdict if it's fresher than maxAgeDays; otherwise verify via
 * the provider, cache the result, and return it. Used by the batch script.
 */
export async function verifyAndCache(
  email: string,
  maxAgeDays = 90
): Promise<VerificationResult> {
  const normalized = normalizeEmail(email);
  const cached = await getCachedVerification(normalized);
  if (cached) {
    const ageMs = Date.now() - new Date(cached.checkedAt).getTime();
    if (ageMs < maxAgeDays * 86400000) {
      return { email: normalized, status: cached.status, subStatus: null, provider: "cache" };
    }
  }
  const result = await verifyEmailAddress(normalized);
  // Don't cache 'unknown' — it's usually "couldn't check" (no key / error), not
  // a real verdict, so caching it would suppress nothing and block re-checks.
  if (result.status !== "unknown") {
    await cacheVerification(result);
  }
  return result;
}

/**
 * Cache-only check used by the send path. True only when we have a cached
 * verdict of 'invalid'. Never calls the provider; fails open (false) so a send
 * is never blocked by a missing cache or a read error.
 */
export async function isUndeliverable(email: string): Promise<boolean> {
  const cached = await getCachedVerification(email);
  return cached?.status === "invalid";
}
