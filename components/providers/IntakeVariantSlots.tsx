"use client";

/**
 * Variant routing for the 5-way SBF intake A/B test on provider pages.
 *
 *   20% availability       ┐
 *   20% loss               ├─  see BenefitsDiscoveryModule (3-arm copy A/B inside)
 *   20% empathic           ┘
 *   20% outreach           →   see AgentOutreachModule on the Q&A surface
 *   20% qa_email_capture   →   NO SBF / NO outreach module. Q&A enrichment ON.
 *
 * Math note: BenefitsDiscoveryModule does its own mod-3 copy assignment
 * internally. Combining mod-3 (which 3-arm) with this mod-5 (which surface)
 * on the same sessionId yields a uniform 1/5 distribution across all 5 arms
 * — gcd(3,5) = 1, so the two mods are uncorrelated.
 *
 * SSR behavior: BenefitsArmGate renders children eagerly (matching today's
 * pre-mount paint), then hides them after mount if the assigned variant is
 * "outreach" OR "qa_email_capture". 40% of visitors now see a brief flash
 * of BenefitsDiscoveryModule disappearing. Trade preserved for first-paint
 * UX of the 60% benefits-arm majority.
 */

import { useEffect, useState, type ReactNode } from "react";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { assignIntakeVariant } from "@/lib/analytics/variant";
import AgentOutreachModule from "@/components/providers/AgentOutreachModule";
import type { ProviderCardData } from "@/lib/types/provider";

/**
 * Wraps the BenefitsDiscoveryModule section. Renders children unless the
 * session is in the outreach OR qa_email_capture arm.
 */
export function BenefitsArmGate({ children }: { children: ReactNode }) {
  const [hide, setHide] = useState(false);
  useEffect(() => {
    const v = assignIntakeVariant(getOrCreateSessionId());
    if (v === "outreach" || v === "qa_email_capture") setHide(true);
  }, []);
  if (hide) return null;
  return <>{children}</>;
}

/**
 * Renders AgentOutreachModule only for the outreach arm. Mounted on the Q&A
 * surface; renders null for the other 75%.
 */
export function AgentOutreachSlot(props: {
  sourceProviderId: string;
  sourceProviderName: string;
  city: string;
  state: string;
  category: string;
  topProviders: ProviderCardData[];
  recentQuestion?: { id: string; text: string } | null;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (assignIntakeVariant(getOrCreateSessionId()) === "outreach") setShow(true);
  }, []);
  if (!show) return null;
  if (props.topProviders.length === 0) return null; // graceful fallback (no candidates)
  return <AgentOutreachModule {...props} />;
}
