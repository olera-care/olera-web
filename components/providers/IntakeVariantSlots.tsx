"use client";

/**
 * Variant routing for the 5-way SBF intake A/B test on provider pages.
 *
 *   ~20% availability    ┐
 *   ~20% loss            ├─  see BenefitsDiscoveryModule (3-arm copy A/B inside)
 *   ~20% empathic        ┘
 *   ~20% outreach        →   see AgentOutreachModule on the Q&A surface
 *   ~20% multi_provider  →   see click-to-send multi-provider comparison
 *
 * Math note: BenefitsDiscoveryModule does its own mod-3 copy assignment
 * internally. Combining mod-3 (which 3-arm) with this mod-5 on the same
 * sessionId yields a uniform 1/5 distribution across all 5 arms.
 *
 * SSR behavior: BenefitsArmGate renders children eagerly (matching today's
 * pre-mount paint), then hides them after mount if the assigned variant is
 * "outreach" or "multi_provider". 60% of visitors see no change; 40% see a
 * brief flash of BenefitsDiscoveryModule disappearing. Trade chosen to
 * preserve first-paint UX for the majority arms.
 */

import { useEffect, useState, type ReactNode } from "react";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { assignIntakeVariant } from "@/lib/analytics/variant";
import AgentOutreachModule from "@/components/providers/AgentOutreachModule";
import type { ProviderCardData } from "@/lib/types/provider";

/**
 * Wraps the BenefitsDiscoveryModule section. Renders children unless the
 * session is in the outreach or multi_provider arm.
 */
export function BenefitsArmGate({ children }: { children: ReactNode }) {
  const [hide, setHide] = useState(false);
  useEffect(() => {
    const variant = assignIntakeVariant(getOrCreateSessionId());
    if (variant === "outreach" || variant === "multi_provider") setHide(true);
  }, []);
  if (hide) return null;
  return <>{children}</>;
}

/**
 * Renders AgentOutreachModule only for the outreach arm. Mounted on the Q&A
 * surface; renders null for the other 80%.
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
