"use client";

import { useState, useEffect, useCallback } from "react";
import { INTENDED_SCHOOL_LABELS } from "@/lib/medjobs-helpers";
import { LocationFilterDropdown } from "@/components/ui/LocationFilterDropdown";

// ============================================================
// Filter Options
// ============================================================

const CERTIFICATION_OPTIONS = [
  { value: "CNA", label: "CNA" },
  { value: "BLS", label: "BLS" },
  { value: "CPR / First Aid", label: "CPR / First Aid" },
  { value: "HHA", label: "HHA" },
  { value: "Medication Aide", label: "Medication Aide" },
  { value: "Phlebotomy", label: "Phlebotomy" },
];

const AVAILABILITY_OPTIONS = [
  { value: "weekends", label: "Weekends" },
  { value: "evenings", label: "Evenings" },
  { value: "overnights", label: "Overnights" },
  { value: "in_between_classes", label: "Between classes" },
];

const HOURS_OPTIONS = [
  { value: "5-10", label: "5–10 hrs/wk" },
  { value: "10-15", label: "10–15 hrs/wk" },
  { value: "15-20", label: "15–20 hrs/wk" },
  { value: "20+", label: "20+ hrs/wk" },
];

const TRACK_OPTIONS = Object.entries(INTENDED_SCHOOL_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const LANGUAGE_OPTIONS = [
  { value: "English", label: "English" },
  { value: "Spanish", label: "Spanish" },
  { value: "Mandarin", label: "Mandarin" },
  { value: "Vietnamese", label: "Vietnamese" },
  { value: "Hindi", label: "Hindi" },
  { value: "Tagalog", label: "Tagalog" },
  { value: "Arabic", label: "Arabic" },
  { value: "Korean", label: "Korean" },
  { value: "French", label: "French" },
];

// ============================================================
// Types
// ============================================================

export interface CandidateFiltersState {
  cities: string[];
  certifications: string[];
  availability: string[];
  hoursPerWeek: string;
  track: string;
  languages: string[];
  hasVideo: boolean;
}

export const DEFAULT_CANDIDATE_FILTERS: CandidateFiltersState = {
  cities: [],
  certifications: [],
  availability: [],
  hoursPerWeek: "",
  track: "",
  languages: [],
  hasVideo: false,
};

export interface CandidateCounts {
  byCity: { city: string; state: string; count: number }[];
  byCertification: Record<string, number>;
  byAvailability: Record<string, number>;
  byHours: Record<string, number>;
  byTrack: Record<string, number>;
  byLanguage: Record<string, number>;
  withVideo: number;
  total: number;
}

interface CandidateFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: CandidateFiltersState;
  onApply: (filters: CandidateFiltersState) => void;
  candidateCounts?: CandidateCounts;
}

// ============================================================
// Helper: Count active filters
// ============================================================

export function countActiveCandidateFilters(filters: CandidateFiltersState): number {
  return (
    filters.cities.length +
    filters.certifications.length +
    filters.availability.length +
    (filters.hoursPerWeek !== "" ? 1 : 0) +
    (filters.track !== "" ? 1 : 0) +
    filters.languages.length +
    (filters.hasVideo ? 1 : 0)
  );
}

// ============================================================
// Filter Labels for Chips
// ============================================================

export const CANDIDATE_FILTER_LABELS: Record<string, Record<string, string>> = {
  certifications: Object.fromEntries(CERTIFICATION_OPTIONS.map((o) => [o.value, o.label])),
  availability: Object.fromEntries(AVAILABILITY_OPTIONS.map((o) => [o.value, o.label])),
  hoursPerWeek: Object.fromEntries(HOURS_OPTIONS.map((o) => [o.value, o.label])),
  track: Object.fromEntries(TRACK_OPTIONS.map((o) => [o.value, o.label])),
  languages: Object.fromEntries(LANGUAGE_OPTIONS.map((o) => [o.value, o.label])),
};

// ============================================================
// Main Component
// ============================================================

export default function CandidateFiltersModal({
  isOpen,
  onClose,
  filters,
  onApply,
  candidateCounts,
}: CandidateFiltersModalProps) {
  // Local state for editing (apply on confirm)
  const [localFilters, setLocalFilters] = useState<CandidateFiltersState>(filters);

  // City search state
  const [citySearch, setCitySearch] = useState("");

  // Sync local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
      setCitySearch("");
    }
  }, [isOpen, filters]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleCityToggle = useCallback((cityKey: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      cities: prev.cities.includes(cityKey)
        ? prev.cities.filter((c) => c !== cityKey)
        : [...prev.cities, cityKey],
    }));
  }, []);

  const handleClear = useCallback(() => {
    setLocalFilters(DEFAULT_CANDIDATE_FILTERS);
    setCitySearch("");
  }, []);

  const handleApply = useCallback(() => {
    onApply(localFilters);
    onClose();
  }, [localFilters, onApply, onClose]);

  const toggleArrayFilter = useCallback(
    (key: "certifications" | "availability" | "languages", value: string) => {
      setLocalFilters((prev) => ({
        ...prev,
        [key]: prev[key].includes(value)
          ? prev[key].filter((v) => v !== value)
          : [...prev[key], value],
      }));
    },
    []
  );

  const activeFilterCount = countActiveCandidateFilters(localFilters);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal - Desktop: centered, Mobile: bottom sheet */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] flex flex-col animate-slide-up sm:animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Filters apply to both tabs
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close filters"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filter sections */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            {/* Location filter - collapsed dropdown with multi-select */}
            {(candidateCounts?.byCity?.length ?? 0) > 0 && (
              <LocationFilterDropdown
                cities={candidateCounts?.byCity ?? []}
                selectedCities={localFilters.cities}
                onToggle={handleCityToggle}
                citySearch={citySearch}
                onSearchChange={setCitySearch}
              />
            )}

            {/* Certifications filter */}
            <FilterSection title="Certifications">
              <div className="space-y-2">
                {CERTIFICATION_OPTIONS.map((option) => {
                  const count = candidateCounts?.byCertification?.[option.value] ?? 0;
                  return (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={localFilters.certifications.includes(option.value)}
                        onChange={() => toggleArrayFilter("certifications", option.value)}
                        className="w-4 h-4 accent-gray-900 border-gray-300 rounded focus:ring-gray-200"
                      />
                      <span className="flex-1 text-[15px] text-gray-700 group-hover:text-gray-900">
                        {option.label}
                      </span>
                      {count > 0 && (
                        <span className="text-sm text-gray-400">({count})</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </FilterSection>

            {/* Availability filter */}
            <FilterSection title="Availability">
              <div className="space-y-2">
                {AVAILABILITY_OPTIONS.map((option) => {
                  const count = candidateCounts?.byAvailability?.[option.value] ?? 0;
                  return (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={localFilters.availability.includes(option.value)}
                        onChange={() => toggleArrayFilter("availability", option.value)}
                        className="w-4 h-4 accent-gray-900 border-gray-300 rounded focus:ring-gray-200"
                      />
                      <span className="flex-1 text-[15px] text-gray-700 group-hover:text-gray-900">
                        {option.label}
                      </span>
                      {count > 0 && (
                        <span className="text-sm text-gray-400">({count})</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </FilterSection>

            {/* Hours per week filter */}
            <FilterSection title="Hours per week">
              <div className="space-y-2">
                {HOURS_OPTIONS.map((option) => {
                  const count = candidateCounts?.byHours?.[option.value] ?? 0;
                  return (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="hoursPerWeek"
                        checked={localFilters.hoursPerWeek === option.value}
                        onChange={() =>
                          setLocalFilters((prev) => ({
                            ...prev,
                            hoursPerWeek: prev.hoursPerWeek === option.value ? "" : option.value,
                          }))
                        }
                        className="w-4 h-4 accent-gray-900 border-gray-300 focus:ring-gray-200"
                      />
                      <span className="flex-1 text-[15px] text-gray-700 group-hover:text-gray-900">
                        {option.label}
                      </span>
                      {count > 0 && (
                        <span className="text-sm text-gray-400">({count})</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </FilterSection>

            {/* Career track filter */}
            <FilterSection title="Career Track">
              <div className="space-y-2">
                {TRACK_OPTIONS.map((option) => {
                  const count = candidateCounts?.byTrack?.[option.value] ?? 0;
                  return (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="track"
                        checked={localFilters.track === option.value}
                        onChange={() =>
                          setLocalFilters((prev) => ({
                            ...prev,
                            track: prev.track === option.value ? "" : option.value,
                          }))
                        }
                        className="w-4 h-4 accent-gray-900 border-gray-300 focus:ring-gray-200"
                      />
                      <span className="flex-1 text-[15px] text-gray-700 group-hover:text-gray-900">
                        {option.label}
                      </span>
                      {count > 0 && (
                        <span className="text-sm text-gray-400">({count})</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </FilterSection>

            {/* Languages filter */}
            <FilterSection title="Languages">
              <div className="space-y-2">
                {LANGUAGE_OPTIONS.map((option) => {
                  const count = candidateCounts?.byLanguage?.[option.value] ?? 0;
                  return (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={localFilters.languages.includes(option.value)}
                        onChange={() => toggleArrayFilter("languages", option.value)}
                        className="w-4 h-4 accent-gray-900 border-gray-300 rounded focus:ring-gray-200"
                      />
                      <span className="flex-1 text-[15px] text-gray-700 group-hover:text-gray-900">
                        {option.label}
                      </span>
                      {count > 0 && (
                        <span className="text-sm text-gray-400">({count})</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </FilterSection>

            {/* Has video filter */}
            <FilterSection title="Video">
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={localFilters.hasVideo}
                    onChange={(e) =>
                      setLocalFilters((prev) => ({ ...prev, hasVideo: e.target.checked }))
                    }
                    className="w-4 h-4 accent-gray-900 border-gray-300 rounded focus:ring-gray-200"
                  />
                  <span className="flex-1 text-[15px] text-gray-700 group-hover:text-gray-900">
                    Has intro video
                  </span>
                  {(candidateCounts?.withVideo ?? 0) > 0 && (
                    <span className="text-sm text-gray-400">({candidateCounts?.withVideo})</span>
                  )}
                </label>
              </div>
            </FilterSection>
          </div>

          {/* Footer with actions */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2.5 text-[15px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-6 py-2.5 text-[15px] font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            >
              Apply{activeFilterCount > 0 && ` (${activeFilterCount})`}
            </button>
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fade-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.25s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}

// ============================================================
// Sub-components
// ============================================================

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left mb-3"
      >
        <span className="text-[15px] font-semibold text-gray-900">{title}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div>{children}</div>}
    </div>
  );
}

