"use client";

import { useEffect, useState } from "react";
import QASectionV2 from "@/components/providers/QASectionV2";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { assignIntakeVariant, type IntakeVariant } from "@/lib/analytics/variant";

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
  questions?: QAEntry[];
  suggestedQuestions?: string[];
  hasBenefitsData: boolean;
}

/**
 * Client wrapper for QASectionV2 that determines the A/B variant client-side
 * and passes it down. This enables the inline_answer experience for 20% of visitors.
 *
 * For benefits variants (60% total): hasBenefitsSection = true, variant is set
 * For outreach variant (20%): hasBenefitsSection = false, variant = "outreach"
 * For inline_answer variant (20%): hasBenefitsSection = false, variant = "inline_answer"
 */
export default function QASectionWithVariant({
  providerId,
  providerName,
  providerImage,
  providerSlug,
  providerLocation,
  providerCareTypes,
  questions,
  suggestedQuestions,
  hasBenefitsData,
}: QASectionWithVariantProps) {
  const [variant, setVariant] = useState<IntakeVariant | undefined>(undefined);
  const [hasBenefitsSection, setHasBenefitsSection] = useState(hasBenefitsData);

  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    const assigned = assignIntakeVariant(sessionId);
    setVariant(assigned);

    // For inline_answer and outreach variants, the benefits module is hidden
    // so we tell QASectionV2 there's no benefits section
    if (assigned === "inline_answer" || assigned === "outreach") {
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
  }, [hasBenefitsData, providerId]);

  return (
    <QASectionV2
      providerId={providerId}
      providerName={providerName}
      providerImage={providerImage}
      providerSlug={providerSlug}
      providerLocation={providerLocation}
      providerCareTypes={providerCareTypes}
      questions={questions}
      suggestedQuestions={suggestedQuestions}
      hasBenefitsSection={hasBenefitsSection}
      variant={variant}
    />
  );
}
