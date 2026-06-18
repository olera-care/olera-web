"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import BrowseCard from "@/components/browse/BrowseCard";
import { candidateToCardFormat, candidateMatchLabel } from "@/lib/medjobs/candidate-card";
import { SAMPLE_CANDIDATES } from "@/lib/medjobs/demo-candidate";
import type { CandidateData } from "@/components/medjobs/CandidateRow";

/**
 * HireCaregiversBoard — the signed-in provider's "Hire caregivers" board at
 * /provider/medjobs/candidates (the provider mirror of the student JobsBoard).
 * Candidate tiles + a campus map, filtered by university and availability.
 * Reuses the public candidate feed + BrowseMap; demo fallback keeps it full.
 */

const BrowseMap = dynamic(() => import("@/components/browse/BrowseMap"), {
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

  const [universities, setUniversities] = useState<University[]>([]);
  const [universityId, setUniversityId] = useState("");
  const [availability, setAvailability] = useState("");
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const sb = createClient();
    sb.from("medjobs_universities")
      .select("id, name, state")
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

  const campusName = universities.find((u) => u.id === universityId)?.name ?? null;
  const filtered = candidates.filter((c) => matchesAvailability(c, availability));
  const showSamples = !loading && filtered.length === 0;
  const mapCards = filtered
    .map((c) => candidateToCardFormat(c))
    .filter((c) => c.lat != null && c.lon != null);

  const selectClass = "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="mb-1 text-3xl md:text-4xl font-bold text-gray-900">
        Find caregivers {campusName ? `near ${campusName}` : "near you"}
      </h1>
      <p className="mb-6 text-gray-500">
        {loading ? "Loading caregivers…" : `${filtered.length} student caregiver${filtered.length === 1 ? "" : "s"}`}
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-3">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-64 animate-pulse" />
              ))}
            </div>
          ) : showSamples ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SAMPLE_CANDIDATES.map((c) => (
                <BrowseCard key={c.id} provider={candidateToCardFormat(c, { isDemo: true })} variant="candidate" isDemo />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((c) => (
                <div key={c.id} onMouseEnter={() => setHoveredId(c.id)} onMouseLeave={() => setHoveredId(null)}>
                  <BrowseCard
                    provider={candidateToCardFormat(c)}
                    variant="candidate"
                    href={`/medjobs/candidates/${c.slug}`}
                    matchLabel={candidateMatchLabel(matchBuckets, c) ?? undefined}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-24 h-[calc(100vh-7rem)]">
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-sm border border-gray-200 isolate">
              <BrowseMap providers={mapCards} hoveredProviderId={hoveredId} onMarkerHover={setHoveredId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
