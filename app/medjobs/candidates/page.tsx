"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
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
  image_url: string | null;
  created_at: string;
}

const PAGE_SIZE = 12;

// Gradient backgrounds for candidates without photos
const GRADIENTS = [
  "from-primary-400 to-teal-500",
  "from-teal-400 to-emerald-500",
  "from-primary-500 to-cyan-500",
  "from-emerald-400 to-teal-500",
  "from-cyan-400 to-primary-500",
  "from-teal-500 to-primary-400",
];

function getGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

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
      .select("id, slug, display_name, city, state, description, care_types, metadata, image_url, created_at", { count: "exact" })
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-[3/4] bg-gray-200" />
                <div className="p-5">
                  <div className="h-5 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-100 rounded w-1/2 mt-2" />
                  <div className="mt-4 h-3 bg-gray-100 rounded w-full" />
                  <div className="mt-2 h-3 bg-gray-100 rounded w-3/4" />
                  <div className="mt-4 flex gap-2">
                    <div className="h-6 bg-gray-100 rounded-full w-16" />
                    <div className="h-6 bg-gray-100 rounded-full w-20" />
                  </div>
                  <div className="mt-5 h-10 bg-gray-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">No candidates found matching your filters.</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {candidates.map((candidate) => {
                const meta = candidate.metadata as StudentMetadata;
                const careTypes = meta.care_experience_types || [];
                const certs = meta.certifications || [];
                return (
                  <div
                    key={candidate.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all group flex flex-col"
                  >
                    {/* Photo */}
                    <div className="relative aspect-[3/4] overflow-hidden">
                      {candidate.image_url ? (
                        <Image
                          src={candidate.image_url}
                          alt={candidate.display_name}
                          fill
                          className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${getGradient(candidate.id)} flex items-center justify-center`}>
                          <span className="text-6xl font-bold text-white/80">
                            {candidate.display_name?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      {/* Name and University */}
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                        {candidate.display_name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate mt-0.5">
                        {meta.university || "University not specified"}
                      </p>

                      {/* Structured Criteria */}
                      <div className="mt-3 space-y-2.5 flex-1">
                        {/* Program Track */}
                        {meta.program_track && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-14 shrink-0">Track</span>
                            <span className="px-2.5 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold">
                              {PROGRAM_TRACK_LABELS[meta.program_track]}
                            </span>
                          </div>
                        )}

                        {/* Location */}
                        {(candidate.city || candidate.state) && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-14 shrink-0">Location</span>
                            <span className="text-xs text-gray-600">
                              {[candidate.city, candidate.state].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        )}

                        {/* Availability */}
                        {meta.availability_type && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-14 shrink-0">Avail.</span>
                            <span className="text-xs text-gray-600 capitalize">
                              {meta.availability_type.replace(/_/g, " ")}
                              {meta.hours_per_week ? ` / ${meta.hours_per_week} hrs/wk` : ""}
                            </span>
                          </div>
                        )}

                        {/* Care Experience */}
                        {careTypes.length > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-gray-400 w-14 shrink-0 pt-0.5">Care</span>
                            <div className="flex flex-wrap gap-1">
                              {careTypes.slice(0, 3).map((type) => (
                                <span key={type} className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded-full text-xs">
                                  {type}
                                </span>
                              ))}
                              {careTypes.length > 3 && (
                                <span className="px-2 py-0.5 text-gray-400 text-xs">
                                  +{careTypes.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Certifications */}
                        {certs.length > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-gray-400 w-14 shrink-0 pt-0.5">Certs</span>
                            <div className="flex flex-wrap gap-1">
                              {certs.slice(0, 3).map((cert) => (
                                <span key={cert} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                  {cert.split(" (")[0]}
                                </span>
                              ))}
                              {certs.length > 3 && (
                                <span className="px-2 py-0.5 text-gray-400 text-xs">
                                  +{certs.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Verified Hours */}
                        {(meta.total_verified_hours ?? 0) > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-14 shrink-0">Hours</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {meta.total_verified_hours} verified
                            </span>
                          </div>
                        )}
                      </div>

                      {/* View Profile Button */}
                      <Link
                        href={`/medjobs/candidates/${candidate.slug}`}
                        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl text-sm font-semibold transition-colors"
                      >
                        View Profile
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
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
