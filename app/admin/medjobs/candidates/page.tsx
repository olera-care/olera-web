"use client";

/**
 * v9.0 Phase 6: Candidates page. Live student profiles visible to
 * providers on the job board (Candidates ⊂ Signups). Reference
 * inventory view — admins browse the live supply, click into
 * individual candidate profiles for detail.
 */

import { useCallback, useEffect, useState } from "react";
import { CandidateCard } from "@/components/admin/medjobs/cards/SpecialtyCards";
import { CardOverflowMenu } from "@/components/admin/medjobs/cards/CardOverflowMenu";
import { Drawer } from "@/app/admin/student-outreach/Drawer";
import PulseHeader from "@/components/admin/PulseHeader";
import type { DateRangeValue } from "@/components/admin/DateRangePopover";
import type { CandidateRow } from "@/lib/student-outreach/tab-config";
import { useMedJobsRefresh } from "@/hooks/useMedJobsRefresh";

export default function CandidatesPage() {
  const [rows, setRows] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<DateRangeValue>({ preset: "30d", customFrom: "", customTo: "" });
  const [openCandidateId, setOpenCandidateId] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/student-outreach/candidates");
      if (!r.ok) throw new Error((await r.json()).error || "Failed to load candidates");
      const d = await r.json();
      setRows(d.rows ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);
  useMedJobsRefresh(refetch);

  return (
    <div>
      <PulseHeader
        title="MedJobs · Candidates"
        kpiSuffix="live candidates"
        statsPath="/api/admin/student-outreach/stats?metric=candidates"
        range={range}
        onRangeChange={setRange}
      />
      <p className="-mt-6 mb-6 text-sm text-gray-500">
        Live student profiles visible to providers on the job board.
      </p>

      {loading ? (
        <p className="py-12 text-center text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-600">{error}</p>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-12 text-center text-sm text-gray-400">
          No live candidates yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <CandidateCard
                row={r}
                onOpen={() => setOpenCandidateId(r.id)}
                overflowMenu={
                  <CardOverflowMenu
                    items={[
                      {
                        label: "Open profile editor",
                        onClick: () => {
                          window.location.href = `/admin/medjobs/${r.id}`;
                        },
                      },
                      {
                        label: "Add custom step",
                        onClick: () => setOpenCandidateId(r.id),
                      },
                    ]}
                  />
                }
              />
            </li>
          ))}
        </ul>
      )}

      {openCandidateId && (
        <Drawer
          candidateId={openCandidateId}
          onClose={() => setOpenCandidateId(null)}
          onAction={() => { void refetch(); }}
        />
      )}
    </div>
  );
}
