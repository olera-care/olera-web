"use client";

/**
 * v9 final: Sites page. Lightweight organizational anchor surface
 * for MedJobs. Each card lists a university territory with a single
 * "See stakeholders →" action that navigates to the site's
 * stakeholder list page.
 *
 * No operational chrome here — Sites are not work objects. Operational
 * tasks (Prospects / Replies / Calls / Meetings) live in In Basket.
 * The Site drawer + Step Board were removed; this surface is purely
 * organizational.
 *
 * Add Site is the only header action — picking a university from the
 * partner-universities preset POSTs to /api/admin/student-outreach/
 * campuses and refetches. Once created, the new card appears below
 * and clicking it navigates to the campus management page.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteCard } from "@/components/admin/medjobs/cards/SiteCard";
import { AddSiteModal } from "@/components/admin/medjobs/AddSiteModal";
import { PartnerSourcingModal } from "@/components/admin/medjobs/PartnerSourcingModal";
import PulseHeader from "@/components/admin/PulseHeader";
import type { DateRangeValue } from "@/components/admin/DateRangePopover";
import type { CampusRow } from "@/lib/student-outreach/tab-config";
import { useMedJobsRefresh } from "@/hooks/useMedJobsRefresh";

export default function SitesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<CampusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [sourcingSite, setSourcingSite] = useState<CampusRow | null>(null);
  const [range, setRange] = useState<DateRangeValue>({
    preset: "30d",
    customFrom: "",
    customTo: "",
  });

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

  useEffect(() => {
    refetch();
  }, [refetch]);
  useMedJobsRefresh(refetch);

  const openSitePage = useCallback(
    (slug: string) => {
      router.push(`/admin/student-outreach/campus/${slug}`);
    },
    [router],
  );

  return (
    <div>
      <PulseHeader
        title="MedJobs · Sites"
        kpiSuffix="sites added"
        statsPath="/api/admin/student-outreach/stats?metric=campuses"
        range={range}
        onRangeChange={setRange}
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            + Add Site
          </button>
        }
      />
      <p className="-mt-6 mb-6 text-sm text-gray-500">
        Active university territories. Click a site to see its stakeholders.
        Operational work for each site lives in{" "}
        <a
          href="/admin/medjobs/in-basket"
          className="font-medium text-primary-700 underline hover:no-underline"
        >
          In Basket
        </a>
        .
      </p>

      {loading && rows.length === 0 ? (
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
                onView={() => openSitePage(r.slug)}
                onFindPartners={() => setSourcingSite(r)}
              />
            </li>
          ))}
        </ul>
      )}

      {showAdd && (
        <AddSiteModal
          existingSlugs={new Set(rows.map((r) => r.slug))}
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            void refetch();
          }}
        />
      )}

      {sourcingSite && (
        <PartnerSourcingModal
          campusSlug={sourcingSite.slug}
          universityName={sourcingSite.name}
          onClose={() => setSourcingSite(null)}
          onAccepted={() => void refetch()}
        />
      )}
    </div>
  );
}
