"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import CandidateCard from "@/components/medjobs/CandidateCard";
import type { CandidateData } from "@/components/medjobs/CandidateRow";
import CandidateFilters from "@/components/medjobs/CandidateFilters";
import type { CandidateFilterValues } from "@/components/medjobs/CandidateFilters";

const PAGE_SIZE = 20;

export default function CandidateBrowsePage() {
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<CandidateFilterValues>({
    search: "",
    state: "",
    track: "",
    sort: "newest",
  });

  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchCandidates = useCallback(
    async (pageNum: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          pageSize: String(PAGE_SIZE),
          sort: filters.sort,
        });
        if (filters.state) params.set("state", filters.state);
        if (filters.search.trim()) params.set("search", filters.search.trim());
        if (filters.track) params.set("programTrack", filters.track);

        const res = await fetch(`/api/medjobs/candidates?${params}`);
        const data = await res.json();

        const newCandidates = data.candidates || [];

        if (append) {
          setCandidates((prev) => [...prev, ...newCandidates]);
        } else {
          setCandidates(newCandidates);
        }

        setTotal(data.total || 0);
        setHasMore(newCandidates.length === PAGE_SIZE);
      } catch (err) {
        console.error("[medjobs/candidates] fetch error:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters]
  );

  // Initial load + filter changes
  useEffect(() => {
    setPage(0);
    fetchCandidates(0, false);
  }, [fetchCandidates]);

  // Infinite scroll — intersection observer
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchCandidates(nextPage, true);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page, fetchCandidates]);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const handleFilterChange = useCallback(
    (newFilters: CandidateFilterValues) => {
      if (newFilters.search !== filters.search) {
        setFilters((prev) => ({ ...prev, search: newFilters.search }));
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          setFilters(newFilters);
        }, 300);
      } else {
        setFilters(newFilters);
      }
    },
    [filters.search]
  );

  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      {/* Hero header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-8 sm:pt-8 sm:pb-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
            <Link
              href="/medjobs"
              className="hover:text-primary-600 transition-colors"
            >
              MedJobs
            </Link>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-600">Caregivers</span>
          </nav>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 font-display">
            Hire Local Caregivers
          </h1>
          <p className="mt-2 text-base sm:text-lg text-gray-500 max-w-2xl">
            Pre-vetted students pursuing careers in healthcare — ready to
            provide quality care in your area.
          </p>

          {/* Stats bar */}
          {total > 0 && (
            <div className="mt-4 flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 bg-primary-50 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                {total} caregiver{total !== 1 ? "s" : ""} available
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Filters */}
        <CandidateFilters
          filters={filters}
          onChange={handleFilterChange}
          showSort
        />

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
              >
                <div className="h-1 bg-gray-100" />
                <div className="p-5 pt-4">
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className="w-14 h-14 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 rounded w-4/5" />
                    </div>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <div className="h-6 bg-gray-100 rounded-full w-20" />
                    <div className="h-6 bg-gray-100 rounded-full w-24" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-medium">
              No caregivers found matching your filters.
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Try broadening your search or removing some filters.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  basePath="/medjobs/candidates"
                />
              ))}
            </div>

            {/* Loading more indicator */}
            {loadingMore && (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
              </div>
            )}

            {/* Infinite scroll sentinel */}
            {hasMore && !loadingMore && <div ref={sentinelRef} className="h-1" />}

            {/* End of list */}
            {!hasMore && candidates.length > 0 && (
              <div className="mt-8 text-center">
                <div className="inline-flex flex-col items-center gap-2 px-6 py-4 bg-white rounded-2xl border border-gray-100">
                  <p className="text-sm text-gray-500">
                    Want to see contact details and reach out directly?
                  </p>
                  <Link
                    href="/provider/medjobs/candidates"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    Sign in as a Provider
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
