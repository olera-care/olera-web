"use client";

import ManagedAdsNudgeCard, { type ManagedAdsNudgeSource } from "@/components/provider/ManagedAdsNudgeCard";

type NudgeContext = "question" | "lead";

/** The one line that differs by context: what the provider just did. Everything
 *  under it is the shared card. */
const OPENER: Record<NudgeContext, string> = {
  question: "Great response. That family now has an answer from you.",
  lead: "Families are reaching out.",
};

const SOURCE: Record<NudgeContext, ManagedAdsNudgeSource> = {
  question: "post_question",
  lead: "leads_page",
};

/**
 * Contextual Managed Ads nudge, shown once per session on high-intent surfaces:
 * after answering a question, and on the leads page when the provider has leads.
 *
 * Suppressed when the provider already has an active boost request
 * (pending_profile, requested, scheduled, or live) — no point pitching ads to
 * someone who has them.
 */
export default function ContextualAdsNudge({
  context,
  providerSlug,
  providerName,
  hasActiveBoostRequest,
  hasEverRequested,
  onDismiss,
}: {
  context: NudgeContext;
  providerSlug: string;
  providerName?: string;
  /** If true, the nudge won't render (provider already has ads). */
  hasActiveBoostRequest?: boolean;
  /** Whether they have EVER had a campaign. Gates the free-intro claim. */
  hasEverRequested?: boolean | null;
  onDismiss: () => void;
}) {
  if (hasActiveBoostRequest) {
    return null;
  }

  return (
    <ManagedAdsNudgeCard
      source={SOURCE[context]}
      opener={OPENER[context]}
      hasEverRequested={hasEverRequested}
      providerSlug={providerSlug}
      providerName={providerName}
      onDismiss={onDismiss}
    />
  );
}
