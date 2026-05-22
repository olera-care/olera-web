"use client";

/**
 * v9.0 Phase 7 Commit P: Candidates page — operational scope.
 *
 * Shows candidates with at least one pending Step Board task — same
 * operational denominator as the In Basket Candidates tab and the
 * sidebar Candidates fraction. Past actions live in Logs filtered
 * to source=candidate.
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
      // v9.0 Phase 7 Commit P: operational scope — candidates with
      // pending tasks only. Quiet candidates live in Logs.
      const r = await fetch(
        "/api/admin/student-outreach/candidates?with_pending_task=true",
      );
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
        Live candidates with active Step Board work. Past actions live in{" "}
        <a
          href="/admin/medjobs/logs?source=candidate"
          className="font-medium text-primary-700 underline hover:no-underline"
        >
          Logs
        </a>
        .
      </p>

      {/* v9.0 Phase 7 Commit M: keep rows rendered during background
          refetches; "Loading…" only on first load. */}
      {loading && rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-600">{error}</p>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-12 text-center text-sm text-gray-400">
          No candidates with pending steps right now. View past activity in{" "}
          <a
            href="/admin/medjobs/logs?source=candidate"
            className="font-medium text-primary-700 underline hover:no-underline"
          >
            Logs
          </a>
          .
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
