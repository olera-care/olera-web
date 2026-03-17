"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { StudentMetadata, StudentProgramTrack } from "@/lib/types";

const PROGRAM_TRACK_LABELS: Record<StudentProgramTrack, string> = {
  pre_nursing: "Pre-Nursing",
  nursing: "Nursing",
  pre_med: "Pre-Med",
  pre_pa: "Pre-PA",
  pre_health: "Pre-Health",
  other: "Other",
};

interface Candidate {
  id: string;
  slug: string;
  display_name: string;
  email?: string;
  phone?: string;
  city: string | null;
  state: string | null;
  description: string | null;
  care_types: string[];
  metadata: StudentMetadata;
  created_at: string;
}

const PAGE_SIZE = 12;

export default function ProviderCandidateBrowsePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isProvider, setIsProvider] = useState(false);

  // Filters
  const [stateFilter, setStateFilter] = useState("");
  const [trackFilter, setTrackFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState("newest");

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        sort,
      });
      if (stateFilter) params.set("state", stateFilter);
      if (trackFilter) params.set("programTrack", trackFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/medjobs/candidates?${params}`);
      const data = await res.json();

      setCandidates(data.candidates || []);
      setTotal(data.total || 0);
      setIsProvider(data.isProvider || false);
    } catch (err) {
      console.error("[provider/medjobs/candidates] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, stateFilter, trackFilter, searchQuery, sort]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <Link href="/provider/medjobs" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            &larr; MedJobs Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Browse Candidates
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} student caregiver{total !== 1 ? "s" : ""} available
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
            />
          </div>
          <select
            value={stateFilter}
            onChange={(e) => { setStateFilter(e.target.value); setPage(0); }}
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
            onChange={(e) => { setTrackFilter(e.target.value); setPage(0); }}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-sm"
          >
            <option value="">All Tracks</option>
            {Object.entries(PROGRAM_TRACK_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(0); }}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
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
              const meta = candidate.metadata;
              return (
                <div
                  key={candidate.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-gray-200 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary-600">
                        {candidate.display_name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/provider/medjobs/candidates/${candidate.slug}`}
                        className="text-base font-semibold text-gray-900 hover:text-primary-600 transition-colors truncate block"
                      >
                        {candidate.display_name}
                      </Link>
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
                    </div>
                  )}

                  {/* Contact info — visible to providers */}
                  {isProvider && (candidate.email || candidate.phone) && (
                    <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
                      {candidate.email && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                          </svg>
                          <a href={`mailto:${candidate.email}`} className="hover:text-primary-600 truncate">{candidate.email}</a>
                        </div>
                      )}
                      {candidate.phone && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                          </svg>
                          <a href={`tel:${candidate.phone}`} className="hover:text-primary-600">{candidate.phone}</a>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4">
                    <Link
                      href={`/provider/medjobs/candidates/${candidate.slug}`}
                      className="block w-full text-center px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 text-sm font-medium rounded-lg transition-colors"
                    >
                      View Full Profile
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
  );
}
