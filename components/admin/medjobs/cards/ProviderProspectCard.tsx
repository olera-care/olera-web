"use client";

/**
 * v9.0 Phase 3: ProviderProspectCard — virtual card for a provider in
 * a campus catchment that hasn't been materialized into student_outreach
 * yet. Standard MedjobsCard chrome (white bg, gray-200 border) with a
 * single-tone "Provider" slate pill — no colored backgrounds.
 *
 * Structure:
 *   - Title:    provider name
 *   - Subtitle: city, state · campus
 *   - Footnote: in-catchment + provider age
 *   - Pill:     "Provider"
 *   - CTA:      Start outreach (materializes the row + opens drawer)
 */

import type { ProviderProspectRow } from "@/lib/student-outreach/tab-config";
import { MedjobsCard } from "./MedjobsCard";

export function ProviderProspectCard({
  row,
  onStartOutreach,
  overflowMenu,
}: {
  row: ProviderProspectRow;
  onStartOutreach: () => void;
  overflowMenu?: React.ReactNode;
}) {
  // v9 final: subtitle matches the materialized StakeholderCard
  // pattern ({campus} · Provider) so clicking the card doesn't
  // visually morph the row. Provider tag lives in the subtitle
  // rather than as a separate pill (the Pill disappeared after
  // materialization, creating design drift across the same row).
  const subtitle = [
    [row.city, row.state].filter(Boolean).join(", ") || null,
    row.campus_name,
    "Provider",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <MedjobsCard
      title={row.provider_name}
      subtitle={subtitle}
      cta={
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartOutreach();
          }}
          title="Materialize this provider into outreach and log the first step."
          className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
        >
          Log
        </button>
      }
      overflowMenu={overflowMenu}
      onClick={onStartOutreach}
      hoverTitle="Materialize this provider into outreach."
      // v9 final: virtual prospects are by definition "new — never
      // touched". Render with the unread bold-black border + bold
      // title so admin sees them as queued work to triage. Once
      // materialized + the drawer opens, the resulting row's
      // viewed_at flips and the bolding clears.
      unread
    />
  );
}
