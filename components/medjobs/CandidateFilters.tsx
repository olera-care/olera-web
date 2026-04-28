"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import { US_STATES } from "@/lib/us-states";
import { INTENDED_SCHOOL_LABELS } from "@/lib/medjobs-helpers";
import { useCitySearch } from "@/hooks/use-city-search";
import { useClickOutside } from "@/hooks/use-click-outside";

// ============================================================
// Types
// ============================================================

export interface CandidateFilterValues {
  city: string;
  state: string;
  certifications: string[];
  availability: string[];
  hoursPerWeek: string;
  track: string;
  languages: string[];
  hasVideo: boolean;
  sort: string;
}

interface CandidateFiltersProps {
  filters: CandidateFilterValues;
  onChange: (filters: CandidateFilterValues) => void;
  showSort?: boolean;
  /** Total candidates matching current filters (for mobile "Show X" button) */
  totalResults?: number;
}

// ============================================================
// Constants
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

const HOURS_OPTIONS = [
  { value: "", label: "Any hours" },
  { value: "5-10", label: "5–10 hrs/wk" },
  { value: "10-15", label: "10–15 hrs/wk" },
  { value: "15-20", label: "15–20 hrs/wk" },
  { value: "20+", label: "20+ hrs/wk" },
];

const TRACK_OPTIONS = [
  { value: "", label: "All tracks" },
  ...Object.entries(INTENDED_SCHOOL_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const STATE_OPTIONS = [
  { value: "", label: "All states" },
  ...US_STATES,
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

// ============================================================
// Sub-components
// ============================================================

/** Multi-select dropdown with checkboxes */
function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  placeholder,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const displayText = selected.length > 0
    ? selected.length === 1
      ? options.find((o) => o.value === selected[0])?.label || selected[0]
      : `${selected.length} selected`
    : placeholder;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between gap-2 w-full px-3.5 py-2.5
          bg-white border rounded-xl text-sm font-medium
          transition-all duration-200 min-h-[44px]
          ${selected.length > 0
            ? "border-primary-400 text-gray-900"
            : "border-gray-200 text-gray-600 hover:border-gray-300"
          }
          ${isOpen ? "ring-2 ring-primary-200 border-primary-400" : ""}
        `}
      >
        <span className="truncate">{displayText}</span>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-fade-in max-h-72 overflow-y-auto">
          <div className="px-3 py-2 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
          </div>
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => toggle(option.value)}
                className="w-4.5 h-4.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
              />
              <span className="text-sm text-gray-900">{option.label}</span>
            </label>
          ))}
          {selected.length > 0 && (
            <div className="px-3 pt-2 mt-1 border-t border-gray-100">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** City autocomplete input */
function CityAutocomplete({
  value,
  onLocationChange,
  placeholder = "City or ZIP...",
}: {
  value: string;
  /** Called with both city and state together to avoid race conditions */
  onLocationChange: (location: { city: string; state: string }) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { results, isLoading, preload } = useCitySearch(query, { limit: 6 });

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  // Sync external value changes
  useEffect(() => {
    if (value !== query && !isOpen) {
      setQuery(value);
    }
  }, [value, isOpen, query]);

  const handleSelect = (city: { city: string; state: string; full: string }) => {
    setQuery(city.full);
    onLocationChange({ city: city.city, state: city.state });
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    onLocationChange({ city: "", state: "" });
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            preload();
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 placeholder:text-gray-400 transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (results.length > 0 || isLoading) && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50 animate-fade-in max-h-64 overflow-y-auto">
          {isLoading && results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
          ) : (
            results.map((city, idx) => (
              <button
                key={`${city.city}-${city.state}-${idx}`}
                type="button"
                onClick={() => handleSelect(city)}
                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm text-gray-900 transition-colors"
              >
                <span className="font-medium">{city.city}</span>
                <span className="text-gray-500">, {city.state}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function CandidateFilters({
  filters,
  onChange,
  showSort = true,
  totalResults,
}: CandidateFiltersProps) {
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

  const update = useCallback(
    (partial: Partial<CandidateFilterValues>) => onChange({ ...filters, ...partial }),
    [filters, onChange]
  );

  // Count active filters (excluding default values)
  // Location (city + state) counts as 1 filter, not 2
  const hasLocationFilter = filters.city !== "" || filters.state !== "";
  const activeFilterCount = [
    hasLocationFilter,
    filters.certifications.length > 0,
    filters.availability.length > 0,
    filters.hoursPerWeek !== "",
    filters.track !== "",
    filters.languages.length > 0,
    filters.hasVideo,
  ].filter(Boolean).length;

  const resetFilters = () => {
    onChange({
      city: "",
      state: "",
      certifications: [],
      availability: [],
      hoursPerWeek: "",
      track: "",
      languages: [],
      hasVideo: false,
      sort: "newest",
    });
  };

  // Get location display text
  const locationDisplay = filters.city && filters.state
    ? `${filters.city}, ${filters.state}`
    : filters.state
    ? US_STATES.find((s) => s.value === filters.state)?.label || filters.state
    : "";

  return (
    <>
      {/* ════════════════════════════════════════════════════════════
          MOBILE LAYOUT
      ════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-3 sm:hidden mb-6">
        {/* Location input */}
        <CityAutocomplete
          value={filters.city ? `${filters.city}, ${filters.state}` : ""}
          onLocationChange={({ city, state }) => update({ city, state })}
          placeholder="City, state, or ZIP..."
        />

        {/* Active filter chips + filter button */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {/* Active filter chips */}
          {filters.certifications.length > 0 && (
            <button
              onClick={() => setFilterModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-full text-xs font-medium text-primary-700 whitespace-nowrap"
            >
              <span>{filters.certifications.length} cert{filters.certifications.length > 1 ? "s" : ""}</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {filters.availability.length > 0 && (
            <button
              onClick={() => setFilterModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-full text-xs font-medium text-primary-700 whitespace-nowrap"
            >
              <span>{filters.availability.length} avail</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {filters.track && (
            <button
              onClick={() => update({ track: "" })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-full text-xs font-medium text-primary-700 whitespace-nowrap"
            >
              <span>{INTENDED_SCHOOL_LABELS[filters.track as keyof typeof INTENDED_SCHOOL_LABELS]}</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Filter button */}
          <button
            onClick={() => setFilterModalOpen(true)}
            className="relative flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shrink-0"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700">Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 bg-primary-500 text-white text-xs font-semibold rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          DESKTOP LAYOUT
      ════════════════════════════════════════════════════════════ */}
      <div className="hidden sm:block mb-6">
        {/* Primary filters row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* City autocomplete */}
          <div className="w-56">
            <CityAutocomplete
              value={filters.city ? `${filters.city}, ${filters.state}` : ""}
              onLocationChange={({ city, state }) => update({ city, state })}
              placeholder="City or ZIP..."
            />
          </div>

          {/* State fallback (if no city selected) */}
          {!filters.city && (
            <div className="w-40">
              <Select
                options={STATE_OPTIONS}
                value={filters.state}
                onChange={(v) => update({ state: v })}
                placeholder="State"
                size="sm"
                searchable
                searchPlaceholder="Search states..."
              />
            </div>
          )}

          {/* Certifications */}
          <div className="w-40">
            <MultiSelectDropdown
              label="Certifications"
              options={CERTIFICATION_OPTIONS}
              selected={filters.certifications}
              onChange={(v) => update({ certifications: v })}
              placeholder="Certifications"
            />
          </div>

          {/* Availability */}
          <div className="w-40">
            <MultiSelectDropdown
              label="Availability"
              options={AVAILABILITY_OPTIONS}
              selected={filters.availability}
              onChange={(v) => update({ availability: v })}
              placeholder="Availability"
            />
          </div>

          {/* More Filters toggle */}
          <button
            type="button"
            onClick={() => setMoreFiltersOpen(!moreFiltersOpen)}
            className={`
              flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-200 min-h-[44px]
              ${moreFiltersOpen || filters.hoursPerWeek || filters.track || filters.languages.length > 0 || filters.hasVideo
                ? "bg-primary-50 text-primary-700 border border-primary-200"
                : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }
            `}
          >
            <span>More filters</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${moreFiltersOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Clear all (when filters active) */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Clear all
            </button>
          )}

          {/* Sort */}
          {showSort && (
            <div className="w-36">
              <Select
                options={SORT_OPTIONS}
                value={filters.sort}
                onChange={(v) => update({ sort: v })}
                placeholder="Sort"
                size="sm"
              />
            </div>
          )}
        </div>

        {/* More filters panel (expandable) */}
        {moreFiltersOpen && (
          <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-100 animate-fade-in">
            {/* Hours per week */}
            <div className="w-40">
              <Select
                options={HOURS_OPTIONS}
                value={filters.hoursPerWeek}
                onChange={(v) => update({ hoursPerWeek: v })}
                placeholder="Hours/week"
                size="sm"
              />
            </div>

            {/* Track */}
            <div className="w-44">
              <Select
                options={TRACK_OPTIONS}
                value={filters.track}
                onChange={(v) => update({ track: v })}
                placeholder="Career track"
                size="sm"
              />
            </div>

            {/* Languages */}
            <div className="w-40">
              <MultiSelectDropdown
                label="Languages"
                options={LANGUAGE_OPTIONS}
                selected={filters.languages}
                onChange={(v) => update({ languages: v })}
                placeholder="Languages"
              />
            </div>

            {/* Has video toggle */}
            <label className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-colors min-h-[44px]">
              <input
                type="checkbox"
                checked={filters.hasVideo}
                onChange={(e) => update({ hasVideo: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">Has video</span>
            </label>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════
          MOBILE FILTER MODAL (Bottom Sheet)
      ════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        title="Filters"
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={resetFilters}
              className="flex-1 py-3.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => setFilterModalOpen(false)}
              className="flex-1 py-3.5 text-sm font-semibold text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition-colors"
            >
              {totalResults !== undefined
                ? `Show ${totalResults} caregiver${totalResults !== 1 ? "s" : ""}`
                : "Done"
              }
            </button>
          </div>
        }
      >
        <div className="space-y-6 pt-2">
          {/* Location section */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Location
            </label>
            <CityAutocomplete
              value={filters.city ? `${filters.city}, ${filters.state}` : ""}
              onLocationChange={({ city, state }) => update({ city, state })}
              placeholder="City, state, or ZIP..."
            />
            {!filters.city && (
              <div className="mt-3">
                <Select
                  options={STATE_OPTIONS}
                  value={filters.state}
                  onChange={(v) => update({ state: v })}
                  placeholder="Or select a state"
                  size="md"
                  searchable
                  searchPlaceholder="Search states..."
                />
              </div>
            )}
          </div>

          {/* Certifications section */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Certifications
            </label>
            <div className="flex flex-wrap gap-2">
              {CERTIFICATION_OPTIONS.map((cert) => (
                <button
                  key={cert.value}
                  type="button"
                  onClick={() => {
                    const isSelected = filters.certifications.includes(cert.value);
                    update({
                      certifications: isSelected
                        ? filters.certifications.filter((c) => c !== cert.value)
                        : [...filters.certifications, cert.value],
                    });
                  }}
                  className={`
                    px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${filters.certifications.includes(cert.value)
                      ? "bg-primary-100 text-primary-700 border-2 border-primary-400"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
                    }
                  `}
                >
                  {cert.label}
                </button>
              ))}
            </div>
          </div>

          {/* Availability section */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Availability
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABILITY_OPTIONS.map((avail) => (
                <button
                  key={avail.value}
                  type="button"
                  onClick={() => {
                    const isSelected = filters.availability.includes(avail.value);
                    update({
                      availability: isSelected
                        ? filters.availability.filter((a) => a !== avail.value)
                        : [...filters.availability, avail.value],
                    });
                  }}
                  className={`
                    px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${filters.availability.includes(avail.value)
                      ? "bg-primary-100 text-primary-700 border-2 border-primary-400"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
                    }
                  `}
                >
                  {avail.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hours per week section */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Hours per week
            </label>
            <Select
              options={HOURS_OPTIONS}
              value={filters.hoursPerWeek}
              onChange={(v) => update({ hoursPerWeek: v })}
              placeholder="Any hours"
              size="md"
            />
          </div>

          {/* Career track section */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Career track
            </label>
            <Select
              options={TRACK_OPTIONS}
              value={filters.track}
              onChange={(v) => update({ track: v })}
              placeholder="All tracks"
              size="md"
            />
          </div>

          {/* Languages section */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Languages
            </label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => {
                    const isSelected = filters.languages.includes(lang.value);
                    update({
                      languages: isSelected
                        ? filters.languages.filter((l) => l !== lang.value)
                        : [...filters.languages, lang.value],
                    });
                  }}
                  className={`
                    px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${filters.languages.includes(lang.value)
                      ? "bg-primary-100 text-primary-700 border-2 border-primary-400"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
                    }
                  `}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Has video toggle */}
          <div>
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
              <div>
                <span className="text-sm font-semibold text-gray-900">Has intro video</span>
                <p className="text-xs text-gray-500 mt-0.5">Only show candidates with video introductions</p>
              </div>
              <input
                type="checkbox"
                checked={filters.hasVideo}
                onChange={(e) => update({ hasVideo: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
          </div>

          {/* Sort section */}
          {showSort && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Sort by
              </label>
              <Select
                options={SORT_OPTIONS}
                value={filters.sort}
                onChange={(v) => update({ sort: v })}
                placeholder="Sort by"
                size="md"
              />
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

// ============================================================
// Default filter values helper
// ============================================================

export const DEFAULT_CANDIDATE_FILTERS: CandidateFilterValues = {
  city: "",
  state: "",
  certifications: [],
  availability: [],
  hoursPerWeek: "",
  track: "",
  languages: [],
  hasVideo: false,
  sort: "newest",
};
