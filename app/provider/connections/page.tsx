"use client";

import { useState } from "react";
import Link from "next/link";

// ── Types ──

type TimelineFilter = "all" | "immediate" | "within_1_month" | "exploring";
type SortOption = "best_match" | "most_recent" | "most_urgent";

// ── Filter & Sort config ──

const FILTER_TABS: { id: TimelineFilter; label: string }[] = [
  { id: "all", label: "All leads" },
  { id: "immediate", label: "Immediate" },
  { id: "within_1_month", label: "Within 1 month" },
  { id: "exploring", label: "Exploring" },
];

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "best_match", label: "Best match" },
  { id: "most_recent", label: "Most recent" },
  { id: "most_urgent", label: "Most urgent" },
];

// ── Page ──

export default function ProviderLeadsPage() {
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("best_match");

  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ── Page header ── */}
      <div className="mb-8">
        <h1 className="text-[28px] font-display font-bold text-gray-900 tracking-tight">
          Leads
        </h1>
        <p className="text-[15px] text-gray-500 mt-1.5 leading-relaxed">
          Families who found you and connected.
        </p>
      </div>

      {/* ── Filter tabs + Sort ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <div className="flex gap-0.5 bg-vanilla-50 border border-warm-100/60 p-0.5 rounded-xl">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={[
                "px-5 py-2.5 rounded-[10px] text-sm font-semibold whitespace-nowrap transition-all duration-150",
                activeFilter === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative shrink-0 flex items-center">
          <span className="text-sm text-gray-400 mr-2">Sort by:</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort leads"
              className="text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl pl-3.5 pr-8 py-2.5 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 bg-white"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <svg className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Empty state ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="flex flex-col items-center text-center py-24 px-8">
          {/* Decorative icon cluster */}
          <div className="relative mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-warm-50 to-vanilla-100 border border-warm-100/60 flex items-center justify-center shadow-sm">
              <svg className="w-10 h-10 text-warm-300" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            </div>
            {/* Small floating accent dot */}
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary-100 border-2 border-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
            </div>
          </div>

          <h3 className="text-xl font-display font-bold text-gray-900 tracking-tight">
            No leads yet
          </h3>
          <p className="text-[15px] text-gray-500 mt-2.5 leading-relaxed max-w-md">
            When families find your profile and reach out, they&apos;ll appear here.
            Start connecting to get the conversation going.
          </p>

          {/* CTA button */}
          <Link
            href="/provider/matches"
            className="mt-8 inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold shadow-sm hover:bg-gray-800 transition-all duration-200 hover:shadow-md"
          >
            Reach out to families looking for care
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
    </div>
  );
}
