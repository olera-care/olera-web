"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import BrowseCard from "@/components/browse/BrowseCard";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import { candidateToCardFormat, candidateMatchLabel } from "@/lib/medjobs/candidate-card";
import { SAMPLE_CANDIDATES } from "@/lib/medjobs/demo-candidate";
import CandidateDetailPanel from "@/components/medjobs/CandidateDetailPanel";
import ScheduleInterviewModal from "@/components/medjobs/ScheduleInterviewModal";
import { PARTNER_UNIVERSITIES } from "@/lib/staffing-outreach/partner-universities";
import type { CandidateData } from "@/components/medjobs/CandidateRow";

/**
 * HireCaregiversBoard — the signed-in provider's "Hire Caregivers" board at
 * /provider/medjobs/candidates. The provider mirror of the student Find Jobs
 * board: catchment students on a campus map + "Schedule interview." Auto-filters
 * to the provider's own catchment (city/state → partner university); providers
 * outside any catchment see the demo set. No post-a-job machinery (MVP).
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
  const providerProfile = profiles?.find((p) => p.type === "organization" || p.type === "caregiver");
  const matchBuckets = (
    (providerProfile?.metadata as Record<string, unknown> | undefined)?.[
      "medjobs_demand_profile"
    ] as { coverage_buckets?: string[] } | undefined
  )?.coverage_buckets;

  const [universities, setUniversities] = useState<University[]>([]);
  const [universityId, setUniversityId] = useState("");
  const [availability, setAvailability] = useState("");
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateData | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<CandidateData | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  // null = unknown/not yet resolved; false = provider not near any partner campus
  // (→ show demos); true = in a catchment (→ show that campus's real students).
  const [inCatchment, setInCatchment] = useState<boolean | null>(null);
  const autoFilteredRef = useRef(false);

  // Universities for the dropdown + catchment id mapping.
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

  // Auto-filter to the provider's own catchment: resolve their city/state →
  // partner university → the matching medjobs_universities row. Runs once, after
  // the university list loads. No catchment match → show demos.
  useEffect(() => {
    if (autoFilteredRef.current || universities.length === 0 || !providerProfile?.id) return;
    autoFilteredRef.current = true;
    (async () => {
      try {
        const sb = createClient();
        const { data } = await sb
          .from("business_profiles")
          .select("city, state")
          .eq("id", providerProfile.id)
          .single();
        const pcity = (data?.city as string | undefined)?.trim().toLowerCase();
        const pstate = (data?.state as string | undefined)?.trim().toUpperCase();
        if (!pcity || !pstate) {
          setInCatchment(false);
          return;
        }
        const matchUni = PARTNER_UNIVERSITIES.find((u) =>
          u.catchment.some((c) => c.city.toLowerCase() === pcity && c.state.toUpperCase() === pstate),
        );
        if (!matchUni) {
          setInCatchment(false);
          return;
        }
        const med = universities.find((u) => u.name.toLowerCase() === matchUni.name.toLowerCase());
        if (med) {
          setUniversityId(med.id);
          setInCatchment(true);
        } else {
          // Partner university with no matching medjobs_universities row — treat
          // as out-of-catchment so we fall back to demos rather than all-real.
          setInCatchment(false);
        }
      } catch {
        setInCatchment(false);
      }
    })();
  }, [universities, providerProfile?.id]);

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

  // Demo era: provider isn't near a partner campus, or their catchment has no
  // live students yet. Either way show the curated samples so the board stays
  // full (the user requested demo fallback when not in a catchment).
  const isDemoEra = !loading && (inCatchment === false || candidates.length === 0);
  const baseCards = isDemoEra ? SAMPLE_CANDIDATES : candidates;
  const filtered = baseCards.filter((c) => matchesAvailability(c, availability));
  const availLabel = AVAIL_OPTIONS.find((o) => o.value === availability)?.label ?? null;
  const mapCards = filtered
    .map((c) => candidateToCardFormat(c, isDemoEra ? { isDemo: true } : undefined))
    .filter((c) => c.lat != null && c.lon != null);

  // Options for Select dropdowns
  const universityOptions = [
    { value: "", label: "All universities" },
    ...universities.map((u) => ({ value: u.id, label: u.name })),
  ];
  const availabilityOptions = AVAIL_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
  }));
  const activeFilterCount = (universityId ? 1 : 0) + (availability ? 1 : 0);

  // Provider is signed in here; scheduling opens the modal directly (the terms
  // opt-in lives inside it). Demo cards link to the demo detail page instead.
  const openSchedule = (c: CandidateData) => setScheduleTarget(c);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
      <div className="mb-5">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Hire Caregivers</h1>
        <p className="text-gray-500 mt-1">
          Browse student caregivers {campusName ? `near ${campusName}` : "near you"} and schedule interviews.
        </p>
      </div>

      {/* Mobile: Filter chips + Filters button */}
      <div className="mb-5 flex items-center gap-2 sm:hidden">
        {universityId && (
          <button
            onClick={() => setUniversityId("")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-full text-xs font-medium text-primary-700"
          >
            <span className="truncate max-w-[100px]">
              {universities.find((u) => u.id === universityId)?.name || "University"}
            </span>
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {availability && (
          <button
            onClick={() => setAvailability("")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-full text-xs font-medium text-primary-700"
          >
            <span>{availLabel}</span>
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={() => setShowMobileFilters(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 bg-primary-500 text-white text-xs font-semibold rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Desktop: Inline Select dropdowns */}
      <div className="mb-5 hidden sm:flex items-center gap-3">
        <div className="w-48">
          <Select
            options={universityOptions}
            value={universityId}
            onChange={setUniversityId}
            placeholder="All universities"
            ariaLabel="Filter by university"
            size="sm"
            searchable={universities.length > 8}
            searchPlaceholder="Search universities..."
          />
        </div>
        <div className="w-40">
          <Select
            options={availabilityOptions}
            value={availability}
            onChange={setAvailability}
            placeholder="All availability"
            ariaLabel="Filter by availability"
            size="sm"
          />
        </div>
        {(universityId || availability) && (
          <button
            type="button"
            onClick={() => { setUniversityId(""); setAvailability(""); }}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear filters
          </button>
        )}
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
              {filtered.map((c) =>
                isDemoEra ? (
                  <BrowseCard
                    key={c.id}
                    provider={candidateToCardFormat(c, { isDemo: true })}
                    variant="candidate"
                    isDemo
                  />
                ) : (
                  <div
                    key={c.id}
                    onMouseEnter={() => setHoveredId(c.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={(e) => {
                      // Plain click opens the inline panel; cmd/ctrl-click opens
                      // the full profile in a new tab.
                      if (e.metaKey || e.ctrlKey) return;
                      e.preventDefault();
                      setSelectedCandidate(c);
                    }}
                    className={`cursor-pointer rounded-2xl transition-shadow ${
                      selectedCandidate?.id === c.id ? "ring-2 ring-primary-500 shadow-md" : ""
                    }`}
                  >
                    <BrowseCard
                      provider={candidateToCardFormat(c)}
                      variant="candidate"
                      href={`/medjobs/candidates/${c.slug}`}
                      matchLabel={candidateMatchLabel(matchBuckets, c) ?? undefined}
                    />
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-24 h-[calc(100vh-7rem)]">
            {selectedCandidate ? (
              <div className="w-full h-full rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-white">
                <CandidateDetailPanel
                  candidate={selectedCandidate}
                  onClose={() => setSelectedCandidate(null)}
                  onSchedule={() => openSchedule(selectedCandidate)}
                />
              </div>
            ) : (
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-sm border border-gray-200 isolate">
                <CampusMap providers={mapCards} hoveredProviderId={hoveredId} onMarkerHover={setHoveredId} campusCenter={campusCenter} />
              </div>
            )}
          </div>
        </div>
      </div>

      {scheduleTarget && (
        <ScheduleInterviewModal
          studentProfileId={scheduleTarget.id}
          otherName={scheduleTarget.display_name}
          onClose={() => setScheduleTarget(null)}
          onScheduled={() => setScheduleTarget(null)}
        />
      )}

      {/* Mobile filter bottom sheet */}
      <Modal
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        title="Filters"
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => {
                setUniversityId("");
                setAvailability("");
              }}
              className="flex-1 py-3.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => setShowMobileFilters(false)}
              className="flex-1 py-3.5 text-sm font-semibold text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition-colors"
            >
              Show caregivers
            </button>
          </div>
        }
      >
        <div className="space-y-6 pt-2">
          {/* University filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              University
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setUniversityId("")}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  !universityId
                    ? "bg-primary-100 text-primary-700 border-2 border-primary-400"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
                }`}
              >
                All universities
              </button>
              {universities.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setUniversityId(u.id)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    universityId === u.id
                      ? "bg-primary-100 text-primary-700 border-2 border-primary-400"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {u.name}
                </button>
              ))}
            </div>
          </div>

          {/* Availability filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Availability
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAIL_OPTIONS.map((opt) => (
                <button
                  key={opt.value || "all"}
                  type="button"
                  onClick={() => setAvailability(opt.value)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    availability === opt.value
                      ? "bg-primary-100 text-primary-700 border-2 border-primary-400"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
