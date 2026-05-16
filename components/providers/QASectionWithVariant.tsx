"use client";

import { useEffect, useRef } from "react";
import QASectionV2 from "@/components/providers/QASectionV2";
import { isPreviewMode } from "@/lib/analytics/preview-mode";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { useIntakeVariant } from "@/hooks/use-intake-variant";
import type { ProviderCardData } from "@/lib/types/provider";
import type { SimilarProviderForMulti } from "@/lib/provider-utils";

interface QAEntry {
  id?: string;
  question: string;
  answer?: string | null;
  asker_name?: string;
  asker_user_id?: string;
  status?: "pending" | "approved" | "answered";
  created_at?: string;
  answered_at?: string;
}

interface QASectionWithVariantProps {
  providerId: string;
  providerName: string;
  providerImage?: string;
  providerSlug?: string;
  providerLocation?: string;
  providerCareTypes?: string[];
  providerRating?: number;
  providerPriceRange?: string;
  providerCity?: string;
  providerState?: string;
  questions?: QAEntry[];
  suggestedQuestions?: string[];
  hasBenefitsData: boolean;
  /** Similar providers for multi_provider variant */
  similarProvidersForMulti?: SimilarProviderForMulti[];
  /** Top providers in same city + category. qa_email_capture arm uses these
   *  for the "Top N [Category] in [City]" cards in the post-question prompt. */
  alternativeProviders?: ProviderCardData[];
  /** Display-ready category for the qa_email_capture arm headline. */
  providerCategory?: string | null;
}

/**
 * Client wrapper for QASectionV2 that determines the A/B variant client-side
 * and passes it down. Uses the shared useIntakeVariant hook to stay in sync
 * with BenefitsArmGate — both read from the same weighted assignment (admin
 * dial) so split-brain between "which arm hides benefits" vs "which arm
 * QASectionV2 thinks we're in" is impossible.
 *
 * Variant allocation is controlled from /admin/analytics traffic dials.
 *   - Benefits arms (availability, loss, empathic): hasBenefitsSection = true
 *   - Non-benefits arms (outreach, qa_email_capture, multi_provider): hasBenefitsSection = false
 */
export default function QASectionWithVariant({
  providerId,
  providerName,
  providerImage,
  providerSlug,
  providerLocation,
  providerCareTypes,
  providerRating,
  providerPriceRange,
  providerCity,
  providerState,
  questions,
  suggestedQuestions,
  hasBenefitsData,
  similarProvidersForMulti,
  alternativeProviders,
  providerCategory,
}: QASectionWithVariantProps) {
  // Use the shared hook to get the variant — this ensures we stay in sync
  // with BenefitsArmGate and AgentOutreachSlot (all use the same weighted
  // assignment from the admin dial). Returns null while loading.
  const hookVariant = useIntakeVariant();

  // Track multi_provider impression once variant resolves (page load).
  // V2 tracks its own impression when the card appears (after question),
  // so we only fire here for V1 to avoid double-counting.
  // Skip in admin preview so inspection doesn't pollute the funnel.
  const impressionTrackedRef = useRef(false);
  useEffect(() => {
    if (hookVariant !== "multi_provider" || impressionTrackedRef.current) return;
    impressionTrackedRef.current = true;
    if (isPreviewMode()) return;
    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actor_type: "anonymous",
        event_type: "multi_provider_viewed",
        related_provider_id: providerId,
        session_id: getOrCreateSessionId(),
        metadata: { variant: "multi_provider" },
      }),
      keepalive: true,
    }).catch(() => {});
  }, [hookVariant, providerId]);

  // Derived: for qa_email_capture and multi_provider arms — both own the
  // post-question moment with their own email-capture UX — force
  // hasBenefitsSection=false so QASectionV2's legacy gray-box enrichment
  // prompt doesn't compete. Outreach passes through the real prop value:
  // its AgentOutreachSlot module is the post-question CTA, and overriding
  // hasBenefitsSection=false there would re-enable the legacy gray-box
  // prompt on top of the outreach module (two competing CTAs after one
  // question).
  const hasBenefitsSection =
    hookVariant === "qa_email_capture" || hookVariant === "multi_provider"
      ? false
      : hasBenefitsData;

  return (
    <QASectionV2
      providerId={providerId}
      providerName={providerName}
      providerImage={providerImage}
      providerSlug={providerSlug}
      providerLocation={providerLocation}
      providerCareTypes={providerCareTypes}
      providerRating={providerRating}
      providerPriceRange={providerPriceRange}
      providerCity={providerCity}
      providerState={providerState}
      questions={questions}
      suggestedQuestions={suggestedQuestions}
      hasBenefitsSection={hasBenefitsSection}
      variant={hookVariant ?? undefined}
      similarProvidersForMulti={similarProvidersForMulti}
      alternativeProviders={alternativeProviders}
      providerCategory={providerCategory}
    />
  );
}
