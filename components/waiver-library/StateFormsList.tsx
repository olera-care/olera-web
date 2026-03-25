"use client";

import { useState } from "react";
import Link from "next/link";
import type { WaiverProgram } from "@/data/waiver-library";
import { buildProgramUrl } from "@/lib/texas-slug-map";

interface StateFormsListProps {
  programs: WaiverProgram[];
  stateId: string;
}

export function StateFormsList({ programs, stateId }: StateFormsListProps) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? programs.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.shortName.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.forms.some((f) => f.name.toLowerCase().includes(q))
        );
      })
    : programs;

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-5 max-w-sm ml-auto">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
          placeholder="Search programs or forms..."
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        />
      </div>

      {/* Results */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-500">No programs match &ldquo;{query}&rdquo;</p>
          </div>
        )}
        {filtered.map((program) => (
          <div key={program.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h2 className="text-lg font-bold text-gray-900">{program.name}</h2>
              <Link
                href={buildProgramUrl(stateId, program.id)}
                className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors shrink-0"
              >
                View program details
              </Link>
            </div>

            <p className="text-sm text-gray-600 mb-3">{program.tagline}</p>

            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {program.forms.length} form{program.forms.length !== 1 ? "s" : ""} available
              </span>
              <span className="text-xs text-gray-400">
                Last updated Mar 2026
              </span>
            </div>

            {program.forms.map((form) => (
              <div
                key={form.id}
                className="flex items-center gap-4 bg-vanilla-50 rounded-xl p-4 mb-3 last:mb-0"
              >
                <div className="w-10 h-10 bg-error-50 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{form.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{form.description}</p>
                </div>
                <a
                  href={form.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-500 transition-colors shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
              </div>
            ))}

            {/* Check eligibility CTA */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link
                href="/benefits/finder"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary-600/30 hover:shadow-xl hover:shadow-primary-600/40 hover:bg-primary-500 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Check if I qualify
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
