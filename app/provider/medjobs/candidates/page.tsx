"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import CandidateCard from "@/components/medjobs/CandidateCard";
import type { CandidateData } from "@/components/medjobs/CandidateRow";
import CandidateFilters from "@/components/medjobs/CandidateFilters";
import type { CandidateFilterValues } from "@/components/medjobs/CandidateFilters";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 12;

export default function ProviderCandidateBrowsePage() {
  const { activeProfile } = useAuth();

  // Verification check
  const isVerified = activeProfile?.verification_state === "verified";
  const verificationState = activeProfile?.verification_state;
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<CandidateFilterValues>({
    search: "",
    state: "",
    track: "",
    sort: "newest",
  });

  const fetchCandidates = useCallback(
    async (page: number) => {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(page - 1), // API uses 0-indexed pages
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
        setCurrentPage(page);
      } catch (err) {
        console.error("[provider/medjobs/candidates] fetch error:", err);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  // Initial load + filter changes
  useEffect(() => {
    fetchCandidates(1);
  }, [fetchCandidates]);

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

  const handlePageChange = (page: number) => {
    fetchCandidates(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      {/* Hero header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-8 sm:pt-8 sm:pb-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
            <Link
              href="/provider"
              className="hover:text-primary-600 transition-colors"
            >
              Dashboard
            </Link>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-600">Hire Staff</span>
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
        {/* Verification banner - show if not verified */}
        {!isVerified && (
          <VerificationAccessBanner verificationState={verificationState} />
        )}
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
                className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-5 bg-gray-100 rounded w-2/3" />
                      <div className="h-4 bg-gray-50 rounded w-4/5" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-50 rounded w-3/4" />
                    <div className="h-4 bg-gray-50 rounded w-1/2" />
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex justify-between">
                    <div className="h-4 bg-gray-100 rounded w-24" />
                    <div className="h-4 bg-gray-50 rounded w-20" />
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
                  basePath="/provider/medjobs/candidates"
                  isVerified={isVerified}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={total}
                  itemsPerPage={PAGE_SIZE}
                  onPageChange={handlePageChange}
                  itemLabel="caregivers"
                />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function VerificationAccessBanner({
  verificationState,
}: {
  verificationState?: string;
}) {
  const isPending = verificationState === "pending";

  return (
    <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          {isPending ? (
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900">
            {isPending ? "Verification in Progress" : "Limited Access Mode"}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {isPending
              ? "We're reviewing your verification request. Once approved, you'll see full candidate profiles and be able to contact caregivers directly."
              : "You're seeing limited information. Verify your business to unlock full profiles, contact details, and hiring features."}
          </p>
          {!isPending && (
            <Link
              href="/provider/verification"
              className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-amber-700 hover:text-amber-800"
            >
              Complete verification
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
