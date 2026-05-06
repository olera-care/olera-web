"use client";

/**
 * v9.0 Phase 3: CampusCard — first-class operational card for the
 * Campuses tab. Standard MedjobsCard chrome + single-tone slate pill
 * carrying the stage. The Campuses tab is now the sole place where
 * campus research + university prospecting workflows live; provider
 * Prospects tab no longer surfaces campus banners.
 *
 * Stage-driven content:
 *   provider_prospecting (no clients yet):
 *     pill "Prospecting providers" · CTA "View campus →"
 *   stakeholder_prospecting AND stakeholder_count = 0:
 *     pill "Research needed" · CTA "Add stakeholders →"
 *   stakeholder_prospecting AND stakeholder_count > 0:
 *     pill "Researching stakeholders" · CTA "Continue →"
 *   active (research_complete = true):
 *     pill "Active" · CTA "View campus →"
 */

import { formatRelative } from "@/lib/student-outreach/formatters";
import type { CampusRow } from "@/lib/student-outreach/tab-config";
import { MedjobsCard } from "./MedjobsCard";
import { Pill } from "./StakeholderCard";

export function CampusCard({
  row,
  onAddStakeholders,
  onViewCampus,
  overflowMenu,
}: {
  row: CampusRow;
  onAddStakeholders: () => void;
  onViewCampus: () => void;
  overflowMenu?: React.ReactNode;
}) {
  const isResearchNeeded =
    row.stage === "stakeholder_prospecting" && row.stakeholder_count === 0;
  const hasStakeholders = row.stakeholder_count > 0;

  let pillText: string;
  let ctaText: string;
  let ctaAction: () => void;

  if (row.stage === "active") {
    pillText = "Active";
    ctaText = "View campus →";
    ctaAction = onViewCampus;
  } else if (isResearchNeeded) {
    pillText = "Research needed";
    ctaText = "Add stakeholders →";
    ctaAction = onAddStakeholders;
  } else if (row.stage === "stakeholder_prospecting") {
    pillText = "Researching stakeholders";
    ctaText = "Continue →";
    ctaAction = onAddStakeholders;
  } else {
    pillText = "Prospecting providers";
    ctaText = "View campus →";
    ctaAction = onViewCampus;
  }

  // Subtitle: city/state + counts that matter for the stage.
  const subtitleParts: string[] = [];
  const loc = [row.city, row.state].filter(Boolean).join(", ");
  if (loc) subtitleParts.push(loc);
  if (row.client_count > 0) {
    subtitleParts.push(
      `${row.client_count} ${row.client_count === 1 ? "client" : "clients"} in catchment`,
    );
  }
  if (hasStakeholders) {
    subtitleParts.push(
      `${row.stakeholder_count} ${row.stakeholder_count === 1 ? "stakeholder" : "stakeholders"} in research`,
    );
  }
  const subtitle = subtitleParts.join(" · ") || null;

  const footnote = row.last_added_at
    ? `Last added ${formatRelative(row.last_added_at)}`
    : row.client_count > 0
      ? "Stage 2 unlocked · no stakeholders yet"
      : "No activity yet";

  return (
    <MedjobsCard
      title={row.name}
      subtitle={subtitle}
      footnote={footnote}
      pill={<Pill>{pillText}</Pill>}
      cta={
        <button
          onClick={(e) => {
            e.stopPropagation();
            ctaAction();
          }}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          {ctaText}
        </button>
      }
      overflowMenu={overflowMenu}
      onClick={ctaAction}
      hoverTitle="Open campus operational view."
    />
  );
}
