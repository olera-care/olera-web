"use client";

import { useEffect, useRef } from "react";
import QASectionV2 from "@/components/providers/QASectionV2";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { useIntakeVariant } from "@/hooks/use-intake-variant";
import type { IntakeVariant } from "@/lib/analytics/variant";
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
}: QASectionWithVariantProps) {
  // Use the shared hook to get the variant — this ensures we stay in sync
  // with BenefitsArmGate and AgentOutreachSlot (all use the same weighted
  // assignment from the admin dial). Returns null while loading.
  const hookVariant = useIntakeVariant();

  // Track multi_provider impression once variant resolves
  const impressionTrackedRef = useRef(false);
  useEffect(() => {
    if (hookVariant === "multi_provider" && !impressionTrackedRef.current) {
      impressionTrackedRef.current = true;
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
    }
  }, [hookVariant, providerId]);

  // Derived: for outreach, qa_email_capture, and multi_provider variants,
  // the benefits module is hidden by BenefitsArmGate, so we tell QASectionV2
  // there's no benefits section (disables spotlight handoff behavior).
  const hasBenefitsSection =
    hookVariant === "outreach" ||
    hookVariant === "qa_email_capture" ||
    hookVariant === "multi_provider"
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
    />
  );
}
