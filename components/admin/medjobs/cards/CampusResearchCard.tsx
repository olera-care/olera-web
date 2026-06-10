"use client";

/**
 * CampusResearchCard — a queued "research this university" operational
 * card. Lives inside the Prospects tab → Partner Prospects dropdown,
 * one per campus where `research_complete=false`. Clicking the card
 * opens the BulkResearchModal so the admin can add stakeholders
 * (advisors, dept heads, professors, student orgs). The card stays in
 * the queue until the admin marks the research pass complete; closing
 * it removes the operational card itself but leaves any stakeholders
 * already created intact.
 *
 * The Site itself is not the operational work — it generates
 * operational work. This card is one of those generated pieces.
 */

import { formatRelative } from "@/lib/student-outreach/formatters";
import type { ResearchCampusCard as ResearchCampusCardRow } from "@/lib/student-outreach/types";
import { MedjobsCard } from "./MedjobsCard";
import { Pill } from "./StakeholderCard";

export function CampusResearchCard({
  row,
  onFindPartners,
  onSeeStakeholders,
}: {
  row: ResearchCampusCardRow;
  onFindPartners: () => void;
  onSeeStakeholders: () => void;
}) {
  const hasStakeholders = row.research_stakeholder_count > 0;
  const stageReady =
    row.stage === "stakeholder_prospecting" || row.stage === undefined;

  const pillText = hasStakeholders
    ? "Research in progress"
    : stageReady
      ? "Research needed"
      : "Research queued";

  const subtitleParts: string[] = [];
  const loc = [row.city, row.state].filter(Boolean).join(", ");
  if (loc) subtitleParts.push(loc);
  if (hasStakeholders) {
    subtitleParts.push(
      `${row.research_stakeholder_count} stakeholder${
        row.research_stakeholder_count === 1 ? "" : "s"
      } added`,
    );
  }
  const subtitle = subtitleParts.join(" · ") || null;

  const footnote = row.last_added_at
    ? `Last stakeholder added ${formatRelative(row.last_added_at)}`
    : "No stakeholders yet — open to start the research pass";

  return (
    <MedjobsCard
      title={row.name}
      subtitle={subtitle}
      footnote={footnote}
      pill={<Pill>{pillText}</Pill>}
      cta={
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFindPartners();
            }}
            title="Find partners with AI for this university, then complete the research audit."
            className="rounded-md border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100"
          >
            Find partners ✦
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSeeStakeholders();
            }}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            See stakeholders →
          </button>
        </div>
      }
      onClick={onFindPartners}
      hoverTitle="Partner research for this university — find partners, then complete the audit."
    />
  );
}
