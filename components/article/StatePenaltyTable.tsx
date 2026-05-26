"use client";

import { useState, useMemo } from "react";

type StateRow = {
  state: string;
  period: string;
  divisor: string;
  notes: string;
};

export default function StatePenaltyTable({ data }: { data: StateRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((row) => row.state.toLowerCase().includes(q));
  }, [data, query]);

  return (
    <div className="my-8">
      {/* Search */}
      <div className="relative mb-4">
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
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your state..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1.2fr_1fr_1fr_1.5fr] bg-gray-900 text-white text-xs font-semibold uppercase tracking-wider">
          <div className="px-4 py-3">State</div>
          <div className="hidden sm:block px-4 py-3">Look-Back</div>
          <div className="px-4 py-3">Penalty Divisor</div>
          <div className="hidden sm:block px-4 py-3">Notable Rules</div>
        </div>

        {/* Rows */}
        <div className="max-h-[480px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              No states matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((row, i) => {
              const isHighlighted = row.notes !== "Standard rules";
              return (
                <div
                  key={row.state}
                  className={`grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1.2fr_1fr_1fr_1.5fr] text-sm border-t border-gray-100 transition-colors ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50/60"
                  } hover:bg-primary-50/40`}
                >
                  <div className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                    {row.state}
                    {isHighlighted && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-700">
                        Special
                      </span>
                    )}
                  </div>
                  <div className="hidden sm:block px-4 py-3 text-gray-600">
                    {row.period}
                  </div>
                  <div className="px-4 py-3 font-semibold text-gray-900">
                    {row.divisor}
                  </div>
                  <div className="hidden sm:block px-4 py-3 text-gray-500 text-xs leading-relaxed">
                    {row.notes}
                  </div>

                  {/* Mobile-only: expanded details */}
                  {(isHighlighted || true) && (
                    <div className="sm:hidden col-span-full px-4 pb-3 -mt-1 text-xs text-gray-500 flex flex-col gap-0.5">
                      <span>{row.period}</span>
                      {isHighlighted && <span className="text-amber-700">{row.notes}</span>}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-400 text-center">
        2026 estimates. Verify with your state Medicaid agency before making decisions.
      </p>
    </div>
  );
}
