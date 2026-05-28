"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

interface CityOption {
  city: string;
  state: string;
  count: number;
}

interface LocationFilterDropdownProps {
  cities: CityOption[];
  selectedCities: string[];
  onToggle: (cityKey: string) => void;
  citySearch: string;
  onSearchChange: (value: string) => void;
}

/**
 * Location filter with collapsed dropdown and multi-select.
 * Uses portal rendering to avoid overflow clipping issues in scrollable containers.
 */
export function LocationFilterDropdown({
  cities,
  selectedCities,
  onToggle,
  citySearch,
  onSearchChange,
}: LocationFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter cities based on search
  const filteredCities = cities.filter((c) =>
    citySearch
      ? c.city.toLowerCase().includes(citySearch.toLowerCase()) ||
        c.state.toLowerCase().includes(citySearch.toLowerCase())
      : true
  );

  // Update dropdown position when opened
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (!isOpen) return;
    // Small delay to ensure portal is rendered
    const timeoutId = setTimeout(() => searchInputRef.current?.focus(), 10);
    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close dropdown when parent scrolls (prevents position desync with portal)
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const handleScroll = (e: Event) => {
      // Don't close if scrolling inside the dropdown itself
      if (dropdownRef.current?.contains(e.target as Node)) {
        return;
      }
      setIsOpen(false);
    };

    // Listen on window with capture phase to catch all scroll events
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  }, []);

  // Handle trigger keyboard
  const handleTriggerKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    } else if (e.key === "Escape" && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen]);

  // Get display text for trigger button
  const triggerText = selectedCities.length === 0
    ? "All locations"
    : selectedCities.length === 1
      ? (() => {
          const [city, state] = selectedCities[0].split("|");
          return state ? `${city}, ${state}` : city;
        })()
      : `${selectedCities.length} locations`;

  return (
    <div className="relative">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[15px] font-semibold text-gray-900">Location</span>
      </div>

      {/* Dropdown trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`
          flex items-center justify-between w-full px-3.5 py-2.5
          bg-white border rounded-xl text-[15px] transition-all
          ${selectedCities.length > 0
            ? "border-primary-400 text-gray-900"
            : "border-gray-200 text-gray-600 hover:border-gray-300"
          }
          ${isOpen ? "ring-2 ring-primary-100 border-primary-400" : ""}
        `}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          <span>{triggerText}</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Selected cities as pills */}
      {selectedCities.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2" role="list" aria-label="Selected cities">
          {selectedCities.map((cityKey) => {
            const [city, state] = cityKey.split("|");
            return (
              <span
                key={cityKey}
                role="listitem"
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 text-sm rounded-lg"
              >
                {city}{state ? `, ${state}` : ""}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(cityKey);
                  }}
                  aria-label={`Remove ${city}${state ? `, ${state}` : ""}`}
                  className="p-0.5 hover:bg-primary-100 rounded transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Dropdown panel - rendered via portal to avoid overflow clipping */}
      {isOpen && typeof document !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          role="listbox"
          aria-label="Select cities"
          onKeyDown={handleKeyDown}
          className="fixed bg-white rounded-xl shadow-lg border border-gray-200 z-[100] overflow-hidden"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
          }}
        >
          {/* Search input */}
          <div className="p-3 border-b border-gray-100">
            <input
              ref={searchInputRef}
              type="text"
              value={citySearch}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search cities..."
              aria-label="Search cities"
              className="w-full px-3 py-2 text-[15px] bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-primary-400 focus:bg-white placeholder:text-gray-400 transition-colors"
            />
          </div>

          {/* City list */}
          <div className="max-h-52 overflow-y-auto">
            {filteredCities.length === 0 && citySearch.trim() ? (
              // Show the search term with 0 count when no matches found
              <div className="w-full px-3 py-2.5 text-left text-[15px] flex items-center justify-between text-gray-400">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded border-2 border-gray-200" aria-hidden="true" />
                  <span>{citySearch.trim()}</span>
                </div>
                <span className="text-sm">(0)</span>
              </div>
            ) : filteredCities.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">
                No locations available
              </div>
            ) : (
              filteredCities.map((c) => {
                const cityKey = `${c.city}|${c.state}`;
                const isSelected = selectedCities.includes(cityKey);
                return (
                  <button
                    key={cityKey}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => onToggle(cityKey)}
                    className={`
                      w-full px-3 py-2.5 text-left text-[15px] transition-colors
                      flex items-center justify-between
                      ${isSelected
                        ? "bg-primary-50 text-primary-700"
                        : "text-gray-700 hover:bg-gray-50"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                          w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
                          ${isSelected
                            ? "bg-primary-600 border-primary-600"
                            : "border-gray-300"
                          }
                        `}
                        aria-hidden="true"
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span>{c.city}{c.state ? `, ${c.state}` : ""}</span>
                    </div>
                    <span className="text-sm text-gray-400">({c.count})</span>
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
