import { cookies } from "next/headers";

/**
 * Google Ads conversion marking for lead events.
 *
 * The Ads conversion ("Provider inquiry (lead form)", AW-10943251086) must be
 * fired client-side by gtag so Google can join it to the ad click via its own
 * _gcl_aw cookie — but a family inquiry completes inside a server route, deep
 * in one of ~10 different client flows. Rather than teach every flow to fire
 * the conversion, each lead route calls `markAdsLeadConversion()` when it
 * records a `lead_received` event: it sets a short-lived one-shot cookie on the
 * response, and AdsConversionPing (mounted in the root layout) watches for the
 * cookie, fires the gtag conversion, and clears it. Same single-choke-point
 * philosophy as the managed-UTM cookie (lib/ad-boost/managed-utm.ts).
 *
 * Must be AWAITED by callers before returning their response — the cookie
 * rides on the response headers, so setting it after the response is sent
 * silently does nothing (see feedback on serverless fire-and-forget).
 */

export const ADS_CONVERSION_COOKIE = "olera_adconv";
/** 10 minutes — the watcher clears it within seconds; TTL is just a backstop. */
const ADS_CONVERSION_MAX_AGE_S = 10 * 60;

export async function markAdsLeadConversion(): Promise<void> {
  try {
    const store = await cookies();
    store.set(ADS_CONVERSION_COOKIE, "1", {
      path: "/",
      maxAge: ADS_CONVERSION_MAX_AGE_S,
      sameSite: "lax",
      // NOT httpOnly — the client watcher must read and clear it.
    });
  } catch {
    // Outside a request scope (cron/backfill) — no browser to convert, skip.
  }
}
