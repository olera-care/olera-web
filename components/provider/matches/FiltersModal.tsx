"use client";

import { useState, useEffect, useCallback } from "react";

// Filter options configuration
const DISTANCE_OPTIONS = [
  { value: "any", label: "Any distance" },
  { value: "25", label: "Within 25 miles" },
  { value: "50", label: "Within 50 miles" },
  { value: "100", label: "Within 100 miles" },
];

const URGENCY_OPTIONS = [
  { value: "immediate", label: "Needs care now (ASAP)" },
  { value: "within_1_month", label: "Within 1 month" },
  { value: "within_3_months", label: "Within 3 months" },
  { value: "exploring", label: "Just exploring" },
];

const CARE_TYPE_OPTIONS = [
  { value: "home_care", label: "Home Care" },
  { value: "memory_care", label: "Memory Care" },
  { value: "assisted_living", label: "Assisted Living" },
  { value: "nursing_home", label: "Nursing Home" },
  { value: "independent_living", label: "Independent Living" },
  { value: "hospice", label: "Hospice" },
];

export interface FiltersState {
  distance: string;
  urgency: string[];
  careTypes: string[];
}

export const DEFAULT_FILTERS_STATE: FiltersState = {
  distance: "any",
  urgency: [],
  careTypes: [],
};

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FiltersState;
  onApply: (filters: FiltersState) => void;
  familyCounts?: {
    byUrgency: Record<string, number>;
    byCareType: Record<string, number>;
  };
  /** Whether the provider has coordinates for distance filtering. If false, distance filter is hidden. */
  hasProviderCoordinates?: boolean;
}

export default function FiltersModal({
  isOpen,
  onClose,
  filters,
  onApply,
  familyCounts,
  hasProviderCoordinates = true,
}: FiltersModalProps) {
  // Local state for editing (apply on confirm)
  const [localFilters, setLocalFilters] = useState<FiltersState>(filters);

  // Sync local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
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

  const handleDistanceChange = useCallback((value: string) => {
    setLocalFilters((prev) => ({ ...prev, distance: value }));
  }, []);

  const handleUrgencyToggle = useCallback((value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      urgency: prev.urgency.includes(value)
        ? prev.urgency.filter((v) => v !== value)
        : [...prev.urgency, value],
    }));
  }, []);

  const handleCareTypeToggle = useCallback((value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      careTypes: prev.careTypes.includes(value)
        ? prev.careTypes.filter((v) => v !== value)
        : [...prev.careTypes, value],
    }));
  }, []);

  const handleClear = useCallback(() => {
    setLocalFilters(DEFAULT_FILTERS_STATE);
  }, []);

  const handleApply = useCallback(() => {
    onApply(localFilters);
    onClose();
  }, [localFilters, onApply, onClose]);

  const activeFilterCount =
    (localFilters.distance !== "any" ? 1 : 0) +
    localFilters.urgency.length +
    localFilters.careTypes.length;

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
            {/* Distance filter - only shown when provider has coordinates */}
            {hasProviderCoordinates && (
              <FilterSection title="Distance">
                <div className="space-y-2">
                  {DISTANCE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="distance"
                        value={option.value}
                        checked={localFilters.distance === option.value}
                        onChange={() => handleDistanceChange(option.value)}
                        className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                      />
                      <span className="text-[15px] text-gray-700 group-hover:text-gray-900">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </FilterSection>
            )}

            {/* Urgency filter */}
            <FilterSection title="Timeline">
              <div className="space-y-2">
                {URGENCY_OPTIONS.map((option) => {
                  const count = familyCounts?.byUrgency?.[option.value] ?? 0;
                  return (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={localFilters.urgency.includes(option.value)}
                        onChange={() => handleUrgencyToggle(option.value)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
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

            {/* Care Type filter */}
            <FilterSection title="Care Type">
              <div className="space-y-2">
                {CARE_TYPE_OPTIONS.map((option) => {
                  const count = familyCounts?.byCareType?.[option.value] ?? 0;
                  return (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={localFilters.careTypes.includes(option.value)}
                        onChange={() => handleCareTypeToggle(option.value)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
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

// Collapsible filter section component
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

// Helper to count active filters
export function countActiveFilters(filters: FiltersState): number {
  return (
    (filters.distance !== "any" ? 1 : 0) +
    filters.urgency.length +
    filters.careTypes.length
  );
}
