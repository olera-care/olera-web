"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";

interface BrowseFiltersProps {
  careTypes: string[];
  currentQuery: string;
  currentType: string;
  currentState: string;
}

export default function BrowseFilters({
  careTypes,
  currentQuery,
  currentType,
  currentState,
}: BrowseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(currentQuery);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update URL with new params
  const updateFilters = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });

    router.push(`/browse?${newParams.toString()}`);
  };

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchInput });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowTypeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedTypeLabel = currentType
    ? careTypes.find((ct) => ct.toLowerCase().replace(/\s+/g, "-") === currentType) || "All Types"
    : "All Types";

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search Input */}
      <form onSubmit={handleSearch} className="flex-1">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, city, or zip code..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </form>

      {/* Care Type Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setShowTypeDropdown(!showTypeDropdown)}
          className={`flex items-center justify-between w-full sm:w-48 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
            currentType
              ? "border-primary-500 bg-primary-50 text-primary-700"
              : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
          }`}
        >
          <span>{selectedTypeLabel}</span>
          <svg
            className={`w-4 h-4 ml-2 transition-transform ${showTypeDropdown ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showTypeDropdown && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <button
              onClick={() => {
                updateFilters({ type: "" });
                setShowTypeDropdown(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                !currentType ? "text-primary-600 font-medium" : "text-gray-700"
              }`}
            >
              All Types
            </button>
            {careTypes.map((type) => {
              const typeSlug = type.toLowerCase().replace(/\s+/g, "-");
              const isActive = currentType === typeSlug;
              return (
                <button
                  key={type}
                  onClick={() => {
                    updateFilters({ type: typeSlug });
                    setShowTypeDropdown(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                    isActive ? "text-primary-600 font-medium" : "text-gray-700"
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* State Filter (simple input for now) */}
      <input
        type="text"
        value={currentState}
        onChange={(e) => updateFilters({ state: e.target.value })}
        placeholder="State (e.g., TX)"
        className="w-full sm:w-24 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
      />
    </div>
  );
}
