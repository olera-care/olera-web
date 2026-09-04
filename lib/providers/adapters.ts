import { iosProviderToProfile } from "@/lib/mock-providers";
import {
  SUPABASE_CAT_TO_PROFILE_CATEGORY,
  type Provider as IOSProvider,
} from "@/lib/types/provider";
import type { Profile, GoogleReviewsData } from "@/lib/types";
import type { ProviderView } from "./types";

/**
 * Normalize an `olera-providers` (directory) row into a `ProviderView`.
 * Wraps the existing `iosProviderToProfile` mapper and lifts the side-channel
 * fields (google/cms/trust/place/parent) the detail page reads alongside.
 */
export function directoryRowToProvider(row: IOSProvider): ProviderView {
  return {
    profile: iosProviderToProfile(row),
    source: "directory",
    rawProviderId: row.provider_id,
    placeId: row.place_id ?? null,
    googleReviewsData: row.google_reviews_data ?? null,
    cmsData: row.cms_data ?? null,
    aiTrustSignals: row.ai_trust_signals ?? null,
    parentOrganization: row.parent_organization ?? null,
  };
}

/**
 * Normalize a claimed `business_profiles` (account) row into a `ProviderView`.
 *
 * Provider-authored fields come from the account row — that's the point of a
 * claim. The side-channel fields do NOT: Google reviews, the Place ID, CMS
 * quality, trust signals and franchise parentage are all external data the
 * provider never types, and they live on the linked directory row. So the
 * account row wins where it has its own value and the directory row supplies
 * the rest.
 *
 * Passing `directoryRow` is what makes that inheritance possible. Before
 * `e8bce717a` the detail page rendered the directory row outright for a claimed
 * provider, so these fields were always present; that commit introduced
 * "prefer the claimed record" and the side-channel data silently went null with
 * it. Claiming a listing should not blank a provider's star rating.
 */
export function accountRowToProvider(
  row: Profile,
  directoryRow: IOSProvider | null = null,
): ProviderView {
  const directoryCategory = directoryRow?.provider_category ?? null;
  const inheritedCategory = directoryCategory
    ? SUPABASE_CAT_TO_PROFILE_CATEGORY[directoryCategory]
    : undefined;
  const profile = !row.category && inheritedCategory
    ? { ...row, category: inheritedCategory }
    : row;
  const meta = row.metadata as Record<string, unknown> | null;
  const gm = meta?.google_metadata as { place_id?: string } | undefined;
  const bpGoogleReviews = meta?.google_reviews_data as GoogleReviewsData | undefined;
  return {
    profile,
    source: "account",
    rawProviderId: row.id,
    placeId: gm?.place_id ?? directoryRow?.place_id ?? null,
    googleReviewsData: bpGoogleReviews ?? directoryRow?.google_reviews_data ?? null,
    cmsData: directoryRow?.cms_data ?? null,
    aiTrustSignals: directoryRow?.ai_trust_signals ?? null,
    parentOrganization: directoryRow?.parent_organization ?? null,
  };
}
