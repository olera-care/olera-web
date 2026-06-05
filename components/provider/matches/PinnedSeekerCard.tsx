"use client";

import type { Profile, FamilyMetadata } from "@/lib/types";
import {
  getInitials,
  TIMELINE_CONFIG,
  buildTimelineLabel,
  formatWhoNeedsCare,
  generateDescription,
} from "./FamilyMatchCard";

type OutreachStatus = "pending" | "connected" | "declined";

/**
 * The pinned "family near you" card — the rare, high-value moment when a real
 * published care-seeker sits inside a provider's catchment. Deliberately leaner and
 * calmer than the browse-list FamilyMatchCard: one soft surface (no nested boxes, no
 * divider, no CRM noise), a single urgency accent, and one clear "Reach out" action.
 * Reuses FamilyMatchCard's data derivations so the content stays identical.
 */
export default function PinnedSeekerCard({
  family,
  distanceMi,
  contacted = false,
  hasFullAccess,
  onReachOut,
}: {
  family: Profile;
  distanceMi?: number | null;
  contacted?: boolean;
  outreachStatus?: OutreachStatus;
  hasFullAccess: boolean;
  onReachOut: (family: Profile) => void;
}) {
  const meta = (family.metadata || {}) as FamilyMetadata;
  const fullName = family.display_name || "A family";
  // Unverified providers see first name only (mirrors the browse card's redaction).
  const name = hasFullAccess ? fullName : fullName.split(" ")[0];
  const location = [family.city, family.state].filter(Boolean).join(", ");

  const age = meta?.age;
  const careType = family.care_types?.[0] || null;
  const timelineConfig = meta?.timeline ? TIMELINE_CONFIG[meta.timeline] : null;
  const timelineLabel = timelineConfig
    ? buildTimelineLabel(careType || undefined, timelineConfig.urgency)
    : careType
      ? `Looking for ${careType}`
      : null;

  const who = formatWhoNeedsCare(meta?.who_needs_care || meta?.relationship_to_recipient);
  const paymentMethods = meta?.payment_methods || [];
  const description =
    meta?.about_situation?.trim() ||
    generateDescription({
      name: fullName,
      who,
      age,
      careType,
      careNeeds: meta?.care_needs || [],
      location,
      urgency: timelineConfig?.urgency,
      paymentMethods,
    });

  const distLabel = distanceMi != null && distanceMi >= 1 ? `${Math.round(distanceMi)} mi away` : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onReachOut(family)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onReachOut(family); } }}
      className="group cursor-pointer rounded-[18px] border border-stone-200/70 bg-[#fdfcf9] p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_12px_30px_-14px_rgba(28,25,23,0.16)] transition hover:border-stone-300/70 hover:shadow-[0_2px_4px_rgba(28,25,23,0.05),0_16px_34px_-14px_rgba(28,25,23,0.2)] active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#199087]/30"
    >
      {/* Identity */}
      <div className="flex items-center gap-3.5">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e7e0d3] text-[14px] font-semibold tracking-wide text-[#5b5247]">
          {getInitials(fullName)}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[17px] font-semibold leading-tight text-stone-900">{name}</div>
          <div className="mt-0.5 text-[13px] text-stone-500">
            {location}
            {distLabel && <span> · {distLabel}</span>}
          </div>
        </div>
      </div>

      {/* The one accent — the human heartbeat */}
      {timelineLabel && (
        <div className="mt-4 flex items-center gap-2 text-[14px] font-medium text-amber-700">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
          {timelineLabel}
        </div>
      )}

      {/* Calm context */}
      {description && (
        <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-stone-600">{description}</p>
      )}

      {/* Quiet payment line — its own row so it never collides with the button on mobile */}
      {paymentMethods.length > 0 && (
        <p className="mt-3.5 text-[12.5px] text-stone-400">
          Pays via <span className="font-medium text-stone-500">{paymentMethods[0]}</span>
        </p>
      )}

      {/* The one action */}
      <div className="mt-4 flex justify-end">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#199087] px-[18px] py-2.5 text-[13.5px] font-semibold text-white shadow-[0_1px_2px_rgba(28,25,23,0.10)] transition group-hover:bg-[#15776f] group-active:scale-95">
          {contacted ? "View" : "Reach out"}
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
        </span>
      </div>
    </div>
  );
}
