"use client";

import { useEffect, useRef, useState } from "react";

export type DatePreset = "all" | "today" | "yesterday" | "7d" | "30d" | "90d" | "1y";

export interface DateRangeValue {
  preset: DatePreset | "custom";
  customFrom: string;
  customTo: string;
}

export interface ResolvedRange {
  from: string | null;
  to: string | null;
}

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: "All time", value: "all" },
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "Last 12 months", value: "1y" },
];

export function resolveRange(value: DateRangeValue): ResolvedRange {
  if (value.preset === "custom" && value.customFrom) {
    const start = new Date(value.customFrom + "T00:00:00");
    const endBase = value.customTo || value.customFrom;
    const end = new Date(endBase + "T00:00:00");
    end.setDate(end.getDate() + 1);
    return { from: start.toISOString(), to: end.toISOString() };
  }

  if (value.preset === "all") return { from: null, to: null };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (value.preset === "today") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { from: today.toISOString(), to: tomorrow.toISOString() };
  }
  if (value.preset === "yesterday") {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return { from: yesterday.toISOString(), to: today.toISOString() };
  }
  const days = value.preset === "7d" ? 7 : value.preset === "30d" ? 30 : value.preset === "90d" ? 90 : 365;
  const start = new Date(today);
  start.setDate(start.getDate() - days);
  return { from: start.toISOString(), to: null };
}

export function rangeLabel(value: DateRangeValue): string {
  if (value.preset === "custom") {
    if (!value.customFrom) return "Custom range";
    const fmt = (s: string) => {
      const d = new Date(s + "T00:00:00");
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };
    if (!value.customTo || value.customTo === value.customFrom) return fmt(value.customFrom);
    return `${fmt(value.customFrom)} – ${fmt(value.customTo)}`;
  }
  return PRESETS.find((p) => p.value === value.preset)?.label ?? "All time";
}

export default function DateRangePopover({
  value,
  onChange,
}: {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(value.customFrom);
  const [draftTo, setDraftTo] = useState(value.customTo);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setDraftFrom(value.customFrom);
      setDraftTo(value.customTo);
    }
  }, [open, value.customFrom, value.customTo]);

  const pickPreset = (preset: DatePreset) => {
    onChange({ preset, customFrom: "", customTo: "" });
    setOpen(false);
  };

  const applyCustom = () => {
    if (!draftFrom) return;
    onChange({ preset: "custom", customFrom: draftFrom, customTo: draftTo });
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 h-9 px-3.5 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-full hover:border-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/10 focus-visible:ring-offset-2"
      >
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
        </svg>
        {rangeLabel(value)}
        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] overflow-hidden z-50"
          role="dialog"
          aria-label="Date range"
        >
          <div className="py-1.5">
            {PRESETS.map((p) => {
              const isActive = value.preset === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => pickPreset(p.value)}
                  className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left transition-colors ${
                    isActive ? "text-gray-900 font-medium" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>{p.label}</span>
                  {isActive && (
                    <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-gray-100 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 mb-2.5">Custom range</p>
            <div className="space-y-2">
              <label className="block">
                <span className="block text-[11px] text-gray-500 mb-1">From</span>
                <input
                  type="date"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 transition-colors"
                />
              </label>
              <label className="block">
                <span className="block text-[11px] text-gray-500 mb-1">To</span>
                <input
                  type="date"
                  value={draftTo}
                  min={draftFrom || undefined}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-900 transition-colors"
                />
              </label>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={applyCustom}
                disabled={!draftFrom}
                className="px-3.5 h-8 text-xs font-medium text-white bg-gray-900 rounded-full hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
