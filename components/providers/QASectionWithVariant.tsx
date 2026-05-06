"use client";

import { useEffect, useState } from "react";
import QASectionV2 from "@/components/providers/QASectionV2";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { assignIntakeVariant, type IntakeVariant } from "@/lib/analytics/variant";
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
 * and passes it down. This enables the inline_answer and multi_provider
 * experiences for ~17% of visitors each.
 *
 * For benefits variants (50% total): hasBenefitsSection = true, variant is set
 * For outreach variant (~17%): hasBenefitsSection = false, variant = "outreach"
 * For inline_answer variant (~17%): hasBenefitsSection = false, variant = "inline_answer"
 * For multi_provider variant (~17%): hasBenefitsSection = false, variant = "multi_provider"
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
  const [variant, setVariant] = useState<IntakeVariant | undefined>(undefined);
  const [hasBenefitsSection, setHasBenefitsSection] = useState(hasBenefitsData);

  useEffect(() => {
    const sessionId = getOrCreateSessionId();

    // Allow URL override for testing: ?variant=inline_answer (or any valid variant)
    const urlParams = new URLSearchParams(window.location.search);
    const urlVariant = urlParams.get("variant") as IntakeVariant | null;
    const validVariants: IntakeVariant[] = ["availability", "loss", "empathic", "outreach", "inline_answer", "multi_provider"];

    const assigned = (urlVariant && validVariants.includes(urlVariant))
      ? urlVariant
      : assignIntakeVariant(sessionId);

    setVariant(assigned);

    // For inline_answer, outreach, and multi_provider variants, the benefits module is hidden
    // so we tell QASectionV2 there's no benefits section
    if (assigned === "inline_answer" || assigned === "outreach" || assigned === "multi_provider") {
      setHasBenefitsSection(false);
    } else {
      // For benefits variants, respect the original hasBenefitsData
      setHasBenefitsSection(hasBenefitsData);
    }

    // Track impression for inline_answer variant
    if (assigned === "inline_answer") {
      fetch("/api/activity/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor_type: "anonymous",
          event_type: "inline_answer_viewed",
          related_provider_id: providerId,
          session_id: sessionId,
          metadata: { variant: "inline_answer" },
        }),
        keepalive: true,
      }).catch(() => {});
    }

    // Track impression for multi_provider variant
    if (assigned === "multi_provider") {
      fetch("/api/activity/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor_type: "anonymous",
          event_type: "multi_provider_viewed",
          related_provider_id: providerId,
          session_id: sessionId,
          metadata: { variant: "multi_provider" },
        }),
        keepalive: true,
      }).catch(() => {});
    }
  }, [hasBenefitsData, providerId]);

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
      variant={variant}
      similarProvidersForMulti={similarProvidersForMulti}
    />
  );
}
