"use client";

import { useMemo, type ReactNode } from "react";
import type { TabRow } from "@/lib/student-outreach/types";
import { sortRepliesRows } from "@/lib/student-outreach/tab-config";

/**
 * One unified inbox. All rows render in a single flat list, sorted by
 * priority so high-touch items naturally surface to the top:
 *   1. Met — needs follow-up   (warmest, met in person)
 *   2. Wants to meet            (high intent, awaiting scheduling)
 *   3. Replied                  (responded to email, lower urgency)
 *   4. Awaiting callback        (voicemail / promised callback)
 *   5. Mid-cadence              (passive monitoring, no event yet)
 * Within each tier, the underlying queue order (last_edited_at desc)
 * is preserved.
 *
 * Extracted from app/admin/student-outreach/page.tsx as part of the
 * v9.0 MedJobs reorg (Phase 0).
 */
export function RepliesGroupedList({
  rows,
  renderRow,
}: {
  rows: TabRow[];
  renderRow: (row: TabRow) => ReactNode;
}) {
  const sorted = useMemo(() => sortRepliesRows(rows), [rows]);
  if (sorted.length === 0) return null;
  return (
    <ul className="space-y-2">
      {sorted.map((row) => (
        <li key={row.row_key ?? row.id}>{renderRow(row)}</li>
      ))}
    </ul>
  );
}
