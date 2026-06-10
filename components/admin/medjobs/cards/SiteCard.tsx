"use client";

/**
 * v9 final: SiteCard — extremely simple organizational anchor card.
 *
 * Sites are organizational, not operational. The card carries the
 * minimum admin needs to recognize the territory:
 *   - Site name
 *   - City, State
 *   - When added
 *   - Stakeholder count
 *
 * The only CTA is "See Stakeholders →" which navigates to the
 * campus management page. No Log button, no overflow menu, no pill,
 * no operational drawer — operational work lives in In Basket
 * (Prospects / Replies / Calls / Meetings). The card click navigates
 * to the same destination as the See Stakeholders link.
 */

import type { CampusRow } from "@/lib/student-outreach/tab-config";
import { MedjobsCard } from "./MedjobsCard";

export function SiteCard({
  row,
  onView,
  onFindPartners,
}: {
  row: CampusRow;
  /** Navigate to the site's stakeholder page. */
  onView: () => void;
  /** Open the AI partner-sourcing widget scoped to this site. */
  onFindPartners?: () => void;
}) {
  const loc = [row.city, row.state].filter(Boolean).join(", ") || null;
  const subtitle = loc;

  const stakeholderCount = row.stakeholder_count ?? 0;
  const stakeholderLabel =
    stakeholderCount === 1 ? "1 stakeholder" : `${stakeholderCount} stakeholders`;
  const addedLabel =
    row.queue_age_days != null
      ? row.queue_age_days === 0
        ? "Added today"
        : `Added ${row.queue_age_days}d ago`
      : null;
  const footnote = [addedLabel, stakeholderLabel].filter(Boolean).join(" · ");

  return (
    <MedjobsCard
      title={row.name}
      subtitle={subtitle}
      footnote={footnote}
      cta={
        <div className="flex items-center gap-2">
          {onFindPartners && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFindPartners();
              }}
              className="rounded-md border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100"
              title="Find partners with AI for this university."
            >
              Find partners ✦
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            See stakeholders →
          </button>
        </div>
      }
      onClick={onView}
      hoverTitle="Open the site's stakeholder list."
    />
  );
}
