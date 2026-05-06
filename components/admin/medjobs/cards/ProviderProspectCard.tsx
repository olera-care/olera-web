"use client";

/**
 * v9.0 Phase 2 Tier 3: ProviderProspectCard — virtual card for a
 * provider in a campus's catchment that hasn't been materialized into
 * student_outreach yet. Same chrome as StakeholderCard but with an
 * amber accent and "Provider" pill so admin can scan provider vs
 * stakeholder rows quickly when both appear in one Prospects list.
 *
 * Materialization (clicking Start outreach actually creating a
 * student_outreach row with kind='provider') is deferred to a
 * follow-up that ships the stakeholder_type constraint relaxation
 * migration. For now the CTA is a placeholder.
 */

import { formatRelative } from "@/lib/student-outreach/formatters";
import type { ProviderProspectRow } from "@/lib/student-outreach/tab-config";

export function ProviderProspectCard({
  row,
  onStartOutreach,
}: {
  row: ProviderProspectRow;
  onStartOutreach: () => void;
}) {
  const subtitleParts = [
    [row.city, row.state].filter(Boolean).join(", ") || null,
    row.campus_name,
  ].filter(Boolean);

  return (
    <div
      className="rounded-lg border-2 border-amber-200 bg-amber-50/40 px-4 py-3 transition-colors hover:bg-amber-50"
    >
      <div className="flex items-stretch justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <p className="truncate text-sm font-medium text-gray-900">
              {row.provider_name}
            </p>
            <span className="shrink-0 rounded bg-amber-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
              Provider
            </span>
          </div>
          {subtitleParts.length > 0 && (
            <p className="mt-0.5 truncate text-xs text-gray-600">
              {subtitleParts.join(" · ")}
            </p>
          )}
          <p className="mt-0.5 text-[11px] text-gray-500">
            In catchment · provider since {formatRelative(row.created_at)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); onStartOutreach(); }}
            className="rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800"
          >
            Start outreach
          </button>
        </div>
      </div>
    </div>
  );
}
