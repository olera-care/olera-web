"use client";

import { useStateSearch } from "./StateSearchContext";

export function HeroStateSearch() {
  const { query, setQuery } = useStateSearch();

  return (
    <div className="max-w-sm mx-auto mt-2">
      <label htmlFor="hero-state-search" className="block text-sm font-medium text-gray-600 mb-1">
        Find your state
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          id="hero-state-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type your state…"
          className="block w-full rounded-xl bg-white border-2 border-primary-300 py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow-[0_2px_4px_rgba(0,0,0,0.08),0_4px_8px_rgba(14,116,144,0.12)] focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
