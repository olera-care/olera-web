"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import CandidateCard from "@/components/medjobs/CandidateCard";
import type { CandidateData } from "@/components/medjobs/CandidateRow";
import CandidateFiltersModal, {
  DEFAULT_CANDIDATE_FILTERS,
  countActiveCandidateFilters,
  CANDIDATE_FILTER_LABELS,
  type CandidateFiltersState,
  type CandidateCounts,
} from "@/components/medjobs/CandidateFiltersModal";
import Pagination from "@/components/ui/Pagination";
import type { StudentMetadata } from "@/lib/types";

const PAGE_SIZE = 12;

type FilterTab = "all" | "contacted";

export default function ProviderCandidateBrowsePage() {
  const { user } = useAuth();

  // All candidates (loaded once, filtered client-side)
  const [allCandidates, setAllCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
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
        const contactedIds = new Set<string>();
        const activeStatuses = ["proposed", "confirmed", "rescheduled", "completed"];
        for (const interview of data.interviews || []) {
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

  // Fetch ALL candidates once (no pagination on API call)
  const fetchAllCandidates = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all candidates with loadAll=true (bypasses 50 limit)
      const res = await fetch("/api/medjobs/candidates?loadAll=true&sort=newest");
      const data = await res.json();
      setAllCandidates(data.candidates || []);
    } catch (err) {
      console.error("[provider/medjobs/candidates] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAllCandidates();
  }, [fetchAllCandidates]);

  // Client-side filtering (matches Find Families pattern)
  const filteredCandidates = useMemo(() => {
    let result = allCandidates;

    // Location filter (multi-select cities)
    if (filters.cities.length > 0) {
      result = result.filter((c) => {
        const cityKey = `${c.city || ""}|${c.state || ""}`;
        return filters.cities.includes(cityKey);
      });
    }

    // Track filter
    if (filters.track) {
      result = result.filter((c) => {
        const meta = c.metadata as StudentMetadata;
        return meta?.intended_professional_school === filters.track;
      });
    }

    // Certifications filter (must have ALL selected)
    if (filters.certifications.length > 0) {
      result = result.filter((c) => {
        const meta = c.metadata as StudentMetadata;
        const certs = meta?.certifications || [];
        return filters.certifications.every((cert) => certs.includes(cert));
      });
    }

    // Availability filter (must have ANY selected)
    if (filters.availability.length > 0) {
      result = result.filter((c) => {
        const meta = c.metadata as StudentMetadata;
        const avail = meta?.availability_types || [];
        return filters.availability.some((a) => avail.includes(a));
      });
    }

    // Hours per week filter
    if (filters.hoursPerWeek) {
      result = result.filter((c) => {
        const meta = c.metadata as StudentMetadata;
        if (meta?.hours_per_week_range === filters.hoursPerWeek) return true;
        const hours = meta?.hours_per_week;
        if (typeof hours === "number") {
          if (filters.hoursPerWeek === "5-10" && hours >= 5 && hours <= 10) return true;
          if (filters.hoursPerWeek === "10-15" && hours > 10 && hours <= 15) return true;
          if (filters.hoursPerWeek === "15-20" && hours > 15 && hours <= 20) return true;
          if (filters.hoursPerWeek === "20+" && hours > 20) return true;
        }
        return false;
      });
    }

    // Languages filter (must speak ANY selected)
    if (filters.languages.length > 0) {
      result = result.filter((c) => {
        const meta = c.metadata as StudentMetadata;
        const langs = meta?.languages || [];
        return filters.languages.some((lang) => langs.includes(lang));
      });
    }

    // Has video filter
    if (filters.hasVideo) {
      result = result.filter((c) => {
        const meta = c.metadata as StudentMetadata;
        return !!meta?.video_intro_url;
      });
    }

    return result;
  }, [allCandidates, filters]);

  // Compute counts for filter badges (from ALL candidates, not filtered)
  const candidateCounts = useMemo<CandidateCounts>(() => {
    const cityMap: Record<string, { city: string; state: string; count: number }> = {};
    const byCertification: Record<string, number> = {};
    const byAvailability: Record<string, number> = {};
    const byHours: Record<string, number> = {};
    const byTrack: Record<string, number> = {};
    const byLanguage: Record<string, number> = {};
    let withVideo = 0;

    for (const candidate of allCandidates) {
      const meta = candidate.metadata as StudentMetadata;

      // City/Location
      if (candidate.city) {
        const cityKey = `${candidate.city}|${candidate.state || ""}`;
        if (!cityMap[cityKey]) {
          cityMap[cityKey] = { city: candidate.city, state: candidate.state || "", count: 0 };
        }
        cityMap[cityKey].count++;
      }

      // Certifications
      for (const cert of meta?.certifications || []) {
        byCertification[cert] = (byCertification[cert] || 0) + 1;
      }

      // Availability
      for (const avail of meta?.availability_types || []) {
        byAvailability[avail] = (byAvailability[avail] || 0) + 1;
      }

      // Hours per week
      const hoursRange = meta?.hours_per_week_range;
      if (hoursRange) {
        byHours[hoursRange] = (byHours[hoursRange] || 0) + 1;
      } else {
        const hours = meta?.hours_per_week;
        if (typeof hours === "number") {
          if (hours >= 5 && hours <= 10) byHours["5-10"] = (byHours["5-10"] || 0) + 1;
          else if (hours > 10 && hours <= 15) byHours["10-15"] = (byHours["10-15"] || 0) + 1;
          else if (hours > 15 && hours <= 20) byHours["15-20"] = (byHours["15-20"] || 0) + 1;
          else if (hours > 20) byHours["20+"] = (byHours["20+"] || 0) + 1;
        }
      }

      // Track
      const track = meta?.intended_professional_school;
      if (track) {
        byTrack[track] = (byTrack[track] || 0) + 1;
      }

      // Languages
      for (const lang of meta?.languages || []) {
        byLanguage[lang] = (byLanguage[lang] || 0) + 1;
      }

      // Video
      if (meta?.video_intro_url) {
        withVideo++;
      }
    }

    // Convert cityMap to sorted array (by count descending)
    const byCity = Object.values(cityMap).sort((a, b) => b.count - a.count);

    return {
      byCity,
      byCertification,
      byAvailability,
      byHours,
      byTrack,
      byLanguage,
      withVideo,
      total: allCandidates.length,
    };
  }, [allCandidates]);

  // Apply tab filter
  const tabFilteredCandidates = useMemo(() => {
    if (activeTab === "contacted") {
      return filteredCandidates.filter((c) => contacted.has(c.id));
    }
    return filteredCandidates;
  }, [filteredCandidates, activeTab, contacted]);

  // Client-side pagination
  const totalPages = Math.ceil(tabFilteredCandidates.length / PAGE_SIZE);
  const paginatedCandidates = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return tabFilteredCandidates.slice(startIndex, startIndex + PAGE_SIZE);
  }, [tabFilteredCandidates, currentPage]);

  // Reset to page 1 when filters or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, activeTab]);

  const handleApplyFilters = useCallback((newFilters: CandidateFiltersState) => {
    setFilters(newFilters);
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRemoveFilter = (key: string, value?: string) => {
    if (key === "hoursPerWeek" || key === "track") {
      setFilters((prev) => ({ ...prev, [key]: "" }));
    } else if (key === "hasVideo") {
      setFilters((prev) => ({ ...prev, hasVideo: false }));
    } else if (key === "cities" || key === "certifications" || key === "availability" || key === "languages") {
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

  const activeFilterCount = countActiveCandidateFilters(filters);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 sm:py-8">
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
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`relative pb-3 text-[15px] font-medium transition-colors ${
                  activeTab === "all"
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                All
                <span className={`ml-1.5 text-[13px] ${
                  activeTab === "all" ? "text-gray-900" : "text-gray-400"
                }`}>
                  ({filteredCandidates.length})
                </span>
                {activeTab === "all" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("contacted")}
                className={`relative pb-3 text-[15px] font-medium transition-colors ${
                  activeTab === "contacted"
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Contacted
                <span className={`ml-1.5 text-[13px] ${
                  activeTab === "contacted" ? "text-gray-900" : "text-gray-400"
                }`}>
                  ({filteredCandidates.filter((c) => contacted.has(c.id)).length})
                </span>
                {activeTab === "contacted" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {/* Location chips */}
            {filters.cities.map((cityKey) => {
              const [city, state] = cityKey.split("|");
              return (
                <FilterChip
                  key={cityKey}
                  label={state ? `${city}, ${state}` : city}
                  onRemove={() => handleRemoveFilter("cities", cityKey)}
                />
              );
            })}

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
        ) : tabFilteredCandidates.length === 0 ? (
          activeTab === "contacted" ? (
            <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
              <Image
                src="/interview.png"
                alt="No interviews scheduled"
                width={180}
                height={180}
                className="mb-6"
              />
              <h3 className="text-[17px] font-display font-bold text-gray-900 mb-2">
                No interviews scheduled yet
              </h3>
              <p className="text-[15px] text-gray-500 max-w-sm leading-relaxed mb-6">
                Browse caregivers and schedule interviews to connect with pre-vetted healthcare students.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Browse caregivers
              </button>
            </div>
          ) : (
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
          )
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  basePath="/provider/medjobs/candidates"
                  isContacted={contacted.has(candidate.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={tabFilteredCandidates.length}
                  itemsPerPage={PAGE_SIZE}
                  onPageChange={handlePageChange}
                  itemLabel="caregivers"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Filters Modal */}
      <CandidateFiltersModal
        isOpen={isFiltersModalOpen}
        onClose={() => setIsFiltersModalOpen(false)}
        filters={filters}
        onApply={handleApplyFilters}
        candidateCounts={candidateCounts}
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
