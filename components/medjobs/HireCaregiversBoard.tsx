"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import BrowseCard from "@/components/browse/BrowseCard";
import { candidateToCardFormat, candidateMatchLabel } from "@/lib/medjobs/candidate-card";
import { SAMPLE_CANDIDATES } from "@/lib/medjobs/demo-candidate";
import { isMedjobsEligible } from "@/lib/medjobs/eligibility";
import type { CandidateData } from "@/components/medjobs/CandidateRow";

/**
 * HireCaregiversBoard — the signed-in provider's "Hire caregivers" board at
 * /provider/medjobs/candidates (the provider mirror of the student JobsBoard).
 * Candidate tiles + a campus map, filtered by university and availability.
 * Reuses the public candidate feed + BrowseMap; demo fallback keeps it full.
 */

const CampusMap = dynamic(() => import("@/components/browse/CampusMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 rounded-2xl animate-pulse flex items-center justify-center">
      <span className="text-sm text-gray-400">Loading map…</span>
    </div>
  ),
});

interface University {
  id: string;
  name: string;
  state: string | null;
  lat: number | null;
  lng: number | null;
}

const AVAIL_OPTIONS = [
  { label: "All availability", value: "" },
  { label: "Days", value: "in_between_classes" },
  { label: "Evenings", value: "evenings" },
  { label: "Weekends", value: "weekends" },
  { label: "Overnights", value: "overnights" },
  { label: "PRN", value: "prn" },
  { label: "Full-time", value: "full_time" },
];

function matchesAvailability(c: CandidateData, val: string): boolean {
  if (!val) return true;
  const meta = c.metadata;
  if (val === "prn") return !!meta.prn_willing;
  if (val === "full_time") return /30|40|full/i.test(meta.hours_per_week_range ?? "");
  return (meta.availability_types ?? []).includes(val);
}

export default function HireCaregiversBoard() {
  const { profiles } = useAuth();
  const providerProfile = profiles?.find((p) => p.type === "organization");
  const matchBuckets = (
    (providerProfile?.metadata as Record<string, unknown> | undefined)?.[
      "medjobs_demand_profile"
    ] as { coverage_buckets?: string[] } | undefined
  )?.coverage_buckets;
  const eligible = isMedjobsEligible(
    (providerProfile?.metadata ?? null) as Record<string, unknown> | null,
  );

  const [universities, setUniversities] = useState<University[]>([]);
  const [universityId, setUniversityId] = useState("");
  const [availability, setAvailability] = useState("");
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // "Post a Job" is a placeholder for now — see the HANDOFF note by the modal.
  const [showPostJob, setShowPostJob] = useState(false);

  useEffect(() => {
    const sb = createClient();
    sb.from("medjobs_universities")
      .select("id, name, state, lat, lng")
      .eq("is_active", true)
      .order("name")
      .then(({ data }: { data: University[] | null }) => {
        if (data) setUniversities(data);
      });
  }, []);

  const fetchCandidates = useCallback(async (uniId: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: "newest", loadAll: "true" });
      if (uniId) params.set("universityId", uniId);
      const res = await fetch(`/api/medjobs/candidates?${params}`);
      const data = await res.json();
      setCandidates(data.candidates || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates(universityId);
  }, [universityId, fetchCandidates]);

  const selectedUni = universities.find((u) => u.id === universityId);
  const campusName = selectedUni?.name ?? null;
  const campusCenter =
    selectedUni?.lat != null && selectedUni?.lng != null
      ? { lat: selectedUni.lat, lng: selectedUni.lng }
      : null;
  // Demo era (no real students yet) → fall back to the curated samples so both
  // the cards AND the map stay populated. They carry Austin-area coords.
  const isDemoEra = !loading && candidates.length === 0;
  const baseCards = candidates.length > 0 ? candidates : SAMPLE_CANDIDATES;
  const filtered = baseCards.filter((c) => matchesAvailability(c, availability));
  const availLabel = AVAIL_OPTIONS.find((o) => o.value === availability)?.label ?? null;
  const mapCards = filtered
    .map((c) => candidateToCardFormat(c, isDemoEra ? { isDemo: true } : undefined))
    .filter((c) => c.lat != null && c.lon != null);

  const selectClass = "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome banner — a note from Dr. DuBose for eligible providers */}
      {eligible && (
        <div className="mb-8 rounded-2xl border border-primary-100/60 bg-gradient-to-r from-primary-50 to-vanilla-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <Image
                src="/images/for-providers/team/logan.jpg"
                alt="Dr. Logan DuBose"
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 rounded-full object-cover shadow-sm"
              />
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-gray-900">You&apos;re all set.</p>
                <p className="mt-0.5 text-sm text-gray-600 leading-relaxed">
                  Now let&apos;s post a job and interview and hire a caregiver.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
              <button
                type="button"
                onClick={() => setShowPostJob(true)}
                className="inline-flex items-center rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Post a Job →
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Find caregivers {campusName ? `near ${campusName}` : "near you"}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <select value={universityId} onChange={(e) => setUniversityId(e.target.value)} className={selectClass}>
            <option value="">All universities</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <select value={availability} onChange={(e) => setAvailability(e.target.value)} className={selectClass}>
            {AVAIL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-64 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-12 text-center">
              <p className="text-gray-500">
                No {availLabel ? availLabel.toLowerCase() : "matching"} caregivers near {campusName || "you"} yet.
              </p>
              {availability && (
                <button type="button" onClick={() => setAvailability("")} className="mt-3 text-sm font-semibold text-primary-700 hover:underline">
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((c) => (
                <div key={c.id} onMouseEnter={() => setHoveredId(c.id)} onMouseLeave={() => setHoveredId(null)}>
                  {isDemoEra ? (
                    <BrowseCard provider={candidateToCardFormat(c, { isDemo: true })} variant="candidate" isDemo />
                  ) : (
                    <BrowseCard
                      provider={candidateToCardFormat(c)}
                      variant="candidate"
                      href={`/medjobs/candidates/${c.slug}`}
                      matchLabel={candidateMatchLabel(matchBuckets, c) ?? undefined}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-24 h-[calc(100vh-7rem)]">
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-sm border border-gray-200 isolate">
              <CampusMap providers={mapCards} hoveredProviderId={hoveredId} onMarkerHover={setHoveredId} campusCenter={campusCenter} />
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────
          HANDOFF (Post a Job): placeholder only. The "Post a Job →" button in
          the welcome banner opens this coming-soon modal. The real flow is the
          next build — replace this modal with the post-job form and, on submit,
          write a `MedJobsJobPost` (type already defined in lib/types.ts). Pick
          this up on a fresh branch; the button wiring (showPostJob) is the seam.
          ─────────────────────────────────────────────────────────────────── */}
      {showPostJob && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowPostJob(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-serif text-xl text-gray-900">Post a Job</h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              Coming soon. You&apos;ll be able to post a job, then interview and hire a
              caregiver right here.
            </p>
            <button
              type="button"
              onClick={() => setShowPostJob(false)}
              className="mt-5 w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
