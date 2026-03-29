"use client";

import Select from "@/components/ui/Select";
import { US_STATES } from "@/lib/us-states";
import { INTENDED_SCHOOL_LABELS } from "@/lib/medjobs-helpers";

export interface CandidateFilterValues {
  search: string;
  state: string;
  track: string;
  sort: string;
}

interface CandidateFiltersProps {
  filters: CandidateFilterValues;
  onChange: (filters: CandidateFilterValues) => void;
  showSort?: boolean;
}

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

export default function CandidateFilters({
  filters,
  onChange,
  showSort = true,
}: CandidateFiltersProps) {
  const update = (partial: Partial<CandidateFilterValues>) =>
    onChange({ ...filters, ...partial });

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {/* Search */}
      <div className="flex-1 relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search by name..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 placeholder:text-gray-400 transition-colors"
        />
      </div>

      {/* State */}
      <div className="w-full sm:w-44">
        <Select
          options={STATE_OPTIONS}
          value={filters.state}
          onChange={(v) => update({ state: v })}
          placeholder="All states"
          size="sm"
          searchable
          searchPlaceholder="Search states..."
        />
      </div>

      {/* Track */}
      <div className="w-full sm:w-44">
        <Select
          options={TRACK_OPTIONS}
          value={filters.track}
          onChange={(v) => update({ track: v })}
          placeholder="All tracks"
          size="sm"
        />
      </div>

      {/* Sort */}
      {showSort && (
        <div className="w-full sm:w-40">
          <Select
            options={SORT_OPTIONS}
            value={filters.sort}
            onChange={(v) => update({ sort: v })}
            placeholder="Sort by"
            size="sm"
          />
        </div>
      )}
    </div>
  );
}
