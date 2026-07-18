import type { SupabaseClient } from "@supabase/supabase-js";
import type { GoogleReviewsData } from "@/lib/types";

/**
 * Google-reviews refresh cron data access — behind the front door.
 *
 * The monthly `google-reviews` cron reads which providers to refresh and writes
 * the refreshed cache back. This is the first provider-table WRITE to move
 * behind the door (`updateProviderGoogleReviews`); the reads come along so the
 * cron touches no `.from("olera-providers"/"business_profiles")` directly.
 * Relocated parity-first from `app/api/cron/google-reviews/route.ts`.
 */

/**
 * Slugs of providers that have CLAIMED their page (`claim_state = 'claimed'`).
 * Returned as a Set for the cron's tier-1 membership check. (Distinct from the
 * sitemap's `getActiveClaimedProviderSlugs`, which keys off `is_active`.)
 */
export async function getClaimedProviderSlugs(
  db: SupabaseClient,
): Promise<Set<string>> {
  const { data } = await db
    .from("business_profiles")
    .select("slug")
    .eq("claim_state", "claimed")
    .not("slug", "is", null);
  return new Set((data ?? []).map((r) => (r as { slug: string }).slug));
}

export interface ReviewRefreshProvider {
  provider_id: string;
  place_id: string;
  slug: string | null;
  google_reviews_data: GoogleReviewsData | null;
  last_viewed_at: string | null;
}

/**
 * Active providers with a `place_id` (refresh candidates). The cron tiers these
 * by claim/recency/staleness. Throws on a DB error so the cron surfaces a 500
 * (matching the original's `if (fetchErr) return 500`).
 */
export async function getProvidersForReviewRefresh(
  db: SupabaseClient,
): Promise<ReviewRefreshProvider[]> {
  const { data, error } = await db
    .from("olera-providers")
    .select("provider_id, place_id, slug, google_reviews_data, last_viewed_at")
    .eq("deleted", false)
    .not("place_id", "is", null)
    .limit(5000);

  if (error) {
    console.error("[google-reviews-cron] Failed to fetch providers:", error);
    throw error;
  }
  return (data ?? []) as ReviewRefreshProvider[];
}

/**
 * Write the refreshed Google reviews cache for one provider. Throws on error so
 * the cron's per-provider `Promise.allSettled` records it as a failure (matching
 * the original inline update).
 */
export async function updateProviderGoogleReviews(
  providerId: string,
  data: GoogleReviewsData,
  db: SupabaseClient,
): Promise<void> {
  const { error } = await db
    .from("olera-providers")
    .update({ google_reviews_data: data })
    .eq("provider_id", providerId);

  if (error) {
    console.error(`[google-reviews-cron] Update failed for ${providerId}:`, error);
    throw error;
  }
}
