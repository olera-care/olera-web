"use client";

/**
 * v9.0 Phase 7: SiteCard — first-class operational card for the Sites
 * surface. Standard MedjobsCard chrome + single-tone slate pill
 * carrying the stage. Renamed from CampusCard as part of the v9.0
 * "Site" terminology pass — the underlying DB table is still
 * `student_outreach_campuses`; only the user-facing copy says "site".
 *
 * Stage-driven content:
 *   provider_prospecting (no clients yet):
 *     pill "Prospecting providers" · CTA "View site →"
 *   stakeholder_prospecting AND stakeholder_count = 0:
 *     pill "Research needed" · CTA "Add stakeholders →"
 *   stakeholder_prospecting AND stakeholder_count > 0:
 *     pill "Researching stakeholders" · CTA "Continue →"
 *   active (research_complete = true):
 *     pill "Active" · CTA "View site →"
 */

import { formatRelative } from "@/lib/student-outreach/formatters";
import type { CampusRow } from "@/lib/student-outreach/tab-config";
import { MedjobsCard } from "./MedjobsCard";
import { Pill } from "./StakeholderCard";

export function SiteCard({
  row,
  onAddStakeholders,
  onViewSite,
  overflowMenu,
}: {
  row: CampusRow;
  onAddStakeholders: () => void;
  onViewSite: () => void;
  overflowMenu?: React.ReactNode;
}) {
  const isResearchNeeded =
    row.stage === "stakeholder_prospecting" && row.stakeholder_count === 0;
  const hasStakeholders = row.stakeholder_count > 0;

  let pillText: string;
  let ctaText: string;
  let ctaAction: () => void;

  // v9.0 Phase 7 Commit H: active sites with pending site_tasks get
  // their own pill so they're visually distinguishable from idle
  // active territories.
  if (row.stage === "active" && row.has_pending_task) {
    pillText = "Active · pending task";
    ctaText = "View site →";
    ctaAction = onViewSite;
  } else if (row.stage === "active") {
    pillText = "Active";
    ctaText = "View site →";
    ctaAction = onViewSite;
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
    ctaText = "View site →";
    ctaAction = onViewSite;
  }

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

  // v9.0 Phase 7 Commit H: throughput-queue footnote. Most-specific
  // signal wins — recent stakeholder add → recency; unlocked-but-empty
  // → urgency cue; otherwise queue age so stale rows are obvious.
  const footnote = row.last_added_at
    ? `Last added ${formatRelative(row.last_added_at)}`
    : row.client_count > 0
      ? row.queue_age_days != null && row.queue_age_days > 14
        ? `Stage 2 unlocked · ${row.queue_age_days}d idle`
        : "Stage 2 unlocked · no stakeholders yet"
      : row.queue_age_days != null
        ? `Added ${row.queue_age_days}d ago · no activity`
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
      hoverTitle="Open site operational view."
    />
  );
}
