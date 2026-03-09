"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { allStates } from "@/data/waiver-library";

export function StatePickerCard() {
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  const showResults = focused && search.length > 0;
  const filtered = allStates.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative h-full">
      <div className="w-full h-full flex flex-col p-6 rounded-2xl bg-white border border-gray-200/60 shadow-[0_4px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.12),0_8px_16px_rgba(0,0,0,0.06)] hover:-translate-y-2 transition-all duration-300">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 text-primary-600 mb-4">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Get All Your State&apos;s Care Forms</h3>
        <p className="text-sm text-gray-600 mb-4">
          Browse your state and download every waiver application in one place.
        </p>

        {/* Inline search input */}
        <div className="relative mt-auto">
          <input
            type="text"
            placeholder="Type your state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />

          {/* Search results dropdown */}
          {showResults && (
            <div className="absolute z-50 bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
              <ul className="max-h-48 overflow-y-auto">
                {filtered.map((state) => (
                  <li key={state.id}>
                    <button
                      onClick={() => {
                        router.push(`/waiver-library/forms/${state.id}`);
                        setSearch("");
                        setFocused(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 transition-colors flex items-center justify-between"
                    >
                      <span>{state.name}</span>
                      <span className="text-xs text-gray-400">{state.abbreviation}</span>
                    </button>
                  </li>
                ))}
                {filtered.length === 0 && (
                  <li className="px-4 py-3 text-sm text-gray-400 text-center">No states found</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
