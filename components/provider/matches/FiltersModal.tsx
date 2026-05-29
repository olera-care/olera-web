"use client";

import { useState, useEffect, useCallback } from "react";
import { LocationFilterDropdown } from "@/components/ui/LocationFilterDropdown";

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

// Values must match what QuickProfileWizard stores (after normalization: lowercase + underscores)
const PAYMENT_OPTIONS = [
  { value: "private_pay", label: "Private Pay" },
  { value: "medicaid", label: "Medicaid" },
  { value: "medicare", label: "Medicare" },
  { value: "veterans_benefits", label: "Veterans Benefits" },
  { value: "private_insurance", label: "Private Insurance" },
];

// Values must match what ProfileEditWizard stores in relationship_to_recipient (exact strings)
const WHO_NEEDS_CARE_OPTIONS = [
  { value: "myself", label: "Self" },
  { value: "my_parent", label: "Parent" },
  { value: "my_spouse", label: "Spouse" },
  { value: "someone_else", label: "Other" },
];

const SCHEDULE_OPTIONS = [
  { value: "mornings", label: "Mornings" },
  { value: "afternoons", label: "Afternoons" },
  { value: "evenings", label: "Evenings" },
  { value: "overnight", label: "Overnight" },
  { value: "full_time", label: "Full-time / Live-in" },
  { value: "flexible", label: "Flexible" },
];

export interface FiltersState {
  distance: string;
  cities: string[];
  urgency: string[];
  careTypes: string[];
  paymentMethods: string[];
  whoNeedsCare: string[];
  schedule: string[];
  profileQuality: "all" | "complete";
}

// Sort options for Best Matches tab
export type SortOption = "recommended" | "newest" | "urgent";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest First" },
  { value: "urgent", label: "Most Urgent" },
];

export const DEFAULT_FILTERS_STATE: FiltersState = {
  distance: "any",
  cities: [],
  urgency: [],
  careTypes: [],
  paymentMethods: [],
  whoNeedsCare: [],
  schedule: [],
  profileQuality: "all",
};

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FiltersState;
  onApply: (filters: FiltersState) => void;
  familyCounts?: {
    byCity: { city: string; state: string; count: number }[];
    byUrgency: Record<string, number>;
    byCareType: Record<string, number>;
    byPayment: Record<string, number>;
    byWhoNeedsCare: Record<string, number>;
    bySchedule: Record<string, number>;
    completeProfiles: number;
    totalProfiles: number;
  };
  /** Whether the provider has coordinates for distance filtering. If false, distance filter is hidden. */
  hasProviderCoordinates?: boolean;
  /** Sort option for Best Matches tab (mobile only) */
  sortOption?: SortOption;
  /** Callback when sort option changes */
  onSortChange?: (sort: SortOption) => void;
  /** Whether to show sort options (only on Best Matches tab) */
  showSort?: boolean;
}

export default function FiltersModal({
  isOpen,
  onClose,
  filters,
  onApply,
  familyCounts,
  hasProviderCoordinates = true,
  sortOption = "recommended",
  onSortChange,
  showSort = false,
}: FiltersModalProps) {
  // Local state for editing (apply on confirm)
  const [localFilters, setLocalFilters] = useState<FiltersState>(filters);
  // Local sort state (applies on confirm, like filters)
  const [localSort, setLocalSort] = useState<SortOption>(sortOption);

  // City search state
  const [citySearch, setCitySearch] = useState("");

  // Sync local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
      setLocalSort(sortOption);
      setCitySearch("");
    }
  }, [isOpen, filters, sortOption]);

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

  const handleCityToggle = useCallback((cityKey: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      cities: prev.cities.includes(cityKey)
        ? prev.cities.filter((c) => c !== cityKey)
        : [...prev.cities, cityKey],
    }));
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

  const handlePaymentToggle = useCallback((value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(value)
        ? prev.paymentMethods.filter((v) => v !== value)
        : [...prev.paymentMethods, value],
    }));
  }, []);

  const handleWhoNeedsCareToggle = useCallback((value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      whoNeedsCare: prev.whoNeedsCare.includes(value)
        ? prev.whoNeedsCare.filter((v) => v !== value)
        : [...prev.whoNeedsCare, value],
    }));
  }, []);

  const handleScheduleToggle = useCallback((value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      schedule: prev.schedule.includes(value)
        ? prev.schedule.filter((v) => v !== value)
        : [...prev.schedule, value],
    }));
  }, []);

  const handleProfileQualityChange = useCallback((value: "all" | "complete") => {
    setLocalFilters((prev) => ({ ...prev, profileQuality: value }));
  }, []);

  const handleClear = useCallback(() => {
    setLocalFilters(DEFAULT_FILTERS_STATE);
    setLocalSort("recommended");
    setCitySearch("");
  }, []);

  const handleApply = useCallback(() => {
    onApply(localFilters);
    // Apply sort change if handler provided
    if (onSortChange && localSort !== sortOption) {
      onSortChange(localSort);
    }
    onClose();
  }, [localFilters, localSort, sortOption, onApply, onSortChange, onClose]);

  const activeFilterCount =
    (localFilters.distance !== "any" ? 1 : 0) +
    localFilters.cities.length +
    localFilters.urgency.length +
    localFilters.careTypes.length +
    localFilters.paymentMethods.length +
    localFilters.whoNeedsCare.length +
    localFilters.schedule.length +
    (localFilters.profileQuality !== "all" ? 1 : 0) +
    (showSort && localSort !== "recommended" ? 1 : 0);

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
            {/* Sort options - only shown on Best Matches tab (mobile) */}
            {showSort && (
              <FilterSection title="Sort By">
                <div className="space-y-2">
                  {SORT_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="sortOption"
                        value={option.value}
                        checked={localSort === option.value}
                        onChange={() => setLocalSort(option.value)}
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

            {/* Location filter - collapsed dropdown with multi-select */}
            {(familyCounts?.byCity?.length ?? 0) > 0 && (
              <LocationFilterDropdown
                cities={familyCounts?.byCity ?? []}
                selectedCities={localFilters.cities}
                onToggle={handleCityToggle}
                citySearch={citySearch}
                onSearchChange={setCitySearch}
              />
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

            {/* Payment Methods filter */}
            <FilterSection title="Payment Method">
              <div className="space-y-2">
                {PAYMENT_OPTIONS.map((option) => {
                  const count = familyCounts?.byPayment?.[option.value] ?? 0;
                  return (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={localFilters.paymentMethods.includes(option.value)}
                        onChange={() => handlePaymentToggle(option.value)}
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

            {/* Who Needs Care filter */}
            <FilterSection title="Who Needs Care">
              <div className="space-y-2">
                {WHO_NEEDS_CARE_OPTIONS.map((option) => {
                  const count = familyCounts?.byWhoNeedsCare?.[option.value] ?? 0;
                  return (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={localFilters.whoNeedsCare.includes(option.value)}
                        onChange={() => handleWhoNeedsCareToggle(option.value)}
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

            {/* Schedule filter */}
            <FilterSection title="Schedule">
              <div className="space-y-2">
                {SCHEDULE_OPTIONS.map((option) => {
                  const count = familyCounts?.bySchedule?.[option.value] ?? 0;
                  return (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={localFilters.schedule.includes(option.value)}
                        onChange={() => handleScheduleToggle(option.value)}
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

            {/* Profile Quality filter */}
            <FilterSection title="Profile Quality">
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="profileQuality"
                    checked={localFilters.profileQuality === "all"}
                    onChange={() => handleProfileQualityChange("all")}
                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <span className="flex-1 text-[15px] text-gray-700 group-hover:text-gray-900">
                    All profiles
                  </span>
                  {familyCounts?.totalProfiles !== undefined && (
                    <span className="text-sm text-gray-400">({familyCounts.totalProfiles})</span>
                  )}
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="profileQuality"
                    checked={localFilters.profileQuality === "complete"}
                    onChange={() => handleProfileQualityChange("complete")}
                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <span className="flex-1 text-[15px] text-gray-700 group-hover:text-gray-900">
                    Complete profiles only (80%+)
                  </span>
                  {familyCounts?.completeProfiles !== undefined && (
                    <span className="text-sm text-gray-400">({familyCounts.completeProfiles})</span>
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
    filters.cities.length +
    filters.urgency.length +
    filters.careTypes.length +
    filters.paymentMethods.length +
    filters.whoNeedsCare.length +
    filters.schedule.length +
    (filters.profileQuality !== "all" ? 1 : 0)
  );
}
