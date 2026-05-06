"use client";

/**
 * v9.0 Phase 7: Sites page. The territorial-primitive surface for
 * MedJobs — every activated university territory, with stage-aware
 * cards (Prospecting providers / Research needed / Researching
 * stakeholders / Active). Renamed from "Campuses" to "Sites" in the
 * UI; the underlying DB table (`student_outreach_campuses`) and API
 * route (`/api/admin/medjobs/campuses`) keep their existing names.
 *
 * Add Site is a primary header action — replaces the sidebar trigger
 * removed in the v9.0 Phase 7 sidebar simplification. Picking a
 * university from the partner-universities preset POSTs to
 * /api/admin/student-outreach/campuses and refetches.
 *
 * Reference + management surface — not a triage queue. Site-level
 * tasks needing action surface in In Basket via the Sites tab.
 */

import { useCallback, useEffect, useState } from "react";
import { Drawer } from "@/app/admin/student-outreach/Drawer";
import { SiteCard } from "@/components/admin/medjobs/cards/SiteCard";
import { AddSiteModal } from "@/components/admin/medjobs/AddSiteModal";
import { BulkResearchModal } from "@/app/admin/student-outreach/BulkResearchModal";
import type { CampusRow } from "@/lib/student-outreach/tab-config";
import type { ResearchCampusCard } from "@/lib/student-outreach/types";
import { useMedJobsRefresh } from "@/hooks/useMedJobsRefresh";

export default function SitesPage() {
  const [rows, setRows] = useState<CampusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [bulkResearchSite, setBulkResearchSite] = useState<ResearchCampusCard | null>(null);
  const [openOutreachId, setOpenOutreachId] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/medjobs/campuses");
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load sites");
      const data = await res.json();
      setRows((data.rows ?? []) as CampusRow[]);
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
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">MedJobs · Sites</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Activated university territories. Provider prospects in each
            catchment surface as virtual rows in In Basket; once a provider
            converts, student-stakeholder research unlocks.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Add Site
        </button>
      </header>

      {loading ? (
        <p className="py-12 text-center text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-600">{error}</p>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-12 text-center">
          <p className="text-sm font-medium text-gray-700">No sites yet.</p>
          <p className="mt-1 text-xs text-gray-500">
            Click <strong>+ Add Site</strong> to activate a university territory.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <SiteCard
                row={r}
                onAddStakeholders={() =>
                  setBulkResearchSite({
                    id: r.id,
                    slug: r.slug,
                    name: r.name,
                    state: r.state,
                    city: r.city,
                    research_stakeholder_count: r.stakeholder_count,
                    last_added_at: r.last_added_at,
                  })
                }
                onViewSite={() => {
                  window.location.href = `/admin/student-outreach/campus/${r.slug}`;
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {showAdd && (
        <AddSiteModal
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            void refetch();
          }}
        />
      )}
      {bulkResearchSite && (
        <BulkResearchModal
          campus={bulkResearchSite}
          onClose={() => setBulkResearchSite(null)}
          onSaved={async () => {
            setBulkResearchSite(null);
            await refetch();
          }}
        />
      )}
      {openOutreachId && (
        <Drawer
          outreachId={openOutreachId}
          onClose={() => setOpenOutreachId(null)}
          onAction={() => { void refetch(); }}
        />
      )}
    </div>
  );
}
