"use client";

/**
 * v9.0 Phase 3: ClientCard — provider clients (in pilot or subscribed).
 * Standard MedjobsCard chrome (white bg, gray-200 border) with a
 * single-tone slate pill carrying the status label. No colored
 * backgrounds or red urgency accents — keeps the palette calm and
 * consistent with the rest of the system.
 *
 * Structure:
 *   - Title:    business name
 *   - Subtitle: city, state · email
 *   - Footnote: pilot-start or subscription-start blurb +
 *               total interviews scheduled
 *   - Pill:     "Pilot · 87 days left" / "Subscribed" / "Pilot ended"
 *   - CTA:      Manage (opens provider drawer)
 */

import { formatRelative } from "@/lib/student-outreach/formatters";
import type { ClientRow } from "@/lib/student-outreach/tab-config";
import { MedjobsCard } from "./MedjobsCard";
import { Pill } from "./StakeholderCard";

export function ClientCard({
  row,
  onManage,
  overflowMenu,
}: {
  row: ClientRow;
  onManage: () => void;
  overflowMenu?: React.ReactNode;
}) {
  const subtitle = [
    [row.city, row.state].filter(Boolean).join(", ") || null,
    row.email,
  ]
    .filter(Boolean)
    .join(" · ");

  const startBlurb = row.interview_terms_accepted_at
    ? `Pilot started ${formatRelative(row.interview_terms_accepted_at)}`
    : `Subscribed since ${formatRelative(row.created_at)}`;
  const interviewBlurb =
    row.credits_used > 0
      ? ` · ${row.credits_used} interview${row.credits_used === 1 ? "" : "s"} scheduled`
      : "";

  return (
    <MedjobsCard
      title={row.display_name}
      subtitle={subtitle}
      footnote={`${startBlurb}${interviewBlurb}`}
      pill={<StatusPill row={row} />}
      cta={
        <button
          onClick={(e) => {
            e.stopPropagation();
            onManage();
          }}
          title="Open the drawer to log a follow-up step or manage this client."
          className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
        >
          Log
        </button>
      }
      overflowMenu={overflowMenu}
      onClick={onManage}
      hoverTitle="Open the management drawer for this client."
      unread={row.unread === true}
    />
  );
}

function StatusPill({ row }: { row: ClientRow }) {
  if (row.status === "subscribed") return <Pill>Subscribed</Pill>;
  if (row.status === "pilot_expired") return <Pill>Pilot ended</Pill>;
  const days = row.days_remaining_in_pilot ?? 0;
  return (
    <Pill title="Provider is in their 90-day pilot.">
      {days === 1 ? "Pilot · 1 day left" : `Pilot · ${days} days left`}
    </Pill>
  );
}
