"use client";

import { useState } from "react";
import Link from "next/link";
import type { StateData } from "@/data/waiver-library";
import { stateProgramCounts } from "@/data/waiver-library";

interface StateGridProps {
  states: StateData[];
}

export function StateGrid({ states }: StateGridProps) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? states.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.abbreviation.toLowerCase().includes(query.toLowerCase())
      )
    : states;

  return (
    <div>
      {/* Search */}
      <div className="mb-8 max-w-sm">
        <label htmlFor="state-search" className="sr-only">
          Search your state
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              className="h-4 w-4 text-gray-400"
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
          </div>
          <input
            id="state-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your state…"
            className="block w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow-xs focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
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

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-gray-500 text-sm">
          No states match &ldquo;{query}&rdquo;.{" "}
          <button onClick={() => setQuery("")} className="text-primary-600 hover:text-primary-500 font-medium">
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((state) => (
            <Link
              key={state.id}
              href={`/waiver-library/${state.id}`}
              className="group relative bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-primary-300 transition-all duration-200 p-4 flex flex-col items-center text-center"
            >
              <span className="absolute top-2 right-2">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                  {stateProgramCounts[state.id] ?? state.programs.length}
                </span>
              </span>
              <div className="mt-2">
                <div className="text-sm font-bold text-gray-800 group-hover:text-primary-700 transition-colors leading-tight">
                  {state.abbreviation}
                </div>
                <div className="mt-0.5 text-xs text-gray-400 leading-tight">
                  {state.name}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
