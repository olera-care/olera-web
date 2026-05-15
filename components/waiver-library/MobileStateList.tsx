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
          No states match &ldquo;{query}&rdquo;.{" "}
          <button
            onClick={() => setQuery("")}
            className="text-primary-600 underline underline-offset-2 font-medium"
          >
            Clear
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
