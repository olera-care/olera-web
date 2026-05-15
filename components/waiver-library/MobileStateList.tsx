"use client";

import Link from "next/link";
import { useStateSearch } from "./StateSearchContext";
import type { StateData } from "@/data/waiver-library";

export function MobileStateList({ states }: { states: StateData[] }) {
  const { query, setQuery } = useStateSearch();
  const q = query.trim().toLowerCase();
  const matches = q
    ? states.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.abbreviation.toLowerCase().includes(q)
      )
    : states;

  return (
    <div className="mx-auto max-w-2xl px-4 mt-4">
      {matches.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          <p>No states match &ldquo;{query}&rdquo;.</p>
          <button
            onClick={() => setQuery("")}
            className="mt-3 inline-flex items-center justify-center min-h-[44px] px-5 py-2 rounded-lg text-primary-700 font-semibold bg-primary-50 active:bg-primary-100 transition-colors"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {matches.map((s) => (
            <Link
              key={s.id}
              href={`/benefits/${s.id}`}
              className="group flex items-center justify-between gap-2 min-h-[52px] px-4 py-3 rounded-xl bg-white border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] active:scale-[0.98] active:bg-gray-50 transition-transform duration-100"
            >
              <span className="text-base font-medium text-gray-900 truncate">
                {s.name}
              </span>
              <svg
                aria-hidden="true"
                className="w-4 h-4 text-gray-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
