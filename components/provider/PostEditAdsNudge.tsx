"use client";

import ManagedAdsNudgeCard from "@/components/provider/ManagedAdsNudgeCard";

/**
 * Managed Ads nudge shown once per session after a provider saves a profile
 * edit. Editing is the one in-app behavior the engaged minority actually does
 * — 255 providers have edited, more than any other action — so the moment of
 * "I just polished my page" is the earned, high-intent time to pitch getting it
 * seen.
 *
 * The card body is shared with the post-question nudge (ManagedAdsNudgeCard):
 * same four sentences about who Olera is and why the first campaign is free,
 * with only the opening line differing by context.
 */
export default function PostEditAdsNudge({
  providerSlug,
  providerName,
  onDismiss,
}: {
  providerSlug: string;
  providerName?: string;
  onDismiss: () => void;
}) {
  return (
    <ManagedAdsNudgeCard
      source="post_edit"
      opener="Looking sharp. Now let's get that page in front of families."
      providerSlug={providerSlug}
      providerName={providerName}
      onDismiss={onDismiss}
    />
  );
}
