import { iosProviderToProfile } from "@/lib/mock-providers";
import type { Provider as IOSProvider } from "@/lib/types/provider";
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
 * Google data lives in `metadata` for account rows; CMS/trust signals do not
 * exist on the account side (they're directory-only), so they stay null.
 */
export function accountRowToProvider(row: Profile): ProviderView {
  const meta = row.metadata as Record<string, unknown> | null;
  const gm = meta?.google_metadata as { place_id?: string } | undefined;
  const bpGoogleReviews = meta?.google_reviews_data as GoogleReviewsData | undefined;
  return {
    profile: row,
    source: "account",
    rawProviderId: row.id,
    placeId: gm?.place_id ?? null,
    googleReviewsData: bpGoogleReviews ?? null,
    cmsData: null,
    aiTrustSignals: null,
    parentOrganization: null,
  };
}
