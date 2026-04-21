"use client";

import { useState } from "react";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
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
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const update = (partial: Partial<CandidateFilterValues>) =>
    onChange({ ...filters, ...partial });

  // Count active filters (excluding search and default sort)
  const activeFilterCount = [
    filters.state !== "",
    filters.track !== "",
    showSort && filters.sort !== "newest",
  ].filter(Boolean).length;

  return (
    <>
      {/* Mobile: Compact search + filter icon */}
      <div className="flex sm:hidden gap-2 mb-6">
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

        {/* Filter icon button */}
        <button
          onClick={() => setFilterModalOpen(true)}
          className="relative flex items-center justify-center w-11 h-11 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shrink-0"
          aria-label="Open filters"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          {/* Active filter badge */}
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Desktop: Horizontal filters (unchanged) */}
      <div className="hidden sm:flex flex-row gap-3 mb-6">
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
        <div className="w-44">
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
        <div className="w-44">
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
          <div className="w-40">
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

      {/* Mobile filter bottom sheet modal */}
      <Modal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        title="Filters"
        size="md"
        footer={
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                update({ state: "", track: "", sort: "newest" });
              }}
              className="flex-1 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => setFilterModalOpen(false)}
              className="flex-1 py-3 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition-colors"
            >
              Done
            </button>
          </div>
        }
      >
        <div className="space-y-5 pt-4">
          {/* State filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <Select
              options={STATE_OPTIONS}
              value={filters.state}
              onChange={(v) => update({ state: v })}
              placeholder="All states"
              size="md"
              searchable
              searchPlaceholder="Search states..."
            />
          </div>

          {/* Track filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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

          {/* Sort */}
          {showSort && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
