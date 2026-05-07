"use client";

/**
 * v9.0 Phase 7: SiteCard — first-class operational card for the Sites
 * surface. Standard MedjobsCard chrome + single-tone slate pill
 * carrying the stage. The DB table is still
 * `student_outreach_campuses`; UI says "site".
 *
 * Stage-driven pill content (CTA is universally "Log" — the modal /
 * drawer determines what action is logged):
 *   provider_prospecting     → "Prospecting providers"
 *   stakeholder_prospecting w/ 0 stakeholders → "Research needed"
 *   stakeholder_prospecting w/ ≥1 stakeholder → "Researching stakeholders"
 *   active                   → "Active"
 *   active w/ pending tasks  → "Active · pending task"
 *
 * The CTA hover tooltip carries per-stage context so admins know what
 * the modal will do (open the drawer to add stakeholders, view the
 * site, work the pending task, etc.). Verb consistency over
 * descriptive labels — every emerald button means the same thing:
 * open the place where you log this step.
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
  let ctaTitle: string;
  let ctaAction: () => void;

  // v9.0 Phase 7 Commit J: CTA verb is universal "Log" — the pill
  // carries the operational stage; the tooltip carries per-stage
  // context.
  if (row.stage === "active" && row.has_pending_task) {
    pillText = "Active · pending task";
    ctaTitle = "Open the site drawer to work the pending task.";
    ctaAction = onViewSite;
  } else if (row.stage === "active") {
    pillText = "Active";
    ctaTitle = "Open the site drawer to log a follow-up step.";
    ctaAction = onViewSite;
  } else if (isResearchNeeded) {
    pillText = "Research needed";
    ctaTitle = "Add stakeholders to this site so partner-prospect research can begin.";
    ctaAction = onAddStakeholders;
  } else if (row.stage === "stakeholder_prospecting") {
    pillText = "Researching stakeholders";
    ctaTitle = "Continue adding stakeholders for this site.";
    ctaAction = onAddStakeholders;
  } else {
    pillText = "Prospecting providers";
    ctaTitle = "Open the site drawer to log a follow-up step.";
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
          title={ctaTitle}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          Log
        </button>
      }
      overflowMenu={overflowMenu}
      onClick={ctaAction}
      hoverTitle="Open site operational view."
      unread={row.unread === true}
    />
  );
}
