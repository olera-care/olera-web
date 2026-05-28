"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import CandidateCard from "@/components/medjobs/CandidateCard";
import type { CandidateData } from "@/components/medjobs/CandidateRow";
import CandidateFiltersModal, {
  DEFAULT_CANDIDATE_FILTERS,
  countActiveCandidateFilters,
  CANDIDATE_FILTER_LABELS,
  type CandidateFiltersState,
} from "@/components/medjobs/CandidateFiltersModal";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 12;

type FilterTab = "all" | "contacted";

export default function ProviderCandidateBrowsePage() {
  const { user } = useAuth();

  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<CandidateFiltersState>(DEFAULT_CANDIDATE_FILTERS);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [contacted, setContacted] = useState<Set<string>>(new Set());
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);

  // Fetch existing interviews to know which candidates have been contacted
  useEffect(() => {
    if (!user) return;

    const fetchExistingInterviews = async () => {
      try {
        const res = await fetch("/api/medjobs/interviews");
        if (!res.ok) return;
        const data = await res.json();
        // Build set of student IDs that provider has already contacted
        // Exclude cancelled/no_show interviews so provider can re-schedule
        const contactedIds = new Set<string>();
        const activeStatuses = ["proposed", "confirmed", "rescheduled", "completed"];
        for (const interview of data.interviews || []) {
          // Only count active interviews initiated by the provider (provider → student)
          if (
            interview.proposed_by === interview.provider_profile_id &&
            activeStatuses.includes(interview.status)
          ) {
            contactedIds.add(interview.student_profile_id);
          }
        }
        setContacted(contactedIds);
      } catch {
        // Silently fail
      }
    };

    fetchExistingInterviews();
  }, [user]);

  const fetchCandidates = useCallback(
    async (page: number) => {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(page - 1), // API uses 0-indexed pages
          pageSize: String(PAGE_SIZE),
          sort: "newest",
        });
        if (filters.city) params.set("city", filters.city);
        if (filters.state) params.set("state", filters.state);
        if (filters.track) params.set("programTrack", filters.track);
        if (filters.certifications.length > 0) {
          params.set("certifications", filters.certifications.join(","));
        }
        if (filters.availability.length > 0) {
          params.set("availability", filters.availability.join(","));
        }
        if (filters.hoursPerWeek) params.set("hoursPerWeek", filters.hoursPerWeek);
        if (filters.languages.length > 0) {
          params.set("languages", filters.languages.join(","));
        }
        if (filters.hasVideo) params.set("hasVideo", "true");

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

  const handleApplyFilters = useCallback((newFilters: CandidateFiltersState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handlePageChange = (page: number) => {
    fetchCandidates(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRemoveFilter = (key: string, value?: string) => {
    if (key === "location") {
      setFilters((prev) => ({ ...prev, city: "", state: "" }));
    } else if (key === "hoursPerWeek" || key === "track") {
      setFilters((prev) => ({ ...prev, [key]: "" }));
    } else if (key === "hasVideo") {
      setFilters((prev) => ({ ...prev, hasVideo: false }));
    } else if (key === "certifications" || key === "availability" || key === "languages") {
      if (value) {
        setFilters((prev) => ({
          ...prev,
          [key]: prev[key].filter((v) => v !== value),
        }));
      }
    }
  };

  const handleClearAllFilters = () => {
    setFilters(DEFAULT_CANDIDATE_FILTERS);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const activeFilterCount = countActiveCandidateFilters(filters);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header - matches Outreach pattern */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 sm:py-8">
            {/* Back link */}
            <Link
              href="/provider/matches"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
              Find Families
            </Link>

            <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 tracking-tight">
              Hire Caregivers
            </h1>
            <p className="text-[15px] text-gray-500 mt-1">
              Pre-vetted students pursuing careers in healthcare
            </p>
          </div>

          {/* Tabs row */}
          <div className="flex items-center justify-between gap-4 -mb-px">
            {/* Tabs */}
            <div className="flex items-center gap-6 lg:gap-8">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`relative pb-3 text-[15px] transition-colors whitespace-nowrap ${
                  activeTab === "all"
                    ? "font-semibold text-gray-900"
                    : "font-normal text-gray-400 hover:text-gray-600"
                }`}
              >
                All{total > 0 ? ` (${total})` : ""}
                {activeTab === "all" && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("contacted")}
                className={`relative pb-3 text-[15px] transition-colors whitespace-nowrap ${
                  activeTab === "contacted"
                    ? "font-semibold text-gray-900"
                    : "font-normal text-gray-400 hover:text-gray-600"
                }`}
              >
                Contacted{contacted.size > 0 ? ` (${contacted.size})` : ""}
                {activeTab === "contacted" && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900" />
                )}
              </button>
            </div>

            {/* Filters button (desktop) */}
            <button
              type="button"
              onClick={() => setIsFiltersModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-primary-600 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {/* Location chip */}
            {(filters.city || filters.state) && (
              <FilterChip
                label={filters.city ? `${filters.city}, ${filters.state}` : filters.state}
                onRemove={() => handleRemoveFilter("location")}
              />
            )}

            {/* Certifications chips */}
            {filters.certifications.map((cert) => (
              <FilterChip
                key={cert}
                label={CANDIDATE_FILTER_LABELS.certifications[cert] || cert}
                onRemove={() => handleRemoveFilter("certifications", cert)}
              />
            ))}

            {/* Availability chips */}
            {filters.availability.map((avail) => (
              <FilterChip
                key={avail}
                label={CANDIDATE_FILTER_LABELS.availability[avail] || avail}
                onRemove={() => handleRemoveFilter("availability", avail)}
              />
            ))}

            {/* Hours chip */}
            {filters.hoursPerWeek && (
              <FilterChip
                label={CANDIDATE_FILTER_LABELS.hoursPerWeek[filters.hoursPerWeek] || filters.hoursPerWeek}
                onRemove={() => handleRemoveFilter("hoursPerWeek")}
              />
            )}

            {/* Track chip */}
            {filters.track && (
              <FilterChip
                label={CANDIDATE_FILTER_LABELS.track[filters.track] || filters.track}
                onRemove={() => handleRemoveFilter("track")}
              />
            )}

            {/* Languages chips */}
            {filters.languages.map((lang) => (
              <FilterChip
                key={lang}
                label={CANDIDATE_FILTER_LABELS.languages[lang] || lang}
                onRemove={() => handleRemoveFilter("languages", lang)}
              />
            ))}

            {/* Has video chip */}
            {filters.hasVideo && (
              <FilterChip
                label="Has video"
                onRemove={() => handleRemoveFilter("hasVideo")}
              />
            )}

            {/* Clear all */}
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors ml-1"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden animate-pulse"
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
        ) : (() => {
          // Filter candidates based on active tab
          const filteredCandidates = activeTab === "contacted"
            ? candidates.filter((c) => contacted.has(c.id))
            : candidates;

          if (filteredCandidates.length === 0 && activeTab === "contacted") {
            return (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm font-medium">
                  No candidates contacted yet.
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Browse caregivers and schedule interviews to get started.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className="mt-4 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  View all caregivers &rarr;
                </button>
              </div>
            );
          }

          return (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCandidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    basePath="/provider/medjobs/candidates"
                    isContacted={contacted.has(candidate.id)}
                  />
                ))}
              </div>

              {/* Pagination - only show for "All" tab */}
              {activeTab === "all" && totalPages > 1 && (
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
          );
        })()}
      </div>

      {/* Filters Modal */}
      <CandidateFiltersModal
        isOpen={isFiltersModalOpen}
        onClose={() => setIsFiltersModalOpen(false)}
        filters={filters}
        onApply={handleApplyFilters}
      />

      {/* Mobile FAB for Filters */}
      <button
        type="button"
        onClick={() => setIsFiltersModalOpen(true)}
        className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="Open filters"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
        </svg>
        {activeFilterCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-white text-primary-600 text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
            {activeFilterCount}
          </span>
        )}
      </button>
    </div>
  );
}

// Filter chip component
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors group"
    >
      <span>{label}</span>
      <svg
        className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}
