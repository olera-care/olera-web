"use client";

/**
 * Variant routing for the 6-way SBF intake A/B test on provider pages.
 *
 *   ~17% availability    ┐
 *   ~17% loss            ├─  see BenefitsDiscoveryModule (3-arm copy A/B inside)
 *   ~17% empathic        ┘
 *   ~17% outreach        →   see AgentOutreachModule on the Q&A surface
 *   ~17% inline_answer   →   see inline Q&A answer expansion with email capture
 *   ~17% multi_provider  →   see click-to-send multi-provider comparison
 *
 * Math note: BenefitsDiscoveryModule does its own mod-3 copy assignment
 * internally. Combining mod-3 (which 3-arm) with this mod-6 on the same
 * sessionId yields a uniform 1/6 distribution across all 6 arms.
 *
 * SSR behavior: BenefitsArmGate renders children eagerly (matching today's
 * pre-mount paint), then hides them after mount if the assigned variant is
 * "outreach", "inline_answer", or "multi_provider". 50% of visitors see a
 * brief flash of BenefitsDiscoveryModule disappearing. The other 50% see no
 * change. Trade chosen to preserve first-paint UX for the majority arms.
 */

import { useEffect, useState, type ReactNode } from "react";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { assignIntakeVariant } from "@/lib/analytics/variant";
import AgentOutreachModule from "@/components/providers/AgentOutreachModule";
import type { ProviderCardData } from "@/lib/types/provider";

/**
 * Wraps the BenefitsDiscoveryModule section. Renders children unless the
 * session is in the outreach, inline_answer, or multi_provider arm.
 */
export function BenefitsArmGate({ children }: { children: ReactNode }) {
  const [hide, setHide] = useState(false);
  useEffect(() => {
    const variant = assignIntakeVariant(getOrCreateSessionId());
    if (variant === "outreach" || variant === "inline_answer" || variant === "multi_provider") setHide(true);
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
