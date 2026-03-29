"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type { StudentMetadata } from "@/lib/types";
import CandidateRow from "@/components/medjobs/CandidateRow";
import type { CandidateData } from "@/components/medjobs/CandidateRow";
import CandidateFilters from "@/components/medjobs/CandidateFilters";
import type { CandidateFilterValues } from "@/components/medjobs/CandidateFilters";

const PAGE_SIZE = 20;

export default function ProviderCandidateBrowsePage() {
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isProvider, setIsProvider] = useState(false);
  const [filters, setFilters] = useState<CandidateFilterValues>({
    search: "",
    state: "",
    track: "",
    sort: "newest",
  });

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        sort: filters.sort,
      });
      if (filters.state) params.set("state", filters.state);
      if (filters.search.trim()) params.set("search", filters.search.trim());
      if (filters.track) params.set("programTrack", filters.track);

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
  }, [page, filters]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const handleFilterChange = useCallback(
    (newFilters: CandidateFilterValues) => {
      if (newFilters.search !== filters.search) {
        setFilters((prev) => ({ ...prev, search: newFilters.search }));
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          setFilters(newFilters);
          setPage(0);
        }, 300);
      } else {
        setFilters(newFilters);
        setPage(0);
      }
    },
    [filters.search]
  );

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#FAFAF8] py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <Link
              href="/provider/medjobs"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              &larr; MedJobs Dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              Browse Candidates
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {total} student caregiver{total !== 1 ? "s" : ""} available
            </p>
          </div>
          <Link
            href="/medjobs/candidates"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Public view &rarr;
          </Link>
        </div>

        {/* Filters */}
        <CandidateFilters
          filters={filters}
          onChange={handleFilterChange}
          showSort
        />

        {/* Results */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-4 px-5 py-5 border-b border-gray-100 last:border-b-0 animate-pulse"
              >
                <div className="w-11 h-11 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-sm">
              No candidates found matching your filters.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-100">
              {candidates.map((candidate) => (
                <CandidateRow
                  key={candidate.id}
                  candidate={candidate}
                  basePath="/provider/medjobs/candidates"
                  showContact={isProvider}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={(page + 1) * PAGE_SIZE >= total}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
