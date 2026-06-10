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
import { Pill } from "./StakeholderCard";

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

  // Consistent partner-prospecting status (matches the In-Basket research card).
  const researchPill = row.research_complete ? null : (
    <Pill>{stakeholderCount > 0 ? "Research in progress" : "Research needed"}</Pill>
  );

  const card = (
    <MedjobsCard
      title={row.name}
      subtitle={subtitle}
      footnote={footnote}
      pill={researchPill ?? undefined}
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

  const sources = row.partner_sources ?? [];
  if (sources.length === 0) return card;

  // Persisted AI research source links — kept on the Site so they're reusable
  // for manual research without re-running (and re-paying for) the AI.
  return (
    <div>
      {card}
      <details className="mt-1 px-1">
        <summary className="cursor-pointer text-[11px] text-gray-500 hover:text-gray-700">
          Research sources ({sources.length})
        </summary>
        <ul className="mt-1 space-y-0.5 pl-2">
          {sources.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] text-primary-600 hover:underline"
              >
                {s.title} ↗
              </a>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
