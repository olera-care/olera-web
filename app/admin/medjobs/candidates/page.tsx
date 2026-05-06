"use client";

/**
 * v9.0 Phase 6: Candidates page. Live student profiles visible to
 * providers on the job board (Candidates ⊂ Signups). Reference
 * inventory view — admins browse the live supply, click into
 * individual candidate profiles for detail.
 */

import { useCallback, useEffect, useState } from "react";
import { CandidateCard } from "@/components/admin/medjobs/cards/SpecialtyCards";
import type { CandidateRow } from "@/lib/student-outreach/tab-config";
import { useMedJobsRefresh } from "@/hooks/useMedJobsRefresh";

export default function CandidatesPage() {
  const [rows, setRows] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">MedJobs · Candidates</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Live student profiles visible to providers on the job board.
        </p>
      </header>

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
              <CandidateCard row={r} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
