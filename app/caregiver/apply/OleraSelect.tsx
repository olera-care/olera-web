"use client";

import { useState, useRef, useEffect } from "react";

interface OleraSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  includeOther?: boolean;
  error?: boolean;
}

export default function OleraSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  includeOther = false,
  error = false,
}: OleraSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allOptions = includeOther ? [...options, "Other"] : options;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full px-4 py-3 rounded-xl border text-left text-sm transition-colors flex items-center justify-between ${
          error
            ? "border-error-300 ring-1 ring-error-300"
            : open
            ? "border-primary-500 ring-2 ring-primary-500"
            : "border-gray-300 hover:border-gray-400"
        } bg-white`}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>{value || placeholder}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-gray-800 rounded-xl shadow-xl border border-gray-700 py-1.5 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
          {placeholder && (
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-400 hover:bg-gray-700 transition-colors"
            >
              {placeholder}
            </button>
          )}
          {allOptions.map((opt) => {
            const selected = value === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2.5 ${
                  selected
                    ? "text-white bg-gray-700"
                    : "text-gray-200 hover:bg-gray-700"
                }`}
              >
                {selected ? (
                  <svg className="w-4 h-4 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <span className="w-4 flex-shrink-0" />
                )}
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
