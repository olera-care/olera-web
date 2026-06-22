"use client";

import { useMemo } from "react";
import FindFamiliesMarketView from "@/components/provider/market/FindFamiliesMarketView";
import { useProviderProfile } from "@/hooks/useProviderProfile";

/**
 * "Your Market" — the provider's market-intelligence home (competition, demand,
 * referral map, where-to-focus playbook). Split out of Find Families so each
 * surface has one job: Find Families = leads, Your Market = the market + the plan.
 *
 * The diagnostic self-fetches and renders its own loading / building / uncovered
 * states; we just resolve the provider's market params (city/state/care type +
 * the place_id that powers the self-rank overlay) and hand them in. No `pinned`
 * families here — those now live only in Find Families.
 */
export default function YourMarketPage() {
  const providerProfile = useProviderProfile();

  const { providerPlaceId, providerReviewCount } = useMemo(() => {
    const meta = providerProfile?.metadata as
      | { google_metadata?: { place_id?: string; review_count?: number } }
      | undefined;
    return {
      providerPlaceId: meta?.google_metadata?.place_id || undefined,
      providerReviewCount: meta?.google_metadata?.review_count ?? null,
    };
  }, [providerProfile]);

  // The layout gates auth + redirects providerless accounts to /portal, so a
  // null profile here is the brief pre-resolve moment.
  if (!providerProfile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const careType =
    providerProfile.category || providerProfile.care_types?.[0] || "";

  return (
    <FindFamiliesMarketView
      city={providerProfile.city || ""}
      state={providerProfile.state || ""}
      category={careType}
      providerName={providerProfile.display_name || ""}
      providerSlug={providerProfile.slug}
      providerPlaceId={providerPlaceId}
      providerSourceId={providerProfile.source_provider_id || undefined}
      providerReviewCount={providerReviewCount}
    />
  );
}
