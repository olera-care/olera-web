"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Profile } from "@/lib/types";
import type { ProfileCompleteness } from "@/lib/profile-completeness";
import { pickNextAction, type NudgeSectionId } from "@/lib/next-best-action";

interface SmartNextActionCardProps {
  /** Where the card is rendered. Controls event source attribution. */
  source: "dashboard" | "qa-success";
  profile: Profile;
  completeness: ProfileCompleteness;
  /** Open the edit modal for this section. Caller owns modal state. */
  onOpenSection: (sectionId: NudgeSectionId) => void;
  /** Show a dismiss button. Default true. Per-section, not global. */
  dismissable?: boolean;
}

const DISMISS_KEY_PREFIX = "olera_picker_dismissed_";

function readDismissed(sectionIds: string[]): Set<string> {
  const set = new Set<string>();
  try {
    for (const id of sectionIds) {
      if (window.localStorage.getItem(`${DISMISS_KEY_PREFIX}${id}`) === "true") {
        set.add(id);
      }
    }
  } catch {
    /* ignore */
  }
  return set;
}

function persistDismiss(sectionId: string): void {
  try {
    window.localStorage.setItem(`${DISMISS_KEY_PREFIX}${sectionId}`, "true");
  } catch {
    /* ignore */
  }
}

/**
 * Smart next-best-action card. Picks the highest-impact incomplete profile
 * section for this provider, renders a category-aware nudge with a direct
 * "open the edit modal" CTA. Replaces the static "Complete your profile"
 * banner that was conditional on completeness < 30%.
 *
 * Per-section dismiss: if the provider dismisses one nudge, the picker
 * re-evaluates and surfaces the next-highest non-dismissed section. They
 * never see the same section nudge twice once dismissed.
 *
 * Renders nothing when every nudgeable section is at 100% (or dismissed).
 */
export default function SmartNextActionCard({
  source,
  profile,
  completeness,
  onOpenSection,
  dismissable = true,
}: SmartNextActionCardProps) {
  // SSR + first client render must agree, so dismissed starts empty and is
  // hydrated from localStorage in a post-mount effect. The first paint may
  // briefly show a section the provider already dismissed; the effect below
  // immediately re-renders with the right pick. Mismatch-free.
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    const ids = completeness.sections.map((s) => s.id);
    const next = readDismissed(ids);
    setDismissed((prev) => {
      if (prev.size !== next.size) return next;
      for (const id of next) if (!prev.has(id)) return next;
      return prev;
    });
  }, [completeness.sections]);

  const action = useMemo(
    () => pickNextAction(completeness, profile.category, dismissed),
    [completeness, profile.category, dismissed],
  );

  const firedImpression = useRef<string | null>(null);

  useEffect(() => {
    if (!action) return;
    // Re-fire impression if the picker switched to a different section
    // (provider dismissed one, next one surfaced).
    if (firedImpression.current === action.sectionId) return;
    firedImpression.current = action.sectionId;
    track("provider_picker_impression", profile.slug, {
      source,
      section: action.sectionId,
      weight: action.weight,
    });
  }, [action, profile.slug, source]);

  if (!action) return null;

  const handlePrimary = () => {
    track("provider_picker_clicked", profile.slug, {
      source,
      section: action.sectionId,
      weight: action.weight,
    });
    onOpenSection(action.sectionId);
  };

  const handleDismiss = () => {
    persistDismiss(action.sectionId);
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(action.sectionId);
      return next;
    });
  };

  return (
    <div
      className="bg-gradient-to-r from-primary-50 to-vanilla-50 rounded-2xl border border-primary-100/60 p-5 flex items-center justify-between"
      style={{ animation: "card-enter 0.25s ease-out both" }}
    >
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-gray-900">
          {action.copy.headline}
        </p>
        {action.copy.subline && (
          <p className="text-sm text-gray-500 mt-0.5">{action.copy.subline}</p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {dismissable && (
          <button
            type="button"
            onClick={handleDismiss}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors px-3 py-2 min-h-[44px] flex items-center"
          >
            Dismiss
          </button>
        )}
        <button
          type="button"
          onClick={handlePrimary}
          className="px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors min-h-[44px] flex items-center"
        >
          {action.copy.cta}
        </button>
      </div>
    </div>
  );
}

/**
 * Fire-and-forget event capture. `keepalive: true` ensures the POST survives
 * a same-tab navigation (e.g. CTA opens a modal that triggers a route push).
 * Mirrors the AnalyticsTeaserCard tracking pattern.
 */
function track(
  eventType: "provider_picker_impression" | "provider_picker_clicked",
  providerSlug: string,
  metadata: Record<string, unknown>,
): void {
  try {
    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      keepalive: true,
      body: JSON.stringify({
        actor_type: "provider",
        provider_id: providerSlug,
        event_type: eventType,
        metadata,
      }),
    }).catch(() => {
      /* fire-and-forget */
    });
  } catch {
    /* fire-and-forget */
  }
}
