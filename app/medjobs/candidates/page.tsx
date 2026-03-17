"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import type { StudentMetadata, StudentProgramTrack } from "@/lib/types";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PROGRAM_TRACK_LABELS: Record<StudentProgramTrack, string> = {
  pre_nursing: "Pre-Nursing",
  nursing: "Nursing",
  pre_med: "Pre-Med",
  pre_pa: "Pre-PA",
  pre_health: "Pre-Health",
  other: "Other",
};

interface StudentProfile {
  id: string;
  slug: string;
  display_name: string;
  city: string | null;
  state: string | null;
  description: string | null;
  care_types: string[];
  metadata: StudentMetadata;
  created_at: string;
}

const PAGE_SIZE = 12;

export default function CandidateBrowsePage() {
  const [candidates, setCandidates] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  // Filters
  const [stateFilter, setStateFilter] = useState("");
  const [trackFilter, setTrackFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCandidates = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("business_profiles")
      .select("id, slug, display_name, city, state, description, care_types, metadata, created_at", { count: "exact" })
      .eq("type", "student")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (stateFilter) {
      query = query.eq("state", stateFilter);
    }

    if (searchQuery.trim()) {
      query = query.ilike("display_name", `%${searchQuery.trim()}%`);
    }

    const { data, count } = await query;

    let filtered = (data || []) as StudentProfile[];

    // Client-side filter for metadata fields (program_track is in JSONB)
    if (trackFilter) {
      filtered = filtered.filter(
        (c) => (c.metadata as StudentMetadata)?.program_track === trackFilter
      );
    }

    setCandidates(filtered);
    setTotal(count || 0);
    setLoading(false);
  }, [page, stateFilter, trackFilter, searchQuery]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleFilterChange = useCallback(() => {
    setPage(0);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <Link href="/medjobs" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              &larr; MedJobs
            </Link>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
              Student Candidates
            </h1>
            <p className="mt-1 text-gray-500">
              {total} student{total !== 1 ? "s" : ""} available
            </p>
          </div>
          <Link
            href="/medjobs/apply"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            Apply as Student
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); handleFilterChange(); }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
              />
            </div>
            <select
              value={stateFilter}
              onChange={(e) => { setStateFilter(e.target.value); handleFilterChange(); }}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-sm"
            >
              <option value="">All States</option>
              <option value="TX">Texas</option>
              <option value="CA">California</option>
              <option value="NY">New York</option>
              <option value="FL">Florida</option>
            </select>
            <select
              value={trackFilter}
              onChange={(e) => { setTrackFilter(e.target.value); handleFilterChange(); }}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-sm"
            >
              <option value="">All Tracks</option>
              {Object.entries(PROGRAM_TRACK_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mt-2" />
                  </div>
                </div>
                <div className="mt-4 h-3 bg-gray-100 rounded" />
                <div className="mt-2 h-3 bg-gray-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">No candidates found matching your filters.</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidates.map((candidate) => {
                const meta = candidate.metadata as StudentMetadata;
                return (
                  <Link
                    key={candidate.id}
                    href={`/medjobs/candidates/${candidate.slug}`}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-gray-200 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary-600">
                          {candidate.display_name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                          {candidate.display_name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {meta.university || "University not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                      {meta.program_track && (
                        <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full font-medium">
                          {PROGRAM_TRACK_LABELS[meta.program_track]}
                        </span>
                      )}
                      {candidate.city && candidate.state && (
                        <span>{candidate.city}, {candidate.state}</span>
                      )}
                      {meta.availability_type && (
                        <span className="capitalize">{meta.availability_type.replace(/_/g, " ")}</span>
                      )}
                    </div>

                    {(meta.certifications?.length ?? 0) > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {meta.certifications!.slice(0, 3).map((cert) => (
                          <span key={cert} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                            {cert.split(" (")[0]}
                          </span>
                        ))}
                        {meta.certifications!.length > 3 && (
                          <span className="px-2 py-0.5 text-gray-400 text-xs">
                            +{meta.certifications!.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {(meta.total_verified_hours ?? 0) > 0 && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {meta.total_verified_hours} verified hours
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {total > PAGE_SIZE && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {page + 1} of {Math.ceil(total / PAGE_SIZE)}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={(page + 1) * PAGE_SIZE >= total}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
