"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useClickOutside } from "@/hooks/use-click-outside";
import ActionSheet from "@/components/ui/ActionSheet";

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
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  // Close dropdown when clicking outside (desktop only)
  useClickOutside(dropdownRef, () => {
    if (!isMobile) setShowTypeDropdown(false);
  });

  const selectedTypeLabel = currentType
    ? careTypes.find((ct) => ct.toLowerCase().replace(/\s+/g, "-") === currentType) || "All Types"
    : "All Types";

  // Build action sheet options for mobile
  const typeOptions = [
    {
      label: "All Types",
      selected: !currentType,
      onClick: () => updateFilters({ type: "" }),
    },
    ...careTypes.map((type) => {
      const typeSlug = type.toLowerCase().replace(/\s+/g, "-");
      return {
        label: type,
        selected: currentType === typeSlug,
        onClick: () => updateFilters({ type: typeSlug }),
      };
    }),
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search Input */}
      <form onSubmit={handleSearch} className="flex-1">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
            className="w-full pl-11 pr-4 py-3 min-h-[48px] border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </form>

      {/* Care Type Filter */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setShowTypeDropdown(true)}
          className={`flex items-center justify-between w-full sm:w-48 px-4 py-3 min-h-[48px] border rounded-xl text-text-sm font-medium transition-colors ${
            currentType
              ? "border-primary-500 bg-primary-50 text-primary-700"
              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
          }`}
        >
          <span>{selectedTypeLabel}</span>
          <svg
            className={`w-4 h-4 ml-2 transition-transform ${showTypeDropdown && !isMobile ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Desktop: Traditional dropdown */}
        {showTypeDropdown && !isMobile && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
            <button
              onClick={() => {
                updateFilters({ type: "" });
                setShowTypeDropdown(false);
              }}
              className={`w-full px-4 py-3 min-h-[44px] text-left text-text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                !currentType ? "text-primary-600 font-medium" : "text-gray-700"
              }`}
            >
              All Types
              {!currentType && (
                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
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
                  className={`w-full px-4 py-3 min-h-[44px] text-left text-text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                    isActive ? "text-primary-600 font-medium" : "text-gray-700"
                  }`}
                >
                  {type}
                  {isActive && (
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Mobile: Action Sheet */}
        <ActionSheet
          isOpen={showTypeDropdown && isMobile}
          onClose={() => setShowTypeDropdown(false)}
          title="Filter by Care Type"
          options={typeOptions}
        />
      </div>

      {/* State Filter */}
      <input
        type="text"
        value={currentState}
        onChange={(e) => updateFilters({ state: e.target.value.toUpperCase().slice(0, 2) })}
        placeholder="State"
        maxLength={2}
        className="w-full sm:w-20 px-4 py-3 min-h-[48px] border border-gray-200 rounded-xl text-base text-center uppercase focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
    </div>
  );
}
