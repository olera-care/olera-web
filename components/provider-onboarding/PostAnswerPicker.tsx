"use client";

import { useRouter } from "next/navigation";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { useProviderDashboardData } from "@/hooks/useProviderDashboardData";
import {
  calculateProfileCompleteness,
  type ExtendedMetadata,
} from "@/lib/profile-completeness";
import SmartNextActionCard from "@/components/provider-dashboard/SmartNextActionCard";
import type { NudgeSectionId } from "@/lib/next-best-action";

/**
 * Smart picker mounted on the post-answer success state on
 * /provider/[slug]/onboard. Owns its own data fetching (profile +
 * metadata → completeness) so the parent ActionCard doesn't have to
 * thread the dashboard data through.
 *
 * Why a wrapper instead of mounting SmartNextActionCard directly?
 *   - The onboard page has a Provider (directory listing) but not a
 *     business_profile. The picker needs the latter for slug + category
 *     + completeness scoring. useProviderProfile() returns that from
 *     the auth context (the provider just signed in to answer).
 *   - This is the only surface besides the deprecated dashboard mount
 *     that uses SmartNextActionCard. Keeping the wrapper here means
 *     the component file stays generic and the qa-success-specific
 *     navigation logic (deep-link to /provider with ?open=<section>)
 *     lives where it's used.
 *
 * No edit modals exist on /provider/[slug]/onboard, so the CTA can't
 * open one in place — it routes to /provider with a query param the
 * dashboard reads to auto-open the right modal.
 *
 * Renders nothing if:
 *   - The auth-resolved profile isn't a provider profile yet
 *     (useProviderProfile returned null)
 *   - The profile is fully complete (pickNextAction in the picker
 *     returns null and the card renders nothing)
 *   - The provider already dismissed every incomplete section
 *     (per-section localStorage in SmartNextActionCard)
 */
export default function PostAnswerPicker() {
  const profile = useProviderProfile();
  const { metadata } = useProviderDashboardData(profile);
  const router = useRouter();

  if (!profile) return null;

  const meta = metadata as ExtendedMetadata;
  const completeness = calculateProfileCompleteness(profile, meta);

  const handleOpenSection = (sectionId: NudgeSectionId) => {
    // Modals don't exist on this surface; navigate to /provider and let
    // DashboardPage's ?open= handler pop the right edit modal once
    // profile data has loaded there.
    router.push(`/provider?from=qa-success&open=${sectionId}`);
  };

  return (
    <SmartNextActionCard
      source="qa-success"
      profile={profile}
      completeness={completeness}
      onOpenSection={handleOpenSection}
    />
  );
}
