"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import CandidateRow from "@/components/medjobs/CandidateRow";
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
    <main className="min-h-screen bg-[#FAFAF8] py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <Link
              href="/medjobs"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              &larr; MedJobs
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              Student Candidates
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {total > 0 && `${total} student${total !== 1 ? "s" : ""} available`}
            </p>
          </div>
          <Link
            href="/medjobs/apply"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            Apply Now
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
                  basePath="/medjobs/candidates"
                />
              ))}
            </div>

            {/* Loading more indicator */}
            {loadingMore && (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
              </div>
            )}

            {/* Infinite scroll sentinel */}
            {hasMore && !loadingMore && <div ref={sentinelRef} className="h-1" />}

            {/* End of list */}
            {!hasMore && candidates.length > 0 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-400">
                  <Link
                    href="/provider/medjobs/candidates"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Sign in as a provider
                  </Link>{" "}
                  to see contact details and reach out directly.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
