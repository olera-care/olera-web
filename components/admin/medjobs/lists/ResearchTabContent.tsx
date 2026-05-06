"use client";

/**
 * Prospects-tab content. v9.0 Phase 4 simplification: filter chips
 * + bulk-select + Ready-to-email controls dropped. Cards render at
 * full width, two simple sections (provider prospects + stakeholder
 * rows). Bulk features can return once the core workflow is stable.
 */

import type { ReactNode } from "react";
import type { TabRow } from "@/lib/student-outreach/types";
import type { ProviderProspectRow } from "@/lib/student-outreach/tab-config";
import { ProviderProspectCard } from "../cards/ProviderProspectCard";

export function ResearchTabContent({
  rows,
  providerProspects,
  renderRow,
  onStartProviderOutreach,
  tabCountsAll,
}: {
  rows: TabRow[];
  /** v9.0 Phase 2 Tier 3: virtual provider prospects from catchment. */
  providerProspects: ProviderProspectRow[];
  renderRow: (row: TabRow) => ReactNode;
  onStartProviderOutreach: (row: ProviderProspectRow) => void;
  tabCountsAll: number;
}) {
  const totalAvailable = providerProspects.length + rows.length;

  if (totalAvailable === 0) {
    const headline = tabCountsAll === 0 ? "Nothing here yet." : "✓ All caught up.";
    const headlineColor = tabCountsAll === 0 ? "text-gray-700" : "text-emerald-700";
    return (
      <div className="py-12 text-center">
        <p className={`text-sm font-medium ${headlineColor}`}>{headline}</p>
        <p className="mt-1 text-xs text-gray-500">
          Add a provider partner near a school to start student outreach.
        </p>
        <a
          href="/admin/staffing-outreach"
          className="mt-4 inline-block rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Open Staffing Outreach →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {providerProspects.length > 0 && (
        <div>
          <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Provider prospects ({providerProspects.length})
          </h3>
          <ul className="space-y-2">
            {providerProspects.map((p) => (
              <li key={p.id}>
                <ProviderProspectCard
                  row={p}
                  onStartOutreach={() => onStartProviderOutreach(p)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <div>
          <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Stakeholders in research ({rows.length})
          </h3>
          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.id}>{renderRow(row)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
